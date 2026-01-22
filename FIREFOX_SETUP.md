# Firefox Setup Guide

This extension supports both Manifest V2 (for Firefox) and Manifest V3 (for Chrome/Edge).

## Why Two Versions?

- **Manifest V3** (manifest.json) - For Chrome, Edge, and other Chromium browsers
- **Manifest V2** (manifest-v2.json) - For Firefox, which doesn't fully support V3 yet

## Firefox Installation

### Option 1: Quick Setup Script

```bash
# Switch to Firefox version
npm run firefox

# Switch back to Chrome version
npm run chrome
```

### Option 2: Manual Setup

1. **Backup the current manifest:**
   ```bash
   cp manifest.json manifest-v3.json
   ```

2. **Switch to V2 manifest:**
   ```bash
   cp manifest-v2.json manifest.json
   ```

3. **Load in Firefox:**
   - Open Firefox
   - Navigate to `about:debugging#/runtime/this-firefox`
   - Click "Load Temporary Add-on"
   - Select the `manifest.json` file in your extension directory

4. **To switch back to Chrome:**
   ```bash
   cp manifest-v3.json manifest.json
   ```

## Key Differences Between Versions

### Manifest V3 (Chrome)
- Uses `service_worker` for background script
- Uses `chrome.action` API
- Requires separate `host_permissions` field
- More restrictive Content Security Policy

### Manifest V2 (Firefox)
- Uses `background.scripts` with persistent option
- Uses `chrome.browserAction` API
- Permissions include URLs directly
- Simpler `web_accessible_resources` format

## Browser-Specific Files

| File | Used By |
|------|---------|
| `manifest.json` | Active manifest (copy from V2 or V3) |
| `manifest-v2.json` | Firefox template |
| `manifest-v3.json` | Chrome template (original) |
| `background/background.js` | Chrome (uses `chrome.action`) |
| `background/background-v2.js` | Firefox (uses `chrome.browserAction`) |

## Testing in Firefox

1. **Load the extension** as described above

2. **Test basic functionality:**
   - Visit a page with Persian, Chinese, or Russian text
   - Words should be highlighted
   - Hover over highlighted words to see tooltips
   - Click the extension icon to access settings

3. **Test keyboard shortcut:**
   - Press `Ctrl+Shift+L` (or `Cmd+Shift+L` on Mac)
   - Extension should toggle on/off

4. **Test settings:**
   - Click extension icon → "Full Settings"
   - Toggle languages on/off
   - Add custom vocabulary
   - Import/export data

## Publishing to Firefox Add-ons (AMO)

When ready to publish to addons.mozilla.org:

1. **Update Firefox ID** in `manifest-v2.json`:
   ```json
   "browser_specific_settings": {
     "gecko": {
       "id": "your-unique-id@yourdomain.com",
       "strict_min_version": "57.0"
     }
   }
   ```

2. **Create Firefox package:**
   ```bash
   npm run package:firefox
   ```

3. **Submit to AMO:**
   - Go to https://addons.mozilla.org/developers/
   - Upload the generated ZIP file
   - Fill in required metadata

## Troubleshooting

### Extension doesn't load in Firefox
- Make sure you're using `manifest-v2.json` (renamed to `manifest.json`)
- Check the browser console for errors: `Ctrl+Shift+J`

### Badge/icon not updating
- Firefox uses `browserAction` instead of `action`
- Verify `background-v2.js` is being loaded

### Content scripts not injecting
- Check permissions in manifest
- Verify `<all_urls>` permission is granted
- Reload the extension after making changes

### Data not persisting
- Both versions use `chrome.storage.sync` and `chrome.storage.local`
- Firefox supports these APIs in Manifest V2
- Check Firefox console for storage errors

## Development Workflow

### Working on Firefox version:
```bash
# Switch to Firefox mode
npm run firefox

# Make changes
# Test in Firefox (about:debugging)

# Commit both manifest versions
git add manifest-v2.json manifest-v3.json background/background-v2.js
```

### Working on Chrome version:
```bash
# Switch to Chrome mode
npm run chrome

# Make changes
# Test in Chrome (chrome://extensions)

# Commit changes
git add manifest.json background/background.js
```

### Keeping both versions in sync:
When you update the extension:

1. Update shared code (content scripts, utils, options, popup)
2. Update both `manifest-v2.json` AND `manifest-v3.json`
3. Update both `background/background.js` AND `background/background-v2.js`
4. Test in both browsers
5. Commit all changes

## Automated Build Scripts

Add these to `package.json`:

```json
"scripts": {
  "firefox": "cp manifest-v2.json manifest.json && echo 'Switched to Firefox (Manifest V2)'",
  "chrome": "cp manifest-v3.json manifest.json && echo 'Switched to Chrome (Manifest V3)'",
  "package:firefox": "npm run firefox && zip -r language-learner-firefox.zip . -x '*.git*' 'node_modules/*' '*.md' 'scripts/*'",
  "package:chrome": "npm run chrome && zip -r language-learner-chrome.zip . -x '*.git*' 'node_modules/*' '*.md' 'scripts/*'"
}
```

## Support Matrix

| Browser | Manifest Version | Tested |
|---------|------------------|--------|
| Chrome 88+ | V3 | ✅ |
| Edge 88+ | V3 | ✅ |
| Firefox 57+ | V2 | ⏳ Pending |
| Opera 74+ | V3 | ⏳ Pending |

## Additional Resources

- [Firefox Extension Workshop](https://extensionworkshop.com/)
- [Manifest V2 Documentation](https://developer.mozilla.org/en-US/docs/Mozilla/Add-ons/WebExtensions/manifest.json)
- [Chrome Extension Manifest V3](https://developer.chrome.com/docs/extensions/mv3/intro/)
- [Browser compatibility table](https://developer.mozilla.org/en-US/docs/Mozilla/Add-ons/WebExtensions/Browser_support_for_JavaScript_APIs)
