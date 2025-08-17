import React from 'react';
import { Button } from '@/components/ui/button';
import { ArrowLeft, Home } from 'lucide-react';

interface NavigationProps {
  onBack?: () => void;
  onHome?: () => void;
  showBack?: boolean;
  showHome?: boolean;
  title?: string;
  backText?: string;
  homeText?: string;
}

export default function Navigation({
  onBack,
  onHome,
  showBack = true,
  showHome = true,
  title,
  backText = "Back",
  homeText = "Home"
}: NavigationProps) {
  return (
    <div className="flex items-center justify-between mb-6">
      <div className="flex items-center space-x-3">
        {showBack && onBack && (
          <Button
            onClick={onBack}
            variant="ghost"
            className="text-white hover:bg-white/10"
          >
            <ArrowLeft className="h-4 w-4 mr-2" />
            {backText}
          </Button>
        )}
        {showHome && onHome && (
          <Button
            onClick={onHome}
            variant="outline"
            className="border-white/30 text-white hover:bg-white/10"
          >
            <Home className="h-4 w-4 mr-2" />
            {homeText}
          </Button>
        )}
      </div>
      
      {title && (
        <h1 className="text-xl font-bold text-white">{title}</h1>
      )}
      
      <div />
    </div>
  );
}