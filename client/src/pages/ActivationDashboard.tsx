import React, { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Badge } from '@/components/ui/badge';
import { User } from '@shared/schema';
import { 
  ArrowLeft, 
  Key, 
  Crown, 
  CheckCircle, 
  AlertCircle,
  MessageCircle,
  Gift,
  Shield,
  Zap
} from 'lucide-react';
import { useToast } from '@/hooks/use-toast';

interface ActivationDashboardProps {
  user: User;
  onBack: () => void;
  onActivationSuccess: () => void;
}

export default function ActivationDashboard({ user, onBack, onActivationSuccess }: ActivationDashboardProps) {
  const [activationCode, setActivationCode] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const { toast } = useToast();

  const handleActivation = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!activationCode.trim()) return;

    setIsLoading(true);
    try {
      const response = await fetch('/api/auth/activate', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          userId: (user as any).id || (user as any)._id,
          activationCode: activationCode.trim()
        }),
      });

      const data = await response.json();

      if (response.ok) {
        toast({
          title: "Premium Activated!",
          description: "You now have unlimited access to all features",
        });
        onActivationSuccess();
      } else {
        toast({
          title: "Activation Failed",
          description: data.message || "Invalid activation code",
          variant: "destructive",
        });
      }
    } catch (error) {
      toast({
        title: "Error",
        description: "Failed to activate account. Please try again.",
        variant: "destructive",
      });
    } finally {
      setIsLoading(false);
    }
  };

  const whatsappMessage = encodeURIComponent("Hi! I want to purchase a premium activation code for the CBT platform. Please provide me with pricing and payment details.");

  const premiumFeatures = [
    { icon: Zap, title: "Unlimited Practice", description: "Access to all practice questions without limits" },
    { icon: Shield, title: "Premium Support", description: "Priority customer support and assistance" },
    { icon: Gift, title: "Exclusive Content", description: "Access to premium study materials and resources" },
    { icon: CheckCircle, title: "Ad-Free Experience", description: "Enjoy the platform without any advertisements" },
  ];

  return (
    <div className="min-h-screen bg-gradient-to-br from-purple-900 via-blue-900 to-indigo-900 p-4">
      <div className="max-w-6xl mx-auto">
        {/* Header */}
        <div className="flex items-center justify-between mb-8">
          <Button
            onClick={onBack}
            variant="ghost"
            className="text-white hover:bg-white/10"
          >
            <ArrowLeft className="h-5 w-5 mr-2" />
            Back to Dashboard
          </Button>
          <div className="text-center">
            <div className="w-20 h-20 bg-gradient-to-r from-yellow-500 to-orange-500 rounded-3xl mx-auto mb-6 flex items-center justify-center">
              <Crown className="h-10 w-10 text-white" />
            </div>
            <h1 className="text-4xl font-bold text-white mb-4">Premium Activation</h1>
            <p className="text-purple-200 text-lg">Unlock unlimited access to all features</p>
          </div>
          <div className="w-20" />
        </div>

        {user.isPremium ? (
          /* Already Premium */
          <div className="text-center">
            <Card className="bg-gradient-to-r from-green-500/20 to-emerald-500/20 border-green-500/30 max-w-2xl mx-auto">
              <CardContent className="p-8">
                <CheckCircle className="h-16 w-16 text-green-400 mx-auto mb-4" />
                <h2 className="text-2xl font-bold text-white mb-4">Premium Account Active!</h2>
                <p className="text-green-200 mb-6">
                  Your account is already activated with premium features. Enjoy unlimited access to all platform features!
                </p>
                <div className="grid grid-cols-2 gap-4 text-center">
                  <div className="bg-white/10 rounded-lg p-4">
                    <p className="text-3xl font-bold text-green-400">∞</p>
                    <p className="text-green-200 text-sm">Unlimited Tests</p>
                  </div>
                  <div className="bg-white/10 rounded-lg p-4">
                    <p className="text-3xl font-bold text-yellow-400">👑</p>
                    <p className="text-yellow-200 text-sm">Premium Member</p>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>
        ) : (
          <div className="grid lg:grid-cols-2 gap-8">
            {/* Activation Form */}
            <Card className="bg-white/10 backdrop-blur-lg border-white/20 shadow-2xl">
              <CardHeader>
                <CardTitle className="text-2xl font-bold text-white text-center flex items-center justify-center">
                  <Key className="h-6 w-6 mr-2" />
                  Enter Activation Code
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-6">
                {/* Current Status */}
                <div className="bg-yellow-500/20 border border-yellow-500/30 rounded-lg p-4">
                  <div className="flex items-center mb-2">
                    <AlertCircle className="h-5 w-5 text-yellow-400 mr-2" />
                    <h3 className="font-semibold text-white">Current Status: Free Account</h3>
                  </div>
                  <p className="text-yellow-100 text-sm">
                    You have limited access. Activate premium to unlock all features.
                  </p>
                </div>

                {/* WhatsApp Contact */}
                <div className="bg-green-500/20 border border-green-500/30 rounded-lg p-4">
                  <div className="flex items-center mb-3">
                    <MessageCircle className="h-6 w-6 text-green-400 mr-2" />
                    <h3 className="font-semibold text-white">Get Your Activation Code</h3>
                  </div>
                  <p className="text-green-100 text-sm mb-4">
                    Contact us on WhatsApp to purchase your premium activation code
                  </p>
                  
                  <div className="bg-green-600/20 rounded-lg p-3 mb-4">
                    <p className="text-green-100 text-sm font-medium">Available Contact Numbers:</p>
                    <p className="text-green-200 text-xs">+234 803 989 6597</p>
                    <p className="text-green-200 text-xs">+234 814 880 4813</p>
                    <p className="text-green-200 text-xs">+234 707 566 3318</p>
                  </div>

                  <div className="space-y-2">
                    <a
                      href={`https://wa.me/2348039896597?text=${whatsappMessage}`}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="inline-flex items-center w-full justify-center bg-green-500 hover:bg-green-600 text-white font-semibold py-3 px-4 rounded-lg transition-colors"
                    >
                      <MessageCircle className="h-5 w-5 mr-2" />
                      Contact via WhatsApp
                    </a>
                    <p className="text-green-200 text-xs text-center">
                      Click to send a message and get your activation code
                    </p>
                  </div>
                </div>

                {/* Activation Form */}
                <form onSubmit={handleActivation} className="space-y-4">
                  <div className="space-y-2">
                    <Label htmlFor="activationCode" className="text-white">
                      Premium Activation Code
                    </Label>
                    <div className="relative">
                      <Key className="absolute left-3 top-1/2 transform -translate-y-1/2 h-5 w-5 text-purple-300" />
                      <Input
                        id="activationCode"
                        type="text"
                        placeholder="Enter your 7-digit activation code"
                        value={activationCode}
                        onChange={(e) => setActivationCode(e.target.value)}
                        className="pl-10 bg-white/20 border-white/30 text-white placeholder:text-purple-200 focus:border-purple-400 focus:ring-purple-400"
                        required
                      />
                    </div>
                    <p className="text-sm text-purple-200">
                      Enter the activation code you received after purchase
                    </p>
                  </div>

                  <Button
                    type="submit"
                    disabled={isLoading || !activationCode.trim()}
                    className="w-full bg-gradient-to-r from-yellow-500 to-orange-500 hover:from-yellow-600 hover:to-orange-600 text-white font-semibold py-3 disabled:opacity-50"
                  >
                    {isLoading ? (
                      <>
                        <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-white mr-2"></div>
                        Activating...
                      </>
                    ) : (
                      <>
                        <Crown className="h-5 w-5 mr-2" />
                        Activate Premium Access
                      </>
                    )}
                  </Button>
                </form>
              </CardContent>
            </Card>

            {/* Premium Features */}
            <div className="space-y-6">
              <Card className="bg-gradient-to-r from-yellow-500/20 to-orange-500/20 border-yellow-500/30">
                <CardHeader>
                  <CardTitle className="text-white text-center flex items-center justify-center">
                    <Crown className="h-6 w-6 mr-2 text-yellow-400" />
                    Premium Features
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="space-y-4">
                    {premiumFeatures.map((feature, index) => (
                      <div key={index} className="flex items-start space-x-3">
                        <div className="flex-shrink-0 w-8 h-8 bg-gradient-to-r from-yellow-500 to-orange-500 rounded-full flex items-center justify-center">
                          <feature.icon className="h-4 w-4 text-white" />
                        </div>
                        <div>
                          <h4 className="text-white font-medium">{feature.title}</h4>
                          <p className="text-yellow-200 text-sm">{feature.description}</p>
                        </div>
                      </div>
                    ))}
                  </div>
                </CardContent>
              </Card>

              <Card className="bg-white/10 backdrop-blur-lg border-white/20">
                <CardHeader>
                  <CardTitle className="text-white text-center">
                    Why Choose Premium?
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="space-y-4 text-center">
                    <div className="grid grid-cols-2 gap-4">
                      <div className="bg-white/10 rounded-lg p-4">
                        <p className="text-3xl font-bold text-red-400">3</p>
                        <p className="text-red-200 text-sm">Free Attempts Only</p>
                      </div>
                      <div className="bg-white/10 rounded-lg p-4">
                        <p className="text-3xl font-bold text-green-400">∞</p>
                        <p className="text-green-200 text-sm">Premium Unlimited</p>
                      </div>
                    </div>
                    <p className="text-white text-sm">
                      Upgrade now and never worry about limits again!
                    </p>
                  </div>
                </CardContent>
              </Card>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}