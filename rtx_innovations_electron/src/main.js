const { app, BrowserWindow, ipcMain, dialog, Menu } = require('electron');
const path = require('path');
const Store = require('electron-store');
const { google } = require('googleapis');
const http = require('http');
const url = require('url');
const cron = require('node-cron');
// SMTP/IMAP for Gmail App Password mode
let nodemailer;
let ImapFlow;

// Safe mode: allow launching without preload to diagnose issues
const isSafeMode = process.argv.includes('--safe') || process.env.TF_SAFE_MODE === '1';

// Auto-update and env helpers
const isDev = (() => {
	try { return require('electron-is-dev'); } catch (_) { return process.env.NODE_ENV === 'development'; }})();
let autoUpdater; // lazy require to avoid issues if module not present

// Core dependencies
const fs = require('fs');
const mime = require('mime-types');
const os = require('os');
const crypto = require('crypto');

// Initialize store
const store = new Store();

// Global variables for Google services
let oauth2Client = null;
let gmailService = null;
let sheetsService = null;
let mainWindow = null;

// Tab-based service management
const tabServices = new Map(); // tabId -> { oauth2Client, gmailService, sheetsService, email }
const tabOperations = new Map(); // tabId -> { isSending: boolean, isScheduling: boolean }

// Embedded default OAuth credentials (obfuscated)
function getEmbeddedDefaultCredentials() {
    return {
        installed: {
            client_id: "1007595181381-n1ildiigmoupnn78n8ekkhlulsfigbfk.apps.googleusercontent.com",
            project_id: "taskforce-mailer-v2",
            auth_uri: "https://accounts.google.com/o/oauth2/auth",
            token_uri: "https://oauth2.googleapis.com/token",
            auth_provider_x509_cert_url: "https://www.googleapis.com/oauth2/v1/certs",
            client_secret: "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",
            redirect_uris: ["http://localhost"]
        }
    };
}

function loadDefaultOAuthCredentials() {
    try {
        const inputPath = process.env.TF_DEFAULT_OAUTH_JSON;
        if (!inputPath) return getEmbeddedDefaultCredentials();
        if (!fs.existsSync(inputPath)) return getEmbeddedDefaultCredentials();
        const stat = fs.statSync(inputPath);
        if (stat.isDirectory()) {
            const files = fs.readdirSync(inputPath).filter(f => f.toLowerCase().endsWith('.json'));
            const pick = files.find(f => /oauth|client_secret|credentials/i.test(f)) || files[0];
            if (!pick) return getEmbeddedDefaultCredentials();
            const obj = JSON.parse(fs.readFileSync(path.join(inputPath, pick), 'utf8'));
            return obj;
        } else {
            const obj = JSON.parse(fs.readFileSync(inputPath, 'utf8'));
            return obj;
        }
    } catch (_) { return getEmbeddedDefaultCredentials(); }
}

// Function to update and store client credentials
function updateClientCredentials(credentialsData) {
	try {
		const norm = normalizeCredentials(credentialsData);
		store.set('googleCreds', norm);
		
		// Clear any existing tokens to force re-authentication
		store.delete('googleToken');
		
		// Reset services
		gmailService = null;
		sheetsService = null;
		oauth2Client = null;
		
		logEvent('info', 'Client credentials updated', { 
			clientId: norm.client_id ? 'present' : 'missing',
			hasRedirectUri: !!norm.redirect_uri 
		});
		
		return { success: true, message: 'Credentials updated successfully' };
	} catch (error) {
		logEvent('error', 'Failed to update credentials', { error: error.message });
		return { success: false, error: error.message };
	}
}

function getInstallId() {
	let id = store.get('installId');
	if (!id) {
		id = (crypto.randomUUID ? crypto.randomUUID() : (Date.now().toString(36) + Math.random().toString(36).slice(2)));
		store.set('installId', id);
	}
	return id;
}

function getTelemetryEndpoint() {
	const fromEnv = process.env.RTX_TELEMETRY_URL || store.get('telemetry.url');
	if (fromEnv) return fromEnv;
	const candidates = [];
	try { candidates.push(path.join(app.getPath('userData'), 'telemetry.conf')); } catch (_) {}
	try {
		const base = app.isPackaged ? path.dirname(app.getPath('exe')) : process.cwd();
		candidates.push(path.join(base, 'telemetry.conf'));
	} catch (_) {}
	for (const p of candidates) {
		try { if (p && fs.existsSync(p)) { const urlTxt = fs.readFileSync(p, 'utf8').trim(); if (urlTxt) return urlTxt; } } catch (_) {}
	}
	return null;
}

const TELEMETRY_INTERVAL_MS = 60000;
let telemetryQueue = [];
let telemetryTimer = null;

function trackTelemetry(eventName, meta) { return; }

function flushTelemetry() { return; }

function startTelemetry() { return; }

// Global scheduled jobs map accessor
function getJobsMap() {
	if (!global.__rtxScheduledJobs) global.__rtxScheduledJobs = new Map();
	return global.__rtxScheduledJobs;
}

// Google API Scopes
const SCOPES = [
	'https://www.googleapis.com/auth/spreadsheets',
	'https://www.googleapis.com/auth/gmail.send',
	'https://www.googleapis.com/auth/gmail.readonly',
	'https://www.googleapis.com/auth/gmail.settings.basic'
];

// SMTP/IMAP helpers for App Password mode
function getSmtpStore() {
    try { return store.get('smtp') || {}; } catch (_) { return {}; }
}
function setSmtpStore(obj) {
    try { store.set('smtp', obj || {}); } catch (_) {}
}
function getActiveSmtpEmail() {
    try { return store.get('smtp.activeEmail') || null; } catch (_) { return null; }
}
function setActiveSmtpEmail(email) {
    try { store.set('smtp.activeEmail', email); } catch (_) {}
}
function getSmtpCreds(email) {
    const smtp = getSmtpStore();
    return smtp[email] || null;
}
function saveSmtpCreds(email, appPassword) {
    const smtp = getSmtpStore();
    smtp[email] = { email, appPassword, ts: Date.now() };
    setSmtpStore(smtp);
    setActiveSmtpEmail(email);
}
function clearSmtpCreds(email) {
    const smtp = getSmtpStore();
    delete smtp[email];
    setSmtpStore(smtp);
    const active = getActiveSmtpEmail();
    if (active === email) setActiveSmtpEmail(null);
}

function isOAuthAvailable() {
    try { return !!store.get('googleToken'); } catch (_) { return false; }
}

async function ensureMailer() {
    if (!nodemailer) nodemailer = require('nodemailer');
}

async function ensureImap() {
    if (!ImapFlow) ImapFlow = require('imapflow').ImapFlow;
}

function createWindow() {
  mainWindow = new BrowserWindow({
		width: 1200,
		height: 800,
		minWidth: 1100,
		minHeight: 700,
		resizable: true,
    webPreferences: {
      nodeIntegration: false,
      contextIsolation: true,
      preload: isSafeMode ? undefined : path.join(__dirname, 'preload.js'),
      backgroundThrottling: false,
      devTools: true
    },
    icon: path.join(__dirname, '../assets/icons/icon.png'),
		show: true,
		center: true,
		backgroundColor: '#ffffff'
	});

  // Robust show strategy
  const bringToFront = () => {
    try {
      if (!mainWindow) return;
      if (!mainWindow.isVisible()) mainWindow.show();
      mainWindow.focus();
      // Pulse always-on-top to defeat z-order issues
      mainWindow.setAlwaysOnTop(true);
      setTimeout(() => { try { mainWindow.setAlwaysOnTop(false); } catch (_) {} }, 200);
      // On macOS force visible across spaces briefly, then revert
      if (process.platform === 'darwin') {
        try { mainWindow.setVisibleOnAllWorkspaces(true, { visibleOnFullScreen: true }); } catch (_) {}
        setTimeout(() => { try { mainWindow.setVisibleOnAllWorkspaces(false); } catch (_) {} }, 300);
      }
      // open DevTools in safe mode to help diagnose
      if (isSafeMode) { try { mainWindow.webContents.openDevTools({ mode: 'detach' }); } catch (_) {} }
    } catch (_) {}
  };
  mainWindow.once('ready-to-show', bringToFront);
  mainWindow.webContents.once('dom-ready', bringToFront);
  const rescueTimer = setTimeout(() => { try { if (!mainWindow.isDestroyed() && !mainWindow.isVisible()) mainWindow.show(); } catch (_) {} }, 4000);

	try {
    const indexPath = path.join(__dirname, '../dist/index.html');
    if (fs.existsSync(indexPath)) mainWindow.loadFile(indexPath);
    else mainWindow.loadFile(path.join(__dirname, '../src/index.html'));
  } catch (_) {}
  mainWindow.webContents.on('did-fail-load', (_e, code, desc, url, isMainFrame) => {
    try {
      if (isMainFrame) {
        const html = 'data:text/html;charset=utf-8,' + encodeURIComponent(`<html><body style=\"font-family:sans-serif;padding:24px\"><h2>Failed to load UI</h2><p>${code}: ${desc}</p><p>Please restart the app or reinstall.</p></body></html>`);
        mainWindow.loadURL(html);
      }
      if (!mainWindow.isVisible()) mainWindow.show();
    } catch (_) {}
  });
  mainWindow.webContents.on('render-process-gone', (_e, details) => {
    logEvent('error', 'renderer-gone', details);
    try { mainWindow.reload(); } catch (_) {}
  });
  mainWindow.on('unresponsive', () => { try { mainWindow.reload(); } catch (_) {} });
  mainWindow.on('closed', () => { try { clearTimeout(rescueTimer); } catch(_){} mainWindow = null; });
	createMenu();
}

function createMenu() {
  const template = [
    {
      label: 'File',
      submenu: [
        {
          label: 'New Campaign',
          accelerator: 'CmdOrCtrl+N',
          click: () => {
					if (mainWindow && mainWindow.webContents) {
            mainWindow.webContents.send('menu-action', 'new-campaign');
          }
				}
			},
        {
          label: 'Import Data',
          accelerator: 'CmdOrCtrl+I',
          click: () => {
					if (mainWindow && mainWindow.webContents) {
            mainWindow.webContents.send('menu-action', 'import-data');
          }
          }
        },
        { type: 'separator' },
        {
					label: 'Quit',
          accelerator: process.platform === 'darwin' ? 'Cmd+Q' : 'Ctrl+Q',
					click: () => app.quit()
        }
      ]
    },
    {
      label: 'Edit',
      submenu: [
        { role: 'undo' },
        { role: 'redo' },
        { type: 'separator' },
        { role: 'cut' },
        { role: 'copy' },
				{ role: 'paste' }
      ]
    },
    {
			label: 'View',
			submenu: [
        { role: 'reload' },
        { role: 'forceReload' },
        { role: 'toggleDevTools' },
        { type: 'separator' },
        { role: 'resetZoom' },
        { role: 'zoomIn' },
        { role: 'zoomOut' },
        { type: 'separator' },
        { role: 'togglefullscreen' }
      ]
    },
    {
			label: 'Window',
			submenu: [ { role: 'minimize' }, { role: 'close' } ]
    }
    ,
    {
      label: 'Help',
      submenu: [
        {
          label: 'Check for Updates',
          click: () => {
            try {
              if (mainWindow && mainWindow.webContents) {
                mainWindow.webContents.send('menu-action', 'help-check-updates');
              }
            } catch (_) {}
          }
        },
        { type: 'separator' },
        {
          label: 'Welcome',
          click: () => { try { if (mainWindow && mainWindow.webContents) mainWindow.webContents.send('menu-action', 'help-welcome'); } catch (_) {} }
        },
        {
          label: 'Release Notes',
          click: () => { try { if (mainWindow && mainWindow.webContents) mainWindow.webContents.send('menu-action', 'help-release-notes'); } catch (_) {} }
        },
        {
          label: 'Privacy Policy',
          click: () => { try { if (mainWindow && mainWindow.webContents) mainWindow.webContents.send('menu-action', 'help-privacy'); } catch (_) {} }
        },
        {
          label: 'Terms of Service',
          click: () => { try { if (mainWindow && mainWindow.webContents) mainWindow.webContents.send('menu-action', 'help-terms'); } catch (_) {} }
        },
        {
          label: 'About',
          click: () => { try { if (mainWindow && mainWindow.webContents) mainWindow.webContents.send('menu-action', 'help-about'); } catch (_) {} }
        }
      ]
    }
  ];

  const menu = Menu.buildFromTemplate(template);
  Menu.setApplicationMenu(menu);
}

function normalizeCredentials(raw) {
	// Accept structures: {installed:{...}}, {web:{...}}, or flat
	if (raw?.web) {
		const web = raw.web;
		if (!web.client_id || !web.client_secret) throw new Error('Missing client_id/client_secret');
		const exact = Array.isArray(web.redirect_uris)
			? web.redirect_uris.find(u => /^http:\/\/(localhost|127\.0\.0\.1)(:|\/|$)/.test(u))
			: null;
		if (!exact) {
			// No loopback redirect URI registered on this Web client. We cannot use a random port.
			return { client_id: web.client_id, client_secret: web.client_secret, redirect_uri: null, fixed: false };
		}
		return { client_id: web.client_id, client_secret: web.client_secret, redirect_uri: exact, fixed: true };
	}
	const creds = raw?.installed || raw;
	if (!creds) throw new Error('Invalid credentials file format');
	if (!creds.client_id || !creds.client_secret) throw new Error('Missing client_id/client_secret in credentials');
	const hasLocalhost = Array.isArray(creds.redirect_uris) && creds.redirect_uris.some(u => /^http:\/\/(localhost|127\.0\.0\.1)(:|\/|$)/.test(u));
	return { client_id: creds.client_id, client_secret: creds.client_secret, redirect_uri: null, fixed: false, host: hasLocalhost ? 'localhost' : '127.0.0.1' };
}

function buildOAuthClient(norm, redirectUriOverride) {
	// For desktop apps, Google automatically handles redirect URIs
	// Use the redirect URI from credentials or default to localhost
	const redirect = redirectUriOverride || norm.redirect_uri || 'http://localhost';
	return new google.auth.OAuth2(norm.client_id, norm.client_secret, redirect);
}

function buildOAuthClientForTab(tabId, credentials = null) {
	// Use provided credentials or default credentials
	const creds = credentials || getEmbeddedDefaultCredentials().installed;
	const oauth2Client = new google.auth.OAuth2(
		creds.client_id,
		creds.client_secret,
		creds.redirect_uris[0] || 'http://localhost'
	);
	return oauth2Client;
}

async function ensureServices() {
	if (!oauth2Client) {
		const token = store.get('googleToken');
		const norm = store.get('googleCreds');
		if (!token || !norm) throw new Error('Not authenticated');
		// If token was issued for a different client, discard and force re-auth
		const tokenClientId = store.get('googleTokenClientId');
		if (tokenClientId && tokenClientId !== norm.client_id) {
			store.delete('googleToken');
			throw new Error('Not authenticated');
		}
		oauth2Client = buildOAuthClient(norm);
		oauth2Client.setCredentials(token);
	}
	if (!gmailService) gmailService = google.gmail({ version: 'v1', auth: oauth2Client });
	if (!sheetsService) sheetsService = google.sheets({ version: 'v4', auth: oauth2Client });
}

// Google API Integration
// Tab-based authentication function
async function authenticateGoogleWithTab(credentialsData, tabId) {
	try {
		let norm;
		if (credentialsData && Object.keys(credentialsData || {}).length) {
			norm = normalizeCredentials(credentialsData);
		} else {
			const def = (typeof loadDefaultOAuthCredentials === 'function') ? loadDefaultOAuthCredentials() : null;
			if (!def) throw new Error('Default OAuth credentials not configured');
			norm = normalizeCredentials(def);
		}

		// Create tab-specific OAuth client
		const tabOAuth2Client = buildOAuthClientForTab(tabId, norm);
		
		// Check for existing token for this tab
		const existingToken = store.get(`googleToken_${tabId}`);
		if (existingToken) {
			tabOAuth2Client.setCredentials(existingToken);
			
			// Create tab services
			const tabGmailService = google.gmail({ version: 'v1', auth: tabOAuth2Client });
			const tabSheetsService = google.sheets({ version: 'v4', auth: tabOAuth2Client });
			
			// Store tab services
			tabServices.set(tabId, {
				oauth2Client: tabOAuth2Client,
				gmailService: tabGmailService,
				sheetsService: tabSheetsService,
				email: 'authenticated'
			});
			
			// Background: resolve profile
			;(async () => {
				try {
					let emailAddr = 'authenticated';
					try {
						const p = await Promise.race([
							tabGmailService.users.getProfile({ userId: 'me' }),
							new Promise((_, rej) => setTimeout(() => rej(new Error('timeout')), 10000))
						]);
						if (p && p.data && p.data.emailAddress) {
							emailAddr = p.data.emailAddress;
							// Update tab services with actual email
							const tabData = tabServices.get(tabId);
							if (tabData) {
								tabData.email = emailAddr;
								tabServices.set(tabId, tabData);
							}
						}
						logEvent('info', 'Tab authenticated and token stored', { email: emailAddr, tabId });
					} catch (_) {}
				} catch (_) {}
			})();
			
			return { success: true, userEmail: 'authenticated' };
		}

		// Perform OAuth flow for new authentication
		const { shell } = require('electron');
		const token = await new Promise((resolve, reject) => {
			let settled = false;
			const server = http.createServer((req, res) => {
				if (settled) return;
				settled = true;
				const urlParts = url.parse(req.url, true);
				const code = urlParts.query.code;
				if (code) {
					res.writeHead(200, { 'Content-Type': 'text/html' });
					res.end('<html><body><h1>Authentication successful!</h1><p>You can close this window.</p></body></html>');
					server.close();
					resolve(code);
				} else {
					res.writeHead(400, { 'Content-Type': 'text/html' });
					res.end('<html><body><h1>Authentication failed</h1><p>Please try again.</p></body></html>');
					server.close();
					reject(new Error('No authorization code received'));
				}
			});
			
			server.listen(0, 'localhost', () => {
				const port = server.address().port;
				const authUrl = tabOAuth2Client.generateAuthUrl({
					access_type: 'offline',
					scope: ['https://www.googleapis.com/auth/gmail.send', 'https://www.googleapis.com/auth/spreadsheets'],
					redirect_uri: `http://localhost:${port}`
				});
				shell.openExternal(authUrl);
			});
			
			server.on('error', (err) => {
				if (!settled) {
					settled = true;
					reject(err);
				}
			});
		});

		const { tokens } = await tabOAuth2Client.getToken({
			code: token,
			redirect_uri: `http://localhost:${port}`
		});
		
		tabOAuth2Client.setCredentials(tokens);
		
		// Store tab-specific token
		store.set(`googleToken_${tabId}`, tokens);
		store.set(`googleCreds_${tabId}`, norm);
		store.set(`googleTokenClientId_${tabId}`, norm.client_id);
		
		// Create tab services
		const tabGmailService = google.gmail({ version: 'v1', auth: tabOAuth2Client });
		const tabSheetsService = google.sheets({ version: 'v4', auth: tabOAuth2Client });
		
		// Store tab services
		tabServices.set(tabId, {
			oauth2Client: tabOAuth2Client,
			gmailService: tabGmailService,
			sheetsService: tabSheetsService,
			email: 'authenticated'
		});
		
		// Background: resolve profile
		;(async () => {
			try {
				let emailAddr = 'authenticated';
				try {
					const p = await Promise.race([
						tabGmailService.users.getProfile({ userId: 'me' }),
						new Promise((_, rej) => setTimeout(() => rej(new Error('timeout')), 10000))
					]);
					if (p && p.data && p.data.emailAddress) {
						emailAddr = p.data.emailAddress;
						// Update tab services with actual email
						const tabData = tabServices.get(tabId);
						if (tabData) {
							tabData.email = emailAddr;
							tabServices.set(tabId, tabData);
						}
					}
					logEvent('info', 'Tab authenticated and token stored', { email: emailAddr, tabId });
				} catch (_) {}
			} catch (_) {}
		})();
		
		return { success: true, userEmail: 'authenticated' };
	} catch (error) {
		console.error('Tab authentication error:', error);
		return { success: false, error: error.message };
	}
}

async function authenticateGoogle(credentialsData) {
	try {
		let norm;
		if (credentialsData && Object.keys(credentialsData || {}).length) {
			norm = normalizeCredentials(credentialsData);
		} else {
			const def = (typeof loadDefaultOAuthCredentials === 'function') ? loadDefaultOAuthCredentials() : null;
			if (!def) throw new Error('Default OAuth credentials not configured');
			norm = normalizeCredentials(def);
		}
		store.set('googleCreds', norm);

		const existing = store.get('googleToken');
		if (existing) {
			oauth2Client = buildOAuthClient(norm);
			oauth2Client.setCredentials(existing);
			// Instant attach without waiting for profile
			try {
				if (mainWindow && mainWindow.webContents) {
					mainWindow.webContents.send('auth-success', { email: 'authenticated' });
					try { if (!mainWindow.isVisible()) mainWindow.show(); mainWindow.focus(); } catch (_) {}
				}
			} catch (_) {}
			// Background: ensure services and resolve profile with timeout
			;(async () => {
				try {
					await ensureServices();
					let emailAddr = 'authenticated';
					try {
						const p = await Promise.race([
							gmailService.users.getProfile({ userId: 'me' }),
							new Promise((_, rej) => setTimeout(() => rej(new Error('timeout')), 10000))
						]);
						if (p && p.data && p.data.emailAddress) emailAddr = p.data.emailAddress;
						saveAccountEntry(emailAddr, norm, existing);
						try { store.set('app-settings', { isAuthenticated: true, currentAccount: emailAddr }); } catch(_) {}
						try { if (mainWindow && mainWindow.webContents) mainWindow.webContents.send('auth-success', { email: emailAddr }); } catch (_) {}
						logEvent('info', 'Authenticated and token stored', { email: emailAddr });
					} catch (_) {}
				} catch (_) {}
			})();
			return { success: true, userEmail: 'authenticated' };
		}

		const { shell } = require('electron');

		const token = await new Promise((resolve, reject) => {
			let settled = false;
			let server;

			const startServer = (host, port, pathName) => {
				server = http.createServer(async (req, res) => {
					try {
						const base = `http://${host}:${server.address().port}`;
						const reqUrl = new URL(req.url, base);
						// Accept any path as long as code exists
						const code = reqUrl.searchParams.get('code');
						if (!code) { res.writeHead(400); res.end('Missing code'); return; }
                        const { tokens } = await oauth2Client.getToken(code);
                        oauth2Client.setCredentials(tokens);
                        try {
                            if (mainWindow && mainWindow.webContents) {
                                mainWindow.webContents.send('auth-progress', { step: 'token-received' });
                                try { if (!mainWindow.isVisible()) mainWindow.show(); mainWindow.focus(); } catch (_) {}
                            }
                        } catch (_) {}
                        res.writeHead(200, { 'Content-Type': 'text/html' });
                        res.end('<html><body><h2>Authentication successful. You can close this window and return to the app.</h2><script>setTimeout(()=>{window.close()},500);</script></body></html>');
						settled = true;
						server.close(() => resolve(tokens));
					} catch (err) {
						if (!settled) { settled = true; try { server.close(); } catch (_) {} reject(err); }
					}
				});

				// Try to bind; if privileged or fails, fall back to random port and alternate host
				const tryListen = (h, p) => server.listen(p, h, async () => {
					try {
						oauth2Client = buildOAuthClient(norm, `http://${h}:${server.address().port}${pathName}`);
						const authUrl = oauth2Client.generateAuthUrl({ access_type: 'offline', scope: SCOPES, prompt: 'consent' });
						await shell.openExternal(authUrl);
					} catch (openErr) {
						try { server.close(); } catch (_) {}
						reject(openErr);
					}
				}).on('error', (e) => {
					// fallback to alternate host/port
					try { server.close(); } catch (_) {}
					if (!settled) {
						const altHost = h === 'localhost' ? '127.0.0.1' : 'localhost';
						server = http.createServer(() => {});
						tryListen(altHost, 0);
					}
				});
				tryListen(host, port);
			};

			// Choose server binding based on credential type
			if (norm.fixed && norm.redirect_uri) {
				const parsed = new URL(norm.redirect_uri);
				const host = parsed.hostname || 'localhost';
				const port = parsed.port ? parseInt(parsed.port, 10) : 80;
				const pathName = parsed.pathname || '/';
				startServer(host, port, pathName);
			} else {
				// Desktop app style: dynamic random port on loopback per Google guidelines
				const host = norm.host || 'localhost';
				const pathName = '/';
				startServer(host, 0, pathName);
			}

			setTimeout(() => {
				if (!settled) {
					settled = true;
					try { server && server.close(); } catch (_) {}
					reject(new Error('Authentication timed out. Please try again.'));
				}
			}, 180000); // 3 minutes
		});

        // Persist token and client binding
        try { store.delete('smtp.activeEmail'); } catch (_) {}
        store.set('googleToken', token);
        store.set('googleTokenClientId', norm.client_id);
        
        // INSTANT SUCCESS - Don't wait for profile fetch
        try { if (mainWindow && mainWindow.webContents) { mainWindow.webContents.send('auth-success', { email: 'authenticated' }); try { if (!mainWindow.isVisible()) mainWindow.show(); mainWindow.focus(); } catch (_) {} } } catch (_) {}
        
        // Background: ensure services and resolve profile with timeout
        ;(async () => {
            try {
                await ensureServices();
                let emailAddr = 'authenticated';
                try {
                    const p = await Promise.race([
                        gmailService.users.getProfile({ userId: 'me' }),
                        new Promise((_, rej) => setTimeout(() => rej(new Error('timeout')), 10000))
                    ]);
                    if (p && p.data && p.data.emailAddress) emailAddr = p.data.emailAddress;
                    saveAccountEntry(emailAddr, norm, token);
                    try { store.set('app-settings', { isAuthenticated: true, currentAccount: emailAddr }); } catch(_) {}
                    try { if (mainWindow && mainWindow.webContents) mainWindow.webContents.send('auth-success', { email: emailAddr }); } catch (_) {}
                    logEvent('info', 'Authenticated and token stored', { email: emailAddr });
                } catch (_) {}
            } catch (_) {}
        })();
        
        // Return immediately
        return { success: true, userEmail: 'authenticated' };
	} catch (error) {
		console.error('Authentication error:', error);
		logEvent('error', 'Authentication error', { error: error.message });
		// Authentication error logged
		// If token invalid for this client (401/unauthorized_client), purge and ask user to try again
		if (/unauthorized_client|invalid_grant|invalid_client/i.test(error.message)) {
			try { store.delete('googleToken'); } catch (_) {}
		}
		
		// Provide more helpful error messages for desktop apps
		let errorMessage = error.message;
		if (error.message.includes('unauthorized_client')) {
			errorMessage = 'Unauthorized client. Please check your Google OAuth credentials. Make sure you downloaded the credentials for a "Desktop application" type from Google Cloud Console.';
		} else if (error.message.includes('invalid_client')) {
			errorMessage = 'Invalid client. Please check your client ID and client secret in the credentials file.';
		} else if (error.message.includes('access_denied')) {
			errorMessage = 'Access denied. Please make sure you have enabled the required APIs (Gmail API and Google Sheets API) in your Google Cloud project.';
		} else if (error.message.includes('redirect_uri_mismatch')) {
			errorMessage = 'Redirect URI mismatch. For desktop apps, this should be handled automatically. Please try updating your credentials.';
		}
		
		return { success: false, error: errorMessage };
	}
}

async function initializeGmailService() {
	try {
		if (isOAuthAvailable()) {
			await ensureServices();
			return { success: true };
		}
		const smtpEmail = getActiveSmtpEmail();
		if (smtpEmail) return { success: true, mode: 'smtp', email: smtpEmail };
		return { success: false, error: 'Not authenticated. Please sign in via Google OAuth or provide SMTP App Password.' };
	} catch (error) {
		return { success: false, error: error.message };
	}
}

async function initializeSheetsService() {
	try {
		await ensureServices();
		return { success: true };
	} catch (error) {
		return { success: false, error: error.message };
	}
}

async function connectToSheets(arg) {
	try {
		// If OAuth is available, use Google Sheets API
		if (isOAuthAvailable()) {
			await ensureServices();
			let sheetId = arg;
			let sheetTitle = null;
			if (arg && typeof arg === 'object') {
				sheetId = arg.sheetId;
				sheetTitle = arg.sheetTitle || null;
			}
			const range = sheetTitle ? `${sheetTitle}!A:Z` : 'A:Z';
			const response = await sheetsService.spreadsheets.values.get({ spreadsheetId: sheetId, range });
			const values = response.data.values || [];
			if (!values.length) throw new Error('No data found in sheet');
			const headers = values[0];
			const rows = values.slice(1);
			return { success: true, data: { headers, rows } };
		}
		// Fallback: try CSV export if the sheet is shared publicly (Anyone with link)
		const https = require('https');
		let sheetId = typeof arg === 'object' ? (arg.sheetId || '') : String(arg || '');
		let rawUrl = typeof arg === 'object' ? (arg.rawUrl || '') : '';
		let gid = null;
		try { if (rawUrl) { const parsed = new URL(rawUrl); gid = parsed.searchParams.get('gid'); } } catch (_) {}
		if (!sheetId && rawUrl) {
			try {
				const m = rawUrl.match(/\/spreadsheets\/d\/([a-zA-Z0-9-_]+)/);
				if (m) sheetId = m[1];
			} catch (_) {}
		}
		if (!sheetId) throw new Error('Missing Google Sheet ID');
		const exportUrl = `https://docs.google.com/spreadsheets/d/${sheetId}/export?format=csv${gid ? `&gid=${gid}` : ''}`;

		async function fetchCsvWithRedirects(urlToGet, hops = 0) {
			if (hops > 5) throw new Error('Too many redirects fetching CSV');
			return await new Promise((resolve, reject) => {
				const req = https.get(urlToGet, {
					headers: { 'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) Chrome/114 Safari/537.36' }
				}, (res) => {
					const loc = res.headers && res.headers.location;
					if (res.statusCode && res.statusCode >= 300 && res.statusCode < 400 && loc) {
						const next = /^https?:/i.test(loc) ? loc : new URL(loc, urlToGet).toString();
						resolve(fetchCsvWithRedirects(next, hops + 1));
						return;
					}
					if (res.statusCode !== 200) { reject(new Error(`Failed to fetch CSV (status ${res.statusCode}). Share the sheet as Anyone with the link.`)); return; }
					let data = '';
					res.setEncoding('utf8');
					res.on('data', (chunk) => { try { data += chunk; } catch (_) {} });
					res.on('end', () => resolve(data));
				});
				req.on('error', (e) => reject(e));
			});
		}

		const csv = await fetchCsvWithRedirects(exportUrl);
		const XLSX = require('xlsx');
		const wb = XLSX.read(csv, { type: 'string' });
		const first = wb.SheetNames[0];
		const rows = XLSX.utils.sheet_to_json(wb.Sheets[first], { header: 1 });
		if (!rows || !rows.length) throw new Error('No data found in sheet CSV');
		const headers = rows[0];
		const body = rows.slice(1);
		return { success: true, data: { headers, rows: body } };
	} catch (error) {
		console.error('Sheets connection error:', error);
		return { success: false, error: error.message };
	}
}

function toBase64Url(str) {
	return Buffer.from(str).toString('base64').replace(/\+/g, '-').replace(/\//g, '_').replace(/=+$/, '');
}

async function listSendAs(tabId = null) {
	try {
		if (tabId && tabServices.has(tabId)) {
			// Use tab-specific service
			const tabData = tabServices.get(tabId);
			if (tabData && tabData.gmailService) {
				const res = await tabData.gmailService.users.settings.sendAs.list({ userId: 'me' });
				return (res.data.sendAs || []).map(s => ({
					email: s.sendAsEmail,
					name: s.displayName || '',
					isPrimary: !!s.isPrimary,
					verificationStatus: s.verificationStatus,
					signature: s.signature || ''
				}));
			}
		}
		
		if (isOAuthAvailable()) {
			await ensureServices();
			const res = await gmailService.users.settings.sendAs.list({ userId: 'me' });
			return (res.data.sendAs || []).map(s => ({
				email: s.sendAsEmail,
				name: s.displayName || '',
				isPrimary: !!s.isPrimary,
				verificationStatus: s.verificationStatus,
				signature: s.signature || ''
			}));
		}
		
		const email = getActiveSmtpEmail();
		if (email) return [{ email, name: '', isPrimary: true, verificationStatus: 'accepted', signature: (store.get(`smtp.signature.${email}`) || '') }];
		return [];
	} catch (error) {
		console.error('Error listing send-as addresses:', error);
		logEvent('error', 'Failed to list send-as addresses', { error: error.message, tabId });
		return [];
	}
}

async function getPrimarySignature(tabId = null) {
	try {
		if (tabId && tabServices.has(tabId)) {
			// Use tab-specific service
			const tabData = tabServices.get(tabId);
			if (tabData && tabData.gmailService) {
				const res = await tabData.gmailService.users.settings.sendAs.list({ userId: 'me' });
				const list = res.data.sendAs || [];
				const pri = list.find(s => s.isPrimary) || list[0];
				return pri?.signature || '';
			}
		}
		
		if (isOAuthAvailable()) {
			await ensureServices();
			const res = await gmailService.users.settings.sendAs.list({ userId: 'me' });
			const list = res.data.sendAs || [];
			const pri = list.find(s => s.isPrimary) || list[0];
			return pri?.signature || '';
		}
		
		const email = getActiveSmtpEmail();
		return (email && (store.get(`smtp.signature.${email}`) || '')) || '';
	} catch (error) {
		console.error('Error getting primary signature:', error);
		logEvent('error', 'Failed to get primary signature', { error: error.message, tabId });
		return '';
	}
}

async function listSheets(sheetId) {
	if (isOAuthAvailable()) {
		await ensureServices();
		const meta = await sheetsService.spreadsheets.get({ spreadsheetId: sheetId });
		return (meta.data.sheets || []).map(s => s.properties.title);
	}
	// Fallback cannot list tabs without OAuth
	return [];
}

function columnIndexToA1(n) {
	let s = '';
	while (n >= 0) {
		s = String.fromCharCode((n % 26) + 65) + s;
		n = Math.floor(n / 26) - 1;
	}
	return s;
}

async function ensureStatusColumn(sheetId, sheetTitle, headers) {
	let idx = headers.findIndex(h => String(h).trim().toLowerCase() === 'status');
	if (idx === -1) {
		// add Status header at the end
		headers.push('Status');
		const range = `${sheetTitle}!A1:${columnIndexToA1(headers.length - 1)}1`;
		try {
			await sheetsService.spreadsheets.values.update({
				spreadsheetId: sheetId,
				range,
				valueInputOption: 'RAW',
				requestBody: { values: [headers] }
			});
			idx = headers.length - 1;
		} catch (e) {
			logEvent('error', 'Failed to ensure Status column (insufficient scope?)', { error: e.message, sheetId, sheetTitle, range });
			return -1; // signal we cannot write
		}
	}
	return idx;
}

async function updateSheetStatus(sheetId, sheetTitle, headers, rowIndexZeroBased, statusText) {
	if (!isOAuthAvailable()) {
		return { success: false, error: 'Write to Google Sheets requires Google sign-in. Status not updated (read-only mode).' };
	}
	await ensureServices();
	// Resolve sheetTitle if missing
	let title = sheetTitle;
	if (!title) {
		const meta = await sheetsService.spreadsheets.get({ spreadsheetId: sheetId });
		title = meta.data.sheets?.[0]?.properties?.title || 'Sheet1';
	}
	const col = await ensureStatusColumn(sheetId, title, headers);
	const a1col = columnIndexToA1(col);
	const rowA1 = rowIndexZeroBased + 2; // +1 header, +1 1-indexed
	const range = `${title}!${a1col}${rowA1}`;
	try {
		await sheetsService.spreadsheets.values.update({
			spreadsheetId: sheetId,
			range,
			valueInputOption: 'RAW',
			requestBody: { values: [[statusText]] }
		});
		return { success: true };
	} catch (error) {
		logEvent('error', 'Sheets status update failed', { error: error.message, sheetId, title, range });
		return { success: false, error: error.message };
	}
}

// App logging (prefer Documents/TaskForce/logs; fallback to userData). Use async writes to avoid EBADF
let appLogsDir;
try {
    const docsDir = app.getPath('documents');
    appLogsDir = path.join(docsDir, 'TaskForce', 'logs');
    fs.mkdirSync(appLogsDir, { recursive: true });
} catch (_) {
    appLogsDir = path.join(app.getPath('userData'), 'logs');
    try { fs.mkdirSync(appLogsDir, { recursive: true }); } catch (_) {}
}
const sessionLogFile = path.join(appLogsDir, `session-${new Date().toISOString().replace(/[:.]/g,'-')}.log`);

function logEvent(level, message, meta) {
	try {
		const line = JSON.stringify({ ts: new Date().toISOString(), level, message, meta: meta || null }) + os.EOL;
		// Non-blocking, best-effort write. Ignore filesystem errors to prevent UI impact
		try { fs.appendFile(sessionLogFile, line, { encoding: 'utf8', mode: 0o600, flag: 'a' }, () => {}); } catch (_) {}
		if (mainWindow && mainWindow.webContents) {
			mainWindow.webContents.send('app-log', { level, message, ts: Date.now() });
		}
	} catch (e) {
		// swallow
	}
}

// Account storage helpers
function getAccountsMap() {
    try { return store.get('accounts') || {}; } catch (_) { return {}; }
}
function saveAccountEntry(userEmail, norm, token) {
    const map = getAccountsMap();
    map[userEmail] = { client_id: norm.client_id, creds: norm, token };
    store.set('accounts', map);
}
function removeAccountEntry(userEmail) {
    const map = getAccountsMap();
    delete map[userEmail];
    store.set('accounts', map);
}

// Global error handlers with guidance
process.on('uncaughtException', (err) => {
	logEvent('error', 'uncaught-exception', { error: err.message, stack: err.stack });
	showPlatformGuidance('An unexpected error occurred', err);
});
process.on('unhandledRejection', (reason) => {
	const msg = (reason && reason.message) ? reason.message : String(reason);
	logEvent('error', 'unhandled-rejection', { error: msg });
	showPlatformGuidance('An unexpected error occurred', { message: msg });
});

function showPlatformGuidance(title, err) {
	try {
		const isWin = process.platform === 'win32';
		const isMac = process.platform === 'darwin';
		let message = `${err?.message || ''}`;
		message += `\n\nTroubleshooting steps:`;
		if (isWin) {
			message += `\n- If Windows Defender SmartScreen blocks the app, click More info > Run anyway.`;
			message += `\n- If you see permission issues, try running the installer as Administrator.`;
			message += `\n- Ensure your firewall or proxy allows the app to access the Internet.`;
		}
		if (isMac) {
			message += `\n- If macOS says the app is from an unidentified developer, right-click the app and click Open.`;
			message += `\n- In System Settings > Privacy & Security, allow the app to run if it was blocked.`;
			message += `\n- Ensure the app has network access and try again.`;
		}
		message += `\n- Check the in-app Logs panel for more details.`;
		dialog.showMessageBoxSync({ type: 'error', title, message });
	} catch (_) {}
}

ipcMain.handle('app-log-append', async (e, payload) => logEvent(payload?.level || 'info', payload?.message || '', payload?.meta || null));
ipcMain.handle('app-log-read', async () => {
	try {
		const content = fs.existsSync(sessionLogFile) ? fs.readFileSync(sessionLogFile, 'utf8') : '';
		return { success: true, content };
	} catch (e) { return { success: false, error: e.message }; }
});
ipcMain.handle('app-log-clear', async () => {
	try {
		if (fs.existsSync(sessionLogFile)) {
			fs.writeFileSync(sessionLogFile, '', 'utf8');
		}
		// Log the clear action
		logEvent('info', 'Session logs cleared by user');
		return { success: true };
	} catch (e) { return { success: false, error: e.message }; }
});

// Auto-update wiring
function initAutoUpdater() {
	try {
		if (isDev) { logEvent('info', 'AutoUpdater disabled in development'); return; }
		autoUpdater = require('electron-updater').autoUpdater;
		autoUpdater.autoDownload = false;
		        autoUpdater.setFeedURL({ provider: 'github', owner: 'Raylyrix', repo: 'TASKFORCE' });
		// Forward events to renderer
		autoUpdater.on('checking-for-update', () => { if (mainWindow) mainWindow.webContents.send('update-status', { status: 'checking' }); });
		autoUpdater.on('update-available', (info) => {
			// Update available
			if (mainWindow) mainWindow.webContents.send('update-status', { status: 'available', info });
			dialog.showMessageBox(mainWindow, {
				type: 'info',
				title: 'Update Available',
				message: `A new version (${info?.version}) is available. Download now?`,
				buttons: ['Download', 'Later']
			}).then(res => { if (res.response === 0) autoUpdater.downloadUpdate(); });
		});
		autoUpdater.on('update-not-available', (info) => { if (mainWindow) mainWindow.webContents.send('update-status', { status: 'none', info }); });
		autoUpdater.on('error', (err) => { logEvent('error', 'auto-updater-error', { error: err?.message }); if (mainWindow) mainWindow.webContents.send('update-status', { status: 'error', error: err?.message }); });
		autoUpdater.on('download-progress', (progress) => { if (mainWindow) mainWindow.webContents.send('update-status', { status: 'downloading', progress }); });
		autoUpdater.on('update-downloaded', (info) => {
			// Update downloaded
			if (mainWindow) mainWindow.webContents.send('update-status', { status: 'downloaded', info });
			try {
				const notes = (info?.releaseNotes && typeof info.releaseNotes === 'string') ? info.releaseNotes : '';
				dialog.showMessageBox(mainWindow, {
					type: 'info', title: `What's new in ${info?.version}`,
					message: 'Release Notes',
					detail: notes || 'The update has been downloaded.',
					buttons: ['Install', 'Later']
				}).then(res => { if (res.response === 0) autoUpdater.quitAndInstall(); });
			} catch (_) {
				dialog.showMessageBox(mainWindow, { type: 'info', title: 'Update Ready', message: 'The update has been downloaded. Install and restart now?', buttons: ['Install', 'Later'] }).then(res => { if (res.response === 0) autoUpdater.quitAndInstall(); });
			}
		});
		// Trigger initial check shortly after ready, but use channel tag version
		setTimeout(() => {
			try { autoUpdater.checkForUpdates(); } catch (_) {}
		}, 8000);
	} catch (e) {
		logEvent('error', 'auto-updater-init-failed', { error: e.message });
	}
}

ipcMain.handle('update-check', async () => { try { if (!autoUpdater) initAutoUpdater(); await autoUpdater.checkForUpdates(); return { success: true }; } catch (e) { return { success: false, error: e.message }; } });
ipcMain.handle('update-download', async () => { try { if (!autoUpdater) initAutoUpdater(); await autoUpdater.downloadUpdate(); return { success: true }; } catch (e) { return { success: false, error: e.message }; } });
ipcMain.handle('update-quit-and-install', async () => { try { if (!autoUpdater) initAutoUpdater(); autoUpdater.quitAndInstall(); return { success: true }; } catch (e) { return { success: false, error: e.message }; } });

// Local spreadsheet loader
ipcMain.handle('load-local-spreadsheet', async (e, filePath) => {
	try {
		await ensureServices().catch(() => {});
		const XLSX = require('xlsx');
		const wb = XLSX.readFile(filePath);
		const sheetName = wb.SheetNames[0];
		const ws = wb.Sheets[sheetName];
		const rows = XLSX.utils.sheet_to_json(ws, { header: 1 });
		if (!rows || !rows.length) throw new Error('No data in spreadsheet');
		const headers = rows[0];
		const body = rows.slice(1);
		logEvent('info', 'Loaded local spreadsheet', { filePath, rows: body.length, headers: headers.length });
		return { success: true, data: { headers, rows: body } };
	} catch (error) {
		logEvent('error', 'Local spreadsheet load failed', { error: error.message, filePath });
		return { success: false, error: error.message };
	}
});

function buildRawEmail({ from, to, subject, text, html, attachments }) {
	const wrap76 = (b64) => b64.replace(/.{1,76}/g, (m) => m + '\r\n');
	const boundaryMixed = 'mixed_' + Math.random().toString(36).slice(2);
	const boundaryAlt = 'alt_' + Math.random().toString(36).slice(2);
	let headers = [];
	if (from) headers.push(`From: ${from}`);
	headers.push(`To: ${to}`);
	headers.push(`Subject: ${subject}`);
	headers.push('MIME-Version: 1.0');

	const hasAttachments = attachments && attachments.length;
	const hasHtml = !!html && String(html).trim().length > 0;

	const buildAlternative = () => {
		let alt = '';
		alt += `--${boundaryAlt}\r\n`;
		alt += `Content-Type: text/plain; charset="UTF-8"\r\n`;
		alt += `Content-Transfer-Encoding: 7bit\r\n\r\n`;
		alt += (text || '') + `\r\n`;
		if (hasHtml) {
			alt += `--${boundaryAlt}\r\n`;
			alt += `Content-Type: text/html; charset="UTF-8"\r\n`;
			alt += `Content-Transfer-Encoding: 7bit\r\n\r\n`;
			alt += (html || '') + `\r\n`;
		}
		alt += `--${boundaryAlt}--\r\n`;
		return alt;
	};

	if (hasAttachments) {
		headers.push(`Content-Type: multipart/mixed; boundary="${boundaryMixed}"`);
		let body = '';
		body += `--${boundaryMixed}\r\n`;
		body += `Content-Type: multipart/alternative; boundary="${boundaryAlt}"\r\n\r\n`;
		body += buildAlternative();
		for (const p of attachments) {
			try {
				const data = fs.readFileSync(p);
				const filename = path.basename(p);
				const ctype = mime.lookup(filename) || 'application/octet-stream';
				body += `--${boundaryMixed}\r\n`;
				body += `Content-Type: ${ctype}; name="${filename}"\r\n`;
				body += `Content-Transfer-Encoding: base64\r\n`;
				body += `Content-Disposition: attachment; filename="${filename}"\r\n\r\n`;
				body += wrap76(data.toString('base64')) + `\r\n`;
			} catch (e) {
				logEvent('error', 'Attachment read failed', { path: p, error: e.message });
			}
		}
		body += `--${boundaryMixed}--\r\n`;
		return headers.join('\r\n') + '\r\n\r\n' + body;
	}

	if (hasHtml) {
		headers.push(`Content-Type: multipart/alternative; boundary="${boundaryAlt}"`);
		const body = buildAlternative();
		return headers.join('\r\n') + '\r\n\r\n' + body;
	}

	headers.push('Content-Type: text/plain; charset="UTF-8"');
	headers.push('Content-Transfer-Encoding: 7bit');
	return headers.join('\r\n') + '\r\n\r\n' + (text || '');
}

async function sendTestEmail(emailData) {
	try {
		if (isOAuthAvailable()) {
			await ensureServices();
			logEvent('info', 'Sending test email (OAuth)', { to: emailData.to, attachments: (emailData.attachmentsPaths || []).length });
			const rawStr = buildRawEmail({
				from: emailData.from,
				to: emailData.to,
				subject: emailData.subject,
				text: emailData.content,
				html: emailData.html,
				attachments: emailData.attachmentsPaths || []
			});
			const res = await gmailService.users.messages.send({ userId: 'me', requestBody: { raw: toBase64Url(rawStr) } });
			logEvent('info', 'Test email sent', { to: emailData.to, id: res.data.id });
			// Test email sent
			return { success: true, messageId: res.data.id };
		}
		await ensureMailer();
		const email = getActiveSmtpEmail();
		const creds = email && getSmtpCreds(email);
		if (!creds) throw new Error('Not authenticated (SMTP). Please login with Gmail App Password.');
		const transporter = nodemailer.createTransport({ host: 'smtp.gmail.com', port: 465, secure: true, auth: { user: creds.email, pass: creds.appPassword } });
		const attachments = await Promise.all((emailData.attachmentsPaths || []).map(async (p) => ({ filename: require('path').basename(p), content: await require('fs').promises.readFile(p) })));
		const info = await transporter.sendMail({ from: emailData.from || creds.email, to: emailData.to, subject: emailData.subject, text: emailData.content, html: emailData.html, attachments });
		logEvent('info', 'Test email sent (SMTP)', { to: emailData.to, id: info.messageId });
		// Test email sent via SMTP
		return { success: true, messageId: info.messageId };
	} catch (error) {
		console.error('Email sending error:', error);
		logEvent('error', 'Email sending error', { error: error.message, to: emailData?.to });
		// Email send error
		return { success: false, error: error.message };
	}
}

// Tab-based email sending function
async function sendEmailWithTab(emailData, tabId) {
	try {
		const tabData = tabServices.get(tabId);
		if (!tabData || !tabData.gmailService) {
			return { success: false, error: 'Tab not authenticated' };
		}
		
		// Check if tab is already sending emails
		const tabOps = tabOperations.get(tabId) || { isSending: false, isScheduling: false };
		if (tabOps.isSending) {
			return { success: false, error: 'Tab is already sending emails. Please wait.' };
		}
		
		// Mark tab as sending
		tabOps.isSending = true;
		tabOperations.set(tabId, tabOps);
		
		logEvent('info', 'Sending email from tab (OAuth)', { to: emailData.to, attachments: (emailData.attachmentsPaths || []).length, tabId });
		const rawStr = buildRawEmail({
			from: emailData.from,
			to: emailData.to,
			subject: emailData.subject,
			text: emailData.content,
			html: emailData.html,
			attachments: emailData.attachmentsPaths || []
		});
		const res = await tabData.gmailService.users.messages.send({ userId: 'me', requestBody: { raw: toBase64Url(rawStr) } });
		logEvent('info', 'Email sent from tab', { to: emailData.to, id: res.data.id, tabId });
		
		// Mark tab as not sending
		tabOps.isSending = false;
		tabOperations.set(tabId, tabOps);
		
		return { success: true, messageId: res.data.id };
	} catch (error) {
		console.error('Tab email sending error:', error);
		logEvent('error', 'Tab email sending error', { error: error.message, to: emailData?.to, tabId });
		
		// Mark tab as not sending on error
		const tabOps = tabOperations.get(tabId) || { isSending: false, isScheduling: false };
		tabOps.isSending = false;
		tabOperations.set(tabId, tabOps);
		
		return { success: false, error: error.message };
	}
}

// Tab-based campaign execution
async function executeCampaignRunWithTab(params, tabId) {
	const tabData = tabServices.get(tabId);
	if (!tabData || !tabData.gmailService || !tabData.sheetsService) {
		throw new Error('Tab not authenticated or services not available');
	}
	
	// Check if tab is already running a campaign
	const tabOps = tabOperations.get(tabId) || { isSending: false, isScheduling: false };
	if (tabOps.isScheduling) {
		throw new Error('Tab is already running a campaign. Please wait.');
	}
	
	// Mark tab as running campaign
	tabOps.isScheduling = true;
	tabOperations.set(tabId, tabOps);
	
	try {
		const { sheetId, sheetTitle, subject, content, html, from, attachmentsPaths, delaySeconds, useSignature } = params;
		const range = sheetTitle ? `${sheetTitle}!A:Z` : 'A:Z';
		const res = await tabData.sheetsService.spreadsheets.values.get({ spreadsheetId: sheetId, range });
		const values = res.data.values || [];
		if (!values.length) throw new Error('No data found in sheet');
		const headers = values[0];
		const rows = values.slice(1);
		const emailIdx = findEmailColumnIndex(headers);
		if (emailIdx < 0) throw new Error('No Email column found');
		
		// Get signature for HTML emails
		const signatureHtml = useSignature ? await getPrimarySignature() : '';
		
		for (let i = 0; i < rows.length; i++) {
			const row = rows[i];
			const to = row[emailIdx];
			if (!to) continue;
			
			// Process content with placeholders
			const text = renderWithRow(content, headers, row, '');
			
			// Process HTML content with placeholders and signature
			let finalHtml = '';
			if (html) {
				// Replace placeholders in HTML content
				let processedHtml = html;
				headers.forEach((header, idx) => {
					const value = row[idx] || '';
					const placeholder = `((${header}))`;
					processedHtml = processedHtml.replace(new RegExp(placeholder.replace(/[.*+?^${}()|[\]\\]/g, '\\$&'), 'g'), value);
				});
				
				// Add signature if enabled
				if (signatureHtml && useSignature) {
					finalHtml = `<div>${processedHtml}</div><div style="margin-top: 20px; border-top: 1px solid #e0e0e0; padding-top: 20px;">${signatureHtml}</div>`;
				} else {
					finalHtml = processedHtml;
				}
			}
			
			// Add signature to text content if enabled
			let finalText = text;
			if (signatureHtml && useSignature) {
				// Convert HTML signature to plain text for text version
				const textSignature = signatureHtml.replace(/<[^>]*>/g, '').replace(/&nbsp;/g, ' ').replace(/&amp;/g, '&').replace(/&lt;/g, '<').replace(/&gt;/g, '>');
				finalText = `${text}\n\n${textSignature}`;
			}
			
			const rawStr = buildRawEmail({ 
				from, 
				to, 
				subject, 
				text: finalText, 
				html: finalHtml, 
				attachments: attachmentsPaths || [] 
			});
			
			await tabData.gmailService.users.messages.send({ userId: 'me', requestBody: { raw: toBase64Url(rawStr) } });
			
			try {
				await updateSheetStatus(sheetId, sheetTitle || 'Sheet1', headers, i, 'SENT');
			} catch (_) {}
			
			const jitter = Math.floor(Math.random() * 2000);
			await new Promise(r => setTimeout(r, (delaySeconds || 5) * 1000 + jitter));
		}
		
		logEvent('info', 'Tab campaign completed', { recipients: rows.length, tabId });
	} catch (error) {
		console.error('Tab campaign execution error:', error);
		logEvent('error', 'Tab campaign execution error', { error: error.message, tabId });
		throw error;
	} finally {
		// Mark tab as not running campaign
		const tabOps = tabOperations.get(tabId) || { isSending: false, isScheduling: false };
		tabOps.isScheduling = false;
		tabOperations.set(tabId, tabOps);
	}
}

async function sendEmail(emailData) {
	try {
		if (isOAuthAvailable()) {
			await ensureServices();
			logEvent('info', 'Sending email (OAuth)', { to: emailData.to, attachments: (emailData.attachmentsPaths || []).length });
			const rawStr = buildRawEmail({
				from: emailData.from,
				to: emailData.to,
				subject: emailData.subject,
				text: emailData.content,
				html: emailData.html,
				attachments: emailData.attachmentsPaths || []
			});
			const res = await gmailService.users.messages.send({ userId: 'me', requestBody: { raw: toBase64Url(rawStr) } });
			logEvent('info', 'Email sent', { to: emailData.to, id: res.data.id });
			// Email sent
			return { success: true, messageId: res.data.id };
		}
		await ensureMailer();
		const email = getActiveSmtpEmail();
		const creds = email && getSmtpCreds(email);
		if (!creds) throw new Error('Not authenticated (SMTP). Please login with Gmail App Password.');
		const transporter = nodemailer.createTransport({ host: 'smtp.gmail.com', port: 465, secure: true, auth: { user: creds.email, pass: creds.appPassword } });
		const attachments = await Promise.all((emailData.attachmentsPaths || []).map(async (p) => ({ filename: require('path').basename(p), content: await require('fs').promises.readFile(p) })));
		const info = await transporter.sendMail({ from: emailData.from || creds.email, to: emailData.to, subject: emailData.subject, text: emailData.content, html: emailData.html, attachments });
		logEvent('info', 'Email sent (SMTP)', { to: emailData.to, id: info.messageId });
		// Email sent via SMTP
		return { success: true, messageId: info.messageId };
	} catch (error) {
		console.error('Email sending error:', error);
		logEvent('error', 'Email sending error', { error: error.message, to: emailData?.to });
		// Email send error
		return { success: false, error: error.message };
	}
}

function findEmailColumnIndex(headers) {
	if (!headers) return -1;
	const lower = headers.map(h => String(h).toLowerCase());
	let idx = lower.findIndex(h => h.includes('email'));
	return idx;
}

function renderWithRow(content, headers, row, signature) {
	let out = content;
	headers.forEach((h, i) => {
		const key = String(h).trim();
		const re = new RegExp(`\\(\\(${key.replace(/[-/\\^$*+?.()|[\]{}]/g, '\\$&')}\\)\\)`, 'g');
		out = out.replace(re, row[i] != null ? String(row[i]) : '');
	});
	if (signature) out = out + '\n\n' + signature.replace(/<[^>]+>/g, '');
	return out;
}

async function executeCampaignRun(params) {
	try {
		await ensureServices();
		const { sheetId, sheetTitle, subject, content, html, from, attachmentsPaths, delaySeconds, useSignature } = params;
		const range = sheetTitle ? `${sheetTitle}!A:Z` : 'A:Z';
		const res = await sheetsService.spreadsheets.values.get({ spreadsheetId: sheetId, range });
		const values = res.data.values || [];
		if (!values.length) throw new Error('No data found in sheet');
		const headers = values[0];
		const rows = values.slice(1);
		const emailIdx = findEmailColumnIndex(headers);
		if (emailIdx < 0) throw new Error('No Email column found');
		
		// Get signature for HTML emails
		const signatureHtml = useSignature ? await getPrimarySignature() : '';
		
		for (let i = 0; i < rows.length; i++) {
			const row = rows[i];
			const to = row[emailIdx];
			if (!to) continue;
			
			// Process content with placeholders
			const text = renderWithRow(content, headers, row, '');
			
			// Process HTML content with placeholders and signature
			let finalHtml = '';
			if (html) {
				// Replace placeholders in HTML content
				let processedHtml = html;
				headers.forEach((header, idx) => {
					const value = row[idx] || '';
					const placeholder = `((${header}))`;
					processedHtml = processedHtml.replace(new RegExp(placeholder.replace(/[.*+?^${}()|[\]\\]/g, '\\$&'), 'g'), value);
				});
				
				// Add signature if enabled
				if (signatureHtml && useSignature) {
					finalHtml = `<div>${processedHtml}</div><div style="margin-top: 20px; border-top: 1px solid #e0e0e0; padding-top: 20px;">${signatureHtml}</div>`;
				} else {
					finalHtml = processedHtml;
				}
			}
			
			// Add signature to text content if enabled
			let finalText = text;
			if (signatureHtml && useSignature) {
				// Convert HTML signature to plain text for text version
				const textSignature = signatureHtml.replace(/<[^>]*>/g, '').replace(/&nbsp;/g, ' ').replace(/&amp;/g, '&').replace(/&lt;/g, '<').replace(/&gt;/g, '>');
				finalText = `${text}\n\n${textSignature}`;
			}
			
			const rawStr = buildRawEmail({ 
				from, 
				to, 
				subject, 
				text: finalText, 
				html: finalHtml, 
				attachments: attachmentsPaths || [] 
			});
			
			await gmailService.users.messages.send({ userId: 'me', requestBody: { raw: toBase64Url(rawStr) } });
			
			try {
				await updateSheetStatus(sheetId, sheetTitle || 'Sheet1', headers, i, 'SENT');
			} catch (_) {}
			
			const jitter = Math.floor(Math.random() * 2000);
			await new Promise(r => setTimeout(r, (delaySeconds || 5) * 1000 + jitter));
		}
		
		// Campaign run
		logEvent('info', 'Campaign completed', { recipients: rows.length });
	} catch (error) {
		logEvent('error', 'Campaign failed', { error: error.message });
		throw error;
	}
}

function scheduleOneTimeCampaign(params) {
	const id = 'job_' + Date.now() + '_' + Math.random().toString(36).slice(2);
	const startAt = new Date(params.startAt).getTime();
	const now = Date.now();
	const ms = Math.max(0, startAt - now);
	const timer = setTimeout(async () => {
		try { 
			if (params.tabId) {
				await executeCampaignRunWithTab(params, params.tabId);
			} else {
				await executeCampaignRun(params);
			}
		} catch (e) { 
			console.error('Scheduled run failed:', e); 
			logEvent('error', 'Scheduled run failed', { error: e.message, tabId: params.tabId }); 
		}
		finally { getJobsMap().delete(id); }
	}, ms);
	getJobsMap().set(id, { id, type: 'one-time', startAt, params, timer });
	// Campaign scheduled
	return { id, startAt };
}

function listScheduledJobs() {
	const jobs = getJobsMap();
	return Array.from(jobs.values()).map(j => ({ id: j.id, type: j.type, startAt: j.startAt, sheetId: j.params?.sheetId, subject: j.params?.subject }));
}

function cancelScheduledJob(id) {
	const jobs = getJobsMap();
	const job = jobs.get(id);
	if (!job) return false;
	clearTimeout(job.timer);
	jobs.delete(id);
	return true;
}

// IPC Handlers
ipcMain.handle('updateClientCredentials', async (event, credentialsData) => updateClientCredentials(credentialsData));
ipcMain.handle('authenticateGoogle', async (event, credentialsData) => authenticateGoogle(credentialsData));
ipcMain.handle('authenticateGoogleWithTab', async (event, credentialsData, tabId) => authenticateGoogleWithTab(credentialsData, tabId));
ipcMain.handle('sendEmailWithTab', async (event, emailData, tabId) => sendEmailWithTab(emailData, tabId));
ipcMain.handle('initializeGmailService', async () => initializeGmailService());
ipcMain.handle('initializeSheetsService', async () => initializeSheetsService());
ipcMain.handle('connectToSheets', async (event, payload) => connectToSheets(payload));
ipcMain.handle('auth-logout', async () => {
    try {
        try { store.delete('googleToken'); } catch (_) {}
        try { store.set('app-settings', { isAuthenticated: false, currentAccount: null }); } catch (_) {}
        try { store.set('telemetry.enabled', false); } catch (_) {}
        oauth2Client = null; gmailService = null; sheetsService = null;
        if (mainWindow && mainWindow.webContents) mainWindow.webContents.send('auth-logout');
        return { success: true };
    } catch (e) {
        return { success: false, error: e.message };
    }
});
ipcMain.handle('sendTestEmail', async (event, emailData) => sendTestEmail(emailData));
ipcMain.handle('sendEmail', async (event, emailData) => sendEmail(emailData));
ipcMain.handle('gmail-list-send-as', async (event, tabId) => listSendAs(tabId));
ipcMain.handle('gmail-get-signature', async (event, tabId) => getPrimarySignature(tabId));
ipcMain.handle('sheets-list-tabs', async (e, sheetId) => listSheets(sheetId));
ipcMain.handle('sheets-update-status', async (e, args) => updateSheetStatus(args.sheetId, args.sheetTitle, args.headers, args.rowIndexZeroBased, args.status));
ipcMain.handle('show-open-dialog', async (e, options) => dialog.showOpenDialog(mainWindow, options));
ipcMain.handle('show-save-dialog', async (e, options) => dialog.showSaveDialog(mainWindow, options));
ipcMain.handle('show-message-box', async (e, options) => dialog.showMessageBox(mainWindow, options));
// Accounts IPC
ipcMain.handle('accounts-list', async () => {
    const map = getAccountsMap();
    const list = Object.keys(map);
    const smtpEmail = getActiveSmtpEmail();
    if (smtpEmail && !list.includes(smtpEmail)) list.unshift(smtpEmail);
    return list;
});

// Auth status IPC
ipcMain.handle('auth-current-user', async () => {
    try {
        if (isOAuthAvailable()) {
            await ensureServices();
            const profile = await gmailService.users.getProfile({ userId: 'me' });
            return { authenticated: true, email: profile?.data?.emailAddress || null };
        }
        const email = getActiveSmtpEmail();
        return { authenticated: !!email, email: email || null };
    } catch (e) {
        return { authenticated: false, error: e.message };
    }
});
ipcMain.handle('accounts-use', async (_e, email) => {
    const map = getAccountsMap();
    const entry = map[email];
    if (!entry) {
        const creds = getSmtpCreds(email);
        if (creds) { setActiveSmtpEmail(email); oauth2Client = null; gmailService = null; sheetsService = null; return { success: true }; }
        return { success: false, error: 'Account not found' };
    }
    try {
        store.set('googleCreds', entry.creds);
        store.set('googleToken', entry.token);
        store.set('googleTokenClientId', entry.client_id);
        // Reset clients so next call uses this token
        oauth2Client = null; gmailService = null; sheetsService = null;
        await ensureServices();
        return { success: true };
    } catch (e) {
        return { success: false, error: e.message };
    }
});

ipcMain.handle('write-file', async (e, args) => {
	try { await fs.promises.writeFile(args.path, args.content, 'utf8'); return { success: true }; }
	catch (error) { logEvent('error', 'Write file failed', { error: error.message, path: args.path }); return { success: false, error: error.message }; }
});

ipcMain.handle('read-json-file', async (e, filePath) => {
	try { const txt = await fs.promises.readFile(filePath, 'utf8'); const obj = JSON.parse(txt); return { success: true, data: obj }; }
	catch (error) { logEvent('error', 'Read JSON failed', { error: error.message, path: filePath }); return { success: false, error: error.message }; }
});

ipcMain.handle('schedule-campaign-one-time', async (e, params) => scheduleOneTimeCampaign(params));
ipcMain.handle('schedule-list', async () => listScheduledJobs());
ipcMain.handle('schedule-cancel', async (e, id) => cancelScheduledJob(id));

// Store handlers
ipcMain.handle('storeGet', async (event, key) => store.get(key));
ipcMain.handle('storeSet', async (event, key, value) => { store.set(key, value); return true; });
ipcMain.handle('storeDelete', async (event, key) => { store.delete(key); return true; });

// Template management under user data
function getTemplatesDir() {
	const dir = path.join(app.getPath('userData'), 'templates');
	try { fs.mkdirSync(dir, { recursive: true }); } catch (_) {}
	return dir;
}
function sanitizeName(name) {
	return String(name || 'template').replace(/[^a-z0-9-_]+/gi, '_').slice(0, 80);
}
ipcMain.handle('templates-list', async () => {
	const dir = getTemplatesDir();
	const files = fs.readdirSync(dir).filter(f => f.toLowerCase().endsWith('.json'));
	return files.map(f => ({ id: path.join(dir, f), name: path.basename(f, '.json'), path: path.join(dir, f) }));
});
ipcMain.handle('templates-save', async (e, args) => {
	try {
		const dir = getTemplatesDir();
		const fname = sanitizeName(args.name) + '.json';
		const fpath = path.join(dir, fname);
		await fs.promises.writeFile(fpath, JSON.stringify(args.data || {}, null, 2), 'utf8');
		return { success: true, path: fpath };
	} catch (error) {
		logEvent('error', 'Template save failed', { error: error.message });
		return { success: false, error: error.message };
	}
});
ipcMain.handle('templates-load', async (e, fpath) => {
	try {
		const txt = await fs.promises.readFile(fpath, 'utf8');
		return { success: true, data: JSON.parse(txt) };
	} catch (error) {
		logEvent('error', 'Template load failed', { error: error.message, path: fpath });
		return { success: false, error: error.message };
	}
});
ipcMain.handle('templates-delete', async (e, fpath) => {
	try { await fs.promises.unlink(fpath); return { success: true }; }
	catch (error) { return { success: false, error: error.message }; }
});

// SMTP/App Password IPC
ipcMain.handle('smtp-save-creds', async (_e, { email, appPassword }) => {
    try {
        if (!email || !appPassword) return { success: false, error: 'Email and App Password required' };
        await ensureMailer();
        // Verify Gmail App Password by logging in (no mail sent)
        const transporter = nodemailer.createTransport({
            host: 'smtp.gmail.com', port: 465, secure: true,
            auth: { user: email, pass: appPassword },
            connectionTimeout: 15000,
        });
        await transporter.verify();
        saveSmtpCreds(email, appPassword);
        logEvent('info', 'SMTP credentials verified & saved', { email: email.replace(/(.{2}).+(@.*)/, '$1***$2') });
        return { success: true };
    } catch (e) {
        logEvent('error', 'SMTP verify failed', { error: e.message });
        return { success: false, error: 'Login failed: ' + (e?.message || 'invalid credentials') };
    }
});
ipcMain.handle('smtp-clear-creds', async (_e, email) => {
    try { clearSmtpCreds(email); return { success: true }; } catch (e) { return { success: false, error: e.message }; }
});
ipcMain.handle('smtp-extract-signature', async (_e, email) => {
    try {
        const creds = getSmtpCreds(email || getActiveSmtpEmail());
        if (!creds) return { success: false, error: 'Not authenticated (SMTP)' };
        await ensureImap();
        const client = new ImapFlow({ host: 'imap.gmail.com', port: 993, secure: true, auth: { user: creds.email, pass: creds.appPassword } });
        await client.connect();
        let mailbox = '[Gmail]/Sent Mail';
        try { await client.mailboxOpen(mailbox, { readOnly: true }); }
        catch (_) { mailbox = 'Sent'; await client.mailboxOpen(mailbox, { readOnly: true }); }
        const lock = await client.getMailboxLock(mailbox);
        let signatureText = '';
        try {
            const seq = await client.search({ seen: true }, { uid: true, limit: 10, sort: ['arrived'] });
            for (let i = seq.length - 1; i >= 0; i--) {
                let body = '';
                try {
                    const part = await client.download(seq[i], '1');
                    body = await streamToString(part);
                } catch (_) {}
                if (!body) continue;
                const lines = body.split(/\r?\n/);
                const tail = lines.slice(-15);
                const filtered = tail.filter(l => l.trim().length > 0 && l.length <= 200);
                const candidate = filtered.join('\n');
                if (candidate && candidate.length >= 20) { signatureText = candidate; break; }
            }
        } finally {
            lock.release();
            await client.logout().catch(() => {});
        }
        if (signatureText) {
            store.set(`smtp.signature.${creds.email}`, signatureText);
            return { success: true, signature: signatureText };
        }
        return { success: false, error: 'No signature detected from recent sent emails' };
    } catch (e) {
        return { success: false, error: e.message };
    }
});

async function streamToString(stream) {
    return await new Promise((resolve, reject) => {
        let data = '';
        stream.on('data', (chunk) => { data += chunk.toString('utf8'); });
        stream.on('end', () => resolve(data));
        stream.on('error', (err) => reject(err));
    });
}

// Signature management
function getSignaturesDir() {
	const dir = path.join(app.getPath('userData'), 'signatures');
	try { fs.mkdirSync(dir, { recursive: true }); } catch (_) {}
	return dir;
}

function sanitizeSignatureName(name) {
	return String(name || 'signature').replace(/[^a-z0-9-_]+/gi, '_').slice(0, 80);
}

ipcMain.handle('signatures-list', async () => {
	try {
		const dir = getSignaturesDir();
		const files = fs.readdirSync(dir).filter(f => f.toLowerCase().endsWith('.json'));
		return files.map(f => ({ 
			id: path.join(dir, f), 
			name: path.basename(f, '.json'), 
			path: path.join(dir, f) 
		}));
	} catch (error) {
		logEvent('error', 'Failed to list signatures', { error: error.message });
		return [];
	}
});

ipcMain.handle('signatures-save', async (e, args) => {
	try {
		const dir = getSignaturesDir();
		const fname = sanitizeSignatureName(args.name) + '.json';
		const fpath = path.join(dir, fname);
		const signatureData = {
			name: args.name,
			html: args.html || '',
			text: args.text || '',
			ts: Date.now()
		};
		await fs.promises.writeFile(fpath, JSON.stringify(signatureData, null, 2), 'utf8');
		return { success: true, path: fpath };
	} catch (error) {
		logEvent('error', 'Signature save failed', { error: error.message });
		return { success: false, error: error.message };
	}
});

ipcMain.handle('signatures-load', async (e, fpath) => {
	try {
		const txt = await fs.promises.readFile(fpath, 'utf8');
		return { success: true, data: JSON.parse(txt) };
	} catch (error) {
		logEvent('error', 'Signature load failed', { error: error.message, path: fpath });
		return { success: false, error: error.message };
	}
});

ipcMain.handle('signatures-delete', async (e, fpath) => {
	try {
		await fs.promises.unlink(fpath);
		return { success: true };
	} catch (error) {
		return { success: false, error: error.message };
	}
});

ipcMain.handle('signatures-get-default', async () => {
	try {
		const dir = getSignaturesDir();
		const files = fs.readdirSync(dir).filter(f => f.toLowerCase().endsWith('.json'));
		if (files.length === 0) return { success: false, error: 'No signatures found' };
		
		// Get the most recently modified signature
		let latestFile = null;
		let latestTime = 0;
		for (const file of files) {
			const filePath = path.join(dir, file);
			try {
				const stats = fs.statSync(filePath);
				if (stats.mtime.getTime() > latestTime) {
					latestTime = stats.mtime.getTime();
					latestFile = filePath;
				}
			} catch (_) {}
		}
		
		if (latestFile) {
			const txt = await fs.promises.readFile(latestFile, 'utf8');
			return { success: true, data: JSON.parse(txt) };
		}
		return { success: false, error: 'No signatures found' };
	} catch (error) {
		return { success: false, error: error.message };
	}
});

// App info handlers for preload
ipcMain.handle('get-app-version', async () => app.getVersion());
ipcMain.handle('get-app-name', async () => app.getName());

// Generate unique app identifier for macOS signature
function getAppIdentifier() {
	const id = store.get('appIdentifier');
	if (!id) {
		const newId = 'com.rtxinnovations.taskforce.' + Date.now().toString(36);
		store.set('appIdentifier', newId);
		return newId;
	}
	return id;
}

// Improve compatibility on some GPUs (blank/invisible window)
try {
    app.commandLine.appendSwitch('force_low_power_gpu');
    app.commandLine.appendSwitch('disable-features', 'CalculateNativeWinOcclusion');
    app.disableHardwareAcceleration();
} catch (_) {}

// Ensure single instance; focus existing window on second launch
const gotTheLock = app.requestSingleInstanceLock();
if (!gotTheLock) {
  try { app.quit(); } catch(_) {}
}
app.on('second-instance', () => {
  try {
    if (mainWindow) {
      if (!mainWindow.isVisible()) mainWindow.show();
      mainWindow.focus();
    } else {
      createWindow();
    }
  } catch (_) {}
});

app.whenReady().then(() => {
	try { if (process.platform === 'win32') app.setAppUserModelId('com.rtxinnovations.taskforce'); } catch (_) {}
	try { if (process.platform === 'darwin') app.setAppUserModelId(getAppIdentifier()); } catch (_) {}
	try { createWindow(); } catch (e) { logEvent('error', 'createWindow-failed', { error: e.message }); }
	// startTelemetry(); // Telemetry disabled
	initAutoUpdater();
	if (process.platform === 'darwin') {
    app.on('activate', () => { if (BrowserWindow.getAllWindows().length === 0) createWindow(); });
  }
});
app.on('window-all-closed', () => { if (process.platform !== 'darwin') app.quit(); });
app.on('activate', () => { if (BrowserWindow.getAllWindows().length === 0) createWindow(); });
app.on('before-quit', () => { if (mainWindow && mainWindow.webContents) mainWindow.webContents.send('app-quitting'); try { flushTelemetry(); } catch (_) {} }); 