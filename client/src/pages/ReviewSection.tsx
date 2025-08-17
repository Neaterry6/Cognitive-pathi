import React from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { Trophy, Clock, Target, RotateCcw, Share2, CheckCircle, XCircle, Circle } from 'lucide-react';
import { Question } from '@/types';

interface QuizResult {
  session: any;
  score: number;
  correctAnswers: number;
  totalQuestions: number;
  timeSpent: number;
}

interface ReviewSectionProps {
  user?: any;
  result: QuizResult;
  questions: Question[];
  answers: Record<string, string>;
  subjectName?: string;
  onBack: () => void;
  onRetryQuiz?: () => void;
}

export default function ReviewSection({
  user,
  result,
  questions,
  answers,
  subjectName,
  onBack,
  onRetryQuiz,
}: ReviewSectionProps) {
  const formatTime = (seconds: number) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins}:${secs.toString().padStart(2, '0')}`;
  };

  const incorrectAnswers = result.totalQuestions - result.correctAnswers;
  const avgTimePerQuestion = Math.floor(result.timeSpent / result.totalQuestions);

  const createConfetti = () => {
    const confettiContainer = document.getElementById('confettiContainer');
    if (!confettiContainer) return;

    for (let i = 0; i < 50; i++) {
      const confetti = document.createElement('div');
      confetti.className = 'confetti-piece';
      confetti.style.left = Math.random() * 100 + '%';
      confetti.style.backgroundColor = ['#3B82F6', '#10B981', '#F59E0B', '#EF4444', '#8B5CF6'][Math.floor(Math.random() * 5)];
      confetti.style.animationDelay = Math.random() * 3 + 's';
      confetti.style.animationDuration = (Math.random() * 2 + 3) + 's';
      confettiContainer.appendChild(confetti);

      setTimeout(() => {
        confetti.remove();
      }, 5000);
    }
  };

  React.useEffect(() => {
    if (result.score >= 80) {
      createConfetti();
    }
  }, [result.score]);

  const getScoreColor = (score: number) => {
    if (score >= 80) return 'from-green-600 to-blue-600';
    if (score >= 60) return 'from-yellow-600 to-orange-600';
    return 'from-red-600 to-purple-600';
  };

  const getScoreEmoji = (score: number) => {
    if (score >= 90) return '🎉';
    if (score >= 80) return '🏆';
    if (score >= 70) return '👏';
    if (score >= 60) return '👍';
    return '💪';
  };

  return (
    <div className="space-y-6">
      {/* Results header */}
      <div className={`bg-gradient-to-r ${getScoreColor(result.score)} rounded-xl p-8 text-white`}>
        <div className="text-center">
          <div className="text-6xl mb-4">{getScoreEmoji(result.score)}</div>
          <h2 className="text-3xl font-bold mb-2">Quiz Completed!</h2>
          <p className="text-xl opacity-90 mb-4">{subjectName} Practice Test</p>
          <div className="flex justify-center items-center space-x-8">
            <div className="text-center">
              <div className="text-3xl font-bold">{result.score}%</div>
              <div className="text-sm opacity-80">Final Score</div>
            </div>
            <div className="text-center">
              <div className="text-3xl font-bold">{result.correctAnswers}/{result.totalQuestions}</div>
              <div className="text-sm opacity-80">Correct Answers</div>
            </div>
            <div className="text-center">
              <div className="text-3xl font-bold">{formatTime(result.timeSpent)}</div>
              <div className="text-sm opacity-80">Time Taken</div>
            </div>
          </div>
        </div>
      </div>

      {/* Performance breakdown */}
      <Card className="bg-gray-800 border-gray-700">
        <CardContent className="p-6">
          <h3 className="text-xl font-bold text-white mb-4">Performance Breakdown</h3>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
            <div className="bg-green-900 border border-green-600 rounded-lg p-4 text-center">
              <CheckCircle className="h-8 w-8 text-green-400 mx-auto mb-2" />
              <div className="text-2xl font-bold text-green-400">{result.correctAnswers}</div>
              <div className="text-sm text-green-300">Correct</div>
            </div>
            <div className="bg-red-900 border border-red-600 rounded-lg p-4 text-center">
              <XCircle className="h-8 w-8 text-red-400 mx-auto mb-2" />
              <div className="text-2xl font-bold text-red-400">{incorrectAnswers}</div>
              <div className="text-sm text-red-300">Incorrect</div>
            </div>
            <div className="bg-yellow-900 border border-yellow-600 rounded-lg p-4 text-center">
              <Circle className="h-8 w-8 text-yellow-400 mx-auto mb-2" />
              <div className="text-2xl font-bold text-yellow-400">0</div>
              <div className="text-sm text-yellow-300">Skipped</div>
            </div>
            <div className="bg-blue-900 border border-blue-600 rounded-lg p-4 text-center">
              <Clock className="h-8 w-8 text-blue-400 mx-auto mb-2" />
              <div className="text-2xl font-bold text-blue-400">{formatTime(avgTimePerQuestion)}</div>
              <div className="text-sm text-blue-300">Avg Time</div>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Question review */}
      <div className="space-y-4">
        <h3 className="text-xl font-bold text-white">Question Review</h3>
        {questions.map((question, index) => {
          const userAnswer = answers[question.id];
          const isCorrect = userAnswer === question.correctAnswer;
          const questionNumber = index + 1;

          return (
            <Card key={question.id} className="bg-gray-800 border-gray-700 overflow-hidden">
              <CardContent className="p-6">
                <div className="flex items-start justify-between mb-4">
                  <div className="flex items-center space-x-3">
                    <div className={`w-8 h-8 rounded-full flex items-center justify-center text-sm font-bold ${
                      isCorrect ? 'bg-green-600 text-white' : 'bg-red-600 text-white'
                    }`}>
                      {isCorrect ? '✓' : '✗'}
                    </div>
                    <h4 className="font-semibold text-white">Question {questionNumber}</h4>
                  </div>
                  <span className={`px-2 py-1 rounded text-sm font-medium ${
                    isCorrect 
                      ? 'bg-green-900 text-green-400'
                      : 'bg-red-900 text-red-400'
                  }`}>
                    {isCorrect ? 'Correct' : 'Incorrect'}
                  </span>
                </div>

                <p className="text-gray-300 mb-4">{question.question}</p>

                <div className="space-y-2 mb-4">
                  {question.options.map((option) => {
                    const isUserAnswer = userAnswer === option.label;
                    const isCorrectAnswer = option.label === question.correctAnswer;

                    return (
                      <div
                        key={option.label}
                        className={`p-3 rounded border-l-4 ${
                          isCorrectAnswer
                            ? 'bg-green-900 border-green-600'
                            : isUserAnswer && !isCorrectAnswer
                            ? 'bg-red-900 border-red-600'
                            : 'bg-gray-700 border-gray-600'
                        }`}
                      >
                        <div className="flex items-center">
                          <span className={`font-bold mr-2 ${
                            isCorrectAnswer
                              ? 'text-green-400'
                              : isUserAnswer && !isCorrectAnswer
                              ? 'text-red-400'
                              : 'text-gray-400'
                          }`}>
                            {option.label}.
                          </span>
                          <span className="text-gray-300">{option.text}</span>
                          {isCorrectAnswer && (
                            <span className="ml-2 text-green-400">✓ Correct answer</span>
                          )}
                          {isUserAnswer && !isCorrectAnswer && (
                            <span className="ml-2 text-red-400">✗ Your answer</span>
                          )}
                        </div>
                      </div>
                    );
                  })}
                </div>

                {question.explanation && (
                  <div className="bg-gray-900 rounded-lg p-4">
                    <p className="text-sm text-gray-300">
                      <strong>Explanation:</strong> {question.explanation}
                    </p>
                  </div>
                )}
              </CardContent>
            </Card>
          );
        })}
      </div>

      {/* Action buttons */}
      <div className="flex flex-col sm:flex-row items-center justify-center space-y-4 sm:space-y-0 sm:space-x-6">
        <Button
          onClick={onBack}
          className="bg-blue-600 hover:bg-blue-700 px-8 py-3 rounded-lg font-medium transition-colors"
        >
          <Target className="h-5 w-5 mr-2" />
          Back to Dashboard
        </Button>
        <Button
          onClick={onRetryQuiz}
          className="bg-green-600 hover:bg-green-700 px-8 py-3 rounded-lg font-medium transition-colors"
        >
          <RotateCcw className="h-5 w-5 mr-2" />
          Retry Quiz
        </Button>
        <Button
          onClick={() => {
            if (navigator.share) {
              navigator.share({
                title: 'My Quiz Results',
                text: `I just scored ${result.score}% on ${subjectName}!`,
                url: window.location.href,
              });
            }
          }}
          className="bg-purple-600 hover:bg-purple-700 px-8 py-3 rounded-lg font-medium transition-colors"
        >
          <Share2 className="h-5 w-5 mr-2" />
          Share Results
        </Button>
      </div>

      {/* Confetti Container */}
      <div id="confettiContainer" className="fixed inset-0 pointer-events-none z-40"></div>
    </div>
  );
}
