const fs = require('fs');
let file = fs.readFileSync('src/components/flashcards/FlashcardManager.tsx', 'utf8');

// Add import Icons
if (!file.includes("import { Icons }")) {
    file = file.replace("import React from 'react';", "import React from 'react';\nimport { Icons } from '../shared/Icons';");
}

// Replace session actions
file = file.replace(
    /<button className="button" onClick=\{async \(\) => \{\s+const filter = await asyncPrompt\('Study Filter: \(ALL, HARD, EASY\)', 'ALL'\);\s+if \(filter && \['ALL', 'HARD', 'EASY'\].includes\(filter.toUpperCase\(\)\)\) \{\s+prepareCramQueue\(session, filter.toUpperCase\(\) as any\);\s+\}\s+\}\} style=\{\{ flex: 1, borderColor: 'var\(--gold\)', color: 'var\(--gold\)' \}\}>Study<\/button>\s+<button className="button" onClick=\{\(\) => setSessionBuilder\(session\)\} style=\{\{ borderColor: 'var\(--iris\)', color: 'var\(--iris\)' \}\}>Edit<\/button>\s+<button className="button" onClick=\{async \(\) => \{ if \(await asyncConfirm\('Delete session\?'\)\) handleDeleteSession\(session.id\); \}\} style=\{\{ borderColor: 'var\(--love\)', color: 'var\(--love\)' \}\}>Del<\/button>/g,
    `<button className="button" onClick={async () => {
                                          const filter = await asyncPrompt('Study Filter: (ALL, HARD, EASY)', 'ALL');
                                          if (filter && ['ALL', 'HARD', 'EASY'].includes(filter.toUpperCase())) {
                                              prepareCramQueue(session, filter.toUpperCase() as any);
                                          }
                                      }} style={{ flex: 1, borderColor: 'var(--gold)', color: 'var(--gold)' }}><Icons.Play size={14} /> STUDY</button>
                                      <button className="icon-button edit" onClick={() => setSessionBuilder(session)} title="Edit Session"><Icons.Edit size={16} /></button>
                                      <button className="icon-button delete" onClick={async () => { if (await asyncConfirm('Delete session?')) handleDeleteSession(session.id); }} title="Delete Session"><Icons.Delete size={16} /></button>`
);

// Replace "+ NEW SESSION" and "+ NEW DECK"
file = file.replace(
    /\+ NEW SESSION/g,
    '<Icons.Plus size={14} /> NEW SESSION'
);
file = file.replace(
    /\+ NEW DECK/g,
    '<Icons.Plus size={14} /> NEW DECK'
);
file = file.replace(
    /\+ IMPORT DECK/g,
    '<Icons.Plus size={14} /> IMPORT DECK'
);
file = file.replace(
    /\+ NEW CARD/g,
    '<Icons.Plus size={14} /> NEW CARD'
);

// Replace Deck Manage Buttons
file = file.replace(
    /<button className="button" disabled=\{dueCards.length === 0\} onClick=\{\(\) => \{ setActiveDeckId\(deck.id\); setCurrentCardIndex\(0\); setShowAnswer\(false\); setStudyMode\(true\); \}\} style=\{\{ flex: 1, borderColor: 'var\(--gold\)', color: 'var\(--gold\)', opacity: dueCards.length === 0 \? 0.3 : 1 \}\}>Study Now<\/button>\s+<button className="button" onClick=\{\(\) => \{ setActiveDeckId\(deck.id\); setStudyMode\(false\); \}\} style=\{\{ borderColor: 'var\(--iris\)', color: 'var\(--iris\)' \}\}>Manage<\/button>/g,
    `<button className="button" disabled={dueCards.length === 0} onClick={() => { setActiveDeckId(deck.id); setCurrentCardIndex(0); setShowAnswer(false); setStudyMode(true); }} style={{ flex: 1, borderColor: 'var(--gold)', color: 'var(--gold)', opacity: dueCards.length === 0 ? 0.3 : 1 }}><Icons.Play size={14} /> STUDY NOW</button>
                                                          <button className="button" onClick={() => { setActiveDeckId(deck.id); setStudyMode(false); }} style={{ borderColor: 'var(--iris)', color: 'var(--iris)' }}><Icons.Edit size={14} /> MANAGE</button>`
);

fs.writeFileSync('src/components/flashcards/FlashcardManager.tsx', file);
console.log('FlashcardManager patched');
