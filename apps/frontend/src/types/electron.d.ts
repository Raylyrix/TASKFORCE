declare global {
  interface Window {
    electronAPI: {
      // App info
      getAppVersion: () => Promise<string>;
      
      // User settings
      getUserSettings: () => Promise<any>;
      saveUserSettings: (settings: any) => Promise<boolean>;
      clearUserData: () => Promise<boolean>;
      
      // Authentication
      handleGoogleOAuth: () => Promise<{ success: boolean; callbackUrl: string; message: string }>;
      onUserAuthenticated: (callback: (event: any, data: any) => void) => void;
      
      // Configuration testing
      testSupabaseConnection: () => Promise<{ success: boolean; status?: number; error?: string }>;
      setupSupabaseAutomatically: () => Promise<{ success: boolean; message: string }>;
      testEmailConfiguration: (config: any) => Promise<{ success: boolean; message: string }>;
      
      // External links
      openExternalUrl: (url: string) => Promise<void>;
      
      // Updates
      checkForUpdates: () => Promise<{ hasUpdate: boolean; version: string }>;
      
      // Remove listeners
      removeAllListeners: (channel: string) => void;
    };
  }
}

export {};
