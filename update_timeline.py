import re

with open('src/app/page.tsx', 'r') as f:
    content = f.read()

gantt_code = """  const renderTimeline = () => {
      if (!data.examPeriodStart || !data.examPeriodEnd) {
          return <div style={{ color: 'var(--subtle)', fontSize: '0.8rem', marginTop: '5px' }}>[ PLEASE SET EXAM PERIOD DATES TO VIEW TIMELINE / GANTT ]</div>;
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

      const currentExams = data.exams.filter(e => {
          const eSem = e.semester || (e.link ? e.link.split('/')[0] : selectedSemester);
          return eSem === selectedSemester;
      });

      const datelessExams = currentExams.filter(e => !e.date);
      const datedExams = currentExams.filter(e => e.date).sort((a,b) => new Date(a.date!).getTime() - new Date(b.date!).getTime());
      
      const rowHeight = 45;
      const headerHeight = 30;
      const totalHeight = Math.max(160, headerHeight + (datedExams.length * rowHeight) + 40);

      return (
          <div className="panel" style={{ position: 'relative', height: `${totalHeight}px`, overflowX: 'auto', overflowY: 'hidden', padding: 0 }}>
             <div style={{ minWidth: '1000px', height: '100%', position: 'relative', padding: '15px' }}>
              
              {/* Central Axis Line */}
              <div style={{ position: 'absolute', left: '15px', right: '15px', top: `${headerHeight}px`, height: '2px', background: 'rgba(110, 106, 134, 0.2)' }}></div>

              {/* Today Line */}
              {getPercent(today) >= 0 && getPercent(today) <= 100 && (
                  <div style={{ position: 'absolute', left: `calc(15px + ${getPercent(today)}% * 0.97)`, top: '15px', bottom: '15px', width: '2px', background: 'var(--foam)', zIndex: 0 }}>
                      <div style={{ position: 'absolute', top: '-15px', left: '-20px', color: 'var(--foam)', fontSize: '0.7rem', fontWeight: 'bold' }}>TODAY</div>
                  </div>
              )}

              {/* Gantt Rows for Exams */}
              {datedExams.map((e, i) => {
                  const d = new Date(e.date!);
                  d.setHours(0,0,0,0);
                  const p = getPercent(d);
                  
                  const rowTop = headerHeight + 20 + (i * rowHeight);
                  const conf = data.confidences?.[e.link || ''] ?? null;
                  const cColor = conf !== null ? getConfidenceColor(conf) : 'var(--muted)';
                  
                  // Preparation bar from Start of Period to Exam
                  const prepStart = getPercent(start); // 0%
                  const width = p;

                  return (
                      <div key={e.id} style={{ position: 'absolute', top: `${rowTop}px`, left: '15px', right: '15px', height: '30px' }}>
                          <div style={{ position: 'absolute', left: 0, width: `calc(${width}% * 0.97)`, height: '12px', top: '9px', background: 'rgba(235, 111, 146, 0.15)', borderRadius: '6px', border: '1px solid rgba(235, 111, 146, 0.3)' }}></div>
                          
                          {/* Node Point */}
                          <div style={{ position: 'absolute', left: `calc(${p}% * 0.97)`, top: '5px', width: '20px', height: '20px', background: 'var(--love)', borderRadius: '50%', transform: 'translateX(-50%)', zIndex: 2, boxShadow: '0 0 10px rgba(235, 111, 146, 0.4)' }}></div>
                          
                          {/* Label */}
                          <div style={{ position: 'absolute', left: `calc(${p}% * 0.97 + 15px)`, top: '5px', color: 'var(--text)', fontSize: '0.8rem', fontWeight: 600, whiteSpace: 'nowrap', zIndex: 3 }}>
                              <span className="link-hover" style={{ cursor: e.link ? 'pointer' : 'default' }} onClick={() => e.link && navigateToLink(e.link)}>
                                  {e.name}
                              </span>
                              <span style={{ color: 'var(--subtle)', marginLeft: '8px', fontSize: '0.7rem' }}>{d.toLocaleDateString()}</span>
                              {e.link && (
                                  <span onClick={async (ev) => { ev.stopPropagation(); const val = await asyncPrompt(`Set confidence for ${e.name} (0-100):`, conf !== null ? conf.toString() : '0'); if (val !== null) updateConf(e.link!, parseInt(val) || 0); }} style={{ color: cColor, marginLeft: '8px', cursor: 'pointer' }} title="Edit Confidence">
                                     [{conf !== null ? `${conf}%` : '--'}]
                                  </span>
                              )}
                          </div>
                      </div>
                  );
              })}

              {/* Dateless Exams Block */}
              {datelessExams.length > 0 && (
                  <div className="sub-panel" style={{ position: 'absolute', left: '15px', bottom: '15px', zIndex: 10, display: 'flex', flexDirection: 'column', gap: '4px', maxWidth: '300px', maxHeight: '100px', overflowY: 'auto' }}>
                      <div style={{ fontSize: '0.7rem', color: 'var(--gold)', fontWeight: 'bold' }}>UNSCHEDULED EXAMS:</div>
                      {datelessExams.map(e => {
                          const conf = data.confidences?.[e.link || ''] ?? null;
                          return (
                              <div key={`dateless-${e.id}`} style={{ display: 'flex', alignItems: 'center', gap: '6px', fontSize: '0.75rem', color: 'var(--text)' }}>
                                  <span style={{ cursor: 'pointer' }} onClick={() => e.link && navigateToLink(e.link)} className={e.link ? 'link-hover' : ''}>
                                     {e.name}
                                  </span>
                              </div>
                          );
                      })}
                  </div>
              )}
             </div>
          </div>
      );
  };"""

pattern = re.compile(r"  const renderTimeline = \(\) => \{.*?(?=  const pathParts = currentPath\.split)", re.DOTALL)
new_content = pattern.sub(gantt_code + "\n\n", content)

with open('src/app/page.tsx', 'w') as f:
    f.write(new_content)
