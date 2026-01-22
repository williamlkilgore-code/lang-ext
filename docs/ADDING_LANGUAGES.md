# Adding Support for New Languages

This guide explains how to extend the Farsi Root Word Learner extension to support additional languages.

## Overview

The extension architecture is designed to be language-agnostic. The main components that need to be adapted for each language are:

1. **Dictionary Data** - Root words and derivatives
2. **Language Detection** - Identifying the target language in web pages
3. **Word Matching** - Language-specific pattern matching
4. **UI Updates** - Language selection and display

## Step-by-Step Guide

### 1. Create the Dictionary File

Create a new JSON file in the `data/` directory:

```
data/
├── farsi-roots.json
└── [your-language]-roots.json
```

**Example for Arabic:**

```json
{
  "version": "1.0.0",
  "language": "arabic",
  "description": "Common Arabic root words",
  "roots": [
    {
      "id": 1,
      "root": "ك-ت-ب",
      "rootLatin": "k-t-b",
      "meaning": "to write",
      "category": "writing",
      "derivatives": [
        {
          "word": "كتاب",
          "latin": "kitāb",
          "meaning": "book",
          "pos": "noun"
        },
        {
          "word": "كاتب",
          "latin": "kātib",
          "meaning": "writer",
          "pos": "noun"
        },
        {
          "word": "مكتوب",
          "latin": "maktūb",
          "meaning": "written",
          "pos": "adjective"
        }
      ]
    }
  ]
}
```

### 2. Extend Language Detection

Update `utils/language-detector.js` to detect your language:

```javascript
class LanguageDetector {
  constructor() {
    // Existing Persian detection
    this.persianRegex = /[\u0600-\u06FF]/;

    // Add your language
    // Example for Arabic:
    this.arabicRegex = /[\u0600-\u06FF]/;

    // Example for Hebrew:
    this.hebrewRegex = /[\u0590-\u05FF]/;

    // Example for Urdu (uses extended Arabic script):
    this.urduRegex = /[\u0600-\u06FF\u0750-\u077F]/;
  }

  detectLanguage(text) {
    const languages = [];

    if (this.persianRegex.test(text)) languages.push('farsi');
    if (this.arabicRegex.test(text)) languages.push('arabic');
    if (this.hebrewRegex.test(text)) languages.push('hebrew');
    if (this.urduRegex.test(text)) languages.push('urdu');

    return languages;
  }

  // Add language-specific detection methods
  isArabic(text) {
    // Add Arabic-specific detection logic
    // Check for Arabic-specific characters, diacritics, etc.
    return this.arabicRegex.test(text);
  }
}
```

### 3. Create Language-Specific Matcher

Create a new matcher file in `utils/`:

```
utils/
├── language-detector.js
├── persian-matcher.js
└── arabic-matcher.js  (new)
```

**Example `utils/arabic-matcher.js`:**

```javascript
class ArabicMatcher {
  constructor() {
    this.rootsData = null;
    this.wordMap = new Map();
  }

  async initialize(rootsData) {
    this.rootsData = rootsData;
    this.buildWordMap();
  }

  normalizeWord(word) {
    return word
      .trim()
      // Arabic-specific normalization
      .replace(/[ًٌٍَُِّْ]/g, '') // Remove diacritics
      .replace(/أ|إ|آ/g, 'ا')      // Normalize alef variants
      .replace(/ة/g, 'ه')          // Teh marbuta to heh
      .replace(/ى/g, 'ي');         // Alef maksura to ya
  }

  extractWords(text) {
    const wordRegex = /[\u0600-\u06FF]+/g;
    const words = [];
    let match;

    while ((match = wordRegex.exec(text)) !== null) {
      const word = match[0];
      const normalizedWord = this.normalizeWord(word);
      const rootInfo = this.wordMap.get(normalizedWord);

      if (rootInfo) {
        words.push({
          word: word,
          normalizedWord: normalizedWord,
          start: match.index,
          end: match.index + word.length,
          rootInfo: rootInfo
        });
      }
    }

    return words;
  }

  buildWordMap() {
    if (!this.rootsData || !this.rootsData.roots) return;

    this.wordMap.clear();

    this.rootsData.roots.forEach(root => {
      root.derivatives.forEach(derivative => {
        const normalizedWord = this.normalizeWord(derivative.word);

        this.wordMap.set(normalizedWord, {
          root: root.root,
          rootLatin: root.rootLatin,
          rootMeaning: root.meaning,
          category: root.category,
          word: derivative.word,
          wordLatin: derivative.latin,
          wordMeaning: derivative.meaning,
          pos: derivative.pos
        });
      });
    });
  }

  matchWord(word) {
    const normalizedWord = this.normalizeWord(word);
    return this.wordMap.get(normalizedWord) || null;
  }
}
```

### 4. Update Content Script

Modify `content/content.js` to support multiple languages:

```javascript
(async function() {
  'use strict';

  const detector = new LanguageDetector();
  let currentLanguage = null;
  let matcher = null;

  async function initializeLanguage() {
    // Detect page language
    const languages = detector.detectLanguage(document.body.textContent);

    if (languages.length === 0) {
      console.log('No supported language detected');
      return false;
    }

    // Use first detected language
    currentLanguage = languages[0];
    console.log('Detected language:', currentLanguage);

    // Load appropriate dictionary and matcher
    try {
      const dictUrl = chrome.runtime.getURL(`data/${currentLanguage}-roots.json`);
      const response = await fetch(dictUrl);
      const data = await response.json();

      // Initialize appropriate matcher
      switch(currentLanguage) {
        case 'farsi':
          matcher = new PersianMatcher();
          break;
        case 'arabic':
          matcher = new ArabicMatcher();
          break;
        // Add more languages here
      }

      await matcher.initialize(data);
      return true;
    } catch (error) {
      console.error('Failed to initialize language:', error);
      return false;
    }
  }

  // Rest of content script...
})();
```

### 5. Update Manifest

Add new dictionary files to `manifest.json`:

```json
{
  "web_accessible_resources": [
    {
      "resources": [
        "data/farsi-roots.json",
        "data/arabic-roots.json",
        "data/urdu-roots.json"
      ],
      "matches": ["<all_urls>"]
    }
  ],
  "content_scripts": [
    {
      "matches": ["<all_urls>"],
      "js": [
        "utils/language-detector.js",
        "utils/persian-matcher.js",
        "utils/arabic-matcher.js",
        "content/content.js"
      ],
      "css": ["content/content.css"],
      "run_at": "document_idle"
    }
  ]
}
```

### 6. Add UI for Language Selection

Update `popup/popup.html` to include language selection:

```html
<div class="setting-item">
  <label for="language">Language</label>
  <select id="language">
    <option value="auto">Auto-detect</option>
    <option value="farsi">Persian/Farsi</option>
    <option value="arabic">Arabic</option>
    <option value="urdu">Urdu</option>
  </select>
</div>
```

And `popup/popup.js`:

```javascript
async function loadSettings() {
  const settings = await chrome.storage.sync.get({
    language: 'auto',
    enableExtension: true,
    // ... other settings
  });

  document.getElementById('language').value = settings.language;
  // ... load other settings
}
```

## Language-Specific Considerations

### Right-to-Left (RTL) Languages

For RTL languages (Arabic, Farsi, Hebrew, Urdu):

```css
/* In content.css */
.farsi-root-tooltip[dir="rtl"] {
  direction: rtl;
  text-align: right;
}

.tooltip-root {
  direction: rtl;
  font-family: 'Traditional Arabic', 'Arial Unicode MS', sans-serif;
}
```

### Script-Specific Fonts

Ensure proper font support:

```css
/* Persian/Farsi */
.lang-farsi {
  font-family: 'Iranian Sans', 'Tahoma', sans-serif;
}

/* Arabic */
.lang-arabic {
  font-family: 'Traditional Arabic', 'Arabic Typesetting', sans-serif;
}

/* Hebrew */
.lang-hebrew {
  font-family: 'David', 'Arial Hebrew', sans-serif;
}
```

### Character Normalization

Each language may require specific normalization:

**Arabic:**
- Remove diacritics (tashkeel)
- Normalize alef variants
- Handle hamza forms
- Teh marbuta vs. heh

**Hebrew:**
- Handle final forms (ך, ם, ן, ף, ץ)
- Niqqud (vowel marks) removal
- Shin/sin dot handling

**Urdu:**
- Extended Arabic characters
- Urdu-specific diacritics
- Nastaliq script considerations

### Unicode Ranges

Common script ranges:

```javascript
const UNICODE_RANGES = {
  arabic: /[\u0600-\u06FF]/,
  persian: /[\u0600-\u06FF]/,  // Shares with Arabic
  urdu: /[\u0600-\u06FF\u0750-\u077F]/,
  hebrew: /[\u0590-\u05FF]/,
  syriac: /[\u0700-\u074F]/,
  nko: /[\u07C0-\u07FF]/,
  devanagari: /[\u0900-\u097F]/,  // Hindi, Sanskrit
  bengali: /[\u0980-\u09FF]/,
  thai: /[\u0E00-\u0E7F]/,
};
```

## Testing Your Language Addition

1. **Create test file:**
   ```
   test-arabic.html
   ```

2. **Add sample text:**
   ```html
   <!DOCTYPE html>
   <html lang="ar" dir="rtl">
   <body>
     <p>هذا كتاب عن العلم والمعرفة</p>
   </body>
   </html>
   ```

3. **Test checklist:**
   - [ ] Language is detected correctly
   - [ ] Words are highlighted
   - [ ] Tooltips display properly
   - [ ] RTL text flows correctly
   - [ ] Fonts render properly
   - [ ] All word derivatives are matched

## Performance Considerations

- Keep dictionary size reasonable (500-1000 roots max)
- Use Map for O(1) word lookup
- Lazy-load dictionaries only when needed
- Cache normalized forms
- Optimize regex patterns

## Example: Adding Urdu Support

Complete example for Urdu:

1. **Create `data/urdu-roots.json`**
2. **Create `utils/urdu-matcher.js`** with Urdu-specific normalization
3. **Update language detector** with Urdu Unicode range
4. **Add Urdu font support** in CSS
5. **Test with Urdu websites**

```javascript
// Urdu-specific normalization
normalizeWord(word) {
  return word
    .trim()
    .replace(/[ًٌٍَُِّْ]/g, '')  // Remove diacritics
    .replace(/ھ/g, 'ہ')          // Normalize heh variants
    .replace(/ۂ/g, 'ہ')          // Heh with hamza
    .replace(/ى/g, 'ی')          // Normalize ye
    .replace(/ئ/g, 'ی')          // Hamza on ye
    .replace(/ؤ/g, 'و')          // Hamza on waw
    .replace(/أ|إ|آ/g, 'ا');     // Normalize alef
}
```

## Contributing

When adding a new language:

1. Follow the structure above
2. Include at least 50 root words initially
3. Test thoroughly
4. Document language-specific quirks
5. Provide sample test pages
6. Submit a pull request with all components

## Resources

- **Unicode Charts**: https://unicode.org/charts/
- **Script Databases**: https://scriptsource.org/
- **Language References**: Consult native speakers and linguistic resources

## Questions?

Open an issue with the tag `language-support` if you need help adding a new language.
