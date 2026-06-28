import re

with open('src/components/layout/Sidebar.tsx', 'r') as f:
    content = f.read()

new_button = """         <button className="button" style={{ borderColor: activeTab === 'GANTT' ? 'var(--gold)' : 'var(--muted)', color: activeTab === 'GANTT' ? 'var(--gold)' : 'var(--text)', justifyContent: 'flex-start' }} onClick={() => setActiveTab('GANTT')}>
             <Icons.Plus size={14} /> GANTT CHART
         </button>
      </div>"""

content = content.replace("      </div>\n\n      {/* SEMESTER SELECTOR */}", new_button + "\n\n      {/* SEMESTER SELECTOR */}")

with open('src/components/layout/Sidebar.tsx', 'w') as f:
    f.write(content)

