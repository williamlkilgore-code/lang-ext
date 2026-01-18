# Farsi Root Word Learner

A browser extension that helps you learn Persian/Farsi by identifying and explaining Arabic root words and their derivatives as you browse the web.

## Features

- **Automatic Detection**: Detects Persian/Farsi content on web pages automatically
- **Intelligent Highlighting**: Subtly underlines words derived from Arabic roots
- **Interactive Tooltips**: Hover over highlighted words to see:
  - The Arabic root (in both Persian and Latin script)
  - Root meaning
  - Word definition
  - Part of speech
  - Semantic category
- **171 Arabic Roots**: Comprehensive dictionary with 171 common Arabic roots and 674 derivative words
- **Cross-Browser Support**: Works on Chrome, Firefox, and other Chromium-based browsers
- **Offline Ready**: All dictionary data is embedded, no internet connection required after installation
- **Beautiful UI**: Modern, responsive design with dark mode support

## Installation

### For Development

1. Clone this repository:
   ```bash
   git clone https://github.com/williamlkilgore-code/lang-ext.git
   cd lang-ext
   ```

2. **Chrome/Edge/Brave**:
   - Open `chrome://extensions/`
   - Enable "Developer mode"
   - Click "Load unpacked"
   - Select the `lang-ext` folder

3. **Firefox**:
   - Open `about:debugging#/runtime/this-firefox`
   - Click "Load Temporary Add-on"
   - Select the `manifest.json` file from the `lang-ext` folder

### For Production

*Coming soon to Chrome Web Store and Firefox Add-ons*

## Usage

1. **Automatic Mode** (Default):
   - Simply browse any website with Persian content
   - The extension automatically detects Persian text and highlights root words
   - Hover over underlined words to see detailed information

2. **Settings**:
   - Click the extension icon to open the popup
   - Toggle highlighting on/off
   - Enable/disable auto-detection
   - Change highlight color
   - View dictionary statistics

3. **Testing**:
   - Open `test.html` or `test-expanded.html` in your browser to see the extension in action
   - The test pages contain sample Persian text with various root words
   - `test-expanded.html` includes examples from all 171 roots

## Project Structure

```
lang-ext/
├── manifest.json              # Extension manifest (Manifest V3)
├── data/
│   └── farsi-roots.json      # Dictionary of 171 Arabic roots and 674 derivatives
├── content/
│   ├── content.js            # Main content script
│   └── content.css           # Highlighting and tooltip styles
├── utils/
│   ├── language-detector.js  # Persian content detection
│   └── persian-matcher.js    # Word matching algorithm
├── popup/
│   ├── popup.html            # Extension popup UI
│   ├── popup.css             # Popup styles
│   └── popup.js              # Popup functionality
├── background/
│   └── background.js         # Service worker (background script)
├── icons/
│   ├── icon.svg              # Source icon (scalable)
│   ├── icon16.png            # 16x16 toolbar icon
│   ├── icon48.png            # 48x48 extension page icon
│   └── icon128.png           # 128x128 store icon
└── test.html                 # Test page with Persian content
```

## Dictionary Format

The dictionary (`data/farsi-roots.json`) follows this structure:

```json
{
  "version": "2.0.0",
  "language": "farsi",
  "description": "Comprehensive Arabic roots found in Persian/Farsi",
  "roots": [
    {
      "id": 1,
      "root": "ک-ت-ب",
      "rootLatin": "k-t-b",
      "meaning": "to write",
      "category": "writing",
      "derivatives": [
        {
          "word": "کتاب",
          "latin": "ketâb",
          "meaning": "book",
          "pos": "noun"
        }
      ]
    }
  ]
}
```

## Dictionary Sources

The current version includes 171 roots from multiple sources:

1. **Original Curated Roots** (35 roots): Carefully selected foundational Arabic roots
2. **Conversational Persian** (150 roots): Common roots used in everyday conversation
3. **News Persian** (150 roots): Roots frequently found in news media

The dictionary includes roots across 23 semantic categories with 674 total derivative words.

### Expanding Further

To continue expanding the dictionary:

1. Add more root entries to `data/farsi-roots.json`
2. Follow the established JSON structure
3. Include common derivatives for each root
4. Categorize roots semantically

### Suggested Categories
- Education & Learning
- Writing & Literature
- Communication & Speech
- Action & Work
- Religion & Spirituality
- Science & Knowledge
- Time & Place
- Social & Family
- Nature & World
- Abstract Concepts

## Multi-Language Support Framework

The extension is designed with multi-language support in mind:

1. **Modular Structure**: Language-specific logic is separated into utility modules
2. **JSON-Based Dictionaries**: Easy to add new language dictionaries
3. **Extensible Matching**: Pattern matching algorithms can be adapted for other languages
4. **Language Detection**: Built-in language detection can be extended

### Adding a New Language

1. Create a new dictionary file: `data/[language]-roots.json`
2. Update `manifest.json` to include the new dictionary
3. Extend `language-detector.js` to detect the new language
4. Adapt `persian-matcher.js` or create a new matcher for language-specific patterns
5. Update the popup to allow language selection

## Technical Details

### Browser Compatibility
- **Manifest Version**: V3 (latest standard)
- **Chrome**: 88+
- **Firefox**: 89+
- **Edge**: 88+

### Permissions
- `storage`: Save user settings
- `activeTab`: Access current tab for content analysis
- `host_permissions`: Required to inject content scripts

### Performance
- Lightweight: ~100KB total size
- Fast initialization: <100ms on average
- Efficient matching: Uses Map-based lookup for O(1) word matching
- Lazy loading: Only activates on pages with Persian content

## Privacy

- **No Data Collection**: The extension does not collect or transmit any user data
- **Offline First**: All processing happens locally in your browser
- **No Tracking**: No analytics or tracking scripts
- **Open Source**: Full source code available for inspection

## Development

### Prerequisites
- Basic understanding of JavaScript and Web Extensions API
- A modern web browser (Chrome/Firefox)
- Text editor or IDE

### Testing
1. Make changes to the code
2. Reload the extension in your browser
3. Open or refresh `test.html` to see changes
4. Check the browser console for debug logs

### Debugging
- Open browser DevTools (F12)
- For content script: Inspect the web page
- For popup: Right-click extension icon → "Inspect popup"
- For background: Go to `chrome://extensions/` → Click "Inspect views: service worker"

## Contributing

Contributions are welcome! Here are some ways to help:

1. **Expand the Dictionary**: Add more Arabic roots and derivatives
2. **Improve Matching**: Enhance the word matching algorithm
3. **Add Languages**: Implement support for other languages
4. **UI/UX**: Improve the design and user experience
5. **Bug Fixes**: Report and fix issues
6. **Documentation**: Improve docs and add examples

## Roadmap

- [x] Expand dictionary beyond initial 35 roots (now at 171 roots with 674 derivatives)
- [ ] Continue expanding toward 500+ roots
- [ ] Add user-customizable dictionary
- [ ] Implement word frequency statistics
- [ ] Add learning progress tracking
- [ ] Support for more languages (Arabic, Urdu, etc.)
- [ ] Flashcard system for vocabulary learning
- [ ] Export learning data
- [ ] Mobile browser support

## License

MIT License - See LICENSE file for details

## Credits

- Developed as a language learning tool for Persian/Farsi learners
- Inspired by the rich linguistic heritage of Persian language
- Built with modern web extension standards

## Support

For issues, questions, or suggestions:
- GitHub Issues: https://github.com/williamlkilgore-code/lang-ext/issues
- Documentation: This README

## Acknowledgments

- Arabic root system: Traditional Arabic morphology
- Persian language: Rich cultural and linguistic tradition
- Open source community: For tools and inspiration
