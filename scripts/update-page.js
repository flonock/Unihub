const fs = require('fs');

const pagePath = './src/app/page.tsx';
let pageContent = fs.readFileSync(pagePath, 'utf8');

// 1. Add imports
if (!pageContent.includes("import Planner")) {
  pageContent = pageContent.replace(
    "import Dashboard from '@/components/dashboard/Dashboard';", 
    "import Dashboard from '@/components/dashboard/Dashboard';\nimport Planner from '@/components/planner/Planner';\nimport FlashcardManager from '@/components/flashcards/FlashcardManager';"
  );
}

// 2. Update ctx
const oldCtxStart = "const ctx = {";
const oldCtxEnd = "handleAddOrUpdateTodo, editingTodoId, cancelEditTodo, groupedTodos, cloneTodo, startEditTodo, handleDeleteTodo, saveData\n  };";

if (pageContent.includes(oldCtxEnd)) {
    const newCtxEnd = `handleAddOrUpdateTodo, editingTodoId, cancelEditTodo, groupedTodos, cloneTodo, startEditTodo, handleDeleteTodo, saveData,
    currentMonth, setCurrentMonth, newEventTitle, setNewEventTitle, newEventType, setNewEventType, newEventStart, setNewEventStart, newEventEnd, setNewEventEnd, handleAddOrUpdateEvent, editingEventId, cancelEditEvent, cloneEvent, startEditEvent, handleDeleteEvent,
    flashcardTab, activeDeckId, setActiveDeckId, newDeckName, setNewDeckName, newDeckLink, setNewDeckLink, handleAddDeck, handleDeleteDeck, activeCardId, setActiveCardId, editingCard, setEditingCard, cardFront, setCardFront, cardBack, setCardBack, cardTags, setCardTags, handleSaveCard, handleDeleteCard, cramQueue, setCramQueue, cramIndex, setCramIndex, sessionBuilder, setSessionBuilder, activeSessionId, setActiveSessionId, activeSessionType, setActiveSessionType, expandedDecks, setExpandedDecks, handleRateCramCard,
    studyMode, setStudyMode, asyncPrompt, handlePaste, searchCardQuery, setSearchCardQuery,
    setEditingPreview, handleMoveCard, editingPreview, setDeckSettingsModal,
    showAnswer, setShowAnswer, handleScoreCard, asyncConfirm, setData,
    availableDecks, handleImportFile, importLoading, currentCardIndex, setCurrentCardIndex,
    handleSaveSession, handleDeleteSession, handleCreateDeck, setImportModalData
  };`;
    pageContent = pageContent.replace(oldCtxEnd, newCtxEnd);
}

// 3. Replace PLANNER block
const plannerStartStr = "{activeTab === 'PLANNER' && (";
const plannerStartIdx = pageContent.indexOf(plannerStartStr);
if (plannerStartIdx !== -1) {
    const plannerEndStr = "{activeTab === 'OVERVIEW' && (";
    const plannerEndIdx = pageContent.indexOf(plannerEndStr, plannerStartIdx);
    if (plannerEndIdx !== -1) {
        const plannerReplacement = "{activeTab === 'PLANNER' && (\n          <Planner ctx={ctx} />\n        )}";
        pageContent = pageContent.substring(0, plannerStartIdx) + plannerReplacement + "\n\n        " + pageContent.substring(plannerEndIdx);
    }
}

// 4. Replace FLASHCARDS block
const fcStartStr = "{activeTab === 'FLASHCARDS' && (";
const fcStartIdx = pageContent.indexOf(fcStartStr);
if (fcStartIdx !== -1) {
    const fcEndStr = "{showCommandPalette && (";
    const fcEndIdx = pageContent.indexOf(fcEndStr, fcStartIdx);
    if (fcEndIdx !== -1) {
        // Find the last </div> before showCommandPalette
        // We know we just need to replace from fcStartIdx to right before fcEndIdx
        // We will do a search backwards from fcEndIdx for </div>
        let slice = pageContent.substring(fcStartIdx, fcEndIdx);
        // We want to replace the whole `slice` except the very last </div> which belongs to main-content.
        // Actually, let's just do a simple replace:
        // slice starts with `{activeTab === 'FLASHCARDS' && (`
        // and ends with `</div>\n\n      `
        
        let sub = pageContent.substring(0, fcStartIdx) + 
                  "{activeTab === 'FLASHCARDS' && (\n          <FlashcardManager ctx={ctx} />\n        )}\n      </div>\n\n      " + 
                  pageContent.substring(fcEndIdx);
        pageContent = sub;
    }
}

fs.writeFileSync(pagePath, pageContent, 'utf8');
console.log("Updated page.tsx successfully.");
