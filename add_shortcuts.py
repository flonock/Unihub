with open('src/components/flashcards/FlashcardManager.tsx', 'r') as f:
    lines = f.readlines()

insert_idx = 0
for i, line in enumerate(lines):
    if line.strip() == "const activeDeck = data.decks?.find((d: any) => d.id === activeDeckId) || null;":
        insert_idx = i + 1
        break

code_to_insert = """
  // Keyboard Shortcuts for Study Mode
  React.useEffect(() => {
      const handleKeyDown = (e: KeyboardEvent) => {
          if (!studyMode && !activeSessionId) return;
          // Don't trigger if user is typing in an input
          if (document.activeElement?.tagName === 'INPUT' || document.activeElement?.tagName === 'TEXTAREA') return;

          if (e.code === 'Space') {
              e.preventDefault();
              if (!showAnswer) setShowAnswer(true);
          } else if (showAnswer) {
              const scoreMap: Record<string, number> = {
                  'Digit1': 0, 'Numpad1': 0,
                  'Digit2': 1, 'Numpad2': 1,
                  'Digit3': 2, 'Numpad3': 2,
                  'Digit4': 3, 'Numpad4': 3,
                  'ArrowLeft': 0, // Request: Left/Right arrow keys
                  'ArrowRight': 2
              };
              if (e.code in scoreMap) {
                  e.preventDefault();
                  const score = scoreMap[e.code];
                  if (activeSessionId && handleRateCramCard) {
                      handleRateCramCard(score);
                  } else if (activeDeckId && activeDeck && handleScoreCard) {
                      // Get due cards to find the current card
                      const dueCards = (activeDeck.cards || []).filter((c: any) => !c.nextReviewDate || new Date(c.nextReviewDate).getTime() <= new Date().getTime());
                      const card = dueCards[currentCardIndex];
                      if (card) {
                          handleScoreCard(activeDeckId, card.id, score);
                      }
                  }
              }
          }
      };
      
      window.addEventListener('keydown', handleKeyDown);
      return () => window.removeEventListener('keydown', handleKeyDown);
  }, [studyMode, activeSessionId, activeDeckId, showAnswer, currentCardIndex, activeDeck, handleRateCramCard, handleScoreCard, setShowAnswer]);

"""

lines.insert(insert_idx, code_to_insert)

with open('src/components/flashcards/FlashcardManager.tsx', 'w') as f:
    f.writelines(lines)
