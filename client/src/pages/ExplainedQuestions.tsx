import React, { useEffect, useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Trash2, PlayCircle, BookOpen } from 'lucide-react';
import { useAuth } from '@/hooks/useAuth';

interface ExplainedQuestion {
  _id: string;
  userId: string;
  subjectId: string;
  questionId: string;
  question: string;
  options: Array<{ id: string; text: string }>;
  correctAnswer: string;
  userAnswer: string;
  isCorrect: boolean;
  explanation: string;
  aiModel: string;
  difficulty: string;
  topic?: string;
  explainedAt: string;
}

export default function ExplainedQuestions() {
  const { user } = useAuth();
  const [explainedQuestions, setExplainedQuestions] = useState<ExplainedQuestion[]>([]);
  const [selectedSubject, setSelectedSubject] = useState<string>('all');
  const [loading, setLoading] = useState(true);
  const [subjects, setSubjects] = useState<any[]>([]);

  useEffect(() => {
    fetchSubjects();
    if (user) {
      fetchExplainedQuestions();
    }
  }, [user, selectedSubject]);

  const fetchSubjects = async () => {
    try {
      const response = await fetch('/api/subjects');
      const data = await response.json();
      setSubjects(data);
    } catch (error) {
      console.error('Error fetching subjects:', error);
    }
  };

  const fetchExplainedQuestions = async () => {
    if (!user) return;
    
    try {
      setLoading(true);
      const url = selectedSubject === 'all' 
        ? `/api/explained-questions/${user.nickname}?limit=50`
        : `/api/explained-questions/${user.nickname}/${selectedSubject}?limit=50`;
        
      const response = await fetch(url);
      const data = await response.json();
      setExplainedQuestions(data);
    } catch (error) {
      console.error('Error fetching explained questions:', error);
    } finally {
      setLoading(false);
    }
  };

  const deleteExplainedQuestion = async (id: string) => {
    try {
      await fetch(`/api/explained-questions/${id}`, {
        method: 'DELETE'
      });
      setExplainedQuestions(prev => prev.filter(q => q._id !== id));
    } catch (error) {
      console.error('Error deleting explained question:', error);
    }
  };

  const generateQuizFromExplained = async (subjectId: string) => {
    if (!user) return;
    
    try {
      const response = await fetch(`/api/quiz/from-explained/${user.nickname}/${subjectId}?limit=20`);
      const quizData = await response.json();
      
      if (quizData.length > 0) {
        // Store quiz data and navigate to quiz page
        localStorage.setItem('explainedQuizData', JSON.stringify(quizData));
        window.location.href = `/quiz?from=explained&subject=${subjectId}`;
      } else {
        alert('No explained questions found for this subject to create a quiz.');
      }
    } catch (error) {
      console.error('Error generating quiz from explained questions:', error);
    }
  };

  if (!user) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100 flex items-center justify-center">
        <Card className="p-6">
          <CardContent>
            <p>Please log in to view your explained questions.</p>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100 p-4">
      <div className="max-w-6xl mx-auto">
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-gray-800 mb-2">My Explained Questions</h1>
          <p className="text-gray-600">Review questions you've asked for AI explanations and create practice quizzes</p>
        </div>

        <div className="flex flex-col md:flex-row gap-4 mb-6">
          <div className="flex-1">
            <Select value={selectedSubject} onValueChange={setSelectedSubject}>
              <SelectTrigger className="w-full">
                <SelectValue placeholder="Select subject" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Subjects</SelectItem>
                {subjects.map(subject => (
                  <SelectItem key={subject._id} value={subject._id}>
                    {subject.emoji} {subject.name}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
          
          {selectedSubject !== 'all' && explainedQuestions.length > 0 && (
            <Button 
              onClick={() => generateQuizFromExplained(selectedSubject)}
              className="bg-green-600 hover:bg-green-700"
            >
              <PlayCircle className="w-4 h-4 mr-2" />
              Create Quiz from These Questions
            </Button>
          )}
        </div>

        {loading ? (
          <div className="text-center py-12">
            <p>Loading your explained questions...</p>
          </div>
        ) : explainedQuestions.length === 0 ? (
          <Card className="p-8">
            <CardContent className="text-center">
              <BookOpen className="w-12 h-12 mx-auto text-gray-400 mb-4" />
              <p className="text-gray-600 text-lg">No explained questions found</p>
              <p className="text-gray-500 mt-2">
                Take a quiz and request AI explanations to see them here
              </p>
            </CardContent>
          </Card>
        ) : (
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            {explainedQuestions.map((question) => {
              const subject = subjects.find(s => s._id === question.subjectId);
              const isCorrect = question.isCorrect;
              
              return (
                <Card key={question._id} className="border-l-4 border-l-blue-500">
                  <CardHeader className="pb-3">
                    <div className="flex justify-between items-start">
                      <div>
                        <Badge variant={isCorrect ? "default" : "destructive"} className="mb-2">
                          {isCorrect ? "Correct" : "Incorrect"}
                        </Badge>
                        {subject && (
                          <Badge variant="outline" className="ml-2">
                            {subject.emoji} {subject.name}
                          </Badge>
                        )}
                      </div>
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => deleteExplainedQuestion(question._id)}
                        className="text-red-600 hover:text-red-700"
                      >
                        <Trash2 className="w-4 h-4" />
                      </Button>
                    </div>
                  </CardHeader>
                  
                  <CardContent className="space-y-4">
                    <div>
                      <h3 className="font-semibold text-lg mb-3">{question.question}</h3>
                      
                      <div className="grid grid-cols-1 gap-2 mb-4">
                        {question.options.map((option) => (
                          <div 
                            key={option.id} 
                            className={`p-2 rounded text-sm ${
                              option.id === question.correctAnswer
                                ? 'bg-green-100 border-green-300 border'
                                : option.id === question.userAnswer && !isCorrect
                                ? 'bg-red-100 border-red-300 border'
                                : 'bg-gray-50'
                            }`}
                          >
                            <span className="font-medium">{option.id}:</span> {option.text}
                          </div>
                        ))}
                      </div>
                    </div>
                    
                    <div className="bg-blue-50 p-4 rounded-lg">
                      <h4 className="font-semibold text-blue-900 mb-2">AI Explanation:</h4>
                      <p className="text-blue-800 text-sm leading-relaxed">{question.explanation}</p>
                    </div>
                    
                    <div className="flex justify-between text-xs text-gray-500 pt-2 border-t">
                      <span>AI Model: {question.aiModel}</span>
                      <span>Explained: {new Date(question.explainedAt).toLocaleDateString()}</span>
                    </div>
                  </CardContent>
                </Card>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
}