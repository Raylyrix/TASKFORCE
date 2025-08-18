// RTX Innovations - Enhanced Email Editor
// Replaces Quill with robust contentEditable editor for better macOS compatibility

class RTXEmailEditor {
    constructor() {
        this.editor = null;
        this.isInitialized = false;
        this.undoStack = [];
        this.redoStack = [];
        this.maxUndoSteps = 50;
        
        this.init();
    }
    
    init() {
        this.editor = document.getElementById('emailEditor');
        if (!this.editor) {
            console.error('Email editor element not found');
            return;
        }
        
        this.setupEditor();
        this.setupToolbar();
        this.setupEventListeners();
        this.setupKeyboardShortcuts();
        this.setupCopyPasteHandling();
        
        this.isInitialized = true;
        console.log('RTX Email Editor initialized successfully');
    }
    
    setupEditor() {
        // Set initial content and focus
        this.editor.focus();
        
        // Enable design mode for better formatting control
        this.editor.contentEditable = true;
        
        // Set default styles
        this.editor.style.fontFamily = 'Arial, sans-serif';
        this.editor.style.fontSize = '14px';
        this.editor.style.lineHeight = '1.6';
        this.editor.style.color = '#333';
        
        // Add placeholder support
        this.setupPlaceholder();
    }
    
    setupPlaceholder() {
        const placeholder = this.editor.getAttribute('data-placeholder');
        if (placeholder) {
            this.editor.addEventListener('focus', () => {
                if (this.editor.innerHTML === '' || this.editor.innerHTML === '<br>') {
                    this.editor.innerHTML = '';
                }
            });
            
            this.editor.addEventListener('blur', () => {
                if (this.editor.innerHTML === '' || this.editor.innerHTML === '<br>') {
                    this.editor.innerHTML = '';
                }
            });
        }
    }
    
    setupToolbar() {
        // Font family change
        const fontFamily = document.getElementById('fontFamily');
        if (fontFamily) {
            fontFamily.addEventListener('change', (e) => {
                this.execCommand('fontName', e.target.value);
            });
        }
        
        // Font size change
        const fontSize = document.getElementById('fontSize');
        if (fontSize) {
            fontSize.addEventListener('change', (e) => {
                this.execCommand('fontSize', e.target.value);
            });
        }
        
        // Alignment change
        const alignSelect = document.getElementById('alignSelect');
        if (alignSelect) {
            alignSelect.addEventListener('change', (e) => {
                const alignment = e.target.value;
                switch (alignment) {
                    case 'left': this.execCommand('justifyLeft'); break;
                    case 'center': this.execCommand('justifyCenter'); break;
                    case 'right': this.execCommand('justifyRight'); break;
                    case 'justify': this.execCommand('justifyFull'); break;
                }
            });
        }
    }
    
    setupEventListeners() {
        // Track changes for undo/redo
        this.editor.addEventListener('input', () => {
            this.saveState();
        });
        
        // Handle paste events
        this.editor.addEventListener('paste', (e) => {
            this.handlePaste(e);
        });
        
        // Handle drop events for images
        this.editor.addEventListener('drop', (e) => {
            this.handleDrop(e);
        });
        
        // Prevent default drag behavior
        this.editor.addEventListener('dragover', (e) => {
            e.preventDefault();
        });
        
        // Track selection changes for toolbar state
        this.editor.addEventListener('keyup', () => {
            this.updateToolbarState();
        });
        
        this.editor.addEventListener('mouseup', () => {
            this.updateToolbarState();
        });
    }
    
    setupKeyboardShortcuts() {
        this.editor.addEventListener('keydown', (e) => {
            // Prevent default browser shortcuts
            if (e.ctrlKey || e.metaKey) {
                switch (e.key.toLowerCase()) {
                    case 'b':
                        e.preventDefault();
                        this.execCommand('bold');
                        break;
                    case 'i':
                        e.preventDefault();
                        this.execCommand('italic');
                        break;
                    case 'u':
                        e.preventDefault();
                        this.execCommand('underline');
                        break;
                    case 'z':
                        e.preventDefault();
                        if (e.shiftKey) {
                            this.redo();
                        } else {
                            this.undo();
                        }
                        break;
                    case 'y':
                        e.preventDefault();
                        this.redo();
                        break;
                    case 'a':
                        e.preventDefault();
                        this.execCommand('selectAll');
                        break;
                }
            }
        });
    }
    
    setupCopyPasteHandling() {
        // Enhanced clipboard handling for macOS
        if (navigator.platform.indexOf('Mac') !== -1) {
            this.setupMacOSClipboard();
        }
    }
    
    setupMacOSClipboard() {
        // Use clipboard API for better macOS support
        if (navigator.clipboard && navigator.clipboard.readText) {
            this.editor.addEventListener('paste', async (e) => {
                // Try to get clipboard data using modern API first
                try {
                    const clipboardItems = await navigator.clipboard.read();
                    if (clipboardItems.length > 0) {
                        for (const item of clipboardItems) {
                            if (item.types.includes('text/html')) {
                                const htmlBlob = await item.getType('text/html');
                                const html = await htmlBlob.text();
                                e.preventDefault();
                                this.insertHTML(html);
                                return;
                            }
                        }
                    }
                } catch (error) {
                    // Fall back to standard paste handling
                    console.log('Modern clipboard API not available, using standard paste');
                }
            });
        }
    }
    
    handlePaste(e) {
        e.preventDefault();
        
        const clipboardData = e.clipboardData;
        if (!clipboardData) return;
        
        let html = clipboardData.getData('text/html');
        const text = clipboardData.getData('text/plain');
        const rtf = clipboardData.getData('text/rtf');
        
        // Show debug info
        this.showDebugInfo('Paste detected', {
            hasHTML: !!html,
            hasText: !!text,
            hasRTF: !!rtf,
            htmlLength: html ? html.length : 0
        });
        
        if (html && html.trim()) {
            // Clean and insert HTML
            const cleanHtml = this.cleanHTML(html);
            this.insertHTML(cleanHtml);
        } else if (rtf && rtf.trim()) {
            // Convert RTF to text (basic conversion)
            const plainText = this.rtfToText(rtf);
            this.insertText(plainText);
        } else if (text && text.trim()) {
            // Insert plain text with line breaks preserved
            this.insertText(text);
        }
    }
    
    handleDrop(e) {
        e.preventDefault();
        
        const files = Array.from(e.dataTransfer.files);
        files.forEach(file => {
            if (file.type.startsWith('image/')) {
                this.insertImageFromFile(file);
            }
        });
    }
    
    cleanHTML(html) {
        if (!html) return '';
        
        // Use DOMPurify if available, otherwise basic cleaning
        if (window.DOMPurify) {
            return window.DOMPurify.sanitize(html, {
                ALLOWED_TAGS: [
                    'p', 'br', 'strong', 'b', 'em', 'i', 'u', 's', 'strike',
                    'h1', 'h2', 'h3', 'h4', 'h5', 'h6',
                    'ul', 'ol', 'li', 'blockquote', 'pre', 'code',
                    'table', 'thead', 'tbody', 'tr', 'td', 'th',
                    'a', 'img', 'span', 'div'
                ],
                ALLOWED_ATTR: [
                    'href', 'src', 'alt', 'title', 'style', 'class',
                    'width', 'height', 'border', 'cellpadding', 'cellspacing'
                ]
            });
        }
        
        // Basic HTML cleaning
        return html
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
    
    rtfToText(rtf) {
        // Basic RTF to text conversion
        return rtf
            .replace(/\\[a-z]+\d?/g, '') // Remove RTF commands
            .replace(/\{|\}/g, '') // Remove braces
            .replace(/\\'/g, "'") // Convert escaped quotes
            .replace(/\\"/g, '"')
            .replace(/\\\n/g, '\n') // Convert line breaks
            .replace(/\\\r/g, '\r')
            .replace(/\\\t/g, '\t')
            .trim();
    }
    
    insertHTML(html) {
        if (!html) return;
        
        const selection = window.getSelection();
        if (selection.rangeCount > 0) {
            const range = selection.getRangeAt(0);
            range.deleteContents();
            
            const tempDiv = document.createElement('div');
            tempDiv.innerHTML = html;
            
            const fragment = document.createDocumentFragment();
            while (tempDiv.firstChild) {
                fragment.appendChild(tempDiv.firstChild);
            }
            
            range.insertNode(fragment);
            range.collapse(false);
            selection.removeAllRanges();
            selection.addRange(range);
        }
        
        this.saveState();
    }
    
    insertText(text) {
        if (!text) return;
        
        const selection = window.getSelection();
        if (selection.rangeCount > 0) {
            const range = selection.getRangeAt(0);
            range.deleteContents();
            
            // Split by lines and preserve structure
            const lines = text.split('\n');
            let isFirst = true;
            
            lines.forEach((line, index) => {
                if (!isFirst) {
                    range.insertNode(document.createElement('br'));
                }
                
                if (line.trim()) {
                    range.insertNode(document.createTextNode(line));
                }
                
                isFirst = false;
            });
            
            range.collapse(false);
            selection.removeAllRanges();
            selection.addRange(range);
        }
        
        this.saveState();
    }
    
    insertImageFromFile(file) {
        const reader = new FileReader();
        reader.onload = (e) => {
            const img = document.createElement('img');
            img.src = e.target.result;
            img.style.maxWidth = '100%';
            img.style.height = 'auto';
            
            const selection = window.getSelection();
            if (selection.rangeCount > 0) {
                const range = selection.getRangeAt(0);
                range.insertNode(img);
                range.collapse(false);
                selection.removeAllRanges();
                selection.addRange(range);
            }
            
            this.saveState();
        };
        reader.readAsDataURL(file);
    }
    
    execCommand(command, value = null) {
        try {
            if (value !== null) {
                document.execCommand(command, false, value);
            } else {
                document.execCommand(command, false);
            }
            
            this.saveState();
            this.updateToolbarState();
            
            // Focus back to editor
            this.editor.focus();
        } catch (error) {
            console.error(`Error executing command ${command}:`, error);
        }
    }
    
    saveState() {
        const currentState = this.editor.innerHTML;
        
        // Don't save if it's the same as last state
        if (this.undoStack.length > 0 && this.undoStack[this.undoStack.length - 1] === currentState) {
            return;
        }
        
        this.undoStack.push(currentState);
        
        // Limit undo stack size
        if (this.undoStack.length > this.maxUndoSteps) {
            this.undoStack.shift();
        }
        
        // Clear redo stack when new action is performed
        this.redoStack = [];
    }
    
    undo() {
        if (this.undoStack.length > 1) {
            const currentState = this.undoStack.pop();
            this.redoStack.push(currentState);
            
            const previousState = this.undoStack[this.undoStack.length - 1];
            this.editor.innerHTML = previousState;
            
            this.updateToolbarState();
        }
    }
    
    redo() {
        if (this.redoStack.length > 0) {
            const nextState = this.redoStack.pop();
            this.undoStack.push(nextState);
            
            this.editor.innerHTML = nextState;
            
            this.updateToolbarState();
        }
    }
    
    updateToolbarState() {
        // Update button states based on current selection
        const selection = window.getSelection();
        if (selection.rangeCount === 0) return;
        
        const range = selection.getRangeAt(0);
        const parentElement = range.commonAncestorContainer.nodeType === Node.TEXT_NODE 
            ? range.commonAncestorContainer.parentElement 
            : range.commonAncestorContainer;
        
        // Update bold button
        const boldBtn = document.getElementById('boldBtn');
        if (boldBtn) {
            boldBtn.style.background = document.queryCommandState('bold') ? '#007AFF' : '#fff';
            boldBtn.style.color = document.queryCommandState('bold') ? '#fff' : '#333';
        }
        
        // Update italic button
        const italicBtn = document.getElementById('italicBtn');
        if (italicBtn) {
            italicBtn.style.background = document.queryCommandState('italic') ? '#007AFF' : '#fff';
            italicBtn.style.color = document.queryCommandState('italic') ? '#fff' : '#333';
        }
        
        // Update underline button
        const underlineBtn = document.getElementById('underlineBtn');
        if (underlineBtn) {
            underlineBtn.style.background = document.queryCommandState('underline') ? '#007AFF' : '#fff';
            underlineBtn.style.color = document.queryCommandState('underline') ? '#fff' : '#333';
        }
    }
    
    showDebugInfo(message, details = {}) {
        const debugPanel = document.getElementById('copyPasteDebug');
        const debugInfo = document.getElementById('debugInfo');
        
        if (debugPanel && debugInfo) {
            debugPanel.style.display = 'block';
            debugInfo.textContent = `${message} - ${JSON.stringify(details)}`;
            
            // Auto-hide after 3 seconds
            setTimeout(() => {
                debugPanel.style.display = 'none';
            }, 3000);
        }
    }
    
    // Public methods for external use
    getHTML() {
        return this.editor ? this.editor.innerHTML : '';
    }
    
    getText() {
        return this.editor ? this.editor.textContent : '';
    }
    
    setHTML(html) {
        if (this.editor) {
            this.editor.innerHTML = html;
            this.saveState();
        }
    }
    
    setText(text) {
        if (this.editor) {
            this.editor.textContent = text;
            this.saveState();
        }
    }
    
    clear() {
        if (this.editor) {
            this.editor.innerHTML = '';
            this.saveState();
        }
    }
    
    focus() {
        if (this.editor) {
            this.editor.focus();
        }
    }
}

// Global functions for toolbar buttons
function execCommand(command, value = null) {
    if (window.rtxEditor) {
        window.rtxEditor.execCommand(command, value);
    }
}

function insertLink() {
    const url = prompt('Enter URL:');
    if (url) {
        execCommand('createLink', url);
    }
}

function insertImage() {
    const url = prompt('Enter image URL:');
    if (url) {
        const img = document.createElement('img');
        img.src = url;
        img.style.maxWidth = '100%';
        img.style.height = 'auto';
        
        if (window.rtxEditor) {
            window.rtxEditor.insertHTML(img.outerHTML);
        }
    }
}

function insertTable() {
    const rows = prompt('Enter number of rows (default: 3):', '3');
    const cols = prompt('Enter number of columns (default: 3):', '3');
    
    if (rows && cols) {
        const numRows = parseInt(rows) || 3;
        const numCols = parseInt(cols) || 3;
        
        let tableHtml = '<table border="1" style="border-collapse: collapse; width: 100%; margin: 10px 0;">';
        for (let i = 0; i < numRows; i++) {
            tableHtml += '<tr>';
            for (let j = 0; j < numCols; j++) {
                tableHtml += '<td style="padding: 8px; border: 1px solid #ddd;">&nbsp;</td>';
            }
            tableHtml += '</tr>';
        }
        tableHtml += '</table>';
        
        if (window.rtxEditor) {
            window.rtxEditor.insertHTML(tableHtml);
        }
    }
}

function testCopyPaste() {
    if (window.rtxEditor) {
        window.rtxEditor.showDebugInfo('Copy-paste test initiated');
        
        // Test clipboard access
        if (navigator.clipboard) {
            navigator.clipboard.readText().then(text => {
                window.rtxEditor.showDebugInfo('Clipboard test successful', { textLength: text.length });
            }).catch(error => {
                window.rtxEditor.showDebugInfo('Clipboard test failed', { error: error.message });
            });
        } else {
            window.rtxEditor.showDebugInfo('Clipboard API not available');
        }
    }
}

function showEditorContent() {
    if (window.rtxEditor) {
        const html = window.rtxEditor.getHTML();
        const text = window.rtxEditor.getText();
        
        const content = `HTML Content (${html.length} chars):\n${html}\n\nText Content (${text.length} chars):\n${text}`;
        
        // Create a modal to show content
        const modal = document.createElement('div');
        modal.style.cssText = `
            position: fixed; top: 0; left: 0; width: 100%; height: 100%;
            background: rgba(0,0,0,0.8); z-index: 10000; display: flex;
            align-items: center; justify-content: center;
        `;
        
        const contentDiv = document.createElement('div');
        contentDiv.style.cssText = `
            background: white; padding: 20px; border-radius: 8px;
            max-width: 80%; max-height: 80%; overflow: auto;
        `;
        
        contentDiv.innerHTML = `<h3>Editor Content</h3><pre style="white-space: pre-wrap;">${content}</pre>`;
        
        modal.appendChild(contentDiv);
        modal.onclick = () => document.body.removeChild(modal);
        document.body.appendChild(modal);
    }
}

function showCopyPasteHelp() {
    const helpText = `
        <h3>Copy-Paste Help</h3>
        <p><strong>Enhanced Editor Features:</strong></p>
        <ul>
            <li>✅ <strong>Perfect Formatting Preservation:</strong> Copy-paste from Word, Google Docs, web pages, etc.</li>
            <li>✅ <strong>macOS Optimized:</strong> Special handling for Mac clipboard quirks</li>
            <li>✅ <strong>Rich Text Support:</strong> HTML, RTF, and plain text all supported</li>
            <li>✅ <strong>Image Support:</strong> Drag & drop or paste images directly</li>
            <li>✅ <strong>Table Support:</strong> Insert and edit tables easily</li>
        </ul>
        <p><strong>Tips for Best Results:</strong></p>
        <ul>
            <li>Use Cmd+C (Mac) or Ctrl+C (Windows) to copy</li>
            <li>Use Cmd+V (Mac) or Ctrl+V (Windows) to paste</li>
            <li>For complex formatting, copy from the source application</li>
            <li>Images can be dragged directly into the editor</li>
        </ul>
    `;
    
    const modal = document.createElement('div');
    modal.style.cssText = `
        position: fixed; top: 0; left: 0; width: 100%; height: 100%;
        background: rgba(0,0,0,0.8); z-index: 10000; display: flex;
        align-items: center; justify-content: center;
    `;
    
    const contentDiv = document.createElement('div');
    contentDiv.style.cssText = `
        background: white; padding: 20px; border-radius: 8px;
        max-width: 80%; max-height: 80%; overflow: auto;
    `;
    
    contentDiv.innerHTML = helpText;
    
    modal.appendChild(contentDiv);
    modal.onclick = () => document.body.removeChild(modal);
    document.body.appendChild(modal);
}

// Initialize the editor when DOM is ready
document.addEventListener('DOMContentLoaded', () => {
    // Initialize the enhanced editor
    window.rtxEditor = new RTXEmailEditor();
    
    // Show debug panel if enabled
    const debugCheckbox = document.getElementById('enableDebugPanel');
    if (debugCheckbox) {
        debugCheckbox.addEventListener('change', (e) => {
            const debugPanel = document.getElementById('copyPasteDebug');
            if (debugPanel) {
                debugPanel.style.display = e.target.checked ? 'block' : 'none';
            }
        });
    }
    
    console.log('RTX Email Editor system initialized');
});

// Export for global access
window.RTXEmailEditor = RTXEmailEditor;
