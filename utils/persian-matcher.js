/**
 * Persian Word Matcher
 * Matches Persian words against Arabic root dictionary
 */

class PersianMatcher {
  constructor() {
    this.rootsData = null;
    this.wordMap = new Map(); // Map of word -> root info for fast lookup
  }

  /**
   * Load and initialize the roots dictionary
   * @param {Object} rootsData - Dictionary data from farsi-roots.json
   */
  async initialize(rootsData) {
    this.rootsData = rootsData;
    this.buildWordMap();
  }

  /**
   * Build a lookup map for fast word matching
   */
  buildWordMap() {
    if (!this.rootsData || !this.rootsData.roots) return;

    this.wordMap.clear();

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
          pos: derivative.pos
        });

        // Also add the original word in case normalization changes it
        if (derivative.word !== normalizedWord) {
          this.wordMap.set(derivative.word, this.wordMap.get(normalizedWord));
        }
      });
    });
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
