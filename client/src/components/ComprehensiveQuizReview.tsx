import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { ArrowLeft, CheckCircle, XCircle, Brain, Lightbulb, ChevronLeft, ChevronRight, Clock, Award, Target, TrendingUp } from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import { useMutation } from '@tanstack/react-query';

interface Question {
  id: string;
  question: string;
  options: Array<{ id: string; text: string; }>;
  correctAnswer: string;
  explanation?: string;
  imageUrl?: string;
  year?: string;
  examType?: string;
}

interface ComprehensiveQuizReviewProps {
  questions: Question[];
  userAnswers: Record<string, string>;
  score: number;
  correctAnswers: number;
  totalQuestions: number;
  timeSpent: number;
  subjectName: string;
  onBack: () => void;
  onRetakeQuiz: () => void;
  onContinueLearning: () => void;
}

export default function ComprehensiveQuizReview({
  questions,
  userAnswers,
  score,
  correctAnswers,
  totalQuestions,
  timeSpent,
  subjectName,
  onBack,
  onRetakeQuiz,
  onContinueLearning
}: ComprehensiveQuizReviewProps) {
  const [currentQuestionIndex, setCurrentQuestionIndex] = useState(0);
  const [explanations, setExplanations] = useState<Record<string, string>>({});
  const [loadingExplanation, setLoadingExplanation] = useState<string | null>(null);
  const [showDetailedView, setShowDetailedView] = useState(false);

  const currentQuestion = questions[currentQuestionIndex];
  const userAnswer = userAnswers[currentQuestion?.id];
  const isCorrect = userAnswer === currentQuestion?.correctAnswer;

  const formatTime = (seconds: number) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins}m ${secs}s`;
  };

  // Enhanced AI Explanation Generation (using the backend API with Kaiz GPT-4 support)
  const generateAIExplanation = async (question: Question, userAnswer: string) => {
    if (loadingExplanation === question.id) return;
    
    setLoadingExplanation(question.id);
    
    try {
      // Enhanced API call with better data structure for AI explanations
      const response = await fetch('/api/quiz/explanation', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          questionId: question.id,
          question: question.question,
          correctAnswer: question.correctAnswer,
          userAnswer: userAnswer || 'No answer selected',
          options: question.options.map(opt => ({
            id: opt.id || opt.text.charAt(0),
            text: opt.text
          })),
          subject: subjectName,
          userId: 'review-user'
        }),
      });

      if (!response.ok) {
        throw new Error('Backend API failed');
      }

      const data = await response.json();
      
      setExplanations(prev => ({
        ...prev,
        [question.id]: data.explanation || 'Explanation could not be generated at this time.'
      }));
    } catch (error) {
      console.error('Error generating explanation:', error);
      
      // Fallback to direct API call if backend fails
      try {
        const prompt = `You are an expert tutor for Nigerian examinations (JAMB, WAEC, NECO, POST-UTME). Provide a detailed educational explanation for this ${subjectName} question, suitable for a student preparing for the exam. Include why the correct answer is right, why other options are incorrect, and address common misconceptions. Keep the tone clear, concise, and engaging. Do not use markdown formatting.

Question: "${question.question}"
Options:
${question.options.map((opt, idx) => `${String.fromCharCode(65 + idx)}) ${opt.text}`).join('\n')}
Correct Answer: ${question.correctAnswer}
Student's Answer: ${userAnswer || 'No answer selected'}

Explanation should be 150-300 words, structured with an introduction, explanation of the correct answer, analysis of incorrect options, and a summary of key takeaways.`;

        const fallbackResponse = await fetch(`https://kaiz-apis.gleeze.com/api/gpt-4.1?ask=${encodeURIComponent(prompt)}&uid=1268&apikey=a0ebe80e-bf1a-4dbf-8d36-6935b1bfa5ea`);
        
        if (fallbackResponse.ok) {
          const fallbackData = await fallbackResponse.json();
          const cleanedResponse = fallbackData.response
            ?.replace(/\*\*|\*|_|\#\#/g, '')
            .replace(/\n\s*\n/g, '\n')
            .replace(/^\s+|\s+$/g, '')
            .replace(/```/g, '');
          
          if (cleanedResponse) {
            setExplanations(prev => ({
              ...prev,
              [question.id]: cleanedResponse + `\n\nCorrect Answer: ${question.correctAnswer}`
            }));
            return;
          }
        }
      } catch (fallbackError) {
        console.error('Fallback API also failed:', fallbackError);
      }
      
      // Final fallback
      setExplanations(prev => ({
        ...prev,
        [question.id]: `The correct answer is ${question.correctAnswer}. This question tests fundamental concepts in ${subjectName}. Review your study materials for better understanding of this topic.`
      }));
    } finally {
      setLoadingExplanation(null);
    }
  };

  const getPerformanceLevel = () => {
    if (score >= 80) return { level: 'Excellent', color: 'bg-green-500', message: 'Outstanding performance!' };
    if (score >= 70) return { level: 'Good', color: 'bg-blue-500', message: 'Well done!' };
    if (score >= 50) return { level: 'Average', color: 'bg-yellow-500', message: 'Keep practicing!' };
    return { level: 'Needs Improvement', color: 'bg-red-500', message: 'More study needed!' };
  };

  const performance = getPerformanceLevel();

  // Confetti effect for good scores
  const showConfetti = () => {
    if (score >= 70) {
      const confettiContainer = document.createElement('div');
      confettiContainer.style.position = 'fixed';
      confettiContainer.style.top = '0';
      confettiContainer.style.left = '0';
      confettiContainer.style.width = '100vw';
      confettiContainer.style.height = '100vh';
      confettiContainer.style.pointerEvents = 'none';
      confettiContainer.style.zIndex = '9999';
      document.body.appendChild(confettiContainer);

      for (let i = 0; i < 50; i++) {
        const confetti = document.createElement('div');
        confetti.style.position = 'absolute';
        confetti.style.width = '10px';
        confetti.style.height = '10px';
        confetti.style.left = `${Math.random() * 100}vw`;
        confetti.style.background = ['#f00', '#0f0', '#00f', '#ff0', '#f0f', '#0ff'][Math.floor(Math.random() * 6)];
        confetti.style.animation = `fall 3s linear infinite`;
        confetti.style.animationDelay = `${Math.random() * 2}s`;
        confettiContainer.appendChild(confetti);
        
        setTimeout(() => confetti.remove(), 3000);
      }
      
      setTimeout(() => confettiContainer.remove(), 3000);
    }
  };

  useEffect(() => {
    showConfetti();
    
    // Add CSS animation for confetti
    const style = document.createElement('style');
    style.textContent = `
      @keyframes fall {
        0% { transform: translateY(-100vh) rotate(0deg); }
        100% { transform: translateY(100vh) rotate(360deg); }
      }
    `;
    document.head.appendChild(style);
    
    return () => {
      document.head.removeChild(style);
    };
  }, []);

  if (!showDetailedView) {
    // Results overview screen
    return (
      <div className="min-h-screen bg-gradient-to-br from-indigo-900 via-purple-900 to-pink-800 p-4">
        <div className="max-w-4xl mx-auto">
          {/* Header */}
          <div className="flex items-center justify-between mb-6">
            <Button
              onClick={onBack}
              variant="ghost"
              className="text-white hover:bg-white/10"
            >
              <ArrowLeft className="h-4 w-4 mr-2" />
              Back to Dashboard
            </Button>
            <h1 className="text-2xl font-bold text-white">Quiz Results</h1>
            <div />
          </div>

          {/* Success Animation */}
          <motion.div
            initial={{ scale: 0.8, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            transition={{ duration: 0.6, ease: "easeOut" }}
            className="text-center mb-8"
          >
            <motion.div
              initial={{ rotate: -180, scale: 0 }}
              animate={{ rotate: 0, scale: 1 }}
              transition={{ delay: 0.3, duration: 0.8, type: "spring" }}
              className={`inline-flex items-center justify-center w-24 h-24 rounded-full ${performance.color} mb-4`}
            >
              <Award className="h-12 w-12 text-white" />
            </motion.div>
            <h2 className="text-3xl font-bold text-white mb-2">{performance.message}</h2>
            <p className="text-lg text-purple-200">{performance.level} Performance</p>
          </motion.div>

          {/* Score Cards */}
          <div className="grid md:grid-cols-3 gap-6 mb-8">
            <Card className="bg-white/10 backdrop-blur-lg border-white/20">
              <CardContent className="p-6 text-center">
                <Target className="h-8 w-8 text-green-400 mx-auto mb-3" />
                <div className="text-3xl font-bold text-white mb-1">{score}%</div>
                <div className="text-purple-200">Final Score</div>
              </CardContent>
            </Card>

            <Card className="bg-white/10 backdrop-blur-lg border-white/20">
              <CardContent className="p-6 text-center">
                <CheckCircle className="h-8 w-8 text-blue-400 mx-auto mb-3" />
                <div className="text-3xl font-bold text-white mb-1">{correctAnswers}/{totalQuestions}</div>
                <div className="text-purple-200">Correct Answers</div>
              </CardContent>
            </Card>

            <Card className="bg-white/10 backdrop-blur-lg border-white/20">
              <CardContent className="p-6 text-center">
                <Clock className="h-8 w-8 text-yellow-400 mx-auto mb-3" />
                <div className="text-3xl font-bold text-white mb-1">{formatTime(timeSpent)}</div>
                <div className="text-purple-200">Time Spent</div>
              </CardContent>
            </Card>
          </div>

          {/* Progress Bar */}
          <Card className="bg-white/10 backdrop-blur-lg border-white/20 mb-8">
            <CardContent className="p-6">
              <div className="flex items-center justify-between mb-3">
                <span className="text-white font-medium">Overall Performance</span>
                <span className="text-white font-bold">{score}%</span>
              </div>
              <Progress value={score} className="h-3" />
            </CardContent>
          </Card>

          {/* Action Buttons */}
          <div className="flex flex-col sm:flex-row gap-4 justify-center">
            <Button
              onClick={() => setShowDetailedView(true)}
              className="bg-blue-600 hover:bg-blue-700 text-white px-8 py-3"
            >
              <Brain className="h-5 w-5 mr-2" />
              Review Answers with AI
            </Button>
            
            <Button
              onClick={onRetakeQuiz}
              variant="outline"
              className="border-white/30 text-white hover:bg-white/10 px-8 py-3"
            >
              <TrendingUp className="h-5 w-5 mr-2" />
              Retake Quiz
            </Button>
            
            <Button
              onClick={onContinueLearning}
              variant="outline"
              className="border-white/30 text-white hover:bg-white/10 px-8 py-3"
            >
              Continue Learning
            </Button>
          </div>

          {/* Quick Summary */}
          <Card className="bg-white/10 backdrop-blur-lg border-white/20 mt-8">
            <CardHeader>
              <CardTitle className="text-white">Quick Summary</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-2 gap-4 text-purple-200">
                <div>Subject: <span className="text-white font-medium">{subjectName}</span></div>
                <div>Questions: <span className="text-white font-medium">{totalQuestions}</span></div>
                <div>Accuracy: <span className="text-white font-medium">{Math.round((correctAnswers / totalQuestions) * 100)}%</span></div>
                <div>Grade: <span className="text-white font-medium">{performance.level}</span></div>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    );
  }

  // Detailed question review
  return (
    <div className="min-h-screen bg-gradient-to-br from-indigo-900 via-purple-900 to-pink-800 p-4">
      <div className="max-w-4xl mx-auto">
        {/* Header with Back and Cancel buttons */}
        <div className="flex items-center justify-between mb-6">
          <div className="flex items-center space-x-3">
            <Button
              onClick={() => setShowDetailedView(false)}
              variant="ghost"
              className="text-white hover:bg-white/10"
            >
              <ArrowLeft className="h-4 w-4 mr-2" />
              Back to Results
            </Button>
            <Button
              onClick={onBack}
              variant="outline"
              className="border-red-500/50 text-red-200 hover:bg-red-500/20"
            >
              Cancel Review
            </Button>
          </div>
          <h1 className="text-xl font-bold text-white">Question Review</h1>
          <Badge variant="secondary" className="bg-white/10 text-white">
            {currentQuestionIndex + 1} / {totalQuestions}
          </Badge>
        </div>

        {/* Progress */}
        <div className="mb-6">
          <Progress value={((currentQuestionIndex + 1) / totalQuestions) * 100} className="h-2" />
        </div>

        {/* Current Question */}
        <Card className="bg-white/10 backdrop-blur-lg border-white/20 mb-6">
          <CardContent className="p-6">
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-lg font-bold text-white">Question {currentQuestionIndex + 1}</h2>
              <div className="flex items-center space-x-2">
                {isCorrect ? (
                  <CheckCircle className="h-6 w-6 text-green-400" />
                ) : (
                  <XCircle className="h-6 w-6 text-red-400" />
                )}
                <Badge variant={isCorrect ? "default" : "destructive"}>
                  {isCorrect ? 'Correct' : 'Incorrect'}
                </Badge>
              </div>
            </div>

            <p className="text-white text-lg mb-6">{currentQuestion?.question}</p>

            {/* Answer Options */}
            <div className="space-y-3 mb-6">
              {currentQuestion?.options.map((option) => {
                const isUserChoice = userAnswer === option.id;
                const isCorrectChoice = currentQuestion?.correctAnswer === option.id;
                
                let bgColor = 'bg-gray-700';
                if (isCorrectChoice) bgColor = 'bg-green-600';
                else if (isUserChoice && !isCorrectChoice) bgColor = 'bg-red-600';

                return (
                  <div key={option.id} className={`p-4 rounded-lg ${bgColor} text-white`}>
                    <div className="flex items-center justify-between">
                      <span><strong>{option.id.toUpperCase()}</strong>. {option.text}</span>
                      <div className="flex space-x-2">
                        {isUserChoice && <Badge variant="outline">Your Answer</Badge>}
                        {isCorrectChoice && <Badge className="bg-green-500">Correct Answer</Badge>}
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>

            {/* AI Explanation Section */}
            <div className="border-t border-white/20 pt-6">
              <div className="flex items-center justify-between mb-4">
                <h3 className="text-white font-bold flex items-center">
                  <Brain className="h-5 w-5 mr-2 text-blue-400" />
                  AI Explanation
                </h3>
                <Button
                  onClick={() => generateAIExplanation(currentQuestion, userAnswer)}
                  disabled={loadingExplanation === currentQuestion.id}
                  className="bg-blue-600 hover:bg-blue-700 text-white"
                  size="sm"
                >
                  <Lightbulb className="h-4 w-4 mr-2" />
                  {explanations[currentQuestion.id] ? 'Regenerate' : 'Explain'}
                </Button>
              </div>

              {loadingExplanation === currentQuestion.id ? (
                <div className="bg-white/5 rounded-lg p-4 text-center">
                  <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-white mx-auto mb-2"></div>
                  <p className="text-purple-200">AI is generating explanation...</p>
                </div>
              ) : explanations[currentQuestion.id] ? (
                <div className="bg-blue-600/20 rounded-lg p-4">
                  <p className="text-white whitespace-pre-line">{explanations[currentQuestion.id]}</p>
                </div>
              ) : (
                <div className="bg-white/5 rounded-lg p-4 text-center">
                  <p className="text-purple-200">Click "Explain" to get AI-powered explanation for this question</p>
                </div>
              )}
            </div>
          </CardContent>
        </Card>

        {/* Navigation */}
        <div className="flex items-center justify-between">
          <Button
            onClick={() => setCurrentQuestionIndex(Math.max(0, currentQuestionIndex - 1))}
            disabled={currentQuestionIndex === 0}
            variant="outline"
            className="border-white/30 text-white hover:bg-white/10"
          >
            <ChevronLeft className="h-4 w-4 mr-2" />
            Previous
          </Button>

          <span className="text-white">
            Question {currentQuestionIndex + 1} of {totalQuestions}
          </span>

          <Button
            onClick={() => setCurrentQuestionIndex(Math.min(totalQuestions - 1, currentQuestionIndex + 1))}
            disabled={currentQuestionIndex === totalQuestions - 1}
            variant="outline"
            className="border-white/30 text-white hover:bg-white/10"
          >
            Next
            <ChevronRight className="h-4 w-4 ml-2" />
          </Button>
        </div>
      </div>
    </div>
  );
}