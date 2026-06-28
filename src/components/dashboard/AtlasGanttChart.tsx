import React, { useMemo, useRef, useState, useEffect } from "react";
import { motion } from 'framer-motion';
import { addDays, addWeeks, addMonths, differenceInDays, parseISO, format, min, max, isValid, isBefore, isAfter } from "date-fns";
export interface Task {
 id: string;
 title: string;
 priority: string;
 importance?: 'High' | 'Medium' | 'Low';
 urgency?: 'High' | 'Medium' | 'Low';
 due: string;
 status: string;
 startDate?: string;
 endDate?: string;
 dependencies?: string[];
 type?: 'Task' | 'Phase' | 'Event' | 'Milestone';
 phaseId?: string;
 progress?: number;
 notes?: string;
 recurrence?: 'none' | 'daily' | 'weekly' | 'monthly';
 recurrenceEndDate?: string;
 parentId?: string;
 estimatedHours?: number;
 actualHours?: number;
}

export function resolveDependencies(task: Task, allTasks: Task[]): string[] {
  if (!task.dependencies) return [];
  const resolved = new Set<string>();
  for (const depId of task.dependencies) {
    const depTask = allTasks.find(t => t.id === depId);
    if (depTask?.type === 'Phase') {
      const phaseTasks = allTasks.filter(t => t.phaseId === depTask.id);
      if (phaseTasks.length > 0) {
        const sorted = [...phaseTasks].sort((a, b) => {
           const dateA = a.endDate || a.due || a.startDate || "";
           const dateB = b.endDate || b.due || b.startDate || "";
           return dateB.localeCompare(dateA);
        });
        resolved.add(sorted[0].id);
      } else {
        resolved.add(depId);
      }
    } else {
      resolved.add(depId);
    }
  }
  return Array.from(resolved);
}
import { ChevronDown, ChevronRight, ZoomIn, ZoomOut, RotateCcw, Layers, Flag, CheckSquare, Milestone, Trash2 } from "lucide-react";

interface GanttChartProps {
 tasks: Task[];
 onTaskUpdate?: (task: Task) => void;
 onDrawTask?: (startDate: string, endDate: string) => void;
 onEditTask?: (task: Task) => void;
 onDoubleClickTask?: (task: Task) => void;
 onDeleteTask?: (taskId: string) => void;
}

export function GanttChart({ tasks, onTaskUpdate, onDrawTask, onEditTask, onDoubleClickTask, onDeleteTask }: GanttChartProps) {
 const containerRef = useRef<HTMLDivElement>(null);
 const scrollRef = useRef<HTMLDivElement>(null);

 const [zoomLevel, setZoomLevel] = useState(1);
 const DAY_WIDTH = Math.round(48 * zoomLevel);

 const [isDrawing, setIsDrawing] = useState(false);
 const [drawStartX, setDrawStartX] = useState(0);
 const [drawCurrentX, setDrawCurrentX] = useState(0);
 const [showCriticalPath, setShowCriticalPath] = useState(false);

 const [resizingTask, setResizingTask] = useState<{ id: string, edge: 'left' | 'right', startX: number, initialStart: Date, initialEnd: Date } | null>(null);
 const [draggingTask, setDraggingTask] = useState<{ id: string, startX: number, initialStart: Date, initialEnd: Date } | null>(null);
 const [hoveredTaskId, setHoveredTaskId] = useState<string | null>(null);

 const [isSpacePressed, setIsSpacePressed] = useState(false);
 const [isPanning, setIsPanning] = useState(false);
 const [panStart, setPanStart] = useState({ x: 0, y: 0, scrollLeft: 0, scrollTop: 0 });

 useEffect(() => {
 const handleKeyDown = (e: KeyboardEvent) => { 
 if (e.code === 'Space' && (e.target === document.body || e.target === document.documentElement)) { 
 e.preventDefault(); 
 setIsSpacePressed(true); 
 } 
 };
 const handleKeyUp = (e: KeyboardEvent) => { 
 if (e.code === 'Space') setIsSpacePressed(false); 
 };
 window.addEventListener('keydown', handleKeyDown);
 window.addEventListener('keyup', handleKeyUp);
 return () => { 
 window.removeEventListener('keydown', handleKeyDown); 
 window.removeEventListener('keyup', handleKeyUp); 
 };
 }, []);

 const [collapsedPhases, setCollapsedPhases] = useState<Set<string>>(new Set());

 const timelineTasks = useMemo(() => {
 const today = new Date();
 // 1. Parse dates for all tasks
 let mappedTasks = tasks.map(t => {
 let start = t.startDate ? parseISO(t.startDate) : today;
 let end = t.endDate ? parseISO(t.endDate) : addDays(start, 3);
 if (!isValid(start)) start = today;
 if (!isValid(end)) end = addDays(start, 3);
 return { ...t, start, end };
 });

 // 2. Auto-calculate Phase dates and progress based on children
 mappedTasks = mappedTasks.map(phase => {
 if (phase.type === 'Phase') {
 const children = mappedTasks.filter(t => t.phaseId === phase.id);
 if (children.length > 0) {
 const earliest = min(children.map(c => c.start));
 const latest = max(children.map(c => c.end));
 const totalProgress = children.reduce((sum, c) => sum + (c.progress || 0), 0);
 const avgProgress = children.length > 0 ? totalProgress / children.length : 0;
 return { ...phase, start: earliest, end: latest, progress: avgProgress };
 }
 }
 return phase;
 });

 // 3. Sort hierarchically: Phase -> Children -> Orphans
 const phases = mappedTasks.filter(t => t.type === 'Phase').sort((a, b) => a.start.getTime() - b.start.getTime());
 const finalSorted: typeof mappedTasks = [];
 
 phases.forEach(p => {
 finalSorted.push(p);
 if (!collapsedPhases.has(p.id)) {
 const children = mappedTasks.filter(t => t.phaseId === p.id).sort((a, b) => a.start.getTime() - b.start.getTime());
 finalSorted.push(...children);
 }
 });

 const orphans = mappedTasks.filter(t => t.type !== 'Phase' && !t.phaseId).sort((a, b) => a.start.getTime() - b.start.getTime());
 finalSorted.push(...orphans);

 return finalSorted;
 }, [tasks, collapsedPhases]);

 const criticalPathIds = useMemo(() => {
 if (!showCriticalPath || timelineTasks.length === 0) return new Set<string>();
 
 // Find the latest end date in the project
 let latestEnd = timelineTasks[0].end;
 let terminalTasks = [timelineTasks[0]];
 
 for (const t of timelineTasks) {
 if (t.end > latestEnd) {
 latestEnd = t.end;
 terminalTasks = [t];
 } else if (t.end.getTime() === latestEnd.getTime()) {
 terminalTasks.push(t);
 }
 }

 const cp = new Set<string>();
 
 // Backtrace dependencies
 const trace = (taskId: string) => {
 if (cp.has(taskId)) return;
 cp.add(taskId);
 const task = timelineTasks.find(t => t.id === taskId);
 const resolvedDeps = resolveDependencies(task as unknown as Task, tasks);
 if (resolvedDeps.length > 0) {
 resolvedDeps.forEach(depId => trace(depId));
 }
 };

 terminalTasks.forEach(t => trace(t.id));
 return cp;
 // eslint-disable-next-line react-hooks/exhaustive-deps
 }, [timelineTasks, showCriticalPath]);

 const [chartMinDate, setChartMinDate] = useState<Date | null>(null);
 const [chartMaxDate, setChartMaxDate] = useState<Date | null>(null);

 useEffect(() => {
 if (timelineTasks.length === 0) return;
 const starts = timelineTasks.map(t => t.start);
 const ends = timelineTasks.map(t => t.end);
 let minD = min(starts);
 let maxD = max(ends);
 minD = addDays(minD, -3);
 maxD = addDays(maxD, 7);
 
 // eslint-disable-next-line react-hooks/set-state-in-effect
 setChartMinDate(prev => {
 if (!prev) return minD;
 return minD < prev ? minD : prev;
 });
 
 setChartMaxDate(prev => {
 if (!prev) return maxD;
 return maxD > prev ? maxD : prev;
 });
 }, [timelineTasks]);

 const minDate = chartMinDate || addDays(new Date(), -3);
 const maxDate = chartMaxDate || addDays(new Date(), 14);
 const totalDays = Math.max(0, differenceInDays(maxDate, minDate));

 const days = useMemo(() => {
 const d = [];
 for (let i = 0; i <= totalDays; i++) {
 d.push(addDays(minDate, i));
 }
 return d;
 }, [minDate, totalDays]);

 const handleResizePointerDown = (e: React.PointerEvent, id: string, edge: 'left' | 'right', start: Date, end: Date) => {
 e.stopPropagation(); 
 e.preventDefault();
 setResizingTask({ id, edge, startX: e.clientX, initialStart: start, initialEnd: end });
 };

 const handleDragPointerDown = (e: React.PointerEvent, id: string, start: Date, end: Date) => {
 e.stopPropagation(); 
 e.preventDefault();
 setDraggingTask({ id, startX: e.clientX, initialStart: start, initialEnd: end });
 };

 useEffect(() => {
 if (!resizingTask && !draggingTask) return;

 const handlePointerMove = (e: PointerEvent) => {
 if (resizingTask) {
 const diffX = e.clientX - resizingTask.startX;
 const diffDays = Math.round(diffX / DAY_WIDTH);
 
 let newStart = resizingTask.initialStart;
 let newEnd = resizingTask.initialEnd;

 if (resizingTask.edge === 'left') {
 newStart = addDays(newStart, diffDays);
 if (newStart > newEnd) newStart = newEnd;
 } else {
 newEnd = addDays(newEnd, diffDays);
 if (newEnd < newStart) newEnd = newStart;
 }

 const taskToUpdate = tasks.find(t => t.id === resizingTask.id);
 if (taskToUpdate && onTaskUpdate) {
 onTaskUpdate({
 ...taskToUpdate,
 startDate: format(newStart, "yyyy-MM-dd"),
 endDate: format(newEnd, "yyyy-MM-dd")
 });
 }
 } else if (draggingTask) {
 const diffX = e.clientX - draggingTask.startX;
 const diffDays = Math.round(diffX / DAY_WIDTH);

 let newStart = draggingTask.initialStart;
 let newEnd = draggingTask.initialEnd;
 
 newStart = addDays(newStart, diffDays);
 newEnd = addDays(newEnd, diffDays);

 const taskToUpdate = tasks.find(t => t.id === draggingTask.id);
 if (taskToUpdate && onTaskUpdate) {
 onTaskUpdate({
 ...taskToUpdate,
 startDate: format(newStart, "yyyy-MM-dd"),
 endDate: format(newEnd, "yyyy-MM-dd")
 });
 }
 }
 };

 const handlePointerUp = () => {
 setResizingTask(null);
 setDraggingTask(null);
 };

 window.addEventListener('pointermove', handlePointerMove);
 window.addEventListener('pointerup', handlePointerUp);
 return () => {
 window.removeEventListener('pointermove', handlePointerMove);
 window.removeEventListener('pointerup', handlePointerUp);
 };
 }, [resizingTask, draggingTask, DAY_WIDTH, tasks, onTaskUpdate]);

 const handlePointerDown = (e: React.PointerEvent) => {
 if (!scrollRef.current) return;
 if ((e.target as HTMLElement).closest('.task-bar-element')) return;
 
 if (e.button === 1 || isSpacePressed) {
 e.preventDefault();
 setIsPanning(true);
 setPanStart({ x: e.clientX, y: e.clientY, scrollLeft: scrollRef.current.scrollLeft, scrollTop: scrollRef.current.scrollTop });
 (e.currentTarget as HTMLElement).setPointerCapture(e.pointerId);
 return;
 }

 if (!onDrawTask) return;
 e.preventDefault();
 const rect = scrollRef.current.getBoundingClientRect();
 const x = e.clientX - rect.left + scrollRef.current.scrollLeft;
 setIsDrawing(true);
 setDrawStartX(x);
 setDrawCurrentX(x);
 };

 const handlePointerMove = (e: React.PointerEvent) => {
 if (isPanning && scrollRef.current) {
 const dx = e.clientX - panStart.x;
 const dy = e.clientY - panStart.y;
 scrollRef.current.scrollLeft = panStart.scrollLeft - dx;
 scrollRef.current.scrollTop = panStart.scrollTop - dy;
 if (containerRef.current) containerRef.current.scrollLeft = panStart.scrollLeft - dx;
 return;
 }

 if (!isDrawing || !scrollRef.current) return;
 const rect = scrollRef.current.getBoundingClientRect();
 const x = e.clientX - rect.left + scrollRef.current.scrollLeft;
 setDrawCurrentX(x);
 };

 const handlePointerUp = (e: React.PointerEvent) => {
 if (isPanning) {
 setIsPanning(false);
 (e.currentTarget as HTMLElement).releasePointerCapture(e.pointerId);
 return;
 }

 if (!isDrawing) return;
 setIsDrawing(false);

 if (onDrawTask) {
 const leftX = Math.min(drawStartX, drawCurrentX);
 const rightX = Math.max(drawStartX, drawCurrentX);
 const width = rightX - leftX;

 if (width >= DAY_WIDTH / 2) {
 const startDayOffset = Math.round(leftX / DAY_WIDTH);
 const durationDays = Math.round(width / DAY_WIDTH) || 1;
 
 const newStart = addDays(minDate, startDayOffset);
 const newEnd = addDays(newStart, durationDays);

 onDrawTask(format(newStart, "yyyy-MM-dd"), format(newEnd, "yyyy-MM-dd"));
 }
 }
 };

 const initialScrollDone = useRef(false);

 useEffect(() => {
 if (!initialScrollDone.current && scrollRef.current && totalDays > 0) {
 const todayOffsetDays = differenceInDays(new Date(), minDate);
 const targetScrollLeft = (todayOffsetDays * DAY_WIDTH) - (scrollRef.current.clientWidth / 2);
 scrollRef.current.scrollLeft = Math.max(0, targetScrollLeft);
 if (containerRef.current) {
 containerRef.current.scrollLeft = Math.max(0, targetScrollLeft);
 }
 initialScrollDone.current = true;
 }
 }, [minDate, DAY_WIDTH, totalDays]);

 const handleGoToToday = () => {
 if (!scrollRef.current) return;
 const todayOffsetDays = differenceInDays(new Date(), minDate);
 const targetScrollLeft = (todayOffsetDays * DAY_WIDTH) - (scrollRef.current.clientWidth / 2);
 scrollRef.current.scrollLeft = Math.max(0, targetScrollLeft);
 if (containerRef.current) {
 containerRef.current.scrollLeft = Math.max(0, targetScrollLeft);
 };
 };

 const todayOffsetDays = differenceInDays(new Date(), minDate);

 const months = useMemo(() => {
 if (days.length === 0) return [];
 const m: { date: Date, days: number }[] = [];
 let currentMonth = days[0];
 let daysInMonth = 0;
 days.forEach(day => {
 if (day.getMonth() !== currentMonth.getMonth()) {
 m.push({ date: currentMonth, days: daysInMonth });
 currentMonth = day;
 daysInMonth = 1;
 } else {
 daysInMonth++;
 }
 });
 if (daysInMonth > 0) m.push({ date: currentMonth, days: daysInMonth });
 return m;
 }, [days]);

 return (
 <div className="panel rounded-lg overflow-hidden flex flex-col h-full border border-[#393552] select-none relative">
 <div className="absolute top-2 right-4 z-50 flex items-center gap-1 bg-[#232136] border border-[#393552] rounded-lg p-1 shadow-lg">
 <button 
 onClick={() => setShowCriticalPath(!showCriticalPath)} 
 className={`px-3 py-0.5 text-xs font-bold transition-colors border-r border-[#393552] mr-1 ${showCriticalPath ? 'text-[#eb6f92] bg-[#eb6f92]/10 rounded' : 'text-[#908caa] hover:text-[#e0def4]'}`}
 title="Toggle Critical Path"
 >
 Critical Path
 </button>
 <button onClick={handleGoToToday} className="px-2 py-0.5 text-xs font-bold text-[#908caa] hover:text-[#e0def4] transition-colors border-r border-[#393552] mr-1">Today</button>
 <button onClick={() => setZoomLevel(z => Math.max(0.25, z - 0.25))} className="p-1 text-[#908caa] hover:text-[#e0def4] transition-colors"><ZoomOut size={16} /></button>
 <button onClick={() => setZoomLevel(1)} className="p-1 text-[#908caa] hover:text-[#e0def4] transition-colors"><RotateCcw size={14} /></button>
 <button onClick={() => setZoomLevel(z => Math.min(3, z + 0.25))} className="p-1 text-[#908caa] hover:text-[#e0def4] transition-colors"><ZoomIn size={16} /></button>
 </div>

 <div className="flex bg-[#232136] border-b border-[#393552] sticky top-0 z-10">
 <div className="w-64 flex-shrink-0 border-r border-[#393552] p-4 font-bold text-[#908caa] flex flex-col justify-end">
 <span>Task Name</span>
 </div>
 <div className="flex-1 overflow-hidden" ref={containerRef}>
 <div className="flex flex-col relative" style={{ width: totalDays * DAY_WIDTH }}>
 <div className="flex border-b border-[#393552]/50 h-7 bg-[#232136]">
 {months.map((m, i) => (
 <div key={i} className="flex-shrink-0 border-r border-[#393552]/50 flex items-center text-xs font-bold text-[#c4a7e7] overflow-hidden sticky left-0" style={{ width: m.days * DAY_WIDTH }}>
 <span className="sticky left-4 whitespace-nowrap">{format(m.date, 'MMMM yyyy')}</span>
 </div>
 ))}
 </div>
 <div className="flex h-7 bg-[#2a273f]/50">
 {days.map((day, i) => (
 <div 
 key={i} 
 className={`flex-shrink-0 border-r border-[#393552]/30 flex items-center justify-center text-[10px] ${differenceInDays(day, new Date()) === 0 ? 'text-[#eb6f92] font-bold bg-[#eb6f92]/10' : 'text-[#6e6a86]'}`}
 style={{ width: DAY_WIDTH }}
 >
 <span className="font-bold">{zoomLevel >= 0.5 ? format(day, 'dd') : ''}</span>
 </div>
 ))}
 </div>
 
 {todayOffsetDays >= 0 && todayOffsetDays <= totalDays && (
 <div 
 className="absolute top-0 bottom-0 w-[2px] bg-[#eb6f92]/80 z-20 pointer-events-none shadow-[0_0_8px_rgba(235,111,146,0.5)]"
 style={{ left: todayOffsetDays * DAY_WIDTH + DAY_WIDTH / 2 }}
 />
 )}
 </div>
 </div>
 </div>

 <div className="flex-1 overflow-y-auto overflow-x-hidden flex relative min-h-0">
 <div className="w-64 flex-shrink-0 border-r border-[#393552] bg-[#2a273f]/50 relative z-20">
 {timelineTasks.map((task) => (
 <div key={task.id} className={`h-12 flex items-center gap-3 px-4 border-b border-[#393552]/30 truncate text-sm ${task.phaseId ? 'pl-8' : ''}`}>
 {task.type === 'Phase' && (
 <>
 <button 
 onClick={() => {
 setCollapsedPhases(prev => {
 const newSet = new Set(prev);
 if (newSet.has(task.id)) newSet.delete(task.id);
 else newSet.add(task.id);
 return newSet;
 });
 }}
 className="p-0.5 hover:bg-[#393552] rounded text-[#908caa] flex-shrink-0"
 >
 {collapsedPhases.has(task.id) ? <ChevronRight size={14} /> : <ChevronDown size={14} />}
 </button>
 <Layers size={14} className="text-[#c4a7e7] flex-shrink-0" />
 <span className="font-bold text-[#c4a7e7] truncate">{task.title}</span>
 </>
 )}
 {task.type === 'Event' && <><Flag size={14} className="text-[#eb6f92] flex-shrink-0" /><span className="font-medium text-[#eb6f92] truncate">{task.title}</span></>}
 {task.type === 'Milestone' && <><Milestone size={14} className="text-[#f6c177] flex-shrink-0" /><span className="font-bold text-[#f6c177] truncate">{task.title}</span></>}
 {(!task.type || task.type === 'Task') && <><CheckSquare size={14} className="text-[#c4a7e7] flex-shrink-0" /><span className="text-[#e0def4] truncate">{task.title}</span></>}
 </div>
 ))}
 <div className="h-full min-h-[200px]" />
 </div>

 <div 
 className={`flex-1 min-w-0 overflow-x-auto relative ${isSpacePressed || isPanning ? 'cursor-grab active:cursor-grabbing' : 'cursor-crosshair'}`}
 ref={scrollRef}
 onScroll={(e) => {
 if (containerRef.current) {
 containerRef.current.scrollLeft = e.currentTarget.scrollLeft;
 }
 }}
 onPointerDown={handlePointerDown}
 onPointerMove={handlePointerMove}
 onPointerUp={handlePointerUp}
 onPointerLeave={handlePointerUp}
 >
 <div className="absolute inset-0 flex pointer-events-none" style={{ width: totalDays * DAY_WIDTH }}>
 {days.map((_, i) => (
 <div key={i} className="flex-shrink-0 border-r border-[#393552]/10 h-full" style={{ width: DAY_WIDTH }} />
 ))}
 
 {todayOffsetDays >= 0 && todayOffsetDays <= totalDays && (
 <div 
 className="absolute top-0 bottom-0 w-[2px] bg-[#eb6f92]/30 z-10 pointer-events-none"
 style={{ left: todayOffsetDays * DAY_WIDTH + DAY_WIDTH / 2 }}
 />
 )}
 </div>

 <div className="relative pt-2" style={{ width: totalDays * DAY_WIDTH, height: Math.max(timelineTasks.length * 48, 200) }}>
 {/* SVG Dependency Arrows */}
 <svg className="absolute inset-0 pointer-events-none z-20 overflow-visible" style={{ width: '100%', height: '100%' }}>
 <defs>
 <marker id="arrowhead" markerWidth="10" markerHeight="7" refX="9" refY="3.5" orient="auto">
 <polygon points="0 0, 10 3.5, 0 7" fill="#c4a7e7" />
 </marker>
 <marker id="arrowhead-highlight" markerWidth="10" markerHeight="7" refX="9" refY="3.5" orient="auto">
 <polygon points="0 0, 10 3.5, 0 7" fill="#eb6f92" />
 </marker>
 </defs>
 {timelineTasks.map((task, targetIdx) => {
 const resolvedDeps = resolveDependencies(task as unknown as Task, tasks);
 if (resolvedDeps.length === 0) return null;
 return resolvedDeps.map(depId => {
 const sourceIdx = timelineTasks.findIndex(t => t.id === depId);
 if (sourceIdx === -1) return null;
 const sourceTask = timelineTasks[sourceIdx];
 
 const sourceEndOffset = differenceInDays(sourceTask.end, minDate);
 const targetStartOffset = differenceInDays(task.start, minDate);

 let startX = sourceEndOffset * DAY_WIDTH;
 if (sourceTask.type === 'Event') startX = (differenceInDays(sourceTask.start, minDate) * DAY_WIDTH) + DAY_WIDTH / 2 + 8;
 
 let endX = targetStartOffset * DAY_WIDTH;
 if (task.type === 'Event') endX = (differenceInDays(task.start, minDate) * DAY_WIDTH) + DAY_WIDTH / 2 - 8;

 const startY = sourceIdx * 48 + 8 + 16;
 const endY = targetIdx * 48 + 8 + 16;

 const path = `M ${startX} ${startY} C ${startX + 30} ${startY}, ${endX - 30} ${endY}, ${endX} ${endY}`;
 
 const isCritical = showCriticalPath && criticalPathIds.has(task.id);
 const isHighlighted = isCritical || hoveredTaskId === task.id;
 const isDimmed = (hoveredTaskId && !isHighlighted) || (showCriticalPath && !isCritical);
 
 return (
 <path 
 key={`${depId}-${task.id}`} 
 d={path} 
 fill="none" 
 stroke={isHighlighted ? "#eb6f92" : "#c4a7e7"} 
 strokeWidth={isHighlighted ? "3" : "2"} 
 strokeDasharray="4 4" 
 markerEnd={isHighlighted ? "url(#arrowhead-highlight)" : "url(#arrowhead)"} 
 style={{ opacity: isDimmed ? 0.15 : 1, transition: 'all 0.2s' }}
 />
 );
 });
 })}
 </svg>

 {timelineTasks.map((task) => {
 const startOffsetDays = differenceInDays(task.start, minDate);
 const durationDays = differenceInDays(task.end, task.start) || 1;
 const left = startOffsetDays * DAY_WIDTH;
 const width = durationDays * DAY_WIDTH;
 const isCritical = showCriticalPath && criticalPathIds.has(task.id);

 if (task.type === 'Event') {
 const instances: { id: string, start: Date, end: Date }[] = [];
 if (task.recurrence && task.recurrence !== 'none') {
 const horizonDate = addDays(maxDate, 30);
 let currentStart = task.start;
 const duration = task.end.getTime() - task.start.getTime();
 const recurrenceEnd = task.recurrenceEndDate ? parseISO(task.recurrenceEndDate) : horizonDate;
 const endLimit = isBefore(recurrenceEnd, horizonDate) ? recurrenceEnd : horizonDate;
 
 let instanceCount = 0;
 while (!isAfter(currentStart, endLimit) && instanceCount < 365) {
 instances.push({
 id: `${task.id}_${instanceCount}`,
 start: currentStart,
 end: new Date(currentStart.getTime() + duration)
 });
 
 if (task.recurrence === 'daily') {
 currentStart = addDays(currentStart, 1);
 } else if (task.recurrence === 'weekly') {
 currentStart = addWeeks(currentStart, 1);
 } else if (task.recurrence === 'monthly') {
 currentStart = addMonths(currentStart, 1);
 } else {
 break;
 }
 instanceCount++;
 }
 } else {
 instances.push({ id: task.id, start: task.start, end: task.end });
 }

 return (
 <div key={task.id} className="h-12 border-b border-transparent relative group pointer-events-none">
 {instances.map(instance => {
 const instStartOffset = differenceInDays(instance.start, minDate);
 const instLeft = instStartOffset * DAY_WIDTH;
 
 return (
 <motion.div
 key={instance.id}
 onPointerDown={(e) => handleDragPointerDown(e, task.id, task.start, task.end)}
 onDoubleClick={(e) => { e.stopPropagation(); if (onDoubleClickTask) { onDoubleClickTask(task); } else if (onEditTask) { onEditTask(task); }; }}
 onMouseEnter={() => setHoveredTaskId(task.id)}
 onMouseLeave={() => setHoveredTaskId(null)}
 className="task-bar-element absolute top-2 h-8 flex items-center justify-center cursor-grab active:cursor-grabbing shadow-lg pointer-events-auto z-30 transition-opacity duration-200"
 style={{ 
 left: instLeft + DAY_WIDTH / 2 - 8, 
 width: 16,
 opacity: hoveredTaskId && hoveredTaskId !== task.id && !resolveDependencies(task as unknown as Task, tasks).includes(hoveredTaskId) && !timelineTasks.find(t => t.id === hoveredTaskId && resolveDependencies(t as unknown as Task, tasks).includes(task.id)) ? 0.3 : 1,
 ...(isCritical ? { boxShadow: '0 0 8px rgba(235,111,146,0.4)' } : {})
 }}
 whileHover={{ scale: 1.2 }}
 >
 <div className="w-4 h-4 bg-[#eb6f92] rotate-45 rounded-lg border-2 border-[#232136]" />
 <span className="absolute left-6 text-xs font-bold text-[#eb6f92] whitespace-nowrap">{task.title}</span>
 </motion.div>
 );
 })}
 </div>
 );
 }

 if (task.type === 'Milestone') {
 return (
 <div key={task.id} className="h-12 border-b border-transparent relative group pointer-events-none">
 <motion.div
 onPointerDown={(e) => handleDragPointerDown(e, task.id, task.start, task.end)}
 onDoubleClick={(e) => { e.stopPropagation(); if (onDoubleClickTask) { onDoubleClickTask(task); } else if (onEditTask) { onEditTask(task); }; }}
 onMouseEnter={() => setHoveredTaskId(task.id)}
 onMouseLeave={() => setHoveredTaskId(null)}
 className="task-bar-element absolute top-2 h-8 flex items-center justify-center cursor-grab active:cursor-grabbing shadow-lg pointer-events-auto z-30 transition-opacity duration-200"
 style={{ 
 left: left + DAY_WIDTH / 2 - 12, 
 width: 24,
 opacity: hoveredTaskId && hoveredTaskId !== task.id && !resolveDependencies(task as unknown as Task, tasks).includes(hoveredTaskId) && !timelineTasks.find(t => t.id === hoveredTaskId && resolveDependencies(t as unknown as Task, tasks).includes(task.id)) ? 0.3 : 1,
 ...(isCritical ? { boxShadow: '0 0 8px rgba(235,111,146,0.4)' } : {})
 }}
 whileHover={{ scale: 1.2 }}
 >
 <div className="w-5 h-5 bg-[#f6c177] rotate-45 border-2 border-[#232136] shadow-md flex items-center justify-center">
 </div>
 <span className="absolute left-8 text-xs font-bold text-[#f6c177] whitespace-nowrap">{task.title}</span>
 </motion.div>
 </div>
 );
 }

  let bgColor = "bg-[#3e8fb0]"; // Pine (default To Do)
  let handleColor = "bg-[#2a273f]/50";
  let isPhase = false;

  if (task.type === 'Phase') { 
    bgColor = "bg-[#c4a7e7]"; // Iris
    handleColor = "bg-[#907aa9]/50"; 
    isPhase = true;
  } else if (task.status === 'In Progress') {
    bgColor = "bg-[#ea9a97]"; // Rose
  } else if (task.status === 'In Review') {
    bgColor = "bg-[#9ccfd8]"; // Foam
  } else if (task.status === 'To Do') {
    bgColor = "bg-[#3e8fb0]"; // Pine
  }

  if (task.status === 'Done') { 
    bgColor = "bg-[#908caa]"; // Subtle
    handleColor = "bg-[#6e6a86]/50"; // Muted
  }

 return (
 <div key={task.id} className="h-12 border-b border-transparent relative group pointer-events-none">
 <motion.div
 onPointerDown={!isPhase ? (e) => handleDragPointerDown(e, task.id, task.start, task.end) : undefined}
 onDoubleClick={(e) => { e.stopPropagation(); if (onEditTask) { onEditTask(task); } }}
 onMouseEnter={() => setHoveredTaskId(task.id)}
 onMouseLeave={() => setHoveredTaskId(null)}
 className={`task-bar-element absolute top-2 h-8 rounded-md flex flex-col ${bgColor} text-[#232136] text-xs font-bold shadow-lg ${isPhase ? 'pointer-events-none' : 'pointer-events-auto'} group-hover:z-30 overflow-hidden z-10 transition-opacity duration-200`}
 style={{ 
 left, 
 width: Math.max(width, DAY_WIDTH - 4),
 opacity: hoveredTaskId && hoveredTaskId !== task.id && !resolveDependencies(task as unknown as Task, tasks).includes(hoveredTaskId) && !timelineTasks.find(t => t.id === hoveredTaskId && resolveDependencies(t as unknown as Task, tasks).includes(task.id)) ? 0.3 : 1,
 ...(isCritical ? { boxShadow: '0 0 8px rgba(235,111,146,0.4)', border: '2px solid #eb6f92', zIndex: 30 } : {}),
 ...(isPhase ? {
 backgroundImage: 'repeating-linear-gradient(45deg, transparent, transparent 10px, rgba(255,255,255,0.2) 10px, rgba(255,255,255,0.2) 20px)'
 } : {})
 }}
 whileHover={!resizingTask && !isPhase ? { scaleY: 1.1 } : {}}
 >
 {/* Top draggable area and title */}
 <div className="flex-1 flex items-center justify-center relative w-full h-full">
 {!isPhase && (
 <div 
 onPointerDown={(e) => handleResizePointerDown(e, task.id, 'left', task.start, task.end)}
 className={`absolute left-0 top-0 bottom-0 w-3 cursor-ew-resize opacity-0 group-hover:opacity-100 transition-opacity hover:${handleColor} z-20`}
 />
 )}
 
 <span className={`truncate px-4 text-center pointer-events-none drop-shadow-sm relative z-10 flex-1 ${!isPhase ? 'cursor-grab active:cursor-grabbing' : ''}`}>
 {task.title} {task.progress !== undefined && <span className="opacity-70 ml-1">({Math.round(task.progress)}%)</span>}
 </span>

 {!isPhase && (
 <div 
 onPointerDown={(e) => handleResizePointerDown(e, task.id, 'right', task.start, task.end)}
 className={`absolute right-0 top-0 bottom-0 w-3 cursor-ew-resize opacity-0 group-hover:opacity-100 transition-opacity hover:${handleColor} z-20`}
 />
 )}

 {onDeleteTask && !isPhase && (
    <button 
      onPointerDown={(e) => { e.stopPropagation(); onDeleteTask(task.id); }}
      className="absolute right-4 top-1/2 -translate-y-1/2 opacity-0 group-hover:opacity-100 text-[#232136] hover:text-[#eb6f92] transition-colors z-30"
      title="Delete Task"
    >
      <Trash2 size={12} />
    </button>
  )}
 </div>

 {/* Bottom Progress Scrubber */}
 {task.progress !== undefined && !isPhase && (
 <div 
 className="h-2 w-full bg-black/20 relative flex-shrink-0"
 onPointerDown={(e) => { e.stopPropagation(); }}
 >
 <div 
 className="absolute left-0 top-0 bottom-0 bg-[#e0def4]/50 pointer-events-none transition-all duration-75"
 style={{ width: `${Math.max(0, Math.min(100, task.progress))}%` }}
 />
 <input 
 type="range"
 min="0"
 max="100"
 value={task.progress}
 onChange={(e) => {
 const newProgress = Number(e.target.value);
 if (onTaskUpdate) {
 onTaskUpdate({ ...task, progress: newProgress });
 }
 }}
 className="absolute inset-0 w-full h-full opacity-0 cursor-ew-resize m-0 p-0 z-30"
 />
 </div>
 )}
 
 {/* Phase progress visualization */}
 {task.progress !== undefined && isPhase && (
 <div className="absolute left-0 bottom-0 h-1 w-full bg-black/20 pointer-events-none">
 <div 
 className="absolute left-0 top-0 bottom-0 bg-[#232136]/30 pointer-events-none transition-all duration-300"
 style={{ width: `${Math.max(0, Math.min(100, task.progress))}%` }}
 />
 </div>
 )}

 </motion.div>
 </div>
 );
 })}
 
 {isDrawing && (
 <div 
 className="absolute h-8 top-2 rounded-md bg-[#c4a7e7]/50 border-2 border-[#c4a7e7] pointer-events-none z-30"
 style={{
 left: Math.min(drawStartX, drawCurrentX),
 width: Math.max(Math.abs(drawCurrentX - drawStartX), DAY_WIDTH),
 top: timelineTasks.length * 48 + 8
 }}
 />
 )}
 </div>
 </div>
 </div>
 </div>
 );
}
