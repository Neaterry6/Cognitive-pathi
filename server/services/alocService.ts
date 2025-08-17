export interface AlocQuestion {
  id: string;
  question: string;
  option: {
    a: string;
    b: string;
    c: string;
    d: string;
  };
  answer: string;
  solution?: string;
  examtype: string;
  examyear: string;
}

export interface AlocResponse {
  subject: string;
  data: AlocQuestion[];
  status?: number;
  error?: string;
}

export class AlocService {
  private readonly baseUrl = 'https://questions.aloc.com.ng/api/v2';
  private readonly accessToken = process.env.ALOC_ACCESS_TOKEN || '';

  // Subject mapping for ALOC API
  private subjectMapping: Record<string, string> = {
    'English': 'english',
    'Mathematics': 'mathematics', 
    'Biology': 'biology',
    'Physics': 'physics',
    'Chemistry': 'chemistry',
    'Economics': 'economics',
    'Government': 'government',
    'Literature': 'englishlit',
    'Geography': 'geography',
    'Accounting': 'accounting',
    'Commerce': 'commerce'
  };

  async fetchQuestions(
    subject: string, 
    examType: string = 'utme', 
    year?: string,
    limit: number = 40
  ): Promise<AlocQuestion[]> {
    try {
      console.log(`🔍 Fetching ${limit} questions for ${subject} (${examType}, ${year || 'any year'})`);
      
      const mappedSubject = this.subjectMapping[subject] || subject.toLowerCase();
      let url = `${this.baseUrl}/q?subject=${mappedSubject}`;
      
      if (examType) {
        url += `&type=${examType}`;
      }
      if (year) {
        url += `&year=${year}`;
      }

      console.log(`📡 ALOC API URL: ${url}`);

      const response = await fetch(url, {
        method: 'GET',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${this.accessToken}`
        }
      });

      if (!response.ok) {
        throw new Error(`ALOC API error: ${response.status} ${response.statusText}`);
      }

      const data: AlocResponse = await response.json();
      
      if (data.error) {
        throw new Error(`ALOC API error: ${data.error}`);
      }

      if (!data.data || !Array.isArray(data.data)) {
        console.warn(`⚠️ No questions found for ${subject}`);
        return [];
      }

      // Shuffle and limit questions
      const shuffledQuestions = data.data
        .sort(() => Math.random() - 0.5)
        .slice(0, limit);

      console.log(`✅ Successfully fetched ${shuffledQuestions.length} questions for ${subject}`);
      return shuffledQuestions;

    } catch (error) {
      console.error(`❌ Error fetching questions for ${subject}:`, error);
      return [];
    }
  }

  async fetchQuestionsByIds(questionIds: string[]): Promise<AlocQuestion[]> {
    try {
      const questions: AlocQuestion[] = [];
      
      for (const id of questionIds) {
        try {
          const url = `${this.baseUrl}/q/${id}`;
          const response = await fetch(url, {
            method: 'GET',
            headers: {
              'Content-Type': 'application/json',
              'Authorization': `Bearer ${this.accessToken}`
            }
          });

          if (response.ok) {
            const question = await response.json();
            questions.push(question);
          }
        } catch (error) {
          console.error(`Error fetching question ${id}:`, error);
        }
      }

      return questions;
    } catch (error) {
      console.error('Error fetching questions by IDs:', error);
      return [];
    }
  }

  // Transform ALOC question to our internal format
  transformQuestion(alocQuestion: AlocQuestion, index: number): any {
    return {
      id: alocQuestion.id || `q_${index}`,
      question: alocQuestion.question,
      options: [
        { id: 'a', text: alocQuestion.option.a },
        { id: 'b', text: alocQuestion.option.b },
        { id: 'c', text: alocQuestion.option.c },
        { id: 'd', text: alocQuestion.option.d }
      ],
      correctAnswer: alocQuestion.answer.toLowerCase(),
      explanation: alocQuestion.solution || null,
      examType: alocQuestion.examtype || 'utme',
      examYear: alocQuestion.examyear || 'unknown'
    };
  }

  // Fetch questions for CBT exam (40 per subject)
  async fetchCBTQuestions(subjects: Array<{id: string, name: string}>): Promise<any[]> {
    try {
      console.log('🎯 Starting CBT question fetch for subjects:', subjects.map(s => s.name));
      
      const allQuestions: any[] = [];
      
      for (const subject of subjects) {
        console.log(`📚 Fetching questions for ${subject.name}...`);
        
        // Try different years to get variety
        const years = ['2018', '2019', '2017', '2020', '2016'];
        let questions: AlocQuestion[] = [];
        
        for (const year of years) {
          const yearQuestions = await this.fetchQuestions(subject.name, 'utme', year, 40);
          if (yearQuestions.length > 0) {
            questions = yearQuestions;
            break;
          }
        }
        
        // If no questions found with years, try without year filter
        if (questions.length === 0) {
          questions = await this.fetchQuestions(subject.name, 'utme', undefined, 40);
        }

        // Transform and add to collection
        const transformedQuestions = questions.map((q, index) => ({
          ...this.transformQuestion(q, index),
          subjectId: subject.id,
          subjectName: subject.name
        }));

        allQuestions.push(...transformedQuestions);
        
        console.log(`✅ Added ${transformedQuestions.length} questions for ${subject.name}`);
      }
      
      console.log(`🎉 Total CBT questions fetched: ${allQuestions.length}`);
      return allQuestions;
      
    } catch (error) {
      console.error('❌ Error fetching CBT questions:', error);
      return [];
    }
  }
}

// Export singleton instance
export const alocService = new AlocService();