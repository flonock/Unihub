const fs = require('fs');

// 1. Read files
const pagePath = './src/app/page.tsx';
let pageContent = fs.readFileSync(pagePath, 'utf8');

const fmPath = './src/components/flashcards/FlashcardManager.tsx';
let fmContent = fs.readFileSync(fmPath, 'utf8');

// 2. Modify FlashcardManager.tsx
const fmStates = `
  const [newDeckName, setNewDeckName] = useState('');
  const [newDeckLink, setNewDeckLink] = useState('');
  const [activeCardId, setActiveCardId] = useState<string | null>(null);
  const [cardFront, setCardFront] = useState('');
  const [cardBack, setCardBack] = useState('');
  const [cardTags, setCardTags] = useState('');
  const [cramIndex, setCramIndex] = useState(0);
  const [activeSessionType, setActiveSessionType] = useState('ALL');

  const handleAddDeck = () => {
      if (!newDeckName) return;
      const newDeck = {
          id: Date.now().toString(),
          name: newDeckName,
          linkedSemester: selectedSemester || '',
          linkedLecture: '',
          cards: []
      };
      const newDecks = [...(data.decks || []), newDeck];
      setData({...data, decks: newDecks});
      saveData({...data, decks: newDecks});
      setNewDeckName('');
      setNewDeckLink('');
  };

  const handleDeleteDeck = (id: string) => {
      const newDecks = (data.decks || []).filter((d: any) => d.id !== id);
      setData({...data, decks: newDecks});
      saveData({...data, decks: newDecks});
      if (activeDeckId === id) setActiveDeckId(null);
  };
`;

// Inject into FlashcardManager.tsx
fmContent = fmContent.replace(/const processHtml = /, fmStates + '\n  const processHtml = ');

// Remove from destructuring
const toRemove = [
  'newDeckName', 'setNewDeckName', 'newDeckLink', 'setNewDeckLink',
  'handleAddDeck', 'handleDeleteDeck', 'activeCardId', 'setActiveCardId',
  'cardFront', 'setCardFront', 'cardBack', 'setCardBack', 'cardTags', 'setCardTags',
  'cramIndex', 'setCramIndex', 'activeSessionType', 'setActiveSessionType'
];

for (const v of toRemove) {
  fmContent = fmContent.replace(new RegExp(`\\b${v}\\b\\s*,?`, 'g'), '');
}

fs.writeFileSync(fmPath, fmContent, 'utf8');

// 3. Modify page.tsx
// Add imports
if (!pageContent.includes("import Dashboard")) {
  pageContent = pageContent.replace(
    /import \{ useState, useEffect \} from 'react';/, 
    "import React, { useState, useEffect } from 'react';\nimport Sidebar from '@/components/layout/Sidebar';\nimport Dashboard from '@/components/dashboard/Dashboard';\nimport LectureNexus from '@/components/lecture/LectureNexus';\nimport Planner from '@/components/planner/Planner';\nimport FlashcardManager from '@/components/flashcards/FlashcardManager';"
  );
}

// Generate ctx by just matching all state variables and handle* functions!
const states = [...pageContent.matchAll(/const \[(.+?), (.+?)\] = useState/g)].flatMap(m => [m[1], m[2]]);
const handles = [...pageContent.matchAll(/const (handle[A-Z][a-zA-Z0-9]+) = /g)].map(m => m[1]);
const asyncPrompt = "asyncPrompt, asyncConfirm, processHtml, saveData, data, setData, appConfig, setAppConfig, semesters, lectures, getConfidenceColor, activeTab, setActiveTab";
const allCtxVars = [...new Set([...states, ...handles])].join(', ');
const ctxStr = `  const ctx = { ${asyncPrompt}, ${allCtxVars} };\n\n  return (`;

pageContent = pageContent.replace(/  return \(/, ctxStr);

// Replace components
const sbStart = pageContent.indexOf('<div className="sidebar"');
const sbEnd = pageContent.indexOf('      <div className="main-content"');
if (sbStart !== -1 && sbEnd !== -1) {
    pageContent = pageContent.substring(0, sbStart) + "      <Sidebar ctx={ctx} />\n" + pageContent.substring(sbEnd);
}

const dbStart = pageContent.indexOf('<div className="mission-control"');
const dbEnd = pageContent.indexOf('{activeTab === \'LECTURE_NEXUS\'');
if (dbStart !== -1 && dbEnd !== -1) {
    // Only replace up to the exact ending div
    let dbContent = pageContent.substring(0, dbEnd);
    let lastDiv = dbContent.lastIndexOf('</div>');
    let lastLastDiv = dbContent.lastIndexOf('</div>', lastDiv - 1);
    pageContent = pageContent.substring(0, dbStart) + "        <Dashboard ctx={ctx} />\n      " + pageContent.substring(dbEnd);
}

const lnStart = pageContent.indexOf('<div className="lecture-nexus"');
const lnEnd = pageContent.indexOf('{activeTab === \'PLANNER\'');
if (lnStart !== -1 && lnEnd !== -1) {
    pageContent = pageContent.substring(0, lnStart) + "        <LectureNexus ctx={ctx} />\n      " + pageContent.substring(lnEnd);
}

const plStart = pageContent.indexOf('<div className="planner"');
const plEnd = pageContent.indexOf('{activeTab === \'OVERVIEW\'');
if (plStart !== -1 && plEnd !== -1) {
    pageContent = pageContent.substring(0, plStart) + "        <Planner ctx={ctx} />\n      " + pageContent.substring(plEnd);
}

const fcStart = pageContent.indexOf('<div className="flashcards-container"');
const fcEnd = pageContent.indexOf('{showCommandPalette && (');
if (fcStart !== -1 && fcEnd !== -1) {
    let before = pageContent.substring(0, fcStart);
    let after = pageContent.substring(fcEnd);
    pageContent = before + "        <FlashcardManager ctx={ctx} />\n        )}      \n      </div>\n\n      " + after;
}

fs.writeFileSync(pagePath, pageContent, 'utf8');
console.log("Refactoring complete.");
