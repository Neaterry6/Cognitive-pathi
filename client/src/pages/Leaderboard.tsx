import React, { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { Trophy, Medal, Award, Star, ArrowLeft } from 'lucide-react';
import { apiRequest } from '@/lib/queryClient';
import { LeaderboardEntry, User } from '@/types';

interface LeaderboardProps {
  user: User;
  onBack: () => void;
}

export default function Leaderboard({ user, onBack }: LeaderboardProps) {
  const [leaderboardData, setLeaderboardData] = useState<LeaderboardEntry[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [activeFilter, setActiveFilter] = useState('overall');
  const [userRank, setUserRank] = useState<number | null>(null);

  useEffect(() => {
    loadLeaderboard();
  }, []);

  const loadLeaderboard = async () => {
    setIsLoading(true);
    try {
      const response = await apiRequest('GET', '/api/leaderboard?limit=50');
      const data = await response.json();
      setLeaderboardData(data);
      
      // Find user's rank
      const rank = data.findIndex((entry: LeaderboardEntry) => entry.user.id === user.id);
      setUserRank(rank >= 0 ? rank + 1 : null);
    } catch (error) {
      console.error('Error loading leaderboard:', error);
      setLeaderboardData([]);
    } finally {
      setIsLoading(false);
    }
  };

  const filters = [
    { id: 'overall', name: 'Overall' },
    { id: 'week', name: 'This Week' },
    { id: 'mathematics', name: 'Mathematics' },
    { id: 'english', name: 'English' },
  ];

  const getRankIcon = (rank: number) => {
    switch (rank) {
      case 1:
        return <Trophy className="h-6 w-6 text-yellow-500" />;
      case 2:
        return <Medal className="h-6 w-6 text-gray-400" />;
      case 3:
        return <Award className="h-6 w-6 text-orange-500" />;
      default:
        return <Star className="h-6 w-6 text-gray-500" />;
    }
  };

  const getRankBadgeColor = (rank: number) => {
    switch (rank) {
      case 1:
        return 'bg-gradient-to-r from-yellow-500 to-yellow-600 text-black';
      case 2:
        return 'bg-gradient-to-r from-gray-300 to-gray-400 text-black';
      case 3:
        return 'bg-gradient-to-r from-orange-500 to-orange-600 text-white';
      default:
        return 'bg-gray-700 text-white';
    }
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center min-h-96">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-500 mx-auto mb-4"></div>
          <p className="text-gray-400">Loading leaderboard...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center space-y-4 sm:space-y-0">
        <div className="flex items-center space-x-4">
          <div className="text-4xl">🏆</div>
          <div>
            <h2 className="text-3xl font-bold text-white">Leaderboard</h2>
            <p className="text-gray-400">See how you rank among other students</p>
          </div>
        </div>
        <Button
          onClick={onBack}
          className="bg-gray-600 hover:bg-gray-700 px-4 py-2 rounded-lg transition-colors"
        >
          ← Back to Dashboard
        </Button>
      </div>

      {/* Leaderboard filters */}
      <Card className="bg-gray-800 border-gray-700">
        <CardContent className="p-4">
          <div className="flex flex-wrap items-center gap-4">
            <span className="text-gray-400 font-medium">Filter by:</span>
            {filters.map((filter) => (
              <Button
                key={filter.id}
                onClick={() => setActiveFilter(filter.id)}
                className={`px-4 py-2 rounded-lg text-sm transition-colors ${
                  activeFilter === filter.id
                    ? 'bg-blue-600 hover:bg-blue-700 text-white'
                    : 'bg-gray-600 hover:bg-gray-700 text-gray-300'
                }`}
              >
                {filter.name}
              </Button>
            ))}
          </div>
        </CardContent>
      </Card>

      {/* Your rank card */}
      {userRank && (
        <div className="bg-gradient-to-r from-blue-600 to-purple-600 rounded-xl p-6 text-white">
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-4">
              {/* Profile picture with rank badge */}
              <div className="relative">
                <img
                  src={user.avatarUrl || "https://images.unsplash.com/photo-1472099645785-5658abf4ff4e?ixlib=rb-4.0.3&ixid=MnwxMjA3fDB8MHxwaG90by1wYWdlfHx8fGVufDB8fHx8&auto=format&fit=crop&w=64&h=64"}
                  alt="Your Profile"
                  className="w-16 h-16 rounded-full object-cover border-4 border-white"
                />
                <div className="absolute -top-2 -right-2 bg-yellow-500 text-black w-8 h-8 rounded-full flex items-center justify-center font-bold text-sm">
                  {userRank}
                </div>
              </div>
              <div>
                <h3 className="text-xl font-bold">{user.nickname}</h3>
                <p className="opacity-90">Your Current Rank</p>
              </div>
            </div>
            <div className="text-right">
              <div className="text-3xl font-bold">{user.totalScore}%</div>
              <div className="text-sm opacity-90">Average Score</div>
            </div>
          </div>
        </div>
      )}

      {/* Leaderboard list */}
      <Card className="bg-gray-800 border-gray-700 overflow-hidden">
        <CardContent className="p-6">
          <h3 className="text-xl font-bold text-white mb-4">Top Performers</h3>

          {leaderboardData.length > 0 ? (
            <div className="space-y-3">
              {leaderboardData.map((entry, index) => {
                const rank = index + 1;
                const isCurrentUser = entry.user.id === user.id;

                return (
                  <div
                    key={entry.user.id}
                    className={`flex items-center justify-between p-4 rounded-lg transition-all ${
                      rank <= 3
                        ? getRankBadgeColor(rank)
                        : isCurrentUser
                        ? 'bg-blue-900 border-2 border-blue-500'
                        : 'bg-gray-700'
                    }`}
                  >
                    <div className="flex items-center space-x-4">
                      <div className="flex items-center justify-center w-12 h-12">
                        {rank <= 3 ? (
                          getRankIcon(rank)
                        ) : (
                          <div className={`w-8 h-8 rounded-full flex items-center justify-center font-bold text-sm ${
                            isCurrentUser ? 'bg-blue-600 text-white' : 'bg-gray-600 text-white'
                          }`}>
                            {rank}
                          </div>
                        )}
                      </div>
                      <div className="flex items-center space-x-3">
                        <img
                          src={entry.user.avatarUrl || "https://images.unsplash.com/photo-1472099645785-5658abf4ff4e?ixlib=rb-4.0.3&ixid=MnwxMjA3fDB8MHxwaG90by1wYWdlfHx8fGVufDB8fHx8&auto=format&fit=crop&w=40&h=40"}
                          alt={entry.user.nickname}
                          className="w-10 h-10 rounded-full object-cover"
                        />
                        <div>
                          <h5 className={`font-semibold ${rank <= 3 ? 'text-black' : 'text-white'}`}>
                            {entry.user.nickname}
                            {isCurrentUser && ' (You)'}
                          </h5>
                          <p className={`text-sm ${
                            rank <= 3 
                              ? 'opacity-80 text-black' 
                              : isCurrentUser 
                              ? 'text-blue-300' 
                              : 'text-gray-400'
                          }`}>
                            {entry.user.isPremium ? 'Premium Student' : 'Student'}
                          </p>
                        </div>
                      </div>
                    </div>
                    <div className="text-right">
                      <div className={`text-xl font-bold ${rank <= 3 ? 'text-black' : 'text-white'}`}>
                        {entry.avgScore.toFixed(1)}%
                      </div>
                      <div className={`text-sm ${
                        rank <= 3 
                          ? 'opacity-80 text-black' 
                          : isCurrentUser 
                          ? 'text-blue-300' 
                          : 'text-gray-400'
                      }`}>
                        {entry.totalTests} tests
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          ) : (
            <div className="text-center py-8">
              <div className="text-4xl mb-4">📊</div>
              <h3 className="text-xl font-bold text-white mb-2">No Data Available</h3>
              <p className="text-gray-400">
                Complete some quizzes to see the leaderboard!
              </p>
            </div>
          )}

          <div className="mt-6 pt-4 border-t border-gray-700 text-center">
            <p className="text-sm text-gray-400">
              Rankings updated every hour • Total students: {leaderboardData.length}
            </p>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
