const { contextBridge, ipcRenderer } = require('electron');

// Expose protected methods that allow the renderer process to use
// the ipcRenderer without exposing the entire object
contextBridge.exposeInMainWorld('electronAPI', {
  // App info
  getAppVersion: () => ipcRenderer.invoke('get-app-version'),
  
  // User settings
  getUserSettings: () => ipcRenderer.invoke('get-user-settings'),
  saveUserSettings: (settings) => ipcRenderer.invoke('save-user-settings', settings),
  clearUserData: () => ipcRenderer.invoke('clear-user-data'),
  
  // Authentication
  handleGoogleOAuth: () => ipcRenderer.invoke('handle-google-oauth'),
  onUserAuthenticated: (callback) => ipcRenderer.on('user-authenticated', callback),
  
  // Configuration testing
  testSupabaseConnection: () => ipcRenderer.invoke('test-supabase-connection'),
  setupSupabaseAutomatically: () => ipcRenderer.invoke('setup-supabase-automatically'),
  testEmailConfiguration: (config) => ipcRenderer.invoke('test-email-configuration', config),
  
  // External links
  openExternalUrl: (url) => ipcRenderer.invoke('open-external-url', url),
  
  // Updates
  checkForUpdates: () => ipcRenderer.invoke('check-for-updates'),
  
  // Remove listeners
  removeAllListeners: (channel) => ipcRenderer.removeAllListeners(channel)
});
