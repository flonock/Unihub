const fs = require('fs');
let content = fs.readFileSync('src/app/page.tsx', 'utf8');

// 1. Add imports
const importsToAdd = `
import Dashboard from '@/components/dashboard/Dashboard';
import FlashcardManager from '@/components/flashcards/FlashcardManager';
`;
content = content.replace("import React, { useState, useEffect } from 'react';", "import React, { useState, useEffect } from 'react';\n" + importsToAdd);

// 2. Add ctx object right before the return statement
// We need to parse all variables to pass them. Let's just pass everything that might be needed.
// A safe way is to find "return (" and insert ctx right before it.
const returnIdx = content.lastIndexOf('  return (\n    <div className="workspace"');
if (returnIdx === -1) throw new Error("Could not find return statement");

// Rather than building an exhaustive ctx object, we can extract state and handle functions automatically.
const states = [...content.matchAll(/const \[(.+?), (.+?)\] = useState/g)].flatMap(m => [m[1], m[2]]);
const handles = [...content.matchAll(/const (handle[A-Z][a-zA-Z0-9]+) = /g)].map(m => m[1]);
// Hardcoded other useful functions/vars that Dashboard or FlashcardManager might need
const others = [
    "data", "setData", "semesters", "selectedSemester", "lectures", "activeDeckId", "setActiveDeckId",
    "editingCard", "setEditingCard", "showAnswer", "setShowAnswer", "currentCardIndex", "setCurrentCardIndex",
    "saveData", "asyncPrompt", "asyncConfirm", "processHtml", "getConfidenceColor", "activeTab", "setActiveTab",
    "flashcardTab", "setFlashcardTab", "prepareCramQueue"
];
// Deduplicate and filter out those that don't exist
const uniqueCtx = [...new Set([...states, ...handles, ...others])];

const ctxDef = `  const ctx = {\n    ${uniqueCtx.join(',\n    ')}\n  };\n\n`;
content = content.substring(0, returnIdx) + ctxDef + content.substring(returnIdx);

// 3. Replace MISSION_CONTROL
const mcStart = content.indexOf("        {activeTab === 'MISSION_CONTROL' && (");
const plStart = content.indexOf("        {activeTab === 'PLANNER' && (");
if (mcStart === -1 || plStart === -1) throw new Error("Could not find MISSION_CONTROL bounds");

content = content.substring(0, mcStart) + 
          "        {activeTab === 'MISSION_CONTROL' && (\n          <Dashboard ctx={ctx} />\n        )}\n\n" + 
          content.substring(plStart);

// 4. Replace FLASHCARDS
const fcStart = content.indexOf("        {activeTab === 'FLASHCARDS' && (");
const cmdStart = content.indexOf("      {showCommandPalette && (");
if (fcStart === -1 || cmdStart === -1) throw new Error("Could not find FLASHCARDS bounds");

content = content.substring(0, fcStart) + 
          "        {activeTab === 'FLASHCARDS' && (\n          <FlashcardManager ctx={ctx} />\n        )}\n\n" + 
          content.substring(cmdStart);

fs.writeFileSync('src/app/page.tsx', content);
console.log("Patched page.tsx successfully");
