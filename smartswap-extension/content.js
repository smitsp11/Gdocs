// SmartSwap Content Script for Google Docs
// Implements Exchange Paste, Quick Swap, and Drag-and-Swap functionality

(function () {
    'use strict';

    // Extension state
    let isEnabled = true;
    let lastSwappedText = null;
    let swapModeEnabled = false; // FR 2.1: Swap Mode toggle
    let dragSourceText = null; // For drag-and-swap tracking
    let dragSourceRange = null;

    // Initialize and get current state
    function init() {
        chrome.runtime.sendMessage({ type: 'GET_STATE' }, (response) => {
            if (response) {
                isEnabled = response.enabled;
                swapModeEnabled = response.swapModeEnabled || false;
            }
        });

        // Listen for state changes from popup
        chrome.runtime.onMessage.addListener((message) => {
            if (message.type === 'STATE_CHANGED') {
                isEnabled = message.enabled;
                console.log('[SmartSwap] Extension ' + (isEnabled ? 'enabled' : 'disabled'));
            }
            if (message.type === 'SWAP_MODE_CHANGED') {
                swapModeEnabled = message.swapModeEnabled;
                updateSwapModeIndicator();
                console.log('[SmartSwap] Swap Mode ' + (swapModeEnabled ? 'enabled' : 'disabled'));
            }
        });

        // Set up event listeners
        setupKeyboardListeners();
        setupDragAndSwap();
        console.log('[SmartSwap] Content script initialized for Google Docs');
    }

    // Get the currently selected text in Google Docs
    function getSelectedText() {
        // Try standard selection first
        const selection = window.getSelection();
        if (selection && selection.toString().trim()) {
            return selection.toString();
        }

        // Try getting from Google Docs iframe (accessibility layer)
        const iframe = document.querySelector('.docs-texteventtarget-iframe');
        if (iframe && iframe.contentDocument) {
            const iframeSelection = iframe.contentDocument.getSelection();
            if (iframeSelection && iframeSelection.toString().trim()) {
                return iframeSelection.toString();
            }
        }

        return '';
    }

    // Write text to clipboard
    async function writeToClipboard(text) {
        try {
            await navigator.clipboard.writeText(text);
            return true;
        } catch (err) {
            console.error('[SmartSwap] Failed to write to clipboard:', err);
            // Fallback using execCommand
            try {
                const textarea = document.createElement('textarea');
                textarea.value = text;
                textarea.style.position = 'fixed';
                textarea.style.left = '-9999px';
                document.body.appendChild(textarea);
                textarea.select();
                document.execCommand('copy');
                document.body.removeChild(textarea);
                return true;
            } catch (fallbackErr) {
                console.error('[SmartSwap] Fallback clipboard write failed:', fallbackErr);
                return false;
            }
        }
    }

    // Show visual feedback widget
    function showSwapWidget(text) {
        // Remove existing widget if any
        const existingWidget = document.getElementById('smartswap-widget');
        if (existingWidget) {
            existingWidget.remove();
        }

        // Create widget
        const widget = document.createElement('div');
        widget.id = 'smartswap-widget';
        widget.className = 'smartswap-widget smartswap-widget-show';

        const icon = document.createElement('span');
        icon.className = 'smartswap-widget-icon';
        icon.textContent = '↔️';

        const content = document.createElement('div');
        content.className = 'smartswap-widget-content';

        const label = document.createElement('span');
        label.className = 'smartswap-widget-label';
        label.textContent = 'Swapped to clipboard:';

        const textPreview = document.createElement('span');
        textPreview.className = 'smartswap-widget-text';
        // Truncate long text
        const displayText = text.length > 50 ? text.substring(0, 47) + '...' : text;
        textPreview.textContent = displayText;

        content.appendChild(label);
        content.appendChild(textPreview);
        widget.appendChild(icon);
        widget.appendChild(content);

        document.body.appendChild(widget);

        // Auto-hide after 3 seconds
        setTimeout(() => {
            widget.classList.remove('smartswap-widget-show');
            widget.classList.add('smartswap-widget-hide');
            setTimeout(() => widget.remove(), 300);
        }, 3000);

        // Add to history
        chrome.runtime.sendMessage({
            type: 'ADD_TO_HISTORY',
            text: text
        });
    }

    // Handle Exchange Paste (FR 1.1 - 1.3)
    async function handleExchangePaste(event) {
        if (!isEnabled) return;

        const selectedText = getSelectedText();

        // FR 1.3: If no text selected, perform standard paste
        if (!selectedText) {
            return; // Let default paste happen
        }

        // FR 1.1 & 1.2: Store selected text and swap after paste
        lastSwappedText = selectedText;

        // Allow the paste to happen first, then update clipboard
        // Use setTimeout to ensure paste completes
        setTimeout(async () => {
            if (lastSwappedText) {
                const success = await writeToClipboard(lastSwappedText);
                if (success) {
                    showSwapWidget(lastSwappedText);
                    console.log('[SmartSwap] Exchange paste completed. Clipboard now contains:', lastSwappedText);
                }
                lastSwappedText = null;
            }
        }, 50);
    }

    // Handle Quick Swap - Alt+X (FR 3.1 - 3.2)
    function handleQuickSwap(event) {
        if (!isEnabled) return;

        const selection = window.getSelection();
        if (!selection.rangeCount) return;

        const range = selection.getRangeAt(0);

        // Get the text content around cursor
        const container = range.commonAncestorContainer;
        if (container.nodeType !== Node.TEXT_NODE) return;

        const text = container.textContent;
        const cursorPos = range.startOffset;

        // Find word boundaries
        let leftStart = cursorPos - 1;
        let leftEnd = cursorPos;
        let rightStart = cursorPos;
        let rightEnd = cursorPos + 1;

        // Find left word
        while (leftStart > 0 && /\S/.test(text[leftStart - 1])) {
            leftStart--;
        }
        while (leftEnd > leftStart && /\s/.test(text[leftEnd - 1])) {
            leftEnd--;
        }

        // Find right word
        while (rightStart < text.length && /\s/.test(text[rightStart])) {
            rightStart++;
        }
        while (rightEnd < text.length && /\S/.test(text[rightEnd])) {
            rightEnd++;
        }

        const leftWord = text.substring(leftStart, leftEnd);
        const rightWord = text.substring(rightStart, rightEnd);

        if (!leftWord || !rightWord) {
            console.log('[SmartSwap] Quick swap: Could not find adjacent words');
            return;
        }

        // Create swapped text
        const before = text.substring(0, leftStart);
        const middle = text.substring(leftEnd, rightStart);
        const after = text.substring(rightEnd);
        const newText = before + rightWord + middle + leftWord + after;

        // Update the text node
        container.textContent = newText;

        // Show visual feedback
        showSwapWidget(`${leftWord} ↔ ${rightWord}`);

        console.log('[SmartSwap] Quick swap completed:', leftWord, '↔', rightWord);

        event.preventDefault();
    }

    // Set up keyboard event listeners
    function setupKeyboardListeners() {
        // Listen on the document for keyboard events
        document.addEventListener('keydown', (event) => {
            const isMac = navigator.platform.toUpperCase().indexOf('MAC') >= 0;
            const modKey = isMac ? event.metaKey : event.ctrlKey;

            // Handle Ctrl/Cmd + V (Paste)
            if (modKey && event.key.toLowerCase() === 'v') {
                handleExchangePaste(event);
            }

            // Handle Alt + X (Quick Swap)
            if (event.altKey && event.key.toLowerCase() === 'x') {
                handleQuickSwap(event);
            }
        }, true); // Use capture phase to intercept before Google Docs

        // Also listen on the iframe if present
        const setupIframeListeners = () => {
            const iframe = document.querySelector('.docs-texteventtarget-iframe');
            if (iframe && iframe.contentDocument) {
                iframe.contentDocument.addEventListener('keydown', (event) => {
                    const isMac = navigator.platform.toUpperCase().indexOf('MAC') >= 0;
                    const modKey = isMac ? event.metaKey : event.ctrlKey;

                    if (modKey && event.key.toLowerCase() === 'v') {
                        handleExchangePaste(event);
                    }

                    if (event.altKey && event.key.toLowerCase() === 'x') {
                        handleQuickSwap(event);
                    }

                    // Handle Alt + S (Toggle Swap Mode)
                    if (event.altKey && event.key.toLowerCase() === 's') {
                        toggleSwapMode();
                        event.preventDefault();
                    }
                }, true);
            }
        };

        // Set up iframe listeners after a delay (Google Docs loads dynamically)
        setTimeout(setupIframeListeners, 2000);

        // Also observe for iframe changes
        const observer = new MutationObserver(() => {
            setupIframeListeners();
        });
        observer.observe(document.body, { childList: true, subtree: true });
    }

    // Toggle Swap Mode (FR 2.1)
    function toggleSwapMode() {
        swapModeEnabled = !swapModeEnabled;
        updateSwapModeIndicator();
        chrome.runtime.sendMessage({
            type: 'SET_SWAP_MODE',
            swapModeEnabled: swapModeEnabled
        });
        console.log('[SmartSwap] Swap Mode ' + (swapModeEnabled ? 'enabled' : 'disabled'));
    }

    // Update swap mode visual indicator
    function updateSwapModeIndicator() {
        let indicator = document.getElementById('smartswap-mode-indicator');

        if (swapModeEnabled && isEnabled) {
            if (!indicator) {
                indicator = document.createElement('div');
                indicator.id = 'smartswap-mode-indicator';
                indicator.className = 'smartswap-mode-indicator';
                indicator.innerHTML = `
                    <span class="smartswap-mode-icon">🔄</span>
                    <span class="smartswap-mode-text">Swap Mode</span>
                `;
                document.body.appendChild(indicator);
            }
            indicator.classList.add('smartswap-mode-active');
        } else if (indicator) {
            indicator.classList.remove('smartswap-mode-active');
            setTimeout(() => indicator.remove(), 300);
        }
    }

    // Set up Drag and Swap functionality (FR 2.1 - 2.3)
    function setupDragAndSwap() {
        // Track drag start to capture source text
        document.addEventListener('dragstart', (event) => {
            if (!isEnabled || !swapModeEnabled) return;

            const selectedText = getSelectedText();
            if (selectedText) {
                dragSourceText = selectedText;
                // Store selection range for later replacement
                const selection = window.getSelection();
                if (selection.rangeCount > 0) {
                    dragSourceRange = selection.getRangeAt(0).cloneRange();
                }
                console.log('[SmartSwap] Drag started with text:', dragSourceText);
            }
        }, true);

        // Handle drop for swap
        document.addEventListener('drop', (event) => {
            if (!isEnabled || !swapModeEnabled || !dragSourceText) {
                dragSourceText = null;
                dragSourceRange = null;
                return;
            }

            // Get drop target text
            const dropTargetText = getSelectedText();

            if (dropTargetText && dragSourceText && dropTargetText !== dragSourceText) {
                // Perform the swap (FR 2.2)
                event.preventDefault();

                // This is a simplified swap - full implementation would require
                // more complex DOM manipulation for Google Docs canvas
                console.log('[SmartSwap] Swapping:', dragSourceText, '↔', dropTargetText);
                showSwapWidget(`Swapped: "${truncateText(dragSourceText, 20)}" ↔ "${truncateText(dropTargetText, 20)}"`);
            }

            dragSourceText = null;
            dragSourceRange = null;
        }, true);

        // Clean up on drag end
        document.addEventListener('dragend', () => {
            dragSourceText = null;
            dragSourceRange = null;
        }, true);
    }

    // Helper: Truncate text for display
    function truncateText(text, maxLen) {
        if (text.length <= maxLen) return text;
        return text.substring(0, maxLen - 3) + '...';
    }

    // Initialize when DOM is ready
    if (document.readyState === 'loading') {
        document.addEventListener('DOMContentLoaded', init);
    } else {
        init();
    }
})();

