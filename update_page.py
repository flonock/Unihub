with open('src/app/page.tsx', 'r') as f:
    page = f.read()

# Imports
page = page.replace(
    "import WidgetPanel from '@/components/widgets/WidgetPanel';",
    "import WidgetPanel from '@/components/widgets/WidgetPanel';\nimport FlashcardOverview from '@/components/flashcards/FlashcardOverview';"
)

# States
page = page.replace(
    "useState<'MISSION_CONTROL' | 'BROWSER' | 'PLANNER' | 'OVERVIEW' | 'FLASHCARDS'>('MISSION_CONTROL');",
    "useState<'MISSION_CONTROL' | 'BROWSER' | 'PLANNER' | 'OVERVIEW' | 'FLASHCARDS' | 'WIDGETS'>('MISSION_CONTROL');"
)
page = page.replace(
    "useState<'ACTION_ITEMS' | 'WIDGETS' | 'HIDDEN'>('WIDGETS');",
    "useState<'ACTION_ITEMS' | 'FLASHCARDS' | 'HIDDEN'>('ACTION_ITEMS');"
)

# Main content routing
page = page.replace(
    "{activeTab === 'FLASHCARDS' && <FlashcardManager ctx={ctx} />}",
    "{activeTab === 'FLASHCARDS' && <FlashcardManager ctx={ctx} />}\n            {activeTab === 'WIDGETS' && <WidgetPanel appConfig={appConfig} />}"
)

# Right Panel Tabs
page = page.replace(
    "onClick={() => setRightPanelMode('WIDGETS')}>WIDGETS</button>",
    "onClick={() => setRightPanelMode('FLASHCARDS')}>CARDS</button>"
)
page = page.replace(
    "rightPanelMode === 'WIDGETS'",
    "rightPanelMode === 'FLASHCARDS'"
)

# Right Panel Content
page = page.replace(
    "{rightPanelMode === 'FLASHCARDS' && <WidgetPanel appConfig={appConfig} />}",
    "{rightPanelMode === 'FLASHCARDS' && <FlashcardOverview ctx={ctx} />}"
)

with open('src/app/page.tsx', 'w') as f:
    f.write(page)
