export type FileEntry = {
  name: string;
  isDirectory: boolean;
  path: string;
  isPdf?: boolean;
  isXopp?: boolean;
  ext?: string;
};

export type Exam = {
  id: string;
  name: string;
  date?: string;
  link?: string;
  semester?: string;
};

export type Todo = {
  id: string;
  title: string;
  status: boolean;
  link: string;
  progress?: number;
  dueDate?: string;
};

export type CalendarEvent = {
  id: string;
  title: string;
  startDate: string;
  endDate: string;
  type: 'task' | 'study';
  link?: string;
};

export type LectureMeta = {
  category?: 'Wahlpflicht' | 'Wahlfach' | 'Ignore' | '';
  credits?: number;
  grade?: string;
  container?: string;
  notes?: string;
};

export type Flashcard = {
  id: string;
  front: string;
  back: string;
  ease?: number;
  interval?: number;
  nextReview?: string;
};

export type Deck = {
  id: string;
  name: string;
  link?: string;
  linkedSemester?: string;
  linkedLecture?: string;
  cards: Flashcard[];
};

export type StudySession = {
  id: string;
  name: string;
  mode: 'cram' | 'spaced';
  deckIds: string[];
  cardIds: string[];
  batchSize: number;
  cramState?: {
    cardRatings: Record<string, 0 | 1 | 2 | 3>;
  };
  linkedSemester?: string;
  linkedLecture?: string;
};

export type WorkspaceData = {
  exams: Exam[];
  todos: Todo[];
  notes: string;
  studyPlan?: string;
  events?: CalendarEvent[];
  confidences?: Record<string, number>;
  examPeriodStart?: string;
  examPeriodEnd?: string;
  lectureMeta?: Record<string, LectureMeta>;
  containers?: string[];
  containerMaxCredits?: Record<string, number>;
  decks?: Deck[];
  studySessions?: StudySession[];
};
