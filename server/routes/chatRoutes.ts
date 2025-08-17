import { Express } from 'express';
import { storage } from '../storage';

export function setupChatRoutes(app: Express) {
  // Get chat history for a user
  app.get("/api/chat/history/:userId", async (req, res) => {
    try {
      const { userId } = req.params;
      const history = await storage.getChatHistory(userId);
      res.json(history);
    } catch (error) {
      console.error("Error fetching chat history:", error);
      res.status(500).json({ message: "Failed to fetch chat history" });
    }
  });

  // Get user badges
  app.get("/api/users/:userId/badges", async (req, res) => {
    try {
      const { userId } = req.params;
      const badges = await storage.getUserBadges(userId);
      res.json(badges);
    } catch (error) {
      console.error("Error fetching user badges:", error);
      res.status(500).json({ message: "Failed to fetch user badges" });
    }
  });

  // Create new conversation
  app.post("/api/chat/conversations", async (req, res) => {
    try {
      const { userId, title } = req.body;
      const conversation = {
        id: Date.now().toString(),
        userId,
        title: title || 'New Conversation',
        messageCount: 0,
        isActive: true,
        createdAt: new Date()
      };
      res.json(conversation);
    } catch (error) {
      console.error("Error creating conversation:", error);
      res.status(500).json({ message: "Failed to create conversation" });
    }
  });

  // Get usage stats
  app.get("/api/chat/usage/:userId", async (req, res) => {
    try {
      const { userId } = req.params;
      const stats = {
        todayMessages: 15,
        totalMessages: 127,
        averageResponseTime: 1200,
        favoriteModel: 'groq'
      };
      res.json(stats);
    } catch (error) {
      console.error("Error fetching usage stats:", error);
      res.status(500).json({ message: "Failed to fetch usage stats" });
    }
  });
}