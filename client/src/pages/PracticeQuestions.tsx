import React, { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import { User, Subject } from '@shared/schema';
import { 
  ArrowLeft, 
  RefreshCw, 
  CheckCircle, 
  XCircle,
  BookOpen,
  Target,
  Clock,
  BarChart3
} from 'lucide-react';

interface PracticeQuestionsProps {
  user: User;
  subjects: Subject[];
  onBack: () => void;
}

interface PracticeQuestion {
  id: string;
  question: string;
  options: Array<{ id: string; text: string }>;
  correctAnswer: string;
  subject: string;
  difficulty: string;
  explanation: string;
  year: number;
  examType: string;
}

export default function PracticeQuestions({ user, subjects, onBack }: PracticeQuestionsProps) {
  const [selectedSubject, setSelectedSubject] = useState<Subject | null>(null);
  const [questions, setQuestions] = useState<PracticeQuestion[]>([]);
  const [currentQuestionIndex, setCurrentQuestionIndex] = useState(0);
  const [selectedAnswer, setSelectedAnswer] = useState<string>('');
  const [showAnswer, setShowAnswer] = useState(false);
  const [score, setScore] = useState(0);
  const [answeredQuestions, setAnsweredQuestions] = useState(0);
  const [isLoading, setIsLoading] = useState(false);
  const [studyMode, setStudyMode] = useState<'practice' | 'timed'>('practice');

  const fetchQuestions = async (subject: Subject, count = 30) => {
    setIsLoading(true);
    try {
      const response = await fetch(`/api/quiz/questions/${subject.id}?limit=${count}&type=utme`);
      if (response.ok) {
        const data = await response.json();
        setQuestions(data || []);
        setCurrentQuestionIndex(0);
        setSelectedAnswer('');
        setShowAnswer(false);
        setScore(0);
        setAnsweredQuestions(0);
      } else {
        console.error('Failed to fetch questions');
      }
    } catch (error) {
      console.error('Error fetching questions:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const handleSubjectSelect = (subject: Subject) => {
    setSelectedSubject(subject);
    fetchQuestions(subject);
  };

  const handleAnswerSelect = (answerId: string) => {
    if (showAnswer) return;
    setSelectedAnswer(answerId);
  };

  const handleShowAnswer = () => {
    if (!selectedAnswer) return;
    
    setShowAnswer(true);
    setAnsweredQuestions(prev => prev + 1);
    
    if (selectedAnswer === questions[currentQuestionIndex]?.correctAnswer) {
      setScore(prev => prev + 1);
    }
  };

  const handleNextQuestion = () => {
    if (currentQuestionIndex < questions.length - 1) {
      setCurrentQuestionIndex(prev => prev + 1);
      setSelectedAnswer('');
      setShowAnswer(false);
    }
  };

  const handlePrevQuestion = () => {
    if (currentQuestionIndex > 0) {
      setCurrentQuestionIndex(prev => prev - 1);
      setSelectedAnswer('');
      setShowAnswer(false);
    }
  };

  const handleRefreshQuestions = () => {
    if (selectedSubject) {
      fetchQuestions(selectedSubject);
    }
  };

  const currentQuestion = questions[currentQuestionIndex];
  const progress = questions.length > 0 ? ((currentQuestionIndex + 1) / questions.length) * 100 : 0;
  const accuracy = answeredQuestions > 0 ? Math.round((score / answeredQuestions) * 100) : 0;

  if (!selectedSubject) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-blue-900 via-purple-900 to-indigo-900 p-4">
        <div className="max-w-6xl mx-auto">
          {/* Header */}
          <div className="flex items-center justify-between mb-8">
            <Button
              onClick={onBack}
              variant="ghost"
              className="text-white hover:bg-white/10"
            >
              <ArrowLeft className="h-5 w-5 mr-2" />
              Back to Dashboard
            </Button>
            <div className="text-center">
              <h1 className="text-3xl font-bold text-white mb-2">Practice Questions</h1>
              <p className="text-blue-200">Study with authentic JAMB past questions</p>
            </div>
            <div className="w-20" />
          </div>

          {/* Subject Selection */}
          <div className="grid md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
            {subjects.map((subject) => (
              <Card
                key={subject.id}
                className="bg-white/10 backdrop-blur-lg border-white/20 hover:bg-white/15 transition-all cursor-pointer group"
                onClick={() => handleSubjectSelect(subject)}
              >
                <CardHeader className="text-center">
                  <div className="text-4xl mb-3">{subject.emoji}</div>
                  <CardTitle className="text-white text-lg">{subject.name}</CardTitle>
                </CardHeader>
                <CardContent className="text-center">
                  <p className="text-blue-200 text-sm mb-4">{subject.description}</p>
                  <Badge variant="secondary" className="bg-blue-500/20 text-blue-200">
                    {subject.category}
                  </Badge>
                  <div className="mt-4">
                    <Button className="w-full bg-gradient-to-r from-blue-500 to-purple-500 hover:from-blue-600 hover:to-purple-600">
                      <BookOpen className="h-4 w-4 mr-2" />
                      Start Practice
                    </Button>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>

          {/* Features */}
          <div className="grid md:grid-cols-3 gap-6 mt-12">
            <Card className="bg-white/10 backdrop-blur-lg border-white/20">
              <CardContent className="p-6 text-center">
                <Target className="h-12 w-12 text-blue-400 mx-auto mb-4" />
                <h3 className="text-white font-semibold mb-2">Authentic Questions</h3>
                <p className="text-blue-200 text-sm">Practice with real JAMB past questions from ALOC database</p>
              </CardContent>
            </Card>
            <Card className="bg-white/10 backdrop-blur-lg border-white/20">
              <CardContent className="p-6 text-center">
                <BarChart3 className="h-12 w-12 text-purple-400 mx-auto mb-4" />
                <h3 className="text-white font-semibold mb-2">Track Progress</h3>
                <p className="text-blue-200 text-sm">Monitor your performance and accuracy across subjects</p>
              </CardContent>
            </Card>
            <Card className="bg-white/10 backdrop-blur-lg border-white/20">
              <CardContent className="p-6 text-center">
                <Clock className="h-12 w-12 text-green-400 mx-auto mb-4" />
                <h3 className="text-white font-semibold mb-2">Flexible Study</h3>
                <p className="text-blue-200 text-sm">Practice at your own pace or use timed mode</p>
              </CardContent>
            </Card>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-900 via-purple-900 to-indigo-900 p-4">
      <div className="max-w-4xl mx-auto">
        {/* Header */}
        <div className="flex items-center justify-between mb-8">
          <Button
            onClick={() => setSelectedSubject(null)}
            variant="ghost"
            className="text-white hover:bg-white/10"
          >
            <ArrowLeft className="h-5 w-5 mr-2" />
            Back to Subjects
          </Button>
          <div className="text-center">
            <h1 className="text-2xl font-bold text-white mb-1">
              {selectedSubject.emoji} {selectedSubject.name}
            </h1>
            <p className="text-blue-200">Practice Questions</p>
          </div>
          <Button
            onClick={handleRefreshQuestions}
            disabled={isLoading}
            className="bg-blue-500 hover:bg-blue-600"
          >
            <RefreshCw className={`h-4 w-4 mr-2 ${isLoading ? 'animate-spin' : ''}`} />
            New Set
          </Button>
        </div>

        {/* Progress Stats */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-8">
          <Card className="bg-white/10 backdrop-blur-lg border-white/20">
            <CardContent className="p-4 text-center">
              <div className="text-2xl font-bold text-white">{currentQuestionIndex + 1}</div>
              <div className="text-blue-200 text-sm">of {questions.length}</div>
            </CardContent>
          </Card>
          <Card className="bg-white/10 backdrop-blur-lg border-white/20">
            <CardContent className="p-4 text-center">
              <div className="text-2xl font-bold text-green-400">{score}</div>
              <div className="text-blue-200 text-sm">Correct</div>
            </CardContent>
          </Card>
          <Card className="bg-white/10 backdrop-blur-lg border-white/20">
            <CardContent className="p-4 text-center">
              <div className="text-2xl font-bold text-yellow-400">{accuracy}%</div>
              <div className="text-blue-200 text-sm">Accuracy</div>
            </CardContent>
          </Card>
          <Card className="bg-white/10 backdrop-blur-lg border-white/20">
            <CardContent className="p-4 text-center">
              <div className="text-2xl font-bold text-purple-400">{answeredQuestions}</div>
              <div className="text-blue-200 text-sm">Answered</div>
            </CardContent>
          </Card>
        </div>

        {/* Progress Bar */}
        <div className="mb-8">
          <Progress value={progress} className="h-2 bg-white/20" />
        </div>

        {/* Question */}
        {isLoading ? (
          <Card className="bg-white/10 backdrop-blur-lg border-white/20">
            <CardContent className="p-8 text-center">
              <RefreshCw className="h-8 w-8 animate-spin text-blue-400 mx-auto mb-4" />
              <p className="text-white">Loading questions from ALOC API...</p>
            </CardContent>
          </Card>
        ) : currentQuestion ? (
          <Card className="bg-white/10 backdrop-blur-lg border-white/20 mb-8">
            <CardHeader>
              <div className="flex items-center justify-between">
                <Badge variant="secondary" className="bg-blue-500/20 text-blue-200">
                  {currentQuestion.examType?.toUpperCase()} {currentQuestion.year}
                </Badge>
                <Badge variant="secondary" className="bg-purple-500/20 text-purple-200">
                  {currentQuestion.difficulty}
                </Badge>
              </div>
            </CardHeader>
            <CardContent className="space-y-6">
              <div className="text-white text-lg leading-relaxed">
                {currentQuestion.question}
              </div>

              {/* Options */}
              <div className="space-y-3">
                {currentQuestion.options?.map((option) => (
                  <button
                    key={option.id}
                    onClick={() => handleAnswerSelect(option.id)}
                    disabled={showAnswer}
                    className={`w-full p-4 text-left rounded-lg border transition-all ${
                      selectedAnswer === option.id
                        ? showAnswer
                          ? option.id === currentQuestion.correctAnswer
                            ? 'bg-green-500/20 border-green-500 text-green-200'
                            : 'bg-red-500/20 border-red-500 text-red-200'
                          : 'bg-blue-500/20 border-blue-500 text-blue-200'
                        : showAnswer && option.id === currentQuestion.correctAnswer
                        ? 'bg-green-500/20 border-green-500 text-green-200'
                        : 'bg-white/10 border-white/20 text-white hover:bg-white/20'
                    }`}
                  >
                    <div className="flex items-center">
                      <span className="w-8 h-8 rounded-full bg-white/20 flex items-center justify-center mr-3 text-sm font-medium">
                        {option.id}
                      </span>
                      <span>{option.text}</span>
                      {showAnswer && option.id === currentQuestion.correctAnswer && (
                        <CheckCircle className="h-5 w-5 ml-auto text-green-400" />
                      )}
                      {showAnswer && selectedAnswer === option.id && option.id !== currentQuestion.correctAnswer && (
                        <XCircle className="h-5 w-5 ml-auto text-red-400" />
                      )}
                    </div>
                  </button>
                ))}
              </div>

              {/* Explanation */}
              {showAnswer && currentQuestion.explanation && (
                <div className="bg-blue-500/10 border border-blue-500/20 rounded-lg p-4">
                  <h4 className="text-blue-200 font-semibold mb-2">Explanation:</h4>
                  <p className="text-blue-100">{currentQuestion.explanation}</p>
                </div>
              )}

              {/* Action Buttons */}
              <div className="flex justify-between">
                <Button
                  onClick={handlePrevQuestion}
                  disabled={currentQuestionIndex === 0}
                  variant="outline"
                  className="border-white/20 text-white hover:bg-white/10"
                >
                  Previous
                </Button>

                <div className="space-x-2">
                  {!showAnswer ? (
                    <Button
                      onClick={handleShowAnswer}
                      disabled={!selectedAnswer}
                      className="bg-gradient-to-r from-blue-500 to-purple-500 hover:from-blue-600 hover:to-purple-600"
                    >
                      Show Answer
                    </Button>
                  ) : (
                    <Button
                      onClick={handleNextQuestion}
                      disabled={currentQuestionIndex === questions.length - 1}
                      className="bg-gradient-to-r from-green-500 to-blue-500 hover:from-green-600 hover:to-blue-600"
                    >
                      Next Question
                    </Button>
                  )}
                </div>
              </div>
            </CardContent>
          </Card>
        ) : (
          <Card className="bg-white/10 backdrop-blur-lg border-white/20">
            <CardContent className="p-8 text-center">
              <p className="text-white mb-4">No questions available. Try refreshing to get new questions.</p>
              <Button onClick={handleRefreshQuestions} className="bg-blue-500 hover:bg-blue-600">
                <RefreshCw className="h-4 w-4 mr-2" />
                Refresh Questions
              </Button>
            </CardContent>
          </Card>
        )}
      </div>
    </div>
  );
}