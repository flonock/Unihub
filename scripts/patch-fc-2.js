const fs = require('fs');

const fmPath = './src/components/flashcards/FlashcardManager.tsx';
let fmContent = fs.readFileSync(fmPath, 'utf8');

// 1. Add all missing states and functions
const fmStates = `
  const [newDeckName, setNewDeckName] = useState('');
  const [newDeckLink, setNewDeckLink] = useState('');
  const [activeCardId, setActiveCardId] = useState<string | null>(null);
  const [cardFront, setCardFront] = useState('');
  const [cardBack, setCardBack] = useState('');
  const [cardTags, setCardTags] = useState('');
  const [cramIndex, setCramIndex] = useState(0);
  const [activeSessionType, setActiveSessionType] = useState('ALL');
  const [currentCardIndex, setCurrentCardIndex] = useState(0);
  const [sessionStudyFilter, setSessionStudyFilter] = useState<'ALL' | 'HARD' | 'EASY' | null>(null);
  const [importModalData, setImportModalData] = useState<{ semester: string, lecture: string } | null>(null);

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

  const handleSaveSession = (session: any) => {
      if (!session || !session.name) {
          alert("Session must have a name!");
          return;
      }
      const newSessions = [...(data.studySessions || []), session];
      const newData = { ...data, studySessions: newSessions };
      setData(newData);
      saveData(newData);
      setFlashcardTab('LIBRARY');
  };

  const handleDeleteSession = (id: string) => {
      const newSessions = (data.studySessions || []).filter((s: any) => s.id !== id);
      const newData = { ...data, studySessions: newSessions };
      setData(newData);
      saveData(newData);
  };

  const handleCreateDeck = (semester: string, lecture: string) => {
      setDeckSettingsModal({ isOpen: true, defaultSemester: semester, defaultLecture: lecture });
  };
`;

// Insert after import React
fmContent = fmContent.replace("import React from 'react';", "import React, { useState } from 'react';\n\ntype Deck = any;\n");
fmContent = fmContent.replace(/  const processHtml = /, fmStates + '\n  const processHtml = ');

// 2. Remove the missing variables from ctx destructuring
const toRemove = [
  'newDeckName', 'setNewDeckName', 'newDeckLink', 'setNewDeckLink',
  'handleAddDeck', 'handleDeleteDeck', 'activeCardId', 'setActiveCardId',
  'cardFront', 'setCardFront', 'cardBack', 'setCardBack', 'cardTags', 'setCardTags',
  'cramIndex', 'setCramIndex', 'activeSessionType', 'setActiveSessionType',
  'importLoading', 'currentCardIndex' // also clean up importLoading which is only used partially
];

// careful replace for destructuring
for (const v of toRemove) {
  // remove the variable and trailing/leading commas/spaces
  fmContent = fmContent.replace(new RegExp(`\\b${v}\\b\\s*,?`, 'g'), '');
}
// Clean up trailing commas before }
fmContent = fmContent.replace(/,\s*\}/g, '}');

// 3. Fix implicit any types and other TS errors
// Fix duplicate properties
fmContent = fmContent.replace(/borderRadius: '4px', padding: '20px', borderRadius: '8px'/g, "borderRadius: '8px', padding: '20px'");
fmContent = fmContent.replace(/borderRadius: '4px', padding: '20px', width: '300px', display: 'flex', flexDirection: 'column', borderRadius: '4px'/g, "borderRadius: '4px', padding: '20px', width: '300px', display: 'flex', flexDirection: 'column'");
fmContent = fmContent.replace(/background: 'var\(--base\)', border: '1px solid var\(--muted\)', padding: '40px', borderRadius: '8px'/g, "background: 'var(--base)', border: '1px solid var(--muted)', padding: '40px', borderRadius: '8px'");
fmContent = fmContent.replace(/border: '1px solid var\(--gold\)', boxShadow: '0 0 15px rgba\(234, 157, 52, 0.2\)', background: 'var\(--base\)', padding: '40px'/g, "border: '1px solid var(--gold)', boxShadow: '0 0 15px rgba(234, 157, 52, 0.2)', background: 'var(--base)', padding: '40px'");
// Manual replacement for those duplicate properties:
fmContent = fmContent.replace(/style={{ background: 'var\(--base\)', border: '1px solid var\(--muted\)', borderRadius: '4px', padding: '40px', borderRadius: '8px', minHeight: '200px', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '1.2rem', textAlign: 'center', whiteSpace: 'pre-wrap' }}/g, "style={{ background: 'var(--base)', border: '1px solid var(--muted)', padding: '40px', borderRadius: '8px', minHeight: '200px', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '1.2rem', textAlign: 'center', whiteSpace: 'pre-wrap' }}");
fmContent = fmContent.replace(/style={{ background: 'var\(--surface\)', border: '1px solid var\(--gold\)', boxShadow: '0 0 15px rgba\(234, 157, 52, 0.2\)', padding: '50px', background: 'var\(--base\)', padding: '40px', borderRadius: '8px', minHeight: '200px', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '1.2rem', textAlign: 'center', whiteSpace: 'pre-wrap' }}/g, "style={{ border: '1px solid var(--gold)', boxShadow: '0 0 15px rgba(234, 157, 52, 0.2)', background: 'var(--base)', padding: '40px', borderRadius: '8px', minHeight: '200px', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '1.2rem', textAlign: 'center', whiteSpace: 'pre-wrap' }}");

// Fix implicit any
fmContent = fmContent.replace(/\(s =>/g, "((s: any) =>");
fmContent = fmContent.replace(/\(session =>/g, "((session: any) =>");
fmContent = fmContent.replace(/\(deck =>/g, "((deck: any) =>");
fmContent = fmContent.replace(/\(c =>/g, "((c: any) =>");
fmContent = fmContent.replace(/\(card, i\) =>/g, "((card: any, i: any) =>");
fmContent = fmContent.replace(/\(lec =>/g, "((lec: any) =>");
fmContent = fmContent.replace(/\(d =>/g, "((d: any) =>");

fs.writeFileSync(fmPath, fmContent, 'utf8');
console.log("FlashcardManager patched.");
