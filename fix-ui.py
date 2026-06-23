import re

# 1. Update Dashboard.tsx
with open('src/components/dashboard/Dashboard.tsx', 'r') as f:
    dashboard = f.read()

# Remove Emergency Override
dashboard = re.sub(
    r'\{\/\* QUICK START WIDGET \*\/\}.*?\{\/\* UP NEXT WIDGET \(Formally Active Study Sessions\) \*\/\}\n',
    r'{/* UP NEXT WIDGET (Formally Active Study Sessions) */}\n',
    dashboard,
    flags=re.DOTALL
)

# Neutral Titles
dashboard = dashboard.replace('> URGENCY MATRIX (EXAMS & LECTURES)', 'Urgency Overview (Exams & Lectures)')
dashboard = dashboard.replace('> UP NEXT: STUDY SESSIONS', 'Upcoming Study Sessions')
dashboard = dashboard.replace('> ACTION ITEMS', 'Action Items')
dashboard = dashboard.replace('[MANAGE DECKS]', 'Manage Decks')
dashboard = dashboard.replace('[EVENT MANAGER]', 'Event Manager')
dashboard = dashboard.replace('[JUMP TO LECTURE]', 'Jump to Lecture')


with open('src/components/dashboard/Dashboard.tsx', 'w') as f:
    f.write(dashboard)

# 2. Update LectureNexus.tsx
with open('src/components/lecture/LectureNexus.tsx', 'r') as f:
    nexus = f.read()

nexus = nexus.replace('> DOCUMENTS MATRIX', 'Documents')
nexus = nexus.replace('> NEURAL LINK (FLASHCARDS)', 'Flashcards')
nexus = nexus.replace('> SCRATCHPAD', 'Scratchpad')
nexus = nexus.replace('> TACTICAL OBJECTIVES', 'Tasks')
nexus = nexus.replace('> CRITICAL MILESTONES (EXAMS)', 'Exams')
nexus = nexus.replace('&gt; INITIALIZE STUDY SESSION', 'Start Study Session')
nexus = nexus.replace('+ CREATE STUDY SESSION', 'Create Study Session')
nexus = nexus.replace('[MANAGE DECKS]', 'Manage Decks')
nexus = nexus.replace('[.. GO UP]', '.. Go Up')

# 3. PDF toolbar=0 and Expand Button
# Find the iframe and header
old_iframe_block = r'''<div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '10px' }}>
                         <span style={{ color: 'var(--text)', fontWeight: 'bold' }}>{inlinePreviewFile.name}</span>
                         <button className="button" style={{ padding: '2px 8px', fontSize: '0.7rem', color: 'var(--love)', borderColor: 'var(--love)' }} onClick={() => setInlinePreviewFile(null)}>CLOSE PREVIEW</button>
                      </div>
                      <iframe src={`/api/serve-file?path=${encodeURIComponent(inlinePreviewFile.path)}`} style={{ flex: 1, width: '100%', border: '1px solid var(--muted)', background: 'white' }} />'''

new_iframe_block = r'''<div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '10px' }}>
                         <span style={{ color: 'var(--text)', fontWeight: 'bold' }}>{inlinePreviewFile.name}</span>
                         <div style={{ display: 'flex', gap: '10px' }}>
                            <button className="button" style={{ padding: '2px 8px', fontSize: '0.7rem' }} onClick={() => { handleOpen(inlinePreviewFile); setInlinePreviewFile(null); }}>EXPAND</button>
                            <button className="button" style={{ padding: '2px 8px', fontSize: '0.7rem', color: 'var(--love)', borderColor: 'var(--love)' }} onClick={() => setInlinePreviewFile(null)}>CLOSE</button>
                         </div>
                      </div>
                      <iframe src={`/api/serve-file?path=${encodeURIComponent(inlinePreviewFile.path)}#toolbar=0&navpanes=0&scrollbar=0`} style={{ flex: 1, width: '100%', border: '1px solid var(--muted)', background: 'white' }} />'''

nexus = nexus.replace(old_iframe_block, new_iframe_block)

with open('src/components/lecture/LectureNexus.tsx', 'w') as f:
    f.write(nexus)

print("UI tweaks applied!")
