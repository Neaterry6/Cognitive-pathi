import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { ArrowLeft, CheckCircle, XCircle, Brain, Lightbulb, ChevronLeft, ChevronRight, Clock } from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import { apiRequest } from '@/lib/queryClient';

interface Question {
  id: string;
  question: string;
  options: Array<{ id: string; text: string }>;
  correctAnswer: string;
  explanation?: string;
  imageUrl?: string;
  year?: string;
  examType?: string;
}

interface QuizReviewSectionProps {
  questions: Question[];
  userAnswers: Record<string, string>;
  score: number;
  correctAnswers: number;
  totalQuestions: number;
  timeSpent: number;
  subjectName: string;
  onBack: () => void;
}

export default function QuizReviewSection({
  questions,
  userAnswers,
  score,
  correctAnswers,
  totalQuestions,
  timeSpent,
  subjectName,
  onBack
}: QuizReviewSectionProps) {
  const [currentQuestionIndex, setCurrentQuestionIndex] = useState(0);
  const [explainedQuestions, setExplainedQuestions] = useState<Set<string>>(new Set());
  const queryClient = useQueryClient();

  // Generate AI explanation mutation
  const generateExplanationMutation = useMutation({
    mutationFn: async (questionData: any) => {
      const response = await apiRequest('POST', '/api/explained-questions', questionData);
      return await response.json();
    },
    onSuccess: (data, variables) => {
      setExplainedQuestions(prev => new Set(prev).add(variables.questionId));
      queryClient.invalidateQueries({ queryKey: ['/api/explained-questions'] });
    },
  });

  const currentQuestion = questions[currentQuestionIndex];
  const userAnswer = userAnswers[currentQuestion?.id];
  const isCorrect = userAnswer === currentQuestion?.correctAnswer;

  const formatTime = (seconds: number) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins}m ${secs}s`;
  };

  const handleGenerateExplanation = () => {
    if (!currentQuestion) return;

    const questionData = {
      questionId: currentQuestion.id,
      question: currentQuestion.question,
      options: currentQuestion.options,
      correctAnswer: currentQuestion.correctAnswer,
      userAnswer: userAnswer,
      isCorrect: isCorrect,
      subject: subjectName,
      difficulty: 'medium' // Default difficulty
    };

    generateExplanationMutation.mutate(questionData);
  };

  const handlePreviousQuestion = () => {
    if (currentQuestionIndex > 0) {
      setCurrentQuestionIndex(currentQuestionIndex - 1);
    }
  };

  const handleNextQuestion = () => {
    if (currentQuestionIndex < questions.length - 1) {
      setCurrentQuestionIndex(currentQuestionIndex + 1);
    }
  };

  const getQuestionStats = () => {
    const correct = questions.filter((q, index) => userAnswers[q.id] === q.correctAnswer).length;
    const wrong = questions.filter((q, index) => userAnswers[q.id] && userAnswers[q.id] !== q.correctAnswer).length;
    const unanswered = questions.filter((q, index) => !userAnswers[q.id]).length;
    
    return { correct, wrong, unanswered };
  };

  const stats = getQuestionStats();

  if (!currentQuestion) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-purple-900 via-blue-900 to-indigo-900 flex items-center justify-center">
        <Card className="bg-white/10 border-white/20">
          <CardContent className="p-8 text-center">
            <p className="text-white text-lg">No questions to review</p>
            <Button onClick={onBack} className="mt-4">
              <ArrowLeft className="w-4 h-4 mr-2" />
              Go Back
            </Button>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-purple-900 via-blue-900 to-indigo-900 p-4">
      {/* Header */}
      <div className="max-w-4xl mx-auto mb-6">
        <Card className="bg-black/20 border-white/10 backdrop-blur-md">
          <CardHeader>
            <div className="flex items-center justify-between">
              <div>
                <CardTitle className="text-white flex items-center space-x-2">
                  <Brain className="h-5 w-5" />
                  <span>Quiz Review - {subjectName}</span>
                </CardTitle>
                <p className="text-gray-300 mt-1">
                  Review your answers and get AI explanations
                </p>
              </div>
              <Button 
                variant="outline" 
                onClick={onBack}
                className="border-white/30 text-white hover:bg-white/10"
              >
                <ArrowLeft className="w-4 h-4 mr-2" />
                Back
              </Button>
            </div>
            
            {/* Stats Summary */}
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mt-4">
              <div className="bg-green-500/20 rounded-lg p-3 text-center">
                <div className="text-lg font-bold text-green-400">{stats.correct}</div>
                <div className="text-xs text-green-300">Correct</div>
              </div>
              <div className="bg-red-500/20 rounded-lg p-3 text-center">
                <div className="text-lg font-bold text-red-400">{stats.wrong}</div>
                <div className="text-xs text-red-300">Wrong</div>
              </div>
              <div className="bg-gray-500/20 rounded-lg p-3 text-center">
                <div className="text-lg font-bold text-gray-400">{stats.unanswered}</div>
                <div className="text-xs text-gray-300">Skipped</div>
              </div>
              <div className="bg-blue-500/20 rounded-lg p-3 text-center">
                <div className="text-lg font-bold text-blue-400">{formatTime(timeSpent)}</div>
                <div className="text-xs text-blue-300">Total Time</div>
              </div>
            </div>
            
            <Progress 
              value={((currentQuestionIndex + 1) / questions.length) * 100} 
              className="mt-4" 
            />
          </CardHeader>
        </Card>
      </div>

      {/* Question Review */}
      <div className="max-w-4xl mx-auto space-y-6">
        <AnimatePresence mode="wait">
          <motion.div
            key={currentQuestionIndex}
            initial={{ opacity: 0, x: 20 }}
            animate={{ opacity: 1, x: 0 }}
            exit={{ opacity: 0, x: -20 }}
            transition={{ duration: 0.3 }}
          >
            <Card className="bg-black/20 border-white/10 backdrop-blur-md">
              <CardHeader>
                <div className="flex items-center justify-between">
                  <CardTitle className="text-white text-lg">
                    Question {currentQuestionIndex + 1} of {questions.length}
                  </CardTitle>
                  <div className="flex items-center space-x-2">
                    {currentQuestion.year && (
                      <Badge variant="secondary" className="bg-purple-600/30 text-purple-200">
                        {currentQuestion.year}
                      </Badge>
                    )}
                    {currentQuestion.examType && (
                      <Badge variant="secondary" className="bg-blue-600/30 text-blue-200">
                        {currentQuestion.examType.toUpperCase()}
                      </Badge>
                    )}
                    <Badge 
                      variant={isCorrect ? "default" : "destructive"}
                      className={isCorrect ? "bg-green-600 text-white" : "bg-red-600 text-white"}
                    >
                      {isCorrect ? (
                        <>
                          <CheckCircle className="w-3 h-3 mr-1" />
                          Correct
                        </>
                      ) : (
                        <>
                          <XCircle className="w-3 h-3 mr-1" />
                          {userAnswer ? 'Wrong' : 'Skipped'}
                        </>
                      )}
                    </Badge>
                  </div>
                </div>
              </CardHeader>
              <CardContent className="space-y-6">
                {/* Question Text */}
                <div>
                  <h3 className="text-lg font-medium text-white mb-4">
                    {currentQuestion.question}
                  </h3>
                  {currentQuestion.imageUrl && (
                    <img
                      src={currentQuestion.imageUrl}
                      alt="Question"
                      className="max-w-md mx-auto rounded-lg mb-4"
                    />
                  )}
                </div>

                {/* Options */}
                <div className="space-y-3">
                  {currentQuestion.options.map((option) => {
                    const isUserAnswer = userAnswer === option.id;
                    const isCorrectAnswer = currentQuestion.correctAnswer === option.id;
                    
                    let optionClass = "w-full p-4 rounded-lg border text-left transition-all ";
                    
                    if (isCorrectAnswer) {
                      optionClass += "bg-green-600/20 border-green-500 text-green-200";
                    } else if (isUserAnswer && !isCorrect) {
                      optionClass += "bg-red-600/20 border-red-500 text-red-200";
                    } else {
                      optionClass += "bg-gray-700/30 border-gray-600 text-gray-300";
                    }
                    
                    return (
                      <div key={option.id} className={optionClass}>
                        <div className="flex items-start space-x-3">
                          <span className="font-semibold">{option.id}.</span>
                          <span className="flex-1">{option.text}</span>
                          <div className="flex items-center space-x-2">
                            {isCorrectAnswer && (
                              <CheckCircle className="w-4 h-4 text-green-400" />
                            )}
                            {isUserAnswer && !isCorrect && (
                              <XCircle className="w-4 h-4 text-red-400" />
                            )}
                          </div>
                        </div>
                      </div>
                    );
                  })}
                </div>

                {/* Explanation Section */}
                <div className="bg-white/5 rounded-lg p-4">
                  <div className="flex items-center justify-between mb-3">
                    <h4 className="font-semibold text-white flex items-center space-x-2">
                      <Lightbulb className="w-4 h-4" />
                      <span>AI Explanation</span>
                    </h4>
                    
                    {!explainedQuestions.has(currentQuestion.id) && (
                      <Button
                        onClick={handleGenerateExplanation}
                        disabled={generateExplanationMutation.isPending}
                        size="sm"
                        className="bg-purple-600 hover:bg-purple-700"
                      >
                        {generateExplanationMutation.isPending ? (
                          <>
                            <div className="animate-spin rounded-full h-3 w-3 border-b-2 border-white mr-2"></div>
                            Generating...
                          </>
                        ) : (
                          <>
                            <Brain className="w-3 h-3 mr-1" />
                            Get Explanation
                          </>
                        )}
                      </Button>
                    )}
                  </div>
                  
                  {currentQuestion.explanation ? (
                    <p className="text-gray-300 text-sm leading-relaxed">
                      {currentQuestion.explanation}
                    </p>
                  ) : explainedQuestions.has(currentQuestion.id) ? (
                    <p className="text-gray-300 text-sm leading-relaxed">
                      AI explanation has been generated and saved to your explained questions.
                    </p>
                  ) : (
                    <p className="text-gray-400 text-sm italic">
                      Click "Get Explanation" to receive an AI-powered explanation for this question.
                    </p>
                  )}
                </div>
              </CardContent>
            </Card>
          </motion.div>
        </AnimatePresence>

        {/* Navigation */}
        <div className="flex justify-between items-center">
          <Button
            onClick={handlePreviousQuestion}
            disabled={currentQuestionIndex === 0}
            variant="outline"
            className="border-white/30 text-white hover:bg-white/10"
          >
            <ChevronLeft className="w-4 h-4 mr-2" />
            Previous
          </Button>

          <div className="text-white text-sm">
            {currentQuestionIndex + 1} of {questions.length}
          </div>

          <Button
            onClick={handleNextQuestion}
            disabled={currentQuestionIndex === questions.length - 1}
            variant="outline"
            className="border-white/30 text-white hover:bg-white/10"
          >
            Next
            <ChevronRight className="w-4 h-4 ml-2" />
          </Button>
        </div>

        {/* Quick Navigation */}
        <Card className="bg-black/20 border-white/10 backdrop-blur-md">
          <CardContent className="p-4">
            <h4 className="text-white font-semibold mb-3">Quick Navigation</h4>
            <div className="grid grid-cols-10 gap-2">
              {questions.map((question, index) => {
                const qUserAnswer = userAnswers[question.id];
                const qIsCorrect = qUserAnswer === question.correctAnswer;
                
                return (
                  <button
                    key={index}
                    onClick={() => setCurrentQuestionIndex(index)}
                    className={`w-8 h-8 rounded text-sm font-medium transition-all ${
                      index === currentQuestionIndex
                        ? 'bg-white text-black'
                        : qIsCorrect
                        ? 'bg-green-600 text-white hover:bg-green-700'
                        : qUserAnswer
                        ? 'bg-red-600 text-white hover:bg-red-700'
                        : 'bg-gray-600 text-gray-300 hover:bg-gray-500'
                    }`}
                  >
                    {index + 1}
                  </button>
                );
              })}
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}