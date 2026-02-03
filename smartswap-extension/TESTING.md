# SmartSwap Extension - Installation & Testing Guide

## 📦 Installation Steps

### 1. Load Extension in Chrome

1. **Open Chrome Extensions Page**
   - Navigate to `chrome://extensions/` in your Chrome browser
   - Or click the three-dot menu → More Tools → Extensions

2. **Enable Developer Mode**
   - Toggle the "Developer mode" switch in the top-right corner

3. **Load Unpacked Extension**
   - Click the "Load unpacked" button
   - Navigate to and select the `smartswap-extension` folder
   - The extension should now appear in your extensions list

4. **Verify Installation**
   - You should see "SmartSwap for Google Docs" in your extensions
   - The purple swap icon should appear in your Chrome toolbar
   - Click the icon to open the popup and verify it shows "Active"

### 2. Pin the Extension (Optional)

- Click the puzzle piece icon in Chrome toolbar
- Find "SmartSwap for Google Docs"
- Click the pin icon to keep it visible

---

## 🧪 Testing Scenarios

### Test 1: Basic Variable Swap (6/4 → 4/6)

**Objective**: Verify the core exchange paste functionality

1. Open a new Google Docs document
2. Type: `Compute 6 / 4`
3. **Swap Process**:
   - Select and cut `6` (Ctrl/Cmd+X)
   - Document now shows: `Compute / 4`
   - Select `4`
   - Paste (Ctrl/Cmd+V)
   - Document should show: `Compute 6 /` (with cursor after 6)
   - Click before the `/`
   - Paste again (Ctrl/Cmd+V)
   - **Expected Result**: `Compute 4 / 6`

**Success Criteria**: ✅ Text swapped correctly in 2 paste operations

---

### Test 2: Sentence Swap

**Objective**: Test with longer text blocks

1. In Google Docs, type:
   ```
   Sentence A is first. Sentence B is second.
   ```

2. **Swap Process**:
   - Select and copy `Sentence A is first.` (Ctrl/Cmd+C)
   - Select `Sentence B is second.`
   - Paste (Ctrl/Cmd+V)
   - Document should show: `Sentence A is first. Sentence A is first.`
   - Select the second occurrence (the duplicate)
   - Paste (Ctrl/Cmd+V)
   - **Expected Result**: `Sentence A is first. Sentence B is second.` → `Sentence B is second. Sentence A is first.`

**Success Criteria**: ✅ Sentences swapped positions correctly

---

### Test 3: No Selection (Normal Paste)

**Objective**: Verify normal paste still works when nothing is selected

1. Copy some text: `Hello World`
2. Click in the document (no selection)
3. Paste (Ctrl/Cmd+V)
4. **Expected Result**: Text pastes normally without any swap behavior

**Success Criteria**: ✅ Normal paste works as expected

---

### Test 4: Formatted Text Swap

**Objective**: Test with bold, italic, and other formatting

1. Type: `**Bold Text** and *Italic Text*`
2. Make "Bold Text" bold and "Italic Text" italic
3. Try swapping them using the exchange paste method
4. **Expected Result**: Formatting should be preserved during swap

**Success Criteria**: ✅ Formatting preserved after swap

---

### Test 5: Large Text Block

**Objective**: Test performance with larger selections

1. Copy a paragraph of text (100+ words)
2. Select another paragraph
3. Paste to swap
4. **Expected Result**: Swap completes quickly (<100ms feel)

**Success Criteria**: ✅ No noticeable lag, smooth operation

---

## 🔍 Debugging

### Check Console Logs

1. Open Google Docs
2. Press `F12` or right-click → Inspect
3. Go to Console tab
4. Look for `[SmartSwap]` messages

**What to look for**:
- `✅ SmartSwap initialized and ready` - Extension loaded successfully
- `🔄 Selection detected - initiating exchange paste` - Swap triggered
- `✅ Exchange paste complete` - Swap completed
- Performance timings should be < 100ms

### Common Issues

**Extension not loading?**
- Check for errors in `chrome://extensions/`
- Click "Errors" button if present
- Verify all files are present in the extension folder

**Paste not capturing text?**
- Ensure text is actually selected (highlighted)
- Check console for error messages
- Verify extension is enabled (popup shows "Active")
- Try refreshing the Google Docs page

**Performance issues?**
- Check console for performance warnings
- Look for messages like `⚠️ Performance issue: Exchange paste took XXXms`

---

## 📊 Performance Monitoring

The extension logs performance metrics in the console:

```
[SmartSwap] ⏱️ Clipboard Read: 2.45ms
[SmartSwap] ⏱️ Clipboard Write: 3.12ms
[SmartSwap] ⏱️ Exchange Paste: 15.67ms
```

**Performance Requirements**:
- Total exchange paste operation: < 100ms
- Clipboard read: < 50ms
- Clipboard write: < 50ms

If you see warnings about performance, check:
- Browser performance (other tabs, extensions)
- System resources
- Network connectivity (for Google Docs sync)

---

## 🎯 Test Checklist

Use this checklist to verify all functionality:

- [ ] Extension loads without errors
- [ ] Popup shows "Active" status
- [ ] Toggle switch works (can enable/disable)
- [ ] Basic variable swap (6/4 → 4/6) works
- [ ] Sentence swap works
- [ ] Normal paste (no selection) works
- [ ] Formatted text swap preserves formatting
- [ ] Large text swap is performant
- [ ] Console shows no errors
- [ ] Performance is < 100ms
- [ ] Extension icon displays correctly

---

## 🐛 Reporting Issues

If you encounter bugs during testing:

1. **Check Console**: Look for error messages
2. **Note the Scenario**: What were you trying to do?
3. **Document Steps**: Can you reproduce it?
4. **Performance**: Check timing logs
5. **Browser Info**: Chrome version, OS

---

## 🚀 Next Steps After Testing

Once Phase 1 testing is complete and bug-free:

1. **Phase 2 Features**:
   - Visual feedback widget
   - Clipboard history buffer
   - Drag-and-swap mode
   - Quick swap hotkey (Alt+X)

2. **Polish**:
   - Optimize icon sizes (currently using same image for all sizes)
   - Add more visual feedback
   - Improve error handling

3. **Documentation**:
   - Create demo video
   - Add screenshots to README
   - Write user guide

---

**Happy Testing! 🎉**
