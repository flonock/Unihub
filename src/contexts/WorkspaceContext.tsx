'use client';

import React, { createContext, useContext, useState, ReactNode } from 'react';
import type { WorkspaceData } from '@/types';

type WorkspaceContextType = {
  data: WorkspaceData;
  setData: React.Dispatch<React.SetStateAction<WorkspaceData>>;
  selectedSemester: string;
  setSelectedSemester: React.Dispatch<React.SetStateAction<string>>;
  semesters: string[];
  setSemesters: React.Dispatch<React.SetStateAction<string[]>>;
  lectures: string[];
  setLectures: React.Dispatch<React.SetStateAction<string[]>>;
};

const defaultWorkspaceData: WorkspaceData = {
  exams: [],
  todos: [],
  notes: '',
  studyPlan: '',
  events: [],
  confidences: {},
  examPeriodStart: '',
  examPeriodEnd: '',
  lectureMeta: {},
  containers: [],
  containerMaxCredits: {},
  decks: [],
  studySessions: [],
};

const WorkspaceContext = createContext<WorkspaceContextType | undefined>(undefined);

export function WorkspaceProvider({ children }: { children: ReactNode }) {
  const [data, setData] = useState<WorkspaceData>(defaultWorkspaceData);
  const [selectedSemester, setSelectedSemester] = useState<string>('');
  const [semesters, setSemesters] = useState<string[]>([]);
  const [lectures, setLectures] = useState<string[]>([]);

  return (
    <WorkspaceContext.Provider
      value={{
        data,
        setData,
        selectedSemester,
        setSelectedSemester,
        semesters,
        setSemesters,
        lectures,
        setLectures,
      }}
    >
      {children}
    </WorkspaceContext.Provider>
  );
}

export function useWorkspace() {
  const context = useContext(WorkspaceContext);
  if (context === undefined) {
    throw new Error('useWorkspace must be used within a WorkspaceProvider');
  }
  return context;
}
