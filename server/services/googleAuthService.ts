// Google Authentication Service
import { OAuth2Client } from 'google-auth-library';

interface GoogleUser {
  id: string;
  email: string;
  name: string;
  picture: string;
  given_name: string;
  family_name: string;
}

interface GoogleAuthResponse {
  success: boolean;
  user?: GoogleUser;
  error?: string;
}

class GoogleAuthService {
  private client: OAuth2Client | null = null;
  private clientId: string;
  private clientSecret: string;

  constructor() {
    this.clientId = process.env.GOOGLE_CLIENT_ID || '';
    this.clientSecret = process.env.GOOGLE_CLIENT_SECRET || '';
    
    if (!this.clientId || !this.clientSecret) {
      console.warn('⚠️ Google OAuth credentials not found - Google Auth disabled');
    } else {
      this.client = new OAuth2Client(this.clientId, this.clientSecret);
      console.log('✅ Google Auth service initialized');
    }
  }

  async verifyIdToken(idToken: string): Promise<GoogleAuthResponse> {
    if (!this.client) {
      return {
        success: false,
        error: 'Google Auth not configured'
      };
    }

    try {
      const ticket = await this.client.verifyIdToken({
        idToken,
        audience: this.clientId,
      });

      const payload = ticket.getPayload();
      if (!payload) {
        return {
          success: false,
          error: 'Invalid token payload'
        };
      }

      const user: GoogleUser = {
        id: payload.sub,
        email: payload.email || '',
        name: payload.name || '',
        picture: payload.picture || '',
        given_name: payload.given_name || '',
        family_name: payload.family_name || ''
      };

      return {
        success: true,
        user
      };
    } catch (error) {
      console.error('Google Auth verification error:', error);
      return {
        success: false,
        error: 'Token verification failed'
      };
    }
  }

  async getAuthUrl(redirectUri: string): Promise<string> {
    if (!this.client) {
      throw new Error('Google Auth not configured');
    }

    const scopes = [
      'https://www.googleapis.com/auth/userinfo.email',
      'https://www.googleapis.com/auth/userinfo.profile'
    ];

    return this.client.generateAuthUrl({
      access_type: 'offline',
      scope: scopes,
      redirect_uri: redirectUri
    });
  }

  async getTokens(code: string, redirectUri: string) {
    if (!this.client) {
      throw new Error('Google Auth not configured');
    }

    const { tokens } = await this.client.getToken({
      code,
      redirect_uri: redirectUri
    });

    return tokens;
  }
}

export const googleAuthService = new GoogleAuthService();
export type { GoogleUser, GoogleAuthResponse };