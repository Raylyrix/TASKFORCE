// Simple Virtual Tab Management System
class SimpleTabManager {
    constructor() {
        this.tabs = new Map();
        this.activeTabId = null;
        this.tabCounter = 0;
        this.isInitialized = false;
        console.log('🚀 SimpleTabManager constructor called');
        this.init();
    }

    init() {
        console.log('🚀 SimpleTabManager initializing...');
        
        try {
            // Create the first default tab
            this.createTab('Main Tab');
            
            // Bind event listeners
            this.bindEventListeners();
            
            this.isInitialized = true;
            console.log('✅ SimpleTabManager initialized successfully');
        } catch (error) {
            console.error('❌ SimpleTabManager initialization failed:', error);
        }
    }

    bindEventListeners() {
        console.log('🔍 Binding event listeners...');
        
        // Try multiple ways to find the button
        let newTabBtn = document.getElementById('newTabBtn');
        if (!newTabBtn) {
            newTabBtn = document.querySelector('#newTabBtn');
        }
        if (!newTabBtn) {
            newTabBtn = document.querySelector('button[id="newTabBtn"]');
        }
        
        console.log('🔍 New tab button found:', !!newTabBtn, newTabBtn);
        
        if (newTabBtn) {
            // Remove any existing listeners
            newTabBtn.onclick = null;
            
            // Add new listener
            newTabBtn.onclick = (e) => {
                console.log('🖱️ New tab button clicked!');
                e.preventDefault();
                e.stopPropagation();
                this.createTab();
            };
            
            console.log('✅ New tab button event listener attached');
        } else {
            console.error('❌ New tab button not found!');
            // Try to find it after a delay
            setTimeout(() => {
                this.bindEventListeners();
            }, 1000);
        }
    }

    createTab(name = null) {
        this.tabCounter++;
        const tabId = `tab_${this.tabCounter}`;
        const tabName = name || `Tab ${this.tabCounter}`;
        
        console.log('🆕 Creating new tab:', tabId, 'with name:', tabName);
        
        // Create tab data
        const tabData = {
            id: tabId,
            name: tabName,
            email: null,
            isAuthenticated: false,
            isAuthenticating: false,
            isVirtual: true,
            gmailService: null,
            sheetsService: null,
            oauth2Client: null,
            sheetData: null,
            selectedSheetId: null,
            campaignData: null,
            attachmentsPaths: [],
            gmailSignature: null,
            lastActivity: Date.now(),
            created: Date.now()
        };
        
        this.tabs.set(tabId, tabData);
        this.renderTab(tabId);
        this.switchToTab(tabId);
        
        console.log('✅ Tab created successfully:', tabId);
        return tabId;
    }

    renderTab(tabId) {
        const tabData = this.tabs.get(tabId);
        if (!tabData) {
            console.error('❌ Tab data not found for:', tabId);
            return;
        }

        const tabList = document.getElementById('tabList');
        if (!tabList) {
            console.error('❌ Tab list element not found');
            return;
        }

        console.log('🎨 Rendering tab:', tabId, 'in tab list');

        const tabElement = document.createElement('div');
        tabElement.className = 'tab virtual-tab';
        tabElement.dataset.tabId = tabId;
        tabElement.dataset.isVirtual = 'true';
        
        const statusClass = tabData.isAuthenticating ? 'authenticating' : 
                           tabData.isAuthenticated ? 'authenticated' : 'virtual';
        
        tabElement.innerHTML = `
            <div class="tab-status ${statusClass}"></div>
            <div class="tab-email">${tabData.email || tabData.name}</div>
            <button class="tab-close" onclick="window.tabManager.closeTab('${tabId}')">&times;</button>
        `;
        
        tabElement.onclick = (e) => {
            if (!e.target.classList.contains('tab-close')) {
                this.switchToTab(tabId);
            }
        };
        
        tabList.appendChild(tabElement);
        console.log('✅ Tab element added to DOM:', tabId);
    }

    switchToTab(tabId) {
        if (!this.tabs.has(tabId)) return;
        
        console.log('🔄 Switching to tab:', tabId);
        
        // Update active tab
        this.activeTabId = tabId;
        
        // Update tab UI
        document.querySelectorAll('.tab').forEach(tab => {
            tab.classList.remove('active');
        });
        
        const activeTabElement = document.querySelector(`[data-tab-id="${tabId}"]`);
        if (activeTabElement) {
            activeTabElement.classList.add('active');
        }
        
        // Update main app state
        this.updateAppState(tabId);
    }

    updateAppState(tabId) {
        const tabData = this.tabs.get(tabId);
        if (!tabData) return;
        
        console.log('🔄 Updating app state for tab:', tabId);
        
        // Update the main RTXApp instance with current tab data
        if (window.rtxApp) {
            window.rtxApp.currentTabId = tabId;
            window.rtxApp.isAuthenticated = tabData.isAuthenticated;
            window.rtxApp.gmailSignature = tabData.gmailSignature;
            window.rtxApp.sheetData = tabData.sheetData;
            window.rtxApp.selectedSheetId = tabData.selectedSheetId;
            window.rtxApp.attachmentsPaths = tabData.attachmentsPaths;
            
            // Update last activity
            tabData.lastActivity = Date.now();
            
            // Update UI based on authentication status
            window.rtxApp.updateUI();
            
            console.log('✅ Tab switched to:', tabId, 'Authenticated:', tabData.isAuthenticated);
        }
    }

    closeTab(tabId) {
        if (this.tabs.size <= 1) {
            console.log('⚠️ Cannot close the last tab');
            return;
        }
        
        const tabData = this.tabs.get(tabId);
        if (!tabData) return;
        
        console.log('🗑️ Closing tab:', tabId);
        
        // Remove tab element
        const tabElement = document.querySelector(`[data-tab-id="${tabId}"]`);
        if (tabElement) {
            tabElement.remove();
        }
        
        // Remove tab data
        this.tabs.delete(tabId);
        
        // If we closed the active tab, switch to another tab
        if (this.activeTabId === tabId) {
            const remainingTabs = Array.from(this.tabs.keys());
            if (remainingTabs.length > 0) {
                this.switchToTab(remainingTabs[0]);
            }
        }
        
        console.log('✅ Tab closed:', tabId);
    }

    getCurrentTab() {
        return this.tabs.get(this.activeTabId);
    }

    updateTabStatus(tabId, updates) {
        const tabData = this.tabs.get(tabId);
        if (!tabData) return;
        
        Object.assign(tabData, updates);
        tabData.lastActivity = Date.now();
        
        // Re-render the tab if it's visible
        const tabElement = document.querySelector(`[data-tab-id="${tabId}"]`);
        if (tabElement) {
            const statusClass = tabData.isAuthenticating ? 'authenticating' : 
                               tabData.isAuthenticated ? 'authenticated' : 'virtual';
            
            const statusElement = tabElement.querySelector('.tab-status');
            if (statusElement) {
                statusElement.className = `tab-status ${statusClass}`;
            }
            
            const emailElement = tabElement.querySelector('.tab-email');
            if (emailElement) {
                emailElement.textContent = tabData.email || tabData.name;
            }
        }
        
        // Update app state if this is the active tab
        if (tabId === this.activeTabId) {
            this.updateAppState(tabId);
        }
    }

    // Method to authenticate a specific tab
    async authenticateTab(tabId, credentials) {
        const tabData = this.tabs.get(tabId);
        if (!tabData) return { success: false, error: 'Tab not found' };
        
        console.log('🔐 Authenticating tab:', tabId);
        
        try {
            this.updateTabStatus(tabId, { isAuthenticating: true });
            
            // Call the main authentication with tab context
            const result = await window.electronAPI.authenticateGoogleWithTab(credentials, tabId);
            
            if (result.success) {
                this.updateTabStatus(tabId, {
                    isAuthenticated: true,
                    isAuthenticating: false,
                    email: result.userEmail || 'authenticated'
                });
                
                console.log('✅ Tab authenticated:', tabId, 'Email:', result.userEmail);
                return { success: true, userEmail: result.userEmail };
            } else {
                this.updateTabStatus(tabId, { isAuthenticating: false });
                console.error('❌ Tab authentication failed:', tabId, result.error);
                return { success: false, error: result.error };
            }
        } catch (error) {
            this.updateTabStatus(tabId, { isAuthenticating: false });
            console.error('❌ Tab authentication error:', tabId, error.message);
            return { success: false, error: error.message };
        }
    }

    // Method to send email from a specific tab
    async sendEmailFromTab(tabId, emailData) {
        const tabData = this.tabs.get(tabId);
        if (!tabData) return { success: false, error: 'Tab not found' };
        
        if (!tabData.isAuthenticated) {
            return { success: false, error: 'Tab not authenticated' };
        }
        
        console.log('📧 Sending email from tab:', tabId);
        
        try {
            // Call the main email sending with tab context
            const result = await window.electronAPI.sendEmailWithTab(emailData, tabId);
            tabData.lastActivity = Date.now();
            return result;
        } catch (error) {
            console.error('❌ Tab email sending error:', tabId, error.message);
            return { success: false, error: error.message };
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