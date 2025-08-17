import sgMail from '@sendgrid/mail';

const sendGridApiKey = process.env.SENDGRID_API_KEY;

if (!sendGridApiKey) {
  console.warn("SENDGRID_API_KEY environment variable not set - email functionality disabled");
} else {
  // Remove the SG. format check as it might be causing issues
  console.log("✅ SendGrid email service initialized");
  sgMail.setApiKey(sendGridApiKey);
}

interface EmailParams {
  to: string;
  from: string;
  subject: string;
  text?: string;
  html?: string;
}

export async function sendEmail(params: EmailParams): Promise<boolean> {
  if (!sendGridApiKey) {
    console.error('SendGrid API key not configured');
    return false;
  }

  try {
    await sgMail.send({
      to: params.to,
      from: params.from,
      subject: params.subject,
      text: params.text || '',
      html: params.html || '',
    });
    console.log(`Email sent successfully to ${params.to}`);
    return true;
  } catch (error) {
    console.error('SendGrid email error:', error);
    return false;
  }
}

export function generateVerificationEmail(userEmail: string, verificationToken: string, baseUrl?: string) {
  const domain = baseUrl || (process.env.NODE_ENV === 'production' ? 'https://your-app.replit.app' : 'http://localhost:5000');
  const verificationLink = `${domain}/verify-email?token=${verificationToken}&email=${encodeURIComponent(userEmail)}`;
  
  return {
    to: userEmail,
    from: 'noreply@test.replit.dev', // Temporary sender for testing
    subject: 'Verify Your UTME AI Account',
    text: `Welcome to UTME AI! Please verify your email address by clicking this link: ${verificationLink}`,
    html: `
      <!DOCTYPE html>
      <html>
      <head>
        <meta charset="utf-8">
        <title>Verify Your UTME AI Account</title>
        <style>
          body { font-family: Arial, sans-serif; line-height: 1.6; color: #333; }
          .container { max-width: 600px; margin: 0 auto; padding: 20px; }
          .header { background: linear-gradient(135deg, #667eea 0%, #764ba2 100%); color: white; padding: 30px; text-align: center; border-radius: 10px 10px 0 0; }
          .content { background: #f9f9f9; padding: 30px; border-radius: 0 0 10px 10px; }
          .button { display: inline-block; background: #667eea; color: white; padding: 15px 30px; text-decoration: none; border-radius: 5px; margin: 20px 0; }
          .footer { text-align: center; margin-top: 30px; color: #666; font-size: 14px; }
        </style>
      </head>
      <body>
        <div class="container">
          <div class="header">
            <h1>🎓 Welcome to UTME AI!</h1>
            <p>Your AI-powered study companion for JAMB preparation</p>
          </div>
          <div class="content">
            <h2>Verify Your Email Address</h2>
            <p>Thank you for signing up for UTME AI! To complete your registration and start your JAMB preparation journey, please verify your email address by clicking the button below:</p>
            
            <div style="text-align: center;">
              <a href="${verificationLink}" class="button">Verify My Email</a>
            </div>
            
            <p>Or copy and paste this link into your browser:</p>
            <p style="word-break: break-all; background: #eee; padding: 10px; border-radius: 5px;">${verificationLink}</p>
            
            <p><strong>Why verify your email?</strong></p>
            <ul>
              <li>Secure your account and ensure account recovery</li>
              <li>Receive important updates about your study progress</li>
              <li>Get notified about new features and improvements</li>
            </ul>
            
            <p>This verification link will expire in 24 hours for security reasons.</p>
            
            <p>If you didn't create an account with UTME AI, please ignore this email.</p>
          </div>
          <div class="footer">
            <p>UTME AI - Created by broken vzn</p>
            <p>Helping Nigerian students achieve their academic dreams</p>
          </div>
        </div>
      </body>
      </html>
    `
  };
}

export function generateWelcomeEmail(userEmail: string, userName: string) {
  return {
    to: userEmail,
    from: 'noreply@test.replit.dev',
    subject: 'Welcome to UTME AI - Your Journey Begins!',
    text: `Welcome ${userName}! Your UTME AI account has been verified successfully. Start your JAMB preparation journey now!`,
    html: `
      <!DOCTYPE html>
      <html>
      <head>
        <meta charset="utf-8">
        <title>Welcome to UTME AI</title>
        <style>
          body { font-family: Arial, sans-serif; line-height: 1.6; color: #333; }
          .container { max-width: 600px; margin: 0 auto; padding: 20px; }
          .header { background: linear-gradient(135deg, #667eea 0%, #764ba2 100%); color: white; padding: 30px; text-align: center; border-radius: 10px 10px 0 0; }
          .content { background: #f9f9f9; padding: 30px; border-radius: 0 0 10px 10px; }
          .feature { background: white; padding: 20px; margin: 15px 0; border-radius: 8px; border-left: 4px solid #667eea; }
          .footer { text-align: center; margin-top: 30px; color: #666; font-size: 14px; }
        </style>
      </head>
      <body>
        <div class="container">
          <div class="header">
            <h1>🎉 Welcome to UTME AI, ${userName}!</h1>
            <p>Your account is now verified and ready to use</p>
          </div>
          <div class="content">
            <h2>You're all set to begin your JAMB preparation!</h2>
            <p>Your email has been successfully verified. Here's what you can do with UTME AI:</p>
            
            <div class="feature">
              <h3>🤖 AI Study Assistant</h3>
              <p>Chat with our intelligent AI tutor for personalized help with JAMB topics and concepts.</p>
            </div>
            
            <div class="feature">
              <h3>📝 CBT Practice</h3>
              <p>Practice with authentic past questions from JAMB 2001-2020 in real exam conditions.</p>
            </div>
            
            <div class="feature">
              <h3>📊 Progress Tracking</h3>
              <p>Monitor your performance across subjects and identify areas for improvement.</p>
            </div>
            
            <div class="feature">
              <h3>📚 Study Plans</h3>
              <p>Get AI-generated personalized study schedules based on your goals and performance.</p>
            </div>
            
            <p><strong>Ready to start?</strong> Log in to your account and begin your JAMB preparation journey with confidence!</p>
            
            <p>For premium features including unlimited AI assistance and advanced analytics, consider upgrading your account.</p>
          </div>
          <div class="footer">
            <p>UTME AI - Created by broken vzn</p>
            <p>Helping Nigerian students achieve their academic dreams</p>
          </div>
        </div>
      </body>
      </html>
    `
  };
}