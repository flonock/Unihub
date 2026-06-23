'use client';

import { useState, useEffect } from 'react';
import Dashboard from '@/components/dashboard/Dashboard';
import FlashcardManager from '@/components/flashcards/FlashcardManager';
import WidgetPanel from '@/components/widgets/WidgetPanel';
import FlashcardOverview from '@/components/flashcards/FlashcardOverview';
import Planner from '@/components/planner/Planner';
import ActionItems from '@/components/planner/ActionItems';
import LectureNexus from '@/components/lecture/LectureNexus';
import Sidebar from '@/components/layout/Sidebar';

import type { FileEntry, Exam, Todo, CalendarEvent, LectureMeta, Flashcard, Deck, StudySession, WorkspaceData } from '@/types';

export default function Workspace() {
  const [activeTab, setActiveTab] = useState<'MISSION_CONTROL' | 'BROWSER' | 'PLANNER' | 'OVERVIEW' | 'FLASHCARDS' | 'WIDGETS'>('MISSION_CONTROL');
  const [rightPanelMode, setRightPanelMode] = useState<'ACTION_ITEMS' | 'FLASHCARDS' | 'HIDDEN'>('ACTION_ITEMS');

  const [files, setFiles] = useState<FileEntry[]>([]);
  const [currentPath, setCurrentPath] = useState('');
  const [loading, setLoading] = useState(true);
  const [pdfPreviewFile, setPdfPreviewFile] = useState<FileEntry | null>(null);

  const [semesters, setSemesters] = useState<string[]>([]);
  const [selectedSemester, setSelectedSemester] = useState<string>('');
  const [lectures, setLectures] = useState<string[]>([]);



  // Flashcard Media Processor
  const processHtml = (html: string) => {
     if (!html) return '';
     return html.replace(/src=['"]([^'"]+)['"]/gi, (match, src) => {
         if (src.startsWith('http') || src.startsWith('data:') || src.startsWith('/api/media')) return match;
         return `src="/api/media?file=${encodeURIComponent(src)}"`;
     });
  };

  // Flashcard State
  const [flashcardTab, setFlashcardTab] = useState<'SESSIONS' | 'LIBRARY'>('SESSIONS');
  const [sessionBuilder, setSessionBuilder] = useState<StudySession | null>(null);
  const [expandedDecks, setExpandedDecks] = useState<Record<string, boolean>>({});
  const [activeSessionId, setActiveSessionId] = useState<string | null>(null);
  const [sessionStudyFilter, setSessionStudyFilter] = useState<'ALL' | 'HARD' | 'EASY' | null>(null);
  const [cramQueue, setCramQueue] = useState<Flashcard[]>([]);
  const [activeDeckId, setActiveDeckId] = useState<string | null>(null);
  const [studyMode, setStudyMode] = useState<boolean>(false);
  const [currentCardIndex, setCurrentCardIndex] = useState(0);
  const [showAnswer, setShowAnswer] = useState(false);
  const [editingCard, setEditingCard] = useState<{ id?: string, front: string, back: string } | null>(null);
  const [importModalData, setImportModalData] = useState<{ semester: string, lecture: string } | null>(null);
  const [importModalText, setImportModalText] = useState('');
  const [importModalFile, setImportModalFile] = useState<File | null>(null);
  const [importLoading, setImportLoading] = useState(false);
  const [availableDecks, setAvailableDecks] = useState<{path: string, name: string, semester: string, lecture: string}[]>([]);
  const [deckSettingsModal, setDeckSettingsModal] = useState<{ isOpen: boolean, deckId?: string, defaultSemester?: string, defaultLecture?: string } | null>(null);
  const [editingPreview, setEditingPreview] = useState(false);
  const [searchCardQuery, setSearchCardQuery] = useState('');

  // Mission Control Data
  const [promptData, setPromptData] = useState<{ message: string, defaultVal: string, resolve: (val: string | null) => void } | null>(null);
  const [confirmData, setConfirmData] = useState<{ message: string, resolve: (val: boolean) => void } | null>(null);
  const asyncConfirm = (message: string) => {
      return new Promise<boolean>((resolve) => {
          setConfirmData({ message, resolve });
      });
  };
  const asyncPrompt = (message: string, defaultVal: string = '') => {
      return new Promise<string | null>((resolve) => {
          setPromptData({ message, defaultVal, resolve });
      });
  };

  const [appConfig, setAppConfig] = useState<any>({
      homeFolder: '/home/apollon/Documents/Uni',
      workspaceTitle: 'AeroSpace Workspace',
      enableFlicker: true,
      pomoWorkTime: 25,
      pomoBreakTime: 5
  });

  useEffect(() => {
     fetch('/api/settings').then(res => res.json()).then(data => {
         setAppConfig(data);
     });
  }, []);

  const [settingsData, setSettingsData] = useState<any | null>(null);
  const openSettings = async () => {
      try {
          const res = await fetch('/api/settings');
          const data = await res.json();
          setSettingsData(data);
      } catch (e) {
          setSettingsData(appConfig);
      }
  };
  const saveSettings = async () => {
      if (!settingsData) return;
      await fetch('/api/settings', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(settingsData)
      });
      setSettingsData(null);
      window.location.reload();
  };

  const [data, setData] = useState<WorkspaceData>({ exams: [], todos: [], notes: '', studyPlan: '', events: [], confidences: {}, lectureMeta: {}, containers: [], containerMaxCredits: {} });
  
  const [overviewTab, setOverviewTab] = useState<'SEMESTER' | 'CONTAINER'>('SEMESTER');
  const [overviewData, setOverviewData] = useState<Record<string, string[]>>({});

  const [showCommandPalette, setShowCommandPalette] = useState(false);
  const [commandQuery, setCommandQuery] = useState('');

  useEffect(() => {
      const handleKeyDown = (e: KeyboardEvent) => {
          if ((e.ctrlKey || e.metaKey) && e.key === 'k') {
              e.preventDefault();
              setShowCommandPalette(prev => !prev);
              setCommandQuery('');
          }
          if (e.key === 'Escape') {
              setShowCommandPalette(false);
          }
      };
      window.addEventListener('keydown', handleKeyDown);
      return () => window.removeEventListener('keydown', handleKeyDown);
  }, []);

  const allLecturesFlat = Object.entries(overviewData).flatMap(([sem, lecs]) => lecs.map(name => ({ semester: sem, name, path: `${sem}/${name}` })));

  useEffect(() => {
     if (activeTab === 'OVERVIEW') {
        const fetchAll = async () => {
           const map: Record<string, string[]> = {};
           for (const sem of semesters) {
              try {
                  const res = await fetch(`/api/files?path=${encodeURIComponent(sem)}`);
                  const d = await res.json();
                  if (d.files) {
                      map[sem] = d.files.filter((f: any) => f.isDirectory).map((f: any) => f.name);
                  }
              } catch(e) {}
           }
           setOverviewData(map);
        };
        fetchAll();
     }
  }, [activeTab, semesters]);

  const updateLectureMeta = (path: string, updates: Partial<LectureMeta>) => {
      let newData = { ...data };
      if (!newData.lectureMeta) newData.lectureMeta = {};
      const current = newData.lectureMeta[path] || { category: '', credits: 0, grade: '', container: '' };
      
      if (updates.category === 'Wahlpflicht') {
          updates.container = 'Wahlpflicht';
          if (!newData.containers) newData.containers = [];
          if (!newData.containers.includes('Wahlpflicht')) {
              newData.containers.push('Wahlpflicht');
          }
      } else if (updates.category === 'Ignore') {
          updates.container = 'Ignored';
          if (!newData.containers) newData.containers = [];
          if (!newData.containers.includes('Ignored')) {
              newData.containers.push('Ignored');
          }
      }

      newData.lectureMeta[path] = { ...current, ...updates };
      saveData(newData);
  };

  // Add/Edit Exam States
  const [newExamName, setNewExamName] = useState('');
  const [newExamDate, setNewExamDate] = useState('');
  const [newExamLink, setNewExamLink] = useState('');
  
  const [newTodoTitle, setNewTodoTitle] = useState('');
  const [newTodoLink, setNewTodoLink] = useState('');
  const [newTodoProgress, setNewTodoProgress] = useState<number>(0);
  const [newTodoDueDate, setNewTodoDueDate] = useState('');

  // Editing States
  const [editingExamId, setEditingExamId] = useState<string | null>(null);
  const [editingTodoId, setEditingTodoId] = useState<string | null>(null);
  const [editingEventId, setEditingEventId] = useState<string | null>(null);

  // Calendar State
  const [currentMonth, setCurrentMonth] = useState(new Date());
  const [newEventTitle, setNewEventTitle] = useState('');
  const [newEventStart, setNewEventStart] = useState('');
  const [newEventEnd, setNewEventEnd] = useState('');
  const [newEventType, setNewEventType] = useState<'study' | 'task'>('study');

  useEffect(() => {
    fetch('/api/data')
      .then(res => res.json())
      .then(d => {
         if (!d.studyPlan) d.studyPlan = '';
         if (!d.events) d.events = [];
         if (!d.confidences) d.confidences = {};
         setData(d);
         
         const existingDeckNames = (d.decks || []).map((deck: Deck) => deck.name);
         fetch('/api/scan-apkg', {
             method: 'POST',
             headers: { 'Content-Type': 'application/json' },
             body: JSON.stringify({ existingDeckNames })
         }).then(res => res.json()).then(resData => {
             if (resData.available && resData.available.length > 0) {
                 setAvailableDecks(resData.available);
             }
         }).catch(console.error);
      });
  }, []);

  const saveData = async (newData: WorkspaceData) => {
    setData(newData);
    await fetch('/api/data', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(newData)
    });
  };

  const getConfidenceColor = (val: number) => {
      if (val < 50) return 'var(--love)';
      if (val < 80) return 'var(--gold)';
      return 'var(--pine)';
  };

  const updateConf = (path: string, val: number) => {
      const clamped = Math.max(0, Math.min(100, val));
      const newData = { ...data, confidences: { ...(data.confidences || {}), [path]: clamped } };
      saveData(newData);
  };

  const getCalculatedConfidence = (examLink: string) => {
      const parts = examLink.split('/');
      if (parts.length < 2) return null;
      const semester = parts[0];
      const lecture = parts[1];
      
      const relatedSessions = (data.studySessions || []).filter(s => s.linkedSemester === semester && s.linkedLecture === lecture && s.cramState?.cardRatings);
      
      if (relatedSessions.length === 0) return null;
      
      let totalScore = 0;
      let totalCards = 0;
      
      for (const session of relatedSessions) {
          const ratings = Object.values(session.cramState!.cardRatings);
          for (const val of ratings) {
              if (val === 3) totalScore += 100;
              else if (val === 2) totalScore += 75;
              else if (val === 1) totalScore += 50;
              // 0 adds 0 points
              totalCards++;
          }
      }
      
      if (totalCards === 0) return null;
      return Math.round(totalScore / totalCards);
  };

  // -------------------------
  // FOLDER HANDLERS
  // -------------------------
  const handleAddSemester = async () => {
      const name = await asyncPrompt('Enter new semester name (e.g. Semester 3):');
      if (!name) return;
      try {
          await fetch('/api/folder', {
              method: 'POST',
              headers: { 'Content-Type': 'application/json' },
              body: JSON.stringify({ folderPath: name })
          });
          const res = await fetch('/api/files?path=');
          const d = await res.json();
          if (d.files) {
             const sems = d.files.filter((f: FileEntry) => f.isDirectory && f.name.startsWith('Semester')).map((f: FileEntry) => f.name);
             setSemesters(sems);
             if (!selectedSemester) {
                 setSelectedSemester(name);
                 setCurrentPath(name);
             }
          }
      } catch (e) {
          console.error(e);
      }
  };

  const handleAddContainer = async () => {
      const name = await asyncPrompt('Enter new container name (e.g. Aerodynamics):');
      if (!name) return;
      const current = data.containers || [];
      if (!current.includes(name)) {
          saveData({ ...data, containers: [...current, name] });
      }
  };

  const handleDeleteSemester = async (semName: string) => {
      if (!semName) return;
      if (!await asyncConfirm(`WARNING: Are you sure you want to completely delete "${semName}" and ALL of its lectures and files? This action is permanent and cannot be undone.`)) return;
      try {
          await fetch('/api/folder', {
              method: 'DELETE',
              headers: { 'Content-Type': 'application/json' },
              body: JSON.stringify({ folderPath: semName })
          });
          const res = await fetch('/api/files?path=');
          const d = await res.json();
          if (d.files) {
             const sems = d.files.filter((f: FileEntry) => f.isDirectory && f.name.startsWith('Semester')).map((f: FileEntry) => f.name);
             setSemesters(sems);
             if (selectedSemester === semName) {
                 const nextSem = sems.length > 0 ? sems[0] : '';
                 setSelectedSemester(nextSem);
                 setCurrentPath(nextSem);
             }
          }
      } catch (e) {
          console.error(e);
      }
  };

  const handleDeleteContainer = async (containerName: string) => {
      if (!await asyncConfirm(`Are you sure you want to delete the container "${containerName}"? Lectures assigned to this container will become Uncategorized.`)) return;
      const newContainers = (data.containers || []).filter(c => c !== containerName);
      const newLectureMeta = { ...data.lectureMeta };
      for (const key in newLectureMeta) {
          if (newLectureMeta[key].container === containerName) {
              newLectureMeta[key].container = '';
          }
      }
      saveData({ ...data, containers: newContainers, lectureMeta: newLectureMeta });
  };

  const handleChangeMaxCredits = async (containerName: string) => {
      const currentMax = data.containerMaxCredits?.[containerName] || 24;
      const newMaxStr = await asyncPrompt(`Enter max credits for container "${containerName}":`, String(currentMax));
      if (!newMaxStr) return;
      const newMax = parseInt(newMaxStr);
      if (isNaN(newMax) || newMax < 0) return;
      const newMaxMap = { ...(data.containerMaxCredits || {}) };
      newMaxMap[containerName] = newMax;
      saveData({ ...data, containerMaxCredits: newMaxMap });
  };

  const handleCreateFolder = async (current: string) => {
      const folderName = await asyncPrompt('Enter new folder name:');
      if (!folderName) return;
      const newPath = current ? `${current}/${folderName}` : folderName;
      await fetch('/api/folder', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ folderPath: newPath })
      });
      fetchFiles(current);
      
      if (current === '') {
          fetch('/api/files?path=')
            .then(res => res.json())
            .then(d => {
              if (!d.files) return;
              const sems = d.files
                .filter((f: FileEntry) => f.isDirectory && f.name.startsWith('Semester'))
                .map((f: FileEntry) => f.name);
              setSemesters(sems);
            });
      }
  };

  const handleDeleteFolder = async (pathToDelete: string) => {
      if (!await asyncConfirm(`Are you sure you want to delete ${pathToDelete} and all its contents?`)) return;
      await fetch('/api/folder', {
          method: 'DELETE',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ folderPath: pathToDelete })
      });
      const parts = pathToDelete.split('/');
      parts.pop();
      const parentPath = parts.join('/');
      setCurrentPath(parentPath);
  };

  const fetchLectures = async () => {
    if (!selectedSemester) return;
    try {
        const res = await fetch(`/api/files?path=${encodeURIComponent(selectedSemester)}`);
        const d = await res.json();
        if (!d.files) return;
        const lecs = d.files.filter((f: FileEntry) => f.isDirectory).map((f: FileEntry) => f.name);
        setLectures(lecs);
    } catch (e) {
        console.error(e);
    }
  };

  // -------------------------
  // EXAM HANDLERS
  // -------------------------
  const handleAddOrUpdateExam = async () => {
    if (!newExamName) return;
    
    let resolvedLink = newExamLink;
    if (!resolvedLink) {
        resolvedLink = `${selectedSemester}/${newExamName}`;
        try {
            await fetch('/api/folder', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ folderPath: resolvedLink })
            });
            fetchLectures();
        } catch (e) {
            console.error(e);
        }
    }

    let updatedData = { ...data };
    
    // Default confidence to 0
    if (!updatedData.confidences) updatedData.confidences = {};
    if (updatedData.confidences[resolvedLink] === undefined) {
        updatedData.confidences[resolvedLink] = 0;
    }

    if (editingExamId) {
       const updatedExams = (data.exams || []).map(e => e.id === editingExamId ? { ...e, name: newExamName, date: newExamDate, link: resolvedLink, semester: selectedSemester } : e);
       updatedData.exams = updatedExams;
    } else {
       const newExam = { id: Date.now().toString(), name: newExamName, date: newExamDate, link: resolvedLink, semester: selectedSemester };
       updatedData.exams = [...(data.exams || []), newExam];
    }
    
    saveData(updatedData);
    setEditingExamId(null);
    setNewExamName(''); setNewExamDate(''); setNewExamLink('');
  };

  const startEditExam = (exam: Exam) => {
    setEditingExamId(exam.id);
    setNewExamName(exam.name);
    setNewExamDate(exam.date || '');
    setNewExamLink(exam.link || '');
  };

  const cloneExam = (exam: Exam) => {
    setEditingExamId(null);
    setNewExamName(exam.name);
    setNewExamDate(exam.date || '');
    setNewExamLink(exam.link || '');
  };

  const cancelEditExam = () => {
    setEditingExamId(null);
    setNewExamName(''); setNewExamDate(''); setNewExamLink('');
  };

  const handleDeleteExam = (id: string) => {
    saveData({ ...data, exams: data.exams.filter(e => e.id !== id) });
    if (editingExamId === id) cancelEditExam();
  };

  // -------------------------
  // TODO HANDLERS
  // -------------------------
  const handleAddOrUpdateTodo = () => {
    if (!newTodoTitle) return;
    if (editingTodoId) {
        const updated = data.todos.map(t => t.id === editingTodoId ? { ...t, title: newTodoTitle, link: newTodoLink, progress: newTodoProgress, dueDate: newTodoDueDate } : t);
        saveData({ ...data, todos: updated });
        setEditingTodoId(null);
    } else {
        const newTodo = { id: Date.now().toString(), title: newTodoTitle, status: false, link: newTodoLink, progress: newTodoProgress, dueDate: newTodoDueDate };
        saveData({ ...data, todos: [...data.todos, newTodo] });
    }
    setNewTodoTitle(''); setNewTodoLink(''); setNewTodoProgress(0); setNewTodoDueDate('');
  };
  
  const startEditTodo = (todo: Todo) => {
      setEditingTodoId(todo.id);
      setNewTodoTitle(todo.title);
      setNewTodoLink(todo.link || '');
      setNewTodoProgress(todo.progress || 0);
      setNewTodoDueDate(todo.dueDate || '');
  };

  const cloneTodo = (todo: Todo) => {
      setEditingTodoId(null);
      setNewTodoTitle(todo.title);
      setNewTodoLink(todo.link || '');
      setNewTodoProgress(todo.progress || 0);
      setNewTodoDueDate(todo.dueDate || '');
  };

  const cancelEditTodo = () => {
      setEditingTodoId(null);
      setNewTodoTitle(''); setNewTodoLink(''); setNewTodoProgress(0); setNewTodoDueDate('');
  };

  const handleDeleteTodo = (id: string) => {
    saveData({ ...data, todos: data.todos.filter(t => t.id !== id) });
    if (editingTodoId === id) cancelEditTodo();
  };

  // -------------------------
  // EVENT HANDLERS
  // -------------------------
  const handleAddOrUpdateEvent = () => {
      if (!newEventTitle || !newEventStart || !newEventEnd) return;
      if (newEventEnd < newEventStart) { alert('End date must be at or after start date'); return; }
      
      if (editingEventId) {
          const updated = (data.events || []).map(e => e.id === editingEventId ? { ...e, title: newEventTitle, startDate: newEventStart, endDate: newEventEnd, type: newEventType } : e);
          saveData({ ...data, events: updated });
          setEditingEventId(null);
      } else {
          const newEv: CalendarEvent = { id: Date.now().toString(), title: newEventTitle, startDate: newEventStart, endDate: newEventEnd, type: newEventType };
          saveData({ ...data, events: [...(data.events || []), newEv] });
      }
      setNewEventTitle(''); setNewEventStart(''); setNewEventEnd('');
  };

  const startEditEvent = (ev: CalendarEvent) => {
      setEditingEventId(ev.id);
      setNewEventTitle(ev.title);
      setNewEventStart(ev.startDate);
      setNewEventEnd(ev.endDate);
      setNewEventType(ev.type);
  };
  
  const cloneEvent = (ev: CalendarEvent) => {
      setEditingEventId(null);
      setNewEventTitle(ev.title);
      setNewEventStart(ev.startDate);
      setNewEventEnd(ev.endDate);
      setNewEventType(ev.type);
  };

  const cancelEditEvent = () => {
      setEditingEventId(null);
      setNewEventTitle(''); setNewEventStart(''); setNewEventEnd('');
  };

  const handleDeleteEvent = (id: string) => {
      saveData({ ...data, events: (data.events || []).filter(e => e.id !== id) });
      if (editingEventId === id) cancelEditEvent();
  };



  // Fetch semesters
  useEffect(() => {
    fetch('/api/files?path=')
      .then(res => res.json())
      .then(d => {
        if (!d.files) return;
        const sems = d.files
          .filter((f: FileEntry) => f.isDirectory && f.name.startsWith('Semester'))
          .map((f: FileEntry) => f.name);
        setSemesters(sems);
        if (sems.length > 0) {
          const defaultSem = sems.includes('Semester 2') ? 'Semester 2' : sems[0];
          setSelectedSemester(defaultSem);
          setCurrentPath(defaultSem);
        }
      });
  }, []);

  // Fetch lectures
  useEffect(() => {
    fetchLectures();
  }, [selectedSemester]);

  useEffect(() => {
    if (currentPath !== '') {
        fetchFiles(currentPath);
    } else if (selectedSemester) {
        fetchFiles(selectedSemester);
    }
  }, [currentPath]);

  const fetchFiles = async (path: string) => {
    setLoading(true);
    try {
      const res = await fetch(`/api/files?path=${encodeURIComponent(path)}`);
      if (res.ok) {
        const d = await res.json();
        setFiles(d.files);
      }
    } catch (e) {
      console.error(e);
    }
    setLoading(false);
  };

  const handleOpen = async (file: FileEntry, forceExternal: boolean = false, typeOverride?: string) => {
    if (file.isDirectory) {
      setCurrentPath(file.path);
    } else {
      if (file.ext === 'pdf' && !forceExternal) {
        setPdfPreviewFile(file);
        return;
      }
      await fetch('/api/open', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ filePath: file.path, type: typeOverride })
      });
    }
  };

  const handleNewNote = async () => {
    const noteName = await asyncPrompt('Enter note name (without extension):');
    if (!noteName) return;
    const newPath = currentPath ? `${currentPath}/${noteName}.xopp` : `${noteName}.xopp`;
    await fetch('/api/open', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ filePath: newPath })
    });
    setTimeout(() => fetchFiles(currentPath), 2000);
  };

  const handleImportFile = async (ad: {path: string, name: string, semester: string, lecture: string}) => {
      setImportLoading(true);
      try {
          const res = await fetch('/api/import-apkg-file', {
              method: 'POST',
              headers: { 'Content-Type': 'application/json' },
              body: JSON.stringify(ad)
          });
          const result = await res.json();
          if (result.deck) {
              setData(prev => {
                  const newDecks = [...(prev.decks || []), result.deck];
                  const newData = { ...prev, decks: newDecks };
                  saveData(newData);
                  return newData;
              });
              setAvailableDecks(prev => prev.filter(d => d.path !== ad.path));
          }
      } catch (e) {
          console.error(e);
      } finally {
          setImportLoading(false);
      }
  };

  const handleImportDeckSubmit = async () => {
      if (!importModalData) return;
      if (!importModalText && !importModalFile) {
          await asyncConfirm('Please provide a file or text input.');
          return;
      }
      
      setImportLoading(true);
      const formData = new FormData();
      if (importModalText) formData.append('textData', importModalText);
      if (importModalFile) formData.append('file', importModalFile);
      
      try {
          const res = await fetch('/api/import-deck', {
              method: 'POST',
              body: formData
          });
          const dataRes = await res.json();
          
          if (res.ok && dataRes.cards && dataRes.cards.length > 0) {
              setImportModalData(null);
              setImportModalText('');
              setImportModalFile(null);
              
              const newDeckName = await asyncPrompt('Enter a name for the new deck:', 'Imported Deck');
              if (!newDeckName) {
                  setImportLoading(false);
                  return;
              }
              
              const newDeck: Deck = {
                 id: Date.now().toString(),
                 name: newDeckName,
                 linkedSemester: importModalData.semester,
                 linkedLecture: importModalData.lecture,
                 cards: dataRes.cards
              };
              
              const newDecks = [...(data.decks || []), newDeck];
              setData({ ...data, decks: newDecks });
              saveData({ ...data, decks: newDecks });
              
              await asyncConfirm(dataRes.message);
          } else {
              await asyncConfirm(`Error: ${dataRes.error || 'No cards parsed.'}`);
          }
      } catch (e) {
          console.error(e);
          await asyncConfirm('Error importing deck.');
      } finally {
          setImportLoading(false);
      }
  };

  const handleScoreCard = (deckId: string, cardId: string, score: number) => {
     let newData = { ...data };
     const decks = [...(newData.decks || [])];
     const dIdx = decks.findIndex(d => d.id === deckId);
     if (dIdx === -1) return;
     
     const cards = [...decks[dIdx].cards];
     const cIdx = cards.findIndex(c => c.id === cardId);
     if (cIdx === -1) return;
     
     const card = { ...cards[cIdx] };
     
     if (score === 0) {
         card.interval = 0;
         card.ease = Math.max(1.3, (card.ease || 2.5) - 0.2);
     } else {
         if ((card.interval || 0) === 0) {
             card.interval = 1;
         } else if (card.interval === 1) {
             card.interval = 6;
         } else {
             card.interval = Math.round((card.interval || 6) * (card.ease || 2.5) * (score === 3 ? 1.3 : score === 1 ? 0.8 : 1.0));
         }
         card.ease = (card.ease || 2.5) + (score === 3 ? 0.15 : score === 1 ? -0.15 : 0);
     }
     
     const nextReview = new Date();
     nextReview.setDate(nextReview.getDate() + (card.interval || 0));
     card.nextReview = nextReview.toISOString();
     
     cards[cIdx] = card;
     decks[dIdx].cards = cards;
     newData.decks = decks;
     
     setData(newData);
     saveData(newData);
     
     setShowAnswer(false);
     setCurrentCardIndex(prev => prev + 1);
  };

  const handleCreateDeck = (semester: string, lecture: string) => {
      setDeckSettingsModal({ isOpen: true, defaultSemester: semester, defaultLecture: lecture });
  };

  const handleSaveDeckSettings = (deckId: string | undefined, name: string, semester: string, lecture: string) => {
      let newData = { ...data };
      const decks = [...(newData.decks || [])];
      
      if (deckId) {
          const dIdx = decks.findIndex(d => d.id === deckId);
          if (dIdx !== -1) {
              decks[dIdx] = { ...decks[dIdx], name, linkedSemester: semester, linkedLecture: lecture };
          }
      } else {
          decks.push({ id: Date.now().toString(), name, linkedSemester: semester, linkedLecture: lecture, cards: [] });
      }
      
      newData.decks = decks;
      setData(newData);
      saveData(newData);
      setDeckSettingsModal(null);
  };

  const handlePaste = (e: React.ClipboardEvent<HTMLTextAreaElement>, field: 'front' | 'back') => {
      const items = e.clipboardData?.items;
      if (!items) return;
      for (let i = 0; i < items.length; i++) {
          if (items[i].type.indexOf('image') !== -1) {
              e.preventDefault();
              const file = items[i].getAsFile();
              if (!file) continue;
              const reader = new FileReader();
              reader.onload = (event) => {
                  const base64 = event.target?.result;
                  if (typeof base64 === 'string') {
                      setEditingCard(prev => prev ? { ...prev, [field]: prev[field] + `<img src="${base64}" style="max-width:100%" />` } : prev);
                  }
              };
              reader.readAsDataURL(file);
          }
      }
  };

  const handleSaveSession = (session: StudySession) => {
      let newSessions = [...(data.studySessions || [])];
      
      // Infer semester and lecture from the first selected deck
      if (session.deckIds && session.deckIds.length > 0) {
          const firstDeck = (data.decks || []).find(d => d.id === session.deckIds[0]);
          if (firstDeck) {
              session.linkedSemester = firstDeck.linkedSemester;
              session.linkedLecture = firstDeck.linkedLecture;
          }
      }
      
      const idx = newSessions.findIndex(s => s.id === session.id);
      if (idx >= 0) newSessions[idx] = session;
      else newSessions.push(session);
      
      const newData = { ...data, studySessions: newSessions };
      setData(newData);
      saveData(newData);
      setSessionBuilder(null);
  };

  const handleDeleteSession = (id: string) => {
      let newSessions = (data.studySessions || []).filter(s => s.id !== id);
      const newData = { ...data, studySessions: newSessions };
      setData(newData);
      saveData(newData);
  };

  const prepareCramQueue = (session: StudySession, filter: 'ALL' | 'HARD' | 'EASY') => {
      let allCards: Flashcard[] = [];
      const deckMap = new Map((data.decks || []).map(d => [d.id, d]));
      
      session.deckIds.forEach(dId => {
          const deck = deckMap.get(dId);
          if (deck) allCards = allCards.concat(deck.cards);
      });
      
      const uniqueCardsMap = new Map<string, Flashcard>();
      allCards.forEach(c => uniqueCardsMap.set(c.id, c));
      
      session.cardIds.forEach(cId => {
          (data.decks || []).forEach(d => {
              const c = d.cards.find(x => x.id === cId);
              if (c) uniqueCardsMap.set(cId, c);
          });
      });
      
      let finalCards = Array.from(uniqueCardsMap.values());
      const ratings = session.cramState?.cardRatings || {};
      
      if (filter === 'HARD') {
          finalCards = finalCards.filter(c => {
             const r = ratings[c.id];
             return r === undefined || r === 0 || r === 1;
          });
      } else if (filter === 'EASY') {
          finalCards = finalCards.filter(c => {
             const r = ratings[c.id];
             return r === 2 || r === 3;
          });
      }
      
      finalCards.sort(() => Math.random() - 0.5);
      
      setCramQueue(finalCards.slice(0, session.batchSize));
      setCurrentCardIndex(0);
      setShowAnswer(false);
      setSessionStudyFilter(filter);
      setActiveSessionId(session.id);
  };
  
  const handleRateCramCard = (score: number) => {
      if (!activeSessionId) return;
      const session = (data.studySessions || []).find(s => s.id === activeSessionId);
      if (!session) return;
      
      const currentCard = cramQueue[currentCardIndex];
      const newRatings = { ...(session.cramState?.cardRatings || {}) };
      newRatings[currentCard.id] = score as any;
      
      const newSession = { ...session, cramState: { cardRatings: newRatings } };
      let newSessions = [...(data.studySessions || [])];
      const idx = newSessions.findIndex(s => s.id === session.id);
      if (idx >= 0) newSessions[idx] = newSession;
      
      const newData = { ...data, studySessions: newSessions };
      setData(newData);
      saveData(newData);
      
      if (currentCardIndex + 1 < cramQueue.length) {
          setCurrentCardIndex(currentCardIndex + 1);
          setShowAnswer(false);
      } else {
          setCurrentCardIndex(currentCardIndex + 1);
      }
  };

  const handleSaveCard = () => {
      if (!activeDeckId || !editingCard || !editingCard.front.trim() || !editingCard.back.trim()) return;
      let newData = { ...data };
      const decks = [...(newData.decks || [])];
      const dIdx = decks.findIndex(d => d.id === activeDeckId);
      if (dIdx === -1) return;
      
      const cards = [...decks[dIdx].cards];
      if (editingCard.id) {
          const cIdx = cards.findIndex(c => c.id === editingCard.id);
          if (cIdx !== -1) {
              cards[cIdx] = { ...cards[cIdx], front: editingCard.front, back: editingCard.back };
          }
      } else {
          cards.push({
              id: Date.now().toString(),
              front: editingCard.front,
              back: editingCard.back,
              ease: 2.5,
              interval: 0,
              nextReview: new Date().toISOString()
          });
      }
      
      decks[dIdx].cards = cards;
      newData.decks = decks;
      setData(newData);
      saveData(newData);
      setEditingCard(null);
  };
  
  const handleDeleteCard = (cardId: string) => {
      if (!activeDeckId) return;
      let newData = { ...data };
      const decks = [...(newData.decks || [])];
      const dIdx = decks.findIndex(d => d.id === activeDeckId);
      if (dIdx === -1) return;
      decks[dIdx].cards = decks[dIdx].cards.filter(c => c.id !== cardId);
      newData.decks = decks;
      setData(newData);
      saveData(newData);
  };

  const handleMoveCard = (cardId: string, newDeckId: string) => {
      if (!activeDeckId || activeDeckId === newDeckId) return;
      let newData = { ...data };
      const decks = [...(newData.decks || [])];
      
      const sourceDIdx = decks.findIndex(d => d.id === activeDeckId);
      const targetDIdx = decks.findIndex(d => d.id === newDeckId);
      if (sourceDIdx === -1 || targetDIdx === -1) return;
      
      const cardIdx = decks[sourceDIdx].cards.findIndex(c => c.id === cardId);
      if (cardIdx === -1) return;
      
      const [cardToMove] = decks[sourceDIdx].cards.splice(cardIdx, 1);
      decks[targetDIdx].cards.push(cardToMove);
      
      newData.decks = decks;
      setData(newData);
      saveData(newData);
  };

  const navigateToLink = (link: string) => {
      const parts = link.split('/');
      if (parts[0] && parts[0].startsWith('Semester')) {
          setSelectedSemester(parts[0]);
      }
      setCurrentPath(link);
      setActiveTab('BROWSER');
  };

  const renderProgressBar = (daysLeft: number, totalDays: number = 60) => {
      if (daysLeft < 0) return '[ EXPIRED ]';
      const width = 20;
      const progress = Math.max(0, Math.min(1, 1 - (daysLeft / totalDays)));
      const filled = Math.floor(progress * width);
      const empty = width - filled;
      return `[${'#'.repeat(filled)}${'-'.repeat(empty)}]`;
  };

  const renderCalendar = () => {
      const year = currentMonth.getFullYear();
      const month = currentMonth.getMonth();
      const daysInMonth = new Date(year, month + 1, 0).getDate();
      
      let dayOfWeek = new Date(year, month, 1).getDay();
      const firstDay = dayOfWeek === 0 ? 6 : dayOfWeek - 1; // Mon = 0
      
      const today = new Date();
      const todayStr = `${today.getFullYear()}-${String(today.getMonth() + 1).padStart(2, '0')}-${String(today.getDate()).padStart(2, '0')}`;
      
      const days = [];
      const weekDays = ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'];
      
      weekDays.forEach(wd => {
          days.push(<div key={`wd-${wd}`} style={{ textAlign: 'center', color: 'var(--foam)', fontSize: '0.8rem', paddingBottom: '5px' }}>{wd}</div>);
      });

      for (let i = 0; i < firstDay; i++) {
          days.push(<div key={`pad-${i}`} style={{ background: 'transparent' }}></div>);
      }

      for (let d = 1; d <= daysInMonth; d++) {
          const dateStr = `${year}-${String(month + 1).padStart(2, '0')}-${String(d).padStart(2, '0')}`;
          const isToday = dateStr === todayStr;
          
          const dayExams = data.exams?.filter(e => e.date === dateStr) || [];
          const dayEvents = data.events?.filter(e => {
              return dateStr >= e.startDate && dateStr <= e.endDate;
          }) || [];

          days.push(
              <div key={dateStr} style={{ border: `1px solid ${isToday ? 'var(--foam)' : 'var(--muted)'}`, minHeight: '90px', padding: '5px', background: 'var(--base)', display: 'flex', flexDirection: 'column' }}>
                  <div style={{ textAlign: 'right', fontSize: '0.8rem', color: isToday ? 'var(--foam)' : 'var(--subtle)' }}>{d}</div>
                  <div style={{ display: 'flex', flexDirection: 'column', gap: '3px', marginTop: '5px', flex: 1, overflowY: 'auto' }}>
                      {dayExams.map(exam => (
                          <div key={`cal-ex-${exam.id}`} style={{ background: 'var(--love)', color: 'var(--base)', fontSize: '0.7rem', padding: '2px 4px', borderRadius: '3px', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }} title={exam.name}>
                              {exam.name}
                          </div>
                      ))}
                      {dayEvents.map(ev => (
                          <div key={`cal-ev-${ev.id}`} style={{ background: ev.type === 'study' ? 'var(--pine)' : 'var(--gold)', color: 'var(--base)', fontSize: '0.7rem', padding: '2px 4px', borderRadius: '3px', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }} title={ev.title}>
                              {ev.title}
                          </div>
                      ))}
                  </div>
              </div>
          );
      }

      return (
         <div style={{ display: 'grid', gridTemplateColumns: 'repeat(7, 1fr)', gap: '5px' }}>
             {days}
         </div>
      );
  };

  const renderTimeline = () => {
      if (!data.examPeriodStart || !data.examPeriodEnd) {
          return <div style={{ color: 'var(--subtle)', fontSize: '0.8rem', marginTop: '5px' }}>[ PLEASE SET EXAM PERIOD DATES TO VIEW TIMELINE ]</div>;
      }
      
      const start = new Date(data.examPeriodStart);
      const end = new Date(data.examPeriodEnd);
      const totalMs = end.getTime() - start.getTime();
      if (totalMs <= 0) return <div style={{ color: 'var(--love)', marginTop: '5px' }}>[ ERROR: END DATE MUST BE AFTER START DATE ]</div>;

      const today = new Date();
      today.setHours(0,0,0,0);
      
      const getPercent = (d: Date) => {
          let p = ((d.getTime() - start.getTime()) / totalMs) * 100;
          return Math.max(0, Math.min(100, p));
      };

      type TNode = { id: string; label: string; dateObj: Date; dateStr: string; type: 'today' | 'exam' | 'event' | 'todo'; link?: string };
      const nodes: TNode[] = [];
      nodes.push({ id: 'today', label: 'TODAY', dateObj: today, dateStr: today.toISOString().split('T')[0], type: 'today' });
      
      const currentExams = data.exams.filter(e => {
          const eSem = e.semester || (e.link ? e.link.split('/')[0] : selectedSemester);
          return eSem === selectedSemester;
      });

      const datelessExams = currentExams.filter(e => !e.date);

      currentExams.filter(e => e.date).forEach(e => {
          const d = new Date(e.date!);
          d.setHours(0,0,0,0);
          nodes.push({ id: `ex-${e.id}`, label: e.name, dateObj: d, dateStr: e.date!, type: 'exam', link: e.link });
      });
      
      (data.events||[]).forEach(e => {
          const d = new Date(e.endDate);
          d.setHours(0,0,0,0);
          nodes.push({ id: `ev-${e.id}`, label: e.title, dateObj: d, dateStr: e.endDate, type: 'event' });
      });

      data.todos.filter(t => t.dueDate && !t.status).forEach(t => {
          const d = new Date(t.dueDate as string);
          d.setHours(0,0,0,0);
          nodes.push({ id: `todo-${t.id}`, label: t.title, dateObj: d, dateStr: t.dueDate as string, type: 'todo' });
      });

      nodes.sort((a,b) => a.dateObj.getTime() - b.dateObj.getTime());
      
      const futureNodes = nodes.filter(n => n.dateObj.getTime() >= today.getTime());

      let belowCounter = 0;
      let aboveCounter = 0;
      let lastExamP = -999;
      let lastTodoP = -999;
      let isFirstGap = true;

      return (
          <div style={{ position: 'relative', height: '145px', background: 'var(--base)', border: '1px solid var(--muted)', overflowX: 'auto', overflowY: 'hidden' }}>
             <div style={{ minWidth: '1000px', height: '100%', position: 'relative' }}>
              {/* Dateless Exams Block */}
              {datelessExams.length > 0 && (
                  <div style={{ position: 'absolute', left: '10px', top: '10px', zIndex: 10, display: 'flex', flexDirection: 'column', gap: '4px', background: 'rgba(35, 33, 54, 0.8)', padding: '5px 10px', border: '1px dashed var(--muted)', borderRadius: '4px', maxHeight: '120px', overflowY: 'auto', backdropFilter: 'blur(2px)' }}>
                      <div style={{ fontSize: '0.65rem', color: 'var(--gold)', fontWeight: 'bold' }}>UNSCHEDULED LECTURES:</div>
                      {datelessExams.map(e => {
                          const conf = data.confidences?.[e.link || ''] ?? null;
                          const color = conf !== null ? getConfidenceColor(conf) : 'var(--muted)';
                          return (
                              <div key={`dateless-${e.id}`} style={{ display: 'flex', alignItems: 'center', gap: '6px', fontSize: '0.75rem', color: 'var(--text)' }}>
                                  <span style={{ cursor: 'pointer' }} onClick={() => e.link && navigateToLink(e.link)} className={e.link ? 'link-hover' : ''}>
                                     {e.name}
                                  </span>
                                  {e.link && (
                                      <span 
                                         onClick={async (ev) => {
                                             ev.stopPropagation();
                                             const val = await asyncPrompt(`Set confidence for ${e.name} (0-100):`, conf !== null ? conf.toString() : '0');
                                             if (val !== null) updateConf(e.link!, parseInt(val) || 0);
                                         }}
                                         style={{ color, cursor: 'pointer', border: `1px solid ${color}`, borderRadius: '2px', padding: '0 4px', fontSize: '0.65rem' }}
                                         title="Edit Confidence"
                                      >
                                         [{conf !== null ? `${conf}%` : '--'}]
                                      </span>
                                  )}
                              </div>
                          );
                      })}
                  </div>
              )}

              {/* Central axis */}
              <div style={{ position: 'absolute', left: 0, right: 0, top: '90px', height: '2px', background: 'var(--surface)', overflow: 'hidden' }}>
                  <div className="timeline-axis-stream"></div>
              </div>
              
              {/* Multi-day events ( rendered as contiguous bars ) */}
              {(data.events||[]).map(e => {
                  const sP = getPercent(new Date(e.startDate));
                  const eP = getPercent(new Date(e.endDate));
                  if (eP < getPercent(today)) return null; 
                  const wP = Math.max(0.2, eP - sP); 
                  return (
                      <div key={`bar-ev-${e.id}`} style={{ position: 'absolute', left: `${sP}%`, width: `${wP}%`, height: '4px', top: '92px', background: 'var(--gold)', opacity: 0.3, borderRadius: '2px' }} title={`EVENT: ${e.title}`}></div>
                  );
              })}

              {futureNodes.map((n, i) => {
                  const p = getPercent(n.dateObj);
                  let color = 'var(--text)';
                  let isExam = n.type === 'exam';
                  let isToday = n.type === 'today';
                  
                  if (isToday) color = 'var(--foam)';
                  else if (isExam) color = 'var(--love)';
                  else if (n.type === 'event') color = 'var(--gold)';
                  else if (n.type === 'todo') color = 'var(--pine)';

                  let labelBottom = 'auto';
                  let labelTop = 'auto';
                  let tickTop = '';
                  let tickHeight = '';

                  if (isExam || isToday) {
                      if (p - lastExamP < 12) {
                          aboveCounter = (aboveCounter + 1) % 3;
                      } else {
                          aboveCounter = 0;
                      }
                      lastExamP = p;

                      tickTop = '65px';
                      tickHeight = '25px';
                      labelBottom = `${145 - 65 + (aboveCounter * 16)}px`;
                  } else {
                      if (p - lastTodoP < 8) {
                          belowCounter = (belowCounter + 1) % 3;
                      } else {
                          belowCounter = 0;
                      }
                      lastTodoP = p;

                      tickTop = '90px';
                      tickHeight = '15px';
                      labelTop = `${105 + (belowCounter * 14)}px`;
                  }

                  let gapEl = null;
                  if (i < futureNodes.length - 1) {
                      const next = futureNodes[i+1];
                      const nextP = getPercent(next.dateObj);
                      const midP = (p + nextP) / 2;
                      const gapDays = Math.round((next.dateObj.getTime() - n.dateObj.getTime()) / (1000*3600*24));
                      
                      if (gapDays > 0 && (nextP - p) > 4) {
                          const gapClass = isFirstGap ? "timeline-gap" : "";
                          isFirstGap = false;
                          gapEl = (
                              <div key={`gap-${i}`} className={gapClass} style={{ position: 'absolute', left: `${midP}%`, top: '96px', transform: 'translateX(-50%)', color: next.type === 'exam' ? 'var(--love)' : 'var(--subtle)', fontSize: '0.65rem', whiteSpace: 'nowrap', zIndex: 1, fontWeight: next.type === 'exam' ? 'bold' : 'normal' }}>
                                  {gapDays}d
                              </div>
                          );
                      }
                  }

                  let confStr = null;
                  if (isExam && n.link) {
                      const c = data.confidences?.[n.link] ?? null;
                      const cColor = c !== null ? getConfidenceColor(c) : 'var(--muted)';
                      confStr = (
                          <span 
                             onClick={async (e) => { e.stopPropagation(); const val = await asyncPrompt(`Set confidence for ${n.label} (0-100):`, c !== null ? c.toString() : '0');
                                 if (val !== null) updateConf(n.link!, parseInt(val) || 0);
                             }}
                             style={{ color: cColor, marginLeft: '4px', cursor: 'pointer', textDecoration: 'none' }}
                             title="Edit Confidence"
                          >
                             [{c !== null ? c : '--'}%]
                          </span>
                      );
                  }

                  return (
                      <div key={`n-${n.id}`}>
                          <div className={isToday ? "timeline-today-node" : ""} style={{ position: 'absolute', left: `${p}%`, top: tickTop, height: tickHeight, width: isExam || isToday ? '2px' : '1px', background: color, zIndex: 2 }}></div>
                          <div style={{ position: 'absolute', left: `${p}%`, bottom: labelBottom, top: labelTop, transform: 'translateX(-50%)', color: color, fontSize: isExam || isToday ? '0.75rem' : '0.65rem', fontWeight: isExam || isToday ? 'bold' : 'normal', whiteSpace: 'nowrap', zIndex: 3 }}>
                              <span 
                                 style={{ cursor: n.link ? 'pointer' : 'default' }}
                                 className={`timeline-node-label ${n.link ? 'link-hover' : ''}`}
                                 onClick={() => {
                                     if (n.link) navigateToLink(n.link);
                                 }}
                                 title={n.link ? `Jump to ${n.link}` : undefined}
                              >
                                  {n.label}
                              </span>
                              {confStr}
                          </div>
                          {gapEl}
                      </div>
                  );
              })}
             </div>
          </div>
      );
  };

  const pathParts = currentPath.split('/').filter(Boolean);

  const groupedTodos: Record<string, Todo[]> = {};
  data.todos.forEach(todo => {
    const group = todo.link || 'GENERAL';
    if (!groupedTodos[group]) groupedTodos[group] = [];
    groupedTodos[group].push(todo);
  });

  const renderAlerts = () => {
      const today = new Date().getTime();
      
      const urgentExams = data.exams.filter(e => e.date).map(exam => {
          const examDate = new Date(exam.date!).getTime();
          const daysLeft = Math.ceil((examDate - today) / (1000 * 3600 * 24));
          return { ...exam, daysLeft };
      }).filter(e => e.daysLeft >= 0 && e.daysLeft <= 14).sort((a,b) => a.daysLeft - b.daysLeft);

      if (urgentExams.length === 0) return null;

      const getJoke = (examName: string, daysLeft: number, index: number, link: string) => {
          const conf = (link && data.confidences && data.confidences[link] !== undefined) ? data.confidences[link] : 0;
          const isDoomed = daysLeft <= 7;

          if (conf >= 80) {
              if (isDoomed) {
                  const jokes = [
                      `Locked in. Let's see if that high confidence survives contact with the actual ${examName} paper.`,
                      `No backing out now, genius. Prepare to be aggressively humbled during ${examName}.`,
                      `The deadline passed. Time to prove that your ${conf}% confidence isn't just pure delusion.`,
                      `You think you're ready for ${examName}? The professors would like a word.`,
                      `Abort disabled. Let's hope your preparation is as robust as your unwarranted optimism.`
                  ];
                  return jokes[index % jokes.length];
              } else {
                  const jokes = [
                      `Look at you, feeling all smart about ${examName}. Don't get cocky, there's still time to ruin it.`,
                      `High confidence detected. Statistically, this precedes a catastrophic ego collapse.`,
                      `Wow, you actually studied for ${examName}? Are you sure your confidence isn't just misplaced?`,
                      `Enjoy your inflated sense of security regarding ${examName} while it lasts.`,
                      `Are you sure you don't want to drop ${examName} just to keep things interesting?`
                  ];
                  return jokes[index % jokes.length];
              }
          } else if (conf >= 50) {
              if (isDoomed) {
                  const jokes = [
                      `Locked in for ${examName}. Your mediocre confidence level ensures maximum anxiety.`,
                      `Too late to drop. Your "I kinda get it" strategy is about to be violently tested.`,
                      `Brace for re-entry. Being halfway prepared for ${examName} just means it will hurt more.`,
                      `The drop deadline has passed. Let's see if your wildly average confidence holds up.`,
                      `No turning back now. Prepare to experience the exact middle of the grading curve.`
                  ];
                  return jokes[index % jokes.length];
              } else {
                  const jokes = [
                      `Oh, you feel "okay" about ${examName}? That's cute. Might still want to keep the drop form handy.`,
                      `A 50/50 shot at passing ${examName}? I admire your gambling spirit. Proceed with caution.`,
                      `You're dangerously average right now. Sure you don't want to bail out while you can?`,
                      `Your confidence is strictly mediocre. Time to engage panic study mode.`,
                      `Neither passing nor failing is guaranteed. Schrödinger's GPA is in full effect.`
                  ];
                  return jokes[index % jokes.length];
              }
          } else {
              if (isDoomed) {
                  const jokes = [
                      `Too late to drop ${examName}. With your confidence level, prepare for catastrophic structural failure.`,
                      `Abort sequence disabled. Your knowledge base is critically depleted. Brace for impact.`,
                      `You're locked in. Given your preparation, may the engineering gods have mercy on your GPA.`,
                      `Abandon all hope. Your confidence is in the abyss and the deregistration window is closed.`,
                      `It's too late to run. The only way out of ${examName} is through sheer, unadulterated panic.`
                  ];
                  return jokes[index % jokes.length];
              } else {
                  const jokes = [
                      `Confidence level critically low. The "Drop Course" button is your only logical maneuver.`,
                      `With a confidence score like that, a tactical retreat from ${examName} is highly recommended.`,
                      `You currently know nothing about ${examName}. Abort sequence is still available. Save yourself.`,
                      `Have you considered a relaxing career in agriculture instead of taking ${examName}?`,
                      `At this rate, your best preparation for ${examName} is learning how to cry silently.`
                  ];
                  return jokes[index % jokes.length];
              }
          }
      };

      return (
          <div style={{ display: 'flex', flexDirection: 'column', gap: '10px', marginBottom: '30px' }}>
              {urgentExams.map((exam, i) => {
                  let alertColor = 'var(--gold)';
                  let glowColor = 'transparent';
                  
                  if (exam.daysLeft <= 7) {
                      alertColor = 'var(--love)'; // Doomed
                      glowColor = 'var(--love)';
                  } else if (exam.daysLeft <= 9) {
                      alertColor = 'var(--rose)'; // Critical
                      glowColor = 'var(--rose)';
                  }

                  return (
                      <div key={`alert-${exam.id}`} style={{ background: 'var(--surface)', borderLeft: `4px solid ${alertColor}`, borderTop: '1px solid var(--muted)', borderRight: '1px solid var(--muted)', borderBottom: '1px solid var(--muted)', padding: '15px', display: 'flex', alignItems: 'center', gap: '20px' }}>
                          <div style={{ color: alertColor, fontSize: '1.5rem', fontWeight: 'bold', textShadow: glowColor !== 'transparent' ? `0 0 10px ${glowColor}` : 'none' }}>
                              [!]
                          </div>
                          <div>
                              <div style={{ color: alertColor, fontWeight: 'bold', fontSize: '0.9rem', marginBottom: '5px', letterSpacing: '1px' }}>
                                  SYSTEM WARNING: {exam.name.toUpperCase()} IN {exam.daysLeft} DAYS
                              </div>
                              <div style={{ color: 'var(--text)', fontSize: '0.85rem' }}>
                                  {getJoke(exam.name, exam.daysLeft, i, exam.link || '')}
                              </div>
                          </div>
                      </div>
                  );
              })}
          </div>
      );
  };
  const renderOverview = () => {
      const allLectures = Object.entries(overviewData).flatMap(([sem, lecs]) => {
          return lecs.map(l => {
              const path = `${sem}/${l}`;
              const meta = data.lectureMeta?.[path] || { category: '', credits: 0, grade: '', container: '' };
              return { path, name: l, semester: sem, meta };
          });
      });

      if (overviewTab === 'SEMESTER') {
          const bySemester: Record<string, typeof allLectures> = {};
          allLectures.forEach(l => {
              if (!bySemester[l.semester]) bySemester[l.semester] = [];
              bySemester[l.semester].push(l);
          });

          return (
              <div style={{ padding: '20px' }}>
                  {Object.entries(bySemester).map(([sem, lecs]) => {
                      const totalCredits = lecs.reduce((sum, l) => sum + (l.meta.credits || 0), 0);
                      return (
                      <div key={sem} style={{ marginBottom: '30px' }}>
                          <h2 style={{ display: 'flex', justifyContent: 'space-between', color: 'var(--iris)', borderBottom: '1px solid var(--muted)', paddingBottom: '5px' }}>
                              <span>&gt; {sem.toUpperCase()} <span style={{ color: 'var(--subtle)', fontSize: '0.8rem', marginLeft: '10px' }}>[ {totalCredits} CP ]</span></span>
                              <button onClick={() => handleDeleteSemester(sem)} style={{ background: 'none', border: 'none', color: 'var(--love)', cursor: 'pointer', fontSize: '0.8rem', fontWeight: 'bold' }}>[ DELETE ]</button>
                          </h2>
                          <table style={{ width: '100%', borderCollapse: 'collapse', marginTop: '10px' }}>
                              <thead>
                                  <tr style={{ color: 'var(--subtle)', textAlign: 'left', borderBottom: '1px dashed var(--muted)' }}>
                                      <th style={{ padding: '8px' }}>Lecture</th>
                                      <th style={{ padding: '8px' }}>Category</th>
                                      <th style={{ padding: '8px' }}>Credits</th>
                                      <th style={{ padding: '8px' }}>Grade</th>
                                      <th style={{ padding: '8px' }}>Container</th>
                                      <th style={{ padding: '8px' }}>Study Materials</th>
                                  </tr>
                              </thead>
                              <tbody>
                                  {lecs.map(l => {
                                      return (
                                          <tr key={l.path} style={{ borderBottom: '1px solid var(--surface)' }}>
                                              <td style={{ padding: '8px', color: 'var(--text)' }}>
                                                  <span>{l.name}</span>
                                              </td>
                                              <td style={{ padding: '8px' }}>
                                                  <select value={l.meta.category} onChange={e => updateLectureMeta(l.path, { category: e.target.value as any })} style={{ background: 'var(--overlay)', color: 'var(--text)', border: '1px solid var(--muted)', outline: 'none' }}>
                                                      <option value="">- Select -</option>
                                                      <option value="Wahlpflicht">Wahlpflicht</option>
                                                      <option value="Wahlfach">Wahlfach</option>
                                                      <option value="Ignore">Ignore</option>
                                                  </select>
                                              </td>
                                              <td style={{ padding: '8px' }}>
                                                  <input type="number" value={l.meta.credits || ''} onChange={e => updateLectureMeta(l.path, { credits: parseInt(e.target.value)||0 })} style={{ width: '60px', background: 'var(--overlay)', color: 'var(--text)', border: '1px solid var(--muted)', outline: 'none' }} placeholder="0" />
                                              </td>
                                              <td style={{ padding: '8px' }}>
                                                  <input type="text" value={l.meta.grade || ''} onChange={e => updateLectureMeta(l.path, { grade: e.target.value })} style={{ width: '60px', background: 'var(--overlay)', color: 'var(--text)', border: '1px solid var(--muted)', outline: 'none' }} placeholder="e.g. 1.0" />
                                              </td>
                                              <td style={{ padding: '8px' }}>
                                                  <select value={l.meta.container || ''} onChange={e => updateLectureMeta(l.path, { container: e.target.value })} style={{ width: '150px', background: 'var(--overlay)', color: 'var(--text)', border: '1px solid var(--muted)', outline: 'none' }}>
                                                      <option value="">- Uncategorized -</option>
                                                      {(data.containers || []).map(c => <option key={c} value={c}>{c}</option>)}
                                                  </select>
                                              </td>
                                              <td style={{ padding: '8px' }}>
                                                  {(() => {
                                                      const lectureDecks = (data.decks || []).filter(d => d.linkedSemester === l.semester && d.linkedLecture === l.name);
                                                      return (
                                                          <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                                                              {lectureDecks.length > 0 ? (
                                                                  <span style={{ fontSize: '0.8rem', color: 'var(--subtle)' }}>{lectureDecks.length} Decks</span>
                                                              ) : null}
                                                              {lectureDecks.length > 0 && (
                                                                  <button 
                                                                      className="button"
                                                                      style={{ padding: '2px 8px', fontSize: '0.7rem', borderColor: 'var(--gold)', color: 'var(--gold)' }}
                                                                      onClick={() => {
                                                                          const newSession = {
                                                                              id: Date.now().toString(),
                                                                              name: `${l.name} Cram`,
                                                                              mode: 'cram' as const,
                                                                              deckIds: lectureDecks.map(d => d.id),
                                                                              cardIds: [],
                                                                              batchSize: 20,
                                                                              linkedSemester: l.semester,
                                                                              linkedLecture: l.name
                                                                          };
                                                                          let newSessions = [...(data.studySessions || []), newSession];
                                                                          const newData = { ...data, studySessions: newSessions };
                                                                          setData(newData);
                                                                          saveData(newData);
                                                                          setActiveTab('FLASHCARDS');
                                                                          setFlashcardTab('SESSIONS');
                                                                          prepareCramQueue(newSession, 'ALL');
                                                                      }}
                                                                  >
                                                                      + QUICK SESSION
                                                                  </button>
                                                              )}
                                                          </div>
                                                      );
                                                  })()}
                                              </td>
                                          </tr>
                                      );
                                  })}
                              </tbody>
                          </table>
                      </div>
                  )})}
              </div>
          );
      } else {
          const byContainer: Record<string, typeof allLectures> = {};
          allLectures.forEach(l => {
              const c = l.meta.container || 'Uncategorized';
              if (!byContainer[c]) byContainer[c] = [];
              byContainer[c].push(l);
          });

          return (
              <div style={{ padding: '20px' }}>
                  {Object.entries(byContainer).sort(([a],[b]) => a === 'Uncategorized' ? 1 : b === 'Uncategorized' ? -1 : a.localeCompare(b)).map(([container, lecs]) => {
                      const totalCredits = lecs.reduce((sum, l) => sum + (l.meta.credits || 0), 0);
                      const maxCred = data.containerMaxCredits?.[container] || 24;
                      const creditDisplay = (container === 'Uncategorized' || container === 'Ignored') 
                          ? <span>[ {totalCredits} CP ]</span>
                          : <span>[ {totalCredits} / <span onClick={() => handleChangeMaxCredits(container)} style={{ cursor: 'pointer', textDecoration: 'underline', color: 'var(--iris)' }}>{maxCred}</span> CP ]</span>;

                      return (
                      <div key={container} style={{ marginBottom: '30px' }}>
                          <h2 style={{ display: 'flex', justifyContent: 'space-between', color: 'var(--foam)', borderBottom: '1px solid var(--muted)', paddingBottom: '5px' }}>
                              <span>&gt; [{container.toUpperCase()}] <span style={{ color: 'var(--subtle)', fontSize: '0.8rem', marginLeft: '10px' }}>{creditDisplay}</span></span>
                              {container !== 'Uncategorized' && (
                                  <button onClick={() => handleDeleteContainer(container)} style={{ background: 'none', border: 'none', color: 'var(--love)', cursor: 'pointer', fontSize: '0.8rem', fontWeight: 'bold' }}>[ DELETE ]</button>
                              )}
                          </h2>
                          <table style={{ width: '100%', borderCollapse: 'collapse', marginTop: '10px' }}>
                              <thead>
                                  <tr style={{ color: 'var(--subtle)', textAlign: 'left', borderBottom: '1px dashed var(--muted)' }}>
                                      <th style={{ padding: '8px' }}>Lecture</th>
                                      <th style={{ padding: '8px' }}>Semester</th>
                                      <th style={{ padding: '8px' }}>Category</th>
                                      <th style={{ padding: '8px' }}>Credits</th>
                                      <th style={{ padding: '8px' }}>Grade</th>
                                      <th style={{ padding: '8px' }}>Study Materials</th>
                                  </tr>
                              </thead>
                              <tbody>
                                  {lecs.map(l => (
                                      <tr key={l.path} style={{ borderBottom: '1px solid var(--surface)' }}>
                                          <td style={{ padding: '8px', color: 'var(--text)' }}>
                                              <span>{l.name}</span>
                                          </td>
                                          <td style={{ padding: '8px', color: 'var(--subtle)' }}>{l.semester}</td>
                                          <td style={{ padding: '8px' }}>
                                              <select value={l.meta.category} onChange={e => updateLectureMeta(l.path, { category: e.target.value as any })} style={{ background: 'var(--overlay)', color: 'var(--text)', border: '1px solid var(--muted)', outline: 'none' }}>
                                                  <option value="">- Select -</option>
                                                  <option value="Wahlpflicht">Wahlpflicht</option>
                                                  <option value="Wahlfach">Wahlfach</option>
                                                  <option value="Ignore">Ignore</option>
                                              </select>
                                          </td>
                                          <td style={{ padding: '8px' }}>
                                              <input type="number" value={l.meta.credits || ''} onChange={e => updateLectureMeta(l.path, { credits: parseInt(e.target.value)||0 })} style={{ width: '60px', background: 'var(--overlay)', color: 'var(--text)', border: '1px solid var(--muted)', outline: 'none' }} placeholder="0" />
                                          </td>
                                          <td style={{ padding: '8px' }}>
                                              <input type="text" value={l.meta.grade || ''} onChange={e => updateLectureMeta(l.path, { grade: e.target.value })} style={{ width: '60px', background: 'var(--overlay)', color: 'var(--text)', border: '1px solid var(--muted)', outline: 'none' }} placeholder="e.g. 1.0" />
                                          </td>
                                          <td style={{ padding: '8px' }}>
                                              {(() => {
                                                  const lectureDecks = (data.decks || []).filter(d => d.linkedSemester === l.semester && d.linkedLecture === l.name);
                                                  return (
                                                      <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                                                          {lectureDecks.length > 0 ? (
                                                              <span style={{ fontSize: '0.8rem', color: 'var(--subtle)' }}>{lectureDecks.length} Decks</span>
                                                          ) : null}
                                                          {lectureDecks.length > 0 && (
                                                              <button 
                                                                  className="button"
                                                                  style={{ padding: '2px 8px', fontSize: '0.7rem', borderColor: 'var(--gold)', color: 'var(--gold)' }}
                                                                  onClick={() => {
                                                                      const newSession = {
                                                                          id: Date.now().toString(),
                                                                          name: `${l.name} Cram`,
                                                                          mode: 'cram' as const,
                                                                          deckIds: lectureDecks.map(d => d.id),
                                                                          cardIds: [],
                                                                          batchSize: 20,
                                                                          linkedSemester: l.semester,
                                                                          linkedLecture: l.name
                                                                      };
                                                                      let newSessions = [...(data.studySessions || []), newSession];
                                                                      const newData = { ...data, studySessions: newSessions };
                                                                      setData(newData);
                                                                      saveData(newData);
                                                                      setActiveTab('FLASHCARDS');
                                                                      setFlashcardTab('SESSIONS');
                                                                      prepareCramQueue(newSession, 'ALL');
                                                                  }}
                                                              >
                                                                  + QUICK SESSION
                                                              </button>
                                                          )}
                                                      </div>
                                                  );
                                              })()}
                                          </td>
                                      </tr>
                                  ))}
                              </tbody>
                          </table>
                      </div>
                  )})}
              </div>
          );
      }
  };

  const ctx = {
    activeTab,
    setActiveTab,
    files,
    setFiles,
    currentPath,
    setCurrentPath,
    loading,
    setLoading,
    pdfPreviewFile,
    setPdfPreviewFile,
    semesters,
    setSemesters,
    selectedSemester,
    setSelectedSemester,
    lectures,
    setLectures,

    flashcardTab,
    setFlashcardTab,
    sessionBuilder,
    setSessionBuilder,
    expandedDecks,
    setExpandedDecks,
    activeSessionId,
    setActiveSessionId,
    sessionStudyFilter,
    setSessionStudyFilter,
    cramQueue,
    setCramQueue,
    activeDeckId,
    setActiveDeckId,
    studyMode,
    setStudyMode,
    currentCardIndex,
    setCurrentCardIndex,
    showAnswer,
    setShowAnswer,
    editingCard,
    setEditingCard,
    importModalData,
    setImportModalData,
    importModalText,
    setImportModalText,
    importModalFile,
    setImportModalFile,
    importLoading,
    setImportLoading,
    availableDecks,
    setAvailableDecks,
    deckSettingsModal,
    setDeckSettingsModal,
    editingPreview,
    setEditingPreview,
    searchCardQuery,
    setSearchCardQuery,
    promptData,
    setPromptData,
    confirmData,
    setConfirmData,
    appConfig,
    setAppConfig,
    settingsData,
    setSettingsData,
    data,
    setData,
    overviewTab,
    setOverviewTab,
    overviewData,
    setOverviewData,
    showCommandPalette,
    setShowCommandPalette,
    commandQuery,
    setCommandQuery,
    newExamName,
    setNewExamName,
    newExamDate,
    setNewExamDate,
    newExamLink,
    setNewExamLink,
    newTodoTitle,
    setNewTodoTitle,
    newTodoLink,
    setNewTodoLink,
    newTodoProgress,
    setNewTodoProgress,
    newTodoDueDate,
    setNewTodoDueDate,
    editingExamId,
    setEditingExamId,
    editingTodoId,
    setEditingTodoId,
    editingEventId,
    setEditingEventId,
    currentMonth,
    setCurrentMonth,
    newEventTitle,
    setNewEventTitle,
    newEventStart,
    setNewEventStart,
    newEventEnd,
    setNewEventEnd,
    newEventType,
    setNewEventType,
    handleAddSemester,
    handleAddContainer,
    handleDeleteSemester,
    handleDeleteContainer,
    handleChangeMaxCredits,
    handleCreateFolder,
    handleDeleteFolder,
    handleAddOrUpdateExam,
    handleDeleteExam,
    handleAddOrUpdateTodo,
    handleDeleteTodo,
    handleAddOrUpdateEvent,
    handleDeleteEvent,
    handleOpen,
    handleNewNote,
    handleImportFile,
    handleImportDeckSubmit,
    handleScoreCard,
    handleCreateDeck,
    handleSaveDeckSettings,
    handlePaste,
    handleSaveSession,
    handleDeleteSession,
    handleRateCramCard,
    handleSaveCard,
    handleDeleteCard,
    handleMoveCard,
    saveData,
    asyncPrompt,
    asyncConfirm,
    processHtml,
    getConfidenceColor,
    prepareCramQueue,
    renderAlerts,
    renderTimeline,
    cancelEditExam,
    getCalculatedConfidence,
    updateConf,
    cloneExam,
    startEditExam,
    renderProgressBar,
    navigateToLink,
    cancelEditTodo,
    cloneTodo,
    startEditTodo,
    cancelEditEvent,
    cloneEvent,
    startEditEvent,
    updateLectureMeta,
    openSettings,
    groupedTodos
  };

  return (
    <div className={`app-container ${!appConfig.enableFlicker ? 'no-flicker' : ''}`}>
      {!studyMode && <Sidebar ctx={ctx} />}
      
      <div className="main-content" style={{ flex: 1, padding: studyMode ? '0' : '40px', overflowY: 'auto' }}>
        {activeTab === 'MISSION_CONTROL' && <Dashboard ctx={ctx} />}
        
        {activeTab === 'BROWSER' && (
          <LectureNexus ctx={ctx} />
        )}
        
        {activeTab === 'OVERVIEW' && (
          <div className="overview" style={{ flex: 1, display: 'flex', flexDirection: 'column', height: '100%', overflow: 'hidden' }}>
              <div style={{ display: 'flex', gap: '20px', padding: '20px 20px 0 20px', borderBottom: '1px solid var(--muted)', alignItems: 'center' }}>
                 <button 
                     onClick={() => setOverviewTab('SEMESTER')}
                     style={{ background: 'none', border: 'none', color: overviewTab === 'SEMESTER' ? 'var(--iris)' : 'var(--subtle)', fontWeight: 'bold', fontSize: '1rem', paddingBottom: '10px', borderBottom: overviewTab === 'SEMESTER' ? '2px solid var(--iris)' : '2px solid transparent', cursor: 'pointer' }}
                 >
                     BY SEMESTER
                 </button>
                 <button 
                     onClick={() => setOverviewTab('CONTAINER')}
                     style={{ background: 'none', border: 'none', color: overviewTab === 'CONTAINER' ? 'var(--foam)' : 'var(--subtle)', fontWeight: 'bold', fontSize: '1rem', paddingBottom: '10px', borderBottom: overviewTab === 'CONTAINER' ? '2px solid var(--foam)' : '2px solid transparent', cursor: 'pointer' }}
                 >
                     BY CONTAINER
                 </button>
                 <div style={{ flex: 1 }}></div>

                 <button className="button" onClick={handleAddContainer} style={{ fontSize: '0.8rem', padding: '4px 10px', borderColor: 'var(--foam)', color: 'var(--foam)', marginBottom: '8px' }}>+ NEW CONTAINER</button>
              </div>
              <div style={{ flex: 1, overflowY: 'auto' }}>
                 {renderOverview()}
              </div>
          </div>
        )}
        
        {activeTab === 'FLASHCARDS' && <FlashcardManager ctx={ctx} />}
            {activeTab === 'WIDGETS' && <WidgetPanel appConfig={appConfig} />}
        {activeTab === 'PLANNER' && <Planner ctx={ctx} />}
      </div>

      {rightPanelMode !== 'HIDDEN' && !studyMode && (
        <div className="right-panel" style={{ width: '400px', background: 'var(--surface)', borderLeft: '2px dashed var(--muted)', display: 'flex', flexDirection: 'column' }}>
          <div style={{ display: 'flex', padding: '15px', gap: '10px', borderBottom: '1px solid var(--muted)' }}>
            <button className="button" style={{ flex: 1, borderColor: rightPanelMode === 'ACTION_ITEMS' ? 'var(--gold)' : 'var(--muted)', color: rightPanelMode === 'ACTION_ITEMS' ? 'var(--gold)' : 'var(--text)' }} onClick={() => setRightPanelMode('ACTION_ITEMS')}>TASKS</button>
            <button className="button" style={{ flex: 1, borderColor: rightPanelMode === 'FLASHCARDS' ? 'var(--foam)' : 'var(--muted)', color: rightPanelMode === 'FLASHCARDS' ? 'var(--foam)' : 'var(--text)' }} onClick={() => setRightPanelMode('FLASHCARDS')}>CARDS</button>
          </div>
          <div style={{ flex: 1, overflowY: 'auto', padding: '15px' }}>
            {rightPanelMode === 'ACTION_ITEMS' && <ActionItems ctx={ctx} />}
            {rightPanelMode === 'FLASHCARDS' && <FlashcardOverview ctx={ctx} />}
          </div>
        </div>
      )}

      {showCommandPalette && (
        <div style={{ position: 'fixed', top: 0, left: 0, right: 0, bottom: 0, backgroundColor: 'rgba(0,0,0,0.7)', zIndex: 9999, display: 'flex', justifyContent: 'center', paddingTop: '10vh', backdropFilter: 'blur(4px)' }} onClick={() => setShowCommandPalette(false)}>
            <div style={{ background: 'var(--base)', border: '1px solid var(--muted)', width: '600px', maxWidth: '90vw', maxHeight: '80vh', borderRadius: '8px', overflow: 'hidden', display: 'flex', flexDirection: 'column', boxShadow: '0 10px 30px rgba(0,0,0,0.5)' }} onClick={e => e.stopPropagation()}>
                <input 
                    autoFocus 
                    value={commandQuery} 
                    onChange={e => setCommandQuery(e.target.value)} 
                    placeholder="Search lectures, actions, or type a command..." 
                    style={{ background: 'transparent', border: 'none', borderBottom: '1px solid var(--muted)', color: 'var(--text)', padding: '20px', fontSize: '1.2rem', outline: 'none', width: '100%' }} 
                />
                <div style={{ padding: '10px', overflowY: 'auto', flex: 1 }}>
                    {(commandQuery ? allLecturesFlat.filter(l => l.name.toLowerCase().includes(commandQuery.toLowerCase()) || l.semester.toLowerCase().includes(commandQuery.toLowerCase())) : allLecturesFlat.slice(0, 10)).map(l => (
                        <div key={l.path} style={{ padding: '15px', borderBottom: '1px dashed var(--surface)', display: 'flex', justifyContent: 'space-between', cursor: 'pointer', transition: 'background 0.2s' }} onMouseEnter={e => e.currentTarget.style.background = 'var(--surface)'} onMouseLeave={e => e.currentTarget.style.background = 'transparent'} onClick={() => { setShowCommandPalette(false); navigateToLink(l.path); }}>
                            <span><span style={{ color: 'var(--iris)' }}>{l.semester}</span> / {l.name}</span>
                            <span style={{ color: 'var(--subtle)' }}>Jump to Folder &gt;</span>
                        </div>
                    ))}
                    {(commandQuery ? data.todos.filter(t => t.title.toLowerCase().includes(commandQuery.toLowerCase())) : []).map(t => (
                        <div key={t.id} style={{ padding: '15px', borderBottom: '1px dashed var(--surface)', display: 'flex', justifyContent: 'space-between', cursor: 'pointer', transition: 'background 0.2s' }} onMouseEnter={e => e.currentTarget.style.background = 'var(--surface)'} onMouseLeave={e => e.currentTarget.style.background = 'transparent'} onClick={() => { setShowCommandPalette(false); setActiveTab('MISSION_CONTROL'); }}>
                            <span><span style={{ color: 'var(--love)' }}>Action:</span> {t.title}</span>
                            <span style={{ color: 'var(--subtle)' }}>Go to Mission Control &gt;</span>
                        </div>
                    ))}
                </div>
            </div>
        </div>
      )}

      
      {settingsData && (
          <div style={{ position: 'fixed', top: 0, left: 0, width: '100%', height: '100%', background: 'rgba(0,0,0,0.8)', display: 'flex', justifyContent: 'center', alignItems: 'center', zIndex: 10000 }}>
              <div style={{ background: 'var(--base)', border: '1px solid var(--muted)', padding: '20px', width: '400px', borderRadius: '8px', boxShadow: '0 10px 30px rgba(0,0,0,0.5)' }}>
                  <div style={{ color: 'var(--foam)', fontSize: '1.2rem', marginBottom: '20px', fontWeight: 'bold' }}>SYSTEM SETTINGS</div>
                  <div style={{ marginBottom: '15px' }}>
                      <label style={{ color: 'var(--subtle)', fontSize: '0.8rem', display: 'block', marginBottom: '8px', fontWeight: 'bold' }}>WORKSPACE TITLE</label>
                      <input 
                          type="text" 
                          value={settingsData.workspaceTitle || ''} 
                          onChange={e => setSettingsData({...settingsData, workspaceTitle: e.target.value})} 
                          style={{ width: '100%', background: 'var(--overlay)', color: 'var(--text)', border: '1px solid var(--muted)', padding: '10px', outline: 'none', borderRadius: '4px' }} 
                      />
                  </div>
                  <div style={{ marginBottom: '15px' }}>
                      <label style={{ color: 'var(--subtle)', fontSize: '0.8rem', display: 'block', marginBottom: '8px', fontWeight: 'bold' }}>HOME FOLDER ABSOLUTE PATH</label>
                      <input 
                          type="text" 
                          value={settingsData.homeFolder || ''} 
                          onChange={e => setSettingsData({...settingsData, homeFolder: e.target.value})} 
                          style={{ width: '100%', background: 'var(--overlay)', color: 'var(--text)', border: '1px solid var(--muted)', padding: '10px', outline: 'none', borderRadius: '4px' }} 
                      />
                      <div style={{ fontSize: '0.7rem', color: 'var(--muted)', marginTop: '5px' }}>Path where your files, exams, and notes are stored.</div>
                  </div>
                  <div style={{ marginBottom: '15px', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                      <label style={{ color: 'var(--subtle)', fontSize: '0.8rem', fontWeight: 'bold' }}>ENABLE CRT FLICKER</label>
                      <input 
                          type="checkbox" 
                          checked={settingsData.enableFlicker ?? true} 
                          onChange={e => setSettingsData({...settingsData, enableFlicker: e.target.checked})} 
                          style={{ cursor: 'pointer' }}
                      />
                  </div>
                  <div style={{ display: 'flex', gap: '10px', marginBottom: '25px' }}>
                      <div style={{ flex: 1 }}>
                          <label style={{ color: 'var(--subtle)', fontSize: '0.8rem', display: 'block', marginBottom: '8px', fontWeight: 'bold' }}>POMO WORK (MIN)</label>
                          <input 
                              type="number" 
                              value={settingsData.pomoWorkTime || 25} 
                              onChange={e => setSettingsData({...settingsData, pomoWorkTime: parseInt(e.target.value) || 25})} 
                              style={{ width: '100%', background: 'var(--overlay)', color: 'var(--text)', border: '1px solid var(--muted)', padding: '10px', outline: 'none', borderRadius: '4px' }} 
                          />
                      </div>
                      <div style={{ flex: 1 }}>
                          <label style={{ color: 'var(--subtle)', fontSize: '0.8rem', display: 'block', marginBottom: '8px', fontWeight: 'bold' }}>POMO BREAK (MIN)</label>
                          <input 
                              type="number" 
                              value={settingsData.pomoBreakTime || 5} 
                              onChange={e => setSettingsData({...settingsData, pomoBreakTime: parseInt(e.target.value) || 5})} 
                              style={{ width: '100%', background: 'var(--overlay)', color: 'var(--text)', border: '1px solid var(--muted)', padding: '10px', outline: 'none', borderRadius: '4px' }} 
                          />
                      </div>
                  </div>
                  <div style={{ display: 'flex', gap: '10px', justifyContent: 'flex-end' }}>
                      <button className="button" onClick={() => setSettingsData(null)} style={{ color: 'var(--love)', borderColor: 'var(--love)' }}>CANCEL</button>
                      <button className="button" onClick={saveSettings} style={{ borderColor: 'var(--pine)', background: 'var(--pine)', color: 'var(--base)', fontWeight: 'bold' }}>SAVE & RESTART</button>
                  </div>
              </div>
          </div>
      )}

      {pdfPreviewFile && (
        <div style={{ position: 'fixed', top: 0, left: 0, right: 0, bottom: 0, backgroundColor: 'rgba(0,0,0,0.85)', zIndex: 10002, display: 'flex', justifyContent: 'center', alignItems: 'center' }} onClick={() => setPdfPreviewFile(null)}>
           <div onClick={e => e.stopPropagation()} style={{ background: 'var(--base)', padding: '20px', border: '1px solid var(--foam)', borderRadius: '8px', width: '90%', maxWidth: '1400px', height: '90vh', boxShadow: '0 10px 30px rgba(0,0,0,0.8)', display: 'flex', flexDirection: 'column' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '15px' }}>
                 <div style={{ color: 'var(--gold)', fontWeight: 'bold', fontSize: '1.2rem', display: 'flex', alignItems: 'center', gap: '10px' }}>
                    <span style={{ color: 'var(--foam)' }}>[PDF]</span> {pdfPreviewFile.name}
                 </div>
                 <div style={{ display: 'flex', gap: '10px' }}>
                    <button className="button" onClick={() => { handleOpen(pdfPreviewFile, true, 'xournal'); setPdfPreviewFile(null); }} style={{ color: 'var(--rose)', borderColor: 'var(--rose)', padding: '5px 15px', fontWeight: 'bold' }}>Annotate in Xournal</button>
                    <button className="button" onClick={() => { handleOpen(pdfPreviewFile, true); setPdfPreviewFile(null); }} style={{ color: 'var(--pine)', borderColor: 'var(--pine)', padding: '5px 15px', fontWeight: 'bold' }}>Open Externally</button>
                    <button className="button" onClick={() => setPdfPreviewFile(null)} style={{ color: 'var(--love)', borderColor: 'var(--love)', padding: '5px 15px', fontWeight: 'bold' }}>Close</button>
                 </div>
              </div>
              <div style={{ flex: 1, background: '#fff', borderRadius: '4px', overflow: 'hidden' }}>
                 <iframe src={`/api/serve-file?path=${encodeURIComponent(pdfPreviewFile.path)}#toolbar=0&navpanes=0`} style={{ width: '100%', height: '100%', border: 'none' }} title="PDF Preview" />
              </div>
           </div>
        </div>
      )}

      {confirmData && (
        <div style={{ position: 'fixed', top: 0, left: 0, right: 0, bottom: 0, backgroundColor: 'rgba(0,0,0,0.8)', zIndex: 20001, display: 'flex', justifyContent: 'center', alignItems: 'center' }}>
           <div style={{ background: 'var(--base)', padding: '20px', border: '1px solid var(--love)', borderRadius: '8px', minWidth: '350px', boxShadow: '0 10px 30px rgba(0,0,0,0.5)' }}>
              <div style={{ marginBottom: '25px', color: 'var(--text)', fontWeight: 'bold' }}>{confirmData.message}</div>
              <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '10px' }}>
                 <button className="button" onClick={() => { confirmData.resolve(false); setConfirmData(null); }} style={{ color: 'var(--text)', borderColor: 'var(--muted)', padding: '5px 15px' }}>Cancel</button>
                 <button className="button" autoFocus onClick={() => { confirmData.resolve(true); setConfirmData(null); }} style={{ color: 'var(--base)', background: 'var(--love)', borderColor: 'var(--love)', padding: '5px 15px', fontWeight: 'bold' }}>Confirm</button>
              </div>
           </div>
        </div>
      )}
      {promptData && (
        <div style={{ position: 'fixed', top: 0, left: 0, right: 0, bottom: 0, backgroundColor: 'rgba(0,0,0,0.8)', zIndex: 20002, display: 'flex', justifyContent: 'center', alignItems: 'center' }}>
           <div style={{ background: 'var(--base)', padding: '20px', border: '1px solid var(--foam)', borderRadius: '8px', minWidth: '350px', boxShadow: '0 10px 30px rgba(0,0,0,0.5)' }}>
              <div style={{ marginBottom: '15px', color: 'var(--text)', fontWeight: 'bold' }}>{promptData.message}</div>
              <input 
                 autoFocus 
                 defaultValue={promptData.defaultVal} 
                 onKeyDown={e => {
                    if (e.key === 'Enter') { promptData.resolve(e.currentTarget.value); setPromptData(null); }
                    if (e.key === 'Escape') { promptData.resolve(null); setPromptData(null); }
                 }}
                 style={{ width: '100%', padding: '10px', background: 'var(--surface)', color: 'var(--text)', border: '1px solid var(--muted)', outline: 'none', borderRadius: '4px' }}
                 id="prompt-input"
              />
              <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '10px', marginTop: '20px' }}>
                 <button className="button" onClick={() => { promptData.resolve(null); setPromptData(null); }} style={{ color: 'var(--love)', borderColor: 'var(--love)', padding: '5px 15px' }}>Cancel</button>
                 <button className="button" onClick={() => { promptData.resolve((document.getElementById('prompt-input') as HTMLInputElement).value); setPromptData(null); }} style={{ color: 'var(--pine)', borderColor: 'var(--pine)', padding: '5px 15px' }}>OK</button>
              </div>
           </div>
        </div>
      )}

      {deckSettingsModal && (
        <div style={{ position: 'fixed', top: 0, left: 0, right: 0, bottom: 0, backgroundColor: 'rgba(0,0,0,0.8)', zIndex: 10005, display: 'flex', justifyContent: 'center', alignItems: 'center' }}>
           <div style={{ background: 'var(--base)', padding: '20px', border: '1px solid var(--foam)', borderRadius: '8px', minWidth: '400px', boxShadow: '0 10px 30px rgba(0,0,0,0.5)' }}>
              <div style={{ marginBottom: '15px', color: 'var(--gold)', fontWeight: 'bold' }}>&gt; DECK SETTINGS</div>
              <div style={{ marginBottom: '15px' }}>
                  <label style={{ display: 'block', marginBottom: '5px', color: 'var(--subtle)' }}>Deck Name</label>
                  <input id="ds-name" type="text" defaultValue={(data.decks || []).find(d => d.id === deckSettingsModal.deckId)?.name || ''} style={{ width: '100%', background: 'var(--surface)', color: 'var(--text)', border: '1px solid var(--muted)', padding: '8px', boxSizing: 'border-box' }} />
              </div>
              <div style={{ marginBottom: '15px' }}>
                  <label style={{ display: 'block', marginBottom: '5px', color: 'var(--subtle)' }}>Linked Semester</label>
                  <input id="ds-sem" type="text" defaultValue={deckSettingsModal.defaultSemester || ''} style={{ width: '100%', background: 'var(--surface)', color: 'var(--text)', border: '1px solid var(--muted)', padding: '8px', boxSizing: 'border-box' }} />
              </div>
              <div style={{ marginBottom: '15px' }}>
                  <label style={{ display: 'block', marginBottom: '5px', color: 'var(--subtle)' }}>Linked Lecture</label>
                  <input id="ds-lec" type="text" defaultValue={deckSettingsModal.defaultLecture || ''} style={{ width: '100%', background: 'var(--surface)', color: 'var(--text)', border: '1px solid var(--muted)', padding: '8px', boxSizing: 'border-box' }} />
              </div>
              
              <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '10px', marginTop: '20px' }}>
                 <button className="button" onClick={() => setDeckSettingsModal(null)} style={{ color: 'var(--love)', borderColor: 'var(--love)', padding: '5px 15px' }}>Cancel</button>
                 <button className="button" onClick={() => {
                     const n = (document.getElementById('ds-name') as HTMLInputElement).value;
                     const s = (document.getElementById('ds-sem') as HTMLInputElement).value;
                     const l = (document.getElementById('ds-lec') as HTMLInputElement).value;
                     if (n) handleSaveDeckSettings(deckSettingsModal.deckId, n, s, l);
                 }} style={{ color: 'var(--pine)', borderColor: 'var(--pine)', padding: '5px 15px' }}>Save</button>
              </div>
           </div>
        </div>
      )}

      {importModalData && (
        <div style={{ position: 'fixed', top: 0, left: 0, right: 0, bottom: 0, backgroundColor: 'rgba(0,0,0,0.8)', zIndex: 10005, display: 'flex', justifyContent: 'center', alignItems: 'center' }}>
           <div style={{ background: 'var(--base)', padding: '20px', border: '1px solid var(--foam)', borderRadius: '8px', minWidth: '400px', boxShadow: '0 10px 30px rgba(0,0,0,0.5)' }}>
              <div style={{ marginBottom: '15px', color: 'var(--gold)', fontWeight: 'bold' }}>&gt; IMPORT DECK</div>
              
              <div style={{ marginBottom: '15px' }}>
                  <label style={{ display: 'block', marginBottom: '5px', color: 'var(--subtle)' }}>Upload Anki (.apkg, .colpkg, .txt, .csv)</label>
                  <input type="file" accept=".apkg,.colpkg,.txt,.csv" onChange={e => setImportModalFile(e.target.files?.[0] || null)} style={{ color: 'var(--text)' }} />
              </div>

              <div style={{ marginBottom: '15px', textAlign: 'center', color: 'var(--muted)' }}>— OR —</div>

              <div style={{ marginBottom: '15px' }}>
                  <label style={{ display: 'block', marginBottom: '5px', color: 'var(--subtle)' }}>Paste Buffl Link or Raw JSON</label>
                  <textarea 
                      value={importModalText} 
                      onChange={e => setImportModalText(e.target.value)} 
                      rows={4} 
                      style={{ width: '100%', padding: '10px', background: 'var(--surface)', color: 'var(--text)', border: '1px solid var(--muted)', outline: 'none', borderRadius: '4px', resize: 'vertical' }}
                      placeholder="https://buffl.co/... or raw JSON"
                  />
              </div>

              <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '10px', marginTop: '20px' }}>
                 <button className="button" onClick={() => { setImportModalData(null); setImportModalText(''); setImportModalFile(null); }} style={{ color: 'var(--love)', borderColor: 'var(--love)', padding: '5px 15px' }}>Cancel</button>
                 <button className="button" onClick={handleImportDeckSubmit} disabled={importLoading} style={{ color: 'var(--pine)', borderColor: 'var(--pine)', padding: '5px 15px', opacity: importLoading ? 0.5 : 1 }}>{importLoading ? 'Importing...' : 'Import'}</button>
              </div>
           </div>
        </div>
      )}
    </div>
  );
}
