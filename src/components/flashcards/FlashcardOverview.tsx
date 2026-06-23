'use client';

import React from 'react';
import { Icons } from '../shared/Icons';

export default function FlashcardOverview({ ctx }: { ctx: any }) {
  const { data, selectedSemester, setActiveTab, setFlashcardTab, prepareCramQueue } = ctx;

  const activeDecks = (data.decks || []).filter((d: any) => d.linkedSemester === selectedSemester);
  const totalDecks = activeDecks.length;
  
  let totalDueCards = 0;
  activeDecks.forEach((deck: any) => {
      const dueCards = (deck.cards || []).filter((c: any) => !c.nextReviewDate || new Date(c.nextReviewDate).getTime() <= new Date().getTime());
      totalDueCards += dueCards.length;
  });

  const decksWithDueCards = activeDecks.filter((deck: any) => {
      const dueCards = (deck.cards || []).filter((c: any) => !c.nextReviewDate || new Date(c.nextReviewDate).getTime() <= new Date().getTime());
      return dueCards.length > 0;
  });

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
       {/* METRICS */}
       <div style={{ display: 'flex', gap: '10px' }}>
          <div className="metric-card" style={{ flex: 1, background: 'var(--surface)', border: '1px solid var(--muted)', padding: '15px', borderRadius: '4px' }}>
             <div style={{ color: 'var(--subtle)', fontSize: '0.7rem', fontWeight: 'bold' }}>TOTAL DECKS</div>
             <div style={{ color: 'var(--text)', fontSize: '1.5rem', fontWeight: 'bold' }}>{totalDecks}</div>
          </div>
          <div className="metric-card" style={{ flex: 1, background: 'var(--surface)', border: '1px solid var(--muted)', padding: '15px', borderRadius: '4px' }}>
             <div style={{ color: 'var(--subtle)', fontSize: '0.7rem', fontWeight: 'bold' }}>DUE CARDS</div>
             <div style={{ color: totalDueCards > 0 ? 'var(--pine)' : 'var(--text)', fontSize: '1.5rem', fontWeight: 'bold' }}>{totalDueCards}</div>
          </div>
       </div>

       {/* ACTIVE DECKS */}
       <div className="panel" style={{ border: '1px solid var(--iris)', position: 'relative', overflow: 'hidden' }}>
          <div style={{ position: 'absolute', top: 0, left: 0, width: '4px', height: '100%', background: 'var(--iris)' }}></div>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '15px', paddingLeft: '10px' }}>
             <h2 style={{ color: 'var(--iris)', fontSize: '1.2rem', margin: 0 }}>&gt; STUDY QUEUE</h2>
          </div>
          
          <div style={{ paddingLeft: '10px', display: 'flex', flexDirection: 'column', gap: '10px' }}>
             {decksWithDueCards.length === 0 ? (
                 <div style={{ color: 'var(--subtle)', fontSize: '0.8rem' }}>[ NO CARDS DUE FOR REVIEW ]</div>
             ) : (
                 decksWithDueCards.map((deck: any) => {
                     const dueCount = (deck.cards || []).filter((c: any) => !c.nextReviewDate || new Date(c.nextReviewDate).getTime() <= new Date().getTime()).length;
                     return (
                         <div key={deck.id} className="hover-glow" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', background: 'var(--base)', border: '1px solid var(--muted)', padding: '10px', borderRadius: '4px', borderLeft: '4px solid var(--pine)' }}>
                             <div style={{ display: 'flex', flexDirection: 'column' }}>
                                 <span style={{ color: 'var(--text)', fontWeight: 'bold', fontSize: '0.9rem' }}>{deck.name}</span>
                                 <span style={{ color: 'var(--pine)', fontSize: '0.7rem' }}>{dueCount} CARDS DUE</span>
                             </div>
                             <button 
                                 className="button" 
                                 style={{ padding: '4px 10px', fontSize: '0.75rem', borderColor: 'var(--pine)', color: 'var(--pine)' }}
                                 onClick={() => {
                                     setActiveTab('FLASHCARDS');
                                     setFlashcardTab('SESSIONS');
                                     const newSession = {
                                         id: 'session-' + Date.now(),
                                         name: `Review: ${deck.name}`,
                                         linkedSemester: deck.linkedSemester,
                                         linkedLecture: deck.linkedLecture,
                                         deckIds: [deck.id],
                                         cards: [],
                                         createdAt: new Date().toISOString()
                                     };
                                     const newData = { ...data, studySessions: [...(data.studySessions || []), newSession] };
                                     ctx.saveData(newData);
                                     if (prepareCramQueue) prepareCramQueue(newSession, 'ALL');
                                 }}
                             >
                                 <Icons.Play size={14} /> STUDY
                             </button>
                         </div>
                     );
                 })
             )}
          </div>
       </div>

       <button 
           className="button hover-glow" 
           style={{ width: '100%', padding: '15px', fontSize: '1rem', borderColor: 'var(--iris)', color: 'var(--iris)', background: 'var(--surface)' }}
           onClick={() => {
               setActiveTab('FLASHCARDS');
               if (setFlashcardTab) setFlashcardTab('LIBRARY');
           }}
       >
           &gt; FULL DATABASE
       </button>
    </div>
  );
}
