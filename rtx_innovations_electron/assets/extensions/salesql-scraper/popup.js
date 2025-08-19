document.addEventListener('DOMContentLoaded', () => {
  const statusEl = document.getElementById('status');
  const totalEl = document.getElementById('total');
  const scrapeBtn = document.getElementById('scrapeBtn');
  const downloadBtn = document.getElementById('downloadBtn');
  const saveSessionBtn = document.getElementById('saveSessionBtn');
  const delayInput = document.getElementById('delaySeconds');
  const fileNameInput = document.getElementById('fileName');
  const tableContainer = document.getElementById('tableContainer');
  // Custom selectors UI
  const useCustomChk = document.getElementById('useCustom');
  const rowSelectorInp = document.getElementById('rowSelector');
  const companySelectorsInp = document.getElementById('companySelectors');
  const profileSelectorsInp = document.getElementById('profileSelectors');
  const emailSelectorsInp = document.getElementById('emailSelectors');
  const pickRowBtn = document.getElementById('pickRowBtn');
  const pickCompanyBtn = document.getElementById('pickCompanyBtn');
  const pickProfileBtn = document.getElementById('pickProfileBtn');
  const pickEmailBtn = document.getElementById('pickEmailBtn');
  const saveSelectorsBtn = document.getElementById('saveSelectorsBtn');

  let headers = ['company','profile']; // will expand with email_N after scraping
  let dataRows = [];
  let seenEmails = new Set(); // global email dedupe if needed

  function toCSV(headers, rows){
    const csv = [headers.join(',')];
    for (const row of rows){
      const vals = headers.map(h => {
        const v = row[h] ?? '';
        return '"' + String(v).replace(/"/g,'""') + '"';
      });
      csv.push(vals.join(','));
    }
    return csv.join('\n');
  }

  function renderTable(){
    let html = '<table><thead><tr>' + headers.map(h=>`<th>${h}</th>`).join('') + '</tr></thead><tbody>';
    for (const r of dataRows){
      html += '<tr>' + headers.map(h => {
        const v = r[h] || '';
        if (h === 'profile' && v.startsWith('http')) return `<td><a target="_blank" href="${v}">${v}</a></td>`;
        return `<td>${v}</td>`;
      }).join('') + '</tr>';
    }
    html += '</tbody></table>';
    tableContainer.innerHTML = html;
  }

  async function exec(tabId, fn, args){
    return new Promise((resolve, reject) => {
      chrome.scripting.executeScript({ target: { tabId, allFrames: true }, world: 'MAIN', func: fn, args }, (res) => {
        if (chrome.runtime.lastError) return reject(chrome.runtime.lastError);
        const results = (res || []).map(r => r && r.result).filter(Boolean);
        if (results.length === 0) return resolve(null);
        // Merge results returned from multiple frames
        const merged = { items: [], rows: [], isLast: true, diag: { docs: 0, linkEls: 0, mailtoEls: 0, textEmailEls: 0, items: 0 } };
        for (const r of results){
          if (Array.isArray(r.items)) merged.items.push(...r.items);
          if (Array.isArray(r.rows)) merged.rows.push(...r.rows);
          if (r.isLast === false) merged.isLast = false;
          if (r.diag){
            merged.diag.docs += r.diag.docs || 0;
            merged.diag.linkEls += r.diag.linkEls || 0;
            merged.diag.mailtoEls += r.diag.mailtoEls || 0;
            merged.diag.textEmailEls += r.diag.textEmailEls || 0;
            merged.diag.items += r.diag.items || 0;
          }
        }
        resolve(merged);
      });
    });
  }

  function isSalesQL(url){
    return /https:\/\/app\.salesql\.com\//.test(url || '');
  }

  // Content-script functions
  async function scrapeCurrentPage(cfg){
    // Try to find a list of contact rows/cards across same-origin iframes and extract visible fields
    const root = document;

    // Collect all same-origin documents (main + iframes)
    function collectDocs(win){
      const docs = [];
      try { docs.push(win.document); } catch {}
      try {
        for (let i=0; i<win.frames.length; i++){
          const fwin = win.frames[i];
          try {
            // only same-origin frames are accessible
            if (fwin.location && fwin.document) {
              docs.push(...collectDocs(fwin));
            }
          } catch {}
        }
      } catch {}
      return docs;
    }
    const allDocs = collectDocs(window);

    // Deep traversal across shadow roots
    function* walkDeep(start){
      const stack = [start];
      while (stack.length){
        const node = stack.pop();
        if (!node) continue;
        yield node;
        const sr = node.shadowRoot;
        if (sr) stack.push(sr);
        if (node.children) for (let i=node.children.length-1;i>=0;i--) stack.push(node.children[i]);
      }
    }
    function qsaDeep(sel){
      const out=[];
      for (const d of allDocs){
        for (const n of walkDeep(d)){
          if (n.querySelectorAll){ n.querySelectorAll(sel).forEach(el=>out.push(el)); }
        }
      }
      return out;
    }

    // Heuristic: find elements that contain LinkedIn links OR visible emails, then choose a nearby container as the item row/card
    const linkEls = qsaDeep('a[href*="linkedin.com/"]');
    const emailEls = qsaDeep("a[href^='mailto:']");
    const textEmailCandidates = qsaDeep('div, li, article, tr');

    function hasEmailText(el){ return /[A-Za-z0-9._%+-]+@[A-Za-z0-9.-]+\.[A-Za-z]{2,}/.test((el.innerText||'').slice(0,2000)); }
    const textEmailEls = textEmailCandidates.filter(hasEmailText);

    const candidateNodes = Array.from(new Set([...linkEls, ...emailEls, ...textEmailEls]));
    const itemsMap = new Map();

    function nearestItemContainer(el){
      let cur = el;
      let hops = 0;
      while (cur && hops < 6){
        if (cur.matches && (cur.matches('div.contact-card, div.contact-item, div.profile-card, li, article, tr, [role="row"]'))){
          return cur;
        }
        cur = cur.parentElement; hops++;
      }
      return el.closest('div, li, article, tr') || el;
    }

    candidateNodes.forEach(n=>{
      const container = nearestItemContainer(n);
      if (container && !itemsMap.has(container)) itemsMap.set(container, container);
    });

    let items = Array.from(itemsMap.keys());
    // If custom row selector provided, override items
    if (cfg && cfg.useCustom && cfg.rowSelector){
      const fromDocs = [];
      for (const d of allDocs){
        try { d.querySelectorAll(cfg.rowSelector).forEach(el=>fromDocs.push(el)); } catch{}
      }
      if (fromDocs.length){
        // If only one container matched, try to auto-expand to repeated child rows inside it
        if (fromDocs.length === 1){
          const host = fromDocs[0];
          const candidates = host.querySelectorAll('[role="row"], li, article, tr, .card, .result, .profile-card, .reusable-search__result-container');
          const arr = Array.from(candidates);
          if (arr.length > 1){ items = arr; } else { items = fromDocs; }
        } else {
          items = fromDocs;
        }
      }
    }
    // Fallback: if nothing found, try role-based rows across docs
    if (items.length === 0){
      for (const d of allDocs){
        // SalesQL-specific table rows
        const srows = d.querySelectorAll('tbody.items tr.table-row');
        if (srows && srows.length){ items = Array.from(srows); break; }
        const grid = d.querySelector('[role="treegrid"], [role="grid"], [data-testid*="list" i]');
        if (grid){
          const rows = Array.from(grid.querySelectorAll('[role="row"]')).filter(r=>r.querySelector('[role="cell"]'));
          if (rows.length) { items = rows; break; }
        }
      }
    }

    function text(el){ return (el?.textContent || '').trim(); }
    function absUrl(href){
      try { return new URL(href, location.href).href; } catch { return href || ''; }
    }
    function pick(sel, ctx){ try { return ctx.querySelector(sel); } catch { return null; } }
    function pickSmart(sel, ctx){
      // Try inside the row first, then fall back to page-level
      let el = null;
      try { el = ctx.querySelector(sel); } catch {}
      if (!el){
        try { el = document.querySelector(sel); } catch {}
      }
      return el;
    }

    function normEmail(e){ return (e||'').trim().toLowerCase(); }
    function extractEmails(el){
      const s = el.innerText || '';
      const emails = new Set();
      // mailto links
      el.querySelectorAll("a[href^='mailto:']").forEach(a=>{
        const h=a.getAttribute('href')||''; if(h.startsWith('mailto:')) emails.add(normEmail(h.replace('mailto:','')));
      });
      // regex
      (s.match(/[A-Za-z0-9._%+-]+@[A-Za-z0-9.-]+\.[A-Za-z]{2,}/g)||[]).forEach(e=>emails.add(normEmail(e)));
      return Array.from(emails);
    }

    const itemsOut = [];
    const diag = { usedSalesQLRows: items.length, usedHeaderMapCompany: 0, usedHeaderMapProfile: 0, openedEmailPopovers: 0, popoverEmails: 0 };
    for (const it of items){
      // Company
      let company = '';
      if (cfg && cfg.useCustom && cfg.companySelectors){
        for (const sel of cfg.companySelectors){ const el = pickSmart(sel, it); if (el){ company = text(el); if (company) break; } }
      }
      if (!company){
        // SalesQL table company cell
        const companyEl = pick('.TableCompany .name, .company-details .name, .company-info-container .name, [data-testid="company"], .company-name, .company, .org-name, a[href*="/company" i], a[href*="/org" i]', it);
        company = text(companyEl);
      }
      if (!company){
        // Map header [data-name="company"] to this row's td by index
        const table = it.closest('table');
        if (table){
          const headCell = table.querySelector('thead [data-name="company"]');
          if (headCell){
            const thRow = headCell.closest('tr');
            const ths = thRow ? Array.from(thRow.children).filter(el=>el.tagName.toLowerCase()==='th') : [];
            const idx = ths.indexOf(headCell);
            if (idx >= 0){
              const tds = Array.from(it.children).filter(el=>el.tagName.toLowerCase()==='td');
              const cell = tds[idx];
              if (cell){
                const el = cell.querySelector('.name, a, [data-testid="company"], .company-name, .company, .org-name');
                company = text(el);
                if (company) diag.usedHeaderMapCompany++;
              }
            }
          }
        }
      }
      if (!company){
        // Try to parse from positions cell e.g., "Founder at Company"
        const posEl = it.querySelector('.TablePositions .position');
        const t = text(posEl);
        const m = t && t.match(/\bat\s+([^|\n\r]+?)(\s+\d{4}|\s*\+\d+ More|$)/i);
        if (m) company = (m[1]||'').trim();
      }
      // Profile link
      let profile = '';
      // Custom profile selector priority
      if (cfg && cfg.useCustom && cfg.profileSelectors){
        for (const sel of cfg.profileSelectors){ const el = pickSmart(sel, it); if (el){ profile = absUrl(el.getAttribute('href') || el.textContent || ''); if (profile) break; } }
      }
      // Heuristic fallback
      let linkEl = (!profile) && (pick('.TableProfile a[href]', it) || pick('a[href*="linkedin.com/in" i]', it) || pick('a[href*="linkedin.com/company" i]', it) || it.querySelector('a[href*="linkedin.com/"]'));
      if (!profile && !linkEl) { linkEl = pick('a[href*="app.salesql.com" i]', it) || pick('a[href*="/contacts" i]', it) || pick('a[href*="/people" i]', it) || pick('a[href*="/profile" i]', it); }
      if (!profile && linkEl) profile = absUrl(linkEl.getAttribute('href'));
      // Map header [data-name="profile"] to this row's td by index and extract link/name
      if (!profile){
        const table = it.closest('table');
        if (table){
          const headCell = table.querySelector('thead [data-name="profile"]');
          if (headCell){
            const thRow = headCell.closest('tr');
            const ths = thRow ? Array.from(thRow.children).filter(el=>el.tagName.toLowerCase()==='th') : [];
            const idx = ths.indexOf(headCell);
            if (idx >= 0){
              const tds = Array.from(it.children).filter(el=>el.tagName.toLowerCase()==='td');
              const cell = tds[idx];
              if (cell){
                const a = cell.querySelector('a[href]');
                profile = a ? absUrl(a.getAttribute('href')) : text(cell.querySelector('.name')) || text(cell);
                if (profile) diag.usedHeaderMapProfile++;
              }
            }
          }
        }
      }
      // If there is no link, try using the profile name text in SalesQL cell
      if (!profile){
        const nameEl = pick('.TableProfile .name', it);
        if (nameEl){ profile = text(nameEl); }
      }
      // As a last resort, use a stable id token to group rows (not a URL)
      if (!profile){
        const idEl = it.querySelector('[contactid]');
        const cid = idEl?.getAttribute('contactid');
        if (cid) profile = `salesql-contact:${cid}`;
      }
      // Emails & phones
      let emails = [];
      if (cfg && cfg.useCustom && cfg.emailSelectors){
        const set = new Set();
        for (const sel of cfg.emailSelectors){
          try { it.querySelectorAll(sel).forEach(el=>{
            const href = el.getAttribute && el.getAttribute('href');
            if (href && href.startsWith('mailto:')) set.add(href.replace('mailto:','').trim().toLowerCase());
            const t = (el.innerText||el.textContent||'');
            (t.match(/[A-Za-z0-9._%+-]+@[A-Za-z0-9.-]+\.[A-Za-z]{2,}/g)||[]).forEach(e=>set.add(e.trim().toLowerCase()));
          }); } catch(e){}
        }
        emails = Array.from(set);
      }
      if (!emails || emails.length===0){
        // Try auto-open SalesQL email popover
        try{
          const pill = it.querySelector('.TableContactInfo .email-phone-pill');
          if (pill){
            pill.click();
            diag.openedEmailPopovers++;
            await new Promise(r=>setTimeout(r, 300));
            const openPopovers = Array.from(it.ownerDocument.querySelectorAll('.el-popper[style*="display:"]')).filter(p=>{
              const s = p.getAttribute('style')||''; return /display:\s*block/i.test(s);
            });
            const set = new Set(emails);
            for (const pop of openPopovers){
              pop.querySelectorAll('a[href^="mailto:"]').forEach(a=>{
                const v = a.getAttribute('href').replace('mailto:','').trim().toLowerCase();
                if (v){ set.add(v); diag.popoverEmails++; }
              });
              const t = pop.innerText || pop.textContent || '';
              (t.match(/[A-Za-z0-9._%+-]+@[A-Za-z0-9.-]+\.[A-Za-z]{2,}/g)||[]).forEach(e=>{ set.add(e.trim().toLowerCase()); diag.popoverEmails++; });
            }
            const closeBtn = it.ownerDocument.querySelector('.el-popper .close-button, .el-popper .sql-modal__headerbtn, .el-popper .material-icons.md-20.sql-modal__close');
            if (closeBtn) { closeBtn.dispatchEvent(new MouseEvent('click', {bubbles:true})); }
            else { pill.click(); }
            emails = Array.from(set);
          }
        }catch(e){}
      }
      if (!emails || emails.length===0){
        // Generic heuristic: mailto and visible text inside row
        const set = new Set();
        it.querySelectorAll('a[href^="mailto:"]').forEach(a=>set.add(a.getAttribute('href').replace('mailto:','').trim().toLowerCase()));
        const txt = it.innerText || it.textContent || '';
        (txt.match(/[A-Za-z0-9._%+-]+@[A-Za-z0-9.-]+\.[A-Za-z]{2,}/g)||[]).forEach(e=>set.add(e.trim().toLowerCase()));
        emails = Array.from(set);
      }
      if (!profile && emails.length === 0 && !company) continue;
      itemsOut.push({ company, profile, emails });
    }

    // If heuristic produced no rows, fallback: email-first sweep with grouping
    if (itemsOut.length === 0){
      const emailElements = new Set();
      qsaDeep("a[href^='mailto:']").forEach(a=>{ emailElements.add(a); });
      qsaDeep('div, span, li, p, td, th, a').forEach(el=>{
        const s = (el.innerText||'').slice(0,2000);
        if (/[A-Za-z0-9._%+-]+@[A-Za-z0-9.-]+\.[A-Za-z]{2,}/.test(s)) emailElements.add(el);
      });
      const uniq = Array.from(emailElements);
      const groups = new Map(); // key -> { company, profile, emails:Set }
      function getCompanyFallback(ctx){
        const c1 = pick('[data-testid="company"], .company-name, .company, .org-name, a[href*="/company" i], a[href*="/org" i]', ctx);
        if (c1) return text(c1);
        const c2 = document.querySelector('[data-testid="company"], .company-name, .company, .org-name');
        return text(c2);
      }
      for (const el of uniq){
        const container = nearestItemContainer(el);
        const emails = extractEmails(container);
        if (emails.length === 0) continue;
        let linkEl = pick('a[href*="linkedin.com/" i]', container) || container.querySelector('a[href*="linkedin.com/"]');
        if (!linkEl) linkEl = pick('a[href*="app.salesql.com" i]', container) || pick('a[href*="/contacts" i]', container) || pick('a[href*="/people" i]', container);
        const profile = linkEl ? absUrl(linkEl.getAttribute('href')) : '';
        const key = profile || emails[0];
        if (!groups.has(key)) groups.set(key, { company: getCompanyFallback(container), profile, emails: new Set() });
        const entry = groups.get(key);
        if (!entry.company && getCompanyFallback(container)) entry.company = getCompanyFallback(container);
        if (profile && !entry.profile) entry.profile = profile;
        for (const e of emails){ if (!e) continue; entry.emails.add(e); }
      }
      for (const [key, g] of groups){ itemsOut.push({ company: g.company, profile: g.profile, emails: Array.from(g.emails) }); }
    }

    // Compute isLast from Next button (if present)
    let isLast = true;
    for (const d of allDocs){
      const btn = d.querySelector('button[aria-label="Next"]');
      if (btn){ isLast = (btn.getAttribute('aria-disabled') === 'true'); break; }
    }

    // Diagnostics summary
    const diagSummary = {
      docs: allDocs.length,
      linkEls: linkEls.length,
      mailtoEls: emailEls.length,
      textEmailEls: textEmailEls.length,
      items: items.length,
      ...diag
    };

    return { items: itemsOut, isLast, diag: diagSummary };
  }

  // Click the pagination "Next" button in page (and same-origin iframes)
  function clickNext(){
    function collectDocs(win){
      const docs = [];
      try { docs.push(win.document); } catch {}
      try {
        for (let i=0; i<win.frames.length; i++){
          const fwin = win.frames[i];
          try { if (fwin.location && fwin.document) docs.push(...collectDocs(fwin)); } catch {}
        }
      } catch {}
      return docs;
    }
    try{
      const docs = collectDocs(window);
      for (const d of docs){
        // Prefer SalesQL Next button
        let btn = d.querySelector('button[aria-label="Next"], button.next, .pagination button[aria-label="Next"]');
        if (btn && btn.getAttribute('aria-disabled') !== 'true'){ btn.click(); return true; }
        // Fallback anchors
        const a = d.querySelector('a[aria-label="Next"], a[rel="next"], .pagination a[rel="next"]');
        if (a){ a.click(); return true; }
      }
    } catch {}
    return false;
  }

  chrome.tabs.query({active: true, currentWindow: true}, async (tabs) => {
    const tab = tabs[0];
    if (!tab) return;

    statusEl.textContent = 'Ready on any site. Use Custom Selectors if needed.';

    // Save Session (cookies snapshot)
    saveSessionBtn.addEventListener('click', async () => {
      try {
        const res = await chrome.runtime.sendMessage({ type: 'snapshotCookies' });
        if (res?.ok) {
          statusEl.textContent = `Session saved (${res.count} cookies).`;
        } else {
          statusEl.textContent = `Session save failed: ${res?.error || 'unknown error'}`;
        }
      } catch (e) {
        statusEl.textContent = `Session save failed: ${e}`;
      }
    });

    // Load saved selectors
    try {
      const st = await chrome.storage.local.get('salesql_selectors');
      const cfg = st?.salesql_selectors || {};
      if (cfg.useCustom) useCustomChk.checked = true;
      if (cfg.rowSelector) rowSelectorInp.value = cfg.rowSelector;
      if (Array.isArray(cfg.companySelectors)) companySelectorsInp.value = cfg.companySelectors.join(', ');
      if (Array.isArray(cfg.profileSelectors)) profileSelectorsInp.value = cfg.profileSelectors.join(', ');
      if (Array.isArray(cfg.emailSelectors)) emailSelectorsInp.value = cfg.emailSelectors.join(', ');
    } catch {}

    async function startPicker(field){
      // Inject an isolated-world script so it can use chrome.storage even if popup closes.
      await chrome.scripting.executeScript({ target:{tabId: tab.id}, func: (field)=>{
        const overlay = document.createElement('div');
        Object.assign(overlay.style,{position:'fixed',left:0,top:0,right:0,bottom:0,zIndex:2147483647,background:'rgba(0,0,0,0.0)',cursor:'crosshair'});
        document.documentElement.appendChild(overlay);
        let last;
        function cssPath(el){
          if (el.id) return `#${el.id}`;
          const parts=[]; let cur=el;
          while(cur && cur.nodeType===1 && parts.length<5){
            let sel=cur.nodeName.toLowerCase();
            if (cur.className){
              const cls=String(cur.className).trim().split(/\s+/).slice(0,2).join('.');
              if (cls) sel += '.'+cls;
            }
            const sibs = cur.parentElement ? Array.from(cur.parentElement.children).filter(c=>c.tagName===cur.tagName) : [];
            if (sibs.length>1){ const idx = sibs.indexOf(cur)+1; sel += `:nth-of-type(${idx})`; }
            parts.unshift(sel); cur = cur.parentElement;
          }
          return parts.join(' > ');
        }
        function toast(msg){
          const t=document.createElement('div');
          t.textContent=msg; Object.assign(t.style,{position:'fixed',left:'50%',top:'10px',transform:'translateX(-50%)',padding:'6px 10px',background:'#111',color:'#fff',borderRadius:'6px',zIndex:2147483647,fontSize:'12px'});
          document.body.appendChild(t); setTimeout(()=>t.remove(),2000);
        }
        function over(e){ if (last) last.style.outline=''; last = e.target; last.style.outline='2px solid #22c55e'; }
        async function click(e){
          e.preventDefault(); e.stopPropagation();
          const sel = cssPath(e.target);
          try {
            const key = 'salesql_selectors';
            const cur = await chrome.storage.local.get(key);
            const cfg = cur?.[key] || { useCustom:true };
            if (field==='row') cfg.rowSelector = sel;
            if (field==='company') cfg.companySelectors = [...new Set([...(cfg.companySelectors||[]), sel])];
            if (field==='profile') cfg.profileSelectors = [...new Set([...(cfg.profileSelectors||[]), sel])];
            if (field==='email') cfg.emailSelectors = [...new Set([...(cfg.emailSelectors||[]), sel])];
            cfg.useCustom = true;
            await chrome.storage.local.set({ [key]: cfg });
            toast(`Saved selector for ${field}: ${sel}`);
          } catch(err){ console.warn('Save selector failed', err); }
          cleanup();
        }
        function esc(e){ if (e.key==='Escape'){ cleanup(); } }
        function cleanup(){ overlay.remove(); document.removeEventListener('mousemove',over,true); document.removeEventListener('click',click,true); document.removeEventListener('keydown',esc,true); if(last) last.style.outline=''; }
        document.addEventListener('mousemove',over,true);
        document.addEventListener('click',click,true);
        document.addEventListener('keydown',esc,true);
      }, args:[field]});
    }

    saveSelectorsBtn?.addEventListener('click', async ()=>{
      const cfg = {
        useCustom: !!useCustomChk?.checked,
        rowSelector: (rowSelectorInp?.value||'').trim(),
        companySelectors: (companySelectorsInp?.value||'').split(',').map(s=>s.trim()).filter(Boolean),
        profileSelectors: (profileSelectorsInp?.value||'').split(',').map(s=>s.trim()).filter(Boolean),
        emailSelectors: (emailSelectorsInp?.value||'').split(',').map(s=>s.trim()).filter(Boolean),
      };
      await chrome.storage.local.set({ salesql_selectors: cfg });
      statusEl.textContent = 'Selectors saved';
    });

    pickRowBtn?.addEventListener('click', async ()=>{ await startPicker('row'); statusEl.textContent='Click a row container in the page...'; });
    pickCompanyBtn?.addEventListener('click', async ()=>{ await startPicker('company'); statusEl.textContent='Click a company element in the page...'; });
    pickProfileBtn?.addEventListener('click', async ()=>{ await startPicker('profile'); statusEl.textContent='Click a profile link in the page...'; });
    pickEmailBtn?.addEventListener('click', async ()=>{ await startPicker('email'); statusEl.textContent='Click an email element in the page...'; });

    scrapeBtn.addEventListener('click', async () => {
      statusEl.textContent = 'Starting...';
      totalEl.textContent = '';
      dataRows = [];
      seenEmails = new Set();
      downloadBtn.disabled = true;
      tableContainer.innerHTML = '';
      const delaySec = Math.max(1, Math.min(10, parseInt(delayInput.value || '4', 10)));

      let page = 1;
      const profileMap = new Map(); // key (profile or first email) -> { company, profile, emails: Set }
      const globalSeen = new Set(); // optional global dedupe across profiles
      while (true){
        const customCfg = {
          useCustom: !!useCustomChk?.checked,
          rowSelector: (rowSelectorInp?.value||'').trim(),
          companySelectors: (companySelectorsInp?.value||'').split(',').map(s=>s.trim()).filter(Boolean),
          profileSelectors: (profileSelectorsInp?.value||'').split(',').map(s=>s.trim()).filter(Boolean),
          emailSelectors: (emailSelectorsInp?.value||'').split(',').map(s=>s.trim()).filter(Boolean),
        };
        const res = await exec(tab.id, scrapeCurrentPage, [customCfg]);
        const items = res?.items || [];
        const isLast = !!res?.isLast;
        const d = res?.diag || {};

        // Merge items per profile (fallback to first email when profile missing)
        for (const it of items){
          const emailsNorm = Array.from(new Set((it.emails || []).map(e => (e||'').trim().toLowerCase())));
          const profile = (it.profile || '').trim();
          const key = profile || (emailsNorm[0] || '');
          if (!key) continue; // truly empty
          const company = it.company || '';
          if (!profileMap.has(key)) profileMap.set(key, { company: company, profile, emails: new Set() });
          const entry = profileMap.get(key);
          if (!entry.company && company) entry.company = company;
          if (profile && !entry.profile) entry.profile = profile;
          for (const e of emailsNorm){
            if (!e) continue;
            if (globalSeen.has(e)) continue; // global dedupe
            entry.emails.add(e);
            globalSeen.add(e);
          }
        }

        // Create a preview table incrementally
        const tmpRows = [];
        let maxEmails = 0;
        for (const [profile, entry] of profileMap){
          const emailsArr = Array.from(entry.emails);
          maxEmails = Math.max(maxEmails, emailsArr.length);
        }
        headers = ['company'];
        for (let i=1;i<=Math.max(1,maxEmails);i++) headers.push(`email_${i}`);
        headers.push('profile');
        for (const [key, entry] of profileMap){
          const emailsArr = Array.from(entry.emails);
          const row = { company: entry.company, profile: (entry.profile || '') };
          emailsArr.forEach((e, idx) => row[`email_${idx+1}`] = e);
          tmpRows.push(row);
        }
        dataRows = tmpRows;
        renderTable();
        statusEl.textContent = `Scraped page ${page} (${items.length} items) — diag: docs=${d.docs||0}, links=${d.linkEls||0}, mailtos=${d.mailtoEls||0}, textEmails=${d.textEmailEls||0}, items=${d.items||0}`;
        totalEl.textContent = String(dataRows.length);
        downloadBtn.disabled = dataRows.length === 0;

        if (isLast) break;
        const clicked = await exec(tab.id, clickNext, []);
        if (!clicked) break;
        await new Promise(r => setTimeout(r, delaySec * 1000));
        page += 1;
      }

      // Persist last dataset in extension storage (session-like)
      try { await chrome.storage.local.set({ salesql_last_scrape: { when: Date.now(), rows: dataRows } }); } catch {}

      downloadBtn.disabled = dataRows.length === 0;
      totalEl.textContent = `Total rows: ${dataRows.length}`;
    });

    downloadBtn.addEventListener('click', async () => {
      const name = (fileNameInput.value || 'salesql_data') + '.csv';
      const csv = toCSV(headers, dataRows);
      const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' });
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url; a.download = name; document.body.appendChild(a); a.click(); a.remove();
      URL.revokeObjectURL(url);
    });
  });
});
