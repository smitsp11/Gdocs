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
// STYLE-AWARE SWAPPING
// ============================================

/**
 * Gets the current swap mode preference.
 * @returns {string} 'content' or 'everything'
 */
function getSwapMode() {
  const props = PropertiesService.getUserProperties();
  return props.getProperty('swapMode') || 'everything';
}

/**
 * Sets the swap mode preference.
 * @param {string} mode - 'content' or 'everything'
 * @returns {Object} Result with success status
 */
function setSwapMode(mode) {
  if (mode !== 'content' && mode !== 'everything') {
    return { success: false, error: 'Invalid mode. Use "content" or "everything".' };
  }
  const props = PropertiesService.getUserProperties();
  props.setProperty('swapMode', mode);
  return { success: true, mode: mode };
}

/**
 * Gets selected text along with its formatting attributes.
 * @returns {Object} Selection info including text, attributes array, and success status
 */
function getSelectedTextWithAttributes() {
  const selection = DocumentApp.getActiveDocument().getSelection();
  
  if (!selection) {
    return { success: false, error: 'No text selected', text: '', attributes: [] };
  }
  
  const elements = selection.getRangeElements();
  let selectedText = '';
  let allAttributes = [];
  
  for (let i = 0; i < elements.length; i++) {
    const element = elements[i];
    if (element.getElement().editAsText) {
      const textElement = element.getElement().editAsText();
      
      if (element.isPartial()) {
        const start = element.getStartOffset();
        const end = element.getEndOffsetInclusive();
        
        // Get text
        const partialText = textElement.getText().substring(start, end + 1);
        selectedText += partialText;
        
        // Get attributes for each character position
        for (let j = start; j <= end; j++) {
          allAttributes.push(extractAttributes(textElement, j));
        }
      } else {
        const fullText = textElement.getText();
        selectedText += fullText;
        
        // Get attributes for each character
        for (let j = 0; j < fullText.length; j++) {
          allAttributes.push(extractAttributes(textElement, j));
        }
      }
    }
  }
  
  return { 
    success: true, 
    text: selectedText,
    attributes: allAttributes,
    hasSelection: selectedText.length > 0,
    hasFormatting: hasNonDefaultFormatting(allAttributes)
  };
}

/**
 * Extracts formatting attributes at a specific position.
 * @param {Text} textElement - The text element
 * @param {number} offset - Character offset
 * @returns {Object} Formatting attributes
 */
function extractAttributes(textElement, offset) {
  try {
    return {
      bold: textElement.isBold(offset),
      italic: textElement.isItalic(offset),
      underline: textElement.isUnderline(offset),
      strikethrough: textElement.isStrikethrough(offset),
      foregroundColor: textElement.getForegroundColor(offset),
      backgroundColor: textElement.getBackgroundColor(offset),
      fontSize: textElement.getFontSize(offset),
      fontFamily: textElement.getFontFamily(offset),
      linkUrl: textElement.getLinkUrl(offset)
    };
  } catch (e) {
    // Return defaults if attribute extraction fails
    return {
      bold: false,
      italic: false,
      underline: false,
      strikethrough: false,
      foregroundColor: null,
      backgroundColor: null,
      fontSize: null,
      fontFamily: null,
      linkUrl: null
    };
  }
}

/**
 * Checks if any attributes contain non-default formatting.
 * @param {Array} attributes - Array of attribute objects
 * @returns {boolean} True if any formatting is present
 */
function hasNonDefaultFormatting(attributes) {
  if (!attributes || attributes.length === 0) return false;
  
  for (let i = 0; i < attributes.length; i++) {
    const attr = attributes[i];
    if (attr.bold || attr.italic || attr.underline || attr.strikethrough ||
        attr.foregroundColor || attr.backgroundColor || attr.linkUrl) {
      return true;
    }
  }
  return false;
}

/**
 * Applies formatting attributes to text at a specific position.
 * @param {Text} textElement - The text element to format
 * @param {number} startOffset - Starting character offset
 * @param {Array} attributes - Array of attribute objects for each character
 */
function applyAttributes(textElement, startOffset, attributes) {
  if (!attributes || attributes.length === 0) return;
  
  for (let i = 0; i < attributes.length; i++) {
    const attr = attributes[i];
    const offset = startOffset + i;
    
    try {
      if (attr.bold !== null && attr.bold !== undefined) {
        textElement.setBold(offset, offset, attr.bold);
      }
      if (attr.italic !== null && attr.italic !== undefined) {
        textElement.setItalic(offset, offset, attr.italic);
      }
      if (attr.underline !== null && attr.underline !== undefined) {
        textElement.setUnderline(offset, offset, attr.underline);
      }
      if (attr.strikethrough !== null && attr.strikethrough !== undefined) {
        textElement.setStrikethrough(offset, offset, attr.strikethrough);
      }
      if (attr.foregroundColor) {
        textElement.setForegroundColor(offset, offset, attr.foregroundColor);
      }
      if (attr.backgroundColor) {
        textElement.setBackgroundColor(offset, offset, attr.backgroundColor);
      }
      if (attr.fontSize) {
        textElement.setFontSize(offset, offset, attr.fontSize);
      }
      if (attr.fontFamily) {
        textElement.setFontFamily(offset, offset, attr.fontFamily);
      }
      if (attr.linkUrl) {
        textElement.setLinkUrl(offset, offset, attr.linkUrl);
      }
    } catch (e) {
      // Continue applying remaining attributes if one fails
      Logger.log('Error applying attribute at offset ' + offset + ': ' + e.message);
    }
  }
}

/**
 * Style-aware Exchange Paste operation.
 * @param {string} newText - Text to paste
 * @param {Array} newAttributes - Optional attributes for the new text
 * @param {string} mode - 'content' (keep destination style) or 'everything' (apply source style)
 * @returns {Object} Result with captured text and attributes
 */
function exchangePasteStyleAware(newText, newAttributes, mode) {
  const doc = DocumentApp.getActiveDocument();
  const selection = doc.getSelection();
  
  if (!selection) {
    return { 
      success: false, 
      error: 'No text selected. Please select text to replace.',
      capturedText: '',
      capturedAttributes: []
    };
  }
  
  mode = mode || getSwapMode();
  
  const elements = selection.getRangeElements();
  let capturedText = '';
  let capturedAttributes = [];
  let destinationAttributes = [];
  
  // First pass: capture all selected text AND its attributes
  for (let i = 0; i < elements.length; i++) {
    const element = elements[i];
    if (element.getElement().editAsText) {
      const textElement = element.getElement().editAsText();
      
      if (element.isPartial()) {
        const start = element.getStartOffset();
        const end = element.getEndOffsetInclusive();
        
        capturedText += textElement.getText().substring(start, end + 1);
        
        for (let j = start; j <= end; j++) {
          capturedAttributes.push(extractAttributes(textElement, j));
          destinationAttributes.push(extractAttributes(textElement, j));
        }
      } else {
        const fullText = textElement.getText();
        capturedText += fullText;
        
        for (let j = 0; j < fullText.length; j++) {
          capturedAttributes.push(extractAttributes(textElement, j));
          destinationAttributes.push(extractAttributes(textElement, j));
        }
      }
    }
  }
  
  // Second pass: replace with new text (from last to first to preserve offsets)
  for (let i = elements.length - 1; i >= 0; i--) {
    const element = elements[i];
    if (element.getElement().editAsText) {
      const textElement = element.getElement().editAsText();
      
      if (element.isPartial()) {
        const start = element.getStartOffset();
        const end = element.getEndOffsetInclusive();
        
        if (i === 0) {
          textElement.deleteText(start, end);
          textElement.insertText(start, newText);
          
          // Apply formatting based on mode
          if (mode === 'everything' && newAttributes && newAttributes.length > 0) {
            // Apply source attributes (everything mode)
            applyAttributes(textElement, start, newAttributes);
          } else if (mode === 'content' && destinationAttributes.length > 0) {
            // Apply destination attributes stretched/repeated to fit new text length
            const stretchedAttrs = stretchAttributes(destinationAttributes, newText.length);
            applyAttributes(textElement, start, stretchedAttrs);
          }
        } else {
          textElement.deleteText(start, end);
        }
      } else {
        if (i === 0) {
          const originalStart = 0;
          textElement.setText(newText);
          
          if (mode === 'everything' && newAttributes && newAttributes.length > 0) {
            applyAttributes(textElement, 0, newAttributes);
          } else if (mode === 'content' && destinationAttributes.length > 0) {
            const stretchedAttrs = stretchAttributes(destinationAttributes, newText.length);
            applyAttributes(textElement, 0, stretchedAttrs);
          }
        } else {
          textElement.setText('');
        }
      }
    }
  }
  
  return {
    success: true,
    capturedText: capturedText.trim(),
    capturedAttributes: capturedAttributes,
    hasFormatting: hasNonDefaultFormatting(capturedAttributes),
    mode: mode,
    message: `Replaced "${capturedText.substring(0, 30)}${capturedText.length > 30 ? '...' : ''}" (${mode} mode)`
  };
}

/**
 * Stretches or shrinks attribute array to match a new text length.
 * Uses the first attribute for the whole text (simple approach).
 * @param {Array} attributes - Original attributes array
 * @param {number} newLength - Target length
 * @returns {Array} New attributes array of target length
 */
function stretchAttributes(attributes, newLength) {
  if (!attributes || attributes.length === 0 || newLength <= 0) {
    return [];
  }
  
  // Use the first character's formatting for the entire new text
  const baseAttr = attributes[0];
  const result = [];
  
  for (let i = 0; i < newLength; i++) {
    result.push(Object.assign({}, baseAttr));
  }
  
  return result;
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
      attributes: [],
      hasFormatting: false,
      label: 'Slot ' + (i + 1),
      timestamp: null
    });
  }
  return slots;
}

/**
 * Saves text to a specific slot with optional formatting.
 * @param {number} index - Slot index (0-4)
 * @param {string} text - Text to save
 * @param {string} label - Optional custom label
 * @param {Array} attributes - Optional formatting attributes
 * @returns {Object} Result with success status
 */
function saveToSlot(index, text, label, attributes) {
  if (index < 0 || index >= MAX_SLOTS) {
    return { success: false, error: 'Invalid slot index' };
  }
  
  const props = PropertiesService.getUserProperties();
  const slots = getSlots();
  
  slots[index] = {
    index: index,
    text: text || '',
    attributes: attributes || [],
    hasFormatting: hasNonDefaultFormatting(attributes),
    label: label || slots[index].label || 'Slot ' + (index + 1),
    timestamp: new Date().toISOString()
  };
  
  props.setProperty('clipboardSlots', JSON.stringify(slots));
  return { success: true, slot: slots[index] };
}

/**
 * Collects selected text (with formatting) to a specific slot.
 * @param {number} index - Slot index (0-4)
 * @returns {Object} Result with captured text and formatting info
 */
function collectToSlot(index) {
  const selection = getSelectedTextWithAttributes();
  
  if (!selection.success || !selection.hasSelection) {
    return { success: false, error: 'No text selected' };
  }
  
  const result = saveToSlot(index, selection.text, null, selection.attributes);
  if (result.success) {
    return { 
      success: true, 
      text: selection.text,
      hasFormatting: selection.hasFormatting,
      message: `Saved to Slot ${index + 1}${selection.hasFormatting ? ' (with formatting)' : ''}`
    };
  }
  return result;
}

/**
 * Pastes text from a slot at the current cursor position (style-aware).
 * @param {number} index - Slot index (0-4)
 * @param {string} mode - Optional: 'content' or 'everything' (uses user preference if not specified)
 * @returns {Object} Result with success status
 */
function pasteFromSlot(index, mode) {
  if (index < 0 || index >= MAX_SLOTS) {
    return { success: false, error: 'Invalid slot index' };
  }
  
  const slots = getSlots();
  const slot = slots[index];
  
  if (!slot.text) {
    return { success: false, error: 'Slot is empty' };
  }
  
  mode = mode || getSwapMode();
  
  const doc = DocumentApp.getActiveDocument();
  const selection = doc.getSelection();
  
  if (selection) {
    // Replace selected text (style-aware)
    const elements = selection.getRangeElements();
    let destinationAttributes = [];
    
    // Capture destination formatting first
    for (let i = 0; i < elements.length; i++) {
      const element = elements[i];
      if (element.getElement().editAsText) {
        const textElement = element.getElement().editAsText();
        if (element.isPartial()) {
          const start = element.getStartOffset();
          const end = element.getEndOffsetInclusive();
          for (let j = start; j <= end; j++) {
            destinationAttributes.push(extractAttributes(textElement, j));
          }
        } else {
          const fullText = textElement.getText();
          for (let j = 0; j < fullText.length; j++) {
            destinationAttributes.push(extractAttributes(textElement, j));
          }
        }
      }
    }
    
    // Replace text from last to first
    for (let i = elements.length - 1; i >= 0; i--) {
      const element = elements[i];
      if (element.getElement().editAsText) {
        const textElement = element.getElement().editAsText();
        if (element.isPartial()) {
          const start = element.getStartOffset();
          const end = element.getEndOffsetInclusive();
          if (i === 0) {
            textElement.deleteText(start, end);
            textElement.insertText(start, slot.text);
            
            // Apply formatting based on mode
            if (mode === 'everything' && slot.attributes && slot.attributes.length > 0) {
              applyAttributes(textElement, start, slot.attributes);
            } else if (mode === 'content' && destinationAttributes.length > 0) {
              const stretchedAttrs = stretchAttributes(destinationAttributes, slot.text.length);
              applyAttributes(textElement, start, stretchedAttrs);
            }
          } else {
            textElement.deleteText(start, end);
          }
        } else {
          if (i === 0) {
            textElement.setText(slot.text);
            
            if (mode === 'everything' && slot.attributes && slot.attributes.length > 0) {
              applyAttributes(textElement, 0, slot.attributes);
            } else if (mode === 'content' && destinationAttributes.length > 0) {
              const stretchedAttrs = stretchAttributes(destinationAttributes, slot.text.length);
              applyAttributes(textElement, 0, stretchedAttrs);
            }
          } else {
            textElement.setText('');
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
        const textElement = element.editAsText();
        textElement.insertText(offset, slot.text);
        
        // Apply source formatting in 'everything' mode
        if (mode === 'everything' && slot.attributes && slot.attributes.length > 0) {
          applyAttributes(textElement, offset, slot.attributes);
        }
      } else {
        return { success: false, error: 'Cannot insert at this position' };
      }
    } else {
      return { success: false, error: 'No cursor position found. Click in the document first.' };
    }
  }
  
  const modeLabel = mode === 'everything' ? 'with formatting' : 'content only';
  return { 
    success: true, 
    text: slot.text,
    mode: mode,
    message: `Pasted from Slot ${index + 1} (${modeLabel})`
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
    attributes: [],
    hasFormatting: false,
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

// ============================================
// VARIABLE RENAMER (SCOPED FIND & REPLACE)
// ============================================

/**
 * Finds all occurrences of searchText within the current selection.
 * @param {string} searchText - Text to search for
 * @param {Object} options - Search options { caseSensitive, wholeWord }
 * @returns {Object} Result with count and preview
 */
function findInSelection(searchText, options) {
  if (!searchText || searchText.length === 0) {
    return { success: false, error: 'No search text provided', count: 0 };
  }
  
  options = options || {};
  const caseSensitive = options.caseSensitive || false;
  const wholeWord = options.wholeWord || false;
  
  const selection = DocumentApp.getActiveDocument().getSelection();
  
  if (!selection) {
    return { success: false, error: 'No text selected', count: 0 };
  }
  
  const elements = selection.getRangeElements();
  let totalCount = 0;
  let previewText = '';
  
  for (let i = 0; i < elements.length; i++) {
    const element = elements[i];
    if (element.getElement().editAsText) {
      const textElement = element.getElement().editAsText();
      let selectedText = '';
      
      if (element.isPartial()) {
        const start = element.getStartOffset();
        const end = element.getEndOffsetInclusive();
        selectedText = textElement.getText().substring(start, end + 1);
      } else {
        selectedText = textElement.getText();
      }
      
      // Count occurrences
      const searchIn = caseSensitive ? selectedText : selectedText.toLowerCase();
      const searchFor = caseSensitive ? searchText : searchText.toLowerCase();
      
      if (wholeWord) {
        const regex = new RegExp('\\b' + escapeRegex(searchFor) + '\\b', caseSensitive ? 'g' : 'gi');
        const matches = selectedText.match(regex);
        totalCount += matches ? matches.length : 0;
      } else {
        let pos = 0;
        while ((pos = searchIn.indexOf(searchFor, pos)) !== -1) {
          totalCount++;
          pos += searchFor.length;
        }
      }
      
      if (previewText.length < 100) {
        previewText += selectedText.substring(0, 100 - previewText.length);
      }
    }
  }
  
  return {
    success: true,
    count: totalCount,
    searchText: searchText,
    previewText: previewText.substring(0, 50) + (previewText.length > 50 ? '...' : ''),
    message: `Found ${totalCount} occurrence${totalCount !== 1 ? 's' : ''}`
  };
}

/**
 * Escapes special regex characters in a string.
 */
function escapeRegex(str) {
  return str.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
}

/**
 * Replaces all occurrences of findText with replaceText within current selection only.
 * @param {string} findText - Text to find
 * @param {string} replaceText - Text to replace with
 * @param {Object} options - Replace options { caseSensitive, wholeWord }
 * @returns {Object} Result with replaced count
 */
function replaceInSelection(findText, replaceText, options) {
  if (!findText || findText.length === 0) {
    return { success: false, error: 'No search text provided', replacedCount: 0 };
  }
  
  replaceText = replaceText || '';
  options = options || {};
  const caseSensitive = options.caseSensitive || false;
  const wholeWord = options.wholeWord || false;
  
  const doc = DocumentApp.getActiveDocument();
  const selection = doc.getSelection();
  
  if (!selection) {
    return { success: false, error: 'No text selected', replacedCount: 0 };
  }
  
  const elements = selection.getRangeElements();
  let totalReplaced = 0;
  
  // Process from last to first to preserve positions
  for (let i = elements.length - 1; i >= 0; i--) {
    const element = elements[i];
    if (element.getElement().editAsText) {
      const textElement = element.getElement().editAsText();
      let start = 0;
      let end = textElement.getText().length - 1;
      
      if (element.isPartial()) {
        start = element.getStartOffset();
        end = element.getEndOffsetInclusive();
      }
      
      const fullText = textElement.getText();
      const selectedText = fullText.substring(start, end + 1);
      
      // Find and replace within this range
      let newText;
      let replacedInThisElement = 0;
      
      if (wholeWord) {
        const flags = caseSensitive ? 'g' : 'gi';
        const regex = new RegExp('\\b' + escapeRegex(findText) + '\\b', flags);
        newText = selectedText.replace(regex, function() {
          replacedInThisElement++;
          return replaceText;
        });
      } else {
        const searchIn = caseSensitive ? selectedText : selectedText.toLowerCase();
        const searchFor = caseSensitive ? findText : findText.toLowerCase();
        
        newText = '';
        let lastPos = 0;
        let pos = 0;
        
        while ((pos = searchIn.indexOf(searchFor, lastPos)) !== -1) {
          newText += selectedText.substring(lastPos, pos) + replaceText;
          lastPos = pos + findText.length;
          replacedInThisElement++;
        }
        newText += selectedText.substring(lastPos);
      }
      
      if (replacedInThisElement > 0) {
        // Delete the original selected portion and insert the new text
        textElement.deleteText(start, end);
        if (newText.length > 0) {
          textElement.insertText(start, newText);
        }
        totalReplaced += replacedInThisElement;
      }
    }
  }
  
  return {
    success: true,
    replacedCount: totalReplaced,
    findText: findText,
    replaceText: replaceText,
    message: `Replaced ${totalReplaced} occurrence${totalReplaced !== 1 ? 's' : ''}`
  };
}

// ============================================
// UNIT CONVERTER
// ============================================

/**
 * Unit conversion definitions.
 */
const UNIT_PATTERNS = {
  temperature: {
    patterns: [
      { regex: /^(-?\d+(?:\.\d+)?)\s*°?\s*[Cc](?:elsius)?$/i, unit: 'C' },
      { regex: /^(-?\d+(?:\.\d+)?)\s*°?\s*[Ff](?:ahrenheit)?$/i, unit: 'F' },
      { regex: /^(-?\d+(?:\.\d+)?)\s*[Kk](?:elvin)?$/i, unit: 'K' }
    ],
    conversions: {
      'C': { 'F': (v) => v * 9/5 + 32, 'K': (v) => v + 273.15 },
      'F': { 'C': (v) => (v - 32) * 5/9, 'K': (v) => (v - 32) * 5/9 + 273.15 },
      'K': { 'C': (v) => v - 273.15, 'F': (v) => (v - 273.15) * 9/5 + 32 }
    },
    symbols: { 'C': '°C', 'F': '°F', 'K': 'K' }
  },
  distance: {
    patterns: [
      { regex: /^(-?\d+(?:\.\d+)?)\s*km$/i, unit: 'km' },
      { regex: /^(-?\d+(?:\.\d+)?)\s*mi(?:les?)?$/i, unit: 'mi' },
      { regex: /^(-?\d+(?:\.\d+)?)\s*m(?:eters?)?$/i, unit: 'm' },
      { regex: /^(-?\d+(?:\.\d+)?)\s*ft|feet|foot$/i, unit: 'ft' },
      { regex: /^(-?\d+(?:\.\d+)?)\s*cm$/i, unit: 'cm' },
      { regex: /^(-?\d+(?:\.\d+)?)\s*in(?:ches?)?$/i, unit: 'in' }
    ],
    conversions: {
      'km': { 'mi': (v) => v * 0.621371 },
      'mi': { 'km': (v) => v * 1.60934 },
      'm': { 'ft': (v) => v * 3.28084 },
      'ft': { 'm': (v) => v * 0.3048 },
      'cm': { 'in': (v) => v * 0.393701 },
      'in': { 'cm': (v) => v * 2.54 }
    },
    symbols: { 'km': 'km', 'mi': 'mi', 'm': 'm', 'ft': 'ft', 'cm': 'cm', 'in': 'in' }
  },
  weight: {
    patterns: [
      { regex: /^(-?\d+(?:\.\d+)?)\s*kg$/i, unit: 'kg' },
      { regex: /^(-?\d+(?:\.\d+)?)\s*(?:lb|lbs|pounds?)$/i, unit: 'lb' },
      { regex: /^(-?\d+(?:\.\d+)?)\s*g(?:rams?)?$/i, unit: 'g' },
      { regex: /^(-?\d+(?:\.\d+)?)\s*oz$/i, unit: 'oz' }
    ],
    conversions: {
      'kg': { 'lb': (v) => v * 2.20462 },
      'lb': { 'kg': (v) => v * 0.453592 },
      'g': { 'oz': (v) => v * 0.035274 },
      'oz': { 'g': (v) => v * 28.3495 }
    },
    symbols: { 'kg': 'kg', 'lb': 'lb', 'g': 'g', 'oz': 'oz' }
  }
};

/**
 * Detects and parses unit from currently selected text.
 * @returns {Object} Parsed unit info with available conversions
 */
function detectAndParseUnit() {
  const selection = getSelectedText();
  
  if (!selection.success || !selection.hasSelection) {
    return { success: false, error: 'No text selected', canConvert: false };
  }
  
  const text = selection.text.trim();
  
  // Try to match against all unit patterns
  for (const unitType in UNIT_PATTERNS) {
    const config = UNIT_PATTERNS[unitType];
    
    for (let i = 0; i < config.patterns.length; i++) {
      const pattern = config.patterns[i];
      const match = text.match(pattern.regex);
      
      if (match) {
        const value = parseFloat(match[1]);
        const fromUnit = pattern.unit;
        const availableConversions = [];
        
        // Get available conversions for this unit
        if (config.conversions[fromUnit]) {
          for (const toUnit in config.conversions[fromUnit]) {
            const convertedValue = config.conversions[fromUnit][toUnit](value);
            const formatted = formatNumber(convertedValue) + ' ' + config.symbols[toUnit];
            availableConversions.push({
              toUnit: toUnit,
              toSymbol: config.symbols[toUnit],
              convertedValue: convertedValue,
              formatted: formatted
            });
          }
        }
        
        return {
          success: true,
          canConvert: availableConversions.length > 0,
          originalText: text,
          value: value,
          unit: fromUnit,
          unitSymbol: config.symbols[fromUnit],
          unitType: unitType,
          conversions: availableConversions
        };
      }
    }
  }
  
  return {
    success: true,
    canConvert: false,
    originalText: text,
    error: 'No convertible unit detected',
    hint: 'Try selecting text like "180°C", "10 km", or "50 kg"'
  };
}

/**
 * Formats a number to reasonable precision.
 */
function formatNumber(num) {
  if (Number.isInteger(num)) {
    return num.toString();
  }
  return parseFloat(num.toFixed(2)).toString();
}

/**
 * Converts selected unit to the specified target unit.
 * @param {string} toUnit - Target unit to convert to
 * @returns {Object} Result with new text
 */
function convertSelectedUnit(toUnit) {
  const parsed = detectAndParseUnit();
  
  if (!parsed.success || !parsed.canConvert) {
    return { success: false, error: parsed.error || 'Cannot convert this selection' };
  }
  
  // Find the conversion
  const targetConversion = parsed.conversions.find(c => c.toUnit === toUnit);
  
  if (!targetConversion) {
    return { success: false, error: `Cannot convert ${parsed.unit} to ${toUnit}` };
  }
  
  // Replace the selected text with the converted value
  const doc = DocumentApp.getActiveDocument();
  const selection = doc.getSelection();
  
  if (!selection) {
    return { success: false, error: 'Selection lost' };
  }
  
  const elements = selection.getRangeElements();
  const newText = targetConversion.formatted;
  
  // Replace in the first element
  for (let i = elements.length - 1; i >= 0; i--) {
    const element = elements[i];
    if (element.getElement().editAsText) {
      const textElement = element.getElement().editAsText();
      
      if (element.isPartial()) {
        const start = element.getStartOffset();
        const end = element.getEndOffsetInclusive();
        
        if (i === 0) {
          textElement.deleteText(start, end);
          textElement.insertText(start, newText);
        } else {
          textElement.deleteText(start, end);
        }
      } else {
        if (i === 0) {
          textElement.setText(newText);
        } else {
          textElement.setText('');
        }
      }
    }
  }
  
  return {
    success: true,
    originalText: parsed.originalText,
    newText: newText,
    fromUnit: parsed.unitSymbol,
    toUnit: targetConversion.toSymbol,
    message: `Converted ${parsed.originalText} → ${newText}`
  };
}

