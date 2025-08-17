import React from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import { 
  Trophy, 
  Home, 
  Clock, 
  CheckCircle,
  XCircle,
  Award,
  Target,
  TrendingUp
} from 'lucide-react';

interface CBTResultsProps {
  results: {
    sessionId: string;
    score: number;
    totalQuestions: number;
    timeSpent: number;
    selectedAnswers: Record<number, string>;
    questions: any[];
    subjectBreakdown: Record<string, { correct: number; total: number; subject: string }>;
  };
  onReturnHome: () => void;
}

export default function CBTResults({ results, onReturnHome }: CBTResultsProps) {
  // Add safety checks for undefined properties
  if (!results) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-green-900 via-emerald-900 to-teal-900 p-4">
        <div className="max-w-4xl mx-auto text-center text-white">
          <h2 className="text-2xl font-bold mb-4">Loading Results...</h2>
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-white mx-auto"></div>
        </div>
      </div>
    );
  }

  const { score = 0, totalQuestions = 1, timeSpent = 0, subjectBreakdown = {} } = results;
  const percentage = Math.round((score / totalQuestions) * 100);
  
  const formatTime = (seconds: number) => {
    const hours = Math.floor(seconds / 3600);
    const minutes = Math.floor((seconds % 3600) / 60);
    return `${hours}h ${minutes}m`;
  };

  const getGrade = (percentage: number) => {
    if (percentage >= 70) return { grade: 'A', color: 'bg-green-600', text: 'Excellent!' };
    if (percentage >= 60) return { grade: 'B', color: 'bg-blue-600', text: 'Good!' };
    if (percentage >= 50) return { grade: 'C', color: 'bg-yellow-600', text: 'Fair' };
    if (percentage >= 40) return { grade: 'D', color: 'bg-orange-600', text: 'Below Average' };
    return { grade: 'F', color: 'bg-red-600', text: 'Poor' };
  };

  const gradeInfo = getGrade(percentage);

  return (
    <div className="min-h-screen bg-gradient-to-br from-green-900 via-emerald-900 to-teal-900 p-4">
      <div className="max-w-4xl mx-auto space-y-6">
        
        {/* Header */}
        <div className="text-center mb-8">
          <div className="w-20 h-20 bg-white bg-opacity-20 rounded-full flex items-center justify-center mx-auto mb-4">
            <Trophy className="w-10 h-10 text-yellow-400" />
          </div>
          <h1 className="text-4xl font-bold text-white mb-2">CBT Exam Complete!</h1>
          <p className="text-white text-opacity-80">Here are your results</p>
        </div>

        {/* Overall Results */}
        <Card className="bg-white bg-opacity-10 backdrop-blur-sm border-white border-opacity-20">
          <CardHeader className="text-center">
            <CardTitle className="text-white text-2xl">Overall Performance</CardTitle>
          </CardHeader>
          <CardContent className="space-y-6">
            <div className="text-center">
              <div className={`w-32 h-32 ${gradeInfo.color} rounded-full flex items-center justify-center mx-auto mb-4`}>
                <span className="text-white text-6xl font-bold">{gradeInfo.grade}</span>
              </div>
              <p className="text-white text-xl font-semibold">{gradeInfo.text}</p>
              <p className="text-white text-opacity-80">{percentage}% ({score}/{totalQuestions})</p>
            </div>

            <div className="grid md:grid-cols-3 gap-4 text-center">
              <div className="bg-white bg-opacity-10 rounded-lg p-4">
                <CheckCircle className="w-8 h-8 text-green-400 mx-auto mb-2" />
                <p className="text-white font-semibold text-2xl">{score}</p>
                <p className="text-white text-opacity-70 text-sm">Correct Answers</p>
              </div>
              
              <div className="bg-white bg-opacity-10 rounded-lg p-4">
                <XCircle className="w-8 h-8 text-red-400 mx-auto mb-2" />
                <p className="text-white font-semibold text-2xl">{totalQuestions - score}</p>
                <p className="text-white text-opacity-70 text-sm">Incorrect Answers</p>
              </div>
              
              <div className="bg-white bg-opacity-10 rounded-lg p-4">
                <Clock className="w-8 h-8 text-blue-400 mx-auto mb-2" />
                <p className="text-white font-semibold text-2xl">{formatTime(timeSpent)}</p>
                <p className="text-white text-opacity-70 text-sm">Time Taken</p>
              </div>
            </div>

            <div>
              <div className="flex justify-between text-white mb-2">
                <span>Overall Progress</span>
                <span>{percentage}%</span>
              </div>
              <Progress value={percentage} className="h-3" />
            </div>
          </CardContent>
        </Card>

        {/* Subject Breakdown */}
        <Card className="bg-white bg-opacity-10 backdrop-blur-sm border-white border-opacity-20">
          <CardHeader>
            <CardTitle className="text-white text-xl flex items-center gap-2">
              <Target className="w-6 h-6" />
              Subject Performance
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            {Object.entries(subjectBreakdown || {}).length > 0 ? Object.entries(subjectBreakdown).map(([subjectId, data]) => {
              if (!data || typeof data.correct === 'undefined' || typeof data.total === 'undefined') {
                return null;
              }
              
              const subjectPercentage = Math.round((data.correct / data.total) * 100);
              const subjectGrade = getGrade(subjectPercentage);
              
              return (
                <div key={subjectId} className="bg-white bg-opacity-10 rounded-lg p-4">
                  <div className="flex items-center justify-between mb-3">
                    <h3 className="text-white font-semibold">{data.subject || 'Unknown Subject'}</h3>
                    <Badge className={`${subjectGrade.color} text-white border-0`}>
                      {subjectGrade.grade}
                    </Badge>
                  </div>
                  
                  <div className="flex items-center justify-between text-white text-sm mb-2">
                    <span>{data.correct}/{data.total} correct</span>
                    <span>{subjectPercentage}%</span>
                  </div>
                  
                  <Progress value={subjectPercentage} className="h-2" />
                </div>
              );
            }).filter(Boolean) : (
              <div className="text-white text-center py-4">
                No subject breakdown available
              </div>
            )}
          </CardContent>
        </Card>

        {/* Performance Insights */}
        <Card className="bg-white bg-opacity-10 backdrop-blur-sm border-white border-opacity-20">
          <CardHeader>
            <CardTitle className="text-white text-xl flex items-center gap-2">
              <TrendingUp className="w-6 h-6" />
              Performance Insights
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-3">
            <div className="grid md:grid-cols-2 gap-4">
              <div className="bg-white bg-opacity-10 rounded-lg p-4">
                <Award className="w-8 h-8 text-yellow-400 mb-2" />
                <h4 className="text-white font-semibold mb-1">Best Subject</h4>
                <p className="text-white text-opacity-80">
                  {Object.entries(subjectBreakdown || {}).length > 0 ? Object.entries(subjectBreakdown).reduce((best, [id, data]) => {
                    if (!data || typeof data.correct === 'undefined' || typeof data.total === 'undefined') return best;
                    const percentage = (data.correct / data.total) * 100;
                    const bestPercentage = best && best.data ? (best.data.correct / best.data.total) * 100 : 0;
                    return percentage > bestPercentage ? { id, data } : best;
                  }, { id: '', data: { subject: 'N/A', correct: 0, total: 1 } })?.data?.subject || 'N/A' : 'N/A'}
                </p>
              </div>
              
              <div className="bg-white bg-opacity-10 rounded-lg p-4">
                <Target className="w-8 h-8 text-red-400 mb-2" />
                <h4 className="text-white font-semibold mb-1">Needs Improvement</h4>
                <p className="text-white text-opacity-80">
                  {Object.entries(subjectBreakdown || {}).length > 0 ? Object.entries(subjectBreakdown).reduce((worst, [id, data]) => {
                    if (!data || typeof data.correct === 'undefined' || typeof data.total === 'undefined') return worst;
                    const percentage = (data.correct / data.total) * 100;
                    const worstPercentage = worst && worst.data ? (worst.data.correct / worst.data.total) * 100 : 100;
                    return percentage < worstPercentage ? { id, data } : worst;
                  }, { id: '', data: { subject: 'N/A', correct: 0, total: 1 } })?.data?.subject || 'N/A' : 'N/A'}
                </p>
              </div>
            </div>

            <div className="bg-white bg-opacity-10 rounded-lg p-4">
              <h4 className="text-white font-semibold mb-2">Recommendations</h4>
              <ul className="text-white text-opacity-80 space-y-1">
                {percentage >= 70 ? (
                  <>
                    <li>• Excellent performance! Keep up the great work.</li>
                    <li>• Consider taking more advanced practice tests.</li>
                  </>
                ) : percentage >= 50 ? (
                  <>
                    <li>• Good effort! Focus on improving weaker subjects.</li>
                    <li>• Review questions you got wrong and understand the concepts.</li>
                    <li>• Practice more questions in subjects with lower scores.</li>
                  </>
                ) : (
                  <>
                    <li>• More practice needed to improve your performance.</li>
                    <li>• Focus on understanding fundamental concepts first.</li>
                    <li>• Consider reviewing study materials before taking more tests.</li>
                    <li>• Take advantage of the AI explanations for better understanding.</li>
                  </>
                )}
              </ul>
            </div>
          </CardContent>
        </Card>

        {/* Actions */}
        <div className="text-center">
          <Button
            onClick={onReturnHome}
            className="bg-white text-black hover:bg-gray-200 px-8 py-3 text-lg"
          >
            <Home className="w-5 h-5 mr-2" />
            Return to Dashboard
          </Button>
        </div>

      </div>
    </div>
  );
}