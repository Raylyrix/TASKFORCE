// Modern UI compatibility layer for app.js
// This file provides compatibility between the modern UI and existing app.js functionality

// Update event listeners to work with new modern UI structure
document.addEventListener('DOMContentLoaded', function() {
    // Wait for the main app to initialize
    setTimeout(() => {
        if (window.rtxApp) {
            // Update event listeners for new UI structure
            updateEventListeners();
        }
    }, 1000);
});

function updateEventListeners() {
    // Update Google Sign-In button
    const googleSignInBtn = document.getElementById('googleSignInBtn');
    if (googleSignInBtn && window.rtxApp) {
        googleSignInBtn.addEventListener('click', async () => {
            try {
                googleSignInBtn.disabled = true;
                googleSignInBtn.innerHTML = '<i class="fas fa-spinner fa-spin"></i> Signing in...';
                
                const result = await window.electronAPI.authenticateGoogle();
                if (result?.success) {
                    window.rtxApp.onAuthenticationSuccess(result.userEmail || 'authenticated');
                    googleSignInBtn.innerHTML = '<i class="fas fa-check"></i> Signed in';
                    googleSignInBtn.style.background = 'var(--success-color)';
                    googleSignInBtn.style.color = 'white';
                    
                    // Show logout button
                    const logoutBtn = document.getElementById('googleLogoutBtn');
                    if (logoutBtn) {
                        logoutBtn.style.display = 'flex';
                    }
                } else {
                    throw new Error(result?.error || 'Authentication failed');
                }
            } catch (error) {
                console.error('Google sign-in error:', error);
                window.rtxApp.showError('Google sign-in failed: ' + error.message);
                googleSignInBtn.innerHTML = '<i class="fab fa-google"></i> Sign in with Google';
                googleSignInBtn.disabled = false;
            }
        });
    }

    // Update logout button
    const googleLogoutBtn = document.getElementById('googleLogoutBtn');
    if (googleLogoutBtn && window.rtxApp) {
        googleLogoutBtn.addEventListener('click', async () => {
            try {
                await window.electronAPI.logout();
                window.rtxApp.onLogout();
                
                // Reset UI
                const signInBtn = document.getElementById('googleSignInBtn');
                if (signInBtn) {
                    signInBtn.innerHTML = '<i class="fab fa-google"></i> Sign in with Google';
                    signInBtn.disabled = false;
                    signInBtn.style.background = '';
                    signInBtn.style.color = '';
                }
                googleLogoutBtn.style.display = 'none';
            } catch (error) {
                console.error('Logout error:', error);
                window.rtxApp.showError('Logout failed: ' + error.message);
            }
        });
    }

    // Update help button
    const helpBtn = document.getElementById('helpBtn');
    if (helpBtn) {
        helpBtn.addEventListener('click', () => {
            openModal('helpModal');
        });
    }

    // Update logs button
    const logsBtn = document.getElementById('logsBtn');
    if (logsBtn && window.rtxApp) {
        logsBtn.addEventListener('click', () => {
            window.rtxApp.showLogsModal();
        });
    }

    // Update import sheet button
    const importSheetBtn = document.getElementById('importSheetBtn');
    if (importSheetBtn && window.rtxApp) {
        importSheetBtn.addEventListener('click', () => {
            window.rtxApp.showImportSheetModal();
        });
    }

    // Update preview button
    const togglePreviewBtn = document.getElementById('togglePreviewBtn');
    if (togglePreviewBtn && window.rtxApp) {
        togglePreviewBtn.addEventListener('click', () => {
            window.rtxApp.toggleDataPreview();
        });
    }

    // Update start campaign button
    const startCampaignBtn = document.getElementById('startCampaignBtn');
    if (startCampaignBtn && window.rtxApp) {
        startCampaignBtn.addEventListener('click', () => {
            window.rtxApp.startCampaign();
        });
    }

    // Update connect sheets button
    const connectSheetsBtn = document.getElementById('connectSheetsBtn');
    if (connectSheetsBtn) {
        connectSheetsBtn.addEventListener('click', () => {
            openModal('sheetsModal');
        });
    }

    // Update connect sheets button in modal
    const connectSheetsBtn2 = document.getElementById('connectSheetsBtn2');
    if (connectSheetsBtn2 && window.rtxApp) {
        connectSheetsBtn2.addEventListener('click', () => {
            window.rtxApp.connectToSheets();
        });
    }

    // Update refresh sheets button
    const refreshSheetsBtn = document.getElementById('refreshSheetsBtn');
    if (refreshSheetsBtn && window.rtxApp) {
        refreshSheetsBtn.addEventListener('click', () => {
            window.rtxApp.refreshSheets();
        });
    }

    // Update send test button
    const sendTestBtn = document.getElementById('sendTestBtn');
    if (sendTestBtn && window.rtxApp) {
        sendTestBtn.addEventListener('click', () => {
            window.rtxApp.sendTestEmail();
        });
    }

    // Update upload credentials button
    const uploadCredentialsBtn = document.getElementById('uploadCredentialsBtn');
    if (uploadCredentialsBtn && window.rtxApp) {
        uploadCredentialsBtn.addEventListener('click', () => {
            window.rtxApp.handleCredentialsUpload();
        });
    }

    // Update clear logs button
    const clearLogsBtn = document.getElementById('clearLogsBtn');
    if (clearLogsBtn && window.rtxApp) {
        clearLogsBtn.addEventListener('click', () => {
            window.rtxApp.clearSessionLogs();
        });
    }
}

// Add missing methods to RTXApp if they don't exist
if (window.rtxApp) {
    // Add showImportSheetModal method
    if (!window.rtxApp.showImportSheetModal) {
        window.rtxApp.showImportSheetModal = function() {
            // For now, just show the sheets modal
            openModal('sheetsModal');
        };
    }

    // Add toggleDataPreview method
    if (!window.rtxApp.toggleDataPreview) {
        window.rtxApp.toggleDataPreview = function() {
            // Toggle data preview functionality
            console.log('Toggle data preview');
        };
    }

    // Add startCampaign method
    if (!window.rtxApp.startCampaign) {
        window.rtxApp.startCampaign = function() {
            // Start campaign functionality
            console.log('Start campaign');
        };
    }

    // Add refreshSheets method
    if (!window.rtxApp.refreshSheets) {
        window.rtxApp.refreshSheets = function() {
            // Refresh sheets functionality
            console.log('Refresh sheets');
        };
    }

    // Add clearSessionLogs method
    if (!window.rtxApp.clearSessionLogs) {
        window.rtxApp.clearSessionLogs = function() {
            if (window.electronAPI && window.electronAPI.clearSessionLog) {
                window.electronAPI.clearSessionLog();
                const logsContainer = document.getElementById('logsContainer');
                if (logsContainer) {
                    logsContainer.innerHTML = '';
                }
                this.showSuccess('Session logs cleared successfully!');
            }
        };
    }
}

// Update the connection status indicator
function updateConnectionStatus(isConnected, email = null) {
    const statusIndicator = document.getElementById('connectionStatus');
    const statusText = statusIndicator?.nextElementSibling;
    
    if (statusIndicator && statusText) {
        if (isConnected) {
            statusIndicator.style.background = 'var(--success-color)';
            statusText.textContent = email ? `Connected as ${email}` : 'Connected';
        } else {
            statusIndicator.style.background = 'var(--text-secondary)';
            statusText.textContent = 'Not Connected';
        }
    }
}

// Update account status in the main content area
function updateAccountStatus(isAuthenticated, email = null) {
    const accountStatus = document.getElementById('accountStatus');
    if (accountStatus) {
        const statusIndicator = accountStatus.querySelector('.status-indicator');
        const statusText = statusIndicator?.nextElementSibling;
        
        if (statusIndicator && statusText) {
            if (isAuthenticated) {
                statusIndicator.style.background = 'var(--success-color)';
                statusText.textContent = email ? `Authenticated as ${email}` : 'Authenticated';
            } else {
                statusIndicator.style.background = 'var(--text-secondary)';
                statusText.textContent = 'Not authenticated';
            }
        }
    }
}

// Override the original updateUI method to work with modern UI
if (window.rtxApp && window.rtxApp.updateUI) {
    const originalUpdateUI = window.rtxApp.updateUI;
    window.rtxApp.updateUI = function() {
        // Call original method
        originalUpdateUI.call(this);
        
        // Update modern UI elements
        updateConnectionStatus(this.isAuthenticated, this.userEmail);
        updateAccountStatus(this.isAuthenticated, this.userEmail);
        
        // Update from address field
        const fromAddress = document.getElementById('fromAddress');
        if (fromAddress && this.userEmail) {
            fromAddress.value = this.userEmail;
        }
    };
}

// Override the original onAuthenticationSuccess method
if (window.rtxApp && window.rtxApp.onAuthenticationSuccess) {
    const originalOnAuthSuccess = window.rtxApp.onAuthenticationSuccess;
    window.rtxApp.onAuthenticationSuccess = function(userEmail) {
        // Call original method
        originalOnAuthSuccess.call(this, userEmail);
        
        // Update modern UI
        updateConnectionStatus(true, userEmail);
        updateAccountStatus(true, userEmail);
        
        // Update from address
        const fromAddress = document.getElementById('fromAddress');
        if (fromAddress) {
            fromAddress.value = userEmail;
        }
    };
}

// Override the original onLogout method
if (window.rtxApp && window.rtxApp.onLogout) {
    const originalOnLogout = window.rtxApp.onLogout;
    window.rtxApp.onLogout = function() {
        // Call original method
        originalOnLogout.call(this);
        
        // Update modern UI
        updateConnectionStatus(false);
        updateAccountStatus(false);
        
        // Clear from address
        const fromAddress = document.getElementById('fromAddress');
        if (fromAddress) {
            fromAddress.value = '';
        }
    };
}
