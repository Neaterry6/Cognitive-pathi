export interface User {
  id: string;
  nickname: string;
  email?: string;
  firstName?: string | null;
  lastName?: string | null;
  avatarUrl?: string | null;
  isPremium: boolean | null;
  isAdmin: boolean | null;
  isActivated: boolean | null;
  totalScore: number | null;
  testsCompleted: number | null;
  studyHours: number | null;
  usageCount: number | null;
  createdAt: Date | null;
  updatedAt: Date | null;
}

export interface Subject {
  id: string;
  name: string;
  emoji: string;
  description?: string;
  totalQuestions: number;
}

export interface Question {
  id: string;
  subjectId: string;
  question: string;
  options: QuestionOption[];
  correctAnswer: string;
  explanation?: string;
  imageUrl?: string;
  difficulty: 'easy' | 'medium' | 'hard';
  topic?: string;
}

export interface QuestionOption {
  label: string;
  text: string;
}

export interface QuizSession {
  id: string;
  userId: string;
  subjectId: string;
  questionIds: string[];
  answers?: Record<string, string>;
  score?: number;
  totalQuestions: number;
  timeSpent?: number;
  isCompleted: boolean;
  startedAt: string;
  completedAt?: string;
}

export interface StudyProgress {
  id: string;
  userId: string;
  subjectId: string;
  topic: string;
  isCompleted: boolean;
  timeSpent: number;
  completedAt?: string;
}

export interface StudyPlanContent {
  id: string;
  subjectId: string;
  topic: string;
  content: string;
  aiModel?: string;
  generatedAt: string;
}

export interface WikiSearchResult {
  title: string;
  snippet: string;
  extract: string;
  thumbnail?: {
    source: string;
    width: number;
    height: number;
  };
  url: string;
  lastModified?: string;
  wordCount?: number;
}

export interface LeaderboardEntry {
  user: User;
  avgScore: number;
  totalTests: number;
}

export interface CalculatorState {
  display: string;
  expression: string;
  result: string;
  isOpen: boolean;
}
