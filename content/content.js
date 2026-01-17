/**
 * Content Script for Farsi Root Word Learner
 * Main script that runs on web pages to detect and highlight Persian words
 */

(async function() {
  'use strict';

  // Initialize components
  const detector = new LanguageDetector();
  const matcher = new PersianMatcher();

  let isActive = false;
  let tooltip = null;
  let currentHighlight = null;

  /**
   * Load dictionary data
   */
  async function loadDictionary() {
    try {
      const response = await fetch(chrome.runtime.getURL('data/farsi-roots.json'));
      const data = await response.json();
      await matcher.initialize(data);
      console.log('Farsi Root Learner: Dictionary loaded', matcher.getStats());
      return true;
    } catch (error) {
      console.error('Farsi Root Learner: Failed to load dictionary', error);
      return false;
    }
  }

  /**
   * Check if extension should activate on this page
   */
  function shouldActivate() {
    const analysis = detector.analyzePage();
    console.log('Farsi Root Learner: Page analysis', analysis);

    // Activate if page has significant Persian content
    return analysis.isPersian && analysis.confidence !== 'low';
  }

  /**
   * Create tooltip element
   */
  function createTooltip() {
    const tooltipEl = document.createElement('div');
    tooltipEl.className = 'farsi-root-tooltip';
    tooltipEl.setAttribute('role', 'tooltip');
    document.body.appendChild(tooltipEl);
    return tooltipEl;
  }

  /**
   * Show tooltip with word information
   * @param {Object} rootInfo - Root information from matcher
   * @param {Element} targetElement - Element that was hovered
   */
  function showTooltip(rootInfo, targetElement) {
    if (!tooltip) {
      tooltip = createTooltip();
    }

    // Build tooltip content
    const content = `
      <div class="tooltip-word">${rootInfo.word}</div>

      <div class="tooltip-section">
        <div class="tooltip-label">Root</div>
        <div class="tooltip-value">
          <span class="tooltip-root">${rootInfo.root}</span>
          <span style="margin: 0 4px;">•</span>
          <span>${rootInfo.rootLatin}</span>
          <span class="tooltip-category">${rootInfo.category}</span>
        </div>
      </div>

      <div class="tooltip-section">
        <div class="tooltip-label">Root Meaning</div>
        <div class="tooltip-value">${rootInfo.rootMeaning}</div>
      </div>

      <div class="tooltip-section">
        <div class="tooltip-label">Word Meaning</div>
        <div class="tooltip-value">
          ${rootInfo.wordMeaning}
          <span class="tooltip-pos">${rootInfo.pos}</span>
        </div>
      </div>
    `;

    tooltip.innerHTML = content;

    // Position tooltip
    const rect = targetElement.getBoundingClientRect();
    const scrollTop = window.pageYOffset || document.documentElement.scrollTop;
    const scrollLeft = window.pageXOffset || document.documentElement.scrollLeft;

    let top = rect.top + scrollTop - tooltip.offsetHeight - 12;
    let left = rect.left + scrollLeft;

    // Adjust if tooltip goes off screen
    if (top < scrollTop) {
      top = rect.bottom + scrollTop + 12;
      tooltip.style.setProperty('transform-origin', 'top');
    }

    if (left + tooltip.offsetWidth > window.innerWidth + scrollLeft) {
      left = window.innerWidth + scrollLeft - tooltip.offsetWidth - 10;
    }

    tooltip.style.top = `${top}px`;
    tooltip.style.left = `${left}px`;

    // Show tooltip with animation
    requestAnimationFrame(() => {
      tooltip.classList.add('visible');
    });
  }

  /**
   * Hide tooltip
   */
  function hideTooltip() {
    if (tooltip) {
      tooltip.classList.remove('visible');
    }
  }

  /**
   * Process text node and wrap matched words
   * @param {Text} textNode - Text node to process
   */
  function processTextNode(textNode) {
    // Safety checks
    if (!textNode || !textNode.parentNode || !textNode.textContent) return;

    // Skip if parent is already processed or is our tooltip
    const parent = textNode.parentNode;
    if (parent.classList && (
        parent.classList.contains('farsi-root-highlight') ||
        parent.classList.contains('farsi-root-tooltip') ||
        parent.closest('.farsi-root-tooltip')
    )) {
      return;
    }

    const text = textNode.textContent;
    const matches = matcher.extractWords(text);

    if (matches.length === 0) return;

    // Create document fragment with highlighted words
    const fragment = document.createDocumentFragment();
    let lastIndex = 0;

    matches.forEach(match => {
      // Add text before match
      if (match.start > lastIndex) {
        fragment.appendChild(
          document.createTextNode(text.substring(lastIndex, match.start))
        );
      }

      // Create highlighted span
      const span = document.createElement('span');
      span.className = 'farsi-root-highlight';
      span.textContent = match.word;
      span.dataset.rootInfo = JSON.stringify(match.rootInfo);

      // Add event listeners
      span.addEventListener('mouseenter', function(e) {
        const rootInfo = JSON.parse(this.dataset.rootInfo);
        showTooltip(rootInfo, this);
        currentHighlight = this;
      });

      span.addEventListener('mouseleave', function(e) {
        hideTooltip();
        currentHighlight = null;
      });

      fragment.appendChild(span);
      lastIndex = match.end;
    });

    // Add remaining text
    if (lastIndex < text.length) {
      fragment.appendChild(
        document.createTextNode(text.substring(lastIndex))
      );
    }

    // Replace text node with fragment
    try {
      textNode.parentNode.replaceChild(fragment, textNode);
    } catch (error) {
      console.error('Farsi Root Learner: Error replacing text node', error);
    }
  }

  /**
   * Process all Persian text on the page
   */
  function processPage() {
    const textNodes = detector.getPersianTextNodes(document.body);
    console.log(`Farsi Root Learner: Processing ${textNodes.length} Persian text nodes`);

    textNodes.forEach(node => {
      try {
        processTextNode(node);
      } catch (error) {
        console.error('Farsi Root Learner: Error processing text node', error);
      }
    });
  }

  /**
   * Observer for dynamically added content
   */
  function setupMutationObserver() {
    let processingTimeout = null;

    const observer = new MutationObserver(mutations => {
      // Debounce processing to avoid excessive calls
      if (processingTimeout) {
        clearTimeout(processingTimeout);
      }

      processingTimeout = setTimeout(() => {
        mutations.forEach(mutation => {
          mutation.addedNodes.forEach(node => {
            // Skip our own tooltip
            if (node.nodeType === Node.ELEMENT_NODE) {
              if (node.classList && (
                  node.classList.contains('farsi-root-tooltip') ||
                  node.classList.contains('farsi-root-highlight')
              )) {
                return;
              }

              // Skip if this is inside our tooltip
              if (node.closest && node.closest('.farsi-root-tooltip')) {
                return;
              }

              const textNodes = detector.getPersianTextNodes(node);
              textNodes.forEach(textNode => {
                try {
                  processTextNode(textNode);
                } catch (error) {
                  console.error('Farsi Root Learner: Error processing dynamic content', error);
                }
              });
            }
          });
        });
      }, 100); // Debounce 100ms
    });

    observer.observe(document.body, {
      childList: true,
      subtree: true
    });

    return observer;
  }

  /**
   * Initialize extension
   */
  async function initialize() {
    console.log('Farsi Root Learner: Initializing...');

    // Load dictionary
    const loaded = await loadDictionary();
    if (!loaded) {
      console.error('Farsi Root Learner: Failed to initialize - dictionary not loaded');
      return;
    }

    // Check if should activate
    if (!shouldActivate()) {
      console.log('Farsi Root Learner: Not enough Persian content detected, staying inactive');
      return;
    }

    console.log('Farsi Root Learner: Activating on this page');
    isActive = true;

    // Process existing content
    processPage();

    // Watch for dynamic content
    setupMutationObserver();

    // Listen for scroll to hide tooltip
    window.addEventListener('scroll', hideTooltip, { passive: true });

    console.log('Farsi Root Learner: Ready');
  }

  // Start when DOM is ready
  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', initialize);
  } else {
    initialize();
  }

})();
