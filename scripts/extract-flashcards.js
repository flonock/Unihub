const fs = require('fs');

const pagePath = './src/app/page.tsx';
let pageContent = fs.readFileSync(pagePath, 'utf8');

const fcStartStr = "{activeTab === 'FLASHCARDS' && (";
const fcStartIdx = pageContent.indexOf(fcStartStr);
const fcEndStr = "{showCommandPalette && (";
const fcEndIdx = pageContent.indexOf(fcEndStr, fcStartIdx);

if (fcStartIdx === -1 || fcEndIdx === -1) {
  console.log("Could not find FLASHCARDS block");
  process.exit(1);
}

// Extract block between fcStartIdx and fcEndIdx. The `</div>\n\n      {showCommandPalette` means we need to chop off the `</div>` that belongs to main-content
let rawSubstring = pageContent.substring(fcStartIdx + fcStartStr.length, fcEndIdx).trim();
// The substring ends with `)}\n      </div>`
// We need to remove the trailing `</div>` (which closes `main-content`)
rawSubstring = rawSubstring.replace(/<\/div>$/, '').trim();
// Now it ends with `)}`
let block = rawSubstring.replace(/\}$/, '').trim();

// Add class/styling refactors to the string directly
// 1. Grid layouts for library
block = block.replace(/border: '1px solid var\(--muted\)'/g, "border: '1px solid var(--muted)', borderRadius: '4px'");
block = block.replace(/className="flashcard-deck-list"/g, "style={{ display: 'grid', gridTemplateColumns: '1fr', gap: '10px' }}");
block = block.replace(/className="flashcard-card-list"/g, "style={{ display: 'grid', gridTemplateColumns: '1fr', gap: '10px' }}");

// 2. The flashcard player styling (dangerouslySetInnerHTML div)
block = block.replace(/border: '1px solid var\(--gold\)'/g, "border: '1px solid var(--gold)', boxShadow: '0 0 15px rgba(234, 157, 52, 0.2)', padding: '50px', background: 'var(--base)'");


const fcCode = `import React from 'react';

export default function FlashcardManager({ ctx }: { ctx: any }) {
  const {
    data, semesters, selectedSemester, lectures, flashcardTab, setFlashcardTab,
    activeDeckId, setActiveDeckId, newDeckName, setNewDeckName, newDeckLink, setNewDeckLink,
    handleAddDeck, handleDeleteDeck, activeCardId, setActiveCardId, editingCard, setEditingCard,
    cardFront, setCardFront, cardBack, setCardBack, cardTags, setCardTags, handleSaveCard, handleDeleteCard,
    cramQueue, setCramQueue, cramIndex, setCramIndex, sessionBuilder, setSessionBuilder, activeSessionId, setActiveSessionId,
    activeSessionType, setActiveSessionType, expandedDecks, setExpandedDecks, saveData, prepareCramQueue, handleRateCramCard
  } = ctx;

  const processHtml = (text: string) => {
      let t = text.replace(/\\n/g, '<br/>');
      t = t.replace(/\\*\\*(.*?)\\*\\*/g, '<b>$1</b>');
      return t;
  };

  const activeDeck = data.decks?.find((d: any) => d.id === activeDeckId) || null;

  return (
    ${block}
  );
}
`;

fs.writeFileSync('./src/components/flashcards/FlashcardManager.tsx', fcCode, 'utf8');

// Now, replace FLASHCARDS in page.tsx
if (!pageContent.includes("import FlashcardManager")) {
  pageContent = pageContent.replace("import Planner from '@/components/planner/Planner';", "import Planner from '@/components/planner/Planner';\nimport FlashcardManager from '@/components/flashcards/FlashcardManager';");
}

const fcReplacement = "{activeTab === 'FLASHCARDS' && (\n          <FlashcardManager ctx={ctx} />\n        )}\n      </div>";

pageContent = pageContent.substring(0, fcStartIdx) + fcReplacement + "\n\n      " + pageContent.substring(fcEndIdx);

fs.writeFileSync(pagePath, pageContent, 'utf8');

console.log("FlashcardManager extracted successfully!");
