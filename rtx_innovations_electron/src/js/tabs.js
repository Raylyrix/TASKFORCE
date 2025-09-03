// Tab Management System for Multi-Account Support
class TabManager {
    constructor() {
        this.tabs = new Map();
        this.activeTabId = null;
        this.tabCounter = 0;
        this.init();
    }

    init() {
        console.log('🚀 TabManager initializing...');
        
        // Create the first default tab
        this.createTab('Default Tab');
        
        // Bind event listeners
        const newTabBtn = document.getElementById('newTabBtn');
        console.log('🔍 New tab button found:', !!newTabBtn);
        
        if (newTabBtn) {
            newTabBtn.addEventListener('click', (e) => {
                console.log('🖱️ New tab button clicked!');
                e.preventDefault();
                this.createTab();
            });
            console.log('✅ New tab button event listener attached');
        } else {
            console.error('❌ New tab button not found!');
        }
        
        console.log('✅ TabManager initialized');
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
            gmailService: null,
            sheetsService: null,
            oauth2Client: null,
            sheetData: null,
            selectedSheetId: null,
            campaignData: null,
            attachmentsPaths: [],
            gmailSignature: null
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
        tabElement.className = 'tab';
        tabElement.dataset.tabId = tabId;
        
        const statusClass = tabData.isAuthenticating ? 'authenticating' : 
                           tabData.isAuthenticated ? 'authenticated' : '';
        
        tabElement.innerHTML = `
            <div class="tab-status ${statusClass}"></div>
            <div class="tab-email">${tabData.email || tabData.name}</div>
            <button class="tab-close" onclick="window.tabManager.closeTab('${tabId}')">&times;</button>
        `;
        
        tabElement.addEventListener('click', (e) => {
            if (!e.target.classList.contains('tab-close')) {
                this.switchToTab(tabId);
            }
        });
        
        tabList.appendChild(tabElement);
        console.log('✅ Tab element added to DOM:', tabId);
    }

    switchToTab(tabId) {
        if (!this.tabs.has(tabId)) return;
        
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
        
        // Update the main RTXApp instance with current tab data
        if (window.rtxApp) {
            window.rtxApp.currentTabId = tabId;
            window.rtxApp.isAuthenticated = tabData.isAuthenticated;
            window.rtxApp.gmailSignature = tabData.gmailSignature;
            window.rtxApp.sheetData = tabData.sheetData;
            window.rtxApp.selectedSheetId = tabData.selectedSheetId;
            window.rtxApp.attachmentsPaths = tabData.attachmentsPaths;
            
            // Update UI based on authentication status
            window.rtxApp.updateUI();
            
            console.log('✅ Tab switched to:', tabId, 'Authenticated:', tabData.isAuthenticated);
        }
    }

    closeTab(tabId) {
        if (this.tabs.size <= 1) {
            // Don't allow closing the last tab
            return;
        }
        
        const tabData = this.tabs.get(tabId);
        if (!tabData) return;
        
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
    }

    getCurrentTab() {
        return this.tabs.get(this.activeTabId);
    }

    updateTabStatus(tabId, updates) {
        const tabData = this.tabs.get(tabId);
        if (!tabData) return;
        
        Object.assign(tabData, updates);
        
        // Re-render the tab if it's visible
        const tabElement = document.querySelector(`[data-tab-id="${tabId}"]`);
        if (tabElement) {
            const statusClass = tabData.isAuthenticating ? 'authenticating' : 
                               tabData.isAuthenticated ? 'authenticated' : '';
            
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
                
                return { success: true, userEmail: result.userEmail };
            } else {
                this.updateTabStatus(tabId, { isAuthenticating: false });
                return { success: false, error: result.error };
            }
        } catch (error) {
            this.updateTabStatus(tabId, { isAuthenticating: false });
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
        
        try {
            // Call the main email sending with tab context
            const result = await window.electronAPI.sendEmailWithTab(emailData, tabId);
            return result;
        } catch (error) {
            return { success: false, error: error.message };
        }
    }
}

// Initialize tab manager when DOM is loaded
document.addEventListener('DOMContentLoaded', () => {
    console.log('🚀 DOM loaded, initializing TabManager...');
    window.tabManager = new TabManager();
    console.log('✅ TabManager created and assigned to window.tabManager');
});


