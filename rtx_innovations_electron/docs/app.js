(() => {
  const owner = window.__SITE_CONFIG__?.owner || 'Raylyrix';
  const repo = window.__SITE_CONFIG__?.repo || 'rtxapps';
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
    const box = document.getElementById('assetButtons');
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
})();


