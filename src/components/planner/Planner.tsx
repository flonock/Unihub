import React from 'react';

export default function Planner({ ctx }: { ctx: any }) {
  const { 
    currentMonth, setCurrentMonth, data, newEventTitle, setNewEventTitle, 
    newEventType, setNewEventType, newEventStart, setNewEventStart, 
    newEventEnd, setNewEventEnd, handleAddOrUpdateEvent, editingEventId, 
    cancelEditEvent, cloneEvent, startEditEvent, handleDeleteEvent 
  } = ctx;

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
          
          const dayExams = data.exams?.filter((e: any) => e.date === dateStr) || [];
          const dayEvents = data.events?.filter((e: any) => {
              return dateStr >= e.startDate && dateStr <= e.endDate;
          }) || [];

          days.push(
              <div key={dateStr} className="hover-glow" style={{ border: `1px solid ${isToday ? 'var(--foam)' : 'var(--muted)'}`, minHeight: '90px', padding: '5px', background: 'var(--base)', display: 'flex', flexDirection: 'column' }}>
                  <div style={{ textAlign: 'right', fontSize: '0.8rem', color: isToday ? 'var(--foam)' : 'var(--subtle)' }}>{d}</div>
                  <div style={{ display: 'flex', flexDirection: 'column', gap: '3px', marginTop: '5px', flex: 1, overflowY: 'auto' }}>
                      {dayExams.map((exam: any) => (
                          <div key={`cal-ex-${exam.id}`} style={{ background: 'var(--love)', color: 'var(--base)', fontSize: '0.7rem', padding: '2px 4px', borderRadius: '3px', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }} title={exam.name}>
                              {exam.name}
                          </div>
                      ))}
                      {dayEvents.map((ev: any) => (
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

  return (
    <div className="planner">
       <div style={{ display: 'grid', gridTemplateColumns: '2.5fr 1fr', gap: '30px' }}>
          <div>
             <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '20px', background: 'var(--surface)', border: '1px solid var(--muted)', padding: '10px 20px', borderRadius: '4px' }}>
                <button className="button" style={{ borderColor: 'var(--subtle)', color: 'var(--text)' }} onClick={() => setCurrentMonth(new Date(currentMonth.getFullYear(), currentMonth.getMonth() - 1, 1))}>&lt; Prev</button>
                <h2 style={{ color: 'var(--iris)', margin: 0 }}>
                    {currentMonth.toLocaleString('default', { month: 'long', year: 'numeric' })}
                </h2>
                <button className="button" style={{ borderColor: 'var(--subtle)', color: 'var(--text)' }} onClick={() => setCurrentMonth(new Date(currentMonth.getFullYear(), currentMonth.getMonth() + 1, 1))}>Next &gt;</button>
             </div>
             
             {renderCalendar()}

             {/* Add/Edit Event Form */}
             <div style={{ display: 'flex', flexDirection: 'column', gap: '10px', marginTop: '20px', background: 'var(--surface)', padding: '15px', border: `1px ${editingEventId ? 'solid var(--foam)' : 'solid var(--muted)'}`, borderRadius: '4px' }}>
                <input placeholder="Event Title" value={newEventTitle} onChange={e => setNewEventTitle(e.target.value)} style={{ flex: 2, background: 'var(--base)', color: 'var(--text)', border: 'none', borderBottom: '1px solid var(--muted)', padding: '5px', outline: 'none', fontFamily: 'inherit' }} />
                <select value={newEventType} onChange={e => setNewEventType(e.target.value as any)} style={{ flex: 1, background: 'var(--base)', color: 'var(--text)', border: 'none', borderBottom: '1px solid var(--muted)', padding: '5px', outline: 'none', fontFamily: 'inherit', cursor: 'pointer' }}>
                    <option value="study">Study Block</option>
                    <option value="task">Deadline</option>
                </select>
                <div style={{ display: 'flex', gap: '10px', alignItems: 'center' }}>
                  <input type="date" value={newEventStart} onChange={e => setNewEventStart(e.target.value)} style={{ flex: 1, background: 'var(--base)', color: 'var(--text)', border: 'none', borderBottom: '1px solid var(--muted)', padding: '5px', outline: 'none', fontFamily: 'inherit' }} />
                  <span style={{ color: 'var(--muted)' }}>to</span>
                  <input type="date" value={newEventEnd} onChange={e => setNewEventEnd(e.target.value)} style={{ flex: 1, background: 'var(--base)', color: 'var(--text)', border: 'none', borderBottom: '1px solid var(--muted)', padding: '5px', outline: 'none', fontFamily: 'inherit' }} />
                </div>
                
                <div style={{ display: 'flex', gap: '10px' }}>
                  <button className="button" onClick={handleAddOrUpdateEvent} style={{ flex: 1, padding: '5px 15px' }}>
                     {editingEventId ? 'Update' : 'Add'}
                  </button>
                  {editingEventId && (
                     <button className="button" onClick={cancelEditEvent} style={{ flex: 1, color: 'var(--love)', borderColor: 'var(--love)' }}>Cancel</button>
                  )}
                </div>
             </div>
          </div>
          
          <div style={{ display: 'flex', flexDirection: 'column' }}>
             <h2 style={{ color: 'var(--gold)', marginBottom: '20px', fontSize: '1.2rem', marginTop: 0 }}>&gt; EVENT MANAGER</h2>
             <div style={{ background: 'var(--surface)', border: '1px solid var(--muted)', padding: '15px', flex: 1, overflowY: 'auto', borderRadius: '4px' }}>
                {(data.events || []).length === 0 ? (
                    <div style={{ color: 'var(--subtle)' }}>No events scheduled.</div>
                ) : (
                    (data.events || []).sort((a: any,b: any) => a.startDate.localeCompare(b.startDate)).map((ev: any) => (
                        <div key={`mgr-${ev.id}`} className="hover-glow" style={{ marginBottom: '15px', border: '1px solid var(--muted)', padding: '10px', background: 'var(--base)', borderLeft: '4px solid ' + (ev.type === 'study' ? 'var(--pine)' : 'var(--gold)') }}>
                           <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '5px' }}>
                              <span style={{ color: ev.type === 'study' ? 'var(--pine)' : 'var(--gold)', fontWeight: 'bold' }}>{ev.title}</span>
                              <div style={{ display: 'flex', gap: '10px' }}>
                                 <span style={{ color: 'var(--gold)', cursor: 'pointer', fontSize: '0.8rem' }} onClick={() => cloneEvent(ev)} title="Copy">[COPY]</span>
                                 <span style={{ color: 'var(--foam)', cursor: 'pointer', fontSize: '0.8rem' }} onClick={() => startEditEvent(ev)} title="Edit">[EDIT]</span>
                                 <span style={{ color: 'var(--love)', cursor: 'pointer', fontSize: '0.8rem' }} onClick={() => handleDeleteEvent(ev.id)} title="Delete">[DEL]</span>
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
  );
}
