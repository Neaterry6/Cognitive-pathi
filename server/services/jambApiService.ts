// Use global fetch instead of node-fetch for better compatibility

interface JambQuestion {
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
  explanation?: string;
  examtype: string;
  examyear: string;
  subject: string;
}

interface AlocApiResponse {
  data: JambQuestion[];
  meta?: {
    total: number;
    page: number;
    per_page: number;
  };
}

class JambApiService {
  private readonly baseUrl = 'https://questions.aloc.com.ng/api/v2';
  private readonly accessToken = process.env.ALOC_ACCESS_TOKEN || '';
  private readonly maxRetries = 2;
  private readonly retryDelay = 500; // 0.5 seconds

  // Subject mapping from our system to ALOC API format (exact API subject names)
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
    'history': 'history'
  };

  /**
   * Fetch multiple unique questions from ALOC API with enhanced retry logic and proper batching
   */
  async fetchQuestions(
    subject: string, 
    options: {
      limit?: number;
      year?: string | number;
      type?: 'utme' | 'wassce' | 'neco' | 'post-utme';
      accessToken?: string;
    } = {}
  ): Promise<JambQuestion[]> {
    const { limit = 40, year, type = 'utme', accessToken = this.accessToken } = options;
    
    // Use the exact subject name from our database
    const apiSubject = this.subjectMapping[subject.toLowerCase()] || subject.toLowerCase();
    
    console.log(`🔍 Starting ALOC API fetch for ${limit} ${apiSubject} questions (${type}, year: ${year || 'any'})`);
    
    const headers: Record<string, string> = {
      'Content-Type': 'application/json',
      'Accept': 'application/json',
      'Authorization': `Bearer ${accessToken}`
    };

    // Build the URL with parameters  
    const params = new URLSearchParams();
    params.append('subject', apiSubject);
    
    if (type) {
      params.append('type', type);
    }
    
    if (year) {
      params.append('year', year.toString());
    }

    const questions: JambQuestion[] = [];
    const fetchedIds = new Set<string>();
    
    // Enhanced randomization system with tracking to prevent repetition
    const usedQuestionIds = new Set(fetchedIds);
    const totalQuestionRange = 1000; // Increased range for more variety
    const availableIds = Array.from({length: totalQuestionRange}, (_, i) => i + 1)
      .filter(id => !usedQuestionIds.has(id.toString())); // Exclude already used IDs
    
    // Shuffle available IDs using Fisher-Yates algorithm for better randomization
    for (let i = availableIds.length - 1; i > 0; i--) {
      const j = Math.floor(Math.random() * (i + 1));
      [availableIds[i], availableIds[j]] = [availableIds[j], availableIds[i]];
    }
    
    const questionIds = availableIds.slice(0, limit + 30); // Get extra IDs in case some fail
    console.log(`🔀 Selected ${questionIds.length} unique question IDs for ${subject} (avoiding ${usedQuestionIds.size} already used)`);
    const batchSize = 2; // Much smaller batches to avoid rate limits
    const delayBetweenRequests = 2000; // 2 seconds between requests
    
    console.log(`🔍 Attempting to fetch ${limit} questions for ${subject} from ALOC API...`);
    
    try {
      // Sequential fetching with proper delays to avoid rate limits
      for (let i = 0; i < questionIds.length && questions.length < limit; i++) {
        const questionId = questionIds[i];
        const questionUrl = `${this.baseUrl}/q/${questionId}?${params.toString()}`;
        
        try {
          console.log(`📡 Fetching question ${questionId} for ${subject} (${questions.length + 1}/${limit})`);
          
          const question = await this.fetchSingleQuestion(questionUrl, headers, fetchedIds);
          if (question) {
            questions.push(question);
            console.log(`✅ Successfully fetched question ${questionId}`);
          }
          
          // Add delay between requests to avoid rate limiting
          if (i < questionIds.length - 1) {
            console.log(`⏱️ Waiting ${delayBetweenRequests}ms before next request...`);
            await new Promise(resolve => setTimeout(resolve, delayBetweenRequests));
          }
          
        } catch (questionError) {
          console.error(`❌ Failed to fetch question ${questionId}:`, questionError);
          // Continue to next question instead of breaking
        }
        
        // If we have enough questions, break early
        if (questions.length >= limit) {
          console.log(`🎯 Target reached: Got ${questions.length} questions for ${subject}`);
          break;
        }
      }
    } catch (error) {
      console.error(`ALOC API batch fetch error for ${subject}:`, error);
    }

    // Only use fallback questions if we got absolutely no questions from API
    if (questions.length === 0) {
      console.log(`⚠️ No questions fetched from ALOC API for ${subject}, using minimal fallbacks`);
      const fallbackCount = Math.min(5, limit); // Much fewer fallback questions
      const fallbackQuestions = this.getFallbackQuestions(subject, fallbackCount);
      questions.push(...fallbackQuestions);
      console.log(`📝 Added ${fallbackCount} fallback questions for ${subject}`);
    } else if (questions.length < limit) {
      console.log(`⚠️ Only got ${questions.length}/${limit} questions from ALOC API for ${subject}. Continuing with what we have.`);
    }

    console.log(`✅ Successfully fetched ${questions.length} questions for ${subject} (${questions.length - (this.getFallbackQuestions(subject, limit).length || 0)} from API + fallbacks)`);
    return questions.slice(0, limit); // Ensure we don't exceed the limit
  }

  /**
   * Fetch a single question with retry logic
   */
  private async fetchSingleQuestion(
    url: string, 
    headers: Record<string, string>, 
    fetchedIds: Set<string>
  ): Promise<JambQuestion | null> {
    for (let attempt = 1; attempt <= this.maxRetries; attempt++) {
      try {
        const controller = new AbortController();
        const timeoutId = setTimeout(() => controller.abort(), 15000); // Longer timeout for stability
        
        // Add proper rate limiting delay
        await new Promise(resolve => setTimeout(resolve, 2000)); // 2 second delay before each request
        
        console.log(`🌐 Fetching from ALOC API: ${url}`);
        
        const response = await fetch(url, {
          method: 'GET',
          headers: {
            ...headers,
            'User-Agent': 'Educational-Platform/1.0',
            'Accept': 'application/json'
          },
          signal: controller.signal
        });
        
        clearTimeout(timeoutId);

        console.log(`📊 ALOC API Response: ${response.status} ${response.statusText}`);

        if (response.status === 429) {
          console.log(`⏸️ Rate limited by ALOC API, waiting 10 seconds...`);
          await new Promise(resolve => setTimeout(resolve, 10000));
          continue; // Retry this attempt
        }

        if (!response.ok) {
          throw new Error(`ALOC API error: ${response.status} ${response.statusText}`);
        }

        const data = await response.json() as any;
        
        // Handle ALOC API response format
        console.log(`📋 ALOC API Response structure:`, {
          hasData: !!data,
          status: data?.status,
          dataType: typeof data?.data,
          dataIsArray: Array.isArray(data?.data),
          dataLength: data?.data?.length
        });

        if (data && data.data) {
          // Handle both single question and array responses
          const questionData = Array.isArray(data.data) ? data.data[0] : data.data;
          
          if (questionData && questionData.question && questionData.option && questionData.answer) {
            const questionId = questionData.id?.toString() || `q_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
            
            // Only add unique questions
            if (!fetchedIds.has(questionId)) {
              fetchedIds.add(questionId);
              console.log(`✅ Successfully fetched unique question: ${questionId}`);
              
              // Transform the data to match our interface
              return {
                id: questionId,
                question: questionData.question,
                option: questionData.option,
                answer: questionData.answer,
                image: questionData.image || '',
                explanation: questionData.solution || questionData.explanation || '',
                examtype: questionData.examtype || 'utme',
                examyear: questionData.examyear || '',
                subject: questionData.subject || 'unknown'
              };
            } else {
              console.log(`⚠️ Duplicate question detected: ${questionId}, skipping`);
            }
          } else {
            console.log(`❌ Invalid question structure received from ALOC API`);
          }
        }
        
        // If we reach here, no valid unique question was found
        return null;

      } catch (error) {
        console.error(`ALOC API attempt ${attempt} failed:`, error);
        
        if (attempt === this.maxRetries) {
          return null;
        }
        
        // Quick retry for faster loading
        await new Promise(resolve => setTimeout(resolve, this.retryDelay));
      }
    }
    
    return null;
  }



  /**
   * Convert JAMB API question to our internal format
   */
  formatQuestion(jambQuestion: JambQuestion, index: number): any {
    const options = [
      { id: 'A', text: jambQuestion.option.a },
      { id: 'B', text: jambQuestion.option.b },
      { id: 'C', text: jambQuestion.option.c },
      { id: 'D', text: jambQuestion.option.d }
    ];

    return {
      id: jambQuestion.id || `jamb_${index}`,
      question: jambQuestion.question,
      options,
      correctAnswer: jambQuestion.answer.toUpperCase(),
      subject: jambQuestion.subject || 'General',
      difficulty: 'medium',
      explanation: jambQuestion.explanation || `The correct answer is ${jambQuestion.answer.toUpperCase()}. This is from ${jambQuestion.examtype} ${jambQuestion.examyear}.`,
      imageUrl: jambQuestion.image || null,
      year: parseInt(jambQuestion.examyear) || new Date().getFullYear(),
      examType: jambQuestion.examtype || 'UTME',
      source: 'JAMB Past Questions',
      tags: [jambQuestion.subject, jambQuestion.examtype, jambQuestion.examyear].filter(Boolean)
    };
  }

  /**
   * Get available subjects from the API
   */
  getAvailableSubjects(): string[] {
    return Object.keys(this.subjectMapping);
  }

  /**
   * Validate if a subject is supported
   */
  isSubjectSupported(subject: string): boolean {
    return subject.toLowerCase() in this.subjectMapping;
  }

  /**
   * Get available years for ALOC API (based on documentation)
   */
  getAvailableYears(): number[] {
    const years: number[] = [];
    for (let year = 2001; year <= 2020; year++) {
      years.push(year);
    }
    return years.reverse(); // Most recent first
  }

  /**
   * Get available exam types
   */
  getAvailableExamTypes(): string[] {
    return ['utme', 'wassce', 'neco', 'post-utme'];
  }

  /**
   * Fallback questions when API fails
   */
  getFallbackQuestions(subject: string, limit: number): JambQuestion[] {
    console.log(`Generating fallback questions for ${subject}`);
    
    const fallbackQuestions: JambQuestion[] = [];
    
    // Enhanced fallback questions based on subject
    const subjectTemplates: Record<string, any[]> = {
      mathematics: [
        {
          question: "If 2x + 3 = 11, what is the value of x?",
          options: { a: "3", b: "4", c: "5", d: "6" },
          answer: "B",
          explanation: "2x + 3 = 11, so 2x = 8, therefore x = 4"
        },
        {
          question: "What is 15% of 200?",
          options: { a: "25", b: "30", c: "35", d: "40" },
          answer: "B",
          explanation: "15% of 200 = (15/100) × 200 = 30"
        },
        {
          question: "The area of a rectangle with length 8cm and width 5cm is:",
          options: { a: "13 cm²", b: "26 cm²", c: "40 cm²", d: "45 cm²" },
          answer: "C",
          explanation: "Area = length × width = 8 × 5 = 40 cm²"
        }
      ],
      english: [
        {
          question: "Choose the word that best completes the sentence: 'The teacher asked the students to ___ their homework.'",
          options: { a: "submit", b: "submits", c: "submitted", d: "submitting" },
          answer: "A",
          explanation: "The infinitive 'to submit' is the correct form after 'asked...to'"
        },
        {
          question: "What is the plural form of 'child'?",
          options: { a: "childs", b: "children", c: "childes", d: "child's" },
          answer: "B",
          explanation: "'Children' is the irregular plural form of 'child'"
        }
      ],
      physics: [
        {
          question: "The SI unit of force is:",
          options: { a: "Joule", b: "Watt", c: "Newton", d: "Pascal" },
          answer: "C",
          explanation: "Newton (N) is the SI unit of force, named after Sir Isaac Newton"
        },
        {
          question: "What is the acceleration due to gravity on Earth?",
          options: { a: "9.8 m/s²", b: "10.8 m/s²", c: "8.9 m/s²", d: "11.2 m/s²" },
          answer: "A",
          explanation: "The standard acceleration due to gravity is approximately 9.8 m/s²"
        }
      ],
      chemistry: [
        {
          question: "What is the chemical symbol for gold?",
          options: { a: "Go", b: "Au", c: "Ag", d: "Al" },
          answer: "B",
          explanation: "Au is the chemical symbol for gold, from the Latin word 'aurum'"
        },
        {
          question: "The pH of pure water at 25°C is:",
          options: { a: "6", b: "7", c: "8", d: "9" },
          answer: "B",
          explanation: "Pure water has a neutral pH of 7 at 25°C"
        }
      ],
      biology: [
        {
          question: "The powerhouse of the cell is the:",
          options: { a: "Nucleus", b: "Ribosome", c: "Mitochondria", d: "Chloroplast" },
          answer: "C",
          explanation: "Mitochondria are called the powerhouse of the cell because they produce ATP energy"
        },
        {
          question: "Photosynthesis occurs in:",
          options: { a: "Mitochondria", b: "Chloroplasts", c: "Nucleus", d: "Cytoplasm" },
          answer: "B",
          explanation: "Photosynthesis occurs in chloroplasts, which contain chlorophyll"
        }
      ]
    };
    
    const templates = subjectTemplates[subject.toLowerCase()] || [
      {
        question: `Which of the following is a key concept in ${subject}?`,
        options: { a: "Concept A", b: "Concept B", c: "Concept C", d: "Concept D" },
        answer: "A",
        explanation: `This is a sample question for ${subject}. For actual questions, ensure good internet connection.`
      }
    ];
    
    for (let i = 0; i < Math.min(limit, 20); i++) {
      const template = templates[i % templates.length];
      fallbackQuestions.push({
        id: `fallback_${subject}_${i}`,
        question: template.question,
        option: template.options,
        answer: template.answer,
        explanation: template.explanation,
        examtype: 'UTME',
        examyear: '2024',
        subject: subject
      });
    }
    
    return fallbackQuestions;
  }
}

export const jambApiService = new JambApiService();

// Export individual functions for direct use
export const getFallbackQuestions = (subject: string, limit: number) => {
  return jambApiService.getFallbackQuestions(subject, limit);
};