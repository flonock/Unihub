import React, { useState } from 'react';
import { Icons } from '../shared/Icons';
import ReactMarkdown from 'react-markdown';
import remarkGfm from 'remark-gfm';

export default function LectureNexus({ ctx }: { ctx: any }) {
  const {
    currentPath,
    data,
    updateLectureMeta,
    getConfidenceColor,
    asyncPrompt,
    updateConf,
    files,
    handleOpen,
    navigateToLink,
    setActiveTab,
    setFlashcardTab,
    prepareCramQueue,
    getCalculatedConfidence,
    renderProgressBar,
    handleDeleteFolder,
    handleCreateFolder,
    handleNewNote
  } = ctx;

  const [scratchpadMode, setScratchpadMode] = useState<'EDIT' | 'PREVIEW'>('PREVIEW');
  const [inlinePreviewFile, setInlinePreviewFile] = useState<any | null>(null);
  
  // Flashcard Generation State
  const [isGeneratingFlashcard, setIsGeneratingFlashcard] = useState(false);
  const [newFlashcardFront, setNewFlashcardFront] = useState('');
  const [newFlashcardBack, setNewFlashcardBack] = useState('');

  const parts = currentPath.split('/').filter(Boolean);
  const isLecture = parts.length >= 2;
  const lectureName = parts[1];
  const semesterName = parts[0];
  const isSubfolder = parts.length > 2;

  if (!isLecture) {
     return <div style={{ color: 'var(--subtle)' }}>Please select a lecture from the sidebar to view the Nexus.</div>;
  }

  const meta = data.lectureMeta?.[currentPath] || {};
  const conf = data.confidences?.[currentPath] ?? null;
  const autoConf = getCalculatedConfidence ? getCalculatedConfidence(currentPath) : null;
  
  const linkedTodos = (data.todos || []).filter((t: any) => t.link === currentPath);
  const linkedExams = (data.exams || []).filter((e: any) => e.link === currentPath);
  const linkedDecks = (data.decks || []).filter((d: any) => d.linkedSemester === semesterName && d.linkedLecture === lectureName);
  
  const activeSessions = (data.studySessions || []).filter((s: any) => s.linkedSemester === semesterName && s.linkedLecture === lectureName);

  const handleInlineOpen = (file: any) => {
      if (file.isDirectory) {
          handleOpen(file);
      } else if (file.ext === 'pdf') {
          setInlinePreviewFile(file);
      } else {
          // Open externally or let parent handle
          handleOpen(file, true);
      }
  };

  const createFlashcard = () => {
      if (!newFlashcardFront || !newFlashcardBack) return;
      if (!linkedDecks || linkedDecks.length === 0) {
          alert('Please create a Deck for this lecture first in the Flashcard DB.');
          return;
      }
      
      const targetDeck = linkedDecks[0];
      const newCard = {
          id: 'card-' + Date.now().toString(),
          front: newFlashcardFront,
          back: newFlashcardBack,
          interval: 0,
          repetition: 0,
          efactor: 2.5,
          nextReviewDate: new Date().toISOString()
      };
      
      const newData = { ...data };
      const deckIndex = newData.decks.findIndex((d: any) => d.id === targetDeck.id);
      if (deckIndex > -1) {
          newData.decks[deckIndex].cards = [...(newData.decks[deckIndex].cards || []), newCard];
          ctx.saveData(newData);
      }
      
      setIsGeneratingFlashcard(false);
      setNewFlashcardFront('');
      setNewFlashcardBack('');
  };

  const handleTextSelection = () => {
      const selection = window.getSelection();
      if (selection && selection.toString().trim().length > 0) {
          setNewFlashcardFront(selection.toString().trim());
          setIsGeneratingFlashcard(true);
      }
  };

  return (
    <div className="lecture-nexus" style={{ display: 'flex', flexDirection: 'column', gap: '30px' }}>
       {/* HEADER */}
       <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', borderBottom: '2px dashed var(--muted)', paddingBottom: '20px' }}>
          <div>
            <div style={{ color: 'var(--subtle)', fontSize: '0.8rem', letterSpacing: '0.1em', marginBottom: '5px' }}>[{semesterName.toUpperCase()}]</div>
            <h1 style={{ color: 'var(--iris)', margin: 0, fontSize: '2rem', textShadow: '0 0 10px rgba(196, 167, 231, 0.3)' }}>&gt; {lectureName.toUpperCase()}</h1>
          </div>
          <div style={{ display: 'flex', gap: '20px', alignItems: 'center' }}>
             <div style={{ textAlign: 'right' }}>
                <div style={{ fontSize: '0.7rem', color: 'var(--subtle)' }}>CREDITS</div>
                <input 
                   type="number" 
                   value={meta.credits || ''} 
                   onChange={e => updateLectureMeta(currentPath, { credits: parseInt(e.target.value) || 0 })}
                   style={{ background: 'transparent', border: 'none', borderBottom: '1px solid var(--muted)', color: 'var(--text)', width: '50px', textAlign: 'right', outline: 'none', fontFamily: 'inherit' }}
                />
             </div>
             <div style={{ textAlign: 'right' }}>
                <div style={{ fontSize: '0.7rem', color: 'var(--subtle)' }}>PROFESSOR</div>
                <input 
                   type="text" 
                   value={meta.professor || ''} 
                   onChange={e => updateLectureMeta(currentPath, { professor: e.target.value })}
                   style={{ background: 'transparent', border: 'none', borderBottom: '1px solid var(--muted)', color: 'var(--text)', width: '150px', textAlign: 'right', outline: 'none', fontFamily: 'inherit' }}
                />
             </div>
             <div style={{ textAlign: 'center', padding: '10px', border: '1px solid var(--muted)', background: 'var(--base)', borderRadius: '4px' }}>
                <div style={{ fontSize: '0.7rem', color: 'var(--subtle)' }}>CONFIDENCE</div>
                <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                   <span 
                      onClick={async () => {
                         const val = await asyncPrompt(`Set confidence for ${lectureName} (0-100):`, conf !== null ? conf.toString() : '0');
                         if (val !== null) updateConf(currentPath, parseInt(val) || 0);
                      }}
                      style={{ color: conf !== null ? getConfidenceColor(conf) : 'var(--muted)', fontSize: '1.2rem', fontWeight: 'bold', cursor: 'pointer' }}
                   >
                      {conf !== null ? `${conf}%` : '--%'}
                   </span>
                   {autoConf !== null && (
                      <span style={{ fontSize: '0.8rem', color: getConfidenceColor(autoConf), borderLeft: '1px solid var(--muted)', paddingLeft: '10px' }}>
                         AUTO: {autoConf}%
                      </span>
                   )}
                </div>
             </div>
          </div>
       </div>

       <div style={{ display: 'grid', gridTemplateColumns: '1.5fr 1fr', gap: '30px' }}>
          
          {/* LEFT COLUMN: FILES & FLASHCARDS */}
          <div style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
             
             {/* DOCUMENTS MATRIX */}
             <div className="panel">
                <div className="panel-header">
                   <span>&gt; DOCUMENTS MATRIX</span>
                   <div style={{ display: 'flex', gap: '10px' }}>
                      {isSubfolder && (
                        <button className="button" style={{ padding: '2px 8px', fontSize: '0.7rem' }} onClick={() => ctx.setCurrentPath(parts.slice(0, -1).join('/'))}>.. Go Up</button>
                      )}
                      <button className="button" style={{ padding: '2px 8px', fontSize: '0.7rem' }} onClick={() => handleCreateFolder(currentPath)}>+ FOLDER</button>
                      <button className="button" style={{ padding: '2px 8px', fontSize: '0.7rem' }} onClick={handleNewNote}>+ NOTE</button>
                   </div>
                </div>
                {isSubfolder && (
                  <div style={{ color: 'var(--subtle)', fontSize: '0.75rem', marginBottom: '10px', paddingBottom: '10px', borderBottom: '1px dashed var(--muted)' }}>
                    PATH: /{parts.slice(2).join('/')}
                  </div>
                )}
                
                {inlinePreviewFile ? (
                   <div style={{ display: 'flex', flexDirection: 'column', height: '400px' }}>
                      <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '10px' }}>
                         <span style={{ color: 'var(--text)', fontWeight: 'bold' }}>{inlinePreviewFile.name}</span>
                         <div style={{ display: 'flex', gap: '10px' }}>
                            <button className="button" style={{ padding: '2px 8px', fontSize: '0.7rem' }} onClick={() => { handleOpen(inlinePreviewFile); setInlinePreviewFile(null); }}>EXPAND</button>
                            <button className="button" style={{ padding: '2px 8px', fontSize: '0.7rem', color: 'var(--love)', borderColor: 'var(--love)' }} onClick={() => setInlinePreviewFile(null)}>CLOSE</button>
                         </div>
                      </div>
                      <iframe src={`/api/serve-file?path=${encodeURIComponent(inlinePreviewFile.path)}#toolbar=0&navpanes=0&scrollbar=0`} style={{ flex: 1, width: '100%', border: '1px solid var(--muted)', background: 'white' }} />
                   </div>
                ) : (
                   <div style={{ maxHeight: '300px', overflowY: 'auto', display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(200px, 1fr))', gap: '10px' }}>
                      {files.length === 0 ? <div style={{ color: 'var(--subtle)', fontSize: '0.8rem' }}>[ NO FILES FOUND ]</div> : null}
                      {files.map((file: any) => (
                         <div key={file.path} className="sub-panel hover-glow" style={{ padding: '10px', cursor: 'pointer', display: 'flex', alignItems: 'center', gap: '10px' }} onClick={() => handleInlineOpen(file)}>
                            <span style={{ fontSize: '1.2rem' }}>{file.isDirectory ? '📁' : (file.ext === 'pdf' ? '📄' : (file.ext === 'xopp' ? '📓' : '📝'))}</span>
                            <span style={{ flex: 1, whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis', fontSize: '0.85rem' }}>{file.name}</span>
                            {!file.isDirectory && (
                               <button className="button" style={{ padding: '2px 5px', fontSize: '0.6rem' }} onClick={(e) => { e.stopPropagation(); handleOpen(file, true); }}>EXT</button>
                            )}
                            <button className="button" style={{ padding: '2px 5px', fontSize: '0.6rem', color: 'var(--love)', borderColor: 'var(--love)' }} onClick={(e) => { e.stopPropagation(); handleDeleteFolder(file.path); }}>X</button>
                         </div>
                      ))}
                   </div>
                )}
             </div>

             {/* NEURAL LINK (FLASHCARDS) */}
             <div className="panel" style={{ border: '1px solid var(--pine)', position: 'relative', overflow: 'hidden' }}>
                <div style={{ position: 'absolute', top: 0, left: 0, width: '4px', height: '100%', background: 'var(--pine)', boxShadow: '0 0 10px var(--pine)' }}></div>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '15px', paddingLeft: '10px' }}>
                   <h2 style={{ color: 'var(--pine)', fontSize: '1.1rem', margin: 0 }}>&gt; NEURAL LINK (FLASHCARDS)</h2>
                   <button className="button" style={{ padding: '2px 8px', fontSize: '0.7rem', borderColor: 'var(--pine)', color: 'var(--pine)' }} onClick={() => { setActiveTab('FLASHCARDS'); if (setFlashcardTab) setFlashcardTab('LIBRARY'); }}>
                      Manage Decks
                   </button>
                </div>
                
                {linkedDecks.length === 0 ? (
                   <div style={{ color: 'var(--subtle)', fontSize: '0.8rem', paddingLeft: '10px' }}>[ NO DECKS LINKED TO THIS LECTURE ]</div>
                ) : (
                   <div style={{ paddingLeft: '10px', display: 'flex', flexDirection: 'column', gap: '10px' }}>
                      {linkedDecks.map((d: any) => (
                         <div key={d.id} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', background: 'var(--overlay)', padding: '10px', borderRadius: '4px' }}>
                            <span style={{ color: 'var(--text)' }}>{d.name} <span style={{ color: 'var(--subtle)', fontSize: '0.75rem' }}>({d.cards?.length || 0} cards)</span></span>
                         </div>
                      ))}
                      
                      {activeSessions.length > 0 ? (
                         <button 
                            className="button" 
                            style={{ width: '100%', marginTop: '10px', borderColor: 'var(--gold)', color: 'var(--gold)', padding: '10px', fontSize: '0.9rem' }}
                            onClick={() => {
                               setActiveTab('FLASHCARDS');
                               setFlashcardTab('SESSIONS');
                               if (prepareCramQueue) prepareCramQueue(activeSessions[0], 'ALL');
                            }}
                         >
                            Start Study Session
                         </button>
                      ) : (
                         <button 
                            className="button" 
                            style={{ width: '100%', marginTop: '10px', borderColor: 'var(--subtle)', color: 'var(--subtle)', padding: '10px', fontSize: '0.9rem' }}
                            onClick={() => { setActiveTab('FLASHCARDS'); setFlashcardTab('SESSIONS'); }}
                         >
                            Create Study Session
                         </button>
                      )}
                   </div>
                )}
             </div>

          </div>

          {/* RIGHT COLUMN: PLANNER & QUICK NOTES */}
          <div style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
             
             {/* QUICK NOTES WITH MARKDOWN & INLINE FLASHCARDS */}
             <div className="panel" style={{ flex: 1, display: 'flex', flexDirection: 'column' }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '10px' }}>
                    <div style={{ color: 'var(--gold)', fontSize: '1.1rem', fontWeight: 'bold' }}>&gt; SCRATCHPAD</div>
                    <div style={{ display: 'flex', gap: '5px' }}>
                        <button className="button" style={{ padding: '2px 8px', fontSize: '0.7rem', borderColor: scratchpadMode === 'EDIT' ? 'var(--gold)' : 'var(--muted)', color: scratchpadMode === 'EDIT' ? 'var(--gold)' : 'var(--text)' }} onClick={() => setScratchpadMode('EDIT')}>EDIT</button>
                        <button className="button" style={{ padding: '2px 8px', fontSize: '0.7rem', borderColor: scratchpadMode === 'PREVIEW' ? 'var(--gold)' : 'var(--muted)', color: scratchpadMode === 'PREVIEW' ? 'var(--gold)' : 'var(--text)' }} onClick={() => setScratchpadMode('PREVIEW')}>PREVIEW</button>
                    </div>
                </div>

                {isGeneratingFlashcard && (
                    <div className="sub-panel hover-glow" style={{ marginBottom: '10px', border: '1px solid var(--pine)' }}>
                        <div style={{ color: 'var(--pine)', fontWeight: 'bold', marginBottom: '10px', fontSize: '0.9rem' }}>+ NEW FLASHCARD</div>
                        <textarea value={newFlashcardFront} onChange={e => setNewFlashcardFront(e.target.value)} placeholder="Front" style={{ width: '100%', background: 'var(--overlay)', color: 'var(--text)', border: '1px solid var(--muted)', padding: '5px', marginBottom: '5px', fontFamily: 'inherit', resize: 'vertical' }} />
                        <textarea value={newFlashcardBack} onChange={e => setNewFlashcardBack(e.target.value)} placeholder="Back" style={{ width: '100%', background: 'var(--overlay)', color: 'var(--text)', border: '1px solid var(--muted)', padding: '5px', marginBottom: '5px', fontFamily: 'inherit', resize: 'vertical' }} />
                        <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '10px' }}>
                            <button className="button" style={{ padding: '4px 8px', fontSize: '0.7rem', color: 'var(--love)', borderColor: 'var(--love)' }} onClick={() => setIsGeneratingFlashcard(false)}>CANCEL</button>
                            <button className="button" style={{ padding: '4px 8px', fontSize: '0.7rem', color: 'var(--pine)', borderColor: 'var(--pine)' }} onClick={createFlashcard}>SAVE</button>
                        </div>
                    </div>
                )}
                
                {scratchpadMode === 'EDIT' ? (
                    <textarea
                        value={meta.notes || ''}
                        onChange={e => updateLectureMeta(currentPath, { notes: e.target.value })}
                        placeholder="Jot down quick thoughts here... (Markdown Supported)"
                        style={{ flex: 1, width: '100%', minHeight: '300px', background: 'transparent', color: 'var(--text)', border: '1px solid var(--muted)', outline: 'none', resize: 'vertical', fontFamily: 'inherit', padding: '10px', borderRadius: '4px' }}
                    />
                ) : (
                    <div 
                        onMouseUp={handleTextSelection}
                        style={{ flex: 1, minHeight: '300px', padding: '10px', border: '1px solid var(--muted)', borderRadius: '4px', background: 'var(--base)', overflowY: 'auto', lineHeight: '1.5' }}
                        className="markdown-preview"
                    >
                        {meta.notes ? (
                            <ReactMarkdown remarkPlugins={[remarkGfm]}>
                                {meta.notes}
                            </ReactMarkdown>
                        ) : (
                            <div style={{ color: 'var(--subtle)', fontStyle: 'italic' }}>No notes yet. Switch to EDIT mode to type. Select text to generate flashcards.</div>
                        )}
                    </div>
                )}
             </div>

             {/* OBJECTIVES (TODOS) */}
             <div className="panel">
                <h2 style={{ color: 'var(--gold)', fontSize: '1.1rem', margin: 0, marginBottom: '15px' }}>&gt; TACTICAL OBJECTIVES</h2>
                <div style={{ maxHeight: '200px', overflowY: 'auto', display: 'flex', flexDirection: 'column', gap: '10px' }}>
                   {linkedTodos.length === 0 ? <div style={{ color: 'var(--subtle)', fontSize: '0.8rem' }}>[ NO ACTIVE TASKS ]</div> : null}
                   {linkedTodos.map((todo: any) => (
                      <div key={todo.id} style={{ display: 'flex', alignItems: 'center', gap: '10px', background: 'var(--base)', padding: '10px', border: '1px solid var(--muted)' }}>
                         <span style={{ color: todo.status ? 'var(--pine)' : 'var(--love)' }}>[{todo.status ? 'X' : ' '}]</span>
                         <span style={{ flex: 1, textDecoration: todo.status ? 'line-through' : 'none', color: todo.status ? 'var(--subtle)' : 'var(--text)' }}>{todo.title}</span>
                         {todo.progress !== undefined && (
                            <span style={{ color: 'var(--pine)', fontSize: '0.8rem' }}>[{todo.progress}%]</span>
                         )}
                      </div>
                   ))}
                </div>
                <button className="link-button" style={{ marginTop: '15px', fontSize: '0.8rem', color: 'var(--gold)' }} onClick={() => setActiveTab('PLANNER')}>&gt; MANAGE TASKS</button>
             </div>

          </div>
       </div>
    </div>
  );
}
