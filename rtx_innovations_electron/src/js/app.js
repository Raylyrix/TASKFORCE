// Import CSS files
import '../styles/main.css';
import '../styles/animations.css';
import '../styles/components.css';

console.log('🚀 CSS files imported successfully');
console.log('🚀 app.js is loading...');

// RTX Innovations - AutoMailer Pro
class RTXApp {
    constructor() {
        // Core state management
        this.tabs = new Map();
        this.currentTabId = 'tab1';
        this.tabCounter = 1;
        
        // Authentication state per tab
        this.tabAuthStates = new Map();
        
        // Campaign state
        this.campaigns = new Map();
        this.isCampaignRunning = false;
        this.campaignProgress = 0;
        
        // UI elements
        this.placeholderDropdown = null;
        this.notificationContainer = null;
        
        // Initialize the app
        this.init();
    }

    init() {
        console.log('🚀 RTX Innovations AutoMailer Pro initializing...');
        
        // Wait for DOM to be ready
        if (document.readyState === 'loading') {
            document.addEventListener('DOMContentLoaded', () => this.setupApp());
        } else {
            this.setupApp();
        }
    }

    setupApp() {
        try {
            // Set up core systems
            this.setupTabSystem();
            this.setupAuthentication();
            this.setupPlaceholderSystem();
            this.setupEventListeners();
            this.setupNotifications();
            this.setupCampaignControls();
            
            // Initialize first tab
            this.initializeFirstTab();
            
            console.log('✅ RTX Innovations AutoMailer Pro initialized successfully!');
            this.showNotification('AutoMailer Pro loaded successfully!', 'success');
        } catch (error) {
            console.error('❌ Failed to initialize app:', error);
            this.showNotification('Failed to initialize app: ' + error.message, 'error');
        }
    }

    // ===== TAB MANAGEMENT SYSTEM =====
    setupTabSystem() {
        try {
            const tabList = document.getElementById('tabList');
            if (!tabList) {
                console.error('❌ Tab list not found');
                return;
            }

            // Set up add tab button
            const addTabBtn = document.getElementById('add-tab-btn');
            if (addTabBtn) {
                addTabBtn.addEventListener('click', () => this.addNewTab());
            }

            // Set up tab switching
            document.addEventListener('click', (e) => {
                if (e.target.classList.contains('tab-item') || e.target.closest('.tab-item')) {
                    const tabItem = e.target.classList.contains('tab-item') ? e.target : e.target.closest('.tab-item');
                    const tabId = tabItem.getAttribute('data-tab');
                    if (tabId) {
                        this.switchTab(tabId);
                    }
                }

                // Handle tab close
                if (e.target.classList.contains('tab-close')) {
                    e.stopPropagation();
                    const tabItem = e.target.closest('.tab-item');
                    const tabId = tabItem.getAttribute('data-tab');
                    this.closeTab(tabId);
                }
            });

            console.log('✅ Tab system setup complete');
        } catch (error) {
            console.error('❌ Failed to setup tab system:', error);
        }
    }

    initializeFirstTab() {
        try {
            const firstTab = document.querySelector('[data-tab="tab1"]');
            if (firstTab) {
                this.switchTab('tab1');
                this.initializeTabContent('tab1');
            }
        } catch (error) {
            console.error('❌ Failed to initialize first tab:', error);
        }
    }

    addNewTab() {
        try {
            this.tabCounter++;
            const tabId = `tab${this.tabCounter}`;
            const tabName = `Campaign ${this.tabCounter}`;

            // Create tab button
            const tabList = document.getElementById('tabList');
            const newTab = document.createElement('li');
            newTab.className = 'tab-item';
            newTab.setAttribute('data-tab', tabId);
            newTab.innerHTML = `
                ${tabName}
                <span class="tab-close">&times;</span>
            `;
            tabList.appendChild(newTab);

            // Create tab content
            this.createTabContent(tabId);
            
            // Initialize tab state
            this.initializeTabContent(tabId);
            
            // Switch to new tab
            this.switchTab(tabId);
            
            console.log('✅ New tab created:', tabId);
            this.showNotification(`New campaign tab "${tabName}" created`, 'success');
        } catch (error) {
            console.error('❌ Failed to create new tab:', error);
            this.showNotification('Failed to create new tab', 'error');
        }
    }

    createTabContent(tabId) {
        try {
            const contentArea = document.querySelector('.content-area');
            if (!contentArea) return;

            // Create tab content container
            const tabContent = document.createElement('div');
            tabContent.className = 'tab-content';
            tabContent.id = `content-${tabId}`;
            tabContent.style.display = 'none';

            // Clone the main interface
            const mainInterface = document.querySelector('.mailer-interface');
            if (mainInterface) {
                const clonedInterface = mainInterface.cloneNode(true);
                clonedInterface.id = `interface-${tabId}`;
                
                // Update element IDs to be unique
                this.updateElementIds(clonedInterface, tabId);
                
                // Reset form state
                this.resetFormState(clonedInterface);
                
                tabContent.appendChild(clonedInterface);
            }

            contentArea.appendChild(tabContent);
            
            // Store tab reference
            this.tabs.set(tabId, {
                id: tabId,
                name: `Campaign ${tabId.replace('tab', '')}`,
                content: tabContent,
                authState: {
                    isAuthenticated: false,
                    account: null,
                    sheetData: null
                }
            });

        } catch (error) {
            console.error('❌ Failed to create tab content:', error);
        }
    }

    updateElementIds(element, tabId) {
        try {
            const elements = element.querySelectorAll('[id]');
            elements.forEach(el => {
                if (el.id) {
                    el.id = `${el.id}-${tabId}`;
                }
            });
        } catch (error) {
            console.error('❌ Failed to update element IDs:', error);
        }
    }

    resetFormState(interfaceElement) {
        try {
            // Reset inputs
            const inputs = interfaceElement.querySelectorAll('input[type="text"], input[type="email"], textarea');
            inputs.forEach(input => {
                if (input.type !== 'checkbox' && input.type !== 'radio') {
                    input.value = '';
                }
            });

            // Reset email editor
            const editor = interfaceElement.querySelector('[id*="emailEditor"]');
            if (editor) {
                editor.innerHTML = '';
            }

            // Reset attachments
            const attachmentContainer = interfaceElement.querySelector('[id*="campaignAttachments"]');
            if (attachmentContainer) {
                attachmentContainer.innerHTML = `
                    <div style="text-align: center; color: #8E8E93; padding: 20px;">
                        <i class="fas fa-paperclip" style="font-size: 24px; margin-bottom: 8px; display: block;"></i>
                        <p>No attachments selected</p>
                        <small>Attachments are required by default</small>
                    </div>
                `;
            }

            // Reset preview
            const preview = interfaceElement.querySelector('[id*="emailPreview"]');
            if (preview) {
                preview.innerHTML = `
                    <div style="text-align: center; color: #8E8E93; padding: 40px 20px;">
                        <i class="fas fa-eye" style="font-size: 32px; margin-bottom: 16px; display: block;"></i>
                        <p>Preview will appear here after you fill in the campaign details</p>
                    </div>
                `;
            }

        } catch (error) {
            console.error('❌ Failed to reset form state:', error);
        }
    }

    switchTab(tabId) {
        try {
            // Hide all tab content
            const tabContents = document.querySelectorAll('.tab-content');
            tabContents.forEach(content => {
                content.style.display = 'none';
            });

            // Remove active state from all tabs
            const tabs = document.querySelectorAll('.tab-item');
            tabs.forEach(tab => {
                tab.classList.remove('active');
                tab.style.background = '#e5e5e7';
                tab.style.color = '#2c2c2e';
            });

            // Show selected tab content
            const selectedContent = document.getElementById(`content-${tabId}`);
            if (selectedContent) {
                selectedContent.style.display = 'block';
            }

            // Activate selected tab
            const selectedTab = document.querySelector(`[data-tab="${tabId}"]`);
            if (selectedTab) {
                selectedTab.classList.add('active');
                selectedTab.style.background = '#007AFF';
                selectedTab.style.color = '#fff';
            }

            // Update current tab
            this.currentTabId = tabId;
            
            // Update authentication display
            this.updateAuthenticationDisplay(tabId);
            
            console.log('✅ Switched to tab:', tabId);
        } catch (error) {
            console.error('❌ Failed to switch tab:', error);
        }
    }

    closeTab(tabId) {
        try {
            // Don't close the last tab
            const tabList = document.getElementById('tabList');
            if (tabList.children.length <= 1) {
                this.showNotification('Cannot close the last tab', 'warning');
                return;
            }

            // Remove tab button
            const tabButton = document.querySelector(`[data-tab="${tabId}"]`);
            if (tabButton) {
                tabButton.remove();
            }

            // Remove tab content
            const tabContent = document.getElementById(`content-${tabId}`);
            if (tabContent) {
                tabContent.remove();
            }

            // Clean up tab data
            this.tabs.delete(tabId);
            this.tabAuthStates.delete(tabId);

            // Switch to first available tab
            const firstTab = tabList.querySelector('.tab-item');
            if (firstTab) {
                const firstTabId = firstTab.getAttribute('data-tab');
                this.switchTab(firstTabId);
            }

            console.log('✅ Tab closed:', tabId);
            this.showNotification('Tab closed successfully', 'success');
        } catch (error) {
            console.error('❌ Failed to close tab:', error);
        }
    }

    // ===== AUTHENTICATION SYSTEM =====
    setupAuthentication() {
        try {
            // Set up authentication buttons
            document.addEventListener('click', (e) => {
                if (e.target.id === 'googleSignInBtn' || e.target.closest('#googleSignInBtn')) {
                    this.authenticateWithGoogle();
                }
                
                if (e.target.id === 'importSheetsBtn' || e.target.closest('#importSheetsBtn')) {
                    this.importGoogleSheets();
                }
            });

            console.log('✅ Authentication system setup complete');
        } catch (error) {
            console.error('❌ Failed to setup authentication:', error);
        }
    }

    async authenticateWithGoogle() {
        try {
            const tabId = this.currentTabId;
            this.showNotification('Authenticating with Google...', 'info');
            
            // Simulate fast authentication (replace with real OAuth flow)
            await new Promise(resolve => setTimeout(resolve, 1000));
            
            // Update tab authentication state
            if (!this.tabAuthStates.has(tabId)) {
                this.tabAuthStates.set(tabId, {});
            }
            
            const authState = this.tabAuthStates.get(tabId);
            authState.isAuthenticated = true;
            authState.account = `user-${tabId}@example.com`;
            authState.sheetData = null;
            
            // Update UI
            this.updateAuthenticationDisplay(tabId);
            
            this.showNotification('Successfully authenticated with Google!', 'success');
            console.log('✅ Google authentication successful for tab:', tabId);
        } catch (error) {
            console.error('❌ Google authentication failed:', error);
            this.showNotification('Authentication failed: ' + error.message, 'error');
        }
    }

    async importGoogleSheets() {
        try {
            const tabId = this.currentTabId;
            const authState = this.tabAuthStates.get(tabId);
            
            if (!authState || !authState.isAuthenticated) {
                this.showNotification('Please authenticate with Google first', 'warning');
                return;
            }
            
            this.showNotification('Importing Google Sheets...', 'info');
            
            // Simulate sheet import (replace with real Google Sheets API)
            await new Promise(resolve => setTimeout(resolve, 1500));
            
            // Mock sheet data
            const sheetData = {
                headers: ['Name', 'Email', 'Company', 'Title'],
                rows: [
                    ['John Doe', 'john@example.com', 'Tech Corp', 'Developer'],
                    ['Jane Smith', 'jane@example.com', 'Design Inc', 'Designer']
                ]
            };
            
            authState.sheetData = sheetData;
            
            // Update UI
            this.updateDataPreview(tabId, sheetData);
            
            this.showNotification('Google Sheets imported successfully!', 'success');
            console.log('✅ Sheets imported for tab:', tabId);
        } catch (error) {
            console.error('❌ Failed to import sheets:', error);
            this.showNotification('Failed to import sheets: ' + error.message, 'error');
        }
    }

    updateAuthenticationDisplay(tabId) {
        try {
            const authState = this.tabAuthStates.get(tabId);
            if (!authState) return;
            
            const interfaceElement = document.getElementById(`interface-${tabId}`);
            if (!interfaceElement) return;
            
            const authStatus = interfaceElement.querySelector('[id*="authStatus"]');
            const accountStatus = interfaceElement.querySelector('[id*="accountStatus"]');
            
            if (authStatus) {
                authStatus.className = authState.isAuthenticated ? 'status-indicator connected' : 'status-indicator disconnected';
                authStatus.textContent = authState.isAuthenticated ? 'Connected' : 'Disconnected';
            }
            
            if (accountStatus) {
                accountStatus.textContent = authState.isAuthenticated ? 
                    `Account: ${authState.account}` : 'Not Connected';
            }
            
        } catch (error) {
            console.error('❌ Failed to update authentication display:', error);
        }
    }

    updateDataPreview(tabId, sheetData) {
        try {
            const interfaceElement = document.getElementById(`interface-${tabId}`);
            if (!interfaceElement) return;
            
            const dataPreview = interfaceElement.querySelector('[id*="dataPreviewDrawer"]');
            if (!dataPreview) return;
            
            let previewHTML = '<h4>Sheet Data Preview</h4>';
            previewHTML += '<table style="width: 100%; border-collapse: collapse;">';
            
            // Headers
            previewHTML += '<tr style="background: #f8f9fa;">';
            sheetData.headers.forEach(header => {
                previewHTML += `<th style="padding: 8px; border: 1px solid #ddd; text-align: left;">${header}</th>`;
            });
            previewHTML += '</tr>';
            
            // First few rows
            sheetData.rows.slice(0, 3).forEach(row => {
                previewHTML += '<tr>';
                row.forEach(cell => {
                    previewHTML += `<td style="padding: 8px; border: 1px solid #ddd;">${cell}</td>`;
                });
                previewHTML += '</tr>';
            });
            
            previewHTML += '</table>';
            previewHTML += `<p style="margin-top: 10px; color: #666;">Showing ${Math.min(3, sheetData.rows.length)} of ${sheetData.rows.length} rows</p>`;
            
            dataPreview.innerHTML = previewHTML;
            dataPreview.style.display = 'block';
            
        } catch (error) {
            console.error('❌ Failed to update data preview:', error);
        }
    }

    // ===== PLACEHOLDER SYSTEM =====
    setupPlaceholderSystem() {
        try {
            // Create placeholder dropdown
            this.createPlaceholderDropdown();
            
            // Set up event listeners for @ symbol
            document.addEventListener('input', (e) => {
                if (e.target.matches('[id*="emailEditor"], [id*="campaignSubject"]')) {
                    this.handlePlaceholderInput(e);
                }
            });
            
            // Hide dropdown when clicking outside
            document.addEventListener('click', (e) => {
                if (!e.target.closest('.placeholder-dropdown') && 
                    !e.target.matches('[id*="emailEditor"], [id*="campaignSubject"]')) {
                    this.hidePlaceholderDropdown();
                }
            });
            
            console.log('✅ Placeholder system setup complete');
        } catch (error) {
            console.error('❌ Failed to setup placeholder system:', error);
        }
    }

    createPlaceholderDropdown() {
        try {
            // Remove existing dropdown
            const existing = document.querySelector('.placeholder-dropdown');
            if (existing) existing.remove();
            
            // Create new dropdown
            this.placeholderDropdown = document.createElement('div');
            this.placeholderDropdown.className = 'placeholder-dropdown';
            this.placeholderDropdown.style.cssText = `
                position: fixed;
                background: white;
                border: 1px solid #ddd;
                border-radius: 6px;
                box-shadow: 0 4px 20px rgba(0,0,0,0.15);
                max-height: 250px;
                overflow-y: auto;
                z-index: 10000;
                display: none;
                min-width: 250px;
                font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;
            `;
            
            document.body.appendChild(this.placeholderDropdown);
            
        } catch (error) {
            console.error('❌ Failed to create placeholder dropdown:', error);
        }
    }

    handlePlaceholderInput(e) {
        try {
            const value = e.target.value;
            const cursorPos = e.target.selectionStart;
            const textBeforeCursor = value.substring(0, cursorPos);
            
            // Check if @ symbol was just typed
            if (textBeforeCursor.endsWith('@')) {
                this.showPlaceholderDropdown(e.target, cursorPos);
            } else if (textBeforeCursor.includes('@')) {
                // Filter placeholders based on input after @
                const afterAt = textBeforeCursor.substring(textBeforeCursor.lastIndexOf('@') + 1);
                this.filterPlaceholders(afterAt, e.target, cursorPos);
            } else {
                this.hidePlaceholderDropdown();
            }
        } catch (error) {
            console.error('❌ Failed to handle placeholder input:', error);
        }
    }

    showPlaceholderDropdown(editor, cursorPos) {
        try {
            if (!this.placeholderDropdown) return;
            
            // Get editor position
            const rect = editor.getBoundingClientRect();
            const textBeforeAt = editor.value.substring(0, cursorPos);
            
            // Create temporary span to measure text width
            const tempSpan = document.createElement('span');
            tempSpan.style.cssText = 'position: absolute; visibility: hidden; white-space: pre; font-family: inherit; font-size: inherit;';
            tempSpan.textContent = textBeforeAt;
            document.body.appendChild(tempSpan);
            
            const textWidth = tempSpan.offsetWidth;
            document.body.removeChild(tempSpan);
            
            // Position dropdown
            this.placeholderDropdown.style.left = `${rect.left + textWidth}px`;
            this.placeholderDropdown.style.top = `${rect.bottom + 5}px`;
            
            // Show placeholders
            this.populatePlaceholderDropdown();
            
            this.placeholderDropdown.style.display = 'block';
            
        } catch (error) {
            console.error('❌ Failed to show placeholder dropdown:', error);
        }
    }

    populatePlaceholderDropdown() {
        try {
            const tabId = this.currentTabId;
            const authState = this.tabAuthStates.get(tabId);
            
            let placeholders = [
                { key: 'Name', value: '((Name))', description: 'Recipient name' },
                { key: 'Email', value: '((Email))', description: 'Email address' },
                { key: 'Company', value: '((Company))', description: 'Company name' },
                { key: 'Title', value: '((Title))', description: 'Job title' },
                { key: 'Phone', value: '((Phone))', description: 'Phone number' }
            ];
            
            // Add sheet-specific placeholders if available
            if (authState && authState.sheetData) {
                authState.sheetData.headers.forEach(header => {
                    placeholders.push({
                        key: header,
                        value: `((${header}))`,
                        description: `From sheet: ${header}`
                    });
                });
            }
            
            // Render placeholders
            this.placeholderDropdown.innerHTML = placeholders.map(p => `
                <div class="placeholder-item" data-value="${p.value}" style="
                    padding: 12px 16px;
                    cursor: pointer;
                    border-bottom: 1px solid #f0f0f0;
                    transition: background-color 0.2s;
                " onmouseover="this.style.background='#f8f9fa'" onmouseout="this.style.background='white'">
                    <div style="font-weight: 600; color: #333;">${p.key}</div>
                    <div style="font-size: 12px; color: #666; margin-top: 2px;">${p.description}</div>
                </div>
            `).join('');
            
            // Add click handlers
            this.placeholderDropdown.querySelectorAll('.placeholder-item').forEach(item => {
                item.addEventListener('click', () => {
                    this.insertPlaceholder(item.dataset.value);
                });
            });
            
        } catch (error) {
            console.error('❌ Failed to populate placeholder dropdown:', error);
        }
    }

    filterPlaceholders(query, editor, cursorPos) {
        try {
            if (!this.placeholderDropdown) return;
            
            const tabId = this.currentTabId;
            const authState = this.tabAuthStates.get(tabId);
            
            let allPlaceholders = [
                { key: 'Name', value: '((Name))', description: 'Recipient name' },
                { key: 'Email', value: '((Email))', description: 'Email address' },
                { key: 'Company', value: '((Company))', description: 'Company name' },
                { key: 'Title', value: '((Title))', description: 'Job title' },
                { key: 'Phone', value: '((Phone))', description: 'Phone number' }
            ];
            
            if (authState && authState.sheetData) {
                authState.sheetData.headers.forEach(header => {
                    allPlaceholders.push({
                        key: header,
                        value: `((${header}))`,
                        description: `From sheet: ${header}`
                    });
                });
            }
            
            // Filter placeholders
            const filtered = allPlaceholders.filter(p => 
                p.key.toLowerCase().includes(query.toLowerCase()) ||
                p.description.toLowerCase().includes(query.toLowerCase())
            );
            
            // Update dropdown content
            this.placeholderDropdown.innerHTML = filtered.map(p => `
                <div class="placeholder-item" data-value="${p.value}" style="
                    padding: 12px 16px;
                    cursor: pointer;
                    border-bottom: 1px solid #f0f0f0;
                    transition: background-color 0.2s;
                " onmouseover="this.style.background='#f8f9fa'" onmouseout="this.style.background='white'">
                    <div style="font-weight: 600; color: #333;">${p.key}</div>
                    <div style="font-size: 12px; color: #666; margin-top: 2px;">${p.description}</div>
                </div>
            `).join('');
            
            // Add click handlers
            this.placeholderDropdown.querySelectorAll('.placeholder-item').forEach(item => {
                item.addEventListener('click', () => {
                    this.insertPlaceholder(item.dataset.value);
                });
            });
            
            // Show dropdown if not visible
            if (this.placeholderDropdown.style.display === 'none') {
                this.showPlaceholderDropdown(editor, cursorPos);
            }
            
        } catch (error) {
            console.error('❌ Failed to filter placeholders:', error);
        }
    }

    insertPlaceholder(placeholder) {
        try {
            const tabId = this.currentTabId;
            const interfaceElement = document.getElementById(`interface-${tabId}`);
            if (!interfaceElement) return;
            
            const editor = interfaceElement.querySelector('[id*="emailEditor"]');
            const subject = interfaceElement.querySelector('[id*="campaignSubject"]');
            
            // Determine which field has focus
            const activeElement = document.activeElement;
            
            if (activeElement === editor || activeElement === subject) {
                const value = activeElement.value;
                const cursorPos = activeElement.selectionStart;
                const textBeforeAt = value.substring(0, cursorPos);
                const atIndex = textBeforeAt.lastIndexOf('@');
                
                if (atIndex !== -1) {
                    // Replace @ and any text after it with the placeholder
                    const newValue = value.substring(0, atIndex) + placeholder + value.substring(cursorPos);
                    activeElement.value = newValue;
                    
                    // Set cursor position after placeholder
                    const newCursorPos = atIndex + placeholder.length;
                    activeElement.setSelectionRange(newCursorPos, newCursorPos);
                    activeElement.focus();
                }
            }
            
            this.hidePlaceholderDropdown();
            
        } catch (error) {
            console.error('❌ Failed to insert placeholder:', error);
        }
    }

    hidePlaceholderDropdown() {
        try {
            if (this.placeholderDropdown) {
                this.placeholderDropdown.style.display = 'none';
            }
        } catch (error) {
            console.error('❌ Failed to hide placeholder dropdown:', error);
        }
    }

    // ===== NOTIFICATION SYSTEM =====
    setupNotifications() {
        try {
            // Create notification container
            this.notificationContainer = document.createElement('div');
            this.notificationContainer.id = 'notificationContainer';
            this.notificationContainer.style.cssText = `
                position: fixed;
                top: 20px;
                right: 20px;
                z-index: 10000;
                max-width: 400px;
            `;
            
            document.body.appendChild(this.notificationContainer);
            
            console.log('✅ Notification system setup complete');
        } catch (error) {
            console.error('❌ Failed to setup notifications:', error);
        }
    }

    showNotification(message, type = 'info', duration = 5000) {
        try {
            if (!this.notificationContainer) return;
            
            const notification = document.createElement('div');
            notification.className = `notification notification-${type}`;
            notification.style.cssText = `
                background: ${this.getNotificationColor(type)};
                color: white;
                padding: 16px 20px;
                margin-bottom: 10px;
                border-radius: 8px;
                box-shadow: 0 4px 20px rgba(0,0,0,0.15);
                font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;
                font-size: 14px;
                line-height: 1.4;
                transform: translateX(100%);
                transition: transform 0.3s ease;
                cursor: pointer;
            `;
            
            notification.textContent = message;
            
            // Add to container
            this.notificationContainer.appendChild(notification);
            
            // Animate in
            setTimeout(() => {
                notification.style.transform = 'translateX(0)';
            }, 100);
            
            // Auto remove
            setTimeout(() => {
                notification.style.transform = 'translateX(100%)';
                setTimeout(() => {
                    if (notification.parentNode) {
                        notification.parentNode.removeChild(notification);
                    }
                }, 300);
            }, duration);
            
            // Click to dismiss
            notification.addEventListener('click', () => {
                notification.style.transform = 'translateX(100%)';
                setTimeout(() => {
                    if (notification.parentNode) {
                        notification.parentNode.removeChild(notification);
                    }
                }, 300);
            });
            
        } catch (error) {
            console.error('❌ Failed to show notification:', error);
        }
    }

    getNotificationColor(type) {
        switch (type) {
            case 'success': return '#34C759';
            case 'error': return '#FF3B30';
            case 'warning': return '#FF9500';
            case 'info': return '#007AFF';
            default: return '#007AFF';
        }
    }

    // ===== CAMPAIGN CONTROLS =====
    setupCampaignControls() {
        try {
            document.addEventListener('click', (e) => {
                // Start campaign
                if (e.target.id === 'startCampaignBtn' || e.target.closest('#startCampaignBtn')) {
                    this.startCampaign();
                }
                
                // Stop campaign
                if (e.target.id === 'stopCampaignBtn' || e.target.closest('#stopCampaignBtn')) {
                    this.stopCampaign();
                }
                
                // Refresh preview
                if (e.target.id === 'refreshPreviewBtn' || e.target.closest('#refreshPreviewBtn')) {
                    this.refreshEmailPreview();
                }
            });
            
            console.log('✅ Campaign controls setup complete');
        } catch (error) {
            console.error('❌ Failed to setup campaign controls:', error);
        }
    }

    async startCampaign() {
        try {
            const tabId = this.currentTabId;
            const authState = this.tabAuthStates.get(tabId);
            
            if (!authState || !authState.isAuthenticated) {
                this.showNotification('Please authenticate with Google first', 'warning');
                return;
            }
            
            if (!authState.sheetData) {
                this.showNotification('Please import Google Sheets data first', 'warning');
                return;
            }
            
            this.isCampaignRunning = true;
            this.campaignProgress = 0;
            
            // Show progress
            this.showCampaignProgress();
            
            // Simulate campaign progress
            const totalRows = authState.sheetData.rows.length;
            for (let i = 0; i < totalRows; i++) {
                if (!this.isCampaignRunning) break;
                
                this.campaignProgress = ((i + 1) / totalRows) * 100;
                this.updateCampaignProgress();
                
                // Simulate email sending
                await new Promise(resolve => setTimeout(resolve, 500));
            }
            
            if (this.isCampaignRunning) {
                this.showNotification('Campaign completed successfully!', 'success');
            } else {
                this.showNotification('Campaign stopped by user', 'warning');
            }
            
            this.isCampaignRunning = false;
            this.hideCampaignProgress();
            
        } catch (error) {
            console.error('❌ Campaign failed:', error);
            this.showNotification('Campaign failed: ' + error.message, 'error');
            this.isCampaignRunning = false;
        }
    }

    stopCampaign() {
        try {
            this.isCampaignRunning = false;
            this.showNotification('Stopping campaign...', 'info');
            console.log('✅ Campaign stop requested');
        } catch (error) {
            console.error('❌ Failed to stop campaign:', error);
        }
    }

    showCampaignProgress() {
        try {
            // Create progress bar
            const progressBar = document.createElement('div');
            progressBar.id = 'campaignProgress';
            progressBar.style.cssText = `
                position: fixed;
                top: 50%;
                left: 50%;
                transform: translate(-50%, -50%);
                background: white;
                padding: 30px;
                border-radius: 12px;
                box-shadow: 0 8px 40px rgba(0,0,0,0.2);
                z-index: 10000;
                text-align: center;
                min-width: 300px;
            `;
            
            progressBar.innerHTML = `
                <h3 style="margin: 0 0 20px 0; color: #333;">Campaign Progress</h3>
                <div style="background: #f0f0f0; border-radius: 8px; height: 20px; margin-bottom: 20px;">
                    <div id="progressFill" style="background: #007AFF; height: 100%; border-radius: 8px; width: 0%; transition: width 0.3s ease;"></div>
                </div>
                <div id="progressText" style="color: #666; margin-bottom: 20px;">0%</div>
                <button id="stopCampaignBtn" style="
                    background: #FF3B30;
                    color: white;
                    border: none;
                    padding: 12px 24px;
                    border-radius: 6px;
                    cursor: pointer;
                    font-size: 14px;
                ">Stop Campaign</button>
            `;
            
            document.body.appendChild(progressBar);
            
            // Add stop button handler
            const stopBtn = progressBar.querySelector('#stopCampaignBtn');
            stopBtn.addEventListener('click', () => this.stopCampaign());
            
        } catch (error) {
            console.error('❌ Failed to show campaign progress:', error);
        }
    }

    updateCampaignProgress() {
        try {
            const progressFill = document.getElementById('progressFill');
            const progressText = document.getElementById('progressText');
            
            if (progressFill && progressText) {
                progressFill.style.width = `${this.campaignProgress}%`;
                progressText.textContent = `${Math.round(this.campaignProgress)}%`;
            }
        } catch (error) {
            console.error('❌ Failed to update campaign progress:', error);
        }
    }

    hideCampaignProgress() {
        try {
            const progressBar = document.getElementById('campaignProgress');
            if (progressBar) {
                progressBar.remove();
            }
        } catch (error) {
            console.error('❌ Failed to hide campaign progress:', error);
        }
    }

    // ===== EVENT LISTENERS =====
    setupEventListeners() {
        try {
            // Global event listeners
            document.addEventListener('click', (e) => {
                // Handle various button clicks
                this.handleButtonClicks(e);
            });
            
            // Form submissions
            document.addEventListener('submit', (e) => {
                e.preventDefault();
                this.handleFormSubmission(e);
            });
            
            console.log('✅ Event listeners setup complete');
        } catch (error) {
            console.error('❌ Failed to setup event listeners:', error);
        }
    }

    handleButtonClicks(e) {
        try {
            const target = e.target;
            
            // Handle various button types
            if (target.matches('[id*="importSheetsBtn"]')) {
                this.importGoogleSheets();
            } else if (target.matches('[id*="startCampaignBtn"]')) {
                this.startCampaign();
            } else if (target.matches('[id*="refreshPreviewBtn"]')) {
                this.refreshEmailPreview();
            }
            
        } catch (error) {
            console.error('❌ Failed to handle button click:', error);
        }
    }

    handleFormSubmission(e) {
        try {
            e.preventDefault();
            console.log('Form submission handled');
        } catch (error) {
            console.error('❌ Failed to handle form submission:', error);
        }
    }

    // ===== UTILITY FUNCTIONS =====
    refreshEmailPreview() {
        try {
            const tabId = this.currentTabId;
            const interfaceElement = document.getElementById(`interface-${tabId}`);
            if (!interfaceElement) return;
            
            const editor = interfaceElement.querySelector('[id*="emailEditor"]');
            const preview = interfaceElement.querySelector('[id*="emailPreview"]');
            
            if (editor && preview) {
                const content = editor.value || editor.innerHTML;
                preview.innerHTML = `
                    <div style="padding: 20px; border: 1px solid #ddd; border-radius: 8px; background: white;">
                        <h4 style="margin: 0 0 16px 0; color: #333;">Email Preview</h4>
                        <div style="line-height: 1.6; color: #333;">
                            ${content || '<em>No content to preview</em>'}
                        </div>
                    </div>
                `;
            }
            
            this.showNotification('Email preview refreshed', 'success');
        } catch (error) {
            console.error('❌ Failed to refresh email preview:', error);
        }
    }

    initializeTabContent(tabId) {
        try {
            // Initialize any tab-specific functionality
            const authState = this.tabAuthStates.get(tabId);
            if (!authState) {
                this.tabAuthStates.set(tabId, {
                    isAuthenticated: false,
                    account: null,
                    sheetData: null
                });
            }
            
            // Update UI
            this.updateAuthenticationDisplay(tabId);
            
        } catch (error) {
            console.error('❌ Failed to initialize tab content:', error);
        }
    }
}

// Initialize the app when DOM is ready
if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', () => {
        window.rtxApp = new RTXApp();
    });
} else {
    window.rtxApp = new RTXApp();
}

console.log('🚀 app.js loaded successfully');
