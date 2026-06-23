import re

with open('src/app/page.tsx', 'r') as f:
    content = f.read()

pattern = re.compile(r'(return \(\n\s*<div className={`app-container).*?(\{showCommandPalette && \()', re.DOTALL)

replacement = r'''return (
    <div className={`app-container ${!appConfig.enableFlicker ? 'no-flicker' : ''}`}>
      <Sidebar ctx={ctx} />
      
      <div className="main-content" style={{ flex: 1, padding: '40px', overflowY: 'auto' }}>
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
        {activeTab === 'PLANNER' && <Planner ctx={ctx} />}
      </div>

      {rightPanelMode !== 'HIDDEN' && (
        <div className="right-panel" style={{ width: '400px', background: 'var(--surface)', borderLeft: '2px dashed var(--muted)', display: 'flex', flexDirection: 'column' }}>
          <div style={{ display: 'flex', padding: '15px', gap: '10px', borderBottom: '1px solid var(--muted)' }}>
            <button className="button" style={{ flex: 1, borderColor: rightPanelMode === 'PLANNER' ? 'var(--gold)' : 'var(--muted)', color: rightPanelMode === 'PLANNER' ? 'var(--gold)' : 'var(--text)' }} onClick={() => setRightPanelMode('PLANNER')}>PLANNER</button>
            <button className="button" style={{ flex: 1, borderColor: rightPanelMode === 'WIDGETS' ? 'var(--foam)' : 'var(--muted)', color: rightPanelMode === 'WIDGETS' ? 'var(--foam)' : 'var(--text)' }} onClick={() => setRightPanelMode('WIDGETS')}>WIDGETS</button>
          </div>
          <div style={{ flex: 1, overflowY: 'auto', padding: '15px' }}>
            {rightPanelMode === 'PLANNER' && <Planner ctx={ctx} />}
            {rightPanelMode === 'WIDGETS' && <WidgetPanel appConfig={appConfig} />}
          </div>
        </div>
      )}

      \2'''

new_content = pattern.sub(replacement, content)

with open('src/app/page.tsx', 'w') as f:
    f.write(new_content)
print("Replaced!")
