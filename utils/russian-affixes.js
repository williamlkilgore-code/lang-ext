/**
 * Russian Prefix and Suffix Meanings
 * Common Russian affixes with their meanings
 */

const RUSSIAN_PREFIX_MEANINGS = {
  // Very common prefixes
  'по': 'along, a little, after',
  'за': 'behind, beyond, begin',
  'с': 'with, down, off',
  'при': 'at, near, arrive',
  'от': 'from, away, off',
  'вы': 'out, forth, completely',
  'на': 'on, onto, accumulate',
  'пере': 'across, over, re-',
  'до': 'up to, before, reach',
  'про': 'through, past, about',
  'раз': 'apart, un-, dis-',
  'под': 'under, up to, approach',
  'из': 'from, out of, exhaust',
  'о': 'around, about',
  'об': 'around, about',
  'у': 'away, decrease',
  'в': 'in, into',
  'без': 'without, -less',
  'пред': 'before, pre-',
  'воз': 'up, upward',
  'со': 'with, together',
  'над': 'over, above, super-',
  'пре': 'very, trans-, exceed'
};

const RUSSIAN_SUFFIX_MEANINGS = {
  // Verb infinitive endings
  'ть': 'infinitive (to)',
  'ти': 'infinitive (to)',
  'ать': 'infinitive (to)',
  'ять': 'infinitive (to)',
  'ить': 'infinitive (to)',
  'еть': 'infinitive (to)',
  'оть': 'infinitive (to)',
  'уть': 'infinitive (to)',
  'чь': 'infinitive (to)',

  // Reflexive
  'ся': 'reflexive/passive',
  'сь': 'reflexive/passive',
  'ться': 'reflexive infinitive',
  'тся': 'reflexive (3rd person)',

  // Noun endings
  'ость': 'abstract noun (-ness, -ty)',
  'ство': 'quality, collective (-hood, -ship)',
  'ение': 'action/process (-ing, -tion)',
  'ание': 'action/process (-ing, -tion)',
  'ние': 'action/process (-ing, -tion)',
  'тель': 'agent (-er, doer)',
  'ник': 'agent, profession (-er)',
  'ица': 'feminine agent (-ess)',
  'ка': 'feminine, diminutive',
  'ок': 'diminutive',
  'ец': 'agent, person from',
  'ие': 'action, state',
  'ие': 'abstract noun',

  // Adjective endings
  'ый': 'adjective ending (masc)',
  'ий': 'adjective ending (masc)',
  'ой': 'adjective ending (masc, stressed)',
  'ая': 'adjective ending (fem)',
  'ое': 'adjective ending (neut)',
  'ые': 'adjective ending (plural)',
  'ие': 'adjective ending (plural)',
  'ний': 'adjective suffix',
  'ский': 'adjective suffix (-ish, -an)',

  // Adverb endings
  'о': 'adverb ending (-ly)',
  'е': 'adverb ending (-ly)',

  // Diminutives
  'очка': 'diminutive (small)',
  'ечка': 'diminutive (small)',
  'ушка': 'diminutive (small)',
  'енький': 'diminutive adjective',
  'онька': 'diminutive (small)',

  // Verb conjugation
  'ю': '1st person singular',
  'у': '1st person singular',
  'ешь': '2nd person singular',
  'ишь': '2nd person singular',
  'ет': '3rd person singular',
  'ит': '3rd person singular',
  'ем': '1st person plural',
  'им': '1st person plural',
  'ете': '2nd person plural',
  'ите': '2nd person plural',
  'ут': '3rd person plural',
  'ют': '3rd person plural',
  'ат': '3rd person plural',
  'ят': '3rd person plural',

  // Noun cases (basic)
  'а': 'genitive/accusative singular',
  'ы': 'genitive singular / nominative plural',
  'и': 'genitive singular / nominative plural',
  'у': 'dative singular',
  'ом': 'instrumental singular',
  'ами': 'instrumental plural',
  'ах': 'prepositional plural',
  'ей': 'genitive plural',
  'ов': 'genitive plural',
  'ев': 'genitive plural'
};

/**
 * Get meaning for a prefix
 */
function getPrefixMeaning(prefix) {
  return RUSSIAN_PREFIX_MEANINGS[prefix] || null;
}

/**
 * Get meaning for a suffix
 */
function getSuffixMeaning(suffix) {
  return RUSSIAN_SUFFIX_MEANINGS[suffix] || null;
}

/**
 * Detect prefix in a word based on common prefixes
 */
function detectPrefix(word) {
  const lowerWord = word.toLowerCase();

  // Try prefixes from longest to shortest
  const sortedPrefixes = Object.keys(RUSSIAN_PREFIX_MEANINGS).sort((a, b) => b.length - a.length);

  for (const prefix of sortedPrefixes) {
    if (lowerWord.startsWith(prefix)) {
      return prefix;
    }
  }

  return null;
}

/**
 * Detect suffix in a word based on common suffixes
 */
function detectSuffix(word) {
  const lowerWord = word.toLowerCase();

  // Try suffixes from longest to shortest
  const sortedSuffixes = Object.keys(RUSSIAN_SUFFIX_MEANINGS).sort((a, b) => b.length - a.length);

  for (const suffix of sortedSuffixes) {
    if (lowerWord.endsWith(suffix)) {
      return suffix;
    }
  }

  return null;
}

// Export for use in other scripts
if (typeof module !== 'undefined' && module.exports) {
  module.exports = {
    getPrefixMeaning,
    getSuffixMeaning,
    detectPrefix,
    detectSuffix,
    RUSSIAN_PREFIX_MEANINGS,
    RUSSIAN_SUFFIX_MEANINGS
  };
}
