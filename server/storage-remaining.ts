// Complete the remaining storage methods
import { db } from "./db";
import { eq, desc, and } from "drizzle-orm";
import {
  users,
  subjects,
  questions,
  quizSessions,
  studyProgress,
  studyPlanContent,
  competitions,
  competitionParticipants,
  analytics,
  offlineCache,
  explainedQuestions,
  type User,
  type StudyPlanContent,
  type InsertStudyPlanContent,
  type Competition,
  type InsertCompetition,
  type CompetitionParticipant,
  type InsertCompetitionParticipant,
  type Analytics,
  type InsertAnalytics,
  type OfflineCache,
  type InsertOfflineCache,
  type ExplainedQuestion,
  type InsertExplainedQuestion
} from "@shared/schema";

export class RemainingStorageMethods {
  // Study plan operations
  async getStudyPlanContent(subjectId: string, topic: string): Promise<StudyPlanContent | undefined> {
    const [content] = await db
      .select()
      .from(studyPlanContent)
      .where(and(
        eq(studyPlanContent.subjectId, subjectId),
        eq(studyPlanContent.topic, topic)
      ));
    return content || undefined;
  }

  async saveStudyPlanContent(contentData: InsertStudyPlanContent): Promise<StudyPlanContent> {
    const [content] = await db
      .insert(studyPlanContent)
      .values(contentData)
      .returning();
    return content;
  }

  // Leaderboard operations
  async getLeaderboard(limit: number): Promise<Array<{
    id: string;
    nickname: string;
    avatarUrl?: string;
    totalScore: number;
    testsCompleted: number;
  }>> {
    const result = await db
      .select({
        id: users.id,
        nickname: users.nickname,
        avatarUrl: users.avatarUrl,
        totalScore: users.totalScore,
        testsCompleted: users.testsCompleted,
      })
      .from(users)
      .orderBy(desc(users.totalScore))
      .limit(limit);

    return result.map(u => ({
      id: u.id,
      nickname: u.nickname,
      avatarUrl: u.avatarUrl || undefined,
      totalScore: u.totalScore || 0,
      testsCompleted: u.testsCompleted || 0
    }));
  }

  // Competition operations
  async createCompetition(competitionData: InsertCompetition): Promise<Competition> {
    const [competition] = await db
      .insert(competitions)
      .values(competitionData)
      .returning();
    return competition;
  }

  async getCompetition(id: string): Promise<Competition | undefined> {
    const [competition] = await db.select().from(competitions).where(eq(competitions.id, id));
    return competition || undefined;
  }

  async updateCompetition(id: string, updates: Partial<Competition>): Promise<Competition> {
    const [updated] = await db
      .update(competitions)
      .set(updates)
      .where(eq(competitions.id, id))
      .returning();
    
    if (!updated) throw new Error("Competition not found");
    return updated;
  }

  async joinCompetition(competitionId: string, userId: string): Promise<CompetitionParticipant> {
    const [participant] = await db
      .insert(competitionParticipants)
      .values({
        competitionId,
        userId,
        score: 0,
        timeSpent: 0,
        answers: []
      })
      .returning();
    return participant;
  }

  async getCompetitionParticipants(competitionId: string): Promise<CompetitionParticipant[]> {
    return await db
      .select()
      .from(competitionParticipants)
      .where(eq(competitionParticipants.competitionId, competitionId));
  }

  async updateCompetitionParticipant(id: string, updates: Partial<CompetitionParticipant>): Promise<CompetitionParticipant> {
    const [updated] = await db
      .update(competitionParticipants)
      .set(updates)
      .where(eq(competitionParticipants.id, id))
      .returning();
    
    if (!updated) throw new Error("Participant not found");
    return updated;
  }

  async getActiveCompetitions(limit: number): Promise<Competition[]> {
    return await db
      .select()
      .from(competitions)
      .where(eq(competitions.status, "active"))
      .orderBy(desc(competitions.createdAt))
      .limit(limit);
  }

  // Analytics operations
  async logAnalyticsEvent(eventData: InsertAnalytics): Promise<Analytics> {
    const [event] = await db
      .insert(analytics)
      .values(eventData)
      .returning();
    return event;
  }

  async getAnalyticsData(userId?: string, eventType?: string, limit = 100): Promise<Analytics[]> {
    let query = db.select().from(analytics);
    
    const conditions = [];
    if (userId) conditions.push(eq(analytics.userId, userId));
    if (eventType) conditions.push(eq(analytics.eventType, eventType));
    
    if (conditions.length > 0) {
      query = query.where(and(...conditions));
    }
    
    return await query
      .orderBy(desc(analytics.timestamp))
      .limit(limit);
  }

  // Offline cache operations
  async getCachedContent(userId: string, subjectId: string, contentType: string): Promise<OfflineCache | undefined> {
    const [cached] = await db
      .select()
      .from(offlineCache)
      .where(and(
        eq(offlineCache.userId, userId),
        eq(offlineCache.subjectId, subjectId),
        eq(offlineCache.contentType, contentType)
      ));
    return cached || undefined;
  }

  async cacheContent(cacheData: InsertOfflineCache): Promise<OfflineCache> {
    const [existing] = await db
      .select()
      .from(offlineCache)
      .where(and(
        eq(offlineCache.userId, cacheData.userId),
        eq(offlineCache.subjectId, cacheData.subjectId),
        eq(offlineCache.contentType, cacheData.contentType)
      ));

    if (existing) {
      const [updated] = await db
        .update(offlineCache)
        .set({ ...cacheData, lastSynced: new Date() })
        .where(eq(offlineCache.id, existing.id))
        .returning();
      return updated;
    } else {
      const [newCache] = await db
        .insert(offlineCache)
        .values(cacheData)
        .returning();
      return newCache;
    }
  }

  // Explained questions operations
  async createExplainedQuestion(explainedQuestionData: InsertExplainedQuestion): Promise<ExplainedQuestion> {
    const [explainedQuestion] = await db
      .insert(explainedQuestions)
      .values(explainedQuestionData)
      .returning();
    return explainedQuestion;
  }

  async getExplainedQuestion(userId: string, questionId: string): Promise<ExplainedQuestion | null> {
    const [explainedQuestion] = await db
      .select()
      .from(explainedQuestions)
      .where(and(
        eq(explainedQuestions.userId, userId),
        eq(explainedQuestions.questionId, questionId)
      ));
    return explainedQuestion || null;
  }

  async getExplainedQuestionsByUser(userId: string, subjectId?: string, limit?: number): Promise<ExplainedQuestion[]> {
    let query = db.select().from(explainedQuestions).where(eq(explainedQuestions.userId, userId));
    
    if (subjectId) {
      query = query.where(and(
        eq(explainedQuestions.userId, userId),
        eq(explainedQuestions.subjectId, subjectId)
      ));
    }
    
    query = query.orderBy(desc(explainedQuestions.explainedAt));
    
    if (limit) {
      query = query.limit(limit);
    }
    
    return await query;
  }

  async getExplainedQuestionsBySubject(userId: string, subjectId: string, limit?: number): Promise<ExplainedQuestion[]> {
    let query = db
      .select()
      .from(explainedQuestions)
      .where(and(
        eq(explainedQuestions.userId, userId),
        eq(explainedQuestions.subjectId, subjectId)
      ))
      .orderBy(desc(explainedQuestions.explainedAt));
      
    if (limit) {
      query = query.limit(limit);
    }
    
    return await query;
  }

  async updateExplainedQuestion(id: string, updates: Partial<ExplainedQuestion>): Promise<ExplainedQuestion | null> {
    const [updated] = await db
      .update(explainedQuestions)
      .set(updates)
      .where(eq(explainedQuestions.id, id))
      .returning();
    
    return updated || null;
  }

  async deleteExplainedQuestion(id: string): Promise<boolean> {
    const result = await db
      .delete(explainedQuestions)
      .where(eq(explainedQuestions.id, id));
    
    return result.rowCount > 0;
  }

  // Admin operations
  async getAllUsers(): Promise<User[]> {
    return await db.select().from(users);
  }

  async getAllQuestions(): Promise<any[]> {
    return await db.select().from(questions);
  }

  async deleteQuestion(id: string): Promise<void> {
    await db.delete(questions).where(eq(questions.id, id));
  }

  async getAnalyticsSummary(): Promise<any> {
    const totalUsers = await db.select().from(users);
    const totalQuestions = await db.select().from(questions);
    const totalSessions = await db.select().from(quizSessions);
    
    return {
      totalUsers: totalUsers.length,
      totalQuestions: totalQuestions.length,
      totalSessions: totalSessions.length,
      activeUsers: totalUsers.filter(u => u.isActivated).length
    };
  }
}