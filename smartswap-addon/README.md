# SmartSwap Add-on - Setup Instructions

## Features

### 🎯 Smart Buffer (Multi-Slot Clipboard)
- **5 Named Slots**: Collect multiple text fragments for reorganizing documents
- **Collect & Pour Workflow**: Select text → Click "Collect" → Select destination → Click "Pour"
- **Editable Labels**: Name slots (e.g., "Intro", "Conclusion", "Quote")
- **Persistent Storage**: Slots survive closing/reopening the sidebar

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
