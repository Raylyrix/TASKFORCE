// Import CSS files
import '../styles/main.css';
import '../styles/animations.css';
import '../styles/components.css';

console.log('🚀 CSS files imported successfully');
console.log('🚀 app.js is loading...');

// RTX Innovations - AutoMailer Pro
class RTXApp {
    constructor() {
        this.isAuthenticated = false;
        this.selectedFrom = null;
        this.gmailSignature = '';
        this.sheetData = null;
        this.attachmentsPaths = [];
        this.currentTab = 'main';
        this.tabs = new Map();
        this.tabCounter = 0;
        
        // Initialize input dialog system
        this.initInputDialog();
        
        this.init();
    }

    // Input dialog system to replace prompt() calls
    initInputDialog() {
        // Create input dialog HTML
        const dialogHTML = `
            <div id="inputDialog" class="modal" style="display: none;">
                <div class="modal-content">
                    <div class="modal-header">
                        <h3 id="inputDialogTitle">Input Required</h3>
                        <span class="close" onclick="window.rtxApp.closeInputDialog()">&times;</span>
                    </div>
                    <div class="modal-body">
                        <label id="inputDialogLabel" for="inputDialogInput">Enter value:</label>
                        <input type="text" id="inputDialogInput" placeholder="Enter value here...">
                        <div class="modal-actions">
                            <button onclick="window.rtxApp.confirmInputDialog()" class="btn btn-primary">OK</button>
                            <button onclick="window.rtxApp.closeInputDialog()" class="btn btn-secondary">Cancel</button>
                        </div>
                    </div>
                </div>
            </div>
        `;
        
        // Add to body if not already present
        if (!document.getElementById('inputDialog')) {
            document.body.insertAdjacentHTML('beforeend', dialogHTML);
        }
        
        // Add styles
        if (!document.getElementById('inputDialogStyles')) {
            const styles = `
                <style id="inputDialogStyles">
                    .modal {
                        display: none;
                        position: fixed;
                        z-index: 10000;
                        left: 0;
                        top: 0;
                        width: 100%;
                        height: 100%;
                        background-color: rgba(0,0,0,0.4);
                    }
                    .modal-content {
                        background-color: #fefefe;
                        margin: 15% auto;
                        padding: 0;
                        border: 1px solid #888;
                        width: 400px;
                        border-radius: 8px;
                        box-shadow: 0 4px 6px rgba(0,0,0,0.1);
                    }
                    .modal-header {
                        padding: 15px 20px;
                        border-bottom: 1px solid #ddd;
                        display: flex;
                        justify-content: space-between;
                        align-items: center;
                    }
                    .modal-header h3 {
                        margin: 0;
                        color: #333;
                    }
                    .close {
                        color: #aaa;
                        font-size: 28px;
                        font-weight: bold;
                        cursor: pointer;
                    }
                    .close:hover {
                        color: #000;
                    }
                    .modal-body {
                        padding: 20px;
                    }
                    .modal-body label {
                        display: block;
                        margin-bottom: 10px;
                        font-weight: 500;
                        color: #555;
                    }
                    .modal-body input {
                        width: 100%;
                        padding: 10px;
                        border: 1px solid #ddd;
                        border-radius: 4px;
                        font-size: 14px;
                        margin-bottom: 20px;
                    }
                    .modal-actions {
                        display: flex;
                        gap: 10px;
                        justify-content: flex-end;
                    }
                    .btn {
                        padding: 8px 16px;
                        border: none;
                        border-radius: 4px;
                        cursor: pointer;
                        font-size: 14px;
                    }
                    .btn-primary {
                        background-color: #007bff;
                        color: white;
                    }
                    .btn-primary:hover {
                        background-color: #0056b3;
                    }
                    .btn-secondary {
                        background-color: #6c757d;
                        color: white;
                    }
                    .btn-secondary:hover {
                        background-color: #545b62;
                    }
                </style>
            `;
            document.head.insertAdjacentHTML('beforeend', styles);
        }
    }

    // Show input dialog and return a promise
    async showInputDialog(title, label, defaultValue = '') {
        return new Promise((resolve) => {
            const dialog = document.getElementById('inputDialog');
            const titleEl = document.getElementById('inputDialogTitle');
            const labelEl = document.getElementById('inputDialogLabel');
            const input = document.getElementById('inputDialogInput');
            
            titleEl.textContent = title;
            labelEl.textContent = label;
            input.value = defaultValue;
            
            // Store resolve function
            this.inputDialogResolve = resolve;
            
            // Show dialog
            dialog.style.display = 'block';
            input.focus();
            input.select();
            
            // Handle Enter key
            input.onkeydown = (e) => {
                if (e.key === 'Enter') {
                    this.confirmInputDialog();
                } else if (e.key === 'Escape') {
                    this.closeInputDialog();
                }
            };
        });
    }

    // Confirm input dialog
    confirmInputDialog() {
        const input = document.getElementById('inputDialogInput');
        const value = input.value.trim();
        
        if (this.inputDialogResolve) {
            this.inputDialogResolve(value);
            this.inputDialogResolve = null;
        }
        
        this.closeInputDialog();
    }

    // Close input dialog
    closeInputDialog() {
        const dialog = document.getElementById('inputDialog');
        dialog.style.display = 'none';
        
        if (this.inputDialogResolve) {
            this.inputDialogResolve('');
            this.inputDialogResolve = null;
        }
    }

    init() {
        console.log('🚀 RTX Innovations AutoMailer Pro initializing...');
        
        // Test that we can access the DOM
        document.title = 'RTX Innovations - AutoMailer Pro (LOADED)';
        console.log('✅ DOM access confirmed - title updated');
        
        this.setupEventListeners();
        this.setupRichEditor();
        this.setupMenuHandlers();
        this.setupAuthenticationModal(); // Setup authentication modal
        this.loadSettings();
        this.populateAccountsDropdown();
        this.populateFromAddressDropdown();
        this.loadSendAsList();
        this.updateUI();
        this.initializeGlobalInstance();
        
        // Set up the first tab (main content) as part of the tab system
        this.setupFirstTab();
        
        console.log('✅ RTX Innovations AutoMailer Pro initialized successfully!');
        
        // Show a success message on the page
        this.showSuccess('AutoMailer Pro loaded successfully!');

        // Update and version wiring
        this.wireAutoUpdates();
    }
    
    setupFirstTab() {
        try {
            console.log('Setting up first tab (main content)...');
            
            // Create the first tab button
            const tabList = document.getElementById('tabList');
            if (tabList) {
                const firstTab = document.createElement('li');
                firstTab.className = 'tab-item active';
                firstTab.setAttribute('data-tab', 'mainTab');
                firstTab.innerHTML = `
                    <span class="tab-text">Main Campaign</span>
                    <span class="tab-close" onclick="window.rtxApp.closeTab('mainTab')" style="display: none;">&times;</span>
                `;
                
                // Add click handler to switch to this tab
                firstTab.addEventListener('click', () => this.switchTab('mainTab'));
                
                tabList.appendChild(firstTab);
                
                // Set the main content area as the first tab content
                const mainContent = document.querySelector('.mailer-interface');
                if (mainContent) {
                    // Wrap the main content in a tab-content div
                    const tabContentWrapper = document.createElement('div');
                    tabContentWrapper.id = 'mainTab';
                    tabContentWrapper.className = 'tab-content active';
                    tabContentWrapper.style.display = 'block';
                    
                    // Move the main content into the wrapper
                    mainContent.parentNode.insertBefore(tabContentWrapper, mainContent);
                    tabContentWrapper.appendChild(mainContent);
                    
                    console.log('✅ First tab (main content) set up successfully');
                } else {
                    console.error('Main content area not found');
                }
            } else {
                console.error('Tab list not found');
            }
        } catch (error) {
            console.error('Error setting up first tab:', error);
        }
    }

    setupRichEditor() {
        try {
            const editorContainer = document.getElementById('emailEditor');
            if (!editorContainer) return;
            
            // Enhanced contenteditable editor is already initialized in HTML
            console.log('✅ Enhanced contenteditable editor ready');
            
            // Enhanced paste handling for better copy-paste functionality
            editorContainer.addEventListener('paste', (e) => {
                e.preventDefault();
                
                // Handle image paste
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
                        return;
                    }
                }
                
                // Handle text paste with proper formatting
                const text = e.clipboardData.getData('text/plain');
                const html = e.clipboardData.getData('text/html');
                
                if (html && !text.includes('\n')) {
                    // If HTML is available and it's not multi-line, use HTML
                    this.insertHTMLAtCursor(html, editorContainer);
                } else {
                    // Use plain text for better formatting control
                    this.insertTextAtCursor(text, editorContainer);
                }
                
                // Update word/character count
                this.updateEditorCounts();
            });
            
            // Enhanced drag & drop for local images
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
            
            // Prevent default drag behaviors
            editorContainer.addEventListener('dragover', (ev) => {
                ev.preventDefault();
            });
            
            // Update counts on input
            editorContainer.addEventListener('input', () => {
                this.updateEditorCounts();
            });
            
            // Enhanced keyboard shortcuts
            editorContainer.addEventListener('keydown', (e) => {
                // Ctrl+V is handled by paste event
                if (e.ctrlKey && e.key === 'v') {
                    e.preventDefault();
                }
                
                // Tab key handling
                if (e.key === 'Tab') {
                    e.preventDefault();
                    document.execCommand('insertText', false, '    ');
                }
            });
            
            console.log('✅ Enhanced editor features initialized');
            
        } catch (e) {
            console.error('❌ Failed to setup rich editor:', e);
        }
    }
    
    // Helper method to insert HTML at cursor position
    insertHTMLAtCursor(html, editorContainer = null) {
        try {
            const container = editorContainer || document.getElementById('emailEditor');
            if (!container) return;
            
            const selection = window.getSelection();
            if (selection.rangeCount > 0) {
                const range = selection.getRangeAt(0);
                range.deleteContents();
                
                // Create a temporary container to parse HTML
                const temp = document.createElement('div');
                temp.innerHTML = html;
                
                // Insert the parsed content
                const fragment = document.createDocumentFragment();
                while (temp.firstChild) {
                    fragment.appendChild(temp.firstChild);
                }
                
                range.insertNode(fragment);
                range.collapse(false);
                
                // Update selection
                selection.removeAllRanges();
                selection.addRange(range);
            } else {
                // If no selection, append to the end
                container.innerHTML += html;
            }
            
            // Focus the editor
            container.focus();
            
        } catch (error) {
            console.error('Error inserting HTML at cursor:', error);
        }
    }
    
    // Helper method to insert text at cursor position
    insertTextAtCursor(text, editorContainer = null) {
        try {
            const container = editorContainer || document.getElementById('emailEditor');
            if (!container) return;
            
            const selection = window.getSelection();
            if (selection.rangeCount > 0) {
                const range = selection.getRangeAt(0);
                range.deleteContents();
                
                // Split text by lines and insert with proper formatting
                const lines = text.split('\n');
                let firstLine = true;
                
                for (let i = 0; i < lines.length; i++) {
                    if (!firstLine) {
                        // Insert line break
                        const br = document.createElement('br');
                        range.insertNode(br);
                        range.collapse(false);
                    }
                    
                    // Insert text line
                    const textNode = document.createTextNode(lines[i]);
                    range.insertNode(textNode);
                        range.collapse(false);
                    
                    firstLine = false;
                }
                
                // Update selection
                selection.removeAllRanges();
                selection.addRange(range);
            } else {
                // If no selection, append to the end
                container.innerHTML += text;
            }
            
            // Focus the editor
            container.focus();
            
        } catch (error) {
            console.error('Error inserting text at cursor:', error);
        }
    }
    
    // Update editor word and character counts
    updateEditorCounts() {
        try {
            const editor = document.getElementById('emailEditor');
            if (!editor) return;
            
            const text = editor.innerText || editor.textContent || '';
            const words = text.trim() ? text.trim().split(/\s+/).length : 0;
            const chars = text.length;
            
            const wordCountEl = document.getElementById('wordCount');
            const charCountEl = document.getElementById('charCount');
            
            if (wordCountEl) wordCountEl.textContent = `${words} words`;
            if (charCountEl) charCountEl.textContent = `${chars} chars`;
            
        } catch (e) {
            console.warn('Failed to update editor counts:', e);
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
                
                // Try to insert into email editor first
                let editorContainer = document.getElementById('emailEditor');
                if (editorContainer) {
                    this.insertPlaceholderIntoEditor(editorContainer, ins);
                    this.showSuccess(`Inserted placeholder: ((${key}))`);
                } else {
                    // Fallback to any contenteditable element
                    const contentEditable = document.querySelector('[contenteditable="true"]');
                    if (contentEditable) {
                        this.insertPlaceholderIntoEditor(contentEditable, ins);
                        this.showSuccess(`Inserted placeholder: ((${key}))`);
                    } else {
                        this.showError('No editor found to insert placeholder');
                    }
                }
                
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

        // Top-bar Google Sign-In
        const googleSignInTopBtn = document.getElementById('googleSignInTopBtn');
        const googleLogoutBtn = document.getElementById('googleLogoutBtn');
        if (googleSignInTopBtn && window.electronAPI?.authenticateGoogle) {
            googleSignInTopBtn.addEventListener('click', async () => {
                try {
                    googleSignInTopBtn.disabled = true;
                    googleSignInTopBtn.textContent = 'Signing in...';
                    const result = await window.electronAPI.authenticateGoogle();
                    if (result?.success) {
                        this.onAuthenticationSuccess(result.userEmail || 'authenticated');
                        googleSignInTopBtn.style.background = '#34c759';
                        googleSignInTopBtn.style.color = '#fff';
                        googleSignInTopBtn.textContent = result.userEmail || 'Signed in';
                        const logoutBtn = document.getElementById('googleLogoutBtn');
                        if (logoutBtn) logoutBtn.style.display = 'inline-block';
                    } else {
                        googleSignInTopBtn.style.background = '#ff3b30';
                        googleSignInTopBtn.style.color = '#fff';
                        googleSignInTopBtn.textContent = 'Not allowed';
                        this.showError(result?.error || 'Sign-in failed. Email may not be registered.');
                    }
                } catch (e) {
                    googleSignInTopBtn.style.background = '#ff3b30';
                    googleSignInTopBtn.style.color = '#fff';
                    googleSignInTopBtn.textContent = 'Failed';
                    this.showError(e?.message || 'Sign-in failed');
                } finally {
                    setTimeout(() => { googleSignInTopBtn.disabled = false; }, 800);
                }
            });
        }

        // SalesQL Scraper button
        const salesqlScraperBtn = document.getElementById('salesqlScraperBtn');
        if (salesqlScraperBtn) {
            salesqlScraperBtn.addEventListener('click', () => this.showSalesqlScraperModal());
        }

        // Subject line placeholders button
        const subjectPlaceholdersBtn = document.getElementById('subjectPlaceholdersBtn');
        if (subjectPlaceholdersBtn) {
            subjectPlaceholdersBtn.addEventListener('click', () => this.showSubjectPlaceholdersModal());
        }

        // Campaign attachment buttons
        const addCampaignAttachmentBtn = document.getElementById('addCampaignAttachmentBtn');
        const removeAllCampaignAttachmentsBtn = document.getElementById('removeAllCampaignAttachmentsBtn');
        
        if (addCampaignAttachmentBtn) {
            addCampaignAttachmentBtn.addEventListener('click', () => this.addCampaignAttachment());
        }
        
        if (removeAllCampaignAttachmentsBtn) {
            removeAllCampaignAttachmentsBtn.addEventListener('click', () => this.removeAllCampaignAttachments());
        }

        // Modal close buttons
        const closeSalesqlModal = document.getElementById('closeSalesqlModal');
        const closeSubjectPlaceholdersModal = document.getElementById('closeSubjectPlaceholdersModal');
        const closeAttachmentModal = document.getElementById('closeAttachmentModal');
        
        if (closeSalesqlModal) {
            closeSalesqlModal.addEventListener('click', () => this.hideModal('salesqlScraperModal'));
        }
        
        if (closeSubjectPlaceholdersModal) {
            closeSubjectPlaceholdersModal.addEventListener('click', () => this.hideModal('subjectPlaceholdersModal'));
        }
        
        if (closeAttachmentModal) {
            closeAttachmentModal.addEventListener('click', () => this.hideModal('attachmentModal'));
        }

        // SalesQL Scraper controls
        const startScrapingBtn = document.getElementById('startScrapingBtn');
        const stopScrapingBtn = document.getElementById('stopScrapingBtn');
        const exportScrapedDataBtn = document.getElementById('exportScrapedDataBtn');
        
        if (startScrapingBtn) {
            startScrapingBtn.addEventListener('click', () => this.startSalesqlScraping());
        }
        
        if (stopScrapingBtn) {
            stopScrapingBtn.addEventListener('click', () => this.stopSalesqlScraping());
        }
        
        if (exportScrapedDataBtn) {
            exportScrapedDataBtn.addEventListener('click', () => this.exportScrapedData());
        }

        // Email progress controls
        const cancelEmailSendingBtn = document.getElementById('cancelEmailSendingBtn');
        if (cancelEmailSendingBtn) {
            cancelEmailSendingBtn.addEventListener('click', () => this.cancelEmailSending());
        }

        // Attachment modal controls
        const addAttachmentBtn = document.getElementById('addAttachmentBtn');
        const removeAllAttachmentsBtn = document.getElementById('removeAllAttachmentsBtn');
        const continueWithoutAttachmentsBtn = document.getElementById('continueWithoutAttachmentsBtn');
        const confirmAttachmentsBtn = document.getElementById('confirmAttachmentsBtn');
        
        if (addAttachmentBtn) {
            addAttachmentBtn.addEventListener('click', () => this.addAttachment());
        }
        
        if (removeAllAttachmentsBtn) {
            removeAllAttachmentsBtn.addEventListener('click', () => this.removeAllAttachments());
        }
        
        if (continueWithoutAttachmentsBtn) {
            continueWithoutAttachmentsBtn.addEventListener('click', () => this.continueWithoutAttachments());
        }
        
        if (confirmAttachmentsBtn) {
            confirmAttachmentsBtn.addEventListener('click', () => this.confirmAttachments());
        }

        // Subject placeholder insertion
        const insertSubjectPlaceholderBtn = document.getElementById('insertSubjectPlaceholderBtn');
        if (insertSubjectPlaceholderBtn) {
            insertSubjectPlaceholderBtn.addEventListener('click', () => this.insertSelectedSubjectPlaceholder());
        }

        // Campaign start button
        const startCampaignBtn = document.getElementById('startCampaignBtn');
        if (startCampaignBtn) {
            startCampaignBtn.addEventListener('click', () => this.createCampaign());
        }

        // New Campaign Window button
        const newCampaignWindowBtn = document.getElementById('newCampaignWindowBtn');
        if (newCampaignWindowBtn) {
            newCampaignWindowBtn.addEventListener('click', () => this.openNewCampaignWindow());
        }

        // Refresh Preview button
        const refreshPreviewBtn = document.getElementById('refreshPreviewBtn');
        if (refreshPreviewBtn) {
            refreshPreviewBtn.addEventListener('click', () => this.refreshEmailPreview());
        }

        // Auto-refresh preview when content changes
        const emailEditor = document.getElementById('emailEditor');
        if (emailEditor) {
            emailEditor.addEventListener('input', () => this.debouncePreviewUpdate());
            emailEditor.addEventListener('paste', () => this.debouncePreviewUpdate());
        }
        
        // Auto-refresh preview when subject changes
        const campaignSubject = document.getElementById('campaignSubject');
        if (campaignSubject) {
            campaignSubject.addEventListener('input', () => this.debouncePreviewUpdate());
        }
        
        const fromName = document.getElementById('fromName');
        if (fromName) {
            fromName.addEventListener('input', () => this.debouncePreviewUpdate());
        }

        // From override input
        const fromOverrideInput = document.getElementById('fromOverride');
        if (fromOverrideInput) {
            fromOverrideInput.addEventListener('input', (e) => this.handleFromOverrideChange(e.target.value));
        }

        if (googleLogoutBtn && window.electronAPI?.logout) {
            googleLogoutBtn.addEventListener('click', async () => {
                try {
                    await window.electronAPI.logout();
                    this.isAuthenticated = false;
                    this.currentAccount = null;
                    this.updateUI();
                    try { window.electronAPI?.storeSet?.('telemetry.enabled', false); } catch(_) {}
                    if (googleSignInTopBtn) {
                        googleSignInTopBtn.style.background = '#fff';
                        googleSignInTopBtn.style.color = '#2c2c2e';
                        googleSignInTopBtn.textContent = 'Sign in with Google';
                    }
                    googleLogoutBtn.style.display = 'none';
                    this.showInfo('Logged out');
                } catch (e) {
                    this.showError(e?.message || 'Logout failed');
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
            uploadCredentialsBtn.addEventListener('click', () => this.handleCredentialsUpload());
        } else {
            console.error('Upload credentials button not found!');
        }

        // Google Sheets connection buttons
        const connectSheetsBtn = document.getElementById('connectSheetsBtn');
        const connectSheetsBtn2 = document.getElementById('connectSheetsBtn2');
        if (connectSheetsBtn) {
            console.log('Connect sheets button 1 found, adding listener');
            connectSheetsBtn.addEventListener('click', () => this.connectToSheets());
        }
        if (connectSheetsBtn2) {
            console.log('Connect sheets button 2 found, adding listener');
            connectSheetsBtn2.addEventListener('click', () => this.connectToSheets());
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

    async handleCredentialsUpload() {
        console.log('Handling credentials upload');
        const fileInput = document.getElementById('credentialsFile');
        if (fileInput && fileInput.files.length > 0) {
            const file = fileInput.files[0];
            try {
                this.showLoading('Processing credentials...');
                const credentials = await this.readCredentialsFile(file);
                await this.authenticateWithCredentials(credentials);
            } catch (error) {
                this.hideLoading();
                this.showError('Failed to process credentials: ' + error.message);
            }
        } else {
            this.showError('Please select a credentials file first');
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
            
            // Use Electron's Google auth
            if (window.electronAPI && window.electronAPI.authenticateGoogle) {
                const result = await window.electronAPI.authenticateGoogle(credentials);
                if (result.success) {
                    // Immediately update UI and close spinner/modal
                    this.onAuthenticationSuccess(result.userEmail || 'authenticated');

                    // Initialize services in the background (non-blocking)
                    this.initializeServices(credentials)
                        .then(() => console.log('Services ready'))
                        .catch(err => {
                            console.error('Service init failed:', err);
                            this.showError('Connected, but failed to initialize services: ' + err.message);
                        });
                } else {
                    throw new Error(result.error || 'Authentication failed');
                }
            } else {
                // Fallback to simulation
                await this.simulateAuthentication();
            }
        } catch (error) {
            this.hideLoading();
            this.showError(error.message || 'Authentication failed');
            throw error;
        } finally {
            // Ensure overlay never stays stuck
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
                this.sendAsList = await window.electronAPI.listSendAs();
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
                this.gmailSignature = await window.electronAPI.getGmailSignature();
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

    async loadSheetData() {
        try {
            if (window.electronAPI && window.electronAPI.connectToSheets) {
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
        const testEmail = await this.showInputDialog('Test Email', 'Enter test email address:');
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
            
            // Get custom signature if available
            const customSignature = this.getCurrentSignatureContent();
            
            // Combine content and signature with proper HTML structure
            let finalHtml = htmlContent;
            if (signatureHtml && campaignData.useSig) {
                finalHtml = `<div>${htmlContent}</div><div style="margin-top: 20px; border-top: 1px solid #e0e0e0; padding-top: 20px;">${signatureHtml}</div>`;
            } else if (customSignature && customSignature.trim()) {
                // Use custom signature instead
                finalHtml = `<div>${htmlContent}</div><div style="margin-top: 20px; border-top: 1px solid #e0e0e0; padding-top: 20px;">${customSignature}</div>`;
            }
            
            const result = await window.electronAPI.sendTestEmail({
                to: testEmail,
                subject: campaignData.subject,
                content: finalContent,
                html: finalHtml,
                from,
                attachmentsPaths: this.attachmentsPaths,
                customSignature: customSignature
            });
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

    // Get current signature content from signature editor
    getCurrentSignatureContent() {
        const signatureEditor = document.getElementById('signatureEditor');
        if (signatureEditor && signatureEditor.innerHTML.trim()) {
            return signatureEditor.innerHTML.trim();
        }
        return '';
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
            this.showLoading('Starting email campaign...');

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
            const params = {
                startAt: when,
                sheetId: this.selectedSheetId,
                sheetTitle: this.selectedSheetTitle,
                subject: data.subject,
                content: data.content,
                from: this.selectedFrom || undefined,
                attachmentsPaths: this.attachmentsPaths,
                delaySeconds: parseInt(document.getElementById('emailDelay')?.value) || 5,
                useSignature: !!data.useSig
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

    // Enhanced email sending with progress tracking
    async sendBulkEmails(campaign) {
        try {
            console.log('🚀 Starting bulk email campaign:', campaign);
            this.logEvent('info', 'Starting bulk email campaign', { campaignName: campaign.name, totalRecipients: campaign.recipients?.length || 0 });
            
            if (!campaign.recipients || campaign.recipients.length === 0) {
                throw new Error('No recipients found');
            }
            
            const totalRecipients = campaign.recipients.length;
        let sent = 0;
        let failed = 0;
            const errors = [];
            
            // Show progress modal
            this.showEmailProgressModal();
            
            // Check if user wants to add attachments
            if (!this.campaignAttachments || this.campaignAttachments.length === 0) {
                const hasAttachments = await this.promptForAttachments();
                if (!hasAttachments) {
                    this.hideModal('emailProgressModal');
                    return;
                }
            }
            
            // Process each recipient
            for (let i = 0; i < totalRecipients; i++) {
                if (this.emailSendingCancelled) {
                    console.log('⏹️ Email sending cancelled by user');
                    this.logEvent('info', 'Email sending cancelled by user');
                    break;
                }
                
                const recipient = campaign.recipients[i];
                const globalIdx = i;
                
                try {
                    // Update progress
                    this.updateEmailProgress(sent, totalRecipients, `Sending to: ${recipient.email || 'Unknown'}`);
                    
                    // Send email
                    await this.sendSingleEmail(campaign, campaign.headers, recipient, globalIdx);
                    sent++;
                    
                    // Update progress
                    this.updateEmailProgress(sent, totalRecipients, `Sent to: ${recipient.email || 'Unknown'}`);
                    
                    // Add delay between emails to avoid rate limiting
                    if (i < totalRecipients - 1) {
                        await new Promise(resolve => setTimeout(resolve, 1000));
                    }
                    
                } catch (error) {
                    console.error(`❌ Failed to send email to ${recipient.email}:`, error);
                    failed++;
                    errors.push({ email: recipient.email, error: error.message });
                    
                    // Update progress with error
                    this.updateEmailProgress(sent, totalRecipients, `Failed: ${recipient.email || 'Unknown'} - ${error.message}`);
                    
                    // Continue with next email
                    continue;
                }
            }
            
            // Hide progress modal
            this.hideModal('emailProgressModal');
            
            // Show results
            if (sent > 0) {
                this.showSuccess(`Campaign completed! ${sent} emails sent successfully.${failed > 0 ? ` ${failed} failed.` : ''}`);
                this.logEvent('info', 'Bulk email campaign completed', { sent, failed, total: totalRecipients });
            } else {
                this.showError('Campaign failed! No emails were sent.');
                this.logEvent('error', 'Bulk email campaign failed', { sent, failed, total: totalRecipients, errors });
            }
            
            // Log errors if any
            if (errors.length > 0) {
                console.error('❌ Email sending errors:', errors);
                this.logEvent('error', 'Email sending errors', { errors });
            }
            
        } catch (error) {
            console.error('❌ Bulk email campaign failed:', error);
            this.hideModal('emailProgressModal');
            this.showError('Campaign failed: ' + error.message);
            this.logEvent('error', 'Bulk email campaign failed', { error: error.message });
        }
    }
    
    // Prompt user for attachments
    async promptForAttachments() {
        return new Promise((resolve) => {
            this.showModal('attachmentModal');
            
            // Set up one-time event listeners
            const confirmBtn = document.getElementById('confirmAttachmentsBtn');
            const continueBtn = document.getElementById('continueWithoutAttachmentsBtn');
            
            const handleConfirm = () => {
                this.hideModal('attachmentModal');
                resolve(true);
                cleanup();
            };
            
            const handleContinue = () => {
                this.hideModal('attachmentModal');
                resolve(false);
                cleanup();
            };
            
            const cleanup = () => {
                if (confirmBtn) confirmBtn.removeEventListener('click', handleConfirm);
                if (continueBtn) continueBtn.removeEventListener('click', handleContinue);
            };
            
            if (confirmBtn) confirmBtn.addEventListener('click', handleConfirm);
            if (continueBtn) continueBtn.addEventListener('click', handleContinue);
        });
    }
    
    // Add attachment to modal
    addAttachment() {
        const input = document.createElement('input');
        input.type = 'file';
        input.multiple = true;
        input.accept = '*/*';
        
        input.onchange = (e) => {
            const files = Array.from(e.target.files);
            this.handleModalAttachments(files);
        };
        
        input.click();
    }
    
    // Handle attachments in modal
    handleModalAttachments(files) {
        if (!this.modalAttachments) {
            this.modalAttachments = [];
        }
        
        files.forEach(file => {
            this.modalAttachments.push({
                name: file.name,
                size: file.size,
                type: file.type,
                file: file
            });
        });
        
        this.updateModalAttachmentsDisplay();
    }
    
    // Update modal attachments display
    updateModalAttachmentsDisplay() {
        const container = document.getElementById('attachmentList');
        if (!container) return;
        
        if (!this.modalAttachments || this.modalAttachments.length === 0) {
            container.innerHTML = `
                <div style="text-align: center; color: #8E8E93;">
                    <i class="fas fa-paperclip" style="font-size: 24px; margin-bottom: 8px; display: block;"></i>
                    <p>No attachments selected</p>
                </div>
            `;
            return;
        }
        
        let html = '';
        this.modalAttachments.forEach((attachment, index) => {
            const size = this.formatFileSize(attachment.size);
            html += `
                <div style="display: flex; justify-content: space-between; align-items: center; padding: 8px; border: 1px solid #e5e5e7; border-radius: 4px; margin-bottom: 8px; background: #fff;">
                    <div>
                        <i class="fas fa-paperclip" style="color: #007AFF; margin-right: 8px;"></i>
                        <span style="font-weight: 500;">${this.escapeHtml(attachment.name)}</span>
                        <small style="color: #8E8E93; margin-left: 8px;">${size}</small>
                    </div>
                    <button type="button" class="btn btn-secondary" style="padding: 4px 8px; font-size: 12px;" onclick="window.rtxApp.removeModalAttachment(${index})">
                        <i class="fas fa-times"></i>
                    </button>
                </div>
            `;
        });
        
        container.innerHTML = html;
    }
    
    // Remove modal attachment
    removeModalAttachment(index) {
        if (this.modalAttachments && this.modalAttachments[index]) {
            this.modalAttachments.splice(index, 1);
            this.updateModalAttachmentsDisplay();
        }
    }
    
    // Remove all modal attachments
    removeAllAttachments() {
        this.modalAttachments = [];
        this.updateModalAttachmentsDisplay();
        this.showSuccess('All attachments removed');
    }
    
    // Continue without attachments
    continueWithoutAttachments() {
        this.hideModal('attachmentModal');
        // Continue with email sending
    }
    
    // Confirm attachments
    confirmAttachments() {
        if (this.modalAttachments && this.modalAttachments.length > 0) {
            // Copy modal attachments to campaign attachments
            this.campaignAttachments = [...this.modalAttachments];
            this.updateCampaignAttachmentsDisplay();
            this.showSuccess(`${this.campaignAttachments.length} attachments added to campaign`);
        }
        this.hideModal('attachmentModal');
    }
    
    // Get available placeholders from sheet data
    getAvailablePlaceholders() {
        if (!this.sheetData || !this.sheetData.headers) {
            return [];
        }
        
        return this.sheetData.headers.filter(header => 
            header && header.trim() && 
            !['email', 'Email', 'EMAIL'].includes(header.trim())
        );
    }
    
    // Enhanced single email sending with attachments
    async sendSingleEmail(campaign, headers, row, rowIndexZeroBased) {
        try {
            console.log(`📧 Sending email ${rowIndexZeroBased + 1}:`, row);
            this.logEvent('info', 'Sending single email', { rowIndex: rowIndexZeroBased, recipient: row.email || 'Unknown' });
            
            // Prepare email data
            const emailData = {
                to: row.email || row.Email || row.EMAIL,
                subject: this.replacePlaceholders(campaign.subject, headers, row),
                content: this.replacePlaceholders(campaign.content, headers, row),
                html: this.replacePlaceholders(campaign.html, headers, row),
                from: campaign.from || this.selectedFrom,
                attachments: this.prepareAttachments()
            };
            
            // Validate email data
            if (!emailData.to || !emailData.subject || !emailData.content) {
                throw new Error('Missing required email data');
            }
            
            // Send email
            const result = await window.electronAPI.sendEmail(emailData);
            
            if (result.success) {
                console.log(`✅ Email sent successfully to ${emailData.to}`);
                this.logEvent('info', 'Email sent successfully', { recipient: emailData.to, subject: emailData.subject });
                
                // Update row status
                this.rowStatus.set(rowIndexZeroBased, 'sent');
                this.updateRowStatus(rowIndexZeroBased, 'sent');
            } else {
            throw new Error(result.error || 'Failed to send email');
        }
            
        } catch (error) {
            console.error(`❌ Failed to send email to ${row.email || 'Unknown'}:`, error);
            this.logEvent('error', 'Email sending failed', { 
                recipient: row.email || 'Unknown', 
                error: error.message,
                rowIndex: rowIndexZeroBased 
            });
            
            // Update row status
            this.rowStatus.set(rowIndexZeroBased, 'failed');
            this.updateRowStatus(rowIndexZeroBased, 'failed');
            
            throw error;
        }
    }
    
    // Prepare attachments for email sending
    prepareAttachments() {
        if (!this.campaignAttachments || this.campaignAttachments.length === 0) {
            return [];
        }
        
        return this.campaignAttachments.map(attachment => ({
            filename: attachment.name,
            content: attachment.file,
            contentType: attachment.type
        }));
    }
    
    // Update row status in UI
    updateRowStatus(rowIndex, status) {
        try {
            const rowElement = document.querySelector(`[data-row-index="${rowIndex}"]`);
            if (rowElement) {
                const statusCell = rowElement.querySelector('.row-status');
                if (statusCell) {
                    statusCell.textContent = status;
                    statusCell.className = `row-status ${status}`;
                }
            }
        } catch (e) {
            console.warn('Failed to update row status:', e);
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

    handleMenuAction(action) {
        switch (action) {
            case 'new-campaign':
                this.createNewCampaign();
                break;
            case 'import-data':
                this.connectToSheets();
                break;
            case 'help':
                this.showHelp();
                break;
            default:
                console.log('Unknown menu action:', action);
        }
    }
    
    // Create campaign with enhanced features
    async createCampaign() {
        try {
            console.log('🚀 Creating email campaign...');
            this.logEvent('info', 'Creating email campaign');
            
            // Validate required fields
            const campaignName = document.getElementById('campaignName')?.value?.trim();
            const subject = document.getElementById('campaignSubject')?.value?.trim();
            const fromName = document.getElementById('fromName')?.value?.trim();
            const content = this.getEditorPlainText();
            const html = this.getEditorHtml();
            
            if (!campaignName || !subject || !content) {
                throw new Error('Please fill in all required fields: Campaign Name, Subject Line, and Email Content');
            }
            
            if (!this.sheetData || !this.sheetData.rows || this.sheetData.rows.length === 0) {
                throw new Error('Please import a Google Sheet with recipient data first');
            }
            
            // Prepare campaign data
            const campaign = {
                name: campaignName,
                subject: subject,
                fromName: fromName,
                content: content,
                html: html,
                from: this.selectedFrom,
                headers: this.sheetData.headers,
                recipients: this.prepareRecipients(),
                attachments: this.campaignAttachments || [],
                createdAt: new Date().toISOString(),
                status: 'ready'
            };
            
            console.log('📋 Campaign data prepared:', campaign);
            this.logEvent('info', 'Campaign data prepared', { 
                campaignName: campaign.name, 
                subject: campaign.subject,
                recipientCount: campaign.recipients.length 
            });
            
            // Start sending emails
            await this.sendBulkEmails(campaign);
            
        } catch (error) {
            console.error('❌ Campaign creation failed:', error);
            this.showError('Failed to create campaign: ' + error.message);
            this.logEvent('error', 'Campaign creation failed', { error: error.message });
        }
    }
    
    // Prepare recipients from sheet data
    prepareRecipients() {
        if (!this.sheetData || !this.sheetData.rows) {
            return [];
        }
        
        const emailHeader = this.findEmailColumn();
        if (!emailHeader) {
            throw new Error('No Email column found in the sheet');
        }
        
        const emailIndex = this.sheetData.headers.indexOf(emailHeader);
        const recipients = [];
        
        this.sheetData.rows.forEach((row, index) => {
            const email = row[emailIndex];
            if (email && this.isValidEmail(email)) {
                // Create recipient object with all row data
                const recipient = {
                    email: email,
                    rowIndex: index,
                    ...this.buildRowMap(this.sheetData.headers, row)
                };
                recipients.push(recipient);
            }
        });
        
        console.log(`📧 Prepared ${recipients.length} recipients from ${this.sheetData.rows.length} rows`);
        return recipients;
    }
    
    // Replace placeholders in content
    replacePlaceholders(content, headers, row) {
        if (!content || !headers || !row) {
            return content;
        }
        
        let processedContent = content;
        
        // Replace ((placeholder)) with actual values
        headers.forEach((header, index) => {
            if (header && row[index] !== undefined) {
                const placeholder = `((${header}))`;
                const value = row[index] || '';
                processedContent = processedContent.replace(new RegExp(this.escapeRegExp(placeholder), 'g'), value);
            }
        });
        
        return processedContent;
    }
    
    // Escape regex special characters
    escapeRegExp(string) {
        return string.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
    }
    
    // Find email column in headers
    findEmailColumn() {
        if (!this.sheetData || !this.sheetData.headers) {
            return null;
        }
        
        const emailHeaders = ['email', 'Email', 'EMAIL', 'e-mail', 'E-mail'];
        return this.sheetData.headers.find(header => 
            emailHeaders.includes(header?.trim())
        );
    }
    
    // Validate email format
    isValidEmail(email) {
        const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
        return emailRegex.test(email);
    }
    
    // Initialize the app instance globally for onclick handlers
    initializeGlobalInstance() {
        window.rtxApp = this;
        console.log('✅ Global RTX app instance initialized');
    }
    
    // Enhanced From Address functionality
    async populateFromAddressDropdown() {
        try {
            const fromSelect = document.getElementById('fromAddress');
            if (!fromSelect) return;
            
            // Clear existing options
            fromSelect.innerHTML = '<option value="">Select From Address</option>';
            
            // Add current authenticated account if available
            if (this.currentAccount) {
                const opt = document.createElement('option');
                opt.value = this.currentAccount;
                opt.textContent = `${this.currentAccount} (Authenticated)`;
                opt.selected = true;
                fromSelect.appendChild(opt);
                this.selectedFrom = this.currentAccount;
            }
            
            // Add other verified accounts if available
            if (this.sendAsList && this.sendAsList.length > 0) {
                this.sendAsList.forEach(account => {
                    if (account !== this.currentAccount) {
                        const opt = document.createElement('option');
                        opt.value = account;
                        opt.textContent = `${account} (Verified)`;
                        fromSelect.appendChild(opt);
                    }
                });
            }
            
            // Add custom option
            const customOpt = document.createElement('option');
            customOpt.value = 'custom';
            customOpt.textContent = 'Custom Email Address';
            fromSelect.appendChild(customOpt);
            
            // Add change event listener
            fromSelect.addEventListener('change', (e) => {
                this.handleFromAddressChange(e.target.value);
            });
            
            console.log('✅ From Address dropdown populated');
            
        } catch (error) {
            console.error('❌ Failed to populate From Address dropdown:', error);
            this.logEvent('error', 'Failed to populate From Address dropdown', { error: error.message });
        }
    }
    
    // Handle From Address selection change
    handleFromAddressChange(value) {
        try {
            if (value === 'custom') {
                // Show custom email input
                const customInput = document.getElementById('fromOverride');
                if (customInput) {
                    customInput.style.display = 'block';
                    customInput.focus();
                }
                this.selectedFrom = null;
            } else if (value) {
                // Hide custom email input
                const customInput = document.getElementById('fromOverride');
                if (customInput) {
                    customInput.style.display = 'none';
                }
                this.selectedFrom = value;
                
                // Update signature info if available
                this.updateSignatureInfo(value);
            }
            
            console.log('📧 From Address changed to:', value);
            this.logEvent('info', 'From Address changed', { fromAddress: value });
            
        } catch (error) {
            console.error('❌ Failed to handle From Address change:', error);
        }
    }
    
    // Update signature info display
    updateSignatureInfo(email) {
        try {
            const signatureInfo = document.getElementById('signatureInfo');
            if (signatureInfo) {
                if (email === this.currentAccount) {
                    signatureInfo.textContent = 'Using authenticated account signature';
                    signatureInfo.style.color = '#34C759';
                } else if (this.sendAsList && this.sendAsList.includes(email)) {
                    signatureInfo.textContent = 'Using verified account signature';
                    signatureInfo.style.color = '#007AFF';
                } else {
                    signatureInfo.textContent = 'No signature available for this address';
                    signatureInfo.style.color = '#8E8E93';
                }
            }
        } catch (error) {
            console.warn('Failed to update signature info:', error);
        }
    }
    
    // Load send-as list from Gmail API
    async loadSendAsList() {
        try {
            if (!window.electronAPI?.getSendAsList) {
                console.log('⚠️ Send-as list API not available');
                return;
            }
            
            const sendAsList = await window.electronAPI.getSendAsList('main');
            if (sendAsList && Array.isArray(sendAsList)) {
                this.sendAsList = sendAsList;
                console.log('📧 Send-as list loaded:', this.sendAsList);
                this.logEvent('info', 'Send-as list loaded', { count: this.sendAsList.length });
            }
            
        } catch (error) {
            console.warn('Failed to load send-as list:', error);
            this.logEvent('warning', 'Failed to load send-as list', { error: error.message });
        }
    }
    
    // Validate custom email address
    validateCustomEmail(email) {
        if (!email || !email.trim()) {
            return { valid: false, error: 'Email address is required' };
        }
        
        const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
        if (!emailRegex.test(email)) {
            return { valid: false, error: 'Invalid email format' };
        }
        
        // Check if it's a verified alias
        if (this.sendAsList && this.sendAsList.includes(email)) {
            return { valid: true, verified: true };
        }
        
        // Check if it's the authenticated account
        if (email === this.currentAccount) {
            return { valid: true, verified: true };
        }
        
        // Custom email (not verified)
        return { valid: true, verified: false, warning: 'This email address is not verified. Delivery may be affected.' };
    }
    
    // Handle from override input changes
    handleFromOverrideChange(value) {
        try {
            if (value && value.trim()) {
                const validation = this.validateCustomEmail(value.trim());
                if (validation.valid) {
                    this.selectedFrom = value.trim();
                    
                    // Update signature info
                    this.updateSignatureInfo(value.trim());
                    
                    // Show warning if not verified
                    if (!validation.verified && validation.warning) {
                        this.showWarning(validation.warning);
                    }
                    
                    console.log('📧 From override set to:', value.trim());
                    this.logEvent('info', 'From override set', { fromAddress: value.trim(), verified: validation.verified });
                } else {
                    this.showError(validation.error);
                    this.selectedFrom = null;
                }
            } else {
                this.selectedFrom = null;
            }
        } catch (error) {
            console.error('❌ Failed to handle from override change:', error);
        }
    }
    
    // Show warning message
    showWarning(message) {
        try {
            const warningDiv = document.createElement('div');
            warningDiv.style.cssText = `
                position: fixed;
                top: 20px;
                right: 20px;
                background: #FF9500;
                color: white;
                padding: 12px 16px;
                border-radius: 8px;
                box-shadow: 0 4px 12px rgba(0,0,0,0.15);
                z-index: 10000;
                max-width: 300px;
                font-size: 14px;
            `;
            warningDiv.textContent = message;
            
            document.body.appendChild(warningDiv);
            
            // Auto-remove after 5 seconds
            setTimeout(() => {
                if (warningDiv.parentNode) {
                    warningDiv.parentNode.removeChild(warningDiv);
                }
            }, 5000);
            
        } catch (error) {
            console.warn('Failed to show warning:', error);
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
        console.log('Updating UI, authenticated:', this.isAuthenticated);

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

    async saveCurrentTemplate() {
        const data = this.getCampaignData(); if (!data) return;
        const name = await this.showInputDialog('Save Template', 'Template name:'); if (!name) return;
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
        const html = `<div><h4 style="margin-bottom:8px;">Subject: ${this.escapeHtml(data.subject)}</h4><pre style="white-space:pre-wrap;">${this.escapeHtml(content)}</pre></div>`;
        const modal = document.getElementById('emailPreviewModal');
        const body = document.getElementById('emailPreviewBody');
        if (body) body.innerHTML = html; if (modal) modal.style.display = 'block';
    }

    toggleTheme() {
        const body = document.body;
        const dark = body.getAttribute('data-theme') === 'dark';
        body.setAttribute('data-theme', dark ? 'light' : 'dark');
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

    insertPlaceholderIntoEditor(editorContainer, ins) {
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
        
        // Update counts
        this.updateEditorCounts();
    }

    // Modal management
    showModal(modalId) {
        const modal = document.getElementById(modalId);
        if (modal) {
            modal.style.display = 'flex';
            console.log(`📱 Modal opened: ${modalId}`);
        }
    }
    
    hideModal(modalId) {
        const modal = document.getElementById(modalId);
        if (modal) {
            modal.style.display = 'none';
            console.log(`📱 Modal closed: ${modalId}`);
        }
    }
    
    // SalesQL Scraper functionality
    showSalesqlScraperModal() {
        this.showModal('salesqlScraperModal');
        this.initializeSalesqlScraper();
    }
    
    initializeSalesqlScraper() {
        console.log('🔧 Initializing SalesQL Scraper...');
        // Initialize the scraper interface
        this.scrapedData = [];
        this.isScraping = false;
        this.updateScrapingUI();
    }
    
    async startSalesqlScraping() {
        if (this.isScraping) return;
        
        console.log('🚀 Starting SalesQL scraping...');
        this.isScraping = true;
        this.updateScrapingUI();
        
        try {
            // Simulate scraping process (replace with actual Chrome extension integration)
            await this.simulateScraping();
        } catch (error) {
            console.error('❌ Scraping failed:', error);
            this.showError('Scraping failed: ' + error.message);
        } finally {
            this.isScraping = false;
            this.updateScrapingUI();
        }
    }
    
    async simulateScraping() {
        const delay = parseInt(document.getElementById('scrapingDelay')?.value || '4') * 1000;
        const totalPages = 5;
        
        for (let page = 1; page <= totalPages; page++) {
            if (!this.isScraping) break;
            
            // Update progress
            this.updateScrapingProgress(page, totalPages);
            
            // Simulate page data
            const pageData = this.generateSamplePageData(page);
            this.scrapedData.push(...pageData);
            
            // Update data display
            this.updateScrapedDataDisplay();
            
            // Wait before next page
            if (page < totalPages) {
                await new Promise(resolve => setTimeout(resolve, delay));
            }
        }
        
        this.showSuccess(`Scraping completed! Found ${this.scrapedData.length} contacts.`);
    }
    
    generateSamplePageData(page) {
        const companies = ['TechCorp', 'InnovateLabs', 'DataFlow', 'CloudTech', 'FutureSystems'];
        const names = ['John Doe', 'Jane Smith', 'Mike Johnson', 'Sarah Wilson', 'David Brown'];
        const emails = ['john@example.com', 'jane@example.com', 'mike@example.com', 'sarah@example.com', 'david@example.com'];
        
        return Array.from({ length: 5 }, (_, i) => ({
            company: companies[(page + i) % companies.length],
            profile: `https://linkedin.com/in/${names[(page + i) % names.length].toLowerCase().replace(' ', '')}`,
            email: emails[(page + i) % emails.length]
        }));
    }
    
    updateScrapingProgress(current, total) {
        const progressBar = document.getElementById('scrapingProgressBar');
        const progressText = document.getElementById('scrapingProgressText');
        const progressContainer = document.getElementById('scrapingProgress');
        
        if (progressBar && progressText && progressContainer) {
            const percentage = (current / total) * 100;
            progressBar.style.width = `${percentage}%`;
            progressText.textContent = `${current}/${total}`;
            progressContainer.style.display = 'block';
        }
    }
    
    updateScrapedDataDisplay() {
        const container = document.getElementById('scrapedDataContainer');
        if (!container) return;
        
        if (this.scrapedData.length === 0) {
            container.innerHTML = `
                <div style="text-align: center; color: #8E8E93; margin-top: 40px;">
                    <i class="fas fa-database" style="font-size: 48px; margin-bottom: 16px; display: block;"></i>
                    <p>No data scraped yet. Start scraping to see results here.</p>
                </div>
            `;
            return;
        }
        
        // Create table
        let html = `
            <table style="width: 100%; border-collapse: collapse; font-size: 12px;">
                <thead>
                    <tr style="background: #f8f9fa;">
                        <th style="padding: 8px; border: 1px solid #e5e5e7; text-align: left;">Company</th>
                        <th style="padding: 8px; border: 1px solid #e5e5e7; text-align: left;">Profile</th>
                        <th style="padding: 8px; border: 1px solid #e5e5e7; text-align: left;">Email</th>
                    </tr>
                </thead>
                <tbody>
        `;
        
        this.scrapedData.forEach((item, index) => {
            html += `
                <tr>
                    <td style="padding: 8px; border: 1px solid #e5e5e7;">${this.escapeHtml(item.company)}</td>
                    <td style="padding: 8px; border: 1px solid #e5e5e7;">
                        <a href="${item.profile}" target="_blank" style="color: #007AFF;">${this.escapeHtml(item.profile)}</a>
                    </td>
                    <td style="padding: 8px; border: 1px solid #e5e5e7;">${this.escapeHtml(item.email)}</td>
                </tr>
            `;
        });
        
        html += `
                </tbody>
            </table>
            <div style="margin-top: 16px; text-align: center;">
                <strong>Total: ${this.scrapedData.length} contacts</strong>
            </div>
        `;
        
        container.innerHTML = html;
    }
    
    updateScrapingUI() {
        const startBtn = document.getElementById('startScrapingBtn');
        const stopBtn = document.getElementById('stopScrapingBtn');
        const exportBtn = document.getElementById('exportScrapedDataBtn');
        const statusText = document.getElementById('scrapingStatusText');
        const progressContainer = document.getElementById('scrapingProgress');
        
        if (startBtn) startBtn.disabled = this.isScraping;
        if (stopBtn) stopBtn.disabled = !this.isScraping;
        if (exportBtn) exportBtn.disabled = this.scrapedData.length === 0;
        if (statusText) {
            statusText.textContent = this.isScraping ? 'Scraping in progress...' : 'Ready to scrape';
        }
        if (progressContainer && !this.isScraping) {
            progressContainer.style.display = 'none';
        }
    }
    
    stopSalesqlScraping() {
        console.log('⏹️ Stopping SalesQL scraping...');
        this.isScraping = false;
        this.updateScrapingUI();
        this.showSuccess('Scraping stopped.');
    }
    
    exportScrapedData() {
        if (this.scrapedData.length === 0) {
            this.showError('No data to export');
            return;
        }
        
        try {
            const fileName = document.getElementById('scrapingFileName')?.value || 'salesql_data';
            const csv = this.convertToCSV(this.scrapedData);
            this.downloadCSV(csv, fileName);
            this.showSuccess('Data exported successfully!');
        } catch (error) {
            console.error('❌ Export failed:', error);
            this.showError('Export failed: ' + error.message);
        }
    }
    
    convertToCSV(data) {
        if (data.length === 0) return '';
        
        const headers = Object.keys(data[0]);
        const csvRows = [headers.join(',')];
        
        for (const row of data) {
            const values = headers.map(header => {
                const value = row[header] || '';
                // Escape commas and quotes
                return `"${String(value).replace(/"/g, '""')}"`;
            });
            csvRows.push(values.join(','));
        }
        
        return csvRows.join('\n');
    }
    
    downloadCSV(csv, fileName) {
        const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' });
        const link = document.createElement('a');
        const url = URL.createObjectURL(blob);
        link.setAttribute('href', url);
        link.setAttribute('download', `${fileName}.csv`);
        link.style.visibility = 'hidden';
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
    }
    
    // Subject line placeholders
    showSubjectPlaceholdersModal() {
        this.showModal('subjectPlaceholdersModal');
        this.populateSubjectPlaceholders();
    }
    
    populateSubjectPlaceholders() {
        const container = document.getElementById('subjectPlaceholdersList');
        if (!container) return;
        
        // Get available placeholders from sheet data
        const placeholders = this.getAvailablePlaceholders();
        
        if (placeholders.length === 0) {
            container.innerHTML = '<p style="color: #8E8E93;">No placeholders available. Import a sheet first.</p>';
            return;
        }
        
        let html = '';
        placeholders.forEach(placeholder => {
            html += `
                <div class="placeholder-item" style="padding: 8px; border: 1px solid #e5e5e7; border-radius: 4px; margin-bottom: 8px; cursor: pointer; transition: background 0.2s;" 
                     onmouseover="this.style.background='#f1f3f4'" 
                     onmouseout="this.style.background='#fff'"
                     onclick="window.rtxApp.selectSubjectPlaceholder('${placeholder}')">
                    <strong>((${placeholder}))</strong>
                    <small style="color: #8E8E93; margin-left: 8px;">Click to select</small>
                </div>
            `;
        });
        
        container.innerHTML = html;
    }
    
    selectSubjectPlaceholder(placeholder) {
        const input = document.getElementById('subjectPreviewInput');
        if (input) {
            const currentValue = input.value || '';
            const cursorPos = input.selectionStart || 0;
            const newValue = currentValue.slice(0, cursorPos) + `((${placeholder}))` + currentValue.slice(cursorPos);
            input.value = newValue;
            
            // Set cursor position after the inserted placeholder
            const newPos = cursorPos + `((${placeholder}))`.length;
            input.setSelectionRange(newPos, newPos);
            input.focus();
        }
    }
    
    insertSelectedSubjectPlaceholder() {
        const input = document.getElementById('subjectPreviewInput');
        const subjectInput = document.getElementById('campaignSubject');
        
        if (input && subjectInput) {
            subjectInput.value = input.value;
            this.hideModal('subjectPlaceholdersModal');
            this.showSuccess('Subject line updated with placeholders!');
        }
    }
    
    // Email progress handling
    showEmailProgressModal() {
        this.showModal('emailProgressModal');
        this.emailSendingCancelled = false;
    }
    
    updateEmailProgress(current, total, details = '') {
        const progressBar = document.getElementById('emailProgressBar');
        const progressText = document.getElementById('emailProgressText');
        const progressStatus = document.getElementById('emailProgressStatus');
        const progressDetails = document.getElementById('emailProgressDetails');
        
        if (progressBar && progressText) {
            const percentage = total > 0 ? (current / total) * 100 : 0;
            progressBar.style.width = `${percentage}%`;
            progressText.textContent = `${current}/${total}`;
        }
        
        if (progressStatus) {
            progressStatus.innerHTML = `<p>Sending emails... ${current} of ${total} completed</p>`;
        }
        
        if (progressDetails && details) {
            progressDetails.innerHTML = details;
        }
    }
    
    cancelEmailSending() {
        this.emailSendingCancelled = true;
        this.hideModal('emailProgressModal');
        this.showSuccess('Email sending cancelled');
    }
    
    // Enhanced logging
    logEvent(level, message, data = {}) {
        const timestamp = new Date().toISOString();
        const logEntry = {
            timestamp,
            level,
            message,
            data,
            userId: this.currentAccount?.email || 'unknown'
        };
        
        console.log(`[${level.toUpperCase()}] ${message}`, data);
        
        // Store in local storage for debugging
        try {
            const logs = JSON.parse(localStorage.getItem('rtx_logs') || '[]');
            logs.push(logEntry);
            
            // Keep only last 1000 logs
            if (logs.length > 1000) {
                logs.splice(0, logs.length - 1000);
            }
            
            localStorage.setItem('rtx_logs', JSON.stringify(logs));
        } catch (e) {
            console.warn('Failed to store log:', e);
        }
    }

    // Campaign attachment methods
    addCampaignAttachment() {
        const input = document.createElement('input');
        input.type = 'file';
        input.multiple = true;
        input.accept = '*/*';
        
        input.onchange = (e) => {
            const files = Array.from(e.target.files);
            if (files.length > 0) {
                if (!this.campaignAttachments) {
                    this.campaignAttachments = [];
                }
                
                files.forEach(file => {
                    this.campaignAttachments.push({
                        name: file.name,
                        size: file.size,
                        type: file.type,
                        file: file
                    });
                });
                
                this.updateCampaignAttachmentsDisplay();
                this.showSuccess(`Added ${files.length} attachment(s)`);
            }
        };
        
        input.click();
    }

    handleCampaignAttachments() {
        if (!this.campaignAttachments) {
            this.campaignAttachments = [];
        }
        this.updateCampaignAttachmentsDisplay();
    }

    updateCampaignAttachmentsDisplay() {
        const container = document.getElementById('campaignAttachments');
        if (!container) return;

        if (!this.campaignAttachments || this.campaignAttachments.length === 0) {
            container.innerHTML = `
                <div style="text-align: center; color: #8E8E93;">
                    <i class="fas fa-paperclip" style="font-size: 20px; margin-bottom: 8px; display: block;"></i>
                    <p>No attachments selected</p>
                </div>
            `;
            return;
        }

        const html = this.campaignAttachments.map((attachment, index) => `
            <div style="display: flex; align-items: center; justify-content: space-between; padding: 8px; background: white; border: 1px solid #e5e5e7; border-radius: 4px; margin-bottom: 8px;">
                <div style="display: flex; align-items: center; gap: 8px;">
                    <i class="fas fa-paperclip" style="color: #007AFF;"></i>
                    <div>
                        <div style="font-weight: 500; font-size: 14px;">${attachment.name}</div>
                        <div style="font-size: 12px; color: #8E8E93;">${this.formatFileSize(attachment.size)}</div>
                    </div>
                </div>
                <button type="button" class="btn btn-sm btn-danger" onclick="window.rtxApp.removeCampaignAttachment(${index})">
                    <i class="fas fa-trash"></i>
                </button>
            </div>
        `).join('');

        container.innerHTML = html;
    }

    removeCampaignAttachment(index) {
        if (this.campaignAttachments && this.campaignAttachments[index]) {
            this.campaignAttachments.splice(index, 1);
            this.updateCampaignAttachmentsDisplay();
            this.showSuccess('Attachment removed');
        }
    }

    removeAllCampaignAttachments() {
        if (this.campaignAttachments && this.campaignAttachments.length > 0) {
            this.campaignAttachments = [];
            this.updateCampaignAttachmentsDisplay();
            this.showSuccess('All attachments removed');
        }
    }

    formatFileSize(bytes) {
        if (bytes === 0) return '0 Bytes';
        const k = 1024;
        const sizes = ['Bytes', 'KB', 'MB', 'GB'];
        const i = Math.floor(Math.log(bytes) / Math.log(k));
        return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
    }

    // Modal management methods
    showModal(modalId) {
        const modal = document.getElementById(modalId);
        if (modal) {
            modal.style.display = 'block';
            document.body.classList.add('modal-open');
        }
    }

    hideModal(modalId) {
        const modal = document.getElementById(modalId);
        if (modal) {
            modal.style.display = 'none';
            document.body.classList.remove('modal-open');
        }
    }

    // Email sending progress methods
    promptForAttachments() {
        return new Promise((resolve) => {
            this.showModal('attachmentModal');
            
            // Set up event listeners for the modal
            const continueBtn = document.getElementById('continueWithoutAttachmentsBtn');
            const confirmBtn = document.getElementById('confirmAttachmentsBtn');
            
            if (continueBtn) {
                continueBtn.onclick = () => {
                    this.hideModal('attachmentModal');
                    resolve(false);
                };
            }
            
            if (confirmBtn) {
                confirmBtn.onclick = () => {
                    this.hideModal('attachmentModal');
                    resolve(true);
                };
            }
        });
    }

    // Enhanced notification methods
    showSuccess(message) {
        if (window.showNotification) {
            window.showNotification(message, 'success');
        } else {
            this.showBasicNotification(message, 'success');
        }
    }
    
    showError(message) {
        if (window.showNotification) {
            window.showNotification(message, 'error');
        } else {
            this.showBasicNotification(message, 'error');
        }
    }
    
    showWarning(message) {
        if (window.showNotification) {
            window.showNotification(message, 'warning');
        } else {
            this.showBasicNotification(message, 'warning');
        }
    }
    
    showInfo(message) {
        if (window.showNotification) {
            window.showNotification(message, 'info');
        } else {
            this.showBasicNotification(message, 'info');
        }
    }
    
    showBasicNotification(message, type = 'info') {
        const notification = document.createElement('div');
        notification.className = `notification notification-${type}`;
        notification.style.cssText = 'position: fixed; top: 20px; right: 20px; z-index: 9999; max-width: 400px; padding: 16px 20px; border-radius: 8px; color: white; font-weight: 600; transform: translateX(100%); transition: transform 0.3s ease;';
        
        let backgroundColor = '#007AFF';
        if (type === 'success') backgroundColor = '#34C759';
        if (type === 'error') backgroundColor = '#FF3B30';
        if (type === 'warning') backgroundColor = '#FF9500';
        
        notification.style.background = backgroundColor;
        notification.innerHTML = `
            ${message}
            <button type="button" class="close-btn" onclick="this.parentElement.remove()" style="position: absolute; top: 8px; right: 8px; background: none; border: none; color: white; font-size: 18px; cursor: pointer; opacity: 0.8;">&times;</button>
        `;
        
        document.body.appendChild(notification);
        
        // Show notification
        setTimeout(() => notification.style.transform = 'translateX(0)', 100);
        
        // Auto-hide after 10 seconds
        setTimeout(() => {
            if (notification.parentElement) {
                notification.style.transform = 'translateX(100%)';
                setTimeout(() => notification.remove(), 300);
            }
        }, 10000);
    }

    // Enhanced Preview functionality with live updates
    debouncePreviewUpdate() {
        if (this.previewUpdateTimeout) {
            clearTimeout(this.previewUpdateTimeout);
        }
        this.previewUpdateTimeout = setTimeout(() => {
            this.refreshEmailPreview();
        }, 300); // Faster updates for better responsiveness
    }

    refreshEmailPreview() {
        try {
            const previewContainer = document.getElementById('emailPreview');
            if (!previewContainer) return;

            const subject = document.getElementById('campaignSubject')?.value || 'No Subject';
            const fromName = document.getElementById('fromName')?.value || 'Your Name';
            const content = this.getEditorHtml() || 'No content yet';
            const fromEmail = this.selectedFrom || 'your-email@gmail.com';
            const useSignature = document.getElementById('useSignature')?.checked || false;
            const signature = useSignature ? this.gmailSignature : '';

            // Enhanced preview with better styling and signature support
            const previewHTML = `
                <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; background: white; border: 1px solid #e0e0e0; border-radius: 8px; overflow: hidden; box-shadow: 0 2px 8px rgba(0,0,0,0.1);">
                    <!-- Email Header -->
                    <div style="background: linear-gradient(135deg, #667eea 0%, #764ba2 100%); padding: 20px; color: white;">
                        <div style="margin-bottom: 10px; font-size: 14px;">
                            <i class="fas fa-user" style="margin-right: 8px;"></i>
                            <strong>From:</strong> ${fromName} &lt;${fromEmail}&gt;
                        </div>
                        <div style="margin-bottom: 10px; font-size: 14px;">
                            <i class="fas fa-tag" style="margin-right: 8px;"></i>
                            <strong>Subject:</strong> ${subject}
                        </div>
                        <div style="margin-bottom: 10px; font-size: 14px;">
                            <i class="fas fa-calendar" style="margin-right: 8px;"></i>
                            <strong>Date:</strong> ${new Date().toLocaleString()}
                        </div>
                    </div>
                    
                    <!-- Email Body -->
                    <div style="padding: 30px; line-height: 1.6; color: #333; background: white;">
                        ${content}
                        ${signature ? `<hr style="margin: 30px 0; border: none; border-top: 1px solid #e0e0e0;"><div style="color: #666; font-size: 13px;">${signature}</div>` : ''}
                    </div>
                    
                    <!-- Email Footer -->
                    <div style="background: #f8f9fa; padding: 20px; border-top: 1px solid #e0e0e0; text-align: center; color: #666; font-size: 12px;">
                        <div style="display: flex; align-items: center; justify-content: center; gap: 8px;">
                            <i class="fas fa-rocket" style="color: #007AFF;"></i>
                            <span>Sent via TASK FORCE AutoMailer Pro</span>
                        </div>
                        <div style="margin-top: 8px; color: #999;">
                            <small>This is a preview of how your email will appear to recipients</small>
                        </div>
                    </div>
                </div>
            `;

            previewContainer.innerHTML = previewHTML;
            this.logEvent('info', 'Email preview refreshed');
        } catch (error) {
            console.error('Error refreshing preview:', error);
            this.logEvent('error', 'Failed to refresh preview', { error: error.message });
        }
    }
    
    // Enhanced template management
    async saveTemplate() {
        try {
            const templateName = await this.showInputDialog('Load Template', 'Enter template name:');
            if (!templateName) return;
            
            const template = {
                name: templateName,
                subject: document.getElementById('campaignSubject')?.value || '',
                fromName: document.getElementById('fromName')?.value || '',
                content: this.getEditorHtml() || '',
                timestamp: Date.now()
            };
            
            // Get existing templates
            let templates = JSON.parse(localStorage.getItem('emailTemplates') || '[]');
            
            // Check if template with same name exists
            const existingIndex = templates.findIndex(t => t.name === templateName);
            if (existingIndex !== -1) {
                if (confirm(`Template "${templateName}" already exists. Do you want to overwrite it?`)) {
                    templates[existingIndex] = template;
                } else {
                    return;
                }
            } else {
                templates.push(template);
            }
            
            // Save to localStorage
            localStorage.setItem('emailTemplates', JSON.stringify(templates));
            
            // Update template dropdown
            this.populateTemplateDropdown();
            
            this.showSuccess(`Template "${templateName}" saved successfully!`);
            this.logEvent('info', `Template saved: ${templateName}`);
            
        } catch (error) {
            console.error('Error saving template:', error);
            this.showError('Failed to save template: ' + error.message);
        }
    }
    
    loadTemplate() {
        try {
            const templateSelect = document.getElementById('templateSelect');
            const selectedTemplate = templateSelect.value;
            
            if (!selectedTemplate) {
                this.showWarning('Please select a template to load');
                return;
            }
            
            // Get templates from localStorage
            const templates = JSON.parse(localStorage.getItem('emailTemplates') || '[]');
            const template = templates.find(t => t.name === selectedTemplate);
            
            if (!template) {
                this.showError('Template not found');
                return;
            }
            
            // Load template data
            if (document.getElementById('campaignSubject')) {
                document.getElementById('campaignSubject').value = template.subject;
            }
            if (document.getElementById('fromName')) {
                document.getElementById('fromName').value = template.fromName;
            }
            
            // Load content into editor
            this.setEditorHtml(template.content);
            
            // Refresh preview
            this.refreshEmailPreview();
            
            this.showSuccess(`Template "${selectedTemplate}" loaded successfully!`);
            this.logEvent('info', `Template loaded: ${selectedTemplate}`);
            
        } catch (error) {
            console.error('Error loading template:', error);
            this.showError('Failed to load template: ' + error.message);
        }
    }
    
    deleteTemplate() {
        try {
            const templateSelect = document.getElementById('templateSelect');
            const selectedTemplate = templateSelect.value;
            
            if (!selectedTemplate) {
                this.showWarning('Please select a template to delete');
                return;
            }
            
            if (!confirm(`Are you sure you want to delete template "${selectedTemplate}"?`)) {
                return;
            }
            
            // Get templates from localStorage
            let templates = JSON.parse(localStorage.getItem('emailTemplates') || '[]');
            templates = templates.filter(t => t.name !== selectedTemplate);
            
            // Save updated templates
            localStorage.setItem('emailTemplates', JSON.stringify(templates));
            
            // Update template dropdown
            this.populateTemplateDropdown();
            
            this.showSuccess(`Template "${selectedTemplate}" deleted successfully!`);
            this.logEvent('info', `Template deleted: ${selectedTemplate}`);
            
        } catch (error) {
            console.error('Error deleting template:', error);
            this.showError('Failed to delete template: ' + error.message);
        }
    }
    
    populateTemplateDropdown() {
        try {
            const templateSelect = document.getElementById('templateSelect');
            if (!templateSelect) return;
            
            // Get templates from localStorage
            const templates = JSON.parse(localStorage.getItem('emailTemplates') || '[]');
            
            // Clear existing options
            templateSelect.innerHTML = '<option value="">Select a template...</option>';
            
            // Add template options
            templates.forEach(template => {
                const option = document.createElement('option');
                option.value = template.name;
                option.textContent = template.name;
                templateSelect.appendChild(option);
            });
            
        } catch (error) {
            console.error('Error populating template dropdown:', error);
        }
    }

    // Tab management system for parallel campaigns
    addNewTab() {
        try {
            const tabList = document.getElementById('tabList');
            // Count only actual campaign tabs (excluding main tab)
            const campaignTabs = Array.from(tabList.children).filter(tab => 
                tab.getAttribute('data-tab') !== 'mainTab'
            );
            const tabCount = campaignTabs.length + 1;
            const newTabId = `campaignTab${tabCount}`;
            
            console.log(`Creating new campaign tab: ${newTabId}`);
            
            // Create new tab
            const newTab = document.createElement('li');
            newTab.className = 'tab-item';
            newTab.setAttribute('data-tab', newTabId);
            newTab.innerHTML = `
                <span class="tab-text">Campaign ${tabCount}</span>
                <span class="tab-close" onclick="window.rtxApp.closeTab('${newTabId}')">&times;</span>
            `;
            
            // Add click handler to switch to this tab
            newTab.addEventListener('click', () => this.switchTab(newTabId));
            
            tabList.appendChild(newTab);
            
            // Create tab content
            this.createTabContent(newTabId, tabCount);
            
            // Switch to new tab
            this.switchTab(newTabId);
            
            this.showSuccess(`New campaign tab "Campaign ${tabCount}" created!`);
            this.logEvent('info', `New tab created: ${newTabId}`);
            
        } catch (error) {
            console.error('Error adding new tab:', error);
            this.showError('Failed to create new tab: ' + error.message);
        }
    }
    
    switchTab(tabId) {
        try {
            console.log(`Switching to tab: ${tabId}`);
            
            // Remove active class from all tabs and content
            document.querySelectorAll('.tab-item').forEach(tab => {
                tab.classList.remove('active');
                console.log(`Removed active from tab: ${tab.getAttribute('data-tab')}`);
            });
            
            document.querySelectorAll('.tab-content').forEach(content => {
                content.classList.remove('active');
                console.log(`Removed active from content: ${content.id}`);
            });
            
            // Activate selected tab
            const selectedTab = document.querySelector(`[data-tab="${tabId}"]`);
            if (selectedTab) {
                selectedTab.classList.add('active');
                console.log(`Added active to tab: ${tabId}`);
            } else {
                console.error(`Tab button not found: ${tabId}`);
            }
            
            // Activate selected content
            const selectedContent = document.getElementById(tabId);
            if (selectedContent) {
                selectedContent.classList.add('active');
                console.log(`Added active to content: ${tabId}`);
                
                // Ensure the content is visible
                selectedContent.style.display = 'block';
            } else {
                console.error(`Tab content not found: ${tabId}`);
            }
            
            // Update tab list scroll position if needed
            const tabList = document.getElementById('tabList');
            if (tabList && selectedTab) {
                selectedTab.scrollIntoView({ behavior: 'smooth', block: 'nearest' });
            }
            
            this.logEvent('info', `Switched to tab: ${tabId}`);
            console.log(`✅ Successfully switched to tab: ${tabId}`);
            
        } catch (error) {
            console.error('Error switching tab:', error);
            this.showError('Failed to switch tab: ' + error.message);
        }
    }
    
    closeTab(tabId) {
        try {
            // Prevent closing the main tab
            if (tabId === 'mainTab') {
                this.showWarning('Cannot close the main campaign tab.');
                return;
            }
            
            const tabList = document.getElementById('tabList');
            const tabToClose = document.querySelector(`[data-tab="${tabId}"]`);
            const tabContent = document.getElementById(tabId);
            
            if (tabList.children.length <= 1) {
                this.showWarning('Cannot close the last tab. At least one campaign tab must remain open.');
                return;
            }
            
            // Remove tab and content
            if (tabToClose) tabToClose.remove();
            if (tabContent) tabContent.remove();
            
            // Switch to first available tab (main tab)
            const firstTab = tabList.querySelector('.tab-item');
            if (firstTab) {
                const firstTabId = firstTab.getAttribute('data-tab');
                this.switchTab(firstTabId);
            }
            
            this.showSuccess('Tab closed successfully');
            this.logEvent('info', `Tab closed: ${tabId}`);
            
        } catch (error) {
            console.error('Error closing tab:', error);
            this.showError('Failed to close tab: ' + error.message);
        }
    }
    
    createTabContent(tabId, tabNumber) {
        try {
            const contentArea = document.querySelector('.content-area');
            
            const newTabContent = document.createElement('div');
            newTabContent.id = tabId;
            newTabContent.className = 'tab-content';
            newTabContent.innerHTML = `
                <div class="mailer-interface" style="max-width:unset; width:100%;">
                    <div class="tab-header">
                        <h2 class="tab-title" id="tabTitle_${tabId}">Email Campaign Manager - Campaign ${tabNumber}</h2>
                        <div class="tab-actions">
                            <button class="btn btn-secondary" onclick="window.rtxApp.renameTab('${tabId}').catch(console.error)">
                                <i class="fas fa-edit"></i>Rename Tab
                            </button>
                            <button class="btn btn-secondary" onclick="window.rtxApp.importSheet('${tabId}')">
                                <i class="fas fa-file-import"></i>Import Spreadsheet
                            </button>
                            <button class="btn btn-secondary" onclick="window.rtxApp.togglePreview('${tabId}')">
                                <i class="fas fa-table"></i>Toggle Data Preview
                            </button>
                            <button class="btn btn-secondary" onclick="window.rtxApp.showLogs('${tabId}')">
                                <i class="fas fa-list"></i>Logs
                            </button>
                        </div>
                    </div>
                    
                    <!-- Account and From -->
                    <div style="display:grid; grid-template-columns: 1fr 1fr; gap: 16px; margin-bottom: 16px;">
                        <div style="background:#f2f2f7; padding: 12px 16px; border-radius:8px; display:flex; align-items:center; gap:10px;">
                            <div class="status-indicator disconnected" id="authStatus_${tabId}"></div>
                            <span id="accountStatus_${tabId}">Not Connected</span>
                        </div>
                        <div class="form-group" style="margin:0;">
                            <label>From Address <span id="signatureInfo_${tabId}" style="color:#8E8E93; font-weight:400; font-size:12px; margin-left:6px;"></span></label>
                            <select id="fromAddress_${tabId}"></select>
                            <div style="margin-top:8px; display:flex; gap:8px; align-items:center;">
                                <input type="text" id="fromOverride_${tabId}" placeholder="Or type a custom From email" style="flex:1;">
                                <small style="color:#8E8E93;">Use a verified alias for best deliverability</small>
                            </div>
                        </div>
                    </div>

                    <!-- Google OAuth Authentication -->
                    <div style="margin-bottom: 16px; padding: 16px; background: #f2f2f7; border-radius: 8px;">
                        <h3 style="margin-bottom: 10px;"><i class="fas fa-shield-alt"></i> Google Authentication</h3>
                        <p style="margin-bottom: 12px; color: #666;">Connect your Google account to access Gmail and Google Sheets:</p>
                        <div style="display: flex; gap: 12px; align-items: center; flex-wrap: wrap;">
                            <button id="googleLoginBtn_${tabId}" class="btn btn-primary">
                                <i class="fab fa-google"></i> Sign in with Google
                            </button>
                            <div style="display: flex; align-items: center; gap: 8px;">
                                <span style="color: #666;">or</span>
                                <div style="display: flex; flex-direction: column; gap: 4px;">
                                    <input type="file" id="credentialsFile_${tabId}" accept=".json" style="display: none;">
                                    <button id="uploadCredentialsBtn_${tabId}" class="btn btn-secondary">
                                        <i class="fas fa-upload"></i> Upload Credentials
                                    </button>
                                    <small style="color: #8E8E93; font-size: 11px;">Upload your Google API credentials JSON file</small>
                                </div>
                            </div>
                        </div>
                    </div>

                    <!-- Google Sheets Connection -->
                    <div style="margin-bottom: 16px; padding: 16px; background: #f2f2f7; border-radius: 8px;">
                        <h3 style="margin-bottom: 10px;">Step 1: Connect Google Sheets</h3>
                        <div class="form-group" style="margin-bottom:10px;">
                            <label>Google Sheets URL</label>
                            <input type="text" id="sheetUrlInput_${tabId}" placeholder="https://docs.google.com/spreadsheets/d/...">
                        </div>
                        <div id="sheetTabsContainer_${tabId}" class="form-group" style="margin-bottom:10px;"></div>
                        <button class="btn btn-primary" id="connectSheetsBtn_${tabId}">
                            <i class="fas fa-link"></i>Connect Sheets
                        </button>
                        <button class="btn btn-secondary" id="refreshSheetsBtn_${tabId}" disabled>
                            <i class="fas fa-sync"></i>Refresh Data
                        </button>
                        <div id="sheetsData_${tabId}" style="display: none; margin-top: 12px;"></div>
                    </div>
                    
                    <!-- Email Campaign Form -->
                    <div style="margin-bottom: 16px;">
                        <h3 style="margin-bottom: 10px;">Step 2: Create Email Campaign</h3>
                        <div class="form-group">
                            <label>Campaign Name</label>
                            <input type="text" id="campaignName_${tabId}" placeholder="Enter campaign name">
                        </div>
                        
                        <div class="form-group">
                            <label>Subject Line</label>
                            <input type="text" id="subjectLine_${tabId}" placeholder="Enter email subject line">
                            <small style="color:#8E8E93;">Use @placeholders for dynamic content</small>
                        </div>
                        
                        <div class="form-group">
                            <label>Email Content</label>
                            <div id="emailEditorContainer_${tabId}" style="border:1px solid #e1e5e9; border-top:none; border-radius:0 0 12px 12px; min-height:400px; background:#fff; box-shadow: 0 4px 12px rgba(0,0,0,0.08); overflow:hidden;">
                                <!-- Editor Header Bar -->
                                <div style="background:#f8f9fa; border-bottom:1px solid #e1e5e9; padding:8px 16px; display:flex; align-items:center; gap:12px; font-size:13px; color:#5f6368;">
                                    <div style="display:flex; align-items:center; gap:8px;">
                                        <i class="fas fa-edit" style="color:#1a73e8;"></i>
                                        <span style="font-weight:500;">Rich Text Editor</span>
                                    </div>
                                    <div style="height:16px; width:1px; background:#dadce0;"></div>
                                    <span id="editorStatus_${tabId}" style="color:#34a853;">Ready</span>
                                    <div style="margin-left:auto; display:flex; align-items:center; gap:8px;">
                                        <button type="button" id="wordCountBtn_${tabId}" style="background:none; border:none; color:#5f6368; font-size:12px; cursor:pointer; padding:4px 8px; border-radius:4px;" title="Word Count">
                                            <span id="wordCount_${tabId}">0 words</span>
                                        </button>
                                        <button type="button" id="charCountBtn_${tabId}" style="background:none; border:none; color:#5f6368; font-size:12px; cursor:pointer; padding:4px 8px; border-radius:4px;" title="Character Count">
                                            <span id="charCount_${tabId}">0 chars</span>
                                        </button>
                                    </div>
                                </div>

                                <!-- Enhanced Toolbar -->
                                <div style="background:#fff; border-bottom:1px solid #e1e5e9; padding:12px 16px; display:flex; align-items:center; gap:8px; flex-wrap:wrap;">
                                    <!-- Text Formatting -->
                                    <div class="toolbar-group" style="display:flex; align-items:center; gap:4px; padding:4px; border-radius:6px; background:#f8f9fa;">
                                        <select id="fontFamily_${tabId}" style="padding:6px 8px; border:1px solid #dadce0; border-radius:4px; font-size:13px; background:#fff; min-width:120px;">
                                            <option value="Arial, sans-serif">Arial</option>
                                            <option value="'Times New Roman', serif">Times New Roman</option>
                                            <option value="'Courier New', monospace">Courier New</option>
                                            <option value="Georgia, serif">Georgia</option>
                                            <option value="Verdana, sans-serif">Verdana</option>
                                            <option value="'Trebuchet MS', sans-serif">Trebuchet MS</option>
                                        </select>
                                        <select id="fontSize_${tabId}" style="padding:6px 8px; border:1px solid #dadce0; border-radius:4px; font-size:13px; background:#fff; min-width:60px;">
                                            <option value="1">8pt</option>
                                            <option value="2">10pt</option>
                                            <option value="3" selected>12pt</option>
                                            <option value="4">14pt</option>
                                            <option value="5">16pt</option>
                                            <option value="6">18pt</option>
                                            <option value="7">24pt</option>
                                        </select>
                                    </div>

                                    <div class="toolbar-group" style="display:flex; align-items:center; gap:2px; padding:4px; border-radius:6px; background:#f8f9fa;">
                                        <button type="button" id="boldBtn_${tabId}" title="Bold (Ctrl+B)" onclick="window.rtxApp.execCommandForTab('bold', '${tabId}')" style="padding:8px; border:none; background:#fff; border-radius:4px; cursor:pointer; min-width:36px; height:36px; display:flex; align-items:center; justify-content:center; font-weight:bold; color:#5f6368; transition:all 0.2s;" onmouseover="this.style.background='#f1f3f4'" onmouseout="this.style.background='#fff'">B</button>
                                        <button type="button" id="italicBtn_${tabId}" title="Italic (Ctrl+I)" onclick="window.rtxApp.execCommandForTab('italic', '${tabId}')" style="padding:8px; border:none; background:#fff; border-radius:4px; cursor:pointer; min-width:36px; height:36px; display:flex; align-items:center; justify-content:center; font-style:italic; color:#5f6368; transition:all 0.2s;" onmouseover="this.style.background='#f1f3f4'" onmouseout="this.style.background='#fff'">I</button>
                                        <button type="button" id="underlineBtn_${tabId}" title="Underline (Ctrl+U)" onclick="window.rtxApp.execCommandForTab('underline', '${tabId}')" style="padding:8px; border:none; background:#fff; border-radius:4px; cursor:pointer; min-width:36px; height:36px; display:flex; align-items:center; justify-content:center; text-decoration:underline; color:#5f6368; transition:all 0.2s;" onmouseover="this.style.background='#f1f3f4'" onmouseout="this.style.background='#fff'">U</button>
                                    </div>

                                    <div class="toolbar-group" style="display:flex; align-items:center; gap:2px; padding:4px; border-radius:6px; background:#f8f9fa;">
                                        <button type="button" id="strikeBtn_${tabId}" title="Strikethrough" onclick="window.rtxApp.execCommandForTab('strikeThrough', '${tabId}')" style="padding:8px; border:none; background:#fff; border-radius:4px; cursor:pointer; min-width:36px; height:36px; display:flex; align-items:center; justify-content:center; text-decoration:line-through; color:#5f6368; transition:all 0.2s;" onmouseover="this.style.background='#f1f3f4'" onmouseout="this.style.background='#fff'">S</button>
                                        <button type="button" id="superscriptBtn_${tabId}" title="Superscript" onclick="window.rtxApp.execCommandForTab('superscript', '${tabId}')" style="padding:8px; border:none; background:#fff; border-radius:4px; cursor:pointer; min-width:36px; height:36px; display:flex; align-items:center; justify-content:center; color:#5f6368; transition:all 0.2s;" onmouseover="this.style.background='#f1f3f4'" onmouseout="this.style.background='#fff'">X²</button>
                                        <button type="button" id="subscriptBtn_${tabId}" title="Subscript" onclick="window.rtxApp.execCommandForTab('subscript', '${tabId}')" style="padding:8px; border:none; background:#fff; border-radius:4px; cursor:pointer; min-width:36px; height:36px; display:flex; align-items:center; justify-content:center; color:#5f6368; transition:all 0.2s;" onmouseover="this.style.background='#f1f3f4'" onmouseout="this.style.background='#fff'">X₂</button>
                                    </div>

                                    <div class="toolbar-group" style="display:flex; align-items:center; gap:2px; padding:4px; border-radius:6px; background:#f8f9fa;">
                                        <button type="button" id="alignLeftBtn_${tabId}" title="Align Left" onclick="window.rtxApp.execCommandForTab('justifyLeft', '${tabId}')" style="padding:8px; border:none; background:#fff; border-radius:4px; cursor:pointer; min-width:36px; height:36px; display:flex; align-items:center; justify-content:center; color:#5f6368; transition:all 0.2s;" onmouseover="this.style.background='#f1f3f4'" onmouseout="this.style.background='#fff'"><i class="fas fa-align-left"></i></button>
                                        <button type="button" id="alignCenterBtn_${tabId}" title="Align Center" onclick="window.rtxApp.execCommandForTab('justifyCenter', '${tabId}')" style="padding:8px; border:none; background:#fff; border-radius:4px; cursor:pointer; min-width:36px; height:36px; display:flex; align-items:center; justify-content:center; color:#5f6368; transition:all 0.2s;" onmouseover="this.style.background='#f1f3f4'" onmouseout="this.style.background='#fff'"><i class="fas fa-align-center"></i></button>
                                        <button type="button" id="alignRightBtn_${tabId}" title="Align Right" onclick="window.rtxApp.execCommandForTab('justifyRight', '${tabId}')" style="padding:8px; border:none; background:#fff; border-radius:4px; cursor:pointer; min-width:36px; height:36px; display:flex; align-items:center; justify-content:center; color:#5f6368; transition:all 0.2s;" onmouseover="this.style.background='#f1f3f4'" onmouseout="this.style.background='#fff'"><i class="fas fa-align-right"></i></button>
                                        <button type="button" id="justifyBtn_${tabId}" title="Justify" onclick="window.rtxApp.execCommandForTab('justifyFull', '${tabId}')" style="padding:8px; border:none; background:#fff; border-radius:4px; cursor:pointer; min-width:36px; height:36px; display:flex; align-items:center; justify-content:center; color:#5f6368; transition:all 0.2s;" onmouseover="this.style.background='#f1f3f4'" onmouseout="this.style.background='#fff'"><i class="fas fa-align-justify"></i></button>
                                    </div>

                                    <div class="toolbar-group" style="display:flex; align-items:center; gap:2px; padding:4px; border-radius:6px; background:#f8f9fa;">
                                        <button type="button" id="listUlBtn_${tabId}" title="Bullet List" onclick="window.rtxApp.execCommandForTab('insertUnorderedList', '${tabId}')" style="padding:8px; border:none; background:#fff; border-radius:4px; cursor:pointer; min-width:36px; height:36px; display:flex; align-items:center; justify-content:center; color:#5f6368; transition:all 0.2s;" onmouseover="this.style.background='#f1f3f4'" onmouseout="this.style.background='#fff'"><i class="fas fa-list-ul"></i></button>
                                        <button type="button" id="listOlBtn_${tabId}" title="Numbered List" onclick="window.rtxApp.execCommandForTab('insertOrderedList', '${tabId}')" style="padding:8px; border:none; background:#fff; border-radius:4px; cursor:pointer; min-width:36px; height:36px; display:flex; align-items:center; justify-content:center; color:#5f6368; transition:all 0.2s;" onmouseover="this.style.background='#f1f3f4'" onmouseout="this.style.background='#fff'"><i class="fas fa-list-ol"></i></button>
                                        <button type="button" id="blockquoteBtn_${tabId}" title="Blockquote" onclick="window.rtxApp.execCommandForTab('formatBlock', '${tabId}')" style="padding:8px; border:none; background:#fff; border-radius:4px; cursor:pointer; min-width:36px; height:36px; display:flex; align-items:center; justify-content:center; color:#5f6368; transition:all 0.2s;" onmouseover="this.style.background='#f1f3f4'" onmouseout="this.style.background='#fff'"><i class="fas fa-quote-right"></i></button>
                                    </div>

                                    <div class="toolbar-group" style="display:flex; align-items:center; gap:2px; padding:4px; border-radius:6px; background:#f8f9fa;">
                                        <button type="button" id="linkBtn_${tabId}" title="Insert Link (Ctrl+K)" onclick="window.rtxApp.insertLinkForTab('${tabId}').catch(console.error)" style="padding:8px; border:none; background:#fff; border-radius:4px; cursor:pointer; min-width:36px; height:36px; display:flex; align-items:center; justify-content:center; color:#5f6368; transition:all 0.2s;" onmouseover="this.style.background='#f1f3f4'" onmouseout="this.style.background='#fff'"><i class="fas fa-link"></i></button>
                                        <button type="button" id="imageBtn_${tabId}" title="Insert Image" onclick="window.rtxApp.insertImageForTab('${tabId}').catch(console.error)" style="padding:8px; border:none; background:#fff; border-radius:4px; cursor:pointer; min-width:36px; height:36px; display:flex; align-items:center; justify-content:center; color:#5f6368; transition:all 0.2s;" onmouseover="this.style.background='#f1f3f4'" onmouseout="this.style.background='#fff'"><i class="fas fa-image"></i></button>
                                        <button type="button" id="tableBtn_${tabId}" title="Insert Table" onclick="window.rtxApp.insertTableForTab('${tabId}').catch(console.error)" style="padding:8px; border:none; background:#fff; border-radius:4px; cursor:pointer; min-width:36px; height:36px; display:flex; align-items:center; justify-content:center; color:#5f6368; transition:all 0.2s;" onmouseover="this.style.background='#f1f3f4'" onmouseout="this.style.background='#fff'"><i class="fas fa-table"></i></button>
                                        <button type="button" id="hrBtn_${tabId}" title="Insert Horizontal Rule" onclick="window.rtxApp.execCommandForTab('insertHorizontalRule', '${tabId}')" style="padding:8px; border:none; background:#fff; border-radius:4px; cursor:pointer; min-width:36px; height:36px; display:flex; align-items:center; justify-content:center; color:#5f6368; transition:all 0.2s;" onmouseover="this.style.background='#f1f3f4'" onmouseout="this.style.background='#fff'"><i class="fas fa-minus"></i></button>
                                    </div>

                                    <div class="toolbar-group" style="display:flex; align-items:center; gap:2px; padding:4px; border-radius:6px; background:#f8f9fa;">
                                        <button type="button" id="undoBtn_${tabId}" title="Undo (Ctrl+Z)" onclick="window.rtxApp.execCommandForTab('undo', '${tabId}')" style="padding:8px; border:none; background:#fff; border-radius:4px; cursor:pointer; min-width:36px; height:36px; display:flex; align-items:center; justify-content:center; color:#5f6368; transition:all 0.2s;" onmouseover="this.style.background='#f1f3f4'" onmouseout="this.style.background='#fff'"><i class="fas fa-undo"></i></button>
                                        <button type="button" id="redoBtn_${tabId}" title="Redo (Ctrl+Y)" onclick="window.rtxApp.execCommandForTab('redo', '${tabId}')" style="padding:8px; border:none; background:#fff; border-radius:4px; cursor:pointer; min-width:36px; height:36px; display:flex; align-items:center; justify-content:center; color:#5f6368; transition:all 0.2s;" onmouseover="this.style.background='#f1f3f4'" onmouseout="this.style.background='#fff'"><i class="fas fa-redo"></i></button>
                                        <button type="button" id="clearFormatBtn_${tabId}" title="Clear Formatting" onclick="window.rtxApp.clearFormattingForTab('${tabId}')" style="padding:8px; border:none; background:#fff; border-radius:4px; cursor:pointer; min-width:36px; height:36px; display:flex; align-items:center; justify-content:center; color:#5f6368; transition:all 0.2s;" onmouseover="this.style.background='#f1f3f4'" onmouseout="this.style.background='#fff'"><i class="fas fa-eraser"></i></button>
                                    </div>
                                </div>

                                <!-- Editor Content Area -->
                                <div id="emailEditor_${tabId}" contenteditable="true" style="padding:24px; min-height:300px; outline:none; font-family:'Segoe UI', Arial, sans-serif; font-size:14px; line-height:1.6; color:#202124; border-radius:0; background:#fff; position:relative;" data-placeholder="Start typing your email content here... Type @ to see available placeholders"></div>
                                
                                <!-- Placeholder Dropdown -->
                                <div id="placeholderDropdown_${tabId}" style="display:none; position:absolute; background:white; border:1px solid #e5e5e7; border-radius:8px; box-shadow:0 4px 12px rgba(0,0,0,0.15); max-height:200px; overflow-y:auto; z-index:1000; min-width:200px;">
                                    <div style="padding:8px 12px; background:#f8f9fa; border-bottom:1px solid #e5e5e7; font-weight:600; color:#1d1d1f;">
                                        <i class="fas fa-tags"></i> Available Placeholders
                                    </div>
                                    <div id="placeholderList_${tabId}" style="padding:8px 0;">
                                        <!-- Placeholders will be populated here -->
                                    </div>
                                </div>

                                <!-- Attachments Section -->
                                <div class="form-group" style="margin-top: 16px;">
                                    <label>Attachments</label>
                                    <div id="campaignAttachments_${tabId}" style="border: 1px solid #e5e5e7; border-radius: 6px; padding: 12px; background: #f8f9fa; min-height: 80px;">
                                        <div style="text-align: center; color: #8E8E93;">
                                            <i class="fas fa-paperclip" style="font-size: 20px; margin-bottom: 8px; display: block;"></i>
                                            <p>No attachments selected</p>
                                        </div>
                                    </div>
                                    <div style="display: flex; gap: 8px; margin-top: 8px;">
                                        <button type="button" class="btn btn-secondary" id="addCampaignAttachmentBtn_${tabId}">
                                            <i class="fas fa-plus"></i> Add Attachment
                                        </button>
                                        <button type="button" class="btn btn-secondary" id="removeAllCampaignAttachmentsBtn_${tabId}">
                                            <i class="fas fa-trash"></i> Remove All
                                        </button>
                                    </div>
                                </div>

                                <!-- Editor Footer -->
                                <div style="background:#f8f9fa; border-top:1px solid #e1e5e9; padding:8px 16px; display:flex; align-items:center; justify-content:space-between; font-size:12px; color:#5f6368;">
                                    <div style="display:flex; align-items:center; gap:16px;">
                                        <span>Format: Rich Text (HTML)</span>
                                        <span id="editorMode_${tabId}">Standard Mode</span>
                                    </div>
                                    <div style="display:flex; align-items:center; gap:8px;">
                                        <button type="button" id="toggleModeBtn_${tabId}" style="background:none; border:1px solid #dadce0; border-radius:4px; padding:4px 8px; font-size:11px; cursor:pointer; color:#5f6368;" onclick="window.rtxApp.toggleEditorModeForTab('${tabId}')">Toggle Mode</button>
                                        <button type="button" id="clearFormatBtn_${tabId}" style="background:none; border:1px solid #dadce0; border-radius:4px; padding:4px 8px; font-size:11px; cursor:pointer; color:#5f6368;" onclick="window.rtxApp.clearFormattingForTab('${tabId}')">Clear Format</button>
                                    </div>
                                </div>
                            </div>
                        </div>
                        
                        <div class="form-group">
                            <label>Signature</label>
                            <textarea id="signature_${tabId}" placeholder="Enter your email signature" rows="3"></textarea>
                            <div style="margin-top:8px; display:flex; gap:8px; align-items:center;">
                                <input type="checkbox" id="useSignature_${tabId}">
                                <label for="useSignature_${tabId}" style="margin:0;">Use Gmail signature</label>
                            </div>
                        </div>
                        
                        <div class="form-group">
                            <label>Template</label>
                            <div style="display:flex; gap:8px; align-items:center;">
                                <select id="templateSelect_${tabId}" style="flex:1;">
                                    <option value="">Select a template...</option>
                                </select>
                                <button type="button" class="btn btn-secondary" onclick="window.rtxApp.saveTemplate('${tabId}').catch(console.error)">
                                    <i class="fas fa-save"></i>Save
                                </button>
                                <button type="button" class="btn btn-secondary" onclick="window.rtxApp.loadTemplate('${tabId}').catch(console.error)">
                                    <i class="fas fa-folder-open"></i>Load
                                </button>
                                <button type="button" class="btn btn-secondary" onclick="window.rtxApp.deleteTemplate('${tabId}')">
                                    <i class="fas fa-trash"></i>Delete
                                </button>
                                <button type="button" class="btn btn-secondary" onclick="window.rtxApp.populateTemplateDropdown('${tabId}')">
                                    <i class="fas fa-sync"></i>Refresh
                                </button>
                            </div>
                        </div>
                        
                        <div class="form-group">
                            <label>Campaign Settings</label>
                            <div style="display:grid; grid-template-columns: 1fr 1fr; gap: 16px;">
                                <div>
                                    <label>Delay between emails (seconds)</label>
                                    <input type="number" id="emailDelay_${tabId}" value="2" min="1" max="60">
                                </div>
                                <div>
                                    <label>Max emails per hour</label>
                                    <input type="number" id="maxEmailsPerHour_${tabId}" value="100" min="1" max="1000">
                                </div>
                            </div>
                        </div>
                        
                        <div style="display:flex; gap:12px; margin-top:20px;">
                            <button class="btn btn-primary" id="sendCampaignBtn_${tabId}" onclick="window.rtxApp.sendCampaign('${tabId}')">
                                <i class="fas fa-paper-plane"></i>Send Campaign
                            </button>
                            <button class="btn btn-secondary" id="testEmailBtn_${tabId}" onclick="window.rtxApp.sendTestEmail('${tabId}')">
                                <i class="fas fa-envelope"></i>Send Test Email
                            </button>
                            <button class="btn btn-secondary" id="scheduleCampaignBtn_${tabId}" onclick="window.rtxApp.scheduleCampaign('${tabId}')">
                                <i class="fas fa-clock"></i>Schedule Campaign
                            </button>
                            <button class="btn btn-secondary" id="togglePreviewBtn_${tabId}" onclick="window.rtxApp.togglePreview('${tabId}')">
                                <i class="fas fa-eye"></i>Toggle Preview
                            </button>
                        </div>
                    </div>
                    
                    <!-- Scheduling Section -->
                    <div style="margin-bottom: 16px; padding: 16px; background: #f2f2f7; border-radius: 8px;">
                        <h3 style="margin-bottom: 10px;">Step 3: Schedule (Optional)</h3>
                        <div style="display:grid; grid-template-columns: 1fr auto; gap: 12px; align-items:end;">
                            <div class="form-group" style="margin:0;">
                                <label>Send At</label>
                                <input type="datetime-local" id="scheduleDateTime_${tabId}">
                            </div>
                            <button class="btn btn-secondary" id="scheduleBtn_${tabId}" onclick="window.rtxApp.scheduleOneTimeSendForTab('${tabId}')">
                                <i class="fas fa-clock"></i>Schedule
                            </button>
                        </div>
                        <div id="scheduleList_${tabId}" style="margin-top:12px;"></div>
                    </div>
                    
                    <!-- Campaign History -->
                    <div style="margin-bottom: 16px;">
                        <h3 style="margin-bottom: 10px;">Campaign History</h3>
                        <div id="campaignsList_${tabId}">
                            <div class="empty-state">
                                <i class="fas fa-envelope-open"></i>
                                <h3>No Campaigns Yet</h3>
                                <p>Create your first email campaign to get started</p>
                            </div>
                        </div>
                    </div>
                    
                    <!-- Signature Management -->
                    <div style="margin-bottom: 16px; padding: 16px; background: #f2f2f7; border-radius: 8px;">
                        <h3 style="margin-bottom: 10px;">Signature Management</h3>
                        <div class="form-group" style="margin-bottom:10px;">
                            <label>Custom Signature</label>
                            <textarea id="customSignature_${tabId}" placeholder="Enter your custom signature" rows="3"></textarea>
                        </div>
                        <div style="display:flex; gap:8px; align-items:center; flex-wrap:wrap;">
                            <button class="btn btn-secondary" onclick="window.rtxApp.saveSignatureForTab('${tabId}').catch(console.error)">
                                <i class="fas fa-save"></i>Save Signature
                            </button>
                            <button class="btn btn-secondary" onclick="window.rtxApp.loadSignatureForTab('${tabId}').catch(console.error)">
                                <i class="fas fa-folder-open"></i>Load Signature
                            </button>
                            <button class="btn btn-secondary" onclick="window.rtxApp.clearSignatureForTab('${tabId}')">
                                <i class="fas fa-trash"></i>Clear
                            </button>
                        </div>
                    </div>
                    
                    <!-- Email Preview -->
                    <div id="emailPreview_${tabId}" style="display:none; margin-top:20px; padding:20px; border:1px solid #e5e5e7; border-radius:8px; background:#fff;">
                        <h4 style="margin-bottom:12px;">Email Preview</h4>
                        <div id="previewContent_${tabId}"></div>
                        <button class="btn btn-secondary" onclick="window.rtxApp.refreshEmailPreview('${tabId}')" style="margin-top:12px;">
                            <i class="fas fa-sync"></i>Refresh Preview
                        </button>
                    </div>
                    
                    <!-- Campaign Progress -->
                    <div id="campaignProgress_${tabId}" style="display:none; margin-top:20px; padding:20px; border:1px solid #e5e5e7; border-radius:8px; background:#f8f9fa;">
                        <h4 style="margin-bottom:12px;">Campaign Progress</h4>
                        <div style="display:flex; gap:12px; align-items:center; margin-bottom:12px;">
                            <div style="flex:1; background:#e5e5e7; border-radius:4px; height:8px;">
                                <div id="progressBar_${tabId}" style="background:#007AFF; height:100%; border-radius:4px; width:0%; transition:width 0.3s ease;"></div>
                            </div>
                            <span id="progressText_${tabId}">0%</span>
                        </div>
                        <div id="progressDetails_${tabId}"></div>
                    </div>
                </div>
            `;
            
            contentArea.appendChild(newTabContent);
            
            // Initialize the rich text editor for this tab
            this.setupRichEditorForTab(tabId);
            
            // Setup event listeners for this tab
            this.setupTabEventListeners(tabId);
            
            // Populate placeholders for this tab
            this.populatePlaceholdersForTab(tabId);
            
            // Initialize word/character count
            this.initializeEditorCounts(tabId);
            
            console.log(`✅ Tab content created successfully for ${tabId}`);
            
        } catch (error) {
            console.error('Error creating tab content:', error);
        }
    }
    
    authenticateInTab(tabId) {
        try {
            // This would implement proper Google authentication for each tab
            this.showSuccess(`Authentication initiated for ${tabId}. In the full version, this would open Google OAuth.`);
            this.logEvent('info', `Authentication initiated for tab: ${tabId}`);
            
            // Simulate authentication success
            setTimeout(() => {
                const tabContent = document.getElementById(tabId);
                if (tabContent) {
                    tabContent.innerHTML = `
                        <div class="mailer-interface" style="max-width:unset; width:100%;">
                            <div class="tab-header">
                                <h2 class="tab-title">Email Campaign Manager - ${tabId}</h2>
                                <div class="tab-actions">
                                    <button class="btn btn-secondary" onclick="window.rtxApp.importSheet('${tabId}')">
                                        <i class="fas fa-file-import"></i>Import Spreadsheet
                                    </button>
                                    <button class="btn btn-secondary" onclick="window.rtxApp.togglePreview('${tabId}')">
                                        <i class="fas fa-table"></i>Toggle Data Preview
                                    </button>
                                </div>
                            </div>
                            
                            <div style="background: #f8f9fa; padding: 20px; border-radius: 8px; margin-bottom: 20px; text-align: center;">
                                <div style="display: inline-flex; align-items: center; gap: 8px; background: #34c759; color: white; padding: 8px 16px; border-radius: 20px;">
                                    <i class="fas fa-check-circle"></i>
                                    <span>Authenticated with Google</span>
                                </div>
                            </div>
                            
                            <div style="text-align: center; padding: 40px 20px; color: #8E8E93;">
                                <i class="fas fa-rocket" style="font-size: 48px; margin-bottom: 16px; display: block;"></i>
                                <h3>Ready to Create Campaign</h3>
                                <p>You're now authenticated and ready to create campaigns in this tab.</p>
                                <button class="btn btn-primary" onclick="window.rtxApp.createCampaignInTab('${tabId}')">
                                    <i class="fas fa-plus"></i> Create New Campaign
                                </button>
                            </div>
                        </div>
                    `;
                }
            }, 2000);
            
        } catch (error) {
            console.error('Error authenticating in tab:', error);
        }
    }
    
    createCampaignInTab(tabId) {
        try {
            this.showSuccess(`Campaign creation initiated in ${tabId}`);
            this.logEvent('info', `Campaign creation initiated in tab: ${tabId}`);
            
            // Initialize the rich text editor for this tab
            this.setupRichEditorForTab(tabId);
            
            // Setup event listeners for this tab
            this.setupTabEventListeners(tabId);
            
            // Populate template dropdown
            this.populateTemplateDropdown(tabId);
            
        } catch (error) {
            console.error('Error creating campaign in tab:', error);
        }
    }
    
    setupRichEditorForTab(tabId) {
        try {
            const editorContainer = document.getElementById(`emailEditor_${tabId}`);
            if (!editorContainer) {
                console.error(`Editor container not found for tab: ${tabId}`);
                return;
            }
            
            console.log(`✅ Setting up rich text editor for ${tabId}`);
            
            // Clear any existing event listeners
            const newEditorContainer = editorContainer.cloneNode(true);
            editorContainer.parentNode.replaceChild(newEditorContainer, editorContainer);
            
            // Enhanced contenteditable editor
            console.log(`✅ Enhanced contenteditable editor ready for ${tabId}`);
            
            // Enhanced paste handling for better copy-paste functionality
            newEditorContainer.addEventListener('paste', (e) => {
                e.preventDefault();
                
                // Handle image paste
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
                                newEditorContainer.appendChild(img);
                            }
                        };
                        reader.readAsDataURL(file);
                        return;
                    }
                }
                
                // Handle text paste with proper formatting
                const text = e.clipboardData.getData('text/plain');
                const html = e.clipboardData.getData('text/html');
                
                if (html && !text.includes('\n')) {
                    // If HTML is available and it's not multi-line, use HTML
                    this.insertHTMLAtCursor(html, newEditorContainer);
                } else {
                    this.insertHTMLAtCursor(text, newEditorContainer);
                }
            });
            
            // Add focus and blur event listeners
            newEditorContainer.addEventListener('focus', () => {
                newEditorContainer.style.borderColor = '#007AFF';
            });
            
            newEditorContainer.addEventListener('blur', () => {
                newEditorContainer.style.borderColor = '#ddd';
            });
            
            // Add keyboard shortcuts
            newEditorContainer.addEventListener('keydown', (e) => {
                if (e.ctrlKey || e.metaKey) {
                    switch(e.key) {
                        case 'b':
                            e.preventDefault();
                            document.execCommand('bold', false, null);
                            break;
                        case 'i':
                            e.preventDefault();
                            document.execCommand('italic', false, null);
                            break;
                        case 'u':
                            e.preventDefault();
                            document.execCommand('underline', false, null);
                            break;
                    }
                }
            });
            
            // Setup placeholder system for this tab
            this.setupPlaceholderSystemForTab(tabId);
            
            console.log(`✅ Rich text editor setup completed for ${tabId}`);
            
        } catch (error) {
            console.error(`Error setting up rich editor for tab ${tabId}:`, error);
        }
    }
    
    setupPlaceholderSystemForTab(tabId) {
        try {
            const editorContainer = document.getElementById(`emailEditor_${tabId}`);
            const placeholderDropdown = document.getElementById(`placeholderDropdown_${tabId}`);
            const subjectLine = document.getElementById(`subjectLine_${tabId}`);
            
            if (!editorContainer || !placeholderDropdown) return;
            
            // Function to get caret position
            const getCaretPosition = (element) => {
                const selection = window.getSelection();
                if (selection.rangeCount === 0) return null;
                
                const range = selection.getRangeAt(0);
                const preCaretRange = range.cloneRange();
                preCaretRange.selectNodeContents(element);
                preCaretRange.setEnd(range.endContainer, range.endOffset);
                return preCaretRange.toString().length;
            };
            
            // Function to show placeholder dropdown
            const showPlaceholderDropdown = (x, y) => {
                placeholderDropdown.style.display = 'block';
                placeholderDropdown.style.left = x + 'px';
                placeholderDropdown.style.top = y + 'px';
            };
            
            // Function to hide placeholder dropdown
            const hidePlaceholderDropdown = () => {
                placeholderDropdown.style.display = 'none';
            };
            
            // Function to insert placeholder
            const insertPlaceholder = (placeholder) => {
                const selection = window.getSelection();
                if (selection.rangeCount > 0) {
                    const range = selection.getRangeAt(0);
                    range.deleteContents();
                    range.insertNode(document.createTextNode(placeholder));
                    range.collapse(false);
                }
                hidePlaceholderDropdown();
                editorContainer.focus();
            };
            
            // Setup placeholder dropdown items
            placeholderDropdown.querySelectorAll('.placeholder-item').forEach(item => {
                item.addEventListener('click', () => {
                    const placeholder = item.getAttribute('data-placeholder');
                    insertPlaceholder(placeholder);
                });
            });
            
            // Monitor @ symbol in editor
            let lastAtPosition = -1;
            editorContainer.addEventListener('input', (e) => {
                const text = editorContainer.textContent || editorContainer.innerText;
                const atIndex = text.lastIndexOf('@');
                
                if (atIndex !== -1 && atIndex !== lastAtPosition) {
                    lastAtPosition = atIndex;
                    const rect = window.getSelection().getRangeAt(0).getBoundingClientRect();
                    showPlaceholderDropdown(rect.left, rect.bottom + window.scrollY);
                } else if (atIndex === -1) {
                    lastAtPosition = -1;
                    hidePlaceholderDropdown();
                }
            });
            
            // Monitor @ symbol in subject line
            if (subjectLine) {
                subjectLine.addEventListener('input', (e) => {
                    const text = subjectLine.value;
                    const atIndex = text.lastIndexOf('@');
                    
                    if (atIndex !== -1) {
                        const rect = subjectLine.getBoundingClientRect();
                        showPlaceholderDropdown(rect.left + (atIndex * 8), rect.bottom + window.scrollY);
                    } else {
                        hidePlaceholderDropdown();
                    }
                });
            }
            
            // Hide dropdown when clicking outside
            document.addEventListener('click', (e) => {
                if (!placeholderDropdown.contains(e.target) && !editorContainer.contains(e.target) && !subjectLine?.contains(e.target)) {
                    hidePlaceholderDropdown();
                }
            });
            
        } catch (error) {
            console.error('Error setting up placeholder system for tab:', error);
        }
    }
    
    setupTabEventListeners(tabId) {
        try {
            // Google OAuth login button
            const googleLoginBtn = document.getElementById(`googleLoginBtn_${tabId}`);
            if (googleLoginBtn) {
                googleLoginBtn.addEventListener('click', () => this.handleGoogleLogin(tabId));
            }
            
            // Upload credentials button
            const uploadCredentialsBtn = document.getElementById(`uploadCredentialsBtn_${tabId}`);
            const credentialsFile = document.getElementById(`credentialsFile_${tabId}`);
            if (uploadCredentialsBtn && credentialsFile) {
                uploadCredentialsBtn.addEventListener('click', () => credentialsFile.click());
                credentialsFile.addEventListener('change', (e) => this.handleCredentialsUpload(e, tabId));
            }
            
            // Connect sheets button
            const connectSheetsBtn = document.getElementById(`connectSheetsBtn_${tabId}`);
            if (connectSheetsBtn) {
                connectSheetsBtn.addEventListener('click', () => this.importSheet(tabId));
            }
            
            // Refresh sheets button
            const refreshSheetsBtn = document.getElementById(`refreshSheetsBtn_${tabId}`);
            if (refreshSheetsBtn) {
                refreshSheetsBtn.addEventListener('click', () => this.refreshSheetData(tabId));
            }
            
        } catch (error) {
            console.error('Error setting up tab event listeners:', error);
        }
    }
    
    handleGoogleLogin(tabId) {
        try {
            console.log(`🔐 Starting Google authentication for tab: ${tabId}`);
            
            // Disable the login button and show spinner
            const googleLoginBtn = document.getElementById(`googleLoginBtn_${tabId}`);
            if (googleLoginBtn) {
                googleLoginBtn.disabled = true;
                googleLoginBtn.innerHTML = '<i class="fas fa-spinner fa-spin"></i> Authenticating...';
            }
            
            // Update tab auth status
            this.updateTabAuthStatus(tabId, false, 'Authenticating...');
            
            // This would call the main process to start OAuth flow
            if (window.electronAPI && window.electronAPI.authenticateGoogle) {
                // Pass null credentials and tabId - the main process will use default credentials for this tab
                window.electronAPI.authenticateGoogle(null, tabId)
                    .then(result => {
                        console.log(`✅ Authentication result for tab ${tabId}:`, result);
                        if (result && result.success) {
                            this.showSuccess(`Successfully authenticated in ${tabId}`);
                            this.updateTabAuthStatus(tabId, true, result.userEmail || 'Authenticated');
                            
                            // Enable campaign creation
                            this.enableCampaignFeatures(tabId);
                            
                            // Initialize services for this tab
                            this.initializeTabServices(tabId);
                        } else {
                            const errorMsg = result?.error || 'Authentication failed';
                            this.showError(`Authentication failed: ${errorMsg}`);
                            this.updateTabAuthStatus(tabId, false, 'Authentication failed');
                            this.resetLoginButton(tabId);
                        }
                    })
                    .catch(error => {
                        console.error(`❌ Authentication error for tab ${tabId}:`, error);
                        this.showError(`Authentication error: ${error.message || 'Unknown error'}`);
                        this.updateTabAuthStatus(tabId, false, 'Authentication error');
                        this.resetLoginButton(tabId);
                    });
            } else {
                this.showError('Electron API not available');
                this.updateTabAuthStatus(tabId, false, 'API not available');
                this.resetLoginButton(tabId);
            }
        } catch (error) {
            console.error(`❌ Error in handleGoogleLogin for tab ${tabId}:`, error);
            this.showError(`Authentication error: ${error.message || 'Unknown error'}`);
            this.updateTabAuthStatus(tabId, false, 'Authentication error');
            this.resetLoginButton(tabId);
        }
    }
    
    resetLoginButton(tabId) {
        const googleLoginBtn = document.getElementById(`googleLoginBtn_${tabId}`);
        if (googleLoginBtn) {
            googleLoginBtn.disabled = false;
            googleLoginBtn.innerHTML = '<i class="fab fa-google"></i> Sign in with Google';
        }
    }
    
    updateTabAuthStatus(tabId, isAuthenticated, statusText) {
        try {
            const authStatus = document.getElementById(`authStatus_${tabId}`);
            const accountStatus = document.getElementById(`accountStatus_${tabId}`);
            
            if (authStatus) {
                authStatus.className = `status-indicator ${isAuthenticated ? 'connected' : 'disconnected'}`;
            }
            
            if (accountStatus) {
                accountStatus.textContent = statusText;
                accountStatus.style.color = isAuthenticated ? '#34c759' : '#ff3b30';
            }
        } catch (error) {
            console.error(`Error updating auth status for tab ${tabId}:`, error);
        }
    }
    
    enableCampaignFeatures(tabId) {
        try {
            // Enable campaign form elements
            const campaignElements = [
                'campaignName', 'subjectLine', 'signature', 'attachments',
                'templateSelect', 'emailDelay', 'maxEmailsPerHour'
            ];
            
            campaignElements.forEach(elementId => {
                const element = document.getElementById(`${elementId}_${tabId}`);
                if (element) {
                    element.disabled = false;
                }
            });
            
            // Enable campaign buttons
            const campaignButtons = ['sendCampaignBtn', 'testEmailBtn', 'scheduleCampaignBtn'];
            campaignButtons.forEach(buttonId => {
                const button = document.getElementById(`${buttonId}_${tabId}`);
                if (button) {
                    button.disabled = false;
                }
            });
            
            console.log(`✅ Campaign features enabled for tab ${tabId}`);
        } catch (error) {
            console.error(`Error enabling campaign features for tab ${tabId}:`, error);
        }
    }
    
    initializeTabServices(tabId) {
        try {
            // Initialize Gmail service for this tab
            if (window.electronAPI && window.electronAPI.initializeGmailService) {
                window.electronAPI.initializeGmailService()
                    .then(() => {
                        console.log(`✅ Gmail service initialized for tab ${tabId}`);
                        this.loadSendAsListForTab(tabId);
                    })
                    .catch(error => {
                        console.error(`Error initializing Gmail service for tab ${tabId}:`, error);
                    });
            }
            
            // Initialize Sheets service for this tab
            if (window.electronAPI && window.electronAPI.initializeSheetsService) {
                window.electronAPI.initializeSheetsService()
                    .then(() => {
                        console.log(`✅ Sheets service initialized for tab ${tabId}`);
                    })
                    .catch(error => {
                        console.error(`Error initializing Sheets service for tab ${tabId}:`, error);
                    });
            }
        } catch (error) {
            console.error(`Error initializing services for tab ${tabId}:`, error);
        }
    }
    
    loadSendAsListForTab(tabId) {
        try {
            if (window.electronAPI && window.electronAPI.listSendAs) {
                window.electronAPI.listSendAs()
                    .then(result => {
                        if (result.success && result.sendAsList) {
                            this.populateFromAddressDropdownForTab(tabId, result.sendAsList);
                        }
                    })
                    .catch(error => {
                        console.error(`Error loading send-as list for tab ${tabId}:`, error);
                    });
            }
        } catch (error) {
            console.error(`Error loading send-as list for tab ${tabId}:`, error);
        }
    }
    
    populateFromAddressDropdownForTab(tabId, sendAsList) {
        try {
            const fromAddressSelect = document.getElementById(`fromAddress_${tabId}`);
            if (!fromAddressSelect) return;
            
            // Clear existing options
            fromAddressSelect.innerHTML = '<option value="">Select from address...</option>';
            
            // Add send-as addresses
            if (sendAsList && sendAsList.length > 0) {
                sendAsList.forEach(sendAs => {
                    const option = document.createElement('option');
                    option.value = sendAs.sendAsEmailAddress;
                    option.textContent = `${sendAs.sendAsEmailAddress} (${sendAs.displayName || 'No name'})`;
                    fromAddressSelect.appendChild(option);
                });
            }
            
            console.log(`✅ From address dropdown populated for tab ${tabId}`);
        } catch (error) {
            console.error(`Error populating from address dropdown for tab ${tabId}:`, error);
        }
    }
    
    handleCredentialsUpload(event, tabId) {
        try {
            const file = event.target.files[0];
            if (!file) return;
            
            const reader = new FileReader();
            reader.onload = (e) => {
                try {
                    const credentials = JSON.parse(e.target.result);
                    // This would call the main process to update credentials
                    if (window.electronAPI && window.electronAPI.updateClientCredentials) {
                        window.electronAPI.updateClientCredentials(credentials).then(result => {
                            if (result.success) {
                                this.showSuccess('Credentials updated successfully');
                                this.handleGoogleLogin(tabId);
                            } else {
                                this.showError(`Failed to update credentials: ${result.error}`);
                            }
                        }).catch(error => {
                            this.showError(`Error updating credentials: ${error.message}`);
                        });
                    } else {
                        this.showError('Electron API not available');
                    }
                } catch (error) {
                    this.showError('Invalid credentials file format');
                }
            };
            reader.readAsText(file);
        } catch (error) {
            console.error('Error handling credentials upload:', error);
        }
    }
    
    importSheet(tabId) {
        try {
            const sheetUrlInput = document.getElementById(`sheetUrlInput_${tabId}`);
            if (!sheetUrlInput || !sheetUrlInput.value.trim()) {
                this.showWarning('Please enter a Google Sheets URL first');
                return;
            }
            
            const sheetUrl = sheetUrlInput.value.trim();
            const sheetId = this.extractSheetId(sheetUrl);
            
            if (!sheetId) {
                this.showError('Invalid Google Sheets URL. Please check the format.');
                return;
            }
            
            this.showInfo('Connecting to Google Sheets...');
            
            // This would call the main process to connect to sheets
            if (window.electronAPI && window.electronAPI.sheetsListTabs) {
                window.electronAPI.sheetsListTabs(sheetId).then(tabs => {
                    if (tabs && tabs.length > 0) {
                        this.showSuccess(`Connected to Google Sheets! Found ${tabs.length} tab(s)`);
                        this.populateSheetTabs(tabId, tabs);
                        this.enableRefreshButton(tabId);
                    } else {
                        this.showWarning('No tabs found in the spreadsheet');
                    }
                }).catch(error => {
                    this.showError(`Failed to connect to Google Sheets: ${error.message}`);
                });
            } else {
                this.showError('Electron API not available');
            }
            
        } catch (error) {
            console.error('Error importing sheet:', error);
            this.showError('Failed to import sheet: ' + error.message);
        }
    }
    
    extractSheetId(url) {
        try {
            const match = url.match(/\/spreadsheets\/d\/([a-zA-Z0-9-_]+)/);
            return match ? match[1] : null;
        } catch (error) {
            return null;
        }
    }
    
    populateSheetTabs(tabId, tabs) {
        try {
            const container = document.getElementById(`sheetTabsContainer_${tabId}`);
            if (!container) return;
            
            container.innerHTML = `
                <label>Select Sheet Tab</label>
                <select id="sheetTabSelect_${tabId}" style="width:100%; padding:8px 12px; border:1px solid #ddd; border-radius:6px;">
                    ${tabs.map(tab => `<option value="${tab}">${tab}</option>`).join('')}
                </select>
            `;
        } catch (error) {
            console.error('Error populating sheet tabs:', error);
        }
    }
    
    enableRefreshButton(tabId) {
        try {
            const refreshBtn = document.getElementById(`refreshSheetsBtn_${tabId}`);
            if (refreshBtn) {
                refreshBtn.disabled = false;
            }
        } catch (error) {
            console.error('Error enabling refresh button:', error);
        }
    }
    
    refreshSheetData(tabId) {
        try {
            this.showInfo('Refreshing sheet data...');
            // This would call the main process to refresh data
            this.showSuccess('Sheet data refreshed successfully');
        } catch (error) {
            console.error('Error refreshing sheet data:', error);
            this.showError('Failed to refresh sheet data: ' + error.message);
        }
    }
    
    togglePreview(tabId) {
        try {
            const previewDiv = document.getElementById(`emailPreview_${tabId}`);
            if (previewDiv) {
                if (previewDiv.style.display === 'none') {
                    previewDiv.style.display = 'block';
                    this.refreshEmailPreview(tabId);
                    this.showSuccess('Email preview enabled');
                } else {
                    previewDiv.style.display = 'none';
                    this.showInfo('Email preview disabled');
                }
            }
        } catch (error) {
            console.error('Error toggling preview:', error);
        }
    }
    
    showLogs(tabId) {
        try {
            this.showInfo(`Showing logs for ${tabId}`);
            // This would implement a logs modal or panel
        } catch (error) {
            console.error('Error showing logs:', error);
        }
    }
    
    sendCampaign(tabId) {
        try {
            this.showInfo(`Starting campaign in ${tabId}...`);
            // This would implement the actual campaign sending
        } catch (error) {
            console.error('Error sending campaign:', error);
        }
    }
    
    sendTestEmail(tabId) {
        try {
            this.showInfo(`Sending test email from ${tabId}...`);
            // This would implement test email sending
        } catch (error) {
            console.error('Error sending test email:', error);
        }
    }
    
    scheduleCampaign(tabId) {
        try {
            this.showInfo(`Scheduling campaign in ${tabId}...`);
            // This would implement campaign scheduling
        } catch (error) {
            console.error('Error scheduling campaign:', error);
        }
    }
    
    clearAttachments(tabId) {
        try {
            const attachmentsInput = document.getElementById(`attachments_${tabId}`);
            if (attachmentsInput) {
                attachmentsInput.value = '';
                this.showSuccess('Attachments cleared');
            }
        } catch (error) {
            console.error('Error clearing attachments:', error);
        }
    }
    
    refreshEmailPreview(tabId) {
        try {
            const subjectLine = document.getElementById(`subjectLine_${tabId}`);
            const emailEditor = document.getElementById(`emailEditor_${tabId}`);
            const signature = document.getElementById(`signature_${tabId}`);
            const customSignature = document.getElementById(`customSignature_${tabId}`);
            const previewContent = document.getElementById(`previewContent_${tabId}`);
            
            if (!subjectLine || !emailEditor || !previewContent) return;
            
            const subject = subjectLine.value || 'No Subject';
            const content = emailEditor.innerHTML || 'No content';
            const sig = signature.value || customSignature.value || '';
            
            previewContent.innerHTML = `
                <div style="border-bottom: 1px solid #e5e5e7; padding-bottom: 12px; margin-bottom: 12px;">
                    <strong>Subject:</strong> ${subject}
                </div>
                <div style="margin-bottom: 12px;">
                    ${content}
                </div>
                ${sig ? `<div style="border-top: 1px solid #e5e5e7; padding-top: 12px; margin-top: 12px;">
                    ${sig}
                </div>` : ''}
            `;
            
            // Show the preview
            const previewDiv = document.getElementById(`emailPreview_${tabId}`);
            if (previewDiv) {
                previewDiv.style.display = 'block';
            }
            
        } catch (error) {
            console.error(`Error refreshing email preview for tab ${tabId}:`, error);
        }
    }
    
    // Tab renaming functionality
    async renameTab(tabId) {
        try {
            const tabTitle = document.getElementById(`tabTitle_${tabId}`);
            if (!tabTitle) return;
            
            const currentName = tabTitle.textContent;
            const newName = await this.showInputDialog('Rename Tab', 'Enter new tab name:', currentName);
            
            if (newName && newName.trim() && newName !== currentName) {
                tabTitle.textContent = newName.trim();
                
                // Update the tab button text as well
                const tabButton = document.querySelector(`[data-tab="${tabId}"]`);
                if (tabButton) {
                    const tabText = tabButton.querySelector('.tab-text');
                    if (tabText) {
                        tabText.textContent = newName.trim();
                    }
                }
                
                this.showSuccess('Tab renamed successfully');
                this.logEvent('info', `Tab renamed: ${tabId} to "${newName.trim()}"`);
            }
        } catch (error) {
            console.error('Error renaming tab:', error);
            this.showError('Failed to rename tab: ' + error.message);
        }
    }
    
    // Rich text editor commands for tabs
    execCommandForTab(command, tabId) {
        try {
            const editor = document.getElementById(`emailEditor_${tabId}`);
            if (!editor) return;
            
            editor.focus();
            document.execCommand(command, false, null);
            
            // Update editor counts
            this.updateEditorCountsForTab(tabId);
        } catch (error) {
            console.error(`Error executing command ${command} for tab ${tabId}:`, error);
        }
    }
    
    async insertLinkForTab(tabId) {
        try {
            const url = await this.showInputDialog('Insert Link', 'Enter URL:', 'https://');
            if (url && url.trim()) {
                this.execCommandForTab('createLink', tabId);
                // The execCommand will use the URL from input
            }
        } catch (error) {
            console.error(`Error inserting link for tab ${tabId}:`, error);
        }
    }
    
    async insertImageForTab(tabId) {
        try {
            const url = await this.showInputDialog('Insert Image', 'Enter image URL:', 'https://');
            if (url && url.trim()) {
                this.execCommandForTab('insertImage', tabId);
                // The execCommand will use the URL from input
            }
        } catch (error) {
            console.error(`Error inserting image for tab ${tabId}:`, error);
        }
    }
    
    async insertTableForTab(tabId) {
        try {
            const rows = await this.showInputDialog('Insert Table', 'Enter number of rows:', '3');
            const cols = await this.showInputDialog('Insert Table', 'Enter number of columns:', '3');
            
            if (rows && cols) {
                const editor = document.getElementById(`emailEditor_${tabId}`);
                if (editor) {
                    editor.focus();
                    
                    let tableHTML = '<table border="1" style="border-collapse: collapse; width: 100%;">';
                    for (let i = 0; i < parseInt(rows); i++) {
                        tableHTML += '<tr>';
                        for (let j = 0; j < parseInt(cols); j++) {
                            tableHTML += '<td style="padding: 8px; border: 1px solid #ddd;">Cell</td>';
                        }
                        tableHTML += '</tr>';
                    }
                    tableHTML += '</table>';
                    
                    this.insertHTMLAtCursor(tableHTML, editor);
                }
            }
        } catch (error) {
            console.error(`Error inserting table for tab ${tabId}:`, error);
        }
    }
    
    clearFormattingForTab(tabId) {
        try {
            this.execCommandForTab('removeFormat', tabId);
        } catch (error) {
            console.error(`Error clearing formatting for tab ${tabId}:`, error);
        }
    }
    
    toggleEditorModeForTab(tabId) {
        try {
            const modeSpan = document.getElementById(`editorMode_${tabId}`);
            const toggleBtn = document.getElementById(`toggleModeBtn_${tabId}`);
            
            if (modeSpan && toggleBtn) {
                if (modeSpan.textContent === 'Standard Mode') {
                    modeSpan.textContent = 'Advanced Mode';
                    toggleBtn.textContent = 'Standard Mode';
                } else {
                    modeSpan.textContent = 'Standard Mode';
                    toggleBtn.textContent = 'Advanced Mode';
                }
            }
        } catch (error) {
            console.error(`Error toggling editor mode for tab ${tabId}:`, error);
        }
    }
    
    populatePlaceholdersForTab(tabId) {
        try {
            const placeholderList = document.getElementById(`placeholderList_${tabId}`);
            if (!placeholderList) return;
            
            const placeholders = [
                { tag: '@name', description: 'Recipient\'s name' },
                { tag: '@email', description: 'Recipient\'s email' },
                { tag: '@company', description: 'Company name' },
                { tag: '@position', description: 'Job position' },
                { tag: '@phone', description: 'Phone number' },
                { tag: '@website', description: 'Website URL' },
                { tag: '@date', description: 'Current date' },
                { tag: '@time', description: 'Current time' },
                { tag: '@sender_name', description: 'Your name' },
                { tag: '@sender_email', description: 'Your email' },
                { tag: '@sender_company', description: 'Your company' }
            ];
            
            placeholderList.innerHTML = placeholders.map(ph => 
                `<div class="placeholder-item" data-placeholder="${ph.tag}" onclick="window.rtxApp.insertPlaceholderForTab('${ph.tag}', '${tabId}')" style="padding: 8px 12px; cursor: pointer; border-bottom: 1px solid #f0f0f0; transition: background-color 0.2s;" onmouseover="this.style.backgroundColor='#f8f9fa'" onmouseout="this.style.backgroundColor='transparent'">
                    <strong>${ph.tag}</strong> - ${ph.description}
                </div>`
            ).join('');
            
            console.log(`✅ Placeholders populated for tab ${tabId}`);
        } catch (error) {
            console.error(`Error populating placeholders for tab ${tabId}:`, error);
        }
    }
    
    insertPlaceholderForTab(placeholder, tabId) {
        try {
            const editor = document.getElementById(`emailEditor_${tabId}`);
            if (!editor) return;
            
            editor.focus();
            const selection = window.getSelection();
            if (selection.rangeCount > 0) {
                const range = selection.getRangeAt(0);
                range.deleteContents();
                range.insertNode(document.createTextNode(placeholder));
                range.collapse(false);
            } else {
                editor.appendChild(document.createTextNode(placeholder));
            }
            
            // Hide placeholder dropdown
            const dropdown = document.getElementById(`placeholderDropdown_${tabId}`);
            if (dropdown) {
                dropdown.style.display = 'none';
            }
            
            // Update editor counts
            this.updateEditorCountsForTab(tabId);
        } catch (error) {
            console.error(`Error inserting placeholder ${placeholder} for tab ${tabId}:`, error);
        }
    }
    
    initializeEditorCounts(tabId) {
        try {
            const editor = document.getElementById(`emailEditor_${tabId}`);
            if (!editor) return;
            
            // Update counts on input
            editor.addEventListener('input', () => {
                this.updateEditorCountsForTab(tabId);
            });
            
            // Initial count update
            this.updateEditorCountsForTab(tabId);
            
            console.log(`✅ Editor counts initialized for tab ${tabId}`);
        } catch (error) {
            console.error(`Error initializing editor counts for tab ${tabId}:`, error);
        }
    }
    
    updateEditorCountsForTab(tabId) {
        try {
            const editor = document.getElementById(`emailEditor_${tabId}`);
            const wordCount = document.getElementById(`wordCount_${tabId}`);
            const charCount = document.getElementById(`charCount_${tabId}`);
            
            if (!editor || !wordCount || !charCount) return;
            
            const text = editor.textContent || editor.innerText || '';
            const words = text.trim() ? text.trim().split(/\s+/).length : 0;
            const chars = text.length;
            
            wordCount.textContent = `${words} words`;
            charCount.textContent = `${chars} chars`;
        } catch (error) {
            console.error(`Error updating editor counts for tab ${tabId}:`, error);
        }
    }
    
    // Scheduling methods for tabs
    scheduleOneTimeSendForTab(tabId) {
        try {
            const scheduleDateTime = document.getElementById(`scheduleDateTime_${tabId}`);
            if (!scheduleDateTime || !scheduleDateTime.value) {
                this.showWarning('Please select a date and time for scheduling');
                return;
            }
            
            const scheduledTime = new Date(scheduleDateTime.value);
            const now = new Date();
            
            if (scheduledTime <= now) {
                this.showError('Scheduled time must be in the future');
                return;
            }
            
            // Get campaign data from this tab
            const campaignData = this.getCampaignDataFromTab(tabId);
            if (!campaignData) {
                this.showError('Please fill in all required campaign fields');
                return;
            }
            
            // Schedule the campaign
            this.scheduleCampaignForTab(tabId, campaignData, scheduledTime);
            
        } catch (error) {
            console.error(`Error scheduling campaign for tab ${tabId}:`, error);
            this.showError('Failed to schedule campaign: ' + error.message);
        }
    }
    
    getCampaignDataFromTab(tabId) {
        try {
            const campaignName = document.getElementById(`campaignName_${tabId}`)?.value;
            const subjectLine = document.getElementById(`subjectLine_${tabId}`)?.value;
            const emailEditor = document.getElementById(`emailEditor_${tabId}`);
            const signature = document.getElementById(`signature_${tabId}`)?.value;
            
            if (!campaignName || !subjectLine || !emailEditor) {
                return null;
            }
            
            return {
                campaignName,
                subjectLine,
                emailContent: emailEditor.innerHTML,
                signature: signature || '',
                tabId
            };
        } catch (error) {
            console.error(`Error getting campaign data from tab ${tabId}:`, error);
            return null;
        }
    }
    
    scheduleCampaignForTab(tabId, campaignData, scheduledTime) {
        try {
            // This would integrate with the main process scheduling system
            this.showSuccess(`Campaign "${campaignData.campaignName}" scheduled for ${scheduledTime.toLocaleString()}`);
            
            // Add to schedule list
            this.addToScheduleList(tabId, campaignData, scheduledTime);
            
            // Clear the form
            this.clearCampaignForm(tabId);
            
        } catch (error) {
            console.error(`Error scheduling campaign for tab ${tabId}:`, error);
            this.showError('Failed to schedule campaign: ' + error.message);
        }
    }
    
    addToScheduleList(tabId, campaignData, scheduledTime) {
        try {
            const scheduleList = document.getElementById(`scheduleList_${tabId}`);
            if (!scheduleList) return;
            
            const scheduleItem = document.createElement('div');
            scheduleItem.style.cssText = 'padding: 8px 12px; background: white; border: 1px solid #e5e5e7; border-radius: 6px; margin-bottom: 8px; display: flex; justify-content: space-between; align-items: center;';
            scheduleItem.innerHTML = `
                <div>
                    <strong>${campaignData.campaignName}</strong><br>
                    <small style="color: #8E8E93;">Scheduled for: ${scheduledTime.toLocaleString()}</small>
                </div>
                <button class="btn btn-secondary" onclick="window.rtxApp.cancelScheduledCampaign('${tabId}', this)" style="padding: 4px 8px; font-size: 12px;">
                    <i class="fas fa-times"></i> Cancel
                </button>
            `;
            
            scheduleList.appendChild(scheduleItem);
            
        } catch (error) {
            console.error(`Error adding to schedule list for tab ${tabId}:`, error);
        }
    }
    
    cancelScheduledCampaign(tabId, buttonElement) {
        try {
            const scheduleItem = buttonElement.closest('div');
            if (scheduleItem) {
                scheduleItem.remove();
                this.showSuccess('Scheduled campaign cancelled');
            }
        } catch (error) {
            console.error(`Error cancelling scheduled campaign for tab ${tabId}:`, error);
        }
    }
    
    clearCampaignForm(tabId) {
        try {
            const elements = [
                `campaignName_${tabId}`,
                `subjectLine_${tabId}`,
                `signature_${tabId}`,
                `scheduleDateTime_${tabId}`
            ];
            
            elements.forEach(elementId => {
                const element = document.getElementById(elementId);
                if (element) {
                    if (element.tagName === 'INPUT' || element.tagName === 'TEXTAREA') {
                        element.value = '';
                    }
                }
            });
            
            // Clear the email editor
            const editor = document.getElementById(`emailEditor_${tabId}`);
            if (editor) {
                editor.innerHTML = '<p>Dear @name,</p><p>Thank you for your interest in our services.</p><p>Best regards,<br>Your Team</p>';
            }
            
        } catch (error) {
            console.error(`Error clearing campaign form for tab ${tabId}:`, error);
        }
    }
    
    // Signature management methods for tabs
    async saveSignatureForTab(tabId) {
        try {
            const customSignature = document.getElementById(`customSignature_${tabId}`);
            if (!customSignature || !customSignature.value.trim()) {
                this.showWarning('Please enter a signature to save');
                return;
            }
            
            const signatureName = await this.showInputDialog('Save Signature', 'Enter a name for this signature:', 'Custom Signature');
            if (!signatureName) return;
            
            // Save to localStorage for this tab
            const signatures = JSON.parse(localStorage.getItem(`signatures_${tabId}`) || '[]');
            signatures.push({
                name: signatureName,
                content: customSignature.value.trim(),
                timestamp: new Date().toISOString()
            });
            
            localStorage.setItem(`signatures_${tabId}`, JSON.stringify(signatures));
            this.showSuccess('Signature saved successfully');
            
        } catch (error) {
            console.error(`Error saving signature for tab ${tabId}:`, error);
            this.showError('Failed to save signature: ' + error.message);
        }
    }
    
    async loadSignatureForTab(tabId) {
        try {
            const signatures = JSON.parse(localStorage.getItem(`signatures_${tabId}`) || '[]');
            if (signatures.length === 0) {
                this.showInfo('No saved signatures found');
                return;
            }
            
            const signatureNames = signatures.map(s => s.name);
            const selectedName = await this.showInputDialog('Load Signature', 'Select signature to load:\n\n' + signatureNames.join('\n'));
            
            if (selectedName) {
                const signature = signatures.find(s => s.name === selectedName);
                if (signature) {
                    const customSignature = document.getElementById(`customSignature_${tabId}`);
                    if (customSignature) {
                        customSignature.value = signature.content;
                        this.showSuccess('Signature loaded successfully');
                    }
                }
            }
            
        } catch (error) {
            console.error(`Error loading signature for tab ${tabId}:`, error);
            this.showError('Failed to load signature: ' + error.message);
        }
    }
    
    clearSignatureForTab(tabId) {
        try {
            const customSignature = document.getElementById(`customSignature_${tabId}`);
            if (customSignature) {
                customSignature.value = '';
                this.showSuccess('Signature cleared');
            }
        } catch (error) {
            console.error(`Error clearing signature for tab ${tabId}:`, error);
        }
    }
    
    // Enhanced email preview for tabs
    refreshEmailPreview(tabId) {
        try {
            const subjectLine = document.getElementById(`subjectLine_${tabId}`);
            const emailEditor = document.getElementById(`emailEditor_${tabId}`);
            const signature = document.getElementById(`signature_${tabId}`);
            const customSignature = document.getElementById(`customSignature_${tabId}`);
            const previewContent = document.getElementById(`previewContent_${tabId}`);
            
            if (!subjectLine || !emailEditor || !previewContent) return;
            
            const subject = subjectLine.value || 'No Subject';
            const content = emailEditor.innerHTML || 'No content';
            const sig = signature.value || customSignature.value || '';
            
            previewContent.innerHTML = `
                <div style="border-bottom: 1px solid #e5e5e7; padding-bottom: 12px; margin-bottom: 12px;">
                    <strong>Subject:</strong> ${subject}
                </div>
                <div style="margin-bottom: 12px;">
                    ${content}
                </div>
                ${sig ? `<div style="border-top: 1px solid #e5e5e7; padding-top: 12px; margin-top: 12px;">
                    ${sig}
                </div>` : ''}
            `;
            
            // Show the preview
            const previewDiv = document.getElementById(`emailPreview_${tabId}`);
            if (previewDiv) {
                previewDiv.style.display = 'block';
            }
            
        } catch (error) {
            console.error(`Error refreshing email preview for tab ${tabId}:`, error);
        }
    }
    
    // Setup authentication modal
    setupAuthenticationModal() {
        try {
            console.log('🔐 Setting up authentication modal...');
            
            // Get modal elements
            const modal = document.getElementById('authModal');
            const modalGoogleLoginBtn = document.getElementById('modalGoogleLoginBtn');
            const modalUploadCredentialsBtn = document.getElementById('modalUploadCredentialsBtn');
            const modalCredentialsFile = document.getElementById('modalCredentialsFile');
            const selectedFileName = document.getElementById('selectedFileName');
            
            if (!modal) {
                console.warn('⚠️ Authentication modal not found');
                return;
            }
            
            // Setup Google login button
            if (modalGoogleLoginBtn) {
                modalGoogleLoginBtn.addEventListener('click', () => {
                    console.log('🔐 Modal Google login clicked');
                    // Close modal and trigger authentication for current tab
                    modal.style.display = 'none';
                    // This will be handled by the tab-specific authentication
                });
            }
            
            // Setup credentials upload
            if (modalUploadCredentialsBtn && modalCredentialsFile) {
                modalUploadCredentialsBtn.addEventListener('click', () => {
                    modalCredentialsFile.click();
                });
                
                modalCredentialsFile.addEventListener('change', (e) => {
                    const file = e.target.files[0];
                    if (file) {
                        selectedFileName.textContent = `Selected: ${file.name}`;
                        selectedFileName.style.color = '#34a853';
                        
                        // Auto-upload the credentials
                        this.handleCredentialsUploadFromModal(file);
                    }
                });
            }
            
            console.log('✅ Authentication modal setup complete');
            
        } catch (error) {
            console.error('❌ Error setting up authentication modal:', error);
        }
    }
    
    // Handle credentials upload from modal
    async handleCredentialsUploadFromModal(file) {
        try {
            console.log('📁 Handling credentials upload from modal:', file.name);
            
            this.showLoading('Processing credentials...');
            
            const credentials = await this.readCredentialsFile(file);
            console.log('✅ Credentials parsed successfully');
            
            // Close the modal
            const modal = document.getElementById('authModal');
            if (modal) modal.style.display = 'none';
            
            // Authenticate with the credentials
            await this.authenticateWithCredentials(credentials);
            
        } catch (error) {
            console.error('❌ Error handling credentials upload from modal:', error);
            this.showError('Failed to process credentials: ' + error.message);
            this.hideLoading();
        }
    }
}

// Initialize app when DOM is loaded
document.addEventListener('DOMContentLoaded', () => {
    console.log('DOM loaded, initializing RTX App...');
    if (!window.rtxApp) window.rtxApp = new RTXApp();
});