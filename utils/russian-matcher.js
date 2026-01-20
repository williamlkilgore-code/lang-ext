/**
 * Russian Word Matcher
 * Matches Russian words against root dictionary
 */

class RussianMatcher {
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
   * @param {Object} rootsData - Dictionary data from russian-roots.json
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
    console.log(`Russian Matcher: Initialized with ${this.wordMap.size} words from ${this.rootsData?.roots?.length || 0} roots`);
  }

  /**
   * Load custom vocabulary (mastered words and user dictionary)
   */
  async loadCustomVocabulary() {
    if (!this.vocabularyManager) return;

    // Load mastered words
    const mastered = await this.vocabularyManager.getMasteredWords('russian');
    this.masteredWords = new Set(mastered.map(w => this.normalizeWord(w)));

    // Load custom dictionary
    this.customWords = await this.vocabularyManager.getUserDictionary('russian');

    console.log(`Russian Matcher: Loaded ${mastered.length} mastered words, ${this.customWords.length} custom words`);
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
        const normalizedWord = this.normalizeWord(derivative.word);

        this.wordMap.set(normalizedWord, {
          root: root.root,
          rootLatin: root.rootLatin || '',
          rootMeaning: root.rootMeaning || '',
          productivity: root.productivity || 0,
          word: derivative.word,
          wordMeaning: '', // We'll need to add translations later
          pos: derivative.pos || 'noun',
          frequencyRank: derivative.frequency_rank || 0,
          prefixes: root.commonPrefixes || [],
          suffixes: root.commonSuffixes || [],
          isCustom: false
        });

        // Also add the original word if normalization changed it
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
          rootMeaning: customWord.rootMeaning || '',
          productivity: 0,
          word: customWord.word,
          wordMeaning: customWord.wordMeaning || '',
          pos: customWord.pos || 'noun',
          frequencyRank: 0,
          prefixes: [],
          suffixes: [],
          isCustom: true
        });
      });
    }

    console.log(`Russian Matcher: Built word map with ${this.wordMap.size} entries`);
  }

  /**
   * Normalize a Russian word for matching
   * Converts to lowercase
   */
  normalizeWord(word) {
    if (!word) return '';
    return word.toLowerCase().trim();
  }

  /**
   * Match a single word against the dictionary
   * @param {string} word - The word to match
   * @returns {Object|null} - Root info if found, null otherwise
   */
  matchWord(word) {
    const normalized = this.normalizeWord(word);
    return this.wordMap.get(normalized) || null;
  }

  /**
   * Extract and match all Russian words from text
   * @param {string} text - Text to analyze
   * @returns {Array} - Array of matched word objects with position info
   */
  extractWords(text) {
    if (!text) return [];

    const words = [];
    // Russian word pattern: Cyrillic characters and hyphens
    const wordRegex = /[А-Яа-яЁё]+(?:-[А-Яа-яЁё]+)*/g;
    let match;

    while ((match = wordRegex.exec(text)) !== null) {
      const word = match[0];
      const normalizedWord = this.normalizeWord(word);

      // Skip if mastered and setting is enabled
      if (this.settings && this.settings.hideMasteredWords && this.masteredWords.has(normalizedWord)) {
        continue;
      }

      const wordInfo = this.matchWord(word);

      if (wordInfo) {
        words.push({
          word: word,
          wordInfo: wordInfo,
          startIndex: match.index,
          endIndex: match.index + word.length
        });
      }
    }

    return words;
  }

  /**
   * Check if text contains Russian characters
   * @param {string} text - Text to check
   * @returns {boolean} - True if text contains Russian
   */
  containsRussian(text) {
    return /[А-Яа-яЁё]/.test(text);
  }

  /**
   * Get statistics about the dictionary
   * @returns {Object} - Dictionary statistics
   */
  getStats() {
    return {
      totalRoots: this.rootsData?.roots?.length || 0,
      totalWords: this.wordMap.size,
      masteredWords: this.masteredWords.size,
      customWords: this.customWords.length
    };
  }
}
