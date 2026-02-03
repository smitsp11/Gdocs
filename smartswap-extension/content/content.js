// Main Content Script for SmartSwap
// This script coordinates the exchange paste functionality

// IMMEDIATELY register event listeners in capture phase BEFORE Google Docs can
// This must happen at the very top, before any async operations
console.log("SmartSwap: Injecting early capture listeners...");

// Global state
let smartSwapInitialized = false;
let smartSwapEnabled = true;
let pasteEventInProgress = false;

/**
 * Early paste handler - runs before Google Docs can intercept
 */
function earlyPasteHandler(event) {
    console.log("SmartSwap: 🔍 PASTE EVENT CAPTURED!", event);

    if (!smartSwapInitialized || !smartSwapEnabled) {
        console.log("SmartSwap: Not ready yet or disabled, allowing normal paste");
        return;
    }

    // Forward to main handler
    if (typeof handlePaste === 'function') {
        handlePaste(event);
    }
}

/**
 * Early keydown handler - runs before Google Docs can intercept
 */
function earlyKeydownHandler(event) {
    const isCmdOrCtrl = event.metaKey || event.ctrlKey;

    if (isCmdOrCtrl && (event.key === 'v' || event.key === 'V')) {
        console.log("SmartSwap: ⌨️ Cmd/Ctrl+V DETECTED!");
    }

    // Forward to main handler if initialized
    if (smartSwapInitialized && typeof handleKeyDown === 'function') {
        handleKeyDown(event);
    }
}

// Register listeners IMMEDIATELY in capture phase
document.addEventListener('paste', earlyPasteHandler, { capture: true });
document.addEventListener('keydown', earlyKeydownHandler, { capture: true });

// Also try on window
window.addEventListener('paste', earlyPasteHandler, { capture: true });
window.addEventListener('keydown', earlyKeydownHandler, { capture: true });

console.log("SmartSwap: Early listeners registered (capture phase)");

// Now the main initialization (async)
(async function () {
    'use strict';

    // Wait for DOM to be ready if we're at document_start
    if (document.readyState === 'loading') {
        await new Promise(resolve => {
            document.addEventListener('DOMContentLoaded', resolve);
        });
    }

    console.log('[SmartSwap] SmartSwap content script loaded');

    // Check if we're on a Google Docs page
    if (typeof SmartSwapUtils === 'undefined') {
        console.error('[SmartSwap] SmartSwapUtils not loaded!');
        return;
    }

    if (!SmartSwapUtils.isGoogleDocsPage()) {
        SmartSwapUtils.log('Not a Google Docs page, exiting');
        return;
    }

    SmartSwapUtils.log('Google Docs page detected');

    // Wait for the editor to be ready
    const editorReady = await SelectionHandler.waitForEditor();
    if (!editorReady) {
        SmartSwapUtils.error('Failed to initialize: Google Docs editor not found');
        return;
    }

    // Check if extension is enabled
    const enabled = await SmartSwapUtils.isEnabled();
    smartSwapEnabled = enabled;
    if (!enabled) {
        SmartSwapUtils.log('SmartSwap is disabled');
        return;
    }

    SmartSwapUtils.log('✅ SmartSwap initialized and ready');

    // Phase 2: Initialize advanced features
    if (SMARTSWAP_CONSTANTS.FEATURES.VISUAL_FEEDBACK && window.VisualFeedback) {
        VisualFeedback.init();
        SmartSwapUtils.log('Visual feedback initialized');
    }

    if (SMARTSWAP_CONSTANTS.FEATURES.QUICK_SWAP && window.QuickSwap) {
        QuickSwap.init();
        SmartSwapUtils.log('Quick swap initialized');
    }

    if (SMARTSWAP_CONSTANTS.FEATURES.DRAG_SWAP && window.DragSwapMode) {
        DragSwapMode.init();
        SmartSwapUtils.log('Drag swap mode initialized');
    }

    if (SMARTSWAP_CONSTANTS.FEATURES.HISTORY_BUFFER && window.ClipboardHistory) {
        await ClipboardHistory.init();
        SmartSwapUtils.log('Clipboard history initialized');
    }

    /**
     * Handle paste events
     * This is where the magic happens - we intercept paste when text is selected
     */
    window.handlePaste = async function (event) {
        try {
            // Prevent multiple simultaneous paste operations
            if (pasteEventInProgress) {
                SmartSwapUtils.log('Paste already in progress, skipping');
                return;
            }

            // Check if extension is still enabled
            const isEnabled = await SmartSwapUtils.isEnabled();
            if (!isEnabled) {
                SmartSwapUtils.log('Extension disabled, allowing normal paste');
                return;
            }

            // Check if we're in the editor
            if (!SelectionHandler.isInEditor()) {
                SmartSwapUtils.log('Not in editor, allowing normal paste');
                return;
            }

            // FR 1.1: Detect if there's a text selection
            const hasSelection = SelectionHandler.hasSelection();

            if (!hasSelection) {
                // FR 1.3: No selection - perform standard paste
                SmartSwapUtils.log('No selection detected, allowing normal paste');
                return;
            }

            // FR 1.2: There's a selection - perform exchange paste
            SmartSwapUtils.log('🔄 Selection detected - initiating exchange paste');

            pasteEventInProgress = true;

            // Get the selected text before it gets replaced
            const selectedText = SelectionHandler.getSelectedText();

            if (!selectedText) {
                SmartSwapUtils.warn('Failed to get selected text, allowing normal paste');
                pasteEventInProgress = false;
                return;
            }

            // Log selection metadata for debugging
            const metadata = SelectionHandler.getSelectionMetadata();
            SmartSwapUtils.log('Selection metadata:', metadata);

            // Dispatch event for tracking
            window.dispatchEvent(new CustomEvent(SMARTSWAP_CONSTANTS.EVENTS.EXCHANGE_PASTE_START, {
                detail: { selectedText }
            }));

            // Perform the exchange paste
            // Note: We don't prevent the default paste behavior
            // We let it happen, then update the clipboard with the displaced text
            await ClipboardManager.performExchangePaste(selectedText);

            // Reset flag after a short delay
            setTimeout(() => {
                pasteEventInProgress = false;
            }, 100);

        } catch (error) {
            SmartSwapUtils.error('Error in paste handler:', error);
            pasteEventInProgress = false;

            window.dispatchEvent(new CustomEvent(SMARTSWAP_CONSTANTS.EVENTS.ERROR, {
                detail: { error: error.message }
            }));
        }
    };

    /**
     * Handle keyboard events
     * We listen for Ctrl/Cmd+V to detect paste operations
     * And Alt+X for quick swap (Phase 2)
     */
    window.handleKeyDown = function (event) {
        // Log all keyboard events for debugging
        if ((event.ctrlKey || event.metaKey) && event.key) {
            SmartSwapUtils.log(`⌨️ Keyboard: ${event.metaKey ? 'Cmd' : 'Ctrl'}+${event.key}`);
        }

        // Check for paste shortcut (Ctrl/Cmd + V)
        const isPasteShortcut = (event.ctrlKey || event.metaKey) &&
            SMARTSWAP_CONSTANTS.HOTKEYS.PASTE.includes(event.key);

        if (isPasteShortcut) {
            SmartSwapUtils.log('✂️ PASTE SHORTCUT DETECTED (Cmd/Ctrl+V)');
            // The actual paste event will fire separately
            // We just log this for debugging
        }

        // Phase 2: Check for quick swap hotkey (Alt + X)
        if (SMARTSWAP_CONSTANTS.FEATURES.QUICK_SWAP &&
            event.altKey &&
            event.key.toLowerCase() === SMARTSWAP_CONSTANTS.HOTKEYS.QUICK_SWAP.toLowerCase()) {

            event.preventDefault();
            SmartSwapUtils.log('Quick swap hotkey detected (Alt+X)');

            if (window.QuickSwap) {
                QuickSwap.handleQuickSwap();
            }
        }

        // Phase 2: Toggle drag swap mode with Ctrl+Shift+D
        if (SMARTSWAP_CONSTANTS.FEATURES.DRAG_SWAP &&
            event.ctrlKey && event.shiftKey && event.key.toLowerCase() === 'd') {

            event.preventDefault();
            SmartSwapUtils.log('Drag swap toggle hotkey detected (Ctrl+Shift+D)');

            if (window.DragSwapMode) {
                const isActive = DragSwapMode.toggle();
                if (window.VisualFeedback) {
                    VisualFeedback.show(isActive ? 'Drag Swap Mode: ON' : 'Drag Swap Mode: OFF', 2000);
                }
            }
        }
    };

    // Mark as initialized
    smartSwapInitialized = true;

    SmartSwapUtils.log('Event listeners attached');

    // Listen for messages from background script or popup
    chrome.runtime.onMessage.addListener((message, sender, sendResponse) => {
        SmartSwapUtils.log('Message received:', message);

        if (message.action === 'getStatus') {
            sendResponse({
                enabled: smartSwapEnabled,
                initialized: smartSwapInitialized,
                hasSelection: SelectionHandler.hasSelection(),
                inEditor: SelectionHandler.isInEditor()
            });
        } else if (message.action === 'toggleEnabled') {
            smartSwapEnabled = message.enabled;
            SmartSwapUtils.log('Toggle enabled:', message.enabled);
            sendResponse({ success: true });
        }

        return true; // Keep message channel open for async response
    });

    // Clean up on page unload
    window.addEventListener('beforeunload', () => {
        document.removeEventListener('paste', earlyPasteHandler, { capture: true });
        document.removeEventListener('keydown', earlyKeydownHandler, { capture: true });
        SmartSwapUtils.log('Event listeners removed');
    });

    SmartSwapUtils.log('🚀 SmartSwap is active and monitoring for paste events');

    // Debug exports for DevTools console (content script runs in isolated context)
    if (typeof window !== 'undefined') {
        window.__ss = {
            selection: SelectionHandler,
            clipboard: ClipboardManager,
            history: typeof ClipboardHistory !== 'undefined' ? ClipboardHistory : null,
            visual: typeof VisualFeedback !== 'undefined' ? VisualFeedback : null,
            constants: SMARTSWAP_CONSTANTS,
            hasSelection: () => SelectionHandler.hasSelection(),
            getSelectedText: () => SelectionHandler.getSelectedText(),
            metadata: () => SelectionHandler.getSelectionMetadata()
        };
    }

})();
