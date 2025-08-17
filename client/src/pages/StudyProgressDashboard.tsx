import React, { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Progress } from '@/components/ui/progress';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Badge } from '@/components/ui/badge';
import { 
  Calendar, 
  Target, 
  TrendingUp, 
  Award, 
  Clock, 
  BookOpen, 
  CheckCircle2, 
  Flame,
  BarChart3,
  Settings
} from 'lucide-react';

interface StudyProgressData {
  subjectId: string;
  subjectName: string;
  totalQuestions: number;
  correctAnswers: number;
  incorrectAnswers: number;
  averageScore: number;
  bestScore: number;
  totalTimeSpent: number;
  sessionsCompleted: number;
  currentStreak: number;
  longestStreak: number;
  weeklyGoal: number;
  weeklyProgress: number;
  monthlyGoal: number;
  monthlyProgress: number;
  lastStudyDate: string;
}

interface DailyGoals {
  questionsGoal: number;
  questionsCompleted: number;
  timeGoal: number;
  timeSpent: number;
  subjectsGoal: number;
  subjectsStudied: number;
  isCompleted: boolean;
}

export default function StudyProgressDashboard() {
  const [selectedTimeframe, setSelectedTimeframe] = useState<'week' | 'month' | 'all'>('week');
  
  // Get current user from localStorage
  const userId = localStorage.getItem('userId') || 'demo-user';

  // Fetch study progress data
  const { data: progressData, isLoading: progressLoading } = useQuery<StudyProgressData[]>({
    queryKey: ['/api/progress/study', userId],
    enabled: !!userId
  });

  // Fetch daily goals
  const { data: dailyGoals, isLoading: goalsLoading } = useQuery<DailyGoals>({
    queryKey: ['/api/progress/daily-goals', userId],
    enabled: !!userId
  });

  // Fetch recent study sessions
  const { data: recentSessions } = useQuery({
    queryKey: ['/api/progress/recent-sessions', userId],
    enabled: !!userId
  });

  // Fetch achievements
  const { data: achievements } = useQuery({
    queryKey: ['/api/progress/achievements', userId],
    enabled: !!userId
  });

  if (progressLoading || goalsLoading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100 dark:from-gray-900 dark:to-gray-800 p-6">
        <div className="max-w-7xl mx-auto">
          <div className="animate-pulse space-y-6">
            <div className="h-8 bg-gray-200 dark:bg-gray-700 rounded w-1/3"></div>
            <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
              {[...Array(4)].map((_, i) => (
                <div key={i} className="h-32 bg-gray-200 dark:bg-gray-700 rounded-lg"></div>
              ))}
            </div>
          </div>
        </div>
      </div>
    );
  }

  const totalProgress = progressData || [];
  const goals = dailyGoals || { questionsGoal: 10, questionsCompleted: 0, timeGoal: 30, timeSpent: 0, subjectsGoal: 2, subjectsStudied: 0, isCompleted: false };

  // Calculate overall statistics
  const overallStats = {
    totalQuestions: totalProgress.reduce((sum, p) => sum + p.totalQuestions, 0),
    totalCorrect: totalProgress.reduce((sum, p) => sum + p.correctAnswers, 0),
    totalSessions: totalProgress.reduce((sum, p) => sum + p.sessionsCompleted, 0),
    totalTimeSpent: totalProgress.reduce((sum, p) => sum + p.totalTimeSpent, 0),
    bestStreak: Math.max(...totalProgress.map(p => p.longestStreak), 0),
    averageAccuracy: totalProgress.length > 0 
      ? Math.round((totalProgress.reduce((sum, p) => sum + p.averageScore, 0) / totalProgress.length))
      : 0
  };

  const formatTime = (seconds: number) => {
    const hours = Math.floor(seconds / 3600);
    const minutes = Math.floor((seconds % 3600) / 60);
    return hours > 0 ? `${hours}h ${minutes}m` : `${minutes}m`;
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100 dark:from-gray-900 dark:to-gray-800 p-6">
      <div className="max-w-7xl mx-auto space-y-6">
        
        {/* Header */}
        <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
          <div>
            <h1 className="text-3xl font-bold text-gray-900 dark:text-white">Study Progress Dashboard</h1>
            <p className="text-gray-600 dark:text-gray-300">Track your learning journey and achievements</p>
          </div>
          <Button variant="outline" size="sm" data-testid="button-settings">
            <Settings className="h-4 w-4 mr-2" />
            Settings
          </Button>
        </div>

        {/* Daily Goals Section */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Target className="h-5 w-5 text-blue-600" />
              Today's Goals
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div className="space-y-2">
                <div className="flex justify-between text-sm">
                  <span>Questions</span>
                  <span>{goals.questionsCompleted}/{goals.questionsGoal}</span>
                </div>
                <Progress 
                  value={(goals.questionsCompleted / goals.questionsGoal) * 100} 
                  className="h-2"
                />
              </div>
              <div className="space-y-2">
                <div className="flex justify-between text-sm">
                  <span>Study Time</span>
                  <span>{formatTime(goals.timeSpent)}/{formatTime(goals.timeGoal * 60)}</span>
                </div>
                <Progress 
                  value={(goals.timeSpent / (goals.timeGoal * 60)) * 100} 
                  className="h-2"
                />
              </div>
              <div className="space-y-2">
                <div className="flex justify-between text-sm">
                  <span>Subjects</span>
                  <span>{goals.subjectsStudied}/{goals.subjectsGoal}</span>
                </div>
                <Progress 
                  value={(goals.subjectsStudied / goals.subjectsGoal) * 100} 
                  className="h-2"
                />
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Overview Statistics */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
          <Card>
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-gray-600 dark:text-gray-400">Questions Answered</p>
                  <p className="text-2xl font-bold text-gray-900 dark:text-white" data-testid="text-total-questions">
                    {overallStats.totalQuestions.toLocaleString()}
                  </p>
                </div>
                <BookOpen className="h-8 w-8 text-blue-600" />
              </div>
              <div className="mt-2 flex items-center text-sm">
                <CheckCircle2 className="h-4 w-4 text-green-600 mr-1" />
                <span className="text-green-600 font-medium">{overallStats.totalCorrect} correct</span>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-gray-600 dark:text-gray-400">Study Sessions</p>
                  <p className="text-2xl font-bold text-gray-900 dark:text-white" data-testid="text-total-sessions">
                    {overallStats.totalSessions}
                  </p>
                </div>
                <BarChart3 className="h-8 w-8 text-green-600" />
              </div>
              <div className="mt-2 flex items-center text-sm">
                <TrendingUp className="h-4 w-4 text-blue-600 mr-1" />
                <span className="text-gray-600 dark:text-gray-300">This month</span>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-gray-600 dark:text-gray-400">Study Time</p>
                  <p className="text-2xl font-bold text-gray-900 dark:text-white" data-testid="text-study-time">
                    {formatTime(overallStats.totalTimeSpent)}
                  </p>
                </div>
                <Clock className="h-8 w-8 text-purple-600" />
              </div>
              <div className="mt-2 flex items-center text-sm">
                <span className="text-gray-600 dark:text-gray-300">Total time invested</span>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-gray-600 dark:text-gray-400">Best Streak</p>
                  <p className="text-2xl font-bold text-gray-900 dark:text-white" data-testid="text-best-streak">
                    {overallStats.bestStreak} days
                  </p>
                </div>
                <Flame className="h-8 w-8 text-orange-600" />
              </div>
              <div className="mt-2 flex items-center text-sm">
                <Award className="h-4 w-4 text-orange-600 mr-1" />
                <span className="text-gray-600 dark:text-gray-300">Keep it up!</span>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Detailed Analytics */}
        <Tabs defaultValue="subjects" className="space-y-6">
          <TabsList className="grid w-full grid-cols-3">
            <TabsTrigger value="subjects">Subject Progress</TabsTrigger>
            <TabsTrigger value="sessions">Recent Sessions</TabsTrigger>
            <TabsTrigger value="achievements">Achievements</TabsTrigger>
          </TabsList>

          <TabsContent value="subjects" className="space-y-4">
            <Card>
              <CardHeader>
                <CardTitle>Subject Performance</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  {totalProgress.map((subject) => (
                    <div key={subject.subjectId} className="border rounded-lg p-4 space-y-3">
                      <div className="flex justify-between items-center">
                        <h3 className="font-semibold text-lg" data-testid={`text-subject-${subject.subjectId}`}>
                          {subject.subjectName}
                        </h3>
                        <Badge variant={subject.averageScore >= 70 ? "default" : "secondary"}>
                          {subject.averageScore}% avg
                        </Badge>
                      </div>
                      
                      <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-sm">
                        <div>
                          <p className="text-gray-600 dark:text-gray-400">Questions</p>
                          <p className="font-semibold">{subject.totalQuestions}</p>
                        </div>
                        <div>
                          <p className="text-gray-600 dark:text-gray-400">Best Score</p>
                          <p className="font-semibold">{subject.bestScore}%</p>
                        </div>
                        <div>
                          <p className="text-gray-600 dark:text-gray-400">Sessions</p>
                          <p className="font-semibold">{subject.sessionsCompleted}</p>
                        </div>
                        <div>
                          <p className="text-gray-600 dark:text-gray-400">Time Spent</p>
                          <p className="font-semibold">{formatTime(subject.totalTimeSpent)}</p>
                        </div>
                      </div>

                      <div className="space-y-2">
                        <div className="flex justify-between text-sm">
                          <span>Weekly Progress</span>
                          <span>{subject.weeklyProgress}/{subject.weeklyGoal}</span>
                        </div>
                        <Progress 
                          value={(subject.weeklyProgress / subject.weeklyGoal) * 100} 
                          className="h-2"
                        />
                      </div>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="sessions" className="space-y-4">
            <Card>
              <CardHeader>
                <CardTitle>Recent Study Sessions</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-3">
                  {recentSessions?.slice(0, 10).map((session: any, index: number) => (
                    <div key={session.id || index} className="flex items-center justify-between p-3 border rounded-lg">
                      <div>
                        <p className="font-medium" data-testid={`text-session-${index}`}>
                          {session.subjectName || 'Unknown Subject'}
                        </p>
                        <p className="text-sm text-gray-600 dark:text-gray-400">
                          {session.score}% • {session.questionsAttempted} questions • {formatTime(session.timeSpent)}
                        </p>
                      </div>
                      <div className="text-right">
                        <Badge variant={session.score >= 70 ? "default" : "secondary"}>
                          {session.score}%
                        </Badge>
                        <p className="text-xs text-gray-500 mt-1">
                          {new Date(session.completedAt).toLocaleDateString()}
                        </p>
                      </div>
                    </div>
                  )) || <p className="text-gray-500 text-center py-8">No recent sessions found</p>}
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="achievements" className="space-y-4">
            <Card>
              <CardHeader>
                <CardTitle>Your Achievements</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  {achievements?.map((achievement: any) => (
                    <div key={achievement.id} className="border rounded-lg p-4 flex items-center space-x-3">
                      <div className="text-3xl">{achievement.icon}</div>
                      <div>
                        <h3 className="font-semibold" data-testid={`text-achievement-${achievement.type}`}>
                          {achievement.title}
                        </h3>
                        <p className="text-sm text-gray-600 dark:text-gray-400">
                          {achievement.description}
                        </p>
                        {achievement.isUnlocked && (
                          <Badge variant="default" className="mt-2">
                            Unlocked
                          </Badge>
                        )}
                      </div>
                    </div>
                  )) || <p className="text-gray-500 text-center py-8">No achievements yet</p>}
                </div>
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>
      </div>
    </div>
  );
}