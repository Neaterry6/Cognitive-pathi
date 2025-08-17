import React, { useState, useEffect } from 'react';
import { Badge, Trophy, Star, Zap, Brain, Target, Award } from 'lucide-react';
import { useQuery } from '@tanstack/react-query';

interface UserBadge {
  id: string;
  title: string;
  description: string;
  icon: string;
  color: string;
  rarity: 'common' | 'rare' | 'epic' | 'legendary';
  progress: number;
  maxProgress: number;
  unlockedAt?: Date;
}

interface UserBadgesProps {
  userId: string;
  className?: string;
}

const getBadgeIcon = (iconName: string) => {
  const icons: { [key: string]: React.ComponentType<any> } = {
    trophy: Trophy,
    star: Star,
    zap: Zap,
    brain: Brain,
    target: Target,
    award: Award,
    badge: Badge
  };
  
  const IconComponent = icons[iconName] || Badge;
  return <IconComponent className="w-5 h-5" />;
};

const getRarityColor = (rarity: string) => {
  switch (rarity) {
    case 'common': return 'from-gray-400 to-gray-600';
    case 'rare': return 'from-blue-400 to-blue-600';
    case 'epic': return 'from-purple-400 to-purple-600';
    case 'legendary': return 'from-yellow-400 to-orange-600';
    default: return 'from-gray-400 to-gray-600';
  }
};

export default function UserBadges({ userId, className = '' }: UserBadgesProps) {
  const { data: badges = [], isLoading } = useQuery({
    queryKey: ['userBadges', userId],
    queryFn: async () => {
      const response = await fetch(`/api/users/${userId}/badges`);
      if (!response.ok) throw new Error('Failed to fetch badges');
      return response.json() as UserBadge[];
    }
  });

  if (isLoading) {
    return (
      <div className={`animate-pulse ${className}`}>
        <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
          {[...Array(4)].map((_, i) => (
            <div key={i} className="h-32 bg-gray-200 rounded-xl"></div>
          ))}
        </div>
      </div>
    );
  }

  const unlockedBadges = badges.filter(badge => badge.progress >= badge.maxProgress);
  const inProgressBadges = badges.filter(badge => badge.progress < badge.maxProgress);

  return (
    <div className={`space-y-6 ${className}`}>
      {/* Unlocked Badges */}
      {unlockedBadges.length > 0 && (
        <div>
          <h3 className="text-lg font-semibold text-gray-800 dark:text-gray-200 mb-4 flex items-center">
            <Trophy className="w-5 h-5 mr-2 text-yellow-500" />
            Unlocked Badges ({unlockedBadges.length})
          </h3>
          <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
            {unlockedBadges.map((badge) => (
              <div
                key={badge.id}
                className="relative p-4 bg-white dark:bg-gray-800 rounded-xl shadow-lg border-2 border-transparent hover:shadow-xl transition-all duration-300"
                data-testid={`badge-unlocked-${badge.id}`}
              >
                {/* Rarity glow effect */}
                <div className={`absolute inset-0 bg-gradient-to-r ${getRarityColor(badge.rarity)} opacity-20 rounded-xl`}></div>
                
                <div className="relative z-10 text-center">
                  <div className={`w-12 h-12 mx-auto mb-3 bg-gradient-to-r ${getRarityColor(badge.rarity)} rounded-full flex items-center justify-center text-white shadow-lg`}>
                    {getBadgeIcon(badge.icon)}
                  </div>
                  <h4 className="font-semibold text-sm text-gray-800 dark:text-gray-200 mb-1">
                    {badge.title}
                  </h4>
                  <p className="text-xs text-gray-600 dark:text-gray-400 mb-2">
                    {badge.description}
                  </p>
                  <div className="text-xs text-green-600 dark:text-green-400 font-medium">
                    ✓ Unlocked
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* In Progress Badges */}
      {inProgressBadges.length > 0 && (
        <div>
          <h3 className="text-lg font-semibold text-gray-800 dark:text-gray-200 mb-4 flex items-center">
            <Target className="w-5 h-5 mr-2 text-blue-500" />
            In Progress ({inProgressBadges.length})
          </h3>
          <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
            {inProgressBadges.map((badge) => (
              <div
                key={badge.id}
                className="relative p-4 bg-white dark:bg-gray-800 rounded-xl shadow-lg border border-gray-200 dark:border-gray-700 hover:shadow-xl transition-all duration-300 opacity-75"
                data-testid={`badge-progress-${badge.id}`}
              >
                <div className="text-center">
                  <div className="w-12 h-12 mx-auto mb-3 bg-gray-400 rounded-full flex items-center justify-center text-white shadow-lg">
                    {getBadgeIcon(badge.icon)}
                  </div>
                  <h4 className="font-semibold text-sm text-gray-800 dark:text-gray-200 mb-1">
                    {badge.title}
                  </h4>
                  <p className="text-xs text-gray-600 dark:text-gray-400 mb-2">
                    {badge.description}
                  </p>
                  
                  {/* Progress bar */}
                  <div className="w-full bg-gray-200 dark:bg-gray-700 rounded-full h-2 mb-1">
                    <div 
                      className={`h-2 bg-gradient-to-r ${getRarityColor(badge.rarity)} rounded-full transition-all duration-300`}
                      style={{ width: `${(badge.progress / badge.maxProgress) * 100}%` }}
                    ></div>
                  </div>
                  <div className="text-xs text-gray-600 dark:text-gray-400">
                    {badge.progress} / {badge.maxProgress}
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Empty state */}
      {badges.length === 0 && (
        <div className="text-center py-12">
          <Trophy className="w-16 h-16 mx-auto text-gray-400 mb-4" />
          <h3 className="text-lg font-semibold text-gray-600 dark:text-gray-400 mb-2">
            No badges yet
          </h3>
          <p className="text-gray-500 dark:text-gray-500">
            Start using the app to unlock your first badge!
          </p>
        </div>
      )}
    </div>
  );
}