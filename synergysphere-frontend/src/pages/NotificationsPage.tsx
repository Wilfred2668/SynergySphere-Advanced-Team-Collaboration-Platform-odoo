import React, { useState } from 'react';
import { useNotifications } from '../contexts/NotificationContext';
import NotificationItem from '../components/NotificationItem';
import { Notification } from '../types';

const NotificationsPage: React.FC = () => {
  const { 
    notifications, 
    loading, 
    error, 
    markAllAsRead, 
    unreadCount,
    refreshNotifications 
  } = useNotifications();
  
  const [filter, setFilter] = useState<'all' | 'unread' | Notification['type']>('all');

  const filteredNotifications = notifications.filter(notification => {
    if (filter === 'all') return true;
    if (filter === 'unread') return !notification.read;
    return notification.type === filter;
  });

  const notificationTypes: { value: Notification['type']; label: string; icon: string }[] = [
    { value: 'task_assigned', label: 'Task Assigned', icon: '📋' },
    { value: 'task_status_changed', label: 'Task Updates', icon: '✅' },
    { value: 'task_due_soon', label: 'Due Soon', icon: '⏰' },
    { value: 'new_message', label: 'Messages', icon: '💬' },
    { value: 'project_invited', label: 'Project Invites', icon: '👥' },
    { value: 'project_role_changed', label: 'Role Changes', icon: '🔑' }
  ];

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Header */}
        <div className="mb-8">
          <div className="flex items-center justify-between">
            <h1 className="text-3xl font-bold text-gray-900">Notifications</h1>
            <div className="flex items-center space-x-4">
              <button
                onClick={refreshNotifications}
                className="p-2 text-gray-400 hover:text-gray-600 rounded-lg transition-colors"
                disabled={loading}
              >
                <svg 
                  className={`w-5 h-5 ${loading ? 'animate-spin' : ''}`} 
                  fill="none" 
                  stroke="currentColor" 
                  viewBox="0 0 24 24"
                >
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
                </svg>
              </button>
              {unreadCount > 0 && (
                <button
                  onClick={markAllAsRead}
                  className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors text-sm font-medium"
                >
                  Mark all read ({unreadCount})
                </button>
              )}
            </div>
          </div>
          
          {unreadCount > 0 && (
            <p className="text-gray-600 mt-2">
              You have {unreadCount} unread notification{unreadCount !== 1 ? 's' : ''}
            </p>
          )}
        </div>

        {/* Filters */}
        <div className="mb-6">
          <div className="flex flex-wrap gap-2">
            <button
              onClick={() => setFilter('all')}
              className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors ${
                filter === 'all'
                  ? 'bg-blue-600 text-white'
                  : 'bg-white text-gray-700 hover:bg-gray-50 border border-gray-300'
              }`}
            >
              All ({notifications.length})
            </button>
            <button
              onClick={() => setFilter('unread')}
              className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors ${
                filter === 'unread'
                  ? 'bg-blue-600 text-white'
                  : 'bg-white text-gray-700 hover:bg-gray-50 border border-gray-300'
              }`}
            >
              Unread ({unreadCount})
            </button>
            {notificationTypes.map(type => {
              const count = notifications.filter(n => n.type === type.value).length;
              if (count === 0) return null;
              
              return (
                <button
                  key={type.value}
                  onClick={() => setFilter(type.value)}
                  className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors flex items-center space-x-2 ${
                    filter === type.value
                      ? 'bg-blue-600 text-white'
                      : 'bg-white text-gray-700 hover:bg-gray-50 border border-gray-300'
                  }`}
                >
                  <span>{type.icon}</span>
                  <span>{type.label} ({count})</span>
                </button>
              );
            })}
          </div>
        </div>

        {/* Content */}
        <div className="bg-white rounded-lg shadow">
          {loading ? (
            <div className="p-12 text-center">
              <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-500 mx-auto"></div>
              <p className="text-gray-500 mt-4">Loading notifications...</p>
            </div>
          ) : error ? (
            <div className="p-12 text-center">
              <div className="text-red-500 mb-4">
                <svg className="w-12 h-12 mx-auto" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                </svg>
              </div>
              <p className="text-gray-600 mb-4">{error}</p>
              <button
                onClick={refreshNotifications}
                className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
              >
                Try Again
              </button>
            </div>
          ) : filteredNotifications.length === 0 ? (
            <div className="p-12 text-center">
              <div className="text-gray-400 mb-4">
                <svg className="w-12 h-12 mx-auto" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 17h5l-5-5v-5a6 6 0 10-12 0v5l-5 5h5m7 0v1a3 3 0 11-6 0v-1m6 0H9" />
                </svg>
              </div>
              <p className="text-gray-500 font-medium">
                {filter === 'all' ? 'No notifications' : `No ${filter === 'unread' ? 'unread' : filter} notifications`}
              </p>
              <p className="text-gray-400 text-sm mt-1">
                {filter === 'all' ? "You're all caught up!" : 'Check back later for new updates'}
              </p>
            </div>
          ) : (
            <div className="divide-y divide-gray-200">
              {filteredNotifications.map((notification) => (
                <NotificationItem
                  key={notification.id}
                  notification={notification}
                />
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default NotificationsPage;
