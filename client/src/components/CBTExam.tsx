import React, { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import { useToast } from '@/hooks/use-toast';
import { 
  Clock, 
  ArrowLeft, 
  ArrowRight, 
  CheckCircle, 
  AlertCircle,
  Pause,
  Play,
  Home
} from 'lucide-react';

interface CBTExamProps {
  sessionId: string;
  onComplete: (results: any) => void;
  onExit: () => void;
}

export default function CBTExam({ sessionId, onComplete, onExit }: CBTExamProps) {
  const [session, setSession] = useState<any>(null);
  const [questions, setQuestions] = useState<any[]>([]);
  const [currentQuestionIndex, setCurrentQuestionIndex] = useState(0);
  const [selectedAnswers, setSelectedAnswers] = useState<Record<number, string>>({});
  const [timeRemaining, setTimeRemaining] = useState(7200); // 2 hours in seconds
  const [isPaused, setIsPaused] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const { toast } = useToast();

  // Load session data and questions
  useEffect(() => {
    const loadSession = async () => {
      try {
        console.log('📚 Loading CBT session:', sessionId);
        
        const response = await fetch(`/api/cbt/sessions/${sessionId}`);
        if (!response.ok) {
          const errorData = await response.json();
          throw new Error(errorData.message || 'Failed to load session');
        }
        
        const sessionData = await response.json();
        console.log('✅ Session loaded:', sessionData);
        
        setSession(sessionData);
        setTimeRemaining(sessionData.timeRemaining || 7200);
        
        // Check if session has questions already loaded
        if (sessionData.questions && sessionData.questions.length > 0) {
          console.log(`📝 Using ${sessionData.questions.length} pre-loaded questions from session`);
          setQuestions(sessionData.questions);
          setIsLoading(false);
        } else {
          console.log('⚠️ No questions in session, session might not be properly started');
          throw new Error('CBT session does not have questions loaded. Please restart the examination.');
        }
        
      } catch (error) {
        console.error('❌ Error loading session:', error);
        toast({
          title: "Session Error",
          description: `Failed to load CBT session: ${error instanceof Error ? error.message : 'Unknown error'}. Please try again.`,
          variant: "destructive"
        });
        onExit();
      }
    };

    if (sessionId) {
      loadSession();
    }
  }, [sessionId, onExit, toast]);

  // Timer effect
  useEffect(() => {
    if (!isPaused && !isLoading && timeRemaining > 0) {
      const timer = setTimeout(() => {
        setTimeRemaining(prev => prev - 1);
      }, 1000);
      return () => clearTimeout(timer);
    } else if (timeRemaining === 0) {
      // Auto-submit when time runs out
      handleSubmitExam();
    }
  }, [timeRemaining, isPaused, isLoading]);

  const formatTime = (seconds: number) => {
    const hours = Math.floor(seconds / 3600);
    const minutes = Math.floor((seconds % 3600) / 60);
    const secs = seconds % 60;
    return `${hours.toString().padStart(2, '0')}:${minutes.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
  };

  const handleAnswerSelect = (answerId: string) => {
    setSelectedAnswers(prev => ({
      ...prev,
      [currentQuestionIndex]: answerId
    }));
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

  const handleTogglePause = () => {
    setIsPaused(!isPaused);
  };

  const calculateProgress = () => {
    const answered = Object.keys(selectedAnswers).length;
    return questions.length > 0 ? (answered / questions.length) * 100 : 0;
  };

  const calculateScore = () => {
    let correct = 0;
    questions.forEach((question, index) => {
      if (selectedAnswers[index] === question.correctAnswer) {
        correct++;
      }
    });
    return correct;
  };

  const handleSubmitExam = async () => {
    if (isSubmitting) return;
    
    const unansweredCount = questions.length - Object.keys(selectedAnswers).length;
    if (unansweredCount > 0 && timeRemaining > 0) {
      const confirmed = confirm(`You have ${unansweredCount} unanswered questions. Are you sure you want to submit?`);
      if (!confirmed) return;
    }

    try {
      setIsSubmitting(true);
      
      const score = calculateScore();
      const results = {
        sessionId,
        score,
        totalQuestions: questions.length,
        timeSpent: 7200 - timeRemaining,
        selectedAnswers,
        questions,
        subjectBreakdown: calculateSubjectBreakdown()
      };

      // Update session as completed
      await fetch(`/api/cbt/sessions/${sessionId}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          isCompleted: true,
          timeRemaining: 0,
          completedAt: new Date().toISOString()
        })
      });

      onComplete(results);
    } catch (error) {
      console.error('Error submitting exam:', error);
      toast({
        title: "Submission Error",
        description: "Failed to submit exam. Please try again.",
        variant: "destructive"
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  const calculateSubjectBreakdown = () => {
    if (!session?.selectedSubjects) return {};
    
    const breakdown: Record<string, { correct: number; total: number; subject: string }> = {};
    
    session.selectedSubjects.forEach((subject: any, subjectIndex: number) => {
      const startIndex = subjectIndex * 40;
      const endIndex = startIndex + 40;
      let correct = 0;
      
      for (let i = startIndex; i < endIndex && i < questions.length; i++) {
        if (selectedAnswers[i] === questions[i]?.correctAnswer) {
          correct++;
        }
      }
      
      breakdown[subject.id] = {
        correct,
        total: Math.min(40, questions.length - startIndex),
        subject: subject.name
      };
    });
    
    return breakdown;
  };

  if (isLoading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-blue-900 via-indigo-900 to-purple-900 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-white mx-auto mb-4"></div>
          <p className="text-white text-lg">Loading CBT Exam...</p>
        </div>
      </div>
    );
  }

  if (!questions.length) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-red-900 via-orange-900 to-yellow-900 flex items-center justify-center">
        <div className="text-center">
          <AlertCircle className="w-16 h-16 text-white mx-auto mb-4" />
          <h2 className="text-white text-2xl font-bold mb-4">No Questions Available</h2>
          <p className="text-white text-lg mb-6">Unable to load questions for this exam session.</p>
          <Button onClick={onExit} className="bg-white text-black hover:bg-gray-200">
            <Home className="w-4 h-4 mr-2" />
            Return Home
          </Button>
        </div>
      </div>
    );
  }

  const currentQuestion = questions[currentQuestionIndex];
  const progress = calculateProgress();

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-900 via-gray-900 to-zinc-900">
      {/* Header */}
      <div className="bg-black bg-opacity-50 backdrop-blur-sm border-b border-gray-700">
        <div className="max-w-7xl mx-auto px-4 py-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-4">
              <Button 
                variant="ghost" 
                size="sm" 
                onClick={onExit}
                className="text-white hover:bg-white hover:bg-opacity-20"
              >
                <ArrowLeft className="w-4 h-4 mr-2" />
                Exit Exam
              </Button>
              
              <div className="flex items-center gap-2">
                <Badge variant="outline" className="text-white border-white">
                  Question {currentQuestionIndex + 1} of {questions.length}
                </Badge>
                <Badge variant="secondary" className="bg-blue-600 text-white">
                  {currentQuestion?.subject || 'General'}
                </Badge>
              </div>
            </div>

            <div className="flex items-center gap-4">
              <Button
                variant="ghost"
                size="sm"
                onClick={handleTogglePause}
                className="text-white hover:bg-white hover:bg-opacity-20"
              >
                {isPaused ? <Play className="w-4 h-4" /> : <Pause className="w-4 h-4" />}
                {isPaused ? 'Resume' : 'Pause'}
              </Button>
              
              <div className="flex items-center gap-2 text-white">
                <Clock className="w-5 h-5" />
                <span className="font-mono text-lg">
                  {formatTime(timeRemaining)}
                </span>
              </div>
            </div>
          </div>

          {/* Progress Bar */}
          <div className="mt-4">
            <Progress value={progress} className="h-2" />
            <p className="text-white text-sm mt-1">
              {Object.keys(selectedAnswers).length} of {questions.length} questions answered
            </p>
          </div>
        </div>
      </div>

      {/* Question Content */}
      <div className="max-w-4xl mx-auto px-4 py-6">
        {isPaused ? (
          <Card className="bg-yellow-600 border-0 text-center">
            <CardContent className="p-8">
              <Pause className="w-16 h-16 text-white mx-auto mb-4" />
              <h2 className="text-white text-2xl font-bold mb-2">Exam Paused</h2>
              <p className="text-white mb-4">Click Resume to continue with your exam</p>
              <Button onClick={handleTogglePause} className="bg-white text-yellow-600 hover:bg-gray-200">
                <Play className="w-4 h-4 mr-2" />
                Resume Exam
              </Button>
            </CardContent>
          </Card>
        ) : (
          <Card className="bg-white bg-opacity-10 backdrop-blur-sm border-white border-opacity-20">
            <CardHeader>
              <div className="flex items-center justify-between mb-4">
                <Badge className="bg-gradient-to-r from-blue-600 to-purple-600 text-white px-3 py-1">
                  {currentQuestion?.subject || 'General'}
                </Badge>
                <span className="text-white text-sm opacity-70">
                  Question {currentQuestionIndex + 1} of {questions.length}
                </span>
              </div>
              <CardTitle className="text-white text-xl">
                {currentQuestion.question}
              </CardTitle>
              {currentQuestion.imageUrl && (
                <div className="mt-4">
                  <img
                    src={currentQuestion.imageUrl}
                    alt="Question diagram"
                    className="max-w-full h-auto rounded-lg"
                  />
                </div>
              )}
            </CardHeader>
            <CardContent className="space-y-3">
              {currentQuestion.options?.map((option: any, index: number) => {
                const optionId = option.id || String.fromCharCode(65 + index); // A, B, C, D
                const isSelected = selectedAnswers[currentQuestionIndex] === optionId;
                
                return (
                  <Button
                    key={optionId}
                    variant={isSelected ? "default" : "outline"}
                    className={`w-full text-left justify-start p-4 h-auto ${
                      isSelected 
                        ? 'bg-blue-600 text-white border-blue-600' 
                        : 'bg-white bg-opacity-10 text-white border-white border-opacity-30 hover:bg-white hover:bg-opacity-20'
                    }`}
                    onClick={() => handleAnswerSelect(optionId)}
                  >
                    <div className="flex items-start gap-3">
                      <span className="font-bold text-lg min-w-[24px]">
                        {optionId}.
                      </span>
                      <span className="text-left">{option.text}</span>
                      {isSelected && <CheckCircle className="w-5 h-5 ml-auto flex-shrink-0" />}
                    </div>
                  </Button>
                );
              })}
            </CardContent>
          </Card>
        )}

        {/* Navigation */}
        {!isPaused && (
          <div className="flex justify-between items-center mt-6">
            <Button
              variant="outline"
              onClick={handlePreviousQuestion}
              disabled={currentQuestionIndex === 0}
              className="bg-white bg-opacity-10 text-white border-white border-opacity-30 hover:bg-white hover:bg-opacity-20"
            >
              <ArrowLeft className="w-4 h-4 mr-2" />
              Previous
            </Button>

            <div className="flex items-center gap-4">
              {currentQuestionIndex === questions.length - 1 ? (
                <Button
                  onClick={handleSubmitExam}
                  disabled={isSubmitting}
                  className="bg-green-600 hover:bg-green-700 text-white px-8"
                >
                  {isSubmitting ? 'Submitting...' : 'Submit Exam'}
                </Button>
              ) : (
                <Button
                  onClick={handleNextQuestion}
                  className="bg-blue-600 hover:bg-blue-700 text-white"
                >
                  Next
                  <ArrowRight className="w-4 h-4 ml-2" />
                </Button>
              )}
            </div>
          </div>
        )}
      </div>
    </div>
  );
}