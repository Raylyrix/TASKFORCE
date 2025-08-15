(() => {
  const owner = window.__SITE_CONFIG__?.owner || 'Raylyrix';
  const repo = window.__SITE_CONFIG__?.repo || 'RTXAPPS';
  const apiBase = `https://api.github.com/repos/${owner}/${repo}`;

  const route = () => (location.hash || '#home').replace(/^#+/, '#');
  const views = Array.from(document.querySelectorAll('[data-view]'));
  const navLinks = Array.from(document.querySelectorAll('[data-route]'));

  function show(viewId) {
    views.forEach(v => v.hidden = (`#${v.id}` !== viewId));
    navLinks.forEach(a => a.classList.toggle('active', a.getAttribute('href') === viewId));
  }

  function formatDate(iso) {
    try { return new Date(iso).toLocaleString(); } catch { return iso; }
  }

  function renderAssets(assets) {
    const box = document.getElementById('assetButtons') || document.getElementById('downloads');
    if (!box) return;
    box.innerHTML = '';
    (assets || []).forEach(a => {
      const isWin = /\.exe$/i.test(a.name);
      const isDmg = /\.dmg$/i.test(a.name);
      const isZip = /\.zip$/i.test(a.name);
      const isAppImage = /\.AppImage$/i.test(a.name);
      const label = isWin ? 'Windows' : isDmg ? 'macOS' : isAppImage ? 'Linux' : isZip ? 'Zip' : 'Download';
      const btn = document.createElement('a');
      btn.href = a.browser_download_url;
      btn.className = 'btn btn-secondary';
      btn.textContent = `${label} • ${a.name}`;
      btn.setAttribute('rel', 'noopener');
      btn.setAttribute('target', '_blank');
      box.appendChild(btn);
    });
  }

  async function fetchLatest() {
    const verPill = document.getElementById('versionPill');
    const summary = document.getElementById('releaseSummary');
    try {
      const res = await fetch(`${apiBase}/releases/latest`, { headers: { 'Accept': 'application/vnd.github+json' } });
      if (!res.ok) throw new Error('Failed to fetch latest release');
      const data = await res.json();
      if (verPill) verPill.textContent = data.tag_name || data.name || 'latest';
      if (summary) summary.textContent = (data.name || data.tag_name || 'Latest release') + ' • ' + formatDate(data.published_at);
      renderAssets(data.assets);
    } catch (e) {
      if (verPill) verPill.textContent = 'Unavailable';
      if (summary) summary.textContent = 'Could not load latest release.';
    }
  }

  async function fetchReleases() {
    const box = document.getElementById('releaseList');
    if (!box) return;
    try {
      const res = await fetch(`${apiBase}/releases?per_page=10`, { headers: { 'Accept': 'application/vnd.github+json' } });
      if (!res.ok) throw new Error('Failed to fetch releases');
      const list = await res.json();
      if (!Array.isArray(list) || !list.length) { box.innerHTML = '<p>No releases yet.</p>'; return; }
      box.innerHTML = '';
      list.forEach(r => {
        const item = document.createElement('div');
        item.className = 'release-item';
        const title = r.name || r.tag_name;
        const when = formatDate(r.published_at || r.created_at);
        const notes = (r.body || '').split(/\r?\n/).filter(Boolean).slice(0, 10);
        const ul = notes.length ? `<ul>${notes.map(n => `<li>${escapeHtml(n)}</li>`).join('')}</ul>` : '';
        item.innerHTML = `
          <h4>${escapeHtml(title)}</h4>
          <div class="muted">${when}</div>
          ${ul}
          <div style="margin-top:8px;"><a class="btn btn-secondary" href="${r.html_url}" target="_blank" rel="noopener">View on GitHub</a></div>
        `;
        box.appendChild(item);
      });
    } catch (e) {
      box.innerHTML = '<p>Failed to load releases.</p>';
    }
  }

  function escapeHtml(str) {
    const div = document.createElement('div');
    div.textContent = String(str || '');
    return div.innerHTML;
  }

  function onHashChange() {
    const current = route();
    show(current);
    if (current === '#download') {
      fetchLatest();
    } else if (current === '#releases') {
      fetchReleases();
    } else if (current === '#app') {
      ensureGoogleLoaded().then(initWebApp).catch(() => {});
    }
  }

  function startLiveRefresh() {
    fetchLatest();
    setInterval(fetchLatest, 60000);
  }

  document.getElementById('year').textContent = new Date().getFullYear();
  window.addEventListener('hashchange', onHashChange);
  onHashChange();
  startLiveRefresh();
  // --- Task Force Web (client-side Gmail/Sheets) ---
  let gapiLoaded = false;
  let gToken = null;
  let sheets = null;
  let gmail = null;
  let webData = { headers: [], rows: [] };
  let quill = null;

  async function ensureGoogleLoaded() {
    if (gapiLoaded) return;
    await new Promise(resolve => {
      if (window.gapi) return resolve();
      const i = setInterval(() => { if (window.gapi) { clearInterval(i); resolve(); } }, 200);
    });
    await new Promise(resolve => { gapi.load('client', resolve); });
    await gapi.client.init({});
    gapiLoaded = true;
  }

  async function initWebApp() {
    const status = document.getElementById('authStatusWeb');
    const signInBtn = document.getElementById('btnSignIn');
    const signOutBtn = document.getElementById('btnSignOut');
    const sheetBtn = document.getElementById('btnWebLoadSheet');
    const prevBtn = document.getElementById('btnPreviewFirst');
    const testBtn = document.getElementById('btnSendTest');
    const sendBtn = document.getElementById('btnStartSend');
    const chips = document.getElementById('webChips');
    const editorDiv = document.getElementById('webEditor');
    // Init Quill editor
    try {
      if (window.Quill && editorDiv) {
        quill = new window.Quill('#webEditor', { modules: { toolbar: '#webToolbar' }, theme: 'snow', placeholder: 'Use ((ColumnName)) placeholders' });
      }
    } catch (_) {}

    function setAuthedUI(on) {
      if (status) status.textContent = on ? 'Signed in' : 'Not signed in';
      if (signInBtn) signInBtn.disabled = !!on;
      if (signOutBtn) signOutBtn.disabled = !on;
      if (sheetBtn) sheetBtn.disabled = !on;
      if (prevBtn) prevBtn.disabled = !on || webData.rows.length === 0;
      if (testBtn) testBtn.disabled = !on || webData.rows.length === 0;
      if (sendBtn) sendBtn.disabled = !on || webData.rows.length === 0;
    }

    async function signIn() {
      const clientId = window.TaskForceWebConfig?.googleClientId;
      const scope = 'https://www.googleapis.com/auth/gmail.send https://www.googleapis.com/auth/spreadsheets.readonly';
      const tokenClient = google.accounts.oauth2.initTokenClient({ client_id: clientId, scope, callback: (t) => { gToken = t; } });
      tokenClient.requestAccessToken();
      await waitForToken();
      await loadApis();
      setAuthedUI(true);
    }

    async function signOut() {
      try { if (gToken?.access_token) google.accounts.oauth2.revoke(gToken.access_token); } catch (_) {}
      gToken = null; sheets = null; gmail = null; webData = { headers: [], rows: [] };
      if (chips) chips.innerHTML = '';
      setAuthedUI(false);
    }

    function waitForToken() {
      return new Promise((resolve) => { const i = setInterval(() => { if (gToken) { clearInterval(i); resolve(); } }, 200); });
    }

    async function loadApis() {
      gapi.client.setToken(gToken);
      await gapi.client.load('https://sheets.googleapis.com/$discovery/rest?version=v4');
      await gapi.client.load('https://gmail.googleapis.com/$discovery/rest?version=v1');
      sheets = gapi.client.sheets; gmail = gapi.client.gmail;
    }

    function sheetIdFrom(input) {
      const s = String(input || '');
      const m = s.match(/\/spreadsheets\/d\/([a-zA-Z0-9-_]+)/); if (m) return m[1];
      if (/^[a-zA-Z0-9-_]+$/.test(s)) return s;
      return null;
    }

    async function loadSheet() {
      const el = document.getElementById('webSheetInput');
      const meta = document.getElementById('webSheetMeta');
      const id = sheetIdFrom(el.value.trim());
      if (!id) { meta.textContent = 'Invalid sheet URL/ID'; return; }
      const res = await sheets.spreadsheets.values.get({ spreadsheetId: id, range: 'A:Z' });
      const values = res.result.values || [];
      if (!values.length) { meta.textContent = 'No data found'; return; }
      webData.headers = values[0];
      webData.rows = values.slice(1);
      meta.textContent = `${webData.rows.length} rows • ${webData.headers.length} columns`;
      renderChips();
      setAuthedUI(true);
    }

    function renderChips() {
      const c = document.getElementById('webChips'); if (!c) return;
      c.innerHTML = '';
      webData.headers.forEach(h => {
        const span = document.createElement('span');
        span.className = 'btn btn-secondary';
        span.textContent = String(h);
        span.style.padding = '6px 10px';
        span.addEventListener('click', () => {
          const ta = document.getElementById('webBody');
          if (ta) {
            const ins = `((`+String(h)+`))`;
            ta.value = ta.value + (ta.value ? '\n' : '') + ins;
          }
        });
        c.appendChild(span);
      });
    }

    function produceBody(row) {
      const map = {}; webData.headers.forEach((h,i)=> map[String(h).trim()] = row[i] || '');
      let body = quill ? (document.querySelector('#webEditor .ql-editor')?.innerHTML || '') : (document.getElementById('webBody')?.value || '');
      body = body.replace(/\(\(([^)]+)\)\)/g, (_m, p1) => map[String(p1).trim()] ?? '');
      return body;
    }

    async function previewFirst() {
      if (!webData.rows.length) return;
      const subj = document.getElementById('webSubject').value || '';
      const body = produceBody(webData.rows[0]);
      alert(`Subject: ${subj}\n\n${body}`);
    }

    function makeRawEmail({ from, to, subject, text }) {
      const headers = [];
      if (from) headers.push(`From: ${from}`);
      headers.push(`To: ${to}`);
      headers.push(`Subject: ${subject}`);
      headers.push('Content-Type: text/plain; charset="UTF-8"');
      headers.push('MIME-Version: 1.0');
      const msg = headers.join('\r\n') + '\r\n\r\n' + text;
      return btoa(unescape(encodeURIComponent(msg))).replace(/\+/g, '-').replace(/\//g, '_').replace(/=+$/, '');
    }

    async function sendOne(to) {
      const subject = document.getElementById('webSubject').value || '';
      const from = document.getElementById('webFrom').value || undefined;
      const text = produceBody(webData.rows.find(r => (r.join('')||'').includes(to)) || webData.rows[0]);
      const raw = makeRawEmail({ from, to, subject, text });
      await gmail.users.messages.send({ userId: 'me', resource: { raw } });
    }

    async function sendTest() {
      const to = prompt('Enter test email:'); if (!to) return;
      await sendOne(to);
      alert('Test sent');
    }

    async function startSend() {
      const progress = document.getElementById('webProgress');
      const emailCol = webData.headers.findIndex(h => String(h).toLowerCase().includes('email'));
      if (emailCol === -1) { alert('No Email column'); return; }
      let sent = 0, failed = 0;
      for (const row of webData.rows) {
        const to = row[emailCol]; if (!to) continue;
        try { const text = produceBody(row); const subject = document.getElementById('webSubject').value || '';
          const from = document.getElementById('webFrom').value || undefined;
          const raw = makeRawEmail({ from, to, subject, text });
          await gmail.users.messages.send({ userId: 'me', resource: { raw } }); sent++; }
        catch (_) { failed++; }
        if (progress) progress.textContent = `Sent ${sent} • Failed ${failed}`;
        await new Promise(r => setTimeout(r, 600));
      }
      alert(`Done. Sent ${sent}, Failed ${failed}`);
    }

    signInBtn?.addEventListener('click', signIn);
    signOutBtn?.addEventListener('click', signOut);
    sheetBtn?.addEventListener('click', loadSheet);
    prevBtn?.addEventListener('click', previewFirst);
    testBtn?.addEventListener('click', sendTest);
    sendBtn?.addEventListener('click', startSend);

    // Attachments UI (browser-only guidance)
    const attInput = document.getElementById('webAttachments');
    const attList = document.getElementById('webAttList');
    const attClear = document.getElementById('webClearAtt');
    attInput?.addEventListener('change', () => {
      const files = Array.from(attInput.files || []);
      attList.textContent = files.length ? files.map(f=>f.name).join(', ') : 'No files selected';
      const flagged = files.filter(f=>/\.(exe|bat|cmd|js|vbs)$/i.test(f.name));
      if (flagged.length) alert('Some selected files are potentially unsafe and may be blocked by email providers. Prefer PDFs, images, or documents.');
    });
    attClear?.addEventListener('click', ()=> { if (attInput) attInput.value = ''; if (attList) attList.textContent = 'No files selected'; });

    // Templates (localStorage)
    const tplSel = document.getElementById('webTemplateSelect');
    const tplSave = document.getElementById('webSaveTemplate');
    const tplLoad = document.getElementById('webLoadTemplate');
    const tplDelete = document.getElementById('webDeleteTemplate');
    function refreshTplList() {
      const list = JSON.parse(localStorage.getItem('tf_templates')||'[]');
      tplSel.innerHTML = '';
      list.forEach((t,i)=>{ const opt=document.createElement('option'); opt.value=i; opt.textContent=t.name; tplSel.appendChild(opt); });
    }
    function currentHtml() { return quill ? (document.querySelector('#webEditor .ql-editor')?.innerHTML || '') : (document.getElementById('webBody')?.value || ''); }
    tplSave?.addEventListener('click', ()=>{
      const name = prompt('Template name:'); if (!name) return;
      const list = JSON.parse(localStorage.getItem('tf_templates')||'[]');
      list.unshift({ name, html: currentHtml(), subject: document.getElementById('webSubject')?.value||'' });
      localStorage.setItem('tf_templates', JSON.stringify(list));
      refreshTplList();
      alert('Saved');
    });
    tplLoad?.addEventListener('click', ()=>{
      const list = JSON.parse(localStorage.getItem('tf_templates')||'[]');
      const idx = parseInt(tplSel.value); if (isNaN(idx)) { alert('Pick a template'); return; }
      const t = list[idx];
      document.getElementById('webSubject').value = t.subject || '';
      if (quill) quill.root.innerHTML = t.html || '';
      else { const ta=document.getElementById('webBody'); if (ta) ta.value = t.html || ''; }
    });
    tplDelete?.addEventListener('click', ()=>{
      const list = JSON.parse(localStorage.getItem('tf_templates')||'[]');
      const idx = parseInt(tplSel.value); if (isNaN(idx)) return;
      list.splice(idx,1); localStorage.setItem('tf_templates', JSON.stringify(list)); refreshTplList();
    });
    refreshTplList();

    // Presets
    const presetSel = document.getElementById('webPresetSelect');
    const insertPreset = document.getElementById('webInsertPreset');
    const presets = [
      { name:'Newsletter (simple)', url:'https://raw.githubusercontent.com/htmlemail/htmlemail/master/dist/simple.html' },
      { name:'Announcement (basic)', url:'https://raw.githubusercontent.com/leemunroe/responsive-html-email-template/master/dist/index.html' },
      { name:'Event (promo)', url:'https://raw.githubusercontent.com/mailgun/transactional-email-templates/master/templates/promo.html' }
    ];
    presetSel.innerHTML = presets.map(p=>`<option value="${p.url}">${p.name}</option>`).join('');
    insertPreset?.addEventListener('click', async ()=>{
      const url = presetSel.value; if (!url) return;
      const res = await fetch(url); const html = await res.text();
      if (quill) quill.root.innerHTML = html; else { const ta=document.getElementById('webBody'); if (ta) ta.value = html; }
    });
  }
})();


