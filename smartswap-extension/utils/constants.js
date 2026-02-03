// Constants for SmartSwap Extension

const SMARTSWAP_CONSTANTS = {
  // Performance requirements
  MAX_LATENCY_MS: 100,
  
  // Storage keys
  STORAGE_KEYS: {
    ENABLED: 'smartswap_enabled',
    SWAP_MODE: 'smartswap_swap_mode',
    SETTINGS: 'smartswap_settings'
  },
  
  // Google Docs specific selectors and identifiers
  GOOGLE_DOCS: {
    // Google Docs uses a canvas-based editor with class 'kix-appview-editor'
    EDITOR_CONTAINER: '.kix-appview-editor',
    CANVAS_CONTAINER: '.kix-canvas-tile-content',
    CURSOR_CLASS: 'kix-cursor',
    SELECTION_OVERLAY: 'kix-selection-overlay',
    
    // The actual editable area
    EDITABLE_AREA: '[contenteditable="true"]',
    
    // Google Docs app container
    APP_CONTAINER: '.kix-appview-editor-container'
  },
  
  // Keyboard shortcuts
  HOTKEYS: {
    PASTE: ['v', 'V'], // Ctrl/Cmd + V
    CUT: ['x', 'X'],   // Ctrl/Cmd + X
    COPY: ['c', 'C'],  // Ctrl/Cmd + C
    QUICK_SWAP: 'x'    // Alt + X (for Phase 2)
  },
  
  // Event names for internal communication
  EVENTS: {
    EXCHANGE_PASTE_START: 'smartswap:exchange_paste_start',
    EXCHANGE_PASTE_COMPLETE: 'smartswap:exchange_paste_complete',
    CLIPBOARD_UPDATED: 'smartswap:clipboard_updated',
    ERROR: 'smartswap:error'
  },
  
  // Debug mode
  DEBUG: true,
  
  // Feature flags
  FEATURES: {
    EXCHANGE_PASTE: true,
    DRAG_SWAP: false,      // Phase 2
    QUICK_SWAP: false,     // Phase 2
    HISTORY_BUFFER: false  // Phase 2
  }
};

// Make constants available globally
if (typeof window !== 'undefined') {
  window.SMARTSWAP_CONSTANTS = SMARTSWAP_CONSTANTS;
}
