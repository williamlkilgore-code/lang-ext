/**
 * Persian Word Matcher
 * Matches Persian words against Arabic root dictionary
 */

class PersianMatcher {
  constructor() {
    this.rootsData = null;
    this.wordMap = new Map(); // Map of word -> root info for fast lookup
    this.vocabularyManager = null;
    this.settings = null;
    this.masteredWords = new Set();
    this.customWords = [];
  }

  /**
   * Load and initialize the roots dictionary
   * @param {Object} rootsData - Dictionary data from farsi-roots.json
   */
  async initialize(rootsData, vocabularyManager = null, settings = null) {
    this.rootsData = rootsData;
    this.vocabularyManager = vocabularyManager;
    this.settings = settings;

    // Load mastered words and custom dictionary
    if (vocabularyManager) {
      await this.loadCustomVocabulary();
    }

    this.buildWordMap();
  }

  /**
   * Load custom vocabulary (mastered words and user dictionary)
   */
  async loadCustomVocabulary() {
    if (!this.vocabularyManager) return;

    // Load mastered words
    const mastered = await this.vocabularyManager.getMasteredWords('persian');
    this.masteredWords = new Set(mastered.map(w => this.normalizeWord(w)));

    // Load custom dictionary
    this.customWords = await this.vocabularyManager.getUserDictionary('persian');

    console.log(`Persian Matcher: Loaded ${mastered.length} mastered words, ${this.customWords.length} custom words`);
  }

  /**
   * Reload custom vocabulary (call after updates)
   */
  async reloadCustomVocabulary() {
    await this.loadCustomVocabulary();
    this.buildWordMap(); // Rebuild to include custom words
  }

  /**
   * Build a lookup map for fast word matching
   */
  buildWordMap() {
    if (!this.rootsData || !this.rootsData.roots) return;

    this.wordMap.clear();

    // Add main dictionary words
    this.rootsData.roots.forEach(root => {
      root.derivatives.forEach(derivative => {
        // Store both the exact word and variations
        const normalizedWord = this.normalizeWord(derivative.word);

        this.wordMap.set(normalizedWord, {
          root: root.root,
          rootLatin: root.rootLatin,
          rootMeaning: root.meaning,
          category: root.category,
          word: derivative.word,
          wordLatin: derivative.latin,
          wordMeaning: derivative.meaning,
          pos: derivative.pos,
          isCustom: false
        });

        // Also add the original word in case normalization changes it
        if (derivative.word !== normalizedWord) {
          this.wordMap.set(derivative.word, this.wordMap.get(normalizedWord));
        }
      });
    });

    // Add custom dictionary words
    if (this.settings && this.settings.showCustomWords && this.customWords.length > 0) {
      this.customWords.forEach(customWord => {
        const normalizedWord = this.normalizeWord(customWord.word);

        this.wordMap.set(normalizedWord, {
          root: customWord.root || '',
          rootLatin: customWord.rootLatin || '',
          rootMeaning: customWord.rootMeaning || 'custom',
          category: customWord.category || 'custom',
          word: customWord.word,
          wordLatin: '',
          wordMeaning: customWord.wordMeaning || 'custom word',
          pos: customWord.pos || 'noun',
          isCustom: true
        });

        if (customWord.word !== normalizedWord) {
          this.wordMap.set(customWord.word, this.wordMap.get(normalizedWord));
        }
      });
    }
  }

  /**
   * Normalize Persian word for matching
   * Handles different forms of the same character
   * @param {string} word - Persian word
   * @returns {string} Normalized word
   */
  normalizeWord(word) {
    return word
      .trim()
      // Normalize different forms of Arabic letters
      .replace(/ي/g, 'ی')  // Arabic ya to Persian ye
      .replace(/ك/g, 'ک')  // Arabic kaf to Persian kaf
      .replace(/ۀ/g, 'ه')  // Heh with hamza to regular heh
      // Remove zero-width characters
      .replace(/[\u200C\u200D]/g, ''); // Remove ZWNJ and ZWJ
  }

  /**
   * Extract Persian words from text
   * @param {string} text - Text to analyze
   * @returns {Array<Object>} Array of word matches with positions
   */
  extractWords(text) {
    // Persian word pattern: consecutive Persian letters
    const wordRegex = /[\u0600-\u06FF]+/g;
    const words = [];
    let match;

    while ((match = wordRegex.exec(text)) !== null) {
      const word = match[0];
      const normalizedWord = this.normalizeWord(word);

      // Skip mastered words if setting is enabled
      if (this.settings && this.settings.hideMasteredWords && this.masteredWords.has(normalizedWord)) {
        continue;
      }

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

  /**
   * Match a single word against the dictionary
   * @param {string} word - Persian word to match
   * @returns {Object|null} Root info if found, null otherwise
   */
  matchWord(word) {
    const normalizedWord = this.normalizeWord(word);
    return this.wordMap.get(normalizedWord) || null;
  }

  /**
   * Get all roots in the dictionary
   * @returns {Array<Object>}
   */
  getAllRoots() {
    return this.rootsData ? this.rootsData.roots : [];
  }

  /**
   * Search roots by category
   * @param {string} category - Category name
   * @returns {Array<Object>}
   */
  getRootsByCategory(category) {
    if (!this.rootsData) return [];
    return this.rootsData.roots.filter(root => root.category === category);
  }

  /**
   * Get statistics about the dictionary
   * @returns {Object}
   */
  getStats() {
    if (!this.rootsData) {
      return { totalRoots: 0, totalWords: 0, categories: [] };
    }

    const categories = new Set();
    let totalWords = 0;

    this.rootsData.roots.forEach(root => {
      categories.add(root.category);
      totalWords += root.derivatives.length;
    });

    return {
      totalRoots: this.rootsData.roots.length,
      totalWords: totalWords,
      categories: Array.from(categories),
      version: this.rootsData.version
    };
  }
}

// Export for use in content script
if (typeof module !== 'undefined' && module.exports) {
  module.exports = PersianMatcher;
}
