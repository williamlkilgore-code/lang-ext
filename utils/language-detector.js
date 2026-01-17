/**
 * Language Detector for Persian/Farsi Content
 * Detects if a webpage contains Persian text to determine if extension should activate
 */

class LanguageDetector {
  constructor() {
    // Persian Unicode range: \u0600-\u06FF (Arabic/Persian block)
    this.persianRegex = /[\u0600-\u06FF]/;
    this.minPersianChars = 50; // Minimum Persian characters to consider page as Farsi
  }

  /**
   * Check if text contains Persian characters
   * @param {string} text - Text to analyze
   * @returns {boolean}
   */
  isPersian(text) {
    return this.persianRegex.test(text);
  }

  /**
   * Count Persian characters in text
   * @param {string} text - Text to analyze
   * @returns {number}
   */
  countPersianChars(text) {
    const matches = text.match(/[\u0600-\u06FF]/g);
    return matches ? matches.length : 0;
  }

  /**
   * Analyze page content to determine if it's primarily Persian
   * @param {Document} document - DOM document
   * @returns {Object} Analysis result with isPersian flag and stats
   */
  analyzePage(document = window.document) {
    const bodyText = document.body.innerText || '';
    const persianCharCount = this.countPersianChars(bodyText);
    const totalChars = bodyText.length;
    const persianRatio = totalChars > 0 ? persianCharCount / totalChars : 0;

    const result = {
      isPersian: persianCharCount >= this.minPersianChars,
      persianCharCount,
      totalChars,
      persianRatio,
      confidence: persianRatio > 0.1 ? 'high' : persianRatio > 0.05 ? 'medium' : 'low'
    };

    return result;
  }

  /**
   * Check if element contains Persian text
   * @param {Element} element - DOM element
   * @returns {boolean}
   */
  elementHasPersian(element) {
    const text = element.textContent || '';
    return this.isPersian(text);
  }

  /**
   * Get Persian text nodes from an element
   * @param {Element} element - DOM element
   * @returns {Array<Text>} Array of text nodes containing Persian
   */
  getPersianTextNodes(element) {
    const walker = document.createTreeWalker(
      element,
      NodeFilter.SHOW_TEXT,
      {
        acceptNode: (node) => {
          // Skip script, style, and other non-visible elements
          const parent = node.parentElement;
          if (!parent) return NodeFilter.FILTER_REJECT;

          const tagName = parent.tagName.toLowerCase();
          if (['script', 'style', 'noscript', 'iframe', 'object'].includes(tagName)) {
            return NodeFilter.FILTER_REJECT;
          }

          // Only accept nodes with Persian text
          return this.isPersian(node.textContent)
            ? NodeFilter.FILTER_ACCEPT
            : NodeFilter.FILTER_REJECT;
        }
      }
    );

    const textNodes = [];
    let node;
    while (node = walker.nextNode()) {
      textNodes.push(node);
    }

    return textNodes;
  }
}

// Export for use in content script
if (typeof module !== 'undefined' && module.exports) {
  module.exports = LanguageDetector;
}
