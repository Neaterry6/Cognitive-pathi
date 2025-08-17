import React, { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import { User, Subject, Question } from '@shared/schema';
import { 
  ArrowLeft, 
  Lock, 
  Clock, 
  CheckCircle, 
  AlertCircle,
  Users,
  FileText
} from 'lucide-react';

interface CBTModeProps {
  user: User;
  selectedSubject: Subject;
  selectedSubjects?: Subject[]; // For multi-subject CBT mode
  onBack: () => void;
}

// CBT Mode states
type CBTModeState = 'subject-selection' | 'exam' | 'results';

export default function CBTMode({ user, selectedSubject, selectedSubjects, onBack }: CBTModeProps) {
  const [selectedYear, setSelectedYear] = useState<string | null>(null);
  const [currentQuestion, setCurrentQuestion] = useState(0);
  const [selectedAnswers, setSelectedAnswers] = useState<Record<number, string>>({});
  const [isQuizStarted, setIsQuizStarted] = useState(false);
  const [timeLeft, setTimeLeft] = useState(7200); // 2 hours for CBT mode
  const [questions, setQuestions] = useState<Question[]>([]);
  const [cbtMode, setCbtMode] = useState<CBTModeState>('subject-selection');
  const [activeCbtSession, setActiveCbtSession] = useState<any>(null);
  const [loading, setLoading] = useState(false);

  // Check for active CBT session on mount
  useEffect(() => {
    checkActiveCbtSession();
  }, [user.id]);

  const checkActiveCbtSession = async () => {
    try {
      const response = await fetch(`/api/cbt/sessions/active/${user.id}`);
      const session = await response.json();
      
      if (session) {
        setActiveCbtSession(session);
        setCbtMode('exam');
        setIsQuizStarted(true);
        setTimeLeft(session.timeRemaining || 7200);
        // Load questions for active session
        await fetchQuestionsForAllSubjects();
      }
    } catch (error) {
      console.error('Error checking active CBT session:', error);
    }
  };

  const fetchQuestionsForAllSubjects = async () => {
    if (!selectedSubjects || selectedSubjects.length !== 4) {
      console.error('Invalid subjects for CBT - need exactly 4 subjects');
      return;
    }
    
    try {
      setLoading(true);
      console.log('🎯 Fetching questions for CBT subjects using ALOC API:', selectedSubjects.map(s => s.name));
      
      // Use the new CBT endpoint that properly integrates with ALOC API
      const response = await fetch('/api/cbt/questions', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          subjects: selectedSubjects.map(s => s.name),
          questionsPerSubject: 30,
          examType: 'utme',
          year: selectedYear || '2023'
        })
      });
      
      if (!response.ok) {
        throw new Error(`Failed to fetch CBT questions: ${response.status}`);
      }
      
      const data = await response.json();
      console.log(`✅ CBT API Response:`, data.success ? `${data.totalQuestions} real questions fetched` : 'Using fallbacks');
      
      const allQuestions: Question[] = [];
      
      if (data.success && data.questions) {
        // Process questions from each subject
        selectedSubjects.forEach(subject => {
          const subjectKey = subject.name.toLowerCase();
          const subjectQuestions = data.questions[subjectKey] || [];
          
          // Add subject metadata to each question  
          const questionsWithMetadata = subjectQuestions.map((q: any) => ({
            ...q,
            subjectName: subject.name,
            subjectId: subject.id
          }));
          
          allQuestions.push(...questionsWithMetadata);
          console.log(`📚 ${subject.name}: ${subjectQuestions.length} questions loaded`);
        });
      }
      
      // If no questions from API, generate fallbacks
      if (allQuestions.length === 0) {
        console.log('⚠️ Generating fallback questions for CBT practice');
        selectedSubjects.forEach((subject) => {
          for (let i = 0; i < 8; i++) {
            allQuestions.push({
              id: `fallback_${subject.id}_${i}`,
              question: `Sample ${subject.name} question ${i + 1}. This is a practice question when ALOC API is unavailable.`,
              options: [
                { id: 'A', text: 'Option A' },
                { id: 'B', text: 'Option B' },
                { id: 'C', text: 'Option C' },
                { id: 'D', text: 'Option D' }
              ],
              correctAnswer: 'A',
              subjectName: subject.name,
              subjectId: subject.id,
              subject: subject.name,
              difficulty: 'medium',
              year: 2023,
              explanation: 'Practice question - check your textbooks for detailed explanations.'
            });
          }
        });
      }
      
      // Shuffle questions for better exam experience
      const shuffledQuestions = allQuestions.sort(() => Math.random() - 0.5);
      setQuestions(shuffledQuestions);
      
      console.log(`🎉 CBT Ready: ${shuffledQuestions.length} total questions (${data.totalQuestions || 0} real from ALOC API)`);
      
      if (shuffledQuestions.length === 0) {
        throw new Error('No questions were loaded for any subject');
      }
      
    } catch (error) {
      console.error('❌ Error fetching CBT questions:', error);
      alert(`Failed to load questions for CBT mode: ${error instanceof Error ? error.message : 'Unknown error'}. Please try again.`);
    } finally {
      setLoading(false);
    }
  };

  // Mock past question years
  const pastQuestionYears = [
    { year: '2011/2012', questionCount: 40, isLocked: !user.isPremium },
    { year: '2012/2013', questionCount: 40, isLocked: !user.isPremium },
    { year: '2013/2014', questionCount: 40, isLocked: !user.isPremium },
    { year: '2014/2015', questionCount: 40, isLocked: !user.isPremium },
    { year: '2015/2016', questionCount: 40, isLocked: !user.isPremium },
    { year: '2016/2017', questionCount: 40, isLocked: !user.isPremium },
    { year: '2017/2018', questionCount: 40, isLocked: !user.isPremium },
    { year: '2019/2020', questionCount: 40, isLocked: !user.isPremium },
    { year: '2021/2022', questionCount: 40, isLocked: !user.isPremium },
    { year: '2022/2023', questionCount: 40, isLocked: false }, // Free sample
  ];

  // Mock questions for demo
  // Questions will be fetched from the API instead of using mock data

  // Timer effect
  useEffect(() => {
    if (isQuizStarted && timeLeft > 0) {
      const timer = setTimeout(() => {
        setTimeLeft(timeLeft - 1);
      }, 1000);
      return () => clearTimeout(timer);
    }
  }, [isQuizStarted, timeLeft]);

  // Format time
  const formatTime = (seconds: number) => {
    const hours = Math.floor(seconds / 3600);
    const minutes = Math.floor((seconds % 3600) / 60);
    const secs = seconds % 60;
    return `${hours.toString().padStart(2, '0')}:${minutes.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
  };

  const handleYearSelect = (year: string) => {
    setSelectedYear(year);
  };

  // Enhanced CBT session creation function with proper ALOC integration
  const startCBTSession = async () => {
    if (!selectedSubjects || selectedSubjects.length !== 4) {
      alert('Please select exactly 4 subjects for CBT mode');
      return;
    }

    setLoading(true);
    try {
      console.log('🚀 Starting CBT session for subjects:', selectedSubjects.map(s => s.name));
      
      // Create CBT session first
      const sessionResponse = await fetch('/api/cbt/sessions', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          userId: user.id,
          selectedSubjects: selectedSubjects.map(s => ({
            id: s.id,
            name: s.name,
            emoji: s.emoji || '📚'
          })),
          paymentId: `free-${Date.now()}`,
          examType: 'cbt-practice',
          duration: 7200 // 2 hours in seconds
        })
      });

      if (!sessionResponse.ok) {
        const errorData = await sessionResponse.json();
        throw new Error(errorData.message || 'Failed to create CBT session');
      }

      const session = await sessionResponse.json();
      console.log('✅ CBT session created successfully:', session.id);

      // Now start the examination to fetch questions from ALOC API
      console.log('📚 Starting examination with ALOC API question fetching...');
      const startExamResponse = await fetch(`/api/cbt/sessions/${session.id}/start`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        }
      });

      if (!startExamResponse.ok) {
        const errorData = await startExamResponse.json();
        throw new Error(errorData.message || 'Failed to start CBT examination');
      }

      const examData = await startExamResponse.json();
      console.log('🎯 CBT examination started with', examData.totalQuestions, 'questions');

      if (examData.success && examData.session) {
        setActiveCbtSession(examData.session);
        
        // Set questions from the session data if available
        if (examData.session.questions && examData.session.questions.length > 0) {
          setQuestions(examData.session.questions);
          console.log('📝 Loaded', examData.session.questions.length, 'questions from session');
        } else {
          // Fallback: fetch questions manually
          console.log('⚠️ No questions in session, fetching manually...');
          await fetchQuestionsForAllSubjects();
        }
        
        setCbtMode('exam');
        setIsQuizStarted(true);
        setTimeLeft(7200); // 2 hours
        
        alert(`CBT examination started successfully! You have ${examData.totalQuestions || 160} questions to complete in 2 hours.`);
      } else {
        throw new Error('Failed to start CBT examination - invalid response');
      }
    } catch (error) {
      console.error('❌ Failed to start CBT session:', error);
      alert(`Failed to start CBT session: ${error instanceof Error ? error.message : 'Unknown error'}. Please check your connection and try again.`);
    } finally {
      setLoading(false);
    }
  };

  const fetchQuestions = async () => {
    try {
      setLoading(true);
      
      // Check if user has reached usage limit for free users
      if (!user.isPremium && user.usageCount && user.usageCount >= 3) {
        alert('You have reached the limit for free users. Please activate premium to continue.');
        return;
      }

      const controller = new AbortController();
      const timeoutId = setTimeout(() => controller.abort(), 5000); // 5 second timeout for practice mode
      
      console.log('⚡ Starting fast question fetch for practice mode...');
      const startTime = Date.now();

      // Use optimized API call for faster response
      const response = await fetch(`/api/quiz/questions/${selectedSubject.id}?limit=25&type=utme`, {
        method: 'GET',
        headers: {
          'Content-Type': 'application/json',
        },
        signal: controller.signal
      });

      clearTimeout(timeoutId);
      const loadTime = Date.now() - startTime;

      if (!response.ok) {
        throw new Error('Failed to fetch questions');
      }

      const fetchedQuestions = await response.json();
      setQuestions(fetchedQuestions || []);
      
      console.log(`⚡ Practice questions loaded in ${loadTime}ms`);
      
      // Update user usage count for free users
      if (!user.isPremium && user.id) {
        await fetch(`/api/users/${user.id}/usage`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
        });
      }
    } catch (error) {
      console.error('Error fetching questions:', error);
      if (error instanceof Error && error.name === 'AbortError') {
        alert('Request timed out. Please check your connection and try again.');
      } else {
        alert('Failed to load questions. Please try again.');
      }
      setQuestions([]);
    } finally {
      setLoading(false);
    }
  };

  const startQuiz = async () => {
    await fetchQuestions();
    setIsQuizStarted(true);
  };

  const handleAnswerSelect = (questionIndex: number, answerId: string) => {
    setSelectedAnswers(prev => ({
      ...prev,
      [questionIndex]: answerId
    }));
  };

  const nextQuestion = () => {
    if (currentQuestion < questions.length - 1) {
      setCurrentQuestion(currentQuestion + 1);
    }
  };

  const prevQuestion = () => {
    if (currentQuestion > 0) {
      setCurrentQuestion(currentQuestion - 1);
    }
  };

  const calculateProgress = () => {
    const answered = Object.keys(selectedAnswers).length;
    return questions.length > 0 ? (answered / questions.length) * 100 : 0;
  };

  const handleSubmitQuiz = async () => {
    try {
      // Calculate score
      let score = 0;
      questions.forEach((q, index) => {
        if (selectedAnswers[index] === q.correctAnswer) {
          score++;
        }
      });

      const sessionData = {
        userId: user.id || (user as any)._id,
        subjectId: selectedSubject.id,
        score,
        totalQuestions: questions.length,
        answers: selectedAnswers,
        timeSpent: 3600 - timeLeft,
        isCompleted: true
      };

      const response = await fetch('/api/quiz/submit', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(sessionData),
      });

      if (!response.ok) throw new Error('Failed to submit quiz');

      const result = await response.json();
      
      // Show results and redirect back
      alert(`Quiz completed! Your score: ${score}/${questions.length} (${Math.round((score/questions.length)*100)}%)`);
      onBack();
      
    } catch (error) {
      console.error('Error submitting quiz:', error);
      alert('Failed to submit quiz. Please try again.');
    }
  };

  if (!isQuizStarted) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-indigo-900 via-purple-900 to-pink-800">
        {/* Header */}
        <div className="bg-white bg-opacity-10 backdrop-blur-sm">
          <div className="max-w-7xl mx-auto px-4 py-4">
            <div className="flex items-center space-x-4">
              <Button 
                variant="ghost" 
                size="sm" 
                onClick={onBack}
                className="text-white hover:bg-white hover:bg-opacity-20"
              >
                <ArrowLeft className="w-4 h-4 mr-2" />
                Back to Dashboard
              </Button>
              <div className="flex-1 text-center">
                <h1 className="text-lg font-bold text-white">0 of 1</h1>
              </div>
              <Button size="sm" variant="ghost" className="text-white">
                <Users className="w-4 h-4" />
              </Button>
            </div>
          </div>
        </div>

        <div className="max-w-4xl mx-auto px-4 py-6">
          {/* Subject Header */}
          <Card className="bg-gradient-to-r from-blue-600 to-purple-600 border-0 mb-6">
            <CardContent className="p-4">
              <div className="flex items-center space-x-3">
                <div className="w-12 h-12 bg-white bg-opacity-20 rounded-lg flex items-center justify-center">
                  <span className="text-2xl">{selectedSubject.emoji || '📝'}</span>
                </div>
                <div>
                  <h2 className="text-white text-lg font-bold">{selectedSubject.name}</h2>
                  <p className="text-blue-100 text-sm">Select at least 1 item for each subject</p>
                </div>
              </div>
            </CardContent>
          </Card>

          {selectedYear ? (
            /* Start Quiz Section */
            <div className="space-y-6">
              <Card className="bg-white bg-opacity-10 border-white border-opacity-20">
                <CardHeader>
                  <CardTitle className="text-white">Ready to Start?</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="space-y-4">
                    <div className="flex items-center justify-between text-white">
                      <span>Selected Year:</span>
                      <Badge variant="secondary" className="bg-blue-600 text-white">
                        {selectedYear}
                      </Badge>
                    </div>
                    <div className="flex items-center justify-between text-white">
                      <span>Questions:</span>
                      <span>40 questions</span>
                    </div>
                    <div className="flex items-center justify-between text-white">
                      <span>Time Limit:</span>
                      <span>1 hour</span>
                    </div>
                    <Button 
                      onClick={startQuiz}
                      className="w-full bg-blue-600 hover:bg-blue-700 text-white"
                    >
                      Start Quiz
                    </Button>
                  </div>
                </CardContent>
              </Card>
            </div>
          ) : (
            /* Year Selection */
            <div className="space-y-4">
              <div className="grid gap-4">
                {pastQuestionYears.map((item, index) => (
                  <Card 
                    key={item.year}
                    className={`bg-white bg-opacity-10 border-white border-opacity-20 cursor-pointer transition-all ${
                      item.isLocked ? 'opacity-60' : 'hover:bg-opacity-20'
                    }`}
                    onClick={() => !item.isLocked && handleYearSelect(item.year)}
                  >
                    <CardContent className="p-4">
                      <div className="flex items-center justify-between">
                        <div className="flex items-center space-x-3">
                          <div className="w-10 h-10 bg-white bg-opacity-20 rounded-lg flex items-center justify-center">
                            <FileText className="w-5 h-5 text-white" />
                          </div>
                          <div>
                            <h3 className="text-white font-medium">{item.year}</h3>
                          </div>
                        </div>
                        <div className="flex items-center space-x-2">
                          {item.isLocked ? (
                            <Lock className="w-5 h-5 text-gray-400" />
                          ) : (
                            <CheckCircle className="w-5 h-5 text-green-400" />
                          )}
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                ))}
              </div>

              {/* Continue Button */}
              <Button 
                disabled 
                className="w-full bg-gray-600 text-gray-300 mt-6"
              >
                Select a year to continue
              </Button>
            </div>
          )}
        </div>
      </div>
    );
  }

  // Quiz Started - Show Questions
  const currentQ = questions[currentQuestion];
  
  return (
    <div className="min-h-screen bg-gradient-to-br from-indigo-900 via-purple-900 to-pink-800">
      {/* Header with Timer */}
      <div className="bg-white bg-opacity-10 backdrop-blur-sm">
        <div className="max-w-7xl mx-auto px-4 py-3">
          <div className="flex items-center justify-between">
            <Button 
              variant="ghost" 
              size="sm" 
              onClick={onBack}
              className="text-white hover:bg-white hover:bg-opacity-20"
            >
              <ArrowLeft className="w-4 h-4 mr-2" />
              Exit Quiz
            </Button>
            <div className="flex items-center space-x-4">
              <div className="flex items-center space-x-2 text-white">
                <Clock className="w-4 h-4" />
                <span className="font-mono">{formatTime(timeLeft)}</span>
              </div>
              <Badge variant="secondary" className="bg-blue-600 text-white">
                {currentQuestion + 1} of {questions.length}
              </Badge>
            </div>
          </div>
        </div>
      </div>

      <div className="max-w-4xl mx-auto px-4 py-6">
        {/* Progress */}
        <div className="mb-6">
          <div className="flex justify-between text-sm text-purple-200 mb-2">
            <span>Question {currentQuestion + 1} of {questions.length}</span>
            <span>{Math.round(calculateProgress())}% Complete</span>
          </div>
          <Progress value={calculateProgress()} className="h-2" />
        </div>

        {/* Question Card */}
        <Card className="bg-white bg-opacity-10 border-white border-opacity-20 mb-6">
          <CardContent className="p-6">
            <h2 className="text-xl font-semibold text-white mb-6">
              {currentQuestion + 1}. {currentQ?.question}
            </h2>
            
            <div className="space-y-3">
              {currentQ?.options.map((option) => (
                <button
                  key={option.id}
                  onClick={() => handleAnswerSelect(currentQuestion, option.id)}
                  className={`w-full text-left p-4 rounded-lg border transition-all ${
                    selectedAnswers[currentQuestion] === option.id
                      ? 'bg-blue-600 border-blue-500 text-white'
                      : 'bg-white bg-opacity-10 border-white border-opacity-20 text-white hover:bg-opacity-20'
                  }`}
                >
                  <span className="font-medium mr-3">{option.id}.</span>
                  {option.text}
                </button>
              ))}
            </div>
          </CardContent>
        </Card>

        {/* Navigation */}
        <div className="flex justify-between">
          <Button 
            variant="outline" 
            onClick={prevQuestion}
            disabled={currentQuestion === 0}
            className="bg-white bg-opacity-10 border-white border-opacity-20 text-white hover:bg-opacity-20"
          >
            <ArrowLeft className="w-4 h-4 mr-2" />
            Previous
          </Button>
          
          <Button 
            onClick={nextQuestion}
            disabled={currentQuestion === questions.length - 1}
            className="bg-blue-600 hover:bg-blue-700 text-white"
          >
            Next
            <ArrowLeft className="w-4 h-4 ml-2 rotate-180" />
          </Button>
        </div>

        {/* Question Grid */}
        <div className="mt-8">
          <h3 className="text-white font-semibold mb-4">Question Navigation</h3>
          <div className="grid grid-cols-8 gap-2">
            {questions.map((_, index) => (
              <button
                key={index}
                onClick={() => setCurrentQuestion(index)}
                className={`aspect-square flex items-center justify-center text-sm rounded-lg transition-all ${
                  index === currentQuestion
                    ? 'bg-blue-600 text-white'
                    : selectedAnswers[index]
                    ? 'bg-green-600 text-white'
                    : 'bg-white bg-opacity-10 text-white hover:bg-opacity-20'
                }`}
              >
                {index + 1}
              </button>
            ))}
          </div>
        </div>

        {/* Submit Quiz (show when all questions answered) */}
        {Object.keys(selectedAnswers).length === questions.length && (
          <Card className="mt-6 bg-green-600 border-0">
            <CardContent className="p-4">
              <div className="text-center">
                <CheckCircle className="w-8 h-8 text-white mx-auto mb-2" />
                <p className="text-white font-semibold mb-3">All questions answered!</p>
                <Button 
                  className="bg-white text-green-600 hover:bg-gray-100"
                  onClick={handleSubmitQuiz}
                >
                  Submit Quiz
                </Button>
              </div>
            </CardContent>
          </Card>
        )}
      </div>
    </div>
  );
}