import re

with open('src/components/flashcards/FlashcardManager.tsx', 'r') as f:
    content = f.read()

# Replace the state definition of currentCardIndex
content = content.replace("  const [currentCardIndex, setCurrentCardIndex] = useState(0);", "")

# Add currentCardIndex and setCurrentCardIndex to ctx destructoring
content = content.replace(
    "    studyMode, setStudyMode",
    "    studyMode, setStudyMode, currentCardIndex, setCurrentCardIndex"
)

with open('src/components/flashcards/FlashcardManager.tsx', 'w') as f:
    f.write(content)
