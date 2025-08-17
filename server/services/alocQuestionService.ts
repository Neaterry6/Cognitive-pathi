// Enhanced ALOC API service following user's guidelines
interface AlocQuestion {
  id: string;
  question: string;
  option: {
    a: string;
    b: string;
    c: string;
    d: string;
  };
  answer: string;
  image?: string;
  solution?: string;
  examtype: string;
  examyear: string;
  subject: string;
}

interface AlocApiResponse {
  status: number;
  message: string;
  data: AlocQuestion[] | AlocQuestion;
  error?: string;
}

export class AlocQuestionService {
  private readonly baseUrl = 'https://questions.aloc.com.ng/api/v2';
  private readonly accessToken = process.env.ALOC_ACCESS_TOKEN || '';
  private readonly rateLimitDelay = 500; // 500ms between requests
  private lastRequestTime = 0;

  // Subject mapping following ALOC API documentation
  private subjectMapping: Record<string, string> = {
    'english': 'english',
    'mathematics': 'mathematics',
    'biology': 'biology', 
    'physics': 'physics',
    'chemistry': 'chemistry',
    'economics': 'economics',
    'government': 'government',
    'literature': 'englishlit',
    'geography': 'geography',
    'commerce': 'commerce',
    'accounting': 'accounting',
    'crk': 'crk',
    'irk': 'irk',
    'civiledu': 'civiledu',
    'history': 'history',
    'currentaffairs': 'currentaffairs',
    'insurance': 'insurance'
  };

  /**
   * Main method for fetching questions for CBT with 4 subjects
   */
  async fetchQuestionsForCBT(subjects: string[], options: {
    questionsPerSubject?: number;
    examType?: 'utme' | 'wassce' | 'neco' | 'post-utme';
    year?: string;
  } = {}): Promise<Record<string, AlocQuestion[]>> {
    const { questionsPerSubject = 30, examType = 'utme', year } = options;
    
    console.log(`🎯 Fetching CBT questions for ${subjects.length} subjects: ${subjects.join(', ')}`);
    
    const results: Record<string, AlocQuestion[]> = {};
    
    // Fetch questions for each subject in parallel as suggested in user guidelines
    const fetchPromises = subjects.map(async (subject) => {
      const questions = await this.fetchQuestionsBySubject(subject, questionsPerSubject, examType, year);
      return { subject, questions };
    });
    
    const subjectResults = await Promise.all(fetchPromises);
    
    // Organize results by subject
    for (const { subject, questions } of subjectResults) {
      results[subject] = questions;
    }
    
    const totalQuestions = Object.values(results).reduce((sum, questions) => sum + questions.length, 0);
    console.log(`✅ CBT fetch complete: ${totalQuestions} total questions across ${subjects.length} subjects`);
    
    return results;
  }

  /**
   * Fetch questions for a single subject using multiple ALOC endpoints
   */
  private async fetchQuestionsBySubject(
    subject: string,
    limit: number,
    examType?: string,
    year?: string
  ): Promise<AlocQuestion[]> {
    const mappedSubject = this.subjectMapping[subject.toLowerCase()] || subject.toLowerCase();
    
    console.log(`📚 Fetching ${limit} questions for ${mappedSubject} (${examType}, ${year || 'any year'})`);
    
    const allQuestions: AlocQuestion[] = [];
    let attempts = 0;
    const maxAttempts = Math.min(limit, 10); // Don't make too many API calls
    
    // Strategy: Make multiple single-question calls to get the desired number
    while (allQuestions.length < limit && attempts < maxAttempts) {
      try {
        const endpoint = this.buildUrl('/q', mappedSubject, examType, year);
        const questions = await this.fetchFromEndpoint(endpoint, mappedSubject);
        
        // Add new unique questions
        for (const question of questions) {
          if (!allQuestions.some(q => q.id === question.id) && allQuestions.length < limit) {
            allQuestions.push(question);
          }
        }
        
        attempts++;
        
        // Small delay between requests to respect rate limits
        if (attempts < maxAttempts) {
          await new Promise(resolve => setTimeout(resolve, 300));
        }
        
      } catch (error) {
        console.warn(`⚠️ API call ${attempts + 1} failed:`, error);
        attempts++;
      }
    }
    
    // If we still don't have enough questions, try the bulk endpoints
    if (allQuestions.length < limit) {
      const bulkEndpoints = [
        this.buildUrl('/m', mappedSubject, examType, year),
        this.buildUrl(`/q/${limit}`, mappedSubject, examType, year)
      ];
      
      for (const endpoint of bulkEndpoints) {
        try {
          const questions = await this.fetchFromEndpoint(endpoint, mappedSubject);
          for (const question of questions) {
            if (!allQuestions.some(q => q.id === question.id) && allQuestions.length < limit) {
              allQuestions.push(question);
            }
          }
          if (allQuestions.length >= limit) break;
        } catch (error) {
          console.warn(`⚠️ Bulk endpoint failed: ${endpoint}`, error);
        }
      }
    }
    
    console.log(`✅ Collected ${allQuestions.length} unique questions for ${mappedSubject}`);
    return allQuestions.slice(0, limit);
  }

  /**
   * Build URL with parameters following ALOC API format
   */
  private buildUrl(endpoint: string, subject: string, examType?: string, year?: string): string {
    const params = new URLSearchParams({ subject });
    
    // ALOC API uses specific parameter names
    if (examType && examType !== 'utme') {
      params.append('type', examType);
    }
    if (year) {
      params.append('year', year);
    }
    
    return `${this.baseUrl}${endpoint}?${params.toString()}`;
  }

  /**
   * Fetch data from a specific ALOC endpoint
   */
  private async fetchFromEndpoint(url: string, subject: string): Promise<AlocQuestion[]> {
    await this.enforceRateLimit();
    
    console.log(`📡 Calling ALOC API: ${url}`);
    
    const response = await fetch(url, {
      method: 'GET',
      headers: {
        'AccessToken': this.accessToken,
        'Accept': 'application/json',
        'Content-Type': 'application/json'
      },
      signal: AbortSignal.timeout(15000) // 15 second timeout
    });

    if (response.status === 429) {
      console.log(`⏸️ Rate limited, waiting 5 seconds...`);
      await new Promise(resolve => setTimeout(resolve, 5000));
      throw new Error('Rate limited');
    }

    if (!response.ok) {
      const errorText = await response.text();
      console.error(`❌ ALOC API Error ${response.status}:`, errorText);
      throw new Error(`HTTP ${response.status}: ${response.statusText}`);
    }

    const data: AlocApiResponse = await response.json();
    
    if (data.error) {
      throw new Error(`ALOC API error: ${data.error}`);
    }

    return this.processApiResponse(data, subject);
  }

  /**
   * Process ALOC API response into our question format
   */
  private processApiResponse(data: AlocApiResponse, subject: string): AlocQuestion[] {
    if (!data.data) {
      return [];
    }

    const questions: AlocQuestion[] = [];
    const questionData = Array.isArray(data.data) ? data.data : [data.data];

    for (const qData of questionData) {
      if (this.isValidQuestion(qData)) {
        questions.push({
          ...qData,
          subject: subject,
          // Ensure answer is lowercase for consistency
          answer: qData.answer.toLowerCase(),
          // Provide default solution if missing
          solution: qData.solution || 'Detailed explanation for this question.'
        });
      }
    }

    return questions;
  }

  /**
   * Validate question data structure
   */
  private isValidQuestion(qData: any): boolean {
    return !!(
      qData &&
      qData.question &&
      qData.option &&
      qData.option.a &&
      qData.option.b &&
      qData.option.c &&
      qData.option.d &&
      qData.answer
    );
  }

  /**
   * Rate limiting to respect ALOC API limits
   */
  private async enforceRateLimit(): Promise<void> {
    const now = Date.now();
    const timeSinceLastRequest = now - this.lastRequestTime;
    
    if (timeSinceLastRequest < this.rateLimitDelay) {
      const delay = this.rateLimitDelay - timeSinceLastRequest;
      await new Promise(resolve => setTimeout(resolve, delay));
    }
    
    this.lastRequestTime = Date.now();
  }

  /**
   * Transform questions to match frontend format
   */
  transformForFrontend(questions: AlocQuestion[]): any[] {
    return questions.map(q => ({
      id: q.id,
      question: q.question,
      options: [
        { id: 'a', text: q.option.a },
        { id: 'b', text: q.option.b },
        { id: 'c', text: q.option.c },
        { id: 'd', text: q.option.d }
      ],
      correctAnswer: q.answer,
      explanation: q.solution,
      examType: q.examtype,
      examYear: q.examyear,
      subject: q.subject,
      image: q.image
    }));
  }

  /**
   * Get available subjects
   */
  getAvailableSubjects(): string[] {
    return Object.keys(this.subjectMapping);
  }

  /**
   * Check if access token is configured
   */
  isConfigured(): boolean {
    return !!this.accessToken;
  }
}

// Export singleton instance
export const alocQuestionService = new AlocQuestionService();