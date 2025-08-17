import React, { useEffect, useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Trophy, Star, Clock, Target, ArrowLeft, RotateCcw, Eye, BookOpen } from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';

interface QuizSuccessAnimationProps {
  score: number;
  correctAnswers: number;
  totalQuestions: number;
  timeSpent: number;
  subjectName: string;
  onContinue: () => void;
  onRetake: () => void;
  onReviewAnswers: () => void;
}

export default function QuizSuccessAnimation({
  score,
  correctAnswers,
  totalQuestions,
  timeSpent,
  subjectName,
  onContinue,
  onRetake,
  onReviewAnswers
}: QuizSuccessAnimationProps) {
  const [showConfetti, setShowConfetti] = useState(true);
  const [animationStep, setAnimationStep] = useState(0);

  const formatTime = (seconds: number) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins}m ${secs}s`;
  };

  const getPerformanceMessage = () => {
    if (score >= 90) return { message: "Outstanding Performance!", color: "text-green-400", emoji: "🏆" };
    if (score >= 80) return { message: "Excellent Work!", color: "text-blue-400", emoji: "⭐" };
    if (score >= 70) return { message: "Good Job!", color: "text-yellow-400", emoji: "👍" };
    if (score >= 60) return { message: "Keep Practicing!", color: "text-orange-400", emoji: "📚" };
    return { message: "Don't Give Up!", color: "text-red-400", emoji: "💪" };
  };

  const performance = getPerformanceMessage();

  useEffect(() => {
    const timers = [
      setTimeout(() => setAnimationStep(1), 500),
      setTimeout(() => setAnimationStep(2), 1000),
      setTimeout(() => setAnimationStep(3), 1500),
      setTimeout(() => setShowConfetti(false), 5000)
    ];

    return () => timers.forEach(clearTimeout);
  }, []);

  // Simple confetti component
  const Confetti = () => (
    <div className="fixed inset-0 pointer-events-none z-50">
      {Array.from({ length: 50 }).map((_, i) => (
        <motion.div
          key={i}
          className="absolute w-2 h-2 bg-yellow-400 rounded-full"
          initial={{
            x: Math.random() * window.innerWidth,
            y: -10,
            rotation: 0,
            opacity: 1
          }}
          animate={{
            y: window.innerHeight + 10,
            rotation: 360,
            opacity: 0
          }}
          transition={{
            duration: 3 + Math.random() * 2,
            delay: Math.random() * 2,
            ease: "easeOut"
          }}
          style={{
            backgroundColor: ['#FFD700', '#FF6B6B', '#4ECDC4', '#45B7D1', '#96CEB4'][Math.floor(Math.random() * 5)]
          }}
        />
      ))}
    </div>
  );

  return (
    <div className="min-h-screen bg-gradient-to-br from-purple-900 via-blue-900 to-indigo-900 flex items-center justify-center p-4">
      {showConfetti && <Confetti />}
      
      <div className="max-w-2xl w-full space-y-8">
        {/* Main Success Card */}
        <motion.div
          initial={{ scale: 0, opacity: 0 }}
          animate={{ scale: 1, opacity: 1 }}
          transition={{ duration: 0.8, type: "spring", bounce: 0.4 }}
        >
          <Card className="bg-gradient-to-br from-green-500/20 to-blue-500/20 border-green-400/30 backdrop-blur-md">
            <CardHeader className="text-center pb-4">
              <motion.div
                initial={{ scale: 0 }}
                animate={{ scale: 1 }}
                transition={{ delay: 0.3, duration: 0.5 }}
                className="mx-auto w-24 h-24 bg-green-500/20 rounded-full flex items-center justify-center mb-4"
              >
                <Trophy className="w-12 h-12 text-yellow-400" />
              </motion.div>
              
              <CardTitle className="text-3xl font-bold text-white mb-2">
                Quiz Complete!
              </CardTitle>
              
              <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.6 }}
                className={`text-xl font-semibold ${performance.color} flex items-center justify-center space-x-2`}
              >
                <span>{performance.emoji}</span>
                <span>{performance.message}</span>
              </motion.div>
            </CardHeader>

            <CardContent className="space-y-6">
              {/* Score Display */}
              <motion.div
                initial={{ opacity: 0, scale: 0.8 }}
                animate={animationStep >= 1 ? { opacity: 1, scale: 1 } : {}}
                transition={{ duration: 0.6 }}
                className="text-center"
              >
                <div className="text-6xl font-bold text-white mb-2">
                  {score}%
                </div>
                <p className="text-gray-300">Your Score</p>
              </motion.div>

              {/* Stats Grid */}
              <motion.div
                initial={{ opacity: 0, y: 30 }}
                animate={animationStep >= 2 ? { opacity: 1, y: 0 } : {}}
                transition={{ duration: 0.6 }}
                className="grid grid-cols-3 gap-4"
              >
                <div className="bg-white/10 rounded-lg p-4 text-center">
                  <div className="text-2xl font-bold text-green-400">{correctAnswers}</div>
                  <div className="text-sm text-gray-300">Correct</div>
                </div>
                <div className="bg-white/10 rounded-lg p-4 text-center">
                  <div className="text-2xl font-bold text-red-400">{totalQuestions - correctAnswers}</div>
                  <div className="text-sm text-gray-300">Wrong</div>
                </div>
                <div className="bg-white/10 rounded-lg p-4 text-center">
                  <div className="text-2xl font-bold text-blue-400">{formatTime(timeSpent)}</div>
                  <div className="text-sm text-gray-300">Time</div>
                </div>
              </motion.div>

              {/* Subject Badge */}
              <motion.div
                initial={{ opacity: 0 }}
                animate={animationStep >= 3 ? { opacity: 1 } : {}}
                transition={{ duration: 0.6 }}
                className="flex justify-center"
              >
                <Badge variant="secondary" className="bg-purple-600/30 text-purple-200 px-4 py-2 text-lg">
                  <BookOpen className="w-4 h-4 mr-2" />
                  {subjectName}
                </Badge>
              </motion.div>

              {/* Performance Insights */}
              <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={animationStep >= 3 ? { opacity: 1, y: 0 } : {}}
                transition={{ duration: 0.6, delay: 0.2 }}
                className="bg-white/5 rounded-lg p-4 space-y-2"
              >
                <h4 className="font-semibold text-white flex items-center space-x-2">
                  <Target className="w-4 h-4" />
                  <span>Performance Analysis</span>
                </h4>
                <div className="space-y-1 text-sm text-gray-300">
                  <div className="flex justify-between">
                    <span>Accuracy:</span>
                    <span className="text-white">{Math.round((correctAnswers / totalQuestions) * 100)}%</span>
                  </div>
                  <div className="flex justify-between">
                    <span>Average time per question:</span>
                    <span className="text-white">{Math.round(timeSpent / totalQuestions)}s</span>
                  </div>
                  <div className="flex justify-between">
                    <span>Grade:</span>
                    <span className={`font-semibold ${
                      score >= 90 ? 'text-green-400' :
                      score >= 80 ? 'text-blue-400' :
                      score >= 70 ? 'text-yellow-400' :
                      score >= 60 ? 'text-orange-400' : 'text-red-400'
                    }`}>
                      {score >= 90 ? 'A+' : score >= 80 ? 'A' : score >= 70 ? 'B' : score >= 60 ? 'C' : 'F'}
                    </span>
                  </div>
                </div>
              </motion.div>
            </CardContent>
          </Card>
        </motion.div>

        {/* Action Buttons */}
        <motion.div
          initial={{ opacity: 0, y: 30 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 1.8, duration: 0.6 }}
          className="grid grid-cols-1 md:grid-cols-3 gap-4"
        >
          <Button
            onClick={onReviewAnswers}
            variant="outline"
            className="border-blue-400/50 text-blue-300 hover:bg-blue-400/20 flex items-center justify-center space-x-2"
          >
            <Eye className="w-4 h-4" />
            <span>Review Answers</span>
          </Button>
          
          <Button
            onClick={onRetake}
            variant="outline"
            className="border-yellow-400/50 text-yellow-300 hover:bg-yellow-400/20 flex items-center justify-center space-x-2"
          >
            <RotateCcw className="w-4 h-4" />
            <span>Retake Quiz</span>
          </Button>
          
          <Button
            onClick={onContinue}
            className="bg-gradient-to-r from-green-600 to-blue-600 hover:from-green-700 hover:to-blue-700 text-white flex items-center justify-center space-x-2"
          >
            <ArrowLeft className="w-4 h-4" />
            <span>Continue Learning</span>
          </Button>
        </motion.div>

        {/* Motivational Message */}
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 2.2, duration: 0.8 }}
          className="text-center"
        >
          <p className="text-gray-300 text-sm">
            {score >= 80 
              ? "Excellent work! Keep up the great momentum in your studies."
              : score >= 60
              ? "Good progress! Continue practicing to improve your performance."
              : "Don't worry! Every attempt is a step forward. Keep practicing and you'll improve."}
          </p>
        </motion.div>
      </div>
    </div>
  );
}