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
        this.quill = null;
        this.selectedSheetId = null;
        this.selectedSheetTitle = null;
        this.templates = [];
        // Initialize the app
        this.init();
        
        // Initialize authentication listeners
        this.initAuthListeners();
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
        
        // Show a success message on the page
        this.showSuccess('AutoMailer Pro loaded successfully!');

        // Update and version wiring
        this.wireAutoUpdates();
    }

    setupRichEditor() {
        try {
            const editorContainer = document.getElementById('emailEditor');
            if (!editorContainer || !window.Quill) return;
            // Do not require table module; proceed even if unavailable
            const Font = window.Quill.import('formats/font');
            Font.whitelist = ['sans-serif','serif','monospace','arial','times-new-roman','georgia','verdana'];
            window.Quill.register(Font, true);
            const Size = window.Quill.import('attributors/style/size');
            Size.whitelist = ['10px','12px','14px','16px','18px','24px','32px'];
            window.Quill.register(Size, true);

            // Create a custom clipboard module for better paste handling
            const Clipboard = window.Quill.import('modules/clipboard');
            class CustomClipboard extends Clipboard {
                convert(html) {
                    // Preserve formatting from various sources
                    if (html) {
                        // Clean up common formatting issues while preserving structure
                        html = html
                            .replace(/<o:p[^>]*>/g, '') // Remove Office-specific tags
                            .replace(/<\/o:p>/g, '')
                            .replace(/<w:[^>]*>/g, '') // Remove Word-specific tags
                            .replace(/<\/w:[^>]*>/g, '')
                            .replace(/<m:[^>]*>/g, '') // Remove MathML tags
                            .replace(/<\/m:[^>]*>/g, '')
                            .replace(/<v:[^>]*>/g, '') // Remove VML tags
                            .replace(/<\/v:[^>]*>/g, '')
                            .replace(/<st1:[^>]*>/g, '') // Remove SharePoint tags
                            .replace(/<\/st1:[^>]*>/g, '')
                            .replace(/<meta[^>]*>/g, '') // Remove meta tags
                            .replace(/<link[^>]*>/g, '') // Remove link tags
                            .replace(/<style[^>]*>[\s\S]*?<\/style>/g, '') // Remove style tags
                            .replace(/<script[^>]*>[\s\S]*?<\/script>/g, '') // Remove script tags
                            .replace(/<!--[\s\S]*?-->/g, '') // Remove comments
                            .replace(/\s+/g, ' ') // Normalize whitespace
                            .trim();
                    }
                    return super.convert(html);
                }
            }

            this.quill = new window.Quill('#emailEditor', {
                modules: { 
                    toolbar: '#editorToolbar',
                    clipboard: {
                        matchVisual: false, // Don't match visual appearance
                        matchers: [
                            // Custom matchers for better formatting preservation
                            ['p', (node, delta) => {
                                const text = node.textContent || '';
                                if (text.trim()) {
                                    return delta.compose(new window.Quill.import('delta')().insert(text + '\n'));
                                }
                                return delta;
                            }],
                            ['div', (node, delta) => {
                                const text = node.textContent || '';
                                if (text.trim()) {
                                    return delta.compose(new window.Quill.import('delta')().insert(text + '\n'));
                                }
                                return delta;
                            }]
                        ]
                    }
                },
                theme: 'snow',
                placeholder: 'Enter your email content... Use ((Name)), ((Email)), ((Company))',
                formats: [
                    'bold', 'italic', 'underline', 'strike',
                    'color', 'background',
                    'font', 'size',
                    'header', 'list', 'bullet',
                    'link', 'image',
                    'align', 'indent',
                    'code', 'code-block',
                    'blockquote'
                ]
            });

            // Ensure Ctrl+A works inside editor
            editorContainer.addEventListener('keydown', (e) => {
                if ((e.ctrlKey || e.metaKey) && e.key.toLowerCase() === 'a') {
                    e.stopPropagation();
                }
            });

            // Enhanced paste handler for better formatting preservation
            editorContainer.addEventListener('paste', (e) => {
                const items = e.clipboardData?.items || [];
                let hasHandled = false;

                // Handle images first
                for (const item of items) {
                    if (item.type && item.type.startsWith('image/')) {
                        const file = item.getAsFile();
                        const reader = new FileReader();
                        reader.onload = () => {
                            const range = this.quill.getSelection(true) || { index: this.quill.getLength(), length: 0 };
                            this.quill.insertEmbed(range.index, 'image', reader.result, 'user');
                            this.quill.setSelection(range.index + 1, 0, 'user');
                        };
                        reader.readAsDataURL(file);
                        e.preventDefault();
                        hasHandled = true;
                        break;
                    }
                }

                // Handle rich text with better formatting preservation
                if (!hasHandled) {
                    const html = e.clipboardData.getData('text/html');
                    const text = e.clipboardData.getData('text/plain');
                    const rtf = e.clipboardData.getData('text/rtf');
                    
                    if (html && html.trim()) {
                        // Use Quill's built-in HTML paste with our custom clipboard handling
                        e.preventDefault();
                        const range = this.quill.getSelection(true) || { index: this.quill.getLength(), length: 0 };
                        
                        // Clean up the HTML before pasting
                        let cleanHtml = this.cleanHtmlForPaste(html);
                        
                        // Show debug information
                        this.showCopyPasteDebug('Paste HTML', 'HTML', cleanHtml.length);
                        
                        // Insert HTML content
                        this.quill.clipboard.dangerouslyPasteHTML(range.index, cleanHtml, 'user');
                        
                        // Set selection after the pasted content
                        const newLength = this.quill.getLength();
                        this.quill.setSelection(range.index + (newLength - range.index), 0, 'user');
                    } else if (rtf && rtf.trim()) {
                        // Handle RTF content (from Word, etc.)
                        e.preventDefault();
                        this.showCopyPasteDebug('Paste RTF', 'RTF', rtf.length);
                        this.handleRtfPaste(rtf, e);
                    } else if (text && text.trim()) {
                        // Handle plain text with basic formatting
                        e.preventDefault();
                        this.showCopyPasteDebug('Paste Text', 'Plain Text', text.length);
                        
                        const range = this.quill.getSelection(true) || { index: this.quill.getLength(), length: 0 };
                        
                        // Split text by lines and preserve basic structure
                        const lines = text.split('\n');
                        let currentIndex = range.index;
                        
                        lines.forEach((line, index) => {
                            if (line.trim()) {
                                this.quill.insertText(currentIndex, line, 'user');
                                currentIndex += line.length;
                            }
                            if (index < lines.length - 1) {
                                this.quill.insertText(currentIndex, '\n', 'user');
                                currentIndex += 1;
                            }
                        });
                        
                        this.quill.setSelection(currentIndex, 0, 'user');
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
                            const range = this.quill.getSelection(true) || { index: this.quill.getLength(), length: 0 };
                            this.quill.insertEmbed(range.index, 'image', reader.result, 'user');
                            this.quill.setSelection(range.index + 1, 0, 'user');
                        };
                        reader.readAsDataURL(file);
                    });
                }
            });

            // Add copy event handler to ensure proper copying
            editorContainer.addEventListener('copy', (e) => {
                const selection = this.quill.getSelection();
                if (selection && selection.length > 0) {
                    // Let Quill handle the copy operation naturally
                    // This ensures proper HTML formatting is copied
                    
                    // Show debug information
                    this.showCopyPasteDebug('Copy', 'Selection', selection.length);
                    
                    // We can also enhance the clipboard data if needed
                    setTimeout(() => {
                        // Check if we need to enhance the clipboard data
                        // This is a fallback to ensure proper formatting
                    }, 0);
                }
            });

            // Add cut event handler for consistency
            editorContainer.addEventListener('cut', (e) => {
                const selection = this.quill.getSelection();
                if (selection && selection.length > 0) {
                    // Let Quill handle the cut operation naturally
                }
            });

            // Show debug panel for copy-paste operations
            this.showCopyPasteDebug = (operation, contentType, contentLength) => {
                const debugPanel = document.getElementById('copyPasteDebug');
                const enableCheckbox = document.getElementById('enableDebugPanel');
                
                // Only show debug info if the panel is enabled
                if (!enableCheckbox || !enableCheckbox.checked) return;
                
                const status = document.getElementById('copyPasteStatus');
                const lastOp = document.getElementById('lastOperation');
                const type = document.getElementById('contentType');
                const length = document.getElementById('contentLength');
                
                if (debugPanel && status && lastOp && type && length) {
                    debugPanel.style.display = 'block';
                    status.textContent = 'Active';
                    lastOp.textContent = operation;
                    type.textContent = contentType;
                    length.textContent = contentLength;
                    
                    // Hide after 5 seconds
                    setTimeout(() => {
                        status.textContent = 'Ready';
                    }, 5000);
                }
            };

            // Toggle debug details
            this.toggleDebugDetails = () => {
                const details = document.getElementById('debugDetails');
                const toggleBtn = document.getElementById('toggleDebugBtn');
                
                if (details && toggleBtn) {
                    if (details.style.display === 'none') {
                        details.style.display = 'block';
                        toggleBtn.textContent = 'Hide Details';
                    } else {
                        details.style.display = 'none';
                        toggleBtn.textContent = 'Show Details';
                    }
                }
            };

            // Show current editor content in different formats
            this.showCurrentContent = () => {
                const content = this.getEditorPlainText();
                const html = this.getEditorHtml();
                const debug = this.getEditorContentDebug();
                
                // Create a modal to show the content
                const modal = document.createElement('div');
                modal.style.cssText = `
                    position: fixed; top: 0; left: 0; width: 100%; height: 100%;
                    background: rgba(0,0,0,0.5); z-index: 10000; display: flex;
                    align-items: center; justify-content: center;
                `;
                
                modal.innerHTML = `
                    <div style="background: white; padding: 20px; border-radius: 8px; max-width: 80%; max-height: 80%; overflow-y: auto;">
                        <h3>Current Editor Content</h3>
                        <p><strong>Plain Text:</strong></p>
                        <pre style="background: #f5f5f5; padding: 10px; border-radius: 4px; overflow-x: auto;">${content}</pre>
                        <p><strong>HTML:</strong></p>
                        <pre style="background: #f5f5f5; padding: 10px; border-radius: 4px; overflow-x: auto;">${html}</pre>
                        <p><strong>Debug Info:</strong></p>
                        <pre style="background: #f5f5f5; padding: 10px; border-radius: 4px; overflow-x: auto;">${JSON.stringify(debug, null, 2)}</pre>
                        <button onclick="this.parentElement.parentElement.remove()" style="margin-top: 15px; padding: 8px 16px; background: #007aff; color: white; border: none; border-radius: 4px; cursor: pointer;">Close</button>
                    </div>
                `;
                
                document.body.appendChild(modal);
                
                // Close modal when clicking outside
                modal.addEventListener('click', (e) => {
                    if (e.target === modal) {
                        modal.remove();
                    }
                });
            };

            // Toggle debug panel visibility
            this.toggleDebugPanel = (checked) => {
                const debugPanel = document.getElementById('copyPasteDebug');
                if (debugPanel) {
                    debugPanel.style.display = checked ? 'block' : 'none';
                }
            };

            // Add a method to test copy-paste functionality
            this.testCopyPaste = () => {
                console.log('Testing copy-paste functionality...');
                
                // Test different types of content
                const testCases = [
                    {
                        name: 'Basic formatting',
                        html: '<p><strong>Bold text</strong> and <em>italic text</em> with <u>underline</u>.</p>'
                    },
                    {
                        name: 'Multiple paragraphs',
                        html: '<p>First paragraph with <strong>bold text</strong>.</p><p>Second paragraph with <em>italic text</em>.</p>'
                    },
                    {
                        name: 'Lists and formatting',
                        html: '<ul><li><strong>Bold list item</strong></li><li><em>Italic list item</em></li></ul><p>Paragraph after list.</p>'
                    },
                    {
                        name: 'Mixed content',
                        html: '<h1>Heading 1</h1><p>Paragraph with <span style="color: red;">colored text</span> and <code>inline code</code>.</p><blockquote>Blockquote text</blockquote>'
                    }
                ];
                
                let currentIndex = 0;
                const insertTestContent = () => {
                    if (currentIndex >= testCases.length) {
                        console.log('All test content inserted successfully');
                        return;
                    }
                    
                    const testCase = testCases[currentIndex];
                    console.log(`Inserting test case: ${testCase.name}`);
                    
                    const range = this.quill.getSelection(true) || { index: this.quill.getLength(), length: 0 };
                    
                    // Add a separator
                    this.quill.insertText(range.index, `\n--- ${testCase.name} ---\n`, 'user');
                    
                    // Insert test HTML content
                    this.quill.clipboard.dangerouslyPasteHTML(range.index + 3, testCase.html, 'user');
                    
                    // Add another separator
                    this.quill.insertText(this.quill.getLength(), '\n\n', 'user');
                    
                    currentIndex++;
                    
                    // Insert next test case after a short delay
                    setTimeout(insertTestContent, 500);
                };
                
                insertTestContent();
            };

            // Method to help users understand copy-paste functionality
            this.showCopyPasteHelp = () => {
                const helpModal = document.createElement('div');
                helpModal.style.cssText = `
                    position: fixed; top: 0; left: 0; width: 100%; height: 100%;
                    background: rgba(0,0,0,0.5); z-index: 10000; display: flex;
                    align-items: center; justify-content: center;
                `;
                
                helpModal.innerHTML = `
                    <div style="background: white; padding: 20px; border-radius: 8px; max-width: 80%; max-height: 80%; overflow-y: auto;">
                        <h3>Copy-Paste Help & Tips</h3>
                        <div style="margin-bottom: 15px;">
                            <h4>Enhanced Copy-Paste Features:</h4>
                            <ul style="margin-left: 20px;">
                                <li><strong>HTML Content:</strong> Preserves formatting from web pages, Google Docs, etc.</li>
                                <li><strong>RTF Content:</strong> Handles content from Microsoft Word and other Office applications</li>
                                <li><strong>Plain Text:</strong> Maintains line breaks and basic structure</li>
                                <li><strong>Images:</strong> Supports pasting images from clipboard</li>
                            </ul>
                        </div>
                        <div style="margin-bottom: 15px;">
                            <h4>How to Use:</h4>
                            <ol style="margin-left: 20px;">
                                <li>Copy content from any source (web, Word, etc.)</li>
                                <li>Paste directly into the editor using Ctrl+V (or Cmd+V on Mac)</li>
                                <li>The editor will automatically detect the content type and preserve formatting</li>
                                <li>Use the "Test Copy-Paste" button to see examples</li>
                                <li>Enable debug panel to see what's happening during operations</li>
                            </ol>
                        </div>
                        <div style="margin-bottom: 15px;">
                            <h4>Troubleshooting:</h4>
                            <ul style="margin-left: 20px;">
                                <li>If formatting is lost, try copying again from the source</li>
                                <li>Some complex formatting may be simplified for email compatibility</li>
                                <li>Use the "Show Content" button to see how your content is stored</li>
                            </ul>
                        </div>
                        <button onclick="this.parentElement.parentElement.remove()" style="padding: 8px 16px; background: #007aff; color: white; border: none; border-radius: 4px; cursor: pointer;">Got it!</button>
                    </div>
                `;
                
                document.body.appendChild(helpModal);
                
                // Close modal when clicking outside
                helpModal.addEventListener('click', (e) => {
                    if (e.target === helpModal) {
                        helpModal.remove();
                    }
                });
            };

            // Helper method to clean HTML before pasting
            this.cleanHtmlForPaste = (html) => {
                if (!html) return '';
                
                // Create a temporary div to parse and clean HTML
                const tempDiv = document.createElement('div');
                tempDiv.innerHTML = html;
                
                // Remove unwanted tags and attributes
                const unwantedTags = ['script', 'style', 'meta', 'link', 'title', 'head', 'html', 'body'];
                unwantedTags.forEach(tag => {
                    const elements = tempDiv.getElementsByTagName(tag);
                    Array.from(elements).forEach(el => el.remove());
                });
                
                // Clean up common formatting issues
                const cleanHtml = tempDiv.innerHTML
                    .replace(/<o:p[^>]*>/g, '') // Remove Office-specific tags
                    .replace(/<\/o:p>/g, '')
                    .replace(/<w:[^>]*>/g, '') // Remove Word-specific tags
                    .replace(/<\/w:[^>]*>/g, '')
                    .replace(/<m:[^>]*>/g, '') // Remove MathML tags
                    .replace(/<\/m:[^>]*>/g, '')
                    .replace(/<v:[^>]*>/g, '') // Remove VML tags
                    .replace(/<\/v:[^>]*>/g, '')
                    .replace(/<st1:[^>]*>/g, '') // Remove SharePoint tags
                    .replace(/<\/st1:[^>]*>/g, '')
                    .replace(/<!--[\s\S]*?-->/g, '') // Remove comments
                    .replace(/\s+/g, ' ') // Normalize whitespace
                    .trim();
                
                return cleanHtml;
            };

            // Helper method to handle RTF content
            this.handleRtfPaste = (rtf, event) => {
                try {
                    // For now, convert RTF to plain text and paste
                    // In a full implementation, you might want to use an RTF parser
                    const range = this.quill.getSelection(true) || { index: this.quill.getLength(), length: 0 };
                    
                    // Extract plain text from RTF (basic implementation)
                    const plainText = rtf.replace(/\\[a-z]+\d*[ -]?/g, '') // Remove RTF commands
                                        .replace(/\{|\}/g, '') // Remove braces
                                        .replace(/\\'/g, "'") // Convert escaped quotes
                                        .replace(/\\"/g, '"') // Convert escaped quotes
                                        .replace(/\\\n/g, '\n') // Convert line breaks
                                        .replace(/\\\r/g, '\r') // Convert carriage returns
                                        .replace(/\\\t/g, '\t') // Convert tabs
                                        .trim();
                    
                    // Insert the cleaned text
                    this.quill.insertText(range.index, plainText, 'user');
                    this.quill.setSelection(range.index + plainText.length, 0, 'user');
                    
                } catch (error) {
                    console.warn('RTF paste failed, falling back to plain text:', error);
                    // Fallback to plain text
                    const text = event.clipboardData.getData('text/plain');
                    if (text) {
                        const range = this.quill.getSelection(true) || { index: this.quill.getLength(), length: 0 };
                        this.quill.insertText(range.index, text, 'user');
                        this.quill.setSelection(range.index + text.length, 0, 'user');
                    }
                }
            };

        } catch (e) {
            console.warn('Rich editor init failed', e);
        }
    }

    getEditorPlainText() {
        try { return (this.quill ? this.quill.getText() : (document.getElementById('emailContent')?.value || ''))?.trim(); } catch (_) { return ''; }
    }
    getEditorHtml(rowMap = {}) {
        try {
            const html = this.quill ? (this.quill.root.innerHTML || '') : (document.getElementById('emailContent')?.value || '');
            return this.processContent(html, rowMap, false);
        } catch (_) { return ''; }
    }

    // Get editor content in different formats for debugging
    getEditorContentDebug() {
        if (!this.quill) return { error: 'Quill editor not initialized' };
        
        try {
            return {
                text: this.quill.getText(),
                html: this.quill.root.innerHTML,
                delta: this.quill.getContents(),
                selection: this.quill.getSelection(),
                length: this.quill.getLength()
            };
        } catch (e) {
            return { error: e.message };
        }
    }

    // Method to clear editor content
    clearEditor() {
        if (this.quill) {
            this.quill.setText('');
        }
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
                if (this.quill) {
                    const range = this.quill.getSelection(true) || { index: this.quill.getLength(), length: 0 };
                    this.quill.insertText(range.index, ins, 'user');
                    this.quill.setSelection(range.index + ins.length, 0, 'user');
                } else {
                    const ta = document.getElementById('emailContent');
                    if (ta) {
                        const start = ta.selectionStart || ta.value.length;
                        ta.value = ta.value.slice(0, start) + ins + ta.value.slice(start);
                    }
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

        // Google Sign-in button
        const googleSignInTopBtn = document.getElementById('googleSignInTopBtn');
        
        if (googleSignInTopBtn) {
            googleSignInTopBtn.addEventListener('click', () => {
                // Open the Google sign-in modal instead of direct authentication
                this.showGoogleSignInModal();
            });
        }

		// Google Logout button
		const googleLogoutBtn = document.getElementById('googleLogoutBtn');
		if (googleLogoutBtn) {
			googleLogoutBtn.addEventListener('click', async () => {
				try {
					googleLogoutBtn.disabled = true;
					googleLogoutBtn.textContent = 'Logging out...';
					
					// Call logout API
					if (window.electronAPI?.logout) {
						await window.electronAPI.logout();
					}
					
					// Handle logout locally
					this.onLogout();
					
				} catch (error) {
					console.error('Logout error:', error);
					this.showError('Logout failed: ' + error.message);
				} finally {
					googleLogoutBtn.disabled = false;
					googleLogoutBtn.textContent = 'Logout';
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

        const startCampaignBtn = document.getElementById('startCampaignBtn');
        if (startCampaignBtn) {
            console.log('Start campaign button found, adding listener');
            startCampaignBtn.addEventListener('click', () => this.startCampaign());
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

        // Test copy-paste functionality
        const testCopyPasteBtn = document.getElementById('testCopyPasteBtn');
        if (testCopyPasteBtn) {
            testCopyPasteBtn.addEventListener('click', () => this.testCopyPaste());
        }

        // Toggle debug panel
        const toggleDebugBtn = document.getElementById('toggleDebugBtn');
        if (toggleDebugBtn) {
            toggleDebugBtn.addEventListener('click', () => this.toggleDebugDetails());
        }

        // Show current editor content
        const showContentBtn = document.getElementById('showContentBtn');
        if (showContentBtn) {
            showContentBtn.addEventListener('click', () => this.showCurrentContent());
        }

        // Enable/disable debug panel
        const enableDebugPanel = document.getElementById('enableDebugPanel');
        if (enableDebugPanel) {
            enableDebugPanel.addEventListener('change', (e) => {
                this.toggleDebugPanel(e.target.checked);
            });
        }

        // Copy-paste help
        const copyPasteHelpBtn = document.getElementById('copyPasteHelpBtn');
        if (copyPasteHelpBtn) {
            copyPasteHelpBtn.addEventListener('click', () => this.showCopyPasteHelp());
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

    async sendBulkEmails(campaign) {
        const headers = this.sheetData.headers;
        const rows = this.sheetData.rows;
        const emailHeader = this.findEmailColumn();
        if (!emailHeader) throw new Error('No Email column found');
        const emailIndex = headers.indexOf(emailHeader);

        const totalRecipients = rows.length;
        let sent = 0;
        let failed = 0;

        this.showLoading(`Sending emails... (0/${totalRecipients})`);

        const allowRow = this.getRowFilter();

        for (let i = 0; i < totalRecipients; i += campaign.batchSize) {
            const batch = rows.slice(i, i + campaign.batchSize);
            for (let r = 0; r < batch.length; r++) {
                const row = batch[r];
                const globalIdx = i + r;
                if (!allowRow(row, globalIdx, headers)) continue;
                const to = row[emailIndex];
                if (!to || !this.isValidEmail(to)) { failed++; continue; }
                try {
                    await this.sendSingleEmail(campaign, headers, row, globalIdx);
                    sent++;
                } catch (error) {
                    failed++;
                    console.error(`Failed to send to ${to}:`, error);
                }
                this.showLoading(`Sending emails... (${sent}/${totalRecipients})`);
                const jitter = Math.floor(Math.random() * 2000);
                await new Promise(resolve => setTimeout(resolve, campaign.delay * 1000 + jitter));
            }
        }

        campaign.status = 'completed';
        campaign.endTime = new Date();
        this.hideLoading();
        this.showSuccess(`Campaign completed! Sent: ${sent}, Failed: ${failed}`);
        this.updateStatistics(sent, failed);
        this.saveCampaignHistory(campaign, sent, failed);
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
        const result = await window.electronAPI.sendEmail({ 
            to, 
            subject: campaign.subject, 
            content, 
            html: finalHtml, 
            from, 
            attachmentsPaths: this.attachmentsPaths 
        });
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
        const fields = ['campaignName', 'campaignSubject', 'fromName', 'emailContent'];
        fields.forEach(fieldId => {
            const field = document.getElementById(fieldId);
            if (field) field.value = '';
        });

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
            if (this.quill) { this.quill.root.innerHTML = html; this.showSuccess('Preset inserted'); return; }
            const ta = document.getElementById('emailContent'); if (ta) { ta.value = html; this.showSuccess('Preset inserted'); }
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
                document.getElementById('campaignSubject').value = tpl.subject || '';
                if (this.quill) { this.quill.root.innerHTML = (tpl.html || this.escapeHtml(tpl.content || '').replace(/\n/g,'<br/>')); }
                else { const ta = document.getElementById('emailContent'); if (ta) ta.value = tpl.content || ''; }
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
                document.getElementById('campaignSubject').value = tpl.subject || '';
                if (this.quill) { this.quill.root.innerHTML = (tpl.html || this.escapeHtml(tpl.content || '').replace(/\n/g,'<br/>')); }
                else { const ta = document.getElementById('emailContent'); if (ta) ta.value = tpl.content || ''; }
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

    showGoogleSignInModal() {
        document.getElementById('googleSignInModal').style.display = 'block';
    }

    // Handle authentication success
    onAuthenticationSuccess(email) {
        console.log('Authentication successful:', email);
        this.isAuthenticated = true;
        this.currentAccount = email;
        
        // Update UI
        const googleSignInTopBtn = document.getElementById('googleSignInTopBtn');
        if (googleSignInTopBtn) {
            googleSignInTopBtn.style.background = '#34c759';
            googleSignInTopBtn.style.color = '#fff';
            googleSignInTopBtn.textContent = email || 'Signed in';
        }
        
        // Show logout button
        const logoutBtn = document.getElementById('googleLogoutBtn');
        if (logoutBtn) logoutBtn.style.display = 'inline-block';
        
        // Close modal
        document.getElementById('googleSignInModal').style.display = 'none';
        
        // Show success message
        this.showSuccess('Successfully signed in with Google!');
    }
    
    // Listen for authentication events from main process
    initAuthListeners() {
        if (window.electronAPI) {
            window.electronAPI.on('auth-success', (data) => {
                this.onAuthenticationSuccess(data.email);
            });
            
            window.electronAPI.on('auth-logout', () => {
                this.onLogout();
            });
        }
    }
    
    // Handle logout
    onLogout() {
        this.isAuthenticated = false;
        this.currentAccount = null;
        
        // Update UI
        const googleSignInTopBtn = document.getElementById('googleSignInTopBtn');
        if (googleSignInTopBtn) {
            googleSignInTopBtn.style.background = '#fff';
            googleSignInTopBtn.style.color = '#2c2c2e';
            googleSignInTopBtn.textContent = 'Sign in with Google';
        }
        
        // Hide logout button
        const logoutBtn = document.getElementById('googleLogoutBtn');
        if (logoutBtn) logoutBtn.style.display = 'none';
        
        this.showSuccess('Successfully signed out');
    }



}

// Initialize app when DOM is loaded
document.addEventListener('DOMContentLoaded', () => {
    console.log('DOM loaded, initializing RTX App...');
    if (!window.rtxApp) window.rtxApp = new RTXApp();
}); 