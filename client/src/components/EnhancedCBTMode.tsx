import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { ArrowLeft, Clock, Trophy, Brain, CheckCircle, XCircle, Calendar, BookOpen, Home } from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { apiRequest } from '@/lib/queryClient';
import QuizSuccessAnimation from './QuizSuccessAnimation';
import QuizReviewSection from './QuizReviewSection';
import ComprehensiveQuizReview from './ComprehensiveQuizReview';
import SuccessNotification from './SuccessNotification';
import TrialLockModal from './TrialLockModal';

interface Subject {
  id: string;
  name: string;
  emoji: string;
  description?: string;
}

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

interface EnhancedCBTModeProps {
  user: any;
  selectedSubject: Subject;
  onBack: () => void;
  onHome?: () => void;
}

interface QuizSession {
  id: string;
  questions: Question[];
  currentQuestionIndex: number;
  userAnswers: Record<string, string>;
  timeLeft: number;
  isStarted: boolean;
  isCompleted: boolean;
  score?: number;
  correctAnswers?: number;
  totalQuestions: number;
  selectedYear?: string;
  examType: string;
  mode: string;
}

export default function EnhancedCBTMode({ user, selectedSubject, onBack, onHome }: EnhancedCBTModeProps) {
  const [session, setSession] = useState<QuizSession | null>(null);
  const [selectedYear, setSelectedYear] = useState<string>('any');
  const [examType, setExamType] = useState<string>('utme');
  const [showResults, setShowResults] = useState(false);
  const [showTrialLock, setShowTrialLock] = useState(false);
  const [showReview, setShowReview] = useState(false);
  const [finalResults, setFinalResults] = useState<any>(null);
  const [showSuccessNotification, setShowSuccessNotification] = useState(false);
  const [notificationMessage, setNotificationMessage] = useState('');
  const [timeLeft, setTimeLeft] = useState(1800); // 30 minutes
  const [timerInterval, setTimerInterval] = useState<NodeJS.Timeout | null>(null);
  const queryClient = useQueryClient();

  // Fetch available years
  const { data: yearsData } = useQuery({
    queryKey: ['/api/quiz/available-years'],
    queryFn: async () => {
      const response = await apiRequest('GET', '/api/quiz/available-years');
      return await response.json();
    },
  });

  // Fetch available exam types
  const { data: examTypesData } = useQuery({
    queryKey: ['/api/quiz/available-exam-types'],
    queryFn: async () => {
      const response = await apiRequest('GET', '/api/quiz/available-exam-types');
      return await response.json();
    },
  });

  // Fetch questions mutation
  const fetchQuestionsMutation = useMutation({
    mutationFn: async ({ year, type }: { year?: string; type: string }) => {
      const params = new URLSearchParams({
        limit: '20',
        type,
      });
      if (year) params.append('year', year);
      
      const response = await apiRequest('GET', `/api/quiz/questions/${selectedSubject.id}?${params.toString()}`);
      return await response.json();
    },
    onSuccess: async (questions) => {
      if (questions && questions.length > 0) {
        // Create server session first
        const sessionData = {
          userId: user?.nickname || user?.id || 'anonymous',
          subjectId: selectedSubject.id,
          subjectName: selectedSubject.name,
          questions: questions.slice(0, 20),
          selectedYear,
          examType,
          mode: 'practice'
        };
        
        try {
          const serverSession = await createSessionMutation.mutateAsync(sessionData);
          
          const newSession: QuizSession = {
            id: serverSession.id,
            questions: questions.slice(0, 20),
            currentQuestionIndex: 0,
            userAnswers: {},
            timeLeft: 1800,
            isStarted: true,
            isCompleted: false,
            totalQuestions: Math.min(questions.length, 20),
            selectedYear,
            examType,
            mode: 'practice'
          };
          setSession(newSession);
          startTimer();
        } catch (error) {
          console.error('Failed to create session:', error);
          alert('Failed to start quiz. Please try again.');
        }
      }
    },
  });

  // Create session mutation
  const createSessionMutation = useMutation({
    mutationFn: async (sessionData: any) => {
      const response = await apiRequest('POST', '/api/quiz/create-session', sessionData);
      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.message || 'Failed to create session');
      }
      return await response.json();
    },
    onError: (error) => {
      console.error('Session creation error:', error);
      alert(`Failed to start quiz: ${error.message}`);
    },
  });

  // Submit quiz mutation
  const submitQuizMutation = useMutation({
    mutationFn: async (submissionData: any) => {
      const response = await apiRequest('POST', '/api/quiz/submit', submissionData);
      return await response.json();
    },
    onSuccess: (results) => {
      setFinalResults(results);
      setShowResults(true);
      stopTimer();
      
      // Show success notification
      setNotificationMessage(`Quiz submitted successfully! Great work!`);
      setShowSuccessNotification(true);
    },
  });

  const startTimer = () => {
    if (timerInterval) clearInterval(timerInterval);
    
    const interval = setInterval(() => {
      setTimeLeft((prevTime) => {
        if (prevTime <= 1) {
          handleSubmitQuiz();
          return 0;
        }
        return prevTime - 1;
      });
    }, 1000);
    
    setTimerInterval(interval);
  };

  const stopTimer = () => {
    if (timerInterval) {
      clearInterval(timerInterval);
      setTimerInterval(null);
    }
  };

  const formatTime = (seconds: number) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
  };

  const handleStartQuiz = () => {
    // Check trial limit for non-premium users
    if (!user?.isPremium && (user?.usageCount || 0) >= 3) {
      setShowTrialLock(true);
      return;
    }

    if (!examType) {
      alert('Please select an exam type');
      return;
    }

    const yearToUse = selectedYear === 'any' ? undefined : selectedYear;
    fetchQuestionsMutation.mutate({ year: yearToUse, type: examType });
  };

  const handleAnswerSelect = (answerId: string) => {
    if (!session) return;
    
    const currentQuestion = session.questions[session.currentQuestionIndex];
    const updatedAnswers = {
      ...session.userAnswers,
      [currentQuestion.id]: answerId
    };

    setSession({
      ...session,
      userAnswers: updatedAnswers
    });
  };

  const handleNextQuestion = () => {
    if (!session) return;
    
    if (session.currentQuestionIndex < session.totalQuestions - 1) {
      setSession({
        ...session,
        currentQuestionIndex: session.currentQuestionIndex + 1
      });
    }
  };

  const handlePreviousQuestion = () => {
    if (!session) return;
    
    if (session.currentQuestionIndex > 0) {
      setSession({
        ...session,
        currentQuestionIndex: session.currentQuestionIndex - 1
      });
    }
  };

  const handleSubmitQuiz = () => {
    if (!session) return;

    const timeSpent = 1800 - timeLeft;
    
    submitQuizMutation.mutate({
      sessionId: session.id,
      userAnswers: session.userAnswers,
      timeSpent,
      questionsData: session.questions
    });
  };

  const handleReviewAnswers = () => {
    setShowResults(false);
    setShowReview(true);
  };

  const handleRetakeQuiz = () => {
    setSession(null);
    setShowResults(false);
    setShowReview(false);
    setFinalResults(null);
    setTimeLeft(1800);
  };

  const handleContinueLearning = () => {
    onBack();
  };

  useEffect(() => {
    return () => {
      if (timerInterval) {
        clearInterval(timerInterval);
      }
    };
  }, [timerInterval]);

  // Show comprehensive review section
  if (showReview && finalResults) {
    return (
      <ComprehensiveQuizReview
        questions={session?.questions || []}
        userAnswers={session?.userAnswers || {}}
        score={finalResults.score}
        correctAnswers={finalResults.correctAnswers}
        totalQuestions={finalResults.totalQuestions}
        timeSpent={finalResults.timeSpent}
        subjectName={selectedSubject.name}
        onBack={handleContinueLearning}
        onRetakeQuiz={handleRetakeQuiz}
        onContinueLearning={handleContinueLearning}
      />
    );
  }

  // Show success animation
  if (showResults && finalResults) {
    return (
      <QuizSuccessAnimation
        score={finalResults.score}
        correctAnswers={finalResults.correctAnswers}
        totalQuestions={finalResults.totalQuestions}
        timeSpent={finalResults.timeSpent}
        subjectName={selectedSubject.name}
        onContinue={handleContinueLearning}
        onRetake={handleRetakeQuiz}
        onReviewAnswers={handleReviewAnswers}
      />
    );
  }

  // Quiz setup screen
  if (!session || !session.isStarted) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-indigo-900 via-purple-900 to-pink-800">
        {/* Header */}
        <div className="bg-white bg-opacity-10 backdrop-blur-sm">
          <div className="max-w-7xl mx-auto px-4 py-4">
            <div className="flex items-center space-x-4">
              <div className="flex items-center space-x-2">
                <Button 
                  variant="ghost" 
                  size="sm" 
                  onClick={onBack}
                  className="text-white hover:bg-white hover:bg-opacity-20"
                >
                  <ArrowLeft className="w-4 h-4 mr-2" />
                  Back
                </Button>
                {onHome && (
                  <Button 
                    variant="outline" 
                    size="sm" 
                    onClick={onHome}
                    className="text-white border-white/30 hover:bg-white/10"
                  >
                    <Home className="w-4 h-4 mr-2" />
                    Home
                  </Button>
                )}
              </div>
              <div className="flex-1 text-center">
                <h1 className="text-lg font-bold text-white">CBT Practice Mode</h1>
              </div>
            </div>
          </div>
        </div>

        <div className="max-w-4xl mx-auto px-4 py-6">
          {/* Subject Header */}
          <Card className="bg-gradient-to-r from-blue-600 to-purple-600 border-0 mb-6">
            <CardContent className="p-6">
              <div className="flex items-center space-x-4">
                <div className="w-16 h-16 bg-white bg-opacity-20 rounded-lg flex items-center justify-center">
                  <span className="text-3xl">{selectedSubject.emoji || '📝'}</span>
                </div>
                <div>
                  <h2 className="text-white text-2xl font-bold">{selectedSubject.name}</h2>
                  <p className="text-blue-100 text-sm mt-1">
                    Practice with past examination questions
                  </p>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Configuration Options */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-6">
            {/* Year Selection */}
            <Card className="bg-white bg-opacity-10 border-white border-opacity-20">
              <CardHeader>
                <CardTitle className="text-white flex items-center space-x-2">
                  <Calendar className="w-5 h-5" />
                  <span>Select Year</span>
                </CardTitle>
              </CardHeader>
              <CardContent>
                <Select value={selectedYear} onValueChange={setSelectedYear}>
                  <SelectTrigger className="bg-white/10 border-white/20 text-white">
                    <SelectValue placeholder="Choose examination year" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="any">Any Year</SelectItem>
                    {yearsData?.years?.map((year: number) => (
                      <SelectItem key={year} value={year.toString()}>
                        {year}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
                <p className="text-gray-300 text-sm mt-2">
                  Select a specific year or practice with questions from all years
                </p>
              </CardContent>
            </Card>

            {/* Exam Type Selection */}
            <Card className="bg-white bg-opacity-10 border-white border-opacity-20">
              <CardHeader>
                <CardTitle className="text-white flex items-center space-x-2">
                  <BookOpen className="w-5 h-5" />
                  <span>Exam Type</span>
                </CardTitle>
              </CardHeader>
              <CardContent>
                <Select value={examType} onValueChange={setExamType}>
                  <SelectTrigger className="bg-white/10 border-white/20 text-white">
                    <SelectValue placeholder="Choose exam type" />
                  </SelectTrigger>
                  <SelectContent>
                    {examTypesData?.examTypes?.map((type: string) => (
                      <SelectItem key={type} value={type}>
                        {type.toUpperCase()}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
                <p className="text-gray-300 text-sm mt-2">
                  Practice with questions from different examination types
                </p>
              </CardContent>
            </Card>
          </div>

          {/* Quiz Information */}
          <Card className="bg-white bg-opacity-10 border-white border-opacity-20 mb-6">
            <CardHeader>
              <CardTitle className="text-white">Quiz Details</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4 text-center">
                <div>
                  <div className="text-2xl font-bold text-white">20</div>
                  <div className="text-sm text-gray-300">Questions</div>
                </div>
                <div>
                  <div className="text-2xl font-bold text-white">30:00</div>
                  <div className="text-sm text-gray-300">Time Limit</div>
                </div>
                <div>
                  <div className="text-2xl font-bold text-white">Pass: 60%</div>
                  <div className="text-sm text-gray-300">Minimum Score</div>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Start Button */}
          <div className="text-center">
            <Button
              onClick={handleStartQuiz}
              disabled={fetchQuestionsMutation.isPending}
              size="lg"
              className="bg-gradient-to-r from-green-600 to-blue-600 hover:from-green-700 hover:to-blue-700 text-white font-semibold py-4 px-8 text-lg"
            >
              {fetchQuestionsMutation.isPending ? (
                <>
                  <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-white mr-2"></div>
                  Loading Questions...
                </>
              ) : (
                <>
                  <Trophy className="w-5 h-5 mr-2" />
                  Start Quiz
                </>
              )}
            </Button>
          </div>
        </div>

        {/* Trial Lock Modal */}
        {showTrialLock && user && (
          <TrialLockModal
            isOpen={showTrialLock}
            onClose={() => setShowTrialLock(false)}
            onActivationSuccess={() => {
              setShowTrialLock(false);
              // Continue with quiz start after successful activation
              if (examType) {
                const yearToUse = selectedYear === 'any' ? undefined : selectedYear;
                fetchQuestionsMutation.mutate({ year: yearToUse, type: examType });
              }
            }}
            userId={user.id!}
            trialsUsed={user.usageCount || 0}
          />
        )}
      </div>
    );
  }

  // Quiz interface - Add safety checks
  const currentQuestion = session.questions?.[session.currentQuestionIndex];
  const progress = ((session.currentQuestionIndex + 1) / session.totalQuestions) * 100;
  const answeredCount = Object.keys(session.userAnswers).length;
  const userAnswer = currentQuestion?.id ? session.userAnswers[currentQuestion.id] : undefined;

  // Early return if no question available
  if (!currentQuestion) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-purple-900 via-blue-900 to-indigo-900 p-4">
        <div className="max-w-4xl mx-auto text-center text-white">
          <h2 className="text-2xl font-bold mb-4">Loading Question...</h2>
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-white mx-auto"></div>
        </div>
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
                  <span>{selectedSubject.name} - CBT Practice</span>
                </CardTitle>
                <p className="text-gray-300 mt-1">
                  Question {session.currentQuestionIndex + 1} of {session.totalQuestions}
                  {selectedYear && ` | Year: ${selectedYear}`}
                  {examType && ` | Type: ${examType.toUpperCase()}`}
                </p>
              </div>
              <div className="text-right">
                <div className={`text-2xl font-bold ${timeLeft <= 300 ? 'text-red-400 animate-pulse' : 'text-white'}`}>
                  {formatTime(timeLeft)}
                </div>
                <p className="text-sm text-gray-400 mt-1">
                  {answeredCount}/{session.totalQuestions} answered
                </p>
              </div>
            </div>
            <Progress value={progress} className="mt-4" />
          </CardHeader>
        </Card>
      </div>

      {/* Current Question */}
      <div className="max-w-4xl mx-auto space-y-6">
        <AnimatePresence mode="wait">
          <motion.div
            key={session.currentQuestionIndex}
            initial={{ opacity: 0, x: 20 }}
            animate={{ opacity: 1, x: 0 }}
            exit={{ opacity: 0, x: -20 }}
            transition={{ duration: 0.3 }}
          >
            <Card className="bg-black/20 border-white/10 backdrop-blur-md">
              <CardHeader>
                <CardTitle className="text-white text-lg">
                  Question {session.currentQuestionIndex + 1}
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-6">
                {/* Question Text */}
                <div>
                  <h3 className="text-lg font-medium text-white mb-4">
                    {currentQuestion?.question}
                  </h3>
                  {currentQuestion?.imageUrl && (
                    <img
                      src={currentQuestion.imageUrl}
                      alt="Question"
                      className="max-w-md mx-auto rounded-lg mb-4"
                    />
                  )}
                </div>

                {/* Options */}
                <div className="space-y-3">
                  {currentQuestion?.options && Array.isArray(currentQuestion.options) ? currentQuestion.options.map((option) => {
                    const isSelected = userAnswer === option.id;
                    
                    return (
                      <button
                        key={option.id}
                        onClick={() => handleAnswerSelect(option.id)}
                        className={`w-full p-4 rounded-lg border text-left transition-all ${
                          isSelected
                            ? 'bg-blue-600/30 border-blue-500 text-blue-200'
                            : 'bg-gray-700/30 border-gray-600 text-gray-300 hover:bg-gray-600/40'
                        }`}
                      >
                        <div className="flex items-start space-x-3">
                          <span className="font-semibold">{option.id}.</span>
                          <span className="flex-1">{option.text}</span>
                          {isSelected && (
                            <CheckCircle className="w-5 h-5 text-blue-400 flex-shrink-0" />
                          )}
                        </div>
                      </button>
                    );
                  }) : (
                    <div className="text-white text-center">No options available for this question.</div>
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
            disabled={session.currentQuestionIndex === 0}
            variant="outline"
            className="border-white/30 text-white hover:bg-white/10"
          >
            Previous
          </Button>

          <div className="flex space-x-4">
            {session.currentQuestionIndex === session.totalQuestions - 1 ? (
              <Button
                onClick={handleSubmitQuiz}
                disabled={submitQuizMutation.isPending}
                className="bg-green-600 hover:bg-green-700"
              >
                {submitQuizMutation.isPending ? (
                  <>
                    <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2"></div>
                    Submitting...
                  </>
                ) : (
                  <>Submit Quiz</>
                )}
              </Button>
            ) : (
              <Button
                onClick={handleNextQuestion}
                disabled={session.currentQuestionIndex === session.totalQuestions - 1}
                className="bg-blue-600 hover:bg-blue-700"
              >
                Next
              </Button>
            )}
          </div>
        </div>

        {/* Quick Stats */}
        <Card className="bg-black/20 border-white/10 backdrop-blur-md">
          <CardContent className="p-4">
            <div className="grid grid-cols-3 gap-4 text-center">
              <div>
                <div className="text-lg font-bold text-white">{answeredCount}</div>
                <div className="text-sm text-gray-400">Answered</div>
              </div>
              <div>
                <div className="text-lg font-bold text-white">{session.totalQuestions - answeredCount}</div>
                <div className="text-sm text-gray-400">Remaining</div>
              </div>
              <div>
                <div className="text-lg font-bold text-white">{Math.floor((1800 - timeLeft) / 60)}m</div>
                <div className="text-sm text-gray-400">Elapsed</div>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Success Notification */}
      <SuccessNotification
        show={showSuccessNotification}
        message={notificationMessage}
        score={finalResults?.score}
        onClose={() => setShowSuccessNotification(false)}
      />
    </div>
  );
}