# SmartSwap Add-on - Setup Instructions

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

## Usage

1. Open a Google Doc
2. Go to **Extensions** → **SmartSwap** → **Open SmartSwap**
3. Select text in doc → Click **Copy Selection to Here**
4. Select different text → Click **Exchange Paste**
5. The replaced text appears in "Captured Text" section
6. Click **Copy to System Clipboard** to use it elsewhere
