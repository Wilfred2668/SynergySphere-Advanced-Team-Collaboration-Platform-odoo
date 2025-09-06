import React, { createContext, useContext, useState, useEffect, ReactNode } from 'react';
import { Notification } from '../types';
import { apiService } from '../services/api';
import { useAuth } from './AuthContext';

interface NotificationContextType {
  notifications: Notification[];
  unreadCount: number;
  loading: boolean;
  error: string | null;
  markAsRead: (id: string) => Promise<void>;
  markAllAsRead: () => Promise<void>;
  refreshNotifications: () => Promise<void>;
  getNotificationIcon: (type: Notification['type']) => string;
  getNotificationColor: (type: Notification['type']) => string;
}

const NotificationContext = createContext<NotificationContextType | undefined>(undefined);

export const useNotifications = () => {
  const context = useContext(NotificationContext);
  if (context === undefined) {
    throw new Error('useNotifications must be used within a NotificationProvider');
  }
  return context;
};

interface NotificationProviderProps {
  children: ReactNode;
}

export const NotificationProvider: React.FC<NotificationProviderProps> = ({ children }) => {
  const [notifications, setNotifications] = useState<Notification[]>([]);
  const [unreadCount, setUnreadCount] = useState(0);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const { user } = useAuth();

  const refreshNotifications = async () => {
    if (!user) return;
    
    setLoading(true);
    setError(null);
    
    try {
      const [notificationsData, unreadCountData] = await Promise.all([
        apiService.getNotifications(),
        apiService.getUnreadNotificationCount()
      ]);
      
      setNotifications(notificationsData);
      setUnreadCount(unreadCountData);
    } catch (err) {
      console.error('Failed to fetch notifications:', err);
      setError('Failed to load notifications');
    } finally {
      setLoading(false);
    }
  };

  const markAsRead = async (id: string) => {
    try {
      const updatedNotification = await apiService.markNotificationRead(id);
      
      setNotifications(prev => 
        prev.map(notif => 
          notif.id === id ? { ...notif, read: true } : notif
        )
      );
      
      setUnreadCount(prev => Math.max(0, prev - 1));
    } catch (err) {
      console.error('Failed to mark notification as read:', err);
      setError('Failed to mark notification as read');
    }
  };

  const markAllAsRead = async () => {
    try {
      await apiService.markAllNotificationsRead();
      
      setNotifications(prev => 
        prev.map(notif => ({ ...notif, read: true }))
      );
      
      setUnreadCount(0);
    } catch (err) {
      console.error('Failed to mark all notifications as read:', err);
      setError('Failed to mark all notifications as read');
    }
  };

  const getNotificationIcon = (type: Notification['type']): string => {
    const iconMap = {
      'task_assigned': '📋',
      'task_status_changed': '✅',
      'task_due_soon': '⏰',
      'new_message': '💬',
      'project_invited': '👥',
      'project_role_changed': '🔑'
    };
    return iconMap[type] || '🔔';
  };

  const getNotificationColor = (type: Notification['type']): string => {
    const colorMap = {
      'task_assigned': 'bg-blue-100 border-blue-400',
      'task_status_changed': 'bg-green-100 border-green-400',
      'task_due_soon': 'bg-orange-100 border-orange-400',
      'new_message': 'bg-purple-100 border-purple-400',
      'project_invited': 'bg-indigo-100 border-indigo-400',
      'project_role_changed': 'bg-yellow-100 border-yellow-400'
    };
    return colorMap[type] || 'bg-gray-100 border-gray-400';
  };

  // Auto-refresh notifications when user logs in
  useEffect(() => {
    if (user) {
      refreshNotifications();
    } else {
      setNotifications([]);
      setUnreadCount(0);
    }
  }, [user]);

  // Set up periodic refresh (every 30 seconds)
  useEffect(() => {
    if (!user) return;

    const interval = setInterval(() => {
      refreshNotifications();
    }, 30000); // 30 seconds

    return () => clearInterval(interval);
  }, [user]);

  const value: NotificationContextType = {
    notifications,
    unreadCount,
    loading,
    error,
    markAsRead,
    markAllAsRead,
    refreshNotifications,
    getNotificationIcon,
    getNotificationColor
  };

  return (
    <NotificationContext.Provider value={value}>
      {children}
    </NotificationContext.Provider>
  );
};
