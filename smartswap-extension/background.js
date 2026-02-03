// SmartSwap Background Service Worker
// Handles extension state and messaging between popup and content scripts

// Default extension state
const DEFAULT_STATE = {
    enabled: true,
    swapModeEnabled: false,
    clipboardHistory: []
};

// Initialize extension state on install
chrome.runtime.onInstalled.addListener(() => {
    chrome.storage.local.set(DEFAULT_STATE);
    console.log('SmartSwap extension installed');
});

// Listen for messages from content scripts and popup
chrome.runtime.onMessage.addListener((message, sender, sendResponse) => {
    switch (message.type) {
        case 'GET_STATE':
            chrome.storage.local.get(['enabled', 'swapModeEnabled', 'clipboardHistory'], (result) => {
                sendResponse({
                    enabled: result.enabled ?? true,
                    swapModeEnabled: result.swapModeEnabled ?? false,
                    clipboardHistory: result.clipboardHistory ?? []
                });
            });
            return true; // Keep channel open for async response

        case 'SET_ENABLED':
            chrome.storage.local.set({ enabled: message.enabled }, () => {
                // Notify all tabs about the state change
                chrome.tabs.query({ url: 'https://docs.google.com/*' }, (tabs) => {
                    tabs.forEach(tab => {
                        chrome.tabs.sendMessage(tab.id, {
                            type: 'STATE_CHANGED',
                            enabled: message.enabled
                        }).catch(() => { }); // Ignore errors for inactive tabs
                    });
                });
                sendResponse({ success: true });
            });
            return true;

        case 'SET_SWAP_MODE':
            chrome.storage.local.set({ swapModeEnabled: message.swapModeEnabled }, () => {
                // Notify all tabs about the swap mode change
                chrome.tabs.query({ url: 'https://docs.google.com/*' }, (tabs) => {
                    tabs.forEach(tab => {
                        chrome.tabs.sendMessage(tab.id, {
                            type: 'SWAP_MODE_CHANGED',
                            swapModeEnabled: message.swapModeEnabled
                        }).catch(() => { });
                    });
                });
                sendResponse({ success: true });
            });
            return true;

        case 'ADD_TO_HISTORY':
            chrome.storage.local.get(['clipboardHistory'], (result) => {
                const history = result.clipboardHistory ?? [];
                // Add new item to front, keep only last 3
                history.unshift({
                    text: message.text,
                    timestamp: Date.now()
                });
                const trimmedHistory = history.slice(0, 3);
                chrome.storage.local.set({ clipboardHistory: trimmedHistory }, () => {
                    sendResponse({ success: true, history: trimmedHistory });
                });
            });
            return true;

        case 'GET_HISTORY':
            chrome.storage.local.get(['clipboardHistory'], (result) => {
                sendResponse({ history: result.clipboardHistory ?? [] });
            });
            return true;

        case 'CLEAR_HISTORY':
            chrome.storage.local.set({ clipboardHistory: [] }, () => {
                sendResponse({ success: true });
            });
            return true;
    }
});

