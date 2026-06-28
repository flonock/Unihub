import re

with open('src/app/page.tsx', 'r') as f:
    content = f.read()

# Add import
import_stmt = "import GanttChart from '@/components/gantt/GanttChart';\n"
if "import GanttChart" not in content:
    # try to put it after import Dashboard
    content = content.replace("import Dashboard from '@/components/dashboard/Dashboard';", "import Dashboard from '@/components/dashboard/Dashboard';\nimport GanttChart from '@/components/dashboard/GanttChart';")

# Update activeTab type
content = content.replace("useState<'MISSION_CONTROL' | 'BROWSER' | 'PLANNER' | 'OVERVIEW' | 'FLASHCARDS' | 'WIDGETS'>", "useState<'MISSION_CONTROL' | 'BROWSER' | 'PLANNER' | 'OVERVIEW' | 'FLASHCARDS' | 'WIDGETS' | 'GANTT'>")

# Add render logic
render_stmt = "        {activeTab === 'MISSION_CONTROL' && <Dashboard ctx={ctx} />}\n        {activeTab === 'GANTT' && <GanttChart ctx={ctx} />}"
content = content.replace("{activeTab === 'MISSION_CONTROL' && <Dashboard ctx={ctx} />}", render_stmt)

with open('src/app/page.tsx', 'w') as f:
    f.write(content)

