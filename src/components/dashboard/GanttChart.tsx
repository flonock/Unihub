import React, { useMemo } from 'react';
import { GanttChart as AtlasGantt, Task } from './AtlasGanttChart';
import { format } from 'date-fns';

export default function GanttChart({ ctx }: { ctx: any }) {
    const { data, saveData, asyncPrompt } = ctx;

    const tasks: Task[] = useMemo(() => {
        const t: Task[] = [];
        
        // Map exams to Milestones
        if (data.exams) {
            data.exams.forEach((exam: any) => {
                if (!exam.date) return;
                t.push({
                    id: `exam-${exam.id}`,
                    title: exam.name,
                    status: 'To Do',
                    priority: 'Medium',
                    due: exam.date,
                    startDate: exam.date,
                    endDate: exam.date,
                    type: 'Milestone'
                });
            });
        }

        // Map events to Tasks or Events
        if (data.events) {
            data.events.forEach((ev: any) => {
                t.push({
                    id: `event-${ev.id}`,
                    title: ev.title,
                    status: 'To Do',
                    priority: 'Medium',
                    due: ev.endDate || ev.startDate,
                    startDate: ev.startDate,
                    endDate: ev.endDate || ev.startDate,
                    type: ev.type === 'Task' || ev.type === 'Phase' ? ev.type : 'Event'
                });
            });
        }

        return t;
    }, [data.exams, data.events]);

    const handleTaskUpdate = (updatedTask: Task) => {
        if (updatedTask.id.startsWith('exam-')) {
            const examId = updatedTask.id.replace('exam-', '');
            const updatedExams = (data.exams || []).map((e: any) => 
                e.id === examId ? { ...e, date: updatedTask.startDate } : e
            );
            saveData({ ...data, exams: updatedExams });
        } else if (updatedTask.id.startsWith('event-')) {
            const eventId = updatedTask.id.replace('event-', '');
            const updatedEvents = (data.events || []).map((e: any) => 
                e.id === eventId ? { ...e, startDate: updatedTask.startDate, endDate: updatedTask.endDate } : e
            );
            saveData({ ...data, events: updatedEvents });
        }
    };

    const handleDrawTask = async (startDate: string, endDate: string) => {
        const title = await asyncPrompt("Enter Event Title:", "");
        if (!title) return;
        const newEv = {
            id: Date.now().toString(),
            title,
            startDate,
            endDate,
            type: 'Event'
        };
        saveData({ ...data, events: [...(data.events || []), newEv] });
    };

    const handleDeleteTask = async (taskId: string) => {
        if (taskId.startsWith('exam-')) {
            const examId = taskId.replace('exam-', '');
            saveData({ ...data, exams: (data.exams || []).filter((e: any) => e.id !== examId) });
        } else if (taskId.startsWith('event-')) {
            const eventId = taskId.replace('event-', '');
            saveData({ ...data, events: (data.events || []).filter((e: any) => e.id !== eventId) });
        }
    };

    const handleEditTask = async (task: Task) => {
        const newTitle = await asyncPrompt("Edit Title:", task.title);
        if (!newTitle) return;
        
        if (task.id.startsWith('exam-')) {
            const examId = task.id.replace('exam-', '');
            const updatedExams = (data.exams || []).map((e: any) => 
                e.id === examId ? { ...e, name: newTitle } : e
            );
            saveData({ ...data, exams: updatedExams });
        } else if (task.id.startsWith('event-')) {
            const eventId = task.id.replace('event-', '');
            const updatedEvents = (data.events || []).map((e: any) => 
                e.id === eventId ? { ...e, title: newTitle } : e
            );
            saveData({ ...data, events: updatedEvents });
        }
    };

    return (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '20px', height: '100%', minHeight: '600px' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                <h2 style={{ color: 'var(--gold)', margin: 0, fontSize: '1.5rem' }}>&gt; TIMELINE & GANTT CHART</h2>
            </div>
            
            <div style={{ flex: 1, minHeight: 0 }}>
                <AtlasGantt 
                    tasks={tasks}
                    onTaskUpdate={handleTaskUpdate}
                    onDrawTask={handleDrawTask}
                    onDeleteTask={handleDeleteTask}
                    onEditTask={handleEditTask}
                />
            </div>
        </div>
    );
}
