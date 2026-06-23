with open('src/components/flashcards/FlashcardManager.tsx', 'r') as f:
    content = f.read()

# Fix the CSS for the front card
content = content.replace(
    "backfaceVisibility: 'hidden',",
    "backfaceVisibility: 'hidden',\n                                         WebkitBackfaceVisibility: 'hidden',\n                                         opacity: showAnswer ? 0 : 1,"
)

# Fix the CSS for the back card (second occurrence of backfaceVisibility)
# Actually, since it's applied twice, the previous replace hits both.
# But for the back card, opacity should be !showAnswer ? 0 : 1.
# Let's do it precisely using regex.
import re

content = re.sub(
    r'(dangerouslySetInnerHTML=\{\{\s*__html:\s*processHtml\(card\.front\)\s*\}\}\s*style=\{\{.*?)(backfaceVisibility:\s*\'hidden\',)',
    r'\1backfaceVisibility: \'hidden\', WebkitBackfaceVisibility: \'hidden\', opacity: showAnswer ? 0 : 1, transition: \'opacity 0.3s\',',
    content,
    flags=re.DOTALL
)

content = re.sub(
    r'(dangerouslySetInnerHTML=\{\{\s*__html:\s*processHtml\(card\.back\)\s*\}\}\s*style=\{\{.*?)(backfaceVisibility:\s*\'hidden\',)',
    r'\1backfaceVisibility: \'hidden\', WebkitBackfaceVisibility: \'hidden\', opacity: !showAnswer ? 0 : 1, transition: \'opacity 0.3s\',',
    content,
    flags=re.DOTALL
)

with open('src/components/flashcards/FlashcardManager.tsx', 'w') as f:
    f.write(content)
