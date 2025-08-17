import { useState, useEffect } from 'react';
import { useLocation, useRoute } from 'wouter';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { useToast } from '@/hooks/use-toast';
import { 
  CheckCircle, 
  XCircle, 
  Mail, 
  Loader2, 
  ArrowLeft,
  Clock,
  RefreshCw
} from 'lucide-react';

const EmailVerification = () => {
  const [location, setLocation] = useLocation();
  const [, params] = useRoute('/verify-email');
  const { toast } = useToast();
  
  const [verificationStatus, setVerificationStatus] = useState<'pending' | 'success' | 'error' | 'expired'>('pending');
  const [loading, setLoading] = useState(true);
  const [resendLoading, setResendLoading] = useState(false);
  const [message, setMessage] = useState('');
  const [email, setEmail] = useState('');
  const [resendEmail, setResendEmail] = useState('');

  useEffect(() => {
    const urlParams = new URLSearchParams(window.location.search);
    const token = urlParams.get('token');
    const emailParam = urlParams.get('email');
    
    if (emailParam) {
      setEmail(emailParam);
    }
    
    if (token && emailParam) {
      verifyEmail(token, emailParam);
    } else {
      setLoading(false);
      setVerificationStatus('error');
      setMessage('Invalid verification link. Missing token or email.');
    }
  }, []);

  const verifyEmail = async (token: string, email: string) => {
    try {
      setLoading(true);
      const response = await fetch(`/api/auth/verify-email?token=${token}&email=${encodeURIComponent(email)}`);
      const data = await response.json();

      if (response.ok) {
        setVerificationStatus('success');
        setMessage(data.message || 'Email verified successfully!');
        
        toast({
          title: "Email Verified!",
          description: "Your account is now active. You can login to start using UTME AI.",
        });

        // Redirect to login after 3 seconds
        setTimeout(() => {
          setLocation('/login');
        }, 3000);
      } else {
        if (data.message?.includes('expired')) {
          setVerificationStatus('expired');
        } else {
          setVerificationStatus('error');
        }
        setMessage(data.message || 'Verification failed');
      }
    } catch (error) {
      console.error('Verification error:', error);
      setVerificationStatus('error');
      setMessage('Network error occurred. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  const resendVerification = async () => {
    if (!resendEmail) {
      toast({
        title: "Email Required",
        description: "Please enter your email address to resend verification.",
        variant: "destructive"
      });
      return;
    }

    try {
      setResendLoading(true);
      const response = await fetch('/api/auth/resend-verification', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ email: resendEmail })
      });

      const data = await response.json();

      if (response.ok) {
        toast({
          title: "Email Sent!",
          description: "New verification email sent. Please check your inbox.",
        });
        setMessage('New verification email sent successfully!');
      } else {
        toast({
          title: "Error",
          description: data.message || "Failed to resend verification email",
          variant: "destructive"
        });
      }
    } catch (error) {
      console.error('Resend verification error:', error);
      toast({
        title: "Error",
        description: "Network error occurred. Please try again.",
        variant: "destructive"
      });
    } finally {
      setResendLoading(false);
    }
  };

  const getStatusIcon = () => {
    switch (verificationStatus) {
      case 'success':
        return <CheckCircle className="h-16 w-16 text-green-500" />;
      case 'error':
        return <XCircle className="h-16 w-16 text-red-500" />;
      case 'expired':
        return <Clock className="h-16 w-16 text-orange-500" />;
      default:
        return <Mail className="h-16 w-16 text-blue-500" />;
    }
  };

  const getStatusColor = () => {
    switch (verificationStatus) {
      case 'success':
        return 'bg-green-50 border-green-200';
      case 'error':
        return 'bg-red-50 border-red-200';
      case 'expired':
        return 'bg-orange-50 border-orange-200';
      default:
        return 'bg-blue-50 border-blue-200';
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-blue-50 via-indigo-50 to-purple-50 flex items-center justify-center p-4">
        <Card className="w-full max-w-md">
          <CardContent className="flex flex-col items-center justify-center py-12">
            <Loader2 className="h-16 w-16 text-blue-500 animate-spin mb-4" />
            <h3 className="text-xl font-semibold mb-2">Verifying Email</h3>
            <p className="text-gray-600 text-center">Please wait while we verify your email address...</p>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 via-indigo-50 to-purple-50 flex items-center justify-center p-4">
      <Card className={`w-full max-w-md ${getStatusColor()}`}>
        <CardHeader>
          <div className="flex items-center space-x-2">
            <Button
              variant="ghost"
              size="sm"
              onClick={() => setLocation('/login')}
              className="mb-4"
            >
              <ArrowLeft className="h-4 w-4 mr-2" />
              Back to Login
            </Button>
          </div>
          <CardTitle className="text-center">Email Verification</CardTitle>
        </CardHeader>
        <CardContent className="space-y-6">
          <div className="flex flex-col items-center text-center space-y-4">
            {getStatusIcon()}
            
            <div className="space-y-2">
              <Badge variant={verificationStatus === 'success' ? 'default' : 'destructive'}>
                {verificationStatus === 'success' && 'Verified'}
                {verificationStatus === 'error' && 'Failed'}
                {verificationStatus === 'expired' && 'Expired'}
                {verificationStatus === 'pending' && 'Pending'}
              </Badge>
              
              <h3 className="text-xl font-semibold">
                {verificationStatus === 'success' && 'Email Verified Successfully!'}
                {verificationStatus === 'error' && 'Verification Failed'}
                {verificationStatus === 'expired' && 'Link Expired'}
                {verificationStatus === 'pending' && 'Verifying...'}
              </h3>
              
              <p className="text-gray-600">
                {message || 'Processing your email verification...'}
              </p>
            </div>
          </div>

          {verificationStatus === 'success' && (
            <div className="space-y-4">
              <div className="bg-green-100 border border-green-200 rounded-lg p-4">
                <p className="text-green-800 text-sm">
                  🎉 Welcome to UTME AI! Your account is now active and you can access all features.
                </p>
              </div>
              <Button 
                onClick={() => setLocation('/login')}
                className="w-full"
              >
                Continue to Login
              </Button>
            </div>
          )}

          {(verificationStatus === 'error' || verificationStatus === 'expired') && (
            <div className="space-y-4">
              <div className="space-y-3">
                <label className="text-sm font-medium">Email Address</label>
                <Input
                  type="email"
                  placeholder="Enter your email address"
                  value={resendEmail}
                  onChange={(e) => setResendEmail(e.target.value)}
                  defaultValue={email}
                />
              </div>
              
              <Button 
                onClick={resendVerification}
                disabled={resendLoading}
                className="w-full"
                variant="outline"
              >
                {resendLoading ? (
                  <>
                    <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                    Sending...
                  </>
                ) : (
                  <>
                    <RefreshCw className="h-4 w-4 mr-2" />
                    Resend Verification Email
                  </>
                )}
              </Button>
              
              <p className="text-sm text-gray-600 text-center">
                Didn't receive the email? Check your spam folder or try resending.
              </p>
            </div>
          )}

          <div className="border-t pt-4">
            <p className="text-xs text-gray-500 text-center">
              Having trouble? Contact support for assistance.
            </p>
          </div>
        </CardContent>
      </Card>
    </div>
  );
};

export default EmailVerification;