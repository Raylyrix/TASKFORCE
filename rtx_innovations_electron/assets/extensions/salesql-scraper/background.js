// Background service worker: snapshots SalesQL cookies into chrome.storage.local
chrome.runtime.onMessage.addListener((msg, sender, sendResponse) => {
  (async () => {
    try {
      if (msg && msg.type === 'snapshotCookies') {
        const cookies = await chrome.cookies.getAll({ domain: 'salesql.com' });
        await chrome.storage.local.set({ salesql_cookies_snapshot: { when: Date.now(), cookies } });
        sendResponse({ ok: true, count: cookies.length });
        return; // keep sendResponse
      }
    } catch (e) {
      try { sendResponse({ ok: false, error: String(e) }); } catch {}
    }
  })();
  // Return true to use async sendResponse
  return true;
});
