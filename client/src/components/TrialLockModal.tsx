import React, { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Lock, MessageCircle, Gift, Star } from 'lucide-react';
import { toast } from '@/hooks/use-toast';

interface TrialLockModalProps {
  isOpen: boolean;
  onClose: () => void;
  onActivationSuccess: () => void;
  userId: string;
  trialsUsed: number;
}

export default function TrialLockModal({ 
  isOpen, 
  onClose, 
  onActivationSuccess, 
  userId, 
  trialsUsed 
}: TrialLockModalProps) {
  const [activationCode, setActivationCode] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);

  if (!isOpen) return null;

  const handleActivation = async () => {
    if (!activationCode.trim()) {
      toast({
        title: "Invalid Code",
        description: "Please enter an activation code",
        variant: "destructive"
      });
      return;
    }

    setIsSubmitting(true);
    
    try {
      const response = await fetch('/api/auth/activate', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          userId,
          activationCode: activationCode.trim()
        }),
      });

      const data = await response.json();

      if (response.ok) {
        toast({
          title: "Activation Successful! 🎉",
          description: "You now have unlimited access to all features!",
        });
        onActivationSuccess();
        onClose();
      } else {
        toast({
          title: "Invalid Activation Code",
          description: data.message || "Please check your code and try again",
          variant: "destructive"
        });
      }
    } catch (error) {
      toast({
        title: "Activation Failed",
        description: "Please check your internet connection and try again",
        variant: "destructive"
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleWhatsApp = () => {
    const message = `Hello! I need to purchase an activation code for CBT Learning Platform. My trials are exhausted (${trialsUsed}/3 used).`;
    const whatsappUrl = `https://wa.me/2348148809180?text=${encodeURIComponent(message)}`;
    window.open(whatsappUrl, '_blank');
  };

  return (
    <div className="fixed inset-0 bg-black/80 backdrop-blur-sm z-50 flex items-center justify-center p-4">
      <Card className="w-full max-w-md bg-gradient-to-br from-red-900 to-purple-900 border-red-500/50">
        <CardHeader className="text-center">
          <div className="mx-auto mb-4 w-16 h-16 bg-red-500/20 rounded-full flex items-center justify-center">
            <Lock className="w-8 h-8 text-red-400" />
          </div>
          <CardTitle className="text-white text-xl">Trial Limit Reached!</CardTitle>
          <Badge variant="destructive" className="mx-auto mt-2">
            {trialsUsed}/3 Free Trials Used
          </Badge>
        </CardHeader>

        <CardContent className="space-y-6">
          <div className="text-center text-gray-300">
            <p>You've used all your free quiz attempts.</p>
            <p className="mt-2">Upgrade to Premium for unlimited access!</p>
          </div>

          {/* Premium Features */}
          <div className="bg-white/10 rounded-lg p-4">
            <h3 className="text-white font-semibold mb-3 flex items-center">
              <Star className="w-4 h-4 mr-2 text-yellow-400" />
              Premium Features
            </h3>
            <ul className="text-sm text-gray-300 space-y-1">
              <li>• Unlimited quiz attempts</li>
              <li>• AI-powered explanations</li>
              <li>• All subjects & years (2001-2020)</li>
              <li>• Progress tracking & analytics</li>
              <li>• Priority support</li>
            </ul>
          </div>

          {/* Activation Code Input */}
          <div className="space-y-3">
            <Label htmlFor="activationCode" className="text-white">
              Enter Activation Code
            </Label>
            <Input
              id="activationCode"
              type="text"
              value={activationCode}
              onChange={(e) => setActivationCode(e.target.value.toUpperCase())}
              placeholder="Enter your code (e.g. 0814880)"
              className="bg-white/10 border-white/30 text-white placeholder:text-gray-400"
              maxLength={7}
            />
          </div>

          {/* Action Buttons */}
          <div className="space-y-3">
            <Button
              onClick={handleActivation}
              disabled={isSubmitting || !activationCode.trim()}
              className="w-full bg-green-600 hover:bg-green-700 text-white"
            >
              {isSubmitting ? (
                <>
                  <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2" />
                  Activating...
                </>
              ) : (
                <>
                  <Gift className="w-4 h-4 mr-2" />
                  Activate Premium
                </>
              )}
            </Button>

            <Button
              onClick={handleWhatsApp}
              variant="outline"
              className="w-full border-green-500/50 text-green-200 hover:bg-green-500/20"
            >
              <MessageCircle className="w-4 h-4 mr-2" />
              Buy Code via WhatsApp
            </Button>
          </div>

          {/* Contact Info */}
          <div className="text-center text-xs text-gray-400">
            <p>Contact: +234 814 880 9180</p>
            <p className="mt-1">Valid codes: 0814880, 0901918, 0803989</p>
          </div>

          {/* Close Button */}
          <Button
            onClick={onClose}
            variant="ghost"
            className="w-full text-gray-400 hover:text-white hover:bg-white/10"
          >
            Close
          </Button>
        </CardContent>
      </Card>
    </div>
  );
}