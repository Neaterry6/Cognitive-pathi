import React from 'react';
import { Button } from '@/components/ui/button';
import { Bell } from 'lucide-react';
import { APP_CONFIG } from '@/lib/constants';
import { User } from '@shared/schema';
import { ModeToggle } from '@/components/ui/theme-toggle';

interface HeaderProps {
  user: User;
  currentSection: string;
  onSectionChange: (section: string) => void;
  onLogout: () => void;
  onOpenCalculator: () => void;
  onActivate: () => void;
  onAdminPanel?: () => void;
}

export default function Header({ 
  user, 
  currentSection, 
  onSectionChange, 
  onLogout, 
  onOpenCalculator,
  onActivate,
  onAdminPanel 
}: HeaderProps) {
  return (
    <header className="bg-gray-800 shadow-lg border-b border-gray-700">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex justify-between items-center h-16">
          {/* Logo and title section */}
          <div className="flex items-center space-x-4">
            <img src={APP_CONFIG.logo} alt="UI Logo" className="w-10 h-10" />
            <div className="hidden md:block">
              <h1 className="text-xl font-bold text-white">🎓 {APP_CONFIG.name}</h1>
              <p className="text-sm text-gray-400">{APP_CONFIG.university}</p>
            </div>
            <div className="md:hidden">
              <h1 className="text-lg font-bold text-white">🎓 UI CBT</h1>
            </div>
          </div>

          {/* Navigation and user section */}
          <div className="flex items-center space-x-6">
            {/* Navigation buttons */}
            <nav className="hidden md:flex space-x-4">
              <Button
                variant={currentSection === 'dashboard' ? 'default' : 'ghost'}
                onClick={() => onSectionChange('dashboard')}
                className="text-white hover:bg-purple-700"
              >
                Dashboard
              </Button>
              <Button
                variant={currentSection === 'quiz' ? 'default' : 'ghost'}
                onClick={() => onSectionChange('quiz')}
                className="text-white hover:bg-purple-700"
              >
                Quiz
              </Button>
              <Button
                variant={currentSection === 'study-plan' ? 'default' : 'ghost'}
                onClick={() => onSectionChange('study-plan')}
                className="text-white hover:bg-purple-700"
              >
                Study Plan
              </Button>
              <Button
                variant={currentSection === 'wiki' ? 'default' : 'ghost'}
                onClick={() => onSectionChange('wiki')}
                className="text-white hover:bg-purple-700"
              >
                Wiki
              </Button>
              <Button
                variant={currentSection === 'leaderboard' ? 'default' : 'ghost'}
                onClick={() => onSectionChange('leaderboard')}
                className="text-white hover:bg-purple-700"
              >
                Leaderboard
              </Button>
            </nav>

            {/* User actions */}
            <div className="flex items-center space-x-3">
              <Button
                variant="outline"
                size="sm"
                onClick={onOpenCalculator}
                className="text-white border-white/20 hover:bg-white/10"
              >
                Calculator
              </Button>
              
              {!user.isPremium && (
                <Button
                  variant="default"
                  size="sm"
                  onClick={onActivate}
                  className="bg-gradient-to-r from-purple-600 to-pink-600 hover:from-purple-700 hover:to-pink-700"
                >
                  Activate Premium
                </Button>
              )}

              {user.isAdmin && (
                <Button
                  variant="secondary"
                  size="sm"
                  onClick={onAdminPanel}
                  className="bg-yellow-600 hover:bg-yellow-700"
                >
                  Admin Panel
                </Button>
              )}

              {/* User avatar and name */}
              <div className="flex items-center space-x-3">
                <div className="relative">
                  <img
                    src={user.avatarUrl || "https://images.unsplash.com/photo-1472099645785-5658abf4ff4e?ixlib=rb-4.0.3&ixid=MnwxMjA3fDB8MHxwaG90by1wYWdlfHx8fGVufDB8fHx8&auto=format&fit=crop&w=32&h=32"}
                    alt="User Profile"
                    className="w-8 h-8 rounded-full object-cover border-2 border-white/20"
                  />
                  {user.isPremium && (
                    <div className="absolute -bottom-1 -right-1 w-3 h-3 bg-green-500 border-2 border-gray-800 rounded-full"></div>
                  )}
                </div>
                <div className="hidden md:block">
                  <span className="font-medium text-white">{user.nickname}</span>
                  <p className="text-xs text-purple-200">
                    {user.isPremium ? 'Premium' : 'Free'}
                  </p>
                </div>
              </div>

              {/* Logout button */}
              <Button
                variant="outline" 
                size="sm"
                onClick={onLogout}
                className="text-white border-white/20 hover:bg-red-600 hover:border-red-500"
              >
                Logout
              </Button>
            </div>
          </div>
        </div>
      </div>
    </header>
  );
}
