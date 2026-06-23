import re

with open('src/app/page.tsx', 'r') as f:
    page = f.read()

# Add newEventLinkedDeckId state
page = page.replace(
    "const [newEventType, setNewEventType] = useState<'study' | 'task'>('study');",
    "const [newEventType, setNewEventType] = useState<'study' | 'task'>('study');\n  const [newEventLinkedDeckId, setNewEventLinkedDeckId] = useState('');"
)

# Update handleAddOrUpdateEvent
page = page.replace(
    "const updated = (data.events || []).map(e => e.id === editingEventId ? { ...e, title: newEventTitle, startDate: newEventStart, endDate: newEventEnd, type: newEventType } : e);",
    "const updated = (data.events || []).map(e => e.id === editingEventId ? { ...e, title: newEventTitle, startDate: newEventStart, endDate: newEventEnd, type: newEventType, linkedDeckId: newEventLinkedDeckId || undefined } : e);"
)
page = page.replace(
    "const newEv: CalendarEvent = { id: Date.now().toString(), title: newEventTitle, startDate: newEventStart, endDate: newEventEnd, type: newEventType };",
    "const newEv: CalendarEvent = { id: Date.now().toString(), title: newEventTitle, startDate: newEventStart, endDate: newEventEnd, type: newEventType, linkedDeckId: newEventLinkedDeckId || undefined };"
)
page = page.replace(
    "setNewEventTitle(''); setNewEventStart(''); setNewEventEnd('');",
    "setNewEventTitle(''); setNewEventStart(''); setNewEventEnd(''); setNewEventLinkedDeckId('');"
)

# Update startEditEvent
page = page.replace(
    "setNewEventType(ev.type);",
    "setNewEventType(ev.type);\n      setNewEventLinkedDeckId(ev.linkedDeckId || '');"
)

# Update ctx to pass newEventLinkedDeckId
page = page.replace(
    "    newEventType,\n    setNewEventType,",
    "    newEventType,\n    setNewEventType,\n    newEventLinkedDeckId,\n    setNewEventLinkedDeckId,"
)

with open('src/app/page.tsx', 'w') as f:
    f.write(page)

