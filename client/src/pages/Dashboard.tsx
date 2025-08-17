import React, { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import AdBanner from '@/components/AdBanner';
import MobileMenu from '@/components/MobileMenu';
import TrialLockModal from '@/components/TrialLockModal';
import { User, Subject } from '@shared/schema';
import { 
  BookOpen, 
  Trophy, 
  Clock, 
  Download, 
  ArrowRight, 
  Settings, 
  User as UserIcon,
  Bell,
  Edit,
  Monitor,
  ArrowLeft,
  MessageCircle
} from 'lucide-react';

interface DashboardProps {
  user: User;
  subjects: Subject[];
  onSelectSubject: (subject: Subject) => void;
  onOpenStudyPlan: (subject: Subject) => void;
  onShowLeaderboard: () => void;
  onShowWikiSearch: () => void;
  onOpenCalculator: () => void;
  onShowFAQ?: () => void;
  onShowExplainedQuestions?: () => void;
  onShowPracticeQuestions?: () => void;
  onStartCBT?: () => void;
  onNavigate?: (section: string) => void;
  onLogout?: () => void;
  currentSection?: string;
}

export default function Dashboard({
  user,
  subjects,
  onSelectSubject,
  onOpenStudyPlan,
  onShowLeaderboard,
  onShowWikiSearch,
  onOpenCalculator,
  onShowFAQ,
  onShowExplainedQuestions,
  onShowPracticeQuestions,
  onStartCBT,
  onNavigate,
  onLogout,
  currentSection = 'dashboard',
}: DashboardProps) {
  const [selectedExamType, setSelectedExamType] = useState('JAMB CBT');
  const [showAdBanner, setShowAdBanner] = useState(!user.isPremium);
  const [showTrialLock, setShowTrialLock] = useState(false);

  // Default subjects if none are loaded from backend
  const defaultSubjects = [
    { id: '1', name: 'Physics', emoji: '🔬', category: 'science', totalQuestions: 150, isSpecialized: false, createdAt: null, updatedAt: null, description: 'Physical sciences and natural phenomena' },
    { id: '2', name: 'Chemistry', emoji: '🧪', category: 'science', totalQuestions: 150, isSpecialized: false, createdAt: null, updatedAt: null, description: 'Chemical reactions and molecular structures' },
    { id: '3', name: 'Biology', emoji: '🧬', category: 'science', totalQuestions: 150, isSpecialized: false, createdAt: null, updatedAt: null, description: 'Biological sciences and life processes' },
    { id: '4', name: 'Mathematics', emoji: '🔢', category: 'technical', totalQuestions: 200, isSpecialized: false, createdAt: null, updatedAt: null, description: 'Mathematical concepts and problem solving' },
    { id: '5', name: 'English', emoji: '📝', category: 'general', totalQuestions: 120, isSpecialized: false, createdAt: null, updatedAt: null, description: 'English Language and Literature' },
    { id: '6', name: 'Economics', emoji: '📊', category: 'social', totalQuestions: 100, isSpecialized: false, createdAt: null, updatedAt: null, description: 'Economic principles and theories' },
    { id: '7', name: 'Geography', emoji: '🌍', category: 'social', totalQuestions: 100, isSpecialized: false, createdAt: null, updatedAt: null, description: 'Physical and human geography' },
    { id: '8', name: 'History', emoji: '📚', category: 'social', totalQuestions: 100, isSpecialized: false, createdAt: null, updatedAt: null, description: 'Historical events and analysis' },
  ];

  const displaySubjects = subjects && subjects.length > 0 ? subjects : defaultSubjects;

  const handleSubjectClick = (subject: any) => {
    // Check trial limit for non-premium users
    if (!user?.isPremium && (user?.usageCount || 0) >= 3) {
      setShowTrialLock(true);
      return;
    }
    // Navigate to quiz section for this subject
    onSelectSubject(subject);
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-indigo-900 via-purple-900 to-pink-800">
      {/* Back Button */}
      <div className="bg-white bg-opacity-10 backdrop-blur-sm">
        <div className="max-w-7xl mx-auto px-4 py-4">
          <Button 
            variant="ghost" 
            size="sm" 
            onClick={() => onNavigate?.('auth')}
            className="text-white hover:bg-white hover:bg-opacity-20"
          >
            <ArrowLeft className="w-4 h-4 mr-2" />
            Back to Login
          </Button>
        </div>
      </div>
      {/* Ad Banner - Upper Left */}
      {showAdBanner && (
        <AdBanner onClose={() => setShowAdBanner(false)} />
      )}
      {/* Header */}
      <div className="bg-white bg-opacity-10 backdrop-blur-sm">
        <div className="max-w-7xl mx-auto px-4 py-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-4">
              <MobileMenu 
                user={user}
                onNavigate={onNavigate || (() => {})}
                onLogout={onLogout}
                currentSection={currentSection}
              />
              <div className="w-12 h-12 bg-white bg-opacity-20 rounded-full flex items-center justify-center">
                <UserIcon className="w-6 h-6 text-white" />
              </div>
              <div>
                <h1 className="text-xl font-bold text-white">Hello {user.nickname} 👋</h1>
                <p className="text-purple-200 text-sm">Let's start learning</p>
              </div>
            </div>
            <div className="flex items-center space-x-2">
              <Badge variant="secondary" className="bg-green-500 text-white">
                {selectedExamType}
              </Badge>
              <Button 
                size="sm" 
                variant="ghost" 
                className="text-white hover:bg-white hover:bg-opacity-20"
                onClick={() => onNavigate && onNavigate('settings')}
              >
                <Settings className="w-4 h-4" />
              </Button>
            </div>
          </div>
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-4 py-6 space-y-6">
        {/* My Subject */}
        <div>
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-lg font-semibold text-white flex items-center">
              🔥 My Subject
            </h2>
            <Button 
              size="sm" 
              variant="ghost" 
              className="text-white hover:bg-white hover:bg-opacity-20"
              onClick={() => onNavigate && onNavigate('profile')}
            >
              <Edit className="w-4 h-4" />
            </Button>
          </div>
          
          {/* Physics Subject Card - First subject as featured */}
          <Card className="bg-gradient-to-r from-cyan-500 to-blue-600 border-0 mb-4">
            <CardContent className="p-4">
              <div className="flex items-center justify-between">
                <div className="flex items-center space-x-3">
                  <div className="w-12 h-12 bg-white bg-opacity-20 rounded-lg flex items-center justify-center">
                    <span className="text-2xl">🔬</span>
                  </div>
                  <div>
                    <h3 className="text-white font-medium">Physics</h3>
                  </div>
                </div>
                <Button 
                  size="sm" 
                  className="bg-white text-blue-600 hover:bg-gray-100"
                  onClick={() => handleSubjectClick(displaySubjects.find(s => s.name === 'Physics'))}
                >
                  <BookOpen className="w-4 h-4" />
                </Button>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Quick access */}
        <div>
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-lg font-semibold text-white">
              🚀 Quick access
            </h2>
            <p className="text-purple-200 text-sm">Let's start learning</p>
          </div>
          
          {/* CBT Exam - Full Width Featured */}
          {onStartCBT && (
            <div className="mb-6">
              <Card className="bg-gradient-to-r from-green-600 to-emerald-600 border-0 cursor-pointer hover:scale-105 transition-transform" onClick={onStartCBT}>
                <CardContent className="p-6 text-center">
                  <div className="w-16 h-16 bg-white bg-opacity-20 rounded-full flex items-center justify-center mx-auto mb-4">
                    <Monitor className="w-8 h-8 text-white" />
                  </div>
                  <h3 className="text-white font-bold text-lg mb-2">CBT Examination</h3>
                  <p className="text-white text-opacity-80 text-sm">
                    Take a full 2-hour UTME practice exam with 4 subjects of your choice
                  </p>
                  <Badge className="mt-3 bg-white text-green-600">₦3000 Access</Badge>
                </CardContent>
              </Card>
            </div>
          )}

          <div className="grid grid-cols-2 gap-4">
            {/* Practice Questions */}
            <Card className="bg-gradient-to-r from-purple-600 to-purple-700 border-0 cursor-pointer hover:scale-105 transition-transform" onClick={onShowPracticeQuestions}>
              <CardContent className="p-6 text-center">
                <div className="w-12 h-12 bg-white bg-opacity-20 rounded-full flex items-center justify-center mx-auto mb-3">
                  <Monitor className="w-6 h-6 text-white" />
                </div>
                <h3 className="text-white font-medium mb-1">Practice Questions</h3>
              </CardContent>
            </Card>
            
            {/* Study Plans */}
            <Card className="bg-gradient-to-r from-orange-500 to-red-500 border-0 cursor-pointer hover:scale-105 transition-transform" onClick={() => onOpenStudyPlan(defaultSubjects[0])}>
              <CardContent className="p-6 text-center">
                <div className="w-12 h-12 bg-white bg-opacity-20 rounded-full flex items-center justify-center mx-auto mb-3">
                  <BookOpen className="w-6 h-6 text-white" />
                </div>
                <h3 className="text-white font-medium mb-1">AI Study Plans</h3>
              </CardContent>
            </Card>
            
            {/* Short Notes */}
            <Card className="bg-gradient-to-r from-blue-500 to-indigo-500 border-0 cursor-pointer hover:scale-105 transition-transform" onClick={() => onNavigate && onNavigate('short-notes')}>
              <CardContent className="p-6 text-center">
                <div className="w-12 h-12 bg-white bg-opacity-20 rounded-full flex items-center justify-center mx-auto mb-3">
                  <BookOpen className="w-6 h-6 text-white" />
                </div>
                <h3 className="text-white font-medium mb-1">Short Notes</h3>
                <p className="text-white text-opacity-70 text-xs">Quick JAMB revision</p>
              </CardContent>
            </Card>

            {/* Adaptive Scheduler */}
            <Card className="bg-gradient-to-r from-purple-500 to-pink-500 border-0 cursor-pointer hover:scale-105 transition-transform" onClick={() => onNavigate && onNavigate('scheduler')}>
              <CardContent className="p-6 text-center">
                <div className="w-12 h-12 bg-white bg-opacity-20 rounded-full flex items-center justify-center mx-auto mb-3">
                  <Monitor className="w-6 h-6 text-white" />
                </div>
                <h3 className="text-white font-medium mb-1">Smart Scheduler</h3>
                <p className="text-white text-opacity-70 text-xs">AI study planning</p>
              </CardContent>
            </Card>
            
            {/* Focus Mode (DND) */}
            <Card className="bg-gradient-to-r from-green-500 to-emerald-500 border-0 cursor-pointer hover:scale-105 transition-transform" onClick={() => onNavigate && onNavigate('focus-mode')}>
              <CardContent className="p-6 text-center">
                <div className="w-12 h-12 bg-white bg-opacity-20 rounded-full flex items-center justify-center mx-auto mb-3">
                  <Monitor className="w-6 h-6 text-white" />
                </div>
                <h3 className="text-white font-medium mb-1">Focus Mode</h3>
                <p className="text-white text-opacity-70 text-xs">Distraction-free</p>
              </CardContent>
            </Card>
            
            {/* UTME AI Chatbot */}
            <Card className="bg-gradient-to-r from-pink-500 to-rose-500 border-0 cursor-pointer hover:scale-105 transition-transform" onClick={() => onNavigate && onNavigate('chatbot')}>
              <CardContent className="p-6 text-center">
                <div className="w-12 h-12 bg-white bg-opacity-20 rounded-full flex items-center justify-center mx-auto mb-3">
                  <MessageCircle className="w-6 h-6 text-white" />
                </div>
                <h3 className="text-white font-medium mb-1">UTME AI</h3>
                {user.isPremium ? (
                  <Badge variant="secondary" className="text-xs bg-white/20 text-white">Available</Badge>
                ) : (
                  <Badge variant="outline" className="text-xs border-white/30 text-white/70">Premium</Badge>
                )}
              </CardContent>
            </Card>

            {/* Wiki Search */}
            <Card className="bg-gradient-to-r from-teal-500 to-green-500 border-0 cursor-pointer hover:scale-105 transition-transform" onClick={onShowWikiSearch}>
              <CardContent className="p-6 text-center">
                <div className="w-12 h-12 bg-white bg-opacity-20 rounded-full flex items-center justify-center mx-auto mb-3">
                  <BookOpen className="w-6 h-6 text-white" />
                </div>
                <h3 className="text-white font-medium mb-1">Wiki Research</h3>
              </CardContent>
            </Card>
            
            {/* Calculator */}
            <Card className="bg-gradient-to-r from-blue-400 to-cyan-400 border-0 cursor-pointer hover:scale-105 transition-transform" onClick={onOpenCalculator}>
              <CardContent className="p-6 text-center">
                <div className="w-12 h-12 bg-white bg-opacity-20 rounded-full flex items-center justify-center mx-auto mb-3">
                  <BookOpen className="w-6 h-6 text-white" />
                </div>
                <h3 className="text-white font-medium mb-1">Calculator</h3>
              </CardContent>
            </Card>
          </div>

          {/* Explained Questions Row */}
          {onShowExplainedQuestions && (
            <div className="mt-4">
              <Card className="bg-gradient-to-r from-indigo-600 to-purple-600 border-0 cursor-pointer hover:scale-105 transition-transform" onClick={onShowExplainedQuestions}>
                <CardContent className="p-6 text-center">
                  <div className="w-12 h-12 bg-white bg-opacity-20 rounded-full flex items-center justify-center mx-auto mb-3">
                    <Monitor className="w-6 h-6 text-white" />
                  </div>
                  <h3 className="text-white font-medium mb-1">My Explained Questions</h3>
                  <p className="text-white text-opacity-80 text-xs">Review AI explanations & create practice quizzes</p>
                </CardContent>
              </Card>
            </div>
          )}
        </div>

        {/* All Subjects Grid */}
        <div>
          <h2 className="text-lg font-semibold text-white mb-4">📚 All Subjects</h2>
          <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-4">
            {displaySubjects.map((subject, index) => (
              <Card 
                key={subject.id || index} 
                className="bg-white bg-opacity-10 border-white border-opacity-20 cursor-pointer hover:bg-opacity-20 transition-all hover:scale-105"
                onClick={() => handleSubjectClick(subject)}
              >
                <CardContent className="p-4 text-center">
                  <div className="text-3xl mb-2">{subject.emoji}</div>
                  <h3 className="text-white font-medium text-sm">{subject.name}</h3>
                  <p className="text-purple-200 text-xs mt-1">
                    {subject.totalQuestions || 100} questions
                  </p>
                </CardContent>
              </Card>
            ))}
          </div>
        </div>

        {/* Download Prepmate on PC */}
        <Card className="bg-white bg-opacity-10 border-white border-opacity-20">
          <CardContent className="p-4">
            <div className="flex items-center space-x-4">
              <div className="w-12 h-12 bg-white bg-opacity-20 rounded-lg flex items-center justify-center">
                <Monitor className="w-6 h-6 text-white" />
              </div>
              <div className="flex-1">
                <h3 className="text-white font-medium">Download Prepmate on PC</h3>
                <p className="text-purple-200 text-sm">Better experience on larger screens</p>
                <p className="text-purple-300 text-xs">Available for Windows and Mac</p>
              </div>
              <Button size="sm" variant="ghost" className="text-white">
                <ArrowRight className="w-4 h-4" />
              </Button>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Bottom Navigation */}
      <div className="fixed bottom-0 left-0 right-0 bg-white bg-opacity-10 backdrop-blur-sm border-t border-white border-opacity-20">
        <div className="max-w-7xl mx-auto px-4 py-2">
          <div className="flex justify-around items-center">
            <Button variant="ghost" size="sm" className="flex flex-col items-center text-white">
              <BookOpen className="w-5 h-5 mb-1" />
              <span className="text-xs">Home</span>
            </Button>
            <Button 
              variant="ghost" 
              size="sm" 
              className="flex flex-col items-center text-purple-300"
              onClick={() => onNavigate && onNavigate('paystack-checkout')}
              data-testid="button-activate-premium"
            >
              <Trophy className="w-5 h-5 mb-1" />
              <span className="text-xs">Pay ₦3k</span>
            </Button>
            <Button variant="ghost" size="sm" className="flex flex-col items-center text-purple-300" onClick={onShowLeaderboard}>
              <UserIcon className="w-5 h-5 mb-1" />
              <span className="text-xs">Account</span>
            </Button>
            <Button variant="ghost" size="sm" className="flex flex-col items-center text-purple-300" onClick={onShowFAQ}>
              <Settings className="w-5 h-5 mb-1" />
              <span className="text-xs">FAQ</span>
            </Button>
          </div>
        </div>
      </div>
      
      {/* Trial Lock Modal */}
      {showTrialLock && user && (
        <TrialLockModal
          isOpen={showTrialLock}
          onClose={() => setShowTrialLock(false)}
          onActivationSuccess={() => {
            setShowTrialLock(false);
          }}
          userId={user.id!}
          trialsUsed={user.usageCount || 0}
        />
      )}
    </div>
  );
}