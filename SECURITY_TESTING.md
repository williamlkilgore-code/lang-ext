# Security & Vulnerability Testing Guide for Language Learner Extension

## 1. Automated Security Scanning

### Chrome Web Store Security Review
```bash
# The Chrome Web Store automatically scans for:
# - Known malware patterns
# - Suspicious permissions
# - Policy violations
```

### ESLint Security Plugin
```bash
# Install security-focused ESLint plugins
npm init -y
npm install --save-dev eslint eslint-plugin-security eslint-plugin-no-unsanitized

# Create .eslintrc.json
cat > .eslintrc.json << 'EOF'
{
  "env": {
    "browser": true,
    "es2021": true,
    "webextensions": true
  },
  "extends": [
    "eslint:recommended"
  ],
  "plugins": [
    "security",
    "no-unsanitized"
  ],
  "rules": {
    "security/detect-object-injection": "warn",
    "security/detect-non-literal-regexp": "warn",
    "security/detect-unsafe-regex": "error",
    "security/detect-eval-with-expression": "error",
    "no-unsanitized/method": "error",
    "no-unsanitized/property": "error"
  }
}
EOF

# Run ESLint
npx eslint content/ utils/ options/ popup/ background/
```

### Retire.js (Check for vulnerable libraries)
```bash
npm install -g retire

# Scan for known vulnerabilities
retire --path .
```

## 2. Manual Security Testing

### A. XSS (Cross-Site Scripting) Testing

**Test custom dictionary input:**
```javascript
// Try adding these malicious inputs to custom words:
<script>alert('XSS')</script>
<img src=x onerror=alert('XSS')>
javascript:alert('XSS')
<svg onload=alert('XSS')>
'"><script>alert(String.fromCharCode(88,83,83))</script>
```

**Test locations:**
1. Persian custom word input (word, root, meaning)
2. Chinese custom word input (character, pinyin, meaning)
3. Russian custom word input (word, root, meaning)
4. Tooltip display (hover over words)
5. Options page lists
6. Translation popup

### B. HTML Injection Testing

**Test in all input fields:**
```html
<h1>Test HTML</h1>
<style>body{background:red}</style>
<iframe src="https://evil.com"></iframe>
```

### C. Code Injection Testing

**JSON Import/Export:**
```javascript
// Try importing malicious JSON:
{
  "persian": [{
    "word": "\"><script>alert('XSS')</script>",
    "root": "constructor",
    "__proto__": {"isAdmin": true}
  }]
}

// Prototype pollution test:
{
  "persian": [],
  "__proto__": {
    "polluted": "yes"
  }
}
```

### D. Storage Security Testing

**Check chrome.storage limits:**
```javascript
// Test storage quota
chrome.storage.sync.getBytesInUse(null, (bytes) => {
  console.log('Sync storage used:', bytes, '/ 102400 bytes');
});

chrome.storage.local.getBytesInUse(null, (bytes) => {
  console.log('Local storage used:', bytes);
});
```

**Test data exposure:**
1. Open DevTools > Application > Storage
2. Check chrome.storage.sync - Is sensitive data exposed?
3. Check chrome.storage.local - Is it properly scoped?

### E. Content Script Isolation Testing

**Test if extension can be manipulated by malicious pages:**
```html
<!-- Create test.html with this content -->
<script>
// Try to access extension internals
window.postMessage({action: 'settingsUpdated'}, '*');

// Try to trigger extension functions
document.dispatchEvent(new CustomEvent('farsi-root-highlight'));

// Try to read extension data
console.log(document.querySelector('.farsi-root-tooltip'));
</script>
```

### F. Permission Scope Testing

**Review manifest.json permissions:**
- Are we requesting minimum necessary permissions?
- Can we reduce `<all_urls>` scope?
- Do we need all the permissions we're requesting?

## 3. Specific Vulnerability Checks

### Check 1: innerHTML Usage (XSS Risk)
```bash
# Search for dangerous innerHTML usage
grep -rn "innerHTML" content/ utils/ options/ popup/

# Verify all innerHTML usage is escaped
```

### Check 2: eval() Usage (Code Injection)
```bash
# Should return NO results
grep -rn "eval(" content/ utils/ options/ popup/ background/
grep -rn "Function(" content/ utils/ options/ popup/ background/
```

### Check 3: URL Validation
```bash
# Check for user-controlled URLs
grep -rn "chrome.tabs.create" popup/ options/
grep -rn "window.open" content/ popup/ options/
```

### Check 4: Message Handler Security
```bash
# Check message handlers validate sender
grep -rn "chrome.runtime.onMessage" content/ background/
```

### Check 5: CSP Compliance
```bash
# Verify no inline scripts or styles in HTML files
grep -rn "onclick=" options/ popup/
grep -rn "onload=" options/ popup/
grep -rn "style=" options/ popup/ content/
grep -rn "<script>" options/ popup/
```

## 4. Penetration Testing Checklist

### Input Validation
- [ ] All user inputs are validated
- [ ] Special characters are escaped
- [ ] Maximum length limits enforced
- [ ] Type checking on all inputs

### Output Encoding
- [ ] All dynamic content is escaped before display
- [ ] HTML entities encoded in tooltips
- [ ] No direct innerHTML with user data
- [ ] JSON.parse wrapped in try-catch

### Storage Security
- [ ] No sensitive data in chrome.storage.sync
- [ ] Storage data validated before use
- [ ] No localStorage/sessionStorage usage
- [ ] Import/export validates data structure

### Message Passing
- [ ] chrome.runtime.onMessage validates sender
- [ ] No eval() of message content
- [ ] Message handlers check origin
- [ ] Tab messages don't trust content

### DOM Security
- [ ] No document.write usage
- [ ] createElement + textContent (not innerHTML)
- [ ] Event listeners (not inline handlers)
- [ ] DOMPurify for any HTML rendering

## 5. Real-World Attack Scenarios

### Scenario 1: Malicious Website Exploitation
**Setup:**
1. Create a malicious webpage
2. Try to trigger extension functionality
3. Attempt to read extension data
4. Try to inject code into tooltips

### Scenario 2: Malicious Dictionary Import
**Setup:**
1. Create JSON with XSS payload
2. Import through options page
3. Check if script executes
4. Verify escaping works

### Scenario 3: Prototype Pollution
**Setup:**
1. Import JSON with `__proto__`
2. Check if Object.prototype is polluted
3. Test for RCE through prototype chain

### Scenario 4: Storage Manipulation
**Setup:**
1. Manually modify chrome.storage via DevTools
2. Add malicious data
3. Reload extension
4. Check if malicious data executes

## 6. Recommended Tools

### Browser Extensions
- **Chrome DevTools Security Panel**
- **OWASP ZAP** - Web application security scanner
- **Burp Suite** - Intercept extension requests

### Static Analysis
- **SonarQube** - Code quality & security
- **Snyk** - Dependency vulnerability scanning
- **npm audit** - Check for known vulnerabilities

### Manual Testing
- **Postman** - Test chrome.runtime message passing
- **curl** - Test external API calls
- **Browser DevTools** - Monitor network, storage, console

## 7. Continuous Security

### Pre-commit Checks
```bash
# Create pre-commit hook
cat > .git/hooks/pre-commit << 'EOF'
#!/bin/bash

# Run ESLint security checks
npx eslint content/ utils/ options/ popup/ background/

# Check for dangerous patterns
if grep -rn "innerHTML\s*=" content/ utils/ options/ popup/; then
    echo "Warning: innerHTML usage detected"
    exit 1
fi

if grep -rn "eval(" content/ utils/ options/ popup/ background/; then
    echo "Error: eval() usage detected"
    exit 1
fi

echo "Security checks passed"
EOF

chmod +x .git/hooks/pre-commit
```

### Regular Audits
- [ ] Monthly: Review permissions in manifest.json
- [ ] Monthly: Scan with ESLint security plugins
- [ ] Quarterly: Manual penetration testing
- [ ] Annually: Professional security audit

## 8. Current Vulnerabilities Found

Run this script to identify potential issues:
```bash
#!/bin/bash

echo "=== Scanning for Security Issues ==="

echo -e "\n1. Checking for innerHTML usage..."
grep -rn "innerHTML" content/ utils/ options/ popup/ 2>/dev/null | grep -v "//.*innerHTML" || echo "   ✓ No innerHTML found"

echo -e "\n2. Checking for eval() usage..."
grep -rn "eval(" content/ utils/ options/ popup/ background/ 2>/dev/null || echo "   ✓ No eval() found"

echo -e "\n3. Checking for inline event handlers..."
grep -rn "onclick=" options/ popup/ 2>/dev/null || echo "   ✓ No inline handlers found"

echo -e "\n4. Checking for unsafe regex..."
grep -rn "new RegExp(" content/ utils/ 2>/dev/null | head -5

echo -e "\n5. Checking for direct DOM manipulation..."
grep -rn "document.write" content/ utils/ options/ popup/ 2>/dev/null || echo "   ✓ No document.write found"

echo -e "\n6. Checking for localStorage usage..."
grep -rn "localStorage" content/ utils/ options/ popup/ background/ 2>/dev/null || echo "   ✓ No localStorage found"

echo -e "\n=== Scan Complete ==="
```

## 9. Security Best Practices (Current Status)

✅ **Good:**
- Using Manifest V3
- No eval() usage
- Event listeners instead of inline handlers
- Chrome storage API (not localStorage)
- Content Security Policy in manifest
- No external dependencies

⚠️ **Needs Review:**
- innerHTML usage in tooltips/popups (verify escaping)
- User input validation in custom dictionary
- Import/export JSON validation
- chrome.runtime.onMessage sender validation
- Storage quota handling

## 10. Quick Security Test Commands

```bash
# Run all security checks
cd /home/user/lang-ext

# 1. Check for common vulnerabilities
./security-scan.sh

# 2. Test XSS in custom dictionary
# (Manual: Add <script>alert('XSS')</script> to custom word)

# 3. Test JSON import
# (Manual: Try importing malicious JSON)

# 4. Check permissions
cat manifest.json | jq '.permissions, .host_permissions'

# 5. Check storage usage
# (Manual: Open DevTools > Application > Storage)
```

Would you like me to create automated test scripts for any of these specific vulnerability checks?
