// Selection Handler for Google Docs
// Handles the complexity of detecting and extracting selected text from Google Docs
// Option A: Uses Google Docs accessibility DOM (requires screen reader mode: Tools > Accessibility or Cmd+Option+Z)

const SelectionHandler = {
    /**
     * Check if there is currently a text selection
     * Tries native API first, then Google Docs accessibility DOM
     */
    hasSelection: function () {
        // Try native Selection API first
        const selection = window.getSelection();
        if (selection && selection.toString().length > 0) {
            return true;
        }
        // Fall back to accessibility DOM (Google Docs canvas)
        return this.hasSelectionViaAccessibility();
    },

    /**
     * Get the currently selected text
     * Tries native API first, then Google Docs accessibility DOM
     */
    getSelectedText: function () {
        try {
            // Try native Selection API first
            const selection = window.getSelection();
            if (selection && selection.rangeCount > 0) {
                const selectedText = selection.toString();
                if (selectedText.length > 0) {
                    SmartSwapUtils.log('Selected text (native):', selectedText.substring(0, 50) + (selectedText.length > 50 ? '...' : ''));
                    return selectedText;
                }
            }

            // Fall back to Google Docs accessibility DOM
            return this.getSelectedTextViaAccessibility();
        } catch (error) {
            SmartSwapUtils.error('Failed to get selected text:', error);
            return null;
        }
    },

    /**
     * Check for selection via Google Docs accessibility layer
     * Requires: Tools > Accessibility (or Cmd+Option+Z / Ctrl+Alt+Z) to enable screen reader mode
     * When enabled, Google Docs creates SVG/rect elements in .kix-canvas-tile-selection with text
     */
    hasSelectionViaAccessibility: function () {
        const selectionContainer = document.querySelector('.kix-canvas-tile-selection');
        if (!selectionContainer) return false;

        // Check for selection overlay rects
        const selectionRects = selectionContainer.querySelectorAll('svg rect, svg > g rect');
        return selectionRects.length > 0;
    },

    /**
     * Get selected text via Google Docs accessibility DOM
     * Extracts text from SVG elements that Google Docs creates when screen reader is enabled
     */
    getSelectedTextViaAccessibility: function () {
        try {
            const selectionContainer = document.querySelector('.kix-canvas-tile-selection');
            if (!selectionContainer) {
                SmartSwapUtils.log('No .kix-canvas-tile-selection found - enable screen reader: Tools > Accessibility (Cmd+Option+Z)');
                return null;
            }

            const textParts = [];
            const processedIds = new Set();

            // Method 1: Get text from rect elements with aria-label (screen reader exposes text here)
            const labeledRects = selectionContainer.querySelectorAll('rect[aria-label], [aria-label]');
            labeledRects.forEach(el => {
                const label = el.getAttribute('aria-label') || el.textContent;
                if (label && label.trim()) {
                    textParts.push(label.trim());
                }
            });

            // Method 2: Get text from SVG title/desc elements
            const titles = selectionContainer.querySelectorAll('title, desc');
            titles.forEach(el => {
                const text = (el.textContent || '').trim();
                if (text) textParts.push(text);
            });

            // Method 3: Get text from g[role="paragraph"] or similar in the selection area
            const paragraphs = selectionContainer.querySelectorAll('g[role="paragraph"], g[role="listitem"]');
            paragraphs.forEach(el => {
                const text = this.extractTextFromElement(el);
                if (text) textParts.push(text);
            });

            // Method 4: Selection rects - find overlapping text elements in kix-page
            if (textParts.length === 0) {
                const selectionRects = selectionContainer.querySelectorAll('svg rect');
                const page = document.querySelector('.kix-page-paginated');
                if (page && selectionRects.length > 0) {
                    const rects = Array.from(selectionRects).map(r => r.getBoundingClientRect());
                    const textFromOverlap = this.getTextFromOverlappingRects(page, rects);
                    if (textFromOverlap) textParts.push(textFromOverlap);
                }
            }

            if (textParts.length === 0) {
                SmartSwapUtils.warn('Accessibility DOM: No text found. Enable screen reader: Tools > Accessibility (Cmd+Option+Z)');
                return null;
            }

            const selectedText = textParts.join(' ').replace(/\s+/g, ' ').trim();
            SmartSwapUtils.log('Selected text (accessibility):', selectedText.substring(0, 50) + (selectedText.length > 50 ? '...' : ''));
            return selectedText;
        } catch (error) {
            SmartSwapUtils.error('getSelectedTextViaAccessibility failed:', error);
            return null;
        }
    },

    /**
     * Extract text from an element and its descendants
     */
    extractTextFromElement: function (el) {
        if (!el) return '';
        // Prefer aria-label, then textContent
        const label = el.getAttribute('aria-label');
        if (label && label.trim()) return label.trim();
        return (el.textContent || '').trim();
    },

    /**
     * Find text elements that overlap with selection rects
     */
    getTextFromOverlappingRects: function (page, selectionRects) {
        const overlaps = (a, b) =>
            a.left < b.right && a.right > b.left && a.top < b.bottom && a.bottom > b.top;

        const textElements = page.querySelectorAll('svg > g[role="paragraph"] rect, svg > g rect[aria-label]');
        const matchedText = [];

        textElements.forEach(el => {
            const rect = el.getBoundingClientRect();
            const hasOverlap = selectionRects.some(sr => overlaps(rect, sr));
            if (hasOverlap) {
                const text = el.getAttribute('aria-label') || el.getAttribute('title') || '';
                if (text.trim()) matchedText.push(text.trim());
            }
        });

        return matchedText.length > 0 ? matchedText.join(' ') : null;
    },

    /**
     * Get the current selection range
     * This is useful for more advanced operations
     */
    getSelectionRange: function () {
        try {
            const selection = window.getSelection();
            if (!selection || selection.rangeCount === 0) {
                return null;
            }

            return selection.getRangeAt(0);
        } catch (error) {
            SmartSwapUtils.error('Failed to get selection range:', error);
            return null;
        }
    },

    /**
     * Check if the cursor is in the Google Docs editor
     */
    isInEditor: function () {
        const editorContainer = document.querySelector(SMARTSWAP_CONSTANTS.GOOGLE_DOCS.EDITOR_CONTAINER);
        if (!editorContainer) {
            return false;
        }

        // Check native selection anchor
        const selection = window.getSelection();
        if (selection && selection.anchorNode) {
            let node = selection.anchorNode;
            while (node) {
                if (node === editorContainer) return true;
                node = node.parentNode;
            }
        }

        // If we have accessibility selection, we're in the editor
        if (this.hasSelectionViaAccessibility()) {
            return true;
        }

        // Editor exists but no selection - assume we're in editor (cursor could be there)
        return !!document.querySelector('.kix-appview-editor');
    },

    /**
     * Wait for Google Docs editor to be ready
     */
    waitForEditor: async function () {
        try {
            SmartSwapUtils.log('Waiting for Google Docs editor...');
            await SmartSwapUtils.waitForElement(SMARTSWAP_CONSTANTS.GOOGLE_DOCS.EDITOR_CONTAINER);
            SmartSwapUtils.log('Google Docs editor ready');
            return true;
        } catch (error) {
            SmartSwapUtils.error('Google Docs editor not found:', error);
            return false;
        }
    },

    /**
     * Get selection metadata (for debugging and advanced features)
     */
    getSelectionMetadata: function () {
        const selection = window.getSelection();
        const nativeText = selection ? selection.toString() : '';
        const accessibilityText = this.getSelectedTextViaAccessibility();

        return {
            text: nativeText || accessibilityText || '(none)',
            source: nativeText ? 'native' : (accessibilityText ? 'accessibility' : 'none'),
            rangeCount: selection?.rangeCount ?? 0,
            isCollapsed: selection?.isCollapsed ?? true,
            anchorNode: selection?.anchorNode?.nodeName,
            focusNode: selection?.focusNode?.nodeName,
            inEditor: this.isInEditor(),
            hasAccessibilitySelection: this.hasSelectionViaAccessibility()
        };
    }
};

// Make SelectionHandler available globally
if (typeof window !== 'undefined') {
    window.SelectionHandler = SelectionHandler;
}
