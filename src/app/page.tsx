'use client';

import { useState, useEffect } from 'react';

type FileEntry = { name: string; isDirectory: boolean; path: string; isPdf?: boolean; isXopp?: boolean; ext?: string; };
type Exam = { id: string; name: string; date?: string; link?: string; semester?: string; };
type Todo = { id: string; title: string; status: boolean; link: string; progress?: number; dueDate?: string; };
type CalendarEvent = { id: string; title: string; startDate: string; endDate: string; type: 'task' | 'study'; link?: string; };
type LectureMeta = { category?: 'Wahlpflicht' | 'Wahlfach' | 'Ignore' | ''; credits?: number; grade?: string; container?: string; notes?: string; };
type Flashcard = { id: string; front: string; back: string; ease?: number; interval?: number; nextReview?: string; };
type Deck = { id: string; name: string; link?: string; cards: Flashcard[]; };
type WorkspaceData = { exams: Exam[]; todos: Todo[]; notes: string; studyPlan?: string; events?: CalendarEvent[]; confidences?: Record<string, number>; examPeriodStart?: string; examPeriodEnd?: string; lectureMeta?: Record<string, LectureMeta>; containers?: string[]; containerMaxCredits?: Record<string, number>; decks?: Deck[]; };

export default function Workspace() {
  const [activeTab, setActiveTab] = useState<'MISSION_CONTROL' | 'BROWSER' | 'PLANNER' | 'OVERVIEW' | 'FLASHCARDS'>('MISSION_CONTROL');

  const [files, setFiles] = useState<FileEntry[]>([]);
  const [currentPath, setCurrentPath] = useState('');
  const [loading, setLoading] = useState(true);
  const [pdfPreviewFile, setPdfPreviewFile] = useState<FileEntry | null>(null);

  const [semesters, setSemesters] = useState<string[]>([]);
  const [selectedSemester, setSelectedSemester] = useState<string>('');
  const [lectures, setLectures] = useState<string[]>([]);

  // Widget Switcher State
  const [activeWidget, setActiveWidget] = useState(0);
  const widgetNames = ["Pomodoro", "Converter", "Astro Clock", "Data Encoder", "Telemetry"];
  
  // Widget 0: Pomodoro
  const [pomoTime, setPomoTime] = useState(1500);
  const [pomoActive, setPomoActive] = useState(false);
  const [pomoMode, setPomoMode] = useState<'WORK' | 'BREAK'>('WORK');

  // Widget 1: Converter
  const [convValue, setConvValue] = useState('1');
  const [convType, setConvType] = useState('lb_to_kg');

  // Widget 2: Astro Clock
  const [jd, setJd] = useState('');
  const [utc, setUtc] = useState('');

  // Widget 3: Data Encoder
  const [encInput, setEncInput] = useState('AEROSPACE');
  const [encMode, setEncMode] = useState<'HEX' | 'BIN'>('HEX');

  // Widget 4: Telemetry
  const [pingData, setPingData] = useState<number[]>([12, 14, 15, 12, 18, 11, 13, 14, 16, 12]);

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
         setPomoTime((data.pomoWorkTime || 25) * 60);
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
    setNewExamDate(exam.date);
    setNewExamLink(exam.link || '');
  };

  const cloneExam = (exam: Exam) => {
    setEditingExamId(null);
    setNewExamName(exam.name);
    setNewExamDate(exam.date);
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

  // -------------------------
  // WIDGET LOGIC
  // -------------------------
  useEffect(() => {
    let interval: any;
    if (pomoActive && pomoTime > 0) {
      interval = setInterval(() => setPomoTime(t => Math.max(0, t - 1)), 1000);
    } else if (pomoTime === 0 && pomoActive) {
      setPomoActive(false);
    }
    return () => clearInterval(interval);
  }, [pomoActive, pomoTime]);

  let convertedValue = '--';
  const cv = parseFloat(convValue);
  if (!isNaN(cv)) {
     switch(convType) {
        case 'lb_to_kg': convertedValue = (cv * 0.453592).toFixed(2) + ' kg'; break;
        case 'kg_to_lb': convertedValue = (cv * 2.20462).toFixed(2) + ' lb'; break;
        case 'mi_to_km': convertedValue = (cv * 1.60934).toFixed(2) + ' km'; break;
        case 'km_to_mi': convertedValue = (cv * 0.621371).toFixed(2) + ' mi'; break;
        case 'f_to_c': convertedValue = ((cv - 32) * 5/9).toFixed(2) + ' °C'; break;
        case 'c_to_f': convertedValue = ((cv * 9/5) + 32).toFixed(2) + ' °F'; break;
        case 'psi_to_pa': convertedValue = (cv * 6894.76).toFixed(0) + ' Pa'; break;
        case 'pa_to_psi': convertedValue = (cv / 6894.76).toFixed(4) + ' psi'; break;
        case 'sec_to_hr': convertedValue = (cv / 3600).toFixed(4) + ' hr'; break;
        case 'hr_to_sec': convertedValue = (cv * 3600).toFixed(0) + ' s'; break;
        case 'day_to_hr': convertedValue = (cv * 24).toFixed(1) + ' hr'; break;
        case 'hr_to_day': convertedValue = (cv / 24).toFixed(4) + ' day'; break;
        case 'j_to_cal': convertedValue = (cv / 4.184).toFixed(2) + ' cal'; break;
        case 'cal_to_j': convertedValue = (cv * 4.184).toFixed(2) + ' J'; break;
        case 'w_to_hp': convertedValue = (cv / 745.7).toFixed(4) + ' hp'; break;
        case 'hp_to_w': convertedValue = (cv * 745.7).toFixed(2) + ' W'; break;
        case 'm_s_to_km_h': convertedValue = (cv * 3.6).toFixed(2) + ' km/h'; break;
        case 'km_h_to_m_s': convertedValue = (cv / 3.6).toFixed(2) + ' m/s'; break;
     }
  }

  let encodedValue = '';
  if (encMode === 'HEX') {
      encodedValue = encInput.split('').map(c => c.charCodeAt(0).toString(16).padStart(2, '0')).join(' ').toUpperCase();
  } else {
      encodedValue = encInput.split('').map(c => c.charCodeAt(0).toString(2).padStart(8, '0')).join(' ');
  }

  useEffect(() => {
    const updateTime = () => {
      const now = new Date();
      setUtc(now.toISOString().replace('T', ' ').substring(0, 19) + ' Z');
      const timeMs = now.getTime();
      const julian = (timeMs / 86400000) + 2440587.5;
      setJd(julian.toFixed(4));
    };
    updateTime();
    const interval = setInterval(updateTime, 1000);
    return () => clearInterval(interval);
  }, []);

  useEffect(() => {
    const interval = setInterval(() => {
       setPingData(prev => {
          const next = [...prev.slice(1), Math.floor(Math.random() * 15) + 10];
          return next;
       });
    }, 1500);
    return () => clearInterval(interval);
  }, []);

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

  const handleBufflImport = async () => {
      const input = await asyncPrompt('Enter Buffl Share Link or paste Raw JSON:');
      if (!input) return;
      
      try {
          const res = await fetch('/api/buffl', {
              method: 'POST',
              headers: { 'Content-Type': 'application/json' },
              body: JSON.stringify({ input, targetPath: currentPath })
          });
          const data = await res.json();
          if (res.ok) {
              await asyncConfirm(data.message);
          } else {
              await asyncConfirm(`Error: ${data.error}`);
          }
      } catch (e) {
          console.error(e);
      }
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
                                  {getJoke(exam.name, exam.daysLeft, i, exam.link)}
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

  return (
    <div className={`app-container ${!appConfig.enableFlicker ? 'no-flicker' : ''}`}>
      <div className="sidebar" style={{ width: '360px' }}>
        <div className="sidebar-title" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
           <span>{appConfig.workspaceTitle}</span>
           <span style={{ cursor: 'pointer', fontSize: '1.2rem', color: 'var(--subtle)', transition: 'color 0.2s' }} onMouseEnter={e => e.currentTarget.style.color='var(--text)'} onMouseLeave={e => e.currentTarget.style.color='var(--subtle)'} onClick={openSettings} title="Settings">⚙</span>
        </div>
        
        {/* TABS */}
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '5px', marginBottom: '20px' }}>
          <button 
            className="button" 
            onClick={() => setActiveTab('MISSION_CONTROL')}
            style={{ padding: '8px 5px', fontSize: '0.8rem', borderColor: activeTab === 'MISSION_CONTROL' ? 'var(--rose)' : 'var(--muted)', color: activeTab === 'MISSION_CONTROL' ? 'var(--rose)' : 'var(--text)' }}
          >
            DASHBOARD
          </button>
          <button 
            className="button" 
            onClick={() => setActiveTab('PLANNER')}
            style={{ padding: '8px 5px', fontSize: '0.8rem', borderColor: activeTab === 'PLANNER' ? 'var(--gold)' : 'var(--muted)', color: activeTab === 'PLANNER' ? 'var(--gold)' : 'var(--text)' }}
          >
            PLANNER
          </button>
          <button 
            className="button" 
            onClick={() => setActiveTab('BROWSER')}
            style={{ padding: '8px 5px', fontSize: '0.8rem', borderColor: activeTab === 'BROWSER' ? 'var(--foam)' : 'var(--muted)', color: activeTab === 'BROWSER' ? 'var(--foam)' : 'var(--text)' }}
          >
            BROWSER
          </button>
          <button 
            className="button" 
            onClick={() => setActiveTab('OVERVIEW')}
            style={{ padding: '8px 5px', fontSize: '0.8rem', borderColor: activeTab === 'OVERVIEW' ? 'var(--iris)' : 'var(--muted)', color: activeTab === 'OVERVIEW' ? 'var(--iris)' : 'var(--text)' }}
          >
            OVERVIEW
          </button>
          <button 
            className="button" 
            onClick={() => setActiveTab('FLASHCARDS')}
            style={{ padding: '8px 5px', fontSize: '0.8rem', borderColor: activeTab === 'FLASHCARDS' ? 'var(--pine)' : 'var(--muted)', color: activeTab === 'FLASHCARDS' ? 'var(--pine)' : 'var(--text)' }}
          >
            FLASHCARDS
          </button>
        </div>

        {/* Semester Dropdown */}
        <div className="widget" style={{ padding: '10px' }}>
          <div style={{ color: 'var(--subtle)', marginBottom: '8px', fontSize: '0.8rem' }}>[ SELECT_SEMESTER ]</div>
          <select 
            value={selectedSemester} 
            onChange={e => {
              setSelectedSemester(e.target.value);
              setCurrentPath(e.target.value);
              setActiveTab('MISSION_CONTROL');
            }}
            style={{ width: '100%', background: 'var(--overlay)', color: 'var(--text)', border: '1px solid var(--muted)', padding: '6px', fontFamily: 'inherit', outline: 'none', cursor: 'pointer' }}
          >
            {semesters.map(s => <option key={s} value={s}>{s}</option>)}
          </select>
          <button onClick={handleAddSemester} className="button" style={{ width: '100%', marginTop: '5px', padding: '6px', fontSize: '0.8rem', borderColor: 'var(--foam)', color: 'var(--foam)' }}>+ ADD SEMESTER</button>
        </div>

        {/* Lectures List */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: '8px', flex: 1, overflowY: 'auto' }}>
          <div style={{ color: 'var(--subtle)', fontSize: '0.8rem', marginTop: '10px', marginBottom: '5px' }}>--- LECTURES ---</div>
          {lectures.map(lec => {
            const path = `${selectedSemester}/${lec}`;
            const isActive = currentPath === path || currentPath.startsWith(path + '/');
            const conf = data.confidences?.[path] ?? null;
            return (
              <div 
                key={lec} 
                className={`lecture-item ${isActive ? 'active' : ''}`}
                onClick={() => {
                  setCurrentPath(path);
                  setActiveTab('BROWSER');
                }}
                style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}
              >
                <span style={{ whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>{isActive ? '> ' : '  '}{lec}</span>
                <span 
                   onClick={async (e) => { e.stopPropagation(); const val = await asyncPrompt(`Set confidence for ${lec} (0-100):`, conf !== null ? conf.toString() : '0');
                       if (val !== null) {
                           updateConf(path, parseInt(val) || 0);
                       }
                   }}
                   style={{ color: conf !== null ? getConfidenceColor(conf) : 'var(--muted)', fontSize: '0.75rem', fontWeight: 'bold', marginLeft: '5px', cursor: 'pointer' }}
                   title="Edit Confidence"
                >
                   [{conf !== null ? conf : '--'}%]
                </span>
              </div>
            );
          })}
        </div>

        {/* Widget Area */}
        <div className="widget" style={{marginTop: 'auto'}}>
          <div className="widget-title">
            <span>--- {widgetNames[activeWidget].toUpperCase()} ---</span>
            <div style={{ display: 'flex', gap: '5px', cursor: 'pointer' }}>
              <span onClick={() => setActiveWidget((prev) => (prev - 1 + widgetNames.length) % widgetNames.length)} style={{color: 'var(--foam)'}}>[&lt;]</span>
              <span onClick={() => setActiveWidget((prev) => (prev + 1) % widgetNames.length)} style={{color: 'var(--foam)'}}>[&gt;]</span>
            </div>
          </div>

          {activeWidget === 0 && (
            <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '10px', padding: '5px 0' }}>
               <div style={{ fontSize: '2rem', color: pomoActive ? 'var(--love)' : 'var(--text)', fontWeight: 'bold', textShadow: pomoActive ? '0 0 10px var(--love)' : 'none' }}>
                  {Math.floor(pomoTime / 60).toString().padStart(2, '0')}:{(pomoTime % 60).toString().padStart(2, '0')}
               </div>
               <div style={{ display: 'flex', gap: '5px', width: '100%' }}>
                  <button className="button" style={{ flex: 1, padding: '4px', fontSize: '0.75rem', borderColor: pomoActive ? 'var(--love)' : 'var(--foam)', color: pomoActive ? 'var(--love)' : 'var(--foam)' }} onClick={() => setPomoActive(!pomoActive)}>
                     {pomoActive ? 'PAUSE' : 'START'}
                  </button>
                  <button className="button" style={{ flex: 1, padding: '4px', fontSize: '0.75rem' }} onClick={() => { setPomoActive(false); setPomoTime(pomoMode === 'WORK' ? appConfig.pomoWorkTime * 60 : appConfig.pomoBreakTime * 60); }}>
                     RESET
                  </button>
               </div>
               <div style={{ display: 'flex', gap: '10px', fontSize: '0.7rem' }}>
                  <span style={{ cursor: 'pointer', color: pomoMode === 'WORK' ? 'var(--gold)' : 'var(--subtle)' }} onClick={() => { setPomoMode('WORK'); setPomoActive(false); setPomoTime(appConfig.pomoWorkTime * 60); }}>[ WORK ]</span>
                  <span style={{ cursor: 'pointer', color: pomoMode === 'BREAK' ? 'var(--gold)' : 'var(--subtle)' }} onClick={() => { setPomoMode('BREAK'); setPomoActive(false); setPomoTime(appConfig.pomoBreakTime * 60); }}>[ BREAK ]</span>
               </div>
            </div>
          )}

          {activeWidget === 1 && (
            <div style={{ padding: '5px 0' }}>
              <div style={{display: 'flex', gap: '5px', marginBottom: '8px'}}>
                 <input type="number" value={convValue} onChange={e => setConvValue(e.target.value)} style={{ flex: 1, background: 'var(--overlay)', color: 'var(--text)', border: '1px solid var(--muted)', padding: '4px', fontSize: '0.9rem', width: '50%' }} />
                 <select value={convType} onChange={e => setConvType(e.target.value)} style={{ flex: 1, background: 'var(--overlay)', color: 'var(--text)', border: '1px solid var(--muted)', padding: '4px', fontSize: '0.8rem', width: '50%', cursor: 'pointer' }}>
                    <option value="lb_to_kg">lb &rarr; kg</option>
                    <option value="kg_to_lb">kg &rarr; lb</option>
                    <option value="mi_to_km">mi &rarr; km</option>
                    <option value="km_to_mi">km &rarr; mi</option>
                    <option value="f_to_c">°F &rarr; °C</option>
                    <option value="c_to_f">°C &rarr; °F</option>
                    <option value="psi_to_pa">psi &rarr; Pa</option>
                    <option value="pa_to_psi">Pa &rarr; psi</option>
                    <option disabled>──────</option>
                    <option value="sec_to_hr">sec &rarr; hr</option>
                    <option value="hr_to_sec">hr &rarr; sec</option>
                    <option value="day_to_hr">day &rarr; hr</option>
                    <option value="hr_to_day">hr &rarr; day</option>
                    <option disabled>──────</option>
                    <option value="j_to_cal">J &rarr; cal</option>
                    <option value="cal_to_j">cal &rarr; J</option>
                    <option value="w_to_hp">W &rarr; hp</option>
                    <option value="hp_to_w">hp &rarr; W</option>
                    <option disabled>──────</option>
                    <option value="m_s_to_km_h">m/s &rarr; km/h</option>
                    <option value="km_h_to_m_s">km/h &rarr; m/s</option>
                 </select>
              </div>
              <div style={{ fontSize: '1rem', color: 'var(--pine)', fontWeight: 'bold', textAlign: 'center', padding: '5px', background: 'var(--hl-low)', border: '1px dashed var(--pine)' }}>
                 {convertedValue}
              </div>
            </div>
          )}

          {activeWidget === 2 && (
            <div style={{ padding: '10px 0', textAlign: 'center' }}>
              <div style={{fontSize: '0.75rem', color: 'var(--subtle)'}}>UTC TIME</div>
              <div style={{fontSize: '1rem', color: 'var(--foam)', marginBottom: '10px'}}>{utc}</div>
              <div style={{fontSize: '0.75rem', color: 'var(--subtle)'}}>JULIAN DATE</div>
              <div style={{fontSize: '1rem', color: 'var(--rose)'}}>{jd}</div>
            </div>
          )}

          {activeWidget === 3 && (
            <div style={{ padding: '5px 0', display: 'flex', flexDirection: 'column', gap: '8px' }}>
              <input value={encInput} onChange={e => setEncInput(e.target.value)} placeholder="Type text..." style={{ width: '100%', background: 'var(--overlay)', color: 'var(--text)', border: '1px solid var(--muted)', padding: '6px', fontSize: '0.8rem' }} />
              <div style={{ display: 'flex', gap: '5px' }}>
                  <button className="button" style={{ flex: 1, padding: '4px', fontSize: '0.7rem', borderColor: encMode === 'HEX' ? 'var(--gold)' : 'var(--muted)', color: encMode === 'HEX' ? 'var(--gold)' : 'var(--text)' }} onClick={() => setEncMode('HEX')}>HEX</button>
                  <button className="button" style={{ flex: 1, padding: '4px', fontSize: '0.7rem', borderColor: encMode === 'BIN' ? 'var(--gold)' : 'var(--muted)', color: encMode === 'BIN' ? 'var(--gold)' : 'var(--text)' }} onClick={() => setEncMode('BIN')}>BIN</button>
              </div>
              <div style={{ fontSize: '0.7rem', color: 'var(--iris)', fontFamily: 'monospace', padding: '8px', background: 'var(--hl-low)', border: '1px dashed var(--iris)', wordBreak: 'break-all', maxHeight: '80px', overflowY: 'auto' }}>
                 {encodedValue || '...'}
              </div>
            </div>
          )}

          {activeWidget === 4 && (
            <div style={{ padding: '5px 0' }}>
               <div style={{ fontSize: '0.75rem', color: 'var(--subtle)', display: 'flex', justifyContent: 'space-between', marginBottom: '5px' }}>
                  <span>UPLINK STATUS</span>
                  <span style={{ color: 'var(--pine)', animation: 'blinkCursor 1s infinite' }}>SECURE</span>
               </div>
               <div style={{ display: 'flex', alignItems: 'flex-end', height: '40px', gap: '2px', borderBottom: '1px solid var(--muted)', paddingBottom: '2px' }}>
                  {pingData.map((p, i) => (
                     <div key={i} style={{ flex: 1, background: 'var(--foam)', opacity: 0.6 + (p/20)*0.4, height: `${(p/25)*100}%`, transition: 'height 0.2s' }}></div>
                  ))}
               </div>
               <div style={{ fontSize: '0.7rem', color: 'var(--subtle)', marginTop: '5px', textAlign: 'right' }}>
                  Avg Latency: {Math.round(pingData.reduce((a,b)=>a+b,0)/pingData.length)}ms
               </div>
            </div>
          )}
        </div>

      </div>

      <div className="main-content">
        {activeTab === 'BROWSER' && (
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 300px', gap: '20px', height: '100%' }}>
            
            {/* LEFT: File Browser */}
            <div style={{ display: 'flex', flexDirection: 'column' }}>
                <div className="header" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                  <div className="breadcrumb">
                    <span 
                      className={`breadcrumb-item ${currentPath === '' ? 'breadcrumb-active' : ''}`}
                      onClick={() => setCurrentPath('')}
                    >
                      ~/Uni
                    </span>
                    {pathParts.map((part, index) => {
                      const partPath = pathParts.slice(0, index + 1).join('/');
                      return (
                        <span key={partPath} className="breadcrumb" style={{gap: '10px'}}>
                          <span style={{color: 'var(--muted)'}}>/</span>
                          <span 
                            className={`breadcrumb-item ${index === pathParts.length - 1 ? 'breadcrumb-active' : ''}`}
                            onClick={() => setCurrentPath(partPath)}
                          >
                            {part}
                          </span>
                        </span>
                      );
                    })}
                  </div>

                  <div style={{ display: 'flex', gap: '10px' }}>
                     <button className="button" onClick={() => handleCreateFolder(currentPath)} style={{ fontSize: '0.8rem', padding: '4px 8px' }}>+ Mkdir</button>
                     {currentPath !== '' && (
                         <button className="button" onClick={() => handleDeleteFolder(currentPath)} style={{ fontSize: '0.8rem', padding: '4px 8px', color: 'var(--love)', borderColor: 'var(--love)' }}>- Rm</button>
                     )}
                  </div>
                </div>

                {loading ? (
                  <div style={{ color: 'var(--iris)' }}>Loading...</div>
                ) : (
                  <div className="grid">
                    {files.map(file => {
                      const extStr = file.isDirectory ? 'DIR' : (file.ext ? file.ext.substring(0,3).toUpperCase() : '???');
                      const color = file.isDirectory ? 'var(--foam)' : 
                                    file.ext === 'xopp' ? 'var(--rose)' : 
                                    file.ext === 'pdf' ? 'var(--love)' : 
                                    file.ext === 'txt' || file.ext === 'md' ? 'var(--pine)' :
                                    file.ext === 'png' || file.ext === 'jpg' ? 'var(--gold)' :
                                    file.ext === 'json' || file.ext === 'js' || file.ext === 'ts' || file.ext === 'py' || file.ext === 'cpp' || file.ext === 'c' ? 'var(--iris)' :
                                    'var(--subtle)';
                      return (
                      <div key={file.path} className="card" onClick={() => handleOpen(file)}>
                        <div className="card-icon" style={{ color }}>
                          [{extStr}]
                        </div>
                        <div className="card-title" title={file.name}>{file.name}</div>
                      </div>
                      );
                    })}
                    {files.length === 0 && (
                        <div style={{ color: 'var(--muted)', gridColumn: '1 / -1' }}>[ Directory is empty ]</div>
                    )}
                  </div>
                )}
            </div>

            {/* RIGHT: Context Sidebar */}
            <div style={{ borderLeft: '1px dashed var(--muted)', paddingLeft: '20px', display: 'flex', flexDirection: 'column', overflowY: 'auto' }}>
                <h2 style={{ color: 'var(--gold)', marginBottom: '20px', fontSize: '1rem' }}>&gt; LECTURE CONTEXT</h2>
                {(() => {
                   if (!currentPath) return <div style={{ color: 'var(--subtle)', fontSize: '0.9rem' }}>Navigate to a lecture to view context.</div>;
                   
                   const rootLecturePath = currentPath.split('/').slice(0,2).join('/');
                   const conf = data.confidences?.[rootLecturePath] ?? 0;
                   const bars = Math.floor(conf / 10);
                   const empty = 10 - bars;
                   const confColor = getConfidenceColor(conf);

                   const contextExams = data.exams.filter(e => currentPath === e.link || currentPath.startsWith(e.link + '/'));
                   const contextTodos = data.todos.filter(t => currentPath === t.link || (t.link && currentPath.startsWith(t.link + '/')));
                   
                   return (
                     <>
                        <div style={{ marginBottom: '20px', background: 'var(--base)', border: '1px solid var(--muted)', padding: '10px' }}>
                           <div style={{ color: 'var(--iris)', fontSize: '0.8rem', marginBottom: '8px', fontWeight: 'bold' }}>CONFIDENCE LEVEL</div>
                           <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
                               <div style={{ display: 'flex', justifyContent: 'space-between', color: confColor }}>
                                   <span style={{ letterSpacing: '2px' }}>[{'#'.repeat(bars)}{'-'.repeat(empty)}]</span>
                                   <span style={{ fontWeight: 'bold' }}>{conf}%</span>
                               </div>
                               <div style={{ display: 'flex', gap: '5px' }}>
                                   <button className="button" onClick={() => updateConf(rootLecturePath, conf - 10)} style={{ flex: 1, padding: '2px', fontSize: '0.75rem', color: 'var(--love)', borderColor: 'var(--love)' }}>-10</button>
                                   <button className="button" onClick={() => updateConf(rootLecturePath, conf - 1)} style={{ flex: 1, padding: '2px', fontSize: '0.75rem', color: 'var(--love)', borderColor: 'var(--love)' }}>-1</button>
                                   <button className="button" onClick={() => updateConf(rootLecturePath, conf + 1)} style={{ flex: 1, padding: '2px', fontSize: '0.75rem', color: 'var(--pine)', borderColor: 'var(--pine)' }}>+1</button>
                                   <button className="button" onClick={() => updateConf(rootLecturePath, conf + 10)} style={{ flex: 1, padding: '2px', fontSize: '0.75rem', color: 'var(--pine)', borderColor: 'var(--pine)' }}>+10</button>
                               </div>
                           </div>
                        </div>

                        {/* Exams */}
                        {contextExams.map(exam => {
                           const daysLeft = Math.ceil((new Date(exam.date).getTime() - new Date().getTime()) / (1000 * 3600 * 24));
                           return (
                             <div key={`ctx-ex-${exam.id}`} style={{ marginBottom: '15px', background: 'var(--base)', border: '1px solid var(--love)', padding: '10px' }}>
                                <div style={{ color: 'var(--love)', fontWeight: 'bold', marginBottom: '5px' }}>EXAM: {exam.name}</div>
                                <div style={{ color: 'var(--subtle)', fontSize: '0.8rem', marginBottom: '5px' }}>Date: {exam.date}</div>
                                <div style={{ color: daysLeft < 7 ? 'var(--love)' : 'var(--pine)', fontSize: '0.9rem' }}>T-Minus {daysLeft} Days</div>
                                <div style={{ color: 'var(--text)', marginTop: '5px', fontSize: '0.5rem', whiteSpace: 'nowrap', overflow: 'hidden' }}>{renderProgressBar(daysLeft, 30)}</div>
                             </div>
                           );
                        })}
                        {contextExams.length === 0 && <div style={{ color: 'var(--subtle)', fontSize: '0.8rem', marginBottom: '15px' }}>No exams mapped to this path.</div>}

                        {/* Tasks */}
                        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginTop: '15px', marginBottom: '10px' }}>
                            <div style={{ color: 'var(--iris)', fontWeight: 'bold', fontSize: '0.9rem' }}>TASKS</div>
                            <button className="button" style={{ padding: '2px 5px', fontSize: '0.7rem', color: 'var(--foam)', borderColor: 'var(--foam)' }} onClick={async () => { const title = await asyncPrompt('Enter new task for this lecture:');
                                if (title) {
                                    saveData({ ...data, todos: [...data.todos, { id: Date.now().toString(), title, status: false, link: currentPath }] });
                                }
                            }}>+ ADD TASK</button>
                        </div>
                        {contextTodos.map(todo => (
                           <div key={`ctx-todo-${todo.id}`} style={{ display: 'flex', gap: '8px', marginBottom: '8px', fontSize: '0.9rem', alignItems: 'flex-start' }}>
                              <span 
                                style={{ color: todo.status ? 'var(--pine)' : 'var(--love)', cursor: 'pointer', fontWeight: 'bold', marginTop: '2px' }}
                                onClick={() => {
                                   const newData = { ...data, todos: data.todos.map(t => t.id === todo.id ? { ...t, status: !t.status } : t) };
                                   saveData(newData);
                                }}
                              >
                                [{todo.status ? 'X' : ' '}]
                              </span>
                              <span style={{ textDecoration: todo.status ? 'line-through' : 'none', color: todo.status ? 'var(--muted)' : 'var(--text)', lineHeight: '1.2' }}>
                                {todo.title}
                              </span>
                           </div>
                        ))}
                        {contextTodos.length === 0 && <div style={{ color: 'var(--subtle)', fontSize: '0.8rem', marginBottom: '15px' }}>No tasks found for this path.</div>}

                        {/* Notes */}
                        <div style={{ color: 'var(--gold)', fontWeight: 'bold', marginTop: '20px', marginBottom: '10px', fontSize: '0.9rem' }}>LECTURE NOTES</div>
                        <textarea
                            value={data.lectureMeta?.[rootLecturePath]?.notes || ''}
                            onChange={(e) => updateLectureMeta(rootLecturePath, { notes: e.target.value })}
                            placeholder="Jot down quick thoughts, hints, or reminders for this lecture here..."
                            style={{ width: '100%', height: '150px', background: 'var(--base)', color: 'var(--text)', border: '1px dashed var(--muted)', padding: '10px', fontFamily: 'inherit', resize: 'vertical', outline: 'none', borderRadius: '4px' }}
                        />
                     </>
                   )
                })()}
            </div>
          </div>
        )}

        {activeTab === 'MISSION_CONTROL' && (
          <div className="mission-control">
             {/* SYSTEM ALERTS */}
             {renderAlerts()}

             {/* TIMELINE MODULE (Moved to Top) */}
             <div style={{ marginBottom: '30px', borderBottom: '1px dashed var(--muted)', paddingBottom: '20px' }}>
                 <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                    <h2 style={{ color: 'var(--iris)', margin: 0, fontSize: '1rem' }}>&gt; EXAM TIMELINE</h2>
                    <div style={{ display: 'flex', gap: '10px', alignItems: 'center', background: 'var(--surface)', padding: '3px 8px', border: '1px dashed var(--muted)' }}>
                       <span style={{ fontSize: '0.75rem', color: 'var(--subtle)' }}>Start:</span>
                       <input type="date" value={data.examPeriodStart || ''} onChange={e => saveData({...data, examPeriodStart: e.target.value})} style={{ background: 'var(--base)', color: 'var(--text)', border: '1px solid var(--muted)', outline: 'none', padding: '1px 3px', fontSize: '0.75rem', fontFamily: 'inherit' }} />
                       <span style={{ fontSize: '0.75rem', color: 'var(--subtle)' }}>End:</span>
                       <input type="date" value={data.examPeriodEnd || ''} onChange={e => saveData({...data, examPeriodEnd: e.target.value})} style={{ background: 'var(--base)', color: 'var(--text)', border: '1px solid var(--muted)', outline: 'none', padding: '1px 3px', fontSize: '0.75rem', fontFamily: 'inherit' }} />
                    </div>
                 </div>
                 {renderTimeline()}
             </div>

             <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '40px' }}>
                {/* LEFT COLUMN */}
                <div>
                  <h2 style={{ color: 'var(--iris)', marginBottom: '20px' }}>&gt; LECTURES</h2>

                  {/* Add/Edit Exam Form */}
                  <div style={{ marginBottom: '15px', display: 'flex', gap: '10px', background: 'var(--surface)', padding: '10px', border: `1px ${editingExamId ? 'solid var(--foam)' : 'dashed var(--muted)'}` }}>
                    <input placeholder="Exam/Lecture Name" value={newExamName} onChange={e => setNewExamName(e.target.value)} style={{ flex: 2, background: 'var(--base)', border: '1px solid var(--muted)', color: 'var(--text)', padding: '5px', fontFamily: 'inherit', outline: 'none' }} />
                    <input type="date" value={newExamDate} onChange={e => setNewExamDate(e.target.value)} style={{ flex: 1, background: 'var(--base)', border: '1px solid var(--muted)', color: 'var(--text)', padding: '5px', fontFamily: 'inherit', outline: 'none' }} />
                    
                    <input list="exam-paths" placeholder="Path (e.g. Semester 2/Math)" value={newExamLink} onChange={e => setNewExamLink(e.target.value)} style={{ flex: 2, background: 'var(--base)', border: '1px solid var(--muted)', color: 'var(--text)', padding: '5px', fontFamily: 'inherit', outline: 'none' }} />
                    <datalist id="exam-paths">
                      {lectures.map(lec => (
                        <option key={lec} value={`${selectedSemester}/${lec}`} />
                      ))}
                    </datalist>

                    <button className="button" onClick={handleAddOrUpdateExam} style={{ padding: '5px 10px' }}>
                       {editingExamId ? 'Update' : 'Add'}
                    </button>
                    {editingExamId && (
                       <button className="button" onClick={cancelEditExam} style={{ padding: '5px 10px', color: 'var(--love)', borderColor: 'var(--love)' }}>Cancel</button>
                    )}
                  </div>

                  <div style={{ maxHeight: '500px', overflowY: 'auto', marginBottom: '15px' }}>
                  {[...data.exams]
                    .filter(e => {
                        const eSem = e.semester || (e.link ? e.link.split('/')[0] : selectedSemester);
                        return eSem === selectedSemester;
                    })
                    .sort((a,b) => {
                        if (!a.date && !b.date) return 0;
                        if (!a.date) return 1;
                        if (!b.date) return -1;
                        return new Date(a.date).getTime() - new Date(b.date).getTime();
                    })
                    .map(exam => {
                     const examDate = exam.date ? new Date(exam.date).getTime() : null;
                     const today = new Date().getTime();
                     const daysLeft = examDate ? Math.ceil((examDate - today) / (1000 * 3600 * 24)) : null;
                     return (
                        <div key={exam.id} style={{ marginBottom: '15px', border: '1px solid var(--muted)', padding: '15px', background: 'var(--base)', position: 'relative' }}>
                          <div style={{ display: 'flex', justifyContent: 'space-between', color: 'var(--gold)', marginBottom: '5px' }}>
                            <span style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                               {exam.name}
                               {exam.link && (() => {
                                   const conf = data.confidences?.[exam.link] ?? null;
                                   const color = conf !== null ? getConfidenceColor(conf) : 'var(--muted)';
                                   return (
                                       <span 
                                           onClick={async (e) => { e.stopPropagation(); const val = await asyncPrompt(`Set confidence for ${exam.name} (0-100):`, conf !== null ? conf.toString() : '0');
                                               if (val !== null) updateConf(exam.link!, parseInt(val) || 0);
                                           }}
                                           style={{ color: color, fontSize: '0.7rem', border: `1px solid ${color}`, padding: '1px 4px', borderRadius: '3px', cursor: 'pointer' }}
                                           title="Edit Confidence"
                                       >
                                           {conf !== null ? `${conf}% CONF` : '--% CONF'}
                                       </span>
                                   );
                               })()}
                            </span>
                            <div style={{ display: 'flex', gap: '10px' }}>
                               <span>{daysLeft !== null ? `T-Minus ${daysLeft} Days` : 'TBD'}</span>
                              <span style={{ color: 'var(--gold)', cursor: 'pointer' }} onClick={() => cloneExam(exam)} title="Copy Exam">[COPY]</span>
                              <span style={{ color: 'var(--foam)', cursor: 'pointer' }} onClick={() => startEditExam(exam)} title="Edit Exam">[EDIT]</span>
                              <span style={{ color: 'var(--love)', cursor: 'pointer' }} onClick={() => handleDeleteExam(exam.id)} title="Delete Exam">[X]</span>
                            </div>
                          </div>
                          <div style={{ color: daysLeft < 7 ? 'var(--love)' : 'var(--pine)' }}>
                            {renderProgressBar(daysLeft)}
                          </div>
                          {exam.link && (
                            <div style={{ display: 'flex', gap: '10px', marginTop: '10px' }}>
                                <button className="link-button" onClick={() => navigateToLink(exam.link!)} style={{ fontSize: '0.85rem' }}>
                                  &gt; JUMP TO FOLDER
                                </button>
                                <button className="link-button" onClick={() => fetch('/api/open', { method: 'POST', body: JSON.stringify({ filePath: exam.link, type: 'xournal' }) })} style={{ fontSize: '0.85rem', borderColor: 'var(--pine)', color: 'var(--pine)' }}>
                                  &gt; LAUNCH NOTES
                                </button>
                            </div>
                          )}
                        </div>
                     );
                  })}
                  </div>
                </div>

                {/* RIGHT COLUMN */}
                <div style={{ display: 'flex', flexDirection: 'column' }}>
                  <h2 style={{ color: 'var(--iris)', marginBottom: '20px' }}>&gt; ACTION ITEMS</h2>

                  {/* Add/Edit Action Item Form */}
                  <div style={{ marginBottom: '20px', display: 'flex', gap: '10px', background: 'var(--surface)', padding: '10px', border: `1px ${editingTodoId ? 'solid var(--foam)' : 'dashed var(--muted)'}` }}>
                    <input placeholder="Task Title" value={newTodoTitle} onChange={e => setNewTodoTitle(e.target.value)} style={{ flex: 3, background: 'var(--base)', border: '1px solid var(--muted)', color: 'var(--text)', padding: '5px', fontFamily: 'inherit', outline: 'none' }} />
                    <input type="number" min="0" max="100" placeholder="0%" value={newTodoProgress} onChange={e => setNewTodoProgress(parseInt(e.target.value)||0)} style={{ width: '60px', background: 'var(--base)', border: '1px solid var(--muted)', color: 'var(--text)', padding: '5px', fontFamily: 'inherit', outline: 'none' }} title="Progress %" />
                    <input type="date" value={newTodoDueDate} onChange={e => setNewTodoDueDate(e.target.value)} style={{ width: '130px', background: 'var(--base)', border: '1px solid var(--muted)', color: 'var(--text)', padding: '5px', fontFamily: 'inherit', outline: 'none' }} title="Due Date" />
                    
                    <input list="todo-paths" placeholder="Path (optional)" value={newTodoLink} onChange={e => setNewTodoLink(e.target.value)} style={{ flex: 2, background: 'var(--base)', border: '1px solid var(--muted)', color: 'var(--text)', padding: '5px', fontFamily: 'inherit', outline: 'none' }} />
                    <datalist id="todo-paths">
                      {lectures.map(lec => (
                        <option key={lec} value={`${selectedSemester}/${lec}`} />
                      ))}
                    </datalist>

                    <button className="button" onClick={handleAddOrUpdateTodo} style={{ padding: '5px 10px' }}>
                        {editingTodoId ? 'Update' : 'Add'}
                    </button>
                    {editingTodoId && (
                       <button className="button" onClick={cancelEditTodo} style={{ padding: '5px 10px', color: 'var(--love)', borderColor: 'var(--love)' }}>Cancel</button>
                    )}
                  </div>
                  

                  {Object.entries(groupedTodos).map(([group, groupTodos]) => (
                    <div key={group} style={{ marginBottom: '20px' }}>
                      <div style={{ color: 'var(--gold)', marginBottom: '10px', fontSize: '0.9rem', letterSpacing: '0.05em' }}>
                        [{group.toUpperCase()}]
                      </div>
                      {groupTodos.map(todo => (
                        <div key={todo.id} style={{ display: 'flex', alignItems: 'center', gap: '10px', marginBottom: '8px', background: 'var(--base)', padding: '10px', border: '1px solid var(--muted)' }}>
                          <span 
                            style={{ color: todo.status ? 'var(--pine)' : 'var(--love)', cursor: 'pointer', fontWeight: 'bold' }}
                            onClick={() => {
                               const newData = { ...data, todos: data.todos.map(t => t.id === todo.id ? { ...t, status: !t.status } : t) };
                               saveData(newData);
                            }}
                          >
                            [{todo.status ? 'X' : ' '}]
                          </span>
                          <span style={{ textDecoration: todo.status ? 'line-through' : 'none', color: todo.status ? 'var(--muted)' : 'var(--text)' }}>
                            {todo.title}
                          </span>
                          
                          {todo.link && (
                            <button className="link-button" style={{ marginLeft: 'auto', fontSize: '0.8rem' }} onClick={() => navigateToLink(todo.link)}>
                              [JUMP TO LECTURE]
                            </button>
                          )}

                          <span 
                            style={{ color: 'var(--pine)', cursor: 'pointer', minWidth: '40px', fontSize: '0.8rem', textAlign: 'right', marginLeft: !todo.link ? 'auto' : '10px' }} 
                            onClick={async () => {
                                const val = await asyncPrompt('Enter progress (0-100):', (todo.progress || 0).toString());
                                if (val !== null) {
                                   const p = Math.max(0, Math.min(100, parseInt(val)||0));
                                   saveData({ ...data, todos: data.todos.map(t => t.id === todo.id ? { ...t, progress: p } : t) });
                                }
                            }}
                            title="Click to edit progress"
                          >
                            [{todo.progress || 0}%]
                          </span>

                          <span style={{ color: 'var(--gold)', cursor: 'pointer', marginLeft: '10px' }} onClick={() => cloneTodo(todo)} title="Copy Task">
                            [COPY]
                          </span>
                          <span style={{ color: 'var(--foam)', cursor: 'pointer', marginLeft: '10px' }} onClick={() => startEditTodo(todo)} title="Edit Task">
                            [EDIT]
                          </span>
                          <span style={{ color: 'var(--love)', cursor: 'pointer', marginLeft: '10px' }} onClick={() => handleDeleteTodo(todo.id)} title="Delete Task">
                            [DEL]
                          </span>
                        </div>
                      ))}
                    </div>
                  ))}
                </div>
             </div>
          </div>
        )}

        {activeTab === 'PLANNER' && (
          <div className="planner">
             <div style={{ display: 'grid', gridTemplateColumns: '2.5fr 1fr', gap: '30px' }}>
                <div>
                   <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '20px' }}>
                      <button className="button" onClick={() => setCurrentMonth(new Date(currentMonth.getFullYear(), currentMonth.getMonth() - 1, 1))}>&lt; Prev</button>
                      <h2 style={{ color: 'var(--iris)', margin: 0 }}>
                          {currentMonth.toLocaleString('default', { month: 'long', year: 'numeric' })}
                      </h2>
                      <button className="button" onClick={() => setCurrentMonth(new Date(currentMonth.getFullYear(), currentMonth.getMonth() + 1, 1))}>Next &gt;</button>
                   </div>
                   
                   {renderCalendar()}

                   {/* Add/Edit Event Form */}
                   <div style={{ display: 'flex', gap: '10px', marginTop: '20px', background: 'var(--surface)', padding: '15px', border: `1px ${editingEventId ? 'solid var(--foam)' : 'dashed var(--muted)'}` }}>
                      <input placeholder="Event Title" value={newEventTitle} onChange={e => setNewEventTitle(e.target.value)} style={{ flex: 2, background: 'var(--base)', color: 'var(--text)', border: '1px solid var(--muted)', padding: '5px', outline: 'none', fontFamily: 'inherit' }} />
                      <select value={newEventType} onChange={e => setNewEventType(e.target.value as any)} style={{ flex: 1, background: 'var(--base)', color: 'var(--text)', border: '1px solid var(--muted)', padding: '5px', outline: 'none', fontFamily: 'inherit', cursor: 'pointer' }}>
                          <option value="study">Study Block</option>
                          <option value="task">Deadline</option>
                      </select>
                      <input type="date" value={newEventStart} onChange={e => setNewEventStart(e.target.value)} style={{ flex: 1, background: 'var(--base)', color: 'var(--text)', border: '1px solid var(--muted)', padding: '5px', outline: 'none', fontFamily: 'inherit' }} />
                      <span style={{ color: 'var(--muted)', alignSelf: 'center' }}>to</span>
                      <input type="date" value={newEventEnd} onChange={e => setNewEventEnd(e.target.value)} style={{ flex: 1, background: 'var(--base)', color: 'var(--text)', border: '1px solid var(--muted)', padding: '5px', outline: 'none', fontFamily: 'inherit' }} />
                      
                      <button className="button" onClick={handleAddOrUpdateEvent}>
                         {editingEventId ? 'Update' : 'Add'}
                      </button>
                      {editingEventId && (
                         <button className="button" onClick={cancelEditEvent} style={{ color: 'var(--love)', borderColor: 'var(--love)' }}>Cancel</button>
                      )}
                   </div>
                </div>
                
                <div style={{ display: 'flex', flexDirection: 'column' }}>
                   <h2 style={{ color: 'var(--gold)', marginBottom: '20px' }}>&gt; EVENT MANAGER</h2>
                   <div style={{ background: 'var(--base)', border: '1px solid var(--muted)', padding: '15px', flex: 1, overflowY: 'auto' }}>
                      {(data.events || []).length === 0 ? (
                          <div style={{ color: 'var(--subtle)' }}>No events scheduled.</div>
                      ) : (
                          (data.events || []).sort((a,b) => a.startDate.localeCompare(b.startDate)).map(ev => (
                              <div key={`mgr-${ev.id}`} style={{ marginBottom: '15px', borderBottom: '1px dashed var(--surface)', paddingBottom: '10px' }}>
                                 <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '5px' }}>
                                    <span style={{ color: ev.type === 'study' ? 'var(--pine)' : 'var(--gold)' }}>{ev.title}</span>
                                    <div>
                                       <span style={{ color: 'var(--gold)', cursor: 'pointer', fontSize: '0.8rem', marginRight: '10px' }} onClick={() => cloneEvent(ev)}>[COPY]</span>
                                       <span style={{ color: 'var(--foam)', cursor: 'pointer', fontSize: '0.8rem', marginRight: '10px' }} onClick={() => startEditEvent(ev)}>[EDIT]</span>
                                       <span style={{ color: 'var(--love)', cursor: 'pointer', fontSize: '0.8rem' }} onClick={() => handleDeleteEvent(ev.id)}>[DEL]</span>
                                    </div>
                                 </div>
                                 <div style={{ color: 'var(--subtle)', fontSize: '0.8rem' }}>
                                    {ev.startDate} {ev.startDate !== ev.endDate ? `to ${ev.endDate}` : ''}
                                 </div>
                              </div>
                          ))
                      )}
                   </div>
                </div>
             </div>
          </div>
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

        {activeTab === 'FLASHCARDS' && (
          <div className="flashcards-container" style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', height: '100%', color: 'var(--subtle)' }}>
              <h2 style={{ color: 'var(--gold)', marginBottom: '10px' }}>&gt; FLASHCARD ENGINE [OFFLINE]</h2>
              <div style={{ textAlign: 'center', maxWidth: '600px', lineHeight: '1.6' }}>
                  <p>The spaced-repetition neural net is currently offline.</p>
                  <p style={{ marginTop: '10px' }}>This module is prepared for future integration. It will allow you to link dedicated Flashcard Decks directly to your specific lecture directories, automatically scheduling reviews based on your upcoming exams.</p>
                  
                  <div style={{ marginTop: '30px' }}>
                     <button className="button" style={{ borderColor: 'var(--foam)', color: 'var(--foam)', padding: '10px 20px', fontSize: '1rem', fontWeight: 'bold' }} onClick={handleBufflImport}>
                         + IMPORT FROM BUFFL (BETA)
                     </button>
                  </div>

                  <div style={{ padding: '20px', border: '1px dashed var(--muted)', background: 'var(--hl-low)', marginTop: '20px' }}>
                      <strong style={{ color: 'var(--pine)' }}>Upcoming Features:</strong>
                      <ul style={{ textAlign: 'left', marginTop: '10px', marginLeft: '40px', color: 'var(--text)' }}>
                          <li style={{ marginBottom: '5px' }}>Spaced Repetition System (SRS) Algorithm</li>
                          <li style={{ marginBottom: '5px' }}>Markdown and LaTeX support for math formulas</li>
                          <li style={{ marginBottom: '5px' }}>Directory-bound decks automatically mapped to exams</li>
                          <li>Confidence-level integration for auto-generating cards</li>
                      </ul>
                  </div>
              </div>
          </div>
        )}
      </div>

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
        <div style={{ position: 'fixed', top: 0, left: 0, right: 0, bottom: 0, backgroundColor: 'rgba(0,0,0,0.8)', zIndex: 10001, display: 'flex', justifyContent: 'center', alignItems: 'center' }}>
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
        <div style={{ position: 'fixed', top: 0, left: 0, right: 0, bottom: 0, backgroundColor: 'rgba(0,0,0,0.8)', zIndex: 10000, display: 'flex', justifyContent: 'center', alignItems: 'center' }}>
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
    </div>
  );
}
