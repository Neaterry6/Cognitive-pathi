import React, { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { useToast } from '@/hooks/use-toast';
import { apiRequest } from '@/lib/queryClient';
import { Crown, ArrowLeft, Loader2, CreditCard } from 'lucide-react';
import { User } from '@shared/schema';

interface PaystackCheckoutProps {
  user: User;
  onBack: () => void;
  onSuccess: () => void;
}

export default function PaystackCheckout({ user, onBack, onSuccess }: PaystackCheckoutProps) {
  const [isInitializing, setIsInitializing] = useState(false);
  const [isVerifying, setIsVerifying] = useState(false);
  const [paymentReference, setPaymentReference] = useState<string>("");
  const [paymentUrl, setPaymentUrl] = useState<string>("");
  const { toast } = useToast();

  const initializePayment = async () => {
    if (!user.email) {
      toast({
        title: "Email Required",
        description: "Please update your profile with an email address to proceed with payment.",
        variant: "destructive",
      });
      return;
    }

    setIsInitializing(true);
    try {
      const response = await apiRequest("POST", "/api/payments/initialize", {
        userId: user.id,
        email: user.email,
        amount: 300000, // ₦3,000 in kobo for CBT access
      });

      const data = await response.json();
      
      if (data.success) {
        setPaymentReference(data.reference);
        setPaymentUrl(data.payment_url);
        
        // Redirect to Paystack payment page
        window.location.href = data.payment_url;
      } else {
        throw new Error(data.message || 'Failed to initialize payment');
      }
    } catch (error) {
      console.error('Payment initialization error:', error);
      toast({
        title: "Payment Setup Failed",
        description: "Unable to initialize payment. Please try again.",
        variant: "destructive",
      });
    } finally {
      setIsInitializing(false);
    }
  };

  const verifyPayment = async (reference: string) => {
    setIsVerifying(true);
    try {
      const response = await apiRequest("POST", "/api/payments/verify", {
        reference: reference
      });

      const data = await response.json();
      
      if (data.success) {
        toast({
          title: "Payment Successful!",
          description: `Welcome to Premium CBT! Your unlock code is: ${data.unlockCode}`,
        });
        onSuccess();
      } else {
        toast({
          title: "Payment Verification Failed",
          description: data.message || "Payment could not be verified. Please contact support.",
          variant: "destructive",
        });
      }
    } catch (error) {
      console.error('Payment verification error:', error);
      toast({
        title: "Verification Error",
        description: "Unable to verify payment. Please contact support.",
        variant: "destructive",
      });
    } finally {
      setIsVerifying(false);
    }
  };

  // Check for payment callback on page load
  useEffect(() => {
    const urlParams = new URLSearchParams(window.location.search);
    const reference = urlParams.get('reference');
    const status = urlParams.get('status');
    
    if (reference && status) {
      if (status === 'success') {
        verifyPayment(reference);
      } else {
        toast({
          title: "Payment Cancelled",
          description: "Payment was cancelled or failed. You can try again.",
          variant: "destructive",
        });
      }
      
      // Clean up URL parameters
      window.history.replaceState({}, document.title, window.location.pathname);
    }
  }, []);

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-900 via-slate-800 to-slate-900 flex items-center justify-center p-6">
      <div className="w-full max-w-md">
        <div className="bg-slate-800/50 backdrop-blur-sm rounded-2xl border border-slate-700/50 p-8 shadow-2xl">
          {/* Header */}
          <div className="flex items-center justify-between mb-6">
            <Button
              variant="ghost"
              onClick={onBack}
              className="text-slate-400 hover:text-white"
              data-testid="button-back"
            >
              <ArrowLeft className="h-4 w-4 mr-2" />
              Back
            </Button>
            <div className="flex items-center text-slate-300">
              <Crown className="h-5 w-5 mr-2 text-yellow-500" />
              Premium CBT
            </div>
          </div>

          {/* Payment Info */}
          <div className="text-center mb-8">
            <h2 className="text-2xl font-bold text-white mb-2" data-testid="text-title">
              Upgrade to Premium CBT
            </h2>
            <p className="text-slate-400 mb-4">
              Get access to authentic POST UTME questions and advanced features
            </p>
            <div className="bg-slate-700/50 rounded-lg p-4 mb-6">
              <div className="text-3xl font-bold text-green-500 mb-1" data-testid="text-price">
                ₦3,000
              </div>
              <div className="text-slate-400 text-sm">One-time payment for CBT access</div>
            </div>
          </div>

          {/* Features */}
          <div className="space-y-3 mb-8">
            <div className="flex items-center text-slate-300">
              <div className="w-2 h-2 bg-green-500 rounded-full mr-3"></div>
              Access to authentic POST UTME questions
            </div>
            <div className="flex items-center text-slate-300">
              <div className="w-2 h-2 bg-green-500 rounded-full mr-3"></div>
              AI-powered performance analytics
            </div>
            <div className="flex items-center text-slate-300">
              <div className="w-2 h-2 bg-green-500 rounded-full mr-3"></div>
              Comprehensive study tracking
            </div>
            <div className="flex items-center text-slate-300">
              <div className="w-2 h-2 bg-green-500 rounded-full mr-3"></div>
              Unlimited practice sessions
            </div>
          </div>

          {/* Payment Button */}
          <Button
            onClick={initializePayment}
            disabled={isInitializing || isVerifying || !user.email}
            className="w-full bg-gradient-to-r from-green-600 to-blue-600 hover:opacity-90 py-4 font-semibold text-lg transition-all duration-200 active:scale-95"
            data-testid="button-pay"
          >
            {isInitializing ? (
              <div className="flex items-center justify-center">
                <Loader2 className="animate-spin h-5 w-5 mr-2" />
                Setting up payment...
              </div>
            ) : isVerifying ? (
              <div className="flex items-center justify-center">
                <Loader2 className="animate-spin h-5 w-5 mr-2" />
                Verifying payment...
              </div>
            ) : (
              <div className="flex items-center justify-center">
                <CreditCard className="h-5 w-5 mr-2" />
                Pay with Paystack
              </div>
            )}
          </Button>

          {!user.email && (
            <p className="text-red-400 text-sm text-center mt-4" data-testid="text-email-error">
              Please update your profile with an email address to proceed with payment.
            </p>
          )}

          {/* Security Notice */}
          <div className="mt-6 text-center">
            <p className="text-slate-500 text-xs">
              🔒 Secure payment powered by Paystack
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}