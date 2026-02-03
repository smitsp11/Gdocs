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
     * Perform the exchange paste operation (legacy - uses pre-read selection)
     */
    performExchangePaste: async function (selectedText) {
        try {
            const timer = SmartSwapUtils.startTimer('Exchange Paste');
            this.setTempBuffer(selectedText);
            SmartSwapUtils.log('Exchange paste initiated');
            setTimeout(async () => {
                const displacedText = this.getTempBuffer();
                if (displacedText) {
                    const success = await this.writeClipboard(displacedText);
                    if (success) {
                        SmartSwapUtils.log('✅ Exchange paste complete - clipboard now contains:', displacedText.substring(0, 50) + (displacedText.length > 50 ? '...' : ''));
                        if (SMARTSWAP_CONSTANTS.FEATURES.VISUAL_FEEDBACK && window.VisualFeedback) {
                            VisualFeedback.show(displacedText);
                        }
                        if (SMARTSWAP_CONSTANTS.FEATURES.HISTORY_BUFFER && window.ClipboardHistory) {
                            await ClipboardHistory.addItem(displacedText);
                        }
                        window.dispatchEvent(new CustomEvent(SMARTSWAP_CONSTANTS.EVENTS.EXCHANGE_PASTE_COMPLETE, { detail: { displacedText } }));
                    }
                    this.clearTempBuffer();
                }
                const duration = timer.end();
                if (duration > SMARTSWAP_CONSTANTS.MAX_LATENCY_MS) {
                    SmartSwapUtils.warn(`⚠️ Performance issue: Exchange paste took ${duration.toFixed(2)}ms (threshold: ${SMARTSWAP_CONSTANTS.MAX_LATENCY_MS}ms)`);
                }
            }, 10);
            return true;
        } catch (error) {
            SmartSwapUtils.error('Exchange paste failed:', error);
            this.clearTempBuffer();
            return false;
        }
    },

    /**
     * Get the document that contains the editor (Google Docs uses iframes).
     * execCommand must run in the editor's document; paste can fire from main frame.
     */
    getEditorDocument: function (event) {
        const targetDoc = event?.target?.ownerDocument;
        if (targetDoc) return targetDoc;
        const iframe = document.querySelector('iframe.docs-texteventtarget-iframe, iframe[title="docs-texteventtarget-iframe"], iframe[id="doc-contents-iframe"]');
        if (iframe?.contentDocument) return iframe.contentDocument;
        const editor = document.querySelector('.kix-appview-editor');
        if (editor) return editor.ownerDocument;
        return document;
    },

    /**
     * Steal, Paste, Restore flow:
     * preventDefault -> copy selection -> read displaced text -> restore original clipboard -> paste -> stash displaced text for next paste
     */
    performExchangePasteSteal: async function (event) {
        // #region agent log
        const _dbg = (loc, msg, d) => { try { const p={location:loc,message:msg,data:d||{},timestamp:Date.now(),sessionId:'debug-session',hypothesisId:'steal-flow',runId:'post-fix'}; console.log('[SmartSwap DBG]', loc, msg, d); fetch('http://127.0.0.1:7244/ingest/2c451608-727f-411e-9c84-4aeefb865d93',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify(p)}).catch(()=>{}); } catch(e){} };
        // #endregion
        try {
            event.preventDefault();
            event.stopPropagation();

            const doc = this.getEditorDocument(event);
            if (!doc) {
                _dbg('clipboard-manager.js:performExchangePasteSteal:error', 'no editor doc');
                return false;
            }

            const win = doc.defaultView || window;
            if (win.focus) win.focus();

            const eventClipboard = (event.clipboardData && event.clipboardData.getData('text/plain')) || '';
            let originalClipboard = eventClipboard;
            if (!originalClipboard) {
                originalClipboard = (await this.readClipboard()) || '';
            }
            _dbg('clipboard-manager.js:performExchangePasteSteal:entry', 'paste', { pasteLen: originalClipboard.length, fromEvent: Boolean(eventClipboard) });

            const copyResult = doc.execCommand('copy');
            _dbg('clipboard-manager.js:performExchangePasteSteal:afterCopy', 'copy result', { copyResult });

            await new Promise(resolve => setTimeout(resolve, 10));

            const displacedText = await this.readClipboard();
            const swapDetected = Boolean(displacedText) && displacedText !== originalClipboard;
            _dbg('clipboard-manager.js:performExchangePasteSteal:afterRead', 'clipboard contents', { displacedLen: (displacedText || '').length, swapDetected });

            await this.writeClipboard(originalClipboard);

            const pasteResult = doc.execCommand('paste');
            _dbg('clipboard-manager.js:performExchangePasteSteal:afterPaste', 'paste result', { pasteResult });

            if (swapDetected) {
                await this.writeClipboard(displacedText);
                _dbg('clipboard-manager.js:performExchangePasteSteal:done', 'clipboard restored with displaced text', { displacedLen: displacedText.length, preview: displacedText.substring(0, 30) });

                if (SMARTSWAP_CONSTANTS.FEATURES.VISUAL_FEEDBACK && window.VisualFeedback) {
                    VisualFeedback.show(displacedText);
                }
                if (SMARTSWAP_CONSTANTS.FEATURES.HISTORY_BUFFER && window.ClipboardHistory) {
                    await ClipboardHistory.addItem(displacedText);
                }
                window.dispatchEvent(new CustomEvent(SMARTSWAP_CONSTANTS.EVENTS.EXCHANGE_PASTE_COMPLETE, { detail: { displacedText } }));
            } else {
                _dbg('clipboard-manager.js:performExchangePasteSteal:done', 'no swap detected, clipboard unchanged', { displacedLen: (displacedText || '').length });
            }

            return true;
        } catch (error) {
            _dbg('clipboard-manager.js:performExchangePasteSteal:error', 'exception', { err: String(error) });
            SmartSwapUtils.error('Exchange paste via steal failed:', error);
            return false;
        }
    }
};

// Make ClipboardManager available globally
if (typeof window !== 'undefined') {
    window.ClipboardManager = ClipboardManager;
}
