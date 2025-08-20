// Import CSS files
import '../styles/main.css';
import '../styles/animations.css';
import '../styles/components.css';

console.log('🚀 CSS files imported successfully');
console.log('🚀 app.js is loading...');

// RTX Innovations - AutoMailer Pro
class RTXApp {
    constructor() {
        // Initialize properties
        this.isAuthenticated = false;
        this.sheetData = null;
        this.currentSignature = '';
        this.campaignAttachments = [];
        this.currentScrapingSession = null;
        this.scrapedData = [];
        this.chromeExtensionInstalled = false;
        this.chromeExtensionId = 'salesql-scraper'; // Fixed extension ID
        this.previewUpdateTimeout = null;
        this.placeholderDropdown = null;
        
        // Initialize the app
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
        this.initializeLivePreview();
        this.initializePlaceholderSystem();
        this.loadTemplatesFromStore();
        console.log('✅ RTX Innovations AutoMailer Pro initialized successfully!');
        
        // Show a success message on the page
        this.showSuccess('AutoMailer Pro loaded successfully!');

        // Update and version wiring
        this.wireAutoUpdates();
    }

    updateAttachmentRequirement() {
        try {
            const checkbox = document.getElementById('sendWithoutAttachments');
            const attachmentStatus = document.getElementById('attachmentStatus');
            
            if (checkbox && attachmentStatus) {
                if (checkbox.checked) {
                    attachmentStatus.textContent = 'Optional';
                    attachmentStatus.style.color = '#FF9500';
                } else {
                    attachmentStatus.textContent = 'Required';
                    attachmentStatus.style.color = '#34C759';
                }
            }
            
            console.log('✅ Attachment requirement updated');
        } catch (error) {
            console.error('❌ Failed to update attachment requirement:', error);
        }
    }

    // Template management functions
    async saveCurrentTemplate() {
        try {
            const templateName = await this.showTemplateNameModal();
            if (!templateName || templateName.trim() === '') {
                this.showWarning('Template name cannot be empty');
                return;
            }

            // Check if template name already exists
            const existingTemplate = this.templates?.find(t => t.name.toLowerCase() === templateName.toLowerCase());
            if (existingTemplate) {
                const overwrite = await this.showConfirmModal(`Template "${templateName}" already exists. Do you want to overwrite it?`);
                if (!overwrite) return;
            }

            // Prepare template data
            const templateData = {
                name: templateName,
                subject: document.getElementById('campaignSubject')?.value || '',
                content: this.getEditorPlainText(),
                html: this.getEditorHtml(),
                fromName: document.getElementById('fromName')?.value || '',
                attachments: this.campaignAttachments,
                timestamp: Date.now()
            };

            console.log('💾 Saving template:', templateData.name);

            // Save template to disk
            const result = await window.electronAPI.saveTemplateJson?.(templateName, templateData);
            if (result?.success) {
                // Update local templates list
                const newTemplate = {
                    id: result.path,
                    name: templateData.name,
                    ...templateData,
                    source: 'disk',
                    lastModified: Date.now()
                };

                // Remove old template if it existed
                if (this.templates) {
                    this.templates = this.templates.filter(t => t.id !== result.path);
                } else {
                    this.templates = [];
                }

                // Add new template at the beginning
                this.templates.unshift(newTemplate);

                // Update UI
                this.renderTemplatesSelect();
                this.showSuccess(`Template "${templateName}" saved successfully!`);
                
                console.log('✅ Template saved successfully');
            } else {
                this.showError('Failed to save template: ' + (result?.error || 'Unknown error'));
            }
        } catch (error) {
            console.error('❌ Failed to save template:', error);
            this.showError('Failed to save template: ' + error.message);
        }
    }

    async loadSelectedTemplate() {
        try {
            const select = document.getElementById('templateSelect');
            if (!select || !select.value) {
                this.showWarning('Please select a template to load');
                return;
            }

            const templateId = select.value;
            const template = this.templates?.find(t => t.id === templateId);
            
            if (!template) {
                this.showError('Selected template not found');
                return;
            }

            // Load template data into form
            if (template.subject) {
                const subjectInput = document.getElementById('campaignSubject');
                if (subjectInput) subjectInput.value = template.subject;
            }

            if (template.content) {
                const editor = document.getElementById('emailEditor');
                if (editor) {
                    editor.innerHTML = template.html || template.content;
                }
            }

            if (template.fromName) {
                const fromNameInput = document.getElementById('fromName');
                if (fromNameInput) fromNameInput.value = template.fromName;
            }

            // Load attachments if any
            if (template.attachments && Array.isArray(template.attachments)) {
                this.campaignAttachments = [...template.attachments];
                this.renderCampaignAttachments();
            }

            this.showSuccess(`Template "${template.name}" loaded successfully!`);
            console.log('✅ Template loaded successfully');
        } catch (error) {
            console.error('❌ Failed to load template:', error);
            this.showError('Failed to load template: ' + error.message);
        }
    }

    async deleteSelectedTemplate() {
        try {
            const select = document.getElementById('templateSelect');
            if (!select || !select.value) {
                this.showWarning('Please select a template to delete');
                return;
            }

            const templateId = select.value;
            const template = this.templates?.find(t => t.id === templateId);
            
            if (!template) {
                this.showError('Selected template not found');
                return;
            }

            const confirm = await this.showConfirmModal(`Are you sure you want to delete template "${template.name}"? This action cannot be undone.`);
            if (!confirm) return;

            // Delete template from disk
            const result = await window.electronAPI.deleteTemplateJson?.(templateId);
            if (result?.success) {
                // Remove from local list
                this.templates = this.templates.filter(t => t.id !== templateId);
                
                // Update UI
                this.renderTemplatesSelect();
                this.showSuccess(`Template "${template.name}" deleted successfully!`);
                
                console.log('✅ Template deleted successfully');
            } else {
                this.showError('Failed to delete template: ' + (result?.error || 'Unknown error'));
            }
        } catch (error) {
            console.error('❌ Failed to delete template:', error);
            this.showError('Failed to delete template: ' + error.message);
        }
    }

    async insertPresetTemplate() {
        try {
            const select = document.getElementById('presetTemplateSelect');
            if (!select || !select.value) {
                this.showWarning('Please select a preset template to insert');
                return;
            }

            const presetId = select.value;
            const preset = this.presetTemplates?.find(p => p.id === presetId);
            
            if (!preset) {
                this.showError('Selected preset template not found');
                return;
            }

            // Insert preset content into editor
            const editor = document.getElementById('emailEditor');
            if (editor && preset.content) {
                editor.innerHTML = preset.content;
                this.showSuccess(`Preset template "${preset.name}" inserted successfully!`);
                console.log('✅ Preset template inserted successfully');
            }
        } catch (error) {
            console.error('❌ Failed to insert preset template:', error);
            this.showError('Failed to insert preset template: ' + error.message);
        }
    }

    // Helper functions for templates
    async showTemplateNameModal() {
        return new Promise((resolve) => {
            // Create modal container
            const modal = document.createElement('div');
            modal.style.cssText = `
                position: fixed;
                top: 0;
                left: 0;
                width: 100%;
                height: 100%;
                background: rgba(0, 0, 0, 0.5);
                display: flex;
                justify-content: center;
                align-items: center;
                z-index: 10000;
            `;

            // Create modal content
            const modalContent = document.createElement('div');
            modalContent.style.cssText = `
                background: white;
                padding: 30px;
                border-radius: 8px;
                box-shadow: 0 4px 20px rgba(0, 0, 0, 0.3);
                max-width: 400px;
                width: 90%;
            `;

            modalContent.innerHTML = `
                <h3 style="margin: 0 0 20px 0; color: #333;">Save Template</h3>
                <p style="margin: 0 0 20px 0; color: #666;">Enter a name for your template:</p>
                <input type="text" id="templateNameInput" placeholder="Template name" style="
                    width: 100%;
                    padding: 12px;
                    border: 1px solid #ddd;
                    border-radius: 4px;
                    font-size: 16px;
                    margin-bottom: 20px;
                    box-sizing: border-box;
                ">
                <div style="display: flex; gap: 10px; justify-content: flex-end;">
                    <button id="cancelTemplateBtn" style="
                        padding: 10px 20px;
                        border: 1px solid #ddd;
                        background: white;
                        border-radius: 4px;
                        cursor: pointer;
                        font-size: 14px;
                    ">Cancel</button>
                    <button id="saveTemplateBtn" style="
                        padding: 10px 20px;
                        background: #007AFF;
                        color: white;
                        border: none;
                        border-radius: 4px;
                        cursor: pointer;
                        font-size: 14px;
                    ">Save</button>
                </div>
            `;

            // Add event listeners
            const input = modalContent.querySelector('#templateNameInput');
            const cancelBtn = modalContent.querySelector('#cancelTemplateBtn');
            const saveBtn = modalContent.querySelector('#saveTemplateBtn');

            input.focus();

            const cleanup = () => {
                modal.remove();
            };

            cancelBtn.addEventListener('click', () => {
                cleanup();
                resolve(null);
            });

            saveBtn.addEventListener('click', () => {
                const name = input.value.trim();
                cleanup();
                resolve(name);
            });

            input.addEventListener('keypress', (e) => {
                if (e.key === 'Enter') {
                    const name = input.value.trim();
                    cleanup();
                    resolve(name);
                }
            });

            // Add to body
            document.body.appendChild(modal);
        });
    }

    async showConfirmModal(message) {
        return new Promise((resolve) => {
            // Create modal container
            const modal = document.createElement('div');
            modal.style.cssText = `
                position: fixed;
                top: 0;
                left: 0;
                width: 100%;
                height: 100%;
                background: rgba(0, 0, 0, 0.5);
                display: flex;
                justify-content: center;
                align-items: center;
                z-index: 10000;
            `;

            // Create modal content
            const modalContent = document.createElement('div');
            modalContent.style.cssText = `
                background: white;
                padding: 30px;
                border-radius: 8px;
                box-shadow: 0 4px 20px rgba(0, 0, 0, 0.3);
                max-width: 400px;
                width: 90%;
            `;

            modalContent.innerHTML = `
                <h3 style="margin: 0 0 20px 0; color: #333;">Confirm Action</h3>
                <p style="margin: 0 0 20px 0; color: #666;">${message}</p>
                <div style="display: flex; gap: 10px; justify-content: flex-end;">
                    <button id="cancelConfirmBtn" style="
                        padding: 10px 20px;
                        border: 1px solid #ddd;
                        background: white;
                        border-radius: 4px;
                        cursor: pointer;
                        font-size: 14px;
                    ">Cancel</button>
                    <button id="confirmBtn" style="
                        padding: 10px 20px;
                        background: #FF3B30;
                        color: white;
                        border: none;
                        border-radius: 4px;
                        cursor: pointer;
                        font-size: 14px;
                    ">Confirm</button>
                </div>
            `;

            // Add event listeners
            const cancelBtn = modalContent.querySelector('#cancelConfirmBtn');
            const confirmBtn = modalContent.querySelector('#confirmBtn');

            const cleanup = () => {
                modal.remove();
            };

            cancelBtn.addEventListener('click', () => {
                cleanup();
                resolve(false);
            });

            confirmBtn.addEventListener('click', () => {
                cleanup();
                resolve(true);
            });

            // Add to body
            document.body.appendChild(modal);
        });
    }

    renderTemplatesSelect() {
        try {
            const select = document.getElementById('templateSelect');
            if (!select) return;

            // Clear existing options
            select.innerHTML = '<option value="">Select a template...</option>';

            if (!this.templates || this.templates.length === 0) {
                const option = document.createElement('option');
                option.value = '';
                option.textContent = 'No templates available';
                option.disabled = true;
                select.appendChild(option);
                return;
            }

            // Add template options
            this.templates.forEach(template => {
                const option = document.createElement('option');
                option.value = template.id;
                option.textContent = `${template.name} (${template.source === 'disk' ? 'Saved' : 'Recent'})`;
                select.appendChild(option);
            });

            console.log(`✅ Rendered ${this.templates.length} template options`);
        } catch (error) {
            console.error('❌ Failed to render template select:', error);
        }
    }

    renderPresetTemplates() {
        try {
            const select = document.getElementById('presetTemplateSelect');
            if (!select) return;

            // Clear existing options
            select.innerHTML = '<option value="">Select a preset template...</option>';

            const presetTemplates = [
                { id: 'welcome', name: 'Welcome Email', content: '<h2>Welcome!</h2><p>Thank you for joining us...</p>' },
                { id: 'followup', name: 'Follow-up Email', content: '<h2>Following Up</h2><p>I wanted to follow up on our conversation...</p>' },
                { id: 'meeting', name: 'Meeting Request', content: '<h2>Meeting Request</h2><p>I would like to schedule a meeting...</p>' }
            ];

            presetTemplates.forEach(preset => {
                const option = document.createElement('option');
                option.value = preset.id;
                option.textContent = preset.name;
                select.appendChild(option);
            });

            this.presetTemplates = presetTemplates;
            console.log('✅ Preset templates rendered');
        } catch (error) {
            console.error('❌ Failed to render preset templates:', error);
        }
    }

    // Notification helper functions
    showSuccess(message) {
        this.showNotification(message, 'success');
    }

    showError(message) {
        this.showNotification(message, 'error');
    }

    showWarning(message) {
        this.showNotification(message, 'warning');
    }

    showInfo(message) {
        this.showNotification(message, 'info');
    }

    showNotification(message, type = 'info') {
        try {
            // Remove existing notifications
            const existingNotifications = document.querySelectorAll('.notification');
            existingNotifications.forEach(n => n.remove());

            // Create notification element
            const notification = document.createElement('div');
            notification.className = `notification notification-${type}`;
            notification.textContent = message;
            notification.style.cssText = `
                position: fixed;
                top: 20px;
                right: 20px;
                padding: 16px 20px;
                border-radius: 8px;
                color: white;
                font-weight: 600;
                z-index: 10000;
                transform: translateX(100%);
                transition: transform 0.3s ease;
                max-width: 400px;
                word-wrap: break-word;
            `;

            // Set background color based on type
            switch (type) {
                case 'success':
                    notification.style.background = '#34C759';
                    break;
                case 'error':
                    notification.style.background = '#FF3B30';
                    break;
                case 'warning':
                    notification.style.background = '#FF9500';
                    break;
                case 'info':
                default:
                    notification.style.background = '#007AFF';
                    break;
            }

            // Add to body
            document.body.appendChild(notification);

            // Show notification
            setTimeout(() => {
                notification.classList.add('show');
            }, 100);

            // Auto-hide after 10 seconds
            setTimeout(() => {
                notification.classList.remove('show');
                setTimeout(() => {
                    if (notification.parentNode) {
                        notification.remove();
                    }
                }, 300);
            }, 10000);

            // Hover to keep visible
            let hideTimeout;
            notification.addEventListener('mouseenter', () => {
                clearTimeout(hideTimeout);
            });

            notification.addEventListener('mouseleave', () => {
                hideTimeout = setTimeout(() => {
                    notification.classList.remove('show');
                    setTimeout(() => {
                        if (notification.parentNode) {
                            notification.remove();
                        }
                    }, 300);
                }, 10000);
            });

            console.log(`✅ Notification shown: ${type} - ${message}`);
        } catch (error) {
            console.error('❌ Failed to show notification:', error);
        }
    }

    // Campaign attachment functions
    addCampaignAttachment() {
        try {
            // Create file input
            const fileInput = document.createElement('input');
            fileInput.type = 'file';
            fileInput.multiple = true;
            fileInput.accept = '*/*';

            fileInput.addEventListener('change', (e) => {
                const files = Array.from(e.target.files);
                files.forEach(file => {
                    this.campaignAttachments.push({
                        name: file.name,
                        path: file.path,
                        size: file.size,
                        type: file.type
                    });
                });
                this.renderCampaignAttachments();
                this.showSuccess(`${files.length} attachment(s) added`);
            });

            fileInput.click();
        } catch (error) {
            console.error('❌ Failed to add campaign attachment:', error);
            this.showError('Failed to add attachment: ' + error.message);
        }
    }

    removeAllCampaignAttachments() {
        try {
            if (this.campaignAttachments.length === 0) {
                this.showWarning('No attachments to remove');
                return;
            }

            this.campaignAttachments = [];
            this.renderCampaignAttachments();
            this.showSuccess('All attachments removed');
        } catch (error) {
            console.error('❌ Failed to remove campaign attachments:', error);
            this.showError('Failed to remove attachments: ' + error.message);
        }
    }

    renderCampaignAttachments() {
        try {
            const container = document.getElementById('campaignAttachments');
            if (!container) return;

            if (this.campaignAttachments.length === 0) {
                container.innerHTML = `
                    <div style="text-align: center; color: #8E8E93;">
                        <i class="fas fa-paperclip" style="font-size: 20px; margin-bottom: 8px; display: block;"></i>
                        <p>No attachments selected</p>
                        <small style="font-size: 11px; color: #c7c7cc;">Attachments are required by default</small>
                    </div>
                `;
                return;
            }

            let html = '<div style="display: flex; flex-direction: column; gap: 8px;">';
            this.campaignAttachments.forEach((attachment, index) => {
                html += `
                    <div style="display: flex; align-items: center; justify-content: space-between; padding: 8px; background: white; border: 1px solid #e5e5e7; border-radius: 4px;">
                        <div style="display: flex; align-items: center; gap: 8px;">
                            <i class="fas fa-paperclip" style="color: #8E8E93;"></i>
                            <span style="font-size: 14px;">${attachment.name}</span>
                            <small style="color: #8E8E93;">(${this.formatFileSize(attachment.size)})</small>
                        </div>
                        <button onclick="window.rtxApp.removeCampaignAttachment(${index})" style="background: none; border: none; color: #FF3B30; cursor: pointer; padding: 4px 8px;">
                            <i class="fas fa-times"></i>
                        </button>
                    </div>
                `;
            });
            html += '</div>';

            container.innerHTML = html;
        } catch (error) {
            console.error('❌ Failed to render campaign attachments:', error);
        }
    }

    removeCampaignAttachment(index) {
        try {
            if (index >= 0 && index < this.campaignAttachments.length) {
                const removed = this.campaignAttachments.splice(index, 1)[0];
                this.renderCampaignAttachments();
                this.showSuccess(`Attachment "${removed.name}" removed`);
            }
        } catch (error) {
            console.error('❌ Failed to remove campaign attachment:', error);
            this.showError('Failed to remove attachment: ' + error.message);
        }
    }

    formatFileSize(bytes) {
        if (bytes === 0) return '0 Bytes';
        const k = 1024;
        const sizes = ['Bytes', 'KB', 'MB', 'GB'];
        const i = Math.floor(Math.log(bytes) / Math.log(k));
        return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
    }

    // Debounced preview update
    debouncePreviewUpdate() {
        if (this.previewUpdateTimeout) {
            clearTimeout(this.previewUpdateTimeout);
        }
        this.previewUpdateTimeout = setTimeout(() => {
            this.refreshEmailPreview();
        }, 500);
    }

    // Utility functions
    escapeHtml(text) {
        if (!text) return '';
        const div = document.createElement('div');
        div.textContent = text;
        return div.innerHTML;
    }

    escapeRegExp(string) {
        return string.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
    }

    // Email preview functions
    refreshEmailPreview() {
        try {
            const previewContainer = document.getElementById('emailPreview');
            if (!previewContainer) return;

            const subject = document.getElementById('campaignSubject')?.value || '';
            const content = this.getEditorHtml();
            const fromName = document.getElementById('fromName')?.value || '';

            if (!subject && !content) {
                previewContainer.innerHTML = `
                    <div style="text-align: center; color: #8E8E93; padding: 40px 20px;">
                        <i class="fas fa-eye" style="font-size: 32px; margin-bottom: 16px; display: block;"></i>
                        <p>Preview will appear here after you fill in the campaign details</p>
                        <small>Click "Refresh Preview" to update the preview with current content</small>
                    </div>
                `;
                return;
            }

            let previewHTML = '';
            
            if (fromName) {
                previewHTML += `<div style="margin-bottom: 16px;"><strong>From:</strong> ${this.escapeHtml(fromName)}</div>`;
            }
            
            if (subject) {
                previewHTML += `<div style="margin-bottom: 16px;"><strong>Subject:</strong> ${this.escapeHtml(subject)}</div>`;
            }
            
            if (content) {
                previewHTML += `<div style="margin-bottom: 16px;"><strong>Content:</strong></div>`;
                previewHTML += `<div style="border: 1px solid #e5e5e7; border-radius: 6px; padding: 16px; background: #f8f9fa;">${content}</div>`;
            }

            previewContainer.innerHTML = previewHTML;
        } catch (error) {
            console.error('❌ Failed to refresh email preview:', error);
        }
    }

    // SalesQL Scraper functions
    showSalesqlScraperModal() {
        try {
            const modal = document.getElementById('salesqlScraperModal');
            if (modal) {
                modal.style.display = 'block';
                this.initializeSalesqlScraper();
            }
        } catch (error) {
            console.error('❌ Failed to show SalesQL scraper modal:', error);
        }
    }

    hideModal(modalId) {
        try {
            const modal = document.getElementById(modalId);
            if (modal) {
                modal.style.display = 'none';
            }
        } catch (error) {
            console.error('❌ Failed to hide modal:', error);
        }
    }

    initializeSalesqlScraper() {
        try {
            // Initialize scraper controls
            this.updateScrapingStatus('Ready to scrape');
            this.enableScrapingControls();
            
            // Check if Chrome extension is installed
            this.checkChromeExtensionStatus();
            
            console.log('✅ SalesQL scraper initialized');
        } catch (error) {
            console.error('❌ Failed to initialize SalesQL scraper:', error);
        }
    }

    updateScrapingStatus(status) {
        try {
            const statusText = document.getElementById('scrapingStatusText');
            if (statusText) {
                statusText.textContent = status;
            }
        } catch (error) {
            console.error('❌ Failed to update scraping status:', error);
        }
    }

    enableScrapingControls() {
        try {
            const startBtn = document.getElementById('startScrapingBtn');
            const stopBtn = document.getElementById('stopScrapingBtn');
            const exportBtn = document.getElementById('exportScrapedDataBtn');
            const enhancedExportBtn = document.getElementById('enhancedExportBtn');
            const enhancedSheetsBtn = document.getElementById('enhancedSheetsBtn');
            const taskforceBtn = document.getElementById('taskforceBtn');

            if (startBtn) startBtn.disabled = false;
            if (stopBtn) stopBtn.disabled = true;
            if (exportBtn) exportBtn.disabled = true;
            if (enhancedExportBtn) enhancedExportBtn.disabled = true;
            if (enhancedSheetsBtn) enhancedSheetsBtn.disabled = true;
            if (taskforceBtn) taskforceBtn.disabled = true;
        } catch (error) {
            console.error('❌ Failed to enable scraping controls:', error);
        }
    }

    async checkChromeExtensionStatus() {
        try {
            const extensionPath = await window.electronAPI.getExtensionPath?.('salesql-scraper');
            if (extensionPath) {
                this.chromeExtensionInstalled = true;
                this.updateScrapingStatus('Chrome extension ready');
                this.showInstructions('Chrome extension is installed. You can now start scraping.');
            } else {
                this.chromeExtensionInstalled = false;
                this.updateScrapingStatus('Chrome extension not found');
                this.showInstructions('Chrome extension not found. Please install it first.');
            }
        } catch (error) {
            console.error('❌ Failed to check Chrome extension status:', error);
        }
    }

    showInstructions(instructions) {
        try {
            const container = document.getElementById('scraperInstructions');
            if (container) {
                container.innerHTML = `
                    <div style="background: #f8f9fa; padding: 12px; border-radius: 6px; border: 1px solid #e5e5e7;">
                        <strong>Instructions:</strong>
                        <p style="margin: 8px 0 0 0; font-size: 13px;">${instructions}</p>
                    </div>
                `;
            }
        } catch (error) {
            console.error('❌ Failed to show instructions:', error);
        }
    }

    async startSalesqlScraping() {
        try {
            this.updateScrapingStatus('Starting scraping session...');
            
            const sessionId = `session_${Date.now()}`;
            const result = await window.electronAPI.startScraping?.({ sessionId });
            
            if (result?.success) {
                this.currentScrapingSession = sessionId;
                this.updateScrapingStatus('Scraping started. Use Chrome extension to scrape data.');
                this.showScrapingProgress();
                this.enableScrapingControls();
                
                // Start progress monitoring
                this.monitorScrapingProgress(sessionId);
            } else {
                this.updateScrapingStatus('Failed to start scraping: ' + (result?.error || 'Unknown error'));
            }
        } catch (error) {
            console.error('❌ Failed to start scraping:', error);
            this.updateScrapingStatus('Failed to start scraping: ' + error.message);
        }
    }

    showScrapingProgress() {
        try {
            const progressContainer = document.getElementById('scrapingProgress');
            if (progressContainer) {
                progressContainer.style.display = 'block';
            }
        } catch (error) {
            console.error('❌ Failed to show scraping progress:', error);
        }
    }

    async monitorScrapingProgress(sessionId) {
        try {
            const interval = setInterval(async () => {
                const progress = await window.electronAPI.getScrapingProgress?.(sessionId);
                if (progress?.success) {
                    this.updateScrapingProgress(progress);
                    
                    if (progress.completed) {
                        clearInterval(interval);
                        this.onScrapingCompleted(sessionId, progress);
                    }
                }
            }, 2000);
        } catch (error) {
            console.error('❌ Failed to monitor scraping progress:', error);
        }
    }

    updateScrapingProgress(progress) {
        try {
            const progressText = document.getElementById('scrapingProgressText');
            const progressBar = document.getElementById('scrapingProgressBar');
            
            if (progressText) {
                progressText.textContent = `${progress.currentPage || 0}/${progress.totalPages || 100}`;
            }
            
            if (progressBar) {
                const percentage = progress.totalPages > 0 ? (progress.currentPage / progress.totalPages) * 100 : 0;
                progressBar.style.width = `${percentage}%`;
            }
        } catch (error) {
            console.error('❌ Failed to update scraping progress:', error);
        }
    }

    onScrapingCompleted(sessionId, progress) {
        try {
            this.updateScrapingStatus('Scraping completed!');
            this.showScrapedData(progress.data || []);
            this.enableExportControls();
            
            console.log('✅ Scraping completed:', sessionId);
        } catch (error) {
            console.error('❌ Failed to handle scraping completion:', error);
        }
    }

    showScrapedData(data) {
        try {
            const container = document.getElementById('scrapedDataContainer');
            if (!container) return;

            if (!data || data.length === 0) {
                container.innerHTML = `
                    <div style="text-align: center; color: #8E8E93; margin-top: 40px;">
                        <i class="fas fa-database" style="font-size: 48px; margin-bottom: 16px; display: block;"></i>
                        <p>No data scraped yet. Start scraping to see results here.</p>
                    </div>
                `;
                return;
            }

            let html = '<div style="display: flex; flex-direction: column; gap: 12px;">';
            data.forEach((contact, index) => {
                html += `
                    <div style="border: 1px solid #e5e5e7; border-radius: 6px; padding: 12px; background: #f8f9fa;">
                        <div style="display: grid; grid-template-columns: 1fr 1fr; gap: 8px; font-size: 13px;">
                            <div><strong>Company:</strong> ${this.escapeHtml(contact.company || 'N/A')}</div>
                            <div><strong>Profile:</strong> ${this.escapeHtml(contact.profile || 'N/A')}</div>
                            <div><strong>Email:</strong> ${this.escapeHtml(contact.email || 'N/A')}</div>
                            <div><strong>Phone:</strong> ${this.escapeHtml(contact.phone || 'N/A')}</div>
                            <div><strong>Name:</strong> ${this.escapeHtml(contact.name || 'N/A')}</div>
                            <div><strong>Title:</strong> ${this.escapeHtml(contact.title || 'N/A')}</div>
                        </div>
                    </div>
                `;
            });
            html += '</div>';

            container.innerHTML = html;
        } catch (error) {
            console.error('❌ Failed to show scraped data:', error);
        }
    }

    enableExportControls() {
        try {
            const exportBtn = document.getElementById('exportScrapedDataBtn');
            const enhancedExportBtn = document.getElementById('enhancedExportBtn');
            const enhancedSheetsBtn = document.getElementById('enhancedSheetsBtn');
            const taskforceBtn = document.getElementById('taskforceBtn');

            if (exportBtn) exportBtn.disabled = false;
            if (enhancedExportBtn) enhancedExportBtn.disabled = false;
            if (enhancedSheetsBtn) enhancedSheetsBtn.disabled = false;
            if (taskforceBtn) taskforceBtn.disabled = false;
        } catch (error) {
            console.error('❌ Failed to enable export controls:', error);
        }
    }

    // Export functions
    async exportToCSVEnhanced() {
        try {
            if (!this.scrapedData || this.scrapedData.length === 0) {
                this.showWarning('No data to export');
                return;
            }

            // Create CSV content with proper formatting
            const headers = ['Company', 'Profile', 'Email', 'Phone', 'Name', 'Title', 'LinkedIn', 'Industry', 'Location', 'Scraped At'];
            let csvContent = headers.join(',') + '\n';

            this.scrapedData.forEach(contact => {
                const row = [
                    contact.company || '',
                    contact.profile || '',
                    contact.email || '',
                    contact.phone || '',
                    contact.name || '',
                    contact.title || '',
                    contact.linkedin || '',
                    contact.industry || '',
                    contact.location || '',
                    contact.scrapedAt || new Date().toISOString()
                ];
                csvContent += row.map(field => `"${field.replace(/"/g, '""')}"`).join(',') + '\n';
            });

            // Trigger download
            const blob = new Blob([csvContent], { type: 'text/csv' });
            const url = window.URL.createObjectURL(blob);
            const a = document.createElement('a');
            a.href = url;
            a.download = 'salesql_data_enhanced.csv';
            a.click();
            window.URL.revokeObjectURL(url);

            this.showSuccess('Enhanced CSV exported successfully!');
        } catch (error) {
            console.error('❌ Failed to export enhanced CSV:', error);
            this.showError('Failed to export CSV: ' + error.message);
        }
    }

    async exportToGoogleSheetsEnhanced() {
        try {
            if (!this.scrapedData || this.scrapedData.length === 0) {
                this.showWarning('No data to export');
                return;
            }

            const sheetUrl = document.getElementById('salesqlSheetUrl')?.value;
            if (!sheetUrl) {
                this.showWarning('Please enter a Google Sheets URL');
                return;
            }

            const result = await window.electronAPI.exportToGoogleSheetsEnhanced?.({
                sheetUrl,
                data: this.scrapedData,
                createNewTab: true,
                tabName: `SalesQL_Data_${new Date().toISOString().split('T')[0]}`
            });

            if (result?.success) {
                this.showSuccess(`Data exported to Google Sheets successfully! ${result.rowsAdded} rows added.`);
            } else {
                this.showError('Failed to export to Google Sheets: ' + (result?.error || 'Unknown error'));
            }
        } catch (error) {
            console.error('❌ Failed to export to Google Sheets:', error);
            this.showError('Failed to export to Google Sheets: ' + error.message);
        }
    }

    async exportToTaskforceEnhanced() {
        try {
            if (!this.scrapedData || this.scrapedData.length === 0) {
                this.showWarning('No data to export');
                return;
            }

            // Store data for use in Taskforce app
            const result = await window.electronAPI.storeScrapedDataEnhanced?.({
                sessionId: this.currentScrapingSession,
                data: this.scrapedData,
                metadata: {
                    source: 'SalesQL Scraper',
                    timestamp: Date.now(),
                    count: this.scrapedData.length
                }
            });

            if (result?.success) {
                this.showSuccess(`Data stored for Taskforce app! ${result.contactsStored} contacts ready for campaigns.`);
            } else {
                this.showError('Failed to store data for Taskforce: ' + (result?.error || 'Unknown error'));
            }
        } catch (error) {
            console.error('❌ Failed to export to Taskforce:', error);
            this.showError('Failed to export to Taskforce: ' + error.message);
        }
    }

    async stopSalesqlScraping() {
        try {
            this.updateScrapingStatus('Scraping stopped');
            this.enableScrapingControls();
            
            // Hide progress
            const progressContainer = document.getElementById('scrapingProgress');
            if (progressContainer) {
                progressContainer.style.display = 'none';
            }
            
            console.log('✅ Scraping stopped');
        } catch (error) {
            console.error('❌ Failed to stop scraping:', error);
        }
    }

    // Template loading function
    async loadTemplatesFromStore() {
        try {
            console.log('🔄 Loading templates from store...');
            
            // Load templates from both disk and recent list
            const diskTemplates = await window.electronAPI.listTemplates?.() || [];
            const recentTemplates = (await window.electronAPI.storeGet?.('templates')) || [];
            
            // Merge templates, prioritizing disk templates
            const templateMap = new Map();
            
            // Add disk templates first
            diskTemplates.forEach(t => {
                templateMap.set(t.id, {
                    ...t,
                    source: 'disk',
                    lastModified: t.ts || Date.now()
                });
            });
            
            // Add recent templates (don't overwrite disk templates)
            recentTemplates.forEach(t => {
                if (t && t.id && !templateMap.has(t.id)) {
                    templateMap.set(t.id, {
                        ...t,
                        source: 'recent',
                        lastModified: t.ts || Date.now()
                    });
                }
            });
            
            this.templates = [];
            this.templates = Array.from(templateMap.values());
            
            // Sort by last modified
            this.templates.sort((a, b) => new Date(b.lastModified) - new Date(a.lastModified));
            
            // Update UI
            this.renderTemplatesSelect();
            this.renderPresetTemplates();
            
            console.log(`✅ Loaded ${this.templates.length} templates`);
        } catch (error) {
            console.error('❌ Failed to load templates:', error);
            this.showError('Failed to load templates: ' + error.message);
        }
    }

    // Missing initialization functions
    initializeGlobalInstance() {
        try {
            window.rtxApp = this;
            console.log('✅ Global instance initialized');
        } catch (error) {
            console.error('❌ Failed to initialize global instance:', error);
        }
    }

    initializeLivePreview() {
        try {
            // Set up live preview updates
            const editor = document.getElementById('emailEditor');
            const subjectInput = document.getElementById('campaignSubject');
            const fromNameInput = document.getElementById('fromName');

            if (editor) {
                editor.addEventListener('input', () => this.debouncePreviewUpdate());
            }
            if (subjectInput) {
                subjectInput.addEventListener('input', () => this.debouncePreviewUpdate());
            }
            if (fromNameInput) {
                fromNameInput.addEventListener('input', () => this.debouncePreviewUpdate());
            }

            console.log('✅ Live preview initialized');
        } catch (error) {
            console.error('❌ Failed to initialize live preview:', error);
        }
    }

    setupMenuHandlers() {
        try {
            // Handle menu actions from main process
            if (window.electronAPI?.onMenuAction) {
                window.electronAPI.onMenuAction((action) => {
                    switch (action) {
                        case 'new-campaign':
                            this.addNewTab();
                            break;
                        case 'import-data':
                            // Trigger import
                            break;
                        case 'help-check-updates':
                            // Check for updates
                            break;
                        case 'help-welcome':
                            // Show welcome
                            break;
                        case 'help-release-notes':
                            // Show release notes
                            break;
                        case 'help-about':
                            // Show about
                            break;
                    }
                });
            }
            console.log('✅ Menu handlers setup complete');
        } catch (error) {
            console.error('❌ Failed to setup menu handlers:', error);
        }
    }

    loadSettings() {
        try {
            // Load user settings
            console.log('✅ Settings loaded');
        } catch (error) {
            console.error('❌ Failed to load settings:', error);
        }
    }

    updateUI() {
        try {
            // Update UI based on current state
            console.log('✅ UI updated');
        } catch (error) {
            console.error('❌ Failed to update UI:', error);
        }
    }

    populateAccountsDropdown() {
        try {
            // Populate accounts dropdown
            console.log('✅ Accounts dropdown populated');
        } catch (error) {
            console.error('❌ Failed to populate accounts dropdown:', error);
        }
    }

    populateFromAddressDropdown() {
        try {
            // Populate from address dropdown
            console.log('✅ From address dropdown populated');
        } catch (error) {
            console.error('❌ Failed to populate from address dropdown:', error);
        }
    }

    loadSendAsList() {
        try {
            // Load send as list
            console.log('✅ Send as list loaded');
        } catch (error) {
            console.error('❌ Failed to load send as list:', error);
        }
    }

    wireAutoUpdates() {
        try {
            // Wire auto updates
            console.log('✅ Auto updates wired');
        } catch (error) {
            console.error('❌ Failed to wire auto updates:', error);
        }
    }

    // Campaign history functions
    deleteCampaignHistory() {
        try {
            // Clear campaign history
            this.campaignHistory = [];
            this.showSuccess('Campaign history cleared successfully!');
            console.log('✅ Campaign history cleared');
        } catch (error) {
            console.error('❌ Failed to clear campaign history:', error);
            this.showError('Failed to clear campaign history: ' + error.message);
        }
    }

    // Theme toggling functions
    toggleTheme() {
        try {
            const currentTheme = document.body.getAttribute('data-theme') || 'light';
            const newTheme = currentTheme === 'light' ? 'dark' : 'light';
            
            document.body.setAttribute('data-theme', newTheme);
            localStorage.setItem('theme', newTheme);
            
            this.showSuccess(`Theme switched to ${newTheme} mode`);
            console.log('✅ Theme toggled to:', newTheme);
        } catch (error) {
            console.error('❌ Failed to toggle theme:', error);
        }
    }

    // Google Sheets integration functions
    async detectEmailColumns(headers) {
        try {
            const emailKeywords = ['email', 'gmail', 'mail', 'e-mail', 'email_address'];
            const detectedColumns = [];
            
            headers.forEach((header, index) => {
                const headerLower = header.toLowerCase();
                if (emailKeywords.some(keyword => headerLower.includes(keyword))) {
                    detectedColumns.push({
                        index,
                        header,
                        confidence: 'high'
                    });
                }
            });
            
            return detectedColumns;
        } catch (error) {
            console.error('❌ Failed to detect email columns:', error);
            return [];
        }
    }

    async editGoogleSheetsInApp(sheetUrl) {
        try {
            // Open Google Sheets in app for editing
            const result = await window.electronAPI.openGoogleSheetsInApp?.(sheetUrl);
            if (result?.success) {
                this.showSuccess('Google Sheets opened in app for editing');
            } else {
                this.showError('Failed to open Google Sheets: ' + (result?.error || 'Unknown error'));
            }
        } catch (error) {
            console.error('❌ Failed to open Google Sheets in app:', error);
            this.showError('Failed to open Google Sheets: ' + error.message);
        }
    }

    // Missing helper functions
    getEditorPlainText() {
        try {
            const editor = document.getElementById('emailEditor');
            if (!editor) return '';
            return editor.textContent || editor.innerText || '';
        } catch (error) {
            console.error('❌ Failed to get editor plain text:', error);
            return '';
        }
    }

    getEditorHtml() {
        try {
            const editor = document.getElementById('emailEditor');
            if (!editor) return '';
            return editor.innerHTML || '';
        } catch (error) {
            console.error('❌ Failed to get editor HTML:', error);
            return '';
        }
    }

    logEvent(level, message, data = {}) {
        try {
            const timestamp = new Date().toISOString();
            const logEntry = {
                timestamp,
                level,
                message,
                data
            };
            
            console.log(`[${level.toUpperCase()}] ${message}`, data);
            
            // Store in local storage for debugging
            const logs = JSON.parse(localStorage.getItem('rtx_logs') || '[]');
            logs.push(logEntry);
            if (logs.length > 100) logs.shift(); // Keep only last 100 logs
            localStorage.setItem('rtx_logs', JSON.stringify(logs));
        } catch (error) {
            console.error('❌ Failed to log event:', error);
        }
    }

    // Missing initialization functions
    initializePlaceholderSystem() {
        try {
            // Initialize placeholder system
            console.log('✅ Placeholder system initialized');
        } catch (error) {
            console.error('❌ Failed to initialize placeholder system:', error);
        }
    }

    // Missing initialization functions
    initializePlaceholderSystem() {
        try {
            // Initialize placeholder system
            console.log('✅ Placeholder system initialized');
        } catch (error) {
            console.error('❌ Failed to initialize placeholder system:', error);
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
                        // Get current active tab and update its authentication state
                        const activeTab = this.getCurrentActiveTab();
                        if (activeTab) {
                            if (!this.tabAuthStates) {
                                this.tabAuthStates = new Map();
                            }
                            
                            this.tabAuthStates.set(activeTab, {
                                isAuthenticated: true,
                                currentAccount: result.userEmail || 'authenticated',
                                sheetData: null,
                                fromAddress: null
                            });
                            
                            // Update UI for current tab
                            this.updateTabAuthenticationDisplay(activeTab);
                        }
                        
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
            subjectPlaceholdersBtn.addEventListener('click', () => {
                const subjectInput = document.getElementById('campaignSubject');
                if (subjectInput) {
                    subjectInput.focus();
                    // Show placeholder dropdown at the end of subject input
                    this.showPlaceholderDropdown(subjectInput, subjectInput.value.length);
                }
            });
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

        // Attachment requirement checkbox
        const sendWithoutAttachmentsCheckbox = document.getElementById('sendWithoutAttachments');
        if (sendWithoutAttachmentsCheckbox) {
            sendWithoutAttachmentsCheckbox.addEventListener('change', () => this.updateAttachmentRequirement());
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
        
        // Listen for scraping completion events from main process
        if (window.electronAPI) {
            window.electronAPI.on('scraping-completed', (data) => {
                console.log('Scraping completed:', data);
                this.handleScrapingCompletion(data);
            });
        }
            campaignSubject.addEventListener('input', () => this.debouncePreviewUpdate());
        }
        
        const fromName = document.getElementById('fromName');
        if (fromName) {
            fromName.addEventListener('input', () => this.debouncePreviewUpdate());
        }

        // Tab management event listeners
        this.setupTabEventListeners();

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
            insertPresetBtn.addEventListener('click', () => this.insertPresetTemplate());
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

    setupTabEventListeners() {
        try {
            const addTabBtn = document.getElementById('add-tab-btn');
            if (addTabBtn) {
                addTabBtn.addEventListener('click', () => this.addNewTab());
            }

            // Set up close tab event delegation
            document.addEventListener('click', (e) => {
                if (e.target.classList.contains('close-tab')) {
                    const tabItem = e.target.closest('.tab-item');
                    if (tabItem) {
                        const tabId = tabItem.id.replace('tab-btn-', '');
                        this.closeTab(tabId);
                    }
                }
            });

            console.log('✅ Tab event listeners setup complete');
        } catch (error) {
            console.error('❌ Failed to setup tab event listeners:', error);
        }
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
        return [
            { key: '@company', value: 'Company Name', description: 'Company name from the data' },
            { key: '@profile', value: 'Profile Name', description: 'Profile name from the data' },
            { key: '@email', value: 'Email Address', description: 'Email address from the data' },
            { key: '@name', value: 'Contact Name', description: 'Contact name from the data' },
            { key: '@title', value: 'Job Title', description: 'Job title from the data' },
            { key: '@phone', value: 'Phone Number', description: 'Phone number from the data' },
            { key: '@linkedin', value: 'LinkedIn Profile', description: 'LinkedIn profile URL' },
            { key: '@industry', value: 'Industry', description: 'Industry from the data' },
            { key: '@location', value: 'Location', description: 'Location from the data' },
            { key: '@date', value: 'Current Date', description: 'Current date' },
            { key: '@sender_name', value: 'Your Name', description: 'Your name from the form' },
            { key: '@sender_email', value: 'Your Email', description: 'Your email from the form' }
        ];
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

    // Enhanced Template Management System
    async loadTemplatesFromStore() {
        try {
            console.log('🔄 Loading templates from store...');
            
            // Load templates from both disk and recent list
            const diskTemplates = await window.electronAPI.listTemplates?.() || [];
            const recentTemplates = (await window.electronAPI.storeGet?.('templates')) || [];
            
            // Merge templates, prioritizing disk templates
            const templateMap = new Map();
            
            // Add disk templates first
            diskTemplates.forEach(t => {
                if (t && t.id) {
                    templateMap.set(t.id, {
                        ...t,
                        source: 'disk',
                        lastModified: t.lastModified || new Date().toISOString()
                    });
                }
            });
            
            // Add recent templates (don't overwrite disk templates)
            recentTemplates.forEach(t => {
                if (t && t.id && !templateMap.has(t.id)) {
                    templateMap.set(t.id, {
                        ...t,
                        source: 'recent',
                        lastModified: t.lastModified || new Date().toISOString()
                    });
                }
            });
            
            this.templates = Array.from(templateMap.values());
            
            // Sort by last modified (newest first)
            this.templates.sort((a, b) => new Date(b.lastModified) - new Date(a.lastModified));
            
            this.renderTemplatesSelect();
            this.renderPresetTemplates();
            
            console.log(`✅ Loaded ${this.templates.length} templates`);
            this.logEvent('info', 'Templates loaded', { count: this.templates.length });
            
        } catch (error) {
            console.error('❌ Failed to load templates:', error);
            this.showError('Failed to load templates: ' + error.message);
            this.logEvent('error', 'Failed to load templates', { error: error.message });
        }
    }

    renderTemplatesSelect() {
        try {
            const select = document.getElementById('templateSelect');
            if (!select) return;
            
            // Clear existing options
            select.innerHTML = '<option value="">Select a template...</option>';
            
            if (this.templates.length === 0) {
                const option = document.createElement('option');
                option.value = '';
                option.textContent = 'No templates available';
                option.disabled = true;
                select.appendChild(option);
                return;
            }
            
            // Add template options
            this.templates.forEach(template => {
                const option = document.createElement('option');
                option.value = template.id;
                option.textContent = `${template.name} (${template.source === 'disk' ? 'Saved' : 'Recent'})`;
                select.appendChild(option);
            });
            
            console.log(`✅ Rendered ${this.templates.length} template options`);
            
        } catch (error) {
            console.error('❌ Failed to render template select:', error);
        }
    }

    renderPresetTemplates() {
        try {
            const select = document.getElementById('presetTemplateSelect');
            if (!select) return;
            
            // Clear existing options
            select.innerHTML = '<option value="">Select a preset template...</option>';
            
            const presetTemplates = [
                { name: 'Welcome Email', content: 'Welcome to our service! We\'re excited to have you on board.' },
                { name: 'Newsletter', content: 'Here\'s our latest newsletter with updates and insights.' },
                { name: 'Product Announcement', content: 'We\'re excited to announce our new product launch!' },
                { name: 'Event Invitation', content: 'You\'re invited to our upcoming event. Please RSVP.' },
                { name: 'Follow-up', content: 'Thank you for your interest. Here\'s some additional information.' }
            ];
            
            presetTemplates.forEach(preset => {
                const option = document.createElement('option');
                option.value = preset.name;
                option.textContent = preset.name;
                option.dataset.content = preset.content;
                select.appendChild(option);
            });
            
            console.log('✅ Preset templates rendered');
            
        } catch (error) {
            console.error('❌ Failed to render preset templates:', error);
        }
    }

    async saveCurrentTemplate() {
        try {
            // Create custom modal for template name input
            const templateName = await this.showTemplateNameModal();
            if (!templateName || templateName.trim() === '') {
                this.showWarning('Template name cannot be empty');
                return;
            }
            
            // Check if template name already exists
            const existingTemplate = this.templates.find(t => t.name.toLowerCase() === templateName.toLowerCase());
            if (existingTemplate) {
                const overwrite = await this.showConfirmModal(`Template "${templateName}" already exists. Do you want to overwrite it?`);
                if (!overwrite) return;
            }
            
            // Prepare template data
            const templateData = {
                name: name.trim(),
                subject: document.getElementById('campaignSubject')?.value || '',
                content: this.getEditorHtml() || '',
                fromName: document.getElementById('fromName')?.value || '',
                attachments: this.campaignAttachments || [],
                createdAt: new Date().toISOString(),
                lastModified: new Date().toISOString()
            };
            
            console.log('💾 Saving template:', templateData.name);
            
            // Save template to disk
            const result = await window.electronAPI.saveTemplateJson?.(name, templateData);
            
            if (result?.success) {
                // Update local templates list
                const newTemplate = {
                    id: result.path,
                    name: templateData.name,
                    ...templateData,
                    source: 'disk'
                };
                
                // Remove old template if it existed
                this.templates = this.templates.filter(t => t.id !== result.path);
                
                // Add new template at the beginning
                this.templates.unshift(newTemplate);
                
                // Update store
                await window.electronAPI.storeSet?.('templates', this.templates);
                
                // Refresh UI
                this.renderTemplatesSelect();
                
                this.showSuccess(`Template "${name}" saved successfully!`);
                this.logEvent('info', 'Template saved', { templateName: name });
                
            } else {
                throw new Error(result?.error || 'Unknown error occurred');
            }
            
        } catch (error) {
            console.error('❌ Failed to save template:', error);
            this.showError('Failed to save template: ' + error.message);
            this.logEvent('error', 'Failed to save template', { error: error.message });
        }
    }

    async loadSelectedTemplate() {
        try {
            const select = document.getElementById('templateSelect');
            if (!select || !select.value) {
                this.showWarning('Please select a template to load');
                return;
            }
            
            const templateId = select.value;
            const template = this.templates.find(t => t.id === templateId);
            
            if (!template) {
                this.showError('Selected template not found');
                return;
            }
            
            console.log('📂 Loading template:', template.name);
            
            // Load template content from disk if it's a disk template
            let templateContent = template;
            
            if (template.source === 'disk') {
                try {
                    const loadResult = await window.electronAPI.loadTemplateJson?.(templateId);
                    if (loadResult?.success) {
                        templateContent = loadResult.data;
                    } else {
                        throw new Error(loadResult?.error || 'Failed to load template content');
                    }
                } catch (loadError) {
                    console.warn('Failed to load template content from disk, using cached version:', loadError);
                    // Continue with cached version
                }
            }
            
            // Apply template to form
            this.applyTemplateToForm(templateContent);
            
            this.showSuccess(`Template "${template.name}" loaded successfully!`);
            this.logEvent('info', 'Template loaded', { templateName: template.name });
            
        } catch (error) {
            console.error('❌ Failed to load template:', error);
            this.showError('Failed to load template: ' + error.message);
            this.logEvent('error', 'Failed to load template', { error: error.message });
        }
    }

    applyTemplateToForm(template) {
        try {
            // Apply subject
            const subjectField = document.getElementById('campaignSubject');
            if (subjectField && template.subject) {
                subjectField.value = template.subject;
            }
            
            // Apply content
            const editor = document.getElementById('emailEditor');
            if (editor && template.content) {
                editor.innerHTML = template.content;
            }
            
            // Apply from name
            const fromNameField = document.getElementById('fromName');
            if (fromNameField && template.fromName) {
                fromNameField.value = template.fromName;
            }
            
            // Apply attachments
            if (template.attachments && template.attachments.length > 0) {
                this.campaignAttachments = [...template.attachments];
                this.updateCampaignAttachmentsDisplay();
            }
            
            // Update preview
            this.debouncePreviewUpdate();
            
            console.log('✅ Template applied to form');
            
        } catch (error) {
            console.error('❌ Failed to apply template to form:', error);
        }
    }

    async deleteSelectedTemplate() {
        try {
            const select = document.getElementById('templateSelect');
            if (!select || !select.value) {
                this.showWarning('Please select a template to delete');
                return;
            }
            
            const templateId = select.value;
            const template = this.templates.find(t => t.id === templateId);
            
            if (!template) {
                this.showError('Selected template not found');
                return;
            }
            
            const confirmDelete = confirm(`Are you sure you want to delete template "${template.name}"? This action cannot be undone.`);
            if (!confirmDelete) return;
            
            console.log('🗑️ Deleting template:', template.name);
            
            // Delete from disk if it's a disk template
            if (template.source === 'disk') {
                try {
                    await window.electronAPI.deleteTemplateJson?.(templateId);
                } catch (deleteError) {
                    console.warn('Failed to delete template from disk:', deleteError);
                    // Continue with local removal
                }
            }
            
            // Remove from local templates list
            this.templates = this.templates.filter(t => t.id !== templateId);
            
            // Update store
            await window.electronAPI.storeSet?.('templates', this.templates);
            
            // Refresh UI
            this.renderTemplatesSelect();
            
            this.showSuccess(`Template "${template.name}" deleted successfully!`);
            this.logEvent('info', 'Template deleted', { templateName: template.name });
            
        } catch (error) {
            console.error('❌ Failed to delete template:', error);
            this.showError('Failed to delete template: ' + error.message);
            this.logEvent('error', 'Failed to delete template', { error: error.message });
        }
    }

    insertPresetTemplate() {
        try {
            const select = document.getElementById('presetTemplateSelect');
            if (!select || !select.value) {
                this.showWarning('Please select a preset template');
                return;
            }
            
            const selectedOption = select.options[select.selectedIndex];
            const content = selectedOption.dataset.content;
            
            if (!content) {
                this.showError('Preset template content not found');
                return;
            }
            
            // Insert content into editor
            const editor = document.getElementById('emailEditor');
            if (editor) {
                // Insert at cursor position or append
                const selection = window.getSelection();
                if (selection.rangeCount > 0) {
                    const range = selection.getRangeAt(0);
                    range.deleteContents();
                    range.insertNode(document.createTextNode(content));
                    range.collapse(false);
                } else {
                    editor.appendChild(document.createTextNode(content));
                }
                
                // Update preview
                this.debouncePreviewUpdate();
                
                this.showSuccess('Preset template inserted successfully!');
            }
            
        } catch (error) {
            console.error('❌ Failed to insert preset template:', error);
            this.showError('Failed to insert preset template: ' + error.message);
        }
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
        this.chromeExtensionId = 'salesql-scraper'; // Chrome extension ID
        this.chromeExtensionInstalled = false;
        this.updateScrapingUI();
        
        // Check if Chrome extension is installed
        this.checkChromeExtensionStatus();
        
        // Initialize Google Sheets integration if URL is provided
        this.initializeGoogleSheetsIntegration();
    }
    
    async checkChromeExtensionStatus() {
        try {
            // Check if Chrome extension is available
            if (typeof chrome !== 'undefined' && chrome.runtime && chrome.runtime.sendMessage) {
                // Try to communicate with the extension
                chrome.runtime.sendMessage(this.chromeExtensionId, { action: 'ping' }, (response) => {
                    if (chrome.runtime.lastError) {
                        console.log('Chrome extension not installed or not accessible');
                        this.chromeExtensionInstalled = false;
                        this.showChromeExtensionInstallPrompt();
                    } else {
                        console.log('Chrome extension is available');
                        this.chromeExtensionInstalled = true;
                        this.updateChromeExtensionStatus();
                    }
                });
            } else {
                // Fallback: check if extension is installed via Electron
                this.checkElectronExtensionStatus();
            }
        } catch (error) {
            console.log('Chrome extension check failed:', error);
            this.chromeExtensionInstalled = false;
            this.showChromeExtensionInstallPrompt();
        }
    }
    
    async checkElectronExtensionStatus() {
        try {
            // Check if extension files exist in the app directory
            const extensionPath = await window.electronAPI?.checkExtensionPath?.(this.chromeExtensionId);
            if (extensionPath) {
                this.chromeExtensionInstalled = true;
                this.updateChromeExtensionStatus();
            } else {
                this.chromeExtensionInstalled = false;
                this.showChromeExtensionInstallPrompt();
            }
        } catch (error) {
            console.log('Electron extension check failed:', error);
            this.chromeExtensionInstalled = false;
            this.showChromeExtensionInstallPrompt();
        }
    }
    
    showChromeExtensionInstallPrompt() {
        const container = document.getElementById('scrapedDataContainer');
        if (!container) return;
        
        container.innerHTML = `
            <div style="text-align: center; color: #8E8E93; margin-top: 40px;">
                <i class="fas fa-puzzle-piece" style="font-size: 48px; margin-bottom: 16px; display: block;"></i>
                <h4>Chrome Extension Required</h4>
                <p style="margin-bottom: 20px;">To use the SalesQL Scraper, you need to install the Chrome extension.</p>
                
                <div style="background: #f8f9fa; padding: 16px; border-radius: 8px; margin-bottom: 20px; text-align: left;">
                    <h5 style="margin-bottom: 12px;">Installation Steps:</h5>
                    <ol style="margin: 0; padding-left: 20px;">
                        <li>Download the SalesQL Scraper extension</li>
                        <li>Open Chrome and go to <code>chrome://extensions/</code></li>
                        <li>Enable "Developer mode"</li>
                        <li>Click "Load unpacked" and select the extension folder</li>
                        <li>Refresh this page</li>
                    </ol>
                </div>
                
                <button class="btn btn-primary" onclick="rtxApp.installChromeExtension()">
                    <i class="fas fa-download"></i> Download Extension
                </button>
                
                <button class="btn btn-secondary" onclick="rtxApp.refreshExtensionStatus()" style="margin-left: 8px;">
                    <i class="fas fa-sync"></i> Refresh Status
                </button>
            </div>
        `;
    }
    
    updateChromeExtensionStatus() {
        const statusElement = document.getElementById('scrapingStatusText');
        if (statusElement) {
            statusElement.innerHTML = `
                <span style="color: #34C759;">
                    <i class="fas fa-check-circle"></i> Chrome Extension Ready
                </span>
            `;
        }
        
        // Enable scraping controls
        const startBtn = document.getElementById('startScrapingBtn');
        if (startBtn) startBtn.disabled = false;
    }
    
    async installChromeExtension() {
        try {
            this.showInfo('Installing Chrome extension...');
            
            // Try to install from app assets first
            await this.installChromeExtensionFromAssets();
            
        } catch (error) {
            console.error('Extension installation failed:', error);
            this.showError('Failed to install extension: ' + error.message);
            // Fallback to manual installation
            this.showManualExtensionInstallModal();
        }
    }
    
    showExtensionInstructions() {
        const instructions = `
            <div style="background: #f0f8ff; border: 1px solid #4a90e2; border-radius: 8px; padding: 16px; margin: 16px 0;">
                <h4 style="margin: 0 0 12px 0; color: #2c5aa0;">
                    <i class="fas fa-info-circle"></i> How to Use the SalesQL Scraper Extension
                </h4>
                <ol style="margin: 0; padding-left: 20px;">
                    <li style="margin-bottom: 8px;">Open Chrome and navigate to <strong>SalesQL</strong> (app.salesql.com)</li>
                    <li style="margin-bottom: 8px;">Click on the <strong>SalesQL Scraper</strong> extension icon in your browser toolbar</li>
                    <li style="margin-bottom: 8px;">Click <strong>"Scrape"</strong> to start scraping contacts from the current page</li>
                    <li style="margin-bottom: 8px;">The extension will automatically collect contact data and send it back to this app</li>
                    <li style="margin-bottom: 8px;">Once scraping is complete, you can export the data to Google Sheets or CSV</li>
                </ol>
                <p style="margin: 12px 0 0 0; font-size: 14px; color: #666;">
                    <strong>Note:</strong> Make sure you're on a SalesQL contacts page before starting the scraper.
                </p>
            </div>
        `;
        
        // Insert instructions into the scraper modal
        const instructionsContainer = document.getElementById('scraperInstructions');
        if (instructionsContainer) {
            instructionsContainer.innerHTML = instructions;
        }
    }
    
    handleScrapingCompletion(data) {
        console.log('Handling scraping completion:', data);
        
        // Stop progress monitoring
        if (this.scrapingProgressInterval) {
            clearInterval(this.scrapingProgressInterval);
            this.scrapingProgressInterval = null;
        }
        
        // Update UI
        this.isScraping = false;
        this.updateScrapingUI();
        
        // Show success message
        this.showSuccess(`Scraping completed! Found ${data.dataCount} contacts.`);
        
        // Refresh data display
        this.refreshScrapedData();
        
        // Enable export buttons
        this.updateExportButtons();
    }
    
    async refreshScrapedData() {
        try {
            // Get the latest scraped data
            const progress = await window.electronAPI?.getScrapingProgress?.(this.currentScrapingSession);
            if (progress && progress.success && progress.data) {
                this.scrapedData = progress.data;
                this.updateScrapedDataDisplay();
            }
        } catch (error) {
            console.error('Failed to refresh scraped data:', error);
        }
    }
    
    updateExportButtons() {
        // Enable export buttons when data is available
        const enhancedExportBtn = document.getElementById('enhancedExportBtn');
        const enhancedSheetsBtn = document.getElementById('enhancedSheetsBtn');
        const taskforceBtn = document.getElementById('taskforceBtn');
        const exportScrapedDataBtn = document.getElementById('exportScrapedDataBtn');
        
        if (enhancedExportBtn) enhancedExportBtn.disabled = false;
        if (enhancedSheetsBtn) enhancedSheetsBtn.disabled = false;
        if (taskforceBtn) taskforceBtn.disabled = false;
        if (exportScrapedDataBtn) exportScrapedDataBtn.disabled = false;
    }
    
    refreshExtensionStatus() {
        this.checkChromeExtensionStatus();
    }
    
    async startSalesqlScraping() {
        if (this.isScraping) return;
        
        console.log('🚀 Starting SalesQL scraping...');
        this.isScraping = true;
        this.updateScrapingUI();
        
        try {
            // Check if Chrome extension is available
            const extensionPath = await window.electronAPI?.checkExtensionPath?.('salesql-scraper');
            if (extensionPath) {
                this.chromeExtensionInstalled = true;
                await this.startRealScraping();
            } else {
                // Try to install the extension first
                await this.installChromeExtension();
                if (this.chromeExtensionInstalled) {
                    await this.startRealScraping();
                } else {
                    // Fallback to manual data entry
                    await this.startManualScraping();
                }
            }
        } catch (error) {
            console.error('❌ Scraping failed:', error);
            this.showError('Scraping failed: ' + error.message);
        } finally {
            this.isScraping = false;
            this.updateScrapingUI();
        }
    }
    
    async startRealScraping() {
        try {
            // Get scraping parameters
            const delay = parseInt(document.getElementById('scrapingDelay')?.value || '4') * 1000;
            const sheetUrl = document.getElementById('salesqlSheetUrl')?.value;
            
            // Initialize scraping session
            this.scrapedData = [];
            this.currentScrapingSession = Date.now();
            
            // Start scraping via Electron IPC
            const result = await window.electronAPI?.startScraping?.({
                sessionId: this.currentScrapingSession,
                delay: delay,
                sheetUrl: sheetUrl
            });
            
            if (result && result.success) {
                this.showSuccess('Scraping started successfully! Please use the Chrome extension to scrape data from SalesQL.');
                this.startScrapingProgressMonitor();
                
                // Show instructions for using the extension
                this.showExtensionInstructions();
            } else {
                throw new Error(result?.error || 'Failed to start scraping');
            }
            
        } catch (error) {
            throw new Error('Real scraping failed: ' + error.message);
        }
    }
    
    async startElectronScraping(delay, sheetUrl) {
        try {
            // Use Electron IPC to start scraping
            const result = await window.electronAPI?.startScraping?.({
                sessionId: this.currentScrapingSession,
                delay: delay,
                sheetUrl: sheetUrl
            });
            
            if (result && result.success) {
                this.showSuccess('Scraping started successfully!');
                this.startScrapingProgressMonitor();
            } else {
                throw new Error(result?.error || 'Failed to start scraping via Electron');
            }
        } catch (error) {
            throw new Error('Electron scraping failed: ' + error.message);
        }
    }
    
    async startManualScraping() {
        try {
            // Show manual data entry interface
            this.showManualDataEntryModal();
        } catch (error) {
            throw new Error('Manual scraping failed: ' + error.message);
        }
    }
    
    startScrapingProgressMonitor() {
        // Monitor scraping progress
        this.scrapingProgressInterval = setInterval(async () => {
            try {
                await this.checkScrapingProgress();
            } catch (error) {
                console.error('Progress check failed:', error);
            }
        }, 2000); // Check every 2 seconds
    }
    
    async checkScrapingProgress() {
        try {
            // Check progress via Electron IPC
            const progress = await window.electronAPI?.getScrapingProgress?.(this.currentScrapingSession);
            if (progress && progress.success) {
                this.handleScrapingProgress(progress);
            }
        } catch (error) {
            console.error('Progress check failed:', error);
        }
    }
    
    handleScrapingProgress(progress) {
        if (progress.completed) {
            // Scraping completed
            clearInterval(this.scrapingProgressInterval);
            this.isScraping = false;
            this.updateScrapingUI();
            
            if (progress.data && progress.data.length > 0) {
                this.scrapedData = progress.data;
                this.updateScrapedDataDisplay();
                this.showSuccess(`Scraping completed! Found ${this.scrapedData.length} contacts.`);
            }
        } else if (progress.currentPage && progress.totalPages) {
            // Update progress
            this.updateScrapingProgress(progress.currentPage, progress.totalPages);
        }
        
        if (progress.data && progress.data.length > 0) {
            // Update data display with new data
            this.scrapedData = progress.data;
            this.updateScrapedDataDisplay();
        }
    }
    
    showManualDataEntryModal() {
        // Create a modal for manual data entry
        const modalHtml = `
            <div id="manualDataEntryModal" class="modal">
                <div class="modal-content" style="max-width: 800px;">
                    <div class="modal-header">
                        <h3><i class="fas fa-edit"></i> Manual Data Entry</h3>
                        <button class="btn btn-secondary" onclick="rtxApp.hideModal('manualDataEntryModal')">&times;</button>
                    </div>
                    <div class="modal-body">
                        <p style="margin-bottom: 16px;">Enter contact data manually or paste from CSV:</p>
                        
                        <div class="form-group" style="margin-bottom: 16px;">
                            <label>Paste CSV Data:</label>
                            <textarea id="csvPasteArea" placeholder="company,profile,email&#10;TechCorp,https://linkedin.com/in/johndoe,john@techcorp.com" style="width: 100%; height: 120px; font-family: monospace;"></textarea>
                        </div>
                        
                        <div class="form-group" style="margin-bottom: 16px;">
                            <label>Or Add Individual Contacts:</label>
                            <div id="individualContactsContainer">
                                <div class="contact-entry" style="display: grid; grid-template-columns: 1fr 1fr 1fr auto; gap: 8px; margin-bottom: 8px;">
                                    <input type="text" placeholder="Company" class="contact-company">
                                    <input type="text" placeholder="Profile URL" class="contact-profile">
                                    <input type="email" placeholder="Email" class="contact-email">
                                    <button class="btn btn-danger" onclick="rtxApp.removeContactEntry(this)" style="width: 40px;">×</button>
                                </div>
                            </div>
                            <button class="btn btn-secondary" onclick="rtxApp.addContactEntry()" style="margin-top: 8px;">
                                <i class="fas fa-plus"></i> Add Contact
                            </button>
                        </div>
                        
                        <div style="display: flex; gap: 8px; justify-content: flex-end;">
                            <button class="btn btn-secondary" onclick="rtxApp.hideModal('manualDataEntryModal')">Cancel</button>
                            <button class="btn btn-primary" onclick="rtxApp.processManualData()">Process Data</button>
                        </div>
                    </div>
                </div>
            </div>
        `;
        
        // Add modal to DOM
        document.body.insertAdjacentHTML('beforeend', modalHtml);
        this.showModal('manualDataEntryModal');
    }
    
    addContactEntry() {
        const container = document.getElementById('individualContactsContainer');
        if (!container) return;
        
        const entryHtml = `
            <div class="contact-entry" style="display: grid; grid-template-columns: 1fr 1fr 1fr auto; gap: 8px; margin-bottom: 8px;">
                <input type="text" placeholder="Company" class="contact-company">
                <input type="text" placeholder="Profile URL" class="contact-profile">
                <input type="email" placeholder="Email" class="contact-email">
                <button class="btn btn-danger" onclick="rtxApp.removeContactEntry(this)" style="width: 40px;">×</button>
            </div>
        `;
        
        container.insertAdjacentHTML('beforeend', entryHtml);
    }
    
    removeContactEntry(button) {
        button.closest('.contact-entry').remove();
    }
    
    async processManualData() {
        try {
            const csvPasteArea = document.getElementById('csvPasteArea');
            const csvData = csvPasteArea?.value?.trim();
            
            let processedData = [];
            
            if (csvData) {
                // Process CSV data
                processedData = this.parseCSVData(csvData);
            } else {
                // Process individual entries
                processedData = this.processIndividualEntries();
            }
            
            if (processedData.length === 0) {
                this.showError('No valid data found. Please enter some contacts.');
                return;
            }
            
            // Validate and clean data
            processedData = this.validateAndCleanScrapedData(processedData);
            
            // Set scraped data and close modal
            this.scrapedData = processedData;
            this.hideModal('manualDataEntryModal');
            this.updateScrapedDataDisplay();
            
            this.showSuccess(`Data processed successfully! Found ${this.scrapedData.length} contacts.`);
            
        } catch (error) {
            console.error('Data processing failed:', error);
            this.showError('Failed to process data: ' + error.message);
        }
    }
    
    parseCSVData(csvText) {
        try {
            const lines = csvText.trim().split('\n');
            if (lines.length < 2) return [];
            
            const headers = lines[0].split(',').map(h => h.trim().toLowerCase());
            const data = [];
            
            for (let i = 1; i < lines.length; i++) {
                const values = lines[i].split(',').map(v => v.trim());
                if (values.length >= 3) {
                    const row = {};
                    headers.forEach((header, index) => {
                        if (values[index]) {
                            row[header] = values[index].replace(/^"|"$/g, ''); // Remove quotes
                        }
                    });
                    
                    // Map to standard format
                    const contact = {
                        company: row.company || row.name || row.organization || '',
                        profile: row.profile || row.linkedin || row.url || '',
                        email: row.email || row.mail || row.email1 || ''
                    };
                    
                    if (contact.company && contact.email) {
                        data.push(contact);
                    }
                }
            }
            
            return data;
        } catch (error) {
            console.error('CSV parsing failed:', error);
            throw new Error('Invalid CSV format');
        }
    }
    
    processIndividualEntries() {
        const entries = document.querySelectorAll('.contact-entry');
        const data = [];
        
        entries.forEach(entry => {
            const company = entry.querySelector('.contact-company')?.value?.trim();
            const profile = entry.querySelector('.contact-profile')?.value?.trim();
            const email = entry.querySelector('.contact-email')?.value?.trim();
            
            if (company && email) {
                data.push({
                    company: company,
                    profile: profile || '',
                    email: email
                });
            }
        });
        
        return data;
    }
    
    validateAndCleanScrapedData(data) {
        return data.filter(item => {
            // Basic validation
            if (!item.company || !item.email) return false;
            
            // Clean company name
            item.company = item.company.trim();
            
            // Clean and validate email
            item.email = item.email.trim().toLowerCase();
            if (!this.isValidEmail(item.email)) return false;
            
            // Clean profile URL
            if (item.profile) {
                item.profile = item.profile.trim();
                if (!item.profile.startsWith('http')) {
                    item.profile = 'https://' + item.profile;
                }
            }
            
            return true;
        });
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
        
        // Create enhanced table with actions
        let html = `
            <div style="margin-bottom: 16px; display: flex; justify-content: space-between; align-items: center;">
                <h5 style="margin: 0;">Scraped Data (${this.scrapedData.length} contacts)</h5>
                <div style="display: flex; gap: 8px;">
                    <button class="btn btn-secondary" onclick="rtxApp.exportToGoogleSheets()" ${!this.canExportToSheets() ? 'disabled' : ''}>
                        <i class="fas fa-table"></i> Export to Sheets
                    </button>
                    <button class="btn btn-secondary" onclick="rtxApp.exportScrapedData()">
                        <i class="fas fa-download"></i> Export CSV
                    </button>
                    <button class="btn btn-secondary" onclick="rtxApp.exportToTaskforce()">
                        <i class="fas fa-paper-plane"></i> Send to Taskforce
                    </button>
                </div>
            </div>
            
            <table style="width: 100%; border-collapse: collapse; font-size: 12px;">
                <thead>
                    <tr style="background: #f8f9fa;">
                        <th style="padding: 8px; border: 1px solid #e5e5e7; text-align: left;">Company</th>
                        <th style="padding: 8px; border: 1px solid #e5e5e7; text-align: left;">Profile</th>
                        <th style="padding: 8px; border: 1px solid #e5e5e7; text-align: left;">Email</th>
                        <th style="padding: 8px; border: 1px solid #e5e5e7; text-align: center;">Actions</th>
                    </tr>
                </thead>
                <tbody>
        `;
        
        this.scrapedData.forEach((item, index) => {
            html += `
                <tr>
                    <td style="padding: 8px; border: 1px solid #e5e5e7;">${this.escapeHtml(item.company)}</td>
                    <td style="padding: 8px; border: 1px solid #e5e5e7;">
                        ${item.profile ? `<a href="${item.profile}" target="_blank" style="color: #007AFF;">${this.escapeHtml(item.profile)}</a>` : '-'}
                    </td>
                    <td style="padding: 8px; border: 1px solid #e5e5e7;">${this.escapeHtml(item.email)}</td>
                    <td style="padding: 8px; border: 1px solid #e5e5e7; text-align: center;">
                        <button class="btn btn-sm btn-secondary" onclick="rtxApp.editContact(${index})" style="padding: 2px 6px; font-size: 10px;">
                            <i class="fas fa-edit"></i>
                        </button>
                        <button class="btn btn-sm btn-danger" onclick="rtxApp.removeContact(${index})" style="padding: 2px 6px; font-size: 10px; margin-left: 4px;">
                            <i class="fas fa-trash"></i>
                        </button>
                    </td>
                </tr>
            `;
        });
        
        html += `
                </tbody>
            </table>
        `;
        
        container.innerHTML = html;
    }
    
    canExportToSheets() {
        const sheetUrl = document.getElementById('salesqlSheetUrl')?.value;
        return sheetUrl && sheetUrl.includes('docs.google.com/spreadsheets');
    }
    
    editContact(index) {
        // Show edit modal for the contact
        this.showContactEditModal(index);
    }
    
    removeContact(index) {
        if (confirm('Are you sure you want to remove this contact?')) {
            this.scrapedData.splice(index, 1);
            this.updateScrapedDataDisplay();
            this.showSuccess('Contact removed successfully.');
        }
    }
    
    showContactEditModal(index) {
        const contact = this.scrapedData[index];
        if (!contact) return;
        
        const modalHtml = `
            <div id="contactEditModal" class="modal">
                <div class="modal-content" style="max-width: 500px;">
                    <div class="modal-header">
                        <h3><i class="fas fa-edit"></i> Edit Contact</h3>
                        <button class="btn btn-secondary" onclick="rtxApp.hideModal('contactEditModal')">&times;</button>
                    </div>
                    <div class="modal-body">
                        <div class="form-group" style="margin-bottom: 16px;">
                            <label>Company:</label>
                            <input type="text" id="editCompany" value="${this.escapeHtml(contact.company)}" style="width: 100%;">
                        </div>
                        <div class="form-group" style="margin-bottom: 16px;">
                            <label>Profile URL:</label>
                            <input type="text" id="editProfile" value="${this.escapeHtml(contact.profile || '')}" style="width: 100%;">
                        </div>
                        <div class="form-group" style="margin-bottom: 16px;">
                            <label>Email:</label>
                            <input type="email" id="editEmail" value="${this.escapeHtml(contact.email)}" style="width: 100%;">
                        </div>
                        
                        <div style="display: flex; gap: 8px; justify-content: flex-end;">
                            <button class="btn btn-secondary" onclick="rtxApp.hideModal('contactEditModal')">Cancel</button>
                            <button class="btn btn-primary" onclick="rtxApp.saveContactEdit(${index})">Save</button>
                        </div>
                    </div>
                </div>
            </div>
        `;
        
        // Remove existing modal if any
        const existingModal = document.getElementById('contactEditModal');
        if (existingModal) existingModal.remove();
        
        // Add modal to DOM
        document.body.insertAdjacentHTML('beforeend', modalHtml);
        this.showModal('contactEditModal');
    }
    
    saveContactEdit(index) {
        const company = document.getElementById('editCompany')?.value?.trim();
        const profile = document.getElementById('editProfile')?.value?.trim();
        const email = document.getElementById('editEmail')?.value?.trim();
        
        if (!company || !email) {
            this.showError('Company and email are required.');
            return;
        }
        
        if (!this.isValidEmail(email)) {
            this.showError('Please enter a valid email address.');
            return;
        }
        
        // Update contact
        this.scrapedData[index] = {
            company: company,
            profile: profile || '',
            email: email.toLowerCase()
        };
        
        this.hideModal('contactEditModal');
        this.updateScrapedDataDisplay();
        this.showSuccess('Contact updated successfully.');
    }
    
    updateScrapingUI() {
        const startBtn = document.getElementById('startScrapingBtn');
        const stopBtn = document.getElementById('stopScrapingBtn');
        const exportBtn = document.getElementById('exportScrapedDataBtn');
        const enhancedExportBtn = document.getElementById('enhancedExportBtn');
        const enhancedSheetsBtn = document.getElementById('enhancedSheetsBtn');
        const taskforceBtn = document.getElementById('taskforceBtn');
        const statusText = document.getElementById('scrapingStatusText');
        const progressContainer = document.getElementById('scrapingProgress');
        
        if (startBtn) startBtn.disabled = this.isScraping;
        if (stopBtn) stopBtn.disabled = !this.isScraping;
        if (exportBtn) exportBtn.disabled = this.scrapedData.length === 0;
        if (enhancedExportBtn) enhancedExportBtn.disabled = this.scrapedData.length === 0;
        if (enhancedSheetsBtn) enhancedSheetsBtn.disabled = this.scrapedData.length === 0;
        if (taskforceBtn) taskforceBtn.disabled = this.scrapedData.length === 0;
        
        if (statusText) {
            if (this.isScraping) {
                statusText.innerHTML = '<span style="color: #FF9500;"><i class="fas fa-spinner fa-spin"></i> Scraping in progress...</span>';
            } else if (this.chromeExtensionInstalled) {
                statusText.innerHTML = '<span style="color: #34C759;"><i class="fas fa-check-circle"></i> Ready to scrape</span>';
            } else {
                statusText.innerHTML = '<span style="color: #FF3B30;"><i class="fas fa-exclamation-triangle"></i> Chrome extension required</span>';
            }
        }
        if (progressContainer && !this.isScraping) {
            progressContainer.style.display = 'none';
        }
    }
    
    stopSalesqlScraping() {
        console.log('⏹️ Stopping SalesQL scraping...');
        this.isScraping = false;
        
        // Clear progress monitoring
        if (this.scrapingProgressInterval) {
            clearInterval(this.scrapingProgressInterval);
        }
        
        // Stop scraping in Chrome extension
        if (this.chromeExtensionInstalled && typeof chrome !== 'undefined' && chrome.runtime && chrome.runtime.sendMessage) {
            chrome.runtime.sendMessage(this.chromeExtensionId, {
                action: 'stopScraping',
                sessionId: this.currentScrapingSession
            });
        }
        
        this.updateScrapingUI();
        this.showSuccess('Scraping stopped.');
    }
    
    async exportScrapedData() {
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
    
    async exportToGoogleSheets() {
        if (!this.canExportToSheets()) {
            this.showError('Please provide a valid Google Sheets URL first.');
            return;
        }
        
        try {
            const sheetUrl = document.getElementById('salesqlSheetUrl')?.value;
            this.showInfo('Exporting to Google Sheets...');
            
            // Export data to Google Sheets
            const result = await window.electronAPI?.exportToGoogleSheets?.({
                sheetUrl: sheetUrl,
                data: this.scrapedData,
                sessionId: this.currentScrapingSession
            });
            
            if (result && result.success) {
                this.showSuccess('Data exported to Google Sheets successfully!');
            } else {
                throw new Error(result?.error || 'Export failed');
            }
        } catch (error) {
            console.error('Google Sheets export failed:', error);
            this.showError('Failed to export to Google Sheets: ' + error.message);
        }
    }
    
    async exportToTaskforce() {
        if (this.scrapedData.length === 0) {
            this.showError('No data to export');
            return;
        }
        
        try {
            // Convert scraped data to Taskforce format
            const taskforceData = this.convertToTaskforceFormat(this.scrapedData);
            
            // Store data for use in email campaigns
            await window.electronAPI?.storeScrapedData?.({
                data: taskforceData,
                sessionId: this.currentScrapingSession
            });
            
            this.showSuccess('Data exported to Taskforce successfully! You can now use it in email campaigns.');
            
            // Close scraper modal and open email campaign interface
            this.hideModal('salesqlScraperModal');
            
        } catch (error) {
            console.error('Taskforce export failed:', error);
            this.showError('Failed to export to Taskforce: ' + error.message);
        }
    }
    
    convertToTaskforceFormat(data) {
        // Convert to format compatible with email campaign system
        return data.map(item => ({
            company: item.company,
            profile: item.profile,
            email: item.email,
            // Add any additional fields needed for email campaigns
            name: item.name || '',
            position: item.position || '',
            phone: item.phone || ''
        }));
    }
    
    convertToCSV(data) {
        if (data.length === 0) return '';
        
        // CRITICAL FIX: Ensure all data for a single contact is on the same row
        const headers = ['Company', 'Profile', 'Email'];
        const csvRows = [headers.join(',')];
        
        for (const row of data) {
            const values = [
                row.company || '',
                row.profile || '',
                row.email || ''
            ];
            
            // Escape commas and quotes properly
            const escapedValues = values.map(value => {
                const stringValue = String(value);
                if (stringValue.includes(',') || stringValue.includes('"') || stringValue.includes('\n')) {
                    return `"${stringValue.replace(/"/g, '""')}"`;
                }
                return stringValue;
            });
            
            csvRows.push(escapedValues.join(','));
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
        URL.revokeObjectURL(url);
    }
    
    initializeGoogleSheetsIntegration() {
        const sheetUrlInput = document.getElementById('salesqlSheetUrl');
        if (sheetUrlInput) {
            sheetUrlInput.addEventListener('change', () => {
                this.updateExportButtons();
            });
        }
    }
    
    updateExportButtons() {
        const sheetsExportBtn = document.querySelector('button[onclick="rtxApp.exportToGoogleSheets()"]');
        if (sheetsExportBtn) {
            sheetsExportBtn.disabled = !this.canExportToSheets();
        }
    }
    
    // Enhanced CSV export with proper row structure
    exportToCSVEnhanced() {
        if (this.scrapedData.length === 0) {
            this.showError('No data to export');
            return;
        }
        
        try {
            const fileName = document.getElementById('scrapingFileName')?.value || 'salesql_data';
            
            // Enhanced CSV with better formatting and validation
            const csv = this.convertToCSVEnhanced(this.scrapedData);
            this.downloadCSV(csv, fileName);
            this.showSuccess('Enhanced CSV exported successfully!');
        } catch (error) {
            console.error('❌ Enhanced export failed:', error);
            this.showError('Enhanced export failed: ' + error.message);
        }
    }
    
    convertToCSVEnhanced(data) {
        if (data.length === 0) return '';
        
        // Enhanced headers with more comprehensive data
        const headers = [
            'Company', 'Profile', 'Email', 'Name', 'Position', 'Phone', 'Industry', 'Location'
        ];
        const csvRows = [headers.join(',')];
        
        for (const row of data) {
            // Ensure all data for a single contact is on the same row
            const values = [
                row.company || '',
                row.profile || '',
                row.email || '',
                row.name || '',
                row.position || '',
                row.phone || '',
                row.industry || '',
                row.location || ''
            ];
            
            // Enhanced escaping for CSV
            const escapedValues = values.map(value => {
                const stringValue = String(value).trim();
                if (stringValue === '') return '';
                
                // Handle special characters properly
                if (stringValue.includes(',') || stringValue.includes('"') || 
                    stringValue.includes('\n') || stringValue.includes('\r')) {
                    return `"${stringValue.replace(/"/g, '""')}"`;
                }
                return stringValue;
            });
            
            csvRows.push(escapedValues.join(','));
        }
        
        return csvRows.join('\n');
    }
    
    // Chrome extension management
    async installChromeExtensionFromAssets() {
        try {
            this.showInfo('Installing Chrome extension from app assets...');
            
            // Install extension using the main process
            const result = await window.electronAPI?.installChromeExtension?.({
                extensionId: this.chromeExtensionId
            });
            
            if (result && result.success) {
                this.showSuccess('Chrome extension installed successfully! Please restart Chrome to activate it.');
                this.chromeExtensionInstalled = true;
                this.updateChromeExtensionStatus();
                
                // Show instructions for using the extension
                this.showExtensionInstructions();
            } else {
                throw new Error(result?.error || 'Installation failed');
            }
        } catch (error) {
            console.error('Extension installation failed:', error);
            this.showError('Failed to install extension: ' + error.message);
            // Fallback to manual installation
            this.showManualExtensionInstallModal();
        }
    }
    
    showManualExtensionInstallModal() {
        const modalHtml = `
            <div id="manualExtensionInstallModal" class="modal">
                <div class="modal-content" style="max-width: 600px;">
                    <div class="modal-header">
                        <h3><i class="fas fa-puzzle-piece"></i> Manual Extension Installation</h3>
                        <button class="btn btn-secondary" onclick="rtxApp.hideModal('manualExtensionInstallModal')">&times;</button>
                    </div>
                    <div class="modal-body">
                        <div style="background: #f8f9fa; padding: 16px; border-radius: 8px; margin-bottom: 20px;">
                            <h4 style="margin-top: 0;">Installation Steps:</h4>
                            <ol style="margin: 0; padding-left: 20px;">
                                <li>Download the SalesQL Scraper extension from the link below</li>
                                <li>Extract the ZIP file to a folder</li>
                                <li>Open Chrome and navigate to <code>chrome://extensions/</code></li>
                                <li>Enable "Developer mode" (toggle in top right)</li>
                                <li>Click "Load unpacked" and select the extracted extension folder</li>
                                <li>Refresh this page to verify installation</li>
                            </ol>
                        </div>
                        
                        <div style="text-align: center; margin-bottom: 20px;">
                            <a href="https://github.com/your-repo/salesql-scraper-extension/releases/latest/download/salesql-scraper.zip" 
                               target="_blank" class="btn btn-primary">
                                <i class="fas fa-download"></i> Download Extension
                            </a>
                        </div>
                        
                        <div style="background: #fff3cd; padding: 12px; border-radius: 6px; border: 1px solid #ffeaa7;">
                            <strong>Note:</strong> If you don't have access to the extension, you can still use the manual data entry feature 
                            by clicking "Start Scraping" without the extension installed.
                        </div>
                    </div>
                </div>
            </div>
        `;
        
        // Remove existing modal if any
        const existingModal = document.getElementById('manualExtensionInstallModal');
        if (existingModal) existingModal.remove();
        
        // Add modal to DOM
        document.body.insertAdjacentHTML('beforeend', modalHtml);
        this.showModal('manualExtensionInstallModal');
    }
    
    // Enhanced Google Sheets integration
    async exportToGoogleSheetsEnhanced() {
        if (!this.canExportToSheets()) {
            this.showError('Please provide a valid Google Sheets URL first.');
            return;
        }
        
        try {
            const sheetUrl = document.getElementById('salesqlSheetUrl')?.value;
            this.showInfo('Exporting to Google Sheets with enhanced formatting...');
            
            // Prepare data with better structure
            const enhancedData = this.prepareDataForGoogleSheets(this.scrapedData);
            
            // Export data to Google Sheets
            const result = await window.electronAPI?.exportToGoogleSheetsEnhanced?.({
                sheetUrl: sheetUrl,
                data: enhancedData,
                sessionId: this.currentScrapingSession,
                createNewTab: true,
                tabName: `SalesQL_Data_${new Date().toISOString().split('T')[0]}`
            });
            
            if (result && result.success) {
                this.showSuccess(`Data exported to Google Sheets successfully! ${result.rowsAdded || 0} rows added.`);
                
                // Open the Google Sheet in browser
                if (result.sheetUrl) {
                    window.open(result.sheetUrl, '_blank');
                }
            } else {
                throw new Error(result?.error || 'Export failed');
            }
        } catch (error) {
            console.error('Enhanced Google Sheets export failed:', error);
            this.showError('Failed to export to Google Sheets: ' + error.message);
        }
    }
    
    prepareDataForGoogleSheets(data) {
        // Prepare data with proper formatting for Google Sheets
        return data.map((item, index) => ({
            row: index + 2, // Start from row 2 (row 1 is headers)
            data: {
                company: item.company || '',
                profile: item.profile || '',
                email: item.email || '',
                name: item.name || '',
                position: item.position || '',
                phone: item.phone || '',
                industry: item.industry || '',
                location: item.location || '',
                scrapedDate: new Date().toISOString().split('T')[0]
            }
        }));
    }
    
    // Enhanced Taskforce integration
    async exportToTaskforceEnhanced() {
        if (this.scrapedData.length === 0) {
            this.showError('No data to export');
            return;
        }
        
        try {
            // Convert scraped data to enhanced Taskforce format
            const taskforceData = this.convertToTaskforceFormatEnhanced(this.scrapedData);
            
            // Store data for use in email campaigns
            const result = await window.electronAPI?.storeScrapedDataEnhanced?.({
                data: taskforceData,
                sessionId: this.currentScrapingSession,
                metadata: {
                    totalContacts: this.scrapedData.length,
                    exportDate: new Date().toISOString(),
                    source: 'SalesQL Scraper'
                }
            });
            
            if (result && result.success) {
                this.showSuccess(`Data exported to Taskforce successfully! ${result.contactsStored || 0} contacts stored.`);
                
                // Close scraper modal and open email campaign interface
                this.hideModal('salesqlScraperModal');
                
                // Show campaign creation prompt
                this.showCampaignCreationPrompt(taskforceData.length);
            } else {
                throw new Error(result?.error || 'Export failed');
            }
        } catch (error) {
            console.error('Enhanced Taskforce export failed:', error);
            this.showError('Failed to export to Taskforce: ' + error.message);
        }
    }
    
    convertToTaskforceFormatEnhanced(data) {
        // Enhanced conversion with more comprehensive data mapping
        return data.map(item => ({
            company: item.company,
            profile: item.profile,
            email: item.email,
            name: item.name || this.extractNameFromProfile(item.profile),
            position: item.position || '',
            phone: item.phone || '',
            industry: item.industry || this.extractIndustryFromCompany(item.company),
            location: item.location || '',
            linkedinUrl: item.profile || '',
            scrapedDate: new Date().toISOString(),
            status: 'active',
            tags: ['salesql-scraped', 'new-contact']
        }));
    }
    
    extractNameFromProfile(profileUrl) {
        if (!profileUrl) return '';
        
        try {
            // Extract name from LinkedIn profile URL
            const match = profileUrl.match(/\/in\/([^\/\?]+)/);
            if (match) {
                return match[1].replace(/[-_]/g, ' ').replace(/\b\w/g, l => l.toUpperCase());
            }
        } catch (e) {
            console.warn('Failed to extract name from profile:', e);
        }
        
        return '';
    }
    
    extractIndustryFromCompany(companyName) {
        if (!companyName) return '';
        
        // Simple industry detection based on company name
        const name = companyName.toLowerCase();
        
        if (name.includes('tech') || name.includes('software') || name.includes('digital')) return 'Technology';
        if (name.includes('finance') || name.includes('bank') || name.includes('investment')) return 'Finance';
        if (name.includes('health') || name.includes('medical') || name.includes('pharma')) return 'Healthcare';
        if (name.includes('retail') || name.includes('ecommerce') || name.includes('shop')) return 'Retail';
        if (name.includes('manufacturing') || name.includes('industrial') || name.includes('factory')) return 'Manufacturing';
        
        return 'Other';
    }
    
    showCampaignCreationPrompt(contactCount) {
        const modalHtml = `
            <div id="campaignCreationPromptModal" class="modal">
                <div class="modal-content" style="max-width: 500px;">
                    <div class="modal-header">
                        <h3><i class="fas fa-paper-plane"></i> Create Email Campaign</h3>
                        <button class="btn btn-secondary" onclick="rtxApp.hideModal('campaignCreationPromptModal')">&times;</button>
                    </div>
                    <div class="modal-body">
                        <div style="text-align: center; margin-bottom: 20px;">
                            <i class="fas fa-check-circle" style="font-size: 48px; color: #34C759; margin-bottom: 16px; display: block;"></i>
                            <h4>Data Export Successful!</h4>
                            <p>${contactCount} contacts have been imported from SalesQL Scraper.</p>
                        </div>
                        
                        <div style="background: #f8f9fa; padding: 16px; border-radius: 8px; margin-bottom: 20px;">
                            <h5 style="margin-top: 0;">Next Steps:</h5>
                            <ul style="margin: 0; padding-left: 20px;">
                                <li>Create a new email campaign</li>
                                <li>Select your imported contacts</li>
                                <li>Write your email content</li>
                                <li>Send your campaign</li>
                            </ul>
                        </div>
                        
                        <div style="display: flex; gap: 8px; justify-content: center;">
                            <button class="btn btn-secondary" onclick="rtxApp.hideModal('campaignCreationPromptModal')">Later</button>
                            <button class="btn btn-primary" onclick="rtxApp.createNewCampaignFromScrapedData()">
                                <i class="fas fa-plus"></i> Create Campaign
                            </button>
                        </div>
                    </div>
                </div>
            </div>
        `;
        
        // Remove existing modal if any
        const existingModal = document.getElementById('campaignCreationPromptModal');
        if (existingModal) existingModal.remove();
        
        // Add modal to DOM
        document.body.insertAdjacentHTML('beforeend', modalHtml);
        this.showModal('campaignCreationPromptModal');
    }
    
    createNewCampaignFromScrapedData() {
        // Close the prompt modal
        this.hideModal('campaignCreationPromptModal');
        
        // Create a new campaign tab
        this.addNewTab();
        
        // Pre-populate with scraped data
        this.populateCampaignWithScrapedData();
        
        this.showSuccess('New campaign created with scraped data!');
    }
    
    populateCampaignWithScrapedData() {
        // This will be implemented to populate the campaign form with scraped data
        // For now, just show a success message
        console.log('Campaign populated with scraped data');
    }

    // Add missing methods to fix errors
    logEvent(level, message, meta = null) {
        console.log(`[${level.toUpperCase()}] ${message}`, meta);
        // Send to main process for logging
        if (window.electronAPI?.logEvent) {
            window.electronAPI.logEvent({ level, message, meta });
        }
    }

    initializeLivePreview() {
        try {
            // Get all input elements that should trigger preview updates
            const emailEditor = document.getElementById('emailEditor');
            const campaignSubject = document.getElementById('campaignSubject');
            const fromName = document.getElementById('fromName');
            const refreshPreviewBtn = document.getElementById('refreshPreviewBtn');

            if (emailEditor) {
                emailEditor.addEventListener('input', () => this.debouncePreviewUpdate());
                emailEditor.addEventListener('paste', () => this.debouncePreviewUpdate());
            }

            if (campaignSubject) {
                campaignSubject.addEventListener('input', () => this.debouncePreviewUpdate());
            }

            if (fromName) {
                fromName.addEventListener('input', () => this.debouncePreviewUpdate());
            }

            if (refreshPreviewBtn) {
                refreshPreviewBtn.addEventListener('click', () => this.refreshEmailPreview());
            }

            console.log('✅ Live preview system initialized');
        } catch (error) {
            console.error('❌ Failed to initialize live preview:', error);
        }
    }

    debouncePreviewUpdate() {
        if (this.previewUpdateTimeout) {
            clearTimeout(this.previewUpdateTimeout);
        }
        this.previewUpdateTimeout = setTimeout(() => {
            this.refreshEmailPreview();
        }, 200);
    }

    refreshEmailPreview() {
        try {
            const previewContainer = document.getElementById('emailPreview');
            if (!previewContainer) return;

            const subject = document.getElementById('campaignSubject')?.value || '';
            const content = document.getElementById('emailEditor')?.innerHTML || '';
            const fromName = document.getElementById('fromName')?.value || '';
            const signature = this.currentSignature || '';

            const previewHTML = `
                <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; border: 1px solid #ddd; padding: 20px; background: white;">
                    <div style="margin-bottom: 20px; padding-bottom: 20px; border-bottom: 1px solid #eee;">
                        <strong>From:</strong> ${fromName || 'Your Name'}<br>
                        <strong>Subject:</strong> ${subject || 'Email Subject'}
                    </div>
                    <div style="line-height: 1.6; color: #333;">
                        ${content || '<em>Email content will appear here...</em>'}
                    </div>
                    ${signature ? `<div style="margin-top: 20px; padding-top: 20px; border-top: 1px solid #eee; color: #666; font-size: 14px;">${signature}</div>` : ''}
                    <div style="margin-top: 20px; padding: 10px; background: #f8f9fa; border-radius: 4px; font-size: 12px; color: #666; text-align: center;">
                        📧 Live Preview - This is exactly how your email will appear
                    </div>
                </div>
            `;

            previewContainer.innerHTML = previewHTML;
        } catch (error) {
            console.error('❌ Failed to refresh email preview:', error);
        }
    }

    addNewTab() {
        try {
            const tabList = document.getElementById('tabList');
            if (!tabList) {
                console.error('❌ Tab list not found');
                return;
            }

            const tabId = `tab-${Date.now()}`;
            const tabName = `Campaign ${tabList.children.length + 1}`;

            // Create new tab button
            const newTab = document.createElement('li');
            newTab.className = 'tab-item';
            newTab.setAttribute('data-tab', tabId);
            newTab.style.cssText = 'padding:8px 16px; background:#e5e5e7; color:#2c2c2e; border-radius:6px; cursor:pointer; display:flex; align-items:center; gap:8px;';
            newTab.innerHTML = `
                ${tabName}
                <span class="tab-close" onclick="window.rtxApp.closeTab('${tabId}')" style="cursor:pointer; font-weight:bold;">&times;</span>
            `;
            newTab.onclick = () => this.switchTab(tabId);
            tabList.appendChild(newTab);

            // Create new tab content
            const newContent = document.createElement('div');
            newContent.className = 'tab-content';
            newContent.id = `tab-${tabId}`;
            newContent.style.display = 'none';
            
            // Clone the main form content
            const mainForm = document.querySelector('.mailer-interface');
            if (mainForm) {
                const clonedForm = mainForm.cloneNode(true);
                clonedForm.id = `mailer-interface-${tabId}`;
                this.updateElementIds(clonedForm, tabId);
                
                // Reset form state for new tab
                this.resetFormForNewTab(clonedForm, tabId);
                
                newContent.appendChild(clonedForm);
            }

            // Add to content area
            const contentArea = document.querySelector('.content-area');
            if (contentArea) {
                contentArea.appendChild(newContent);
            }

            // Switch to the new tab
            this.switchTab(tabId);
            
            console.log('✅ New tab created:', tabName);
        } catch (error) {
            console.error('❌ Failed to create new tab:', error);
        }
    }

    resetFormForNewTab(form, tabId) {
        try {
            // Reset all form inputs
            const inputs = form.querySelectorAll('input[type="text"], input[type="email"], textarea, select');
            inputs.forEach(input => {
                if (input.type === 'select-one') {
                    input.selectedIndex = 0;
                } else {
                    input.value = '';
                }
            });

            // Reset email editor
            const editor = form.querySelector('#emailEditor');
            if (editor) {
                editor.innerHTML = '';
                editor.textContent = '';
            }

            // Reset attachments
            const attachmentContainer = form.querySelector('#campaignAttachments');
            if (attachmentContainer) {
                attachmentContainer.innerHTML = `
                    <div style="text-align: center; color: #8E8E93;">
                        <i class="fas fa-paperclip" style="font-size: 20px; margin-bottom: 8px; display: block;"></i>
                        <p>No attachments selected</p>
                        <small style="font-size: 11px; color: #c7c7cc;">Attachments are required by default</small>
                    </div>
                `;
            }

            // Reset preview
            const preview = form.querySelector('#emailPreview');
            if (preview) {
                preview.innerHTML = `
                    <div style="text-align: center; color: #8E8E93; padding: 40px 20px;">
                        <i class="fas fa-eye" style="font-size: 32px; margin-bottom: 16px; display: block;"></i>
                        <p>Preview will appear here after you fill in the campaign details</p>
                        <small>Click "Refresh Preview" to update the preview with current content</small>
                    </div>
                `;
            }

            // Reset data preview
            const dataPreview = form.querySelector('#dataPreviewDrawer');
            if (dataPreview) {
                dataPreview.style.display = 'none';
            }

            // Reset sheet connection
            const sheetUrlInput = form.querySelector('#sheetUrlInput');
            if (sheetUrlInput) {
                sheetUrlInput.value = '';
            }

            // Reset authentication state for this tab
            this.resetTabAuthentication(tabId);

            console.log('✅ Form reset for new tab:', tabId);
        } catch (error) {
            console.error('❌ Failed to reset form for new tab:', error);
        }
    }

    resetTabAuthentication(tabId) {
        try {
            // Store tab-specific authentication state
            if (!this.tabAuthStates) {
                this.tabAuthStates = new Map();
            }

            // Initialize with no authentication
            this.tabAuthStates.set(tabId, {
                isAuthenticated: false,
                currentAccount: null,
                sheetData: null,
                fromAddress: null
            });

            // Update UI elements for this tab
            const tabForm = document.querySelector(`#mailer-interface-${tabId}`);
            if (tabForm) {
                const authStatus = tabForm.querySelector('#authStatus');
                const accountStatus = tabForm.querySelector('#accountStatus');
                const fromAddress = tabForm.querySelector('#fromAddress');

                if (authStatus) {
                    authStatus.className = 'status-indicator disconnected';
                }
                if (accountStatus) {
                    accountStatus.textContent = 'Not Connected';
                }
                if (fromAddress) {
                    fromAddress.innerHTML = '<option value="">Select from address...</option>';
                }
            }

            console.log('✅ Authentication reset for tab:', tabId);
        } catch (error) {
            console.error('❌ Failed to reset tab authentication:', error);
        }
    }

    switchTab(tabId) {
        try {
            // Hide all tab content
            const tabContents = document.querySelectorAll('.tab-content');
            tabContents.forEach(content => {
                content.style.display = 'none';
            });

            // Remove active class from all tabs
            const tabs = document.querySelectorAll('.tab-item');
            tabs.forEach(tab => {
                tab.style.background = '#e5e5e7';
                tab.style.color = '#2c2c2e';
            });

            // Show selected tab content
            const selectedContent = document.getElementById(`tab-${tabId}`);
            if (selectedContent) {
                selectedContent.style.display = 'block';
            }

            // Add active class to selected tab
            const selectedTab = document.querySelector(`[data-tab="${tabId}"]`);
            if (selectedTab) {
                selectedTab.style.background = '#007AFF';
                selectedTab.style.color = '#fff';
            }

            // Update authentication state for this tab
            this.updateTabAuthenticationDisplay(tabId);

            console.log('✅ Switched to tab:', tabId);
        } catch (error) {
            console.error('❌ Failed to switch tab:', error);
        }
    }

    updateTabAuthenticationDisplay(tabId) {
        try {
            if (!this.tabAuthStates || !this.tabAuthStates.has(tabId)) {
                return;
            }

            const authState = this.tabAuthStates.get(tabId);
            const tabForm = document.querySelector(`#mailer-interface-${tabId}`);
            
            if (!tabForm) return;

            const authStatus = tabForm.querySelector('#authStatus');
            const accountStatus = tabForm.querySelector('#accountStatus');
            const fromAddress = tabForm.querySelector('#fromAddress');

            if (authStatus) {
                authStatus.className = authState.isAuthenticated ? 'status-indicator connected' : 'status-indicator disconnected';
            }

            if (accountStatus) {
                accountStatus.textContent = authState.isAuthenticated ? 
                    `Connected: ${authState.currentAccount || 'Authenticated'}` : 
                    'Not Connected';
            }

            if (fromAddress && authState.fromAddress) {
                fromAddress.value = authState.fromAddress;
            }

            console.log('✅ Tab authentication display updated for:', tabId);
        } catch (error) {
            console.error('❌ Failed to update tab authentication display:', error);
        }
    }

    getCurrentActiveTab() {
        try {
            const activeTab = document.querySelector('.tab-item[style*="background: rgb(0, 122, 255)"]');
            if (activeTab) {
                return activeTab.getAttribute('data-tab');
            }
            return null;
        } catch (error) {
            console.error('❌ Failed to get current active tab:', error);
            return null;
        }
    }

    closeTab(tabId) {
        try {
            // Don't close the last tab
            const tabList = document.getElementById('tabList');
            if (tabList.children.length <= 1) {
                this.showError('Cannot close the last tab');
                return;
            }

            // Remove tab button
            const tabButton = document.querySelector(`[data-tab="${tabId}"]`);
            if (tabButton) {
                tabButton.remove();
            }

            // Remove tab content
            const tabContent = document.getElementById(`tab-${tabId}`);
            if (tabContent) {
                tabContent.remove();
            }

            // Clean up tab-specific authentication state
            if (this.tabAuthStates && this.tabAuthStates.has(tabId)) {
                this.tabAuthStates.delete(tabId);
            }

            // Switch to first available tab
            const firstTab = tabList.querySelector('.tab-item');
            if (firstTab) {
                const firstTabId = firstTab.getAttribute('data-tab');
                this.switchTab(firstTabId);
            }

            console.log('✅ Tab closed:', tabId);
        } catch (error) {
            console.error('❌ Failed to close tab:', error);
        }
    }

    updateElementIds(element, tabId) {
        // Update all element IDs to be unique for this tab
        const elements = element.querySelectorAll('[id]');
        elements.forEach(el => {
            if (el.id) {
                el.id = `${el.id}-${tabId}`;
            }
        });
    }

    setupTabEventListeners() {
        try {
            const addTabBtn = document.getElementById('add-tab-btn');
            if (addTabBtn) {
                addTabBtn.addEventListener('click', () => this.addNewTab());
            }

            // Set up close tab event delegation
            document.addEventListener('click', (e) => {
                if (e.target.classList.contains('close-tab')) {
                    const tabItem = e.target.closest('.tab-item');
                    if (tabItem) {
                        const tabId = tabItem.id.replace('tab-btn-', '');
                        this.closeTab(tabId);
                    }
                }
            });

            console.log('✅ Tab event listeners setup complete');
        } catch (error) {
            console.error('❌ Failed to setup tab event listeners:', error);
        }
    }

    // Placeholder system methods
    initializePlaceholderSystem() {
        try {
            const emailEditor = document.getElementById('emailEditor');
            const subjectInput = document.getElementById('campaignSubject');
            
            if (!emailEditor) return;

            // Create placeholder dropdown
            this.createPlaceholderDropdown();

            // Add input event listener for @ symbol to email editor
            emailEditor.addEventListener('input', (e) => this.handlePlaceholderInputEnhanced(e));
            
            // Add input event listener for @ symbol to subject line
            if (subjectInput) {
                subjectInput.addEventListener('input', (e) => this.handlePlaceholderInputEnhanced(e));
            }
            
            // Hide dropdown when clicking outside
            document.addEventListener('click', (e) => {
                if (!e.target.closest('.placeholder-dropdown') && 
                    !e.target.closest('#emailEditor') && 
                    !e.target.closest('#campaignSubject')) {
                    this.hidePlaceholderDropdown();
                }
            });

            console.log('✅ Placeholder system initialized for editor and subject line');
        } catch (error) {
            console.error('❌ Failed to initialize placeholder system:', error);
        }
    }

    createPlaceholderDropdown() {
        try {
            // Remove existing dropdown if any
            const existingDropdown = document.querySelector('.placeholder-dropdown');
            if (existingDropdown) {
                existingDropdown.remove();
            }

            // Create dropdown container
            const dropdown = document.createElement('div');
            dropdown.className = 'placeholder-dropdown';
            dropdown.style.cssText = `
                position: absolute;
                background: white;
                border: 1px solid #ddd;
                border-radius: 4px;
                box-shadow: 0 2px 10px rgba(0,0,0,0.1);
                max-height: 200px;
                overflow-y: auto;
                z-index: 1000;
                display: none;
                min-width: 200px;
            `;

            // Add placeholder items
            const placeholders = this.getAvailablePlaceholders();
            if (placeholders.length === 0) {
                // Add default placeholders if no sheet data
                const defaultPlaceholders = [
                    { key: 'Name', description: 'Recipient name', value: '((Name))' },
                    { key: 'Company', description: 'Company name', value: '((Company))' },
                    { key: 'Email', description: 'Email address', value: '((Email))' },
                    { key: 'Title', description: 'Job title', value: '((Title))' },
                    { key: 'Phone', description: 'Phone number', value: '((Phone))' },
                    { key: 'LinkedIn', description: 'LinkedIn profile', value: '((LinkedIn))' }
                ];
                
                defaultPlaceholders.forEach(placeholder => {
                    const item = this.createPlaceholderItem(placeholder);
                    dropdown.appendChild(item);
                });
            } else {
                placeholders.forEach(placeholder => {
                    const item = this.createPlaceholderItem(placeholder);
                    dropdown.appendChild(item);
                });
            }

            // Add to body
            document.body.appendChild(dropdown);
            this.placeholderDropdown = dropdown;
            
            console.log('✅ Placeholder dropdown created');
        } catch (error) {
            console.error('❌ Failed to create placeholder dropdown:', error);
        }
    }

    createPlaceholderItem(placeholder) {
        try {
            const item = document.createElement('div');
            item.className = 'placeholder-item';
            item.style.cssText = `
                padding: 8px 12px;
                cursor: pointer;
                border-bottom: 1px solid #eee;
                font-size: 14px;
                transition: background-color 0.2s ease;
            `;
            item.innerHTML = `
                <strong>${this.escapeHtml(placeholder.key)}</strong>
                <br><small style="color: #666;">${this.escapeHtml(placeholder.description || '')}</small>
            `;
            item.onclick = () => this.insertPlaceholderFromDropdown(placeholder.value || `((${placeholder.key}))`);
            
            // Hover effects
            item.onmouseenter = () => {
                item.style.backgroundColor = '#f5f5f5';
            };
            item.onmouseleave = () => {
                item.style.backgroundColor = 'white';
            };
            
            return item;
        } catch (error) {
            console.error('❌ Failed to create placeholder item:', error);
            return null;
        }
    }

    handlePlaceholderInput(e) {
        try {
            const editor = e.target;
            const text = editor.textContent || '';
            const cursorPosition = this.getCursorPosition(editor);
            
            // Check if @ was typed
            if (text.includes('@')) {
                const lastAtSymbol = text.lastIndexOf('@');
                if (lastAtSymbol <= cursorPosition) {
                    const afterAt = text.substring(lastAtSymbol + 1, cursorPosition);
                    
                    // If @ is followed by text, filter dropdown
                    if (afterAt.trim()) {
                        this.filterPlaceholderDropdown(afterAt);
                        this.showPlaceholderDropdown(editor, lastAtSymbol);
                    } else {
                        // Show all placeholders
                        this.showPlaceholderDropdown(editor, lastAtSymbol);
                    }
                }
            } else {
                // Hide dropdown if no @ symbol
                this.hidePlaceholderDropdown();
            }
        } catch (error) {
            console.error('❌ Failed to handle placeholder input:', error);
        }
    }

    // Enhanced placeholder input handling with better @ detection
    handlePlaceholderInputEnhanced(e) {
        try {
            const editor = e.target;
            const text = editor.textContent || '';
            const cursorPosition = this.getCursorPosition(editor);
            
            // Check if @ was just typed
            if (e.data === '@') {
                // Show dropdown immediately when @ is typed
                this.showPlaceholderDropdown(editor, cursorPosition - 1);
                return;
            }
            
            // Check if @ exists and we're typing after it
            if (text.includes('@')) {
                const lastAtSymbol = text.lastIndexOf('@');
                if (lastAtSymbol < cursorPosition) {
                    const afterAt = text.substring(lastAtSymbol + 1, cursorPosition);
                    
                    // If @ is followed by text, filter dropdown
                    if (afterAt.trim()) {
                        this.filterPlaceholderDropdown(afterAt);
                        this.showPlaceholderDropdown(editor, lastAtSymbol);
                    } else {
                        // Show all placeholders
                        this.showPlaceholderDropdown(editor, lastAtSymbol);
                    }
                }
            } else {
                // Hide dropdown if no @ symbol
                this.hidePlaceholderDropdown();
            }
        } catch (error) {
            console.error('❌ Failed to handle enhanced placeholder input:', error);
        }
    }

    getCursorPosition(element) {
        try {
            const selection = window.getSelection();
            if (selection.rangeCount > 0) {
                const range = selection.getRangeAt(0);
                const preCaretRange = range.cloneRange();
                preCaretRange.selectNodeContents(element);
                preCaretRange.setEnd(range.endContainer, range.endOffset);
                return preCaretRange.toString().length;
            }
            return 0;
        } catch (error) {
            console.error('❌ Failed to get cursor position:', error);
            return 0;
        }
    }

    showPlaceholderDropdown(editor, atPosition) {
        try {
            if (!this.placeholderDropdown) return;

            // Position dropdown relative to the editor element
            const rect = editor.getBoundingClientRect();
            
            // Calculate position based on text content before @ symbol
            const textBeforeAt = editor.textContent.substring(0, atPosition);
            const tempSpan = document.createElement('span');
            tempSpan.style.cssText = 'position: absolute; visibility: hidden; white-space: pre; font-family: inherit; font-size: inherit;';
            tempSpan.textContent = textBeforeAt;
            document.body.appendChild(tempSpan);
            
            const atRect = tempSpan.getBoundingClientRect();
            document.body.removeChild(tempSpan);

            // Position dropdown below the @ symbol in the editor
            this.placeholderDropdown.style.position = 'fixed';
            this.placeholderDropdown.style.left = `${rect.left + atRect.width}px`;
            this.placeholderDropdown.style.top = `${rect.bottom + 5}px`;
            this.placeholderDropdown.style.zIndex = '10000';
            this.placeholderDropdown.style.display = 'block';
            
            console.log('✅ Placeholder dropdown shown at editor position');
        } catch (error) {
            console.error('❌ Failed to show placeholder dropdown:', error);
        }
    }

    filterPlaceholderDropdown(filterText) {
        try {
            if (!this.placeholderDropdown) return;

            const items = this.placeholderDropdown.querySelectorAll('.placeholder-item');
            items.forEach(item => {
                const key = item.querySelector('strong').textContent.toLowerCase();
                if (key.includes(filterText.toLowerCase())) {
                    item.style.display = 'block';
                } else {
                    item.style.display = 'none';
                }
            });
        } catch (error) {
            console.error('❌ Failed to filter placeholder dropdown:', error);
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

    insertPlaceholderFromDropdown(placeholderValue) {
        try {
            // Find the active editor (email editor or subject input)
            let activeEditor = document.getElementById('emailEditor');
            let isSubjectInput = false;
            
            // Check if subject input is focused
            if (document.activeElement && document.activeElement.id === 'campaignSubject') {
                activeEditor = document.activeElement;
                isSubjectInput = true;
            }
            
            if (!activeEditor) return;

            // Find the @ symbol and replace it with the placeholder
            const text = activeEditor.textContent || activeEditor.value || '';
            const lastAtSymbol = text.lastIndexOf('@');
            
            if (lastAtSymbol !== -1) {
                if (isSubjectInput) {
                    // For subject input, replace from @ to cursor
                    const beforeAt = text.substring(0, lastAtSymbol);
                    const afterCursor = text.substring(activeEditor.selectionStart || text.length);
                    const newText = beforeAt + placeholderValue + afterCursor;
                    activeEditor.value = newText;
                    
                    // Set cursor position after placeholder
                    const newPosition = lastAtSymbol + placeholderValue.length;
                    activeEditor.setSelectionRange(newPosition, newPosition);
                } else {
                    // For contenteditable editor
                    const selection = window.getSelection();
                    if (selection.rangeCount > 0) {
                        const range = selection.getRangeAt(0);
                        
                        // Find the @ symbol in the current selection
                        const node = range.startContainer;
                        if (node.nodeType === Node.TEXT_NODE) {
                            const text = node.textContent;
                            const atIndex = text.lastIndexOf('@');
                            if (atIndex !== -1) {
                                // Replace from @ to cursor
                                const beforeAt = text.substring(0, atIndex);
                                const afterCursor = text.substring(range.startOffset);
                                const newText = beforeAt + placeholderValue + afterCursor;
                                
                                node.textContent = newText;
                                
                                // Set cursor position after placeholder
                                const newPosition = atIndex + placeholderValue.length;
                                range.setStart(node, newPosition);
                                range.setEnd(node, newPosition);
                                selection.removeAllRanges();
                                selection.addRange(range);
                            }
                        }
                    }
                }
            }

            // Hide dropdown
            this.hidePlaceholderDropdown();
            
            // Focus back to editor
            activeEditor.focus();
            
            // Update preview
            this.debouncePreviewUpdate();
            
            console.log('✅ Placeholder inserted:', placeholderValue);
        } catch (error) {
            console.error('❌ Failed to insert placeholder:', error);
        }
    }

    getAvailablePlaceholders() {
        try {
            // If we have sheet data, use actual column headers
            if (this.sheetData && this.sheetData.headers) {
                return this.sheetData.headers.map(header => ({
                    key: header,
                    value: `((${header}))`,
                    description: `Data from column: ${header}`
                }));
            }
            
            // Return default placeholders if no sheet data
            return [
                { key: 'Name', value: '((Name))', description: 'Recipient name' },
                { key: 'Company', value: '((Company))', description: 'Company name' },
                { key: 'Email', value: '((Email))', description: 'Email address' },
                { key: 'Title', value: '((Title))', description: 'Job title' },
                { key: 'Phone', value: '((Phone))', description: 'Phone number' },
                { key: 'LinkedIn', value: '((LinkedIn))', description: 'LinkedIn profile' },
                { key: 'Industry', value: '((Industry))', description: 'Industry' },
                { key: 'Location', value: '((Location))', description: 'Location' },
                { key: 'Date', value: '((Date))', description: 'Current date' },
                { key: 'Sender Name', value: '((Sender Name))', description: 'Your name' },
                { key: 'Sender Email', value: '((Sender Email))', description: 'Your email' }
            ];
        } catch (error) {
            console.error('❌ Failed to get available placeholders:', error);
            return [];
        }
    }

    // Modal methods for template management
    showTemplateNameModal() {
        return new Promise((resolve) => {
            // Create modal container
            const modal = document.createElement('div');
            modal.style.cssText = `
                position: fixed;
                top: 0;
                left: 0;
                width: 100%;
                height: 100%;
                background: rgba(0, 0, 0, 0.5);
                display: flex;
                justify-content: center;
                align-items: center;
                z-index: 10000;
            `;

            // Create modal content
            const modalContent = document.createElement('div');
            modalContent.style.cssText = `
                background: white;
                padding: 30px;
                border-radius: 8px;
                box-shadow: 0 4px 20px rgba(0, 0, 0, 0.3);
                max-width: 400px;
                width: 90%;
            `;

            modalContent.innerHTML = `
                <h3 style="margin: 0 0 20px 0; color: #333;">Save Template</h3>
                <p style="margin: 0 0 20px 0; color: #666;">Enter a name for your template:</p>
                <input type="text" id="templateNameInput" placeholder="Template name" style="
                    width: 100%;
                    padding: 12px;
                    border: 1px solid #ddd;
                    border-radius: 4px;
                    font-size: 16px;
                    margin-bottom: 20px;
                    box-sizing: border-box;
                ">
                <div style="display: flex; gap: 10px; justify-content: flex-end;">
                    <button id="cancelTemplateBtn" style="
                        padding: 10px 20px;
                        border: 1px solid #ddd;
                        background: white;
                        border-radius: 4px;
                        cursor: pointer;
                        font-size: 14px;
                    ">Cancel</button>
                    <button id="saveTemplateBtn" style="
                        padding: 10px 20px;
                        background: #007bff;
                        color: white;
                        border: none;
                        border-radius: 4px;
                        cursor: pointer;
                        font-size: 14px;
                    ">Save</button>
                </div>
            `;

            modal.appendChild(modalContent);
            document.body.appendChild(modal);

            // Focus on input
            const input = modal.querySelector('#templateNameInput');
            input.focus();

            // Handle Enter key
            input.addEventListener('keypress', (e) => {
                if (e.key === 'Enter') {
                    const saveBtn = modal.querySelector('#saveTemplateBtn');
                    saveBtn.click();
                }
            });

            // Handle save button
            modal.querySelector('#saveTemplateBtn').addEventListener('click', () => {
                const name = input.value.trim();
                if (name) {
                    document.body.removeChild(modal);
                    resolve(name);
                } else {
                    input.style.borderColor = '#dc3545';
                    input.placeholder = 'Template name is required';
                }
            });

            // Handle cancel button
            modal.querySelector('#cancelTemplateBtn').addEventListener('click', () => {
                document.body.removeChild(modal);
                resolve(null);
            });

            // Handle click outside modal
            modal.addEventListener('click', (e) => {
                if (e.target === modal) {
                    document.body.removeChild(modal);
                    resolve(null);
                }
            });
        });
    }

    showConfirmModal(message) {
        return new Promise((resolve) => {
            // Create modal container
            const modal = document.createElement('div');
            modal.style.cssText = `
                position: fixed;
                top: 0;
                left: 0;
                width: 100%;
                height: 100%;
                background: rgba(0, 0, 0, 0.5);
                display: flex;
                justify-content: center;
                align-items: center;
                z-index: 10000;
            `;

            // Create modal content
            const modalContent = document.createElement('div');
            modalContent.style.cssText = `
                background: white;
                padding: 30px;
                border-radius: 8px;
                box-shadow: 0 4px 20px rgba(0, 0, 0, 0.3);
                max-width: 400px;
                width: 90%;
            `;

            modalContent.innerHTML = `
                <h3 style="margin: 0 0 20px 0; color: #333;">Confirm Action</h3>
                <p style="margin: 0 0 20px 0; color: #666;">${message}</p>
                <div style="display: flex; gap: 10px; justify-content: flex-end;">
                    <button id="cancelConfirmBtn" style="
                        padding: 10px 20px;
                        border: 1px solid #ddd;
                        background: white;
                        border-radius: 4px;
                        cursor: pointer;
                        font-size: 14px;
                    ">Cancel</button>
                    <button id="confirmBtn" style="
                        padding: 10px 20px;
                        background: #dc3545;
                        color: white;
                        border: none;
                        border-radius: 4px;
                        cursor: pointer;
                        font-size: 14px;
                    ">Confirm</button>
                </div>
            `;

            modal.appendChild(modalContent);
            document.body.appendChild(modal);

            // Handle confirm button
            modal.querySelector('#confirmBtn').addEventListener('click', () => {
                document.body.removeChild(modal);
                resolve(true);
            });

            // Handle cancel button
            modal.querySelector('#cancelConfirmBtn').addEventListener('click', () => {
                document.body.removeChild(modal);
                resolve(false);
            });

            // Handle click outside modal
            modal.addEventListener('click', (e) => {
                if (e.target === modal) {
                    document.body.removeChild(modal);
                    resolve(false);
                }
            });
        });
    }
}

// Initialize app when DOM is loaded
document.addEventListener('DOMContentLoaded', () => {
    console.log('DOM loaded, initializing RTX App...');
    if (!window.rtxApp) window.rtxApp = new RTXApp();
});