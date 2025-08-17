import React, { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { APP_CONFIG } from '@/lib/constants';

interface AuthModalProps {
  isOpen: boolean;
  onLogin: (nickname: string, avatarFile?: File) => Promise<void>;
  isLoading?: boolean;
}

export default function AuthModal({ isOpen, onLogin, isLoading }: AuthModalProps) {
  const [nickname, setNickname] = useState('');
  const [avatarFile, setAvatarFile] = useState<File | null>(null);
  const [avatarPreview, setAvatarPreview] = useState<string | null>(null);

  if (!isOpen) return null;

  const handleAvatarChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      setAvatarFile(file);
      const reader = new FileReader();
      reader.onload = (e) => {
        setAvatarPreview(e.target?.result as string);
      };
      reader.readAsDataURL(file);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!nickname.trim()) return;
    
    try {
      await onLogin(nickname.trim(), avatarFile || undefined);
    } catch (error) {
      console.error('Login error:', error);
    }
  };

  return (
    <div className="fixed inset-0 bg-black bg-opacity-75 flex items-center justify-center z-50 p-4">
      <div className="bg-gray-800 rounded-2xl p-8 w-full max-w-md border border-gray-700">
        <div className="text-center mb-6">
          <img 
            src={APP_CONFIG.logo} 
            alt="UI Logo" 
            className="w-16 h-16 mx-auto mb-4 animate-pulse"
          />
          <h2 className="text-2xl font-bold text-white mb-2">Welcome to UI CBT</h2>
          <p className="text-gray-400">Enter your details to continue</p>
        </div>

        <form onSubmit={handleSubmit} className="space-y-6">
          {/* Nickname input */}
          <div>
            <Label htmlFor="nickname" className="block text-sm font-medium text-gray-300 mb-2">
              Nickname
            </Label>
            <Input
              id="nickname"
              type="text"
              placeholder="Enter your preferred name"
              value={nickname}
              onChange={(e) => setNickname(e.target.value)}
              className="w-full p-3 bg-gray-700 border border-gray-600 rounded-lg text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all"
              required
            />
          </div>

          {/* Avatar upload section */}
          <div>
            <Label className="block text-sm font-medium text-gray-300 mb-2">
              Profile Picture (Optional)
            </Label>
            <div className="flex items-center space-x-4">
              {/* Avatar preview */}
              <img
                src={avatarPreview || "https://images.unsplash.com/photo-1472099645785-5658abf4ff4e?ixlib=rb-4.0.3&ixid=MnwxMjA3fDB8MHxwaG90by1wYWdlfHx8fGVufDB8fHx8&auto=format&fit=crop&w=64&h=64"}
                alt="Avatar Preview"
                className="w-16 h-16 rounded-full object-cover border-2 border-gray-600"
              />
              {/* Upload button */}
              <Label
                htmlFor="avatar"
                className="cursor-pointer bg-gray-700 hover:bg-gray-600 px-4 py-2 rounded-lg transition-colors duration-200 flex-1 text-center"
              >
                <span className="text-sm font-medium">Choose Photo</span>
                <Input
                  id="avatar"
                  type="file"
                  accept="image/*"
                  onChange={handleAvatarChange}
                  className="hidden"
                />
              </Label>
            </div>
          </div>

          {/* Continue button */}
          <Button
            type="submit"
            disabled={!nickname.trim() || isLoading}
            className="w-full bg-gradient-to-r from-blue-600 to-purple-600 text-white font-semibold py-3 px-4 rounded-lg hover:opacity-90 transition-all duration-200 active:scale-95 disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {isLoading ? (
              <div className="flex items-center justify-center">
                <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-white mr-2"></div>
                Creating Account...
              </div>
            ) : (
              'Continue to Dashboard'
            )}
          </Button>
        </form>
      </div>
    </div>
  );
}
