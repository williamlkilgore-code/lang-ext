# Quick Test Instructions

## Load the Extension (1 minute)

### Chrome/Edge/Brave:
1. Open browser and go to: `chrome://extensions/`
2. Toggle **"Developer mode"** ON (top-right)
3. Click **"Load unpacked"**
4. Select this folder: `/home/user/lang-ext`
5. Done! ✓

### Firefox:
1. Open Firefox and go to: `about:debugging#/runtime/this-firefox`
2. Click **"Load Temporary Add-on..."**
3. Select file: `/home/user/lang-ext/manifest.json`
4. Done! ✓

## Test It (30 seconds)

### Option 1: Local Test File
Open this file in your browser:
```
/home/user/lang-ext/test.html
```

### Option 2: Real Website
Visit: https://www.bbc.com/persian

## What You Should See

✅ **Underlined words** in Persian text (dotted blue line)
✅ **Tooltips** when hovering over underlined words
✅ **Extension icon** in browser toolbar

## Hover Over These Words in test.html

Try hovering over these Persian words - they should show tooltips:

- **کتاب** → should show "Root: ک-ت-ب, Meaning: book"
- **علم** → should show "Root: ع-ل-م, Meaning: science, knowledge"
- **معلم** → should show "Root: ع-ل-م, Meaning: teacher"
- **مدرسه** → should show "Root: د-ر-س, Meaning: school"
- **درس** → should show "Root: د-ر-س, Meaning: lesson"

## Check Extension Popup

1. Click the extension icon in your browser toolbar
2. You should see:
   - **5 Roots**
   - **~20 Words**
   - **5 Categories**
   - Settings toggles

## If Something Goes Wrong

1. Open browser console (`F12`)
2. Look for messages starting with "Farsi Root Learner:"
3. Should see: "Dictionary loaded" and "Ready"
4. No red errors should appear

## Known Issues (Expected)

⚠️ Extension icon shows as placeholder (no PNG icons generated yet - this is OK!)

## Success!

If you see underlined words and working tooltips, the extension is working perfectly! 🎉

Next step: Add more roots to the dictionary (`data/farsi-roots.json`)
