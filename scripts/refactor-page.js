const fs = require('fs');

const pagePath = './src/app/page.tsx';
let pageContent = fs.readFileSync(pagePath, 'utf8');

// 1. Add imports
const imports = `import React, { useState, useEffect } from 'react';
import Sidebar from '@/components/layout/Sidebar';
import Dashboard from '@/components/dashboard/Dashboard';
import LectureNexus from '@/components/lecture/LectureNexus';
import Planner from '@/components/planner/Planner';
import FlashcardManager from '@/components/flashcards/FlashcardManager';`;
pageContent = pageContent.replace(/import \{ useState, useEffect \} from 'react';/g, imports);

// 2. Define ctx
const ctxStr = `  const ctx = {
    data, setData, appConfig, setAppConfig, activeTab, setActiveTab, selectedSemester, setSelectedSemester, selectedLecture, setSelectedLecture, semesters, lectures, 
    handleCreateSemester, handleDeleteSemester, handleCreateLecture, handleDeleteLecture, handleOpen, navigateToLink,
    pdfPreviewFile, setPdfPreviewFile, promptData, setPromptData, confirmData, setConfirmData, settingsData, setSettingsData, editingPreview, setEditingPreview,
    newTodoTitle, setNewTodoTitle, newTodoLink, setNewTodoLink, newTodoProgress, setNewTodoProgress, newTodoDueDate, setNewTodoDueDate,
    editingTodoId, setEditingTodoId, currentMonth, setCurrentMonth, newEventTitle, setNewEventTitle, newEventType, setNewEventType, newEventStart, setNewEventStart, newEventEnd, setNewEventEnd,
    editingEventId, setEditingEventId, flashcardTab, setFlashcardTab, activeDeckId, setActiveDeckId, newDeckName, setNewDeckName, newDeckLink, setNewDeckLink,
    activeCardId, setActiveCardId, editingCard, setEditingCard, cardFront, setCardFront, cardBack, setCardBack, cardTags, setCardTags, searchCardQuery, setSearchCardQuery,
    cramQueue, setCramQueue, cramIndex, setCramIndex, sessionBuilder, setSessionBuilder, activeSessionId, setActiveSessionId, activeSessionType, setActiveSessionType,
    expandedDecks, setExpandedDecks, deckSettingsModal, setDeckSettingsModal, importModalData, setImportModalData, importModalText, setImportModalText, importModalFile, setImportModalFile,
    importLoading, setImportLoading, showCommandPalette, setShowCommandPalette, commandQuery, setCommandQuery,
    handleAddOrUpdateTodo, cancelEditTodo, cloneTodo, startEditTodo, handleDeleteTodo, saveData,
    handleAddOrUpdateEvent, cancelEditEvent, cloneEvent, startEditEvent, handleDeleteEvent,
    handleAddDeck, handleDeleteDeck, handleSaveCard, handleDeleteCard, handleMoveCard,
    prepareCramQueue, handleRateCramCard, studyMode, setStudyMode, asyncPrompt, handlePaste,
    showAnswer, setShowAnswer, handleScoreCard, asyncConfirm, availableDecks, handleImportFile, currentCardIndex, setCurrentCardIndex,
    handleSaveSession, handleDeleteSession, handleCreateDeck, groupedTodos
  };

  return (`;

pageContent = pageContent.replace(/  return \(/, ctxStr);

// 3. Replace Sidebar
const sbStart = pageContent.indexOf('<div className="sidebar"');
const sbEnd = pageContent.indexOf('      <div className="main-content"');
if (sbStart !== -1 && sbEnd !== -1) {
    pageContent = pageContent.substring(0, sbStart) + "      <Sidebar ctx={ctx} />\n" + pageContent.substring(sbEnd);
}

// 4. Replace Dashboard
const dbStart = pageContent.indexOf('<div className="mission-control"');
const dbEnd = pageContent.indexOf('        {activeTab === \'LECTURE_NEXUS\'');
if (dbStart !== -1 && dbEnd !== -1) {
    pageContent = pageContent.substring(0, dbStart) + "<Dashboard ctx={ctx} />\n" + pageContent.substring(dbEnd);
}

// 5. Replace LectureNexus
const lnStart = pageContent.indexOf('<div className="lecture-nexus"');
const lnEnd = pageContent.indexOf('        {activeTab === \'PLANNER\'');
if (lnStart !== -1 && lnEnd !== -1) {
    pageContent = pageContent.substring(0, lnStart) + "<LectureNexus ctx={ctx} />\n" + pageContent.substring(lnEnd);
}

fs.writeFileSync(pagePath, pageContent, 'utf8');
console.log("page.tsx refactored successfully!");
