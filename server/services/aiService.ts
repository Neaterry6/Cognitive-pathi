import { GoogleGenAI } from "@google/genai";
import OpenAI from "openai";

// Initialize AI clients
const gemini = new GoogleGenAI({ apiKey: process.env.GEMINI_API_KEY || "" });
const openai = new OpenAI({ apiKey: process.env.OPENAI_API_KEY || "" });
const grok = new OpenAI({ 
  baseURL: "https://api.x.ai/v1", 
  apiKey: process.env.XAI_API_KEY || "" 
});

export class AIService {
  async generateChatResponse(message: string, aiModel: string = 'groq'): Promise<string> {
    const systemPrompt = `You are UTME AI, created by broken vzn - a friendly, conversational AI tutor for Nigerian students!

YOUR PERSONALITY:
- Chat naturally like a helpful friend who's really good at academics
- Be encouraging, supportive, and motivational
- Use casual, friendly language while staying educational
- Mix in some Nigerian expressions and context when appropriate
- Be excited about helping students succeed!
- Keep responses conversational, not too formal or robotic

YOUR ROLE:
- Help with JAMB, WAEC, NECO, and POST-UTME prep
- Explain concepts in simple, easy-to-understand ways
- Give study tips and exam strategies
- Generate practice questions when needed
- Be their study companion and motivator

HOW TO RESPOND:
- Keep responses natural and conversational (like chatting with a smart friend)
- Use emojis occasionally to be more engaging
- Ask follow-up questions to keep the conversation going
- Give practical, actionable advice
- Celebrate their progress and encourage them when they're struggling
- Be concise but helpful (don't write essays unless they ask for detailed explanations)

RESPONSE LENGTH:
- For casual questions: 1-3 sentences 
- For explanations: 2-4 paragraphs max
- For practice questions: Brief setup + question + encouraging note

Student says: ${message}

Respond naturally and helpfully! 🚀`;

    try {
      switch (aiModel) {
        case 'groq':
        case 'grok':
          return await this.generateWithGroq(systemPrompt, message);
        case 'gemini':
          return await this.generateWithGemini(`${systemPrompt}\n\nStudent: ${message}`);
        case 'gpt4':
          return await this.generateWithOpenAI(`${systemPrompt}\n\nStudent: ${message}`);
        default:
          return await this.generateWithGroq(systemPrompt, message);
      }
    } catch (error) {
      console.error(`Error generating chat response with ${aiModel}:`, error);
      throw new Error('Failed to generate AI response');
    }
  }

  async generateStudyPlan(subject: string, topic: string, aiModel: string = 'gemini'): Promise<string> {
    const prompt = `Create a comprehensive study plan for ${topic} in ${subject}. 

    Include:
    1. Overview of the topic
    2. Key concepts to understand
    3. Learning objectives
    4. Study strategies and tips
    5. Practice exercises suggestions
    6. Common exam questions patterns
    7. Real-world applications

    Format the response in markdown for easy reading. Make it engaging and educational for POST UTME students.`;

    try {
      switch (aiModel) {
        case 'gemini':
          return await this.generateWithGemini(prompt);
        case 'gpt4':
          return await this.generateWithOpenAI(prompt);
        case 'grok':
          return await this.generateWithGrok(prompt);
        default:
          return await this.generateWithGemini(prompt);
      }
    } catch (error) {
      console.error(`Error generating study plan with ${aiModel}:`, error);
      // Fallback to a basic study plan
      return this.getFallbackStudyPlan(subject, topic);
    }
  }

  async generateExplanation(
    question: string,
    correctAnswer: string,
    userAnswer: string,
    aiModel: string = 'groq'
  ): Promise<string> {
    const prompt = `You are UTME AI, created by broken vzn, an expert Nigerian education assistant. Provide a comprehensive, detailed explanation for this examination question.

    Question: ${question}
    Student's answer: ${userAnswer}
    Correct answer: ${correctAnswer}

    Provide a COMPREHENSIVE explanation (250-400 words) that includes:

    1. **DETAILED ANALYSIS**: Thoroughly explain why "${correctAnswer}" is correct with specific reasoning and context
    
    2. **MISTAKE ANALYSIS** (if applicable): If the student chose "${userAnswer}" instead of "${correctAnswer}", explain specifically why this was incorrect and what misconception led to this choice
    
    3. **CONCEPTUAL FOUNDATION**: Explain the underlying academic concepts, principles, or theories that this question tests
    
    4. **REAL-WORLD APPLICATION**: Connect the concept to practical examples or real-world scenarios relevant to Nigerian students
    
    5. **EXAM STRATEGY**: Provide specific tips for identifying and solving similar questions in JAMB/POST-UTME exams
    
    6. **STUDY RECOMMENDATIONS**: Suggest specific topics, textbook chapters, or resources for further study
    
    7. **MEMORY AIDS**: Provide mnemonic devices, formulas, or key points to remember

    Make this explanation thorough, educational, and specifically tailored for Nigerian students preparing for university entrance examinations. Use clear, accessible language while maintaining academic depth.`;

    try {
      switch (aiModel) {
        case 'groq':
          return await this.generateWithGroq(`You are UTME AI, created by broken vzn. Provide comprehensive explanations for educational questions.`, `${prompt}`);
        case 'gemini':
          return await this.generateWithGemini(prompt);
        case 'gpt4':
          return await this.generateWithOpenAI(prompt);
        case 'grok':
          return await this.generateWithGrok(prompt);
        default:
          return await this.generateWithGroq(`You are UTME AI, created by broken vzn. Provide comprehensive explanations for educational questions.`, `${prompt}`);
      }
    } catch (error) {
      console.error(`Error generating explanation with ${aiModel}:`, error);
      throw new Error('Failed to generate AI explanation');
    }
  }

  private async generateWithGemini(prompt: string): Promise<string> {
    if (!process.env.GEMINI_API_KEY) {
      throw new Error('Gemini API key not configured');
    }

    const response = await gemini.models.generateContent({
      model: "gemini-2.5-flash",
      contents: prompt,
    });

    const text = response.text;
    if (!text || text.trim().length === 0) {
      throw new Error('Empty response from Gemini API');
    }

    return text;
  }

  private async generateWithOpenAI(prompt: string): Promise<string> {
    if (!process.env.OPENAI_API_KEY) {
      throw new Error('OpenAI API key not configured');
    }

    const response = await openai.chat.completions.create({
      model: "gpt-4o", // the newest OpenAI model is "gpt-4o" which was released May 13, 2024. do not change this unless explicitly requested by the user
      messages: [
        {
          role: "system",
          content: "You are UTME AI, created by broken vzn for educational purposes. You are an expert Nigerian education assistant specializing in JAMB, WAEC, NECO, and POST-UTME preparation. Provide comprehensive, detailed educational content that truly helps Nigerian students learn and excel."
        },
        {
          role: "user", 
          content: prompt
        }
      ],
      max_tokens: 2000,
      temperature: 0.7,
    });

    const content = response.choices[0].message.content;
    if (!content || content.trim().length === 0) {
      throw new Error('Empty response from OpenAI API');
    }

    return content;
  }

  private async generateWithGroq(systemPrompt: string, userMessage: string): Promise<string> {
    try {
      // Use Kaizenji's Groq API service for better educational responses
      const fullPrompt = `${systemPrompt}\n\nStudent: ${userMessage}`;
      
      const response = await fetch(`https://kaiz-apis.gleeze.com/api/groq-completions?ask=${encodeURIComponent(fullPrompt)}&uid=1268&model=llama-3.3-70b-versatile&apikey=a0ebe80e-bf1a-4dbf-8d36-6935b1bfa5ea`);

      if (!response.ok) {
        throw new Error(`Kaizenji Groq API error: ${response.status} ${response.statusText}`);
      }

      const data = await response.json();
      
      if (data.error) {
        throw new Error(`Kaizenji API error: ${data.error}`);
      }
      
      if (data.response) {
        return data.response
          .replace(/(\b\w+\b)(\s+\1\b)+/gi, '$1') // Fix repeating words
          .replace(/\s+/g, ' ')
          .trim();
      }
      
      throw new Error('No response from Kaizenji Groq API');
    } catch (error) {
      console.error('Kaizenji Groq API error:', error);
      // Fallback to Grok if Groq fails
      return await this.generateWithGrok(`${systemPrompt}\n\nStudent: ${userMessage}`);
    }
  }

  private async generateWithGrok(prompt: string): Promise<string> {
    const response = await grok.chat.completions.create({
      model: "grok-2-1212",
      messages: [{ role: "user", content: prompt }],
      max_tokens: 2000,
    });

    return response.choices[0].message.content || "Unable to generate content at this time.";
  }

  private getFallbackStudyPlan(subject: string, topic: string): string {
    return `# Study Plan: ${topic} (${subject})

## Overview
This topic is an important part of ${subject} that requires focused study and practice.

## Key Concepts
- Understand the fundamental principles
- Practice with examples
- Review past questions
- Connect to real-world applications

## Study Strategies
1. Read your textbook chapter thoroughly
2. Take notes on key points
3. Practice with sample questions
4. Form study groups for discussion
5. Use online resources for additional examples

## Practice Tips
- Start with basic concepts before moving to complex problems
- Time yourself when practicing questions
- Review mistakes and understand why they occurred
- Seek help when needed

## Exam Preparation
- Review all notes regularly
- Practice past exam questions
- Focus on frequently tested areas
- Manage your time effectively during exams

Remember: Consistent practice and understanding of concepts is key to success!`;
  }
}

export const aiService = new AIService();
