/**
 * Settings Manager
 * Handles all extension settings with chrome.storage.sync
 */

class SettingsManager {
  constructor() {
    this.defaults = {
      // Language Settings
      activePersian: true,
      activeChinese: true,
      activeRussian: false,

      // Chinese HSK Level Filter
      chineseHskMin: 1,
      chineseHskMax: 6,

      // Domain Exclusions
      excludedDomains: [],

      // Highlight Style
      highlightOpacity: 40, // 0-100
      highlightColor: '#9CA3AF', // gray-400
      highlightStyle: 'dotted', // dotted, solid, wavy, none
      highlightThickness: 1, // 1-3px

      // Tooltip Settings (for future use)
      tooltipEnabled: true,
      tooltipDelay: 0, // milliseconds

      // Translation Settings (for future use)
      defaultTranslationService: 'both', // google, deepl, both

      // Custom Vocabulary Settings
      hideMasteredWords: true, // Hide words marked as mastered
      showCustomWords: true, // Show custom dictionary words

      // First run flag
      firstRun: true
    };
  }

  /**
   * Get all settings (merges with defaults)
   */
  async getAll() {
    return new Promise((resolve) => {
      if (typeof chrome !== 'undefined' && chrome.storage) {
        chrome.storage.sync.get(this.defaults, (settings) => {
          resolve(settings);
        });
      } else {
        // Fallback for testing
        resolve(this.defaults);
      }
    });
  }

  /**
   * Get a specific setting
   */
  async get(key) {
    const settings = await this.getAll();
    return settings[key];
  }

  /**
   * Set one or more settings
   */
  async set(settings) {
    return new Promise((resolve) => {
      if (typeof chrome !== 'undefined' && chrome.storage) {
        chrome.storage.sync.set(settings, () => {
          resolve();
        });
      } else {
        // Fallback for testing
        resolve();
      }
    });
  }

  /**
   * Reset all settings to defaults
   */
  async reset() {
    return this.set(this.defaults);
  }

  /**
   * Check if current domain is excluded
   */
  async isCurrentDomainExcluded() {
    const excludedDomains = await this.get('excludedDomains');
    const currentDomain = window.location.hostname;

    return excludedDomains.some(domain => {
      // Support wildcards
      if (domain.startsWith('*.')) {
        const baseDomain = domain.substring(2);
        return currentDomain.endsWith(baseDomain);
      }
      return currentDomain === domain || currentDomain.endsWith('.' + domain);
    });
  }

  /**
   * Get active languages based on settings
   */
  async getActiveLanguages() {
    const settings = await this.getAll();
    return {
      persian: settings.activePersian,
      chinese: settings.activeChinese,
      russian: settings.activeRussian
    };
  }

  /**
   * Check if a Chinese word should be shown based on HSK level
   */
  async shouldShowChineseWord(hskLevel) {
    const settings = await this.getAll();
    return hskLevel >= settings.chineseHskMin && hskLevel <= settings.chineseHskMax;
  }

  /**
   * Get highlight CSS properties
   */
  async getHighlightStyle() {
    const settings = await this.getAll();

    let decorationStyle = 'none';
    if (settings.highlightStyle === 'dotted') decorationStyle = 'dotted';
    else if (settings.highlightStyle === 'solid') decorationStyle = 'solid';
    else if (settings.highlightStyle === 'wavy') decorationStyle = 'wavy';

    // Convert hex to rgba with opacity
    const hex = settings.highlightColor;
    const r = parseInt(hex.slice(1, 3), 16);
    const g = parseInt(hex.slice(3, 5), 16);
    const b = parseInt(hex.slice(5, 7), 16);
    const opacity = settings.highlightOpacity / 100;

    return {
      textDecorationLine: decorationStyle === 'none' ? 'none' : 'underline',
      textDecorationStyle: decorationStyle,
      textDecorationColor: `rgba(${r}, ${g}, ${b}, ${opacity})`,
      textDecorationThickness: `${settings.highlightThickness}px`
    };
  }

  /**
   * Export settings as JSON
   */
  async export() {
    const settings = await this.getAll();
    return JSON.stringify(settings, null, 2);
  }

  /**
   * Import settings from JSON
   */
  async import(jsonString) {
    try {
      const settings = JSON.parse(jsonString);
      await this.set(settings);
      return true;
    } catch (e) {
      console.error('Failed to import settings:', e);
      return false;
    }
  }
}

// Export for use in other scripts
if (typeof module !== 'undefined' && module.exports) {
  module.exports = SettingsManager;
}
