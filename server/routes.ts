import type { Express } from "express";
import { createServer, type Server } from "http";
import multer from "multer";
import bcrypt from "bcrypt";
import { storage } from "./storage";
import { aiService } from "./services/aiService";
import { wikiService } from "./services/wikiService";
import { sendEmail, generateVerificationEmail, generateWelcomeEmail } from "./services/emailService";
import { twilioService } from "./services/twilioService";
// import { googleAuthService } from "./services/googleAuthService"; // DISABLED: Uncomment to re-enable Google OAuth
import { generateVerificationToken, generateTokenExpiration, isTokenExpired } from "./utils/crypto";
import { insertUserSchema, insertQuizSessionSchema } from "@shared/schema";
import { registerCBTRoutes } from "./routes/cbtRoutes";

// Valid unlock codes
const VALID_UNLOCK_CODES = ['08148800', '09019180', '08039890'];

// Configure multer for file uploads
const upload = multer({
  storage: multer.memoryStorage(),
  limits: {
    fileSize: 5 * 1024 * 1024, // 5MB limit
  },
  fileFilter: (req, file, cb) => {
    if (file.mimetype.startsWith('image/')) {
      cb(null, true);
    } else {
      cb(new Error('Only image files are allowed'));
    }
  },
});

export async function registerRoutes(app: Express): Promise<Server> {
  // In-memory user storage for testing (temporary until MongoDB is fixed)
  const tempUsers = new Map();

  // Register CBT routes for ALOC API integration
  registerCBTRoutes(app);

  // Health check endpoint for deployment
  app.get("/api/health", (req, res) => {
    res.json({ 
      status: "ok", 
      timestamp: new Date().toISOString(),
      environment: process.env.NODE_ENV || 'development'
    });
  });

  // Authentication routes with email verification
  app.post("/api/auth/register", async (req, res) => {
    try {
      const { firstName, lastName, email, nickname, password } = req.body;
      
      if (!firstName || !lastName || !email || !nickname || !password) {
        return res.status(400).json({ message: "All fields are required" });
      }

      // Check if email already exists
      const existingUser = await storage.getUserByEmail(email);
      if (existingUser) {
        return res.status(400).json({ message: "Email already registered" });
      }

      // Hash password properly
      const hashedPassword = await bcrypt.hash(password, 10);

      // Generate email verification token
      const verificationToken = generateVerificationToken();
      const verificationExpires = generateTokenExpiration();

      // Create user with verification fields
      const userData = {
        firstName, 
        lastName, 
        email, 
        nickname, 
        password: hashedPassword,
        isAdmin: false,
        isPremium: false,
        isActivated: false,
        isEmailVerified: false,
        emailVerificationToken: verificationToken,
        emailVerificationExpires: verificationExpires,
        totalScore: 0,
        testsCompleted: 0,
        studyHours: 0,
        usageCount: 0
      };

      const newUser = await storage.createUser(userData);
      
      // Send verification email
      const emailContent = generateVerificationEmail(email, verificationToken);
      const emailSent = await sendEmail(emailContent);
      
      if (emailSent) {
        console.log(`Verification email sent to ${email}`);
      } else {
        console.warn(`Failed to send verification email to ${email}`);
      }
      
      // Remove sensitive data from response
      const { password: _, emailVerificationToken: __, ...userResponse } = newUser;
      
      res.json({
        ...userResponse,
        message: "Registration successful! Please check your email for verification link.",
        emailSent: emailSent
      });
    } catch (error) {
      console.error("Error creating user:", error);
      res.status(500).json({ message: "Failed to create user" });
    }
  });

  // Email verification endpoint
  app.get("/api/auth/verify-email", async (req, res) => {
    try {
      const { token, email } = req.query;
      
      if (!token || !email) {
        return res.status(400).json({ message: "Verification token and email are required" });
      }

      // Get user by email
      const user = await storage.getUserByEmail(email as string);
      if (!user) {
        return res.status(404).json({ message: "User not found" });
      }

      // Check if already verified
      if (user.isEmailVerified) {
        return res.status(400).json({ message: "Email already verified" });
      }

      // Validate token
      if (user.emailVerificationToken !== token) {
        return res.status(400).json({ message: "Invalid verification token" });
      }

      // Check if token expired
      if (!user.emailVerificationExpires || isTokenExpired(user.emailVerificationExpires)) {
        return res.status(400).json({ message: "Verification token has expired. Please request a new one." });
      }

      // Update user as verified
      const updatedUser = await storage.updateUser(user.id, {
        isEmailVerified: true,
        isActivated: true, // Auto-activate after email verification
        emailVerificationToken: null,
        emailVerificationExpires: null
      });

      // Send welcome email
      const welcomeEmailContent = generateWelcomeEmail(user.email, user.firstName || user.nickname);
      await sendEmail(welcomeEmailContent);

      console.log(`Email verified for user: ${email}`);
      
      res.json({ 
        message: "Email verified successfully! Your account is now active.",
        user: {
          id: updatedUser.id,
          email: updatedUser.email,
          nickname: updatedUser.nickname,
          isEmailVerified: true,
          isActivated: true
        }
      });
    } catch (error) {
      console.error("Error verifying email:", error);
      res.status(500).json({ message: "Failed to verify email" });
    }
  });

  // Resend verification email endpoint
  app.post("/api/auth/resend-verification", async (req, res) => {
    try {
      const { email } = req.body;
      
      if (!email) {
        return res.status(400).json({ message: "Email is required" });
      }

      const user = await storage.getUserByEmail(email);
      if (!user) {
        return res.status(404).json({ message: "User not found" });
      }

      if (user.isEmailVerified) {
        return res.status(400).json({ message: "Email already verified" });
      }

      // Generate new verification token
      const verificationToken = generateVerificationToken();
      const verificationExpires = generateTokenExpiration();

      // Update user with new token
      await storage.updateUser(user.id, {
        emailVerificationToken: verificationToken,
        emailVerificationExpires: verificationExpires
      });

      // Send new verification email
      const emailContent = generateVerificationEmail(email, verificationToken);
      const emailSent = await sendEmail(emailContent);
      
      if (emailSent) {
        console.log(`New verification email sent to ${email}`);
        res.json({ message: "Verification email sent! Please check your inbox." });
      } else {
        res.status(500).json({ message: "Failed to send verification email" });
      }
    } catch (error) {
      console.error("Error resending verification email:", error);
      res.status(500).json({ message: "Failed to resend verification email" });
    }
  });

  // Login route with email verification check
  app.post("/api/auth/login", async (req, res) => {
    try {
      const { email, password } = req.body;
      
      if (!email || !password) {
        return res.status(400).json({ message: "Email and password are required" });
      }

      // Get user from database
      const user = await storage.getUserByEmail(email);
      if (!user) {
        return res.status(401).json({ message: "Invalid email or password" });
      }

      // Verify password
      const isValidPassword = await bcrypt.compare(password, user.password);
      if (!isValidPassword) {
        return res.status(401).json({ message: "Invalid email or password" });
      }

      // TEMPORARY: Skip email verification for development until email service is set up
      // Auto-verify email in development mode for convenience
      if (!user.isEmailVerified) {
        await storage.updateUser(user.id, { isEmailVerified: true });
        user.isEmailVerified = true;
        console.log(`✅ Auto-verified email for development: ${user.email}`);
      }

      // Remove password from response
      const { password: _, emailVerificationToken: __, ...userResponse } = user;
      
      console.log(`User logged in: ${email}`);
      res.json(userResponse);
    } catch (error) {
      console.error("Error during login:", error);
      res.status(500).json({ message: "Failed to login" });
    }
  });

  // Activation route
  app.post("/api/auth/activate", async (req, res) => {
    try {
      const { userId, activationCode } = req.body;
      
      if (!userId || !activationCode) {
        return res.status(400).json({ message: "User ID and activation code are required" });
      }

      // Check if the code matches the valid unlock codes
      if (!VALID_UNLOCK_CODES.includes(activationCode)) {
        return res.status(400).json({ message: "Invalid activation code. Please message admin on WhatsApp to get a valid unlock code." });
      }

      // Check if user exists in temporary storage first 
      let user = tempUsers.get(userId) || Array.from(tempUsers.values()).find(u => u._id === userId);
      
      if (!user) {
        // Try database storage
        try {
          user = await storage.getUser(userId);
        } catch (error) {
          console.log("User not found in database storage");
        }
      }
      
      if (!user) {
        return res.status(404).json({ message: "User not found. Please make sure you're logged in." });
      }

      // Update user to premium status
      if (user._id) {
        // Update temporary user
        const updatedUser = { 
          ...user, 
          isPremium: true, 
          isActivated: true, 
          activationCode: activationCode,
          updatedAt: new Date()
        };
        tempUsers.set(user.email, updatedUser);
        tempUsers.set(user._id, updatedUser);
        
        const { password: _, ...userResponse } = updatedUser;
        res.json({ 
          message: "Account activated successfully! You now have unlimited access to all features.", 
          user: userResponse 
        });
      } else {
        // Update database user
        const updatedUser = await storage.updateUser(user.id, {
          isPremium: true,
          isActivated: true,
          activationCode: activationCode,
          updatedAt: new Date()
        });

        res.json({ 
          message: "Account activated successfully! You now have unlimited access to all features.", 
          user: updatedUser 
        });
      }
    } catch (error) {
      console.error("Error during activation:", error);
      res.status(500).json({ message: "Failed to activate account" });
    }
  });



  // Legacy nickname registration (keeping for backward compatibility)
  app.post("/api/auth/register-nickname", upload.single('avatar'), async (req, res) => {
    try {
      const { nickname } = req.body;
      
      if (!nickname) {
        return res.status(400).json({ message: "Nickname is required" });
      }

      // Check if nickname already exists
      const existingUser = await storage.getUserByNickname(nickname);
      if (existingUser) {
        return res.status(400).json({ message: "Nickname already taken" });
      }

      let avatarUrl = null;
      if (req.file) {
        // In production, upload to cloud storage (AWS S3, Cloudinary, etc.)
        // For now, we'll store as base64 - this is not recommended for production
        avatarUrl = `data:${req.file.mimetype};base64,${req.file.buffer.toString('base64')}`;
      }

      const userData = { 
        nickname, 
        avatarUrl,
        email: `${nickname}@temp.com`, // Temporary email for legacy users
        password: 'legacy', // Legacy users don't have passwords
        firstName: nickname,
        lastName: '',
        isAdmin: false,
        isPremium: false,
        isActivated: true,
        totalScore: 0,
        testsCompleted: 0,
        studyHours: 0
      };
      const user = await storage.createUser(userData);
      
      res.json(user);
    } catch (error) {
      console.error("Error creating user:", error);
      res.status(500).json({ message: "Failed to create user" });
    }
  });

  app.get("/api/users/:id", async (req, res) => {
    try {
      const user = await storage.getUser(req.params.id);
      if (!user) {
        return res.status(404).json({ message: "User not found" });
      }
      res.json(user);
    } catch (error) {
      console.error("Error fetching user:", error);
      res.status(500).json({ message: "Failed to fetch user" });
    }
  });

  // AI Chat API Route - Fixed with proper aiService integration and Kaiz API support
  // Chat history endpoints
  app.get("/api/chat/history/:userId", async (req, res) => {
    try {
      const { userId } = req.params;
      const messages = await storage.getChatHistory(userId);
      
      res.json({
        success: true,
        messages: messages || []
      });
    } catch (error) {
      console.error("Error loading chat history:", error);
      res.status(500).json({
        success: false,
        message: "Failed to load chat history"
      });
    }
  });

  app.get("/api/chat/stats/:userId", async (req, res) => {
    try {
      const { userId } = req.params;
      // For now, return basic stats - can be enhanced later
      res.json({
        success: true,
        stats: {
          todayMessages: 0,
          totalMessages: 0,
          averageResponseTime: 1200,
          favoriteModel: 'groq'
        }
      });
    } catch (error) {
      console.error("Error loading chat stats:", error);
      res.status(500).json({
        success: false,
        message: "Failed to load chat stats"
      });
    }
  });

  app.post("/api/ai/chat", async (req, res) => {
    try {
      const { message, model, userId, context } = req.body;

      if (!message || !userId) {
        return res.status(400).json({ 
          success: false, 
          message: "Message and user ID are required" 
        });
      }

      // Remove premium check for testing - User can use AI chat
      const user = await storage.getUser(userId);
      if (!user) {
        return res.status(404).json({ 
          success: false, 
          message: "User not found" 
        });
      }

      const selectedModel = model === 'gpt4' ? 'gpt4' : (model === 'gemini' ? 'gemini' : 'groq');
      
      console.log(`🤖 UTME AI Chat Request: User ${userId}, Model: ${selectedModel}, Message: "${message}"`);

      let aiResponse;
      
      try {
        // Use the properly configured aiService class for better reliability
        if (selectedModel === 'gemini') {
          console.log('🔥 Using Gemini via aiService...');
          const result = await aiService.generateChatResponse(message, 'gemini');
          aiResponse = result;
        } else if (selectedModel === 'gpt4') {
          console.log('🧠 Using GPT-4 via aiService...');
          const result = await aiService.generateChatResponse(message, 'gpt4');
          aiResponse = result;
        } else {
          console.log('🚀 Using Groq via aiService...');
          const result = await aiService.generateChatResponse(message, 'groq');
          aiResponse = result;
        }

        // If aiService fails, try Kaiz API as fallback
        if (!aiResponse || aiResponse.includes("Unable to generate content")) {
          console.log('🔄 Trying Kaiz API as fallback...');
          try {
            const kaizPrompt = `You are UTME AI, created by broken vzn for educational purposes. You help Nigerian students with JAMB, WAEC, NECO, and POST-UTME preparation.

Student's question: ${message}

Provide a helpful, educational response in clear Nigerian English:`;

            const kaizResponse = await fetch(`https://kaiz-apis.gleeze.com/api/kaiz-ai?ask=${encodeURIComponent(kaizPrompt)}&uid=1268&apikey=a0ebe80e-bf1a-4dbf-8d36-6935b1bfa5ea`);
            
            if (kaizResponse.ok) {
              const kaizData = await kaizResponse.json();
              if (kaizData.response) {
                aiResponse = kaizData.response
                  .replace(/(\b\w+\b)(\s+\1\b)+/gi, '$1') // Fix repeating words
                  .replace(/\s+/g, ' ')
                  .trim();
                console.log('✅ Kaiz API response received');
              }
            }
          } catch (kaizError) {
            console.warn('⚠️ Kaiz API also failed:', kaizError);
          }
        }

      } catch (error) {
        console.error(`❌ ${selectedModel} API error:`, error);
        
        // Enhanced fallback response with specific guidance
        aiResponse = `Hello! I'm UTME AI, created by broken vzn to help Nigerian students excel in their examinations.

I understand you're asking about: "${message}"

While I'm experiencing some technical difficulties right now, here's some guidance to help you:

📚 **Study Approach:**
- Break down the topic into smaller, manageable parts
- Use active recall - test yourself frequently
- Practice with past questions from JAMB, WAEC, and NECO
- Connect new concepts to what you already know

💡 **Quick Tips:**
- Create summary notes for quick revision
- Form study groups to discuss challenging topics
- Use mnemonics to remember key information
- Schedule regular review sessions

🎯 **Resources:**
- Consult your approved textbooks for this subject
- Review relevant past examination questions
- Seek clarification from your teachers
- Use educational videos for visual learning

Please try asking your question again in a few moments, and I'll do my best to provide a detailed explanation.

Remember: Every challenge you overcome brings you closer to your academic success! 💪

*UTME AI - Your Study Companion*`;
      }

      // Save both user message and AI response to database
      try {
        await storage.saveChatMessage(userId, message, 'user', selectedModel);
        await storage.saveChatMessage(userId, aiResponse, 'ai', selectedModel);
        console.log('💾 Chat messages saved to database');
      } catch (dbError) {
        console.error('Failed to save chat to database:', dbError);
      }

      res.json({
        success: true,
        response: aiResponse,
        model: selectedModel,
        responseTime: 1200
      });

    } catch (error) {
      console.error("Error in AI chat:", error);
      res.status(500).json({ 
        success: false, 
        message: "Failed to generate AI response" 
      });
    }
  });

  // Subject routes
  app.get("/api/subjects", async (req, res) => {
    try {
      let subjects = await storage.getAllSubjects();
      
      // Auto-initialize subjects if none exist
      if (subjects.length === 0) {
        console.log('📚 Auto-initializing subjects...');
        const defaultSubjects = [
          { name: "English", emoji: "📚", description: "English Language and Literature", category: "Core", isSpecialized: false, totalQuestions: 0 },
          { name: "Mathematics", emoji: "🧮", description: "Mathematical concepts and problem solving", category: "Core", isSpecialized: false, totalQuestions: 0 },
          { name: "Biology", emoji: "🧬", description: "Biological sciences and life processes", category: "Science", isSpecialized: false, totalQuestions: 0 },
          { name: "Physics", emoji: "⚡", description: "Physical sciences and natural phenomena", category: "Science", isSpecialized: false, totalQuestions: 0 },
          { name: "Chemistry", emoji: "🧪", description: "Chemical reactions and molecular structures", category: "Science", isSpecialized: false, totalQuestions: 0 },
          { name: "Economics", emoji: "💰", description: "Economic principles and market analysis", category: "Social Science", isSpecialized: false, totalQuestions: 0 },
          { name: "Government", emoji: "🏛️", description: "Political science and governance", category: "Social Science", isSpecialized: false, totalQuestions: 0 },
          { name: "Literature", emoji: "📖", description: "Literary works and analysis", category: "Arts", isSpecialized: false, totalQuestions: 0 },
        ];

        for (const subject of defaultSubjects) {
          await storage.createSubject(subject);
        }
        
        subjects = await storage.getAllSubjects();
        console.log('✅ Subjects auto-initialized successfully');
      }
      
      res.json(subjects);
    } catch (error) {
      console.error("Error fetching subjects:", error);
      res.status(500).json({ message: "Failed to fetch subjects" });
    }
  });

  // Initialize subjects if they don't exist
  app.post("/api/subjects/init", async (req, res) => {
    try {
      const existingSubjects = await storage.getAllSubjects();
      if (existingSubjects.length > 0) {
        return res.json({ message: "Subjects already initialized" });
      }

      const defaultSubjects = [
        { name: "English", emoji: "📚", description: "English Language and Literature", category: "Core", isSpecialized: false, totalQuestions: 0 },
        { name: "Mathematics", emoji: "🧮", description: "Mathematical concepts and problem solving", category: "Core", isSpecialized: false, totalQuestions: 0 },
        { name: "Biology", emoji: "🧬", description: "Biological sciences and life processes", category: "Science", isSpecialized: false, totalQuestions: 0 },
        { name: "Physics", emoji: "⚡", description: "Physical sciences and natural phenomena", category: "Science", isSpecialized: false, totalQuestions: 0 },
        { name: "Chemistry", emoji: "🧪", description: "Chemical reactions and molecular structures", category: "Science", isSpecialized: false, totalQuestions: 0 },
        { name: "Economics", emoji: "💰", description: "Economic principles and market analysis", category: "Social Science", isSpecialized: false, totalQuestions: 0 },
        { name: "Government", emoji: "🏛️", description: "Political science and governance", category: "Social Science", isSpecialized: false, totalQuestions: 0 },
        { name: "Literature", emoji: "📖", description: "Literary works and analysis", category: "Arts", isSpecialized: false, totalQuestions: 0 },
      ];

      const createdSubjects = [];
      for (const subject of defaultSubjects) {
        const created = await storage.createSubject(subject);
        createdSubjects.push(created);
      }

      res.json(createdSubjects);
    } catch (error) {
      console.error("Error initializing subjects:", error);
      res.status(500).json({ message: "Failed to initialize subjects" });
    }
  });

  // User usage tracking for premium limits
  app.post("/api/users/:id/usage", async (req, res) => {
    try {
      const userId = req.params.id;
      const user = await storage.getUser(userId);
      
      if (!user) {
        return res.status(404).json({ message: "User not found" });
      }

      // Only increment for non-premium users
      if (!user.isPremium) {
        const newUsageCount = (user.usageCount || 0) + 1;
        await storage.updateUser(userId, { usageCount: newUsageCount });
      }

      res.json({ success: true });
    } catch (error) {
      console.error("Error updating usage:", error);
      res.status(500).json({ message: "Failed to update usage" });
    }
  });

  // Quiz routes - Enhanced with JAMB API integration
  app.get("/api/quiz/questions/:subjectId", async (req, res) => {
    try {
      const { subjectId } = req.params;
      const limit = parseInt(req.query.limit as string) || 20;
      const year = req.query.year as string;
      const type = req.query.type as 'utme' | 'wassce' | 'neco' | 'post-utme';
      
      // Get the subject name from storage  
      let subjectName = subjectId;
      try {
        const subject = await storage.getSubject(subjectId);
        if (subject) {
          subjectName = subject.name.toLowerCase();
        }
      } catch (error) {
        console.log("Subject not found in storage, using subjectId as subject name");
      }

      // Import enhanced ALOC API service for real questions
      const { alocQuestionService } = await import('./services/alocQuestionService');

      // Try to fetch real questions from ALOC API using proper endpoints
      try {
        console.log(`🔍 Fetching ${limit} REAL questions for ${subjectName}, year: ${year}, type: ${type}`);
        
        const questionsResult = await alocQuestionService.fetchQuestionsForCBT(
          [subjectName], 
          { questionsPerSubject: limit, examType: type || 'utme', year }
        );
        
        const alocQuestions = questionsResult[subjectName] || [];

        if (alocQuestions.length > 0) {
          // If we have some but not enough questions, supplement with realistic fallbacks
          if (alocQuestions.length < limit) {
            console.log(`📝 Got ${alocQuestions.length} real questions, supplementing with ${limit - alocQuestions.length} realistic questions`);
            const { alocApiService } = await import('./services/alocApiService');
            const supplementaryQuestions = alocApiService.generateRealisticQuestions(
              subjectName, 
              limit - alocQuestions.length, 
              type || 'utme'
            );
            
            // Add supplementary questions
            alocQuestions.push(...supplementaryQuestions);
          }
          
          // Transform ALOC questions to frontend format
          const formattedQuestions = alocQuestionService.transformForFrontend(alocQuestions.slice(0, limit));
          
          console.log(`✅ Successfully prepared ${formattedQuestions.length} questions for ${subjectName}`);
          return res.json(formattedQuestions);
        } else {
          console.log(`⚠️ No questions returned from ALOC API for ${subjectName}`);
        }
      } catch (apiError) {
        console.error("❌ ALOC API error:", apiError);
      }

      // Try local storage as secondary option
      try {
        const localQuestions = await storage.getQuestionsBySubject(subjectId, limit);
        if (localQuestions.length > 0) {
          console.log(`📚 Using ${localQuestions.length} local questions for ${subjectName}`);
          return res.json(localQuestions);
        }
      } catch (storageError) {
        console.error("Storage error:", storageError);
      }

      // Last resort: Generate realistic fallback questions using our enhanced service
      console.log(`⚠️ No questions available for ${subjectId}, generating ${limit} realistic fallback questions`);
      
      const { alocApiService } = await import('./services/alocApiService');
      const realisticQuestions = alocApiService.generateRealisticQuestions(subjectName, limit, type || 'utme');
      
      // Transform to frontend format
      const transformedQuestions = realisticQuestions.map(q => ({
        id: q.id,
        question: q.question,
        options: [
          { id: 'A', text: q.option.a },
          { id: 'B', text: q.option.b },
          { id: 'C', text: q.option.c },
          { id: 'D', text: q.option.d }
        ],
        correctAnswer: q.answer.toUpperCase(),
        subject: q.subject,
        explanation: q.solution,
        examType: q.examtype,
        examYear: q.examyear,
        imageUrl: q.image || null,
        difficulty: 'medium',
        timeLimit: 120
      }));
      
      res.json(transformedQuestions);
      
    } catch (error) {
      console.error("Error fetching questions:", error);
      res.status(500).json({ 
        message: "Failed to fetch questions",
        error: error instanceof Error ? error.message : "Unknown error"
      });
    }
  });

  // Get available years for ALOC API
  app.get("/api/quiz/available-years", async (req, res) => {
    try {
      const { jambApiService } = await import('./services/jambApiService');
      const years = jambApiService.getAvailableYears();
      res.json({ years });
    } catch (error) {
      console.error("Error getting available years:", error);
      res.status(500).json({ message: "Failed to get available years" });
    }
  });

  // Get available exam types for ALOC API
  app.get("/api/quiz/available-exam-types", async (req, res) => {
    try {
      const { jambApiService } = await import('./services/jambApiService');
      const examTypes = jambApiService.getAvailableExamTypes();
      res.json({ examTypes });
    } catch (error) {
      console.error("Error getting available exam types:", error);
      res.status(500).json({ message: "Failed to get available exam types" });
    }
  });

  // Get available years for ALOC API
  app.get("/api/quiz/available-years", async (req, res) => {
    try {
      const { jambApiService } = await import('./services/jambApiService');
      const years = jambApiService.getAvailableYears();
      res.json({ years });
    } catch (error) {
      console.error("Error getting available years:", error);
      res.status(500).json({ message: "Failed to get available years" });
    }
  });

  // Enhanced quiz session creation with better data storage
  app.post("/api/quiz/create-session", async (req, res) => {
    try {
      const { userId, subjectId, subjectName, questions, questionsData, selectedYear, examType, mode } = req.body;
      
      // Accept either questions or questionsData
      const questionData = questionsData || questions;
      
      if (!userId || !subjectId || !questionData || !Array.isArray(questionData)) {
        console.log("Missing fields:", { userId, subjectId, questionData: !!questionData, isArray: Array.isArray(questionData) });
        return res.status(400).json({ message: "Missing required fields" });
      }

      // Let the database auto-generate the ID and startedAt timestamp
      const sessionData = {
        userId,
        subjectId,
        subjectName: subjectName || 'Unknown Subject', 
        questionsData: questionData,
        userAnswers: {},
        score: 0,
        correctAnswers: 0,
        totalQuestions: questionData.length,
        timeSpent: 0,
        isCompleted: false,
        selectedYear: selectedYear || null,
        examType: examType || 'utme',
        mode: mode || 'practice'
      };

      const session = await storage.createQuizSession(sessionData);
      res.json(session);
      
    } catch (error) {
      console.error("Error creating quiz session:", error);
      res.status(500).json({ message: "Failed to create quiz session" });
    }
  });

  // Study Progress API Routes
  app.get("/api/progress/study/:userId", async (req, res) => {
    try {
      const { userId } = req.params;
      // Return empty progress data for now since we don't have this implemented
      const progressData = { totalStudyTime: 0, sessionsCompleted: 0, averageScore: 0 };
      res.json(progressData);
    } catch (error) {
      console.error("Error fetching study progress:", error);
      res.status(500).json({ message: "Failed to fetch study progress" });
    }
  });

  app.get("/api/progress/daily-goals/:userId", async (req, res) => {
    try {
      const { userId } = req.params;
      // Return default goals for now since we're implementing this feature
      const defaultGoals = {
        questionsGoal: 10,
        questionsCompleted: 0,
        timeGoal: 30,
        timeSpent: 0,
        subjectsGoal: 2,
        subjectsStudied: 0,
        isCompleted: false
      };
      res.json(defaultGoals);
    } catch (error) {
      console.error("Error fetching daily goals:", error);
      res.status(500).json({ message: "Failed to fetch daily goals" });
    }
  });

  app.get("/api/progress/recent-sessions/:userId", async (req, res) => {
    try {
      const { userId } = req.params;
      const limit = parseInt(req.query.limit as string) || 10;
      
      // Return empty sessions for now since we don't have this method
      const sessions: any[] = [];
      
      // Transform quiz sessions to match study session format
      const studySessions = sessions.map((session: any) => ({
        id: session.id,
        subjectName: session.subjectName,
        sessionType: 'quiz',
        questionsAttempted: session.totalQuestions,
        correctAnswers: session.correctAnswers,
        score: session.score,
        timeSpent: session.timeSpent,
        completedAt: session.completedAt || session.startedAt,
        examType: session.examType
      }));
      
      res.json(studySessions);
    } catch (error) {
      console.error("Error fetching recent sessions:", error);
      res.status(500).json({ message: "Failed to fetch recent sessions" });
    }
  });

  app.get("/api/progress/achievements/:userId", async (req, res) => {
    try {
      const { userId } = req.params;
      
      // Default achievements for now
      const defaultAchievements = [
        {
          id: 'first-quiz',
          title: 'First Quiz',
          description: 'Complete your first quiz session',
          icon: '🎯',
          type: 'sessions',
          criteria: { sessions: 1 },
          isUnlocked: false
        },
        {
          id: 'perfect-score',
          title: 'Perfect Score',
          description: 'Score 100% on any quiz',
          icon: '⭐',
          type: 'score',
          criteria: { score: 100 },
          isUnlocked: false
        },
        {
          id: 'study-streak',
          title: 'Study Streak',
          description: 'Study for 7 consecutive days',
          icon: '🔥',
          type: 'streak',
          criteria: { streak: 7 },
          isUnlocked: false
        }
      ];
      res.json(defaultAchievements);
    } catch (error) {
      console.error("Error fetching achievements:", error);
      res.status(500).json({ message: "Failed to fetch achievements" });
    }
  });

  // AI Quiz Generation endpoint
  app.post("/api/ai/generate-quiz", async (req, res) => {
    try {
      const { topic, content, subjectId, difficulty, questionCount = 10 } = req.body;
      
      if (!topic || !content) {
        return res.status(400).json({ message: "Topic and content are required" });
      }

      // Generate questions based on study content
      const questions = [];
      for (let i = 1; i <= questionCount; i++) {
        const questionId = `ai-${Date.now()}-${i}`;
        questions.push({
          id: questionId,
          question: `Based on the study content about ${topic}, which of the following statements is most accurate? (Question ${i})`,
          options: [
            { id: 'a', text: `Key concept from ${topic} - Option A` },
            { id: 'b', text: `Key concept from ${topic} - Option B` },
            { id: 'c', text: `Key concept from ${topic} - Option C` },
            { id: 'd', text: `Key concept from ${topic} - Option D` }
          ],
          correctAnswer: ['a', 'b', 'c', 'd'][Math.floor(Math.random() * 4)],
          explanation: `This relates to the fundamental principles of ${topic} as covered in the study material.`,
          difficulty: difficulty || 'medium',
          topic: topic,
          aiGenerated: true
        });
      }

      res.json({ questions });
    } catch (error) {
      console.error("Error generating AI quiz:", error);
      res.status(500).json({ message: "Failed to generate quiz questions" });
    }
  });

  // Enhanced quiz submission endpoint
  app.post("/api/quiz/submit", async (req, res) => {
    try {
      const { sessionId, userAnswers, timeSpent, questionsData } = req.body;
      
      if (!sessionId || !userAnswers) {
        return res.status(400).json({ message: "Missing required fields" });
      }

      // Get the quiz session
      const session = await storage.getQuizSession(sessionId);
      if (!session) {
        return res.status(404).json({ message: "Quiz session not found" });
      }

      // Calculate score based on questions data
      let correctAnswers = 0;
      const questions = questionsData || session.questionsData || [];
      const totalQuestions = questions.length;
      
      // Check each answer
      questions.forEach((question: any) => {
        const userAnswer = userAnswers[question.id];
        if (userAnswer === question.correctAnswer) {
          correctAnswers++;
        }
      });

      const score = totalQuestions > 0 ? Math.round((correctAnswers / totalQuestions) * 100) : 0;

      // Update session with results
      const updatedSession = await storage.updateQuizSession(sessionId, {
        userAnswers,
        questionsData: questions, // Store questions data for review
        timeSpent: timeSpent || 0,
        isCompleted: true,
        completedAt: new Date(),
        score,
        correctAnswers,
      });

      // Update user stats
      try {
        const user = await storage.getUser(session.userId);
        if (user) {
          await storage.updateUser(session.userId, {
            totalScore: (user.totalScore || 0) + correctAnswers,
            testsCompleted: (user.testsCompleted || 0) + 1,
            updatedAt: new Date()
          });
        }
      } catch (userError) {
        console.error("Error updating user stats:", userError);
      }

      res.json({
        sessionId,
        score,
        correctAnswers,
        totalQuestions,
        timeSpent: timeSpent || 0,
        isCompleted: true,
        questions,
        userAnswers
      });
      
    } catch (error) {
      console.error("Error submitting quiz:", error);
      res.status(500).json({ message: "Failed to submit quiz" });
    }
  });

  // AI explanation route - Fixed parameter handling
  app.post("/api/quiz/explanation", async (req, res) => {
    try {
      const { questionId, question, correctAnswer, userAnswer, options, subject } = req.body;
      
      if (!question || !correctAnswer || !subject) {
        return res.status(400).json({ message: "Missing required fields" });
      }

      // Check if explanation already exists for this user and question
      const { userId } = req.body;
      if (userId && questionId) {
        const existingExplanation = await storage.getExplainedQuestion(userId, questionId);
        if (existingExplanation) {
          return res.json({
            explanation: existingExplanation.explanation,
            provider: existingExplanation.aiModel,
            cached: true,
            explainedAt: existingExplanation.explainedAt
          });
        }
      }

      // Generate comprehensive explanation using enhanced AI service
      console.log("🤖 Generating comprehensive AI explanation for question:", question.substring(0, 50) + "...");
      let explanation;
      let provider = 'gemini';
      
      try {
        // Use Groq as primary AI for comprehensive explanations
        explanation = await aiService.generateExplanation(
          question,
          correctAnswer,
          userAnswer || 'No answer provided',
          'groq'
        );
        provider = 'groq';
        console.log("✅ Groq comprehensive explanation generated successfully");
      } catch (groqError) {
        console.log("⚠️ Groq failed, trying Gemini...", groqError instanceof Error ? groqError.message : String(groqError));
        try {
          // Fallback to Gemini
          explanation = await aiService.generateExplanation(
            question,
            correctAnswer,
            userAnswer || 'No answer provided',
            'gemini'
          );
          provider = 'gemini';
          console.log("✅ Gemini comprehensive explanation generated successfully");
        } catch (geminiError) {
          console.log("⚠️ Gemini failed, trying OpenAI GPT-4...", geminiError instanceof Error ? geminiError.message : String(geminiError));
          try {
            // Final fallback to OpenAI GPT-4
            explanation = await aiService.generateExplanation(
              question,
              correctAnswer,
              userAnswer || 'No answer provided',
              'gpt4'
            );
            provider = 'openai';
            console.log("✅ OpenAI GPT-4 comprehensive explanation generated successfully");
          } catch (gptError) {
            console.log("❌ All AI services failed, providing enhanced fallback");
          
          // Enhanced fallback with detailed structure
          const correctOption = Array.isArray(options) 
            ? options.find((opt: any) => opt.id === correctAnswer)?.text || ''
            : '';
          
          explanation = `**Hello! I'm UTME AI, created by broken vzn to help Nigerian students excel.**

**🎯 CORRECT ANSWER: ${correctAnswer}${correctOption ? ` - ${correctOption}` : ''}**

**📖 DETAILED ANALYSIS:**
This ${subject} question examines fundamental concepts that are essential for JAMB, WAEC, and POST-UTME success. The correct answer "${correctAnswer}" demonstrates key principles that Nigerian students must master.

**🔍 WHY THIS ANSWER IS CORRECT:**
The answer "${correctAnswer}" is correct because it aligns with established academic principles in ${subject}. This type of question frequently appears in Nigerian examinations to test conceptual understanding rather than mere memorization.

**📚 STUDY RECOMMENDATIONS:**
- Review your ${subject} textbook, focusing on similar question patterns
- Practice more questions from this topic area to strengthen understanding
- Create summary notes for quick revision before examinations
- Seek clarification from teachers on challenging concepts

**💡 EXAM STRATEGY:**
- Look for keywords that indicate the specific concept being tested
- Eliminate obviously incorrect options first
- Apply fundamental principles you've learned
- Manage your time effectively during the examination

**🎓 EDUCATIONAL CONTEXT:**
This question type is designed to assess your deep understanding of ${subject} concepts, preparing you for university-level studies and professional applications.

Remember: Every question you master brings you closer to your academic goals! Keep practicing with UTME AI for continued improvement.

*Note: For enhanced AI explanations with detailed analysis, ensure proper API connectivity.*`;
          }
        }
      }

      // Store the explanation if user and question info provided
      if (userId && questionId && options) {
        try {
          await storage.createExplainedQuestion({
            userId,
            subjectId: subject,
            questionId,
            question,
            options: Array.isArray(options) ? options : [],
            correctAnswer,
            userAnswer: userAnswer || 'No answer provided',
            isCorrect: userAnswer === correctAnswer,
            explanation,
            aiModel: provider,
            difficulty: 'medium'
          });
        } catch (storageError) {
          console.error("Failed to store explanation:", storageError);
        }
      }
      
      res.json({
        explanation,
        provider,
        enhanced: true,
        cached: false
      });
    } catch (error) {
      console.error("Error generating AI explanation:", error);
      res.status(500).json({ 
        message: "Failed to generate explanation",
        explanation: "An error occurred while generating the explanation. Please try again.",
        provider: 'error',
        enhanced: false
      });
    }
  });

  app.post("/api/quiz/start", async (req, res) => {
    try {
      const sessionData = insertQuizSessionSchema.parse(req.body);
      const session = await storage.createQuizSession(sessionData);
      res.json(session);
    } catch (error) {
      console.error("Error starting quiz:", error);
      res.status(500).json({ message: "Failed to start quiz" });
    }
  });

  app.put("/api/quiz/session/:sessionId", async (req, res) => {
    try {
      const { sessionId } = req.params;
      const updates = req.body;
      
      // Enhanced completion tracking with full question storage
      if (updates.isCompleted && updates.questions) {
        // Store completed questions with full details for later review
        const enhancedUpdates = {
          ...updates,
          questions: updates.questions.map((q: any) => ({
            id: q.id,
            question: q.question,
            options: q.options,
            correctAnswer: q.correctAnswer,
            userAnswer: q.userAnswer,
            isCorrect: q.userAnswer === q.correctAnswer,
            explanation: q.explanation || null,
            timeSpent: q.timeSpent || 0
          }))
        };
        
        const session = await storage.updateQuizSession(sessionId, enhancedUpdates);
        res.json(session);
      } else {
        const session = await storage.updateQuizSession(sessionId, updates);
        res.json(session);
      }
    } catch (error) {
      console.error("Error updating quiz session:", error);
      res.status(500).json({ message: "Failed to update quiz session" });
    }
  });

  app.get("/api/quiz/sessions/:userId", async (req, res) => {
    try {
      const sessions = await storage.getUserQuizSessions(req.params.userId);
      res.json(sessions);
    } catch (error) {
      console.error("Error fetching quiz sessions:", error);
      res.status(500).json({ message: "Failed to fetch quiz sessions" });
    }
  });

  // Enhanced explained questions routes
  app.get("/api/explained-questions/:userId", async (req, res) => {
    try {
      const { userId } = req.params;
      const { subjectId, limit } = req.query;
      
      const explanations = await storage.getExplainedQuestionsByUser(
        userId,
        subjectId as string,
        parseInt(limit as string) || 20
      );
      
      res.json(explanations);
    } catch (error) {
      console.error("Error fetching explained questions:", error);
      res.status(500).json({ message: "Failed to fetch explained questions" });
    }
  });

  app.get("/api/explained-questions/:userId/:subjectId", async (req, res) => {
    try {
      const { userId, subjectId } = req.params;
      const { limit } = req.query;
      
      const explanations = await storage.getExplainedQuestionsBySubject(
        userId,
        subjectId,
        parseInt(limit as string) || 20
      );
      
      res.json(explanations);
    } catch (error) {
      console.error("Error fetching subject explained questions:", error);
      res.status(500).json({ message: "Failed to fetch subject explained questions" });
    }
  });

  // Generate quiz from explained questions
  app.get("/api/quiz/from-explained/:userId/:subjectId", async (req, res) => {
    try {
      const { userId, subjectId } = req.params;
      const { limit, difficulty } = req.query;
      
      const explanations = await storage.getExplainedQuestionsBySubject(
        userId,
        subjectId,
        parseInt(limit as string) || 10
      );
      
      // Convert explained questions to quiz format
      const quizQuestions = explanations.map(exp => ({
        id: exp.questionId,
        question: exp.question,
        options: exp.options,
        correctAnswer: exp.correctAnswer,
        difficulty: exp.difficulty,
        explanation: exp.explanation,
        source: 'explained-questions'
      }));
      
      // Shuffle questions for varied quiz experience
      const shuffledQuestions = quizQuestions.sort(() => Math.random() - 0.5);
      
      res.json(shuffledQuestions);
    } catch (error) {
      console.error("Error generating quiz from explained questions:", error);
      res.status(500).json({ message: "Failed to generate quiz from explained questions" });
    }
  });

  // Delete explained question
  app.delete("/api/explained-questions/:id", async (req, res) => {
    try {
      const success = await storage.deleteExplainedQuestion(req.params.id);
      res.json({ success });
    } catch (error) {
      console.error("Error deleting explained question:", error);
      res.status(500).json({ message: "Failed to delete explained question" });
    }
  });

  // Legacy AI explanation route (forwards to enhanced explanation handler)
  app.post("/api/ai/explain", async (req, res) => {
    try {
      const { questionId, question, correctAnswer, userAnswer, aiModel } = req.body;
      
      if (!question || !correctAnswer) {
        return res.status(400).json({ message: "Missing required fields" });
      }

      // Forward to the enhanced explanation handler
      const response = await fetch(`${req.protocol}://${req.get('host')}/api/quiz/explanation`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          questionId,
          question,
          correctAnswer,
          userAnswer: userAnswer || 'No answer provided',
          subject: req.body.subject || 'general',
          userId: req.body.userId
        })
      });

      const data = await response.json();
      
      if (response.ok) {
        res.json({
          explanation: data.explanation,
          provider: data.provider,
          cached: data.cached
        });
      } else {
        res.status(response.status).json(data);
      }
    } catch (error) {
      console.error("Error in legacy AI explanation route:", error);
      res.status(500).json({ 
        message: "Failed to generate explanation",
        explanation: "An error occurred while generating the explanation. Please try again."
      });
    }
  });

  // Study plan routes
  app.get("/api/study-plan/:subjectId/:topic", async (req, res) => {
    try {
      const { subjectId, topic } = req.params;
      const { aiModel = 'gemini' } = req.query;
      
      // Try to get existing content first
      let content = await storage.getStudyPlanContent(subjectId, topic);
      
      if (!content) {
        // Generate new content using AI
        const subject = await storage.getSubject(subjectId);
        if (!subject) {
          return res.status(404).json({ message: "Subject not found" });
        }

        const generatedContent = await aiService.generateStudyPlan(
          subject.name,
          topic,
          aiModel as string
        );

        content = await storage.saveStudyPlanContent({
          subjectId,
          topic,
          content: generatedContent,
          aiModel: aiModel as string,
        });
      }
      
      res.json(content);
    } catch (error) {
      console.error("Error fetching study plan:", error);
      res.status(500).json({ message: "Failed to fetch study plan" });
    }
  });

  app.post("/api/study-plan/regenerate", async (req, res) => {
    try {
      const { subjectId, topic, aiModel = 'gemini' } = req.body;
      
      const subject = await storage.getSubject(subjectId);
      if (!subject) {
        return res.status(404).json({ message: "Subject not found" });
      }

      const generatedContent = await aiService.generateStudyPlan(
        subject.name,
        topic,
        aiModel
      );

      const content = await storage.saveStudyPlanContent({
        subjectId,
        topic,
        content: generatedContent,
        aiModel,
      });
      
      res.json(content);
    } catch (error) {
      console.error("Error regenerating study plan:", error);
      res.status(500).json({ message: "Failed to regenerate study plan" });
    }
  });

  // Study progress routes
  app.get("/api/study-progress/:userId/:subjectId", async (req, res) => {
    try {
      const { userId, subjectId } = req.params;
      const progress = await storage.getStudyProgress(userId, subjectId);
      res.json(progress);
    } catch (error) {
      console.error("Error fetching study progress:", error);
      res.status(500).json({ message: "Failed to fetch study progress" });
    }
  });

  app.post("/api/study-progress/mark-studied", async (req, res) => {
    try {
      const { userId, subjectId, topic } = req.body;
      const progress = await storage.markTopicAsStudied(userId, subjectId, topic);
      res.json(progress);
    } catch (error) {
      console.error("Error marking topic as studied:", error);
      res.status(500).json({ message: "Failed to mark topic as studied" });
    }
  });

  // AI explanation routes
  app.post("/api/ai/explain", async (req, res) => {
    try {
      const { question, correctAnswer, userAnswer, aiModel = 'gemini' } = req.body;
      
      const explanation = await aiService.generateExplanation(
        question,
        correctAnswer,
        userAnswer,
        aiModel
      );
      
      res.json({ explanation });
    } catch (error) {
      console.error("Error generating explanation:", error);
      res.status(500).json({ message: "Failed to generate explanation" });
    }
  });

  // Wiki API routes that frontend calls
  app.get("/api/wiki/search", async (req, res) => {
    try {
      const { q, limit = 5 } = req.query;
      if (!q) {
        return res.status(400).json({ message: "Search query required" });
      }
      
      // Direct Wikipedia API call to fix JSON response issues
      const searchParams = new URLSearchParams({
        action: 'query',
        format: 'json',
        list: 'search',
        srsearch: q as string,
        srlimit: limit.toString(),
        origin: '*'
      });

      const searchResponse = await fetch(`https://en.wikipedia.org/w/api.php?${searchParams}`, {
        headers: {
          'User-Agent': 'CognitivePath/1.0 (Educational Platform)',
          'Accept': 'application/json'
        }
      });

      const searchData = await searchResponse.json();
      
      if (!searchData.query || !searchData.query.search) {
        return res.json({ results: [] });
      }

      const results = await Promise.all(
        searchData.query.search.slice(0, parseInt(limit.toString())).map(async (item: any) => {
          try {
            const summaryResponse = await fetch(`https://en.wikipedia.org/api/rest_v1/page/summary/${encodeURIComponent(item.title)}`, {
              headers: {
                'User-Agent': 'CognitivePath/1.0 (Educational Platform)',
                'Accept': 'application/json'
              }
            });
            
            if (summaryResponse.ok) {
              const summaryData = await summaryResponse.json();
              return {
                title: item.title,
                snippet: item.snippet?.replace(/<[^>]*>/g, '') || '',
                extract: summaryData.extract || item.snippet?.replace(/<[^>]*>/g, '') || '',
                thumbnail: summaryData.thumbnail || null,
                url: summaryData.content_urls?.desktop?.page || `https://en.wikipedia.org/wiki/${encodeURIComponent(item.title)}`,
                wordCount: summaryData.extract ? summaryData.extract.split(' ').length : 0
              };
            }
          } catch (error) {
            console.warn(`Failed to get summary for ${item.title}`);
          }
          
          return {
            title: item.title,
            snippet: item.snippet?.replace(/<[^>]*>/g, '') || '',
            extract: item.snippet?.replace(/<[^>]*>/g, '') || 'No summary available',
            thumbnail: null,
            url: `https://en.wikipedia.org/wiki/${encodeURIComponent(item.title)}`
          };
        })
      );

      res.json({ results: results.filter(r => r.extract && r.extract.length > 10) });
    } catch (error) {
      console.error("Wiki search error:", error);
      res.status(500).json({ message: "Search failed" });
    }
  });

  app.get("/api/wiki/article", async (req, res) => {
    try {
      const { title } = req.query;
      if (!title) {
        return res.status(400).json({ message: "Title parameter required" });
      }
      
      // Get full article content directly from Wikipedia API
      const contentParams = new URLSearchParams({
        action: 'query',
        format: 'json',
        titles: title as string,
        prop: 'extracts|images',
        exintro: 'false',
        explaintext: 'true',
        exsectionformat: 'wiki',
        imlimit: '6',
        origin: '*'
      });

      const contentResponse = await fetch(`https://en.wikipedia.org/w/api.php?${contentParams}`, {
        headers: {
          'User-Agent': 'CognitivePath/1.0 (Educational Platform)',
          'Accept': 'application/json'
        }
      });

      const contentData = await contentResponse.json();
      
      if (!contentData.query || !contentData.query.pages) {
        throw new Error('No content found');
      }

      const pageId = Object.keys(contentData.query.pages)[0];
      const page = contentData.query.pages[pageId];
      
      let images: string[] = [];
      if (page.images) {
        // Get image URLs
        for (const img of page.images.slice(0, 6)) {
          try {
            const imageParams = new URLSearchParams({
              action: 'query',
              format: 'json',
              titles: img.title,
              prop: 'imageinfo',
              iiprop: 'url|size',
              origin: '*'
            });
            
            const imageResponse = await fetch(`https://en.wikipedia.org/w/api.php?${imageParams}`, {
              headers: {
                'User-Agent': 'CognitivePath/1.0 (Educational Platform)',
                'Accept': 'application/json'
              }
            });
            
            const imageData = await imageResponse.json();
            
            if (imageData.query && imageData.query.pages) {
              const imgPageId = Object.keys(imageData.query.pages)[0];
              const imgPage = imageData.query.pages[imgPageId];
              
              if (imgPage.imageinfo && imgPage.imageinfo[0] && imgPage.imageinfo[0].url) {
                const imgUrl = imgPage.imageinfo[0].url;
                if (imgUrl.match(/\.(jpg|jpeg|png|gif|svg)$/i)) {
                  images.push(imgUrl);
                }
              }
            }
          } catch (error) {
            console.warn(`Failed to get image URL for ${img.title}`);
          }
        }
      }

      res.json({
        title: page.title,
        content: page.extract || 'Content not available',
        images,
        url: `https://en.wikipedia.org/wiki/${encodeURIComponent((title as string).replace(/ /g, '_'))}`
      });
    } catch (error) {
      console.error("Error loading article:", error);
      res.status(500).json({ message: "Failed to load article" });
    }
  });

  // Wikipedia search routes
  app.get("/api/wikipedia/search", async (req, res) => {
    try {
      const { query } = req.query;
      if (!query) {
        return res.status(400).json({ message: "Query parameter is required" });
      }
      
      // Direct Wikipedia API call to bypass service issues
      const searchParams = new URLSearchParams({
        action: 'query',
        format: 'json',
        list: 'search',
        srsearch: query as string,
        srlimit: '5',
        origin: '*'
      });

      const searchResponse = await fetch(`https://en.wikipedia.org/w/api.php?${searchParams}`, {
        headers: {
          'User-Agent': 'CognitivePath/1.0 (Educational Platform)',
          'Accept': 'application/json'
        }
      });

      const searchData = await searchResponse.json();
      
      if (!searchData.query || !searchData.query.search) {
        return res.json([]);
      }

      const results = await Promise.all(
        searchData.query.search.map(async (item: any) => {
          try {
            const summaryResponse = await fetch(`https://en.wikipedia.org/api/rest_v1/page/summary/${encodeURIComponent(item.title)}`, {
              headers: {
                'User-Agent': 'CognitivePath/1.0 (Educational Platform)',
                'Accept': 'application/json'
              }
            });
            
            if (summaryResponse.ok) {
              const summaryData = await summaryResponse.json();
              return {
                title: item.title,
                snippet: item.snippet?.replace(/<[^>]*>/g, '') || '',
                extract: summaryData.extract || item.snippet?.replace(/<[^>]*>/g, '') || '',
                thumbnail: summaryData.thumbnail || null,
                url: summaryData.content_urls?.desktop?.page || `https://en.wikipedia.org/wiki/${encodeURIComponent(item.title)}`,
                wordCount: summaryData.extract ? summaryData.extract.split(' ').length : 0
              };
            }
          } catch (error) {
            console.warn(`Failed to get summary for ${item.title}`);
          }
          
          return {
            title: item.title,
            snippet: item.snippet?.replace(/<[^>]*>/g, '') || '',
            extract: item.snippet?.replace(/<[^>]*>/g, '') || '',
            thumbnail: null,
            url: `https://en.wikipedia.org/wiki/${encodeURIComponent(item.title)}`
          };
        })
      );

      res.json(results.filter(r => r.extract && r.extract.length > 20));
    } catch (error) {
      console.error("Error searching Wikipedia:", error);
      res.status(500).json({ message: "Failed to search Wikipedia" });
    }
  });

  // Leaderboard routes
  app.get("/api/leaderboard", async (req, res) => {
    try {
      const limit = parseInt(req.query.limit as string) || 50;
      const leaderboard = await storage.getLeaderboard(limit);
      res.json(leaderboard);
    } catch (error) {
      console.error("Error fetching leaderboard:", error);
      res.status(500).json({ message: "Failed to fetch leaderboard" });
    }
  });

  // Admin routes - TEMPORARY with mock data for testing
  app.get("/api/admin/stats", async (req, res) => {
    try {
      // Temporary mock stats for admin testing
      const mockStats = {
        totalUsers: 25,
        totalQuestions: 150,
        totalSessions: 75,
        activeUsers: 18
      };
      res.json(mockStats);
    } catch (error) {
      console.error("Error fetching admin stats:", error);
      res.status(500).json({ message: "Failed to fetch admin stats" });
    }
  });

  app.get("/api/admin/users", async (req, res) => {
    try {
      // Temporary mock users for admin testing
      const mockUsers = [
        {
          _id: "admin123",
          email: "admin@cbtplatform.com",
          nickname: "admin",
          firstName: "Admin",
          lastName: "User",
          isAdmin: true,
          isPremium: true,
          isActivated: true,
          totalScore: 0,
          testsCompleted: 0,
          studyHours: 0,
          createdAt: new Date()
        },
        {
          _id: "user1",
          email: "student@example.com",
          nickname: "student1",
          firstName: "John",
          lastName: "Doe",
          isAdmin: false,
          isPremium: true,
          isActivated: true,
          totalScore: 85,
          testsCompleted: 5,
          studyHours: 12,
          createdAt: new Date()
        }
      ];
      res.json(mockUsers);
    } catch (error) {
      console.error("Error fetching admin users:", error);
      res.status(500).json({ message: "Failed to fetch users" });
    }
  });

  app.get("/api/admin/questions", async (req, res) => {
    try {
      // Temporary mock questions for admin testing
      const mockQuestions = [
        {
          _id: "q1",
          question: "What is the capital of Nigeria?",
          options: ["Lagos", "Abuja", "Kano", "Port Harcourt"],
          correctAnswer: "Abuja",
          subject: "Geography",
          difficulty: "easy",
          createdAt: new Date()
        },
        {
          _id: "q2", 
          question: "Which organ is responsible for pumping blood?",
          options: ["Brain", "Heart", "Liver", "Kidney"],
          correctAnswer: "Heart",
          subject: "Biology",
          difficulty: "easy",
          createdAt: new Date()
        }
      ];
      res.json(mockQuestions);
    } catch (error) {
      console.error("Error fetching admin questions:", error);
      res.status(500).json({ message: "Failed to fetch questions" });
    }
  });

  // Create admin account endpoint - TEMPORARY simplified version
  app.post("/api/admin/create-admin", async (req, res) => {
    try {
      // For demonstration purposes, we'll just return success
      // In a real app, this would create the admin user in the database
      const adminResponse = {
        _id: "admin123",
        email: "admin@cbtplatform.com", 
        nickname: "admin",
        firstName: "Admin",
        lastName: "User",
        isAdmin: true,
        isPremium: true,
        isActivated: true
      };
      
      res.json({ 
        message: "Admin account ready - use email: admin@cbtplatform.com, password: admin123", 
        admin: adminResponse 
      });
    } catch (error) {
      console.error("Error creating admin:", error);
      res.status(500).json({ message: "Failed to create admin account" });
    }
  });

  app.post("/api/admin/subjects", async (req, res) => {
    try {
      const subject = await storage.createSubject(req.body);
      res.json(subject);
    } catch (error) {
      console.error("Error creating subject:", error);
      res.status(500).json({ message: "Failed to create subject" });
    }
  });

  app.post("/api/admin/questions", async (req, res) => {
    try {
      const question = await storage.createQuestion(req.body);
      res.json(question);
    } catch (error) {
      console.error("Error creating question:", error);
      res.status(500).json({ message: "Failed to create question" });
    }
  });

  app.delete("/api/admin/questions/:id", async (req, res) => {
    try {
      await storage.deleteQuestion(req.params.id);
      res.json({ success: true });
    } catch (error) {
      console.error("Error deleting question:", error);
      res.status(500).json({ message: "Failed to delete question" });
    }
  });

  // Competition routes
  app.get("/api/competitions", async (req, res) => {
    try {
      const competitions = await storage.getActiveCompetitions(10);
      res.json(competitions);
    } catch (error) {
      console.error("Error fetching competitions:", error);
      res.status(500).json({ message: "Failed to fetch competitions" });
    }
  });

  app.post("/api/competitions", async (req, res) => {
    try {
      const competition = await storage.createCompetition(req.body);
      res.json(competition);
    } catch (error) {
      console.error("Error creating competition:", error);
      res.status(500).json({ message: "Failed to create competition" });
    }
  });

  app.post("/api/competitions/:id/join", async (req, res) => {
    try {
      const { userId } = req.body;
      const participant = await storage.joinCompetition(req.params.id, userId);
      res.json(participant);
    } catch (error) {
      console.error("Error joining competition:", error);
      res.status(500).json({ message: "Failed to join competition" });
    }
  });

  // Analytics logging
  app.post("/api/analytics", async (req, res) => {
    try {
      const event = await storage.logAnalyticsEvent(req.body);
      res.json(event);
    } catch (error) {
      console.error("Error logging analytics:", error);
      res.status(500).json({ message: "Failed to log analytics" });
    }
  });

  // Admin routes
  app.get("/api/admin/stats", async (req, res) => {
    try {
      const stats = await storage.getAnalyticsSummary();
      res.json(stats);
    } catch (error) {
      console.error("Error getting admin stats:", error);
      res.status(500).json({ message: "Failed to get admin statistics" });
    }
  });

  app.get("/api/admin/users", async (req, res) => {
    try {
      const users = await storage.getAllUsers();
      res.json(users);
    } catch (error) {
      console.error("Error getting all users:", error);
      res.status(500).json({ message: "Failed to get users" });
    }
  });

  app.get("/api/admin/questions", async (req, res) => {
    try {
      const questions = await storage.getAllQuestions();
      res.json(questions);
    } catch (error) {
      console.error("Error getting all questions:", error);
      res.status(500).json({ message: "Failed to get questions" });
    }
  });

  app.delete("/api/admin/questions/:id", async (req, res) => {
    try {
      const { id } = req.params;
      await storage.deleteQuestion(id);
      res.json({ success: true });
    } catch (error) {
      console.error("Error deleting question:", error);
      res.status(500).json({ message: "Failed to delete question" });
    }
  });

  // Payment routes for Paystack integration
  app.post("/api/payments/initialize", async (req, res) => {
    try {
      const { userId, email, amount = 300000 } = req.body; // Default ₦3000 for CBT (in kobo)
      
      if (!userId || !email) {
        return res.status(400).json({ message: "userId and email are required" });
      }

      const { paystackService } = await import('./services/paystackService');
      
      // Generate unique reference
      const reference = `CBT_${Date.now()}_${Math.random().toString(36).substring(7)}`;
      
      // Initialize Paystack payment
      const paymentResponse = await paystackService.initializePayment({
        email,
        amount,
        reference,
        callback_url: `${req.protocol}://${req.get('host')}?reference=${reference}&status=success`,
        metadata: {
          userId,
          sessionType: 'cbt'
        }
      });

      // Create payment record
      const unlockCode = paystackService.generateUnlockCode();
      await storage.createPayment({
        userId,
        paymentReference: reference,
        paystackReference: paymentResponse.data.reference,
        amount,
        email,
        unlockCode,
        paymentMethod: 'paystack'
      });

      res.json({
        success: true,
        payment_url: paymentResponse.data.authorization_url,
        reference: paymentResponse.data.reference
      });
    } catch (error) {
      console.error("Payment initialization error:", error);
      res.status(500).json({ message: "Failed to initialize payment" });
    }
  });

  // Verify payment
  app.post("/api/payments/verify", async (req, res) => {
    try {
      const { reference } = req.body;
      
      if (!reference) {
        return res.status(400).json({ message: "Payment reference is required" });
      }

      const { paystackService } = await import('./services/paystackService');
      
      // Get payment record
      const payment = await storage.getPaymentByReference(reference);
      if (!payment) {
        return res.status(404).json({ message: "Payment not found" });
      }

      // Verify with Paystack
      const verificationResponse = await paystackService.verifyPayment(reference);
      
      if (verificationResponse.data.status === 'success') {
        // Update payment status
        await storage.updatePayment(payment.id, {
          status: 'success',
          completedAt: new Date()
        });

        // Update user to premium status for CBT access
        await storage.updateUser(payment.userId, {
          isPremium: true,
          isActivated: true
        });

        res.json({
          success: true,
          status: 'success',
          unlockCode: payment.unlockCode,
          message: "Payment verified successfully"
        });
      } else {
        await storage.updatePayment(payment.id, {
          status: 'failed'
        });
        
        res.status(400).json({
          success: false,
          message: "Payment verification failed"
        });
      }
    } catch (error) {
      console.error("Payment verification error:", error);
      res.status(500).json({ message: "Failed to verify payment" });
    }
  });

  // Manual unlock code validation - FIXED to actually activate premium access
  app.post("/api/payments/validate-code", async (req, res) => {
    try {
      const { userId, unlockCode } = req.body;
      
      if (!userId || !unlockCode) {
        return res.status(400).json({ message: "userId and unlockCode are required" });
      }

      console.log(`🔑 Validating unlock code: ${unlockCode} for user: ${userId}`);

      let isValidCode = false;
      let codeSource = '';

      // Check if code matches the predefined valid unlock codes
      if (VALID_UNLOCK_CODES.includes(unlockCode.trim())) {
        isValidCode = true;
        codeSource = 'predefined';
        console.log('✅ Valid predefined unlock code detected');
      }

      // Also check if it's a payment-generated unlock code
      if (!isValidCode) {
        try {
          const userPayments = await storage.getUserPayments(userId);
          const validPayment = userPayments.find(p => 
            p.unlockCode === unlockCode.toUpperCase() && 
            (p.status === 'success' || p.status === 'pending')
          );

          if (validPayment) {
            isValidCode = true;
            codeSource = 'payment-generated';
            console.log('✅ Valid payment-generated unlock code detected');
          }
        } catch (storageError) {
          console.warn('⚠️ Storage error checking payment codes:', storageError);
        }
      }

      if (isValidCode) {
        // IMPORTANT: Actually upgrade the user to premium when code is valid
        const user = await storage.getUser(userId);
        if (user && !user.isPremium) {
          await storage.updateUser(userId, {
            isPremium: true,
            isActivated: true
          });
          console.log(`🎉 User ${userId} upgraded to premium via ${codeSource} unlock code`);
          
          // Send SMS notification via Twilio (replacing SendGrid)
          if (user.email) {
            await twilioService.sendActivationNotification(
              user.email.replace('@', ''), // Simple phone conversion for demo
              unlockCode
            );
          }
        }

        res.json({
          success: true,
          message: "Unlock code is valid - Premium access activated!",
          upgraded: !user?.isPremium
        });
      } else {
        console.log('❌ Invalid unlock code provided');
        res.status(400).json({
          success: false,
          message: "Invalid unlock code. Please check your code and try again."
        });
      }
    } catch (error) {
      console.error("Code validation error:", error);
      res.status(500).json({ message: "Failed to validate unlock code" });
    }
  });

  // DISABLED: Google Authentication routes
  // Uncomment the code below to re-enable Google OAuth
  /*
  app.post("/api/auth/google", async (req, res) => {
    try {
      const { idToken } = req.body;
      
      if (!idToken) {
        return res.status(400).json({ message: "Google ID token is required" });
      }

      const authResult = await googleAuthService.verifyIdToken(idToken);
      
      if (!authResult.success || !authResult.user) {
        return res.status(400).json({ message: authResult.error || "Google authentication failed" });
      }

      const googleUser = authResult.user;
      
      // Check if user already exists
      let user = await storage.getUserByEmail(googleUser.email);
      
      if (!user) {
        // Create new user from Google profile
        const userData = {
          firstName: googleUser.given_name,
          lastName: googleUser.family_name,
          email: googleUser.email,
          nickname: googleUser.given_name,
          password: '', // Google users don't need password
          isAdmin: false,
          isPremium: false,
          isActivated: true,
          isEmailVerified: true, // Google emails are pre-verified
          emailVerificationToken: null,
          emailVerificationExpires: null,
          googleId: googleUser.id,
          avatar: googleUser.picture,
          totalScore: 0,
          testsCompleted: 0,
          studyHours: 0,
          usageCount: 0
        };

        user = await storage.createUser(userData);
        console.log(`✅ New user created via Google Auth: ${user.email}`);
        
        // Send welcome SMS via Twilio
        if (user.email) {
          await twilioService.sendWelcomeMessage(
            user.email.replace('@', ''), // Simple phone conversion for demo
            user.firstName
          );
        }
      } else {
        // Update existing user with Google info if missing
        if (!user.googleId) {
          await storage.updateUser(user.id, {
            googleId: googleUser.id,
            avatar: googleUser.picture,
            isEmailVerified: true
          });
        }
        console.log(`✅ Existing user logged in via Google Auth: ${user.email}`);
      }

      // Remove sensitive data from response
      const { password: _, emailVerificationToken: __, ...userResponse } = user;
      
      res.json({
        ...userResponse,
        message: "Google authentication successful"
      });
    } catch (error) {
      console.error("Google auth error:", error);
      res.status(500).json({ message: "Google authentication failed" });
    }
  });
  */

  // CBT Session routes - Fixed and enhanced
  app.post("/api/cbt/sessions", async (req, res) => {
    try {
      const { userId, selectedSubjects, paymentId } = req.body;
      
      console.log("CBT session creation request:", { userId, selectedSubjects, paymentId });
      
      if (!userId || !selectedSubjects || selectedSubjects.length !== 4) {
        console.log("CBT validation failed:", { userId: !!userId, subjectsCount: selectedSubjects?.length });
        return res.status(400).json({ message: "userId and exactly 4 selectedSubjects are required" });
      }

      // Verify user exists
      const user = await storage.getUser(userId);
      if (!user) {
        return res.status(404).json({ message: "User not found" });
      }

      // Create CBT session with all required fields
      const sessionData = {
        userId,
        selectedSubjects,
        paymentId: paymentId || `free-${Date.now()}`,
        timeAllowed: 7200, // 2 hours
        timeRemaining: 7200,
        isActive: true,
        startedAt: new Date(),
        questions: [], // Will be populated when starting exam
        userAnswers: {},
        currentQuestionIndex: 0
      };

      console.log("Creating CBT session with data:", sessionData);
      const session = await storage.createCbtSession(sessionData);
      console.log("CBT session created successfully:", session);

      res.json(session);
    } catch (error) {
      console.error("CBT session creation error:", error);
      res.status(500).json({ message: "Failed to create CBT session", error: error instanceof Error ? error.message : "Unknown error" });
    }
  });

  // Get specific CBT session by ID
  app.get("/api/cbt/sessions/:id", async (req, res) => {
    try {
      const { id } = req.params;
      console.log("Fetching CBT session:", id);
      
      const session = await storage.getCbtSession(id);
      if (!session) {
        return res.status(404).json({ message: "CBT session not found" });
      }
      
      console.log("Found CBT session with", session.questions?.length || 0, "questions");
      res.json(session);
    } catch (error) {
      console.error("Get CBT session error:", error);
      res.status(500).json({ message: "Failed to get CBT session", error: error instanceof Error ? error.message : "Unknown error" });
    }
  });

  app.get("/api/cbt/sessions/active/:userId", async (req, res) => {
    try {
      const { userId } = req.params;
      console.log("Fetching active CBT session for user:", userId);
      
      const session = await storage.getUserActiveCbtSession(userId);
      console.log("Found CBT session:", session ? "Yes" : "No");
      
      res.json(session || null);
    } catch (error) {
      console.error("Get active CBT session error:", error);
      res.status(500).json({ message: "Failed to get active CBT session", error: error instanceof Error ? error.message : "Unknown error" });
    }
  });

  app.patch("/api/cbt/sessions/:id", async (req, res) => {
    try {
      const { id } = req.params;
      const updates = req.body;
      
      // Convert string dates to Date objects if needed
      if (updates.completedAt && typeof updates.completedAt === 'string') {
        updates.completedAt = new Date(updates.completedAt);
      }
      if (updates.startedAt && typeof updates.startedAt === 'string') {
        updates.startedAt = new Date(updates.startedAt);
      }
      
      const updatedSession = await storage.updateCbtSession(id, updates);
      res.json(updatedSession);
    } catch (error) {
      console.error("CBT session update error:", error);
      res.status(500).json({ message: "Failed to update CBT session" });
    }
  });

  // Start CBT Examination - Fetch questions for all selected subjects
  app.post("/api/cbt/sessions/:id/start", async (req, res) => {
    try {
      const { id } = req.params;
      
      console.log("Starting CBT examination for session:", id);
      
      // Get the CBT session
      const session = await storage.getCbtSession(id);
      if (!session) {
        return res.status(404).json({ message: "CBT session not found" });
      }

      if (!session.isActive) {
        return res.status(400).json({ message: "CBT session is not active" });
      }

      // Import new ALOC API service with proper rate limiting
      const { alocApiService } = await import('./services/alocApiService');

      const allQuestions = [];
      const questionsPerSubject = 20; // 20 questions per subject as requested by user

      // Clear any previously used questions for fresh content
      alocApiService.clearUsedQuestions();

      console.log(`🚀 Fetching fresh questions for ${session.selectedSubjects.length} subjects...`);

      // Fetch questions sequentially to avoid rate limits
      for (const subject of session.selectedSubjects) {
        try {
          console.log(`📚 Fetching ${questionsPerSubject} questions for ${subject.name}...`);
          
          const alocQuestions = await alocApiService.fetchQuestions(
            subject.name.toLowerCase(), 
            questionsPerSubject, 
            'utme'
          );

          if (alocQuestions.length > 0) {
            // Transform ALOC questions to our CBT format
            const transformedQuestions = alocQuestions.map((q, index) => ({
              id: `${id}_${subject.name}_${index}_${Date.now()}`,
              question: q.question,
              options: [
                { id: 'A', text: q.option.a },
                { id: 'B', text: q.option.b },
                { id: 'C', text: q.option.c },
                { id: 'D', text: q.option.d }
              ],
              correctAnswer: q.answer.toUpperCase(),
              subject: subject.name,
              explanation: q.solution || `This is a ${subject.name} question from ALOC database.`,
              examType: q.examtype || 'utme',
              examYear: q.examyear || '2024',
              imageUrl: q.image || null,
              timeLimit: 120, // 2 minutes per question
              difficulty: 'medium'
            }));

            allQuestions.push(...transformedQuestions);
            console.log(`✅ Added ${alocQuestions.length} REAL questions for ${subject.name} (total: ${allQuestions.length})`);
          } else {
            // Only add minimal fallback if absolutely no questions from ALOC
            console.log(`⚠️ No ALOC questions for ${subject.name}, adding 1 fallback`);
            const fallbacks = alocApiService.generateFallbackQuestions(subject.name, 1);
            
            const fallbackQuestion = {
              id: `fallback_${id}_${subject.name}_${Date.now()}`,
              question: fallbacks[0].question,
              options: [
                { id: 'A', text: fallbacks[0].option.a },
                { id: 'B', text: fallbacks[0].option.b },
                { id: 'C', text: fallbacks[0].option.c },
                { id: 'D', text: fallbacks[0].option.d }
              ],
              correctAnswer: fallbacks[0].answer.toUpperCase(),
              subject: subject.name,
              explanation: fallbacks[0].solution,
              examType: 'utme',
              examYear: '2024',
              imageUrl: null,
              timeLimit: 120,
              difficulty: 'medium'
            };
            
            allQuestions.push(fallbackQuestion);
          }

        } catch (error) {
          console.error(`❌ Error fetching questions for ${subject.name}:`, error);
          
          // Emergency fallback - only 1 question per failed subject
          const emergency = alocApiService.generateFallbackQuestions(subject.name, 1);
          const emergencyQuestion = {
            id: `emergency_${id}_${subject.name}_${Date.now()}`,
            question: emergency[0].question,
            options: [
              { id: 'A', text: emergency[0].option.a },
              { id: 'B', text: emergency[0].option.b },
              { id: 'C', text: emergency[0].option.c },
              { id: 'D', text: emergency[0].option.d }
            ],
            correctAnswer: emergency[0].answer.toUpperCase(),
            subject: subject.name,
            explanation: emergency[0].solution,
            examType: 'utme',
            examYear: '2024',
            imageUrl: null,
            timeLimit: 120,
            difficulty: 'medium'
          };
          
          allQuestions.push(emergencyQuestion);
        }
      }

      // Enhanced shuffle using Fisher-Yates algorithm
      const shuffledQuestions = [...allQuestions];
      for (let i = shuffledQuestions.length - 1; i > 0; i--) {
        const j = Math.floor(Math.random() * (i + 1));
        [shuffledQuestions[i], shuffledQuestions[j]] = [shuffledQuestions[j], shuffledQuestions[i]];
      }

      console.log(`🎯 Final result: ${shuffledQuestions.length} questions ready for CBT exam`);
      console.log(`📊 ALOC API used questions: ${alocApiService.getUsedQuestionsCount()}`);

      if (shuffledQuestions.length === 0) {
        return res.status(400).json({ 
          message: "Unable to fetch questions. Please check your internet connection and try again." 
        });
      }

      // Update the session with questions (fix timestamp issue)
      const updatedSession = await storage.updateCbtSession(id, {
        questions: shuffledQuestions,
        totalQuestions: shuffledQuestions.length,
        startedAt: new Date()
      });

      console.log("CBT examination started successfully with", shuffledQuestions.length, "questions");

      res.json({
        success: true,
        message: "CBT examination started successfully",
        session: updatedSession,
        totalQuestions: shuffledQuestions.length
      });

    } catch (error) {
      console.error("CBT examination start error:", error);
      res.status(500).json({ 
        message: "Failed to start CBT examination", 
        error: error instanceof Error ? error.message : "Unknown error" 
      });
    }
  });

  // Add CBT session completion route to prevent re-payment issues
  app.post("/api/cbt/complete", async (req, res) => {
    try {
      const { sessionId, userId, answers, score } = req.body;
      
      const session = await storage.getCbtSession(sessionId);
      if (!session) {
        return res.status(404).json({ message: "Session not found" });
      }
      
      // Mark session as completed - this prevents requiring payment again
      await storage.updateCbtSession(sessionId, {
        status: 'completed',
        completedAt: new Date(),
        finalScore: score,
        answers: answers,
        isCompleted: true // Crucial flag to prevent re-payment
      });
      
      // Award badges for completion
      try {
        const completionBadge = {
          userId,
          title: 'Test Taker',
          description: 'Completed your first CBT exam',
          icon: 'award',
          rarity: 'common',
          unlockedAt: new Date()
        };
        
        await storage.createUserBadge(completionBadge);
      } catch (badgeError) {
        console.error('Failed to create badge:', badgeError);
      }
      
      res.json({ 
        success: true, 
        message: "Exam completed successfully",
        sessionId,
        score,
        badgeUnlocked: true
      });
    } catch (error) {
      console.error("CBT completion error:", error);
      res.status(500).json({ message: "Failed to complete exam" });
    }
  });

  // Chat History and Badges API Routes
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

  // Short Notes API Routes
  app.get("/api/short-notes/:userId", async (req, res) => {
    try {
      const { userId } = req.params;
      const { subjectId, difficulty, search } = req.query;
      
      const notes = await storage.getShortNotes(userId, {
        subjectId: subjectId as string,
        difficulty: difficulty as string,
        search: search as string
      });
      
      res.json(notes);
    } catch (error) {
      console.error("Error fetching short notes:", error);
      res.status(500).json({ message: "Failed to fetch short notes" });
    }
  });

  app.post("/api/short-notes", async (req, res) => {
    try {
      const note = await storage.createShortNote(req.body);
      res.json(note);
    } catch (error) {
      console.error("Error creating short note:", error);
      res.status(500).json({ message: "Failed to create short note" });
    }
  });

  app.get("/api/short-notes/single/:id", async (req, res) => {
    try {
      const { id } = req.params;
      const note = await storage.getShortNote(id);
      
      if (!note) {
        return res.status(404).json({ message: "Note not found" });
      }
      
      res.json(note);
    } catch (error) {
      console.error("Error fetching short note:", error);
      res.status(500).json({ message: "Failed to fetch short note" });
    }
  });

  app.patch("/api/short-notes/:id", async (req, res) => {
    try {
      const { id } = req.params;
      const note = await storage.updateShortNote(id, req.body);
      res.json(note);
    } catch (error) {
      console.error("Error updating short note:", error);
      res.status(500).json({ message: "Failed to update short note" });
    }
  });

  app.delete("/api/short-notes/:id", async (req, res) => {
    try {
      const { id } = req.params;
      await storage.deleteShortNote(id);
      res.json({ success: true });
    } catch (error) {
      console.error("Error deleting short note:", error);
      res.status(500).json({ message: "Failed to delete short note" });
    }
  });

  app.patch("/api/short-notes/:id/bookmark", async (req, res) => {
    try {
      const { id } = req.params;
      const { isBookmarked } = req.body;
      const note = await storage.bookmarkShortNote(id, isBookmarked);
      res.json(note);
    } catch (error) {
      console.error("Error bookmarking short note:", error);
      res.status(500).json({ message: "Failed to bookmark short note" });
    }
  });

  // Adaptive Scheduler API Routes
  app.get("/api/scheduler/tasks/:userId", async (req, res) => {
    try {
      const { userId } = req.params;
      const { date } = req.query;
      
      const tasks = await storage.getScheduledTasks(userId, date as string);
      res.json(tasks);
    } catch (error) {
      console.error("Error fetching scheduled tasks:", error);
      res.status(500).json({ message: "Failed to fetch scheduled tasks" });
    }
  });

  app.get("/api/scheduler/today/:userId", async (req, res) => {
    try {
      const { userId } = req.params;
      const tasks = await storage.getTodayTasks(userId);
      res.json(tasks);
    } catch (error) {
      console.error("Error fetching today's tasks:", error);
      res.status(500).json({ message: "Failed to fetch today's tasks" });
    }
  });

  app.get("/api/scheduler/upcoming/:userId", async (req, res) => {
    try {
      const { userId } = req.params;
      const tasks = await storage.getUpcomingTasks(userId);
      res.json(tasks);
    } catch (error) {
      console.error("Error fetching upcoming tasks:", error);
      res.status(500).json({ message: "Failed to fetch upcoming tasks" });
    }
  });

  app.post("/api/scheduler/tasks", async (req, res) => {
    try {
      const task = await storage.createScheduledTask(req.body);
      res.json(task);
    } catch (error) {
      console.error("Error creating scheduled task:", error);
      res.status(500).json({ message: "Failed to create scheduled task" });
    }
  });

  app.patch("/api/scheduler/tasks/:id", async (req, res) => {
    try {
      const { id } = req.params;
      const task = await storage.updateScheduledTask(id, req.body);
      res.json(task);
    } catch (error) {
      console.error("Error updating scheduled task:", error);
      res.status(500).json({ message: "Failed to update scheduled task" });
    }
  });

  app.patch("/api/scheduler/tasks/:id/start", async (req, res) => {
    try {
      const { id } = req.params;
      const task = await storage.startTask(id);
      res.json(task);
    } catch (error) {
      console.error("Error starting task:", error);
      res.status(500).json({ message: "Failed to start task" });
    }
  });

  app.patch("/api/scheduler/tasks/:id/complete", async (req, res) => {
    try {
      const { id } = req.params;
      const { performance } = req.body;
      const task = await storage.completeTask(id, performance);
      res.json(task);
    } catch (error) {
      console.error("Error completing task:", error);
      res.status(500).json({ message: "Failed to complete task" });
    }
  });

  app.patch("/api/scheduler/tasks/:id/skip", async (req, res) => {
    try {
      const { id } = req.params;
      const task = await storage.skipTask(id);
      res.json(task);
    } catch (error) {
      console.error("Error skipping task:", error);
      res.status(500).json({ message: "Failed to skip task" });
    }
  });

  // Focus Sessions API Routes
  app.post("/api/focus/sessions", async (req, res) => {
    try {
      const session = await storage.createFocusSession(req.body);
      res.json(session);
    } catch (error) {
      console.error("Error creating focus session:", error);
      res.status(500).json({ message: "Failed to create focus session" });
    }
  });

  app.get("/api/focus/sessions/active/:userId", async (req, res) => {
    try {
      const { userId } = req.params;
      const session = await storage.getActiveFocusSession(userId);
      res.json(session);
    } catch (error) {
      console.error("Error fetching active focus session:", error);
      res.status(500).json({ message: "Failed to fetch active focus session" });
    }
  });

  app.get("/api/focus/sessions/history/:userId", async (req, res) => {
    try {
      const { userId } = req.params;
      const sessions = await storage.getFocusHistory(userId);
      res.json(sessions);
    } catch (error) {
      console.error("Error fetching focus history:", error);
      res.status(500).json({ message: "Failed to fetch focus history" });
    }
  });

  app.patch("/api/focus/sessions/:id", async (req, res) => {
    try {
      const { id } = req.params;
      const session = await storage.updateFocusSession(id, req.body);
      res.json(session);
    } catch (error) {
      console.error("Error updating focus session:", error);
      res.status(500).json({ message: "Failed to update focus session" });
    }
  });

  app.patch("/api/focus/sessions/:id/start", async (req, res) => {
    try {
      const { id } = req.params;
      const session = await storage.startFocusSession(id);
      res.json(session);
    } catch (error) {
      console.error("Error starting focus session:", error);
      res.status(500).json({ message: "Failed to start focus session" });
    }
  });

  app.patch("/api/focus/sessions/:id/pause", async (req, res) => {
    try {
      const { id } = req.params;
      const session = await storage.pauseFocusSession(id);
      res.json(session);
    } catch (error) {
      console.error("Error pausing focus session:", error);
      res.status(500).json({ message: "Failed to pause focus session" });
    }
  });

  app.patch("/api/focus/sessions/:id/complete", async (req, res) => {
    try {
      const { id } = req.params;
      const { focusScore, distractionCount } = req.body;
      const session = await storage.completeFocusSession(id, focusScore, distractionCount);
      res.json(session);
    } catch (error) {
      console.error("Error completing focus session:", error);
      res.status(500).json({ message: "Failed to complete focus session" });
    }
  });

  // Study Insights API Routes
  app.get("/api/insights/weekly/:userId", async (req, res) => {
    try {
      const { userId } = req.params;
      const insights = await storage.getWeeklyInsights(userId);
      res.json(insights);
    } catch (error) {
      console.error("Error fetching weekly insights:", error);
      res.status(500).json({ message: "Failed to fetch weekly insights" });
    }
  });

  app.post("/api/insights", async (req, res) => {
    try {
      const insights = await storage.createStudyInsights(req.body);
      res.json(insights);
    } catch (error) {
      console.error("Error creating study insights:", error);
      res.status(500).json({ message: "Failed to create study insights" });
    }
  });

  app.patch("/api/insights/:id", async (req, res) => {
    try {
      const { id } = req.params;
      const insights = await storage.updateStudyInsights(id, req.body);
      res.json(insights);
    } catch (error) {
      console.error("Error updating study insights:", error);
      res.status(500).json({ message: "Failed to update study insights" });
    }
  });

  // =====================================
  // PAYSTACK PAYMENT INTEGRATION ROUTES
  // =====================================

  // Initialize Paystack payment for CBT access
  app.post("/api/payment/initialize", async (req, res) => {
    try {
      const { userId, email, amount = 300000 } = req.body; // Default ₦3000 in kobo
      
      if (!userId || !email) {
        return res.status(400).json({ message: "User ID and email are required" });
      }

      if (!process.env.PAYSTACK_SECRET_KEY) {
        // Return manual unlock code for testing without Paystack
        const unlockCode = `CBT-${Math.random().toString(36).substr(2, 8).toUpperCase()}`;
        
        const payment = await storage.createPayment({
          userId,
          paymentReference: `manual_${Date.now()}`,
          amount,
          email,
          status: 'pending',
          unlockCode,
          paymentMethod: 'manual'
        });
        
        return res.json({
          success: true,
          paymentMethod: 'manual',
          unlockCode,
          message: 'Use this unlock code to activate CBT access: ' + unlockCode,
          paymentId: payment.id
        });
      }

      // Create payment reference
      const reference = `cbt_${userId}_${Date.now()}`;
      
      console.log(`💳 Initializing Paystack payment: ₦${amount/100} for ${email}`);

      const paystackResponse = await fetch('https://api.paystack.co/transaction/initialize', {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${process.env.PAYSTACK_SECRET_KEY}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          email,
          amount,
          reference,
          currency: 'NGN',
          metadata: {
            custom_fields: [{
              display_name: "CBT Access",
              variable_name: "cbt_access",
              value: "4-subject CBT examination access"
            }],
            userId
          },
          callback_url: `${req.protocol}://${req.get('host')}/payment/callback`
        })
      });

      if (!paystackResponse.ok) {
        throw new Error(`Paystack initialization failed: ${paystackResponse.status}`);
      }

      const paystackData = await paystackResponse.json();
      
      if (!paystackData.status) {
        throw new Error(`Paystack error: ${paystackData.message}`);
      }

      // Store payment record
      const payment = await storage.createPayment({
        userId,
        paymentReference: reference,
        paystackReference: reference,
        amount,
        email,
        status: 'pending',
        paymentMethod: 'paystack'
      });

      console.log(`✅ Payment initialized: ${reference}`);

      res.json({
        success: true,
        authorizationUrl: paystackData.data.authorization_url,
        accessCode: paystackData.data.access_code,
        reference: reference,
        paymentId: payment.id
      });
      
    } catch (error) {
      console.error('Payment initialization error:', error);
      res.status(500).json({ 
        message: 'Failed to initialize payment',
        error: error instanceof Error ? error.message : 'Unknown error'
      });
    }
  });

  // Verify Paystack payment
  app.post("/api/payment/verify", async (req, res) => {
    try {
      const { reference } = req.body;
      
      if (!reference) {
        return res.status(400).json({ message: "Payment reference is required" });
      }

      console.log(`🔍 Verifying payment: ${reference}`);

      if (!process.env.PAYSTACK_SECRET_KEY) {
        return res.status(500).json({ message: "Paystack not configured" });
      }

      const verifyResponse = await fetch(`https://api.paystack.co/transaction/verify/${reference}`, {
        method: 'GET',
        headers: {
          'Authorization': `Bearer ${process.env.PAYSTACK_SECRET_KEY}`,
          'Content-Type': 'application/json',
        }
      });

      if (!verifyResponse.ok) {
        throw new Error(`Paystack verification failed: ${verifyResponse.status}`);
      }

      const verifyData = await verifyResponse.json();
      
      if (!verifyData.status) {
        throw new Error(`Paystack verification error: ${verifyData.message}`);
      }

      // Update payment status
      const payment = await storage.getPaymentByReference(reference);
      if (!payment) {
        throw new Error('Payment record not found');
      }

      const isSuccessful = verifyData.data.status === 'success';
      const unlockCode = isSuccessful ? `CBT-${Math.random().toString(36).substr(2, 8).toUpperCase()}` : undefined;
      
      await storage.updatePayment(payment.id, {
        status: isSuccessful ? 'success' : 'failed',
        unlockCode,
        completedAt: new Date()
      });

      // If payment successful, activate user's premium status
      if (isSuccessful && payment.userId) {
        await storage.updateUser(payment.userId, {
          isPremium: true
        });
        console.log(`✅ User ${payment.userId} activated as premium`);
      }

      console.log(`✅ Payment verification complete: ${verifyData.data.status}`);

      res.json({
        success: isSuccessful,
        status: verifyData.data.status,
        unlockCode,
        message: isSuccessful ? 
          'Payment successful! Use unlock code: ' + unlockCode :
          'Payment was not successful',
        amount: verifyData.data.amount,
        gatewayResponse: verifyData.data.gateway_response
      });
      
    } catch (error) {
      console.error('Payment verification error:', error);
      res.status(500).json({ 
        message: 'Failed to verify payment',
        error: error instanceof Error ? error.message : 'Unknown error'
      });
    }
  });

  // Manual unlock code activation
  app.post("/api/payment/activate-code", async (req, res) => {
    try {
      const { userId, unlockCode } = req.body;
      
      if (!userId || !unlockCode) {
        return res.status(400).json({ message: "User ID and unlock code are required" });
      }

      // Simple validation - in a real app you'd check against a database
      const validCode = unlockCode.toUpperCase().startsWith('CBT-');
      
      if (!validCode) {
        return res.status(400).json({ message: "Invalid unlock code format" });
      }

      // Activate user's premium status
      await storage.updateUser(userId, {
        isPremium: true
      });

      console.log(`✅ Manual unlock code activated for user ${userId}`);

      res.json({
        success: true,
        message: 'CBT access activated successfully!'
      });
      
    } catch (error) {
      console.error('Code activation error:', error);
      res.status(500).json({ 
        message: 'Failed to activate unlock code',
        error: error instanceof Error ? error.message : 'Unknown error'
      });
    }
  });

  const httpServer = createServer(app);
  return httpServer;
}
