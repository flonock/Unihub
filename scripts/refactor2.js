const fs = require('fs');
const path = './src/app/page.tsx';

let content = fs.readFileSync(path, 'utf8');

// 1. Add import
if (!content.includes('LectureNexus')) {
    content = content.replace("import Sidebar from '@/components/layout/Sidebar';", "import Sidebar from '@/components/layout/Sidebar';\nimport LectureNexus from '@/components/lecture/LectureNexus';");
}

// 2. Expand ctx object
const oldCtxEnd = 'jd, utc, encInput, setEncInput, encMode, setEncMode, pingData\n  };';
const newCtxEnd = 'jd, utc, encInput, setEncInput, encMode, setEncMode, pingData,\n    renderProgressBar, handleDeleteFolder, handleCreateFolder, handleNewNote, prepareCramQueue, handleOpen, navigateToLink, files, setFlashcardTab, getCalculatedConfidence\n  };';
content = content.replace(oldCtxEnd, newCtxEnd);

// 3. Inject LECTURE_NEXUS block
// We'll insert it right after the MISSION_CONTROL block closes.
// Look for MISSION_CONTROL block end (it is followed by PLANNER block)
const searchStr = `        )}

        {activeTab === 'PLANNER' && (`;

const insertStr = `        )}

        {activeTab === 'LECTURE_NEXUS' && (
           <LectureNexus ctx={ctx} />
        )}

        {activeTab === 'PLANNER' && (`;

if (content.includes(searchStr)) {
    content = content.replace(searchStr, insertStr);
} else {
    console.error("Could not find insertion point for LECTURE_NEXUS");
}

// 4. Also, replace instances of setActiveTab('MISSION_CONTROL') with setActiveTab('DASHBOARD') in the Sidebar code... wait, Sidebar is already its own file and it uses 'DASHBOARD'.
// But in page.tsx we still check for 'MISSION_CONTROL'. We should rename the check.
content = content.replace("{activeTab === 'MISSION_CONTROL' && (", "{['MISSION_CONTROL', 'DASHBOARD'].includes(activeTab) && (");

fs.writeFileSync(path, content, 'utf8');
console.log("Refactored successfully.");
