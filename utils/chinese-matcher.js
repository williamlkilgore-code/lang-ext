/**
 * Chinese Character Matcher
 * Matches Chinese characters/words against HSK dictionary
 */

class ChineseMatcher {
  constructor() {
    this.dictionaryData = null;
    this.wordMap = new Map(); // Map of character/word -> word info
    this.characterMap = new Map(); // Map of single characters -> word info
  }

  /**
   * Load and initialize the HSK dictionary
   * @param {Object} dictionaryData - Dictionary data from chinese-hsk.json
   */
  async initialize(dictionaryData) {
    this.dictionaryData = dictionaryData;
    this.buildWordMaps();
  }

  /**
   * Build lookup maps for fast matching
   */
  buildWordMaps() {
    if (!this.dictionaryData || !this.dictionaryData.words) return;

    this.wordMap.clear();
    this.characterMap.clear();

    this.dictionaryData.words.forEach(word => {
      const char = word.character;

      // Map for multi-character words and compounds
      this.wordMap.set(char, {
        character: word.character,
        traditional: word.traditional,
        pinyin: word.pinyin,
        meaning: word.meaning,
        pos: word.pos,
        radical: word.radical,
        radicalMeaning: word.radicalMeaning,
        hskLevel: word.hskLevel,
        frequency: word.frequency
      });

      // Also map individual characters for quick lookup
      for (const singleChar of char) {
        if (/[\u4E00-\u9FFF]/.test(singleChar)) {
          if (!this.characterMap.has(singleChar)) {
            this.characterMap.set(singleChar, []);
          }
          this.characterMap.get(singleChar).push(this.wordMap.get(char));
        }
      }
    });
  }

  /**
   * Extract Chinese words from text with greedy longest-match algorithm
   * @param {string} text - Text to analyze
   * @returns {Array<Object>} Array of word matches with positions
   */
  extractWords(text) {
    const matches = [];
    let i = 0;

    while (i < text.length) {
      let matched = false;
      let maxLength = Math.min(4, text.length - i); // Max word length of 4 characters

      // Try to match longest word first
      for (let len = maxLength; len >= 1; len--) {
        const substring = text.substring(i, i + len);

        // Check if this substring is in our dictionary
        if (this.wordMap.has(substring)) {
          const wordInfo = this.wordMap.get(substring);

          matches.push({
            word: substring,
            start: i,
            end: i + len,
            wordInfo: wordInfo
          });

          i += len;
          matched = true;
          break;
        }
      }

      if (!matched) {
        i++;
      }
    }

    return matches;
  }

  /**
   * Match a single word/character against the dictionary
   * @param {string} word - Chinese word or character to match
   * @returns {Object|null} Word info if found, null otherwise
   */
  matchWord(word) {
    return this.wordMap.get(word) || null;
  }

  /**
   * Find all dictionary entries containing a specific character
   * @param {string} char - Single Chinese character
   * @returns {Array<Object>} Array of word entries containing this character
   */
  findByCharacter(char) {
    return this.characterMap.get(char) || [];
  }

  /**
   * Find words by HSK level
   * @param {number} level - HSK level (1-6)
   * @returns {Array<Object>} Array of words at this level
   */
  getWordsByLevel(level) {
    if (!this.dictionaryData) return [];
    return this.dictionaryData.words.filter(w => w.hskLevel === level);
  }

  /**
   * Find words by radical
   * @param {string} radical - Chinese radical character
   * @returns {Array<Object>} Array of words with this radical
   */
  getWordsByRadical(radical) {
    if (!this.dictionaryData) return [];
    return this.dictionaryData.words.filter(w => w.radical === radical);
  }

  /**
   * Get all radicals in the dictionary
   * @returns {Array<Object>} Array of radical objects
   */
  getAllRadicals() {
    return this.dictionaryData ? this.dictionaryData.radicals : [];
  }

  /**
   * Get statistics about the dictionary
   * @returns {Object}
   */
  getStats() {
    if (!this.dictionaryData) {
      return {
        totalWords: 0,
        totalRadicals: 0,
        levels: {},
        version: 'N/A'
      };
    }

    const levelCounts = {};
    [1, 2, 3, 4, 5, 6].forEach(level => {
      const count = this.dictionaryData.words.filter(w => w.hskLevel === level).length;
      if (count > 0) {
        levelCounts[`HSK ${level}`] = count;
      }
    });

    return {
      totalWords: this.dictionaryData.totalWords,
      totalRadicals: this.dictionaryData.totalRadicals,
      levels: levelCounts,
      version: this.dictionaryData.version,
      variant: this.dictionaryData.variant
    };
  }
}

// Export for use in content script
if (typeof module !== 'undefined' && module.exports) {
  module.exports = ChineseMatcher;
}
