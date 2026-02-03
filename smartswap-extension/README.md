# SmartSwap for Google Docs

A Chrome extension that makes text swapping in Google Docs effortless. Paste over selected text to automatically capture it to your clipboard - perfect for quick text exchanges.

## 🎯 What It Does

SmartSwap implements **Exchange Paste** - a smart paste operation that automatically captures replaced text:

1. **Select** text you want to replace (e.g., "6")
2. **Paste** (Ctrl/Cmd+V) new text from clipboard (e.g., "4")
3. **Magic!** The replaced text ("6") is automatically copied to your clipboard
4. **Paste again** to complete the swap

This reduces a 6-step swap process to just 2 steps!

## ✨ Features

- **Non-destructive Paste**: Never lose text when pasting over a selection
- **Seamless Integration**: Works naturally within Google Docs
- **Performance Optimized**: <100ms latency for instant feel
- **Privacy Focused**: No data collection, clipboard data never leaves your browser
- **Simple Toggle**: Easy on/off control via popup

## 🚀 Installation

### Load Unpacked Extension (Development)

1. Clone or download this repository
2. Open Chrome and navigate to `chrome://extensions/`
3. Enable "Developer mode" (toggle in top right)
4. Click "Load unpacked"
5. Select the `smartswap-extension` folder
6. The extension is now installed!

### Usage

1. Open any Google Docs document
2. Click the SmartSwap icon in your Chrome toolbar
3. Ensure the extension is enabled (toggle should be on)
4. Start swapping text!

## 📖 Use Cases

### Variable Swap (Math/Code)
Change `6 / 4` to `4 / 6`:
- Cut `6`, paste over `4`, paste again → Done!

### Sentence Shuffle (Writing)
Swap two sentences:
- Copy Sentence A, paste over Sentence B, paste over original A location → Done!

### Data Entry
Quickly swap values in tables or lists without losing data.

## 🏗️ Project Structure

```
smartswap-extension/
├── manifest.json          # Extension configuration (Manifest V3)
├── background.js          # Background service worker
├── content/
│   ├── content.js        # Main content script
│   ├── selection-handler.js  # Google Docs selection detection
│   └── clipboard-manager.js  # Clipboard operations
├── popup/
│   ├── popup.html        # Extension popup UI
│   ├── popup.js          # Popup logic
│   └── popup.css         # Popup styles
├── utils/
│   ├── constants.js      # Configuration constants
│   └── utils.js          # Utility functions
└── icons/                # Extension icons
```

## 🔧 Technical Details

### How It Works

1. **Detection**: Content script monitors paste events in Google Docs
2. **Selection Check**: When paste is triggered, checks if text is selected
3. **Exchange Logic**: 
   - Captures selected text before paste
   - Allows normal paste to proceed
   - Updates clipboard with captured text (within 10ms)
4. **Performance**: Entire operation completes in <100ms

### Google Docs Integration

Google Docs uses a canvas-based rendering engine, but the extension works by:
- Using browser's native Selection API
- Hooking into paste events at the document level
- Leveraging Clipboard API for reading/writing

### Permissions

- `activeTab`: Access to current tab
- `clipboardRead`: Read clipboard content
- `clipboardWrite`: Write to clipboard
- `storage`: Save user preferences
- Host permission for `docs.google.com`

## 🧪 Testing

### Manual Testing Scenarios

1. **Basic Swap**: Test the variable swap scenario (6/4 → 4/6)
2. **Sentence Swap**: Test swapping two sentences
3. **No Selection**: Verify normal paste works when nothing is selected
4. **Large Text**: Test with large text blocks
5. **Formatted Text**: Test with bold, italic, and other formatting

### Performance Testing

Open Chrome DevTools Console to see performance logs:
- Each operation is timed
- Warnings appear if latency exceeds 100ms

## 🔐 Privacy & Security

- **No external servers**: All processing happens locally
- **No data collection**: Extension doesn't track or store clipboard data
- **Scoped permissions**: Only works on Google Docs
- **Open source**: Full code available for review

## 🗺️ Roadmap

### Phase 1 (Current - MVP)
- ✅ Exchange Paste functionality
- ✅ Basic popup UI
- ✅ Enable/disable toggle

### Phase 2 (Future)
- 🔲 Visual feedback widget showing swapped text
- 🔲 Clipboard history buffer
- 🔲 Drag-and-swap mode
- 🔲 Quick swap hotkey (Alt+X for adjacent words)

## 🐛 Troubleshooting

**Extension not working?**
- Ensure you're on a Google Docs document page
- Check that the extension is enabled in the popup
- Refresh the Google Docs page
- Check Chrome DevTools Console for error messages

**Paste not capturing text?**
- Make sure text is actually selected before pasting
- Verify clipboard permissions are granted
- Try disabling other clipboard-related extensions

## 📝 Development

### Debug Mode

Debug logging is enabled by default. Check the console for detailed logs:
- `[SmartSwap]` - General logs
- `[SmartSwap Error]` - Errors
- `[SmartSwap Warning]` - Warnings including performance issues

To disable debug logs, set `DEBUG: false` in `utils/constants.js`.

## 📄 License

This project is created for educational and demonstration purposes.

## 🙏 Acknowledgments

Built based on the SmartSwap PRD - solving the inefficiency of text transposition in Google Docs.

---

**Version**: 1.0.0  
**Manifest Version**: 3  
**Compatible with**: Google Chrome, Chromium-based browsers
