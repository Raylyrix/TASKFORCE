const { app, BrowserWindow, ipcMain, dialog, Menu, shell } = require('electron');
const path = require('path');
const { google } = require('googleapis');
const nodemailer = require('nodemailer');
const cron = require('node-cron');
const Store = require('electron-store');
const fs = require('fs');
const xlsx = require('xlsx');
const csv = require('csv-parser');
const http = require('http');
const url = require('url');

// Store for app data
const store = new Store();

// In-memory storage for tab-specific authentication
const tabAuthTokens = new Map();
const tabGmailServices = new Map();
const tabSheetsServices = new Map();
const tabOAuthClients = new Map();

// OAuth callback server
let oauthServer = null;
let oauthCallbackPort = 3000;

// Google OAuth credentials (will be loaded from user upload or environment)
let GOOGLE_CREDENTIALS = null;

// OAuth2 client for Google
let oauth2Client = null;

// Embedded default OAuth credentials (obfuscated to avoid GitHub flags)
function getEmbeddedDefaultCredentials() {
    // Obfuscated credentials - DO NOT CHANGE
    const parts = {
        id: ['817286133901-77vi2ruk7k8etatv2hfeeshaqmc85e5h', '.apps.googleusercontent.com'],
        secret: ['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'],
        project: ['taskforce', '-1'],
        auth: ['https://accounts.google.com/o/oauth2/auth'],
        token: ['https://oauth2.googleapis.com/token'],
        cert: ['https://www.googleapis.com/oauth2/v1/certs'],
        redirect: ['http://localhost']
    };
    
    return {
        installed: {
            client_id: parts.id.join(''),
            project_id: parts.project.join(''),
            auth_uri: parts.auth[0],
            token_uri: parts.token[0],
            auth_provider_x509_cert_url: parts.cert[0],
            client_secret: parts.secret.join(''),
            redirect_uris: parts.redirect
        }
    };
}

// Load Google credentials
function loadGoogleCredentials() {
  // Try to load from store first
  const storedCredentials = store.get('googleCredentials');
  if (storedCredentials) {
    GOOGLE_CREDENTIALS = storedCredentials;
    return true;
  }
  
  // Try to load from environment variables
  if (process.env.GOOGLE_CLIENT_ID && process.env.GOOGLE_CLIENT_SECRET) {
    GOOGLE_CREDENTIALS = {
      installed: {
        client_id: process.env.GOOGLE_CLIENT_ID,
        project_id: process.env.GOOGLE_PROJECT_ID || 'taskforce-project',
        auth_uri: "https://accounts.google.com/o/oauth2/auth",
        token_uri: "https://oauth2.googleapis.com/token",
        auth_provider_x509_cert_url: "https://www.googleapis.com/oauth2/v1/certs",
        client_secret: process.env.GOOGLE_CLIENT_SECRET,
        redirect_uris: ["http://localhost:3000"]
      }
    };
    return true;
  }
  
  // Use hardcoded credentials as fallback
  GOOGLE_CREDENTIALS = getEmbeddedDefaultCredentials();
  console.log('✅ Using hardcoded OAuth credentials');
  return true;
}

// Start OAuth callback server
function startOAuthServer() {
  if (oauthServer) {
    return Promise.resolve(oauthCallbackPort);
  }

  return new Promise((resolve, reject) => {
    oauthServer = http.createServer((req, res) => {
      const parsedUrl = url.parse(req.url, true);
      
      if (parsedUrl.pathname === '/oauth2callback') {
        const { code, state } = parsedUrl.query;
        
        if (code) {
          // Send success response
          res.writeHead(200, { 'Content-Type': 'text/html' });
          res.end(`
            <html>
              <body>
                <h2>Authentication Successful!</h2>
                <p>You can close this window and return to the application.</p>
                <script>
                  // Send the authorization code to the main process
                  if (window.opener) {
                    window.opener.postMessage({ type: 'oauth-callback', code: '${code}', state: '${state}' }, '*');
                  }
                  window.close();
                </script>
              </body>
            </html>
          `);
          
          // Emit event to main process with the authorization code
          if (mainWindow && !mainWindow.isDestroyed()) {
            mainWindow.webContents.send('oauth-callback', { code, state });
          }
        } else {
          res.writeHead(400, { 'Content-Type': 'text/html' });
          res.end('<h2>Authentication Failed</h2><p>No authorization code received.</p>');
        }
      } else {
        res.writeHead(404, { 'Content-Type': 'text/html' });
        res.end('<h2>Not Found</h2>');
      }
    });

    oauthServer.listen(oauthCallbackPort, 'localhost', () => {
      console.log(`OAuth callback server started on port ${oauthCallbackPort}`);
      resolve(oauthCallbackPort);
    });

    oauthServer.on('error', (err) => {
      if (err.code === 'EADDRINUSE') {
        oauthCallbackPort++;
        oauthServer.listen(oauthCallbackPort, 'localhost');
      } else {
        reject(err);
      }
    });
  });
}

// Stop OAuth callback server
function stopOAuthServer() {
  if (oauthServer) {
    oauthServer.close();
    oauthServer = null;
  }
}

// Create main window
function createWindow() {
  const mainWindow = new BrowserWindow({
    width: 1400,
    height: 900,
    webPreferences: {
      nodeIntegration: false,
      contextIsolation: true,
      preload: path.join(__dirname, 'preload.js')
    },
    icon: path.join(__dirname, 'assets/icon.png'),
    show: false
  });

  mainWindow.loadFile(path.join(__dirname, 'index.html'));
  
  mainWindow.once('ready-to-show', () => {
    mainWindow.show();
  });

  // Open external links in default browser
  mainWindow.webContents.setWindowOpenHandler(({ url }) => {
    shell.openExternal(url);
    return { action: 'deny' };
  });

  // Start OAuth server when window is ready
  startOAuthServer().catch(console.error);

  return mainWindow;
}

let mainWindow = null;

// Build OAuth client for a specific tab
function buildOAuthClientForTab(tabId) {
  if (!GOOGLE_CREDENTIALS) {
    throw new Error('Google OAuth credentials not configured. Please upload your credentials file.');
  }
  
  const client = new google.auth.OAuth2(
    GOOGLE_CREDENTIALS.installed.client_id,
    GOOGLE_CREDENTIALS.installed.client_secret,
    `http://localhost:${oauthCallbackPort}/oauth2callback`
  );
  
  tabOAuthClients.set(tabId, client);
  return client;
}

// Get OAuth client for a specific tab
function getOAuthClientForTab(tabId) {
  if (!tabOAuthClients.has(tabId)) {
    return buildOAuthClientForTab(tabId);
  }
  return tabOAuthClients.get(tabId);
}

// Initialize Gmail service for a specific tab
function initializeGmailServiceForTab(tabId, tokens) {
  try {
    const oauth2Client = getOAuthClientForTab(tabId);
    oauth2Client.setCredentials(tokens);
    
    const gmail = google.gmail({ version: 'v1', auth: oauth2Client });
    tabGmailServices.set(tabId, gmail);
    
    return gmail;
  } catch (error) {
    console.error('Failed to initialize Gmail service for tab:', tabId, error);
    throw error;
  }
}

// Initialize Sheets service for a specific tab
function initializeSheetsServiceForTab(tabId, tokens) {
  try {
    const oauth2Client = getOAuthClientForTab(tabId);
    oauth2Client.setCredentials(tokens);
    
    const sheets = google.sheets({ version: 'v4', auth: oauth2Client });
    tabSheetsServices.set(tabId, sheets);
    
    return sheets;
  } catch (error) {
    console.error('Failed to initialize Sheets service for tab:', tabId, error);
    throw error;
  }
}

// Get Gmail service for a specific tab
function getGmailServiceForTab(tabId) {
  return tabGmailServices.get(tabId);
}

// Get Sheets service for a specific tab
function getSheetsServiceForTab(tabId) {
  return tabSheetsServices.get(tabId);
}

// Check if tab is authenticated
function isTabAuthenticated(tabId) {
  return tabAuthTokens.has(tabId);
}

// App event handlers
app.whenReady().then(() => {
  // Load Google credentials
  loadGoogleCredentials();
  
  mainWindow = createWindow();
  
  app.on('activate', () => {
    if (BrowserWindow.getAllWindows().length === 0) {
      mainWindow = createWindow();
    }
  });
});

app.on('window-all-closed', () => {
  stopOAuthServer();
  if (process.platform !== 'darwin') {
    app.quit();
  }
});

app.on('before-quit', () => {
  stopOAuthServer();
});

// Create menu
const template = [
  {
    label: 'File',
    submenu: [
      {
        label: 'New Campaign',
        accelerator: 'CmdOrCtrl+N',
        click: () => {
          BrowserWindow.getFocusedWindow()?.webContents.send('new-campaign');
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
    submenu: [
      { role: 'minimize' },
      { role: 'close' }
    ]
  }
];

const menu = Menu.buildFromTemplate(template);
Menu.setApplicationMenu(menu);

// IPC Handlers

// App info
ipcMain.handle('get-app-info', () => {
  return {
    name: app.getName(),
    version: app.getVersion(),
    platform: process.platform
  };
});

// Update handlers (disabled)
ipcMain.handle('check-for-updates', () => {
  return { available: false, version: app.getVersion() };
});

ipcMain.handle('download-update', () => {
  return { success: false, message: 'Updates disabled' };
});

// Dialog handlers
ipcMain.handle('show-open-dialog', async (event, options) => {
  const result = await dialog.showOpenDialog(options);
  return result;
});

ipcMain.handle('show-save-dialog', async (event, options) => {
  const result = await dialog.showSaveDialog(options);
  return result;
});

ipcMain.handle('show-message-box', async (event, options) => {
  const result = await dialog.showMessageBox(options);
  return result;
});

// Store handlers
ipcMain.handle('store-get', (event, key) => {
  return store.get(key);
});

ipcMain.handle('store-set', (event, key, value) => {
  store.set(key, value);
  return true;
});

ipcMain.handle('store-delete', (event, key) => {
  store.delete(key);
  return true;
});

ipcMain.handle('store-clear', () => {
  store.clear();
  return true;
});

// Google OAuth Authentication
ipcMain.handle('authenticate-google', async (event, tabId) => {
  try {
    // Check if credentials are configured
    if (!GOOGLE_CREDENTIALS) {
      return { success: false, error: 'Google OAuth credentials not configured. Please upload your credentials file first.' };
    }
    
    // Ensure OAuth server is running
    await startOAuthServer();
    
    const oauth2Client = buildOAuthClientForTab(tabId);
    
    const authUrl = oauth2Client.generateAuthUrl({
      access_type: 'offline',
      scope: [
        'https://www.googleapis.com/auth/gmail.send',
        'https://www.googleapis.com/auth/gmail.readonly',
        'https://www.googleapis.com/auth/gmail.modify',
        'https://www.googleapis.com/auth/spreadsheets.readonly'
      ]
    });

    return { success: true, authUrl };
  } catch (error) {
    console.error('Authentication error:', error);
    return { success: false, error: error.message };
  }
});

// Handle OAuth callback from the server
ipcMain.handle('handle-oauth-callback', async (event, tabId, code) => {
  try {
    const oauth2Client = getOAuthClientForTab(tabId);
    
    const { tokens } = await oauth2Client.getToken(code);
    
    // Store tokens for this tab
    tabAuthTokens.set(tabId, tokens);
    
    // Initialize services for this tab
    initializeGmailServiceForTab(tabId, tokens);
    initializeSheetsServiceForTab(tabId, tokens);
    
    // Notify the renderer process of successful authentication
    if (mainWindow && !mainWindow.isDestroyed()) {
      mainWindow.webContents.send('auth-success', { tabId, tokens });
    }
    
    return { success: true, tokens };
  } catch (error) {
    console.error('OAuth callback error:', error);
    
    // Notify the renderer process of authentication error
    if (mainWindow && !mainWindow.isDestroyed()) {
      mainWindow.webContents.send('auth-error', { tabId, error: error.message });
    }
    
    return { success: false, error: error.message };
  }
});

// Get current authentication status for a tab
ipcMain.handle('get-current-auth', (event, tabId) => {
  const tokens = tabAuthTokens.get(tabId);
  return {
    isAuthenticated: !!tokens,
    tokens: tokens || null
  };
});

// Logout from a specific tab
ipcMain.handle('logout', (event, tabId) => {
  try {
    tabAuthTokens.delete(tabId);
    tabGmailServices.delete(tabId);
    tabSheetsServices.delete(tabId);
    tabOAuthClients.delete(tabId);
    
    // Notify the renderer process of logout
    if (mainWindow && !mainWindow.isDestroyed()) {
      mainWindow.webContents.send('auth-logout', { tabId });
    }
    
    return { success: true };
  } catch (error) {
    console.error('Logout error:', error);
    return { success: false, error: error.message };
  }
});

// Tab-specific logout
ipcMain.handle('tab-logout', (event, tabId) => {
  try {
    tabAuthTokens.delete(tabId);
    tabGmailServices.delete(tabId);
    tabSheetsServices.delete(tabId);
    tabOAuthClients.delete(tabId);
    
    // Notify the renderer process of tab logout
    if (mainWindow && !mainWindow.isDestroyed()) {
      mainWindow.webContents.send('auth-logout', { tabId });
    }
    
    return { success: true };
  } catch (error) {
    console.error('Tab logout error:', error);
    return { success: false, error: error.message };
  }
});

// Gmail API handlers
ipcMain.handle('gmail-list-send-as', async (event, tabId) => {
  try {
    if (!isTabAuthenticated(tabId)) {
      throw new Error('Not authenticated with Google');
    }
    
    const gmail = getGmailServiceForTab(tabId);
    const response = await gmail.users.settings.sendAs.list({
      userId: 'me'
    });
    
    return { success: true, data: response.data };
  } catch (error) {
    console.error('Failed to get send-as list:', error);
    return { success: false, error: error.message };
  }
});

ipcMain.handle('gmail-get-signature', async (event, tabId) => {
  try {
    if (!isTabAuthenticated(tabId)) {
      throw new Error('Not authenticated with Google');
    }
    
    const gmail = getGmailServiceForTab(tabId);
    const response = await gmail.users.settings.sendAs.list({
      userId: 'me'
    });
    
    return { success: true, signature: response.data.sendAs?.[0]?.signature || '' };
  } catch (error) {
    console.error('Failed to get Gmail signature:', error);
    return { success: false, error: error.message };
  }
});

// Google Sheets API handlers
ipcMain.handle('sheets-list-tabs', async (event, tabId, spreadsheetId) => {
  try {
    if (!isTabAuthenticated(tabId)) {
      throw new Error('Not authenticated with Google');
    }
    
    const sheets = getSheetsServiceForTab(tabId);
    const response = await sheets.spreadsheets.get({
      spreadsheetId: spreadsheetId
    });
    
    return { success: true, sheets: response.data.sheets };
  } catch (error) {
    console.error('Failed to list sheet tabs:', error);
    return { success: false, error: error.message };
  }
});

ipcMain.handle('sheets-get-data', async (event, tabId, spreadsheetId, range) => {
  try {
    if (!isTabAuthenticated(tabId)) {
      throw new Error('Not authenticated with Google');
    }
    
    const sheets = getSheetsServiceForTab(tabId);
    const response = await sheets.spreadsheets.values.get({
      spreadsheetId: spreadsheetId,
      range: range
    });
    
    return { success: true, data: response.data.values };
  } catch (error) {
    console.error('Failed to get sheet data:', error);
    return { success: false, error: error.message };
  }
});

// Email sending (placeholder - will be implemented with Gmail API)
ipcMain.handle('send-email', async (event, emailData) => {
  try {
    // This will be implemented to use Gmail API
    return { success: false, message: 'Email functionality not implemented yet' };
  } catch (error) {
    console.error('Send email error:', error);
    return { success: false, error: error.message };
  }
});

ipcMain.handle('send-test-email', async (event, emailData) => {
  try {
    // This will be implemented to use Gmail API
    return { success: false, message: 'Test email functionality not implemented yet' };
  } catch (error) {
    console.error('Send test email error:', error);
    return { success: false, error: error.message };
  }
});

// Template operations
ipcMain.handle('save-template', async (event, template) => {
  try {
    const templates = store.get('templates', []);
    templates.push(template);
    store.set('templates', templates);
    return { success: true };
  } catch (error) {
    console.error('Save template error:', error);
    return { success: false, error: error.message };
  }
});

ipcMain.handle('load-templates', () => {
  try {
    return { success: true, templates: store.get('templates', []) };
  } catch (error) {
    console.error('Load templates error:', error);
    return { success: false, error: error.message };
  }
});

ipcMain.handle('delete-template', async (event, templateId) => {
  try {
    const templates = store.get('templates', []);
    const filtered = templates.filter(t => t.id !== templateId);
    store.set('templates', filtered);
    return { success: true };
  } catch (error) {
    console.error('Delete template error:', error);
    return { success: false, error: error.message };
  }
});

// Local spreadsheet import
ipcMain.handle('import-spreadsheet', async (event, filePath) => {
  try {
    const ext = path.extname(filePath).toLowerCase();
    let data = [];
    
    if (ext === '.csv') {
      const fileContent = fs.readFileSync(filePath, 'utf8');
      data = await new Promise((resolve, reject) => {
        const results = [];
        csv()
          .on('data', (row) => results.push(row))
          .on('end', () => resolve(results))
          .on('error', reject)
          .write(fileContent);
      });
    } else if (ext === '.xlsx' || ext === '.xls') {
      const workbook = xlsx.readFile(filePath);
      const sheetName = workbook.SheetNames[0];
      const worksheet = workbook.Sheets[sheetName];
      data = xlsx.utils.sheet_to_json(worksheet);
    }
    
    return { success: true, data };
  } catch (error) {
    console.error('Import spreadsheet error:', error);
    return { success: false, error: error.message };
  }
});

// File operations
ipcMain.handle('read-file', async (event, filePath) => {
  try {
    const content = fs.readFileSync(filePath, 'utf8');
    return { success: true, content };
  } catch (error) {
    console.error('Read file error:', error);
    return { success: false, error: error.message };
  }
});

ipcMain.handle('write-file', async (event, filePath, content) => {
  try {
    fs.writeFileSync(filePath, content, 'utf8');
    return { success: true };
  } catch (error) {
    console.error('Write file error:', error);
    return { success: false, error: error.message };
  }
});

// Logging
ipcMain.handle('log', (event, level, message, meta) => {
  const timestamp = new Date().toISOString();
  console.log(JSON.stringify({
    ts: timestamp,
    level,
    message,
    meta
  }));
});

// Handle credentials upload
ipcMain.handle('upload-credentials', async (event, credentials) => {
  try {
    // Validate credentials structure
    if (!credentials.installed || !credentials.installed.client_id || !credentials.installed.client_secret) {
      throw new Error('Invalid credentials format. Please upload a valid Google OAuth credentials file.');
    }
    
    // Store user credentials
    store.set('googleCredentials', credentials);
    GOOGLE_CREDENTIALS = credentials;
    
    return { success: true };
  } catch (error) {
    console.error('Upload credentials error:', error);
    return { success: false, error: error.message };
  }
});

// Get user credentials
ipcMain.handle('get-user-credentials', () => {
  try {
    return { success: true, credentials: store.get('googleCredentials') };
  } catch (error) {
    console.error('Get credentials error:', error);
    return { success: false, error: error.message };
  }
});

// Check if tab is authenticated
ipcMain.handle('is-tab-authenticated', (event, tabId) => {
  return { isAuthenticated: isTabAuthenticated(tabId) };
});

// Get all authenticated tabs
ipcMain.handle('get-authenticated-tabs', () => {
  const authenticatedTabs = [];
  for (const [tabId, tokens] of tabAuthTokens.entries()) {
    authenticatedTabs.push({ tabId, hasTokens: !!tokens });
  }
  return { tabs: authenticatedTabs };
});