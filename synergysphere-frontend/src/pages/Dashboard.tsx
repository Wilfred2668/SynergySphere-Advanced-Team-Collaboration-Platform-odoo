import React from 'react';
import { motion } from 'framer-motion';
import { useNavigate } from 'react-router-dom';
import { 
  FolderIcon, 
  CheckCircleIcon, 
  ChatBubbleLeftRightIcon, 
  ClockIcon,
  UserGroupIcon,
  TrophyIcon
} from '@heroicons/react/24/outline';
import { useAuth } from '../contexts/AuthContext';
import toast from 'react-hot-toast';

const stats = [
  {
    name: 'Active Projects',
    value: '12',
    icon: FolderIcon,
    change: '+2',
    changeType: 'positive' as const,
    color: 'from-blue-500 to-cyan-500'
  },
  {
    name: 'Tasks Completed',
    value: '89',
    icon: CheckCircleIcon,
    change: '+12',
    changeType: 'positive' as const,
    color: 'from-green-500 to-emerald-500'
  },
  {
    name: 'Team Members',
    value: '24',
    icon: UserGroupIcon,
    change: '+3',
    changeType: 'positive' as const,
    color: 'from-purple-500 to-pink-500'
  },
  {
    name: 'Hours Saved',
    value: '156',
    icon: ClockIcon,
    change: '+28',
    changeType: 'positive' as const,
    color: 'from-orange-500 to-red-500'
  },
];

const recentActivities = [
  {
    id: 1,
    type: 'task',
    title: 'Completed design system documentation',
    project: 'Design System',
    time: '2 hours ago',
    user: 'Alice Johnson'
  },
  {
    id: 2,
    type: 'project',
    title: 'Created new project: Mobile App Redesign',
    project: 'Mobile App Redesign',
    time: '4 hours ago',
    user: 'You'
  },
  {
    id: 3,
    type: 'discussion',
    title: 'New message in API Architecture discussion',
    project: 'Backend Development',
    time: '6 hours ago',
    user: 'Bob Smith'
  },
  {
    id: 4,
    type: 'task',
    title: 'Updated task: Database optimization',
    project: 'Backend Development',
    time: '1 day ago',
    user: 'Carol Davis'
  },
];

export const Dashboard: React.FC = () => {
  const { user } = useAuth();
  const navigate = useNavigate();

  const getTimeGreeting = () => {
    const hour = new Date().getHours();
    if (hour < 12) return 'Good morning';
    if (hour < 18) return 'Good afternoon';
    return 'Good evening';
  };

  const handleQuickAction = (action: string) => {
    switch (action) {
      case 'create-project':
        navigate('/app/projects');
        break;
      case 'add-task':
        navigate('/app/tasks');
        break;
      case 'start-discussion':
        navigate('/app/discussions');
        break;
      case 'invite-team':
        toast.success('Team invitation feature coming soon!');
        break;
      default:
        break;
    }
  };

  return (
    <div className="space-y-8">
      {/* Welcome Section */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className="bg-gradient-to-r from-blue-600 via-purple-600 to-blue-800 rounded-2xl p-8 text-white"
      >
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold mb-2">
              {getTimeGreeting()}, {user?.display_name}! 👋
            </h1>
            <p className="text-blue-100 text-lg">
              Ready to make today productive? Let's check what's happening in your workspace.
            </p>
          </div>
          <div className="hidden lg:block">
            <TrophyIcon className="w-20 h-20 text-yellow-300 opacity-80" />
          </div>
        </div>
      </motion.div>

      {/* Stats Grid */}
      <div className="grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-4">
        {stats.map((stat, index) => (
          <motion.div
            key={stat.name}
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: index * 0.1 }}
            className="bg-white rounded-xl p-6 shadow-sm border border-gray-100 hover:shadow-md transition-shadow duration-200"
          >
            <div className="flex items-center">
              <div className={`p-3 rounded-lg bg-gradient-to-r ${stat.color}`}>
                <stat.icon className="w-6 h-6 text-white" />
              </div>
              <div className="ml-4 flex-1">
                <p className="text-sm font-medium text-gray-600">{stat.name}</p>
                <div className="flex items-baseline">
                  <p className="text-2xl font-bold text-gray-900">{stat.value}</p>
                  <p className="ml-2 flex items-baseline text-sm font-semibold text-green-600">
                    {stat.change}
                  </p>
                </div>
              </div>
            </div>
          </motion.div>
        ))}
      </div>

      {/* Recent Activity & Quick Actions */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        {/* Recent Activity */}
        <motion.div
          initial={{ opacity: 0, x: -20 }}
          animate={{ opacity: 1, x: 0 }}
          transition={{ delay: 0.3 }}
          className="lg:col-span-2 bg-white rounded-xl shadow-sm border border-gray-100"
        >
          <div className="p-6 border-b border-gray-100">
            <h2 className="text-lg font-semibold text-gray-900">Recent Activity</h2>
          </div>
          <div className="p-6">
            <div className="space-y-4">
              {recentActivities.map((activity) => (
                <div key={activity.id} className="flex items-start space-x-3">
                  <div className="flex-shrink-0">
                    {activity.type === 'task' && (
                      <div className="w-8 h-8 bg-green-100 rounded-full flex items-center justify-center">
                        <CheckCircleIcon className="w-4 h-4 text-green-600" />
                      </div>
                    )}
                    {activity.type === 'project' && (
                      <div className="w-8 h-8 bg-blue-100 rounded-full flex items-center justify-center">
                        <FolderIcon className="w-4 h-4 text-blue-600" />
                      </div>
                    )}
                    {activity.type === 'discussion' && (
                      <div className="w-8 h-8 bg-purple-100 rounded-full flex items-center justify-center">
                        <ChatBubbleLeftRightIcon className="w-4 h-4 text-purple-600" />
                      </div>
                    )}
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-medium text-gray-900">{activity.title}</p>
                    <div className="flex items-center space-x-2 text-xs text-gray-500">
                      <span>{activity.project}</span>
                      <span>•</span>
                      <span>{activity.user}</span>
                      <span>•</span>
                      <span>{activity.time}</span>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </motion.div>

        {/* Quick Actions */}
        <motion.div
          initial={{ opacity: 0, x: 20 }}
          animate={{ opacity: 1, x: 0 }}
          transition={{ delay: 0.4 }}
          className="bg-white rounded-xl shadow-sm border border-gray-100"
        >
          <div className="p-6 border-b border-gray-100">
            <h2 className="text-lg font-semibold text-gray-900">Quick Actions</h2>
          </div>
          <div className="p-6 space-y-4">
            <button 
              onClick={() => handleQuickAction('create-project')}
              className="w-full flex items-center space-x-3 p-3 rounded-lg border border-gray-200 hover:bg-gray-50 transition-colors duration-200"
            >
              <FolderIcon className="w-5 h-5 text-blue-600" />
              <span className="text-sm font-medium text-gray-700">Create Project</span>
            </button>
            <button 
              onClick={() => handleQuickAction('add-task')}
              className="w-full flex items-center space-x-3 p-3 rounded-lg border border-gray-200 hover:bg-gray-50 transition-colors duration-200"
            >
              <CheckCircleIcon className="w-5 h-5 text-green-600" />
              <span className="text-sm font-medium text-gray-700">Add Task</span>
            </button>
            <button 
              onClick={() => handleQuickAction('start-discussion')}
              className="w-full flex items-center space-x-3 p-3 rounded-lg border border-gray-200 hover:bg-gray-50 transition-colors duration-200"
            >
              <ChatBubbleLeftRightIcon className="w-5 h-5 text-purple-600" />
              <span className="text-sm font-medium text-gray-700">Start Discussion</span>
            </button>
            <button 
              onClick={() => handleQuickAction('invite-team')}
              className="w-full flex items-center space-x-3 p-3 rounded-lg border border-gray-200 hover:bg-gray-50 transition-colors duration-200"
            >
              <UserGroupIcon className="w-5 h-5 text-orange-600" />
              <span className="text-sm font-medium text-gray-700">Invite Team</span>
            </button>
          </div>
        </motion.div>
      </div>
    </div>
  );
};
