// Import CSS files
import '../styles/main.css';
import '../styles/animations.css';
import '../styles/components.css';

console.log('🚀 CSS files imported successfully');
console.log('🚀 app.js is loading...');

// Task Force - AutoMailer Pro
class TaskForceApp {
    constructor() {
        console.log('🚀 TaskForceApp constructor called');
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
        this.currentTabId = null;
        this.campaignProgress = {
            isRunning: false,
            totalEmails: 0,
            sentEmails: 0,
            failedEmails: 0,
            cancelled: false
        };
        this.init();
    }

    init() {
        console.log('🚀 Task Force AutoMailer Pro initializing...');
        
        // Test that we can access the DOM
        document.title = 'Task Force - AutoMailer Pro (LOADED)';
        console.log('✅ DOM access confirmed - title updated');
        
        this.setupEventListeners();
        this.setupRichEditor();
        this.setupMenuHandlers();
        this.loadSettings();
        this.loadTheme();
        this.populateAccountsDropdown();
        this.updateUI();
        
        // Wait for tab manager to be ready
        this.waitForTabManager();
        
        // Start periodic email verification
        this.startEmailVerification();
        
        console.log('✅ Task Force AutoMailer Pro initialized successfully!');
        
        // Show a success message on the page
        this.showSuccess('AutoMailer Pro loaded successfully!');

        // Update and version wiring
        this.wireAutoUpdates();
    }

    waitForTabManager() {
        // Wait for backend to assign proper tab ID
        this.currentTabId = null;
        console.log('⏳ Waiting for tab ID assignment from backend...');
        
        // Listen for tab ID assignment from backend
        if (window.electronAPI && window.electronAPI.onTabIdAssigned) {
            window.electronAPI.onTabIdAssigned(async (tabId) => {
                this.currentTabId = tabId;
                console.log('✅ Tab ID assigned by backend:', this.currentTabId);
                
                // Check if this tab already has authentication
                await this.checkTabAuthentication();
                this.updateUI();
            });
        } else {
            // Fallback: generate random ID if API not available
            this.currentTabId = `tab_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
            console.log('⚠️ Fallback tab ID generated:', this.currentTabId);
        }
        
        const checkTabManager = () => {
            if (window.tabManager && window.tabManager.isInitialized) {
                console.log('✅ New window tab manager found');
            } else {
                console.log('⏳ Waiting for new window tab manager...');
                setTimeout(checkTabManager, 100);
            }
        };
        checkTabManager();
    }

    async checkTabAuthentication() {
        try {
            if (!this.currentTabId || !window.electronAPI) return;
            
            console.log('🔍 Checking authentication for tab:', this.currentTabId);
            
            // Check if tab has stored authentication
            const tabToken = await window.electronAPI.storeGet(`googleToken_${this.currentTabId}`);
            const tabCreds = await window.electronAPI.storeGet(`googleCreds_${this.currentTabId}`);
            
            if (tabToken && tabCreds) {
                console.log('✅ Tab has existing authentication');
                this.isAuthenticated = true;
                this.currentAccount = 'authenticated'; // Will be updated by profile fetch
                
                // Try to get the actual email from the profile
                try {
                    if (window.electronAPI.getTabUserEmail) {
                        const result = await window.electronAPI.getTabUserEmail(this.currentTabId);
                        if (result && result.success && result.email) {
                            this.currentAccount = result.email;
                            console.log('✅ Tab user email fetched:', this.currentAccount);
                            // Update UI with the real email
                            this.updateUI();
                        }
                    }
                } catch (e) {
                    console.log('⚠️ Could not fetch profile immediately:', e);
                }
            } else {
                console.log('❌ Tab has no existing authentication');
                this.isAuthenticated = false;
                this.currentAccount = null;
            }
        } catch (error) {
            console.error('Error checking tab authentication:', error);
            this.isAuthenticated = false;
            this.currentAccount = null;
        }
    }

    startEmailVerification() {
        // Check email every 3 seconds to ensure it's always correct
        setInterval(async () => {
            if (this.isAuthenticated && this.currentTabId && window.electronAPI) {
                try {
                    if (window.electronAPI.getTabUserEmail) {
                        const result = await window.electronAPI.getTabUserEmail(this.currentTabId);
                        if (result && result.success && result.email) {
                            if (result.email !== this.currentAccount) {
                                console.log('🔄 Email changed, updating UI:', result.email);
                                this.currentAccount = result.email;
                                this.updateUI();
                            }
                        } else {
                            // If we can't get the email, try to re-authenticate
                            console.log('⚠️ Could not fetch email, checking authentication...');
                            await this.checkTabAuthentication();
                        }
                    }
                } catch (e) {
                    console.log('⚠️ Email verification error:', e);
                    // Try to re-authenticate if there's an error
                    await this.checkTabAuthentication();
                }
            }
        }, 3000);
    }

    setupRichEditor() {
        try {
            const editorContainer = document.getElementById('emailEditor');
            if (!editorContainer) return;
            
            // Enhanced contenteditable editor is already initialized in HTML
            console.log('✅ Enhanced contenteditable editor ready');
            
            // Add paste image functionality
            editorContainer.addEventListener('paste', (e) => {
                const items = e.clipboardData?.items || [];
                for (const it of items) {
                    if (it.type && it.type.startsWith('image/')) {
                        const file = it.getAsFile();
                        const reader = new FileReader();
                        reader.onload = () => {
                            const img = document.createElement('img');
                            img.src = reader.result;
                            img.style.maxWidth = '100%';
                            img.style.height = 'auto';
                            
                            // Insert at cursor position
                            const selection = window.getSelection();
                            if (selection.rangeCount > 0) {
                                const range = selection.getRangeAt(0);
                                range.deleteContents();
                                range.insertNode(img);
                                range.collapse(false);
                            } else {
                                editorContainer.appendChild(img);
                            }
                        };
                        reader.readAsDataURL(file);
                        e.preventDefault();
                        break;
                    }
                }
            });
            
            // Drag & drop local images into editor
            editorContainer.addEventListener('drop', (ev) => {
                const files = ev.dataTransfer?.files || [];
                if (files.length) {
                    ev.preventDefault();
                    Array.from(files).forEach((file) => {
                        if (!file.type.startsWith('image/')) return;
                        const reader = new FileReader();
                        reader.onload = () => {
                            const img = document.createElement('img');
                            img.src = reader.result;
                            img.style.maxWidth = '100%';
                            img.style.height = 'auto';
                            
                            // Insert at cursor position
                            const selection = window.getSelection();
                            if (selection.rangeCount > 0) {
                                const range = selection.getRangeAt(0);
                                range.deleteContents();
                                range.insertNode(img);
                                range.collapse(false);
                            } else {
                                editorContainer.appendChild(img);
                            }
                        };
                        reader.readAsDataURL(file);
                    });
                }
            });
            
            // Ensure Ctrl+A works inside editor
            editorContainer.addEventListener('keydown', (e) => {
                if ((e.ctrlKey || e.metaKey) && e.key.toLowerCase() === 'a') {
                    e.stopPropagation();
                }
            });
            
        } catch (error) {
            console.error('Error setting up rich editor:', error);
        }
    }

    getEditorPlainText() {
        try { 
            const editorContainer = document.getElementById('emailEditor');
            return editorContainer ? (editorContainer.textContent || '').trim() : '';
        } catch (_) { return ''; }
    }
    getEditorHtml(rowMap = {}) {
        try {
            const editorContainer = document.getElementById('emailEditor');
            const html = editorContainer ? (editorContainer.innerHTML || '') : '';
            return this.processContent(html, rowMap, false);
        } catch (_) { return ''; }
    }

    wireAutoUpdates() {
        try {
            if (window.electronAPI?.onUpdateStatus) {
                window.electronAPI.onUpdateStatus((data) => {
                    if (!data) return;
                    if (data.status === 'checking') {
                        this.showInfo('Checking for updates...');
                    } else if (data.status === 'available') {
                        this.showSuccess(`Update available: ${data.info?.version}`);
                        const banner = document.getElementById('updateBanner');
                        const text = document.getElementById('updateBannerText');
                        const action = document.getElementById('updateActionBtn');
                        if (text) text.textContent = `New version ${data.info?.version} is available`;
                        if (banner) banner.style.display = 'block';
                        if (action) { action.textContent = 'Download'; action.disabled = false; action.onclick = () => window.electronAPI?.downloadUpdate?.(); }
                    } else if (data.status === 'downloading') {
                        const p = data.progress ? Math.round(data.progress.percent || 0) : 0;
                        this.showInfo(`Downloading update... ${p}%`);
                    } else if (data.status === 'downloaded') {
                        this.showSuccess('Update downloaded. Ready to install.');
                        const banner = document.getElementById('updateBanner');
                        const text = document.getElementById('updateBannerText');
                        const action = document.getElementById('updateActionBtn');
                        if (text) text.textContent = 'Update downloaded. Click install to restart.';
                        if (banner) banner.style.display = 'block';
                        if (action) { action.textContent = 'Install'; action.disabled = false; action.onclick = () => window.electronAPI?.quitAndInstall?.(); }
                    } else if (data.status === 'error') {
                        this.showError(`Update error: ${data.error}`);
                    }
                });
            }
            // Trigger a check after UI loads
            setTimeout(() => { try { window.electronAPI?.checkForUpdates?.(); } catch (e) {} }, 2000);
            // repeat check every hour during session
            setInterval(() => { try { window.electronAPI?.checkForUpdates?.(); } catch (e) {} }, 60*60*1000);
        } catch (e) {
            console.warn('Auto-update wiring failed:', e);
        }
    }

    setupEventListeners() {
        console.log('Setting up event listeners...');

        // Delegate click for placeholders - ensure single insertion
        document.body.addEventListener('click', (e) => {
            const el = e.target;
            if (el && el.dataset && el.dataset.placeholderKey) {
                const key = el.dataset.placeholderKey;
                const ins = `((${key}))`;
                const editorContainer = document.getElementById('emailEditor');
                if (editorContainer) {
                    // Focus the editor first
                    editorContainer.focus();
                    
                    // Get current selection or create new one at end
                    let selection = window.getSelection();
                    let range;
                    
                    if (selection.rangeCount > 0) {
                        range = selection.getRangeAt(0);
                    } else {
                        range = document.createRange();
                        range.selectNodeContents(editorContainer);
                        range.collapse(false);
                        selection.removeAllRanges();
                        selection.addRange(range);
                    }
                    
                    // Insert the placeholder
                    range.deleteContents();
                    range.insertNode(document.createTextNode(ins));
                    range.collapse(false);
                    
                    // Update selection
                    selection.removeAllRanges();
                    selection.addRange(range);
                }
                this.showSuccess(`Inserted placeholder: ((${key}))`);
                e.stopPropagation();
            }
        }, false);

        // Login button
        const loginBtn = document.getElementById('loginBtn');
        if (loginBtn) {
            console.log('Login button found, adding listener');
            loginBtn.addEventListener('click', () => this.showLoginModal());
        } else {
            console.error('Login button not found!');
        }

        // New Tab button
        const newTabBtn = document.getElementById('newTabBtn');
        if (newTabBtn) {
            console.log('New tab button found, adding listener');
            newTabBtn.addEventListener('click', () => this.createNewTab());
        } else {
            console.error('New tab button not found!');
        }

        // Top-bar Google Sign-In
        const googleSignInTopBtn = document.getElementById('googleSignInTopBtn');
        const googleLogoutBtn = document.getElementById('googleLogoutBtn');
        if (googleSignInTopBtn) {
            googleSignInTopBtn.addEventListener('click', async () => {
                try {
                    googleSignInTopBtn.disabled = true;
                    googleSignInTopBtn.textContent = 'Signing in...';
                    
                    // Ensure tab ID is available - wait for backend assignment
                    if (!this.currentTabId) {
                        console.log('⏳ Waiting for tab ID assignment for Google sign-in...');
                        await new Promise((resolve) => {
                            const checkTabId = () => {
                                if (this.currentTabId) {
                                    resolve();
                                } else {
                                    setTimeout(checkTabId, 100);
                                }
                            };
                            checkTabId();
                        });
                    }
                    
                    console.log('✅ Using tab ID for Google sign-in:', this.currentTabId);
                    
                    console.log('window.electronAPI available:', !!window.electronAPI);
                    console.log('authenticateGoogleWithTab available:', !!(window.electronAPI && window.electronAPI.authenticateGoogleWithTab));
                    
                    let result;
                    if (window.electronAPI && window.electronAPI.authenticateGoogleWithTab) {
                        console.log('Using tab-based Google sign-in...');
                        result = await window.electronAPI.authenticateGoogleWithTab(null, this.currentTabId);
                    } else if (window.electronAPI && window.electronAPI.authenticateGoogle) {
                        console.log('Using fallback Google sign-in...');
                        result = await window.electronAPI.authenticateGoogle();
                    } else {
                        console.log('No authentication API available, using simulation...');
                        await this.simulateAuthentication();
                        return; // Exit early since simulation handles the UI update
                    }
                    
                    console.log('Google sign-in result:', result);
                    console.log('Result type:', typeof result);
                    console.log('Result keys:', result ? Object.keys(result) : 'null');
                    console.log('Result.success:', result?.success);
                    console.log('Result.error:', result?.error);
                    console.log('Result.error type:', typeof result?.error);
                    
                    if (result && typeof result === 'object' && result.success === true) {
                        this.onAuthenticationSuccess(result.userEmail || 'authenticated');
                        googleSignInTopBtn.style.background = '#34c759';
                        googleSignInTopBtn.style.color = '#fff';
                        googleSignInTopBtn.textContent = result.userEmail || 'Signed in';
                        const logoutBtn = document.getElementById('googleLogoutBtn');
                        if (logoutBtn) logoutBtn.style.display = 'inline-block';
                    } else {
                        let errorMsg = 'Sign-in failed. Email may not be registered.';
                        try {
                            if (result?.error) {
                                if (typeof result.error === 'string') {
                                    errorMsg = result.error;
                                } else if (Array.isArray(result.error)) {
                                    errorMsg = result.error[0] || 'Sign-in failed. Email may not be registered.';
                                } else if (typeof result.error === 'object') {
                                    errorMsg = result.error.message || JSON.stringify(result.error);
                                }
                            } else if (typeof result === 'string') {
                                errorMsg = result;
                            }
                        } catch (e) {
                            console.error('Error processing Google sign-in error message:', e);
                            errorMsg = 'Sign-in failed. Email may not be registered.';
                        }
                        console.log('Google sign-in failed with error:', errorMsg);
                        googleSignInTopBtn.style.background = '#ff3b30';
                        googleSignInTopBtn.style.color = '#fff';
                        googleSignInTopBtn.textContent = 'Not allowed';
                        this.showError(errorMsg);
                    }
                } catch (e) {
                    console.error('Google sign-in error:', e);
                    googleSignInTopBtn.style.background = '#ff3b30';
                    googleSignInTopBtn.style.color = '#fff';
                    googleSignInTopBtn.textContent = 'Failed';
                    this.showError(e?.message || 'Sign-in failed');
                } finally {
                    setTimeout(() => { googleSignInTopBtn.disabled = false; }, 800);
                }
            });
        }

        if (googleLogoutBtn) {
            googleLogoutBtn.addEventListener('click', async () => {
                try {
                    console.log('Logging out...');
                    console.log('window.electronAPI available:', !!window.electronAPI);
                    console.log('logoutTab available:', !!(window.electronAPI && window.electronAPI.logoutTab));
                    
                    if (window.electronAPI && window.electronAPI.logoutTab) {
                        console.log('Using tab-based logout...');
                        await window.electronAPI.logoutTab(this.currentTabId);
                    } else if (window.electronAPI && window.electronAPI.logout) {
                        console.log('Using fallback logout...');
                        await window.electronAPI.logout();
                    } else {
                        console.log('No logout API available, using local logout...');
                    }
                    
                    this.isAuthenticated = false;
                    this.currentAccount = null;
                    
                    // Clear any cached email data
                    try {
                        if (window.electronAPI?.storeDelete) {
                            await window.electronAPI.storeDelete(`googleToken_${this.currentTabId}`);
                            await window.electronAPI.storeDelete(`googleCreds_${this.currentTabId}`);
                            await window.electronAPI.storeDelete(`googleTokenClientId_${this.currentTabId}`);
                        }
                    } catch (e) {
                        console.log('Error clearing cached data:', e);
                    }
                    
                    this.updateUI();
                    try { window.electronAPI?.storeSet?.('telemetry.enabled', false); } catch(_) {}
                    if (googleSignInTopBtn) {
                        googleSignInTopBtn.style.background = '#fff';
                        googleSignInTopBtn.style.color = '#2c2c2e';
                        googleSignInTopBtn.textContent = 'Sign in with Google';
                    }
                    googleLogoutBtn.style.display = 'none';
                    if (refreshEmailBtn) refreshEmailBtn.style.display = 'none';
                    this.showInfo('Logged out');
                } catch (e) {
                    console.error('Logout error:', e);
                    this.showError(e?.message || 'Logout failed');
                }
            });
        }

        // Refresh email button
        const refreshEmailBtn = document.getElementById('refreshEmailBtn');
        if (refreshEmailBtn) {
            refreshEmailBtn.addEventListener('click', async () => {
                try {
                    refreshEmailBtn.disabled = true;
                    refreshEmailBtn.innerHTML = '<i class="fas fa-spinner fa-spin"></i>';
                    
                    const email = await this.forceEmailRefresh();
                    if (email) {
                        this.showSuccess(`Email refreshed: ${email}`);
                    } else {
                        this.showError('Could not refresh email');
                    }
                } catch (e) {
                    console.error('Email refresh error:', e);
                    this.showError('Email refresh failed: ' + e.message);
                } finally {
                    refreshEmailBtn.disabled = false;
                    refreshEmailBtn.innerHTML = '<i class="fas fa-sync-alt"></i>';
                }
            });
        }

        // SMTP (App Password) login
        const smtpLoginBtn = document.getElementById('smtpLoginBtn');
        if (smtpLoginBtn && window.electronAPI?.smtpSaveCreds) {
            smtpLoginBtn.addEventListener('click', async () => {
                const email = document.getElementById('smtpEmail')?.value?.trim();
                const appPass = document.getElementById('smtpAppPassword')?.value?.trim();
                if (!email || !appPass) { this.showError('Enter Gmail and App Password'); return; }
                try {
                    this.showLoading('Validating credentials...');
                    const res = await window.electronAPI.smtpSaveCreds({ email, appPassword: appPass });
                    if (!res?.success) throw new Error(res?.error || 'Failed');
                    this.onAuthenticationSuccess(email);
                    // Fetch signature automatically (non-blocking)
                    window.electronAPI.smtpExtractSignature?.(email).then(out => {
                        if (out?.success && out.signature) {
                            this.gmailSignature = out.signature;
                            this.showSuccess('Signature fetched');
                        }
                    });
                } catch (e) {
                    this.showError(e.message || 'Login failed');
                } finally {
                    this.hideLoading();
                }
            });
        }
        const smtpFetchSignatureBtn = document.getElementById('smtpFetchSignatureBtn');
        if (smtpFetchSignatureBtn && window.electronAPI?.smtpExtractSignature) {
            smtpFetchSignatureBtn.addEventListener('click', async () => {
                try {
                    this.showLoading('Fetching signature...');
                    const out = await window.electronAPI.smtpExtractSignature();
                    if (out?.success && out.signature) {
                        this.gmailSignature = out.signature;
                        this.showSuccess('Signature fetched');
                    } else {
                        this.showError(out?.error || 'No signature detected');
                    }
                } finally {
                    this.hideLoading();
                }
            });
        }

        // Signature builder open via keyboard shortcut or menu could be added later
        const openSig = document.getElementById('openSignatureBuilder');
        if (openSig) {
            openSig.addEventListener('click', () => { const m = document.getElementById('signatureModal'); if (m) m.style.display = 'block'; });
        }

        // Upload credentials button
        const uploadCredentialsBtn = document.getElementById('uploadCredentialsBtn');
        const accountsSelect = document.getElementById('accountsSelect');
        if (accountsSelect) {
            accountsSelect.addEventListener('change', async (e) => {
                const email = e.target.value;
                if (email) {
                    try {
                        this.showLoading('Switching account...');
                        const res = await window.electronAPI.useAccount?.(email);
                        if (res?.success) {
                            this.onAuthenticationSuccess(email);
                            await this.initializeServices();
                        } else {
                            this.showError(res?.error || 'Failed to switch account');
                        }
                    } finally {
                        this.hideLoading();
                    }
                }
            });
        }
        if (uploadCredentialsBtn) {
            console.log('Upload credentials button found, adding listener');
            // Remove any existing listeners first
            uploadCredentialsBtn.onclick = null;
            uploadCredentialsBtn.addEventListener('click', (event) => {
                console.log('Upload credentials button clicked');
                event.preventDefault();
                event.stopPropagation();
                this.handleCredentialsUpload();
            });
        } else {
            console.error('Upload credentials button not found!');
        }

        // Google Sheets connection buttons
        const connectSheetsBtn = document.getElementById('connectSheetsBtn');
        if (connectSheetsBtn) {
            console.log('Connect sheets button found, adding listener');
            connectSheetsBtn.addEventListener('click', () => this.connectToSheets());
        }

        // Import spreadsheet button
        const importSheetBtn = document.getElementById('importSheetBtn');
        if (importSheetBtn) {
            console.log('Import sheet button found, adding listener');
            importSheetBtn.addEventListener('click', () => this.importLocalSpreadsheet());
        }

        // Logs button
        const logsBtn = document.getElementById('logsBtn');
        if (logsBtn) {
            console.log('Logs button found, adding listener');
            logsBtn.addEventListener('click', () => this.showLogs());
        }

        // Toggle preview button
        const togglePreviewBtn = document.getElementById('togglePreviewBtn');
        if (togglePreviewBtn) {
            console.log('Toggle preview button found, adding listener');
            togglePreviewBtn.addEventListener('click', () => this.toggleDataPreview());
        }

        // Email campaign buttons
        const newCampaignBtn = document.getElementById('newCampaignBtn');
        if (newCampaignBtn) {
            console.log('New campaign button found, adding listener');
            newCampaignBtn.addEventListener('click', () => this.createNewCampaign());
        }

        const sendTestBtn = document.getElementById('sendTestBtn');
        if (sendTestBtn) {
            console.log('Send test button found, adding listener');
            sendTestBtn.addEventListener('click', () => this.sendTestEmail());
        }

        const startCampaignBtn = document.getElementById('startCampaignBtn');
        if (startCampaignBtn) {
            console.log('Start campaign button found, adding listener');
            startCampaignBtn.addEventListener('click', () => this.startCampaign());
        }

        // Cancel campaign button
        const cancelCampaignBtn = document.getElementById('cancelCampaignBtn');
        if (cancelCampaignBtn) {
            console.log('Cancel campaign button found, adding listener');
            cancelCampaignBtn.addEventListener('click', () => this.cancelCampaign());
        }

        // Refresh button
        const refreshSheetsBtn = document.getElementById('refreshSheetsBtn');
        if (refreshSheetsBtn) {
            console.log('Refresh sheets button found, adding listener');
            refreshSheetsBtn.addEventListener('click', () => this.refreshSheetsData());
        }

        // Help button
        const helpBtn = document.getElementById('helpBtn');
        if (helpBtn) {
            console.log('Help button found, adding listener');
            helpBtn.addEventListener('click', () => this.showHelp());
        }

        // Analytics Dashboard button
        const analyticsDashboardBtn = document.getElementById('analyticsDashboardBtn');
        if (analyticsDashboardBtn) {
            console.log('Analytics Dashboard button found, adding listener');
            analyticsDashboardBtn.addEventListener('click', () => this.openAnalyticsDashboard());
        }

        // Clear Auth Data button
        const clearAuthBtn = document.getElementById('clearAuthBtn');
        if (clearAuthBtn) {
            console.log('Clear Auth Data button found, adding listener');
            clearAuthBtn.addEventListener('click', () => this.clearAuthenticationData());
        }

        // From selection change
        const fromSelect = document.getElementById('fromAddress');
        if (fromSelect) {
            fromSelect.addEventListener('change', (e) => {
                this.selectedFrom = e.target.value || null;
            });
        }

        // Signature toggle
        const signatureToggle = document.getElementById('useSignature');
        if (signatureToggle) {
            signatureToggle.addEventListener('change', (e) => {
                this.useSignature = !!e.target.checked;
            });
        }

        // Attachments button
        const pickBtn = document.getElementById('pickAttachmentsBtn');
        const attachmentsLabel = document.getElementById('attachmentsLabel');
        if (pickBtn && window.electronAPI?.showOpenDialog) {
            pickBtn.addEventListener('click', async (e) => {
                e.preventDefault();
                const res = await window.electronAPI.showOpenDialog({ properties: ['openFile','multiSelections'] });
                if (!res.canceled && res.filePaths?.length) {
                    this.attachmentsPaths = res.filePaths;
                    if (attachmentsLabel) attachmentsLabel.textContent = `${this.attachmentsPaths.length} file(s) selected`;
                    this.renderAttachmentsList();
                    this.showSuccess('Attachments selected');
                    const flagged = this.attachmentsPaths.filter(p => /\.exe$|\.bat$|\.cmd$|\.js$|\.vbs$/i.test(p));
                    if (flagged.length) {
                        this.showError('Some selected files are potentially unsafe (executables/scripts). These may be blocked by email providers. Prefer PDFs, images, or documents.');
                    }
                } else {
                    if (attachmentsLabel) attachmentsLabel.textContent = 'No files selected';
                    this.renderAttachmentsList();
                }
            });
        }
        const clearBtn = document.getElementById('clearAttachmentsBtn');
        if (clearBtn) {
            clearBtn.addEventListener('click', () => {
                this.attachmentsPaths = [];
                const attachmentsLabel = document.getElementById('attachmentsLabel');
                if (attachmentsLabel) attachmentsLabel.textContent = 'No files selected';
                this.renderAttachmentsList();
            });
        }

        // Template controls
        const saveTemplateBtn = document.getElementById('saveTemplateBtn');
        if (saveTemplateBtn) {
            saveTemplateBtn.addEventListener('click', () => this.saveCurrentTemplate());
        }
        const loadTemplateBtn = document.getElementById('loadTemplateBtn');
        if (loadTemplateBtn) {
            loadTemplateBtn.addEventListener('click', () => this.loadSelectedTemplate());
        }
        const deleteTemplateBtn = document.getElementById('deleteTemplateBtn');
        if (deleteTemplateBtn) {
            deleteTemplateBtn.addEventListener('click', () => this.deleteSelectedTemplate());
        }

        // Preset templates
        const insertPresetBtn = document.getElementById('insertPresetBtn');
        if (insertPresetBtn) {
            insertPresetBtn.addEventListener('click', () => this.insertSelectedPreset());
        }

        // Signature builder actions (enhanced)
        const applySigBtn = document.getElementById('applySignatureBtn');
        if (applySigBtn) {
            applySigBtn.addEventListener('click', () => {
                const html = document.getElementById('sigHtml')?.value || '';
                if (html.trim().length === 0) { this.showError('Enter signature HTML first'); return; }
                this.gmailSignature = html; // store as HTML string in renderer
                const prev = document.getElementById('sigPreview'); if (prev) prev.innerHTML = html;
                this.showSuccess('Signature applied to emails');
            });
        }
        const sigHtmlArea = document.getElementById('sigHtml');
        if (sigHtmlArea) {
            sigHtmlArea.addEventListener('input', () => {
                const prev = document.getElementById('sigPreview');
                if (prev) prev.innerHTML = sigHtmlArea.value || '';
            });
        }

        // Preview button
        const previewBtn = document.getElementById('previewEmailBtn');
        if (previewBtn) { previewBtn.addEventListener('click', () => this.showPreview()); }

        // Fullscreen button fix (toggle)
        const fsBtn = document.getElementById('previewFullscreenBtn');
        if (fsBtn) {
            fsBtn.addEventListener('click', async () => {
                const drawer = document.getElementById('dataPreviewDrawer');
                if (!document.fullscreenElement) { await drawer.requestFullscreen?.(); fsBtn.innerText = 'Exit Fullscreen'; }
                else { await document.exitFullscreen?.(); fsBtn.innerText = 'Fullscreen'; }
            });
        }
        const closeBtn = document.getElementById('closePreviewBtn');
        if (closeBtn) { closeBtn.addEventListener('click', () => { const d = document.getElementById('dataPreviewDrawer'); d.style.display = 'none'; }); }

        // Theme toggle
        const themeToggle = document.getElementById('themeToggle');
        if (themeToggle) {
            themeToggle.addEventListener('click', () => this.toggleTheme());
        }

        console.log('Event listeners setup complete');
    }

    renderAttachmentsList() {
        try {
            const list = document.getElementById('attachmentsList'); if (!list) return;
            if (!this.attachmentsPaths || this.attachmentsPaths.length === 0) { list.innerHTML = ''; return; }
            let html = '';
            this.attachmentsPaths.forEach((p, idx) => {
                const name = p.split(/[\\/]/).pop();
                html += `<div style="display:flex; justify-content:space-between; align-items:center; gap:8px; border:1px solid #e5e5e7; border-radius:6px; padding:6px 8px;">
                    <span style="overflow:hidden; text-overflow:ellipsis; white-space:nowrap; max-width:70%;">${this.escapeHtml(name)}</span>
                    <button class="btn btn-danger" data-remove-idx="${idx}"><i class="fas fa-times"></i>Remove</button>
                </div>`;
            });
            list.innerHTML = html;
            list.querySelectorAll('[data-remove-idx]')?.forEach(btn => {
                btn.addEventListener('click', () => {
                    const i = parseInt(btn.getAttribute('data-remove-idx')); if (isNaN(i)) return;
                    this.attachmentsPaths.splice(i,1);
                    const attachmentsLabel = document.getElementById('attachmentsLabel');
                    if (attachmentsLabel) attachmentsLabel.textContent = this.attachmentsPaths.length ? `${this.attachmentsPaths.length} file(s) selected` : 'No files selected';
                    this.renderAttachmentsList();
                });
            });
        } catch (_) {}
    }

    setupMenuHandlers() {
        if (window.electronAPI) {
            window.electronAPI.onUpdateStatus?.(() => {});
            // Optional progress signal from main
            if (window.electronAPI.onAuthProgress) {
                window.electronAPI.onAuthProgress((data) => {
                    if (data?.step === 'token-received') {
                        // Browser said completed; make app foreground and poll auth status
                        this.hideLoading();
                        setTimeout(async () => {
                            try {
                                const status = await window.electronAPI.getCurrentAuth?.();
                                if (status?.authenticated) {
                                    this.onAuthenticationSuccess(status.email || 'authenticated');
                                }
                            } catch(_) {}
                        }, 200);
                    }
                });
            }
            window.electronAPI.onMenuAction((action) => {
                this.handleMenuAction(action);
            });

            window.electronAPI.onAppQuitting(() => {
                this.saveSettings();
            });

            // React to auth-success from main
            if (window.electronAPI.onAuthSuccess) {
                window.electronAPI.onAuthSuccess((data) => {
                    // Always dismiss any loader and close modal on auth-success
                    this.hideLoading();
                    const modal = document.getElementById('loginModal');
                    if (modal) modal.style.display = 'none';
                    this.onAuthenticationSuccess(data?.email || 'authenticated');
                });
            }

            // Also poll current auth for 5s after returning from browser in case event missed
            window.addEventListener('focus', async () => {
                try {
                    for (let i = 0; i < 10; i++) {
                        const status = await window.electronAPI.getCurrentAuth?.();
                        if (status?.authenticated) { this.onAuthenticationSuccess(status.email || 'authenticated'); break; }
                        await new Promise(r => setTimeout(r, 300));
                    }
                } catch (_) {}
            }, { once: true });
        }
    }

    showLoginModal() {
        console.log('Showing login modal');
        const modal = document.getElementById('loginModal');
        if (modal) {
            modal.style.display = 'block';
        } else {
            console.error('Login modal not found!');
        }
    }

    async createNewTab() {
        console.log('Creating new tab...');
        try {
            if (window.electronAPI && window.electronAPI.createNewTab) {
                const result = await window.electronAPI.createNewTab();
                if (result && result.success) {
                    console.log('✅ New tab created successfully:', result.windowId);
                    this.showSuccess(`New tab created! Total windows: ${result.totalWindows}`);
                } else {
                    console.error('❌ Failed to create new tab:', result?.error);
                    this.showError('Failed to create new tab: ' + (result?.error || 'Unknown error'));
                }
            } else {
                console.error('❌ createNewTab API not available');
                this.showError('New tab functionality not available');
            }
        } catch (error) {
            console.error('❌ Error creating new tab:', error);
            this.showError('Failed to create new tab: ' + error.message);
        }
    }

    async handleCredentialsUpload() {
        console.log('Handling credentials upload');
        try {
            const fileInput = document.getElementById('credentialsFile');
            if (!fileInput) {
                this.showError('Credentials file input not found');
                return;
            }
            
            if (fileInput.files && fileInput.files.length > 0) {
                const file = fileInput.files[0];
                this.showLoading('Processing credentials...');
                const credentials = await this.readCredentialsFile(file);
                await this.authenticateWithCredentials(credentials);
            } else {
                this.showError('Please select a credentials file first');
            }
        } catch (error) {
            console.error('Error handling credentials upload:', error);
            this.hideLoading();
            this.showError('Failed to process credentials: ' + error.message);
        }
    }

    async readCredentialsFile(file) {
        return new Promise((resolve, reject) => {
            const reader = new FileReader();
            reader.onload = (e) => {
                try {
                    const credentials = JSON.parse(e.target.result);
                    resolve(credentials);
                } catch (error) {
                    reject(new Error('Invalid JSON file'));
                }
            };
            reader.onerror = () => reject(new Error('Failed to read file'));
            reader.readAsText(file);
        });
    }

    async authenticateWithCredentials(credentials) {
        try {
            console.log('Authenticating with credentials...');
            console.log('window.electronAPI available:', !!window.electronAPI);
            console.log('authenticateGoogleWithTab available:', !!(window.electronAPI && window.electronAPI.authenticateGoogleWithTab));
            
            // Ensure tab ID is available - wait for backend assignment
            if (!this.currentTabId) {
                console.log('⏳ Waiting for tab ID assignment...');
                await new Promise((resolve) => {
                    const checkTabId = () => {
                        if (this.currentTabId) {
                            resolve();
                        } else {
                            setTimeout(checkTabId, 100);
                        }
                    };
                    checkTabId();
                });
            }
            
            console.log('✅ Using tab ID for authentication:', this.currentTabId);
            
            // Use tab-based authentication
            if (window.electronAPI && window.electronAPI.authenticateGoogleWithTab) {
                console.log('Using tab-based authentication...');
                const result = await window.electronAPI.authenticateGoogleWithTab(credentials, this.currentTabId);
                console.log('Authentication result:', result);
                console.log('Result type:', typeof result);
                console.log('Result keys:', result ? Object.keys(result) : 'null');
                console.log('Result.success:', result?.success);
                console.log('Result.error:', result?.error);
                console.log('Result.error type:', typeof result?.error);
                
                if (result && typeof result === 'object' && result.success === true) {
                    this.onAuthenticationSuccess(result.userEmail || 'authenticated');
                    this.initializeServices(credentials)
                        .then(() => console.log('Services ready'))
                        .catch(err => {
                            console.error('Service init failed:', err);
                            this.showError('Connected, but failed to initialize services: ' + err.message);
                        });
                } else {
                    let errorMsg = 'Authentication failed';
                    try {
                        if (result?.error) {
                            if (typeof result.error === 'string') {
                                errorMsg = result.error;
                            } else if (Array.isArray(result.error)) {
                                errorMsg = result.error[0] || 'Authentication failed';
                            } else if (typeof result.error === 'object') {
                                errorMsg = result.error.message || JSON.stringify(result.error);
                            }
                        } else if (typeof result === 'string') {
                            errorMsg = result;
                        }
                    } catch (e) {
                        console.error('Error processing error message:', e);
                        errorMsg = 'Authentication failed';
                    }
                    console.log('Authentication failed with error:', errorMsg);
                    throw new Error(errorMsg);
                }
            } else if (window.electronAPI && window.electronAPI.authenticateGoogle) {
                console.log('Using fallback authentication...');
                const result = await window.electronAPI.authenticateGoogle(credentials);
                console.log('Fallback authentication result:', result);
                console.log('Result type:', typeof result);
                console.log('Result keys:', result ? Object.keys(result) : 'null');
                
                if (result && typeof result === 'object' && result.success === true) {
                    this.onAuthenticationSuccess(result.userEmail || 'authenticated');
                    this.initializeServices(credentials)
                        .then(() => console.log('Services ready'))
                        .catch(err => {
                            console.error('Service init failed:', err);
                            this.showError('Connected, but failed to initialize services: ' + err.message);
                        });
                } else {
                    let errorMsg = 'Authentication failed';
                    try {
                        if (result?.error) {
                            if (typeof result.error === 'string') {
                                errorMsg = result.error;
                            } else if (Array.isArray(result.error)) {
                                errorMsg = result.error[0] || 'Authentication failed';
                            } else if (typeof result.error === 'object') {
                                errorMsg = result.error.message || JSON.stringify(result.error);
                            }
                        } else if (typeof result === 'string') {
                            errorMsg = result;
                        }
                    } catch (e) {
                        console.error('Error processing fallback authentication error message:', e);
                        errorMsg = 'Authentication failed';
                    }
                    console.log('Fallback authentication failed with error:', errorMsg);
                    throw new Error(errorMsg);
                }
            } else {
                console.log('No authentication API available, using simulation...');
                // Fallback to simulation
                await this.simulateAuthentication();
            }
        } catch (error) {
            console.error('Authentication error:', error);
            this.hideLoading();
            this.showError(error.message || 'Authentication failed');
            throw error;
        } finally {
            this.hideLoading();
        }
    }

    async initializeServices(credentials) {
        try {
            console.log('Initializing Google services...');
            
            // Initialize Gmail service
            if (window.electronAPI && window.electronAPI.initializeGmailService) {
                const gmailResult = await window.electronAPI.initializeGmailService(credentials);
                if (!gmailResult.success) {
                    throw new Error('Failed to initialize Gmail service: ' + gmailResult.error);
                }
            }
            
            // Initialize Sheets service
            if (window.electronAPI && window.electronAPI.initializeSheetsService) {
                const sheetsResult = await window.electronAPI.initializeSheetsService(credentials);
                if (!sheetsResult.success) {
                    throw new Error('Failed to initialize Sheets service: ' + sheetsResult.error);
                }
            }
            
            console.log('✅ Google services initialized successfully');
        } catch (error) {
            console.error('Service initialization error:', error);
            throw error;
        }
    }

    async simulateAuthentication() {
        console.log('Simulating authentication...');
        await new Promise(resolve => setTimeout(resolve, 2000));
        const mockEmail = 'user@example.com';
        this.onAuthenticationSuccess(mockEmail);
        
        // Update UI for simulation
        const googleSignInTopBtn = document.getElementById('googleSignInTopBtn');
        if (googleSignInTopBtn) {
            googleSignInTopBtn.style.background = '#34c759';
            googleSignInTopBtn.style.color = '#fff';
            googleSignInTopBtn.textContent = mockEmail;
            const logoutBtn = document.getElementById('googleLogoutBtn');
            if (logoutBtn) logoutBtn.style.display = 'inline-block';
        }
        
        this.showSuccess('Simulated authentication successful');
    }

    onAuthenticationSuccess(email) {
        console.log('Authentication successful:', email);
        this.isAuthenticated = true;
        this.currentAccount = email;
        this.updateUI();
        try { window.electronAPI?.storeSet?.('telemetry.enabled', true); } catch(_) {}
        this.hideLoading();
        this.showSuccess(`Welcome back, ${email}!`);
        
        // Hide login modal
        const modal = document.getElementById('loginModal');
        if (modal) {
            modal.style.display = 'none';
        }

        this.fetchGmailContext();
        
        // Fetch real email if we got a placeholder
        if (email === 'authenticated' && this.currentTabId) {
            // Try multiple times to fetch the real email
            const fetchRealEmail = async (attempt = 1) => {
                try {
                    if (window.electronAPI.getTabUserEmail) {
                        const result = await window.electronAPI.getTabUserEmail(this.currentTabId);
                        if (result && result.success && result.email) {
                            this.currentAccount = result.email;
                            console.log('✅ Real email fetched after authentication:', this.currentAccount);
                            this.updateUI();
                            return;
                        }
                    }
                } catch (e) {
                    console.log(`⚠️ Attempt ${attempt}: Could not fetch real email:`, e);
                }
                
                // Retry up to 10 times with increasing delays
                if (attempt < 10) {
                    setTimeout(() => fetchRealEmail(attempt + 1), attempt * 500);
                } else {
                    // If all attempts fail, try to re-authenticate
                    console.log('🔄 All email fetch attempts failed, trying re-authentication...');
                    await this.checkTabAuthentication();
                }
            };
            
            setTimeout(() => fetchRealEmail(), 500);
        }
        
        // Verify auth in main to ensure state is consistent
        setTimeout(async () => {
            try {
                const status = await window.electronAPI.getCurrentAuth?.();
                if (!status?.authenticated) {
                    this.isAuthenticated = false;
                    this.updateUI();
                    this.showError('Authentication failed to attach. Please try switching account from the dropdown.');
                }
            } catch(_) {}
        }, 500);
    }

    async fetchGmailContext() {
        try {
            if (!window.electronAPI) return;
            if (window.electronAPI.listSendAs) {
                this.sendAsList = await window.electronAPI.listSendAs(this.currentTabId);
                const fromSelect = document.getElementById('fromAddress');
                if (fromSelect) {
                    fromSelect.innerHTML = '';
                    this.sendAsList.forEach(sa => {
                        const opt = document.createElement('option');
                        opt.value = sa.email;
                        opt.textContent = sa.name ? `${sa.name} <${sa.email}>` : sa.email;
                        if (sa.isPrimary) opt.selected = true;
                        fromSelect.appendChild(opt);
                    });
                    this.selectedFrom = fromSelect.value || null;
                }
                // Show signature/alias info
                const sigInfo = document.getElementById('signatureInfo');
                if (sigInfo) {
                    const count = this.sendAsList.filter(s => (s.signature || '').trim().length > 0).length;
                    sigInfo.textContent = `${this.sendAsList.length} aliases • ${count} signatures`;
                }
            }
            if (window.electronAPI.getGmailSignature) {
                this.gmailSignature = await window.electronAPI.getGmailSignature(this.currentTabId);
                // Prefer HTML signature if present (we store text fallback). In OAuth mode we fetch from sendAs list; here we keep text fallback only.
            }
        } catch (e) {
            console.warn('Failed to fetch Gmail context:', e);
        }
    }

    async connectToSheets() {
        console.log('Connecting to sheets...');
        if (!this.isAuthenticated) {
            this.showError('Please authenticate with Google first');
            return;
        }

        const sheetUrlInput = document.getElementById('sheetUrlInput');
        const sheetUrl = sheetUrlInput ? sheetUrlInput.value.trim() : '';

        if (!sheetUrl) {
            this.showError('Please enter a Google Sheets URL');
            return;
        }

        try {
            this.showLoading('Connecting to Google Sheets...');
            const sheetId = this.extractSheetId(sheetUrl);
            if (!sheetId) {
                this.hideLoading();
                this.showError('Invalid Google Sheets URL');
                return;
            }
            this.selectedSheetId = sheetId;
            this.lastSheetUrl = sheetUrl;

            // Fetch tabs
            let chosenTitle = null;
            if (window.electronAPI && window.electronAPI.listSheetTabs) {
                const tabs = await window.electronAPI.listSheetTabs(sheetId);
                const tabsContainer = document.getElementById('sheetTabsContainer');
                if (tabsContainer && tabs && tabs.length) {
                    tabsContainer.innerHTML = '';
                    const label = document.createElement('label');
                    label.textContent = 'Select Sheet Tab';
                    const select = document.createElement('select');
                    select.id = 'sheetTabSelect';
                    tabs.forEach(t => {
                        const opt = document.createElement('option');
                        opt.value = t;
                        opt.textContent = t;
                        select.appendChild(opt);
                    });
                    const applyBtn = document.createElement('button');
                    applyBtn.className = 'btn btn-secondary';
                    applyBtn.textContent = 'Load Tab';
                    applyBtn.addEventListener('click', async () => {
                        this.selectedSheetTitle = select.value;
                        await this.loadSheetData();
                    });
                    tabsContainer.appendChild(label);
                    tabsContainer.appendChild(select);
                    tabsContainer.appendChild(applyBtn);
                    this.hideLoading();
                    this.showSuccess('Choose a sheet tab to load');
                    return;
                }
            }
            // If no tabs or UI, load default
            this.selectedSheetTitle = null;
            await this.loadSheetData();
        } catch (error) {
            this.hideLoading();
            this.showError('Failed to connect to Google Sheets: ' + error.message);
        }
    }

    extractSheetId(urlStr) {
        const patterns = [
            /\/spreadsheets\/d\/([a-zA-Z0-9-_]+)/,
            /key=([a-zA-Z0-9-_]+)/,
            /^([a-zA-Z0-9-_]+)$/
        ];
        for (const pattern of patterns) {
            const match = String(urlStr).match(pattern);
            if (match) return match[1];
        }
        return null;
    }

    async importLocalSpreadsheet() {
        console.log('Importing local spreadsheet...');
        try {
            const res = await window.electronAPI.showOpenDialog({ 
                properties: ['openFile'], 
                filters: [{ name: 'Spreadsheets', extensions: ['csv','xlsx','xls'] }] 
            });
            if (!res.canceled && res.filePaths?.length) {
                this.showLoading('Loading spreadsheet...');
                const out = await window.electronAPI.loadLocalSpreadsheet(res.filePaths[0]);
                if (out.success) {
                    this.onSheetsConnected(out.data);
                    const sheetUrlInput = document.getElementById('sheetUrlInput');
                    if (sheetUrlInput) {
                        sheetUrlInput.value = res.filePaths[0];
                    }
                    this.showSuccess('Spreadsheet imported successfully!');
                } else {
                    this.showError('Failed to import: ' + out.error);
                }
            }
        } catch (error) {
            this.hideLoading();
            this.showError('Failed to import spreadsheet: ' + error.message);
        }
    }

    async showLogs() {
        console.log('Showing logs...');
        try {
            const out = await window.electronAPI.readSessionLog();
            if (out.success) {
                const logsContent = document.getElementById('logsContent');
                const logsModal = document.getElementById('logsModal');
                if (logsContent) {
                    logsContent.textContent = out.content || '';
                }
                if (logsModal) {
                    logsModal.style.display = 'block';
                }
            } else {
                this.showError('Failed to read logs: ' + out.error);
            }
        } catch (error) {
            this.showError('Failed to show logs: ' + error.message);
        }
    }

    toggleDataPreview() {
        console.log('Toggling data preview...');
        const drawer = document.getElementById('dataPreviewDrawer');
        if (drawer) {
            const isVisible = drawer.style.display !== 'none';
            drawer.style.display = isVisible ? 'none' : 'block';
            console.log('Data preview toggled:', !isVisible ? 'shown' : 'hidden');
        } else {
            console.error('Data preview drawer not found');
        }
    }

    async loadSheetData() {
        try {
            if (window.electronAPI && window.electronAPI.connectToSheetsWithTab) {
                // Ensure tab ID is available
                if (!this.currentTabId) {
                    this.currentTabId = `tab_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
                    console.log('✅ Generated fallback tab ID for sheets connection:', this.currentTabId);
                }
                const payload = { sheetId: this.selectedSheetId, sheetTitle: this.selectedSheetTitle, rawUrl: this.lastSheetUrl || null };
                const result = await window.electronAPI.connectToSheetsWithTab(payload, this.currentTabId);
                if (result.success) {
                    this.onSheetsConnected(result.data);
                } else {
                    throw new Error(result.error || 'Failed to connect to sheets');
                }
            } else if (window.electronAPI && window.electronAPI.connectToSheets) {
                const result = await window.electronAPI.connectToSheets(this.selectedSheetId, this.selectedSheetTitle, this.lastSheetUrl || null);
                if (result.success) {
                    this.onSheetsConnected(result.data);
                } else {
                    throw new Error(result.error || 'Failed to connect to sheets');
                }
            }
        } catch (e) {
            this.hideLoading();
            this.showError('Failed to load sheet data: ' + e.message);
        }
    }

    onSheetsConnected(data) {
        console.log('Sheets connected successfully');
        this.sheetData = data;
        this.rowStatus = new Map();
        this.displaySheetData();
        this.enableCampaignFeatures();
        this.updateConnectionStatus();
        this.hideLoading();
        this.showSuccess('Successfully connected to Google Sheets!');
    }

    displaySheetData() {
        console.log('Displaying sheet data');
        const dataContainer = document.getElementById('sheetsData');
        if (!dataContainer || !this.sheetData) return;

        // Render preview drawer only once
        const drawer = document.getElementById('dataPreviewDrawer');
        const zone = document.getElementById('previewTableZone');
        if (drawer && zone) {
            drawer.style.display = 'block';
            const { headers, rows } = this.sheetData;
            let chips = '<div id="previewChips" style="display:flex; gap:8px; flex-wrap:wrap; margin-bottom:8px;">';
            headers.forEach(h => {
                const key = String(h).trim();
                chips += `<span data-placeholder-key="${this.escapeHtml(key)}" class="chip">${this.escapeHtml(key)}<i class=\"fas fa-plus\"></i></span>`;
            });
            chips += '</div>';
            const assistant = document.getElementById('assistantChips');
            if (assistant) assistant.innerHTML = chips;
            let html = chips + '<div class="table-container"><table><thead><tr>';
            const localHeaders = [...headers, 'Status'];
            localHeaders.forEach(h => { html += `<th>${this.escapeHtml(h)}</th>`; });
            html += '</tr></thead><tbody>';
            rows.slice(0, 10).forEach((row, idxRow) => {
                html += `<tr data-row-index="${idxRow}">`;
                headers.forEach((h, idx) => {
                    const val = row[idx] || '';
                    const key = String(h).trim();
                    html += `<td data-placeholder-key="${this.escapeHtml(key)}" title="Click to insert ((${this.escapeHtml(key)}))">${this.escapeHtml(val)}</td>`;
                });
                const st = this.rowStatus.get(idxRow) || '';
                html += `<td class="status-cell" style="font-weight:600;">${this.escapeHtml(st)}</td>`;
                html += '</tr>';
            });
            html += '</tbody></table></div>';
            zone.innerHTML = html;
        }

        // Render small table preview only once
        if (!dataContainer.dataset.rendered) {
            const { headers, rows } = this.sheetData;
            let tableHtml = `
                <div class="data-preview">
                    <h4>Data Preview (${rows.length} rows)</h4>
                    <div class="table-container">
                        <table>
                            <thead><tr>
            `;
            headers.forEach(header => { tableHtml += `<th>${this.escapeHtml(header)}</th>`; });
            tableHtml += '</tr></thead><tbody>';
            rows.slice(0, 5).forEach(row => {
                tableHtml += '<tr>';
                headers.forEach((header, index) => { const value = row[index] || ''; tableHtml += `<td>${this.escapeHtml(value)}</td>`; });
                tableHtml += '</tr>';
            });
            tableHtml += '</tbody></table></div></div>';
            dataContainer.innerHTML = tableHtml;
            dataContainer.dataset.rendered = 'true';
        }
    }

    enableCampaignFeatures() {
        console.log('Enabling campaign features');
        const newCampaignBtn = document.getElementById('newCampaignBtn');
        const sendTestBtn = document.getElementById('sendTestBtn');
        const startCampaignBtn = document.getElementById('startCampaignBtn');
        const refreshSheetsBtn = document.getElementById('refreshSheetsBtn');

        if (newCampaignBtn) newCampaignBtn.disabled = false;
        if (sendTestBtn) sendTestBtn.disabled = false;
        if (startCampaignBtn) startCampaignBtn.disabled = false;
        if (refreshSheetsBtn) refreshSheetsBtn.disabled = false;
    }

    updateConnectionStatus() {
        const isAuthed = !!this.isAuthenticated;
        const hasSheets = !!(this.sheetData && this.sheetData.headers && this.sheetData.headers.length);
        console.log('Updating connection status:', { isAuthed, hasSheets });
        const authStatus = document.getElementById('authStatus');
        const accountStatus = document.getElementById('accountStatus');
        const connectSheetsBtn = document.getElementById('connectSheetsBtn');
        const connectSheetsBtn2 = document.getElementById('connectSheetsBtn2');

        if (authStatus) authStatus.className = `status-indicator ${isAuthed ? 'connected' : 'disconnected'}`;
        if (accountStatus) {
            accountStatus.textContent = isAuthed
                ? (hasSheets ? 'Connected • Google Sheets linked' : 'Connected')
                : 'Not Connected';
        }
        if (connectSheetsBtn) connectSheetsBtn.disabled = !isAuthed;
        if (connectSheetsBtn2) connectSheetsBtn2.disabled = !isAuthed;
    }

    async sendTestEmail() {
        console.log('Sending test email');
        if (!this.isAuthenticated) {
            this.showError('Please authenticate with Google first');
            return;
        }
        const testEmail = prompt('Enter test email address:');
        if (!testEmail) { this.showError('Test email address required'); return; }
        const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
        if (!emailRegex.test(testEmail)) { this.showError('Invalid email address'); return; }
        try {
            this.showLoading('Sending test email...');
            const campaignData = this.getCampaignData();
            if (!campaignData) return;
            const finalContent = this.processContent(this.getEditorPlainText(), {}, campaignData.useSig);
            const from = (document.getElementById('fromOverride')?.value?.trim()) || this.selectedFrom || undefined;
            
            // Preserve HTML content exactly as entered
            const htmlContent = this.getEditorHtml({});
            const signatureHtml = this.gmailSignature || '';
            
            // Combine content and signature with proper HTML structure
            let finalHtml = htmlContent;
            if (signatureHtml && campaignData.useSig) {
                finalHtml = `<div>${htmlContent}</div><div style="margin-top: 20px; border-top: 1px solid #e0e0e0; padding-top: 20px;">${signatureHtml}</div>`;
            }
            
            const emailData = {
                to: testEmail,
                subject: campaignData.subject,
                content: finalContent,
                html: finalHtml,
                from,
                attachmentsPaths: this.attachmentsPaths
            };
            
            let result;
            // Use tab-based sending
            if (window.electronAPI?.sendEmailWithTab) {
                // Ensure tab ID is available
                if (!this.currentTabId) {
                    this.currentTabId = `tab_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
                    console.log('✅ Generated fallback tab ID for email sending:', this.currentTabId);
                }
                result = await window.electronAPI.sendEmailWithTab(emailData, this.currentTabId);
            } else {
                result = await window.electronAPI.sendTestEmail(emailData);
            }
            if (result.success) this.showSuccess('Test email sent successfully!'); else throw new Error(result.error || 'Failed to send test email');
        } catch (error) {
            this.hideLoading();
            this.showError('Failed to send test email: ' + error.message);
        }
    }

    getCampaignData() {
        const name = document.getElementById('campaignName')?.value;
        const subject = document.getElementById('campaignSubject')?.value;
        const content = this.getEditorPlainText();
        const fromName = document.getElementById('fromName')?.value;
        const useSig = document.getElementById('useSignature')?.checked;

        if (!name || !subject || !content) {
            this.showError('Please fill in all required fields (Campaign Name, Subject, and Content)');
            return null;
        }

        return { name, subject, content, fromName, useSig };
    }

    async startCampaign() {
        console.log('Starting campaign');
        if (!this.isAuthenticated) {
            this.showError('Please authenticate with Google first');
            return;
        }

        if (!this.sheetData || !this.sheetData.rows.length) {
            this.showError('Please connect to Google Sheets first');
            return;
        }

        const campaignData = this.getCampaignData();
        if (!campaignData) return;

        const batchSize = parseInt(document.getElementById('batchSize')?.value) || 50;
        const delay = parseInt(document.getElementById('emailDelay')?.value) || 5;

        try {
            this.hideLoading(); // Hide loading since we'll show progress instead
            
            // Initialize progress tracking
            const totalEmails = this.sheetData.rows.length;
            this.startCampaignProgress(totalEmails);

            const campaign = {
                id: Date.now(),
                name: campaignData.name,
                subject: campaignData.subject,
                content: campaignData.content,
                fromName: campaignData.fromName,
                useSig: campaignData.useSig,
                batchSize,
                delay,
                status: 'running',
                sent: 0,
                failed: 0,
                startTime: new Date()
            };

            await this.sendBulkEmails(campaign);
        } catch (error) {
            this.hideLoading();
            this.resetCampaignProgress();
            this.showError('Failed to start campaign: ' + error.message);
        }
    }

    // Scheduling
    async scheduleOneTimeSend() {
        try {
            if (!this.isAuthenticated) { this.showError('Login first'); return; }
            if (!this.selectedSheetId) { this.showError('Connect a sheet first'); return; }
            const data = this.getCampaignData();
            if (!data) return;
            const when = document.getElementById('scheduleDateTime')?.value;
            if (!when) { this.showError('Pick date & time'); return; }
            
            // Get HTML content from editor
            const htmlContent = this.getEditorHtml({});
            const signatureHtml = this.gmailSignature || '';
            
            // Combine content and signature with proper HTML structure
            let finalHtml = htmlContent;
            if (signatureHtml && data.useSig) {
                finalHtml = `<div>${htmlContent}</div><div style="margin-top: 20px; border-top: 1px solid #e0e0e0; padding-top: 20px;">${signatureHtml}</div>`;
            }
            
            const params = {
                startAt: when,
                sheetId: this.selectedSheetId,
                sheetTitle: this.selectedSheetTitle,
                subject: data.subject,
                content: data.content,
                html: finalHtml, // Pass HTML content to scheduler
                from: this.selectedFrom || undefined,
                attachmentsPaths: this.attachmentsPaths,
                delaySeconds: parseInt(document.getElementById('emailDelay')?.value) || 5,
                useSignature: !!data.useSig,
                tabId: this.currentTabId // Pass current tab ID for tab-based scheduling
            };
            const res = await window.electronAPI.scheduleOneTime(params);
            if (res?.id) {
                this.showSuccess('Scheduled');
                this.loadSchedules();
            } else {
                this.showError('Failed to schedule');
            }
        } catch (e) {
            this.showError('Schedule error: ' + e.message);
        }
    }

    async loadSchedules() {
        try {
            if (!window.electronAPI?.listSchedules) return;
            const list = await window.electronAPI.listSchedules();
            const box = document.getElementById('scheduleList');
            if (!box) return;
            if (!Array.isArray(list) || !list.length) { box.innerHTML = '<div class="empty-state"><p>No scheduled jobs</p></div>'; return; }
            let html = '<ul style="list-style:none; padding:0; margin:0;">';
            list.forEach(j => {
                html += `<li style="display:flex; justify-content:space-between; align-items:center; padding:8px 0; border-bottom:1px solid #eee;">
                    <span>${new Date(j.startAt).toLocaleString()} &nbsp; ${this.escapeHtml(j.subject || '')}</span>
                    <button class="btn btn-danger" data-id="${j.id}"><i class="fas fa-times"></i>Cancel</button>
                </li>`;
            });
            html += '</ul>';
            box.innerHTML = html;
            box.querySelectorAll('button[data-id]')?.forEach(btn => {
                btn.addEventListener('click', async () => {
                    const id = btn.getAttribute('data-id');
                    await window.electronAPI.cancelSchedule(id);
                    this.loadSchedules();
                });
            });
        } catch (e) {
            console.warn('Failed to load schedules', e);
        }
    }

    getEmailAddresses() {
        if (!this.sheetData || !this.sheetData.headers || !this.sheetData.rows) return [];
        const emailColumn = this.findEmailColumn(); if (!emailColumn) return [];
        const emailIndex = this.sheetData.headers.indexOf(emailColumn);
        return this.sheetData.rows.map(row => row[emailIndex]).filter(email => email && this.isValidEmail(email));
    }

    // Build filter from UI (basic hooks: range, even/odd, placeholder contains, status)
    getRowFilter() {
        const filter = {
            rangeFrom: parseInt(document.getElementById('filterFrom')?.value) || null,
            rangeTo: parseInt(document.getElementById('filterTo')?.value) || null,
            parity: document.getElementById('filterParity')?.value || 'all', // all|even|odd
            placeholderKey: document.getElementById('filterPlaceholderKey')?.value?.trim() || '',
            statusText: document.getElementById('filterStatusText')?.value?.trim() || ''
        };
        return (row, rowIdx, headers) => {
            const oneIdx = rowIdx + 1;
            if (filter.rangeFrom && oneIdx < filter.rangeFrom) return false;
            if (filter.rangeTo && oneIdx > filter.rangeTo) return false;
            if (filter.parity === 'even' && oneIdx % 2 !== 0) return false;
            if (filter.parity === 'odd' && oneIdx % 2 !== 1) return false;
            if (filter.placeholderKey) {
                const key = filter.placeholderKey;
                const colIdx = headers.indexOf(key);
                if (colIdx === -1 || !row[colIdx]) return false;
            }
            if (filter.statusText) {
                const statusIdx = headers.findIndex(h => String(h).trim().toLowerCase() === 'status');
                if (statusIdx !== -1) {
                    const val = String(row[statusIdx] || '').toLowerCase();
                    if (!val.includes(filter.statusText.toLowerCase())) return false;
                }
            }
            return true;
        };
    }

    findEmailColumn() {
        if (!this.sheetData || !this.sheetData.headers) return null;

        const emailPatterns = ['email', 'mail', 'e-mail'];
        for (const header of this.sheetData.headers) {
            if (emailPatterns.some(pattern => 
                header.toLowerCase().includes(pattern))) {
                return header;
            }
        }
        return null;
    }

    isValidEmail(email) {
        const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
        return emailRegex.test(email);
    }

    async sendBulkEmails(campaign) {
        const headers = this.sheetData.headers;
        const rows = this.sheetData.rows;
        const emailHeader = this.findEmailColumn();
        if (!emailHeader) throw new Error('No Email column found');
        const emailIndex = headers.indexOf(emailHeader);

        const totalRecipients = rows.length;
        let sent = 0;
        let failed = 0;

        const allowRow = this.getRowFilter();

        for (let i = 0; i < totalRecipients; i += campaign.batchSize) {
            // Check if campaign was cancelled
            if (this.campaignProgress.cancelled) {
                console.log('Campaign cancelled by user');
                break;
            }

            const batch = rows.slice(i, i + campaign.batchSize);
            for (let r = 0; r < batch.length; r++) {
                // Check if campaign was cancelled
                if (this.campaignProgress.cancelled) {
                    console.log('Campaign cancelled by user');
                    break;
                }

                const row = batch[r];
                const globalIdx = i + r;
                if (!allowRow(row, globalIdx, headers)) continue;
                const to = row[emailIndex];
                if (!to || !this.isValidEmail(to)) { 
                    failed++; 
                    this.updateCampaignProgressSent(false);
                    continue; 
                }
                try {
                    await this.sendSingleEmail(campaign, headers, row, globalIdx);
                    sent++;
                    this.updateCampaignProgressSent(true);
                } catch (error) {
                    failed++;
                    this.updateCampaignProgressSent(false);
                    console.error(`Failed to send to ${to}:`, error);
                }
                
                const jitter = Math.floor(Math.random() * 2000);
                await new Promise(resolve => setTimeout(resolve, campaign.delay * 1000 + jitter));
            }
        }

        campaign.status = this.campaignProgress.cancelled ? 'cancelled' : 'completed';
        campaign.endTime = new Date();
        campaign.sent = sent;
        campaign.failed = failed;
        
        this.hideLoading();
        
        if (this.campaignProgress.cancelled) {
            this.showSuccess(`Campaign cancelled. Sent: ${sent}, Failed: ${failed}`);
        } else {
            this.showSuccess(`Campaign completed! Sent: ${sent}, Failed: ${failed}`);
        }
        
        this.updateStatistics(sent, failed);
        this.saveCampaignHistory(campaign, sent, failed);
        this.resetCampaignProgress();
    }

    async sendSingleEmail(campaign, headers, row, rowIndexZeroBased) {
        const toHeader = this.findEmailColumn();
        const toIndex = headers.indexOf(toHeader);
        const to = row[toIndex];
        const rowMap = this.buildRowMap(headers, row);
        const content = this.processContent(this.getEditorPlainText(), rowMap, campaign.useSig);
        
        // Preserve HTML content exactly as entered with placeholders resolved
        const htmlContent = this.getEditorHtml(rowMap);
        const signatureHtml = this.gmailSignature || '';
        
        // Combine content and signature with proper HTML structure
        let finalHtml = htmlContent;
        if (signatureHtml && campaign.useSig) {
            finalHtml = `<div>${htmlContent}</div><div style="margin-top: 20px; border-top: 1px solid #e0e0e0; padding-top: 20px;">${signatureHtml}</div>`;
        }
        
        const from = (document.getElementById('fromOverride')?.value?.trim()) || this.selectedFrom || undefined;
        let result;
        // Use tab-based sending
        if (window.electronAPI?.sendEmailWithTab) {
            // Ensure tab ID is available
            if (!this.currentTabId) {
                this.currentTabId = `tab_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
                console.log('✅ Generated fallback tab ID for single email sending:', this.currentTabId);
            }
            result = await window.electronAPI.sendEmailWithTab({ 
                to, 
                subject: campaign.subject, 
                content, 
                html: finalHtml, 
                from, 
                attachmentsPaths: this.attachmentsPaths 
            }, this.currentTabId);
        } else {
            result = await window.electronAPI.sendEmail({ 
                to, 
                subject: campaign.subject, 
                content, 
                html: finalHtml, 
                from, 
                attachmentsPaths: this.attachmentsPaths 
            });
        }
        if (!result.success) {
            this.setLocalRowStatus(rowIndexZeroBased, 'FAILED');
            throw new Error(result.error || 'Failed to send email');
        }
        this.setLocalRowStatus(rowIndexZeroBased, 'SENT');
        // Try to log status back to sheet (ignore permission errors gracefully)
        if (window.electronAPI?.updateSheetStatus) {
            const res = await window.electronAPI.updateSheetStatus({ sheetId: this.selectedSheetId, sheetTitle: this.selectedSheetTitle, headers, rowIndexZeroBased, status: 'SENT' });
            if (!res?.success) console.warn('Status update skipped:', res?.error);
        }
    }

    setLocalRowStatus(idx, text) {
        try {
            this.rowStatus.set(idx, text);
            const rowEl = document.querySelector(`#previewTableZone tr[data-row-index='${idx}'] .status-cell`);
            if (rowEl) {
                rowEl.textContent = text;
                rowEl.style.color = (text === 'SENT') ? '#34C759' : '#FF3B30';
            }
        } catch (_) {}
    }

    buildRowMap(headers, row) {
        const map = {};
        headers.forEach((h, i) => { map[String(h).trim()] = row[i] || ''; });
        return map;
    }

    processContent(content, rowMap = {}, useSig = false) {
        let processed = content;
        processed = processed.replace(/\(\(([^)]+)\)\)/g, (m, p1) => {
            const key = String(p1).trim();
            return (rowMap[key] != null && rowMap[key] !== '') ? String(rowMap[key]) : '';
        });
        if (useSig && this.gmailSignature) {
            processed = processed + "\n\n" + this.gmailSignature.replace(/<[^>]+>/g, '');
        }
        return processed;
    }

    updateStatistics(sent, failed) {
        const emailsSentEl = document.getElementById('emailsSent');
        const activeCampaignsEl = document.getElementById('activeCampaigns');
        const successRateEl = document.getElementById('successRate');

        if (emailsSentEl) {
            const currentSent = parseInt(emailsSentEl.textContent) || 0;
            emailsSentEl.textContent = currentSent + sent;
        }

        if (activeCampaignsEl) {
            activeCampaignsEl.textContent = '0'; // Reset to 0 since campaign completed
        }

        if (successRateEl) {
            const total = sent + failed;
            const rate = total > 0 ? Math.round((sent / total) * 100) : 0;
            successRateEl.textContent = `${rate}%`;
        }
    }

    async refreshSheetsData() {
        if (!this.selectedSheetId) {
            this.showError('No sheet connected');
            return;
        }
        try {
            this.showLoading('Refreshing data...');
            await this.loadSheetData();
            this.showSuccess('Data refreshed successfully!');
        } catch (error) {
            this.hideLoading();
            this.showError('Failed to refresh data: ' + error.message);
        }
    }

    createNewCampaign() {
        // Clear form fields
        const fields = ['campaignName', 'campaignSubject', 'fromName'];
        fields.forEach(fieldId => {
            const field = document.getElementById(fieldId);
            if (field) field.value = '';
        });
        
        // Clear the email editor
        const editorContainer = document.getElementById('emailEditor');
        if (editorContainer) {
            editorContainer.innerHTML = '';
        }

        this.showSuccess('New campaign form cleared');
    }

    showHelp() {
        this.showSuccess('Help documentation opened');
    }

    openAnalyticsDashboard() {
        try {
            console.log('🚀 Opening Analytics Dashboard...');
            
            // Check if user is authenticated
            if (!this.isAuthenticated || !this.currentAccount) {
                this.showError('Please sign in with Google first to access Analytics Dashboard');
                return;
            }

            // Get the analytics dashboard URL (demo version for now)
            const analyticsUrl = './analytics-dashboard-demo.html';
            
            // Open in new window
            const analyticsWindow = window.open(
                analyticsUrl,
                'TaskforceAnalytics',
                'width=1400,height=900,scrollbars=yes,resizable=yes,toolbar=no,menubar=no,location=no,status=no'
            );
            
            if (analyticsWindow) {
                console.log('✅ Analytics Dashboard opened successfully');
                this.showSuccess('Analytics Dashboard opened in new window');
                
                // Focus the new window
                analyticsWindow.focus();
            } else {
                console.error('❌ Failed to open Analytics Dashboard');
                this.showError('Failed to open Analytics Dashboard. Please check if pop-ups are blocked.');
            }
            
        } catch (error) {
            console.error('❌ Error opening Analytics Dashboard:', error);
            this.showError('Error opening Analytics Dashboard: ' + error.message);
        }
    }

    clearAuthenticationData() {
        try {
            console.log('🧹 Clearing authentication data...');
            
            // Show confirmation dialog
            const confirmed = confirm(
                'Are you sure you want to clear all authentication data?\n\n' +
                'This will:\n' +
                '• Remove all stored OAuth tokens\n' +
                '• Clear account information\n' +
                '• Reset authentication status\n' +
                '• Allow fresh login\n\n' +
                'Click OK to continue or Cancel to abort.'
            );
            
            if (!confirmed) {
                console.log('❌ User cancelled authentication data clearing');
                return;
            }
            
            // Clear authentication state
            this.isAuthenticated = false;
            this.currentAccount = null;
            
            // Clear localStorage authentication data
            const authKeys = [
                'gmail_oauth_token',
                'gmail_refresh_token',
                'gmail_access_token',
                'gmail_token_expiry',
                'current_account',
                'is_authenticated',
                'gmail_user_info',
                'oauth_state'
            ];
            
            authKeys.forEach(key => {
                localStorage.removeItem(key);
                console.log(`🗑️ Removed: ${key}`);
            });
            
            // Clear any session storage
            sessionStorage.clear();
            
            // Update UI to reflect logged out state
            this.updateUI();
            this.populateAccountsDropdown();
            
            // Show success message
            this.showSuccess('✅ Authentication data cleared successfully! You can now sign in with a fresh account.');
            
            console.log('✅ Authentication data cleared successfully');
            
        } catch (error) {
            console.error('❌ Error clearing authentication data:', error);
            this.showError('Error clearing authentication data: ' + error.message);
        }
    }

    handleMenuAction(action) {
        switch (action) {
            case 'new-campaign':
                this.createNewCampaign();
                break;
            case 'import-data':
                this.connectToSheets();
                break;
            case 'help-check-updates':
                try { window.electronAPI?.checkForUpdates?.(); this.showInfo('Checking for updates...'); } catch (_) {}
                break;
            case 'help-about':
                this.openAboutModal();
                break;
            case 'help-welcome':
                this.openWelcomeModal();
                break;
            case 'help-release-notes':
                this.openReleaseNotesModal();
                break;
            case 'help-privacy':
                { const m=document.getElementById('privacyModal'); if (m) m.style.display='block'; }
                break;
            case 'help-terms':
                { const m=document.getElementById('termsModal'); if (m) m.style.display='block'; }
                break;
            default:
                this.showSuccess(`Menu action: ${action}`);
        }
    }

    openAboutModal() {
        const el = document.getElementById('aboutModal');
        if (!el) return;
        const verSpan = document.getElementById('aboutVersion');
        if (verSpan && window.electronAPI?.getAppVersion) {
            window.electronAPI.getAppVersion().then(v => { verSpan.textContent = v; });
        }
        el.style.display = 'block';
    }

    openWelcomeModal() {
        const el = document.getElementById('welcomeModal');
        if (!el) return;
        el.style.display = 'block';
    }

    openReleaseNotesModal() {
        const el = document.getElementById('releaseNotesModal');
        if (!el) return;
        const body = document.getElementById('releaseNotesBody');
        if (body) {
            body.innerHTML = this.getStaticReleaseNotesHtml();
        }
        el.style.display = 'block';
    }

    getStaticReleaseNotesHtml() {
        // Keep this quick; could be loaded from a local file later
        return `
            <h4>v1.4.1</h4>
            <ul>
                <li>New Help menu: Check for Updates, Welcome, About, and Release Notes</li>
                <li>In-app update notifications and controls</li>
                <li>Usability and stability improvements</li>
            </ul>
        `;
    }

    logout() {
        this.isAuthenticated = false;
        this.currentAccount = null;
        this.sheetData = null;
        this.updateUI();
        this.showSuccess('Logged out successfully');
    }

    updateUI() {
        console.log('Updating UI, authenticated:', this.isAuthenticated, 'account:', this.currentAccount);

        // Update login button
        const loginBtn = document.getElementById('loginBtn');
        if (loginBtn) {
            if (this.isAuthenticated) {
                loginBtn.innerHTML = '<i class="fas fa-sign-out-alt"></i>Logout';
                loginBtn.onclick = () => this.logout();
            } else {
                loginBtn.innerHTML = '<i class="fas fa-sign-in-alt"></i>Login';
                loginBtn.onclick = () => this.showLoginModal();
            }
        }

        // Update Google Sign-in button
        const googleSignInTopBtn = document.getElementById('googleSignInTopBtn');
        const googleLogoutBtn = document.getElementById('googleLogoutBtn');
        const refreshEmailBtn = document.getElementById('refreshEmailBtn');
        if (googleSignInTopBtn) {
            if (this.isAuthenticated && this.currentAccount) {
                googleSignInTopBtn.style.background = '#34c759';
                googleSignInTopBtn.style.color = '#fff';
                googleSignInTopBtn.textContent = this.currentAccount;
                if (googleLogoutBtn) googleLogoutBtn.style.display = 'inline-block';
                if (refreshEmailBtn) refreshEmailBtn.style.display = 'inline-block';
            } else {
                googleSignInTopBtn.style.background = '#fff';
                googleSignInTopBtn.style.color = '#2c2c2e';
                googleSignInTopBtn.textContent = 'Sign in with Google';
                if (googleLogoutBtn) googleLogoutBtn.style.display = 'none';
                if (refreshEmailBtn) refreshEmailBtn.style.display = 'none';
            }
        }

        // Update accounts dropdown
        const accountsSelect = document.getElementById('accountsSelect');
        if (accountsSelect) {
            if (this.isAuthenticated && this.currentAccount) {
                // Set the current account as selected
                Array.from(accountsSelect.options).forEach(option => {
                    option.selected = option.value === this.currentAccount;
                });
            } else {
                // Clear selection if not authenticated
                accountsSelect.selectedIndex = 0;
            }
        }

        // Update connection status
        this.updateConnectionStatus();
    }

    escapeHtml(text) {
        const div = document.createElement('div');
        div.textContent = text;
        return div.innerHTML;
    }

    showLoading(message = 'Loading...') {
        console.log('Showing loading:', message);
        const overlay = document.getElementById('loadingOverlay');
        const messageEl = document.getElementById('loadingMessage');
        if (overlay) {
            overlay.style.display = 'flex';
        }
        if (messageEl) {
            messageEl.textContent = message;
        }
    }

    hideLoading() {
        console.log('Hiding loading');
        const overlay = document.getElementById('loadingOverlay');
        if (overlay) {
            overlay.style.display = 'none';
        }
    }

    showSuccess(message) {
        this.showNotification(message, 'success');
    }

    showError(message) {
        this.showNotification(message, 'error');
    }

    showInfo(message) {
        this.showNotification(message, 'info');
    }

    showNotification(message, type = 'info') {
        console.log('Showing notification:', type, message);
        
        // Create notification element
        const notification = document.createElement('div');
        notification.className = `notification notification-${type}`;
        notification.innerHTML = `
            <i class="fas fa-${type === 'success' ? 'check-circle' : type === 'error' ? 'exclamation-circle' : 'info-circle'}"></i>
            <span>${message}</span>
        `;

        // Add to page
        document.body.appendChild(notification);

        // Show notification
        setTimeout(() => notification.classList.add('show'), 100);

        // Remove after 3 seconds
        setTimeout(() => {
            notification.classList.remove('show');
            setTimeout(() => notification.remove(), 300);
        }, 3000);
    }

    saveSettings() {
        if (window.electronAPI) {
            window.electronAPI.storeSet('app-settings', {
                isAuthenticated: this.isAuthenticated,
                currentAccount: this.currentAccount
            });
        }
    }

    loadSettings() {
        if (window.electronAPI) {
            window.electronAPI.storeGet('app-settings').then(settings => {
                if (settings) {
                    this.isAuthenticated = settings.isAuthenticated || false;
                    this.currentAccount = settings.currentAccount || null;
                    if (this.isAuthenticated) {
                        this.updateUI();
                        this.fetchGmailContext();
                        this.hideLoading();
                    }
                }
            });
            this.loadTemplatesFromStore();
            window.electronAPI.storeGet('campaign-history').then(list => this.renderCampaignHistory(list));
            this.loadSchedules();
        }
    }

    loadTheme() {
        if (window.electronAPI) {
            window.electronAPI.storeGet('theme').then(theme => {
                const body = document.body;
                const themeToggle = document.getElementById('themeToggle');
                
                if (theme === 'dark') {
                    body.classList.remove('theme-light');
                    body.classList.add('theme-dark');
                    body.setAttribute('data-theme', 'dark');
                    if (themeToggle) {
                        themeToggle.innerHTML = '<i class="fas fa-moon"></i>Theme';
                    }
                } else {
                    body.classList.remove('theme-dark');
                    body.classList.add('theme-light');
                    body.setAttribute('data-theme', 'light');
                    if (themeToggle) {
                        themeToggle.innerHTML = '<i class="fas fa-sun"></i>Theme';
                    }
                }
                console.log('Theme loaded:', theme || 'light');
            });
        } else {
            // Default to light theme
            const body = document.body;
            const themeToggle = document.getElementById('themeToggle');
            body.classList.remove('theme-dark');
            body.classList.add('theme-light');
            body.setAttribute('data-theme', 'light');
            if (themeToggle) {
                themeToggle.innerHTML = '<i class="fas fa-sun"></i>Theme';
            }
        }
    }

    async populateAccountsDropdown() {
        try {
            const sel = document.getElementById('accountsSelect');
            if (!sel || !window.electronAPI?.listAccounts) return;
            const accounts = await window.electronAPI.listAccounts();
            sel.innerHTML = '<option value="">Select account</option>';
            (accounts || []).forEach(email => {
                const opt = document.createElement('option');
                opt.value = email; opt.textContent = email;
                if (this.currentAccount === email) opt.selected = true;
                sel.appendChild(opt);
            });
        } catch (e) {
            console.warn('Failed to load accounts', e);
        }
    }

    saveCampaignHistory(campaign, sent, failed) {
        const record = {
            id: campaign.id,
            name: campaign.name,
            subject: campaign.subject,
            sent,
            failed,
            startTime: campaign.startTime,
            endTime: campaign.endTime
        };
        if (window.electronAPI && window.electronAPI.storeGet && window.electronAPI.storeSet) {
            window.electronAPI.storeGet('campaign-history').then(list => {
                const arr = Array.isArray(list) ? list : [];
                arr.unshift(record);
                window.electronAPI.storeSet('campaign-history', arr);
                this.renderCampaignHistory(arr);
            });
        }
    }

    renderCampaignHistory(list) {
        const container = document.getElementById('campaignsList');
        if (!container) return;
        if (!Array.isArray(list) || !list.length) {
            container.innerHTML = `
                <div class="empty-state">
                    <i class="fas fa-envelope-open"></i>
                    <h3>No Campaigns Yet</h3>
                    <p>Create your first email campaign to get started</p>
                </div>`;
            return;
        }
        let html = '<div class="campaigns-grid">';
        list.slice(0, 20).forEach(c => {
            html += `
            <div class="campaign-card">
                <div class="campaign-header">
                    <h4>${this.escapeHtml(c.name)}</h4>
                    <span class="status-badge completed">Completed</span>
                </div>
                <div><strong>Subject:</strong> ${this.escapeHtml(c.subject)}</div>
                <div><strong>Sent:</strong> ${c.sent} &nbsp; <strong>Failed:</strong> ${c.failed}</div>
                <div style="color:#8E8E93; font-size:12px; margin-top:8px;">${new Date(c.startTime).toLocaleString()} → ${new Date(c.endTime).toLocaleString()}</div>
            </div>`;
        });
        html += '</div>';
        container.innerHTML = html;
    }

    // Templates
    async loadTemplatesFromStore() {
        // Merge userData templates with recent list
        const disk = await window.electronAPI.listTemplates?.();
        const recent = (await window.electronAPI.storeGet?.('templates')) || [];
        const byId = new Map();
        (Array.isArray(disk) ? disk : []).forEach(t => byId.set(t.id, t));
        (Array.isArray(recent) ? recent : []).forEach(t => byId.set(t.id, t));
        this.templates = Array.from(byId.values());
        this.renderTemplatesSelect();
        // Load preset list
        const presetSel = document.getElementById('presetTemplateSelect');
        if (presetSel) {
            const presets = [
                { name: 'Newsletter (simple)', url: 'https://raw.githubusercontent.com/htmlemail/htmlemail/master/dist/simple.html' },
                { name: 'Announcement (basic)', url: 'https://raw.githubusercontent.com/leemunroe/responsive-html-email-template/master/dist/index.html' },
                { name: 'Event (bulletin)', url: 'https://raw.githubusercontent.com/mailgun/transactional-email-templates/master/templates/promo.html' }
            ];
            presetSel.innerHTML = '';
            presets.forEach(p => { const opt = document.createElement('option'); opt.value = p.url; opt.textContent = p.name; presetSel.appendChild(opt); });
        }
    }

    renderTemplatesSelect() {
        const sel = document.getElementById('templateSelect');
        if (!sel) return; sel.innerHTML = '';
        this.templates.forEach(t => { const opt = document.createElement('option'); opt.value = t.id; opt.textContent = t.name; sel.appendChild(opt); });
    }

    async insertSelectedPreset() {
        try {
            const sel = document.getElementById('presetTemplateSelect'); if (!sel || !sel.value) { this.showError('Pick a preset'); return; }
            const url = sel.value;
            const res = await fetch(url); const html = await res.text();
            const editorContainer = document.getElementById('emailEditor');
            if (editorContainer) {
                editorContainer.innerHTML = html;
                this.showSuccess('Preset inserted');
            }
        } catch (e) { this.showError('Failed to insert preset'); }
    }

    saveCurrentTemplate() {
        const data = this.getCampaignData(); if (!data) return;
        const name = prompt('Template name:'); if (!name) return;
        const tpl = { name, subject: data.subject, content: data.content, attachmentsPaths: this.attachmentsPaths };
        // Save in app templates directory by default
        window.electronAPI.saveTemplateJson?.(name, tpl).then(async res => {
            if (!res?.success) { this.showError('Failed to save template: ' + res?.error); return; }
            this.templates = [{ id: res.path, name, ...tpl }, ...this.templates.filter(t => t.id !== res.path)];
            window.electronAPI.storeSet?.('templates', this.templates);
            this.renderTemplatesSelect();
            this.showSuccess('Template saved');
        });
    }

    loadSelectedTemplate() {
        const sel = document.getElementById('templateSelect'); if (!sel) return;
        if (sel.value) {
            window.electronAPI.loadTemplateJson?.(sel.value).then(res => {
                if (!res?.success) { this.showError('Failed to load template: ' + res?.error); return; }
                const tpl = res.data;
                const editorContainer = document.getElementById('emailEditor');
                if (editorContainer) {
                    editorContainer.innerHTML = (tpl.html || this.escapeHtml(tpl.content || '').replace(/\n/g,'<br/>'));
                }
                this.attachmentsPaths = tpl.attachmentsPaths || [];
                this.showSuccess('Template loaded');
            });
            return;
        }
        // If none selected, offer file open as fallback
        window.electronAPI.showOpenDialog?.({ properties: ['openFile'], filters: [{ name: 'JSON', extensions: ['json'] }] }).then(async res => {
            if (!res.canceled && res.filePaths?.length) {
                const read = await window.electronAPI.readJsonFile(res.filePaths[0]);
                if (!read.success) { this.showError('Failed to load template: ' + read.error); return; }
                const tpl = read.data;
                const editorContainer = document.getElementById('emailEditor');
                if (editorContainer) {
                    editorContainer.innerHTML = (tpl.html || this.escapeHtml(tpl.content || '').replace(/\n/g,'<br/>'));
                }
                this.attachmentsPaths = tpl.attachmentsPaths || [];
                this.templates = [{ id: res.filePaths[0], name: tpl.name || 'Template', ...tpl }, ...this.templates.filter(t => t.id !== res.filePaths[0])];
                window.electronAPI.storeSet?.('templates', this.templates);
                this.renderTemplatesSelect();
                this.showSuccess('Template loaded');
            }
        });
    }

    deleteSelectedTemplate() {
        const sel = document.getElementById('templateSelect'); if (!sel || !sel.value) return;
        window.electronAPI.deleteTemplateJson?.(sel.value).then(() => {
            this.templates = this.templates.filter(t => t.id !== sel.value);
            window.electronAPI.storeSet?.('templates', this.templates);
            this.renderTemplatesSelect();
            this.showSuccess('Template deleted');
        });
    }

    showPreview() {
        if (!this.sheetData || !this.sheetData.rows?.length) { this.showError('Connect a sheet first'); return; }
        const headers = this.sheetData.headers; const row = this.sheetData.rows[0];
        const map = this.buildRowMap(headers, row);
        const data = this.getCampaignData(); if (!data) return;
        const content = this.processContent(data.content, map, data.useSig);
        
        // Create Gmail-style email preview
        const fromEmail = data.from || this.currentAccount || 'sender@example.com';
        const fromName = data.fromName || 'Sender Name';
        const toEmail = map.email || map.Email || map.EMAIL || 'recipient@example.com';
        const subject = data.subject || 'No Subject';
        
        // Convert plain text to HTML if needed
        let htmlContent = content;
        if (!content.includes('<') && !content.includes('>')) {
            // Convert plain text to HTML
            htmlContent = content
                .replace(/\n/g, '<br>')
                .replace(/\t/g, '&nbsp;&nbsp;&nbsp;&nbsp;')
                .replace(/  /g, '&nbsp;&nbsp;');
        }
        
        const gmailPreview = `
            <div style="font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif; max-width: 800px; margin: 0 auto; background: #fff; border-radius: 8px; box-shadow: 0 2px 8px rgba(0,0,0,0.1); overflow: hidden;">
                <!-- Gmail Header -->
                <div style="background: #f8f9fa; padding: 16px 20px; border-bottom: 1px solid #e5e5e7;">
                    <div style="display: flex; align-items: center; gap: 12px; margin-bottom: 8px;">
                        <div style="width: 40px; height: 40px; background: #4285f4; border-radius: 50%; display: flex; align-items: center; justify-content: center; color: white; font-weight: bold; font-size: 16px;">
                            ${fromName.charAt(0).toUpperCase()}
                        </div>
                        <div>
                            <div style="font-weight: 600; color: #202124; font-size: 14px;">${fromName}</div>
                            <div style="color: #5f6368; font-size: 12px;">${fromEmail}</div>
                        </div>
                        <div style="margin-left: auto; color: #5f6368; font-size: 12px;">
                            to me
                        </div>
                    </div>
                    <div style="font-weight: 600; color: #202124; font-size: 16px; margin-top: 8px;">
                        ${subject}
                    </div>
                </div>
                
                <!-- Email Content -->
                <div style="padding: 20px; line-height: 1.6; color: #202124; font-size: 14px;">
                    <div style="white-space: pre-wrap;">${htmlContent}</div>
                </div>
                
                <!-- Gmail Footer -->
                <div style="background: #f8f9fa; padding: 12px 20px; border-top: 1px solid #e5e5e7; font-size: 12px; color: #5f6368;">
                    <div style="display: flex; justify-content: space-between; align-items: center;">
                        <div>Gmail</div>
                        <div style="display: flex; gap: 16px;">
                            <span>Reply</span>
                            <span>Forward</span>
                        </div>
                    </div>
                </div>
            </div>
        `;
        
        const modal = document.getElementById('emailPreviewModal');
        const body = document.getElementById('emailPreviewBody');
        if (body) body.innerHTML = gmailPreview; 
        if (modal) modal.style.display = 'block';
    }

    toggleTheme() {
        const body = document.body;
        const isDark = body.classList.contains('theme-dark');
        const themeToggle = document.getElementById('themeToggle');
        
        if (isDark) {
            body.classList.remove('theme-dark');
            body.classList.add('theme-light');
            body.setAttribute('data-theme', 'light');
            if (themeToggle) {
                themeToggle.innerHTML = '<i class="fas fa-sun"></i>Theme';
            }
        } else {
            body.classList.remove('theme-light');
            body.classList.add('theme-dark');
            body.setAttribute('data-theme', 'dark');
            if (themeToggle) {
                themeToggle.innerHTML = '<i class="fas fa-moon"></i>Theme';
            }
        }
        
        // Force theme application to all elements
        this.forceThemeApplication();
        
        // Save theme preference
        if (window.electronAPI) {
            window.electronAPI.storeSet('theme', isDark ? 'light' : 'dark');
        }
        
        console.log('Theme toggled to:', isDark ? 'light' : 'dark');
    }

    forceThemeApplication() {
        // Force apply theme to all elements
        const allElements = document.querySelectorAll('*');
        allElements.forEach(element => {
            // Trigger reflow to ensure styles are applied
            element.style.display = 'none';
            element.offsetHeight; // Trigger reflow
            element.style.display = '';
        });
        
        // Also force update the main content area
        const mainContent = document.getElementById('mainContent');
        if (mainContent) {
            mainContent.style.display = 'none';
            mainContent.offsetHeight;
            mainContent.style.display = '';
        }
    }

    async forceEmailRefresh() {
        console.log('🔄 Force refreshing email...');
        if (this.isAuthenticated && this.currentTabId && window.electronAPI) {
            try {
                if (window.electronAPI.getTabUserEmail) {
                    const result = await window.electronAPI.getTabUserEmail(this.currentTabId);
                    if (result && result.success && result.email) {
                        console.log('✅ Force refresh - email fetched:', result.email);
                        this.currentAccount = result.email;
                        this.updateUI();
                        return result.email;
                    } else {
                        console.log('⚠️ Force refresh - no email in result:', result);
                        // Try to re-authenticate
                        await this.checkTabAuthentication();
                    }
                }
            } catch (e) {
                console.log('⚠️ Force refresh error:', e);
                // Try to re-authenticate
                await this.checkTabAuthentication();
            }
        }
        return null;
    }

    async loadDefaultSignature() {
        try {
            const result = await window.electronAPI.getDefaultSignature();
            if (result.success && result.data) {
                this.gmailSignature = result.data.html || result.data.text || '';
                this.showSuccess('Default signature loaded');
                return true;
            }
        } catch (error) {
            console.warn('Failed to load default signature:', error);
        }
        return false;
    }

    // Campaign Progress Management
    updateCampaignProgress() {
        const progressSection = document.getElementById('mailProgressSection');
        const progressBar = document.getElementById('mailProgressBar');
        const progressText = document.getElementById('mailProgressText');
        const statusText = document.getElementById('mailStatusText');
        const startBtn = document.getElementById('startCampaignBtn');
        const cancelBtn = document.getElementById('cancelCampaignBtn');

        if (!progressSection || !progressBar || !progressText || !statusText) return;

        if (this.campaignProgress.isRunning) {
            progressSection.style.display = 'block';
            if (startBtn) startBtn.disabled = true;
            if (cancelBtn) cancelBtn.disabled = false;

            const percentage = this.campaignProgress.totalEmails > 0 
                ? (this.campaignProgress.sentEmails / this.campaignProgress.totalEmails) * 100 
                : 0;
            
            progressBar.style.width = `${percentage}%`;
            progressText.textContent = `${this.campaignProgress.sentEmails} / ${this.campaignProgress.totalEmails}`;
            
            if (this.campaignProgress.cancelled) {
                statusText.textContent = 'Campaign cancelled by user';
                progressBar.style.background = '#dc3545';
            } else if (this.campaignProgress.sentEmails >= this.campaignProgress.totalEmails) {
                statusText.textContent = `Campaign completed! Sent: ${this.campaignProgress.sentEmails}, Failed: ${this.campaignProgress.failedEmails}`;
                progressBar.style.background = '#28a745';
                this.campaignProgress.isRunning = false;
                if (startBtn) startBtn.disabled = false;
                if (cancelBtn) cancelBtn.disabled = true;
            } else {
                statusText.textContent = `Sending email ${this.campaignProgress.sentEmails + 1} of ${this.campaignProgress.totalEmails}...`;
            }
        } else {
            progressSection.style.display = 'none';
            if (startBtn) startBtn.disabled = false;
            if (cancelBtn) cancelBtn.disabled = true;
        }
    }

    startCampaignProgress(totalEmails) {
        this.campaignProgress = {
            isRunning: true,
            totalEmails: totalEmails,
            sentEmails: 0,
            failedEmails: 0,
            cancelled: false
        };
        this.updateCampaignProgress();
    }

    updateCampaignProgressSent(success = true) {
        if (success) {
            this.campaignProgress.sentEmails++;
        } else {
            this.campaignProgress.failedEmails++;
        }
        this.updateCampaignProgress();
    }

    cancelCampaign() {
        if (this.campaignProgress.isRunning) {
            this.campaignProgress.cancelled = true;
            this.campaignProgress.isRunning = false;
            this.updateCampaignProgress();
            this.showSuccess('Campaign cancelled successfully');
        }
    }

    resetCampaignProgress() {
        this.campaignProgress = {
            isRunning: false,
            totalEmails: 0,
            sentEmails: 0,
            failedEmails: 0,
            cancelled: false
        };
        this.updateCampaignProgress();
    }
}

// Initialize app when DOM is loaded
document.addEventListener('DOMContentLoaded', () => {
            console.log('DOM loaded, initializing Task Force App...');
    if (!window.taskForceApp) window.taskForceApp = new TaskForceApp();
}); 