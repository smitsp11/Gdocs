// Clipboard Manager for SmartSwap
// Handles reading from and writing to the system clipboard

const ClipboardManager = {
    // Temporary buffer for storing displaced text during exchange paste
    tempBuffer: null,

    /**
     * Read text from the clipboard
     * Uses the Clipboard API which requires user interaction
     */
    readClipboard: async function () {
        try {
            const timer = SmartSwapUtils.startTimer('Clipboard Read');

            // Check if Clipboard API is available
            if (!navigator.clipboard || !navigator.clipboard.readText) {
                SmartSwapUtils.warn('Clipboard API not available');
                return null;
            }

            const text = await navigator.clipboard.readText();
            timer.end();

            SmartSwapUtils.log('Clipboard read:', text.substring(0, 50) + (text.length > 50 ? '...' : ''));
            return text;
        } catch (error) {
            SmartSwapUtils.error('Failed to read clipboard:', error);
            return null;
        }
    },

    /**
     * Write text to the clipboard
     * This is the critical operation for exchange paste
     */
    writeClipboard: async function (text) {
        try {
            const timer = SmartSwapUtils.startTimer('Clipboard Write');

            // Check if Clipboard API is available
            if (!navigator.clipboard || !navigator.clipboard.writeText) {
                SmartSwapUtils.warn('Clipboard API not available');
                return false;
            }

            await navigator.clipboard.writeText(text);
            timer.end();

            SmartSwapUtils.log('Clipboard written:', text.substring(0, 50) + (text.length > 50 ? '...' : ''));
            return true;
        } catch (error) {
            SmartSwapUtils.error('Failed to write clipboard:', error);
            return false;
        }
    },

    /**
     * Store text in temporary buffer
     * This is used to hold the displaced text during exchange paste
     */
    setTempBuffer: function (text) {
        this.tempBuffer = text;
        SmartSwapUtils.log('Temp buffer set:', text.substring(0, 50) + (text.length > 50 ? '...' : ''));
    },

    /**
     * Get text from temporary buffer
     */
    getTempBuffer: function () {
        return this.tempBuffer;
    },

    /**
     * Clear temporary buffer
     */
    clearTempBuffer: function () {
        this.tempBuffer = null;
        SmartSwapUtils.log('Temp buffer cleared');
    },

    /**
     * Perform the exchange paste operation
     * This is the core of the SmartSwap functionality
     * 
     * Steps:
     * 1. Capture the selected text (destination)
     * 2. Allow the paste to happen normally (source replaces destination)
     * 3. Update clipboard with the captured destination text
     */
    performExchangePaste: async function (selectedText) {
        try {
            const timer = SmartSwapUtils.startTimer('Exchange Paste');

            // Store the selected text in temp buffer
            this.setTempBuffer(selectedText);

            SmartSwapUtils.log('Exchange paste initiated');
            SmartSwapUtils.log('Selected text (will be displaced):', selectedText.substring(0, 50) + (selectedText.length > 50 ? '...' : ''));

            // The paste event will happen naturally
            // We need to update the clipboard AFTER the paste completes
            // Use a small delay to ensure the paste has completed
            setTimeout(async () => {
                const displacedText = this.getTempBuffer();
                if (displacedText) {
                    const success = await this.writeClipboard(displacedText);
                    if (success) {
                        SmartSwapUtils.log('✅ Exchange paste complete - clipboard now contains:', displacedText.substring(0, 50) + (displacedText.length > 50 ? '...' : ''));

                        // Dispatch custom event for tracking
                        window.dispatchEvent(new CustomEvent(SMARTSWAP_CONSTANTS.EVENTS.EXCHANGE_PASTE_COMPLETE, {
                            detail: { displacedText }
                        }));
                    }
                    this.clearTempBuffer();
                }

                const duration = timer.end();

                // Check if we met the performance requirement
                if (duration > SMARTSWAP_CONSTANTS.MAX_LATENCY_MS) {
                    SmartSwapUtils.warn(`⚠️ Performance issue: Exchange paste took ${duration.toFixed(2)}ms (threshold: ${SMARTSWAP_CONSTANTS.MAX_LATENCY_MS}ms)`);
                }
            }, 10); // Small delay to let paste complete

            return true;
        } catch (error) {
            SmartSwapUtils.error('Exchange paste failed:', error);
            this.clearTempBuffer();
            return false;
        }
    }
};

// Make ClipboardManager available globally
if (typeof window !== 'undefined') {
    window.ClipboardManager = ClipboardManager;
}
