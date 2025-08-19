// Service implementing the API patterns from the provided HTML
// This includes both the JAMB questions API and AI explanation services

interface JambApiResponse {
  data: {
    id: string;
    question: string;
    option: {
      a: string;
      b: string;
      c: string;
      d: string;
    };
    answer: string;
    explanation?: string;
    examtype: string;
    examyear: string;
    subject: string;
    image?: string;
  }[];
}

class HtmlBasedApiService {
  private readonly jambBaseUrl = 'https://questions.aloc.com.ng/api/v2';
  private readonly geminiApiKey = process.env.GEMINI_API_KEY'; // Actual Gemini key from HTML
  private readonly gptApiKey = process.env.OPENAI_API_KEY; // Actual OpenAI key from HTML
  private readonly kaizApiKey = process.env.KAIZ_API_KEY; // Working Kaiz API key

  /**
   * Fetch JAMB questions using the same pattern as the HTML
   */
  async fetchJambQuestions(subject: string, options: {
    limit?: number;
    year?: string;
    type?: string;
  } = {}): Promise<any[]> {
    const { limit = 40, year, type = 'utme' } = options;
    
    // Map subject names to ALOC API IDs
    const subjectMap: Record<string, string> = {
      'english': '1',
      'mathematics': '2', 
      'physics': '3',
      'chemistry': '4',
      'biology': '5',
      'economics': '6',
      'government': '7',
      'literature': '8'
    };

    const subjectId = subjectMap[subject.toLowerCase()] || '1';
    
    // ALOC API follows pattern: /api/v2/q/{question_id}?subject={subject_name}
    // We need to make multiple requests for different question IDs to get a collection
    
    const questions = [];
    const maxQuestions = Math.min(limit, 50); // Don't exceed reasonable limits
    
    try {
      console.log(`Fetching ALOC questions for subject: ${subject}`);
      
      // Try to fetch multiple questions by ID (1 to maxQuestions)
      const fetchPromises = [];
      for (let questionId = 1; questionId <= maxQuestions; questionId++) {
        const apiUrl = `https://questions.aloc.com.ng/api/v2/q/${questionId}?subject=${subject.toLowerCase()}`;
        
        const fetchPromise = fetch(apiUrl, {
          method: 'GET',
          headers: {
            'Authorization': `Bearer QB-139d5195a490b3c12794`,
            'X-API-Key': 'QB-139d5195a490b3c12794',
            'Accept': 'application/json',
            'Content-Type': 'application/json',
            'User-Agent': 'JAMB-CBT-Practice-App/1.0'
          }
        }).then(async response => {
          if (response.ok) {
            const data = await response.json();
            console.log(`ALOC API success for question ${questionId}:`, data ? 'Question received' : 'No data');
            return data;
          }
          return null;
        }).catch(error => {
          console.log(`ALOC API failed for question ${questionId}:`, error.message);
          return null;
        });
        
        fetchPromises.push(fetchPromise);
      }
      
      // Wait for all requests to complete
      const results = await Promise.all(fetchPromises);
      
      // Filter out null results and collect valid questions
      const validQuestions = results.filter(result => result && result.question);
      
      if (validQuestions.length > 0) {
        console.log(`Successfully fetched ${validQuestions.length} questions from ALOC API`);
        return validQuestions.slice(0, limit);
      }
      
    } catch (error) {
      console.error('Error in ALOC API batch request:', error);
    }

    // If all ALOC endpoints fail, return fallback questions
    console.log('All ALOC endpoints failed, using fallback questions');
    return this.getFallbackQuestions(subject, limit);
  }

  /**
   * Generate AI explanation using Gemini (like in HTML)
   */
  async generateGeminiExplanation(question: string, correctAnswer: string, userAnswer: string, options?: Array<{ id: string; text: string; }>, subject?: string): Promise<string> {
    try {
      // Try the Kaiz GPT-4 API first (like in the HTML implementation)
      const detailedPrompt = `You are an expert tutor for Nigerian examinations (JAMB, WAEC, NECO, POST-UTME). Provide a detailed educational explanation for this ${subject || 'exam'} question, suitable for a student preparing for the exam. Include why the correct answer is right, why other options are incorrect, and address common misconceptions. Keep the tone clear, concise, and engaging. Do not use markdown formatting.

Question: "${question}"
${options ? `Options:\n${options.map((opt, idx) => `${String.fromCharCode(65 + idx)}) ${opt.text}`).join('\n')}` : ''}
Correct Answer: ${correctAnswer}
Student's Answer: ${userAnswer || 'No answer selected'}

Explanation should be 150-300 words, structured with an introduction, explanation of the correct answer, analysis of incorrect options, and a summary of key takeaways.`;

      const response = await fetch(`https://kaiz-apis.gleeze.com/api/gpt-4.1?ask=${encodeURIComponent(detailedPrompt)}&uid=1268&apikey=${this.kaizApiKey}`, {
        method: 'GET',
        headers: {
          'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36'
        }
      });
      
      if (response.ok) {
        const data = await response.json();
        const cleanedResponse = data.response
          ?.replace(/\*\*|\*|_|\#\#/g, '')
          .replace(/\n\s*\n/g, '\n')
          .replace(/^\s+|\s+$/g, '')
          .replace(/```/g, '');
        
        if (cleanedResponse) {
          return cleanedResponse + `\n\nCorrect Answer: ${correctAnswer}`;
        }
      }

      // Fallback to Gemini API if Kaiz fails
      const geminiPrompt = `Explain why "${correctAnswer}" is the correct answer to this question:

Question: ${question}
Student's answer: ${userAnswer}
Correct answer: ${correctAnswer}

Provide a clear, educational explanation suitable for JAMB/POST-UTME students.`;

      const geminiResponse = await fetch('https://generativelanguage.googleapis.com/v1beta/models/gemini-pro:generateContent', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'x-goog-api-key': this.geminiApiKey
        },
        body: JSON.stringify({
          contents: [{
            parts: [{
              text: geminiPrompt
            }]
          }]
        })
      });

      if (!geminiResponse.ok) {
        throw new Error('Gemini API failed');
      }

      const geminiData = await geminiResponse.json();
      return geminiData.candidates?.[0]?.content?.parts?.[0]?.text || 'Explanation unavailable';
      
    } catch (error) {
      console.error('AI explanation error:', error);
      return this.getFallbackExplanation(correctAnswer);
    }
  }

  /**
   * Generate AI explanation using GPT (like in HTML)
   */
  async generateGptExplanation(question: string, correctAnswer: string, userAnswer: string): Promise<string> {
    try {
      const prompt = `Explain why "${correctAnswer}" is the correct answer to this question:

Question: ${question}
Student's answer: ${userAnswer}
Correct answer: ${correctAnswer}

Provide a clear, educational explanation suitable for JAMB/POST-UTME students.`;

      const response = await fetch('https://api.openai.com/v1/chat/completions', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${this.gptApiKey}`
        },
        body: JSON.stringify({
          model: 'gpt-4o',
          messages: [{
            role: 'user',
            content: prompt
          }],
          max_tokens: 500,
          temperature: 0.7
        })
      });

      if (!response.ok) {
        throw new Error('OpenAI API failed');
      }

      const data = await response.json();
      return data.choices?.[0]?.message?.content || 'Explanation unavailable';
      
    } catch (error) {
      console.error('GPT API error:', error);
      return this.getFallbackExplanation(correctAnswer);
    }
  }

  /**
   * Format question to match our internal format
   */
  formatJambQuestion(jambQuestion: any, index: number): any {
    return {
      id: jambQuestion.id || `jamb_${index}`,
      question: jambQuestion.question,
      options: [
        { id: 'A', text: jambQuestion.option?.a || 'Option A' },
        { id: 'B', text: jambQuestion.option?.b || 'Option B' },
        { id: 'C', text: jambQuestion.option?.c || 'Option C' },
        { id: 'D', text: jambQuestion.option?.d || 'Option D' }
      ],
      correctAnswer: jambQuestion.answer?.toUpperCase() || 'A',
      subject: jambQuestion.subject || 'General',
      difficulty: 'medium',
      explanation: jambQuestion.explanation || `The correct answer is ${jambQuestion.answer?.toUpperCase()}`,
      imageUrl: jambQuestion.image || null,
      year: parseInt(jambQuestion.examyear) || new Date().getFullYear(),
      examType: jambQuestion.examtype || 'UTME',
      source: 'JAMB Past Questions'
    };
  }

  private getFallbackQuestions(subject: string, limit: number): any[] {
    return Array.from({ length: Math.min(limit, 5) }, (_, i) => ({
      id: `fallback_${subject}_${i}`,
      question: `Sample ${subject} question ${i + 1}. This question tests your understanding of key concepts in ${subject}.`,
      option: {
        a: 'Option A - First choice',
        b: 'Option B - Second choice', 
        c: 'Option C - Third choice',
        d: 'Option D - Fourth choice'
      },
      answer: 'A',
      explanation: `This is a sample question for ${subject}. The correct answer demonstrates important principles in this subject area.`,
      examtype: 'UTME',
      examyear: '2024',
      subject: subject
    }));
  }

  private getFallbackExplanation(correctAnswer: string): string {
    return `The correct answer is ${correctAnswer}. Please review the relevant concepts and try similar practice questions to improve your understanding.`;
  }
}

export const htmlBasedApiService = new HtmlBasedApiService();
