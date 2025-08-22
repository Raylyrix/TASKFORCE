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

// Embedded default OAuth credentials (obfuscated pieces)
function getEmbeddedDefaultCredentials() {
    // Use the exact credentials provided by the user
    const id = ['817286133901-77vi2ruk7k8etatv2hfeeshaqmc85e5h','.apps.googleusercontent.com'].join('');
    const secret = ['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'].join('');
    return {
        installed: {
            client_id: id,
            project_id: 'taskforce-1',
            auth_uri: 'https://accounts.google.com/o/oauth2/auth',
            token_uri: 'https://oauth2.googleapis.com/token',
            auth_provider_x509_cert_url: 'https://www.googleapis.com/oauth2/v1/certs',
            client_secret: secret,
            redirect_uris: ['http://localhost:8080']
        }
    };
}

function loadDefaultOAuthCredentials() {
    try {
        console.log('🔍 Looking for OAuth credentials...');
        
        // First, check if there's a credentials file in the user data directory
        const userDataPath = app.getPath('userData');
        const credsPath = path.join(userDataPath, 'client_secret.json');
        
        if (fs.existsSync(credsPath)) {
            console.log('✅ Found credentials file in user data directory');
            try {
                const obj = JSON.parse(fs.readFileSync(credsPath, 'utf8'));
                console.log('✅ Successfully loaded credentials from user data');
                return obj;
            } catch (e) {
                console.warn('⚠️ Failed to parse credentials from user data:', e.message);
            }
        }
        
        // Check environment variable
        const inputPath = process.env.TF_DEFAULT_OAUTH_JSON;
        if (inputPath) {
            console.log(`🔍 Checking environment path: ${inputPath}`);
            if (fs.existsSync(inputPath)) {
                const stat = fs.statSync(inputPath);
                if (stat.isDirectory()) {
                    const files = fs.readdirSync(inputPath).filter(f => f.toLowerCase().endsWith('.json'));
                    const pick = files.find(f => /oauth|client_secret|credentials/i.test(f)) || files[0];
                    if (pick) {
                        console.log(`✅ Found credentials file: ${pick}`);
                        const obj = JSON.parse(fs.readFileSync(path.join(inputPath, pick), 'utf8'));
                        return obj;
                    }
                } else {
                    console.log(`✅ Found credentials file: ${inputPath}`);
                    const obj = JSON.parse(fs.readFileSync(inputPath, 'utf8'));
                    return obj;
                }
            }
        }
        
        // Check current working directory for credentials files
        const cwd = process.cwd();
        const cwdFiles = fs.readdirSync(cwd).filter(f => f.toLowerCase().endsWith('.json') && /oauth|client_secret|credentials/i.test(f));
        if (cwdFiles.length > 0) {
            console.log(`✅ Found credentials file in CWD: ${cwdFiles[0]}`);
            try {
                const obj = JSON.parse(fs.readFileSync(path.join(cwd, cwdFiles[0]), 'utf8'));
                return obj;
            } catch (e) {
                console.warn('⚠️ Failed to parse credentials from CWD:', e.message);
            }
        }
        
        console.log('🔄 Falling back to embedded credentials');
        return getEmbeddedDefaultCredentials();
    } catch (error) {
        console.error('❌ Error loading OAuth credentials:', error);
        console.log('🔄 Falling back to embedded credentials');
        return getEmbeddedDefaultCredentials();
    }
}

// Function to copy credentials file to user data directory for persistent access
function copyCredentialsToUserData() {
    try {
        const userDataPath = app.getPath('userData');
        const credsPath = path.join(userDataPath, 'client_secret.json');
        
        // Check if credentials already exist in user data
        if (fs.existsSync(credsPath)) {
            console.log('✅ Credentials already exist in user data directory');
            return true;
        }
        
        // Look for credentials in current working directory
        const cwd = process.cwd();
        const cwdFiles = fs.readdirSync(cwd).filter(f => f.toLowerCase().endsWith('.json') && /oauth|client_secret|credentials/i.test(f));
        
        if (cwdFiles.length > 0) {
            const sourceFile = path.join(cwd, cwdFiles[0]);
            console.log(`📋 Copying credentials from: ${sourceFile}`);
            
            try {
                // Read and validate the credentials file
                const credsContent = fs.readFileSync(sourceFile, 'utf8');
                const creds = JSON.parse(credsContent);
                
                // Validate that it has the required fields
                if (creds.installed && creds.installed.client_id && creds.installed.client_secret) {
                    // Copy to user data directory
                    fs.writeFileSync(credsPath, credsContent);
                    console.log('✅ Credentials copied to user data directory');
                    return true;
                } else if (creds.client_id && creds.client_secret) {
                    // Alternative format
                    fs.writeFileSync(credsPath, credsContent);
                    console.log('✅ Credentials copied to user data directory');
                    return true;
                } else {
                    console.warn('⚠️ Credentials file missing required fields');
                    return false;
                }
            } catch (e) {
                console.error('❌ Failed to copy credentials:', e.message);
                return false;
            }
        }
        
        return false;
    } catch (error) {
        console.error('❌ Error copying credentials:', error);
        return false;
    }
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
	const redirectUri = hasLocalhost && Array.isArray(creds.redirect_uris) ? creds.redirect_uris.find(u => /^http:\/\/(localhost|127\.0\.0\.1)(:|\/|$)/.test(u)) : null;
	return { client_id: creds.client_id, client_secret: creds.client_secret, redirect_uri: redirectUri, fixed: false, host: hasLocalhost ? 'localhost' : '127.0.0.1' };
}

function buildOAuthClient(norm, redirectUriOverride) {
	// For desktop apps, Google automatically handles redirect URIs
	// Use the redirect URI from credentials or default to localhost
	const redirect = redirectUriOverride || norm.redirect_uri || 'http://localhost';
	return new google.auth.OAuth2(norm.client_id, norm.client_secret, redirect);
}

// Function to validate OAuth token
async function validateToken(oauth2Client) {
	try {
		// Try to make a simple API call to validate the token
		const gmail = google.gmail({ version: 'v1', auth: oauth2Client });
		await gmail.users.getProfile({ userId: 'me' });
		return true;
	} catch (error) {
		logEvent('info', 'Token validation failed', { error: error.message });
		return false;
	}
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

async function ensureServicesForTab(tabId, norm, token) {
	const tabOAuthClient = buildOAuthClient(norm);
	tabOAuthClient.setCredentials(token);
	
	// Clear any existing services for this tab to force re-auth if token changed
	const tabGmailServiceKey = `gmailService_${tabId}`;
	const tabSheetsServiceKey = `sheetsService_${tabId}`;
	store.delete(tabGmailServiceKey);
	store.delete(tabSheetsServiceKey);

	store.set(tabGmailServiceKey, google.gmail({ version: 'v1', auth: tabOAuthClient }));
	store.set(tabSheetsServiceKey, google.sheets({ version: 'v4', auth: tabOAuthClient }));
}

function getGmailServiceForTab(tabId) {
	return store.get(`gmailService_${tabId}`);
}

function getSheetsServiceForTab(tabId) {
	return store.get(`sheetsService_${tabId}`);
}

// Google API Integration
async function authenticateGoogle(credentialsData, tabId = 'main') {
	try {
		console.log(`🔐 Starting authentication for tab: ${tabId}`);
		console.log(`📋 Credentials data:`, credentialsData ? 'provided' : 'using defaults');
		
		let norm;
		if (credentialsData && Object.keys(credentialsData || {}).length) {
			console.log(`✅ Using provided credentials for tab ${tabId}`);
			norm = normalizeCredentials(credentialsData);
		} else {
			console.log(`🔄 Loading default credentials for tab ${tabId}`);
			const def = (typeof loadDefaultOAuthCredentials === 'function') ? loadDefaultOAuthCredentials() : null;
			if (!def) {
				console.error(`❌ No default OAuth credentials available for tab ${tabId}`);
				throw new Error('Default OAuth credentials not configured');
			}
			norm = normalizeCredentials(def);
		}
		
		// Validate credentials before proceeding
		if (!norm.client_id || !norm.client_secret) {
			console.error(`❌ Invalid credentials for tab ${tabId}:`, { 
				hasClientId: !!norm.client_id, 
				hasClientSecret: !!norm.client_secret 
			});
			throw new Error('Invalid credentials: missing client_id or client_secret');
		}
		
		console.log(`✅ Credentials validated for tab ${tabId}, client_id: ${norm.client_id.substring(0, 10)}...`);
		
		// Store credentials per tab
		const tabCredsKey = `googleCreds_${tabId}`;
		store.set(tabCredsKey, norm);
		console.log(`💾 Credentials stored for tab ${tabId}`);

		// Check for existing valid token for this tab
		const tabTokenKey = `googleToken_${tabId}`;
		const existing = store.get(tabTokenKey);
		if (existing && existing.access_token) {
			console.log(`🔄 Found existing token for tab ${tabId}, validating...`);
			// Validate existing token
			try {
				const tabOAuthClient = buildOAuthClient(norm);
				tabOAuthClient.setCredentials(existing);
				
				// Quick token validation
				const isValid = await validateToken(tabOAuthClient);
				if (isValid) {
					console.log(`✅ Existing token is valid for tab ${tabId}`);
					// Token is still valid, use it immediately
					try {
						if (mainWindow && mainWindow.webContents) {
							mainWindow.webContents.send('auth-success', { email: 'authenticated', tabId: tabId });
						}
					} catch (_) {}
					
					// Background: ensure services and resolve profile for this tab
					;(async () => {
						try {
							await ensureServicesForTab(tabId, norm, existing);
							let emailAddr = 'authenticated';
							try {
								const gmailService = getGmailServiceForTab(tabId);
								if (gmailService) {
									const p = await Promise.race([
										gmailService.users.getProfile({ userId: 'me' }),
										new Promise((_, rej) => setTimeout(() => rej(new Error('timeout')), 5000))
									]);
									if (p && p.data && p.data.emailAddress) emailAddr = p.data.emailAddress;
									saveAccountEntryForTab(tabId, emailAddr, norm, existing);
									try { store.set(`app-settings_${tabId}`, { isAuthenticated: true, currentAccount: emailAddr }); } catch(_) {}
									try { if (mainWindow && mainWindow.webContents) mainWindow.webContents.send('auth-success', { email: emailAddr, tabId: tabId }); } catch (_) {}
									logEvent('info', `Authenticated with existing token for tab ${tabId}`, { email: emailAddr, tabId: tabId });
								}
							} catch (_) {}
						} catch (_) {}
					})();
					
					return { success: true, userEmail: 'authenticated', message: 'Using existing token', tabId: tabId };
				}
			} catch (error) {
				console.log(`⚠️ Existing token invalid for tab ${tabId}, proceeding with new auth:`, error.message);
				logEvent('info', `Existing token invalid for tab ${tabId}, proceeding with new auth`, { error: error.message, tabId: tabId });
				// Token is invalid, continue with new authentication
			}
		}

		console.log(`🔄 Starting new OAuth flow for tab ${tabId}`);
		// Build OAuth client for new authentication
		const tabOAuthClient = buildOAuthClient(norm);

		const { shell } = require('electron');

		const token = await new Promise((resolve, reject) => {
			let settled = false;
			let server;
			let authTimeout;

			// Set authentication timeout
			authTimeout = setTimeout(() => {
				if (!settled) {
					settled = true;
					try { if (server) server.close(); } catch (_) {}
					reject(new Error('Authentication timeout - please try again'));
				}
			}, 300000); // 5 minutes timeout

			const startServer = (host, port, pathName) => {
				server = http.createServer(async (req, res) => {
					try {
						const base = `http://${host}:${server.address().port}`;
						const reqUrl = new URL(req.url, base);
						// Accept any path as long as code exists
						const code = reqUrl.searchParams.get('code');
						if (!code) { res.writeHead(400); res.end('Missing code'); return; }
                        
						console.log(`✅ Received authorization code for tab ${tabId}`);
						// Clear timeout since we got the code
						clearTimeout(authTimeout);
                        
                        const { tokens } = await tabOAuthClient.getToken(code);
                        tabOAuthClient.setCredentials(tokens);
                        
                        console.log(`✅ Tokens received for tab ${tabId}`);
                        
                        // Store tokens for this specific tab
                        store.set(tabTokenKey, tokens);
                        
                        try {
                            if (mainWindow && mainWindow.webContents) {
                                mainWindow.webContents.send('auth-progress', { step: 'token-received', tabId: tabId });
                            }
                        } catch (_) {}
                        
                        res.writeHead(200, { 'Content-Type': 'text/html' });
                        res.end('<html><body><h2>Authentication successful! You can close this window and return to the app.</h2><script>setTimeout(()=>{window.close()},1000);</script></body></html>');
						settled = true;
						server.close(() => resolve(tokens));
					} catch (err) {
						console.error(`❌ Error processing authorization code for tab ${tabId}:`, err);
						if (!settled) { 
							settled = true; 
							clearTimeout(authTimeout);
							try { server.close(); } catch (_) {} 
							reject(err); 
						}
					}
				});

				// Try to bind; if privileged or fails, fall back to random port and alternate host
				const tryListen = (h, p) => server.listen(p, h, async () => {
					try {
						// Build OAuth client with the exact redirect URI from credentials
						const tabOAuthClient = buildOAuthClient(norm);
						const authUrl = tabOAuthClient.generateAuthUrl({ 
							access_type: 'offline', 
							scope: SCOPES, 
							prompt: 'consent',
							response_type: 'code'
						});
						
						console.log(`🌐 Opening browser for OAuth flow, tab ${tabId}`);
						
						// Send progress update
						try {
							if (mainWindow && mainWindow.webContents) {
								mainWindow.webContents.send('auth-progress', { step: 'opening-browser', tabId: tabId });
							}
						} catch (_) {}
						
						await shell.openExternal(authUrl);
					} catch (openErr) {
						console.error(`❌ Failed to open browser for tab ${tabId}:`, openErr);
						try { server.close(); } catch (_) {}
						reject(openErr);
					}
				}).on('error', (e) => {
					// If port is busy, try alternate host
					try { server.close(); } catch (_) {}
					if (!settled) {
						const altHost = h === 'localhost' ? '127.0.0.1' : 'localhost';
						startServer(altHost, p, pathName);
					}
				});
				tryListen(host, port);
			};

			// Choose server binding based on credential type
			if (norm.fixed && norm.redirect_uri) {
				const parsed = new URL(norm.redirect_uri);
				const host = parsed.hostname || 'localhost';
				const port = parsed.port ? parseInt(parsed.port, 10) : 8080;
				const pathName = parsed.pathname || '/';
				startServer(host, port, pathName);
			} else {
				// For embedded credentials, use port 8080 to match redirect_uri
				const host = 'localhost';
				const port = 8080;
				const pathName = '/';
				startServer(host, port, pathName);
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

async function listSendAs() {
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
}

async function getPrimarySignature() {
	if (isOAuthAvailable()) {
		await ensureServices();
		const res = await gmailService.users.settings.sendAs.list({ userId: 'me' });
		const list = res.data.sendAs || [];
		const pri = list.find(s => s.isPrimary) || list[0];
		return pri?.signature || '';
	}
	const email = getActiveSmtpEmail();
	return (email && (store.get(`smtp.signature.${email}`) || '')) || '';
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

function saveAccountEntryForTab(tabId, userEmail, norm, token) {
	const map = getAccountsMap();
	map[userEmail] = { client_id: norm.client_id, creds: norm, token, tabId };
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
		const ext = path.extname(filePath).toLowerCase();
		let data;
		
		if (ext === '.csv') {
			// Handle CSV files
			const csv = require('csv-parser');
			const fs = require('fs');
			
			return new Promise((resolve, reject) => {
				const results = [];
				fs.createReadStream(filePath)
					.pipe(csv())
					.on('data', (row) => results.push(row))
					.on('end', () => {
						if (results.length === 0) {
							reject(new Error('No data found in CSV file'));
							return;
						}
						
						const headers = Object.keys(results[0]);
						const rows = results.map(row => headers.map(header => row[header]));
						
						logEvent('info', 'Loaded local CSV spreadsheet', { filePath, rows: rows.length, headers: headers.length });
						resolve({ success: true, data: { headers, rows } });
					})
					.on('error', (error) => {
						logEvent('error', 'CSV parsing failed', { error: error.message, filePath });
						reject(new Error(`CSV parsing failed: ${error.message}`));
					});
			});
		} else if (ext === '.xlsx' || ext === '.xls') {
			// Handle Excel files
			const XLSX = require('xlsx');
			const workbook = XLSX.readFile(filePath);
			const sheetName = workbook.SheetNames[0];
			const worksheet = workbook.Sheets[sheetName];
			
			if (!worksheet) {
				throw new Error('No worksheet found in Excel file');
			}
			
			const jsonData = XLSX.utils.sheet_to_json(worksheet, { header: 1 });
			
			if (!jsonData || jsonData.length === 0) {
				throw new Error('No data found in Excel file');
			}
			
			const headers = jsonData[0];
			const rows = jsonData.slice(1);
			
			logEvent('info', 'Loaded local Excel spreadsheet', { filePath, rows: rows.length, headers: headers.length });
			return { success: true, data: { headers, rows } };
		} else {
			throw new Error(`Unsupported file format: ${ext}. Please use CSV or Excel files.`);
		}
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
	await ensureServices();
	const { sheetId, sheetTitle, subject, content, from, attachmentsPaths, delaySeconds, useSignature } = params;
	const range = sheetTitle ? `${sheetTitle}!A:Z` : 'A:Z';
	const res = await sheetsService.spreadsheets.values.get({ spreadsheetId: sheetId, range });
	const values = res.data.values || [];
	if (!values.length) throw new Error('No data found in sheet');
	const headers = values[0];
	const rows = values.slice(1);
	const emailIdx = findEmailColumnIndex(headers);
	if (emailIdx < 0) throw new Error('No Email column found');
	const signature = useSignature ? await getPrimarySignature() : '';
	for (let i = 0; i < rows.length; i++) {
		const row = rows[i];
		const to = row[emailIdx];
		if (!to) continue;
		const text = renderWithRow(content, headers, row, signature);
		const rawStr = buildRawEmail({ from, to, subject, text, attachments: attachmentsPaths || [] });
		await gmailService.users.messages.send({ userId: 'me', requestBody: { raw: toBase64Url(rawStr) } });
		try {
			await updateSheetStatus(sheetId, sheetTitle || 'Sheet1', headers, i, 'SENT');
		} catch (_) {}
		const jitter = Math.floor(Math.random() * 2000);
		await new Promise(r => setTimeout(r, (delaySeconds || 5) * 1000 + jitter));
	}
	// Campaign run
	logEvent('info', 'Campaign completed', { recipients: rows.length });
}

function scheduleOneTimeCampaign(params) {
	const id = 'job_' + Date.now() + '_' + Math.random().toString(36).slice(2);
	const startAt = new Date(params.startAt).getTime();
	const now = Date.now();
	const ms = Math.max(0, startAt - now);
	const timer = setTimeout(async () => {
		try { await executeCampaignRun(params); } catch (e) { console.error('Scheduled run failed:', e); logEvent('error', 'Scheduled run failed', { error: e.message }); }
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
ipcMain.handle('authenticateGoogle', async (event, credentialsData, tabId = 'main') => authenticateGoogle(credentialsData, tabId));
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
ipcMain.handle('getSendAsList', async (event, tabId = 'main') => {
    try {
        logEvent('info', 'Getting send-as list from Gmail');
        
        // Try to get tab-specific services first
        let gmail = getGmailServiceForTab(tabId);
        
        if (gmail) {
            // Use tab-specific service
            const response = await gmail.users.settings.sendAs.list({ userId: 'me' });
            
            const sendAsList = response.data.sendAs || [];
            const emails = sendAsList.map(sendAs => sendAs.verificationStatus === 'accepted' ? sendAs.sendAsEmail : null).filter(Boolean);
            
            logEvent('info', 'Send-as list retrieved from tab service', { count: emails.length, tabId });
            return emails;
        } else if (isOAuthAvailable()) {
            // Fallback to global services
            await ensureServices();
            gmail = google.gmail({ version: 'v1', auth: gmailService });
            const response = await gmail.users.settings.sendAs.list({ userId: 'me' });
            
            const sendAsList = response.data.sendAs || [];
            const emails = sendAsList.map(sendAs => sendAs.verificationStatus === 'accepted' ? sendAs.sendAsEmail : null).filter(Boolean);
            
            logEvent('info', 'Send-as list retrieved from global service', { count: emails.length });
            return emails;
        } else {
            // Fallback to SMTP mode
            const email = getActiveSmtpEmail();
            if (email) {
                return [email];
            }
            throw new Error('Not authenticated with Google or SMTP');
        }
        
    } catch (error) {
        logEvent('error', 'Failed to get send-as list', { error: error.message, tabId });
        console.error('Failed to get send-as list:', error);
        return [];
    }
});
ipcMain.handle('gmail-list-send-as', async () => listSendAs());
ipcMain.handle('gmail-get-signature', async () => getPrimarySignature());
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
ipcMain.handle('templates-list', async () => {
	try {
		const userDataPath = app.getPath('userData');
		const templatesDir = path.join(userDataPath, 'templates');
		
		if (!fs.existsSync(templatesDir)) {
			fs.mkdirSync(templatesDir, { recursive: true });
			return { success: true, templates: [] };
		}
		
		const files = fs.readdirSync(templatesDir);
		const templates = [];
		
		for (const file of files) {
			if (file.endsWith('.json')) {
				try {
					const filePath = path.join(templatesDir, file);
					const content = fs.readFileSync(filePath, 'utf8');
					const template = JSON.parse(content);
					
					// Validate template structure
					if (template.name && (template.subject || template.content)) {
						templates.push({
							name: template.name,
							path: filePath,
							subject: template.subject || '',
							content: template.content || '',
							attachments: template.attachments || [],
							created: template.created || fs.statSync(filePath).mtime.toISOString(),
							updated: template.updated || fs.statSync(filePath).mtime.toISOString()
						});
					}
				} catch (parseError) {
					logEvent('warning', 'Failed to parse template file', { file, error: parseError.message });
					// Continue with other files
				}
			}
		}
		
		// Sort by creation date (newest first)
		templates.sort((a, b) => new Date(b.created) - new Date(a.created));
		
		logEvent('info', 'Listed templates', { count: templates.length });
		return { success: true, templates };
	} catch (error) {
		logEvent('error', 'Failed to list templates', { error: error.message });
		return { success: false, error: error.message };
	}
});

ipcMain.handle('templates-save', async (e, args) => {
	try {
		const { name, data } = args;
		
		if (!name || !data) {
			throw new Error('Template name and data are required');
		}
		
		const userDataPath = app.getPath('userData');
		const templatesDir = path.join(userDataPath, 'templates');
		
		if (!fs.existsSync(templatesDir)) {
			fs.mkdirSync(templatesDir, { recursive: true });
		}
		
		// Sanitize filename
		const safeName = name.replace(/[^a-zA-Z0-9\s\-_]/g, '').trim();
		if (!safeName) {
			throw new Error('Invalid template name');
		}
		
		const fileName = `${safeName.replace(/\s+/g, '_')}_${Date.now()}.json`;
		const filePath = path.join(templatesDir, fileName);
		
		const templateData = {
			name: safeName,
			subject: data.subject || '',
			content: data.content || '',
			attachments: data.attachments || [],
			created: new Date().toISOString(),
			updated: new Date().toISOString()
		};
		
		fs.writeFileSync(filePath, JSON.stringify(templateData, null, 2), 'utf8');
		
		logEvent('info', 'Template saved', { name: safeName, path: filePath });
		return { success: true, path: filePath, name: safeName };
	} catch (error) {
		logEvent('error', 'Failed to save template', { error: error.message });
		return { success: false, error: error.message };
	}
});

ipcMain.handle('templates-load', async (e, fpath) => {
	try {
		if (!fpath || !fs.existsSync(fpath)) {
			throw new Error('Template file not found');
		}
		
		const content = fs.readFileSync(fpath, 'utf8');
		const template = JSON.parse(content);
		
		// Validate template structure
		if (!template.name || (!template.subject && !template.content)) {
			throw new Error('Invalid template file format');
		}
		
		logEvent('info', 'Template loaded', { name: template.name, path: fpath });
		return { success: true, template };
	} catch (error) {
		logEvent('error', 'Failed to load template', { error: error.message, path: fpath });
		return { success: false, error: error.message };
	}
});

ipcMain.handle('templates-delete', async (e, fpath) => {
	try {
		if (!fpath || !fs.existsSync(fpath)) {
			throw new Error('Template file not found');
		}
		
		fs.unlinkSync(fpath);
		
		logEvent('info', 'Template deleted', { path: fpath });
		return { success: true };
	} catch (error) {
		logEvent('error', 'Failed to delete template', { error: error.message, path: fpath });
		return { success: false, error: error.message };
	}
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
ipcMain.handle('signatures-list', async () => {
	try {
		const userDataPath = app.getPath('userData');
		const signaturesDir = path.join(userDataPath, 'signatures');
		
		if (!fs.existsSync(signaturesDir)) {
			fs.mkdirSync(signaturesDir, { recursive: true });
			return { success: true, signatures: [] };
		}
		
		const files = fs.readdirSync(signaturesDir);
		const signatures = [];
		
		for (const file of files) {
			if (file.endsWith('.json')) {
				try {
					const filePath = path.join(signaturesDir, file);
					const content = fs.readFileSync(filePath, 'utf8');
					const signature = JSON.parse(content);
					
					// Validate signature structure
					if (signature.name && (signature.html || signature.text)) {
						signatures.push({
							name: signature.name,
							path: filePath,
							html: signature.html || '',
							text: signature.text || '',
							created: signature.created || fs.statSync(filePath).mtime.toISOString()
						});
					}
				} catch (parseError) {
					logEvent('warning', 'Failed to parse signature file', { file, error: parseError.message });
					// Continue with other files
				}
			}
		}
		
		// Sort by creation date (newest first)
		signatures.sort((a, b) => new Date(b.created) - new Date(a.created));
		
		logEvent('info', 'Listed signatures', { count: signatures.length });
		return { success: true, signatures };
	} catch (error) {
		logEvent('error', 'Failed to list signatures', { error: error.message });
		return { success: false, error: error.message };
	}
});

ipcMain.handle('signatures-save', async (e, args) => {
	try {
		const { name, html, text } = args;
		
		if (!name || (!html && !text)) {
			throw new Error('Signature name and content (HTML or text) are required');
		}
		
		const userDataPath = app.getPath('userData');
		const signaturesDir = path.join(userDataPath, 'signatures');
		
		if (!fs.existsSync(signaturesDir)) {
			fs.mkdirSync(signaturesDir, { recursive: true });
		}
		
		// Sanitize filename
		const safeName = name.replace(/[^a-zA-Z0-9\s\-_]/g, '').trim();
		if (!safeName) {
			throw new Error('Invalid signature name');
		}
		
		const fileName = `${safeName.replace(/\s+/g, '_')}_${Date.now()}.json`;
		const filePath = path.join(signaturesDir, fileName);
		
		const signatureData = {
			name: safeName,
			html: html || '',
			text: text || '',
			created: new Date().toISOString(),
			updated: new Date().toISOString()
		};
		
		fs.writeFileSync(filePath, JSON.stringify(signatureData, null, 2), 'utf8');
		
		logEvent('info', 'Signature saved', { name: safeName, path: filePath });
		return { success: true, path: filePath, name: safeName };
	} catch (error) {
		logEvent('error', 'Failed to save signature', { error: error.message });
		return { success: false, error: error.message };
	}
});

ipcMain.handle('signatures-load', async (e, fpath) => {
	try {
		if (!fpath || !fs.existsSync(fpath)) {
			throw new Error('Signature file not found');
		}
		
		const content = fs.readFileSync(fpath, 'utf8');
		const signature = JSON.parse(content);
		
		// Validate signature structure
		if (!signature.name || (!signature.html && !signature.text)) {
			throw new Error('Invalid signature file format');
		}
		
		logEvent('info', 'Signature loaded', { name: signature.name, path: fpath });
		return { success: true, signature };
	} catch (error) {
		logEvent('error', 'Failed to load signature', { error: error.message, path: fpath });
		return { success: false, error: error.message };
	}
});

ipcMain.handle('signatures-delete', async (e, fpath) => {
	try {
		if (!fpath || !fs.existsSync(fpath)) {
			throw new Error('Signature file not found');
		}
		
		fs.unlinkSync(fpath);
		
		logEvent('info', 'Signature deleted', { path: fpath });
		return { success: true };
	} catch (error) {
		logEvent('error', 'Failed to delete signature', { error: error.message, path: fpath });
		return { success: false, error: error.message };
	}
});

ipcMain.handle('signatures-get-default', async () => {
	try {
		const userDataPath = app.getPath('userData');
		const signaturesDir = path.join(userDataPath, 'signatures');
		
		if (!fs.existsSync(signaturesDir)) {
			return { success: true, signature: null };
		}
		
		const files = fs.readdirSync(signaturesDir);
		if (files.length === 0) {
			return { success: true, signature: null };
		}
		
		// Get the most recently created signature
		let latestSignature = null;
		let latestTime = 0;
		
		for (const file of files) {
			if (file.endsWith('.json')) {
				try {
					const filePath = path.join(signaturesDir, file);
					const content = fs.readFileSync(filePath, 'utf8');
					const signature = JSON.parse(content);
					
					if (signature.created) {
						const time = new Date(signature.created).getTime();
						if (time > latestTime) {
							latestTime = time;
							latestSignature = signature;
						}
					}
				} catch (parseError) {
					// Continue with other files
				}
			}
		}
		
		return { success: true, signature: latestSignature };
	} catch (error) {
		logEvent('error', 'Failed to get default signature', { error: error.message });
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
	console.log('🚀 RTX Innovations AutoMailer Pro starting...');
	
	// Copy credentials to user data directory if available
	copyCredentialsToUserData();
	
	createWindow();
	
	app.on('activate', () => {
		if (BrowserWindow.getAllWindows().length === 0) {
			createWindow();
		}
	});
});
app.on('window-all-closed', () => { if (process.platform !== 'darwin') app.quit(); });
app.on('activate', () => { if (BrowserWindow.getAllWindows().length === 0) createWindow(); });
app.on('before-quit', () => { if (mainWindow && mainWindow.webContents) mainWindow.webContents.send('app-quitting'); try { flushTelemetry(); } catch (_) {} }); 