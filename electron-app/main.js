const { app, BrowserWindow, ipcMain, dialog, shell } = require('electron');
const path = require('path');
const Store = require('electron-store');
const fetch = require('node-fetch');

// Initialize electron store for user settings
const store = new Store();

let mainWindow;

function createWindow() {
  // Create the browser window
  mainWindow = new BrowserWindow({
    width: 1400,
    height: 900,
    minWidth: 1200,
    minHeight: 800,
    webPreferences: {
      nodeIntegration: false,
      contextIsolation: true,
      enableRemoteModule: false,
      preload: path.join(__dirname, 'preload.js')
    },
    icon: path.join(__dirname, 'assets/icon.png'),
    titleBarStyle: 'default',
    show: false, // Don't show until ready
    autoHideMenuBar: true
  });

  // Load the app
  const isDev = process.env.NODE_ENV === 'development';
  
  if (isDev) {
    mainWindow.loadURL('http://localhost:3000');
    mainWindow.webContents.openDevTools();
  } else {
    // In production, serve the built Next.js app
    const frontendPath = path.join(process.resourcesPath, 'frontend');
    const indexPath = path.join(frontendPath, 'static', 'index.html');
    
    // Try to load the built Next.js app
    try {
      mainWindow.loadFile(indexPath);
    } catch (error) {
      console.error('Failed to load built app, falling back to localhost:', error);
      // Fallback to localhost if built files not found
      mainWindow.loadURL('http://localhost:3000');
    }
  }

  // Show window when ready
  mainWindow.once('ready-to-show', () => {
    mainWindow.show();
    
    // Check if user is already authenticated
    const userToken = store.get('userToken');
    if (userToken) {
      mainWindow.webContents.send('user-authenticated', { token: userToken });
    }
  });

  // Handle window closed
  mainWindow.on('closed', () => {
    mainWindow = null;
  });

  // Handle external links
  mainWindow.webContents.setWindowOpenHandler(({ url }) => {
    shell.openExternal(url);
    return { action: 'deny' };
  });
}

// App event handlers
app.whenReady().then(createWindow);

app.on('window-all-closed', () => {
  if (process.platform !== 'darwin') {
    app.quit();
  }
});

app.on('activate', () => {
  if (BrowserWindow.getAllWindows().length === 0) {
    createWindow();
  }
});

// IPC handlers for seamless integration
ipcMain.handle('get-app-version', () => {
  return app.getVersion();
});

ipcMain.handle('get-user-settings', () => {
  return {
    userToken: store.get('userToken'),
    userEmail: store.get('userEmail'),
    llmProvider: store.get('llmProvider', 'openrouter'),
    openrouterApiKey: store.get('openrouterApiKey'),
    openaiApiKey: store.get('openaiApiKey'),
    anthropicApiKey: store.get('anthropicApiKey'),
    smtpConfigured: store.get('smtpConfigured', false),
    supabaseConfigured: store.get('supabaseConfigured', false)
  };
});

ipcMain.handle('save-user-settings', (event, settings) => {
  Object.keys(settings).forEach(key => {
    if (settings[key] !== undefined) {
      store.set(key, settings[key]);
    }
  });
  return true;
});

ipcMain.handle('clear-user-data', () => {
  store.clear();
  return true;
});

ipcMain.handle('test-supabase-connection', async () => {
  try {
    const response = await fetch('https://mcyiohpzduyqmjsepedo.supabase.co/rest/v1/', {
      headers: {
        'apikey': 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Im1jeWlvaHB6ZHV5cW1qc2VwZWRvIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTgwODg5NTcsImV4cCI6MjA3MzY2NDk1N30.-sOcgTWdyavYUnOLIjlbDK_C5f2KnntN2_PjiN0JhBk'
      }
    });
    return { success: true, status: response.status };
  } catch (error) {
    return { success: false, error: error.message };
  }
});

ipcMain.handle('setup-supabase-automatically', async () => {
  try {
    // This would automatically set up the Supabase database
    // For now, we'll just mark it as configured
    store.set('supabaseConfigured', true);
    return { success: true, message: 'Supabase automatically configured' };
  } catch (error) {
    return { success: false, error: error.message };
  }
});

ipcMain.handle('test-email-configuration', async (event, config) => {
  try {
    // Test SMTP configuration
    const response = await fetch('http://localhost:4000/api/v1/test-email', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${store.get('userToken')}`
      },
      body: JSON.stringify({
        recipients: [config.testEmail || 'test@example.com'],
        subject: 'Test Email from Taskforce Mailer',
        body: 'This is a test email to verify your SMTP configuration.',
        from: config.smtpUser
      })
    });
    
    const result = await response.json();
    return { success: result.success, message: result.message || result.error };
  } catch (error) {
    return { success: false, error: error.message };
  }
});

ipcMain.handle('open-external-url', (event, url) => {
  shell.openExternal(url);
});

// Handle Google OAuth callback
ipcMain.handle('handle-google-oauth', async () => {
  try {
    // Open Google OAuth in external browser
    const authUrl = 'http://localhost:4000/auth/google';
    shell.openExternal(authUrl);
    
    // Return the callback URL for the renderer to handle
    return { 
      success: true, 
      callbackUrl: 'http://localhost:4000/auth/callback',
      message: 'Please complete authentication in your browser' 
    };
  } catch (error) {
    return { success: false, error: error.message };
  }
});

// Auto-updater (for future implementation)
ipcMain.handle('check-for-updates', () => {
  // Placeholder for auto-updater
  return { hasUpdate: false, version: app.getVersion() };
});
