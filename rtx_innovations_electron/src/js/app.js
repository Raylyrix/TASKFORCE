// Import CSS files
import '../styles/main.css';
import '../styles/animations.css';
import '../styles/components.css';

console.log('🚀 CSS files imported successfully');
console.log('🚀 app.js is loading...');

// RTX Innovations - AutoMailer Pro
class RTXApp {
    constructor() {
        console.log('🚀 RTXApp constructor called');
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
        this.populateFromAddressDropdown();
        this.loadSendAsList();
        this.updateUI();
        this.initializeGlobalInstance();
        console.log('✅ RTX Innovations AutoMailer Pro initialized successfully!');
        
        // Show a success message on the page
        this.showSuccess('AutoMailer Pro loaded successfully!');

        // Update and version wiring
        this.wireAutoUpdates();
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
                    this.insertHTMLAtCursor(html);
                } else {
                    // Use plain text for better formatting control
                    this.insertTextAtCursor(text);
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
    insertHTMLAtCursor(html) {
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
        }
    }
    
    // Helper method to insert text at cursor position
    insertTextAtCursor(text) {
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
            
            const result = await window.electronAPI.sendTestEmail({
                to: testEmail,
                subject: campaignData.subject,
                content: finalContent,
                html: finalHtml,
                from,
                attachmentsPaths: this.attachmentsPaths
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
            
            const sendAsList = await window.electronAPI.getSendAsList();
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

    // Utility methods
    showWarning(message) {
        const warningDiv = document.createElement('div');
        warningDiv.className = 'alert alert-warning';
        warningDiv.style.cssText = 'position: fixed; top: 20px; right: 20px; z-index: 9999; max-width: 400px;';
        warningDiv.innerHTML = `
            <i class="fas fa-exclamation-triangle"></i>
            <span>${message}</span>
            <button type="button" class="close" onclick="this.parentElement.remove()" style="float: right; background: none; border: none; font-size: 20px; cursor: pointer;">&times;</button>
        `;
        
        document.body.appendChild(warningDiv);
        
        setTimeout(() => {
            if (warningDiv.parentElement) {
                warningDiv.remove();
            }
        }, 5000);
    }

    // Preview functionality
    debouncePreviewUpdate() {
        if (this.previewUpdateTimeout) {
            clearTimeout(this.previewUpdateTimeout);
        }
        this.previewUpdateTimeout = setTimeout(() => {
            this.refreshEmailPreview();
        }, 500);
    }

    refreshEmailPreview() {
        try {
            const previewContainer = document.getElementById('emailPreview');
            if (!previewContainer) return;

            const subject = document.getElementById('campaignSubject')?.value || 'No Subject';
            const fromName = document.getElementById('fromName')?.value || 'Your Name';
            const content = this.getEditorHtml() || 'No content yet';
            const fromEmail = this.selectedFrom || 'your-email@gmail.com';

            const previewHTML = `
                <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; background: white; border: 1px solid #e0e0e0; border-radius: 8px; overflow: hidden;">
                    <!-- Email Header -->
                    <div style="background: #f8f9fa; padding: 20px; border-bottom: 1px solid #e0e0e0;">
                        <div style="margin-bottom: 10px;">
                            <strong>From:</strong> ${fromName} &lt;${fromEmail}&gt;
                        </div>
                        <div style="margin-bottom: 10px;">
                            <strong>Subject:</strong> ${subject}
                        </div>
                        <div style="margin-bottom: 10px;">
                            <strong>Date:</strong> ${new Date().toLocaleString()}
                        </div>
                    </div>
                    
                    <!-- Email Body -->
                    <div style="padding: 20px; line-height: 1.6; color: #333;">
                        ${content}
                    </div>
                    
                    <!-- Email Footer -->
                    <div style="background: #f8f9fa; padding: 15px; border-top: 1px solid #e0e0e0; text-align: center; color: #666; font-size: 12px;">
                        <p>Sent via TASK FORCE AutoMailer Pro</p>
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

    // Multiple window support for parallel campaigns
    openNewCampaignWindow() {
        try {
            console.log('🚀 Opening new campaign window...');
            this.logEvent('info', 'Opening new campaign window');
            
            // Create a new window with the same app
            const newWindow = window.open('', '_blank', 'width=1400,height=900,scrollbars=yes,resizable=yes');
            
            if (!newWindow) {
                this.showError('Popup blocked! Please allow popups for this site.');
                return;
            }

            // Create the HTML content for the new window
            const newWindowHTML = `
                <!DOCTYPE html>
                <html lang="en">
                <head>
                    <meta charset="UTF-8">
                    <meta name="viewport" content="width=device-width, initial-scale=1.0">
                    <title>TASK FORCE - New Campaign Window</title>
                    <link rel="stylesheet" href="https://cdnjs.cloudflare.com/ajax/libs/font-awesome/6.0.0/css/all.min.css">
                    <style>
                        body { 
                            font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif; 
                            margin: 0; 
                            padding: 20px; 
                            background: #f5f5f7; 
                            color: #1d1d1f;
                        }
                        .header { 
                            background: white; 
                            padding: 20px; 
                            border-radius: 12px; 
                            margin-bottom: 20px; 
                            box-shadow: 0 2px 8px rgba(0,0,0,0.1);
                            text-align: center;
                        }
                        .campaign-form { 
                            background: white; 
                            padding: 24px; 
                            border-radius: 12px; 
                            box-shadow: 0 4px 12px rgba(0,0,0,0.08);
                        }
                        .form-group { margin-bottom: 20px; }
                        .form-group label { 
                            display: block; 
                            margin-bottom: 8px; 
                            font-weight: 500; 
                            color: #1d1d1f;
                        }
                        .form-group input, .form-group textarea { 
                            width: 100%; 
                            padding: 12px; 
                            border: 1px solid #e1e5e9; 
                            border-radius: 8px; 
                            font-size: 14px; 
                            box-sizing: border-box;
                        }
                        .btn { 
                            padding: 12px 24px; 
                            border: none; 
                            border-radius: 8px; 
                            font-size: 14px; 
                            cursor: pointer; 
                            text-decoration: none; 
                            display: inline-block; 
                            margin: 4px;
                            transition: all 0.2s;
                        }
                        .btn-primary { background: #007AFF; color: white; }
                        .btn-primary:hover { background: #0056CC; }
                        .btn-secondary { background: #f2f2f7; color: #1d1d1f; }
                        .btn-secondary:hover { background: #e5e5e7; }
                        .btn-danger { background: #ff3b30; color: white; }
                        .btn-danger:hover { background: #d70015; }
                        .preview-section { 
                            border: 1px solid #e5e5e7; 
                            border-radius: 6px; 
                            padding: 16px; 
                            background: #f8f9fa; 
                            min-height: 200px; 
                            margin-bottom: 20px;
                        }
                        .auth-section {
                            background: #f8f9fa;
                            padding: 20px;
                            border-radius: 8px;
                            margin-bottom: 20px;
                            text-align: center;
                        }
                        .status-indicator {
                            display: inline-block;
                            width: 12px;
                            height: 12px;
                            border-radius: 50%;
                            margin-right: 8px;
                        }
                        .status-connected { background: #34c759; }
                        .status-disconnected { background: #ff3b30; }
                    </style>
                </head>
                <body>
                    <div class="header">
                        <h1>🚀 TASK FORCE - New Campaign Window</h1>
                        <p>Create campaigns with different Google accounts for parallel processing</p>
                    </div>

                    <div class="auth-section">
                        <h3>🔐 Google Authentication</h3>
                        <div id="authStatus">
                            <span class="status-indicator status-disconnected"></span>
                            <span>Not authenticated</span>
                        </div>
                        <button class="btn btn-primary" id="googleSignInBtn" onclick="authenticateInNewWindow()">
                            <i class="fas fa-sign-in-alt"></i> Sign in with Google
                        </button>
                        <div id="userInfo" style="display: none; margin-top: 16px;">
                            <p><strong>Signed in as:</strong> <span id="userEmail"></span></p>
                            <button class="btn btn-secondary" onclick="signOut()">Sign Out</button>
                        </div>
                    </div>

                    <div class="campaign-form">
                        <h3>📧 Create Email Campaign</h3>
                        
                        <div class="form-group">
                            <label>Campaign Name</label>
                            <input type="text" id="campaignName" placeholder="Enter campaign name">
                        </div>

                        <div class="form-group">
                            <label>Subject Line</label>
                            <input type="text" id="campaignSubject" placeholder="Enter email subject">
                        </div>

                        <div class="form-group">
                            <label>From Name</label>
                            <input type="text" id="fromName" placeholder="Your name">
                        </div>

                        <div class="form-group">
                            <label>Email Content</label>
                            <textarea id="emailContent" rows="10" placeholder="Enter your email content here..."></textarea>
                        </div>

                        <div class="form-group">
                            <label>Google Sheets URL</label>
                            <input type="text" id="sheetUrl" placeholder="https://docs.google.com/spreadsheets/d/...">
                        </div>

                        <div class="form-group">
                            <label>Email Preview</label>
                            <div class="preview-section" id="emailPreview">
                                <div style="text-align: center; color: #8E8E93; padding: 40px 20px;">
                                    <i class="fas fa-eye" style="font-size: 32px; margin-bottom: 16px; display: block;"></i>
                                    <p>Preview will appear here after you fill in the campaign details</p>
                                </div>
                            </div>
                        </div>

                        <div style="text-align: center;">
                            <button class="btn btn-primary" onclick="createCampaign()">
                                <i class="fas fa-rocket"></i> Create Campaign
                            </button>
                            <button class="btn btn-secondary" onclick="refreshPreview()">
                                <i class="fas fa-sync-alt"></i> Refresh Preview
                            </button>
                        </div>
                    </div>

                    <script>
                        let isAuthenticated = false;
                        let currentUser = null;

                        function authenticateInNewWindow() {
                            const btn = document.getElementById('googleSignInBtn');
                            btn.disabled = true;
                            btn.innerHTML = '<i class="fas fa-spinner fa-spin"></i> Signing in...';
                            
                            // Simulate authentication (in real implementation, this would call the main process)
                            setTimeout(() => {
                                isAuthenticated = true;
                                currentUser = { email: 'user' + Date.now() + '@example.com' };
                                updateAuthUI();
                                btn.innerHTML = '<i class="fas fa-check"></i> Authenticated';
                                btn.style.background = '#34c759';
                            }, 2000);
                        }

                        function updateAuthUI() {
                            const authStatus = document.getElementById('authStatus');
                            const userInfo = document.getElementById('userInfo');
                            const userEmail = document.getElementById('userEmail');
                            
                            if (isAuthenticated && currentUser) {
                                authStatus.innerHTML = '<span class="status-indicator status-connected"></span><span>Authenticated</span>';
                                userEmail.textContent = currentUser.email;
                                userInfo.style.display = 'block';
                            } else {
                                authStatus.innerHTML = '<span class="status-indicator status-disconnected"></span><span>Not authenticated</span>';
                                userInfo.style.display = 'none';
                            }
                        }

                        function signOut() {
                            isAuthenticated = false;
                            currentUser = null;
                            updateAuthUI();
                            
                            const btn = document.getElementById('googleSignInBtn');
                            btn.disabled = false;
                            btn.innerHTML = '<i class="fas fa-sign-in-alt"></i> Sign in with Google';
                            btn.style.background = '#007AFF';
                        }

                        function refreshPreview() {
                            const subject = document.getElementById('campaignSubject').value || 'No Subject';
                            const fromName = document.getElementById('fromName').value || 'Your Name';
                            const content = document.getElementById('emailContent').value || 'No content yet';
                            
                            const previewHTML = \`
                                <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; background: white; border: 1px solid #e0e0e0; border-radius: 8px; overflow: hidden;">
                                    <div style="background: #f8f9fa; padding: 20px; border-bottom: 1px solid #e0e0e0;">
                                        <div style="margin-bottom: 10px;"><strong>From:</strong> \${fromName} &lt;user@example.com&gt;</div>
                                        <div style="margin-bottom: 10px;"><strong>Subject:</strong> \${subject}</div>
                                        <div style="margin-bottom: 10px;"><strong>Date:</strong> \${new Date().toLocaleString()}</div>
                                    </div>
                                    <div style="padding: 20px; line-height: 1.6; color: #333;">\${content}</div>
                                    <div style="background: #f8f9fa; padding: 15px; border-top: 1px solid #e0e0e0; text-align: center; color: #666; font-size: 12px;">
                                        <p>Sent via TASK FORCE AutoMailer Pro - New Window</p>
                                    </div>
                                </div>
                            \`;
                            
                            document.getElementById('emailPreview').innerHTML = previewHTML;
                        }

                        function createCampaign() {
                            if (!isAuthenticated) {
                                alert('Please sign in with Google first!');
                                return;
                            }
                            
                            const campaignName = document.getElementById('campaignName').value;
                            const subject = document.getElementById('campaignSubject').value;
                            const fromName = document.getElementById('fromName').value;
                            const content = document.getElementById('emailContent').value;
                            const sheetUrl = document.getElementById('sheetUrl').value;
                            
                            if (!campaignName || !subject || !content) {
                                alert('Please fill in all required fields!');
                                return;
                            }
                            
                            alert(\`Campaign created successfully!\\n\\nCampaign: \${campaignName}\\nSubject: \${subject}\\nFrom: \${fromName}\\nContent Length: \${content.length} characters\\nSheet: \${sheetUrl || 'None'}\\n\\nThis is a demo - in the full version, this would create a real campaign.\`);
                        }

                        // Auto-refresh preview when content changes
                        document.getElementById('campaignSubject').addEventListener('input', refreshPreview);
                        document.getElementById('fromName').addEventListener('input', refreshPreview);
                        document.getElementById('emailContent').addEventListener('input', refreshPreview);
                    </script>
                </body>
                </html>
            `;

            newWindow.document.write(newWindowHTML);
            newWindow.document.close();
            
            this.showSuccess('New campaign window opened! You can now run campaigns with different Google accounts in parallel.');
            this.logEvent('info', 'New campaign window opened successfully');
            
        } catch (error) {
            console.error('Error opening new campaign window:', error);
            this.showError('Failed to open new campaign window: ' + error.message);
            this.logEvent('error', 'Failed to open new campaign window', { error: error.message });
        }
    }
}

// Initialize app when DOM is loaded
document.addEventListener('DOMContentLoaded', () => {
    console.log('DOM loaded, initializing RTX App...');
    if (!window.rtxApp) window.rtxApp = new RTXApp();
}); 