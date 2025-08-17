import React from 'react';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { BookOpen, Monitor, Brain, Calculator, Settings, Edit, UserIcon, Zap, Trophy, Clock, Target } from 'lucide-react';

interface DashboardLayoutProps {
  user: any;
  selectedExamType: string;
  displaySubjects: any[];
  onNavigate?: (path: string) => void;
  onStartCBT?: () => void;
  onShowPracticeQuestions?: () => void;
  onOpenStudyPlan?: (subject: any) => void;
  onSubjectClick?: (subject: any) => void;
  onLogout?: () => void;
}

export default function DashboardLayout({
  user,
  selectedExamType,
  displaySubjects,
  onNavigate,
  onStartCBT,
  onShowPracticeQuestions,
  onOpenStudyPlan,
  onSubjectClick,
  onLogout
}: DashboardLayoutProps) {

  const quickStats = [
    { label: 'Score', value: user.totalScore || 0, icon: Trophy, color: 'text-yellow-400' },
    { label: 'Tests', value: user.testsCompleted || 0, icon: Target, color: 'text-green-400' },
    { label: 'Hours', value: user.studyHours || 0, icon: Clock, color: 'text-blue-400' },
  ];

  return (
    <div className="min-h-screen bg-gradient-to-br from-purple-900 via-blue-900 to-indigo-900">
      {/* Enhanced Header */}
      <div className="bg-white bg-opacity-10 backdrop-blur-sm border-b border-white border-opacity-20">
        <div className="max-w-7xl mx-auto px-4 py-6">
          <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between space-y-4 lg:space-y-0">
            {/* User Info Section */}
            <div className="flex items-center space-x-4">
              <div className="w-16 h-16 bg-gradient-to-r from-purple-500 to-pink-500 rounded-full flex items-center justify-center ring-4 ring-white ring-opacity-20">
                {user.avatar ? (
                  <img src={user.avatar} alt="Profile" className="w-14 h-14 rounded-full" />
                ) : (
                  <UserIcon className="w-8 h-8 text-white" />
                )}
              </div>
              <div>
                <h1 className="text-2xl font-bold text-white">Welcome back, {user.nickname}! 👋</h1>
                <p className="text-purple-200 text-sm flex items-center space-x-2">
                  <span>Ready to ace your {selectedExamType} exam?</span>
                  {user.isPremium && (
                    <Badge className="bg-gradient-to-r from-yellow-400 to-yellow-600 text-black text-xs px-2 py-0.5">
                      PREMIUM
                    </Badge>
                  )}
                </p>
              </div>
            </div>

            {/* Quick Stats */}
            <div className="flex space-x-6">
              {quickStats.map((stat, index) => (
                <div key={index} className="text-center">
                  <div className="flex items-center justify-center mb-1">
                    <stat.icon className={`w-5 h-5 ${stat.color}`} />
                  </div>
                  <div className="text-white font-bold text-lg">{stat.value}</div>
                  <div className="text-purple-200 text-xs">{stat.label}</div>
                </div>
              ))}
            </div>

            {/* Action Buttons */}
            <div className="flex items-center space-x-2">
              <Button 
                size="sm" 
                variant="ghost" 
                className="text-white hover:bg-white hover:bg-opacity-20"
                onClick={() => onNavigate?.('settings')}
              >
                <Settings className="w-4 h-4" />
              </Button>
            </div>
          </div>
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-4 py-8 space-y-8">
        {/* Featured CBT Section */}
        {onStartCBT && (
          <div className="mb-8">
            <h2 className="text-2xl font-bold text-white mb-4 flex items-center">
              <Zap className="w-6 h-6 mr-2 text-yellow-400" />
              CBT Examination Center
            </h2>
            <Card className="bg-gradient-to-r from-green-600 to-emerald-600 border-0 overflow-hidden hover:shadow-2xl transition-all duration-300 group cursor-pointer" onClick={onStartCBT}>
              <CardContent className="p-8">
                <div className="flex flex-col md:flex-row items-center justify-between">
                  <div className="text-center md:text-left mb-4 md:mb-0">
                    <div className="w-20 h-20 bg-white bg-opacity-20 rounded-full flex items-center justify-center mx-auto md:mx-0 mb-4 group-hover:scale-110 transition-transform">
                      <Monitor className="w-10 h-10 text-white" />
                    </div>
                    <h3 className="text-white font-bold text-2xl mb-2">Full UTME Practice Exam</h3>
                    <p className="text-white text-opacity-90 text-lg max-w-md">
                      Take a comprehensive 2-hour examination with 4 subjects of your choice. Real exam simulation with authentic questions.
                    </p>
                  </div>
                  <div className="text-center">
                    <Badge className="bg-white text-green-600 text-lg px-4 py-2 mb-2">₦3,000 Access</Badge>
                    <p className="text-white text-opacity-80 text-sm">160 Questions • 2 Hours • 4 Subjects</p>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>
        )}

        {/* Subject Section */}
        <div>
          <div className="flex items-center justify-between mb-6">
            <h2 className="text-xl font-bold text-white flex items-center">
              🔥 Featured Subject
            </h2>
            <Button 
              size="sm" 
              variant="ghost" 
              className="text-white hover:bg-white hover:bg-opacity-20"
              onClick={() => onNavigate?.('subjects')}
            >
              <Edit className="w-4 h-4 mr-2" />
              View All
            </Button>
          </div>
          
          {/* Physics Featured Subject */}
          <Card className="bg-gradient-to-r from-cyan-500 to-blue-600 border-0 hover:shadow-xl transition-all duration-300 group cursor-pointer" onClick={() => onSubjectClick?.(displaySubjects.find(s => s.name === 'Physics'))}>
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div className="flex items-center space-x-4">
                  <div className="w-16 h-16 bg-white bg-opacity-20 rounded-lg flex items-center justify-center group-hover:scale-110 transition-transform">
                    <span className="text-3xl">⚡</span>
                  </div>
                  <div>
                    <h3 className="text-white font-bold text-lg">Physics</h3>
                    <p className="text-white text-opacity-80 text-sm">Master the laws of nature</p>
                  </div>
                </div>
                <Button 
                  size="sm" 
                  className="bg-white text-blue-600 hover:bg-gray-100"
                >
                  <BookOpen className="w-4 h-4 mr-2" />
                  Study
                </Button>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Quick Access Grid */}
        <div>
          <h2 className="text-xl font-bold text-white mb-6 flex items-center">
            🚀 Quick Access
          </h2>
          
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {/* Practice Questions */}
            <Card className="bg-gradient-to-r from-purple-600 to-purple-700 border-0 cursor-pointer hover:scale-105 transition-all duration-300 group" onClick={onShowPracticeQuestions}>
              <CardContent className="p-6 text-center">
                <div className="w-16 h-16 bg-white bg-opacity-20 rounded-full flex items-center justify-center mx-auto mb-4 group-hover:scale-110 transition-transform">
                  <Monitor className="w-8 h-8 text-white" />
                </div>
                <h3 className="text-white font-bold text-lg mb-2">Practice Questions</h3>
                <p className="text-white text-opacity-80 text-sm">
                  Test your knowledge with past questions
                </p>
              </CardContent>
            </Card>
            
            {/* Study Plans */}
            <Card className="bg-gradient-to-r from-orange-500 to-red-500 border-0 cursor-pointer hover:scale-105 transition-all duration-300 group" onClick={() => onOpenStudyPlan?.(displaySubjects[0])}>
              <CardContent className="p-6 text-center">
                <div className="w-16 h-16 bg-white bg-opacity-20 rounded-full flex items-center justify-center mx-auto mb-4 group-hover:scale-110 transition-transform">
                  <BookOpen className="w-8 h-8 text-white" />
                </div>
                <h3 className="text-white font-bold text-lg mb-2">Study Plans</h3>
                <p className="text-white text-opacity-80 text-sm">
                  AI-powered personalized learning
                </p>
              </CardContent>
            </Card>

            {/* AI Chatbot */}
            <Card className="bg-gradient-to-r from-pink-500 to-rose-500 border-0 cursor-pointer hover:scale-105 transition-all duration-300 group" onClick={() => onNavigate?.('utme-chat')}>
              <CardContent className="p-6 text-center">
                <div className="w-16 h-16 bg-white bg-opacity-20 rounded-full flex items-center justify-center mx-auto mb-4 group-hover:scale-110 transition-transform">
                  <Brain className="w-8 h-8 text-white" />
                </div>
                <h3 className="text-white font-bold text-lg mb-2">UTME AI Chat</h3>
                <p className="text-white text-opacity-80 text-sm">
                  Get instant help from AI tutor
                </p>
                {!user.isPremium && (
                  <Badge className="mt-2 bg-yellow-400 text-black text-xs">Premium</Badge>
                )}
              </CardContent>
            </Card>
          </div>
        </div>

        {/* Learning Progress Section */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          <Card className="bg-white bg-opacity-10 backdrop-blur-sm border border-white border-opacity-20">
            <CardContent className="p-6">
              <h3 className="text-white font-semibold mb-4 flex items-center">
                <Target className="w-5 h-5 mr-2 text-green-400" />
                Recent Activity
              </h3>
              <div className="space-y-3">
                <div className="flex items-center justify-between text-sm">
                  <span className="text-gray-300">Last quiz score</span>
                  <span className="text-white font-medium">{user.totalScore || 0}%</span>
                </div>
                <div className="flex items-center justify-between text-sm">
                  <span className="text-gray-300">Tests completed</span>
                  <span className="text-white font-medium">{user.testsCompleted || 0}</span>
                </div>
                <div className="flex items-center justify-between text-sm">
                  <span className="text-gray-300">Study time</span>
                  <span className="text-white font-medium">{user.studyHours || 0}h</span>
                </div>
              </div>
            </CardContent>
          </Card>

          <Card className="bg-white bg-opacity-10 backdrop-blur-sm border border-white border-opacity-20">
            <CardContent className="p-6">
              <h3 className="text-white font-semibold mb-4 flex items-center">
                <Calculator className="w-5 h-5 mr-2 text-blue-400" />
                Tools & Utilities
              </h3>
              <div className="space-y-2">
                <Button 
                  variant="ghost" 
                  className="w-full justify-start text-gray-300 hover:text-white hover:bg-white hover:bg-opacity-10"
                  onClick={() => onNavigate?.('calculator')}
                >
                  <Calculator className="w-4 h-4 mr-2" />
                  Scientific Calculator
                </Button>
                <Button 
                  variant="ghost" 
                  className="w-full justify-start text-gray-300 hover:text-white hover:bg-white hover:bg-opacity-10"
                  onClick={() => onNavigate?.('research')}
                >
                  <BookOpen className="w-4 h-4 mr-2" />
                  Research Tools
                </Button>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}