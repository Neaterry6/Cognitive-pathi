import { useState, useEffect, useCallback } from 'react';

export function useTimer(initialTime: number, onTimeUp?: () => void) {
  const [timeLeft, setTimeLeft] = useState(initialTime);
  const [isRunning, setIsRunning] = useState(false);
  const [startTime, setStartTime] = useState<number | null>(null);

  const start = useCallback(() => {
    setIsRunning(true);
    setStartTime(Date.now());
  }, []);

  const pause = useCallback(() => {
    setIsRunning(false);
  }, []);

  const reset = useCallback((newTime?: number) => {
    setIsRunning(false);
    setTimeLeft(newTime ?? initialTime);
    setStartTime(null);
  }, [initialTime]);

  const getElapsedTime = useCallback(() => {
    if (startTime) {
      return Math.floor((Date.now() - startTime) / 1000);
    }
    return 0;
  }, [startTime]);

  useEffect(() => {
    if (!isRunning) return;

    const interval = setInterval(() => {
      setTimeLeft(prev => {
        if (prev <= 1) {
          setIsRunning(false);
          onTimeUp?.();
          return 0;
        }
        return prev - 1;
      });
    }, 1000);

    return () => clearInterval(interval);
  }, [isRunning, onTimeUp]);

  const formatTime = useCallback((seconds: number) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
  }, []);

  return {
    timeLeft,
    isRunning,
    start,
    pause,
    reset,
    getElapsedTime,
    formatTime: () => formatTime(timeLeft),
    formatElapsed: () => formatTime(getElapsedTime()),
  };
}
