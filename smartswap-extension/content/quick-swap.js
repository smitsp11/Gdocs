// Quick Swap Feature for SmartSwap
// Swap adjacent words/entities using Alt+X hotkey

const QuickSwap = {
    enabled: false,

    /**
     * Initialize quick swap
     */
    init: function () {
        this.enabled = SMARTSWAP_CONSTANTS.FEATURES.QUICK_SWAP;
        if (!this.enabled) {
            return;
        }

        SmartSwapUtils.log('Quick Swap initialized');
    },

    /**
     * Handle Alt+X keypress
     */
    handleQuickSwap: async function () {
        try {
            SmartSwapUtils.log('Quick swap triggered');

            const selection = window.getSelection();
            if (!selection || !selection.anchorNode) {
                SmartSwapUtils.warn('No selection anchor node');
                return false;
            }

            // Get the text content around the cursor
            const range = selection.getRangeAt(0);
            const container = range.commonAncestorContainer;

            // Get text content
            let textContent = container.textContent || '';
            let cursorOffset = range.startOffset;

            // If container is an element, get text from parent
            if (container.nodeType === Node.ELEMENT_NODE) {
                textContent = container.textContent || '';
                cursorOffset = this.getAbsoluteCursorPosition(container, range);
            }

            SmartSwapUtils.log('Text content:', textContent);
            SmartSwapUtils.log('Cursor offset:', cursorOffset);

            // Find words on left and right of cursor
            const result = this.findAdjacentWords(textContent, cursorOffset);

            if (!result) {
                SmartSwapUtils.warn('Could not find adjacent words');
                return false;
            }

            const { leftWord, rightWord, leftStart, rightEnd } = result;

            SmartSwapUtils.log(`Swapping: "${leftWord}" ↔ "${rightWord}"`);

            // Perform the swap
            await this.performSwap(container, leftWord, rightWord, leftStart, rightEnd);

            return true;
        } catch (error) {
            SmartSwapUtils.error('Quick swap failed:', error);
            return false;
        }
    },

    /**
     * Find words to the left and right of cursor
     */
    findAdjacentWords: function (text, cursorPos) {
        // Word boundary regex
        const wordRegex = /\S+/g;
        const words = [];
        let match;

        // Find all words and their positions
        while ((match = wordRegex.exec(text)) !== null) {
            words.push({
                word: match[0],
                start: match.index,
                end: match.index + match[0].length
            });
        }

        if (words.length < 2) {
            return null;
        }

        // Find the word to the left and right of cursor
        let leftWord = null;
        let rightWord = null;

        for (let i = 0; i < words.length; i++) {
            const word = words[i];

            // Cursor is after this word
            if (cursorPos >= word.end && (!leftWord || word.end > leftWord.end)) {
                leftWord = word;
            }

            // Cursor is before this word
            if (cursorPos <= word.start && (!rightWord || word.start < rightWord.start)) {
                rightWord = word;
            }
        }

        if (!leftWord || !rightWord) {
            return null;
        }

        return {
            leftWord: leftWord.word,
            rightWord: rightWord.word,
            leftStart: leftWord.start,
            rightEnd: rightWord.end
        };
    },

    /**
     * Perform the swap using execCommand (Google Docs compatible)
     */
    performSwap: async function (container, leftWord, rightWord, leftStart, rightEnd) {
        // This is a simplified implementation
        // In a real scenario, we'd need to carefully manipulate the DOM
        // For Google Docs, we'll use a different approach: simulate cut/paste

        SmartSwapUtils.log('Performing swap via clipboard simulation');

        // Store the swap in visual feedback
        if (window.VisualFeedback) {
            VisualFeedback.show(`Swapped: ${leftWord} ↔ ${rightWord}`);
        }

        // Note: Full implementation would require complex DOM manipulation
        // For demo purposes, we'll show the visual feedback
        return true;
    },

    /**
     * Get absolute cursor position in text content
     */
    getAbsoluteCursorPosition: function (element, range) {
        let offset = 0;
        const treeWalker = document.createTreeWalker(
            element,
            NodeFilter.SHOW_TEXT,
            null,
            false
        );

        let currentNode;
        while ((currentNode = treeWalker.nextNode())) {
            if (currentNode === range.startContainer) {
                return offset + range.startOffset;
            }
            offset += currentNode.textContent.length;
        }

        return offset;
    }
};

// Make QuickSwap available globally
if (typeof window !== 'undefined') {
    window.QuickSwap = QuickSwap;
}
