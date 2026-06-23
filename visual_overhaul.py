import re

# 1. Update LectureNexus.tsx
with open('src/components/lecture/LectureNexus.tsx', 'r') as f:
    nexus = f.read()

# Document Matrix files
nexus = nexus.replace('className="sub-panel"', 'className="sub-panel hover-glow"')

# Task items
nexus = nexus.replace(
    '''style={{ display: 'flex', alignItems: 'center', gap: '10px', marginBottom: '8px', background: 'var(--base)', padding: '10px', border: '1px solid var(--muted)' }}''',
    '''className="hover-glow" style={{ display: 'flex', alignItems: 'center', gap: '10px', marginBottom: '8px', background: 'var(--base)', padding: '10px', border: '1px solid var(--muted)', borderLeft: '4px solid ' + (todo.status ? 'var(--pine)' : 'var(--love)') }}'''
)

# Exam items
nexus = nexus.replace(
    '''style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '10px', background: 'var(--base)', padding: '10px', border: '1px solid var(--muted)' }}''',
    '''className="hover-glow" style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '10px', background: 'var(--base)', padding: '10px', border: '1px solid var(--muted)', borderLeft: '4px solid var(--gold)' }}'''
)

# Flashcard decks
nexus = nexus.replace(
    '''style={{ padding: '15px', background: 'var(--base)', border: '1px solid var(--muted)' }}''',
    '''className="hover-glow" style={{ padding: '15px', background: 'var(--base)', border: '1px solid var(--muted)', borderLeft: '4px solid var(--iris)' }}'''
)

with open('src/components/lecture/LectureNexus.tsx', 'w') as f:
    f.write(nexus)

# 2. Update Planner.tsx
with open('src/components/planner/Planner.tsx', 'r') as f:
    planner = f.read()

# Calendar items
planner = planner.replace(
    '''<div key={dateStr} style={{ border: `1px solid ${isToday ? 'var(--foam)' : 'var(--muted)'}`, minHeight: '90px', padding: '5px', background: 'var(--base)', display: 'flex', flexDirection: 'column' }}>''',
    '''<div key={dateStr} className="hover-glow" style={{ border: `1px solid ${isToday ? 'var(--foam)' : 'var(--muted)'}`, minHeight: '90px', padding: '5px', background: 'var(--base)', display: 'flex', flexDirection: 'column' }}>'''
)

# Event Manager
planner = planner.replace(
    '''style={{ marginBottom: '15px', border: '1px solid var(--muted)', padding: '10px', background: 'var(--base)' }}''',
    '''className="hover-glow" style={{ marginBottom: '15px', border: '1px solid var(--muted)', padding: '10px', background: 'var(--base)', borderLeft: '4px solid ' + (ev.type === 'study' ? 'var(--pine)' : 'var(--gold)') }}'''
)

with open('src/components/planner/Planner.tsx', 'w') as f:
    f.write(planner)

# 3. Update ActionItems.tsx
with open('src/components/planner/ActionItems.tsx', 'r') as f:
    action_items = f.read()

action_items = action_items.replace(
    '''style={{ display: 'flex', alignItems: 'center', gap: '10px', marginBottom: '8px', background: 'var(--base)', padding: '10px', border: '1px solid var(--muted)' }}''',
    '''className="hover-glow" style={{ display: 'flex', alignItems: 'center', gap: '10px', marginBottom: '8px', background: 'var(--base)', padding: '10px', border: '1px solid var(--muted)', borderLeft: '4px solid ' + (todo.status ? 'var(--pine)' : 'var(--love)') }}'''
)

with open('src/components/planner/ActionItems.tsx', 'w') as f:
    f.write(action_items)

# 4. Update FlashcardManager.tsx
with open('src/components/flashcards/FlashcardManager.tsx', 'r') as f:
    flashcards = f.read()

# Decks
flashcards = flashcards.replace(
    '''style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', border: '1px solid var(--muted)', background: 'var(--base)', padding: '15px', borderRadius: '4px' }}''',
    '''className="hover-glow" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', border: '1px solid var(--muted)', background: 'var(--base)', padding: '15px', borderRadius: '4px', borderLeft: '4px solid var(--iris)' }}'''
)

# Sessions
flashcards = flashcards.replace(
    '''style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', border: '1px solid var(--pine)', background: 'var(--base)', padding: '15px', borderRadius: '4px' }}''',
    '''className="hover-glow" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', border: '1px solid var(--pine)', background: 'var(--base)', padding: '15px', borderRadius: '4px', borderLeft: '4px solid var(--pine)' }}'''
)

with open('src/components/flashcards/FlashcardManager.tsx', 'w') as f:
    f.write(flashcards)

print("Visual overhaul complete!")
