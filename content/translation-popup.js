/**
 * Translation Popup for Selected Text
 * Shows translation options when user selects Persian text
 */

class TranslationPopup {
  constructor(matcher) {
    this.matcher = matcher;
    this.popup = null;
    this.currentSelection = null;
    this.isVisible = false;

    this.init();
  }

  init() {
    this.createPopup();
    this.attachEventListeners();
  }

  createPopup() {
    this.popup = document.createElement('div');
    this.popup.className = 'farsi-translation-popup';
    this.popup.innerHTML = `
      <button class="translate-btn" title="Translate selection">
        <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
          <path d="M5 8h14M5 8a2 2 0 110-4h14a2 2 0 110 4M5 8v10a2 2 0 002 2h10a2 2 0 002-2V8m-9 4h4"/>
        </svg>
        Translate
      </button>
    `;
    document.body.appendChild(this.popup);

    // Add handlers for translate button
    const translateBtn = this.popup.querySelector('.translate-btn');

    // Prevent mousedown from clearing selection
    translateBtn.addEventListener('mousedown', (e) => {
      e.preventDefault();
      e.stopPropagation();
    });

    translateBtn.addEventListener('click', (e) => {
      e.preventDefault();
      e.stopPropagation();
      this.translateSelection();
    });
  }

  attachEventListeners() {
    // Listen for text selection
    document.addEventListener('mouseup', (e) => {
      // Small delay to ensure selection is complete
      setTimeout(() => this.handleSelection(e), 10);
    });

    // Hide on scroll
    window.addEventListener('scroll', () => this.hide(), { passive: true });

    // Hide when clicking outside
    document.addEventListener('mousedown', (e) => {
      if (this.isVisible && !this.popup.contains(e.target)) {
        this.hide();
      }
    });
  }

  handleSelection(event) {
    const selection = window.getSelection();
    const selectedText = selection.toString().trim();

    // Don't hide if popup is showing translation results
    if (this.popup.classList.contains('showing-translation')) {
      return;
    }

    // Hide if no selection or selection is empty
    if (!selectedText || selectedText.length === 0) {
      this.hide();
      return;
    }

    // Check if selection contains Persian text
    if (!this.containsPersian(selectedText)) {
      this.hide();
      return;
    }

    // Don't show if clicking on the popup itself
    if (this.popup.contains(event.target)) {
      return;
    }

    this.currentSelection = selectedText;
    this.show(selection);
  }

  containsPersian(text) {
    // Check if text contains Persian/Arabic characters
    return /[\u0600-\u06FF]/.test(text);
  }

  show(selection) {
    if (selection.rangeCount === 0) return;

    // Reset popup content to show translate button
    this.resetPopupContent();

    const range = selection.getRangeAt(0);
    const rect = range.getBoundingClientRect();

    // Position popup near selection
    const scrollTop = window.pageYOffset || document.documentElement.scrollTop;
    const scrollLeft = window.pageXOffset || document.documentElement.scrollLeft;

    // Position above selection by default
    let top = rect.top + scrollTop - this.popup.offsetHeight - 8;
    let left = rect.left + scrollLeft + (rect.width / 2) - (this.popup.offsetWidth / 2);

    // If popup goes above viewport, show below selection
    if (top < scrollTop) {
      top = rect.bottom + scrollTop + 8;
    }

    // Keep popup within horizontal bounds
    const maxLeft = window.innerWidth + scrollLeft - this.popup.offsetWidth - 10;
    const minLeft = scrollLeft + 10;
    left = Math.max(minLeft, Math.min(left, maxLeft));

    this.popup.style.top = `${top}px`;
    this.popup.style.left = `${left}px`;
    this.popup.classList.add('visible');
    this.isVisible = true;
  }

  resetPopupContent() {
    // Reset to translate button
    this.popup.innerHTML = `
      <button class="translate-btn" title="Translate selection">
        <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
          <path d="M5 8h14M5 8a2 2 0 110-4h14a2 2 0 110 4M5 8v10a2 2 0 002 2h10a2 2 0 002-2V8m-9 4h4"/>
        </svg>
        Translate
      </button>
    `;

    // Remove showing-translation class
    this.popup.classList.remove('showing-translation');

    // Re-attach click and mousedown handlers
    const translateBtn = this.popup.querySelector('.translate-btn');

    // Prevent mousedown from clearing selection
    translateBtn.addEventListener('mousedown', (e) => {
      e.preventDefault();
      e.stopPropagation();
    });

    translateBtn.addEventListener('click', (e) => {
      e.preventDefault();
      e.stopPropagation();
      this.translateSelection();
    });
  }

  hide() {
    this.popup.classList.remove('visible');
    this.popup.classList.remove('showing-translation');
    this.isVisible = false;
    this.currentSelection = null;
  }

  async translateSelection() {
    if (!this.currentSelection) return;

    const text = this.currentSelection;

    // First, try to find translation in our dictionary
    const dictionaryTranslation = this.findInDictionary(text);

    if (dictionaryTranslation) {
      this.showTranslation(dictionaryTranslation);
    } else {
      // Try to translate multiple words
      const multiWordTranslation = this.translateMultipleWords(text);

      if (multiWordTranslation && multiWordTranslation.foundWords > 0) {
        this.showTranslation(multiWordTranslation);
      } else {
        this.showExternalTranslationOption(text);
      }
    }
  }

  findInDictionary(text) {
    const normalizedText = this.matcher.normalizeWord(text);
    const rootInfo = this.matcher.matchWord(normalizedText);

    if (rootInfo) {
      return {
        type: 'dictionary',
        word: text,
        translation: rootInfo.wordMeaning,
        pos: rootInfo.pos,
        root: rootInfo.root,
        rootLatin: rootInfo.rootLatin,
        rootMeaning: rootInfo.rootMeaning
      };
    }

    return null;
  }

  translateMultipleWords(text) {
    // Split text into words and try to translate each
    const words = text.split(/\s+/);
    const translations = [];
    let foundWords = 0;

    words.forEach(word => {
      const cleaned = word.trim();
      if (!cleaned) return;

      const translation = this.findInDictionary(cleaned);
      if (translation) {
        translations.push({
          word: cleaned,
          meaning: translation.translation
        });
        foundWords++;
      } else {
        translations.push({
          word: cleaned,
          meaning: '?'
        });
      }
    });

    return {
      type: 'multiword',
      words: translations,
      foundWords: foundWords,
      totalWords: words.length
    };
  }

  showTranslation(translation) {
    let content = '';

    if (translation.type === 'dictionary') {
      // Single word from dictionary
      content = `
        <div class="translation-result">
          <div class="translation-word">${translation.word}</div>
          <div class="translation-meaning">${translation.translation}</div>
          <div class="translation-pos">${translation.pos}</div>
          <div class="translation-root">
            Root: ${translation.root} (${translation.rootLatin}) - ${translation.rootMeaning}
          </div>
        </div>
      `;
    } else if (translation.type === 'multiword') {
      // Multiple words - show word-by-word breakdown
      const wordTranslations = translation.words.map(w =>
        `<span class="word-translation">
          <span class="original">${w.word}</span>
          <span class="arrow">→</span>
          <span class="meaning">${w.meaning}</span>
        </span>`
      ).join('');

      // Also include external translation links for the full phrase
      const encodedText = encodeURIComponent(this.currentSelection);

      content = `
        <div class="translation-result multiword">
          <div class="translation-header">
            Word-by-word (${translation.foundWords}/${translation.totalWords} found)
          </div>
          <div class="word-translations">
            ${wordTranslations}
          </div>
          <div class="translation-divider"></div>
          <div class="translation-header">Translate full phrase</div>
          <div class="external-options">
            <a href="https://translate.google.com/?sl=fa&tl=en&text=${encodedText}"
               target="_blank"
               class="external-link">
              <svg width="14" height="14" viewBox="0 0 24 24" fill="currentColor">
                <path d="M12.87 15.07l-2.54-2.51.03-.03c1.74-1.94 2.98-4.17 3.71-6.53H17V4h-7V2H8v2H1v1.99h11.17C11.5 7.92 10.44 9.75 9 11.35 8.07 10.32 7.3 9.19 6.69 8h-2c.73 1.63 1.73 3.17 2.98 4.56l-5.09 5.02L4 19l5-5 3.11 3.11.76-2.04zM18.5 10h-2L12 22h2l1.12-3h4.75L21 22h2l-4.5-12zm-2.62 7l1.62-4.33L19.12 17h-3.24z"/>
              </svg>
              Google Translate
            </a>
            <a href="https://www.deepl.com/translator#fa/en/${encodedText}"
               target="_blank"
               class="external-link">
              <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                <path d="M21 15v4a2 2 0 01-2 2H5a2 2 0 01-2-2v-4M7 10l5 5 5-5M12 15V3"/>
              </svg>
              DeepL
            </a>
          </div>
        </div>
      `;
    }

    // Update popup content
    this.popup.innerHTML = content;
    this.popup.classList.add('showing-translation');
  }

  showExternalTranslationOption(text) {
    // Encode text for URLs
    const encodedText = encodeURIComponent(text);

    const content = `
      <div class="translation-result external">
        <div class="translation-header">Translation not found in dictionary</div>
        <div class="external-options">
          <a href="https://translate.google.com/?sl=fa&tl=en&text=${encodedText}"
             target="_blank"
             class="external-link">
            <svg width="14" height="14" viewBox="0 0 24 24" fill="currentColor">
              <path d="M12.87 15.07l-2.54-2.51.03-.03c1.74-1.94 2.98-4.17 3.71-6.53H17V4h-7V2H8v2H1v1.99h11.17C11.5 7.92 10.44 9.75 9 11.35 8.07 10.32 7.3 9.19 6.69 8h-2c.73 1.63 1.73 3.17 2.98 4.56l-5.09 5.02L4 19l5-5 3.11 3.11.76-2.04zM18.5 10h-2L12 22h2l1.12-3h4.75L21 22h2l-4.5-12zm-2.62 7l1.62-4.33L19.12 17h-3.24z"/>
            </svg>
            Google Translate
          </a>
          <a href="https://www.deepl.com/translator#fa/en/${encodedText}"
             target="_blank"
             class="external-link">
            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
              <path d="M21 15v4a2 2 0 01-2 2H5a2 2 0 01-2-2v-4M7 10l5 5 5-5M12 15V3"/>
            </svg>
            DeepL
          </a>
        </div>
      </div>
    `;

    this.popup.innerHTML = content;
    this.popup.classList.add('showing-translation');
  }
}
