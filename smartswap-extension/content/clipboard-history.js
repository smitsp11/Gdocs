// Clipboard History Buffer for SmartSwap
// Keeps track of recent swapped items

const ClipboardHistory = {
    history: [],
    maxItems: 3,
    storageKey: 'smartswap_clipboard_history',

    /**
     * Initialize clipboard history
     */
    init: async function () {
        if (!SMARTSWAP_CONSTANTS.FEATURES.HISTORY_BUFFER) {
            return;
        }

        // Load history from storage
        await this.loadHistory();

        SmartSwapUtils.log('Clipboard history initialized');
    },

    /**
     * Add item to history
     */
    addItem: async function (text) {
        if (!text || text.length === 0) {
            return;
        }

        const item = {
            text: text,
            timestamp: Date.now()
        };

        // Add to beginning of array
        this.history.unshift(item);

        // Keep only max items
        if (this.history.length > this.maxItems) {
            this.history = this.history.slice(0, this.maxItems);
        }

        // Save to storage
        await this.saveHistory();

        SmartSwapUtils.log('Added to history:', text.substring(0, 50));
    },

    /**
     * Get history items
     */
    getHistory: function () {
        return this.history;
    },

    /**
     * Clear history
     */
    clearHistory: async function () {
        this.history = [];
        await this.saveHistory();
        SmartSwapUtils.log('History cleared');
    },

    /**
     * Load history from storage
     */
    loadHistory: async function () {
        try {
            const result = await chrome.storage.local.get(this.storageKey);
            if (result[this.storageKey]) {
                this.history = result[this.storageKey];
                SmartSwapUtils.log('History loaded:', this.history.length, 'items');
            }
        } catch (error) {
            SmartSwapUtils.error('Failed to load history:', error);
        }
    },

    /**
     * Save history to storage
     */
    saveHistory: async function () {
        try {
            await chrome.storage.local.set({
                [this.storageKey]: this.history
            });
        } catch (error) {
            SmartSwapUtils.error('Failed to save history:', error);
        }
    },

    /**
     * Get formatted history for display
     */
    getFormattedHistory: function () {
        return this.history.map((item, index) => {
            const preview = item.text.length > 50
                ? item.text.substring(0, 50) + '...'
                : item.text;

            const timeAgo = this.getTimeAgo(item.timestamp);

            return {
                index: index,
                preview: preview,
                fullText: item.text,
                timeAgo: timeAgo
            };
        });
    },

    /**
     * Get human-readable time ago
     */
    getTimeAgo: function (timestamp) {
        const seconds = Math.floor((Date.now() - timestamp) / 1000);

        if (seconds < 60) return 'just now';
        if (seconds < 3600) return Math.floor(seconds / 60) + 'm ago';
        if (seconds < 86400) return Math.floor(seconds / 3600) + 'h ago';
        return Math.floor(seconds / 86400) + 'd ago';
    }
};

// Make ClipboardHistory available globally
if (typeof window !== 'undefined') {
    window.ClipboardHistory = ClipboardHistory;
}
