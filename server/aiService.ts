// AI Service for generating explanations using multiple providers
import { GoogleGenAI } from "@google/genai";

interface AIExplanationRequest {
  question: string;
  correctAnswer: string;
  options: { id: string; text: string }[];
  subject: string;
}

interface AIExplanationResponse {
  explanation: string;
  provider: 'gemini' | 'openai' | 'fallback';
}

class AIService {
  private gemini: GoogleGenAI | null = null;
  private openaiApiKey: string | null = null;

  constructor() {
    // Use environment variables for API keys
    const geminiKey = process.env.GEMINI_API_KEY;
    const openaiKey = process.env.OPENAI_API_KEY;
    
    // Initialize Gemini if key is available
    if (geminiKey) {
      try {
        this.gemini = new GoogleGenAI({ apiKey: geminiKey });
        console.log('✅ UTME AI: Gemini initialized successfully');
      } catch (error) {
        console.warn('❌ UTME AI: Failed to initialize Gemini:', error);
      }
    } else {
      console.warn('⚠️ UTME AI: GEMINI_API_KEY not found in environment');
    }
    
    // Store OpenAI API key if available
    if (openaiKey) {
      this.openaiApiKey = openaiKey;
      console.log('✅ UTME AI: OpenAI API key configured');
    } else {
      console.warn('⚠️ UTME AI: OPENAI_API_KEY not found in environment');
    }
    
    console.log('🤖 UTME AI Service (created by broken vzn) initialized for Nigerian students');
  }

  async generateExplanation(request: AIExplanationRequest): Promise<AIExplanationResponse> {
    const prompt = this.buildPrompt(request);

    // Try Gemini first
    if (this.gemini) {
      try {
        const result = await this.callGemini(prompt);
        return {
          explanation: result,
          provider: 'gemini'
        };
      } catch (error) {
        console.warn('Gemini API failed, trying OpenAI:', error);
      }
    }

    // Try OpenAI as fallback
    if (this.openaiApiKey) {
      try {
        const result = await this.callOpenAI(prompt);
        return {
          explanation: result,
          provider: 'openai'
        };
      } catch (error) {
        console.warn('OpenAI API failed:', error);
      }
    }

    // Return fallback explanation
    return {
      explanation: this.getFallbackExplanation(request),
      provider: 'fallback'
    };
  }

  private buildPrompt(request: AIExplanationRequest): string {
    const { question, correctAnswer, options, subject } = request;
    
    const optionsText = options.map(opt => `${opt.id}. ${opt.text}`).join('\n');
    const correctOption = options.find(opt => opt.id === correctAnswer);
    
    return `You are UTME AI, created by cognitive path developers for educational purposes. You are an expert Nigerian education assistant specializing in JAMB, WAEC, NECO, and POST-UTME preparation.

As UTME AI, your mission is to help Nigerian students excel in their examinations by providing clear, comprehensive explanations that build understanding and confidence.

Question: ${question}

Options:
${optionsText}

Correct Answer: ${correctAnswer}. ${correctOption?.text}

Please provide a detailed educational explanation (150-300 words) that:

1. **Correct Answer Analysis**: Explain clearly why option ${correctAnswer} is correct with step-by-step reasoning
2. **Alternative Options**: Briefly explain why other options are incorrect to prevent common mistakes
3. **Educational Context**: Provide relevant background knowledge and key concepts related to this ${subject} topic
4. **Study Tips**: Include practical advice, mnemonics, or formulas that help students remember this concept
5. **Real-world Application**: Where applicable, mention how this knowledge applies in real life or other subjects

Use simple, clear Nigerian English that resonates with local students. Include encouraging phrases and reference Nigerian educational context when relevant.

Remember: You are UTME AI created by broken vzn - your goal is comprehensive education, not just answering questions.`;
  }

  private async callGemini(prompt: string): Promise<string> {
    if (!this.gemini) throw new Error('Gemini not initialized');
    
    try {
      const response = await this.gemini.models.generateContent({
        model: "gemini-2.0-flash-exp",
        contents: prompt
      });
      
      const text = response.text || "";
      if (!text || text.trim().length === 0) {
        throw new Error('Empty response from Gemini');
      }
      
      // Fix repeating words issue by cleaning the response
      const cleanedText = text
        .replace(/(\b\w+\b)(\s+\1\b)+/gi, '$1') // Remove immediate word repetitions
        .replace(/\s+/g, ' ') // Normalize whitespace
        .trim();
      
      return cleanedText;
    } catch (error) {
      console.error('Gemini API error:', error);
      throw error;
    }
  }

  private async callOpenAI(prompt: string): Promise<string> {
    if (!this.openaiApiKey) throw new Error('OpenAI API key not available');

    const response = await fetch('https://api.openai.com/v1/chat/completions', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${this.openaiApiKey}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        model: 'gpt-4o', // the newest OpenAI model is "gpt-4o" which was released May 13, 2024. do not change this unless explicitly requested by the user
        messages: [
          {
            role: 'system',
            content: `You are UTME AI, created by broken vzn for educational purposes. You are an expert Nigerian education assistant specializing in JAMB, WAEC, NECO, and POST-UTME preparation. Your mission is to help Nigerian students excel by providing clear, comprehensive explanations that build understanding and confidence. Always identify yourself as UTME AI created by broken vzn when appropriate. Use simple, clear Nigerian English and provide educational context relevant to Nigerian students.`
          },
          {
            role: 'user',
            content: prompt
          }
        ],
        max_tokens: 500,
        temperature: 0.7,
      }),
    });

    if (!response.ok) {
      throw new Error(`OpenAI API error: ${response.statusText}`);
    }

    const data = await response.json();
    return data.choices[0].message.content;
  }

  private getFallbackExplanation(request: AIExplanationRequest): string {
    const { question, correctAnswer, options, subject } = request;
    const correctOption = options.find(opt => opt.id === correctAnswer);
    
    return `Hello! I'm UTME AI, created by broken vzn to help Nigerian students excel in their examinations.

**Correct Answer: ${correctAnswer}. ${correctOption?.text}**

**Explanation:**
This ${subject} question tests fundamental concepts that are essential for JAMB/POST-UTME success. The correct answer (${correctAnswer}) demonstrates the key principle being examined in this topic area.

**Study Strategy:**
- Review your ${subject} textbook, focusing on similar question patterns
- Practice more questions from this topic to strengthen your understanding
- Create summary notes for quick revision before exams

**Educational Context:**
This type of question frequently appears in Nigerian examinations because it tests core understanding rather than just memorization. Mastering these concepts will boost your overall performance.

**Next Steps:**
Continue practicing with UTME AI for personalized explanations that help you understand not just the "what" but the "why" behind each answer.

Remember: Every question you practice brings you closer to your academic goals!

*Note: For enhanced AI explanations, ensure proper API configuration.*`;
  }

  // Method to enhance existing explanation with AI
  async enhanceExplanation(basicExplanation: string, request: AIExplanationRequest): Promise<AIExplanationResponse> {
    const enhancePrompt = `
Improve and expand this basic explanation for a ${request.subject} question:

Question: ${request.question}
Current explanation: ${basicExplanation}

Please provide a more detailed, engaging explanation that:
1. Builds upon the existing explanation
2. Adds educational context
3. Includes study tips or mnemonics if applicable
4. Maintains clarity for POST-UTME students

Enhanced explanation:`;

    // Try to enhance with AI, fallback to original if fails
    try {
      if (this.gemini) {
        const enhanced = await this.callGemini(enhancePrompt);
        return {
          explanation: enhanced,
          provider: 'gemini'
        };
      } else if (this.openaiApiKey) {
        const enhanced = await this.callOpenAI(enhancePrompt);
        return {
          explanation: enhanced,
          provider: 'openai'
        };
      }
    } catch (error) {
      console.warn('Failed to enhance explanation with AI:', error);
    }

    // Return original explanation if AI enhancement fails
    return {
      explanation: basicExplanation,
      provider: 'fallback'
    };
  }
}

// Export singleton instance
export const aiService = new AIService();
export type { AIExplanationRequest, AIExplanationResponse };