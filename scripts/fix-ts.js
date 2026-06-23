const fs = require('fs');
const path = './src/app/page.tsx';
let content = fs.readFileSync(path, 'utf8');

content = content.replace(
  "useState<'MISSION_CONTROL' | 'BROWSER' | 'PLANNER' | 'OVERVIEW' | 'FLASHCARDS'>('MISSION_CONTROL')",
  "useState<'MISSION_CONTROL' | 'DASHBOARD' | 'BROWSER' | 'PLANNER' | 'OVERVIEW' | 'FLASHCARDS' | 'LECTURE_NEXUS'>('MISSION_CONTROL')"
);

fs.writeFileSync(path, content, 'utf8');
console.log('Fixed TS error.');
