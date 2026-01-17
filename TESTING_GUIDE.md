# Testing Guide - Farsi Root Word Learner

## Quick Start Testing

### Step 1: Load Extension in Browser

#### For Chrome/Edge/Brave:
1. Open your browser
2. Navigate to `chrome://extensions/`
3. Toggle **"Developer mode"** ON (top-right corner)
4. Click **"Load unpacked"**
5. Navigate to and select the `lang-ext` folder
6. The extension should now appear in your extensions list

#### For Firefox:
1. Open Firefox
2. Navigate to `about:debugging#/runtime/this-firefox`
3. Click **"Load Temporary Add-on..."**
4. Navigate to the `lang-ext` folder
5. Select the `manifest.json` file
6. The extension is now loaded (temporary - will be removed when Firefox closes)

### Step 2: Open Test Page

**Option A - Local File:**
1. Open the `test.html` file in your browser:
   - Right-click `test.html` → "Open with" → Your browser
   - Or drag and drop `test.html` into your browser window

**Option B - File URL:**
1. In your browser, press `Ctrl+O` (or `Cmd+O` on Mac)
2. Navigate to: `/home/user/lang-ext/test.html`
3. Click "Open"

### Step 3: What to Look For

✅ **Highlighted Words** - You should see Persian words with dotted underlines:
   - علم (science)
   - کتاب (book)
   - معلم (teacher)
   - مدرسه (school)
   - درس (lesson)
   - And many more...

✅ **Tooltips** - Hover your mouse over any underlined word:
   - A tooltip should appear showing:
     - The word in Persian
     - The Arabic root (e.g., ک-ت-ب)
     - Root meaning (e.g., "to write")
     - Word meaning (e.g., "book")
     - Part of speech (e.g., "noun")
     - Category badge

✅ **Extension Icon** - Look in your browser toolbar:
   - You should see the extension icon (may be a placeholder if icons aren't generated yet)
   - Click it to open the popup

✅ **Popup Interface**:
   - Shows dictionary statistics (5 roots, ~20 words, etc.)
   - Settings toggles (Enable highlighting, Auto-detect)
   - Highlight color selector

### Step 4: Browser Console Check

1. Open Developer Tools (`F12` or `Ctrl+Shift+I`)
2. Go to the **Console** tab
3. Look for messages like:
   ```
   Farsi Root Learner: Initializing...
   Farsi Root Learner: Dictionary loaded
   Farsi Root Learner: Page analysis {isPersian: true, ...}
   Farsi Root Learner: Activating on this page
   Farsi Root Learner: Processing X Persian text nodes
   Farsi Root Learner: Ready
   ```

4. ✅ No red errors should appear

### Step 5: Test Real Websites

Try these Persian websites to see the extension in action:

1. **BBC Persian**: https://www.bbc.com/persian
2. **VOA Persian**: https://ir.voanews.com/
3. **Hamshahri Online**: https://www.hamshahrionline.ir/
4. **ISNA News**: https://www.isna.ir/

**What should happen:**
- Extension detects Persian content automatically
- Common words like کتاب, علم, درس are highlighted
- Tooltips work on real content

### Troubleshooting

#### Problem: No words are highlighted on test.html

**Check:**
1. Extension is enabled in `chrome://extensions/`
2. Browser console shows no errors
3. Page has loaded completely (refresh if needed)

**Solution:**
- Try reloading the extension:
  - Go to `chrome://extensions/`
  - Click the refresh icon on the extension card
  - Reload the test page

#### Problem: Tooltips don't appear

**Check:**
1. Are words underlined? (highlighting is working)
2. Are you hovering directly over the underlined word?
3. Check browser console for errors

**Solution:**
- Right-click on page → Inspect
- Look for errors in Console tab
- Check if CSS is loading properly

#### Problem: Extension icon doesn't show

**Expected:**
- Icons aren't generated yet (we have SVG but no PNGs)
- Browser will show a default placeholder icon
- This is normal and doesn't affect functionality

#### Problem: "Failed to load dictionary" error

**Check:**
1. File `data/farsi-roots.json` exists
2. JSON is valid (no syntax errors)
3. manifest.json has correct web_accessible_resources

**Solution:**
- Reload the extension
- Check file permissions

#### Problem: Nothing happens on Persian websites

**Possible causes:**
1. Page doesn't have enough Persian text (needs 50+ Persian characters)
2. Content is loaded dynamically (wait a few seconds)
3. Extension isn't active on that domain

**Solution:**
- Check console for "Page analysis" message
- Look for `isPersian: false` - means not enough Persian detected

### Advanced Testing

#### Test Dynamic Content
1. Open test.html
2. Open browser console
3. Run:
   ```javascript
   document.body.innerHTML += '<p>این یک کتاب جدید است</p>'
   ```
4. The new Persian text should be highlighted automatically

#### Test Settings Changes
1. Click extension icon
2. Toggle "Enable highlighting" OFF
3. Reload page - no highlighting should appear
4. Toggle back ON and reload - highlighting returns

#### Test Different Highlight Colors
1. Click extension icon
2. Change highlight color from dropdown
3. Reload page to see new color (requires page refresh)

### Performance Testing

**Check performance:**
1. Open DevTools → Performance tab
2. Start recording
3. Load test.html
4. Stop recording
5. Extension should add minimal overhead (<100ms)

### What's Working

Based on current implementation:

✅ Language detection
✅ Word matching
✅ Highlighting
✅ Tooltips
✅ Settings storage
✅ Popup UI
✅ Dynamic content handling
✅ Dark mode support

### What's Not Implemented Yet

⚠️ Icon PNG files (using placeholder)
⚠️ Only 5 roots in dictionary (target: 500)
⚠️ Welcome page on install
⚠️ Dictionary viewer page

### Report Issues

If you find bugs:

1. Note the exact steps to reproduce
2. Check browser console for errors
3. Note browser version and OS
4. Create an issue on GitHub

### Success Criteria

Your test is successful if:

- [x] Extension loads without errors
- [x] test.html shows underlined words
- [x] Hovering shows tooltips
- [x] Tooltips contain all info (root, meaning, POS)
- [x] Popup opens and shows stats
- [x] Settings can be changed
- [x] Works on at least one real Persian website
- [x] No console errors

Happy testing! 🎉
