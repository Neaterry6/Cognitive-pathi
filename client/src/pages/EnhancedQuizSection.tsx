import { useState, useEffect, useRef } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import { Separator } from '@/components/ui/separator';
import { 
  Clock, 
  ArrowRight, 
  ArrowLeft, 
  CheckCircle, 
  XCircle, 
  Brain, 
  Target,
  BookOpen,
  AlertCircle,
  Trophy,
  Timer
} from 'lucide-react';
import { toast } from '@/hooks/use-toast';
import { apiRequest } from '@/lib/queryClient';
import { Question } from '@/types';
import QuizTimer from '@/components/QuizTimer';
import ReviewSection from '@/pages/ReviewSection';

interface EnhancedQuizSectionProps {
  user: any;
  subjectId: string;
  subjectName: string;
  mode: 'practice' | 'exam';
  onBack: () => void;
}

interface QuizSession {
  id: string;
  questions: Question[];
  currentQuestionIndex: number;
  answers: Record<string, string>;
  timeSpent: number;
  startTime: Date;
  isCompleted: boolean;
  score?: number;
}

interface AIExplanation {
  questionId: string;
  explanation: string;
  isLoading: boolean;
}

export default function EnhancedQuizSection({ 
  user, 
  subjectId, 
  subjectName, 
  mode, 
  onBack 
}: EnhancedQuizSectionProps) {
  const [session, setSession] = useState<QuizSession | null>(null);
  const [showResults, setShowResults] = useState(false);
  const [finalResults, setFinalResults] = useState<any>(null);
  const [timeLeft, setTimeLeft] = useState(mode === 'exam' ? 1800 : 600); // 30min exam, 10min practice
  const [aiExplanations, setAiExplanations] = useState<Record<string, AIExplanation>>({});
  const [isLoadingExplanations, setIsLoadingExplanations] = useState(false);
  const timerRef = useRef<NodeJS.Timeout | null>(null);
  const queryClient = useQueryClient();

  // Fetch questions for the quiz
  const { data: questions, isLoading: questionsLoading } = useQuery({
    queryKey: ['/api/questions/subject', subjectId],
    queryFn: async () => {
      const response = await apiRequest('GET', `/api/questions/subject/${subjectId}?limit=20`);
      return await response.json() as Question[];
    },
    enabled: !session,
  });

  // Create quiz session mutation
  const createSessionMutation = useMutation({
    mutationFn: async (questions: Question[]) => {
      const response = await apiRequest('POST', '/api/quiz-sessions', {
        subjectId,
        mode,
        totalQuestions: questions.length,
        timeLimit: timeLeft,
      });
      return response.json();
    },
    onSuccess: (sessionData) => {
      if (questions) {
        const newSession: QuizSession = {
          id: sessionData.id,
          questions: questions.slice(0, 20), // Limit to 20 questions
          currentQuestionIndex: 0,
          answers: {},
          timeSpent: 0,
          startTime: new Date(),
          isCompleted: false,
        };
        setSession(newSession);
        startTimer();
      }
    },
  });

  // Submit quiz mutation
  const submitQuizMutation = useMutation({
    mutationFn: async (sessionData: QuizSession) => {
      const correctAnswers = sessionData.questions.filter((q, index) => 
        sessionData.answers[q.id] === q.correctAnswer
      ).length;
      
      const score = Math.round((correctAnswers / sessionData.questions.length) * 100);
      
      const response = await apiRequest('PATCH', `/api/quiz-sessions/${sessionData.id}`, {
        isCompleted: true,
        score,
        answers: sessionData.answers,
        timeSpent: sessionData.timeSpent,
      });
      
      return {
        session: await response.json(),
        score,
        correctAnswers,
        totalQuestions: sessionData.questions.length,
        timeSpent: sessionData.timeSpent,
      };
    },
    onSuccess: (results) => {
      setFinalResults(results);
      setShowResults(true);
      
      if (mode === 'exam') {
        // For exams, load AI explanations for all questions after completion
        loadAllAIExplanations();
      }
      
      toast({
        title: "Quiz completed!",
        description: `You scored ${results.score}% (${results.correctAnswers}/${results.totalQuestions})`,
      });
    },
  });

  // AI explanation mutation for practice mode
  const getExplanationMutation = useMutation({
    mutationFn: async ({ questionId, question, correctAnswer, userAnswer }: {
      questionId: string;
      question: string;
      correctAnswer: string;
      userAnswer: string;
    }) => {
      const response = await apiRequest('POST', '/api/ai/explain', {
        questionId,
        question,
        correctAnswer,
        userAnswer,
        userId: user?.nickname,
        subject: subjectId
      });
      return response.json();
    },
    onSuccess: (data, variables) => {
      setAiExplanations(prev => ({
        ...prev,
        [variables.questionId]: {
          questionId: variables.questionId,
          explanation: data.explanation,
          isLoading: false,
        }
      }));
    },
    onError: (error, variables) => {
      setAiExplanations(prev => ({
        ...prev,
        [variables.questionId]: {
          questionId: variables.questionId,
          explanation: 'Unable to load explanation at this time.',
          isLoading: false,
        }
      }));
    },
  });

  // Load AI explanations for all questions (exam mode)
  const loadAllAIExplanations = async () => {
    if (!session) return;
    
    setIsLoadingExplanations(true);
    
    for (const question of session.questions) {
      const userAnswer = session.answers[question.id];
      if (userAnswer) {
        try {
          const response = await apiRequest('POST', '/api/ai/explain', {
            questionId: question.id,
            question: question.question,
            correctAnswer: question.correctAnswer,
            userAnswer,
            userId: user?.nickname,
            subject: subjectId
          });
          const data = await response.json();
          
          setAiExplanations(prev => ({
            ...prev,
            [question.id]: {
              questionId: question.id,
              explanation: data.explanation,
              isLoading: false,
            }
          }));
        } catch (error) {
          setAiExplanations(prev => ({
            ...prev,
            [question.id]: {
              questionId: question.id,
              explanation: 'Unable to load explanation at this time.',
              isLoading: false,
            }
          }));
        }
      }
    }
    
    setIsLoadingExplanations(false);
  };

  // Timer functions
  const startTimer = () => {
    timerRef.current = setInterval(() => {
      setTimeLeft(prev => {
        if (prev <= 1) {
          submitQuiz();
          return 0;
        }
        return prev - 1;
      });
      
      setSession(prev => prev ? {
        ...prev,
        timeSpent: Math.floor((Date.now() - new Date(prev.startTime).getTime()) / 1000)
      } : null);
    }, 1000);
  };

  const stopTimer = () => {
    if (timerRef.current) {
      clearInterval(timerRef.current);
      timerRef.current = null;
    }
  };

  // Initialize quiz
  useEffect(() => {
    if (questions && questions.length > 0 && !session) {
      createSessionMutation.mutate(questions);
    }
  }, [questions]);

  // Cleanup timer
  useEffect(() => {
    return () => stopTimer();
  }, []);

  // Navigation functions
  const goToQuestion = (index: number) => {
    if (!session) return;
    setSession({ ...session, currentQuestionIndex: index });
  };

  const nextQuestion = () => {
    if (!session) return;
    if (session.currentQuestionIndex < session.questions.length - 1) {
      setSession({ ...session, currentQuestionIndex: session.currentQuestionIndex + 1 });
    }
  };

  const previousQuestion = () => {
    if (!session) return;
    if (session.currentQuestionIndex > 0) {
      setSession({ ...session, currentQuestionIndex: session.currentQuestionIndex - 1 });
    }
  };

  // Answer handling
  const selectAnswer = (questionId: string, answer: string) => {
    if (!session) return;
    
    const newAnswers = { ...session.answers, [questionId]: answer };
    setSession({ ...session, answers: newAnswers });
    
    // For practice mode, immediately show AI explanation
    if (mode === 'practice') {
      const currentQuestion = session.questions[session.currentQuestionIndex];
      if (currentQuestion && answer !== currentQuestion.correctAnswer) {
        getExplanationMutation.mutate({
          questionId: currentQuestion.id,
          question: currentQuestion.question,
          correctAnswer: currentQuestion.correctAnswer,
          userAnswer: answer,
        });
      }
    }
  };

  // Submit quiz
  const submitQuiz = () => {
    if (!session) return;
    stopTimer();
    const finalSession = { ...session, isCompleted: true };
    setSession(finalSession);
    submitQuizMutation.mutate(finalSession);
  };

  // Retry quiz
  const retryQuiz = () => {
    setSession(null);
    setShowResults(false);
    setFinalResults(null);
    setAiExplanations({});
    setTimeLeft(mode === 'exam' ? 1800 : 600);
    queryClient.invalidateQueries({ queryKey: ['/api/questions/subject', subjectId] });
  };

  // Format time display
  const formatTime = (seconds: number) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins}:${secs.toString().padStart(2, '0')}`;
  };

  // Loading state
  if (questionsLoading || createSessionMutation.isPending) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-purple-900 via-blue-900 to-indigo-900 flex items-center justify-center" data-testid="quiz-loading">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-white mx-auto mb-4"></div>
          <p className="text-white text-lg">Preparing your {mode}...</p>
        </div>
      </div>
    );
  }

  // Show results
  if (showResults && finalResults) {
    return (
      <ReviewSection
        user={user}
        result={finalResults}
        questions={session?.questions || []}
        answers={session?.answers || {}}
        subjectName={subjectName}
        onBack={onBack}
        onRetryQuiz={retryQuiz}
      />
    );
  }

  if (!session) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-purple-900 via-blue-900 to-indigo-900 flex items-center justify-center">
        <div className="text-center text-white">
          <AlertCircle className="h-12 w-12 mx-auto mb-4" />
          <h2 className="text-xl font-bold mb-2">Unable to load quiz</h2>
          <p className="mb-4">No questions available for this subject.</p>
          <Button onClick={onBack} variant="outline">
            Go Back
          </Button>
        </div>
      </div>
    );
  }

  const currentQuestion = session.questions[session.currentQuestionIndex];
  const progress = ((session.currentQuestionIndex + 1) / session.questions.length) * 100;
  const answeredCount = Object.keys(session.answers).length;

  return (
    <div className="min-h-screen bg-gradient-to-br from-purple-900 via-blue-900 to-indigo-900 p-4" data-testid="enhanced-quiz-section">
      {/* Header */}
      <div className="max-w-4xl mx-auto mb-6">
        <Card className="bg-black/20 border-white/10 backdrop-blur-md">
          <CardHeader>
            <div className="flex items-center justify-between">
              <div>
                <CardTitle className="text-white flex items-center space-x-2">
                  {mode === 'exam' ? <Trophy className="h-5 w-5" /> : <Brain className="h-5 w-5" />}
                  <span>{subjectName} - {mode === 'exam' ? 'Exam' : 'Practice'}</span>
                </CardTitle>
                <p className="text-gray-300 mt-1">
                  Question {session.currentQuestionIndex + 1} of {session.questions.length}
                </p>
              </div>
              <div className="text-right">
                <QuizTimer 
                  timeLeft={timeLeft}
                  formatTime={(seconds: number) => {
                    const mins = Math.floor(seconds / 60);
                    const secs = seconds % 60;
                    return `${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
                  }}
                  isRunning={!session.isCompleted}
                />
                <p className="text-sm text-gray-400 mt-1">
                  {answeredCount}/{session.questions.length} answered
                </p>
              </div>
            </div>
            <Progress value={progress} className="mt-4" />
          </CardHeader>
        </Card>
      </div>

      <div className="max-w-4xl mx-auto grid grid-cols-1 lg:grid-cols-4 gap-6">
        {/* Question Panel */}
        <div className="lg:col-span-3">
          <Card className="bg-black/20 border-white/10 backdrop-blur-md" data-testid="question-card">
            <CardHeader>
              <CardTitle className="text-white flex items-center space-x-2">
                <BookOpen className="h-5 w-5" />
                <span>Question {session.currentQuestionIndex + 1}</span>
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-6">
              <div className="bg-white/5 p-6 rounded-lg border border-white/10">
                <p className="text-white text-lg leading-relaxed">
                  {currentQuestion.question}
                </p>
              </div>

              {/* Options */}
              <div className="space-y-3">
                {['A', 'B', 'C', 'D'].map((option) => {
                  const optionText = currentQuestion[`option${option}` as keyof Question] as string;
                  const isSelected = session.answers[currentQuestion.id] === option;
                  const isCorrect = currentQuestion.correctAnswer === option;
                  const showCorrection = mode === 'practice' && 
                                       session.answers[currentQuestion.id] && 
                                       session.answers[currentQuestion.id] !== currentQuestion.correctAnswer;

                  return (
                    <Button
                      key={option}
                      variant={isSelected ? "default" : "outline"}
                      size="lg"
                      className={`w-full text-left p-4 h-auto justify-start transition-all duration-200 ${
                        isSelected 
                          ? 'bg-blue-600 hover:bg-blue-700 border-blue-500 text-white' 
                          : 'bg-white/5 hover:bg-white/10 border-white/20 text-white'
                      } ${
                        showCorrection && isCorrect 
                          ? 'border-green-500 bg-green-600/20' 
                          : ''
                      } ${
                        showCorrection && isSelected && !isCorrect 
                          ? 'border-red-500 bg-red-600/20' 
                          : ''
                      }`}
                      onClick={() => selectAnswer(currentQuestion.id, option)}
                      data-testid={`option-${option}`}
                    >
                      <div className="flex items-center justify-between w-full">
                        <div className="flex items-center space-x-3">
                          <span className="font-bold text-lg">{option}.</span>
                          <span>{optionText}</span>
                        </div>
                        {showCorrection && isCorrect && (
                          <CheckCircle className="h-5 w-5 text-green-400" />
                        )}
                        {showCorrection && isSelected && !isCorrect && (
                          <XCircle className="h-5 w-5 text-red-400" />
                        )}
                      </div>
                    </Button>
                  );
                })}
              </div>

              {/* AI Explanation for Practice Mode */}
              {mode === 'practice' && aiExplanations[currentQuestion.id] && (
                <Card className="bg-blue-900/20 border-blue-400/30">
                  <CardHeader>
                    <CardTitle className="text-blue-200 flex items-center space-x-2">
                      <Brain className="h-4 w-4" />
                      <span>AI Explanation</span>
                    </CardTitle>
                  </CardHeader>
                  <CardContent>
                    {aiExplanations[currentQuestion.id].isLoading ? (
                      <div className="flex items-center space-x-2 text-blue-200">
                        <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-blue-400"></div>
                        <span>Generating explanation...</span>
                      </div>
                    ) : (
                      <p className="text-blue-100 leading-relaxed">
                        {aiExplanations[currentQuestion.id].explanation}
                      </p>
                    )}
                  </CardContent>
                </Card>
              )}
            </CardContent>
          </Card>

          {/* Navigation */}
          <div className="flex items-center justify-between mt-6">
            <Button
              variant="outline"
              onClick={previousQuestion}
              disabled={session.currentQuestionIndex === 0}
              className="bg-white/5 border-white/20 text-white hover:bg-white/10"
              data-testid="button-previous"
            >
              <ArrowLeft className="h-4 w-4 mr-2" />
              Previous
            </Button>

            <div className="flex space-x-2">
              {session.currentQuestionIndex === session.questions.length - 1 ? (
                <Button
                  onClick={submitQuiz}
                  disabled={submitQuizMutation.isPending}
                  className="bg-green-600 hover:bg-green-700 text-white"
                  data-testid="button-submit"
                >
                  {submitQuizMutation.isPending ? (
                    <>
                      <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2" />
                      Submitting...
                    </>
                  ) : (
                    <>
                      <Target className="h-4 w-4 mr-2" />
                      Submit Quiz
                    </>
                  )}
                </Button>
              ) : (
                <Button
                  variant="outline"
                  onClick={nextQuestion}
                  disabled={session.currentQuestionIndex === session.questions.length - 1}
                  className="bg-white/5 border-white/20 text-white hover:bg-white/10"
                  data-testid="button-next"
                >
                  Next
                  <ArrowRight className="h-4 w-4 ml-2" />
                </Button>
              )}
            </div>
          </div>
        </div>

        {/* Question Navigator */}
        <div className="lg:col-span-1">
          <Card className="bg-black/20 border-white/10 backdrop-blur-md">
            <CardHeader>
              <CardTitle className="text-white text-sm">Question Navigator</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-4 gap-2">
                {session.questions.map((_, index) => {
                  const isCurrentQuestion = index === session.currentQuestionIndex;
                  const isAnswered = session.answers[session.questions[index].id];
                  
                  return (
                    <Button
                      key={index}
                      variant={isCurrentQuestion ? "default" : "outline"}
                      size="sm"
                      onClick={() => goToQuestion(index)}
                      className={`h-8 w-8 p-0 text-xs ${
                        isCurrentQuestion 
                          ? 'bg-blue-600 text-white' 
                          : isAnswered 
                          ? 'bg-green-600/20 border-green-500/50 text-green-200' 
                          : 'bg-white/5 border-white/20 text-white hover:bg-white/10'
                      }`}
                      data-testid={`nav-question-${index + 1}`}
                    >
                      {index + 1}
                    </Button>
                  );
                })}
              </div>
              
              <Separator className="my-4 bg-white/10" />
              
              <div className="space-y-2 text-xs text-gray-300">
                <div className="flex items-center justify-between">
                  <span>Answered:</span>
                  <Badge variant="secondary" className="bg-green-600/20 text-green-200">
                    {answeredCount}
                  </Badge>
                </div>
                <div className="flex items-center justify-between">
                  <span>Remaining:</span>
                  <Badge variant="secondary" className="bg-orange-600/20 text-orange-200">
                    {session.questions.length - answeredCount}
                  </Badge>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}