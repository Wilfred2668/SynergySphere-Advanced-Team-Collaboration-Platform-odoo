import React, { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { motion } from "framer-motion";
import {
  FolderIcon,
  CheckCircleIcon,
  ChatBubbleLeftRightIcon,
  ClockIcon,
  UserGroupIcon,
  TrophyIcon,
} from "@heroicons/react/24/outline";
import { useAuth } from "../contexts/AuthContext";
import { apiService } from "../services/api";
import { Project, Task, DiscussionThread, Notification } from "../types";
import toast from "react-hot-toast";

export const Dashboard: React.FC = () => {
  const { user } = useAuth();
  const navigate = useNavigate();
  const [stats, setStats] = useState({
    projects: 0,
    completedTasks: 0,
    totalTasks: 0,
    discussions: 0,
  });
  const [recentActivities, setRecentActivities] = useState<any[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    const fetchDashboardData = async () => {
      try {
        const [projects, tasks, discussions] = await Promise.all([
          apiService.getProjects(),
          apiService.getTasks(),
          apiService.getDiscussionThreads(),
        ]);

        // Calculate stats
        const completedTasks = tasks.filter(
          (task) => task.status === "completed"
        ).length;

        setStats({
          projects: projects.length,
          completedTasks,
          totalTasks: tasks.length,
          discussions: discussions.length,
        });

        // Create recent activities from tasks and projects
        const activities = [
          ...tasks.slice(0, 3).map((task) => ({
            id: task.id,
            type: "task",
            title: task.title,
            project: task.project_name || "Unknown Project",
            time: formatTimeAgo(task.updated_at),
            user:
              task.assignee?.full_name ||
              `${task.assignee?.first_name} ${task.assignee?.last_name}` ||
              task.assignee?.username ||
              "Unknown User",
          })),
          ...projects.slice(0, 2).map((project) => ({
            id: project.id,
            type: "project",
            title: `Project: ${project.name}`,
            project: project.name,
            time: formatTimeAgo(project.updated_at),
            user:
              project.owner?.full_name ||
              `${project.owner?.first_name} ${project.owner?.last_name}` ||
              project.owner?.username ||
              "Unknown User",
          })),
        ];

        setRecentActivities(activities.slice(0, 4));
      } catch (error) {
        console.error("Error fetching dashboard data:", error);
        toast.error("Failed to load dashboard data");
      } finally {
        setIsLoading(false);
      }
    };

    fetchDashboardData();
  }, []);

  // Quick Actions handlers
  const handleCreateProject = () => {
    navigate("/app/projects");
  };

  const handleAddTask = () => {
    navigate("/app/tasks");
  };

  const handleStartDiscussion = () => {
    navigate("/app/discussions");
  };

  const handleInviteTeam = () => {
    toast("Invite team functionality coming soon!");
  };

  const handleActivityClick = (activity: any) => {
    if (activity.type === "task") {
      navigate("/app/tasks");
    } else if (activity.type === "project") {
      navigate(`/app/projects/${activity.id}`);
    } else if (activity.type === "discussion") {
      navigate("/app/discussions");
    }
  };

  const formatTimeAgo = (dateString: string) => {
    const date = new Date(dateString);
    const now = new Date();
    const diffMs = now.getTime() - date.getTime();
    const diffHours = Math.floor(diffMs / (1000 * 60 * 60));
    const diffDays = Math.floor(diffHours / 24);

    if (diffDays > 0) {
      return `${diffDays} day${diffDays > 1 ? "s" : ""} ago`;
    } else if (diffHours > 0) {
      return `${diffHours} hour${diffHours > 1 ? "s" : ""} ago`;
    } else {
      return "Just now";
    }
  };

  const dashboardStats = [
    {
      name: "Active Projects",
      value: stats.projects.toString(),
      icon: FolderIcon,
      change: "+0",
      changeType: "neutral" as const,
      color: "from-blue-500 to-cyan-500",
    },
    {
      name: "Tasks Completed",
      value: stats.completedTasks.toString(),
      icon: CheckCircleIcon,
      change: `${stats.totalTasks - stats.completedTasks} pending`,
      changeType: "neutral" as const,
      color: "from-green-500 to-emerald-500",
    },
    {
      name: "Discussions",
      value: stats.discussions.toString(),
      icon: ChatBubbleLeftRightIcon,
      change: "+0",
      changeType: "neutral" as const,
      color: "from-purple-500 to-pink-500",
    },
    {
      name: "Total Tasks",
      value: stats.totalTasks.toString(),
      icon: ClockIcon,
      change: `${
        Math.round((stats.completedTasks / stats.totalTasks) * 100) || 0
      }% complete`,
      changeType: "neutral" as const,
      color: "from-orange-500 to-red-500",
    },
  ];

  const getTimeGreeting = () => {
    const hour = new Date().getHours();
    if (hour < 12) return "Good morning";
    if (hour < 18) return "Good afternoon";
    return "Good evening";
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
              {getTimeGreeting()},{" "}
              {user?.full_name ||
                `${user?.first_name} ${user?.last_name}` ||
                user?.username}
              ! 👋
            </h1>
            <p className="text-blue-100 text-lg">
              Ready to make today productive? Let's check what's happening in
              your workspace.
            </p>
          </div>
          <div className="hidden lg:block">
            <TrophyIcon className="w-20 h-20 text-yellow-300 opacity-80" />
          </div>
        </div>
      </motion.div>

      {/* Stats Grid */}
      {isLoading ? (
        <div className="grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-4">
          {[1, 2, 3, 4].map((i) => (
            <div
              key={i}
              className="bg-white rounded-xl p-6 shadow-sm border border-gray-100"
            >
              <div className="animate-pulse">
                <div className="flex items-center">
                  <div className="w-12 h-12 bg-gray-200 rounded-lg"></div>
                  <div className="ml-4 flex-1">
                    <div className="h-4 bg-gray-200 rounded w-24 mb-2"></div>
                    <div className="h-6 bg-gray-200 rounded w-16"></div>
                  </div>
                </div>
              </div>
            </div>
          ))}
        </div>
      ) : (
        <div className="grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-4">
          {dashboardStats.map((stat, index) => (
            <motion.div
              key={stat.name}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: index * 0.1 }}
              className="bg-white rounded-xl p-6 shadow-sm border border-gray-100 hover:shadow-md transition-shadow duration-200"
            >
              <div className="flex items-center">
                <div
                  className={`p-3 rounded-lg bg-gradient-to-r ${stat.color}`}
                >
                  <stat.icon className="w-6 h-6 text-white" />
                </div>
                <div className="ml-4 flex-1">
                  <p className="text-sm font-medium text-gray-600">
                    {stat.name}
                  </p>
                  <div className="flex items-baseline">
                    <p className="text-2xl font-bold text-gray-900">
                      {stat.value}
                    </p>
                    <p className="ml-2 flex items-baseline text-sm font-semibold text-gray-600">
                      {stat.change}
                    </p>
                  </div>
                </div>
              </div>
            </motion.div>
          ))}
        </div>
      )}

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
            <h2 className="text-lg font-semibold text-gray-900">
              Recent Activity
            </h2>
          </div>
          <div className="p-6">
            <div className="space-y-4">
              {recentActivities.map((activity) => (
                <div
                  key={activity.id}
                  className="flex items-start space-x-3 p-3 rounded-lg hover:bg-gray-50 cursor-pointer transition-colors duration-200"
                  onClick={() => handleActivityClick(activity)}
                >
                  <div className="flex-shrink-0">
                    {activity.type === "task" && (
                      <div className="w-8 h-8 bg-green-100 rounded-full flex items-center justify-center">
                        <CheckCircleIcon className="w-4 h-4 text-green-600" />
                      </div>
                    )}
                    {activity.type === "project" && (
                      <div className="w-8 h-8 bg-blue-100 rounded-full flex items-center justify-center">
                        <FolderIcon className="w-4 h-4 text-blue-600" />
                      </div>
                    )}
                    {activity.type === "discussion" && (
                      <div className="w-8 h-8 bg-purple-100 rounded-full flex items-center justify-center">
                        <ChatBubbleLeftRightIcon className="w-4 h-4 text-purple-600" />
                      </div>
                    )}
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-medium text-gray-900">
                      {activity.title}
                    </p>
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
            <h2 className="text-lg font-semibold text-gray-900">
              Quick Actions
            </h2>
          </div>
          <div className="p-6 space-y-4">
            <button
              onClick={handleCreateProject}
              className="w-full flex items-center space-x-3 p-3 rounded-lg border border-gray-200 hover:bg-gray-50 transition-colors duration-200"
            >
              <FolderIcon className="w-5 h-5 text-blue-600" />
              <span className="text-sm font-medium text-gray-700">
                Create Project
              </span>
            </button>
            <button
              onClick={handleAddTask}
              className="w-full flex items-center space-x-3 p-3 rounded-lg border border-gray-200 hover:bg-gray-50 transition-colors duration-200"
            >
              <CheckCircleIcon className="w-5 h-5 text-green-600" />
              <span className="text-sm font-medium text-gray-700">
                Add Task
              </span>
            </button>
            <button
              onClick={handleStartDiscussion}
              className="w-full flex items-center space-x-3 p-3 rounded-lg border border-gray-200 hover:bg-gray-50 transition-colors duration-200"
            >
              <ChatBubbleLeftRightIcon className="w-5 h-5 text-purple-600" />
              <span className="text-sm font-medium text-gray-700">
                Start Discussion
              </span>
            </button>
            <button
              onClick={handleInviteTeam}
              className="w-full flex items-center space-x-3 p-3 rounded-lg border border-gray-200 hover:bg-gray-50 transition-colors duration-200"
            >
              <UserGroupIcon className="w-5 h-5 text-orange-600" />
              <span className="text-sm font-medium text-gray-700">
                Invite Team
              </span>
            </button>
          </div>
        </motion.div>
      </div>
    </div>
  );
};
