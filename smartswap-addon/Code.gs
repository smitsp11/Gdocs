/**
 * SmartSwap - Google Workspace Add-on for Google Docs
 * Core Feature: Exchange Paste - replaces text while capturing replaced content
 */

// ============================================
// MENU & SIDEBAR
// ============================================

/**
 * Runs when the document is opened.
 * Creates custom menu.
 */
function onOpen(e) {
  DocumentApp.getUi()
    .createAddonMenu()
    .addItem('Open SmartSwap', 'showSidebar')
    .addSeparator()
    .addItem('Exchange Paste', 'exchangePasteFromMenu')
    .addToUi();
}

/**
 * Runs when the add-on is installed.
 */
function onInstall(e) {
  onOpen(e);
}

/**
 * Homepage trigger for add-on card.
 */
function onHomepage(e) {
  return createHomepageCard();
}

/**
 * Creates the homepage card for the add-on.
 */
function createHomepageCard() {
  const card = CardService.newCardBuilder()
    .setHeader(CardService.newCardHeader()
      .setTitle('SmartSwap')
      .setSubtitle('Smart clipboard for Google Docs'))
    .addSection(CardService.newCardSection()
      .addWidget(CardService.newTextParagraph()
        .setText('Exchange Paste: Replace text without losing what was there.'))
      .addWidget(CardService.newTextButton()
        .setText('Open Sidebar')
        .setOnClickAction(CardService.newAction().setFunctionName('showSidebar'))))
    .build();
  
  return card;
}

/**
 * Shows the sidebar.
 */
function showSidebar() {
  const html = HtmlService.createHtmlOutputFromFile('Sidebar')
    .setTitle('SmartSwap')
    .setWidth(300);
  DocumentApp.getUi().showSidebar(html);
}

// ============================================
// CORE FUNCTIONALITY
// ============================================

/**
 * Gets the currently selected text in the document.
 * @returns {Object} Selection info including text and element reference
 */
function getSelectedText() {
  const selection = DocumentApp.getActiveDocument().getSelection();
  
  if (!selection) {
    return { success: false, error: 'No text selected', text: '' };
  }
  
  const elements = selection.getRangeElements();
  let selectedText = '';
  
  for (let i = 0; i < elements.length; i++) {
    const element = elements[i];
    if (element.getElement().editAsText) {
      const text = element.getElement().editAsText();
      
      if (element.isPartial()) {
        selectedText += text.getText().substring(
          element.getStartOffset(),
          element.getEndOffsetInclusive() + 1
        );
      } else {
        selectedText += text.getText();
      }
    }
  }
  
  return { 
    success: true, 
    text: selectedText.trim(),
    hasSelection: selectedText.length > 0
  };
}

/**
 * Performs the Exchange Paste operation.
 * Replaces selected text with new text, returns the replaced text.
 * @param {string} newText - Text to paste
 * @returns {Object} Result with captured (replaced) text
 */
function exchangePaste(newText) {
  const doc = DocumentApp.getActiveDocument();
  const selection = doc.getSelection();
  
  if (!selection) {
    return { 
      success: false, 
      error: 'No text selected. Please select text to replace.',
      capturedText: ''
    };
  }
  
  const elements = selection.getRangeElements();
  let capturedText = '';
  
  // First pass: capture all selected text
  for (let i = 0; i < elements.length; i++) {
    const element = elements[i];
    if (element.getElement().editAsText) {
      const text = element.getElement().editAsText();
      
      if (element.isPartial()) {
        capturedText += text.getText().substring(
          element.getStartOffset(),
          element.getEndOffsetInclusive() + 1
        );
      } else {
        capturedText += text.getText();
      }
    }
  }
  
  // Second pass: replace with new text
  // We replace from last to first to preserve offsets
  for (let i = elements.length - 1; i >= 0; i--) {
    const element = elements[i];
    if (element.getElement().editAsText) {
      const text = element.getElement().editAsText();
      
      if (element.isPartial()) {
        const start = element.getStartOffset();
        const end = element.getEndOffsetInclusive();
        
        // Only insert new text on the first element
        if (i === 0) {
          text.deleteText(start, end);
          text.insertText(start, newText);
        } else {
          text.deleteText(start, end);
        }
      } else {
        if (i === 0) {
          text.setText(newText);
        } else {
          text.setText('');
        }
      }
    }
  }
  
  return {
    success: true,
    capturedText: capturedText.trim(),
    message: `Replaced "${capturedText.substring(0, 30)}${capturedText.length > 30 ? '...' : ''}" with "${newText.substring(0, 30)}${newText.length > 30 ? '...' : ''}"`
  };
}

/**
 * Quick action from menu - exchanges with last copied text.
 */
function exchangePasteFromMenu() {
  const ui = DocumentApp.getUi();
  
  // Get selected text first
  const selectionResult = getSelectedText();
  if (!selectionResult.success || !selectionResult.hasSelection) {
    ui.alert('SmartSwap', 'Please select some text first.', ui.ButtonSet.OK);
    return;
  }
  
  // Prompt for text to paste
  const response = ui.prompt(
    'SmartSwap - Exchange Paste',
    'Enter text to paste (will replace selection):',
    ui.ButtonSet.OK_CANCEL
  );
  
  if (response.getSelectedButton() === ui.Button.OK) {
    const newText = response.getResponseText();
    const result = exchangePaste(newText);
    
    if (result.success) {
      ui.alert(
        'SmartSwap',
        `Done! Captured text: "${result.capturedText}"\n\nOpen the sidebar to access it.`,
        ui.ButtonSet.OK
      );
    } else {
      ui.alert('SmartSwap', result.error, ui.ButtonSet.OK);
    }
  }
}

// ============================================
// HISTORY MANAGEMENT
// ============================================

/**
 * Gets the exchange history from user properties.
 * @returns {Array} Array of captured text items
 */
function getHistory() {
  const props = PropertiesService.getUserProperties();
  const historyJson = props.getProperty('exchangeHistory');
  
  if (historyJson) {
    try {
      return JSON.parse(historyJson);
    } catch (e) {
      return [];
    }
  }
  return [];
}

/**
 * Adds an item to history.
 * @param {string} text - Text to add to history
 */
function addToHistory(text) {
  if (!text || text.trim() === '') return;
  
  const props = PropertiesService.getUserProperties();
  let history = getHistory();
  
  // Add to front, remove duplicates
  history = history.filter(item => item.text !== text);
  history.unshift({
    text: text,
    timestamp: new Date().toISOString()
  });
  
  // Keep only last 5 items
  history = history.slice(0, 5);
  
  props.setProperty('exchangeHistory', JSON.stringify(history));
}

/**
 * Clears all history.
 */
function clearHistory() {
  const props = PropertiesService.getUserProperties();
  props.deleteProperty('exchangeHistory');
  return { success: true };
}

// ============================================
// SMART BUFFER - MULTI-SLOT CLIPBOARD
// ============================================

const MAX_SLOTS = 5;

/**
 * Gets all clipboard slots.
 * @returns {Array} Array of slot objects with text and label
 */
function getSlots() {
  const props = PropertiesService.getUserProperties();
  const slotsJson = props.getProperty('clipboardSlots');
  
  if (slotsJson) {
    try {
      return JSON.parse(slotsJson);
    } catch (e) {
      return initializeEmptySlots();
    }
  }
  return initializeEmptySlots();
}

/**
 * Initializes empty slots array.
 * @returns {Array} Array of 5 empty slot objects
 */
function initializeEmptySlots() {
  const slots = [];
  for (let i = 0; i < MAX_SLOTS; i++) {
    slots.push({
      index: i,
      text: '',
      label: 'Slot ' + (i + 1),
      timestamp: null
    });
  }
  return slots;
}

/**
 * Saves text to a specific slot.
 * @param {number} index - Slot index (0-4)
 * @param {string} text - Text to save
 * @param {string} label - Optional custom label
 * @returns {Object} Result with success status
 */
function saveToSlot(index, text, label) {
  if (index < 0 || index >= MAX_SLOTS) {
    return { success: false, error: 'Invalid slot index' };
  }
  
  const props = PropertiesService.getUserProperties();
  const slots = getSlots();
  
  slots[index] = {
    index: index,
    text: text || '',
    label: label || slots[index].label || 'Slot ' + (index + 1),
    timestamp: new Date().toISOString()
  };
  
  props.setProperty('clipboardSlots', JSON.stringify(slots));
  return { success: true, slot: slots[index] };
}

/**
 * Collects selected text to a specific slot.
 * @param {number} index - Slot index (0-4)
 * @returns {Object} Result with captured text
 */
function collectToSlot(index) {
  const selection = getSelectedText();
  
  if (!selection.success || !selection.hasSelection) {
    return { success: false, error: 'No text selected' };
  }
  
  const result = saveToSlot(index, selection.text);
  if (result.success) {
    return { 
      success: true, 
      text: selection.text,
      message: `Saved to Slot ${index + 1}`
    };
  }
  return result;
}

/**
 * Pastes text from a slot at the current cursor position.
 * @param {number} index - Slot index (0-4)
 * @returns {Object} Result with success status
 */
function pasteFromSlot(index) {
  if (index < 0 || index >= MAX_SLOTS) {
    return { success: false, error: 'Invalid slot index' };
  }
  
  const slots = getSlots();
  const slot = slots[index];
  
  if (!slot.text) {
    return { success: false, error: 'Slot is empty' };
  }
  
  const doc = DocumentApp.getActiveDocument();
  const selection = doc.getSelection();
  
  if (selection) {
    // Replace selected text
    const elements = selection.getRangeElements();
    for (let i = elements.length - 1; i >= 0; i--) {
      const element = elements[i];
      if (element.getElement().editAsText) {
        const text = element.getElement().editAsText();
        if (element.isPartial()) {
          const start = element.getStartOffset();
          const end = element.getEndOffsetInclusive();
          if (i === 0) {
            text.deleteText(start, end);
            text.insertText(start, slot.text);
          } else {
            text.deleteText(start, end);
          }
        } else {
          if (i === 0) {
            text.setText(slot.text);
          } else {
            text.setText('');
          }
        }
      }
    }
  } else {
    // Insert at cursor
    const cursor = doc.getCursor();
    if (cursor) {
      const element = cursor.getElement();
      const offset = cursor.getOffset();
      if (element.editAsText) {
        element.editAsText().insertText(offset, slot.text);
      } else {
        return { success: false, error: 'Cannot insert at this position' };
      }
    } else {
      return { success: false, error: 'No cursor position found. Click in the document first.' };
    }
  }
  
  return { 
    success: true, 
    text: slot.text,
    message: `Pasted from Slot ${index + 1}`
  };
}

/**
 * Clears a specific slot.
 * @param {number} index - Slot index (0-4)
 * @returns {Object} Result with success status
 */
function clearSlot(index) {
  if (index < 0 || index >= MAX_SLOTS) {
    return { success: false, error: 'Invalid slot index' };
  }
  
  const props = PropertiesService.getUserProperties();
  const slots = getSlots();
  
  slots[index] = {
    index: index,
    text: '',
    label: 'Slot ' + (index + 1),
    timestamp: null
  };
  
  props.setProperty('clipboardSlots', JSON.stringify(slots));
  return { success: true };
}

/**
 * Clears all slots.
 * @returns {Object} Result with success status
 */
function clearAllSlots() {
  const props = PropertiesService.getUserProperties();
  props.deleteProperty('clipboardSlots');
  return { success: true };
}

/**
 * Updates a slot's label.
 * @param {number} index - Slot index (0-4)
 * @param {string} label - New label
 * @returns {Object} Result with success status
 */
function updateSlotLabel(index, label) {
  if (index < 0 || index >= MAX_SLOTS) {
    return { success: false, error: 'Invalid slot index' };
  }
  
  const props = PropertiesService.getUserProperties();
  const slots = getSlots();
  
  slots[index].label = label || 'Slot ' + (index + 1);
  
  props.setProperty('clipboardSlots', JSON.stringify(slots));
  return { success: true, slot: slots[index] };
}

