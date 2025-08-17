// Kaiz AI Service for conversational + image recognition
export class KaizService {
  private readonly baseUrl = 'https://kaiz-apis.gleeze.com/api/kaiz-ai';
  private readonly apiKey = 'a0ebe80e-bf1a-4dbf-8d36-6935b1bfa5ea';

  async chat(message: string, userId: string): Promise<string> {
    try {
      const url = `${this.baseUrl}?ask=${encodeURIComponent(message)}&uid=${userId}&apikey=${this.apiKey}`;
      
      const response = await fetch(url, {
        method: 'GET',
        headers: {
          'Content-Type': 'application/json',
        }
      });

      if (!response.ok) {
        throw new Error(`Kaiz API error: ${response.status}`);
      }

      const data = await response.text();
      return data || 'I apologize, but I couldn\'t process your request right now. Please try again.';
      
    } catch (error) {
      console.error('Kaiz API error:', error);
      throw new Error('Failed to get response from Kaiz AI');
    }
  }
}

export const kaizService = new KaizService();