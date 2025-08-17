import React from 'react';
import { Clock } from 'lucide-react';

interface QuizTimerProps {
  timeLeft: number;
  formatTime: (seconds: number) => string;
  isRunning: boolean;
}

export default function QuizTimer({ timeLeft, formatTime, isRunning }: QuizTimerProps) {
  const isUrgent = timeLeft <= 300; // Last 5 minutes

  return (
    <div className={`flex items-center space-x-2 px-4 py-2 rounded-lg font-bold text-lg ${
      isUrgent 
        ? 'bg-red-600 text-white animate-pulse' 
        : 'bg-red-600 text-white'
    }`}>
      <Clock className="h-5 w-5" />
      <span>{formatTime(timeLeft)}</span>
      {!isRunning && (
        <span className="text-sm font-normal opacity-75">(Paused)</span>
      )}
    </div>
  );
}
