// Selection Handler for Google Docs
// Handles the complexity of detecting and extracting selected text from Google Docs

const SelectionHandler = {
    /**
     * Check if there is currently a text selection
     */
    hasSelection: function () {
        const selection = window.getSelection();
        return selection && selection.toString().length > 0;
    },

    /**
     * Get the currently selected text
     * Google Docs uses standard browser Selection API despite canvas rendering
     */
    getSelectedText: function () {
        try {
            const selection = window.getSelection();
            if (!selection || selection.rangeCount === 0) {
                return null;
            }

            const selectedText = selection.toString();

            if (selectedText.length === 0) {
                return null;
            }

            SmartSwapUtils.log('Selected text detected:', selectedText.substring(0, 50) + (selectedText.length > 50 ? '...' : ''));
            return selectedText;
        } catch (error) {
            SmartSwapUtils.error('Failed to get selected text:', error);
            return null;
        }
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
        const selection = window.getSelection();
        if (!selection || !selection.anchorNode) {
            return false;
        }

        // Check if the selection is within the Google Docs editor
        const editorContainer = document.querySelector(SMARTSWAP_CONSTANTS.GOOGLE_DOCS.EDITOR_CONTAINER);
        if (!editorContainer) {
            return false;
        }

        // Check if the anchor node is a descendant of the editor
        let node = selection.anchorNode;
        while (node) {
            if (node === editorContainer) {
                return true;
            }
            node = node.parentNode;
        }

        return false;
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
        if (!selection) {
            return null;
        }

        return {
            text: selection.toString(),
            rangeCount: selection.rangeCount,
            isCollapsed: selection.isCollapsed,
            anchorNode: selection.anchorNode?.nodeName,
            focusNode: selection.focusNode?.nodeName,
            inEditor: this.isInEditor()
        };
    }
};

// Make SelectionHandler available globally
if (typeof window !== 'undefined') {
    window.SelectionHandler = SelectionHandler;
}
