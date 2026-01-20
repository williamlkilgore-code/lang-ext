/**
 * Russian Language Detector
 * Detects if text contains Russian/Cyrillic characters
 */

class RussianDetector {
  /**
   * Check if text contains Russian characters
   * @param {string} text - Text to check
   * @returns {boolean} - True if text contains Russian/Cyrillic
   */
  containsRussian(text) {
    // Russian Cyrillic range: U+0400-U+04FF
    // Includes: А-Я, а-я, Ё, ё
    return /[А-Яа-яЁё]/.test(text);
  }

  /**
   * Get percentage of Russian characters in text
   * @param {string} text - Text to analyze
   * @returns {number} - Percentage (0-100) of Russian characters
   */
  getRussianPercentage(text) {
    if (!text || text.length === 0) return 0;

    const russianChars = text.match(/[А-Яа-яЁё]/g) || [];
    const totalChars = text.replace(/\s/g, '').length;

    if (totalChars === 0) return 0;

    return (russianChars.length / totalChars) * 100;
  }

  /**
   * Check if text is predominantly Russian
   * @param {string} text - Text to check
   * @param {number} threshold - Minimum percentage to consider text as Russian (default: 30%)
   * @returns {boolean} - True if text is predominantly Russian
   */
  isPredominantlyRussian(text, threshold = 30) {
    return this.getRussianPercentage(text) >= threshold;
  }

  /**
   * Extract Russian words from mixed-language text
   * @param {string} text - Text to analyze
   * @returns {Array<string>} - Array of Russian words found
   */
  extractRussianWords(text) {
    if (!text) return [];

    // Match Russian words (including hyphenated words)
    const matches = text.match(/[А-Яа-яЁё]+(?:-[А-Яа-яЁё]+)*/g);
    return matches || [];
  }

  /**
   * Count Russian words in text
   * @param {string} text - Text to analyze
   * @returns {number} - Number of Russian words
   */
  countRussianWords(text) {
    return this.extractRussianWords(text).length;
  }
}
