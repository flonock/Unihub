import React, { useState, useEffect } from 'react';
import { Modal } from '../shared/Modal';
import { Icons } from '../shared/Icons';

export default function Dashboard({ ctx }: { ctx: any }) {
  const {
    data, selectedSemester, renderAlerts, renderTimeline, newExamName, setNewExamName, 
    newExamDate, setNewExamDate, newExamLink, setNewExamLink, lectures, handleAddOrUpdateExam, 
    editingExamId, cancelEditExam, getCalculatedConfidence, getConfidenceColor, 
    updateConf, setActiveTab, setFlashcardTab, cloneExam, startEditExam, handleDeleteExam, 
    renderProgressBar, navigateToLink, prepareCramQueue, newTodoTitle, setNewTodoTitle, 
    newTodoProgress, setNewTodoProgress, newTodoDueDate, setNewTodoDueDate, newTodoLink, 
    setNewTodoLink, handleAddOrUpdateTodo, editingTodoId, cancelEditTodo, groupedTodos, 
    cloneTodo, startEditTodo, handleDeleteTodo, saveData
  } = ctx;

  const activeSessions = (data.studySessions || []).filter((s: any) => s.linkedSemester === selectedSemester);

  const [isExamModalOpen, setIsExamModalOpen] = useState(false);
  const [isTodoModalOpen, setIsTodoModalOpen] = useState(false);
  
  // Metrics Calculations
  const allExams = (data.exams || []).filter((e: any) => e.semester === selectedSemester || (e.link && e.link.split('/')[0] === selectedSemester));
  const criticalExamsCount = allExams.filter((e: any) => {
      if (!e.date) return false;
      const days = Math.ceil((new Date(e.date).getTime() - new Date().getTime()) / (1000 * 3600 * 24));
      return days >= 0 && days <= 14;
  }).length;

  const activeTasksCount = (data.todos || []).filter((t: any) => !t.status).length;
  const studySessionsCount = activeSessions.length;

  // Avg Confidence
  let totalConf = 0;
  let confCount = 0;
  lectures.forEach((lec: string) => {
      const link = `${selectedSemester}/${lec}`;
      const manualConf = data.confidences?.[link];
      const conf = manualConf !== undefined ? manualConf : getCalculatedConfidence(link);
      if (conf !== null) {
          totalConf += conf;
          confCount++;
      }
  });
  const avgConfidence = confCount > 0 ? Math.round(totalConf / confCount) : 0;

  useEffect(() => {
     if (editingExamId) setIsExamModalOpen(true);
  }, [editingExamId]);

  useEffect(() => {
     if (editingTodoId) setIsTodoModalOpen(true);
  }, [editingTodoId]);

  return (
    <div className="dashboard" style={{ display: 'flex', flexDirection: 'column', gap: '30px', height: '100%' }}>
       {/* SYSTEM ALERTS */}
       {renderAlerts()}

       {/* MAIN CONTENT AREA */}
       <div style={{ display: 'flex', flexDirection: 'column', gap: '20px', flex: 1, minHeight: 0 }}>
          
          {/* CENTRAL TIMELINE (At the top) */}
          <div className="panel" style={{ flex: '0 1 auto', maxHeight: '45%', display: 'flex', flexDirection: 'column', padding: '12px 15px', border: '1px solid var(--iris)', position: 'relative', overflow: 'hidden' }}>
              <div style={{ position: 'absolute', top: 0, left: 0, width: '4px', height: '100%', background: 'var(--iris)', boxShadow: '0 0 10px var(--iris)' }}></div>
              <div style={{ paddingLeft: '5px', flex: 1, display: 'flex', flexDirection: 'column', overflow: 'auto' }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '10px' }}>
                      <h2 style={{ color: 'var(--iris)', margin: 0, fontSize: '1.2rem' }}>&gt; GLOBAL TIMELINE</h2>
                      <div style={{ display: 'flex', gap: '10px', alignItems: 'center', background: 'var(--base)', padding: '5px 10px', border: '1px dashed var(--muted)' }}>
                         <span style={{ fontSize: '0.75rem', color: 'var(--subtle)' }}>Start:</span>
                         <input type="date" value={data.examPeriodStart || ''} onChange={e => saveData({...data, examPeriodStart: e.target.value})} style={{ background: 'transparent', color: 'var(--text)', border: 'none', outline: 'none', fontSize: '0.75rem', fontFamily: 'inherit' }} />
                         <span style={{ fontSize: '0.75rem', color: 'var(--subtle)' }}>End:</span>
                         <input type="date" value={data.examPeriodEnd || ''} onChange={e => saveData({...data, examPeriodEnd: e.target.value})} style={{ background: 'transparent', color: 'var(--text)', border: 'none', outline: 'none', fontSize: '0.75rem', fontFamily: 'inherit' }} />
                      </div>
                  </div>
                  {renderTimeline()}
              </div>
          </div>

          {/* EXAMS LIST */}
          <div style={{ display: 'flex', flexDirection: 'column', gap: '15px', overflowY: 'auto', flex: 1, paddingRight: '10px' }}>
             <h2 style={{ color: 'var(--love)', margin: 0, fontSize: '1.2rem', paddingBottom: '10px' }}>&gt; NEXT EXAMS</h2>
             
             {(() => {
                 const sortedExams = allExams.filter((e: any) => e.date).sort((a: any, b: any) => new Date(a.date).getTime() - new Date(b.date).getTime());
                 const now = new Date().getTime();
                 
                 let overallProgressPercent = 0;
                 if (sortedExams.length > 1) {
                     const firstDate = new Date(sortedExams[0].date).getTime();
                     const lastDate = new Date(sortedExams[sortedExams.length - 1].date).getTime();
                     if (now >= lastDate) {
                         overallProgressPercent = 100;
                     } else if (now <= firstDate) {
                         overallProgressPercent = 0;
                     } else {
                         let idx = 0;
                         while (idx < sortedExams.length - 1 && new Date(sortedExams[idx + 1].date).getTime() < now) {
                             idx++;
                         }
                         const d1 = new Date(sortedExams[idx].date).getTime();
                         const d2 = new Date(sortedExams[idx + 1].date).getTime();
                         const segmentProgress = (now - d1) / Math.max(1, d2 - d1);
                         overallProgressPercent = ((idx + segmentProgress) / (sortedExams.length - 1)) * 100;
                     }
                 } else if (sortedExams.length === 1) {
                     overallProgressPercent = now >= new Date(sortedExams[0].date).getTime() ? 100 : 0;
                 }

                 return (
                     <div style={{ position: 'relative', display: 'flex', flexDirection: 'column', gap: '15px' }}>
                         {/* Progress Bar Background */}
                         <div style={{ position: 'absolute', left: '16px', top: '40px', bottom: '40px', width: '2px', background: 'var(--muted)', zIndex: 0 }}></div>
                         
                         {/* Progress Bar Fill */}
                         <div style={{ position: 'absolute', left: '16px', top: '40px', bottom: '40px', width: '2px', zIndex: 1, overflow: 'hidden' }}>
                             <div style={{ width: '100%', background: 'var(--iris)', height: `${overallProgressPercent}%`, transition: 'height 0.5s ease-out' }}></div>
                         </div>

                         {sortedExams.map((e: any) => {
                             const examDate = new Date(e.date).getTime();
                             const isCompleted = examDate < now - 86400000;
                             const daysLeft = Math.ceil((examDate - now) / (1000 * 3600 * 24));
                             const examConf = e.link ? (data.confidences?.[e.link] ?? getCalculatedConfidence(e.link) ?? 0) : 0;
                             
                             const examDecks = (data.decks || []).filter((d: any) => e.link && d.linkedLecture === e.link.split('/')[1] && d.linkedSemester === e.link.split('/')[0]);
                             const cardsForExam = examDecks.flatMap((d: any) => d.cards || []);
                             const learnedCards = cardsForExam.filter((c: any) => (c.interval && c.interval > 0) || (c.ease && c.ease > 2.5)).length;
                             const totalCards = cardsForExam.length;
                             const progressPercent = totalCards > 0 ? Math.round((learnedCards / totalCards) * 100) : 0;
                             
                             const nextTask = (data.todos || [])
                                 .filter((t: any) => !t.status && t.link === e.link)
                                 .sort((a: any, b: any) => {
                                     if (!a.dueDate) return 1;
                                     if (!b.dueDate) return -1;
                                     return new Date(a.dueDate).getTime() - new Date(b.dueDate).getTime();
                                 })[0];

                             return (
                                 <div key={e.id} style={{ display: 'flex', gap: '20px', alignItems: 'center', position: 'relative', zIndex: 2 }}>
                                     {/* Marker */}
                                     <div style={{ width: '34px', display: 'flex', justifyContent: 'center' }}>
                                         <div style={{ width: '14px', height: '14px', borderRadius: '50%', background: isCompleted ? 'var(--iris)' : 'var(--base)', border: `2px solid ${isCompleted ? 'var(--iris)' : 'var(--muted)'}`, transition: 'all 0.3s ease-out' }}></div>
                                     </div>
                                     
                                     {/* Exam Panel */}
                                     <div className="panel hover-glow" style={{ flex: 1, display: 'flex', alignItems: 'center', padding: '15px 20px', background: 'var(--surface)', border: '1px solid var(--muted)', borderRadius: '8px', gap: '20px' }}>
                                         {/* Left Side: Exam Info */}
                                         <div style={{ flex: 1, display: 'flex', flexDirection: 'column', gap: '5px' }}>
                                             <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                                                 <h3 style={{ margin: 0, fontSize: '1.1rem', color: isCompleted ? 'var(--subtle)' : 'var(--text)', textDecoration: isCompleted ? 'line-through' : 'none' }}>{e.name}</h3>
                                                 {!isCompleted && (
                                                     <span style={{ padding: '2px 8px', borderRadius: '4px', fontSize: '0.75rem', fontWeight: 'bold', background: daysLeft <= 14 ? 'rgba(235, 111, 146, 0.2)' : 'rgba(156, 207, 216, 0.2)', color: daysLeft <= 14 ? 'var(--love)' : 'var(--foam)' }}>
                                                         {daysLeft} DAYS LEFT
                                                     </span>
                                                 )}
                                                 {isCompleted && (
                                                     <span style={{ padding: '2px 8px', borderRadius: '4px', fontSize: '0.75rem', fontWeight: 'bold', background: 'rgba(196, 167, 231, 0.2)', color: 'var(--iris)' }}>
                                                         COMPLETED
                                                     </span>
                                                 )}
                                             </div>
                                             <div style={{ color: 'var(--subtle)', fontSize: '0.85rem' }}>
                                                 {e.date} {e.link && <span onClick={() => { if (ctx.setCurrentPath) ctx.setCurrentPath(e.link); setActiveTab('BROWSER'); }} style={{ marginLeft: '10px', color: 'var(--iris)', cursor: 'pointer', textDecoration: 'underline' }}>Go to Lecture &gt;</span>}
                                             </div>
                                             
                                             {nextTask && (
                                                 <div style={{ marginTop: '8px', padding: '6px 10px', background: 'var(--base)', borderRadius: '4px', border: '1px solid var(--muted)', display: 'flex', alignItems: 'center', gap: '10px' }}>
                                                     <input type="checkbox" checked={nextTask.status} onChange={(ev) => {
                                                         ev.stopPropagation();
                                                         saveData({ ...data, todos: data.todos.map((t: any) => t.id === nextTask.id ? { ...t, status: !t.status } : t) });
                                                     }} style={{ cursor: 'pointer' }} />
                                                     <span style={{ flex: 1, fontSize: '0.8rem', cursor: 'pointer', color: 'var(--text)', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }} onClick={() => setActiveTab('PLANNER')} title="Go to Tasks Overview">
                                                         <strong style={{color: 'var(--gold)'}}>NEXT TASK:</strong> {nextTask.title}
                                                     </span>
                                                     <button onClick={(ev) => { ev.stopPropagation(); startEditTodo(nextTask); setIsTodoModalOpen(true); }} style={{ background: 'transparent', border: 'none', color: 'var(--subtle)', cursor: 'pointer', padding: '0', display: 'flex' }} title="Edit Task">
                                                         <Icons.Edit size={14} />
                                                     </button>
                                                 </div>
                                             )}
                                         </div>

                                         {/* Middle: Quick Actions */}
                                         <div style={{ display: 'flex', gap: '10px' }}>
                                             <button className="button" style={{ borderColor: 'var(--pine)', color: 'var(--pine)', fontSize: '0.8rem', padding: '6px 12px' }} onClick={() => {
                                                 if (!e.link) return;
                                                 const session = { id: Date.now().toString(), name: `Cram: ${e.name}`, linkedSemester: e.link.split('/')[0], linkedLecture: e.link.split('/')[1] };
                                                 setActiveTab('FLASHCARDS');
                                                 if (setFlashcardTab) setFlashcardTab('SESSIONS');
                                                 if (prepareCramQueue) prepareCramQueue(session, 'ALL');
                                             }}>
                                                 <Icons.Play size={14} /> QUICK STUDY
                                             </button>
                                             <button className="button" style={{ borderColor: 'var(--gold)', color: 'var(--gold)', fontSize: '0.8rem', padding: '6px 12px' }} onClick={() => {
                                                 if (ctx.cancelEditTodo) ctx.cancelEditTodo();
                                                 setNewTodoTitle(`Review for ${e.name}`);
                                                 setNewTodoLink(e.link || '');
                                                 setNewTodoDueDate(e.date || '');
                                                 setIsTodoModalOpen(true);
                                             }}>
                                                 <Icons.Plus size={14} /> NEW TASK
                                             </button>
                                         </div>

                                         {/* Right Side: Progress & Confidence Widget */}
                                         <div style={{ display: 'flex', gap: '20px', alignItems: 'center', borderLeft: '1px solid var(--muted)', paddingLeft: '20px', minWidth: '250px' }}>
                                             {/* Flashcard Progress */}
                                             <div style={{ display: 'flex', flexDirection: 'column', gap: '4px', flex: 1 }}>
                                                 <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.75rem', color: 'var(--subtle)', fontWeight: 'bold' }}>
                                                     <span>CARDS LEARNED</span>
                                                     <span>{learnedCards}/{totalCards}</span>
                                                 </div>
                                                 <div style={{ width: '100%', height: '8px', background: 'var(--overlay)', borderRadius: '4px', overflow: 'hidden' }}>
                                                     <div style={{ width: `${progressPercent}%`, height: '100%', background: 'var(--pine)', transition: 'width 0.3s' }}></div>
                                                 </div>
                                             </div>

                                             {/* Confidence Level */}
                                             <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '2px', minWidth: '60px' }}>
                                                 <span style={{ fontSize: '0.7rem', color: 'var(--subtle)', fontWeight: 'bold' }}>CONFIDENCE</span>
                                                 <span style={{ fontSize: '1.2rem', fontWeight: 'bold', color: getConfidenceColor(examConf) }}>{examConf}%</span>
                                             </div>
                                         </div>
                                     </div>
                                 </div>
                             );
                         })}
                         
                         {sortedExams.length === 0 && (
                             <div style={{ color: 'var(--subtle)', fontSize: '0.9rem', padding: '20px', textAlign: 'center', border: '1px dashed var(--muted)', borderRadius: '8px' }}>No exams to display.</div>
                         )}
                     </div>
                 );
             })()}
          </div>
       </div>

       {/* Add/Edit Exam Modal */}
       <Modal isOpen={isExamModalOpen} onClose={() => { setIsExamModalOpen(false); cancelEditExam(); }} title={editingExamId ? "EDIT EXAM" : "NEW EXAM"}>
          <div className="form-group">
             <label>Exam/Lecture Name</label>
             <input className="form-input" placeholder="e.g. Advanced Calculus" value={newExamName} onChange={e => setNewExamName(e.target.value)} />
          </div>
          <div className="form-group">
             <label>Date</label>
             <input className="form-input" type="date" value={newExamDate} onChange={e => setNewExamDate(e.target.value)} />
          </div>
          <div className="form-group">
             <label>Path (Link to Lecture)</label>
             <input className="form-input" list="exam-paths" placeholder="Semester/Lecture" value={newExamLink} onChange={e => setNewExamLink(e.target.value)} />
             <datalist id="exam-paths">
               {lectures.map((lec: string) => <option key={lec} value={`${selectedSemester}/${lec}`} />)}
             </datalist>
          </div>
          <div style={{ display: 'flex', gap: '10px', marginTop: '10px', justifyContent: 'flex-end' }}>
             <button className="button" onClick={() => { setIsExamModalOpen(false); cancelEditExam(); }} style={{ color: 'var(--love)', borderColor: 'var(--love)' }}>CANCEL</button>
             <button className="button" onClick={() => { handleAddOrUpdateExam(); setIsExamModalOpen(false); }}>{editingExamId ? 'UPDATE EXAM' : 'ADD EXAM'}</button>
          </div>
       </Modal>

       {/* Add/Edit Action Item Modal */}
       <Modal isOpen={isTodoModalOpen} onClose={() => { setIsTodoModalOpen(false); cancelEditTodo(); }} title={editingTodoId ? "EDIT TASK" : "NEW TASK"}>
          <div className="form-group">
             <label>Task Title</label>
             <input className="form-input" placeholder="e.g. Finish Assignment 3" value={newTodoTitle} onChange={e => setNewTodoTitle(e.target.value)} />
          </div>
          <div style={{ display: 'flex', gap: '15px' }}>
             <div className="form-group" style={{ flex: 1 }}>
                <label>Progress (%)</label>
                <input className="form-input" type="number" min="0" max="100" value={newTodoProgress} onChange={e => setNewTodoProgress(parseInt(e.target.value)||0)} />
             </div>
             <div className="form-group" style={{ flex: 1 }}>
                <label>Due Date</label>
                <input className="form-input" type="date" value={newTodoDueDate} onChange={e => setNewTodoDueDate(e.target.value)} />
             </div>
          </div>
          <div className="form-group">
             <label>Path (Link to Lecture) - Optional</label>
             <input className="form-input" list="todo-paths" placeholder="Semester/Lecture" value={newTodoLink} onChange={e => setNewTodoLink(e.target.value)} />
             <datalist id="todo-paths">
               {lectures.map((lec: string) => <option key={lec} value={`${selectedSemester}/${lec}`} />)}
             </datalist>
          </div>
          <div style={{ display: 'flex', gap: '10px', marginTop: '10px', justifyContent: 'flex-end' }}>
             <button className="button" onClick={() => { setIsTodoModalOpen(false); cancelEditTodo(); }} style={{ color: 'var(--love)', borderColor: 'var(--love)' }}>CANCEL</button>
             <button className="button" onClick={() => { handleAddOrUpdateTodo(); setIsTodoModalOpen(false); }}>{editingTodoId ? 'UPDATE TASK' : 'ADD TASK'}</button>
          </div>
       </Modal>

    </div>
  );
}
