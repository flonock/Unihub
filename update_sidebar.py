with open('src/components/layout/Sidebar.tsx', 'r') as f:
    sidebar = f.read()

sidebar = sidebar.replace(
    '''<Icons.Plus size={14} /> FLASHCARD DB
         </button>
      </div>''',
    '''<Icons.Plus size={14} /> FLASHCARD DB
         </button>
         <button className="button" style={{ borderColor: activeTab === 'WIDGETS' ? 'var(--foam)' : 'var(--muted)', color: activeTab === 'WIDGETS' ? 'var(--foam)' : 'var(--text)', justifyContent: 'flex-start' }} onClick={() => setActiveTab('WIDGETS')}>
             <Icons.Plus size={14} /> UTILITIES
         </button>
      </div>'''
)

with open('src/components/layout/Sidebar.tsx', 'w') as f:
    f.write(sidebar)
