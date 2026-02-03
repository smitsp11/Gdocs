// SmartSwap Popup Script
// Handles toggle state and clipboard history display

document.addEventListener('DOMContentLoaded', () => {
    const enabledToggle = document.getElementById('enabled-toggle');
    const statusText = document.getElementById('status-text');
    const swapModeToggle = document.getElementById('swap-mode-toggle');
    const swapModeStatus = document.getElementById('swap-mode-status');
    const historyList = document.getElementById('history-list');
    const clearHistoryBtn = document.getElementById('clear-history');

    // Load current state
    chrome.runtime.sendMessage({ type: 'GET_STATE' }, (response) => {
        if (response) {
            enabledToggle.checked = response.enabled;
            updateStatusText(response.enabled);
            swapModeToggle.checked = response.swapModeEnabled || false;
            updateSwapModeStatus(response.swapModeEnabled || false);
            renderHistory(response.clipboardHistory || []);
        }
    });

    // Handle extension toggle change
    enabledToggle.addEventListener('change', () => {
        const enabled = enabledToggle.checked;
        chrome.runtime.sendMessage({ type: 'SET_ENABLED', enabled }, () => {
            updateStatusText(enabled);
        });
    });

    // Handle swap mode toggle change
    swapModeToggle.addEventListener('change', () => {
        const swapModeEnabled = swapModeToggle.checked;
        chrome.runtime.sendMessage({ type: 'SET_SWAP_MODE', swapModeEnabled }, () => {
            updateSwapModeStatus(swapModeEnabled);
        });
    });

    // Handle clear history
    clearHistoryBtn.addEventListener('click', () => {
        chrome.runtime.sendMessage({ type: 'CLEAR_HISTORY' }, () => {
            renderHistory([]);
        });
    });

    // Update extension status text
    function updateStatusText(enabled) {
        statusText.textContent = enabled ? 'Enabled' : 'Disabled';
        statusText.classList.toggle('disabled', !enabled);
    }

    // Update swap mode status text
    function updateSwapModeStatus(enabled) {
        swapModeStatus.textContent = enabled ? 'On' : 'Off';
        swapModeStatus.classList.toggle('active', enabled);
    }

    // Render clipboard history
    function renderHistory(history) {
        historyList.innerHTML = '';

        if (!history || history.length === 0) {
            historyList.innerHTML = '<li class="history-empty">No swapped text yet</li>';
            return;
        }

        history.forEach((item, index) => {
            const li = document.createElement('li');
            li.className = 'history-item';
            li.innerHTML = `
        <div class="history-item-text">${escapeHtml(truncateText(item.text, 100))}</div>
        <div class="history-item-time">${formatTime(item.timestamp)}</div>
      `;

            // Click to copy
            li.addEventListener('click', async () => {
                try {
                    await navigator.clipboard.writeText(item.text);
                    li.style.background = 'rgba(34, 197, 94, 0.2)';
                    setTimeout(() => {
                        li.style.background = '';
                    }, 500);
                } catch (err) {
                    console.error('Failed to copy:', err);
                }
            });

            historyList.appendChild(li);
        });
    }

    // Helper: Escape HTML
    function escapeHtml(text) {
        const div = document.createElement('div');
        div.textContent = text;
        return div.innerHTML;
    }

    // Helper: Truncate text
    function truncateText(text, maxLength) {
        if (text.length <= maxLength) return text;
        return text.substring(0, maxLength - 3) + '...';
    }

    // Helper: Format timestamp
    function formatTime(timestamp) {
        const date = new Date(timestamp);
        const now = new Date();
        const diff = now - date;

        if (diff < 60000) {
            return 'Just now';
        } else if (diff < 3600000) {
            const mins = Math.floor(diff / 60000);
            return `${mins} min${mins > 1 ? 's' : ''} ago`;
        } else if (diff < 86400000) {
            const hours = Math.floor(diff / 3600000);
            return `${hours} hour${hours > 1 ? 's' : ''} ago`;
        } else {
            return date.toLocaleDateString();
        }
    }
});
