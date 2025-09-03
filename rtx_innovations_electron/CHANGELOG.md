# Changelog

All notable changes to TASK FORCE will be documented in this file.

## [3.0.7] - 2025-01-02

### 🔧 Critical Multi-Tab & Authentication Fixes

#### Tab Management System
- **FIXED**: Tab manager initialization issues - tabs.js now loads properly
- **FIXED**: New tab button functionality restored with proper event handling
- **ENHANCED**: Tab manager initialization with better debugging and error handling
- **IMPROVED**: Tab switching and state synchronization between tabs

#### Authentication System
- **FIXED**: OAuth authentication issues causing "invalid_grant" and "invalid_client" errors
- **ADDED**: buildOAuthClientForTab function for proper tab-specific OAuth client creation
- **ENHANCED**: Tab-based authentication with proper credential handling
- **IMPROVED**: Authentication flow for multiple Google accounts in different tabs

#### Gmail Integration
- **FIXED**: listSendAs function now supports tab-specific services
- **ENHANCED**: Gmail context fetching with proper tab ID passing
- **IMPROVED**: Error handling for Gmail API calls in tab context
- **FIXED**: Authentication state management across tabs

#### Multi-Account Support
- **ENHANCED**: Complete isolation of authentication sessions per tab
- **IMPROVED**: Tab-specific OAuth token storage and management
- **FIXED**: Credential file upload now works properly for all tabs
- **ENHANCED**: Browser-based Google login for multiple accounts

### 🎯 What's Fixed
- **Issue**: tabs.js file not found error
- **Issue**: Tab manager not initializing properly
- **Issue**: New tab button not working
- **Issue**: Authentication failing with invalid_grant/invalid_client errors
- **Issue**: Gmail context fetching failing in tab context
- **Fix**: Complete tab management system with proper authentication
- **Result**: Full multi-tab functionality with isolated authentication and mailing

## [3.0.6] - 2025-01-02

### 🐛 Critical Syntax Error Fix #2

#### JavaScript Syntax Error
- **FIXED**: Critical syntax error in main.js line 1469 - "Unexpected token 'catch'"
- **FIXED**: executeCampaignRun function missing try block for catch/finally structure
- **ADDED**: Complete try-catch block for proper error handling in campaign execution
- **IMPROVED**: Enhanced error logging and campaign execution error handling
- **CLEANED**: Removed invalid tabId references from non-tab campaign function

#### Error Handling Improvements
- **NEW**: Proper error handling structure for executeCampaignRun function
- **IMPROVED**: Better error logging for campaign execution failures
- **ENHANCED**: Cleaner function structure with proper try-catch blocks
- **FIXED**: Removed references to undefined variables (tabId, tabOps)

### 🎯 What's Fixed
- **Issue**: Application crashed with "Unexpected token 'catch'" syntax error at line 1469
- **Issue**: executeCampaignRun function had catch/finally blocks without corresponding try block
- **Issue**: Function referenced undefined variables (tabId, tabOps) in non-tab context
- **Fix**: Added proper try block and cleaned up variable references
- **Result**: Application now starts and runs without syntax errors

## [3.0.5] - 2025-01-02

### 🐛 Critical Syntax Error Fix

#### JavaScript Syntax Error
- **FIXED**: Critical syntax error in main.js line 1333 - "Missing catch or finally after try"
- **FIXED**: executeCampaignRunWithTab function missing proper error handling structure
- **ADDED**: Complete try-catch-finally block for proper error handling and state cleanup
- **IMPROVED**: Enhanced error logging and tab operation state management
- **ENHANCED**: Proper cleanup of tab scheduling state in finally block

#### Error Handling Improvements
- **NEW**: Comprehensive error handling for tab campaign execution
- **NEW**: Proper state cleanup ensures tabs are marked as available after operations
- **IMPROVED**: Better error logging for debugging campaign execution issues
- **ENHANCED**: Tab isolation with proper operation state management

### 🎯 What's Fixed
- **Issue**: Application crashed with "Missing catch or finally after try" syntax error
- **Issue**: Tab campaign execution had incomplete error handling
- **Fix**: Added complete try-catch-finally structure with proper state cleanup
- **Result**: Application now starts and runs without syntax errors

## [3.0.1] - 2025-01-02

### 🐛 Critical Bug Fixes

#### Tab Functionality
- **FIXED**: New tab button now works properly with enhanced event handling
- **FIXED**: Tab creation and rendering process with comprehensive debugging
- **FIXED**: Tab switching and state synchronization issues
- **IMPROVED**: Enhanced error handling and user feedback for tab operations

#### Tab Isolation & Mailing System
- **NEW**: Complete operation isolation between tabs to prevent interference
- **NEW**: Tab-specific operation tracking (sending/scheduling states)
- **NEW**: Operation locking system to prevent concurrent operations in same tab
- **IMPROVED**: Enhanced error handling with proper cleanup in try-catch-finally blocks
- **IMPROVED**: Better state management and recovery for failed operations

#### Multi-Account Support
- **ENHANCED**: Improved multi-account authentication with same credentials.json
- **ENHANCED**: Better tab-based OAuth token management
- **ENHANCED**: Complete separation of Gmail services between tabs
- **IMPROVED**: Robust error handling for authentication failures

### 🔧 Technical Improvements

#### Backend Enhancements
- **NEW**: `tabOperations` Map for tracking tab operation states
- **IMPROVED**: Enhanced `sendEmailWithTab()` with operation locking
- **IMPROVED**: Enhanced `executeCampaignRunWithTab()` with proper cleanup
- **IMPROVED**: Better error handling and state recovery mechanisms

#### Frontend Enhancements
- **IMPROVED**: Enhanced tab button event handling with debugging
- **IMPROVED**: Better tab creation and rendering process
- **IMPROVED**: Enhanced console logging for debugging tab operations
- **IMPROVED**: Better error detection and user feedback

### 🛡️ Security & Stability

#### Operation Protection
- **NEW**: Prevents concurrent email sending in same tab
- **NEW**: Prevents concurrent campaign execution in same tab
- **NEW**: Automatic operation state cleanup on success or failure
- **IMPROVED**: Better error recovery and state restoration

#### Multi-Tab Safety
- **ENHANCED**: Complete isolation of mailing operations between tabs
- **ENHANCED**: Independent authentication sessions per tab
- **ENHANCED**: Separate service instances for each tab
- **IMPROVED**: Robust error handling for cross-tab operations

### 🎯 Performance Improvements
- **IMPROVED**: Better memory management with proper cleanup
- **IMPROVED**: Enhanced operation tracking and state management
- **IMPROVED**: Optimized error handling and recovery
- **IMPROVED**: Better resource management for multi-tab operations

---

## [3.0.0] - 2025-01-02

### 🚀 Major Features Added

#### Multi-Tab Support
- **NEW**: Multi-tab interface allowing users to work with multiple Gmail accounts simultaneously
- **NEW**: Each tab maintains independent authentication and email campaigns
- **NEW**: Parallel email sending from different Gmail accounts
- **NEW**: Tab-based state management with complete isolation
- **NEW**: Visual tab indicators showing authentication status
- **NEW**: Easy tab creation, switching, and management

#### Enhanced Scheduling System
- **FIXED**: Scheduled emails now properly send with HTML formatting
- **FIXED**: Signature handling in scheduled emails (both HTML and text versions)
- **IMPROVED**: Placeholder replacement in HTML content for scheduled campaigns
- **NEW**: Tab-based scheduling support
- **IMPROVED**: Better error handling and logging for scheduled campaigns

#### Session Management
- **NEW**: Clear session logs functionality with confirmation dialog
- **IMPROVED**: Better session log management and cleanup
- **NEW**: Audit trail for log clearing actions

### 🔧 Technical Improvements

#### Backend Enhancements
- **NEW**: Tab-based service management (`tabServices` Map)
- **NEW**: `authenticateGoogleWithTab()` for tab-specific authentication
- **NEW**: `sendEmailWithTab()` for tab-specific email sending
- **NEW**: `executeCampaignRunWithTab()` for tab-based campaign execution
- **IMPROVED**: Enhanced `executeCampaignRun()` with HTML and signature support
- **NEW**: Tab-specific token storage and management

#### Frontend Enhancements
- **NEW**: `TabManager` class for comprehensive tab management
- **NEW**: Tab UI components with modern styling
- **IMPROVED**: Enhanced authentication flow with tab integration
- **IMPROVED**: Better email sending with tab context
- **NEW**: Tab-based state synchronization

#### UI/UX Improvements
- **NEW**: Modern tab bar with visual status indicators
- **NEW**: Tab close functionality with confirmation
- **NEW**: Clear logs button in session logs modal
- **IMPROVED**: Better visual feedback for authentication states
- **IMPROVED**: Enhanced user experience for multi-account workflows

### 🐛 Bug Fixes
- **FIXED**: Scheduled emails now send with proper HTML formatting instead of plain text
- **FIXED**: Signature integration in scheduled emails
- **FIXED**: Placeholder replacement in HTML content for scheduled campaigns
- **FIXED**: Email structure for multipart messages (text + HTML)

### 🔄 Breaking Changes
- **BREAKING**: Multi-tab architecture changes the way authentication is handled
- **BREAKING**: Tab-based email sending requires tab context
- **BREAKING**: Enhanced scheduling system with new parameters

### 📋 Migration Notes
- Existing users will see a new tab interface on first launch
- Previous authentication will work in the default tab
- New features require re-authentication in tabs for full functionality
- Scheduled campaigns will now properly format HTML and signatures

### 🎯 Performance Improvements
- **IMPROVED**: Better memory management with tab isolation
- **IMPROVED**: Optimized email sending with tab-specific services
- **IMPROVED**: Enhanced logging and error handling

### 🔒 Security Enhancements
- **IMPROVED**: Tab-based token isolation
- **IMPROVED**: Better session management
- **IMPROVED**: Enhanced audit logging

---

## [1.6.18] - Previous Version
- Fix placeholder insertion, auto-updater repo, and optimize Google Sign-in speed
- Remove all Quill editor code and fix scrolling issues
- Replace Quill editor with enhanced contenteditable editor

---

*For more details about each release, please refer to the commit history and pull requests.*


