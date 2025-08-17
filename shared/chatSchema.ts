import { sql } from 'drizzle-orm';
import {
  pgTable,
  varchar,
  text,
  timestamp,
  jsonb,
  integer,
  boolean
} from "drizzle-orm/pg-core";
import { createInsertSchema } from "drizzle-zod";
import { z } from "zod";

// Chat messages table for storing conversation history
export const chatMessages = pgTable("chat_messages", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  userId: varchar("user_id").notNull(),
  conversationId: varchar("conversation_id").notNull(), // Groups messages into conversations
  content: text("content").notNull(),
  sender: varchar("sender").notNull(), // 'user' | 'ai'
  aiModel: varchar("ai_model"), // 'groq' | 'gemini' | 'kaiz' | 'openai'
  metadata: jsonb("metadata").$type<{
    imageUrl?: string;
    responseTime?: number;
    tokens?: number;
  }>(),
  createdAt: timestamp("created_at").defaultNow(),
});

// Chat conversations table for organizing chat sessions
export const chatConversations = pgTable("chat_conversations", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  userId: varchar("user_id").notNull(),
  title: varchar("title").notNull().default("New Conversation"),
  messageCount: integer("message_count").default(0),
  lastMessage: text("last_message"),
  lastMessageAt: timestamp("last_message_at"),
  isActive: boolean("is_active").default(true),
  createdAt: timestamp("created_at").defaultNow(),
  updatedAt: timestamp("updated_at").defaultNow(),
});

// Chat usage tracking for analytics and limits
export const chatUsage = pgTable("chat_usage", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  userId: varchar("user_id").notNull(),
  date: varchar("date").notNull(), // YYYY-MM-DD format
  messagesSent: integer("messages_sent").default(0),
  aiResponses: integer("ai_responses").default(0),
  totalTokens: integer("total_tokens").default(0),
  modelsUsed: jsonb("models_used").$type<Record<string, number>>().default({}),
  averageResponseTime: integer("average_response_time").default(0), // in milliseconds
  createdAt: timestamp("created_at").defaultNow(),
  updatedAt: timestamp("updated_at").defaultNow(),
});

// User badges for achievements and engagement
export const userBadges = pgTable("user_badges", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  userId: varchar("user_id").notNull(),
  badgeType: varchar("badge_type").notNull(), // 'study_streak', 'quiz_master', 'chat_enthusiast', 'early_adopter', etc.
  title: varchar("title").notNull(),
  description: text("description").notNull(),
  icon: varchar("icon").notNull(),
  color: varchar("color").default("#3B82F6"), // hex color
  rarity: varchar("rarity").default("common"), // common, rare, epic, legendary
  isVisible: boolean("is_visible").default(true),
  progress: integer("progress").default(0), // for progressive badges
  maxProgress: integer("max_progress").default(1),
  unlockedAt: timestamp("unlocked_at").defaultNow(),
  criteria: jsonb("criteria").$type<{
    studyDays?: number;
    quizScore?: number;
    chatMessages?: number;
    examsPassed?: number;
    subjectsCompleted?: number;
  }>(),
});

// Types
export type ChatMessage = typeof chatMessages.$inferSelect;
export type InsertChatMessage = typeof chatMessages.$inferInsert;

export type ChatConversation = typeof chatConversations.$inferSelect;
export type InsertChatConversation = typeof chatConversations.$inferInsert;

export type ChatUsage = typeof chatUsage.$inferSelect;
export type InsertChatUsage = typeof chatUsage.$inferInsert;

export type UserBadge = typeof userBadges.$inferSelect;
export type InsertUserBadge = typeof userBadges.$inferInsert;

// Zod schemas
export const insertChatMessageSchema = createInsertSchema(chatMessages);
export const insertChatConversationSchema = createInsertSchema(chatConversations);
export const insertChatUsageSchema = createInsertSchema(chatUsage);
export const insertUserBadgeSchema = createInsertSchema(userBadges);