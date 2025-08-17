import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Eye, EyeOff, User, Lock, ArrowRight, Mail, AlertCircle } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import { apiRequest } from '@/lib/queryClient';


interface LoginProps {
  onLogin: (userData: any) => void;
  onSwitchToSignup: () => void;
  onBackToLanding?: () => void;
}

export default function Login({ onLogin, onSwitchToSignup, onBackToLanding }: LoginProps) {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [needsEmailVerification, setNeedsEmailVerification] = useState(false);
  const [resendLoading, setResendLoading] = useState(false);
  const { toast } = useToast();

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!email || !password) {
      toast({
        title: "Missing Information",
        description: "Please fill in all fields",
        variant: "destructive",
      });
      return;
    }

    setIsLoading(true);
    setNeedsEmailVerification(false);
    
    try {
      await onLogin({ email, password });
    } catch (error: any) {
      // Check if error is due to email verification
      if (error.message?.includes('verify your email') || error.needsEmailVerification) {
        setNeedsEmailVerification(true);
      } else {
        toast({
          title: "Login Failed",
          description: error.message || "Invalid email or password",
          variant: "destructive",
        });
      }
    } finally {
      setIsLoading(false);
    }
  };

  const handleResendVerification = async () => {
    if (!email) {
      toast({
        title: "Email Required",
        description: "Please enter your email address first",
        variant: "destructive"
      });
      return;
    }

    setResendLoading(true);
    try {
      const response = await fetch('/api/auth/resend-verification', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ email })
      });

      const data = await response.json();

      if (response.ok) {
        toast({
          title: "Email Sent!",
          description: "New verification email sent. Please check your inbox.",
        });
      } else {
        toast({
          title: "Error",
          description: data.message || "Failed to resend verification email",
          variant: "destructive"
        });
      }
    } catch (error) {
      toast({
        title: "Error",
        description: "Network error occurred. Please try again.",
        variant: "destructive"
      });
    } finally {
      setResendLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-purple-900 via-blue-900 to-indigo-900 flex items-center justify-center p-4">
      <div className="w-full max-w-md">
        {/* Header */}
        <div className="text-center mb-8">
          <div className="w-16 h-16 bg-gradient-to-r from-purple-500 to-blue-500 rounded-2xl mx-auto mb-4 flex items-center justify-center">
            <User className="h-8 w-8 text-white" />
          </div>
          <h1 className="text-3xl font-bold text-white mb-2">Welcome Back</h1>
          <p className="text-purple-200">Sign in to continue your learning journey</p>
        </div>

        {/* Login Card */}
        <Card className="bg-white/10 backdrop-blur-lg border-white/20 shadow-2xl">
          <CardHeader className="space-y-1">
            <CardTitle className="text-2xl font-bold text-center text-white">Sign In</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <form onSubmit={handleLogin} className="space-y-4">
              {/* Email Field */}
              <div className="space-y-2">
                <Label htmlFor="email" className="text-white">Email Address</Label>
                <div className="relative">
                  <User className="absolute left-3 top-1/2 transform -translate-y-1/2 h-5 w-5 text-purple-300" />
                  <Input
                    id="email"
                    type="email"
                    placeholder="Enter your email"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    className="pl-10 bg-white/20 border-white/30 text-white placeholder:text-purple-200 focus:border-purple-400 focus:ring-purple-400"
                    required
                  />
                </div>
              </div>

              {/* Password Field */}
              <div className="space-y-2">
                <Label htmlFor="password" className="text-white">Password</Label>
                <div className="relative">
                  <Lock className="absolute left-3 top-1/2 transform -translate-y-1/2 h-5 w-5 text-purple-300" />
                  <Input
                    id="password"
                    type={showPassword ? "text" : "password"}
                    placeholder="Enter your password"
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    className="pl-10 pr-10 bg-white/20 border-white/30 text-white placeholder:text-purple-200 focus:border-purple-400 focus:ring-purple-400"
                    required
                  />
                  <button
                    type="button"
                    onClick={() => setShowPassword(!showPassword)}
                    className="absolute right-3 top-1/2 transform -translate-y-1/2 text-purple-300 hover:text-white"
                  >
                    {showPassword ? <EyeOff className="h-5 w-5" /> : <Eye className="h-5 w-5" />}
                  </button>
                </div>
              </div>

              {/* Login Button */}
              <Button
                type="submit"
                disabled={isLoading}
                className="w-full bg-gradient-to-r from-purple-500 to-blue-500 hover:from-purple-600 hover:to-blue-600 text-white font-semibold py-3 transition-all duration-200 active:scale-95"
              >
                {isLoading ? (
                  <div className="flex items-center justify-center">
                    <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-white mr-2"></div>
                    Signing In...
                  </div>
                ) : (
                  <div className="flex items-center justify-center">
                    Sign In
                    <ArrowRight className="h-5 w-5 ml-2" />
                  </div>
                )}
              </Button>
            </form>

            {/* Email Verification Alert */}
            {needsEmailVerification && (
              <Alert className="bg-orange-50 border-orange-200">
                <AlertCircle className="h-4 w-4 text-orange-600" />
                <AlertDescription className="text-orange-800">
                  Please verify your email address before logging in. Check your inbox for the verification link.
                  <div className="mt-2">
                    <Button
                      onClick={handleResendVerification}
                      disabled={resendLoading}
                      variant="outline"
                      size="sm"
                      className="text-orange-700 border-orange-300 hover:bg-orange-100"
                    >
                      {resendLoading ? (
                        <>
                          <div className="animate-spin rounded-full h-3 w-3 border-b border-orange-600 mr-2"></div>
                          Sending...
                        </>
                      ) : (
                        <>
                          <Mail className="h-3 w-3 mr-2" />
                          Resend Email
                        </>
                      )}
                    </Button>
                  </div>
                </AlertDescription>
              </Alert>
            )}



            {/* Navigation Options */}
            <div className="space-y-3 pt-4 border-t border-white/20">
              <div className="text-center">
                <p className="text-purple-200 mb-2">Don't have an account?</p>
                <Button
                  onClick={onSwitchToSignup}
                  variant="ghost"
                  className="text-purple-300 hover:text-white hover:bg-white/10"
                >
                  Create Account
                </Button>
              </div>
              {onBackToLanding && (
                <div className="text-center">
                  <Button
                    onClick={onBackToLanding}
                    variant="ghost"
                    className="text-gray-400 hover:text-white hover:bg-white/10 text-sm"
                  >
                    ← Back to Home
                  </Button>
                </div>
              )}
            </div>
          </CardContent>
        </Card>

        {/* Footer */}
        <div className="text-center mt-8">
          <p className="text-purple-200 text-sm">
            © 2025 UI POST UTME. All rights reserved.
          </p>
        </div>
      </div>
    </div>
  );
}