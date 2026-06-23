import React, { useState } from 'react';
import { Icons } from '../shared/Icons';

type Deck = any;


export default function FlashcardManager({ ctx }: { ctx: any }) {
    const {
    data, semesters, selectedSemester, lectures, flashcardTab, setFlashcardTab,
    activeDeckId, setActiveDeckId, editingCard, setEditingCard,
    handleSaveCard, handleDeleteCard,
    cramQueue, setCramQueue, sessionBuilder, setSessionBuilder, activeSessionId, setActiveSessionId,
    expandedDecks, setExpandedDecks, saveData, prepareCramQueue, handleRateCramCard,
    asyncPrompt, handlePaste, setEditingPreview, handleMoveCard, searchCardQuery, setSearchCardQuery, editingPreview,
    showAnswer, setShowAnswer, handleScoreCard, asyncConfirm, setData, availableDecks, handleImportFile, importLoading, setDeckSettingsModal,
    studyMode, setStudyMode
  } = ctx;


  const [newDeckName, setNewDeckName] = useState('');
  const [newDeckLink, setNewDeckLink] = useState('');
  const [activeCardId, setActiveCardId] = useState<string | null>(null);
  const [cardFront, setCardFront] = useState('');
  const [cardBack, setCardBack] = useState('');
  const [cardTags, setCardTags] = useState('');
  const [cramIndex, setCramIndex] = useState(0);
  const [activeSessionType, setActiveSessionType] = useState('ALL');
  const [currentCardIndex, setCurrentCardIndex] = useState(0);
  const [sessionStudyFilter, setSessionStudyFilter] = useState<'ALL' | 'HARD' | 'EASY' | null>(null);
  const [importModalData, setImportModalData] = useState<{ semester: string, lecture: string } | null>(null);

  const handleAddDeck = () => {
      if (!newDeckName) return;
      const newDeck = {
          id: Date.now().toString(),
          name: newDeckName,
          linkedSemester: selectedSemester || '',
          linkedLecture: '',
          cards: []
      };
      const newDecks = [...(data.decks || []), newDeck];
      setData({...data, decks: newDecks});
      saveData({...data, decks: newDecks});
      setNewDeckName('');
      setNewDeckLink('');
  };

  const handleDeleteDeck = (id: string) => {
      const newDecks = (data.decks || []).filter((d: any) => d.id !== id);
      setData({...data, decks: newDecks});
      saveData({...data, decks: newDecks});
      if (activeDeckId === id) setActiveDeckId(null);
  };

  const handleSaveSession = (session: any) => {
      if (!session || !session.name) {
          alert("Session must have a name!");
          return;
      }
      const newSessions = [...(data.studySessions || []), session];
      const newData = { ...data, studySessions: newSessions };
      setData(newData);
      saveData(newData);
      setSessionBuilder(null);
      setFlashcardTab('SESSIONS');
  };

  const handleDeleteSession = (id: string) => {
      const newSessions = (data.studySessions || []).filter((s: any) => s.id !== id);
      const newData = { ...data, studySessions: newSessions };
      setData(newData);
      saveData(newData);
  };

  const handleCreateDeck = (semester: string, lecture: string) => {
      if (setDeckSettingsModal) {
          setDeckSettingsModal({ isOpen: true, defaultSemester: semester, defaultLecture: lecture });
      }
  };

  const processHtml = (text: string) => {
      let t = text.replace(/\n/g, '<br/>');
      t = t.replace(/\*\*(.*?)\*\*/g, '<b>$1</b>');
      return t;
  };

  const activeDeck = data.decks?.find((d: any) => d.id === activeDeckId) || null;

  return (
    <div className="flashcards-container" style={{ display: 'flex', flexDirection: 'column', height: '100%', color: 'var(--text)' }}>
              {(!activeDeckId && !activeSessionId && !sessionBuilder && !studyMode) && (
                  <div style={{ display: 'flex', padding: '10px 20px', borderBottom: '1px solid var(--muted)', gap: '20px' }}>
                      <div style={{ cursor: 'pointer', color: flashcardTab === 'SESSIONS' ? 'var(--gold)' : 'var(--subtle)', fontWeight: flashcardTab === 'SESSIONS' ? 'bold' : 'normal' }} onClick={() => setFlashcardTab('SESSIONS')}>STUDY SESSIONS</div>
                      <div style={{ cursor: 'pointer', color: flashcardTab === 'LIBRARY' ? 'var(--gold)' : 'var(--subtle)', fontWeight: flashcardTab === 'LIBRARY' ? 'bold' : 'normal' }} onClick={() => setFlashcardTab('LIBRARY')}>DECK LIBRARY</div>
                  </div>
              )}
              
              {activeSessionId ? (
                  <div style={{ flex: 1, display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', padding: '20px' }}>
                      {(() => {
                          const session = (data.studySessions || []).find((s: any) => s.id === activeSessionId);
                          if (!session) return null;
                          
                          if (currentCardIndex >= cramQueue.length) {
                              return (
                                  <div style={{ textAlign: 'center' }}>
                                      <h2 style={{ color: 'var(--pine)', marginBottom: '20px' }}>Batch Complete!</h2>
                                      <div style={{ display: 'flex', gap: '10px', justifyContent: 'center' }}>
                                          <button className="button" onClick={() => prepareCramQueue(session, sessionStudyFilter || 'ALL')} style={{ borderColor: 'var(--pine)', color: 'var(--pine)' }}>Continue Next Batch</button>
                                          <button className="button" onClick={() => { setActiveSessionId(null); setCramQueue([]); }} style={{ borderColor: 'var(--muted)', color: 'var(--text)' }}>Stop Studying</button>
                                      </div>
                                  </div>
                              );
                          }
                          
                          const card = cramQueue[currentCardIndex];
                          const progress = Math.round((currentCardIndex / cramQueue.length) * 100);
                          
                          return (
                              <div style={{ width: '100%', maxWidth: '600px', display: 'flex', flexDirection: 'column', gap: '20px' }}>
                                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', color: 'var(--subtle)', fontSize: '0.9rem' }}>
                                      <span style={{ display: 'flex', gap: '10px', alignItems: 'center' }}>
                                          Session: {session.name}
                                          <button 
                                              className="button" 
                                              style={{ padding: '2px 8px', fontSize: '0.7rem', borderColor: studyMode ? 'var(--pine)' : 'var(--muted)', color: studyMode ? 'var(--pine)' : 'var(--text)' }}
                                              onClick={() => setStudyMode(!studyMode)}
                                          >
                                              {studyMode ? 'EXIT FOCUS MODE' : 'ENTER FOCUS MODE'}
                                          </button>
                                      </span>
                                      <span>Card {currentCardIndex + 1} / {cramQueue.length}</span>
                                  </div>
                                  <div style={{ width: '100%', height: '4px', background: 'var(--surface)', borderRadius: '2px' }}>
                                      <div style={{ width: `${progress}%`, height: '100%', background: 'var(--pine)', borderRadius: '2px', transition: 'width 0.3s' }} />
                                  </div>
                                  
                                  <div style={{ perspective: '1000px', width: '100%', minHeight: '300px', position: 'relative', cursor: !showAnswer ? 'pointer' : 'default' }} onClick={() => { if (!showAnswer) setShowAnswer(true); }}>
                                    <div style={{ 
                                        width: '100%', 
                                        height: '100%', 
                                        position: 'absolute', 
                                        transition: 'transform 0.6s', 
                                        transformStyle: 'preserve-3d',
                                        transform: showAnswer ? 'rotateX(180deg)' : 'rotateX(0deg)'
                                    }}>
                                      <div className="card flashcard-content" dangerouslySetInnerHTML={{ __html: processHtml(card.front) }} style={{ 
                                         position: 'absolute',
                                         width: '100%',
                                         height: '100%',
                                         backfaceVisibility: 'hidden',
                                         background: 'var(--base)',
                                         border: '1px solid var(--muted)',
                                         padding: '40px',
                                         borderRadius: '8px',
                                         display: 'flex',
                                         alignItems: 'center',
                                         justifyContent: 'center',
                                         fontSize: '1.2rem',
                                         textAlign: 'center',
                                         whiteSpace: 'pre-wrap',
                                         boxSizing: 'border-box'
                                      }} />
                                      <div className="card flashcard-content" dangerouslySetInnerHTML={{ __html: processHtml(card.back) }} style={{ 
                                         position: 'absolute',
                                         width: '100%',
                                         height: '100%',
                                         backfaceVisibility: 'hidden',
                                         background: 'var(--base)',
                                         border: '1px solid var(--gold)',
                                         boxShadow: '0 0 15px rgba(234, 157, 52, 0.2)',
                                         padding: '40px',
                                         borderRadius: '8px',
                                         display: 'flex',
                                         alignItems: 'center',
                                         justifyContent: 'center',
                                         fontSize: '1.2rem',
                                         textAlign: 'center',
                                         whiteSpace: 'pre-wrap',
                                         transform: 'rotateX(180deg)',
                                         boxSizing: 'border-box'
                                      }} />
                                    </div>
                                  </div>
                                  
                                  {!showAnswer ? (
                                      <div style={{ textAlign: 'center', color: 'var(--subtle)', fontSize: '0.9rem', marginTop: '10px' }}>Click card to reveal answer</div>
                                  ) : (
                                      <div style={{ display: 'flex', gap: '10px', marginTop: '10px' }}>
                                          <button className="button" onClick={() => handleRateCramCard(0)} style={{ flex: 1, borderColor: 'var(--love)', color: 'var(--love)' }}>Again</button>
                                          <button className="button" onClick={() => handleRateCramCard(1)} style={{ flex: 1, borderColor: 'var(--rose)', color: 'var(--rose)' }}>Hard</button>
                                          <button className="button" onClick={() => handleRateCramCard(2)} style={{ flex: 1, borderColor: 'var(--pine)', color: 'var(--pine)' }}>Good</button>
                                          <button className="button" onClick={() => handleRateCramCard(3)} style={{ flex: 1, borderColor: 'var(--foam)', color: 'var(--foam)' }}>Easy</button>
                                      </div>
                                  )}
                                  
                                  <div style={{ display: 'flex', justifyContent: 'center', marginTop: '20px' }}>
                                      <button className="button" onClick={() => { setActiveSessionId(null); setCramQueue([]); }} style={{ color: 'var(--muted)', borderColor: 'transparent' }}>Abort Session</button>
                                  </div>
                              </div>
                          );
                      })()}
                  </div>
              ) : sessionBuilder ? (
                  <div style={{ flex: 1, padding: '20px', overflowY: 'auto' }}>
                      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '20px' }}>
                          <h2 style={{ color: 'var(--gold)', margin: 0 }}>&gt; SESSION BUILDER</h2>
                          <button className="button" onClick={() => setSessionBuilder(null)} style={{ borderColor: 'var(--muted)', color: 'var(--text)' }}>Cancel</button>
                      </div>
                      
                      <div style={{ display: 'flex', flexDirection: 'column', gap: '15px', maxWidth: '600px' }}>
                          <div>
                              <label style={{ display: 'block', marginBottom: '5px', color: 'var(--subtle)' }}>Session Name</label>
                              <input value={sessionBuilder.name} onChange={e => setSessionBuilder({ ...sessionBuilder, name: e.target.value })} placeholder="e.g. Midterm Cram" style={{ width: '100%', background: 'var(--surface)', color: 'var(--text)', border: '1px solid var(--muted)', borderRadius: '4px', padding: '8px', boxSizing: 'border-box' }} />
                          </div>
                          <div style={{ display: 'flex', gap: '20px' }}>
                              <div style={{ flex: 1 }}>
                                  <label style={{ display: 'block', marginBottom: '5px', color: 'var(--subtle)' }}>Mode</label>
                                  <select value={sessionBuilder.mode} onChange={e => setSessionBuilder({ ...sessionBuilder, mode: e.target.value as any })} style={{ width: '100%', background: 'var(--surface)', color: 'var(--text)', border: '1px solid var(--muted)', borderRadius: '4px', padding: '8px', boxSizing: 'border-box' }}>
                                      <option value="cram">Cramming (Isolated)</option>
                                      <option value="spaced">Spaced Repetition</option>
                                  </select>
                              </div>
                              <div style={{ flex: 1 }}>
                                  <label style={{ display: 'block', marginBottom: '5px', color: 'var(--subtle)' }}>Batch Size</label>
                                  <input type="number" value={sessionBuilder.batchSize} onChange={e => setSessionBuilder({ ...sessionBuilder, batchSize: parseInt(e.target.value) || 20 })} style={{ width: '100%', background: 'var(--surface)', color: 'var(--text)', border: '1px solid var(--muted)', borderRadius: '4px', padding: '8px', boxSizing: 'border-box' }} />
                              </div>
                          </div>
                          
                          <div style={{ marginTop: '20px' }}>
                              <h3 style={{ color: 'var(--iris)', borderBottom: '1px solid var(--muted)', paddingBottom: '10px' }}>Include Decks & Cards</h3>
                              <div style={{ display: 'flex', flexDirection: 'column', gap: '15px', marginTop: '10px' }}>
                                  {(data.decks || []).filter((deck: any) => !selectedSemester || deck.linkedSemester === selectedSemester).map((deck: any) => {
                                      const isDeckSelected = sessionBuilder.deckIds.includes(deck.id);
                                      const expanded = expandedDecks[deck.id];
                                      const selectedCardsCount = deck.cards.filter((c: any) => sessionBuilder.cardIds.includes(c.id)).length;
                                      
                                      return (
                                          <div key={deck.id} style={{ display: 'flex', flexDirection: 'column', gap: '5px' }}>
                                              <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                                                  <button className="button" style={{ padding: '2px 8px', fontSize: '0.8rem', background: 'transparent', borderColor: 'var(--muted)', color: 'var(--text)' }} onClick={() => setExpandedDecks({...expandedDecks, [deck.id]: !expanded})}>
                                                      {expanded ? '▼' : '▶'}
                                                  </button>
                                                  <label style={{ display: 'flex', alignItems: 'center', gap: '10px', cursor: 'pointer', flex: 1 }}>
                                                      <input 
                                                          type="checkbox" 
                                                          checked={isDeckSelected} 
                                                          onChange={e => {
                                                              let newDeckIds = [...sessionBuilder.deckIds];
                                                              let newCardIds = [...sessionBuilder.cardIds];
                                                              
                                                              if (e.target.checked) {
                                                                  newDeckIds.push(deck.id);
                                                                  // Remove individual card selections if whole deck is selected
                                                                  newCardIds = newCardIds.filter(id => !deck.cards.find((c: any) => c.id === id));
                                                              } else {
                                                                  newDeckIds = newDeckIds.filter(id => id !== deck.id);
                                                              }
                                                              setSessionBuilder({ ...sessionBuilder, deckIds: newDeckIds, cardIds: newCardIds });
                                                          }} 
                                                      />
                                                      <span style={{ color: 'var(--text)', fontWeight: 'bold' }}>{deck.name}</span>
                                                      <span style={{ color: 'var(--subtle)', fontSize: '0.8rem' }}>({deck.cards.length} cards{selectedCardsCount > 0 && !isDeckSelected ? `, ${selectedCardsCount} selected` : ''})</span>
                                                  </label>
                                              </div>
                                              
                                              {expanded && (
                                                  <div style={{ paddingLeft: '40px', display: 'flex', flexDirection: 'column', gap: '5px', marginTop: '5px' }}>
                                                      {deck.cards.map((card: any, i: any) => (
                                                          <label key={card.id} style={{ display: 'flex', alignItems: 'center', gap: '10px', cursor: 'pointer', opacity: isDeckSelected ? 0.5 : 1 }}>
                                                              <input 
                                                                  type="checkbox"
                                                                  disabled={isDeckSelected}
                                                                  checked={isDeckSelected || sessionBuilder.cardIds.includes(card.id)}
                                                                  onChange={e => {
                                                                      if (isDeckSelected) return;
                                                                      let newCardIds = [...sessionBuilder.cardIds];
                                                                      if (e.target.checked) newCardIds.push(card.id);
                                                                      else newCardIds = newCardIds.filter(id => id !== card.id);
                                                                      setSessionBuilder({ ...sessionBuilder, cardIds: newCardIds });
                                                                  }}
                                                              />
                                                              <span style={{ color: 'var(--text)', fontSize: '0.9rem', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
                                                                  {i + 1}. {card.front.substring(0, 50)}{card.front.length > 50 ? '...' : ''}
                                                              </span>
                                                          </label>
                                                      ))}
                                                  </div>
                                              )}
                                          </div>
                                      );
                                  })}
                                  {(data.decks || []).filter((deck: any) => !selectedSemester || deck.linkedSemester === selectedSemester).length === 0 && <div style={{ color: 'var(--muted)' }}>No decks available for this semester.</div>}
                              </div>
                          </div>
                          
                          <button className="button" onClick={() => handleSaveSession(sessionBuilder)} style={{ marginTop: '20px', background: 'var(--gold)', color: 'var(--base)', fontWeight: 'bold' }}>Save Session</button>
                      </div>
                  </div>
              ) : flashcardTab === 'SESSIONS' && !activeDeckId ? (
                  <div style={{ flex: 1, padding: '20px', overflowY: 'auto' }}>
                      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '20px' }}>
                          <h2 style={{ color: 'var(--gold)', margin: 0 }}>&gt; STUDY SESSIONS</h2>
                          <button className="button" onClick={() => setSessionBuilder({ id: Date.now().toString(), name: 'New Session', mode: 'cram', deckIds: [], cardIds: [], batchSize: 20, linkedSemester: selectedSemester })} style={{ borderColor: 'var(--pine)', color: 'var(--pine)' }}><Icons.Plus size={14} /> NEW SESSION</button>
                      </div>
                      
                      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(300px, 1fr))', gap: '20px' }}>
                          {(data.studySessions || []).filter((s: any) => !selectedSemester || s.linkedSemester === selectedSemester).map((session: any) => (
                              <div key={session.id} style={{ background: 'var(--base)', border: '1px solid var(--muted)', borderRadius: '8px', padding: '20px', display: 'flex', flexDirection: 'column' }}>
                                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '10px' }}>
                                      <strong style={{ color: 'var(--pine)', fontSize: '1.2rem' }}>{session.name}</strong>
                                      <span style={{ fontSize: '0.7rem', background: 'var(--surface)', padding: '2px 6px', borderRadius: '4px', color: 'var(--gold)' }}>{session.mode.toUpperCase()}</span>
                                  </div>
                                  <div style={{ color: 'var(--subtle)', fontSize: '0.9rem', marginBottom: '20px' }}>
                                      Decks: {session.deckIds.length} | Batch Size: {session.batchSize}
                                      {session.linkedLecture && <div style={{ marginTop: '5px', color: 'var(--iris)' }}>Lecture: {session.linkedLecture}</div>}
                                      {(() => {
                                          if (!session.cramState || !session.cramState.cardRatings) return null;
                                          const ratings = Object.values(session.cramState.cardRatings);
                                          if (ratings.length === 0) return null;
                                          let counts = { again: 0, hard: 0, good: 0, easy: 0 };
                                          let score = 0;
                                          ratings.forEach(r => {
                                              if (r === 0) counts.again++;
                                              if (r === 1) { counts.hard++; score += 50; }
                                              if (r === 2) { counts.good++; score += 75; }
                                              if (r === 3) { counts.easy++; score += 100; }
                                          });
                                          const conf = Math.round(score / ratings.length);
                                          return (
                                              <div style={{ marginTop: '10px', padding: '10px', background: 'var(--surface)', borderRadius: '5px', fontSize: '0.8rem' }}>
                                                  <div style={{ marginBottom: '5px', color: 'var(--text)' }}><strong>Statistics:</strong> {ratings.length} Cards Rated ({conf}% Mastery)</div>
                                                  <div style={{ display: 'flex', gap: '10px' }}>
                                                      <span style={{ color: 'var(--love)' }}>Again: {counts.again}</span>
                                                      <span style={{ color: 'var(--rose)' }}>Hard: {counts.hard}</span>
                                                      <span style={{ color: 'var(--pine)' }}>Good: {counts.good}</span>
                                                      <span style={{ color: 'var(--foam)' }}>Easy: {counts.easy}</span>
                                                  </div>
                                              </div>
                                          );
                                      })()}
                                  </div>
                                  
                                  <div style={{ display: 'flex', gap: '10px', marginTop: 'auto' }}>
                                      <button className="button" onClick={async () => {
                                          const filter = await asyncPrompt('Study Filter: (ALL, HARD, EASY)', 'ALL');
                                          if (filter && ['ALL', 'HARD', 'EASY'].includes(filter.toUpperCase())) {
                                              prepareCramQueue(session, filter.toUpperCase() as any);
                                          }
                                      }} style={{ flex: 1, borderColor: 'var(--gold)', color: 'var(--gold)' }}><Icons.Play size={14} /> STUDY</button>
                                      <button className="icon-button edit" onClick={() => setSessionBuilder(session)} title="Edit Session"><Icons.Edit size={16} /></button>
                                      <button className="icon-button delete" onClick={async () => { if (await asyncConfirm('Delete session?')) handleDeleteSession(session.id); }} title="Delete Session"><Icons.Delete size={16} /></button>
                                  </div>
                              </div>
                          ))}
                          {(data.studySessions || []).filter((s: any) => !selectedSemester || s.linkedSemester === selectedSemester).length === 0 && (
                              <div style={{ color: 'var(--muted)' }}>No study sessions created yet for this semester. Click "<Icons.Plus size={14} /> NEW SESSION" to begin.</div>
                          )}
                      </div>
                  </div>
              ) : !activeDeckId ? (
                  <div style={{ flex: 1, display: 'flex', flexDirection: 'column', padding: '20px', overflowY: 'auto' }}>
                      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '20px' }}>
                          <h2 style={{ color: 'var(--gold)', margin: 0 }}>&gt; FLASHCARD ENGINE</h2>
                          {!selectedSemester && <span style={{ color: 'var(--subtle)' }}>Please select a semester in the left sidebar</span>}
                      </div>
                      
                      {selectedSemester && (() => {
                          const renderCategory = (title: string, lecDecks: Deck[], lecName: string) => (
                              <div key={title} style={{ marginBottom: '40px' }}>
                                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', borderBottom: '1px dashed var(--muted)', paddingBottom: '10px', marginBottom: '15px' }}>
                                      <h3 style={{ color: 'var(--iris)', margin: 0 }}>{title}</h3>
                                      <div style={{ display: 'flex', gap: '10px' }}>
                                          <button className="button" style={{ fontSize: '0.8rem', padding: '4px 10px', borderColor: 'var(--pine)', color: 'var(--pine)' }} onClick={() => handleCreateDeck(selectedSemester, lecName)}><Icons.Plus size={14} /> NEW DECK</button>
                                          <button className="button" style={{ fontSize: '0.8rem', padding: '4px 10px', borderColor: 'var(--foam)', color: 'var(--foam)' }} onClick={() => setImportModalData({ semester: selectedSemester, lecture: lecName })}><Icons.Plus size={14} /> IMPORT DECK</button>
                                      </div>
                                  </div>
                                  
                                  {lecDecks.length === 0 ? (
                                      <div style={{ color: 'var(--muted)' }}>No decks in this category.</div>
                                  ) : (
                                      <div style={{ display: 'flex', flexWrap: 'wrap', gap: '20px' }}>
                                          {lecDecks.map((deck: any) => {
                                              const now = new Date();
                                              const dueCards = deck.cards.filter((c: any) => !c.nextReview || new Date(c.nextReview) <= now);
                                              return (
                                                  <div key={deck.id} style={{ background: 'var(--base)', border: '1px solid var(--muted)', borderRadius: '4px', padding: '20px', width: '300px', display: 'flex', flexDirection: 'column', position: 'relative' }}>
                                                      <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '10px', alignItems: 'center', gap: '10px' }}>
                                                          <strong style={{ color: 'var(--pine)', fontSize: '1.2rem', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>{deck.name}</strong>
                                                          {dueCards.length > 0 ? (
                                                              <span style={{ background: 'var(--love)', color: 'var(--base)', padding: '2px 8px', borderRadius: '10px', fontSize: '0.8rem', fontWeight: 'bold', flexShrink: 0 }}>{dueCards.length} DUE</span>
                                                          ) : (
                                                              <span style={{ background: 'var(--surface)', color: 'var(--muted)', padding: '2px 8px', borderRadius: '10px', fontSize: '0.8rem', fontWeight: 'bold', flexShrink: 0 }}>DONE</span>
                                                          )}
                                                      </div>
                                                      <div style={{ color: 'var(--subtle)', marginBottom: '20px' }}>{deck.cards.length} Total Cards</div>
                                                      <div style={{ display: 'flex', gap: '10px', marginTop: 'auto' }}>
                                                          <button className="button" disabled={dueCards.length === 0} onClick={() => { setActiveDeckId(deck.id); setCurrentCardIndex(0); setShowAnswer(false); setStudyMode(true); }} style={{ flex: 1, borderColor: 'var(--gold)', color: 'var(--gold)', opacity: dueCards.length === 0 ? 0.3 : 1 }}><Icons.Play size={14} /> STUDY NOW</button>
                                                          <button className="button" onClick={() => { setActiveDeckId(deck.id); setStudyMode(false); }} style={{ borderColor: 'var(--iris)', color: 'var(--iris)' }}><Icons.Edit size={14} /> MANAGE</button>
                                                      </div>
                                                  </div>
                                              );
                                          })}
                                      </div>
                                  )}
                              </div>
                          );

                          const blocks = lectures.map((lec: any) => {
                              const lecDecks = (data.decks || []).filter((d: any) => d.linkedSemester === selectedSemester && d.linkedLecture === lec);
                              return renderCategory(`📁 ${lec}`, lecDecks, lec);
                          });

                          const uncategorizedDecks = (data.decks || []).filter((d: any) => d.linkedSemester === selectedSemester && (!d.linkedLecture || !lectures.includes(d.linkedLecture)));
                          if (uncategorizedDecks.length > 0) {
                              blocks.push(renderCategory('General / Uncategorized', uncategorizedDecks, ''));
                          }

                          return blocks;
                      })()}
                      
                      {availableDecks.filter((ad: any) => !selectedSemester || ad.semester === selectedSemester).length > 0 && (
                          <div style={{ marginTop: '40px' }}>
                              <h3 style={{ color: 'var(--foam)', borderBottom: '1px solid var(--muted)', paddingBottom: '10px' }}>Available Decks (Not Imported)</h3>
                              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(250px, 1fr))', gap: '20px', marginTop: '20px' }}>
                                  {availableDecks.filter((ad: any) => !selectedSemester || ad.semester === selectedSemester).map((ad: any) => (
                                      <div key={ad.path} className="card" style={{ background: 'var(--base)', border: '1px dashed var(--muted)', padding: '20px', borderRadius: '8px', display: 'flex', flexDirection: 'column' }}>
                                          <div style={{ fontSize: '0.8rem', color: 'var(--subtle)', marginBottom: '5px' }}>{ad.lecture}</div>
                                          <div className="card-title" style={{ fontSize: '1.2rem', marginBottom: '15px' }}>{ad.name}</div>
                                          <div style={{ marginTop: 'auto' }}>
                                              <button className="button" onClick={() => handleImportFile(ad)} disabled={importLoading} style={{ width: '100%', borderColor: 'var(--foam)', color: 'var(--foam)', opacity: importLoading ? 0.5 : 1 }}>
                                                  {importLoading ? 'Importing...' : 'Import Deck'}
                                              </button>
                                          </div>
                                      </div>
                                  ))}
                              </div>
                          </div>
                      )}
                  </div>
              ) : studyMode ? (
                  <div style={{ flex: 1, display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', padding: '20px' }}>
                      {(() => {
                          const deck = (data.decks || []).find((d: any) => d.id === activeDeckId);
                          if (!deck) return null;
                          const now = new Date();
                          const dueCards = deck.cards.filter((c: any) => !c.nextReview || new Date(c.nextReview) <= now);
                          
                          if (currentCardIndex >= dueCards.length) {
                              return (
                                  <div style={{ textAlign: 'center' }}>
                                      <h2 style={{ color: 'var(--pine)', marginBottom: '20px' }}>Deck Complete!</h2>
                                      <button className="button" onClick={() => { setActiveDeckId(null); setStudyMode(false); }} style={{ borderColor: 'var(--pine)', color: 'var(--pine)' }}>Return to Decks</button>
                                  </div>
                              );
                          }
                          
                          const card = dueCards[currentCardIndex];
                          
                          return (
                              <div style={{ width: '100%', maxWidth: '800px', display: 'flex', flexDirection: 'column', alignItems: 'center' }}>
                                  <div style={{ width: '100%', display: 'flex', justifyContent: 'space-between', marginBottom: '20px', color: 'var(--subtle)' }}>
                                      <span>Deck: <strong style={{ color: 'var(--pine)' }}>{deck.name}</strong></span>
                                      <span>Card {currentCardIndex + 1} / {dueCards.length}</span>
                                  </div>
                                  
                                  <div className="flashcard-content" style={{ width: '100%', minHeight: '200px', background: 'var(--surface)', padding: '40px', borderRadius: '8px', border: '1px solid var(--muted)', marginBottom: '20px', fontSize: '1.2rem', textAlign: 'center', whiteSpace: 'pre-wrap' }} dangerouslySetInnerHTML={{ __html: processHtml(card.front) }} />
                                  
                                  {showAnswer ? (
                                      <>
                                          <div className="flashcard-content" style={{ width: '100%', minHeight: '200px', background: 'var(--hl-low)', padding: '40px', borderRadius: '8px', border: '1px dashed var(--gold)', marginBottom: '30px', fontSize: '1.2rem', textAlign: 'center', color: 'var(--gold)', whiteSpace: 'pre-wrap' }} dangerouslySetInnerHTML={{ __html: processHtml(card.back) }} />
                                          <div style={{ display: 'flex', gap: '15px', width: '100%' }}>
                                              <button className="button" onClick={() => handleScoreCard(deck.id, card.id, 0)} style={{ borderColor: 'var(--love)', color: 'var(--love)', flex: 1 }}>Again<br/>(0m)</button>
                                              <button className="button" onClick={() => handleScoreCard(deck.id, card.id, 1)} style={{ borderColor: 'var(--rose)', color: 'var(--rose)', flex: 1 }}>Hard<br/>({(card.interval || 0) === 0 ? '1d' : Math.round((card.interval || 6) * (card.ease || 2.5) * 0.8) + 'd'})</button>
                                              <button className="button" onClick={() => handleScoreCard(deck.id, card.id, 2)} style={{ borderColor: 'var(--pine)', color: 'var(--pine)', flex: 1 }}>Good<br/>({(card.interval || 0) === 0 ? '1d' : card.interval === 1 ? '6d' : Math.round((card.interval || 6) * (card.ease || 2.5)) + 'd'})</button>
                                              <button className="button" onClick={() => handleScoreCard(deck.id, card.id, 3)} style={{ borderColor: 'var(--foam)', color: 'var(--foam)', flex: 1 }}>Easy<br/>({(card.interval || 0) === 0 ? '1d' : card.interval === 1 ? '6d' : Math.round((card.interval || 6) * (card.ease || 2.5) * 1.3) + 'd'})</button>
                                          </div>
                                      </>
                                  ) : (
                                      <button className="button" onClick={() => setShowAnswer(true)} style={{ width: '100%', padding: '15px', fontSize: '1.2rem', fontWeight: 'bold', borderColor: 'var(--gold)', color: 'var(--gold)' }}>
                                          Show Answer
                                      </button>
                                  )}
                                  
                                  <div style={{ marginTop: '30px' }}>
                                      <button className="button" onClick={() => { setActiveDeckId(null); setStudyMode(false); }} style={{ color: 'var(--muted)', borderColor: 'transparent' }}>Abort Study Session</button>
                                  </div>
                              </div>
                          );
                      })()}
                  </div>
              ) : (
                  <div style={{ flex: 1, display: 'flex', flexDirection: 'column', padding: '20px', overflowY: 'auto' }}>
                      {(() => {
                          const deck = (data.decks || []).find((d: any) => d.id === activeDeckId);
                          if (!deck) return null;
                          return (
                              <>
                                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '20px' }}>
                                      <div style={{ display: 'flex', alignItems: 'center', gap: '15px' }}>
                                          <button className="button" onClick={() => setActiveDeckId(null)} style={{ borderColor: 'var(--muted)', color: 'var(--text)' }}>&lt; Back</button>
                                          <h2 style={{ color: 'var(--iris)', margin: 0 }}>Managing: {deck.name}</h2>
                                      </div>
                                      <div style={{ display: 'flex', gap: '10px' }}>
                                          <button className="button" onClick={() => setDeckSettingsModal({ isOpen: true, deckId: deck.id, defaultSemester: deck.linkedSemester, defaultLecture: deck.linkedLecture })} style={{ borderColor: 'var(--iris)', color: 'var(--iris)', fontWeight: 'bold' }}>⚙️ SETTINGS</button>
                                          <button className="button" onClick={() => setEditingCard({ front: '', back: '' })} style={{ borderColor: 'var(--foam)', color: 'var(--foam)', fontWeight: 'bold' }}><Icons.Plus size={14} /> NEW CARD</button>
                                          <button className="button" onClick={() => {
                                              asyncConfirm(`Delete deck "${deck.name}" entirely?`).then((res: any) => {
                                                  if (res) {
                                                      const newDecks = (data.decks || []).filter((d: any) => d.id !== deck.id);
                                                      setData({...data, decks: newDecks});
                                                      saveData({...data, decks: newDecks});
                                                      setActiveDeckId(null);
                                                  }
                                              });
                                          }} style={{ borderColor: 'var(--love)', color: 'var(--love)', fontWeight: 'bold' }}>DELETE DECK</button>
                                      </div>
                                  </div>
                                  
                                  {editingCard && (
                                      <div style={{ borderRadius: '8px', border: '1px solid var(--gold)', boxShadow: '0 0 15px rgba(234, 157, 52, 0.2)', padding: '50px', background: 'var(--base)', marginBottom: '30px' }}>
                                          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '15px' }}>
                                              <h3 style={{ color: 'var(--gold)', margin: 0 }}>{editingCard.id ? 'Edit Card' : 'New Card'}</h3>
                                              <button className="button" onClick={() => setEditingPreview(!editingPreview)} style={{ padding: '5px 10px', fontSize: '0.8rem' }}>
                                                  {editingPreview ? 'Show Editor' : 'Live Preview'}
                                              </button>
                                          </div>
                                          
                                          {editingPreview ? (
                                              <div style={{ display: 'flex', gap: '20px', flexDirection: 'column' }}>
                                                  <div style={{ background: 'var(--base)', padding: '15px', borderRadius: '6px', border: '1px solid var(--surface)' }}>
                                                      <div style={{ fontSize: '0.8rem', color: 'var(--subtle)', marginBottom: '5px' }}>FRONT</div>
                                                      <div className="flashcard-content" dangerouslySetInnerHTML={{ __html: processHtml(editingCard.front) }} />
                                                  </div>
                                                  <div style={{ background: 'var(--hl-low)', padding: '15px', borderRadius: '6px', border: '1px dashed var(--gold)', color: 'var(--gold)' }}>
                                                      <div style={{ fontSize: '0.8rem', color: 'var(--subtle)', marginBottom: '5px' }}>BACK</div>
                                                      <div className="flashcard-content" dangerouslySetInnerHTML={{ __html: processHtml(editingCard.back) }} />
                                                  </div>
                                              </div>
                                          ) : (
                                              <div style={{ display: 'flex', flexDirection: 'column', gap: '15px' }}>
                                                  <div>
                                                      <div style={{ display: 'flex', gap: '5px', marginBottom: '5px' }}>
                                                          <button className="button" onClick={() => setEditingCard({...editingCard, front: editingCard.front + '<b></b>'})} style={{ padding: '2px 8px', fontSize: '0.8rem' }}>B</button>
                                                          <button className="button" onClick={() => setEditingCard({...editingCard, front: editingCard.front + '<i></i>'})} style={{ padding: '2px 8px', fontSize: '0.8rem' }}>I</button>
                                                          <button className="button" onClick={() => setEditingCard({...editingCard, front: editingCard.front + '<code></code>'})} style={{ padding: '2px 8px', fontSize: '0.8rem' }}>Code</button>
                                                          <button className="button" onClick={async () => { const url = await asyncPrompt('Image URL or Path (/api/media?file=):'); if (url) setEditingCard({...editingCard, front: editingCard.front + `<img src="${url}" style="max-width:100%" />`}); }} style={{ padding: '2px 8px', fontSize: '0.8rem' }}>Img</button>
                                                      </div>
                                                      <textarea placeholder="Front (Question)" value={editingCard.front} onChange={e => setEditingCard({...editingCard, front: e.target.value})} onPaste={e => handlePaste(e, 'front')} style={{ background: 'var(--base)', color: 'var(--text)', border: '1px solid var(--muted)', borderRadius: '4px', padding: '10px', minHeight: '80px', fontFamily: 'inherit', resize: 'vertical', width: '100%', boxSizing: 'border-box' }} />
                                                  </div>
                                                  
                                                  <div>
                                                      <div style={{ display: 'flex', gap: '5px', marginBottom: '5px' }}>
                                                          <button className="button" onClick={() => setEditingCard({...editingCard, back: editingCard.back + '<b></b>'})} style={{ padding: '2px 8px', fontSize: '0.8rem' }}>B</button>
                                                          <button className="button" onClick={() => setEditingCard({...editingCard, back: editingCard.back + '<i></i>'})} style={{ padding: '2px 8px', fontSize: '0.8rem' }}>I</button>
                                                          <button className="button" onClick={() => setEditingCard({...editingCard, back: editingCard.back + '<code></code>'})} style={{ padding: '2px 8px', fontSize: '0.8rem' }}>Code</button>
                                                          <button className="button" onClick={async () => { const url = await asyncPrompt('Image URL or Path (/api/media?file=):'); if (url) setEditingCard({...editingCard, back: editingCard.back + `<img src="${url}" style="max-width:100%" />`}); }} style={{ padding: '2px 8px', fontSize: '0.8rem' }}>Img</button>
                                                      </div>
                                                      <textarea placeholder="Back (Answer)" value={editingCard.back} onChange={e => setEditingCard({...editingCard, back: e.target.value})} onPaste={e => handlePaste(e, 'back')} style={{ background: 'var(--base)', color: 'var(--text)', border: '1px solid var(--muted)', borderRadius: '4px', padding: '10px', minHeight: '80px', fontFamily: 'inherit', resize: 'vertical', width: '100%', boxSizing: 'border-box' }} />
                                                  </div>
                                              </div>
                                          )}
                                          
                                          <div style={{ display: 'flex', gap: '10px', justifyContent: 'flex-end', marginTop: '15px' }}>
                                              <button className="button" onClick={() => setEditingCard(null)} style={{ color: 'var(--love)', borderColor: 'var(--love)' }}>Cancel</button>
                                              <button className="button" onClick={handleSaveCard} style={{ background: 'var(--pine)', color: 'var(--base)', borderColor: 'var(--pine)', fontWeight: 'bold' }}>Save Card</button>
                                          </div>
                                      </div>
                                  )}
                                  
                                  <div style={{ display: 'flex', flexDirection: 'column', gap: '15px' }}>
                                      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                                          <input 
                                              type="text" 
                                              placeholder="Search cards..." 
                                              value={searchCardQuery} 
                                              onChange={e => setSearchCardQuery(e.target.value)} 
                                              style={{ background: 'var(--surface)', color: 'var(--text)', border: '1px solid var(--muted)', padding: '8px 15px', borderRadius: '4px', width: '300px' }} 
                                          />
                                      </div>
                                      
                                      {deck.cards.length === 0 ? (
                                          <div style={{ color: 'var(--muted)', textAlign: 'center', marginTop: '20px' }}>No cards in this deck yet.</div>
                                      ) : deck.cards.filter((c: any) => !searchCardQuery || c.front.toLowerCase().includes(searchCardQuery.toLowerCase()) || c.back.toLowerCase().includes(searchCardQuery.toLowerCase())).map((card: any) => (
                                          <div key={card.id} style={{ display: 'flex', background: 'var(--base)', border: '1px solid var(--surface)', borderRadius: '6px', overflow: 'hidden' }}>
                                              <div style={{ flex: 1, padding: '15px', borderRight: '1px dashed var(--surface)', whiteSpace: 'pre-wrap', wordBreak: 'break-word' }}>
                                                  <div style={{ fontSize: '0.8rem', color: 'var(--subtle)', marginBottom: '5px' }}>FRONT</div>
                                                  <div className="flashcard-content" dangerouslySetInnerHTML={{ __html: processHtml(card.front) }} />
                                              </div>
                                              <div style={{ flex: 1, padding: '15px', borderRight: '1px solid var(--surface)', whiteSpace: 'pre-wrap', wordBreak: 'break-word', color: 'var(--gold)' }}>
                                                  <div style={{ fontSize: '0.8rem', color: 'var(--subtle)', marginBottom: '5px' }}>BACK</div>
                                                  <div className="flashcard-content" dangerouslySetInnerHTML={{ __html: processHtml(card.back) }} />
                                              </div>
                                              <div style={{ width: '100px', display: 'flex', flexDirection: 'column', justifyContent: 'center', alignItems: 'center', gap: '10px', background: 'var(--hl-low)', padding: '10px' }}>
                                                  <div style={{ fontSize: '0.7rem', color: 'var(--subtle)', textAlign: 'center' }}>
                                                     Ease: {card.ease?.toFixed(2) || '2.50'}<br/>
                                                     Int: {card.interval || 0}d
                                                  </div>
                                                  <button className="button" onClick={() => { setEditingCard(card); setEditingPreview(false); }} style={{ width: '100%', fontSize: '0.8rem', padding: '5px', borderColor: 'var(--foam)', color: 'var(--foam)' }}>Edit</button>
                                                  <button className="button" onClick={() => handleDeleteCard(card.id)} style={{ width: '100%', fontSize: '0.8rem', padding: '5px', borderColor: 'var(--love)', color: 'var(--love)' }}>Delete</button>
                                                  
                                                  <select 
                                                      className="button" 
                                                      style={{ width: '100%', fontSize: '0.75rem', padding: '5px', borderColor: 'var(--muted)', color: 'var(--text)', background: 'transparent' }}
                                                      onChange={(e) => {
                                                          if (e.target.value) handleMoveCard(card.id, e.target.value);
                                                          e.target.value = '';
                                                      }}
                                                      value=""
                                                  >
                                                      <option value="" disabled>Move to...</option>
                                                      {(data.decks || []).filter((d: any) => d.id !== deck.id).map((d: any) => (
                                                          <option key={d.id} value={d.id}>{d.name}</option>
                                                      ))}
                                                  </select>
                                              </div>
                                          </div>
                                      ))}
                                  </div>
                              </>
                          );
                      })()}
                  </div>
              )}
          </div>
  );
}
