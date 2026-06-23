const fs = require('fs');

const path = './src/app/page.tsx';
let content = fs.readFileSync(path, 'utf8');

// 1. Extract block
const startMatch = "{['MISSION_CONTROL', 'DASHBOARD'].includes(activeTab) && (";
const endMatch = "        {activeTab === 'LECTURE_NEXUS' && (";

const startIndex = content.indexOf(startMatch);
const endIndex = content.indexOf(endMatch);

if (startIndex === -1 || endIndex === -1) {
  console.log("Could not find blocks");
  process.exit(1);
}

const missionControlBlock = content.substring(startIndex + startMatch.length, endIndex).trim().replace(/\}$/, '');
// missionControlBlock starts with `<div className="mission-control">`

const dashboardCode = `import React from 'react';

export default function Dashboard({ ctx }: { ctx: any }) {
  const {
    data, selectedSemester, renderAlerts, renderTimeline, newExamName, setNewExamName, 
    newExamDate, setNewExamDate, newExamLink, setNewExamLink, lectures, handleAddOrUpdateExam, 
    editingExamId, cancelEditExam, getCalculatedConfidence, getConfidenceColor, asyncPrompt, 
    updateConf, setActiveTab, setFlashcardTab, cloneExam, startEditExam, handleDeleteExam, 
    renderProgressBar, navigateToLink, prepareCramQueue, newTodoTitle, setNewTodoTitle, 
    newTodoProgress, setNewTodoProgress, newTodoDueDate, setNewTodoDueDate, newTodoLink, 
    setNewTodoLink, handleAddOrUpdateTodo, editingTodoId, cancelEditTodo, groupedTodos, 
    cloneTodo, startEditTodo, handleDeleteTodo, saveData
  } = ctx;

  const activeSessions = (data.studySessions || []).filter((s: any) => s.linkedSemester === selectedSemester);

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
            
            <div style={{ background: 'var(--surface)', border: '1px solid var(--muted)', padding: '20px', borderRadius: '4px' }}>
              <h2 style={{ color: 'var(--iris)', marginBottom: '15px', marginTop: 0, fontSize: '1.2rem' }}>&gt; LECTURES & EXAMS</h2>

              {/* Add/Edit Exam Form */}
              <div style={{ marginBottom: '15px', display: 'flex', gap: '10px', background: 'var(--base)', padding: '10px', border: \`1px \${editingExamId ? 'solid var(--foam)' : 'dashed var(--muted)'}\` }}>
                <input placeholder="Exam/Lecture Name" value={newExamName} onChange={e => setNewExamName(e.target.value)} style={{ flex: 2, background: 'transparent', border: 'none', borderBottom: '1px solid var(--muted)', color: 'var(--text)', padding: '5px', fontFamily: 'inherit', outline: 'none' }} />
                <input type="date" value={newExamDate} onChange={e => setNewExamDate(e.target.value)} style={{ flex: 1, background: 'transparent', border: 'none', borderBottom: '1px solid var(--muted)', color: 'var(--text)', padding: '5px', fontFamily: 'inherit', outline: 'none' }} />
                
                <input list="exam-paths" placeholder="Path" value={newExamLink} onChange={e => setNewExamLink(e.target.value)} style={{ flex: 2, background: 'transparent', border: 'none', borderBottom: '1px solid var(--muted)', color: 'var(--text)', padding: '5px', fontFamily: 'inherit', outline: 'none' }} />
                <datalist id="exam-paths">
                  {lectures.map((lec: string) => (
                    <option key={lec} value={\`\${selectedSemester}/\${lec}\`} />
                  ))}
                </datalist>

                <button className="button" onClick={handleAddOrUpdateExam} style={{ padding: '5px 10px' }}>
                   {editingExamId ? 'Update' : 'Add'}
                </button>
                {editingExamId && (
                   <button className="button" onClick={cancelEditExam} style={{ padding: '5px 10px', color: 'var(--love)', borderColor: 'var(--love)' }}>Cancel</button>
                )}
              </div>

              <div style={{ maxHeight: '500px', overflowY: 'auto', display: 'flex', flexDirection: 'column', gap: '10px' }}>
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
                 const autoConf = exam.link ? getCalculatedConfidence(exam.link) : null;
                 const examParts = exam.link ? exam.link.split('/') : [];
                 const activeExamSessions = (data.studySessions || []).filter((s: any) => examParts.length >= 2 && s.linkedSemester === examParts[0] && s.linkedLecture === examParts[1]);

                 return (
                    <div key={exam.id} style={{ border: '1px solid var(--muted)', padding: '15px', background: 'var(--base)', position: 'relative' }}>
                      <div style={{ display: 'flex', justifyContent: 'space-between', color: 'var(--gold)', marginBottom: '5px' }}>
                        <span style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                           {exam.name}
                           {exam.link && (() => {
                               const conf = data.confidences?.[exam.link] ?? null;
                               const color = conf !== null ? getConfidenceColor(conf) : 'var(--muted)';
                               const autoColor = autoConf !== null ? getConfidenceColor(autoConf) : 'var(--muted)';
                               return (
                                   <span style={{ display: 'flex', gap: '5px' }}>
                                       <span 
                                           onClick={async (e) => { e.stopPropagation(); const val = await asyncPrompt(\`Set confidence for \${exam.name} (0-100):\`, conf !== null ? conf.toString() : '0');
                                               if (val !== null) updateConf(exam.link!, parseInt(val) || 0);
                                           }}
                                           style={{ color: color, fontSize: '0.7rem', border: \`1px solid \${color}\`, padding: '1px 4px', borderRadius: '3px', cursor: 'pointer' }}
                                           title="Edit Manual Confidence"
                                       >
                                           {conf !== null ? \`\${conf}% CONF\` : '--% CONF'}
                                       </span>
                                       {autoConf !== null && (
                                           <span 
                                               style={{ color: autoColor, fontSize: '0.7rem', border: \`1px solid \${autoColor}\`, padding: '1px 4px', borderRadius: '3px' }}
                                               title="Auto Confidence from Flashcards"
                                           >
                                               AUTO: {autoConf}%
                                           </span>
                                       )}
                                   </span>
                               );
                           })()}
                        </span>
                        <div style={{ display: 'flex', gap: '10px', fontSize: '0.8rem' }}>
                           <span>{daysLeft !== null ? \`T-Minus \${daysLeft} Days\` : 'TBD'}</span>
                          <span style={{ color: 'var(--gold)', cursor: 'pointer' }} onClick={() => cloneExam(exam)} title="Copy Exam">[COPY]</span>
                          <span style={{ color: 'var(--foam)', cursor: 'pointer' }} onClick={() => startEditExam(exam)} title="Edit Exam">[EDIT]</span>
                          <span style={{ color: 'var(--love)', cursor: 'pointer' }} onClick={() => handleDeleteExam(exam.id)} title="Delete Exam">[X]</span>
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
                            {activeExamSessions.length > 0 && (
                               <button className="link-button" onClick={() => { 
                                   setActiveTab('FLASHCARDS'); 
                                   setFlashcardTab('SESSIONS'); 
                                   prepareCramQueue(activeExamSessions[0], 'ALL'); 
                               }} style={{ fontSize: '0.85rem', borderColor: 'var(--gold)', color: 'var(--gold)' }}>
                                 &gt; QUICK STUDY
                               </button>
                            )}
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
            
            {/* ACTIVE STUDY SESSIONS WIDGET */}
            <div style={{ background: 'var(--surface)', border: '1px solid var(--pine)', padding: '20px', borderRadius: '4px', position: 'relative', overflow: 'hidden' }}>
               <div style={{ position: 'absolute', top: 0, left: 0, width: '4px', height: '100%', background: 'var(--pine)', boxShadow: '0 0 10px var(--pine)' }}></div>
               <h2 style={{ color: 'var(--pine)', fontSize: '1.2rem', margin: 0, marginBottom: '15px', paddingLeft: '10px' }}>&gt; ACTIVE STUDY SESSIONS</h2>
               
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
                              STUDY NOW
                           </button>
                        </div>
                     ))}
                  </div>
               )}
            </div>

            <div style={{ background: 'var(--surface)', border: '1px solid var(--muted)', padding: '20px', borderRadius: '4px' }}>
              <h2 style={{ color: 'var(--iris)', marginBottom: '15px', marginTop: 0, fontSize: '1.2rem' }}>&gt; ACTION ITEMS</h2>

              {/* Add/Edit Action Item Form */}
              <div style={{ marginBottom: '20px', display: 'flex', gap: '10px', background: 'var(--base)', padding: '10px', border: \`1px \${editingTodoId ? 'solid var(--foam)' : 'dashed var(--muted)'}\` }}>
                <input placeholder="Task Title" value={newTodoTitle} onChange={e => setNewTodoTitle(e.target.value)} style={{ flex: 3, background: 'transparent', border: 'none', borderBottom: '1px solid var(--muted)', color: 'var(--text)', padding: '5px', fontFamily: 'inherit', outline: 'none' }} />
                <input type="number" min="0" max="100" placeholder="0%" value={newTodoProgress} onChange={e => setNewTodoProgress(parseInt(e.target.value)||0)} style={{ width: '60px', background: 'transparent', border: 'none', borderBottom: '1px solid var(--muted)', color: 'var(--text)', padding: '5px', fontFamily: 'inherit', outline: 'none' }} title="Progress %" />
                <input type="date" value={newTodoDueDate} onChange={e => setNewTodoDueDate(e.target.value)} style={{ width: '130px', background: 'transparent', border: 'none', borderBottom: '1px solid var(--muted)', color: 'var(--text)', padding: '5px', fontFamily: 'inherit', outline: 'none' }} title="Due Date" />
                
                <input list="todo-paths" placeholder="Path (optional)" value={newTodoLink} onChange={e => setNewTodoLink(e.target.value)} style={{ flex: 2, background: 'transparent', border: 'none', borderBottom: '1px solid var(--muted)', color: 'var(--text)', padding: '5px', fontFamily: 'inherit', outline: 'none' }} />
                <datalist id="todo-paths">
                  {lectures.map((lec: string) => (
                    <option key={lec} value={\`\${selectedSemester}/\${lec}\`} />
                  ))}
                </datalist>

                <button className="button" onClick={handleAddOrUpdateTodo} style={{ padding: '5px 10px' }}>
                    {editingTodoId ? 'Update' : 'Add'}
                </button>
                {editingTodoId && (
                   <button className="button" onClick={cancelEditTodo} style={{ padding: '5px 10px', color: 'var(--love)', borderColor: 'var(--love)' }}>Cancel</button>
                )}
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
                          [JUMP TO LECTURE]
                        </button>
                      )}

                      <span 
                        style={{ color: 'var(--pine)', cursor: 'pointer', minWidth: '40px', fontSize: '0.8rem', textAlign: 'right', marginLeft: !todo.link ? 'auto' : '10px' }} 
                        onClick={async () => {
                            const val = await asyncPrompt('Enter progress (0-100):', (todo.progress || 0).toString());
                            if (val !== null) {
                               const p = Math.max(0, Math.min(100, parseInt(val)||0));
                               saveData({ ...data, todos: data.todos.map((t: any) => t.id === todo.id ? { ...t, progress: p } : t) });
                            }
                        }}
                        title="Click to edit progress"
                      >
                        [{todo.progress || 0}%]
                      </span>

                      <span style={{ color: 'var(--gold)', cursor: 'pointer', marginLeft: '10px', fontSize: '0.8rem' }} onClick={() => cloneTodo(todo)} title="Copy Task">[COPY]</span>
                      <span style={{ color: 'var(--foam)', cursor: 'pointer', marginLeft: '10px', fontSize: '0.8rem' }} onClick={() => startEditTodo(todo)} title="Edit Task">[EDIT]</span>
                      <span style={{ color: 'var(--love)', cursor: 'pointer', marginLeft: '10px', fontSize: '0.8rem' }} onClick={() => handleDeleteTodo(todo.id)} title="Delete Task">[DEL]</span>
                    </div>
                  ))}
                </div>
              ))}
            </div>
          </div>
       </div>
    </div>
  );
}
`;

fs.writeFileSync('./src/components/dashboard/Dashboard.tsx', dashboardCode, 'utf8');

// Now we update page.tsx to add Dashboard to imports, add variables to ctx, and replace the block
if (!content.includes("import Dashboard from '@/components/dashboard/Dashboard';")) {
  content = content.replace("import LectureNexus from '@/components/lecture/LectureNexus';", "import LectureNexus from '@/components/lecture/LectureNexus';\nimport Dashboard from '@/components/dashboard/Dashboard';");
}

const oldCtxEnd = "renderProgressBar, handleDeleteFolder, handleCreateFolder, handleNewNote, prepareCramQueue, handleOpen, navigateToLink, files, setFlashcardTab, getCalculatedConfidence\n  };";
const newCtxEnd = "renderProgressBar, handleDeleteFolder, handleCreateFolder, handleNewNote, prepareCramQueue, handleOpen, navigateToLink, files, setFlashcardTab, getCalculatedConfidence,\n    renderAlerts, renderTimeline, newExamName, setNewExamName, newExamDate, setNewExamDate, newExamLink, setNewExamLink, handleAddOrUpdateExam, editingExamId, cancelEditExam, cloneExam, startEditExam, handleDeleteExam, newTodoTitle, setNewTodoTitle, newTodoProgress, setNewTodoProgress, newTodoDueDate, setNewTodoDueDate, newTodoLink, setNewTodoLink, handleAddOrUpdateTodo, editingTodoId, cancelEditTodo, groupedTodos, cloneTodo, startEditTodo, handleDeleteTodo, saveData\n  };";

if (content.includes(oldCtxEnd)) {
    content = content.replace(oldCtxEnd, newCtxEnd);
}

const targetReplacement = "{['MISSION_CONTROL', 'DASHBOARD'].includes(activeTab) && (\n          <Dashboard ctx={ctx} />\n        )}";

content = content.substring(0, startIndex) + targetReplacement + "\n\n" + content.substring(endIndex);

fs.writeFileSync(path, content, 'utf8');

console.log("Dashboard extracted successfully!");
