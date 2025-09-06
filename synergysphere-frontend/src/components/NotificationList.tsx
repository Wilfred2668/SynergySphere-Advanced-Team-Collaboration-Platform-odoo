import React from 'react';
import { useNotifications } from '../contexts/NotificationContext';
import NotificationItem from './NotificationItem';

const NotificationList: React.FC = () => {
  const { notifications, loading, error, markAllAsRead, unreadCount } = useNotifications();

  if (loading) {
    return (
      <div className="p-4 text-center">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-500 mx-auto"></div>
        <p className="text-gray-500 mt-2">Loading notifications...</p>
      </div>
    );
  }

  if (error) {
    return (
      <div className="p-4 text-center">
        <div className="text-red-500 mb-2">
          <svg className="w-8 h-8 mx-auto" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
          </svg>
        </div>
        <p className="text-gray-600 text-sm">{error}</p>
      </div>
    );
  }

  if (notifications.length === 0) {
    return (
      <div className="p-8 text-center">
        <div className="text-gray-400 mb-3">
          <svg className="w-12 h-12 mx-auto" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 17h5l-5-5v-5a6 6 0 10-12 0v5l-5 5h5m7 0v1a3 3 0 11-6 0v-1m6 0H9" />
          </svg>
        </div>
        <p className="text-gray-500 font-medium">No notifications</p>
        <p className="text-gray-400 text-sm">You're all caught up!</p>
      </div>
    );
  }

  return (
    <div>
      {/* Mark All Read Button */}
      {unreadCount > 0 && (
        <div className="p-3 border-b border-gray-100">
          <button
            onClick={markAllAsRead}
            className="text-sm text-blue-600 hover:text-blue-800 font-medium transition-colors"
          >
            Mark all as read ({unreadCount})
          </button>
        </div>
      )}

      {/* Notifications List */}
      <div className="divide-y divide-gray-100">
        {notifications.map((notification) => (
          <NotificationItem
            key={notification.id}
            notification={notification}
          />
        ))}
      </div>

      {/* View All Link */}
      {notifications.length > 5 && (
        <div className="p-3 text-center border-t border-gray-100">
          <button className="text-sm text-blue-600 hover:text-blue-800 font-medium transition-colors">
            View all notifications
          </button>
        </div>
      )}
    </div>
  );
};

export default NotificationList;
