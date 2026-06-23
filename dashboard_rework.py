import re

with open('src/components/dashboard/Dashboard.tsx', 'r') as f:
    dashboard = f.read()

# 1. Add Metric Cards logic
metrics_logic = """
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
"""

dashboard = dashboard.replace("const [tempProgressValue, setTempProgressValue] = useState<number>(0);", "const [tempProgressValue, setTempProgressValue] = useState<number>(0);\n" + metrics_logic)

# 2. Render Metric Cards
metric_cards_jsx = """
       {/* AT-A-GLANCE METRICS */}
       <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: '20px' }}>
          <div className="metric-card" style={{ background: 'var(--surface)', border: '1px solid var(--muted)', padding: '20px', borderRadius: '8px', display: 'flex', flexDirection: 'column', gap: '10px', boxShadow: '0 4px 6px rgba(0,0,0,0.1)' }}>
             <span style={{ color: 'var(--subtle)', fontSize: '0.85rem', fontWeight: 'bold', letterSpacing: '1px' }}>AVG CONFIDENCE</span>
             <span style={{ color: getConfidenceColor(avgConfidence), fontSize: '2rem', fontWeight: 'bold' }}>{avgConfidence}%</span>
          </div>
          <div className="metric-card" style={{ background: 'var(--surface)', border: '1px solid var(--muted)', padding: '20px', borderRadius: '8px', display: 'flex', flexDirection: 'column', gap: '10px', boxShadow: '0 4px 6px rgba(0,0,0,0.1)' }}>
             <span style={{ color: 'var(--subtle)', fontSize: '0.85rem', fontWeight: 'bold', letterSpacing: '1px' }}>CRITICAL EXAMS</span>
             <span style={{ color: criticalExamsCount > 0 ? 'var(--love)' : 'var(--pine)', fontSize: '2rem', fontWeight: 'bold' }}>{criticalExamsCount}</span>
          </div>
          <div className="metric-card" style={{ background: 'var(--surface)', border: '1px solid var(--muted)', padding: '20px', borderRadius: '8px', display: 'flex', flexDirection: 'column', gap: '10px', boxShadow: '0 4px 6px rgba(0,0,0,0.1)' }}>
             <span style={{ color: 'var(--subtle)', fontSize: '0.85rem', fontWeight: 'bold', letterSpacing: '1px' }}>ACTIVE TASKS</span>
             <span style={{ color: activeTasksCount > 0 ? 'var(--gold)' : 'var(--muted)', fontSize: '2rem', fontWeight: 'bold' }}>{activeTasksCount}</span>
          </div>
          <div className="metric-card" style={{ background: 'var(--surface)', border: '1px solid var(--muted)', padding: '20px', borderRadius: '8px', display: 'flex', flexDirection: 'column', gap: '10px', boxShadow: '0 4px 6px rgba(0,0,0,0.1)' }}>
             <span style={{ color: 'var(--subtle)', fontSize: '0.85rem', fontWeight: 'bold', letterSpacing: '1px' }}>STUDY SESSIONS</span>
             <span style={{ color: studySessionsCount > 0 ? 'var(--pine)' : 'var(--muted)', fontSize: '2rem', fontWeight: 'bold' }}>{studySessionsCount}</span>
          </div>
       </div>
"""

dashboard = dashboard.replace("{/* TIMELINE MODULE */}", metric_cards_jsx + "\n       {/* TIMELINE MODULE */}")

# 3. Update Grid to 1.5fr 1fr
dashboard = dashboard.replace("<div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '30px' }}>", "<div style={{ display: 'grid', gridTemplateColumns: '1.5fr 1fr', gap: '30px' }}>")

# 4. Redesign "Priority Overview" cards
dashboard = dashboard.replace('className="sub-panel" style={{ position: \'relative\' }}', 'className="sub-panel hover-glow" style={{ position: \'relative\', borderLeft: \'4px solid var(--gold)\' }}')

# 5. Add "Semester Roster" to the right column
semester_roster_jsx = """
            {/* SEMESTER ROSTER */}
            <div className="panel" style={{ border: '1px solid var(--iris)', position: 'relative', overflow: 'hidden' }}>
               <div style={{ position: 'absolute', top: 0, left: 0, width: '4px', height: '100%', background: 'var(--iris)', boxShadow: '0 0 10px var(--iris)' }}></div>
               <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '15px', paddingLeft: '10px' }}>
                  <h2 style={{ color: 'var(--iris)', fontSize: '1.2rem', margin: 0 }}>&gt; SEMESTER ROSTER</h2>
               </div>
               
               <div style={{ paddingLeft: '10px', display: 'flex', flexDirection: 'column', gap: '8px', maxHeight: '300px', overflowY: 'auto' }}>
                  {lectures.length === 0 ? (
                      <div style={{ color: 'var(--subtle)', fontSize: '0.8rem' }}>[ NO LECTURES FOUND ]</div>
                  ) : (
                      lectures.map((lec: string) => {
                          const link = `${selectedSemester}/${lec}`;
                          const manualConf = data.confidences?.[link];
                          const conf = manualConf !== undefined ? manualConf : getCalculatedConfidence(link);
                          const finalConf = conf !== null ? conf : '--';
                          
                          return (
                              <div key={lec} className="hover-glow" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', background: 'var(--base)', border: '1px solid var(--muted)', padding: '10px', borderRadius: '4px', cursor: 'pointer' }} onClick={() => navigateToLink(link)}>
                                 <span style={{ color: 'var(--text)', fontWeight: 'bold' }}>{lec}</span>
                                 <span style={{ color: getConfidenceColor(conf || 0), fontSize: '0.85rem', padding: '2px 6px', border: `1px solid ${getConfidenceColor(conf || 0)}`, borderRadius: '3px' }}>
                                     {finalConf}% CONF
                                 </span>
                              </div>
                          );
                      })
                  )}
               </div>
            </div>
"""

dashboard = dashboard.replace("{/* RIGHT COLUMN: TASKS & SESSIONS */}\n          <div style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>", "{/* RIGHT COLUMN: TASKS & SESSIONS */}\n          <div style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>\n" + semester_roster_jsx)

with open('src/components/dashboard/Dashboard.tsx', 'w') as f:
    f.write(dashboard)

print("Dashboard rework complete!")
