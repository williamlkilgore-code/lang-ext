#!/usr/bin/env node

/**
 * Merge Dictionary Script
 * Combines farsi-roots.json, conversational_persian_roots.json, and news_persian_roots.json
 * into a unified dictionary format
 */

const fs = require('fs');
const path = require('path');

// Load all three JSON files
const currentDict = JSON.parse(fs.readFileSync(path.join(__dirname, '../data/farsi-roots.json'), 'utf8'));
const conversationalDict = JSON.parse(fs.readFileSync(path.join(__dirname, '../data/conversational_persian_roots.json'), 'utf8'));
const newsDict = JSON.parse(fs.readFileSync(path.join(__dirname, '../data/news_persian_roots.json'), 'utf8'));

// Helper function to normalize root format (convert spaces to hyphens)
function normalizeRoot(root) {
  return root.replace(/\s+/g, '-');
}

// Helper function to denormalize root format (convert hyphens to spaces)
function denormalizeRoot(root) {
  return root.replace(/-/g, ' ');
}

// Helper function to map POS from new format to our format
function mapPOS(pos) {
  if (!pos) return 'noun';

  const posLower = pos.toLowerCase();

  if (posLower.includes('noun')) return 'noun';
  if (posLower.includes('verb')) return 'verb';
  if (posLower.includes('adjective')) return 'adjective';
  if (posLower.includes('adverb')) return 'adverb';
  if (posLower.includes('preposition')) return 'preposition';
  if (posLower.includes('conjunction')) return 'conjunction';

  return 'noun'; // default
}

// Helper function to categorize roots
function categorizeRoot(rootKey, derivatives) {
  // Try to infer category from derivatives' meanings
  const meanings = derivatives.map(d => (d.meaning || d.definition_en || '').toLowerCase()).join(' ');

  if (meanings.includes('write') || meanings.includes('book') || meanings.includes('letter')) return 'writing';
  if (meanings.includes('know') || meanings.includes('science') || meanings.includes('learn')) return 'knowledge';
  if (meanings.includes('school') || meanings.includes('teach') || meanings.includes('study')) return 'education';
  if (meanings.includes('speak') || meanings.includes('word') || meanings.includes('say') || meanings.includes('tell')) return 'communication';
  if (meanings.includes('do') || meanings.includes('action') || meanings.includes('act') || meanings.includes('make')) return 'action';
  if (meanings.includes('think') || meanings.includes('mind') || meanings.includes('reason') || meanings.includes('understand')) return 'cognition';
  if (meanings.includes('read') || meanings.includes('recit')) return 'literacy';
  if (meanings.includes('see') || meanings.includes('look') || meanings.includes('view') || meanings.includes('watch')) return 'perception';
  if (meanings.includes('ask') || meanings.includes('question') || meanings.includes('answer')) return 'inquiry';
  if (meanings.includes('live') || meanings.includes('life') || meanings.includes('death') || meanings.includes('die')) return 'life';
  if (meanings.includes('heart') || meanings.includes('body') || meanings.includes('hand') || meanings.includes('head')) return 'body';
  if (meanings.includes('rule') || meanings.includes('judge') || meanings.includes('govern') || meanings.includes('law')) return 'governance';
  if (meanings.includes('religion') || meanings.includes('god') || meanings.includes('pray') || meanings.includes('faith')) return 'religion';
  if (meanings.includes('go') || meanings.includes('come') || meanings.includes('enter') || meanings.includes('exit') || meanings.includes('move')) return 'movement';
  if (meanings.includes('exist') || meanings.includes('being') || meanings.includes('find')) return 'existence';
  if (meanings.includes('love') || meanings.includes('joy') || meanings.includes('sad') || meanings.includes('happy') || meanings.includes('fear') || meanings.includes('anger')) return 'emotion';
  if (meanings.includes('true') || meanings.includes('false') || meanings.includes('honest') || meanings.includes('lie')) return 'morality';
  if (meanings.includes('able') || meanings.includes('power') || meanings.includes('can') || meanings.includes('unable')) return 'ability';
  if (meanings.includes('good') || meanings.includes('bad') || meanings.includes('benefit') || meanings.includes('harm')) return 'utility';
  if (meanings.includes('thank') || meanings.includes('gratitude')) return 'gratitude';
  if (meanings.includes('time') || meanings.includes('day') || meanings.includes('year') || meanings.includes('hour')) return 'time';
  if (meanings.includes('place') || meanings.includes('location') || meanings.includes('where')) return 'space';
  if (meanings.includes('number') || meanings.includes('count') || meanings.includes('measure')) return 'quantity';
  if (meanings.includes('big') || meanings.includes('small') || meanings.includes('size')) return 'size';
  if (meanings.includes('new') || meanings.includes('old') || meanings.includes('age')) return 'temporality';
  if (meanings.includes('work') || meanings.includes('job') || meanings.includes('profession')) return 'occupation';
  if (meanings.includes('family') || meanings.includes('friend') || meanings.includes('society') || meanings.includes('people')) return 'social';
  if (meanings.includes('city') || meanings.includes('country') || meanings.includes('nation')) return 'geography';
  if (meanings.includes('money') || meanings.includes('wealth') || meanings.includes('rich') || meanings.includes('poor')) return 'economics';
  if (meanings.includes('war') || meanings.includes('peace') || meanings.includes('fight') || meanings.includes('battle')) return 'conflict';
  if (meanings.includes('begin') || meanings.includes('end') || meanings.includes('start') || meanings.includes('finish')) return 'transition';

  return 'general'; // default category
}

// Helper function to infer root meaning from derivatives
function inferRootMeaning(derivatives) {
  // Try to find a verb form or the most basic meaning
  for (const deriv of derivatives) {
    const meaning = deriv.meaning || deriv.definition_en;
    if (meaning && deriv.pos && deriv.pos.toLowerCase().includes('verb')) {
      return meaning;
    }
  }
  // Return first available meaning
  return derivatives[0]?.meaning || derivatives[0]?.definition_en || 'meaning unknown';
}

// Create a map of roots by normalized key
const rootsMap = new Map();

// Add current roots to the map
currentDict.roots.forEach(root => {
  const normalizedKey = denormalizeRoot(root.root);
  rootsMap.set(normalizedKey, {
    root: root.root,
    rootLatin: root.rootLatin,
    meaning: root.meaning,
    category: root.category,
    derivatives: root.derivatives,
    source: 'current'
  });
});

console.log(`Loaded ${currentDict.roots.length} roots from current dictionary`);

// Process conversational roots
let conversationalAdded = 0;
let conversationalMerged = 0;
Object.entries(conversationalDict.roots).forEach(([rootKey, rootData]) => {
  if (rootsMap.has(rootKey)) {
    // Root exists, merge derivatives
    const existing = rootsMap.get(rootKey);

    // Convert new format derivatives to our format
    rootData.derivatives.forEach(deriv => {
      const newDeriv = {
        word: deriv.lemma_fa,
        latin: deriv.pron_fa,
        meaning: deriv.definition_en || 'meaning unknown',
        pos: mapPOS(deriv.pos)
      };

      // Check if this derivative already exists
      const exists = existing.derivatives.some(d => d.word === newDeriv.word);
      if (!exists) {
        existing.derivatives.push(newDeriv);
      }
    });

    conversationalMerged++;
  } else {
    // New root, add it
    const derivatives = rootData.derivatives.map(deriv => ({
      word: deriv.lemma_fa,
      latin: deriv.pron_fa,
      meaning: deriv.definition_en || 'meaning unknown',
      pos: mapPOS(deriv.pos)
    }));

    rootsMap.set(rootKey, {
      root: normalizeRoot(rootKey),
      rootLatin: rootKey, // We'll use the Arabic as placeholder
      meaning: inferRootMeaning(rootData.derivatives),
      category: categorizeRoot(rootKey, derivatives),
      derivatives: derivatives,
      source: 'conversational'
    });

    conversationalAdded++;
  }
});

console.log(`Added ${conversationalAdded} new roots from conversational dictionary`);
console.log(`Merged derivatives for ${conversationalMerged} existing roots from conversational`);

// Process news roots (similar to conversational)
let newsAdded = 0;
let newsMerged = 0;
Object.entries(newsDict.roots).forEach(([rootKey, rootData]) => {
  if (rootsMap.has(rootKey)) {
    // Root exists, merge derivatives
    const existing = rootsMap.get(rootKey);

    // Convert new format derivatives to our format
    rootData.derivatives.forEach(deriv => {
      const newDeriv = {
        word: deriv.lemma_fa,
        latin: deriv.pron_fa,
        meaning: deriv.definition_en || 'meaning unknown',
        pos: mapPOS(deriv.pos)
      };

      // Check if this derivative already exists
      const exists = existing.derivatives.some(d => d.word === newDeriv.word);
      if (!exists) {
        existing.derivatives.push(newDeriv);
      }
    });

    newsMerged++;
  } else {
    // New root, add it (though this shouldn't happen since conv and news are identical)
    const derivatives = rootData.derivatives.map(deriv => ({
      word: deriv.lemma_fa,
      latin: deriv.pron_fa,
      meaning: deriv.definition_en || 'meaning unknown',
      pos: mapPOS(deriv.pos)
    }));

    rootsMap.set(rootKey, {
      root: normalizeRoot(rootKey),
      rootLatin: rootKey,
      meaning: inferRootMeaning(rootData.derivatives),
      category: categorizeRoot(rootKey, derivatives),
      derivatives: derivatives,
      source: 'news'
    });

    newsAdded++;
  }
});

console.log(`Added ${newsAdded} new roots from news dictionary`);
console.log(`Merged derivatives for ${newsMerged} existing roots from news`);

// Convert map to array and assign IDs
const mergedRoots = Array.from(rootsMap.values()).map((root, index) => ({
  id: index + 1,
  root: root.root,
  rootLatin: root.rootLatin,
  meaning: root.meaning,
  category: root.category,
  derivatives: root.derivatives
}));

// Create final dictionary object
const finalDict = {
  version: "2.0.0",
  language: "farsi",
  description: "Comprehensive Arabic roots found in Persian/Farsi - merged from multiple sources",
  sources: [
    "Original 35 curated roots",
    "Conversational Persian roots (150 roots)",
    "News Persian roots (150 roots)"
  ],
  roots: mergedRoots,
  note: `Merged dictionary with ${mergedRoots.length} unique Arabic roots and ${mergedRoots.reduce((sum, r) => sum + r.derivatives.length, 0)} derivative words. Expanded from 35 to ${mergedRoots.length} roots.`
};

// Write the merged dictionary
const outputPath = path.join(__dirname, '../data/farsi-roots-merged.json');
fs.writeFileSync(outputPath, JSON.stringify(finalDict, null, 2), 'utf8');

console.log(`\n✅ Merged dictionary saved to: farsi-roots-merged.json`);
console.log(`📊 Total unique roots: ${mergedRoots.length}`);
console.log(`📚 Total derivatives: ${mergedRoots.reduce((sum, r) => sum + r.derivatives.length, 0)}`);
console.log(`\nCategory breakdown:`);

// Count by category
const categoryCount = {};
mergedRoots.forEach(root => {
  categoryCount[root.category] = (categoryCount[root.category] || 0) + 1;
});

Object.entries(categoryCount)
  .sort((a, b) => b[1] - a[1])
  .forEach(([category, count]) => {
    console.log(`  ${category}: ${count} roots`);
  });
