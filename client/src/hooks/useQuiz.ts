import { useState, useCallback } from 'react';
import { Question, QuizSession } from '../types';
import { apiRequest } from '../lib/queryClient';

export function useQuiz() {
  const [currentSession, setCurrentSession] = useState<QuizSession | null>(null);
  const [questions, setQuestions] = useState<Question[]>([]);
  const [currentQuestionIndex, setCurrentQuestionIndex] = useState(0);
  const [answers, setAnswers] = useState<Record<string, string>>({});
  const [isLoading, setIsLoading] = useState(false);

  const startQuiz = useCallback(async (userId: string, subjectId: string) => {
    setIsLoading(true);
    try {
      // Fetch questions for the subject
      const questionsResponse = await apiRequest('GET', `/api/quiz/questions/${subjectId}`);
      const questionsData = await questionsResponse.json();
      setQuestions(questionsData);

      // Create quiz session
      const sessionData = {
        userId,
        subjectId,
        questionIds: questionsData.map((q: Question) => q.id),
        totalQuestions: questionsData.length,
      };

      const sessionResponse = await apiRequest('POST', '/api/quiz/start', sessionData);
      const session = await sessionResponse.json();
      setCurrentSession(session);
      setCurrentQuestionIndex(0);
      setAnswers({});
    } catch (error) {
      console.error('Error starting quiz:', error);
      throw error;
    } finally {
      setIsLoading(false);
    }
  }, []);

  const answerQuestion = useCallback((questionId: string, answer: string) => {
    setAnswers(prev => ({
      ...prev,
      [questionId]: answer
    }));
  }, []);

  const nextQuestion = useCallback(() => {
    if (currentQuestionIndex < questions.length - 1) {
      setCurrentQuestionIndex(prev => prev + 1);
    }
  }, [currentQuestionIndex, questions.length]);

  const previousQuestion = useCallback(() => {
    if (currentQuestionIndex > 0) {
      setCurrentQuestionIndex(prev => prev - 1);
    }
  }, [currentQuestionIndex]);

  const submitQuiz = useCallback(async (timeSpent: number) => {
    if (!currentSession) return null;

    setIsLoading(true);
    try {
      // Calculate score
      let correctAnswers = 0;
      questions.forEach(question => {
        if (answers[question.id] === question.correctAnswer) {
          correctAnswers++;
        }
      });

      const score = Math.round((correctAnswers / questions.length) * 100);

      // Update session
      const updates = {
        answers,
        score,
        timeSpent,
        isCompleted: true,
        completedAt: new Date().toISOString(),
      };

      const response = await apiRequest('PUT', `/api/quiz/session/${currentSession.id}`, updates);
      const updatedSession = await response.json();
      setCurrentSession(updatedSession);

      return {
        session: updatedSession,
        score,
        correctAnswers,
        totalQuestions: questions.length,
        timeSpent,
      };
    } catch (error) {
      console.error('Error submitting quiz:', error);
      throw error;
    } finally {
      setIsLoading(false);
    }
  }, [currentSession, questions, answers]);

  const resetQuiz = useCallback(() => {
    setCurrentSession(null);
    setQuestions([]);
    setCurrentQuestionIndex(0);
    setAnswers({});
  }, []);

  return {
    currentSession,
    questions,
    currentQuestionIndex,
    currentQuestion: questions[currentQuestionIndex],
    answers,
    isLoading,
    startQuiz,
    answerQuestion,
    nextQuestion,
    previousQuestion,
    submitQuiz,
    resetQuiz,
    hasAnsweredCurrent: currentSession ? !!answers[questions[currentQuestionIndex]?.id] : false,
    isFirstQuestion: currentQuestionIndex === 0,
    isLastQuestion: currentQuestionIndex === questions.length - 1,
    progress: questions.length > 0 ? ((currentQuestionIndex + 1) / questions.length) * 100 : 0,
  };
}
