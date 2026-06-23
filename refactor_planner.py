import re

with open('src/components/planner/Planner.tsx', 'r') as f:
    planner = f.read()

# Change the main grid to column flex
planner = planner.replace(
    "<div style={{ display: 'grid', gridTemplateColumns: '2.5fr 1fr', gap: '30px' }}>",
    "<div style={{ display: 'flex', flexDirection: 'column', gap: '30px' }}>"
)

# Fix the Add/Edit form layout to flex wrap
planner = planner.replace(
    "<div style={{ display: 'flex', gap: '10px', marginTop: '20px', background: 'var(--surface)', padding: '15px', border: `1px ${editingEventId ? 'solid var(--foam)' : 'solid var(--muted)'}`, borderRadius: '4px' }}>",
    "<div style={{ display: 'flex', flexDirection: 'column', gap: '10px', marginTop: '20px', background: 'var(--surface)', padding: '15px', border: `1px ${editingEventId ? 'solid var(--foam)' : 'solid var(--muted)'}`, borderRadius: '4px' }}>"
)

# And inside the Add/Edit Form, we need to wrap the dates
planner = planner.replace(
    '''<input type="date" value={newEventStart} onChange={e => setNewEventStart(e.target.value)} style={{ flex: 1, background: 'var(--base)', color: 'var(--text)', border: 'none', borderBottom: '1px solid var(--muted)', padding: '5px', outline: 'none', fontFamily: 'inherit' }} />
                <span style={{ color: 'var(--muted)', alignSelf: 'center' }}>to</span>
                <input type="date" value={newEventEnd} onChange={e => setNewEventEnd(e.target.value)} style={{ flex: 1, background: 'var(--base)', color: 'var(--text)', border: 'none', borderBottom: '1px solid var(--muted)', padding: '5px', outline: 'none', fontFamily: 'inherit' }} />''',
    '''<div style={{ display: 'flex', gap: '10px', alignItems: 'center' }}>
                  <input type="date" value={newEventStart} onChange={e => setNewEventStart(e.target.value)} style={{ flex: 1, background: 'var(--base)', color: 'var(--text)', border: 'none', borderBottom: '1px solid var(--muted)', padding: '5px', outline: 'none', fontFamily: 'inherit' }} />
                  <span style={{ color: 'var(--muted)' }}>to</span>
                  <input type="date" value={newEventEnd} onChange={e => setNewEventEnd(e.target.value)} style={{ flex: 1, background: 'var(--base)', color: 'var(--text)', border: 'none', borderBottom: '1px solid var(--muted)', padding: '5px', outline: 'none', fontFamily: 'inherit' }} />
                </div>'''
)

planner = planner.replace(
    '''<button className="button" onClick={handleAddOrUpdateEvent} style={{ padding: '5px 15px' }}>
                   {editingEventId ? 'Update' : 'Add'}
                </button>
                {editingEventId && (
                   <button className="button" onClick={cancelEditEvent} style={{ color: 'var(--love)', borderColor: 'var(--love)' }}>Cancel</button>
                )}''',
    '''<div style={{ display: 'flex', gap: '10px' }}>
                  <button className="button" onClick={handleAddOrUpdateEvent} style={{ flex: 1, padding: '5px 15px' }}>
                     {editingEventId ? 'Update' : 'Add'}
                  </button>
                  {editingEventId && (
                     <button className="button" onClick={cancelEditEvent} style={{ flex: 1, color: 'var(--love)', borderColor: 'var(--love)' }}>Cancel</button>
                  )}
                </div>'''
)

with open('src/components/planner/Planner.tsx', 'w') as f:
    f.write(planner)

print("Planner layout fixed!")
