#!/usr/bin/env node

/**
 * Process HSK Vocabulary Data into Extension Format
 * Creates Chinese dictionary with characters, radicals, meanings, and pinyin
 */

const fs = require('fs');
const path = require('path');

// Load HSK complete vocabulary
const hskData = JSON.parse(fs.readFileSync('/tmp/hsk-complete.json', 'utf8'));

// Common radical meanings (214 Kangxi radicals subset)
const radicalMeanings = {
  '一': 'one', '丨': 'line', '丶': 'dot', '丿': 'slash', '乙': 'second',
  '亅': 'hook', '二': 'two', '亠': 'lid', '人': 'person', '儿': 'legs',
  '入': 'enter', '八': 'eight', '冂': 'down box', '冖': 'cover', '冫': 'ice',
  '几': 'table', '凵': 'container', '刀': 'knife', '力': 'power', '勹': 'wrap',
  '匕': 'spoon', '匚': 'box', '十': 'ten', '卜': 'divination', '卩': 'seal',
  '厂': 'cliff', '厶': 'private', '又': 'again', '口': 'mouth', '囗': 'enclosure',
  '土': 'earth', '士': 'scholar', '夂': 'go', '夊': 'go slowly', '夕': 'evening',
  '大': 'big', '女': 'woman', '子': 'child', '宀': 'roof', '寸': 'inch',
  '小': 'small', '尢': 'lame', '尸': 'corpse', '屮': 'sprout', '山': 'mountain',
  '巛': 'river', '工': 'work', '己': 'self', '巾': 'turban', '干': 'dry',
  '幺': 'tiny', '广': 'shelter', '廴': 'stride', '廾': 'arch', '弋': 'shoot',
  '弓': 'bow', '彐': 'snout', '彡': 'hair', '彳': 'step', '心': 'heart',
  '戈': 'spear', '戶': 'door', '手': 'hand', '支': 'branch', '攴': 'tap',
  '文': 'script', '斗': 'dipper', '斤': 'axe', '方': 'square', '无': 'not',
  '日': 'sun', '曰': 'say', '月': 'moon', '木': 'tree', '欠': 'lack',
  '止': 'stop', '歹': 'death', '殳': 'weapon', '毋': 'do not', '比': 'compare',
  '毛': 'fur', '氏': 'clan', '气': 'steam', '水': 'water', '火': 'fire',
  '爪': 'claw', '父': 'father', '爻': 'mix', '爿': 'split wood', '片': 'slice',
  '牙': 'tooth', '牛': 'cow', '犬': 'dog', '玄': 'dark', '玉': 'jade',
  '瓜': 'melon', '瓦': 'tile', '甘': 'sweet', '生': 'life', '用': 'use',
  '田': 'field', '疋': 'foot', '疒': 'sickness', '癶': 'footsteps', '白': 'white',
  '皮': 'skin', '皿': 'dish', '目': 'eye', '矛': 'spear', '矢': 'arrow',
  '石': 'stone', '示': 'spirit', '禸': 'track', '禾': 'grain', '穴': 'cave',
  '立': 'stand', '竹': 'bamboo', '米': 'rice', '糸': 'silk', '缶': 'jar',
  '网': 'net', '羊': 'sheep', '羽': 'feather', '老': 'old', '而': 'and',
  '耒': 'plow', '耳': 'ear', '聿': 'brush', '肉': 'meat', '臣': 'minister',
  '自': 'self', '至': 'arrive', '臼': 'mortar', '舌': 'tongue', '舛': 'oppose',
  '舟': 'boat', '艮': 'stopping', '色': 'color', '艸': 'grass', '虍': 'tiger',
  '虫': 'insect', '血': 'blood', '行': 'go', '衣': 'clothes', '襾': 'cover',
  '見': 'see', '角': 'horn', '言': 'speech', '谷': 'valley', '豆': 'bean',
  '豕': 'pig', '豸': 'cat', '貝': 'shell', '赤': 'red', '走': 'run',
  '足': 'foot', '身': 'body', '車': 'cart', '辛': 'bitter', '辰': 'morning',
  '辵': 'walk', '邑': 'city', '酉': 'wine', '釆': 'separate', '里': 'village',
  '金': 'gold', '長': 'long', '門': 'gate', '阜': 'mound', '隶': 'slave',
  '隹': 'bird', '雨': 'rain', '青': 'blue', '非': 'wrong', '面': 'face',
  '革': 'leather', '韋': 'tanned hide', '韭': 'leek', '音': 'sound', '頁': 'head',
  '風': 'wind', '飛': 'fly', '食': 'eat', '首': 'head', '香': 'fragrant',
  '馬': 'horse', '骨': 'bone', '高': 'tall', '髟': 'hair', '鬥': 'fight',
  '鬯': 'sacrificial wine', '鬲': 'tripod', '鬼': 'ghost', '魚': 'fish', '鳥': 'bird',
  '鹵': 'salt', '鹿': 'deer', '麥': 'wheat', '麻': 'hemp', '黃': 'yellow',
  '黍': 'millet', '黑': 'black', '黹': 'embroidery', '黽': 'frog', '鼎': 'tripod',
  '鼓': 'drum', '鼠': 'rat', '鼻': 'nose', '齊': 'even', '齒': 'tooth',
  '龍': 'dragon', '龜': 'turtle', '龠': 'flute',
  // Variants
  '亻': 'person', '氵': 'water', '扌': 'hand', '犭': 'dog', '艹': 'grass',
  '讠': 'speech', '钅': 'gold', '饣': 'eat', '纟': 'silk', '阝': 'mound/city',
  '忄': 'heart', '⺮': 'bamboo', '⺼': 'meat', '辶': 'walk', '⺌': 'small',
  '⺀': 'lid'
};

// Filter for HSK 1-4 words (old system to match user's requested levels)
const hsk1234Words = Object.values(hskData).filter(entry => {
  if (!entry.level) return false;
  return entry.level.some(level =>
    level === 'old-1' || level === 'old-2' || level === 'old-3' || level === 'old-4'
  );
});

console.log(`Found ${hsk1234Words.length} words in HSK 1-4`);

// Group by radical for our dictionary structure
const radicalGroups = {};
const wordsList = [];

hsk1234Words.forEach((entry, index) => {
  const radical = entry.radical;
  const simplified = entry.simplified;
  const form = entry.forms[0]; // Get first form

  if (!form) return; // Skip if no forms

  // Determine HSK level
  const hskLevel = entry.level.find(l => l.startsWith('old-')) || entry.level[0];
  const levelNum = hskLevel ? parseInt(hskLevel.split('-')[1]) : 1;

  // Get meanings
  const meanings = form.meanings || [];
  const meaning = meanings.join('; ') || 'meaning pending';

  // Get pinyin
  const pinyin = form.transcriptions?.pinyin || 'pinyin pending';

  // Map POS
  const posTypes = entry.pos || ['n'];
  let pos = 'noun';
  if (posTypes.includes('v')) pos = 'verb';
  else if (posTypes.includes('a')) pos = 'adjective';
  else if (posTypes.includes('r')) pos = 'pronoun';
  else if (posTypes.includes('d')) pos = 'adverb';
  else if (posTypes.includes('p')) pos = 'preposition';
  else if (posTypes.includes('m')) pos = 'measure word';
  else if (posTypes.includes('num')) pos = 'number';
  else if (posTypes.includes('c')) pos = 'conjunction';

  const wordEntry = {
    id: index + 1,
    character: simplified,
    traditional: form.traditional || simplified,
    pinyin: pinyin,
    meaning: meaning,
    pos: pos,
    radical: radical,
    radicalMeaning: radicalMeanings[radical] || 'radical',
    hskLevel: levelNum,
    frequency: entry.frequency || 0
  };

  wordsList.push(wordEntry);

  // Group by radical
  if (!radicalGroups[radical]) {
    radicalGroups[radical] = {
      radical: radical,
      meaning: radicalMeanings[radical] || 'radical',
      characters: []
    };
  }
  radicalGroups[radical].characters.push(wordEntry);
});

// Create final dictionary structure
const chineseDictionary = {
  version: '1.1.0',
  language: 'chinese',
  variant: 'simplified',
  description: 'HSK 1-4 vocabulary with radical decomposition',
  levels: 'HSK 1-4 (old system)',
  totalWords: wordsList.length,
  totalRadicals: Object.keys(radicalGroups).length,
  words: wordsList.sort((a, b) => a.hskLevel - b.hskLevel || a.frequency - b.frequency),
  radicals: Object.values(radicalGroups).sort((a, b) =>
    b.characters.length - a.characters.length
  )
};

// Save dictionary
const outputPath = path.join(__dirname, '../data/chinese-hsk.json');
fs.writeFileSync(outputPath, JSON.stringify(chineseDictionary, null, 2), 'utf8');

console.log(`\n✅ Chinese dictionary created: chinese-hsk.json`);
console.log(`📊 Total words: ${chineseDictionary.totalWords}`);
console.log(`📊 Total radicals: ${chineseDictionary.totalRadicals}`);
console.log(`\nWords by HSK level:`);
[1, 2, 3, 4].forEach(level => {
  const count = wordsList.filter(w => w.hskLevel === level).length;
  console.log(`  HSK ${level}: ${count} words`);
});

console.log(`\nTop 10 radicals by character count:`);
chineseDictionary.radicals.slice(0, 10).forEach((r, i) => {
  console.log(`  ${i + 1}. ${r.radical} (${r.meaning}): ${r.characters.length} characters`);
});
