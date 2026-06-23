const fs = require('fs');
let content = fs.readFileSync('src/app/page.tsx', 'utf8');

// Imports
content = content.replace(
  "import { useState, useEffect } from 'react';",
  "import React, { useState, useEffect } from 'react';\nimport Sidebar from '@/components/layout/Sidebar';\nimport Dashboard from '@/components/dashboard/Dashboard';\nimport LectureNexus from '@/components/lecture/LectureNexus';\nimport Planner from '@/components/planner/Planner';\nimport FlashcardManager from '@/components/flashcards/FlashcardManager';"
);

// Sidebar
const sbStart = content.indexOf('<div className="sidebar"');
const sbEnd = content.indexOf('      <div className="main-content"');
content = content.substring(0, sbStart) + "      <Sidebar ctx={ctx} />\n" + content.substring(sbEnd);

// BROWSER -> LectureNexus
const brStart = content.indexOf("{activeTab === 'BROWSER' && (");
const mcStart = content.indexOf("{activeTab === 'MISSION_CONTROL' && (");
content = content.substring(0, brStart) + "{activeTab === 'BROWSER' && (\n          <LectureNexus ctx={ctx} />\n        )}\n        " + content.substring(mcStart);

// MISSION_CONTROL -> Dashboard
const mcNext = content.indexOf("{activeTab === 'PLANNER' && (");
content = content.substring(0, mcStart) + "{activeTab === 'MISSION_CONTROL' && (\n          <Dashboard ctx={ctx} />\n        )}\n        " + content.substring(mcNext);

// PLANNER -> Planner
const plNext = content.indexOf("{activeTab === 'OVERVIEW' && (");
content = content.substring(0, mcNext) + "{activeTab === 'PLANNER' && (\n          <Planner ctx={ctx} />\n        )}\n        " + content.substring(plNext);

// FLASHCARDS -> FlashcardManager
const fcStart = content.indexOf("{activeTab === 'FLASHCARDS' && (");
const cmdStart = content.indexOf("{showCommandPalette && (");
content = content.substring(0, fcStart) + "{activeTab === 'FLASHCARDS' && (\n          <FlashcardManager ctx={ctx} />\n        )}\n\n      " + content.substring(cmdStart);

// ctx construction
const states = [...content.matchAll(/const \[(.+?), (.+?)\] = useState/g)].flatMap(m => [m[1], m[2]]);
const handles = [...content.matchAll(/const (handle[A-Z][a-zA-Z0-9]+) = /g)].map(m => m[1]);
const others = ["asyncPrompt", "asyncConfirm", "processHtml", "saveData", "data", "setData", "appConfig", "setAppConfig", "semesters", "lectures", "getConfidenceColor", "activeTab", "setActiveTab"];

const ctxSet = new Set([...states, ...handles, ...others]);

const ctxStr = `  const ctx = { ${[...ctxSet].join(', ')} };\n\n  return (`;
content = content.replace(/  return \(\n    <div className="workspace"/, ctxStr + '\n    <div className="workspace"');

fs.writeFileSync('src/app/page.tsx', content, 'utf8');
console.log("page.tsx updated");
