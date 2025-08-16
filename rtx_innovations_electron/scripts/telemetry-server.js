#!/usr/bin/env node
const http = require('http');
const fs = require('fs');
const path = require('path');

const PORT = process.env.TF_TELEMETRY_PORT ? Number(process.env.TF_TELEMETRY_PORT) : 8686;
const DATA_DIR = process.env.TF_TELEMETRY_DATA || path.join(process.cwd(), 'telemetry-data');
fs.mkdirSync(DATA_DIR, { recursive: true });

const dbFile = path.join(DATA_DIR, 'events.ndjson');

function write(line) {
  fs.appendFile(dbFile, line + '\n', { encoding: 'utf8' }, () => {});
}

function summarize() {
  const summary = { users: {}, totals: { emailsSent: 0, emailsFailed: 0 } };
  try {
    const lines = fs.readFileSync(dbFile, 'utf8').trim().split('\n').filter(Boolean);
    for (const l of lines) {
      let e; try { e = JSON.parse(l); } catch { continue; }
      const email = e.user || 'unknown';
      if (!summary.users[email]) summary.users[email] = { emailsSent: 0, emailsFailed: 0 };
      if (e.event === 'email_sent' || e.event === 'email_sent_smtp') { summary.users[email].emailsSent++; summary.totals.emailsSent++; }
      if (e.event === 'email_send_error') { summary.users[email].emailsFailed++; summary.totals.emailsFailed++; }
    }
  } catch {}
  return summary;
}

const server = http.createServer((req, res) => {
  if (req.method === 'POST' && req.url.startsWith('/ingest')) {
    let body = '';
    req.on('data', (c) => { body += c; if (body.length > 5e6) req.destroy(); });
    req.on('end', () => {
      try {
        const payload = JSON.parse(body);
        const ts = new Date().toISOString();
        if (Array.isArray(payload.events)) {
          for (const ev of payload.events) {
            write(JSON.stringify({ ts, ...ev }));
          }
        }
      } catch {}
      res.writeHead(200, { 'Content-Type': 'application/json' });
      res.end(JSON.stringify({ ok: true }));
    });
    return;
  }
  if (req.method === 'GET' && req.url.startsWith('/summary')) {
    const data = summarize();
    res.writeHead(200, { 'Content-Type': 'application/json' });
    res.end(JSON.stringify(data));
    return;
  }
  if (req.method === 'GET' && req.url.startsWith('/events')) {
    res.writeHead(200, { 'Content-Type': 'application/x-ndjson' });
    fs.createReadStream(dbFile).pipe(res);
    return;
  }
  res.writeHead(200, { 'Content-Type': 'text/html' });
  res.end(`<!doctype html><html><head><meta charset="utf-8"><title>TF Telemetry</title><style>
  body{font-family:system-ui,Arial,sans-serif;margin:20px}
  .card{border:1px solid #e0e0e0;border-radius:8px;padding:16px;margin-bottom:12px}
  table{border-collapse:collapse;width:100%}
  th,td{border:1px solid #ddd;padding:8px;text-align:left}
  th{background:#f5f5f5}
  </style></head><body>
  <h2>TASK FORCE Telemetry</h2>
  <div class="card"><button onclick="load()">Refresh</button> Endpoint: /ingest &nbsp;&nbsp; <code>${PORT}</code></div>
  <div id="totals" class="card">Loading...</div>
  <div id="users" class="card"></div>
  <script>
    async function load(){
      const s = await fetch('/summary').then(function(r){return r.json()});
      document.getElementById('totals').innerHTML = '<b>Totals</b><br/>Sent: '+s.totals.emailsSent+' &nbsp; Failed: '+s.totals.emailsFailed;
      var rows = '';
      Object.keys(s.users).forEach(function(email){ var v=s.users[email]; rows += '<tr><td>'+email+'</td><td>'+v.emailsSent+'</td><td>'+v.emailsFailed+'</td></tr>'; });
      document.getElementById('users').innerHTML = '<b>Users</b><table><thead><tr><th>User</th><th>Sent</th><th>Failed</th></tr></thead><tbody>'+rows+'</tbody></table>';
    }
    load();
    setInterval(load, 5000);
  </script>
  </body></html>`);
});

server.listen(PORT, () => console.log('Telemetry server on http://localhost:'+PORT));


