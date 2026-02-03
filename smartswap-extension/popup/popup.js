// Popup script for SmartSwap Extension

document.addEventListener('DOMContentLoaded', async () => {
    const enableToggle = document.getElementById('enableToggle');
    const statusDot = document.getElementById('statusDot');
    const statusText = document.getElementById('statusText');

    /**
     * Update the status indicator
     */
    function updateStatus(enabled) {
        if (enabled) {
            statusDot.classList.add('active');
            statusText.textContent = 'Active';
        } else {
            statusDot.classList.remove('active');
            statusText.textContent = 'Disabled';
        }
    }

    /**
     * Load current settings
     */
    async function loadSettings() {
        try {
            const response = await chrome.runtime.sendMessage({ action: 'getSettings' });
            const settings = response || { enabled: true };

            enableToggle.checked = settings.enabled;
            updateStatus(settings.enabled);
        } catch (error) {
            console.error('Failed to load settings:', error);
            // Default to enabled
            enableToggle.checked = true;
            updateStatus(true);
        }
    }

    /**
     * Save settings
     */
    async function saveSettings(settings) {
        try {
            await chrome.runtime.sendMessage({
                action: 'saveSettings',
                settings: settings
            });
        } catch (error) {
            console.error('Failed to save settings:', error);
        }
    }

    /**
     * Handle toggle change
     */
    enableToggle.addEventListener('change', async (event) => {
        const enabled = event.target.checked;

        // Update status immediately for better UX
        updateStatus(enabled);

        // Save settings
        await saveSettings({ enabled });

        // Notify background script
        try {
            await chrome.runtime.sendMessage({
                action: 'toggleEnabled',
                enabled: enabled
            });
        } catch (error) {
            console.error('Failed to toggle extension:', error);
        }
    });

    // Load settings on popup open
    await loadSettings();
});
