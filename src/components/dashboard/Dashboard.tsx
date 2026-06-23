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
  
  const [editingConfId, setEditingConfId] = useState<string | null>(null);
  const [tempConfValue, setTempConfValue] = useState<number>(0);

  const [editingProgressId, setEditingProgressId] = useState<string | null>(null);
  const [tempProgressValue, setTempProgressValue] = useState<number>(0);

  useEffect(() => {
     if (editingExamId) setIsExamModalOpen(true);
  }, [editingExamId]);

  useEffect(() => {
     if (editingTodoId) setIsTodoModalOpen(true);
  }, [editingTodoId]);

  return (
    <div className="dashboard" style={{ display: 'flex', flexDirection: 'column', gap: '30px' }}>
       {/* SYSTEM ALERTS */}
       {renderAlerts()}

       {/* TIMELINE MODULE */}
       <div style={{ background: 'var(--surface)', border: '1px solid var(--muted)', padding: '20px', borderRadius: '4px' }}>
           <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '15px' }}>
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

       <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '30px' }}>
          {/* LEFT COLUMN: LECTURES & EXAMS */}
          <div style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
            
            <div className="panel">
              <div className="panel-header">
                <span>&gt; Priority Overview (Exams & Lectures)</span>
                <button className="button" style={{ padding: '2px 8px', fontSize: '0.7rem', borderColor: 'var(--foam)', color: 'var(--foam)' }} onClick={() => setIsExamModalOpen(true)}>
                    <Icons.Plus size={14} /> NEW EXAM
                </button>
              </div>

              <div style={{ maxHeight: '500px', overflowY: 'auto', display: 'flex', flexDirection: 'column', gap: '10px' }}>
              {[...data.exams]
                .filter(e => {
                    const eSem = e.semester || (e.link ? e.link.split('/')[0] : selectedSemester);
                    return eSem === selectedSemester;
                })
                .sort((a,b) => {
                    const getUrg = (ex: any) => {
                       const d = ex.date ? new Date(ex.date).getTime() : null;
                       const days = d ? Math.max(0, Math.ceil((d - new Date().getTime()) / (1000 * 3600 * 24))) : 999;
                       const conf = ex.link ? (data.confidences?.[ex.link] ?? getCalculatedConfidence(ex.link) ?? 100) : 100;
                       return (100 - conf) * 10 + Math.max(0, (30 - days) * 20);
                    };
                    return getUrg(b) - getUrg(a); // High urgency first
                })
                .map(exam => {
                 const examDate = exam.date ? new Date(exam.date).getTime() : null;
                 const today = new Date().getTime();
                 const daysLeft = examDate ? Math.ceil((examDate - today) / (1000 * 3600 * 24)) : null;
                 const autoConf = exam.link ? getCalculatedConfidence(exam.link) : null;
                 const examParts = exam.link ? exam.link.split('/') : [];
                 const activeExamSessions = (data.studySessions || []).filter((s: any) => examParts.length >= 2 && s.linkedSemester === examParts[0] && s.linkedLecture === examParts[1]);

                 return (
                    <div key={exam.id} className="sub-panel" style={{ position: 'relative' }}>
                      <div style={{ display: 'flex', justifyContent: 'space-between', color: 'var(--gold)', marginBottom: '5px' }}>
                        <span style={{ display: 'flex', alignItems: 'center', gap: '10px', fontSize: '1.1rem', fontWeight: 'bold' }}>
                           {exam.name}
                           {exam.link && (() => {
                               const conf = data.confidences?.[exam.link] ?? null;
                               const color = conf !== null ? getConfidenceColor(conf) : 'var(--muted)';
                               const autoColor = autoConf !== null ? getConfidenceColor(autoConf) : 'var(--muted)';
                               
                               if (editingConfId === exam.id) {
                                   return (
                                       <span style={{ display: 'flex', gap: '5px', alignItems: 'center', marginLeft: '10px' }} onClick={e => e.stopPropagation()}>
                                           <input type="range" min="0" max="100" value={tempConfValue} onChange={e => setTempConfValue(parseInt(e.target.value))} style={{ width: '80px' }} />
                                           <span style={{ fontSize: '0.7rem', color: getConfidenceColor(tempConfValue) }}>{tempConfValue}%</span>
                                           <button className="icon-button" onClick={() => { updateConf(exam.link!, tempConfValue); setEditingConfId(null); }}><Icons.Plus size={14} color="var(--pine)"/></button>
                                       </span>
                                   );
                               }

                               return (
                                   <span style={{ display: 'flex', gap: '5px' }}>
                                       <span 
                                           onClick={(e) => { e.stopPropagation(); setTempConfValue(conf || 0); setEditingConfId(exam.id); }}
                                           style={{ color: color, fontSize: '0.7rem', border: `1px solid ${color}`, padding: '1px 4px', borderRadius: '3px', cursor: 'pointer' }}
                                           title="Edit Manual Confidence"
                                       >
                                           {conf !== null ? `${conf}% CONF` : '--% CONF'}
                                       </span>
                                       {autoConf !== null && (
                                           <span 
                                               style={{ color: autoColor, fontSize: '0.7rem', border: `1px solid ${autoColor}`, padding: '1px 4px', borderRadius: '3px' }}
                                               title="Auto Confidence from Flashcards"
                                           >
                                               AUTO: {autoConf}%
                                           </span>
                                       )}
                                   </span>
                               );
                           })()}
                        </span>
                        <div style={{ display: 'flex', gap: '5px', alignItems: 'center' }}>
                           <span style={{ fontSize: '0.8rem', marginRight: '10px', color: (daysLeft ?? 0) < 7 ? 'var(--love)' : 'var(--foam)' }}>{daysLeft !== null ? `T-Minus ${daysLeft} Days` : 'TBD'}</span>
                           <button className="icon-button copy" onClick={() => cloneExam(exam)} title="Copy Exam"><Icons.Copy size={16} /></button>
                           <button className="icon-button edit" onClick={() => startEditExam(exam)} title="Edit Exam"><Icons.Edit size={16} /></button>
                           <button className="icon-button delete" onClick={() => handleDeleteExam(exam.id)} title="Delete Exam"><Icons.Delete size={16} /></button>
                        </div>
                      </div>
                      <div style={{ color: (daysLeft ?? 0) < 7 ? 'var(--love)' : 'var(--pine)', fontWeight: 'bold' }}>
                        {renderProgressBar(daysLeft ?? 0)}
                      </div>
                      {exam.link && (
                        <div style={{ display: 'flex', gap: '10px', marginTop: '10px' }}>
                            <button className="link-button" onClick={() => navigateToLink(exam.link!)} style={{ fontSize: '0.85rem' }}>
                              &gt; JUMP TO FOLDER
                            </button>
                        </div>
                      )}
                    </div>
                 );
              })}
              </div>
            </div>
          </div>

          {/* RIGHT COLUMN: TASKS & SESSIONS */}
          <div style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
            
            {/* UP NEXT WIDGET (Formally Active Study Sessions) */}
            <div className="panel" style={{ border: '1px solid var(--pine)', position: 'relative', overflow: 'hidden' }}>
               <div style={{ position: 'absolute', top: 0, left: 0, width: '4px', height: '100%', background: 'var(--pine)', boxShadow: '0 0 10px var(--pine)' }}></div>
               <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '15px', paddingLeft: '10px' }}>
                  <h2 style={{ color: 'var(--pine)', fontSize: '1.2rem', margin: 0 }}>&gt; UP NEXT: STUDY SESSIONS</h2>
                  <div style={{ display: 'flex', gap: '5px' }}>
                     <button className="button" style={{ padding: '2px 8px', fontSize: '0.7rem', borderColor: 'var(--pine)', color: 'var(--pine)' }} onClick={() => { setActiveTab('FLASHCARDS'); if (ctx.setFlashcardTab) ctx.setFlashcardTab('LIBRARY'); }}>
                        Manage Decks
                     </button>
                  </div>
               </div>
               
               {activeSessions.length === 0 ? (
                  <div style={{ color: 'var(--subtle)', fontSize: '0.8rem', paddingLeft: '10px' }}>[ NO ACTIVE SESSIONS FOR THIS SEMESTER ]</div>
               ) : (
                  <div style={{ paddingLeft: '10px', display: 'flex', flexDirection: 'column', gap: '10px' }}>
                     {activeSessions.map((s: any) => (
                        <div key={s.id} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', background: 'var(--base)', border: '1px solid var(--pine)', padding: '10px', borderRadius: '4px' }}>
                           <span style={{ color: 'var(--text)' }}>{s.name} <span style={{ color: 'var(--subtle)', fontSize: '0.75rem' }}>({s.linkedLecture})</span></span>
                           <button 
                               className="button" 
                               style={{ padding: '5px 10px', fontSize: '0.8rem', borderColor: 'var(--gold)', color: 'var(--gold)' }}
                               onClick={() => {
                                  setActiveTab('FLASHCARDS');
                                  setFlashcardTab('SESSIONS');
                                  if (prepareCramQueue) prepareCramQueue(s, 'ALL');
                               }}
                           >
                               <Icons.Play size={14} /> STUDY NOW
                           </button>
                        </div>
                     ))}
                  </div>
               )}
            </div>

            <div style={{ background: 'var(--surface)', border: '1px solid var(--muted)', padding: '20px', borderRadius: '4px' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '15px' }}>
                 <h2 style={{ color: 'var(--iris)', margin: 0, fontSize: '1.2rem' }}>&gt; ACTION ITEMS</h2>
                 <div style={{ display: 'flex', gap: '10px' }}>
                    <button className="button" style={{ padding: '2px 8px', fontSize: '0.7rem', borderColor: 'var(--gold)', color: 'var(--gold)' }} onClick={() => { setActiveTab('PLANNER'); }}>
                        Event Manager
                    </button>
                    <button className="button" style={{ padding: '2px 8px', fontSize: '0.7rem', borderColor: 'var(--foam)', color: 'var(--foam)' }} onClick={() => setIsTodoModalOpen(true)}>
                        <Icons.Plus size={14} /> NEW TASK
                    </button>
                 </div>
              </div>

              {Object.entries(groupedTodos).map(([group, groupTodos]: [string, any]) => (
                <div key={group} style={{ marginBottom: '20px' }}>
                  <div style={{ color: 'var(--gold)', marginBottom: '10px', fontSize: '0.9rem', letterSpacing: '0.05em' }}>
                    [{group.toUpperCase()}]
                  </div>
                  {groupTodos.map((todo: any) => (
                    <div key={todo.id} style={{ display: 'flex', alignItems: 'center', gap: '10px', marginBottom: '8px', background: 'var(--base)', padding: '10px', border: '1px solid var(--muted)' }}>
                      <span 
                        style={{ color: todo.status ? 'var(--pine)' : 'var(--love)', cursor: 'pointer', fontWeight: 'bold' }}
                        onClick={() => {
                           const newData = { ...data, todos: data.todos.map((t: any) => t.id === todo.id ? { ...t, status: !t.status } : t) };
                           saveData(newData);
                        }}
                      >
                        [{todo.status ? 'X' : ' '}]
                      </span>
                      <span style={{ flex: 1, textDecoration: todo.status ? 'line-through' : 'none', color: todo.status ? 'var(--muted)' : 'var(--text)' }}>
                        {todo.title}
                      </span>
                      
                      {todo.link && (
                        <button className="link-button" style={{ marginLeft: 'auto', fontSize: '0.8rem' }} onClick={() => navigateToLink(todo.link)}>
                          Jump to Lecture
                        </button>
                      )}

                      {editingProgressId === todo.id ? (
                          <span style={{ display: 'flex', alignItems: 'center', gap: '5px', minWidth: '100px', marginLeft: !todo.link ? 'auto' : '10px' }}>
                             <input type="range" min="0" max="100" value={tempProgressValue} onChange={e => setTempProgressValue(parseInt(e.target.value))} style={{ width: '60px' }} />
                             <span style={{ fontSize: '0.7rem', color: 'var(--pine)' }}>{tempProgressValue}%</span>
                             <button className="icon-button" onClick={() => { 
                                 saveData({ ...data, todos: data.todos.map((t: any) => t.id === todo.id ? { ...t, progress: tempProgressValue } : t) });
                                 setEditingProgressId(null);
                             }}><Icons.Plus size={14} color="var(--pine)"/></button>
                          </span>
                      ) : (
                          <span 
                            style={{ color: 'var(--pine)', cursor: 'pointer', minWidth: '40px', fontSize: '0.8rem', textAlign: 'right', marginLeft: !todo.link ? 'auto' : '10px' }} 
                            onClick={() => { setTempProgressValue(todo.progress || 0); setEditingProgressId(todo.id); }}
                            title="Click to edit progress"
                          >
                            [{todo.progress || 0}%]
                          </span>
                      )}

                      <div style={{ display: 'flex', gap: '2px', marginLeft: '10px' }}>
                          <button className="icon-button copy" onClick={() => cloneTodo(todo)} title="Copy Task"><Icons.Copy size={16} /></button>
                          <button className="icon-button edit" onClick={() => startEditTodo(todo)} title="Edit Task"><Icons.Edit size={16} /></button>
                          <button className="icon-button delete" onClick={() => handleDeleteTodo(todo.id)} title="Delete Task"><Icons.Delete size={16} /></button>
                      </div>
                    </div>
                  ))}
                </div>
              ))}
            </div>
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
