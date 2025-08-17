import { sql } from 'drizzle-orm';
import {
  pgTable,
  varchar,
  text,
  boolean,
  integer,
  timestamp,
  jsonb,
  index,
  serial
} from "drizzle-orm/pg-core";
import { relations } from "drizzle-orm";
import { createInsertSchema } from "drizzle-zod";
import { z } from "zod";

// Import chat-related schemas
export * from './chatSchema';

// Session storage table for authentication
export const sessions = pgTable(
  "sessions",
  {
    sid: varchar("sid").primaryKey(),
    sess: jsonb("sess").notNull(),
    expire: timestamp("expire").notNull(),
  },
  (table) => [index("IDX_session_expire").on(table.expire)],
);

// Users table
export const users = pgTable("users", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  email: varchar("email").unique().notNull(),
  password: varchar("password").notNull(),
  nickname: varchar("nickname").notNull(),
  firstName: varchar("first_name"),
  lastName: varchar("last_name"),
  avatarUrl: varchar("avatar_url"),
  isPremium: boolean("is_premium").default(false),
  isAdmin: boolean("is_admin").default(false),
  activationCode: varchar("activation_code"),
  isActivated: boolean("is_activated").default(false),
  totalScore: integer("total_score").default(0),
  testsCompleted: integer("tests_completed").default(0),
  studyHours: integer("study_hours").default(0),
  usageCount: integer("usage_count").default(0), // Track app usage for trial limit
  isEmailVerified: boolean("is_email_verified").default(false),
  emailVerificationToken: varchar("email_verification_token"),
  emailVerificationExpires: timestamp("email_verification_expires"),
  createdAt: timestamp("created_at").defaultNow(),
  updatedAt: timestamp("updated_at").defaultNow(),
});

// Subjects table
export const subjects = pgTable("subjects", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  name: varchar("name").notNull(),
  emoji: varchar("emoji").notNull(),
  description: text("description"),
  category: varchar("category").default("general"),
  isSpecialized: boolean("is_specialized").default(false),
  totalQuestions: integer("total_questions").default(0),
  createdAt: timestamp("created_at").defaultNow(),
  updatedAt: timestamp("updated_at").defaultNow(),
});

// Questions table (for locally stored questions)
export const questions = pgTable("questions", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  subjectId: varchar("subject_id").notNull(),
  question: text("question").notNull(),
  options: jsonb("options").$type<Array<{ id: string; text: string }>>().notNull(),
  correctAnswer: varchar("correct_answer").notNull(),
  explanation: text("explanation"),
  imageUrl: varchar("image_url"),
  difficulty: varchar("difficulty").default("medium"),
  topic: varchar("topic"),
  year: varchar("year"), // For ALOC API questions
  examType: varchar("exam_type"), // utme, postutme, wassce, neco
  createdAt: timestamp("created_at").defaultNow(),
});

// Quiz sessions table
export const quizSessions = pgTable("quiz_sessions", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  userId: varchar("user_id").notNull(),
  subjectId: varchar("subject_id").notNull(),
  subjectName: varchar("subject_name").notNull(),
  questions: jsonb("questions").$type<Array<{
    id: string;
    question: string;
    options: Array<{ id: string; text: string }>;
    correctAnswer: string;
    userAnswer?: string;
    isCorrect?: boolean;
    explanation?: string;
    imageUrl?: string;
    year?: string;
    examType?: string;
    timeSpent?: number;
  }>>(),
  questionsData: jsonb("questions_data").$type<Array<{
    id: string;
    question: string;
    options: Array<{ id: string; text: string }>;
    correctAnswer: string;
    userAnswer?: string;
    isCorrect?: boolean;
    explanation?: string;
    imageUrl?: string;
    year?: string;
    examType?: string;
    timeSpent?: number;
  }>>(),
  answers: jsonb("answers").$type<Record<string, string>>(),
  userAnswers: jsonb("user_answers").$type<Record<string, string>>(),
  score: integer("score").default(0),
  correctAnswers: integer("correct_answers").default(0),
  totalQuestions: integer("total_questions").notNull(),
  timeSpent: integer("time_spent").default(0),
  isCompleted: boolean("is_completed").default(false),
  year: varchar("year"), // User selected year filter
  selectedYear: varchar("selected_year"), // User selected year filter  
  examType: varchar("exam_type"), // ALOC API exam type
  mode: varchar("mode").default("practice"), // practice or exam
  startedAt: timestamp("started_at").defaultNow(),
  completedAt: timestamp("completed_at"),
});

// Enhanced Study Progress tracking
export const studyProgress = pgTable("study_progress", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  userId: varchar("user_id").notNull(),
  subjectId: varchar("subject_id").notNull(),
  subjectName: varchar("subject_name").notNull(),
  totalQuestions: integer("total_questions").default(0),
  correctAnswers: integer("correct_answers").default(0),
  incorrectAnswers: integer("incorrect_answers").default(0),
  averageScore: integer("average_score").default(0),
  bestScore: integer("best_score").default(0),
  totalTimeSpent: integer("total_time_spent").default(0), // in seconds
  sessionsCompleted: integer("sessions_completed").default(0),
  currentStreak: integer("current_streak").default(0), // days studied consecutively
  longestStreak: integer("longest_streak").default(0),
  lastStudyDate: timestamp("last_study_date").defaultNow(),
  weeklyGoal: integer("weekly_goal").default(5), // sessions per week
  weeklyProgress: integer("weekly_progress").default(0),
  monthlyGoal: integer("monthly_goal").default(20), // sessions per month
  monthlyProgress: integer("monthly_progress").default(0),
  difficultyLevel: varchar("difficulty_level").default("beginner"), // beginner, intermediate, advanced
  weakTopics: jsonb("weak_topics").$type<string[]>().default([]),
  strongTopics: jsonb("strong_topics").$type<string[]>().default([]),
  studySchedule: jsonb("study_schedule").$type<{
    monday?: boolean;
    tuesday?: boolean;
    wednesday?: boolean;
    thursday?: boolean;
    friday?: boolean;
    saturday?: boolean;
    sunday?: boolean;
    preferredTime?: string;
  }>().default({}),
  createdAt: timestamp("created_at").defaultNow(),
  updatedAt: timestamp("updated_at").defaultNow()
});

// Payment transactions table for Paystack integration
export const payments = pgTable("payments", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  userId: varchar("user_id").notNull(),
  paymentReference: varchar("payment_reference").notNull().unique(),
  paystackReference: varchar("paystack_reference"),
  amount: integer("amount").notNull(), // amount in kobo
  email: varchar("email").notNull(),
  status: varchar("status").default("pending"), // pending, success, failed
  unlockCode: varchar("unlock_code"), // generated unlock code for manual entry
  paymentMethod: varchar("payment_method").default("paystack"), // paystack, manual
  createdAt: timestamp("created_at").defaultNow(),
  completedAt: timestamp("completed_at")
});

// CBT sessions table for timed exams
export const cbtSessions = pgTable("cbt_sessions", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  userId: varchar("user_id").notNull(),
  selectedSubjects: jsonb("selected_subjects").$type<Array<{
    id: string;
    name: string;
    emoji: string;
  }>>().notNull(),
  questions: jsonb("questions").$type<Array<{
    id: string;
    question: string;
    options: Array<{ id: string; text: string }>;
    correctAnswer: string;
    subject: string;
    userAnswer?: string;
    isCorrect?: boolean;
    explanation?: string;
    imageUrl?: string;
    year?: string;
    examType?: string;
  }>>().default([]),
  userAnswers: jsonb("user_answers").$type<Record<string, string>>().default({}),
  currentQuestionIndex: integer("current_question_index").default(0),
  timeAllowed: integer("time_allowed").default(7200), // 2 hours in seconds
  timeRemaining: integer("time_remaining").default(7200),
  isActive: boolean("is_active").default(true),
  isPaused: boolean("is_paused").default(false),
  isCompleted: boolean("is_completed").default(false),
  currentSubjectIndex: integer("current_subject_index").default(0),
  totalQuestions: integer("total_questions").default(160), // 40 questions per subject * 4 subjects
  questionsPerSubject: integer("questions_per_subject").default(40),
  paymentId: varchar("payment_id"), // reference to payment
  startedAt: timestamp("started_at"),
  completedAt: timestamp("completed_at"),
  createdAt: timestamp("created_at").defaultNow()
});

// Study sessions for detailed tracking
export const studySessions = pgTable("study_sessions", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  userId: varchar("user_id").notNull(),
  subjectId: varchar("subject_id").notNull(),
  subjectName: varchar("subject_name").notNull(),
  sessionType: varchar("session_type").notNull(), // quiz, practice, review
  questionsAttempted: integer("questions_attempted").notNull(),
  correctAnswers: integer("correct_answers").notNull(),
  score: integer("score").notNull(),
  timeSpent: integer("time_spent").notNull(), // in seconds
  completedAt: timestamp("completed_at").defaultNow(),
  examType: varchar("exam_type"), // utme, wassce, neco
  examYear: varchar("exam_year"),
  topics: jsonb("topics").$type<string[]>().default([]),
  performance: jsonb("performance").$type<{
    accuracy: number;
    speed: number; // questions per minute
    improvement: number; // compared to previous sessions
  }>(),
  createdAt: timestamp("created_at").defaultNow()
});

// Daily study goals and achievements
export const dailyGoals = pgTable("daily_goals", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  userId: varchar("user_id").notNull(),
  date: varchar("date").notNull(), // YYYY-MM-DD format
  questionsGoal: integer("questions_goal").default(10),
  questionsCompleted: integer("questions_completed").default(0),
  timeGoal: integer("time_goal").default(1800), // 30 minutes in seconds
  timeSpent: integer("time_spent").default(0),
  subjectsGoal: integer("subjects_goal").default(2),
  subjectsStudied: integer("subjects_studied").default(0),
  isCompleted: boolean("is_completed").default(false),
  completedAt: timestamp("completed_at"),
  createdAt: timestamp("created_at").defaultNow()
});

// Study achievements and badges
export const achievements = pgTable("achievements", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  userId: varchar("user_id").notNull(),
  type: varchar("type").notNull(), // streak, score, sessions, time
  title: varchar("title").notNull(),
  description: text("description").notNull(),
  icon: varchar("icon").notNull(),
  criteria: jsonb("criteria").$type<{
    streak?: number;
    score?: number;
    sessions?: number;
    timeSpent?: number;
    subject?: string;
  }>().notNull(),
  isUnlocked: boolean("is_unlocked").default(false),
  unlockedAt: timestamp("unlocked_at"),
  createdAt: timestamp("created_at").defaultNow()
});

// Study plan content table
export const studyPlanContent = pgTable("study_plan_content", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  subjectId: varchar("subject_id").notNull(),
  topic: varchar("topic").notNull(),
  content: text("content").notNull(),
  aiModel: varchar("ai_model"),
  generatedAt: timestamp("generated_at").defaultNow(),
});

// Competitions table
export const competitions = pgTable("competitions", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  title: varchar("title").notNull(),
  description: text("description"),
  subjectId: varchar("subject_id").notNull(),
  creatorId: varchar("creator_id").notNull(),
  maxParticipants: integer("max_participants").default(10),
  questionsCount: integer("questions_count").default(20),
  timeLimit: integer("time_limit").default(3600),
  status: varchar("status").default("waiting"),
  startTime: timestamp("start_time"),
  endTime: timestamp("end_time"),
  createdAt: timestamp("created_at").defaultNow(),
});

// Competition participants table
export const competitionParticipants = pgTable("competition_participants", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  competitionId: varchar("competition_id").notNull(),
  userId: varchar("user_id").notNull(),
  score: integer("score").default(0),
  timeSpent: integer("time_spent").default(0),
  answers: jsonb("answers").$type<Array<{ questionId: string; selectedAnswer: string; isCorrect: boolean }>>().notNull(),
  rank: integer("rank"),
  joinedAt: timestamp("joined_at").defaultNow(),
});

// Analytics table
export const analytics = pgTable("analytics", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  userId: varchar("user_id"),
  eventType: varchar("event_type").notNull(),
  eventData: jsonb("event_data"),
  sessionId: varchar("session_id"),
  timestamp: timestamp("timestamp").defaultNow(),
});

// Offline cache table
export const offlineCache = pgTable("offline_cache", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  userId: varchar("user_id").notNull(),
  subjectId: varchar("subject_id").notNull(),
  contentType: varchar("content_type").notNull(),
  content: jsonb("content").notNull(),
  lastSynced: timestamp("last_synced").defaultNow(),
});

// Short notes for important JAMB topics
export const shortNotes = pgTable("short_notes", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  userId: varchar("user_id").notNull(),
  subjectId: varchar("subject_id").notNull(),
  subjectName: varchar("subject_name").notNull(),
  topic: varchar("topic").notNull(),
  title: varchar("title").notNull(),
  content: text("content").notNull(),
  keyPoints: jsonb("key_points").$type<string[]>().default([]),
  formulas: jsonb("formulas").$type<Array<{ formula: string; description: string }>>().default([]),
  examples: jsonb("examples").$type<string[]>().default([]),
  difficulty: varchar("difficulty").default("medium"), // easy, medium, hard
  examRelevance: integer("exam_relevance").default(5), // 1-10 scale
  tags: jsonb("tags").$type<string[]>().default([]),
  isBookmarked: boolean("is_bookmarked").default(false),
  reviewCount: integer("review_count").default(0),
  lastReviewed: timestamp("last_reviewed"),
  aiGenerated: boolean("ai_generated").default(false),
  createdAt: timestamp("created_at").defaultNow(),
  updatedAt: timestamp("updated_at").defaultNow()
});

// Adaptive study scheduler
export const studyScheduler = pgTable("study_scheduler", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  userId: varchar("user_id").notNull(),
  subjectId: varchar("subject_id").notNull(),
  subjectName: varchar("subject_name").notNull(),
  scheduledDate: timestamp("scheduled_date").notNull(),
  scheduledTime: varchar("scheduled_time").notNull(), // HH:MM format
  duration: integer("duration").default(1800), // 30 minutes in seconds
  priority: varchar("priority").default("medium"), // low, medium, high, urgent
  taskType: varchar("task_type").notNull(), // quiz, review, notes, practice
  adaptiveScore: integer("adaptive_score").default(5), // 1-10 based on performance
  difficulty: varchar("difficulty").default("medium"),
  isCompleted: boolean("is_completed").default(false),
  isSkipped: boolean("is_skipped").default(false),
  actualDuration: integer("actual_duration"),
  performance: jsonb("performance").$type<{
    score?: number;
    accuracy?: number;
    timeEfficiency?: number;
    improvement?: number;
  }>(),
  nextScheduled: timestamp("next_scheduled"), // AI-calculated next review
  repeatInterval: integer("repeat_interval").default(1), // days
  streak: integer("streak").default(0),
  status: varchar("status").default("pending"), // pending, active, completed, skipped
  reminderSent: boolean("reminder_sent").default(false),
  createdAt: timestamp("created_at").defaultNow(),
  completedAt: timestamp("completed_at")
});

// Distraction-free study sessions
export const focusSessions = pgTable("focus_sessions", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  userId: varchar("user_id").notNull(),
  sessionName: varchar("session_name").notNull(),
  sessionType: varchar("session_type").notNull(), // deep_focus, pomodoro, timed_review, exam_prep
  duration: integer("duration").notNull(), // in seconds
  timeRemaining: integer("time_remaining"),
  breakDuration: integer("break_duration").default(300), // 5 minutes default
  cyclesCompleted: integer("cycles_completed").default(0),
  totalCycles: integer("total_cycles").default(1),
  isActive: boolean("is_active").default(false),
  isPaused: boolean("is_paused").default(false),
  isCompleted: boolean("is_completed").default(false),
  allowedActions: jsonb("allowed_actions").$type<{
    quiz: boolean;
    notes: boolean;
    calculator: boolean;
    wiki: boolean;
  }>().default({ quiz: true, notes: true, calculator: false, wiki: false }),
  blockedSites: jsonb("blocked_sites").$type<string[]>().default([]),
  distractionCount: integer("distraction_count").default(0),
  focusScore: integer("focus_score").default(100), // decreases with distractions
  subjectsStudied: jsonb("subjects_studied").$type<string[]>().default([]),
  tasksCompleted: jsonb("tasks_completed").$type<Array<{
    type: string;
    subject: string;
    score?: number;
    timeSpent: number;
  }>>().default([]),
  startedAt: timestamp("started_at"),
  completedAt: timestamp("completed_at"),
  createdAt: timestamp("created_at").defaultNow()
});

// Study session insights and adaptive recommendations
export const studyInsights = pgTable("study_insights", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  userId: varchar("user_id").notNull(),
  date: varchar("date").notNull(), // YYYY-MM-DD
  weekOfYear: integer("week_of_year").notNull(),
  productiveHours: jsonb("productive_hours").$type<Array<{
    hour: number;
    productivity: number; // 1-10 scale
    tasksCompleted: number;
  }>>().default([]),
  preferredStudyTime: varchar("preferred_study_time"), // morning, afternoon, evening, night
  averageFocusScore: integer("average_focus_score").default(0),
  totalStudyTime: integer("total_study_time").default(0),
  totalFocusTime: integer("total_focus_time").default(0),
  distractionPatterns: jsonb("distraction_patterns").$type<Array<{
    type: string;
    frequency: number;
    timeOfDay: string;
  }>>().default([]),
  subjectPerformance: jsonb("subject_performance").$type<Array<{
    subject: string;
    averageScore: number;
    timeSpent: number;
    improvement: number;
  }>>().default([]),
  recommendations: jsonb("recommendations").$type<Array<{
    type: string;
    message: string;
    priority: string;
    actionRequired: boolean;
  }>>().default([]),
  adaptiveAdjustments: jsonb("adaptive_adjustments").$type<{
    scheduleChanges: Array<{ subject: string; newTime: string; reason: string }>;
    difficultyAdjustments: Array<{ subject: string; newDifficulty: string; reason: string }>;
    priorityUpdates: Array<{ subject: string; newPriority: string; reason: string }>;
  }>(),
  createdAt: timestamp("created_at").defaultNow()
});

// Explained questions table
export const explainedQuestions = pgTable("explained_questions", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  userId: varchar("user_id").notNull(),
  subjectId: varchar("subject_id").notNull(),
  questionId: varchar("question_id").notNull(),
  question: text("question").notNull(),
  options: jsonb("options").$type<Array<{ id: string; text: string }>>().notNull(),
  correctAnswer: varchar("correct_answer").notNull(),
  userAnswer: varchar("user_answer").notNull(),
  isCorrect: boolean("is_correct").notNull(),
  explanation: text("explanation").notNull(),
  aiModel: varchar("ai_model").default('gemini'),
  difficulty: varchar("difficulty").default('medium'),
  topic: varchar("topic"),
  explainedAt: timestamp("explained_at").defaultNow(),
}, (table) => [
  index("idx_explained_questions_user_subject").on(table.userId, table.subjectId),
  index("idx_explained_questions_user_question").on(table.userId, table.questionId),
]);

// Question reports table for error reporting and feedback
export const questionReports = pgTable("question_reports", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  questionId: varchar("question_id").notNull(),
  userId: varchar("user_id").notNull(),
  reportType: varchar("report_type").notNull(), // 'incorrect_answer', 'unclear_question', 'typo', 'other'
  description: text("description"),
  questionText: text("question_text").notNull(),
  questionOptions: jsonb("question_options").notNull(),
  correctAnswer: varchar("correct_answer").notNull(),
  userAnswer: varchar("user_answer"),
  subject: varchar("subject").notNull(),
  examType: varchar("exam_type"), // utme, wassce, neco
  examYear: varchar("exam_year"),
  status: varchar("status").default("pending"), // 'pending', 'reviewed', 'resolved', 'dismissed'
  adminNotes: text("admin_notes"),
  isResolved: boolean("is_resolved").default(false),
  createdAt: timestamp("created_at").defaultNow(),
  reviewedAt: timestamp("reviewed_at"),
  reviewedBy: varchar("reviewed_by")
}, (table) => [
  index("idx_question_reports_user").on(table.userId),
  index("idx_question_reports_question").on(table.questionId),
  index("idx_question_reports_status").on(table.status),
]);

// Relations
export const usersRelations = relations(users, ({ many }) => ({
  quizSessions: many(quizSessions),
  studyProgress: many(studyProgress),
  explainedQuestions: many(explainedQuestions),
  questionReports: many(questionReports),
  competitionParticipants: many(competitionParticipants),
}));

export const subjectsRelations = relations(subjects, ({ many }) => ({
  questions: many(questions),
  quizSessions: many(quizSessions),
  studyProgress: many(studyProgress),
  studyPlanContent: many(studyPlanContent),
  competitions: many(competitions),
}));

export const questionsRelations = relations(questions, ({ one }) => ({
  subject: one(subjects, {
    fields: [questions.subjectId],
    references: [subjects.id],
  }),
}));

export const quizSessionsRelations = relations(quizSessions, ({ one }) => ({
  user: one(users, {
    fields: [quizSessions.userId],
    references: [users.id],
  }),
  subject: one(subjects, {
    fields: [quizSessions.subjectId],
    references: [subjects.id],
  }),
}));

export const studyProgressRelations = relations(studyProgress, ({ one }) => ({
  user: one(users, {
    fields: [studyProgress.userId],
    references: [users.id],
  }),
  subject: one(subjects, {
    fields: [studyProgress.subjectId],
    references: [subjects.id],
  }),
}));

export const explainedQuestionsRelations = relations(explainedQuestions, ({ one }) => ({
  user: one(users, {
    fields: [explainedQuestions.userId],
    references: [users.id],
  }),
  subject: one(subjects, {
    fields: [explainedQuestions.subjectId],
    references: [subjects.id],
  }),
}));

export const questionReportsRelations = relations(questionReports, ({ one }) => ({
  user: one(users, {
    fields: [questionReports.userId],
    references: [users.id],
  }),
}));

// Zod validation schemas
export const insertUserSchema = createInsertSchema(users).omit({
  id: true,
  createdAt: true,
  updatedAt: true,
});

export const insertSubjectSchema = createInsertSchema(subjects).omit({
  id: true,
  createdAt: true,
  updatedAt: true,
});

export const insertQuestionSchema = createInsertSchema(questions).omit({
  id: true,
  createdAt: true,
});

export const insertQuizSessionSchema = createInsertSchema(quizSessions).omit({
  id: true,
  startedAt: true,
});

export const insertStudyProgressSchema = createInsertSchema(studyProgress).omit({
  id: true,
  createdAt: true,
});

export const insertStudyPlanContentSchema = createInsertSchema(studyPlanContent).omit({
  id: true,
  generatedAt: true,
});

export const insertCompetitionSchema = createInsertSchema(competitions).omit({
  id: true,
  createdAt: true,
});

export const insertCompetitionParticipantSchema = createInsertSchema(competitionParticipants).omit({
  id: true,
  joinedAt: true,
});

export const insertAnalyticsSchema = createInsertSchema(analytics).omit({
  id: true,
  timestamp: true,
});

export const insertOfflineCacheSchema = createInsertSchema(offlineCache).omit({
  id: true,
  lastSynced: true,
});

// Zod schemas for new tables
export const insertShortNotesSchema = createInsertSchema(shortNotes).omit({
  id: true,
  createdAt: true,
  updatedAt: true,
});

export const insertStudySchedulerSchema = createInsertSchema(studyScheduler).omit({
  id: true,
  createdAt: true,
});

export const insertFocusSessionSchema = createInsertSchema(focusSessions).omit({
  id: true,
  createdAt: true,
});

export const insertStudyInsightsSchema = createInsertSchema(studyInsights).omit({
  id: true,
  createdAt: true,
});

export const insertQuestionReportSchema = createInsertSchema(questionReports).omit({
  id: true,
  createdAt: true,
  reviewedAt: true,
});



export const insertExplainedQuestionSchema = createInsertSchema(explainedQuestions).omit({
  id: true,
  explainedAt: true,
});

export const insertPaymentSchema = createInsertSchema(payments).omit({
  id: true,
  createdAt: true,
});

export const insertCbtSessionSchema = createInsertSchema(cbtSessions).omit({
  id: true,
  createdAt: true,
});

// Additional schemas for the admin account
export const upsertUserSchema = createInsertSchema(users).extend({
  id: z.string().optional(),
}).omit({
  createdAt: true,
  updatedAt: true,
});

// Export types
export type User = typeof users.$inferSelect;
export type InsertUser = z.infer<typeof insertUserSchema>;
export type UpsertUser = z.infer<typeof upsertUserSchema>;
export type Subject = typeof subjects.$inferSelect;
export type InsertSubject = z.infer<typeof insertSubjectSchema>;
export type Question = typeof questions.$inferSelect;
export type InsertQuestion = z.infer<typeof insertQuestionSchema>;
export type QuizSession = typeof quizSessions.$inferSelect;
export type InsertQuizSession = z.infer<typeof insertQuizSessionSchema>;
export type StudyProgress = typeof studyProgress.$inferSelect;
export type InsertStudyProgress = z.infer<typeof insertStudyProgressSchema>;
export type StudyPlanContent = typeof studyPlanContent.$inferSelect;
export type InsertStudyPlanContent = z.infer<typeof insertStudyPlanContentSchema>;
export type Competition = typeof competitions.$inferSelect;
export type InsertCompetition = z.infer<typeof insertCompetitionSchema>;
export type CompetitionParticipant = typeof competitionParticipants.$inferSelect;
export type InsertCompetitionParticipant = z.infer<typeof insertCompetitionParticipantSchema>;
export type Analytics = typeof analytics.$inferSelect;
export type InsertAnalytics = z.infer<typeof insertAnalyticsSchema>;
export type OfflineCache = typeof offlineCache.$inferSelect;
export type InsertOfflineCache = z.infer<typeof insertOfflineCacheSchema>;
export type ExplainedQuestion = typeof explainedQuestions.$inferSelect;
export type InsertExplainedQuestion = z.infer<typeof insertExplainedQuestionSchema>;
export type Payment = typeof payments.$inferSelect;
export type InsertPayment = z.infer<typeof insertPaymentSchema>;
export type CbtSession = typeof cbtSessions.$inferSelect;
export type InsertCbtSession = z.infer<typeof insertCbtSessionSchema>;

// New feature types
export type ShortNote = typeof shortNotes.$inferSelect;
export type InsertShortNote = z.infer<typeof insertShortNotesSchema>;
export type StudyScheduler = typeof studyScheduler.$inferSelect;
export type InsertStudyScheduler = z.infer<typeof insertStudySchedulerSchema>;
export type FocusSession = typeof focusSessions.$inferSelect;
export type InsertFocusSession = z.infer<typeof insertFocusSessionSchema>;
export type StudyInsights = typeof studyInsights.$inferSelect;
export type InsertStudyInsights = z.infer<typeof insertStudyInsightsSchema>;