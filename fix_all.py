import sys

with open('src/components/flashcards/FlashcardManager.tsx', 'r') as f:
    content = f.read()

# 1. Fix shadowing
content = content.replace(
    "  const [currentCardIndex, setCurrentCardIndex] = useState(0);",
    ""
)

# 2. Add currentCardIndex to ctx
content = content.replace(
    "studyMode, setStudyMode",
    "studyMode, setStudyMode, currentCardIndex, setCurrentCardIndex"
)

# 3. Fix focus bug
content = content.replace(
    "          if (document.activeElement?.tagName === 'INPUT' || document.activeElement?.tagName === 'TEXTAREA') return;",
    "          if (['INPUT', 'TEXTAREA', 'BUTTON', 'SELECT'].includes(document.activeElement?.tagName || '')) return;"
)

# 4. Fallback for CSS bug
# For front card
content = content.replace(
    "backfaceVisibility: 'hidden',",
    "backfaceVisibility: 'hidden',\n                                         WebkitBackfaceVisibility: 'hidden',\n                                         opacity: showAnswer ? 0 : 1,",
    1 # Only replace the first occurrence (front card)
)

# For back card
content = content.replace(
    "backfaceVisibility: 'hidden',",
    "backfaceVisibility: 'hidden',\n                                         WebkitBackfaceVisibility: 'hidden',\n                                         opacity: !showAnswer ? 0 : 1,",
    1 # Replace the next occurrence (back card)
)

with open('src/components/flashcards/FlashcardManager.tsx', 'w') as f:
    f.write(content)
