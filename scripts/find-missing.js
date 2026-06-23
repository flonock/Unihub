const fs = require('fs');

const pageContent = fs.readFileSync('./src/app/page.tsx', 'utf8');
const fmContent = fs.readFileSync('./src/components/flashcards/FlashcardManager.tsx', 'utf8');

// Extract all words from destructuring in FlashcardManager
const match = fmContent.match(/const\s+\{\s*([\s\S]+?)\}\s*=\s*ctx;/);
if (!match) {
  console.error("Could not find ctx destructuring in FlashcardManager");
  process.exit(1);
}

const destructured = match[1].split(',').map(s => s.trim()).filter(Boolean);

// Find which ones are missing in page.tsx
const missing = [];
for (const v of destructured) {
  // A variable exists in page.tsx if there's "const v " or "let v " or "function v" or "v =" or "v," in state destructuring
  // We'll just do a regex search for `\b${v}\b`
  if (!pageContent.match(new RegExp(`\\b${v}\\b`))) {
    missing.push(v);
  }
}

console.log("Missing variables in page.tsx:");
console.log(missing.join(', '));
