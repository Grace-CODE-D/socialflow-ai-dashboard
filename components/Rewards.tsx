import React, { useState } from 'react';
import { Card } from './ui/Card';
import { ViewProps, LeaderboardEntry, RewardNotification, TimePeriod } from '../types';

const MaterialIcon = ({ name, className }: { name: string, className?: string }) => (
  <span className={`material-symbols-outlined ${className}`}>{name}</span>
);

const mockLeaderboard: LeaderboardEntry[] = [
  { userId: '1', username: 'sarah_creator', avatar: '👩', totalRewards: 2450, engagementCount: 1250, rank: 1 },
  { userId: '2', username: 'mike_digital', avatar: '👨', totalRewards: 2100, engagementCount: 980, rank: 2 },
  { userId: '3', username: 'emma_social', avatar: '👧', totalRewards: 1890, engagementCount: 850, rank: 3 },
  { userId: '4', username: 'alex_content', avatar: '🧑', totalRewards: 1650, engagementCount: 720, rank: 4 },
  { userId: '5', username: 'lisa_media', avatar: '👩', totalRewards: 1420, engagementCount: 650, rank: 5 },
  { userId: '6', username: 'john_engage', avatar: '👨', totalRewards: 1280, engagementCount: 580, rank: 6 },
  { userId: '7', username: 'kate_viral', avatar: '👧', totalRewards: 1150, engagementCount: 520, rank: 7 },
  { userId: '8', username: 'tom_growth', avatar: '🧑', totalRewards: 980, engagementCount: 450, rank: 8 },
];

const mockNotifications: RewardNotification[] = [
  { id: '1', userId: 'user1', amount: 50, reason: 'Post reached 1K likes', timestamp: new Date(Date.now() - 2 * 60 * 60 * 1000), read: false },
  { id: '2', userId: 'user1', amount: 100, reason: 'Video went viral - 10K views', timestamp: new Date(Date.now() - 5 * 60 * 60 * 1000), read: false },
  { id: '3', userId: 'user1', amount: 25, reason: 'High engagement rate (8.5%)', timestamp: new Date(Date.now() - 24 * 60 * 60 * 1000), read: true },
  { id: '4', userId: 'user1', amount: 75, reason: 'Story completion rate 95%', timestamp: new Date(Date.now() - 2 * 24 * 60 * 60 * 1000), read: true },
];

export const Rewards: React.FC<ViewProps> = () => {
  const [timePeriod, setTimePeriod] = useState<TimePeriod>('weekly');
  const [currentPage, setCurrentPage] = useState(1);
  const [showNotifications, setShowNotifications] = useState(false);
  const [notifications, setNotifications] = useState(mockNotifications);
  const itemsPerPage = 5;

  const totalPages = Math.ceil(mockLeaderboard.length / itemsPerPage);
  const paginatedData = mockLeaderboard.slice((currentPage - 1) * itemsPerPage, currentPage * itemsPerPage);
  const unreadCount = notifications.filter(n => !n.read).length;

  const markAsRead = (id: string) => {
    setNotifications(prev => prev.map(n => n.id === id ? { ...n, read: true } : n));
  };

  const markAllAsRead = () => {
    setNotifications(prev => prev.map(n => ({ ...n, read: true })));
  };

  const formatTime = (date: Date) => {
    const hours = Math.floor((Date.now() - date.getTime()) / (1000 * 60 * 60));
    if (hours < 1) return 'Just now';
    if (hours < 24) return `${hours}h ago`;
    return `${Math.floor(hours / 24)}d ago`;
  };

  return (
    <div className="p-7 space-y-7 animate-fade-in">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold text-white">Engagement Rewards</h2>
          <p className="text-sm text-gray-subtext mt-1">Track top engagers and reward distribution</p>
        </div>
        <button
          onClick={() => setShowNotifications(!showNotifications)}
          className="relative p-3 rounded-xl bg-dark-surface border border-dark-border hover:bg-white/5 transition-colors"
        >
          <MaterialIcon name="notifications" className="text-primary-blue" />
          {unreadCount > 0 && (
            <span className="absolute -top-1 -right-1 w-5 h-5 bg-red-500 text-white text-xs rounded-full flex items-center justify-center">
              {unreadCount}
            </span>
          )}
        </button>
      </div>

      {showNotifications && (
        <Card>
          <div className="flex justify-between items-center mb-4">
            <h3 className="text-lg font-semibold text-white">Reward Notifications</h3>
            <button onClick={markAllAsRead} className="text-xs text-primary-blue hover:underline">
              Mark all as read
            </button>
          </div>
          <div className="space-y-3 max-h-96 overflow-y-auto">
            {notifications.map(notif => (
              <div
                key={notif.id}
                onClick={() => markAsRead(notif.id)}
                className={`p-4 rounded-xl border cursor-pointer transition-colors ${
                  notif.read ? 'bg-dark-surface border-dark-border' : 'bg-primary-blue/5 border-primary-blue/20'
                }`}
              >
                <div className="flex items-start justify-between gap-3">
                  <div className="flex-1">
                    <p className="text-sm text-white font-medium">{notif.reason}</p>
                    <p className="text-xs text-gray-subtext mt-1">{formatTime(notif.timestamp)}</p>
                  </div>
                  <div className="text-right">
                    <p className="text-lg font-bold text-primary-teal">+{notif.amount} XLM</p>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </Card>
      )}

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <Card>
          <div className="flex items-center gap-3 mb-2">
            <div className="p-3 rounded-xl bg-primary-blue/10">
              <MaterialIcon name="emoji_events" className="text-primary-blue text-2xl" />
            </div>
            <div>
              <p className="text-sm text-gray-subtext">Total Distributed</p>
              <p className="text-2xl font-bold text-white">12,450 XLM</p>
            </div>
          </div>
        </Card>

        <Card>
          <div className="flex items-center gap-3 mb-2">
            <div className="p-3 rounded-xl bg-primary-teal/10">
              <MaterialIcon name="account_balance_wallet" className="text-primary-teal text-2xl" />
            </div>
            <div>
              <p className="text-sm text-gray-subtext">Pool Balance</p>
              <p className="text-2xl font-bold text-white">8,750 XLM</p>
            </div>
          </div>
        </Card>

        <Card>
          <div className="flex items-center gap-3 mb-2">
            <div className="p-3 rounded-xl bg-purple-500/10">
              <MaterialIcon name="group" className="text-purple-400 text-2xl" />
            </div>
            <div>
              <p className="text-sm text-gray-subtext">Active Engagers</p>
              <p className="text-2xl font-bold text-white">1,248</p>
            </div>
          </div>
        </Card>
      </div>

      <Card>
        <div className="flex justify-between items-center mb-6">
          <h3 className="text-lg font-semibold text-white">Leaderboard</h3>
          <select
            value={timePeriod}
            onChange={(e) => setTimePeriod(e.target.value as TimePeriod)}
            className="bg-dark-surface text-sm text-gray-subtext border border-dark-border rounded-xl px-4 py-2 focus:outline-none focus:border-primary-blue transition-colors"
          >
            <option value="daily">Daily</option>
            <option value="weekly">Weekly</option>
            <option value="all-time">All Time</option>
          </select>
        </div>

        <div className="space-y-3">
          {paginatedData.map((entry) => (
            <div
              key={entry.userId}
              className="flex items-center gap-4 p-4 rounded-xl bg-dark-surface border border-dark-border hover:border-primary-blue/30 transition-colors"
            >
              <div className={`w-10 h-10 rounded-full flex items-center justify-center text-xl font-bold ${
                entry.rank === 1 ? 'bg-yellow-500/20 text-yellow-500' :
                entry.rank === 2 ? 'bg-gray-400/20 text-gray-400' :
                entry.rank === 3 ? 'bg-orange-500/20 text-orange-500' :
                'bg-dark-bg text-gray-subtext'
              }`}>
                {entry.rank}
              </div>
              
              <div className="w-12 h-12 rounded-full bg-gradient-to-br from-primary-blue to-primary-teal flex items-center justify-center text-2xl">
                {entry.avatar}
              </div>

              <div className="flex-1">
                <p className="text-white font-medium">{entry.username}</p>
                <p className="text-xs text-gray-subtext">{entry.engagementCount} engagements</p>
              </div>

              <div className="text-right">
                <p className="text-lg font-bold text-primary-teal">{entry.totalRewards} XLM</p>
                <p className="text-xs text-gray-subtext">Total earned</p>
              </div>
            </div>
          ))}
        </div>

        <div className="flex items-center justify-between mt-6 pt-4 border-t border-dark-border">
          <button
            onClick={() => setCurrentPage(p => Math.max(1, p - 1))}
            disabled={currentPage === 1}
            className="px-4 py-2 rounded-xl bg-dark-surface border border-dark-border text-sm text-white disabled:opacity-50 disabled:cursor-not-allowed hover:bg-white/5 transition-colors"
          >
            Previous
          </button>
          
          <span className="text-sm text-gray-subtext">
            Page {currentPage} of {totalPages}
          </span>

          <button
            onClick={() => setCurrentPage(p => Math.min(totalPages, p + 1))}
            disabled={currentPage === totalPages}
            className="px-4 py-2 rounded-xl bg-dark-surface border border-dark-border text-sm text-white disabled:opacity-50 disabled:cursor-not-allowed hover:bg-white/5 transition-colors"
          >
            Next
          </button>
        </div>
      </Card>
    </div>
  );
};
