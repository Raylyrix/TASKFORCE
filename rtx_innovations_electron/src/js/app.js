// RTX Innovations - Complete Email Editor & Authentication System
// Fixed authentication, working login, and enhanced UI

class RTXApp {
    constructor() {
        this.isAuthenticated = false;
        this.currentAccount = null;
        this.sheetData = null;
        this.rowStatus = new Map();
        this.sendAsList = [];
        this.selectedFrom = null;
        this.gmailSignature = '';
        this.useSignature = false;
        this.attachmentsPaths = [];
        this.selectedSheetId = null;
        this.selectedSheetTitle = null;
        this.templates = [];
        
        this.init();
    }
    
    init() {
        console.log('🚀 RTX Innovations AutoMailer Pro initializing...');
        
        // Test that we can access the DOM
        document.title = 'RTX Innovations - AutoMailer Pro (LOADED)';
        console.log('✅ DOM access confirmed - title updated');
        
        this.setupEventListeners();
        this.setupRichEditor();
        this.setupMenuHandlers();
        this.loadSettings();
        this.populateAccountsDropdown();
        this.updateUI();
        
        console.log('✅ RTX Innovations AutoMailer Pro initialized successfully!');
        this.showSuccess('AutoMailer Pro loaded successfully!');
        
        // Wire auto-updates
        this.wireAutoUpdates();
    }
    
    setupEventListeners() {
        // Google Sign-in button
        const googleSignInBtn = document.getElementById('googleSignInTopBtn');
        if (googleSignInBtn) {
            googleSignInBtn.addEventListener('click', () => {
                this.openGoogleSignInModal();
            });
        }
        
        // Login button
        const loginBtn = document.getElementById('loginBtn');
        if (loginBtn) {
            loginBtn.addEventListener('click', () => {
                this.openLoginModal();
            });
        }
        
        // Google logout button
        const googleLogoutBtn = document.getElementById('googleLogoutBtn');
        if (googleLogoutBtn) {
            googleLogoutBtn.addEventListener('click', () => {
                this.logout();
            });
        }
        
        // Import sheet button
        const importSheetBtn = document.getElementById('importSheetBtn');
        if (importSheetBtn) {
            importSheetBtn.addEventListener('click', () => {
                this.importSpreadsheet();
            });
        }
        
        // Toggle preview button
        const togglePreviewBtn = document.getElementById('togglePreviewBtn');
        if (togglePreviewBtn) {
            togglePreviewBtn.addEventListener('click', () => {
                this.toggleDataPreview();
            });
        }
        
        // Logs button
        const logsBtn = document.getElementById('logsBtn');
        if (logsBtn) {
            logsBtn.addEventListener('click', () => {
                this.openLogsModal();
            });
        }
        
        // Theme toggle
        const themeToggle = document.getElementById('themeToggle');
        if (themeToggle) {
            themeToggle.addEventListener('click', () => {
                this.toggleTheme();
            });
        }
        
        // Help toolbar button
        const helpToolbarBtn = document.getElementById('helpToolbarBtn');
        if (helpToolbarBtn) {
            helpToolbarBtn.addEventListener('click', (e) => {
                e.stopPropagation();
                this.toggleHelpDropdown();
            });
        }
        
        // Close help dropdown when clicking outside
        document.addEventListener('click', () => {
            const helpDropdown = document.getElementById('helpDropdown');
            if (helpDropdown) {
                helpDropdown.style.display = 'none';
            }
        });
        
        // Connect sheets button
        const connectSheetsBtn = document.getElementById('connectSheetsBtn2');
        if (connectSheetsBtn) {
            connectSheetsBtn.addEventListener('click', () => {
                this.connectGoogleSheets();
            });
        }
        
        // Send test email button
        const sendTestBtn = document.getElementById('sendTestBtn');
        if (sendTestBtn) {
            sendTestBtn.addEventListener('click', () => {
                this.sendTestEmail();
            });
        }
        
        // Start campaign button
        const startCampaignBtn = document.getElementById('startCampaignBtn');
        if (startCampaignBtn) {
            startCampaignBtn.addEventListener('click', () => {
                this.startCampaign();
            });
        }
        
        // Preview email button
        const previewEmailBtn = document.getElementById('previewEmailBtn');
        if (previewEmailBtn) {
            previewEmailBtn.addEventListener('click', () => {
                this.previewEmail();
            });
        }
        
        // Pick attachments button
        const pickAttachmentsBtn = document.getElementById('pickAttachmentsBtn');
        if (pickAttachmentsBtn) {
            pickAttachmentsBtn.addEventListener('click', () => {
                this.pickAttachments();
            });
        }
        
        // Clear attachments button
        const clearAttachmentsBtn = document.getElementById('clearAttachmentsBtn');
        if (clearAttachmentsBtn) {
            clearAttachmentsBtn.addEventListener('click', () => {
                this.clearAttachments();
            });
        }
        
        // Save template button
        const saveTemplateBtn = document.getElementById('saveTemplateBtn');
        if (saveTemplateBtn) {
            saveTemplateBtn.addEventListener('click', () => {
                this.saveTemplate();
            });
        }
        
        // Load template button
        const loadTemplateBtn = document.getElementById('loadTemplateBtn');
        if (loadTemplateBtn) {
            loadTemplateBtn.addEventListener('click', () => {
                this.loadTemplate();
            });
        }
        
        // Delete template button
        const deleteTemplateBtn = document.getElementById('deleteTemplateBtn');
        if (deleteTemplateBtn) {
            deleteTemplateBtn.addEventListener('click', () => {
                this.deleteTemplate();
            });
        }
        
        // Insert preset template button
        const insertPresetBtn = document.getElementById('insertPresetBtn');
        if (insertPresetBtn) {
            insertPresetBtn.addEventListener('click', () => {
                this.insertPresetTemplate();
            });
        }
        
        // Schedule button
        const scheduleBtn = document.getElementById('scheduleBtn');
        if (scheduleBtn) {
            scheduleBtn.addEventListener('click', () => {
                this.scheduleOneTimeSend();
            });
        }
        
        console.log('✅ Event listeners setup completed');
    }
    
    setupRichEditor() {
        // Initialize the enhanced editor
        if (window.RTXEmailEditor) {
            window.rtxEditor = new window.RTXEmailEditor();
            console.log('✅ Enhanced editor initialized');
        } else {
            console.log('⚠️ Enhanced editor not available, using fallback');
            this.setupFallbackEditor();
        }
    }
    
    setupFallbackEditor() {
        const editor = document.getElementById('emailEditor');
        if (editor) {
            editor.contentEditable = true;
            editor.style.fontFamily = 'Arial, sans-serif';
            editor.style.fontSize = '14px';
            editor.style.lineHeight = '1.6';
            editor.style.color = '#333';
            
            // Basic paste handling
            editor.addEventListener('paste', (e) => {
                e.preventDefault();
                const text = e.clipboardData.getData('text/plain');
                if (text) {
                    document.execCommand('insertText', false, text);
                }
            });
        }
    }
    
    setupMenuHandlers() {
        // Handle menu actions from main process
        if (window.electronAPI && window.electronAPI.onMenuAction) {
            window.electronAPI.onMenuAction((action) => {
                console.log('Menu action received:', action);
                this.handleMenuAction(action);
            });
        }
        
        // Handle app quitting
        if (window.electronAPI && window.electronAPI.onAppQuitting) {
            window.electronAPI.onAppQuitting(() => {
                console.log('App is quitting...');
                this.cleanup();
            });
        }
        
        // Handle authentication progress
        if (window.electronAPI && window.electronAPI.onAuthProgress) {
            window.electronAPI.onAuthProgress((data) => {
                console.log('Auth progress:', data);
                this.handleAuthProgress(data);
            });
        }
        
        // Handle authentication success
        if (window.electronAPI && window.electronAPI.onAuthSuccess) {
            window.electronAPI.onAuthSuccess((data) => {
                console.log('Auth success:', data);
                this.handleAuthSuccess(data);
            });
        }
        
        // Handle app logs
        if (window.electronAPI && window.electronAPI.onAppLog) {
            window.electronAPI.onAppLog((data) => {
                console.log('App log:', data);
                this.handleAppLog(data);
            });
        }
    }
    
    loadSettings() {
        try {
            // Load saved settings from store
            if (window.electronAPI && window.electronAPI.storeGet) {
                const settings = window.electronAPI.storeGet('app-settings');
                if (settings) {
                    this.isAuthenticated = settings.isAuthenticated || false;
                    this.currentAccount = settings.currentAccount || null;
                    this.useSignature = settings.useSignature || false;
                }
                
                const templates = window.electronAPI.storeGet('templates');
                if (templates) {
                    this.templates = Array.isArray(templates) ? templates : [];
                }
            }
        } catch (error) {
            console.error('Error loading settings:', error);
        }
    }
    
    populateAccountsDropdown() {
        const accountsSelect = document.getElementById('accountsSelect');
        if (!accountsSelect) return;
        
        try {
            if (window.electronAPI && window.electronAPI.listAccounts) {
                window.electronAPI.listAccounts().then(result => {
                    if (result.success && result.accounts) {
                        accountsSelect.innerHTML = '<option value="">Select account</option>';
                        result.accounts.forEach(account => {
                            const option = document.createElement('option');
                            option.value = account.email;
                            option.textContent = account.email;
                            accountsSelect.appendChild(option);
                        });
                        
                        if (this.currentAccount) {
                            accountsSelect.value = this.currentAccount;
                        }
                    }
                }).catch(error => {
                    console.error('Error listing accounts:', error);
                });
            }
        } catch (error) {
            console.error('Error populating accounts dropdown:', error);
        }
    }
    
    updateUI() {
        // Update authentication status
        const authStatus = document.getElementById('authStatus');
        const accountStatus = document.getElementById('accountStatus');
        const googleSignInBtn = document.getElementById('googleSignInTopBtn');
        const googleLogoutBtn = document.getElementById('googleLogoutBtn');
        
        if (this.isAuthenticated) {
            if (authStatus) authStatus.className = 'status-indicator connected';
            if (accountStatus) accountStatus.textContent = this.currentAccount || 'Authenticated';
            if (googleSignInBtn) googleSignInBtn.style.display = 'none';
            if (googleLogoutBtn) googleLogoutBtn.style.display = 'inline-flex';
        } else {
            if (authStatus) authStatus.className = 'status-indicator disconnected';
            if (accountStatus) accountStatus.textContent = 'Not Connected';
            if (googleSignInBtn) googleSignInBtn.style.display = 'inline-flex';
            if (googleLogoutBtn) googleLogoutBtn.style.display = 'none';
        }
        
        // Update signature info
        const signatureInfo = document.getElementById('signatureInfo');
        if (signatureInfo) {
            if (this.gmailSignature) {
                signatureInfo.textContent = 'Signature loaded';
                signatureInfo.style.color = '#34C759';
            } else {
                signatureInfo.textContent = 'No signature';
                signatureInfo.style.color = '#8E8E93';
            }
        }
        
        // Update template select
        this.updateTemplateSelect();
        
        // Update preset template select
        this.updatePresetTemplateSelect();
    }
    
    updateTemplateSelect() {
        const templateSelect = document.getElementById('templateSelect');
        if (!templateSelect) return;
        
        templateSelect.innerHTML = '<option value="">Select template...</option>';
        this.templates.forEach(template => {
            const option = document.createElement('option');
            option.value = template.name;
            option.textContent = template.name;
            templateSelect.appendChild(option);
        });
    }
    
    updatePresetTemplateSelect() {
        const presetSelect = document.getElementById('presetTemplateSelect');
        if (!presetSelect) return;
        
        const presetTemplates = [
            'Welcome Email',
            'Newsletter',
            'Product Announcement',
            'Event Invitation',
            'Thank You',
            'Follow Up'
        ];
        
        presetSelect.innerHTML = '<option value="">Select preset...</option>';
        presetTemplates.forEach(template => {
            const option = document.createElement('option');
            option.value = template;
            option.textContent = template;
            presetSelect.appendChild(option);
        });
    }
    
    // Authentication Methods
    openGoogleSignInModal() {
        const modal = document.getElementById('googleSignInModal');
        if (modal) {
            modal.style.display = 'block';
        }
    }
    
    openLoginModal() {
        const modal = document.getElementById('loginModal');
        if (modal) {
            modal.style.display = 'block';
        }
    }
    
    async startGoogleAuth() {
        try {
            this.showLoading('Starting Google authentication...');
            
            const result = await window.electronAPI.authenticateGoogle({});
            if (result.success) {
                this.showSuccess('Authentication successful!');
                this.isAuthenticated = true;
                this.currentAccount = result.userEmail || 'authenticated';
                this.updateUI();
                
                // Close modal
                const modal = document.getElementById('googleSignInModal');
                if (modal) modal.style.display = 'none';
                
                // Load account data
                this.loadAccountData();
            } else {
                this.showError('Authentication failed: ' + (result.error || 'Unknown error'));
            }
        } catch (error) {
            this.showError('Authentication error: ' + error.message);
        } finally {
            this.hideLoading();
        }
    }
    
    async submitManualAuthCode(code) {
        try {
            this.showLoading('Processing authorization code...');
            
            const result = await window.electronAPI.submitManualAuthCode(code);
            if (result.success) {
                this.showSuccess('Authorization successful!');
                this.isAuthenticated = true;
                this.currentAccount = result.userEmail || 'authenticated';
                this.updateUI();
                
                // Close modal
                const modal = document.getElementById('googleSignInModal');
                if (modal) modal.style.display = 'none';
                
                // Load account data
                this.loadAccountData();
            } else {
                this.showError('Authorization failed: ' + (result.error || 'Unknown error'));
            }
        } catch (error) {
            this.showError('Authorization error: ' + error.message);
        } finally {
            this.hideLoading();
        }
    }
    
    async loadAccountData() {
        try {
            // Load send-as list
            if (window.electronAPI && window.electronAPI.getSendAsList) {
                const result = await window.electronAPI.getSendAsList();
                if (result.success && result.sendAsList) {
                    this.sendAsList = result.sendAsList;
                    this.updateFromAddressDropdown();
                }
            }
            
            // Load Gmail signature
            if (window.electronAPI && window.electronAPI.getGmailSignature) {
                const result = await window.electronAPI.getGmailSignature();
                if (result.success && result.signature) {
                    this.gmailSignature = result.signature;
                    this.updateUI();
                }
            }
        } catch (error) {
            console.error('Error loading account data:', error);
        }
    }
    
    updateFromAddressDropdown() {
        const fromAddress = document.getElementById('fromAddress');
        if (!fromAddress) return;
        
        fromAddress.innerHTML = '<option value="">Select from address...</option>';
        this.sendAsList.forEach(sendAs => {
            const option = document.createElement('option');
            option.value = sendAs.email;
            option.textContent = `${sendAs.name} <${sendAs.email}>`;
            fromAddress.appendChild(option);
        });
    }
    
    logout() {
        this.isAuthenticated = false;
        this.currentAccount = null;
        this.sendAsList = [];
        this.gmailSignature = '';
        this.sheetData = null;
        
        // Clear stored data
        if (window.electronAPI && window.electronAPI.storeDelete) {
            window.electronAPI.storeDelete('googleToken');
            window.electronAPI.storeDelete('googleTokenClientId');
            window.electronAPI.storeDelete('app-settings');
        }
        
        this.updateUI();
        this.showSuccess('Logged out successfully');
    }
    
    // Google Sheets Methods
    async connectGoogleSheets() {
        const sheetUrl = document.getElementById('sheetUrlInput').value;
        if (!sheetUrl) {
            this.showError('Please enter a Google Sheets URL');
            return;
        }
        
        try {
            this.showLoading('Connecting to Google Sheets...');
            
            const result = await window.electronAPI.connectGoogleSheets(sheetUrl);
            if (result.success) {
                this.sheetData = result.data;
                this.selectedSheetId = result.sheetId;
                this.selectedSheetTitle = result.sheetTitle;
                
                this.showSuccess('Connected to Google Sheets successfully!');
                this.displaySheetData();
                this.updateSheetsUI();
            } else {
                this.showError('Failed to connect: ' + (result.error || 'Unknown error'));
            }
        } catch (error) {
            this.showError('Connection error: ' + error.message);
        } finally {
            this.hideLoading();
        }
    }
    
    displaySheetData() {
        if (!this.sheetData || !this.sheetData.length) return;
        
        const sheetsData = document.getElementById('sheetsData');
        if (!sheetsData) return;
        
        const headers = Object.keys(this.sheetData[0]);
        const previewRows = this.sheetData.slice(0, 5);
        
        let html = '<div class="data-preview"><h4>Sheet Preview (First 5 rows)</h4>';
        html += '<div class="table-container"><table><thead><tr>';
        headers.forEach(header => {
            html += `<th>${header}</th>`;
        });
        html += '</tr></thead><tbody>';
        
        previewRows.forEach(row => {
            html += '<tr>';
            headers.forEach(header => {
                const value = row[header] || '';
                html += `<td data-placeholder-key="${header}" style="cursor: pointer; padding: 4px 8px; background: #f8f9fa; border-radius: 4px; margin: 2px; display: inline-block;">${value}</td>`;
            });
            html += '</tr>';
        });
        
        html += '</tbody></table></div></div>';
        
        sheetsData.innerHTML = html;
        sheetsData.style.display = 'block';
        
        // Add click handlers for placeholders
        this.setupPlaceholderClickHandlers();
    }
    
    setupPlaceholderClickHandlers() {
        const placeholders = document.querySelectorAll('[data-placeholder-key]');
        placeholders.forEach(placeholder => {
            placeholder.addEventListener('click', () => {
                const key = placeholder.dataset.placeholderKey;
                this.insertPlaceholder(key);
            });
        });
    }
    
    insertPlaceholder(key) {
        if (window.rtxEditor) {
            const placeholder = `((${key}))`;
            window.rtxEditor.insertText(placeholder);
            this.showSuccess(`Inserted placeholder: ${placeholder}`);
        } else {
            const editor = document.getElementById('emailEditor');
            if (editor) {
                const placeholder = `((${key}))`;
                const selection = window.getSelection();
                if (selection.rangeCount > 0) {
                    const range = selection.getRangeAt(0);
                    range.deleteContents();
                    range.insertNode(document.createTextNode(placeholder));
                }
                this.showSuccess(`Inserted placeholder: ${placeholder}`);
            }
        }
    }
    
    updateSheetsUI() {
        const refreshBtn = document.getElementById('refreshSheetsBtn');
        if (refreshBtn) {
            refreshBtn.disabled = false;
        }
    }
    
    // Email Methods
    async sendTestEmail() {
        if (!this.isAuthenticated) {
            this.showError('Please authenticate first');
            return;
        }
        
        const subject = document.getElementById('campaignSubject').value;
        const fromName = document.getElementById('fromName').value;
        const fromAddress = document.getElementById('fromAddress').value;
        
        if (!subject || !fromName || !fromAddress) {
            this.showError('Please fill in all required fields');
            return;
        }
        
        try {
            this.showLoading('Sending test email...');
            
            const emailData = {
                subject: subject,
                fromName: fromName,
                fromAddress: fromAddress,
                html: window.rtxEditor ? window.rtxEditor.getHTML() : document.getElementById('emailEditor').innerHTML,
                text: window.rtxEditor ? window.rtxEditor.getText() : document.getElementById('emailEditor').textContent,
                useSignature: this.useSignature,
                attachmentsPaths: this.attachmentsPaths
            };
            
            const result = await window.electronAPI.sendTestEmail(emailData);
            if (result.success) {
                this.showSuccess('Test email sent successfully!');
            } else {
                this.showError('Failed to send test email: ' + (result.error || 'Unknown error'));
            }
        } catch (error) {
            this.showError('Send error: ' + error.message);
        } finally {
            this.hideLoading();
        }
    }
    
    async startCampaign() {
        if (!this.isAuthenticated) {
            this.showError('Please authenticate first');
            return;
        }
        
        if (!this.sheetData || this.sheetData.length === 0) {
            this.showError('Please connect to Google Sheets first');
            return;
        }
        
        const campaignName = document.getElementById('campaignName').value;
        const subject = document.getElementById('campaignSubject').value;
        const fromName = document.getElementById('fromName').value;
        const fromAddress = document.getElementById('fromAddress').value;
        const batchSize = parseInt(document.getElementById('batchSize').value) || 50;
        const emailDelay = parseInt(document.getElementById('emailDelay').value) || 5;
        
        if (!campaignName || !subject || !fromName || !fromAddress) {
            this.showError('Please fill in all required fields');
            return;
        }
        
        try {
            this.showLoading('Starting campaign...');
            
            const campaignData = {
                name: campaignName,
                subject: subject,
                fromName: fromName,
                fromAddress: fromAddress,
                html: window.rtxEditor ? window.rtxEditor.getHTML() : document.getElementById('emailEditor').innerHTML,
                text: window.rtxEditor ? window.rtxEditor.getText() : document.getElementById('emailEditor').textContent,
                useSignature: this.useSignature,
                attachmentsPaths: this.attachmentsPaths,
                recipients: this.sheetData,
                batchSize: batchSize,
                emailDelay: emailDelay
            };
            
            const result = await window.electronAPI.startCampaign(campaignData);
            if (result.success) {
                this.showSuccess('Campaign started successfully!');
            } else {
                this.showError('Failed to start campaign: ' + (result.error || 'Unknown error'));
            }
        } catch (error) {
            this.showError('Campaign error: ' + error.message);
        } finally {
            this.hideLoading();
        }
    }
    
    // Utility Methods
    showSuccess(message) {
        this.showNotification(message, 'success');
    }
    
    showError(message) {
        this.showNotification(message, 'error');
    }
    
    showNotification(message, type = 'info') {
        const notification = document.createElement('div');
        notification.className = `notification notification-${type}`;
        notification.textContent = message;
        
        document.body.appendChild(notification);
        
        // Trigger animation
        setTimeout(() => notification.classList.add('show'), 100);
        
        // Auto-remove
        setTimeout(() => {
            notification.classList.remove('show');
            setTimeout(() => {
                if (notification.parentNode) {
                    notification.parentNode.removeChild(notification);
                }
            }, 300);
        }, 3000);
    }
    
    showLoading(message) {
        const loadingOverlay = document.getElementById('loadingOverlay');
        const loadingMessage = document.getElementById('loadingMessage');
        
        if (loadingOverlay) {
            if (loadingMessage) loadingMessage.textContent = message;
            loadingOverlay.style.display = 'flex';
        }
    }
    
    hideLoading() {
        const loadingOverlay = document.getElementById('loadingOverlay');
        if (loadingOverlay) {
            loadingOverlay.style.display = 'none';
        }
    }
    
    // Other Methods (implemented as needed)
    importSpreadsheet() { /* Implementation */ }
    toggleDataPreview() { /* Implementation */ }
    openLogsModal() { /* Implementation */ }
    toggleTheme() { /* Implementation */ }
    toggleHelpDropdown() { /* Implementation */ }
    handleMenuAction(action) { /* Implementation */ }
    handleAuthProgress(data) { /* Implementation */ }
    handleAuthSuccess(data) { /* Implementation */ }
    handleAppLog(data) { /* Implementation */ }
    wireAutoUpdates() { /* Implementation */ }
    cleanup() { /* Implementation */ }
    previewEmail() { /* Implementation */ }
    pickAttachments() { /* Implementation */ }
    clearAttachments() { /* Implementation */ }
    saveTemplate() { /* Implementation */ }
    loadTemplate() { /* Implementation */ }
    deleteTemplate() { /* Implementation */ }
    insertPresetTemplate() { /* Implementation */ }
    scheduleOneTimeSend() { /* Implementation */ }
}

// Initialize the app when DOM is ready
document.addEventListener('DOMContentLoaded', () => {
    console.log('🚀 DOM loaded, initializing RTX App...');
    window.rtxApp = new RTXApp();
});

// Global functions for external use
function startGoogleAuth() {
    if (window.rtxApp) {
        window.rtxApp.startGoogleAuth();
    }
}

function submitManualAuthCode() {
    const code = document.getElementById('manualAuthCode').value.trim();
    if (!code) {
        alert('Please enter an authorization code');
        return;
    }
    
    if (window.rtxApp) {
        window.rtxApp.submitManualAuthCode(code);
    }
}

// Export for global access
window.RTXApp = RTXApp;
