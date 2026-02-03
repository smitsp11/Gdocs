// Visual Feedback Widget for SmartSwap
// Shows what text was swapped out with a floating widget

const VisualFeedback = {
    widget: null,
    hideTimeout: null,

    /**
     * Initialize the feedback widget
     */
    init: function () {
        if (this.widget) {
            return; // Already initialized
        }

        // Create the widget element
        this.widget = document.createElement('div');
        this.widget.id = 'smartswap-feedback-widget';
        this.widget.className = 'smartswap-widget';

        // Add styles
        this.injectStyles();

        SmartSwapUtils.log('Visual feedback widget initialized');
    },

    /**
     * Inject CSS styles for the widget
     */
    injectStyles: function () {
        if (document.getElementById('smartswap-widget-styles')) {
            return; // Styles already injected
        }

        const style = document.createElement('style');
        style.id = 'smartswap-widget-styles';
        style.textContent = `
      .smartswap-widget {
        position: fixed;
        bottom: 20px;
        right: 20px;
        background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
        color: white;
        padding: 12px 16px;
        border-radius: 8px;
        box-shadow: 0 4px 12px rgba(0, 0, 0, 0.15);
        font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;
        font-size: 13px;
        z-index: 999999;
        max-width: 300px;
        opacity: 0;
        transform: translateY(10px);
        transition: opacity 0.3s ease, transform 0.3s ease;
        pointer-events: none;
      }
      
      .smartswap-widget.show {
        opacity: 1;
        transform: translateY(0);
      }
      
      .smartswap-widget-header {
        font-weight: 600;
        margin-bottom: 6px;
        font-size: 11px;
        text-transform: uppercase;
        letter-spacing: 0.5px;
        opacity: 0.9;
      }
      
      .smartswap-widget-content {
        font-weight: 400;
        line-height: 1.4;
        word-wrap: break-word;
        max-height: 60px;
        overflow: hidden;
        text-overflow: ellipsis;
      }
      
      .smartswap-widget-icon {
        display: inline-block;
        margin-right: 6px;
      }
    `;

        document.head.appendChild(style);
    },

    /**
     * Show the feedback widget with swapped text
     */
    show: function (swappedText, duration = 3000) {
        this.init();

        // Clear any existing timeout
        if (this.hideTimeout) {
            clearTimeout(this.hideTimeout);
        }

        // Truncate text if too long
        const displayText = swappedText.length > 100
            ? swappedText.substring(0, 100) + '...'
            : swappedText;

        // Update widget content
        this.widget.innerHTML = `
      <div class="smartswap-widget-header">
        <span class="smartswap-widget-icon">↻</span>
        Swapped to Clipboard
      </div>
      <div class="smartswap-widget-content">${this.escapeHtml(displayText)}</div>
    `;

        // Add to document if not already there
        if (!this.widget.parentNode) {
            document.body.appendChild(this.widget);
        }

        // Show with animation
        setTimeout(() => {
            this.widget.classList.add('show');
        }, 10);

        // Hide after duration
        this.hideTimeout = setTimeout(() => {
            this.hide();
        }, duration);

        SmartSwapUtils.log('Visual feedback shown:', displayText);
    },

    /**
     * Hide the feedback widget
     */
    hide: function () {
        if (this.widget) {
            this.widget.classList.remove('show');
        }
    },

    /**
     * Escape HTML to prevent XSS
     */
    escapeHtml: function (text) {
        const div = document.createElement('div');
        div.textContent = text;
        return div.innerHTML;
    },

    /**
     * Clean up the widget
     */
    destroy: function () {
        if (this.hideTimeout) {
            clearTimeout(this.hideTimeout);
        }
        if (this.widget && this.widget.parentNode) {
            this.widget.parentNode.removeChild(this.widget);
        }
        this.widget = null;
    }
};

// Make VisualFeedback available globally
if (typeof window !== 'undefined') {
    window.VisualFeedback = VisualFeedback;
}
