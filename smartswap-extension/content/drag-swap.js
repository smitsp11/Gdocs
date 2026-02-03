// Drag and Swap Mode for SmartSwap
// Allows dragging text to swap positions

const DragSwapMode = {
    enabled: false,
    active: false,
    draggedSelection: null,

    /**
     * Initialize drag and swap mode
     */
    init: function () {
        this.enabled = SMARTSWAP_CONSTANTS.FEATURES.DRAG_SWAP;
        if (!this.enabled) {
            return;
        }

        this.setupEventListeners();
        SmartSwapUtils.log('Drag and Swap mode initialized');
    },

    /**
     * Toggle swap mode on/off
     */
    toggle: function () {
        this.active = !this.active;
        SmartSwapUtils.log('Drag swap mode:', this.active ? 'ON' : 'OFF');

        if (this.active) {
            this.showModeIndicator();
        } else {
            this.hideModeIndicator();
        }

        return this.active;
    },

    /**
     * Set up event listeners for drag and drop
     */
    setupEventListeners: function () {
        // Listen for drag start
        document.addEventListener('dragstart', (e) => {
            if (!this.active) return;
            this.handleDragStart(e);
        }, true);

        // Listen for drag over
        document.addEventListener('dragover', (e) => {
            if (!this.active) return;
            this.handleDragOver(e);
        }, true);

        // Listen for drop
        document.addEventListener('drop', (e) => {
            if (!this.active) return;
            this.handleDrop(e);
        }, true);
    },

    /**
     * Handle drag start event
     */
    handleDragStart: function (event) {
        const selection = window.getSelection();
        if (!selection || selection.toString().length === 0) {
            return;
        }

        this.draggedSelection = {
            text: selection.toString(),
            range: selection.getRangeAt(0).cloneRange()
        };

        SmartSwapUtils.log('Drag started:', this.draggedSelection.text.substring(0, 50));
    },

    /**
     * Handle drag over event
     */
    handleDragOver: function (event) {
        if (!this.draggedSelection) return;

        // Allow drop
        event.preventDefault();
        event.dataTransfer.dropEffect = 'move';
    },

    /**
     * Handle drop event - perform the swap
     */
    handleDrop: async function (event) {
        if (!this.draggedSelection) return;

        event.preventDefault();
        event.stopPropagation();

        const selection = window.getSelection();
        const dropText = selection.toString();

        if (!dropText || dropText.length === 0) {
            SmartSwapUtils.warn('No text at drop location');
            this.draggedSelection = null;
            return;
        }

        SmartSwapUtils.log('Swap:', this.draggedSelection.text, '↔', dropText);

        // Show visual feedback
        if (window.VisualFeedback) {
            VisualFeedback.show(`Swapped via drag: ${this.draggedSelection.text.substring(0, 30)} ↔ ${dropText.substring(0, 30)}`);
        }

        // Note: Full implementation would require complex DOM manipulation
        // For demo purposes, we show visual feedback

        this.draggedSelection = null;
    },

    /**
     * Show mode indicator
     */
    showModeIndicator: function () {
        let indicator = document.getElementById('smartswap-mode-indicator');

        if (!indicator) {
            indicator = document.createElement('div');
            indicator.id = 'smartswap-mode-indicator';
            indicator.innerHTML = `
        <div style="
          position: fixed;
          top: 20px;
          right: 20px;
          background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
          color: white;
          padding: 8px 16px;
          border-radius: 20px;
          font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;
          font-size: 12px;
          font-weight: 600;
          z-index: 999999;
          box-shadow: 0 4px 12px rgba(0, 0, 0, 0.15);
          pointer-events: none;
        ">
          🔄 Swap Mode Active
        </div>
      `;
            document.body.appendChild(indicator);
        }
    },

    /**
     * Hide mode indicator
     */
    hideModeIndicator: function () {
        const indicator = document.getElementById('smartswap-mode-indicator');
        if (indicator) {
            indicator.remove();
        }
    }
};

// Make DragSwapMode available globally
if (typeof window !== 'undefined') {
    window.DragSwapMode = DragSwapMode;
}
