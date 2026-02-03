# Product Requirements Document (PRD)

**Project Name:** SmartSwap for Google Docs  
**Platform:** Google Chrome Extension  
**Version:** 1.0  
**Status:** Draft  

---

## 1. Executive Summary
SmartSwap is a productivity-focused Chrome extension designed for Google Docs. It solves the inefficiency of text transposition (swapping two pieces of text). It introduces a *non-destructive paste* workflow where pasting text over a selection automatically captures the replaced text into the clipboard, allowing for immediate re-pasting elsewhere.

---

## 2. Target Audience
- **Editors & Writers:** Users who frequently restructure sentences and paragraphs.  
- **Programmers & Mathematicians:** Users working with variables, equations, or logic where precise ordering is crucial (e.g., changing `x / y` to `y / x`).  
- **Data Entry Specialists:** Users moving data points between table cells or list items.

---

## 3. Core Value Proposition
- **Preservation:** Never lose text just because you pasted over it.  
- **Speed:** Reduce a 6-step swap process to a 2-step process.  
- **Flow:** Maintain writing momentum without managing invisible clipboard states.

---

## 4. Functional Requirements (FR)

### FR 1: The "Exchange Paste" Logic (Primary Feature)
This feature modifies the default behavior of the Paste command (`Ctrl+V / Cmd+V`) when text is highlighted.

**FR 1.1**  
The system **MUST** detect when a user triggers a *Paste* action while a text selection exists.

**FR 1.2**  
Upon detection, the system **MUST**:
1. Store the currently highlighted text (*Destination*) in a temporary buffer.  
2. Execute the standard paste of the current clipboard content (*Source*).  
3. Immediately overwrite the system clipboard with the content from the temporary buffer (*Destination*).

**FR 1.3**  
If no text is highlighted (cursor is blinking), the system **MUST** perform a standard paste without altering the clipboard.

---

### FR 2: Drag-and-Swap (Secondary Feature)
This feature changes drag-and-drop behavior to swap content rather than insert it.

**FR 2.1**  
The system **MUST** allow users to toggle a *Swap Mode* (via hotkey or UI switch).

**FR 2.2**  
When *Swap Mode* is active, dragging *Selection A* and dropping it onto *Selection B* **MUST** result in:
- Selection A taking Selection B's position  
- Selection B taking Selection A's position

**FR 2.3**  
The system **MUST** preserve formatting during the swap (bold, italics, etc., move with their respective text).

---

### FR 3: Explicit "Quick Swap" Command

**FR 3.1**  
The extension **MUST** provide a dedicated hotkey (e.g., `Alt + X`) for swapping adjacent entities.

**FR 3.2**  
If the cursor is between two words/variables (e.g., `6 | 4`), pressing the hotkey **MUST** swap the words to the left and right of the cursor (`4 | 6`).

---

### FR 4: Extension UI & Settings

**FR 4.1**  
**Popup Menu:** A simple popup to toggle the extension *On/Off*.

**FR 4.2**  
**History Buffer (Optional V2):** A small visual history showing the last 3 items "pushed out" by a swap paste.

---

## 5. User Stories & Workflows

### Scenario A: The Variable Swap (Math/Code)

**User State:**  
User has written `Compute 6 / 4` but needs `4 / 6`. Clipboard is empty.

1. User highlights `6` → `Ctrl+X` (Cut).  
   - Clipboard: `6`  
   - Doc: `Compute / 4`

2. User highlights `4`.

3. User presses `Ctrl+V` (Paste).  
   - Doc: `Compute 6 / 6`  
   - System Action: SmartSwap captures `4` and pushes it to the clipboard.

4. Clipboard: `4`.

5. User moves cursor to the empty space before the slash.

6. User presses `Ctrl+V`.  
   - Doc: `Compute 4 / 6`.

---

### Scenario B: The Sentence Shuffle (Writing)

**User State:**  
User wants to swap *Sentence A* and *Sentence B*.

1. User highlights *Sentence A* → `Ctrl+C` (Copy).  
2. User highlights *Sentence B* → `Ctrl+V` (Paste).  
   - *Sentence A* is now where *Sentence B* was.  
   - System Action: SmartSwap automatically copies *Sentence B* to the clipboard.
3. User selects the original *Sentence A* (now duplicate or empty space).  
4. User presses `Ctrl+V`.  
   - *Sentence B* is now where *Sentence A* was.

---

## 6. Technical Feasibility & Constraints

**CRITICAL TECHNICAL NOTE:**  
Google Docs does not use standard HTML DOM elements (`<p>`, `<div>`) for its main editing canvas. It often relies on a canvas-based rendering engine or highly obfuscated DOM structures (`kix-app`).

**Constraint 6.1 — Event Listeners**  
The extension cannot rely on standard textarea input events. It must hook into Google Docs clipboard or low-level `keydown` events.

**Constraint 6.2 — DOM Access**  
Reading highlighted text is difficult because selections may be rendered on a `<canvas>`. The extension may need:
- Google Docs Scripting API (Apps Script), or  
- Accessibility DOM nodes  

to read the active selection before the paste event fires.

**Constraint 6.3 — Latency**  
The *Copy → Paste → Clipboard Update* loop must complete in under **100 ms** to feel instantaneous.

---

## 7. Non-Functional Requirements

- **Performance:** Must not degrade typing or scrolling performance in Google Docs.  
- **Security:** Permissions must be strictly scoped to `docs.google.com`. Clipboard data must not be stored permanently or transmitted externally.  
- **Compatibility:** Must support Chrome **Manifest V3**.

---

## 8. Roadmap

**Phase 1 (MVP):**  
- "Exchange Paste" only. Pasting over a selection replaces the clipboard with the displaced text.

**Phase 2:**  
- Visual UI: small floating widget near the cursor showing what was swapped out.

**Phase 3:**  
- "Drag and Swap" implementation (high technical difficulty due to canvas-based rendering).
