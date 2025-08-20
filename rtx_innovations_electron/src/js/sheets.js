// Google Sheets Integration Manager
class SheetsManager {
    constructor() {
        this.isConnected = false;
        this.currentSheet = null;
        this.sheetData = null;
        this.headers = [];
        this.rows = [];
        this.init();
    }

    init() {
        this.setupEventListeners();
        console.log('📊 Sheets manager initialized');
    }

    setupEventListeners() {
        const connectBtn = document.getElementById('connectSheetsBtn');
        if (connectBtn) {
            connectBtn.addEventListener('click', () => this.connectToSheets());
        }

        const refreshBtn = document.getElementById('refreshSheetsBtn');
        if (refreshBtn) {
            refreshBtn.addEventListener('click', () => this.refreshData());
        }
    }

    async connectToSheets() {
        try {
            if (!window.authManager || !window.authManager.isUserAuthenticated()) {
                this.showError('Please authenticate with Google first');
                return;
            }

            this.showLoading('Connecting to Google Sheets...');
            
            // Get sheet URL from user
            const sheetUrl = await this.getSheetUrl();
            if (!sheetUrl) {
                this.hideLoading();
                return;
            }

            // Extract sheet ID from URL
            const sheetId = this.extractSheetId(sheetUrl);
            if (!sheetId) {
            this.hideLoading();
                this.showError('Invalid Google Sheets URL');
                return;
            }

            // Simulate connection for now
            await this.simulateSheetsConnection(sheetId);

        } catch (error) {
            this.hideLoading();
            this.showError('Failed to connect to Google Sheets: ' + error.message);
        }
    }

    async getSheetUrl() {
        return prompt('Enter your Google Sheets URL:');
    }

    extractSheetId(url) {
        const patterns = [
            /\/spreadsheets\/d\/([a-zA-Z0-9-_]+)/,
            /key=([a-zA-Z0-9-_]+)/,
            /^([a-zA-Z0-9-_]+)$/
        ];

        for (const pattern of patterns) {
            const match = url.match(pattern);
            if (match) {
                return match[1];
        }
        }
        return null;
    }

    async simulateSheetsConnection(sheetId) {
        await new Promise(resolve => setTimeout(resolve, 2000));

        const mockData = {
            headers: ['Name', 'Email', 'Company', 'Position', 'Status'],
            rows: [
                ['John Doe', 'john@example.com', 'Acme Corp', 'Manager', 'Active'],
                ['Jane Smith', 'jane@company.com', 'Tech Inc', 'Developer', 'Active'],
                ['Bob Johnson', 'bob@startup.com', 'Startup Co', 'Founder', 'Pending']
            ]
        };

        this.onSheetsConnected(sheetId, mockData);
    }

    onSheetsConnected(sheetId, data) {
        this.isConnected = true;
        this.currentSheet = sheetId;
        this.sheetData = data;
        
        // Detect email and name columns intelligently
        this.detectEmailColumns();
        
        // Update UI
        this.updateSheetsUI();
        
        this.showSuccess('Successfully connected to Google Sheets!');
        this.logEvent('info', 'Google Sheets connected successfully');
    }
    
    // Intelligent email column detection
    detectEmailColumns() {
        try {
            if (!this.sheetData || !this.sheetData.headers) return;
            
            const headers = this.sheetData.headers;
            this.detectedEmailColumns = [];
            this.detectedNameColumns = [];
            
            // Common email column variations
            const emailPatterns = [
                'email', 'gmail', 'mail', 'mailid', 'email1', 'email 1', 'email-1',
                'e-mail', 'e_mail', 'emailaddress', 'email_address', 'emailaddress1',
                'primary_email', 'primaryemail', 'contact_email', 'contactemail',
                'work_email', 'workemail', 'personal_email', 'personalemail'
            ];
            
            // Common name column variations
            const namePatterns = [
                'name', 'fullname', 'full_name', 'firstname', 'first_name', 'lastname', 'last_name',
                'first', 'last', 'given_name', 'family_name', 'display_name', 'displayname',
                'contact_name', 'contactname', 'customer_name', 'customername'
            ];
            
            headers.forEach((header, index) => {
                const headerLower = header.toLowerCase().replace(/[^a-z0-9]/g, '');
                
                // Check for email columns
                if (emailPatterns.some(pattern => headerLower.includes(pattern))) {
                    this.detectedEmailColumns.push({ header, index, confidence: 'high' });
                }
                
                // Check for name columns
                if (namePatterns.some(pattern => headerLower.includes(pattern))) {
                    this.detectedNameColumns.push({ header, index, confidence: 'high' });
                }
            });
            
            // If no high-confidence matches, try fuzzy matching
            if (this.detectedEmailColumns.length === 0) {
                headers.forEach((header, index) => {
                    const headerLower = header.toLowerCase();
                    if (headerLower.includes('@') || headerLower.includes('mail')) {
                        this.detectedEmailColumns.push({ header, index, confidence: 'medium' });
                    }
                });
            }
            
                    this.logEvent('info', 'Email columns detected', { 
            emailColumns: this.detectedEmailColumns.length, 
            nameColumns: this.detectedNameColumns.length 
        });
        
        // Update UI with detected columns
        this.updateColumnDetectionUI();
        
    } catch (error) {
        console.error('Error detecting email columns:', error);
    }
}

updateColumnDetectionUI() {
    try {
        // Find or create the column detection info container
        let container = document.getElementById('columnDetectionInfo');
        if (!container) {
            container = document.createElement('div');
            container.id = 'columnDetectionInfo';
            // Insert after the Google Sheets connection section
            const sheetsSection = document.querySelector('[style*="background: #f2f2f7"]');
            if (sheetsSection) {
                sheetsSection.parentNode.insertBefore(container, sheetsSection.nextSibling);
            }
        }
        
        let html = '<div style="background: #f8f9fa; padding: 16px; border-radius: 8px; margin-bottom: 16px; border: 1px solid #e5e5e7;">';
        html += '<h4 style="margin-bottom: 12px; color: #1d1d1f;"><i class="fas fa-search"></i> Detected Columns</h4>';
        
        if (this.detectedEmailColumns && this.detectedEmailColumns.length > 0) {
            html += '<div style="margin-bottom: 12px;"><strong>📧 Email Columns:</strong><br>';
            this.detectedEmailColumns.forEach(col => {
                const confidenceColor = col.confidence === 'high' ? '#34c759' : '#ff9500';
                html += `<span style="display: inline-block; background: ${confidenceColor}; color: white; padding: 4px 8px; border-radius: 4px; margin: 2px; font-size: 12px;">${col.header}</span>`;
            });
            html += '</div>';
        }
        
        if (this.detectedNameColumns && this.detectedNameColumns.length > 0) {
            html += '<div style="margin-bottom: 12px;"><strong>👤 Name Columns:</strong><br>';
            this.detectedNameColumns.forEach(col => {
                const confidenceColor = col.confidence === 'high' ? '#34c759' : '#ff9500';
                html += `<span style="display: inline-block; background: ${confidenceColor}; color: white; padding: 4px 8px; border-radius: 4px; margin: 2px; font-size: 12px;">${col.header}</span>`;
            });
            html += '</div>';
        }
        
        if ((!this.detectedEmailColumns || this.detectedEmailColumns.length === 0) && 
            (!this.detectedNameColumns || this.detectedNameColumns.length === 0)) {
            html += '<div style="color: #ff9500;"><i class="fas fa-exclamation-triangle"></i> No email or name columns detected. Please check your spreadsheet structure.</div>';
        }
        
        html += '<div style="margin-top: 12px; font-size: 12px; color: #8E8E93;">';
        html += '<i class="fas fa-info-circle"></i> High confidence columns are automatically mapped. Medium confidence columns may need manual verification.';
        html += '</div></div>';
        
        container.innerHTML = html;
        
    } catch (error) {
        console.error('Error updating column detection UI:', error);
    }
}
        this.headers = data.headers || [];
        this.rows = data.rows || [];

        this.updateConnectionStatus();
        this.displaySheetData();
        this.enableSheetsFeatures();

        this.hideLoading();
        this.showSuccess('Successfully connected to Google Sheets!');
    }

    updateConnectionStatus() {
        const statusIndicator = document.querySelector('.connection-status .status-indicator');
        const statusText = document.querySelector('.connection-status span');
        const refreshBtn = document.getElementById('refreshSheetsBtn');

        if (statusIndicator) {
            statusIndicator.className = 'status-indicator connected';
        }
        if (statusText) {
            statusText.textContent = 'Connected to Google Sheets';
        }
        if (refreshBtn) {
            refreshBtn.disabled = false;
        }
    }

    displaySheetData() {
        const dataContainer = document.getElementById('sheetsData');
        if (!dataContainer) return;

        dataContainer.style.display = 'block';
        const previewHtml = this.createDataPreview();
        dataContainer.innerHTML = previewHtml;
    }

    createDataPreview() {
        if (!this.headers.length || !this.rows.length) {
            return '<div class="no-data">No data found in sheet</div>';
        }

        let tableHtml = `
            <div class="data-preview">
                <h3>Data Preview (${this.rows.length} rows)</h3>
                <div class="table-container">
                    <table id="dataTable">
                        <thead><tr>
        `;

        this.headers.forEach(header => {
            tableHtml += `<th>${this.escapeHtml(header)}</th>`;
        });

        tableHtml += '</tr></thead><tbody>';

        this.rows.forEach(row => {
            tableHtml += '<tr>';
            this.headers.forEach((header, index) => {
                const value = row[index] || '';
                tableHtml += `<td>${this.escapeHtml(value)}</td>`;
            });
            tableHtml += '</tr>';
        });

        tableHtml += '</tbody></table></div></div>';
        return tableHtml;
    }

    enableSheetsFeatures() {
        const newCampaignBtn = document.getElementById('newCampaignBtn');
        if (newCampaignBtn) {
            newCampaignBtn.disabled = false;
        }
    }

    async refreshData() {
        if (!this.isConnected) {
            this.showError('Not connected to any sheet');
            return;
        }

        try {
            this.showLoading('Refreshing data...');
            await new Promise(resolve => setTimeout(resolve, 1000));
            this.showSuccess('Data refreshed successfully!');
        } catch (error) {
            this.hideLoading();
            this.showError('Failed to refresh data: ' + error.message);
        }
    }

    findEmailColumn() {
        const emailPatterns = ['email', 'mail', 'e-mail'];
        for (const header of this.headers) {
            if (emailPatterns.some(pattern => 
                header.toLowerCase().includes(pattern))) {
                return header;
            }
        }
        return null;
        }

    getEmailAddresses() {
        const emailColumn = this.findEmailColumn();
        if (!emailColumn) return [];

        const emailIndex = this.headers.indexOf(emailColumn);
        return this.rows
            .map(row => row[emailIndex])
            .filter(email => email && this.isValidEmail(email));
    }

    isValidEmail(email) {
        const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
        return emailRegex.test(email);
    }

    escapeHtml(text) {
        const div = document.createElement('div');
        div.textContent = text;
        return div.innerHTML;
    }

    showLoading(message = 'Loading...') {
        const overlay = document.getElementById('loadingOverlay');
        if (overlay) {
            const messageEl = overlay.querySelector('p');
            if (messageEl) messageEl.textContent = message;
            overlay.style.display = 'flex';
        }
    }

    hideLoading() {
        const overlay = document.getElementById('loadingOverlay');
        if (overlay) {
            overlay.style.display = 'none';
        }
    }

    showSuccess(message) {
        if (window.rtxApp) {
            window.rtxApp.showSuccess(message);
        }
    }

    showError(message) {
        if (window.rtxApp) {
            window.rtxApp.showError(message);
        }
    }

    isConnectedToSheets() {
        return this.isConnected;
    }

    getCurrentSheetData() {
        return {
            headers: this.headers,
            rows: this.rows,
            emailAddresses: this.getEmailAddresses()
        };
    }
}

window.sheetsManager = new SheetsManager(); 