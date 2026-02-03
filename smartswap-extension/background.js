// Background Service Worker for SmartSwap Extension
// Manages extension state and handles installation

// Default settings
const DEFAULT_SETTINGS = {
    enabled: true,
    swapMode: false
};

// Initialize extension on install
chrome.runtime.onInstalled.addListener((details) => {
    console.log('[SmartSwap] Extension installed:', details.reason);

    if (details.reason === 'install') {
        // Set default settings on first install
        chrome.storage.sync.set({
            smartswap_settings: DEFAULT_SETTINGS
        });
        console.log('[SmartSwap] Default settings initialized');
    } else if (details.reason === 'update') {
        console.log('[SmartSwap] Extension updated to version', chrome.runtime.getManifest().version);
    }
});

// Handle messages from content scripts and popup
chrome.runtime.onMessage.addListener((message, sender, sendResponse) => {
    console.log('[SmartSwap Background] Message received:', message);

    if (message.action === 'getSettings') {
        chrome.storage.sync.get('smartswap_settings', (result) => {
            sendResponse(result.smartswap_settings || DEFAULT_SETTINGS);
        });
        return true; // Keep channel open for async response
    }

    if (message.action === 'saveSettings') {
        chrome.storage.sync.set({
            smartswap_settings: message.settings
        }, () => {
            console.log('[SmartSwap Background] Settings saved:', message.settings);
            sendResponse({ success: true });
        });
        return true;
    }

    if (message.action === 'toggleEnabled') {
        chrome.storage.sync.get('smartswap_settings', (result) => {
            const settings = result.smartswap_settings || DEFAULT_SETTINGS;
            settings.enabled = message.enabled;

            chrome.storage.sync.set({
                smartswap_settings: settings
            }, () => {
                console.log('[SmartSwap Background] Enabled state changed:', settings.enabled);

                // Notify all Google Docs tabs
                chrome.tabs.query({ url: 'https://docs.google.com/document/*' }, (tabs) => {
                    tabs.forEach(tab => {
                        chrome.tabs.sendMessage(tab.id, {
                            action: 'toggleEnabled',
                            enabled: settings.enabled
                        });
                    });
                });

                sendResponse({ success: true, enabled: settings.enabled });
            });
        });
        return true;
    }
});

console.log('[SmartSwap] Background service worker initialized');
