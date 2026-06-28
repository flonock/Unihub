import React from 'react';
import { Icons } from '../shared/Icons';

export default function Sidebar({ ctx }: { ctx: any }) {
  const { 
    appConfig, openSettings, activeTab, setActiveTab, selectedSemester, 
    setSelectedSemester, setCurrentPath, semesters, handleAddSemester, 
    lectures, currentPath, data, asyncPrompt, updateConf, getConfidenceColor
  } = ctx;

  return (
    <div className="sidebar" style={{ width: '300px' }}>
      <div className="sidebar-title" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
         <span>{appConfig.workspaceTitle}</span>
         <span style={{ cursor: 'pointer', fontSize: '1.2rem', color: 'var(--subtle)', transition: 'color 0.2s' }} onMouseEnter={e => e.currentTarget.style.color='var(--text)'} onMouseLeave={e => e.currentTarget.style.color='var(--subtle)'} onClick={openSettings} title="Settings">⚙</span>
      </div>
      
      {/* QUICK ACTIONS */}
      <div style={{ display: 'flex', flexDirection: 'column', gap: '8px', marginBottom: '20px' }}>
         <button className="button" style={{ borderColor: activeTab === 'MISSION_CONTROL' ? 'var(--iris)' : 'var(--muted)', color: activeTab === 'MISSION_CONTROL' ? 'var(--iris)' : 'var(--text)', justifyContent: 'flex-start' }} onClick={() => { setActiveTab('MISSION_CONTROL'); setCurrentPath(''); }}>
             <Icons.Plus size={14} /> Dashboard
         </button>
         <button className="button" style={{ borderColor: activeTab === 'FLASHCARDS' ? 'var(--pine)' : 'var(--muted)', color: activeTab === 'FLASHCARDS' ? 'var(--pine)' : 'var(--text)', justifyContent: 'flex-start' }} onClick={() => { setActiveTab('FLASHCARDS'); if (ctx.setFlashcardTab) ctx.setFlashcardTab('LIBRARY'); }}>
             <Icons.Plus size={14} /> FLASHCARD DB
         </button>
         <button className="button" style={{ borderColor: activeTab === 'WIDGETS' ? 'var(--foam)' : 'var(--muted)', color: activeTab === 'WIDGETS' ? 'var(--foam)' : 'var(--text)', justifyContent: 'flex-start' }} onClick={() => setActiveTab('WIDGETS')}>
             <Icons.Plus size={14} /> UTILITIES
         </button>
         <button className="button" style={{ borderColor: activeTab === 'PLANNER' ? 'var(--gold)' : 'var(--muted)', color: activeTab === 'PLANNER' ? 'var(--gold)' : 'var(--text)', justifyContent: 'flex-start' }} onClick={() => setActiveTab('PLANNER')}>
             <Icons.Plus size={14} /> PLANNER
         </button>
         <button className="button" style={{ borderColor: activeTab === 'CARDS_OVERVIEW' ? 'var(--love)' : 'var(--muted)', color: activeTab === 'CARDS_OVERVIEW' ? 'var(--love)' : 'var(--text)', justifyContent: 'flex-start' }} onClick={() => setActiveTab('CARDS_OVERVIEW')}>
             <Icons.Plus size={14} /> CARDS OVERVIEW
         </button>
      </div>

      {/* SEMESTER SELECTOR */}
      <div className="panel" style={{ padding: '10px', marginBottom: '15px' }}>
        <div style={{ color: 'var(--subtle)', marginBottom: '8px', fontSize: '0.8rem' }}>[ SELECT_SEMESTER ]</div>
        <select 
          value={selectedSemester} 
          onChange={e => {
            setSelectedSemester(e.target.value);
            setCurrentPath(e.target.value);
            setActiveTab('MISSION_CONTROL');
          }}
          className="unified-input"
          style={{ width: '100%', marginBottom: '8px', cursor: 'pointer' }}
        >
          {semesters.map((s: string) => <option key={s} value={s}>{s}</option>)}
        </select>
        <button onClick={handleAddSemester} className="button" style={{ width: '100%', fontSize: '0.8rem', borderColor: 'var(--foam)', color: 'var(--foam)' }}>+ ADD SEMESTER</button>
      </div>

      {/* LECTURES LIST */}
      <div style={{ display: 'flex', flexDirection: 'column', flex: 1, overflowY: 'auto' }}>
        <div style={{ color: 'var(--subtle)', fontSize: '0.8rem', marginBottom: '10px' }}>--- LECTURE NODES ---</div>
        
        <div style={{ paddingLeft: '5px', display: 'flex', flexDirection: 'column', gap: '5px' }}>
          {lectures.map((lec: string) => {
            const path = `${selectedSemester}/${lec}`;
            const isActive = currentPath === path || currentPath.startsWith(path + '/');
            const conf = data.confidences?.[path] ?? null;
            
            // Confidence Indicator Dot
            const dotColor = conf !== null ? getConfidenceColor(conf) : 'var(--muted)';
            
            return (
              <div 
                key={lec} 
                className={`lecture-item ${isActive ? 'active' : ''}`}
                onClick={() => {
                  setCurrentPath(path);
                  setActiveTab('BROWSER');
                }}
                style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '6px 4px', borderRadius: '4px', background: isActive ? 'var(--overlay)' : 'transparent' }}
              >
                <div style={{ display: 'flex', alignItems: 'center', gap: '8px', overflow: 'hidden' }}>
                  <div style={{ width: '8px', height: '8px', borderRadius: '50%', backgroundColor: dotColor, boxShadow: `0 0 5px ${dotColor}` }}></div>
                  <span style={{ whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis', fontSize: '0.9rem', color: isActive ? 'var(--text)' : 'var(--subtle)' }}>
                    {lec}
                  </span>
                </div>
                <div style={{ display: 'flex', gap: '5px', alignItems: 'center' }}>
                  <span 
                     onClick={async (e) => { 
                         e.stopPropagation(); 
                         const val = await asyncPrompt(`Set confidence for ${lec} (0-100):`, conf !== null ? conf.toString() : '0');
                         if (val !== null) updateConf(path, parseInt(val) || 0);
                     }}
                     style={{ color: conf !== null ? getConfidenceColor(conf) : 'var(--muted)', fontSize: '0.75rem', cursor: 'pointer', fontFamily: 'monospace' }}
                     title="Edit Confidence"
                  >
                     {conf !== null ? `${conf}%` : '--'}
                  </span>
                </div>
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
}
