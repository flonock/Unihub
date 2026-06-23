import React, { useState } from 'react';
import { Icons } from '../shared/Icons';

export default function ActionItems({ ctx }: { ctx: any }) {
    const { data, groupedTodos, saveData, navigateToLink, setActiveTab } = ctx;
    const [isTodoModalOpen, setIsTodoModalOpen] = useState(false);
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
                        <div key={todo.id} className="hover-glow" style={{ display: 'flex', alignItems: 'center', gap: '10px', marginBottom: '8px', background: 'var(--base)', padding: '10px', border: '1px solid var(--muted)', borderLeft: '4px solid ' + (todo.status ? 'var(--pine)' : 'var(--love)') }}>
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

            {(isTodoModalOpen || ctx.editingTodoId) && (
                <div style={{ position: 'fixed', top: 0, left: 0, right: 0, bottom: 0, backgroundColor: 'rgba(0,0,0,0.7)', zIndex: 9999, display: 'flex', justifyContent: 'center', paddingTop: '10vh', backdropFilter: 'blur(4px)' }} onClick={() => { setIsTodoModalOpen(false); if (ctx.cancelEditTodo) ctx.cancelEditTodo(); }}>
                    <div style={{ background: 'var(--base)', border: '1px solid var(--muted)', width: '500px', maxWidth: '90vw', borderRadius: '8px', padding: '30px', display: 'flex', flexDirection: 'column', gap: '15px', boxShadow: '0 10px 30px rgba(0,0,0,0.5)' }} onClick={e => e.stopPropagation()}>
                        <h2 style={{ margin: 0, color: 'var(--foam)', fontSize: '1.2rem' }}>{ctx.editingTodoId ? 'Edit Task' : 'New Task'}</h2>
                        
                        <div>
                            <label style={{ display: 'block', marginBottom: '5px', color: 'var(--subtle)', fontSize: '0.9rem' }}>Task Title</label>
                            <input 
                                autoFocus
                                value={ctx.newTodoTitle} 
                                onChange={e => ctx.setNewTodoTitle(e.target.value)} 
                                style={{ width: '100%', padding: '10px', background: 'var(--surface)', color: 'var(--text)', border: '1px solid var(--muted)', outline: 'none', borderRadius: '4px' }}
                            />
                        </div>

                        <div>
                            <label style={{ display: 'block', marginBottom: '5px', color: 'var(--subtle)', fontSize: '0.9rem' }}>Linked Lecture (Optional)</label>
                            <input 
                                value={ctx.newTodoLink} 
                                onChange={e => ctx.setNewTodoLink(e.target.value)} 
                                placeholder="e.g. L1"
                                style={{ width: '100%', padding: '10px', background: 'var(--surface)', color: 'var(--text)', border: '1px solid var(--muted)', outline: 'none', borderRadius: '4px' }}
                            />
                        </div>
                        
                        <div style={{ display: 'flex', gap: '15px' }}>
                            <div style={{ flex: 1 }}>
                                <label style={{ display: 'block', marginBottom: '5px', color: 'var(--subtle)', fontSize: '0.9rem' }}>Progress (%)</label>
                                <input 
                                    type="number" 
                                    min="0" max="100"
                                    value={ctx.newTodoProgress} 
                                    onChange={e => ctx.setNewTodoProgress(parseInt(e.target.value) || 0)} 
                                    style={{ width: '100%', padding: '10px', background: 'var(--surface)', color: 'var(--text)', border: '1px solid var(--muted)', outline: 'none', borderRadius: '4px' }}
                                />
                            </div>
                            <div style={{ flex: 1 }}>
                                <label style={{ display: 'block', marginBottom: '5px', color: 'var(--subtle)', fontSize: '0.9rem' }}>Due Date</label>
                                <input 
                                    type="date"
                                    value={ctx.newTodoDueDate} 
                                    onChange={e => ctx.setNewTodoDueDate(e.target.value)} 
                                    style={{ width: '100%', padding: '10px', background: 'var(--surface)', color: 'var(--text)', border: '1px solid var(--muted)', outline: 'none', borderRadius: '4px' }}
                                />
                            </div>
                        </div>

                        <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '10px', marginTop: '10px' }}>
                            <button className="button" onClick={() => { setIsTodoModalOpen(false); if (ctx.cancelEditTodo) ctx.cancelEditTodo(); }} style={{ borderColor: 'var(--love)', color: 'var(--love)', padding: '5px 15px' }}>Cancel</button>
                            <button className="button" onClick={() => { ctx.handleAddOrUpdateTodo(); setIsTodoModalOpen(false); }} style={{ borderColor: 'var(--pine)', color: 'var(--pine)', padding: '5px 15px' }}>Save</button>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
}
