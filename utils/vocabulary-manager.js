/**
 * Vocabulary Manager
 * Handles mastered words and user-curated custom dictionaries
 * Uses chrome.storage.local for unlimited storage
 */

class VocabularyManager {
  constructor() {
    this.cache = null;
  }

  /**
   * Get all custom vocabulary data
   */
  async getAll() {
    if (this.cache) return this.cache;

    return new Promise((resolve) => {
      if (typeof chrome !== 'undefined' && chrome.storage && chrome.storage.local) {
        chrome.storage.local.get(['masteredWords', 'userDictionary'], (result) => {
          const data = {
            masteredWords: result.masteredWords || { persian: [], chinese: [] },
            userDictionary: result.userDictionary || { persian: [], chinese: [] }
          };
          this.cache = data;
          resolve(data);
        });
      } else {
        // Fallback for testing
        const data = {
          masteredWords: { persian: [], chinese: [] },
          userDictionary: { persian: [], chinese: [] }
        };
        this.cache = data;
        resolve(data);
      }
    });
  }

  /**
   * Clear cache (call when data is modified)
   */
  clearCache() {
    this.cache = null;
  }

  /**
   * Save custom vocabulary data
   */
  async save(data) {
    this.clearCache();
    return new Promise((resolve) => {
      if (typeof chrome !== 'undefined' && chrome.storage && chrome.storage.local) {
        chrome.storage.local.set(data, () => {
          this.cache = null; // Clear cache
          resolve();
        });
      } else {
        resolve();
      }
    });
  }

  // ==================== MASTERED WORDS ====================

  /**
   * Get mastered words for a language
   */
  async getMasteredWords(language) {
    const data = await this.getAll();
    return data.masteredWords[language] || [];
  }

  /**
   * Check if a word is mastered
   */
  async isMastered(word, language) {
    const masteredWords = await this.getMasteredWords(language);
    return masteredWords.includes(word);
  }

  /**
   * Mark a word as mastered
   */
  async markAsMastered(word, language) {
    const data = await this.getAll();

    if (!data.masteredWords[language]) {
      data.masteredWords[language] = [];
    }

    // Add if not already mastered
    if (!data.masteredWords[language].includes(word)) {
      data.masteredWords[language].push(word);
      await this.save({ masteredWords: data.masteredWords });
      console.log(`Vocabulary Manager: Marked "${word}" as mastered (${language})`);
      return true;
    }
    return false;
  }

  /**
   * Unmark a word as mastered
   */
  async unmarkAsMastered(word, language) {
    const data = await this.getAll();

    if (data.masteredWords[language]) {
      const index = data.masteredWords[language].indexOf(word);
      if (index > -1) {
        data.masteredWords[language].splice(index, 1);
        await this.save({ masteredWords: data.masteredWords });
        console.log(`Vocabulary Manager: Unmarked "${word}" as mastered (${language})`);
        return true;
      }
    }
    return false;
  }

  /**
   * Clear all mastered words for a language
   */
  async clearMasteredWords(language) {
    const data = await this.getAll();
    data.masteredWords[language] = [];
    await this.save({ masteredWords: data.masteredWords });
    console.log(`Vocabulary Manager: Cleared all mastered words for ${language}`);
  }

  /**
   * Get mastered words count
   */
  async getMasteredCount(language) {
    const masteredWords = await this.getMasteredWords(language);
    return masteredWords.length;
  }

  // ==================== USER DICTIONARY ====================

  /**
   * Get user dictionary for a language
   */
  async getUserDictionary(language) {
    const data = await this.getAll();
    return data.userDictionary[language] || [];
  }

  /**
   * Add word to user dictionary
   */
  async addCustomWord(language, wordData) {
    const data = await this.getAll();

    if (!data.userDictionary[language]) {
      data.userDictionary[language] = [];
    }

    // Validate required fields based on language
    if (language === 'persian') {
      if (!wordData.word) {
        throw new Error('Persian word requires: word');
      }
      // Set defaults for optional fields
      wordData = {
        word: wordData.word,
        root: wordData.root || '',
        rootMeaning: wordData.rootMeaning || '',
        wordMeaning: wordData.wordMeaning || '',
        pos: wordData.pos || 'noun',
        category: wordData.category || '',
        rootLatin: wordData.rootLatin || '',
        id: Date.now()
      };
    } else if (language === 'chinese') {
      if (!wordData.character) {
        throw new Error('Chinese word requires: character');
      }
      // Set defaults for optional fields
      wordData = {
        character: wordData.character,
        pinyin: wordData.pinyin || '',
        meaning: wordData.meaning || '',
        pos: wordData.pos || 'noun',
        radical: wordData.radical || wordData.character[0],
        radicalMeaning: wordData.radicalMeaning || '',
        hskLevel: wordData.hskLevel || 0,
        traditional: wordData.traditional || wordData.character,
        id: Date.now()
      };
    }

    // Check for duplicates
    const exists = data.userDictionary[language].some(w => {
      if (language === 'persian') return w.word === wordData.word;
      if (language === 'chinese') return w.character === wordData.character;
      return false;
    });

    if (exists) {
      throw new Error('Word already exists in custom dictionary');
    }

    data.userDictionary[language].push(wordData);
    await this.save({ userDictionary: data.userDictionary });
    console.log(`Vocabulary Manager: Added custom word "${language === 'persian' ? wordData.word : wordData.character}" (${language})`);
    return wordData;
  }

  /**
   * Update word in user dictionary
   */
  async updateCustomWord(language, wordId, newData) {
    const data = await this.getAll();
    const index = data.userDictionary[language].findIndex(w => w.id === wordId);

    if (index === -1) {
      throw new Error('Word not found in custom dictionary');
    }

    // Merge with existing data
    data.userDictionary[language][index] = {
      ...data.userDictionary[language][index],
      ...newData,
      id: wordId // Preserve ID
    };

    await this.save({ userDictionary: data.userDictionary });
    console.log(`Vocabulary Manager: Updated custom word (${language})`);
    return data.userDictionary[language][index];
  }

  /**
   * Remove word from user dictionary
   */
  async removeCustomWord(language, wordId) {
    const data = await this.getAll();
    // Convert wordId to number if it's a string (from onclick)
    const id = typeof wordId === 'string' ? parseInt(wordId, 10) : wordId;
    const index = data.userDictionary[language].findIndex(w => w.id === id);

    if (index > -1) {
      const removed = data.userDictionary[language].splice(index, 1)[0];
      await this.save({ userDictionary: data.userDictionary });
      console.log(`Vocabulary Manager: Removed custom word (${language})`);
      return removed;
    }
    return null;
  }

  /**
   * Clear all custom words for a language
   */
  async clearUserDictionary(language) {
    const data = await this.getAll();
    data.userDictionary[language] = [];
    await this.save({ userDictionary: data.userDictionary });
    console.log(`Vocabulary Manager: Cleared user dictionary for ${language}`);
  }

  /**
   * Get custom words count
   */
  async getCustomWordCount(language) {
    const userDict = await this.getUserDictionary(language);
    return userDict.length;
  }

  // ==================== IMPORT/EXPORT ====================

  /**
   * Export all custom vocabulary as JSON
   */
  async exportAll() {
    const data = await this.getAll();
    return JSON.stringify(data, null, 2);
  }

  /**
   * Export specific list
   */
  async export(type, language) {
    const data = await this.getAll();
    if (type === 'mastered') {
      return JSON.stringify(data.masteredWords[language], null, 2);
    } else if (type === 'custom') {
      return JSON.stringify(data.userDictionary[language], null, 2);
    }
    throw new Error('Invalid export type');
  }

  /**
   * Import custom vocabulary from JSON
   */
  async importAll(jsonString) {
    try {
      const imported = JSON.parse(jsonString);

      // Validate structure
      if (!imported.masteredWords || !imported.userDictionary) {
        throw new Error('Invalid format: must contain masteredWords and userDictionary');
      }

      await this.save(imported);
      console.log('Vocabulary Manager: Imported all custom vocabulary');
      return true;
    } catch (error) {
      console.error('Vocabulary Manager: Import failed', error);
      throw error;
    }
  }

  /**
   * Import specific list (merge with existing)
   */
  async importList(type, language, jsonString) {
    try {
      const imported = JSON.parse(jsonString);
      const data = await this.getAll();

      if (type === 'mastered') {
        if (!Array.isArray(imported)) {
          throw new Error('Mastered words must be an array');
        }
        // Merge with existing, avoiding duplicates
        const existing = new Set(data.masteredWords[language]);
        imported.forEach(word => existing.add(word));
        data.masteredWords[language] = Array.from(existing);
        await this.save({ masteredWords: data.masteredWords });
      } else if (type === 'custom') {
        if (!Array.isArray(imported)) {
          throw new Error('Custom dictionary must be an array');
        }
        // Add IDs if missing and merge
        imported.forEach(word => {
          if (!word.id) word.id = Date.now() + Math.random();
        });
        data.userDictionary[language].push(...imported);
        await this.save({ userDictionary: data.userDictionary });
      }

      console.log(`Vocabulary Manager: Imported ${type} list for ${language}`);
      return true;
    } catch (error) {
      console.error('Vocabulary Manager: Import failed', error);
      throw error;
    }
  }

  // ==================== STATISTICS ====================

  /**
   * Get all statistics
   */
  async getStats() {
    const data = await this.getAll();
    return {
      mastered: {
        persian: data.masteredWords.persian.length,
        chinese: data.masteredWords.chinese.length,
        total: data.masteredWords.persian.length + data.masteredWords.chinese.length
      },
      custom: {
        persian: data.userDictionary.persian.length,
        chinese: data.userDictionary.chinese.length,
        total: data.userDictionary.persian.length + data.userDictionary.chinese.length
      }
    };
  }
}

// Export for use in other scripts
if (typeof module !== 'undefined' && module.exports) {
  module.exports = VocabularyManager;
}
