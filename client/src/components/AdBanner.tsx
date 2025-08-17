import React from 'react';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { X, ExternalLink } from 'lucide-react';

interface AdBannerProps {
  onClose?: () => void;
}

export default function AdBanner({ onClose }: AdBannerProps) {
  return (
    <Card className="fixed top-4 left-4 z-50 w-72 bg-gradient-to-r from-orange-500 to-pink-500 border-0 shadow-lg">
      <CardContent className="p-4 relative">
        {onClose && (
          <Button
            variant="ghost"
            size="sm"
            className="absolute top-2 right-2 text-white hover:bg-white hover:bg-opacity-20"
            onClick={onClose}
          >
            <X className="w-4 h-4" />
          </Button>
        )}
        
        <div className="text-center space-y-3">
          <div className="text-3xl">📚</div>
          <h3 className="text-white font-bold text-sm">UTME CBT Practice</h3>
          <p className="text-white text-xs opacity-90">
            Get unlimited access to past questions and CBT practice tests
          </p>
          <div className="space-y-2">
            <div className="bg-white bg-opacity-20 rounded-lg p-2">
              <p className="text-white text-xs font-semibold">Premium Features:</p>
              <ul className="text-white text-xs space-y-1 mt-1">
                <li>• Unlimited past questions</li>
                <li>• CBT timer practice</li>
                <li>• Detailed explanations</li>
                <li>• Progress tracking</li>
              </ul>
            </div>
            <Button 
              size="sm" 
              className="w-full bg-white text-orange-600 hover:bg-gray-100 text-xs"
            >
              <ExternalLink className="w-3 h-3 mr-1" />
              Activate Premium
            </Button>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}