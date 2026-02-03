// Utility functions for SmartSwap Extension

const SmartSwapUtils = {
    /**
     * Debug logger that only logs when DEBUG is enabled
     */
    log: function (...args) {
        if (SMARTSWAP_CONSTANTS.DEBUG) {
            console.log('[SmartSwap]', ...args);
        }
    },

    /**
     * Error logger
     */
    error: function (...args) {
        console.error('[SmartSwap Error]', ...args);
    },

    /**
     * Warn logger
     */
    warn: function (...args) {
        console.warn('[SmartSwap Warning]', ...args);
    },

    /**
     * Check if we're on a Google Docs page
     */
    isGoogleDocsPage: function () {
        return window.location.hostname === 'docs.google.com' &&
            window.location.pathname.includes('/document/');
    },

    /**
     * Wait for an element to appear in the DOM
     */
    waitForElement: function (selector, timeout = 10000) {
        return new Promise((resolve, reject) => {
            const startTime = Date.now();

            const checkElement = () => {
                const element = document.querySelector(selector);
                if (element) {
                    resolve(element);
                    return;
                }

                if (Date.now() - startTime > timeout) {
                    reject(new Error(`Element ${selector} not found within ${timeout}ms`));
                    return;
                }

                requestAnimationFrame(checkElement);
            };

            checkElement();
        });
    },

    /**
     * Performance timer
     */
    startTimer: function (label) {
        const start = performance.now();
        return {
            end: function () {
                const duration = performance.now() - start;
                SmartSwapUtils.log(`⏱️ ${label}: ${duration.toFixed(2)}ms`);

                if (duration > SMARTSWAP_CONSTANTS.MAX_LATENCY_MS) {
                    SmartSwapUtils.warn(`Performance warning: ${label} took ${duration.toFixed(2)}ms (threshold: ${SMARTSWAP_CONSTANTS.MAX_LATENCY_MS}ms)`);
                }

                return duration;
            }
        };
    },

    /**
     * Debounce function
     */
    debounce: function (func, wait) {
        let timeout;
        return function executedFunction(...args) {
            const later = () => {
                clearTimeout(timeout);
                func(...args);
            };
            clearTimeout(timeout);
            timeout = setTimeout(later, wait);
        };
    },

    /**
     * Get extension settings from storage
     */
    getSettings: async function () {
        try {
            const result = await chrome.storage.sync.get(SMARTSWAP_CONSTANTS.STORAGE_KEYS.SETTINGS);
            return result[SMARTSWAP_CONSTANTS.STORAGE_KEYS.SETTINGS] || {
                enabled: true,
                swapMode: false
            };
        } catch (error) {
            SmartSwapUtils.error('Failed to get settings:', error);
            return { enabled: true, swapMode: false };
        }
    },

    /**
     * Save extension settings to storage
     */
    saveSettings: async function (settings) {
        try {
            await chrome.storage.sync.set({
                [SMARTSWAP_CONSTANTS.STORAGE_KEYS.SETTINGS]: settings
            });
            SmartSwapUtils.log('Settings saved:', settings);
        } catch (error) {
            SmartSwapUtils.error('Failed to save settings:', error);
        }
    },

    /**
     * Check if extension is enabled
     */
    isEnabled: async function () {
        const settings = await SmartSwapUtils.getSettings();
        return settings.enabled;
    }
};

// Make utils available globally
if (typeof window !== 'undefined') {
    window.SmartSwapUtils = SmartSwapUtils;
}
