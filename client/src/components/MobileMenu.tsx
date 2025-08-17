import React, { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { 
  Menu, 
  X, 
  Home, 
  BookOpen, 
  Trophy, 
  Calculator, 
  Search, 
  HelpCircle, 
  Settings, 
  User,
  LogOut,
  Star,
  Brain
} from 'lucide-react';

interface MobileMenuProps {
  user: any;
  onNavigate: (section: string) => void;
  onLogout?: () => void;
  currentSection: string;
}

export default function MobileMenu({ user, onNavigate, onLogout, currentSection }: MobileMenuProps) {
  const [isOpen, setIsOpen] = useState(false);

  const menuItems = [
    { id: 'dashboard', label: 'Home', icon: Home, color: 'from-blue-500 to-purple-600' },
    { id: 'practice', label: 'Practice Questions', icon: BookOpen, color: 'from-purple-500 to-pink-600' },
    { id: 'wiki', label: 'Wiki Research', icon: Search, color: 'from-green-500 to-teal-600' },
    { id: 'calculator', label: 'Calculator', icon: Calculator, color: 'from-blue-400 to-cyan-500' },
    { id: 'leaderboard', label: 'Leaderboard', icon: Trophy, color: 'from-yellow-500 to-orange-500' },
    { id: 'explained-questions', label: 'Explained Questions', icon: Star, color: 'from-indigo-500 to-purple-600' },
    { id: 'settings', label: 'Settings', icon: Settings, color: 'from-gray-500 to-gray-600' },
    { id: 'activation-dashboard', label: 'Activate Premium', icon: Star, color: 'from-yellow-500 to-orange-500' },
  ];

  const handleNavigate = (sectionId: string) => {
    onNavigate(sectionId);
    setIsOpen(false);
  };

  const toggleMenu = () => {
    setIsOpen(!isOpen);
  };

  // Prevent body scroll when menu is open
  React.useEffect(() => {
    if (isOpen) {
      document.body.style.overflow = 'hidden';
      document.body.style.position = 'fixed';
      document.body.style.width = '100%';
    } else {
      document.body.style.overflow = '';
      document.body.style.position = '';
      document.body.style.width = '';
    }

    // Cleanup on unmount
    return () => {
      document.body.style.overflow = '';
      document.body.style.position = '';
      document.body.style.width = '';
    };
  }, [isOpen]);

  return (
    <>
      {/* Menu Button */}
      <Button 
        variant="ghost" 
        size="sm" 
        onClick={toggleMenu}
        className="text-white hover:bg-white hover:bg-opacity-20"
      >
        <Menu className="w-4 h-4 mr-2" />
        Menu
      </Button>

      {/* Backdrop - Enhanced for better coverage */}
      {isOpen && (
        <div 
          className="fixed inset-0 bg-black bg-opacity-75 z-[9998] backdrop-blur-sm"
          onClick={() => setIsOpen(false)}
          style={{ touchAction: 'none' }}
        />
      )}

      {/* Menu Sidebar - Higher z-index to ensure it's always on top */}
      <div className={`fixed top-0 left-0 h-full w-80 bg-gradient-to-br from-indigo-900 via-purple-900 to-pink-800 z-[9999] transform transition-transform duration-300 shadow-2xl ${
        isOpen ? 'translate-x-0' : '-translate-x-full'
      }`}>
        <div className="p-4">
          {/* Header */}
          <div className="flex items-center justify-between mb-6">
            <div className="flex items-center space-x-3">
              <div className="w-10 h-10 bg-white bg-opacity-20 rounded-full flex items-center justify-center">
                <User className="w-5 h-5 text-white" />
              </div>
              <div>
                <h3 className="text-white font-medium">{user.firstName} {user.lastName}</h3>
                <div className="flex items-center space-x-2">
                  {user.isPremium ? (
                    <Badge className="bg-gradient-to-r from-yellow-400 to-orange-500 text-white text-xs">
                      Premium
                    </Badge>
                  ) : (
                    <Badge variant="secondary" className="text-xs">
                      Free User
                    </Badge>
                  )}
                </div>
              </div>
            </div>
            <Button 
              variant="ghost" 
              size="sm" 
              onClick={() => setIsOpen(false)}
              className="text-white hover:bg-white hover:bg-opacity-20"
            >
              <X className="w-4 h-4" />
            </Button>
          </div>

          {/* Menu Items */}
          <div className="space-y-2">
            {menuItems.map((item) => (
              <Card 
                key={item.id}
                className={`bg-gradient-to-r ${item.color} border-0 cursor-pointer hover:scale-105 transition-all ${
                  currentSection === item.id ? 'ring-2 ring-white ring-opacity-50' : ''
                }`}
                onClick={() => handleNavigate(item.id)}
              >
                <CardContent className="p-3">
                  <div className="flex items-center space-x-3">
                    <div className="w-8 h-8 bg-white bg-opacity-20 rounded-lg flex items-center justify-center">
                      <item.icon className="w-4 h-4 text-white" />
                    </div>
                    <span className="text-white font-medium text-sm">{item.label}</span>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>

          {/* Settings Section */}
          <div className="mt-6 pt-6 border-t border-white border-opacity-20">
            <Card className="bg-white bg-opacity-10 border-white border-opacity-20 cursor-pointer hover:bg-opacity-20 transition-all mb-2">
              <CardContent className="p-3">
                <div className="flex items-center space-x-3">
                  <Settings className="w-4 h-4 text-white" />
                  <span className="text-white font-medium text-sm">Settings</span>
                </div>
              </CardContent>
            </Card>

            {onLogout && (
              <Card 
                className="bg-red-600 bg-opacity-20 border-red-500 border-opacity-30 cursor-pointer hover:bg-opacity-30 transition-all"
                onClick={onLogout}
              >
                <CardContent className="p-3">
                  <div className="flex items-center space-x-3">
                    <LogOut className="w-4 h-4 text-red-300" />
                    <span className="text-red-300 font-medium text-sm">Sign Out</span>
                  </div>
                </CardContent>
              </Card>
            )}
          </div>

          {/* App Info */}
          <div className="mt-6 text-center">
            <p className="text-white text-opacity-60 text-xs">JAMB CBT Practice</p>
            <p className="text-white text-opacity-40 text-xs">by Titan Devs</p>
          </div>
        </div>
      </div>
    </>
  );
}