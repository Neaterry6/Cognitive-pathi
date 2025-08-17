import React, { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import QuizTimer from '@/components/QuizTimer';
import ProgressBar from '@/components/ProgressBar';
import { useQuiz } from '@/hooks/useQuiz';
import { useTimer } from '@/hooks/useTimer';
import { QUIZ_TIMER_DURATION, SUBJECTS } from '@/lib/constants';
import { User, Subject } from '@/types';
import { apiRequest } from '@/lib/queryClient';

interface QuizSectionProps {
  user: User;
  subject: Subject;
  onBack: () => void;
  onComplete: (results: any) => void;
  onOpenCalculator: () => void;
}

export default function QuizSection({ 
  user, 
  subject, 
  onBack, 
  onComplete, 
  onOpenCalculator 
}: QuizSectionProps) {
  const {
    currentSession,
    questions,
    currentQuestionIndex,
    currentQuestion,
    answers,
    isLoading,
    startQuiz,
    answerQuestion,
    nextQuestion,
    previousQuestion,
    submitQuiz,
    hasAnsweredCurrent,
    isFirstQuestion,
    isLastQuestion,
    progress,
  } = useQuiz();

  const {
    timeLeft,
    isRunning,
    start: startTimer,
    pause: pauseTimer,
    getElapsedTime,
    formatTime,
  } = useTimer(QUIZ_TIMER_DURATION, handleTimeUp);

  const [selectedAnswer, setSelectedAnswer] = useState<string>('');
  const [showExplanation, setShowExplanation] = useState(false);
  const [explanation, setExplanation] = useState('');
  const [aiModel, setAiModel] = useState('gemini');

  useEffect(() => {
    // Start quiz when component mounts
    startQuiz(user.id, subject.id).then(() => {
      startTimer();
    });
  }, [user.id, subject.id]);

  useEffect(() => {
    // Update selected answer when question changes
    if (currentQuestion) {
      setSelectedAnswer(answers[currentQuestion.id] || '');
      setShowExplanation(false);
      setExplanation('');
    }
  }, [currentQuestion, answers]);

  function handleTimeUp() {
    handleSubmit();
  }

  const handleAnswerSelect = (answer: string) => {
    if (currentQuestion) {
      setSelectedAnswer(answer);
      answerQuestion(currentQuestion.id, answer);
    }
  };

  const handleSubmit = async () => {
    try {
      pauseTimer();
      const results = await submitQuiz(getElapsedTime());
      if (results) {
        onComplete(results);
      }
    } catch (error) {
      console.error('Error submitting quiz:', error);
    }
  };

  const handleNext = () => {
    if (hasAnsweredCurrent && currentQuestion) {
      generateExplanation();
    }
    if (!isLastQuestion) {
      nextQuestion();
    }
  };

  const generateExplanation = async () => {
    if (!currentQuestion || !selectedAnswer) return;

    try {
      const response = await apiRequest('POST', '/api/ai/explain', {
        questionId: currentQuestion.id,
        question: currentQuestion.question,
        correctAnswer: currentQuestion.correctAnswer,
        userAnswer: selectedAnswer,
        aiModel,
        userId: user?.nickname,
        subject: selectedSubject?._id
      });
      const data = await response.json();
      setExplanation(data.explanation);
      setShowExplanation(true);
    } catch (error) {
      console.error('Error generating explanation:', error);
    }
  };

  const subjectInfo = SUBJECTS.find(s => s.name === subject.name);
  const showCalculator = subject.name === 'Mathematics' || subject.name === 'Physics';

  if (isLoading || !currentQuestion) {
    return (
      <div className="flex items-center justify-center min-h-96">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-500 mx-auto mb-4"></div>
          <p className="text-gray-400">Loading quiz...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Quiz header */}
      <Card className="bg-gray-800 border-gray-700">
        <CardContent className="p-6">
          <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center space-y-4 sm:space-y-0">
            {/* Question counter and subject */}
            <div className="flex items-center space-x-4">
              <div className="text-2xl">{subjectInfo?.emoji || '📝'}</div>
              <div>
                <h2 className="text-xl font-bold text-white">{subject.name}</h2>
                <p className="text-gray-400">
                  Question {currentQuestionIndex + 1} of {questions.length}
                </p>
              </div>
            </div>

            {/* Timer and actions */}
            <div className="flex items-center space-x-4">
              <QuizTimer 
                timeLeft={timeLeft}
                formatTime={formatTime}
                isRunning={isRunning}
              />
              
              {showCalculator && (
                <Button
                  onClick={onOpenCalculator}
                  className="bg-yellow-600 hover:bg-yellow-700 px-4 py-2 rounded-lg transition-colors"
                >
                  🧮 Calculator
                </Button>
              )}
            </div>
          </div>

          <div className="mt-4">
            <ProgressBar 
              current={currentQuestionIndex + 1} 
              total={questions.length} 
            />
          </div>
        </CardContent>
      </Card>

      {/* Question content */}
      <Card className="bg-gray-800 border-gray-700">
        <CardContent className="p-8">
          {/* Question image (if applicable) */}
          {currentQuestion.imageUrl && (
            <img
              src={currentQuestion.imageUrl}
              alt="Question illustration"
              className="w-full max-h-64 object-contain rounded-lg mb-6"
            />
          )}

          {/* Question text */}
          <div className="mb-8">
            <p className="text-xl leading-relaxed text-white">
              {currentQuestion.question}
            </p>
          </div>

          {/* Answer options */}
          <div className="space-y-4">
            {currentQuestion.options.map((option) => {
              const isSelected = selectedAnswer === option.label;
              const isCorrect = showExplanation && option.label === currentQuestion.correctAnswer;
              const isIncorrect = showExplanation && isSelected && option.label !== currentQuestion.correctAnswer;

              return (
                <Button
                  key={option.label}
                  onClick={() => handleAnswerSelect(option.label)}
                  disabled={showExplanation}
                  className={`w-full p-4 text-left transition-all duration-200 h-auto ${
                    isCorrect
                      ? 'bg-green-900 border-green-600 border-2'
                      : isIncorrect
                      ? 'bg-red-900 border-red-600 border-2'
                      : isSelected
                      ? 'bg-blue-900 border-blue-500 border-2'
                      : 'bg-gray-700 hover:bg-gray-600 border-2 border-gray-600'
                  }`}
                  variant="outline"
                >
                  <div className="flex items-center space-x-4">
                    <div className={`w-8 h-8 rounded-full flex items-center justify-center font-bold ${
                      isCorrect
                        ? 'bg-green-600 text-white'
                        : isIncorrect
                        ? 'bg-red-600 text-white'
                        : isSelected
                        ? 'bg-blue-600 text-white'
                        : 'bg-blue-600 text-white'
                    }`}>
                      {option.label}
                    </div>
                    <span className="text-lg text-white flex-1">
                      {option.text}
                      {isCorrect && showExplanation && <span className="ml-2 text-green-400">✓</span>}
                      {isIncorrect && <span className="ml-2 text-red-400">✗</span>}
                    </span>
                  </div>
                </Button>
              );
            })}
          </div>
        </CardContent>
      </Card>

      {/* Navigation and actions */}
      <div className="flex flex-col sm:flex-row justify-between items-center space-y-4 sm:space-y-0">
        <Button
          onClick={previousQuestion}
          disabled={isFirstQuestion}
          className="bg-gray-600 hover:bg-gray-700 px-6 py-3 rounded-lg transition-colors font-medium disabled:opacity-50 disabled:cursor-not-allowed"
        >
          ← Previous
        </Button>

        <div className="flex items-center space-x-4">
          {!showExplanation && hasAnsweredCurrent && (
            <Button
              onClick={generateExplanation}
              className="bg-green-600 hover:bg-green-700 px-6 py-3 rounded-lg transition-colors font-medium"
            >
              Submit Answer
            </Button>
          )}
          
          {showExplanation && !isLastQuestion && (
            <Button
              onClick={handleNext}
              className="bg-blue-600 hover:bg-blue-700 px-6 py-3 rounded-lg transition-colors font-medium"
            >
              Next →
            </Button>
          )}

          {isLastQuestion && showExplanation && (
            <Button
              onClick={handleSubmit}
              className="bg-green-600 hover:bg-green-700 px-6 py-3 rounded-lg transition-colors font-medium"
            >
              Finish Quiz
            </Button>
          )}
        </div>
      </div>

      {/* Explanation section */}
      {showExplanation && explanation && (
        <Card className="bg-gray-800 border-gray-700">
          <CardContent className="p-6">
            <div className="flex justify-between items-start mb-4">
              <h3 className="text-lg font-bold text-white flex items-center">
                <span className={`mr-2 ${selectedAnswer === currentQuestion.correctAnswer ? 'text-green-500' : 'text-red-500'}`}>
                  {selectedAnswer === currentQuestion.correctAnswer ? '✓' : '✗'}
                </span>
                Correct Answer: {currentQuestion.correctAnswer}
              </h3>
              <Button
                onClick={() => setAiModel(aiModel === 'gemini' ? 'gpt4' : 'gemini')}
                className="bg-purple-600 hover:bg-purple-700 px-3 py-1 rounded-lg text-sm transition-colors"
              >
                Switch to {aiModel === 'gemini' ? 'GPT-4' : 'Gemini'}
              </Button>
            </div>

            <div className="bg-gray-900 rounded-lg p-4 mb-4">
              <p className="text-gray-300 leading-relaxed whitespace-pre-wrap">
                {explanation}
              </p>
            </div>

            <div className="flex items-center text-sm text-gray-400">
              <span className="mr-2">🤖</span>
              <span>Generated by {aiModel === 'gemini' ? 'Gemini' : aiModel === 'gpt4' ? 'GPT-4' : 'Grok'} AI</span>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Back button */}
      <div className="flex justify-start">
        <Button
          onClick={onBack}
          variant="ghost"
          className="text-gray-400 hover:text-white"
        >
          ← Back to Dashboard
        </Button>
      </div>
    </div>
  );
}
