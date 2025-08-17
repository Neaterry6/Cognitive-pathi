import React, { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Badge } from '@/components/ui/badge';
import { Separator } from '@/components/ui/separator';
import { Clock, BookOpen, CreditCard, Key, CheckCircle, AlertCircle, ArrowLeft, Home } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import { apiRequest } from '@/lib/queryClient';

interface Subject {
  id: string;
  name: string;
  emoji: string;
  description: string;
}

interface CBTSetupProps {
  user: any;
  subjects: Subject[];
  onSessionStart: (sessionId: string) => void;
  onBack?: () => void;
  onHome?: () => void;
}

const CBTSetup: React.FC<CBTSetupProps> = ({ user, subjects, onSessionStart, onBack, onHome }) => {
  const [selectedSubjects, setSelectedSubjects] = useState<Subject[]>([]);
  const [paymentMethod, setPaymentMethod] = useState<'paystack' | 'manual'>('paystack');
  const [unlockCode, setUnlockCode] = useState('');
  const [isProcessing, setIsProcessing] = useState(false);
  const [paymentStatus, setPaymentStatus] = useState<'idle' | 'processing' | 'success' | 'failed'>('idle');
  const [generatedCode, setGeneratedCode] = useState('');
  const { toast } = useToast();

  const handleSubjectToggle = (subject: Subject) => {
    if (selectedSubjects.find(s => s.id === subject.id)) {
      setSelectedSubjects(selectedSubjects.filter(s => s.id !== subject.id));
    } else if (selectedSubjects.length < 4) {
      setSelectedSubjects([...selectedSubjects, subject]);
    } else {
      toast({
        title: "Selection Limit",
        description: "You can only select 4 subjects for the CBT exam.",
        variant: "destructive"
      });
    }
  };

  const handlePaystackPayment = async () => {
    try {
      setIsProcessing(true);
      setPaymentStatus('processing');

      const paymentData = {
        userId: user.id || (user as any)._id || user.nickname,
        email: user.email || `${user.nickname || 'user'}@example.com`,
        amount: 300000 // ₦3000
      };

      console.log('Payment data:', paymentData);

      const response = await fetch('/api/payments/initialize', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(paymentData)
      });

      const data = await response.json();

      if (data.success) {
        // Redirect to Paystack payment page
        window.location.href = data.payment_url;
      } else {
        throw new Error('Payment initialization failed');
      }
    } catch (error) {
      console.error('Payment error:', error);
      setPaymentStatus('failed');
      toast({
        title: "Payment Error",
        description: "Failed to initialize payment. Please try again.",
        variant: "destructive"
      });
    } finally {
      setIsProcessing(false);
    }
  };

  const handleManualUnlock = async () => {
    try {
      setIsProcessing(true);
      
      const response = await fetch('/api/payments/validate-code', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          userId: user.id || (user as any)._id || user.nickname,
          unlockCode: unlockCode.trim()
        })
      });

      const data = await response.json();

      if (data.success) {
        setPaymentStatus('success');
        toast({
          title: "Code Verified",
          description: "Your unlock code is valid! You can now start the CBT exam.",
          variant: "default"
        });
      } else {
        throw new Error('Invalid unlock code');
      }
    } catch (error) {
      console.error('Code validation error:', error);
      toast({
        title: "Invalid Code",
        description: "The unlock code you entered is not valid. Please check and try again.",
        variant: "destructive"
      });
    } finally {
      setIsProcessing(false);
    }
  };

  const handleStartCBT = async () => {
    try {
      setIsProcessing(true);
      
      console.log('🎯 Creating CBT session...');
      
      // Step 1: Create CBT session
      const createResponse = await fetch('/api/cbt/sessions', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          userId: user.id || (user as any)._id || user.nickname,
          selectedSubjects: selectedSubjects,
          paymentId: `verified-${Date.now()}`
        })
      });

      if (!createResponse.ok) {
        const errorData = await createResponse.json();
        throw new Error(errorData.message || 'Failed to create CBT session');
      }

      const sessionData = await createResponse.json();
      console.log('✅ CBT session created:', sessionData.id);

      if (!sessionData || !sessionData.id) {
        throw new Error('Invalid session data received');
      }

      // Step 2: Start the examination (fetch questions)
      console.log('🚀 Starting CBT examination...');
      const startResponse = await fetch(`/api/cbt/sessions/${sessionData.id}/start`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        }
      });

      if (!startResponse.ok) {
        const errorData = await startResponse.json();
        throw new Error(errorData.message || 'Failed to start CBT examination');
      }

      const examData = await startResponse.json();
      console.log('✅ CBT examination started successfully');

      if (examData.success) {
        toast({
          title: "CBT Started",
          description: `Examination started with ${examData.totalQuestions || 160} questions. Good luck!`,
          variant: "default"
        });
        onSessionStart(sessionData.id);
      } else {
        throw new Error('Failed to start CBT examination - invalid response');
      }
    } catch (error) {
      console.error('❌ CBT start error:', error);
      toast({
        title: "Session Error",
        description: `Failed to start CBT session: ${error instanceof Error ? error.message : 'Unknown error'}. Please try again.`,
        variant: "destructive"
      });
    } finally {
      setIsProcessing(false);
    }
  };

  // Check URL parameters for payment callback
  useEffect(() => {
    const urlParams = new URLSearchParams(window.location.search);
    const reference = urlParams.get('reference');
    
    if (reference) {
      // Verify payment
      const verifyPayment = async () => {
        try {
          const response = await fetch('/api/payments/verify', {
            method: 'POST',
            headers: {
              'Content-Type': 'application/json',
            },
            body: JSON.stringify({ reference })
          });

          const data = await response.json();

          if (data.success) {
            setPaymentStatus('success');
            setGeneratedCode(data.unlockCode);
            toast({
              title: "Payment Successful",
              description: `Your unlock code is: ${data.unlockCode}`,
              variant: "default"
            });
            
            // Clean up URL
            window.history.replaceState({}, document.title, window.location.pathname);
          } else {
            setPaymentStatus('failed');
            toast({
              title: "Payment Failed",
              description: "Payment verification failed. Please contact support.",
              variant: "destructive"
            });
          }
        } catch (error) {
          console.error('Payment verification error:', error);
          setPaymentStatus('failed');
        }
      };

      verifyPayment();
    }
  }, [toast]);

  const canStartCBT = selectedSubjects.length === 4 && paymentStatus === 'success';

  return (
    <div className="max-w-4xl mx-auto space-y-6">
      {/* Navigation Header */}
      <div className="flex items-center justify-between mb-6">
        <div className="flex items-center gap-2">
          {onBack && (
            <Button variant="outline" size="sm" onClick={onBack}>
              <ArrowLeft className="w-4 h-4 mr-2" />
              Back
            </Button>
          )}
          {onHome && (
            <Button variant="outline" size="sm" onClick={onHome}>
              <Home className="w-4 h-4 mr-2" />
              Home
            </Button>
          )}
        </div>
      </div>

      {/* Header */}
      <div className="text-center space-y-2">
        <h1 className="text-3xl font-bold">CBT Examination Setup</h1>
        <p className="text-muted-foreground">
          Select 4 subjects for your 2-hour UTME practice exam
        </p>
      </div>

      {/* Exam Details */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Clock className="w-5 h-5" />
            Exam Details
          </CardTitle>
        </CardHeader>
        <CardContent className="grid md:grid-cols-3 gap-4">
          <div className="text-center">
            <div className="text-2xl font-bold text-primary">4</div>
            <div className="text-sm text-muted-foreground">Subjects</div>
          </div>
          <div className="text-center">
            <div className="text-2xl font-bold text-primary">160</div>
            <div className="text-sm text-muted-foreground">Questions (40 each)</div>
          </div>
          <div className="text-center">
            <div className="text-2xl font-bold text-primary">2</div>
            <div className="text-sm text-muted-foreground">Hours</div>
          </div>
        </CardContent>
      </Card>

      {/* Subject Selection */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <BookOpen className="w-5 h-5" />
            Select Subjects ({selectedSubjects.length}/4)
          </CardTitle>
          <CardDescription>
            Choose exactly 4 subjects for your examination
          </CardDescription>
        </CardHeader>
        <CardContent>
          {!subjects || subjects.length === 0 ? (
            <div className="text-center p-6">
              <AlertCircle className="w-12 h-12 mx-auto text-muted-foreground mb-4" />
              <p className="text-muted-foreground mb-4">No subjects available. Initializing subjects...</p>
              <Button 
                onClick={async () => {
                  try {
                    const response = await fetch('/api/subjects/init', { method: 'POST' });
                    if (response.ok) {
                      window.location.reload();
                    }
                  } catch (error) {
                    console.error('Failed to initialize subjects:', error);
                  }
                }}
                variant="outline"
              >
                Initialize Subjects
              </Button>
            </div>
          ) : (
            <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-3">
              {subjects.map((subject) => {
                const isSelected = selectedSubjects.find(s => s.id === subject.id);
                const canSelect = selectedSubjects.length < 4 || isSelected;
                
                return (
                  <Button
                    key={subject.id}
                    variant={isSelected ? "default" : "outline"}
                    className={`h-auto p-4 justify-start transition-all duration-200 ${
                      !canSelect ? 'opacity-50 cursor-not-allowed' : 'hover:scale-105'
                    } ${isSelected ? 'ring-2 ring-primary ring-opacity-50' : ''}`}
                    onClick={() => handleSubjectToggle(subject)}
                    disabled={!canSelect}
                  >
                    <div className="text-left">
                      <div className="flex items-center gap-2 mb-1">
                        <span className="text-lg">{subject.emoji}</span>
                        <span className="font-medium">{subject.name}</span>
                      </div>
                      {isSelected && <Badge variant="secondary" className="text-xs">Selected</Badge>}
                    </div>
                  </Button>
                );
              })}
            </div>
          )}
        </CardContent>
      </Card>

      {/* Payment Section */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <CreditCard className="w-5 h-5" />
            Payment & Access
          </CardTitle>
          <CardDescription>
            Pay ₦3000 to unlock CBT access or enter your unlock code
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-6">
          {/* Payment Method Toggle */}
          <div className="flex gap-2">
            <Button
              variant={paymentMethod === 'paystack' ? 'default' : 'outline'}
              onClick={() => setPaymentMethod('paystack')}
              className="flex-1"
            >
              <CreditCard className="w-4 h-4 mr-2" />
              Pay with Card
            </Button>
            <Button
              variant={paymentMethod === 'manual' ? 'default' : 'outline'}
              onClick={() => setPaymentMethod('manual')}
              className="flex-1"
            >
              <Key className="w-4 h-4 mr-2" />
              Enter Code
            </Button>
          </div>

          <Separator />

          {/* Payment Method Content */}
          {paymentMethod === 'paystack' && (
            <div className="space-y-4">
              <div className="bg-muted p-4 rounded-lg">
                <div className="flex items-center justify-between mb-2">
                  <span className="font-medium">CBT Exam Access</span>
                  <span className="text-lg font-bold">₦3000</span>
                </div>
                <div className="text-sm text-muted-foreground">
                  • 4 subjects of your choice
                  • 160 questions total
                  • 2 hours exam time
                  • Immediate results
                </div>
              </div>

              {paymentStatus === 'success' && generatedCode && (
                <div className="bg-green-50 border border-green-200 p-4 rounded-lg">
                  <div className="flex items-center gap-2 mb-2">
                    <CheckCircle className="w-5 h-5 text-green-600" />
                    <span className="font-medium text-green-800">Payment Successful!</span>
                  </div>
                  <div className="text-sm text-green-700">
                    Your unlock code: <code className="bg-green-100 px-2 py-1 rounded font-mono">{generatedCode}</code>
                  </div>
                </div>
              )}

              {paymentStatus === 'failed' && (
                <div className="bg-red-50 border border-red-200 p-4 rounded-lg">
                  <div className="flex items-center gap-2">
                    <AlertCircle className="w-5 h-5 text-red-600" />
                    <span className="font-medium text-red-800">Payment Failed</span>
                  </div>
                  <div className="text-sm text-red-700">
                    Please try again or contact support.
                  </div>
                </div>
              )}

              <Button
                onClick={handlePaystackPayment}
                disabled={selectedSubjects.length !== 4 || isProcessing || paymentStatus === 'success'}
                className="w-full"
              >
                {selectedSubjects.length !== 4 
                  ? `Select ${4 - selectedSubjects.length} more subjects` 
                  : isProcessing 
                    ? 'Processing...' 
                    : 'Pay ₦3000 with Paystack'
                }
              </Button>
            </div>
          )}

          {paymentMethod === 'manual' && (
            <div className="space-y-4">
              <div>
                <Label htmlFor="unlockCode">Enter Unlock Code</Label>
                <Input
                  id="unlockCode"
                  type="text"
                  placeholder="Enter your 8-character unlock code"
                  value={unlockCode}
                  onChange={(e) => setUnlockCode(e.target.value.toUpperCase())}
                  maxLength={8}
                  className="font-mono"
                />
                <div className="text-sm text-muted-foreground mt-1">
                  Get your unlock code by paying with Paystack or from support
                </div>
              </div>

              <Button
                onClick={handleManualUnlock}
                disabled={unlockCode.length !== 8 || isProcessing}
                className="w-full"
              >
                {isProcessing ? 'Validating...' : 'Verify Code'}
              </Button>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Start CBT Button */}
      {canStartCBT && (
        <Card className="border-green-200 bg-green-50">
          <CardContent className="pt-6">
            <div className="text-center space-y-4">
              <div className="flex items-center justify-center gap-2 text-green-700">
                <CheckCircle className="w-6 h-6" />
                <span className="font-medium">Ready to Start CBT Exam</span>
              </div>
              <Button
                onClick={handleStartCBT}
                disabled={isProcessing}
                size="lg"
                className="w-full max-w-md"
              >
                {isProcessing ? 'Starting...' : 'Start CBT Examination'}
              </Button>
              <div className="text-sm text-green-600">
                Selected: {selectedSubjects.map(s => s.name).join(', ')}
              </div>
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );
};

export default CBTSetup;