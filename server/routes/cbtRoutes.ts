import type { Express } from "express";
import { alocQuestionService } from "../services/alocQuestionService";

export function registerCBTRoutes(app: Express) {
  // CBT Mode endpoint for multiple subjects following ALOC API integration guidelines
  app.post("/api/cbt/questions", async (req, res) => {
    try {
      const { subjects, questionsPerSubject = 30, examType = 'utme', year } = req.body;
      
      if (!subjects || !Array.isArray(subjects) || subjects.length === 0) {
        return res.status(400).json({ message: "Subjects array is required" });
      }
      
      console.log(`🎯 CBT Mode: Fetching questions for ${subjects.length} subjects`);
      
      // Check if service is configured
      if (!alocQuestionService.isConfigured()) {
        return res.status(500).json({ 
          message: "ALOC API not configured. Please check ALOC_ACCESS_TOKEN.",
          fallback: true
        });
      }
      
      // Fetch questions for all subjects using the service as per user guidelines
      const questionsResult = await alocQuestionService.fetchQuestionsForCBT(
        subjects.map(s => typeof s === 'string' ? s : s.name).map(name => name.toLowerCase()),
        { questionsPerSubject, examType, year }
      );
      
      // Transform to frontend format and organize by subject
      const cbtQuestions: Record<string, any[]> = {};
      let totalFetched = 0;
      
      for (const [subject, questions] of Object.entries(questionsResult)) {
        if (questions.length > 0) {
          cbtQuestions[subject] = alocQuestionService.transformForFrontend(questions);
          totalFetched += questions.length;
        } else {
          // Generate basic fallbacks if no questions available
          cbtQuestions[subject] = Array.from({ length: Math.min(questionsPerSubject, 5) }, (_, i) => ({
            id: `fallback_${subject}_${i}`,
            question: `Sample ${subject} question ${i + 1} for CBT practice.`,
            options: [
              { id: 'a', text: 'Option A' },
              { id: 'b', text: 'Option B' },
              { id: 'c', text: 'Option C' },
              { id: 'd', text: 'Option D' }
            ],
            correctAnswer: 'a',
            explanation: 'Practice question - consult your textbooks for detailed explanations.',
            examType,
            examYear: year || '2024',
            subject
          }));
        }
      }
      
      console.log(`✅ CBT fetch complete: ${totalFetched} real questions across ${subjects.length} subjects`);
      
      res.json({
        success: true,
        questions: cbtQuestions,
        totalQuestions: totalFetched,
        examType,
        year: year || '2024',
        subjects: subjects.map(s => typeof s === 'string' ? s : s.name)
      });
      
    } catch (error) {
      console.error("Error fetching CBT questions:", error);
      res.status(500).json({ 
        message: "Failed to fetch CBT questions",
        error: error instanceof Error ? error.message : "Unknown error"
      });
    }
  });

  // Get available ALOC subjects
  app.get("/api/cbt/available-subjects", async (req, res) => {
    try {
      const subjects = alocQuestionService.getAvailableSubjects();
      res.json({ subjects });
    } catch (error) {
      console.error("Error getting available subjects:", error);
      res.status(500).json({ message: "Failed to get available subjects" });
    }
  });
}