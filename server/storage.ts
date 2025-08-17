import { db } from "./db";
import { eq, desc, and, count, sql } from "drizzle-orm";
import {
  users,
  subjects,
  questions,
  quizSessions,
  studyProgress,
  payments,
  cbtSessions,
  shortNotes,
  studyScheduler,
  chatMessages,
  chatConversations,
  chatUsage,
  userBadges,
  explainedQuestions,
  type User,
  type InsertUser,
  type Subject, 
  type InsertSubject,
  type Question,
  type InsertQuestion,
  type QuizSession,
  type InsertQuizSession,
  type StudyProgress,
  type InsertStudyProgress,
  type Payment,
  type InsertPayment,
  type CbtSession,
  type InsertCbtSession,
  type ShortNote,
  type InsertShortNote,
  type StudyScheduler,
  type InsertStudyScheduler,
  type ChatMessage,
  type InsertChatMessage,
  type ChatConversation,
  type InsertChatConversation,
  type ChatUsage,
  type InsertChatUsage,
  type UserBadge,
  type InsertUserBadge
} from "@shared/schema";

export interface IStorage {
  // User operations (including support for admin and usage limiting)
  getUser(id: string): Promise<User | undefined>;
  getUserByEmail(email: string): Promise<User | undefined>;
  getUserByNickname(nickname: string): Promise<User | undefined>;
  createUser(user: InsertUser): Promise<User>;
  updateUser(id: string, updates: Partial<User>): Promise<User>;
  activateUser(id: string, activationCode: string): Promise<User>;
  incrementUsageCount(userId: string): Promise<User>;
  
  // Subject operations
  getAllSubjects(): Promise<Subject[]>;
  getSubject(id: string): Promise<Subject | undefined>;
  createSubject(subject: InsertSubject): Promise<Subject>;

  // Question operations
  getQuestionsBySubject(subjectId: string, limit?: number): Promise<Question[]>;
  createQuestion(question: InsertQuestion): Promise<Question>;

  // Quiz sessions
  createQuizSession(session: InsertQuizSession): Promise<QuizSession>;
  getQuizSession(id: string): Promise<QuizSession | undefined>;
  updateQuizSession(id: string, updates: Partial<QuizSession>): Promise<QuizSession>;
  getUserQuizSessions(userId: string, limit?: number): Promise<QuizSession[]>;

  // Study progress
  getStudyProgress(userId: string, subjectId: string): Promise<StudyProgress | undefined>;
  createStudyProgress(progress: InsertStudyProgress): Promise<StudyProgress>;
  updateStudyProgress(userId: string, subjectId: string, updates: Partial<StudyProgress>): Promise<StudyProgress>;
  getAllUserProgress(userId: string): Promise<StudyProgress[]>;

  // Payment operations
  createPayment(payment: InsertPayment): Promise<Payment>;
  getPaymentByReference(reference: string): Promise<Payment | undefined>;
  updatePayment(id: string, updates: Partial<Payment>): Promise<Payment>;
  getUserPayments?(userId: string): Promise<Payment[]>;

  // CBT sessions
  createCbtSession(session: InsertCbtSession): Promise<CbtSession>;
  getCbtSession(id: string): Promise<CbtSession | undefined>;
  updateCbtSession(id: string, updates: Partial<CbtSession>): Promise<CbtSession>;
  getUserActiveCbtSession(userId: string): Promise<CbtSession | undefined>;

  // Short notes
  createShortNote(note: InsertShortNote): Promise<ShortNote>;
  getShortNotesBySubject(subjectId: string): Promise<ShortNote[]>;
  getUserShortNotes(userId: string): Promise<ShortNote[]>;

  // Study scheduler
  createStudySchedule(schedule: InsertStudyScheduler): Promise<StudyScheduler>;
  updateStudySchedule(id: string, updates: Partial<StudyScheduler>): Promise<StudyScheduler>;
  getUserStudySchedules(userId: string): Promise<StudyScheduler[]>;

  // Chat methods
  saveChatMessage(userId: string, content: string, sender: 'user' | 'ai', model?: string): Promise<ChatMessage>;
  updateChatUsage(userId: string, model: string, responseTime: number): Promise<ChatUsage>;
  getChatHistory(userId: string): Promise<ChatMessage[]>;
  createUserBadge(badge: InsertUserBadge): Promise<UserBadge>;
  getUserBadges(userId: string): Promise<UserBadge[]>;
  createChatConversation(conversation: InsertChatConversation): Promise<ChatConversation>;
  getChatConversations(userId: string): Promise<ChatConversation[]>;

  // Explained questions methods
  getExplainedQuestion(userId: string, questionId: string): Promise<any | undefined>;
  createExplainedQuestion(explanation: any): Promise<any>;
  getExplainedQuestionsByUser(userId: string): Promise<any[]>;
  getExplainedQuestionsBySubject(userId: string, subjectId: string): Promise<any[]>;
  deleteExplainedQuestion(id: string): Promise<void>;
}

export class DatabaseStorage implements IStorage {
  async getUser(id: string): Promise<User | undefined> {
    const [user] = await db.select().from(users).where(eq(users.id, id));
    return user || undefined;
  }

  async getUserByEmail(email: string): Promise<User | undefined> {
    const [user] = await db.select().from(users).where(eq(users.email, email));
    return user || undefined;
  }

  async getUserByNickname(nickname: string): Promise<User | undefined> {
    const [user] = await db.select().from(users).where(eq(users.nickname, nickname));
    return user || undefined;
  }

  async createUser(insertUser: InsertUser): Promise<User> {
    const [user] = await db
      .insert(users)
      .values(insertUser)
      .returning();
    return user;
  }

  async updateUser(id: string, updates: Partial<User>): Promise<User> {
    const [user] = await db
      .update(users)
      .set(updates)
      .where(eq(users.id, id))
      .returning();
    return user;
  }

  async activateUser(id: string, activationCode: string): Promise<User> {
    const [user] = await db
      .update(users)
      .set({ isActivated: true, isPremium: true })
      .where(and(eq(users.id, id), eq(users.activationCode, activationCode)))
      .returning();
    if (!user) {
      throw new Error('Invalid activation code');
    }
    return user;
  }

  async incrementUsageCount(userId: string): Promise<User> {
    const [user] = await db
      .update(users)
      .set({ usageCount: sql`${users.usageCount} + 1` })
      .where(eq(users.id, userId))
      .returning();
    return user;
  }

  async getAllSubjects(): Promise<Subject[]> {
    return await db.select().from(subjects);
  }

  async getSubject(id: string): Promise<Subject | undefined> {
    const [subject] = await db.select().from(subjects).where(eq(subjects.id, id));
    return subject || undefined;
  }

  async createSubject(subject: InsertSubject): Promise<Subject> {
    const [newSubject] = await db
      .insert(subjects)
      .values(subject)
      .returning();
    return newSubject;
  }

  async getQuestionsBySubject(subjectId: string, limit = 20): Promise<Question[]> {
    return await db
      .select()
      .from(questions)
      .where(eq(questions.subjectId, subjectId))
      .limit(limit);
  }

  async createQuestion(question: InsertQuestion): Promise<Question> {
    const [newQuestion] = await db
      .insert(questions)
      .values([question])
      .returning();
    return newQuestion;
  }

  async createQuizSession(session: InsertQuizSession): Promise<QuizSession> {
    const [newSession] = await db
      .insert(quizSessions)
      .values([session])
      .returning();
    return newSession;
  }

  async getQuizSession(id: string): Promise<QuizSession | undefined> {
    const [session] = await db.select().from(quizSessions).where(eq(quizSessions.id, id));
    return session || undefined;
  }

  async updateQuizSession(id: string, updates: Partial<QuizSession>): Promise<QuizSession> {
    const [session] = await db
      .update(quizSessions)
      .set(updates)
      .where(eq(quizSessions.id, id))
      .returning();
    return session;
  }

  async getUserQuizSessions(userId: string, limit = 10): Promise<QuizSession[]> {
    return await db
      .select()
      .from(quizSessions)
      .where(eq(quizSessions.userId, userId))
      .orderBy(desc(quizSessions.startedAt))
      .limit(limit);
  }

  async getStudyProgress(userId: string, subjectId: string): Promise<StudyProgress | undefined> {
    const [progress] = await db
      .select()
      .from(studyProgress)
      .where(and(eq(studyProgress.userId, userId), eq(studyProgress.subjectId, subjectId)));
    return progress || undefined;
  }

  async createStudyProgress(progress: InsertStudyProgress): Promise<StudyProgress> {
    const [newProgress] = await db
      .insert(studyProgress)
      .values(progress)
      .returning();
    return newProgress;
  }

  async updateStudyProgress(userId: string, subjectId: string, updates: Partial<StudyProgress>): Promise<StudyProgress> {
    const [progress] = await db
      .update(studyProgress)
      .set(updates)
      .where(and(eq(studyProgress.userId, userId), eq(studyProgress.subjectId, subjectId)))
      .returning();
    return progress;
  }

  async getAllUserProgress(userId: string): Promise<StudyProgress[]> {
    return await db
      .select()
      .from(studyProgress)
      .where(eq(studyProgress.userId, userId));
  }

  async createPayment(payment: InsertPayment): Promise<Payment> {
    const [newPayment] = await db
      .insert(payments)
      .values(payment)
      .returning();
    return newPayment;
  }

  async getPaymentByReference(reference: string): Promise<Payment | undefined> {
    const [payment] = await db
      .select()
      .from(payments)
      .where(eq(payments.paymentReference, reference));
    return payment || undefined;
  }

  async updatePayment(id: string, updates: Partial<Payment>): Promise<Payment> {
    const [payment] = await db
      .update(payments)
      .set(updates)
      .where(eq(payments.id, id))
      .returning();
    return payment;
  }

  async getUserPayments(userId: string): Promise<Payment[]> {
    return await db
      .select()
      .from(payments)
      .where(eq(payments.userId, userId))
      .orderBy(desc(payments.createdAt));
  }

  async createCbtSession(session: InsertCbtSession): Promise<CbtSession> {
    const [newSession] = await db
      .insert(cbtSessions)
      .values(session)
      .returning();
    return newSession;
  }

  async getCbtSession(id: string): Promise<CbtSession | undefined> {
    const [session] = await db.select().from(cbtSessions).where(eq(cbtSessions.id, id));
    return session || undefined;
  }

  async updateCbtSession(id: string, updates: Partial<CbtSession>): Promise<CbtSession> {
    const [session] = await db
      .update(cbtSessions)
      .set(updates)
      .where(eq(cbtSessions.id, id))
      .returning();
    return session;
  }

  async getUserActiveCbtSession(userId: string): Promise<CbtSession | undefined> {
    const [session] = await db
      .select()
      .from(cbtSessions)
      .where(and(eq(cbtSessions.userId, userId), eq(cbtSessions.isActive, true)));
    return session || undefined;
  }

  async createShortNote(note: InsertShortNote): Promise<ShortNote> {
    const [newNote] = await db
      .insert(shortNotes)
      .values(note)
      .returning();
    return newNote;
  }

  async getShortNotesBySubject(subjectId: string): Promise<ShortNote[]> {
    return await db
      .select()
      .from(shortNotes)
      .where(eq(shortNotes.subjectId, subjectId));
  }

  async getUserShortNotes(userId: string): Promise<ShortNote[]> {
    return await db
      .select()
      .from(shortNotes)
      .where(eq(shortNotes.userId, userId));
  }

  async createStudySchedule(schedule: InsertStudyScheduler): Promise<StudyScheduler> {
    const [newSchedule] = await db
      .insert(studyScheduler)
      .values(schedule)
      .returning();
    return newSchedule;
  }

  async updateStudySchedule(id: string, updates: Partial<StudyScheduler>): Promise<StudyScheduler> {
    const [schedule] = await db
      .update(studyScheduler)
      .set(updates)
      .where(eq(studyScheduler.id, id))
      .returning();
    return schedule;
  }

  async getUserStudySchedules(userId: string): Promise<StudyScheduler[]> {
    return await db
      .select()
      .from(studyScheduler)
      .where(eq(studyScheduler.userId, userId));
  }

  // Chat methods implementation
  async saveChatMessage(message: InsertChatMessage): Promise<ChatMessage> {
    const [newMessage] = await db
      .insert(chatMessages)
      .values(message)
      .returning();
    return newMessage;
  }

  async updateChatUsage(userId: string, model: string, responseTime: number): Promise<ChatUsage> {
    const today = new Date().toISOString().split('T')[0];
    
    // Try to find existing usage record for today
    const [existingUsage] = await db
      .select()
      .from(chatUsage)
      .where(and(eq(chatUsage.userId, userId), eq(chatUsage.date, today)));
    
    if (existingUsage) {
      // Update existing record
      const [updatedUsage] = await db
        .update(chatUsage)
        .set({
          aiResponses: sql`${chatUsage.aiResponses} + 1`,
          averageResponseTime: Math.round(((existingUsage.averageResponseTime || 0) + responseTime) / 2),
          modelsUsed: {
            ...(existingUsage.modelsUsed || {}),
            [model]: ((existingUsage.modelsUsed || {})[model] || 0) + 1
          },
          updatedAt: new Date()
        })
        .where(eq(chatUsage.id, existingUsage.id))
        .returning();
      return updatedUsage;
    } else {
      // Create new record
      const [newUsage] = await db
        .insert(chatUsage)
        .values({
          userId,
          date: today,
          messagesSent: 0,
          aiResponses: 1,
          totalTokens: 0,
          modelsUsed: { [model]: 1 },
          averageResponseTime: responseTime
        })
        .returning();
      return newUsage;
    }
  }

  async saveChatMessageWithParams(userId: string, content: string, sender: 'user' | 'ai', model?: string): Promise<ChatMessage> {
    const [newMessage] = await db
      .insert(chatMessages)
      .values({
        userId,
        content,
        sender,
        aiModel: model || 'groq',
        conversationId: 'default'
      })
      .returning();
    return newMessage;
  }

  async getChatHistory(userId: string): Promise<ChatMessage[]> {
    return await db
      .select()
      .from(chatMessages)
      .where(eq(chatMessages.userId, userId))
      .orderBy(desc(chatMessages.createdAt))
      .limit(100);
  }

  async createUserBadge(badge: InsertUserBadge): Promise<UserBadge> {
    const [newBadge] = await db
      .insert(userBadges)
      .values(badge)
      .returning();
    return newBadge;
  }

  async getUserBadges(userId: string): Promise<UserBadge[]> {
    return await db
      .select()
      .from(userBadges)
      .where(eq(userBadges.userId, userId))
      .orderBy(desc(userBadges.unlockedAt));
  }

  async createChatConversation(conversation: InsertChatConversation): Promise<ChatConversation> {
    const [newConversation] = await db
      .insert(chatConversations)
      .values(conversation)
      .returning();
    return newConversation;
  }

  async getChatConversations(userId: string): Promise<ChatConversation[]> {
    return await db
      .select()
      .from(chatConversations)
      .where(eq(chatConversations.userId, userId))
      .orderBy(desc(chatConversations.updatedAt));
  }

  // Explained questions implementation
  async getExplainedQuestion(userId: string, questionId: string): Promise<any | undefined> {
    const [explanation] = await db
      .select()
      .from(explainedQuestions)
      .where(and(eq(explainedQuestions.userId, userId), eq(explainedQuestions.questionId, questionId)));
    return explanation || undefined;
  }

  async createExplainedQuestion(explanation: any): Promise<any> {
    const [newExplanation] = await db
      .insert(explainedQuestions)
      .values(explanation)
      .returning();
    return newExplanation;
  }

  async getExplainedQuestionsByUser(userId: string): Promise<any[]> {
    return await db
      .select()
      .from(explainedQuestions)
      .where(eq(explainedQuestions.userId, userId))
      .orderBy(desc(explainedQuestions.explainedAt));
  }

  async getExplainedQuestionsBySubject(userId: string, subjectId: string): Promise<any[]> {
    return await db
      .select()
      .from(explainedQuestions)
      .where(and(eq(explainedQuestions.userId, userId), eq(explainedQuestions.subjectId, subjectId)))
      .orderBy(desc(explainedQuestions.explainedAt));
  }

  async deleteExplainedQuestion(id: string): Promise<void> {
    await db
      .delete(explainedQuestions)
      .where(eq(explainedQuestions.id, id));
  }
}

export const storage = new DatabaseStorage();