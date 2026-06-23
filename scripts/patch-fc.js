const fs = require('fs');
const file = './src/components/flashcards/FlashcardManager.tsx';
let content = fs.readFileSync(file, 'utf8');

// 1. Fix missing states and functions
content = content.replace("import React from 'react';", "import React, { useState } from 'react';\n\ntype Deck = any;\n");

const toInject = `
  const [currentCardIndex, setCurrentCardIndex] = useState(0);
  const [sessionStudyFilter, setSessionStudyFilter] = useState<'ALL' | 'HARD' | 'EASY' | null>(null);
  const [importModalData, setImportModalData] = useState<{ semester: string, lecture: string } | null>(null);

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

content = content.replace(/  const processHtml = \(text: string\) => {/, toInject + '\n  const processHtml = (text: string) => {');

// Remove currentCardIndex from ctx destructuring
content = content.replace(/importLoading, currentCardIndex/, "importLoading");

// 2. Fix duplicate style properties
content = content.replace(/borderRadius: '4px', padding: '20px', borderRadius: '8px'/g, "borderRadius: '8px', padding: '20px'");
content = content.replace(/borderRadius: '4px', padding: '20px', width: '300px', display: 'flex', flexDirection: 'column', borderRadius: '4px'/g, "borderRadius: '4px', padding: '20px', width: '300px', display: 'flex', flexDirection: 'column'");

// 3. Fix implicit any types that are left
content = content.replace(/\(s =>/g, "(s: any =>");
content = content.replace(/\(s: any =>/g, "((s: any) =>");

content = content.replace(/\(session =>/g, "(session: any =>");
content = content.replace(/\(session: any =>/g, "((session: any) =>");

content = content.replace(/\(deck =>/g, "(deck: any =>");
content = content.replace(/\(deck: any =>/g, "((deck: any) =>");

content = content.replace(/\(c =>/g, "(c: any =>");
content = content.replace(/\(c: any =>/g, "((c: any) =>");

content = content.replace(/\(card, i\) =>/g, "((card: any, i: any) =>");

content = content.replace(/\(lec =>/g, "(lec: any =>");
content = content.replace(/\(lec: any =>/g, "((lec: any) =>");

// Fix remaining d =>
content = content.replace(/\(d =>/g, "((d: any) =>");
content = content.replace(/\(\(d: any\): any\)/g, "((d: any) =>"); // cleanup if needed

// Fix res =>
content = content.replace(/\(res =>/g, "((res: any) =>");

// Fix ad =>
content = content.replace(/\(ad =>/g, "((ad: any) =>");

fs.writeFileSync(file, content, 'utf8');
console.log("FlashcardManager patched.");
