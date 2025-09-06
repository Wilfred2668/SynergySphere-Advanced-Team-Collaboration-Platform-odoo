import React from 'react';
import { Notification } from '../types';
import { useNotifications } from '../contexts/NotificationContext';

interface NotificationItemProps {
  notification: Notification;
}

const NotificationItem: React.FC<NotificationItemProps> = ({ notification }) => {
  const { markAsRead, getNotificationIcon, getNotificationColor } = useNotifications();

  const handleClick = () => {
    if (!notification.read) {
      markAsRead(notification.id);
    }
  };

  const formatTimeAgo = (dateString: string): string => {
    const date = new Date(dateString);
    const now = new Date();
    const diffInMinutes = Math.floor((now.getTime() - date.getTime()) / (1000 * 60));

    if (diffInMinutes < 1) return 'Just now';
    if (diffInMinutes < 60) return `${diffInMinutes}m ago`;
    
    const diffInHours = Math.floor(diffInMinutes / 60);
    if (diffInHours < 24) return `${diffInHours}h ago`;
    
    const diffInDays = Math.floor(diffInHours / 24);
    if (diffInDays < 7) return `${diffInDays}d ago`;
    
    return date.toLocaleDateString();
  };

  const getNotificationTypeLabel = (type: Notification['type']): string => {
    const typeLabels = {
      'task_assigned': 'Task Assigned',
      'task_status_changed': 'Task Updated',
      'task_due_soon': 'Due Soon',
      'new_message': 'New Message',
      'project_invited': 'Project Invite',
      'project_role_changed': 'Role Changed'
    };
    return typeLabels[type] || 'Notification';
  };

  return (
    <div
      className={`p-4 hover:bg-gray-50 cursor-pointer transition-colors ${
        !notification.read ? 'bg-blue-50 border-l-4 border-blue-500' : ''
      }`}
      onClick={handleClick}
    >
      <div className="flex items-start space-x-3">
        {/* Icon */}
        <div className={`flex-shrink-0 w-10 h-10 rounded-full flex items-center justify-center text-lg ${getNotificationColor(notification.type)}`}>
          {getNotificationIcon(notification.type)}
        </div>

        {/* Content */}
        <div className="flex-1 min-w-0">
          <div className="flex items-center justify-between">
            <p className={`text-sm font-medium ${!notification.read ? 'text-gray-900' : 'text-gray-700'}`}>
              {notification.title}
            </p>
            {!notification.read && (
              <div className="w-2 h-2 bg-blue-500 rounded-full flex-shrink-0"></div>
            )}
          </div>
          
          <p className={`text-sm mt-1 ${!notification.read ? 'text-gray-700' : 'text-gray-500'}`}>
            {notification.body}
          </p>
          
          <div className="flex items-center justify-between mt-2">
            <div className="flex items-center space-x-2 text-xs text-gray-500">
              <span>{getNotificationTypeLabel(notification.type)}</span>
              {notification.project_name && (
                <>
                  <span>•</span>
                  <span>{notification.project_name}</span>
                </>
              )}
            </div>
            <span className="text-xs text-gray-400">
              {formatTimeAgo(notification.created_at)}
            </span>
          </div>
        </div>
      </div>
    </div>
  );
};

export default NotificationItem;
