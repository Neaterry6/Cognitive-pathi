import React, { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { STUDY_PLAN_TOPICS, SUBJECTS } from '@/lib/constants';
import { User, Subject, StudyPlanContent } from '@/types';
import { apiRequest } from '@/lib/queryClient';

interface StudyPlanProps {
  user: User;
  subject: Subject;
  onBack: () => void;
  onStartQuiz: (subject: Subject, topic?: string) => void;
  onOpenCalculator: () => void;
}

export default function StudyPlan({ 
  user, 
  subject, 
  onBack, 
  onStartQuiz, 
  onOpenCalculator 
}: StudyPlanProps) {
  const [selectedTopic, setSelectedTopic] = useState<string | null>(null);
  const [studyContent, setStudyContent] = useState<StudyPlanContent | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [aiModel, setAiModel] = useState('gemini');

  const topics = STUDY_PLAN_TOPICS[subject.name as keyof typeof STUDY_PLAN_TOPICS] || [];
  const subjectInfo = SUBJECTS.find(s => s.name === subject.name);
  const showCalculator = subject.name === 'Mathematics' || subject.name === 'Physics';

  const loadStudyPlan = async (topic: string) => {
    setIsLoading(true);
    try {
      const response = await apiRequest('GET', `/api/study-plan/${subject.id}/${encodeURIComponent(topic)}?aiModel=${aiModel}`);
      const data = await response.json();
      setStudyContent(data);
    } catch (error) {
      console.error('Error loading study plan:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const regenerateStudyPlan = async () => {
    if (!selectedTopic) return;
    
    setIsLoading(true);
    try {
      const response = await apiRequest('POST', '/api/study-plan/regenerate', {
        subjectId: subject.id,
        topic: selectedTopic,
        aiModel,
      });
      const data = await response.json();
      setStudyContent(data);
    } catch (error) {
      console.error('Error regenerating study plan:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const markAsStudied = async () => {
    if (!selectedTopic) return;

    try {
      await apiRequest('POST', '/api/study-progress/mark-studied', {
        userId: user.id,
        subjectId: subject.id,
        topic: selectedTopic,
      });
      // Could show success message here
    } catch (error) {
      console.error('Error marking topic as studied:', error);
    }
  };

  const handleTopicSelect = (topic: string) => {
    setSelectedTopic(topic);
    loadStudyPlan(topic);
  };

  const handleBackToTopics = () => {
    setSelectedTopic(null);
    setStudyContent(null);
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center space-y-4 sm:space-y-0">
        <div className="flex items-center space-x-4">
          <div className="text-4xl">{subjectInfo?.emoji || '📚'}</div>
          <div>
            <h2 className="text-3xl font-bold text-white">Study Plan</h2>
            <p className="text-gray-400">{subject.name}</p>
          </div>
        </div>
        <Button
          onClick={onBack}
          className="bg-gray-600 hover:bg-gray-700 px-4 py-2 rounded-lg transition-colors"
        >
          ← Back to Dashboard
        </Button>
      </div>

      {!selectedTopic ? (
        /* Topic Selection */
        <div className="space-y-6">
          <div>
            <h3 className="text-xl font-bold text-white mb-4 flex items-center">
              🎯 Select a Topic to Study
              <span className="ml-2 text-sm bg-purple-600 px-2 py-1 rounded-full">Choose wisely</span>
            </h3>

            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
              {topics.map((topic, index) => {
                const progress = Math.floor(Math.random() * 100);
                const isCompleted = progress === 100;

                return (
                  <Button
                    key={topic}
                    onClick={() => handleTopicSelect(topic)}
                    className="bg-gray-800 hover:bg-gray-700 border-2 border-gray-700 hover:border-purple-500 rounded-xl p-6 transition-all duration-300 hover:scale-105 group h-auto"
                    variant="outline"
                  >
                    <div className="text-left space-y-3 w-full">
                      <div className="flex items-center justify-between">
                        <h4 className="font-bold text-lg text-white">{topic}</h4>
                        <div className="text-2xl group-hover:scale-110 transition-transform">
                          {index % 4 === 0 ? '📝' : index % 4 === 1 ? '📖' : index % 4 === 2 ? '✍️' : '🔤'}
                        </div>
                      </div>
                      <p className="text-sm text-gray-400">Essential concepts and practice</p>
                      <div className="flex items-center justify-between">
                        <div className="w-full bg-gray-700 rounded-full h-2 mr-2">
                          <div 
                            className={`h-2 rounded-full transition-all duration-300 ${
                              isCompleted ? 'bg-green-500' : 'bg-purple-500'
                            }`}
                            style={{ width: `${progress}%` }}
                          />
                        </div>
                        <span className={`text-xs font-medium ${
                          isCompleted ? 'text-green-400' : 'text-gray-400'
                        }`}>
                          {isCompleted ? '✓ Done' : `${progress}%`}
                        </span>
                      </div>
                    </div>
                  </Button>
                );
              })}
            </div>
          </div>
        </div>
      ) : (
        /* Study Content */
        <div className="space-y-6">
          <Card className="bg-gray-800 border-gray-700 overflow-hidden">
            {/* Content header */}
            <div className="p-6 border-b border-gray-700">
              <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center space-y-4 sm:space-y-0">
                <div>
                  <h3 className="text-2xl font-bold text-white mb-2">{selectedTopic}</h3>
                  <p className="text-gray-400">Master the fundamentals and practice</p>
                </div>
                <div className="flex flex-wrap items-center gap-2">
                  <Button
                    onClick={regenerateStudyPlan}
                    disabled={isLoading}
                    className="bg-blue-600 hover:bg-blue-700 px-4 py-2 rounded-lg text-sm transition-colors"
                  >
                    🔄 Regenerate
                  </Button>
                  <Button
                    onClick={() => setAiModel(aiModel === 'gemini' ? 'gpt4' : aiModel === 'gpt4' ? 'grok' : 'gemini')}
                    className="bg-yellow-600 hover:bg-yellow-700 px-4 py-2 rounded-lg text-sm transition-colors"
                  >
                    Switch to {aiModel === 'gemini' ? 'GPT-4' : aiModel === 'gpt4' ? 'Grok' : 'Gemini'}
                  </Button>
                  <Button
                    onClick={() => onStartQuiz(subject, selectedTopic)}
                    className="bg-gradient-to-r from-green-600 to-green-700 px-4 py-2 rounded-lg text-sm hover:opacity-90 transition-all"
                  >
                    📝 Take Quiz
                  </Button>
                  {showCalculator && (
                    <Button
                      onClick={onOpenCalculator}
                      className="bg-yellow-600 hover:bg-yellow-700 px-4 py-2 rounded-lg text-sm transition-colors"
                    >
                      🧮 Calculator
                    </Button>
                  )}
                </div>
              </div>
            </div>

            {/* Study plan content */}
            <CardContent className="p-6">
              {isLoading ? (
                <div className="flex items-center justify-center py-8">
                  <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-white mr-2"></div>
                  <span>Generating comprehensive study plan...</span>
                </div>
              ) : studyContent ? (
                <div className="prose prose-invert max-w-none">
                  <div 
                    className="text-gray-300 leading-relaxed"
                    dangerouslySetInnerHTML={{
                      __html: studyContent.content.replace(/\n/g, '<br/>')
                    }}
                  />
                </div>
              ) : (
                <div className="text-center py-8 text-gray-400">
                  No content available. Try regenerating the study plan.
                </div>
              )}
            </CardContent>

            {/* Progress tracking */}
            <div className="p-6 bg-gray-900 border-t border-gray-700">
              <div className="flex justify-between items-center mb-3">
                <span className="font-semibold text-white">Study Progress</span>
                <span className="text-purple-400 font-bold">65%</span>
              </div>
              <div className="w-full bg-gray-700 rounded-full h-3 mb-4">
                <div className="bg-purple-500 h-3 rounded-full transition-all duration-300" style={{ width: '65%' }} />
              </div>
              <Button
                onClick={markAsStudied}
                className="w-full bg-gradient-to-r from-green-600 to-green-700 text-white py-3 px-4 rounded-lg hover:opacity-90 transition-all duration-200 active:scale-95 font-medium"
              >
                ✓ Mark Topic as Studied
              </Button>
            </div>
          </Card>

          {/* Navigation buttons */}
          <div className="flex flex-col sm:flex-row items-center justify-between space-y-4 sm:space-y-0">
            <Button
              onClick={handleBackToTopics}
              className="bg-gray-600 hover:bg-gray-700 px-6 py-3 rounded-lg transition-colors font-medium"
            >
              ← Back to Topics
            </Button>
            <Button
              onClick={() => onStartQuiz(subject)}
              className="bg-indigo-600 hover:bg-indigo-700 px-6 py-3 rounded-lg transition-colors font-medium"
            >
              📚 Take Full Subject Quiz
            </Button>
          </div>
        </div>
      )}
    </div>
  );
}
