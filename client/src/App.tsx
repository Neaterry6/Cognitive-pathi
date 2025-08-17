import React, { useState, useEffect } from 'react';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { Toaster } from '@/components/ui/toaster';
import { ThemeProvider } from '@/components/ui/theme-provider';
import { TooltipProvider } from '@/components/ui/tooltip';
import { toast } from '@/hooks/use-toast';
import { useAuth } from '@/hooks/useAuth';
import TrialLockModal from '@/components/TrialLockModal';

// Components
import Header from '@/components/Header';
import Calculator from '@/components/Calculator';
import MovingAds from '@/components/MovingAds';
import CBTSetup from '@/components/CBTSetup';
import CBTExam from '@/components/CBTExam';
import CBTResults from '@/components/CBTResults';

// Pages
import LandingPage from '@/pages/LandingPage';
import Login from '@/pages/Login';
import Signup from '@/pages/Signup';
import Activate from '@/pages/Activate';
import ComprehensiveAdminDashboard from '@/pages/ComprehensiveAdminDashboard';
import Dashboard from '@/pages/Dashboard';
import EnhancedCBTMode from '@/components/EnhancedCBTMode';
import EnhancedStudyPlan from '@/pages/EnhancedStudyPlan';
import EnhancedWikiSearch from '@/pages/EnhancedWikiSearch';
import Leaderboard from '@/pages/Leaderboard';
import ReviewSection from '@/pages/ReviewSection';
import FAQ from '@/pages/FAQ';
import ExplainedQuestions from '@/pages/ExplainedQuestions';
import PracticeQuestions from '@/pages/PracticeQuestions';
import Settings from '@/pages/Settings';
import ActivationDashboard from '@/pages/ActivationDashboard';
import StudyProgressDashboard from '@/pages/StudyProgressDashboard';
import UTMEChatbot from '@/pages/UTMEChatbot';
import ShortNotes from '@/pages/ShortNotes';
import AdaptiveScheduler from '@/pages/AdaptiveScheduler';
import FocusMode from '@/pages/FocusMode';
import EmailVerification from '@/pages/EmailVerification';
import PaystackCheckout from '@/pages/PaystackCheckout';

// Create query client
const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      staleTime: 1000 * 60 * 5, // 5 minutes
      retry: 2,
    },
  },
});

function AppContent() {
  const { user, isLoading, login, register, logout, updateUser } = useAuth();
  const [authView, setAuthView] = useState<'landing' | 'login' | 'signup' | 'activate' | 'admin'>('landing');
  const [currentSection, setCurrentSection] = useState<string>('dashboard');
  const [selectedSubject, setSelectedSubject] = useState<any>(null);
  const [quizQuestions, setQuizQuestions] = useState<any[]>([]);
  const [quizAnswers, setQuizAnswers] = useState<Record<string, string>>({});
  const [quizResult, setQuizResult] = useState<any>(null);
  const [isCalculatorOpen, setIsCalculatorOpen] = useState(false);
  const [subjects, setSubjects] = useState<any[]>([]);
  const [showTrialLock, setShowTrialLock] = useState(false);
  
  // CBT states
  const [cbtMode, setCbtMode] = useState<'setup' | 'exam' | 'results' | null>(null);
  const [cbtSessionId, setCbtSessionId] = useState<string | null>(null);
  const [cbtResults, setCbtResults] = useState<any>(null);

  // Fetch subjects when user is authenticated
  React.useEffect(() => {
    if (user) {
      fetch('/api/subjects')
        .then(res => res.json())
        .then(data => setSubjects(data))
        .catch(err => console.error('Error fetching subjects:', err));
    }
  }, [user]);

  // Handle login
  const handleLogin = async (userData: { email: string; password: string }) => {
    try {
      await login(userData.email, userData.password);
      toast({
        title: "Welcome back!",
        description: "Login successful",
      });
    } catch (error: any) {
      throw error; // Let the Login component handle the error
    }
  };

  // Handle registration
  const handleRegister = async (userData: {
    firstName: string;
    lastName: string;
    email: string;
    nickname: string;
    password: string;
  }) => {
    try {
      await register(userData);
      toast({
        title: "Account created!",
        description: "Welcome to UI POST UTME platform",
      });
    } catch (error: any) {
      throw error; // Let the Signup component handle the error
    }
  };

  // Handle logout
  const handleLogout = () => {
    logout();
    setAuthView('landing'); // Redirect to landing page
    setCurrentSection('dashboard');
    setCbtMode(null);
    setCbtSessionId(null);
    setCbtResults(null);
    toast({
      title: "Signed out",
      description: "You have been successfully signed out",
    });
  };

  // CBT Handlers
  const handleStartCBTSetup = () => {
    setCbtMode('setup');
    setCurrentSection('cbt');
  };

  const handleCBTSessionStart = (sessionId: string) => {
    setCbtSessionId(sessionId);
    setCbtMode('exam');
  };

  const handleCBTComplete = (results: any) => {
    setCbtResults(results);
    setCbtMode('results');
  };

  const handleCBTExit = () => {
    setCbtMode(null);
    setCbtSessionId(null);
    setCbtResults(null);
    setCurrentSection('dashboard');
  };

  // Handle activation complete
  const handleActivated = () => {
    if (user) {
      updateUser({ isPremium: true, isActivated: true });
      setCurrentSection('dashboard');
      toast({
        title: "Premium activated!",
        description: "You now have access to all features",
      });
    }
  };

  // Loading screen
  if (isLoading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-purple-900 via-blue-900 to-indigo-900 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-white mx-auto mb-4"></div>
          <p className="text-white text-lg">Loading...</p>
        </div>
      </div>
    );
  }

  // Check for email verification route
  if (window.location.pathname === '/verify-email') {
    return <EmailVerification />;
  }

  // Authentication screens
  if (!user) {
    if (authView === 'landing') {
      return (
        <LandingPage
          onNavigateToLogin={() => setAuthView('login')}
          onNavigateToSignup={() => setAuthView('signup')}
        />
      );
    } else if (authView === 'login') {
      return (
        <Login
          onLogin={handleLogin}
          onSwitchToSignup={() => setAuthView('signup')}
          onBackToLanding={() => setAuthView('landing')}
        />
      );
    } else if (authView === 'signup') {
      return (
        <Signup
          onSignup={handleRegister}
          onSwitchToLogin={() => setAuthView('login')}
          onBackToLanding={() => setAuthView('landing')}
        />
      );
    }
  }

  // User is authenticated
  if (user) {
    // Check if user needs activation
    if (!user.isPremium && !user.isActivated) {
      if (authView === 'activate') {
        return (
          <Activate
            user={user}
            onActivated={handleActivated}
            onBack={() => setAuthView('login')}
          />
        );
      }
    }

    // Admin dashboard
    if (authView === 'admin' && user.isAdmin) {
      return <ComprehensiveAdminDashboard />;
    }

    // Main application
    return (
      <div className="min-h-screen">
        {currentSection !== 'dashboard' && (
          <Header 
            user={user}
            currentSection={currentSection}
            onSectionChange={setCurrentSection}
            onLogout={handleLogout}
            onOpenCalculator={() => setIsCalculatorOpen(true)}
            onActivate={() => setAuthView('activate')}
            onAdminPanel={() => user.isAdmin && setAuthView('admin')}
          />
        )}

        <main className={currentSection === 'dashboard' ? '' : 'container mx-auto px-4 py-8 bg-gradient-to-br from-purple-900 via-blue-900 to-indigo-900 dark:from-purple-950 dark:via-blue-950 dark:to-indigo-950 min-h-screen transition-colors'}>
          {currentSection === 'dashboard' && (
            <Dashboard 
              user={user}
              subjects={subjects}
              onSelectSubject={(subject) => {
                setSelectedSubject(subject);
                setCurrentSection('quiz');
              }}
              onOpenStudyPlan={(subject) => {
                setSelectedSubject(subject);
                setCurrentSection('study-plan');
              }}
              onShowLeaderboard={() => setCurrentSection('leaderboard')}
              onShowWikiSearch={() => setCurrentSection('wiki')}
              onOpenCalculator={() => setIsCalculatorOpen(true)}
              onShowFAQ={() => setCurrentSection('faq')}
              onShowExplainedQuestions={() => setCurrentSection('explained-questions')}
              onShowPracticeQuestions={() => setCurrentSection('practice')}
              onStartCBT={handleStartCBTSetup}
              onNavigate={(section) => {
                if (section === 'calculator') {
                  setIsCalculatorOpen(true);
                } else if (section === 'cbt') {
                  handleStartCBTSetup();
                } else {
                  setCurrentSection(section);
                }
              }}
              onLogout={logout}
              currentSection={currentSection}
            />
          )}
          
          {currentSection === 'quiz' && selectedSubject && (
            <EnhancedCBTMode
              user={user}
              selectedSubject={selectedSubject}
              onBack={() => setCurrentSection('dashboard')}
              onHome={() => setCurrentSection('dashboard')}
            />
          )}
          
          {currentSection === 'study-plan' && selectedSubject && (
            <EnhancedStudyPlan
              user={user}
              selectedSubject={selectedSubject}
              onBack={() => setCurrentSection('dashboard')}
            />
          )}
          
          {currentSection === 'wiki' && (
            <EnhancedWikiSearch
              user={user}
              onBack={() => setCurrentSection('dashboard')}
            />
          )}
          
          {currentSection === 'leaderboard' && (
            <Leaderboard
              user={user}
              onBack={() => setCurrentSection('dashboard')}
            />
          )}
          
          {currentSection === 'review' && quizResult && (
            <ReviewSection
              user={user}
              result={quizResult}
              questions={quizQuestions}
              answers={quizAnswers}
              onBack={() => setCurrentSection('dashboard')}
            />
          )}

          {currentSection === 'faq' && (
            <FAQ />
          )}

          {currentSection === 'explained-questions' && (
            <ExplainedQuestions />
          )}

          {currentSection === 'practice' && (
            <PracticeQuestions 
              user={user} 
              subjects={subjects || []}
              onBack={() => setCurrentSection('dashboard')} 
            />
          )}

          {currentSection === 'progress' && (
            <StudyProgressDashboard />
          )}

          {currentSection === 'settings' && (
            <Settings 
              user={user} 
              onBack={() => setCurrentSection('dashboard')} 
            />
          )}

          {currentSection === 'short-notes' && (
            <ShortNotes />
          )}

          {currentSection === 'scheduler' && (
            <AdaptiveScheduler />
          )}

          {currentSection === 'focus-mode' && (
            <FocusMode />
          )}

          {currentSection === 'chatbot' && (
            <UTMEChatbot 
              user={user} 
              onBack={() => setCurrentSection('dashboard')} 
            />
          )}

          {/* CBT System */}
          {currentSection === 'cbt' && cbtMode === 'setup' && (
            <CBTSetup
              user={user}
              subjects={subjects}
              onSessionStart={handleCBTSessionStart}
              onBack={() => handleCBTExit()}
              onHome={() => handleCBTExit()}
            />
          )}

          {cbtMode === 'exam' && cbtSessionId && (
            <CBTExam
              sessionId={cbtSessionId}
              onComplete={handleCBTComplete}
              onExit={handleCBTExit}
            />
          )}

          {cbtMode === 'results' && cbtResults && (
            <CBTResults
              results={cbtResults}
              onReturnHome={handleCBTExit}
            />
          )}

          {currentSection === 'activation-dashboard' && (
            <ActivationDashboard 
              user={user} 
              onBack={() => setCurrentSection('dashboard')} 
              onActivationSuccess={() => {
                setCurrentSection('dashboard');
                // Refresh user data
                if (user) {
                  (user as any).isPremium = true;
                  (user as any).isActivated = true;
                }
              }}
            />
          )}
          
          {currentSection === 'paystack-checkout' && (
            <PaystackCheckout
              user={user}
              onBack={() => setCurrentSection('dashboard')}
              onSuccess={() => {
                setCurrentSection('dashboard');
                // Refresh user data
                if (user) {
                  (user as any).isPremium = true;
                  (user as any).isActivated = true;
                }
              }}
            />
          )}
        </main>

        {/* Calculator Modal */}
        {isCalculatorOpen && (
          <Calculator
            onClose={() => setIsCalculatorOpen(false)}
          />
        )}

        {/* Trial Lock Modal */}
        {showTrialLock && user && (
          <TrialLockModal
            isOpen={showTrialLock}
            onClose={() => setShowTrialLock(false)}
            onActivationSuccess={() => {
              // Refresh user data after successful activation
              const userData = { ...user, isPremium: true, isActivated: true };
              updateUser(userData);
              setShowTrialLock(false);
            }}
            userId={user.id!}
            trialsUsed={user.usageCount || 0}
          />
        )}

        {/* Moving Advertisement Banners */}
        {user && !user.isAdmin && <MovingAds />}
      </div>
    );
  }

  return null;
}

function App() {
  return (
    <QueryClientProvider client={queryClient}>
      <ThemeProvider defaultTheme="dark" storageKey="utme-ui-theme">
        <TooltipProvider>
          <AppContent />
          <Toaster />
        </TooltipProvider>
      </ThemeProvider>
    </QueryClientProvider>
  );
}

export default App;