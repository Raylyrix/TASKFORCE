// Virtual Tab Management System for Multi-Account Support
class VirtualTabManager {
    constructor() {
        this.tabs = new Map();
        this.activeTabId = null;
        this.tabCounter = 0;
        this.isInitialized = false;
        this.init();
    }

    init() {
        console.log('🚀 VirtualTabManager initializing...');
        
        try {
            // Create the first default tab
            this.createVirtualTab('Main Tab');
            
            // Bind event listeners
            this.bindEventListeners();
            
            this.isInitialized = true;
            console.log('✅ VirtualTabManager initialized successfully');
        } catch (error) {
            console.error('❌ VirtualTabManager initialization failed:', error);
        }
    }

    bindEventListeners() {
        const newTabBtn = document.getElementById('newTabBtn');
        console.log('🔍 New tab button found:', !!newTabBtn);
        
        if (newTabBtn) {
            // Remove any existing listeners
            newTabBtn.removeEventListener('click', this.handleNewTabClick);
            this.handleNewTabClick = (e) => {
                console.log('🖱️ New tab button clicked!');
                e.preventDefault();
                e.stopPropagation();
                this.createVirtualTab();
            };
            newTabBtn.addEventListener('click', this.handleNewTabClick);
            console.log('✅ New tab button event listener attached');
        } else {
            console.error('❌ New tab button not found!');
        }
    }

    createVirtualTab(name = null) {
        this.tabCounter++;
        const tabId = `virtual_tab_${this.tabCounter}`;
        const tabName = name || `Virtual Tab ${this.tabCounter}`;
        
        console.log('🆕 Creating new virtual tab:', tabId, 'with name:', tabName);
        
        // Create completely virtual tab data - no interference with existing data
        const tabData = {
            id: tabId,
            name: tabName,
            email: null,
            isAuthenticated: false,
            isAuthenticating: false,
            isVirtual: true,
            // Virtual services - will be created when needed
            gmailService: null,
            sheetsService: null,
            oauth2Client: null,
            // Virtual data storage
            sheetData: null,
            selectedSheetId: null,
            campaignData: null,
            attachmentsPaths: [],
            gmailSignature: null,
            // Virtual state
            lastActivity: Date.now(),
            created: Date.now()
        };
        
        this.tabs.set(tabId, tabData);
        this.renderVirtualTab(tabId);
        this.switchToVirtualTab(tabId);
        
        console.log('✅ Virtual tab created successfully:', tabId);
        return tabId;
    }

    renderVirtualTab(tabId) {
        const tabData = this.tabs.get(tabId);
        if (!tabData) {
            console.error('❌ Virtual tab data not found for:', tabId);
            return;
        }

        const tabList = document.getElementById('tabList');
        if (!tabList) {
            console.error('❌ Tab list element not found');
            return;
        }

        console.log('🎨 Rendering virtual tab:', tabId, 'in tab list');

        const tabElement = document.createElement('div');
        tabElement.className = 'tab virtual-tab';
        tabElement.dataset.tabId = tabId;
        tabElement.dataset.isVirtual = 'true';
        
        const statusClass = tabData.isAuthenticating ? 'authenticating' : 
                           tabData.isAuthenticated ? 'authenticated' : 'virtual';
        
        tabElement.innerHTML = `
            <div class="tab-status ${statusClass}"></div>
            <div class="tab-email">${tabData.email || tabData.name}</div>
            <button class="tab-close" onclick="window.tabManager.closeVirtualTab('${tabId}')">&times;</button>
        `;
        
        tabElement.addEventListener('click', (e) => {
            if (!e.target.classList.contains('tab-close')) {
                this.switchToVirtualTab(tabId);
            }
        });
        
        tabList.appendChild(tabElement);
        console.log('✅ Virtual tab element added to DOM:', tabId);
    }

    switchToVirtualTab(tabId) {
        if (!this.tabs.has(tabId)) return;
        
        console.log('🔄 Switching to virtual tab:', tabId);
        
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
        
        // Update main app state with virtual tab data
        this.updateVirtualAppState(tabId);
    }

    updateVirtualAppState(tabId) {
        const tabData = this.tabs.get(tabId);
        if (!tabData) return;
        
        console.log('🔄 Updating app state for virtual tab:', tabId);
        
        // Update the main RTXApp instance with current virtual tab data
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
            
            console.log('✅ Virtual tab switched to:', tabId, 'Authenticated:', tabData.isAuthenticated);
        }
    }

    closeVirtualTab(tabId) {
        if (this.tabs.size <= 1) {
            console.log('⚠️ Cannot close the last virtual tab');
            return;
        }
        
        const tabData = this.tabs.get(tabId);
        if (!tabData) return;
        
        console.log('🗑️ Closing virtual tab:', tabId);
        
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
                this.switchToVirtualTab(remainingTabs[0]);
            }
        }
        
        console.log('✅ Virtual tab closed:', tabId);
    }

    getCurrentVirtualTab() {
        return this.tabs.get(this.activeTabId);
    }

    updateVirtualTabStatus(tabId, updates) {
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
            this.updateVirtualAppState(tabId);
        }
    }

    // Method to authenticate a specific virtual tab
    async authenticateVirtualTab(tabId, credentials) {
        const tabData = this.tabs.get(tabId);
        if (!tabData) return { success: false, error: 'Virtual tab not found' };
        
        console.log('🔐 Authenticating virtual tab:', tabId);
        
        try {
            this.updateVirtualTabStatus(tabId, { isAuthenticating: true });
            
            // Call the main authentication with tab context
            const result = await window.electronAPI.authenticateGoogleWithTab(credentials, tabId);
            
            if (result.success) {
                this.updateVirtualTabStatus(tabId, {
                    isAuthenticated: true,
                    isAuthenticating: false,
                    email: result.userEmail || 'authenticated'
                });
                
                console.log('✅ Virtual tab authenticated:', tabId, 'Email:', result.userEmail);
                return { success: true, userEmail: result.userEmail };
            } else {
                this.updateVirtualTabStatus(tabId, { isAuthenticating: false });
                console.error('❌ Virtual tab authentication failed:', tabId, result.error);
                return { success: false, error: result.error };
            }
        } catch (error) {
            this.updateVirtualTabStatus(tabId, { isAuthenticating: false });
            console.error('❌ Virtual tab authentication error:', tabId, error.message);
            return { success: false, error: error.message };
        }
    }

    // Method to send email from a specific virtual tab
    async sendEmailFromVirtualTab(tabId, emailData) {
        const tabData = this.tabs.get(tabId);
        if (!tabData) return { success: false, error: 'Virtual tab not found' };
        
        if (!tabData.isAuthenticated) {
            return { success: false, error: 'Virtual tab not authenticated' };
        }
        
        console.log('📧 Sending email from virtual tab:', tabId);
        
        try {
            // Call the main email sending with tab context
            const result = await window.electronAPI.sendEmailWithTab(emailData, tabId);
            tabData.lastActivity = Date.now();
            return result;
        } catch (error) {
            console.error('❌ Virtual tab email sending error:', tabId, error.message);
            return { success: false, error: error.message };
        }
    }
}

// Initialize virtual tab manager when DOM is loaded
document.addEventListener('DOMContentLoaded', () => {
    console.log('🚀 DOM loaded, initializing VirtualTabManager...');
    try {
        window.tabManager = new VirtualTabManager();
        console.log('✅ VirtualTabManager created and assigned to window.tabManager');
    } catch (error) {
        console.error('❌ Failed to initialize VirtualTabManager:', error);
    }
});


