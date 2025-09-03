// Simple and Robust Tab Management System
class SimpleTabManager {
    constructor() {
        this.windows = new Map();
        this.windowCounter = 0;
        this.isInitialized = false;
        console.log('🚀 SimpleTabManager constructor called');
        this.init();
    }

    init() {
        console.log('🚀 SimpleTabManager initializing...');
        
        try {
            // Wait for DOM to be ready
            if (document.readyState === 'loading') {
                document.addEventListener('DOMContentLoaded', () => this.bindEventListeners());
            } else {
                this.bindEventListeners();
            }
            
            this.isInitialized = true;
            console.log('✅ SimpleTabManager initialized successfully');
        } catch (error) {
            console.error('❌ SimpleTabManager initialization failed:', error);
        }
    }

    bindEventListeners() {
        console.log('🔍 Binding event listeners...');
        
        // Find the new tab button
        const newTabBtn = document.getElementById('newTabBtn');
        console.log('🔍 New tab button found:', !!newTabBtn, newTabBtn);
        
        if (newTabBtn) {
            // Remove any existing listeners
            newTabBtn.onclick = null;
            
            // Add new listener with proper error handling
            newTabBtn.onclick = (e) => {
                console.log('🖱️ New tab button clicked!');
                e.preventDefault();
                e.stopPropagation();
                
                try {
                    this.createNewWindow();
                } catch (error) {
                    console.error('❌ Error creating new window:', error);
                    alert('Failed to create new window: ' + error.message);
                }
            };
            
            console.log('✅ New tab button event listener attached');
        } else {
            console.error('❌ New tab button not found!');
            // Try again after a delay
            setTimeout(() => {
                this.bindEventListeners();
            }, 1000);
        }
    }

    createNewWindow() {
        this.windowCounter++;
        const windowId = `window_${this.windowCounter}`;
        
        console.log('🆕 Creating new window:', windowId);
        
        try {
            // Check if electronAPI is available
            if (window.electronAPI && window.electronAPI.createNewWindow) {
                // Use Electron API to create new window
                window.electronAPI.createNewWindow(windowId)
                    .then(result => {
                        if (result && result.success) {
                            console.log('✅ New window created successfully:', windowId);
                            this.windows.set(windowId, { id: windowId, isAuthenticated: false, email: null });
                        } else {
                            console.error('❌ Failed to create new window:', result?.error);
                            alert('Failed to create new window: ' + (result?.error || 'Unknown error'));
                        }
                    })
                    .catch(error => {
                        console.error('❌ Error creating new window:', error);
                        alert('Failed to create new window: ' + error.message);
                    });
            } else {
                // Fallback: open in browser (for development)
                const newWindow = window.open(window.location.href, `_blank`);
                if (newWindow) {
                    newWindow.focus();
                    console.log('✅ New window opened in browser');
                    this.windows.set(windowId, { id: windowId, isAuthenticated: false, email: null });
                } else {
                    console.error('❌ Failed to open new window');
                    alert('Failed to open new window. Please check your browser settings.');
                }
            }
        } catch (error) {
            console.error('❌ Failed to create new window:', error);
            alert('Failed to create new window: ' + error.message);
        }
    }

    // Method to authenticate in a specific window
    async authenticateWindow(windowId, credentials) {
        console.log(`🔐 Authenticating window ${windowId}...`);
        try {
            // For now, just authenticate in the current window
            const result = await window.electronAPI.authenticateGoogle(credentials);
            console.log(`✅ Authentication result for window ${windowId}:`, result);
            return result;
        } catch (error) {
            console.error(`❌ Authentication failed for window ${windowId}:`, error);
            throw error;
        }
    }

    // Method to send email from a specific window
    async sendEmailFromWindow(windowId, emailData) {
        console.log(`📧 Sending email from window ${windowId}...`);
        try {
            // For now, just send from the current window
            const result = await window.electronAPI.sendTestEmail(emailData);
            console.log(`✅ Email sent result for window ${windowId}:`, result);
            return result;
        } catch (error) {
            console.error(`❌ Email sending failed for window ${windowId}:`, error);
            throw error;
        }
    }
}

// Initialize tab manager when DOM is loaded
document.addEventListener('DOMContentLoaded', () => {
    console.log('🚀 DOM loaded, initializing SimpleTabManager...');
    try {
        window.tabManager = new SimpleTabManager();
        console.log('✅ SimpleTabManager created and assigned to window.tabManager');
    } catch (error) {
        console.error('❌ Failed to initialize SimpleTabManager:', error);
    }
});

// Also try to initialize after a delay in case DOM isn't ready
setTimeout(() => {
    if (!window.tabManager) {
        console.log('🚀 Delayed initialization of SimpleTabManager...');
        try {
            window.tabManager = new SimpleTabManager();
            console.log('✅ SimpleTabManager created via delayed initialization');
        } catch (error) {
            console.error('❌ Failed delayed initialization of SimpleTabManager:', error);
        }
    }
}, 2000);