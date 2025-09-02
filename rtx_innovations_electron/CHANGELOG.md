# Changelog

All notable changes to TASK FORCE will be documented in this file.

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
