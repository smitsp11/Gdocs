# SmartSwap Add-on - Setup Instructions

## Features

### 🎯 Smart Buffer (Multi-Slot Clipboard)
- **5 Named Slots**: Collect multiple text fragments for reorganizing documents
- **Collect & Pour Workflow**: Select text → Click "Collect" → Select destination → Click "Pour"
- **Editable Labels**: Name slots (e.g., "Intro", "Conclusion", "Quote")
- **Persistent Storage**: Slots survive closing/reopening the sidebar
- **Formatting Detection**: Shows ✨ Styled or Plain badge for each slot

### 🎨 Style-Aware Swapping
- **Two Swap Modes**: Toggle between "Content Only" and "Everything"
  - **Content Only**: Text moves but destination formatting is preserved
  - **Everything**: Text AND formatting move together
- **Automatic Formatting Capture**: Collects bold, italic, underline, colors, font size, etc.
- **Perfect for Editors**: Swap words without breaking document styling

### 🧠 Smart Tools (NEW)

#### Variable Renamer
- **Scoped Find & Replace**: Rename variables only within your selection
- **Preview Before Replace**: See match count before committing changes
- **Safe**: Protects the rest of your document from accidental changes

#### Unit Converter
- **Auto-Detect Units**: Select "180°C" and it recognizes the unit type
- **One-Click Convert**: Instantly swap to converted value
- **Supported Units**:
  - Temperature: °C ↔ °F ↔ K
  - Distance: km ↔ mi, m ↔ ft, cm ↔ in
  - Weight: kg ↔ lb, g ↔ oz

### ↔️ Quick Exchange
- **Exchange Paste**: Replace selected text and capture what was there
- **History**: Access previously captured text

---

## How to Deploy

### Option 1: Apps Script Editor (Recommended for Testing)

1. Go to [script.google.com](https://script.google.com)
2. Click **New Project**
3. Copy the contents of each file:
   - Rename `Code.gs` → paste content
   - Click **+** → **HTML** → name it `Sidebar` → paste content
   - Click **Project Settings** (gear icon) → **Show "appsscript.json" manifest file**
   - Edit `appsscript.json` → paste content
4. Click **Deploy** → **Test deployments** → **Select type: Editor Add-on**
5. Open any Google Doc
6. **Extensions** → **SmartSwap** → **Open SmartSwap**

### Option 2: clasp CLI (For Developers)

```bash
npm install -g @google/clasp
clasp login
cd smartswap-addon
clasp create --type docs --title "SmartSwap"
clasp push
clasp open
```

---

## Usage

### Smart Buffer (Collect & Pour)
1. Open a Google Doc
2. Go to **Extensions** → **SmartSwap** → **Open SmartSwap**
3. Select text in doc → Click **Collect** on any slot
4. Repeat to fill multiple slots with different text fragments
5. Position cursor or select destination text → Click **Pour** to insert

### Quick Exchange  
1. Select text in doc → Click **Copy Selection to Here**
2. Select different text → Click **Exchange Paste**
3. The replaced text appears in the input area for reuse
