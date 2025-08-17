import React, { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Switch } from '@/components/ui/switch';
import { Badge } from '@/components/ui/badge';
import { User } from '@shared/schema';
import { 
  ArrowLeft, 
  User as UserIcon, 
  Bell, 
  Lock, 
  Palette, 
  Volume2,
  Shield,
  Key,
  Crown,
  Settings as SettingsIcon
} from 'lucide-react';

interface SettingsProps {
  user: User;
  onBack: () => void;
}

export default function Settings({ user, onBack }: SettingsProps) {
  const [notifications, setNotifications] = useState(true);
  const [soundEnabled, setSoundEnabled] = useState(true);
  const [darkMode, setDarkMode] = useState(false);
  const [autoSave, setAutoSave] = useState(true);

  const handleSaveSettings = () => {
    // Save settings logic here
    console.log('Settings saved');
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-900 via-purple-900 to-indigo-900 p-4">
      <div className="max-w-4xl mx-auto">
        {/* Header */}
        <div className="flex items-center justify-between mb-8">
          <Button
            onClick={onBack}
            variant="ghost"
            className="text-white hover:bg-white/10"
          >
            <ArrowLeft className="h-5 w-5 mr-2" />
            Back to Dashboard
          </Button>
          <div className="text-center">
            <div className="w-16 h-16 bg-gradient-to-r from-purple-500 to-blue-500 rounded-full mx-auto mb-4 flex items-center justify-center">
              <SettingsIcon className="h-8 w-8 text-white" />
            </div>
            <h1 className="text-3xl font-bold text-white mb-2">Settings</h1>
            <p className="text-blue-200">Manage your account and preferences</p>
          </div>
          <div className="w-20" />
        </div>

        <div className="grid md:grid-cols-2 gap-8">
          {/* Profile Settings */}
          <Card className="bg-white/10 backdrop-blur-lg border-white/20">
            <CardHeader>
              <CardTitle className="text-white flex items-center">
                <UserIcon className="h-5 w-5 mr-2" />
                Profile Information
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="flex items-center space-x-4 mb-6">
                <div className="w-16 h-16 bg-gradient-to-r from-purple-500 to-blue-500 rounded-full flex items-center justify-center">
                  <span className="text-white text-xl font-bold">
                    {user.firstName?.charAt(0)?.toUpperCase() || 'U'}
                  </span>
                </div>
                <div>
                  <h3 className="text-white font-semibold">{user.firstName} {user.lastName}</h3>
                  <p className="text-blue-200 text-sm">{user.email}</p>
                  {user.isPremium && (
                    <Badge className="bg-gradient-to-r from-yellow-500 to-orange-500 mt-1">
                      <Crown className="h-3 w-3 mr-1" />
                      Premium
                    </Badge>
                  )}
                </div>
              </div>

              <div className="space-y-3">
                <div>
                  <Label htmlFor="firstName" className="text-white">First Name</Label>
                  <Input
                    id="firstName"
                    defaultValue={user.firstName || ''}
                    className="bg-white/20 border-white/30 text-white placeholder:text-blue-200"
                  />
                </div>
                <div>
                  <Label htmlFor="lastName" className="text-white">Last Name</Label>
                  <Input
                    id="lastName"
                    defaultValue={user.lastName || ''}
                    className="bg-white/20 border-white/30 text-white placeholder:text-blue-200"
                  />
                </div>
                <div>
                  <Label htmlFor="nickname" className="text-white">Nickname</Label>
                  <Input
                    id="nickname"
                    defaultValue={user.nickname || ''}
                    className="bg-white/20 border-white/30 text-white placeholder:text-blue-200"
                  />
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Account Status */}
          <Card className="bg-white/10 backdrop-blur-lg border-white/20">
            <CardHeader>
              <CardTitle className="text-white flex items-center">
                <Shield className="h-5 w-5 mr-2" />
                Account Status
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="space-y-4">
                <div className="flex items-center justify-between p-4 bg-white/10 rounded-lg">
                  <div>
                    <p className="text-white font-medium">Account Type</p>
                    <p className="text-blue-200 text-sm">
                      {user.isPremium ? 'Premium Member' : 'Free Member'}
                    </p>
                  </div>
                  {user.isPremium ? (
                    <Badge className="bg-gradient-to-r from-yellow-500 to-orange-500">
                      <Crown className="h-3 w-3 mr-1" />
                      Premium
                    </Badge>
                  ) : (
                    <Badge variant="secondary">Free</Badge>
                  )}
                </div>

                <div className="flex items-center justify-between p-4 bg-white/10 rounded-lg">
                  <div>
                    <p className="text-white font-medium">Activation Status</p>
                    <p className="text-blue-200 text-sm">
                      {user.isActivated ? 'Activated' : 'Not Activated'}
                    </p>
                  </div>
                  <Badge className={user.isActivated ? 'bg-green-500' : 'bg-red-500'}>
                    {user.isActivated ? 'Active' : 'Inactive'}
                  </Badge>
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div className="text-center p-4 bg-white/10 rounded-lg">
                    <p className="text-2xl font-bold text-white">{user.testsCompleted || 0}</p>
                    <p className="text-blue-200 text-sm">Tests Completed</p>
                  </div>
                  <div className="text-center p-4 bg-white/10 rounded-lg">
                    <p className="text-2xl font-bold text-white">{user.totalScore || 0}</p>
                    <p className="text-blue-200 text-sm">Total Score</p>
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* App Preferences */}
          <Card className="bg-white/10 backdrop-blur-lg border-white/20">
            <CardHeader>
              <CardTitle className="text-white flex items-center">
                <Palette className="h-5 w-5 mr-2" />
                App Preferences
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-white font-medium">Notifications</p>
                  <p className="text-blue-200 text-sm">Receive app notifications</p>
                </div>
                <Switch
                  checked={notifications}
                  onCheckedChange={setNotifications}
                />
              </div>

              <div className="flex items-center justify-between">
                <div>
                  <p className="text-white font-medium">Sound Effects</p>
                  <p className="text-blue-200 text-sm">Play sounds for interactions</p>
                </div>
                <Switch
                  checked={soundEnabled}
                  onCheckedChange={setSoundEnabled}
                />
              </div>

              <div className="flex items-center justify-between">
                <div>
                  <p className="text-white font-medium">Dark Mode</p>
                  <p className="text-blue-200 text-sm">Use dark theme</p>
                </div>
                <Switch
                  checked={darkMode}
                  onCheckedChange={setDarkMode}
                />
              </div>

              <div className="flex items-center justify-between">
                <div>
                  <p className="text-white font-medium">Auto-Save Progress</p>
                  <p className="text-blue-200 text-sm">Automatically save your progress</p>
                </div>
                <Switch
                  checked={autoSave}
                  onCheckedChange={setAutoSave}
                />
              </div>
            </CardContent>
          </Card>

          {/* Security Settings */}
          <Card className="bg-white/10 backdrop-blur-lg border-white/20">
            <CardHeader>
              <CardTitle className="text-white flex items-center">
                <Lock className="h-5 w-5 mr-2" />
                Security & Privacy
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="space-y-3">
                <div>
                  <Label htmlFor="currentPassword" className="text-white">Current Password</Label>
                  <Input
                    id="currentPassword"
                    type="password"
                    placeholder="Enter current password"
                    className="bg-white/20 border-white/30 text-white placeholder:text-blue-200"
                  />
                </div>
                <div>
                  <Label htmlFor="newPassword" className="text-white">New Password</Label>
                  <Input
                    id="newPassword"
                    type="password"
                    placeholder="Enter new password"
                    className="bg-white/20 border-white/30 text-white placeholder:text-blue-200"
                  />
                </div>
                <div>
                  <Label htmlFor="confirmPassword" className="text-white">Confirm Password</Label>
                  <Input
                    id="confirmPassword"
                    type="password"
                    placeholder="Confirm new password"
                    className="bg-white/20 border-white/30 text-white placeholder:text-blue-200"
                  />
                </div>
                
                <Button className="w-full bg-gradient-to-r from-red-500 to-pink-500 hover:from-red-600 hover:to-pink-600">
                  <Lock className="h-4 w-4 mr-2" />
                  Update Password
                </Button>
              </div>

              {!user.isPremium && (
                <div className="mt-6 p-4 bg-gradient-to-r from-yellow-500/20 to-orange-500/20 border border-yellow-500/30 rounded-lg">
                  <div className="flex items-center mb-2">
                    <Key className="h-5 w-5 text-yellow-400 mr-2" />
                    <h4 className="text-yellow-200 font-semibold">Upgrade to Premium</h4>
                  </div>
                  <p className="text-yellow-100 text-sm mb-3">
                    Get unlimited access to all features with a premium activation code
                  </p>
                  <Button 
                    className="w-full bg-gradient-to-r from-yellow-500 to-orange-500 hover:from-yellow-600 hover:to-orange-600"
                    onClick={() => window.location.href = '/activate'}
                  >
                    <Crown className="h-4 w-4 mr-2" />
                    Activate Premium
                  </Button>
                </div>
              )}
            </CardContent>
          </Card>
        </div>

        {/* Save Settings Button */}
        <div className="mt-8 text-center">
          <Button 
            onClick={handleSaveSettings}
            className="bg-gradient-to-r from-blue-500 to-purple-500 hover:from-blue-600 hover:to-purple-600 text-white px-8 py-3"
            size="lg"
          >
            Save All Settings
          </Button>
        </div>
      </div>
    </div>
  );
}