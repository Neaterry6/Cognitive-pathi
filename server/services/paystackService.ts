import crypto from 'crypto';

export interface PaystackInitiateResponse {
  status: boolean;
  message: string;
  data: {
    authorization_url: string;
    access_code: string;
    reference: string;
  };
}

export interface PaystackVerifyResponse {
  status: boolean;
  message: string;
  data: {
    id: number;
    domain: string;
    status: 'success' | 'failed' | 'abandoned';
    reference: string;
    amount: number;
    message: string | null;
    gateway_response: string;
    paid_at: string;
    created_at: string;
    channel: string;
    currency: string;
    ip_address: string;
    metadata: any;
    log: any;
    fees: number;
    fees_split: any;
    authorization: {
      authorization_code: string;
      bin: string;
      last4: string;
      exp_month: string;
      exp_year: string;
      channel: string;
      card_type: string;
      bank: string;
      country_code: string;
      brand: string;
      reusable: boolean;
      signature: string;
    };
    customer: {
      id: number;
      first_name: string;
      last_name: string;
      email: string;
      customer_code: string;
      phone: string;
      metadata: any;
      risk_action: string;
    };
    plan: any;
    subaccount: any;
    split: any;
    order_id: any;
    paidAt: string;
    createdAt: string;
    requested_amount: number;
    pos_transaction_data: any;
    source: any;
    fees_breakdown: any;
  };
}

export class PaystackService {
  private readonly baseUrl = 'https://api.paystack.co';
  private readonly secretKey = process.env.PAYSTACK_SECRET_KEY;

  constructor() {
    if (!this.secretKey || this.secretKey === 'sk_test_dev_mode') {
      console.warn('⚠️ PAYSTACK_SECRET_KEY not found, using development mode');
    } else {
      console.log('✅ Paystack service initialized with API key');
    }
  }

  /**
   * Initialize a payment transaction
   */
  async initializePayment(data: {
    email: string;
    amount: number; // in kobo (multiply by 100 from naira)
    reference?: string;
    callback_url?: string;
    metadata?: any;
  }): Promise<PaystackInitiateResponse> {
    const url = `${this.baseUrl}/transaction/initialize`;
    
    // Generate reference if not provided
    if (!data.reference) {
      data.reference = `CBT_${Date.now()}_${Math.random().toString(36).substring(7)}`;
    }

    const headers = {
      'Authorization': `Bearer ${this.secretKey}`,
      'Content-Type': 'application/json',
    };

    try {
      // Development mode fallback if no proper API key
      if (!this.secretKey || this.secretKey === 'sk_test_dev_mode') {
        console.log('🔧 Development mode: Simulating Paystack payment');
        return {
          status: true,
          message: 'Payment initialized (development mode)',
          data: {
            authorization_url: `${process.env.NODE_ENV === 'development' ? 'http://localhost:5000' : `${process.env.REPLIT_DEV_DOMAIN ? `https://${process.env.REPLIT_DEV_DOMAIN}` : 'https://your-app.replit.app'}`}?reference=${data.reference}&status=success`,
            access_code: 'dev_access_code',
            reference: data.reference || `CBT_${Date.now()}_dev`
          }
        };
      }

      const response = await fetch(url, {
        method: 'POST',
        headers,
        body: JSON.stringify(data),
      });

      const result = await response.json();
      
      if (!response.ok) {
        console.error('Paystack API error:', result);
        throw new Error(result.message || 'Payment initialization failed');
      }

      return result;
    } catch (error) {
      console.error('Paystack initialization error:', error);
      throw error;
    }
  }

  /**
   * Verify a payment transaction
   */
  async verifyPayment(reference: string): Promise<PaystackVerifyResponse> {
    const url = `${this.baseUrl}/transaction/verify/${reference}`;
    
    const headers = {
      'Authorization': `Bearer ${this.secretKey}`,
      'Content-Type': 'application/json',
    };

    try {
      // Development mode fallback
      if (!this.secretKey || this.secretKey === 'sk_test_dev_mode') {
        console.log('🔧 Development mode: Simulating payment verification');
        return {
          status: true,
          message: 'Payment verified (development mode)',
          data: {
            id: Date.now(),
            domain: 'test',
            status: 'success',
            reference: reference,
            amount: 300000,
            message: 'Development mode payment',
            gateway_response: 'Approved',
            paid_at: new Date().toISOString(),
            created_at: new Date().toISOString(),
            channel: 'card',
            currency: 'NGN',
            ip_address: '127.0.0.1',
            metadata: { development: true },
            log: {},
            fees: 0,
            fees_split: null,
            authorization: {
              authorization_code: 'AUTH_dev',
              bin: '408408',
              last4: '4081',
              exp_month: '12',
              exp_year: '2030',
              channel: 'card',
              card_type: 'visa',
              bank: 'Test Bank',
              country_code: 'NG',
              brand: 'visa',
              reusable: true,
              signature: 'SIG_dev'
            },
            customer: {
              id: 1,
              first_name: 'Test',
              last_name: 'User',
              email: 'test@example.com',
              customer_code: 'CUS_dev',
              phone: '+2348000000000',
              metadata: {},
              risk_action: 'default'
            },
            plan: null,
            subaccount: null,
            split: null,
            order_id: null,
            paidAt: new Date().toISOString(),
            createdAt: new Date().toISOString(),
            requested_amount: 300000,
            pos_transaction_data: null,
            source: null,
            fees_breakdown: null
          }
        };
      }

      const response = await fetch(url, {
        method: 'GET',
        headers,
      });

      const result = await response.json();
      
      if (!response.ok) {
        throw new Error(result.message || 'Payment verification failed');
      }

      return result;
    } catch (error) {
      console.error('Paystack verification error:', error);
      throw error;
    }
  }

  /**
   * Generate a unique unlock code
   */
  generateUnlockCode(): string {
    // Generate a 8-digit numeric code like the predefined ones
    return Math.floor(10000000 + Math.random() * 90000000).toString();
  }

  /**
   * Verify webhook signature
   */
  verifyWebhookSignature(payload: string, signature: string): boolean {
    if (!this.secretKey) return false;
    
    const hash = crypto
      .createHmac('sha512', this.secretKey)
      .update(payload, 'utf8')
      .digest('hex');
    
    return hash === signature;
  }

  /**
   * Get payment amount for CBT session (in kobo)
   */
  getCBTSessionAmount(): number {
    return 300000; // ₦3000 in kobo
  }
}

export const paystackService = new PaystackService();