#!/usr/bin/env node

/**
 * Fix null or "meaning unknown" entries in dictionary
 */

const fs = require('fs');
const path = require('path');

const dictPath = path.join(__dirname, '../data/farsi-roots.json');
const dict = JSON.parse(fs.readFileSync(dictPath, 'utf8'));

let fixed = 0;

dict.roots.forEach(root => {
  root.derivatives.forEach(deriv => {
    if (!deriv.meaning || deriv.meaning === 'meaning unknown' || deriv.meaning === null) {
      // Use a default meaningful message
      deriv.meaning = `[${deriv.word}] (definition pending)`;
      fixed++;
    }
  });
});

fs.writeFileSync(dictPath, JSON.stringify(dict, null, 2), 'utf8');

console.log(`✅ Fixed ${fixed} derivatives with null/unknown meanings`);
console.log(`📊 Dictionary now has ${dict.roots.length} roots with ${dict.roots.reduce((sum, r) => sum + r.derivatives.length, 0)} derivatives`);
