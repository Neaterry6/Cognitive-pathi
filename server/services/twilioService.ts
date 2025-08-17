// Twilio SMS Service
interface TwilioSMSRequest {
  to: string;
  message: string;
  from?: string;
}

interface TwilioSMSResponse {
  success: boolean;
  sid?: string;
  error?: string;
}

class TwilioService {
  private accountSid: string;
  private authToken: string;
  private phoneNumber: string;
  private baseUrl: string;

  constructor() {
    this.accountSid = process.env.TWILIO_ACCOUNT_SID || '';
    this.authToken = process.env.TWILIO_AUTH_TOKEN || '';
    this.phoneNumber = process.env.TWILIO_PHONE_NUMBER || '';
    this.baseUrl = `https://api.twilio.com/2010-04-01/Accounts/${this.accountSid}`;
    
    if (!this.accountSid || !this.authToken) {
      console.warn('⚠️ Twilio credentials not found - SMS functionality disabled');
    } else {
      console.log('✅ Twilio SMS service initialized');
    }
  }

  async sendSMS(data: TwilioSMSRequest): Promise<TwilioSMSResponse> {
    if (!this.accountSid || !this.authToken) {
      return {
        success: false,
        error: 'Twilio credentials not configured'
      };
    }

    try {
      const response = await fetch(`${this.baseUrl}/Messages.json`, {
        method: 'POST',
        headers: {
          'Authorization': `Basic ${Buffer.from(`${this.accountSid}:${this.authToken}`).toString('base64')}`,
          'Content-Type': 'application/x-www-form-urlencoded',
        },
        body: new URLSearchParams({
          From: data.from || this.phoneNumber,
          To: data.to,
          Body: data.message
        })
      });

      const result = await response.json();

      if (!response.ok) {
        console.error('Twilio SMS error:', result);
        return {
          success: false,
          error: result.message || 'Failed to send SMS'
        };
      }

      console.log('✅ SMS sent successfully:', result.sid);
      return {
        success: true,
        sid: result.sid
      };
    } catch (error) {
      console.error('Twilio SMS service error:', error);
      return {
        success: false,
        error: 'SMS service temporarily unavailable'
      };
    }
  }

  // Send premium activation notification
  async sendActivationNotification(phoneNumber: string, unlockCode: string): Promise<TwilioSMSResponse> {
    const message = `🎉 UTME AI Premium Activated! Your unlock code: ${unlockCode} has been successfully verified. You now have full access to CBT exams, AI chatbot, and all premium features. Good luck with your studies! - UTME AI by broken vzn`;
    
    return this.sendSMS({
      to: phoneNumber,
      message
    });
  }

  // Send CBT exam reminder
  async sendExamReminder(phoneNumber: string, timeRemaining: string): Promise<TwilioSMSResponse> {
    const message = `⏰ CBT Exam Reminder: You have ${timeRemaining} remaining in your exam session. Stay focused and do your best! - UTME AI`;
    
    return this.sendSMS({
      to: phoneNumber,
      message
    });
  }

  // Send welcome message for new users
  async sendWelcomeMessage(phoneNumber: string, firstName: string): Promise<TwilioSMSResponse> {
    const message = `Welcome to UTME AI, ${firstName}! 🎓 Your intelligent study companion is ready to help you excel in JAMB, WAEC, NECO & POST-UTME. Start practicing now! - broken vzn`;
    
    return this.sendSMS({
      to: phoneNumber,
      message
    });
  }
}

export const twilioService = new TwilioService();
export type { TwilioSMSRequest, TwilioSMSResponse };