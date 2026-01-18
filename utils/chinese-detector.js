/**
 * Chinese Language Detector
 * Detects Chinese content on web pages
 */

class ChineseDetector {
  constructor() {
    // CJK Unified Ideographs range (most common Chinese characters)
    this.chineseRegex = /[\u4E00-\u9FFF]/;
    this.chineseRegexGlobal = /[\u4E00-\u9FFF]/g;
  }

  /**
   * Check if text contains Chinese characters
   * @param {string} text - Text to check
   * @returns {boolean}
   */
  containsChinese(text) {
    return this.chineseRegex.test(text);
  }

  /**
   * Count Chinese characters in text
   * @param {string} text - Text to analyze
   * @returns {number} Number of Chinese characters
   */
  countChineseCharacters(text) {
    const matches = text.match(this.chineseRegexGlobal);
    return matches ? matches.length : 0;
  }

  /**
   * Calculate percentage of Chinese characters in text
   * @param {string} text - Text to analyze
   * @returns {number} Percentage (0-100)
   */
  getChinesePercentage(text) {
    if (!text || text.length === 0) return 0;

    // Remove whitespace for more accurate calculation
    const trimmedText = text.replace(/\s+/g, '');
    if (trimmedText.length === 0) return 0;

    const chineseCount = this.countChineseCharacters(trimmedText);
    return (chineseCount / trimmedText.length) * 100;
  }

  /**
   * Get all text nodes containing Chinese from document
   * @returns {Array<Node>} Array of text nodes with Chinese content
   */
  getChineseTextNodes() {
    const chineseNodes = [];
    const walker = document.createTreeWalker(
      document.body,
      NodeFilter.SHOW_TEXT,
      {
        acceptNode: (node) => {
          // Skip script and style elements
          if (node.parentElement) {
            const tagName = node.parentElement.tagName;
            if (tagName === 'SCRIPT' || tagName === 'STYLE' || tagName === 'NOSCRIPT') {
              return NodeFilter.FILTER_REJECT;
            }
          }

          // Check if node contains Chinese
          if (this.containsChinese(node.textContent)) {
            return NodeFilter.FILTER_ACCEPT;
          }

          return NodeFilter.FILTER_SKIP;
        }
      }
    );

    let node;
    while ((node = walker.nextNode())) {
      chineseNodes.push(node);
    }

    return chineseNodes;
  }

  /**
   * Analyze page for Chinese content
   * @returns {Object} Analysis result with isChinese, percentage, and confidence
   */
  analyzePage() {
    const bodyText = document.body.textContent || '';
    const chinesePercentage = this.getChinesePercentage(bodyText);
    const chineseCount = this.countChineseCharacters(bodyText);

    // Determine confidence level
    let confidence = 'none';
    let isChinese = false;

    if (chinesePercentage >= 30) {
      confidence = 'high';
      isChinese = true;
    } else if (chinesePercentage >= 15) {
      confidence = 'medium';
      isChinese = true;
    } else if (chinesePercentage >= 5) {
      confidence = 'low';
      isChinese = true;
    }

    return {
      isChinese: isChinese,
      percentage: Math.round(chinesePercentage),
      chineseCount: chineseCount,
      confidence: confidence,
      totalLength: bodyText.length
    };
  }

  /**
   * Check if element contains significant Chinese content
   * @param {Element} element - DOM element to check
   * @returns {boolean}
   */
  elementHasChinese(element) {
    const text = element.textContent || '';
    return this.getChinesePercentage(text) >= 10;
  }
}

// Export for use in content script
if (typeof module !== 'undefined' && module.exports) {
  module.exports = ChineseDetector;
}
