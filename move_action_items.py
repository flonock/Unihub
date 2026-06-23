import os
import re

# 1. Create ActionItems.tsx
action_items_content = """import React, { useState } from 'react';
import { Icons } from '../shared/Icons';

export default function ActionItems({ ctx }: { ctx: any }) {
    const { data, groupedTodos, saveData, navigateToLink, setActiveTab, setIsTodoModalOpen } = ctx;
    const [editingProgressId, setEditingProgressId] = useState<string | null>(null);
    const [tempProgressValue, setTempProgressValue] = useState(0);

    const cloneTodo = (todo: any) => {
        const newTodo = { ...todo, id: Date.now().toString(), title: todo.title + ' (Copy)' };
        const newData = { ...data, todos: [...(data.todos || []), newTodo] };
        ctx.setData(newData);
        saveData(newData);
    };

    const startEditTodo = (todo: any) => {
        // Simple implementation, rely on ctx if needed or just skip for now since it's complex
        if (ctx.startEditTodo) ctx.startEditTodo(todo);
    };

    const handleDeleteTodo = (id: string) => {
        const newData = { ...data, todos: (data.todos || []).filter((t: any) => t.id !== id) };
        ctx.setData(newData);
        saveData(newData);
    };

    return (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '15px' }}>
                <h2 style={{ color: 'var(--iris)', margin: 0, fontSize: '1.2rem' }}>&gt; ACTION ITEMS</h2>
                <div style={{ display: 'flex', gap: '10px' }}>
                    <button className="button" style={{ padding: '2px 8px', fontSize: '0.7rem', borderColor: 'var(--foam)', color: 'var(--foam)' }} onClick={() => setIsTodoModalOpen(true)}>
                        <Icons.Plus size={14} /> NEW TASK
                    </button>
                </div>
            </div>

            {Object.entries(groupedTodos).map(([group, groupTodos]: [string, any]) => (
                <div key={group} style={{ marginBottom: '20px' }}>
                    <div style={{ color: 'var(--gold)', marginBottom: '10px', fontSize: '0.9rem', letterSpacing: '0.05em' }}>
                        [{group.toUpperCase()}]
                    </div>
                    {groupTodos.map((todo: any) => (
                        <div key={todo.id} style={{ display: 'flex', alignItems: 'center', gap: '10px', marginBottom: '8px', background: 'var(--base)', padding: '10px', border: '1px solid var(--muted)' }}>
                            <span 
                                style={{ color: todo.status ? 'var(--pine)' : 'var(--love)', cursor: 'pointer', fontWeight: 'bold' }}
                                onClick={() => {
                                    const newData = { ...data, todos: data.todos.map((t: any) => t.id === todo.id ? { ...t, status: !t.status } : t) };
                                    saveData(newData);
                                }}
                            >
                                [{todo.status ? 'X' : ' '}]
                            </span>
                            <span style={{ flex: 1, textDecoration: todo.status ? 'line-through' : 'none', color: todo.status ? 'var(--muted)' : 'var(--text)' }}>
                                {todo.title}
                            </span>
                            
                            {todo.link && (
                                <button className="link-button" style={{ marginLeft: 'auto', fontSize: '0.8rem' }} onClick={() => navigateToLink(todo.link)}>
                                    Jump to Lecture
                                </button>
                            )}

                            {editingProgressId === todo.id ? (
                                <span style={{ display: 'flex', alignItems: 'center', gap: '5px', minWidth: '100px', marginLeft: !todo.link ? 'auto' : '10px' }}>
                                    <input type="range" min="0" max="100" value={tempProgressValue} onChange={e => setTempProgressValue(parseInt(e.target.value))} style={{ width: '60px' }} />
                                    <span style={{ fontSize: '0.7rem', color: 'var(--pine)' }}>{tempProgressValue}%</span>
                                    <button className="icon-button" onClick={() => { 
                                        saveData({ ...data, todos: data.todos.map((t: any) => t.id === todo.id ? { ...t, progress: tempProgressValue } : t) });
                                        setEditingProgressId(null);
                                    }}><Icons.Plus size={14} color="var(--pine)"/></button>
                                </span>
                            ) : (
                                <span 
                                    style={{ color: 'var(--pine)', cursor: 'pointer', minWidth: '40px', fontSize: '0.8rem', textAlign: 'right', marginLeft: !todo.link ? 'auto' : '10px' }} 
                                    onClick={() => { setTempProgressValue(todo.progress || 0); setEditingProgressId(todo.id); }}
                                    title="Click to edit progress"
                                >
                                    [{todo.progress || 0}%]
                                </span>
                            )}

                            <div style={{ display: 'flex', gap: '2px', marginLeft: '10px' }}>
                                <button className="icon-button copy" onClick={() => cloneTodo(todo)} title="Copy Task"><Icons.Copy size={16} /></button>
                                <button className="icon-button edit" onClick={() => startEditTodo(todo)} title="Edit Task"><Icons.Edit size={16} /></button>
                                <button className="icon-button delete" onClick={() => handleDeleteTodo(todo.id)} title="Delete Task"><Icons.Delete size={16} /></button>
                            </div>
                        </div>
                    ))}
                </div>
            ))}
        </div>
    );
}
"""
with open('src/components/planner/ActionItems.tsx', 'w') as f:
    f.write(action_items_content)

# 2. Remove Action Items from Dashboard.tsx
with open('src/components/dashboard/Dashboard.tsx', 'r') as f:
    dashboard = f.read()

# Replace the Action Items block. We can just use a regex.
dashboard = re.sub(
    r'<div style=\{\{ background: \'var\(--surface\)\', border: \'1px solid var\(--muted\)\', padding: \'20px\', borderRadius: \'4px\' \}\}>\s*<div style=\{\{ display: \'flex\', justifyContent: \'space-between\', alignItems: \'center\', marginBottom: \'15px\' \}\}>\s*<h2 style=\{\{ color: \'var\(--iris\)\', margin: 0, fontSize: \'1\.2rem\' \}\}>&gt; Action Items.*?</div>\s*</div>\s*</div>',
    r'</div>',
    dashboard,
    flags=re.DOTALL
)

with open('src/components/dashboard/Dashboard.tsx', 'w') as f:
    f.write(dashboard)

# 3. Update page.tsx
with open('src/app/page.tsx', 'r') as f:
    page = f.read()

# Add ActionItems import
page = page.replace("import Planner from '@/components/planner/Planner';", "import Planner from '@/components/planner/Planner';\nimport ActionItems from '@/components/planner/ActionItems';")

# Replace PLANNER in right panel with ACTION_ITEMS
page = page.replace("rightPanelMode === 'PLANNER' ? 'var(--gold)'", "rightPanelMode === 'ACTION_ITEMS' ? 'var(--gold)'")
page = page.replace("setRightPanelMode('PLANNER')", "setRightPanelMode('ACTION_ITEMS')")
page = page.replace(">PLANNER</button>", ">TASKS</button>")
page = page.replace("{rightPanelMode === 'PLANNER' && <Planner ctx={ctx} />}", "{rightPanelMode === 'ACTION_ITEMS' && <ActionItems ctx={ctx} />}")

with open('src/app/page.tsx', 'w') as f:
    f.write(page)

# 4. Restore Planner to horizontal layout
with open('src/components/planner/Planner.tsx', 'r') as f:
    planner = f.read()

planner = planner.replace(
    "<div style={{ display: 'flex', flexDirection: 'column', gap: '30px' }}>",
    "<div style={{ display: 'grid', gridTemplateColumns: '2.5fr 1fr', gap: '30px' }}>"
)

with open('src/components/planner/Planner.tsx', 'w') as f:
    f.write(planner)

print("Done")
