import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';
import { 
  PlusIcon, 
  ChevronLeftIcon,
  UserGroupIcon,
  CalendarIcon,
  CheckCircleIcon,
  ClockIcon,
  ExclamationTriangleIcon,
  ChatBubbleLeftRightIcon,
  PencilIcon,
  TrashIcon
} from '@heroicons/react/24/outline';
import { useForm } from 'react-hook-form';
import { yupResolver } from '@hookform/resolvers/yup';
import * as yup from 'yup';
import { apiService } from '../services/api';
import { Project, Task, User, ProjectMembership } from '../types';
import toast from 'react-hot-toast';

const taskSchema = yup.object({
  title: yup.string().required('Task title is required'),
  description: yup.string().required('Description is required'),
  assignee: yup.string().optional().nullable(),
  due_date: yup.string().optional().nullable(),
});

interface TaskFormData {
  title: string;
  description: string;
  assignee?: string | null;
  due_date?: string | null;
}

const statusColors = {
  todo: 'bg-gray-100 text-gray-800',
  in_progress: 'bg-blue-100 text-blue-800',
  done: 'bg-green-100 text-green-800',
  cancelled: 'bg-red-100 text-red-800',
};

export const ProjectDetail: React.FC = () => {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const [project, setProject] = useState<Project | null>(null);
  const [tasks, setTasks] = useState<Task[]>([]);
  const [projectMembers, setProjectMembers] = useState<ProjectMembership[]>([]);
  const [loading, setLoading] = useState(true);
  const [isCreateTaskModalOpen, setIsCreateTaskModalOpen] = useState(false);
  const [selectedTask, setSelectedTask] = useState<Task | null>(null);
  const [isTaskDetailModalOpen, setIsTaskDetailModalOpen] = useState(false);

  const {
    register,
    handleSubmit,
    formState: { errors },
    reset,
  } = useForm<TaskFormData>({
    resolver: yupResolver(taskSchema) as any, // Type assertion to fix resolver type mismatch
  });

  useEffect(() => {
    if (id) {
      fetchProject();
      fetchProjectTasks();
      fetchProjectMembers();
    }
  }, [id]);

  const fetchProject = async () => {
    try {
      if (!id) return;
      const projectData = await apiService.getProject(id);
      setProject(projectData);
    } catch (error) {
      console.error('Error fetching project:', error);
      toast.error('Failed to load project details');
    }
  };

  const fetchProjectTasks = async () => {
    try {
      if (!id) return;
      const tasksData = await apiService.getTasks({ project: id });
      setTasks(tasksData);
    } catch (error) {
      console.error('Error fetching project tasks:', error);
      toast.error('Failed to load project tasks');
    } finally {
      setLoading(false);
    }
  };

  const fetchProjectMembers = async () => {
    try {
      if (!id) return;
      const membersData = await apiService.getProjectMembers(id);
      setProjectMembers(membersData);
    } catch (error) {
      console.error('Error fetching project members:', error);
      // Don't show error toast for members as it might not be critical
    }
  };

  const handleCreateTask = async (data: TaskFormData) => {
    try {
      if (!id) return;
      
      const taskData = {
        title: data.title,
        description: data.description,
        project: id,
        status: 'todo' as const,
        assignee_id: data.assignee || null, // Use assignee_id instead of assignee
        due_date: data.due_date || null,
      };

      const newTask = await apiService.createTask(taskData);
      setTasks(prev => [newTask, ...prev]);
      setIsCreateTaskModalOpen(false);
      reset();
      toast.success('Task created successfully!');
    } catch (error) {
      console.error('Error creating task:', error);
      toast.error('Failed to create task');
    }
  };

  const handleTaskClick = (task: Task) => {
    setSelectedTask(task);
    setIsTaskDetailModalOpen(true);
  };

  const updateTaskStatus = async (taskId: string, newStatus: 'todo' | 'in_progress' | 'done') => {
    try {
      const updatedTask = await apiService.updateTask(taskId, { status: newStatus });
      setTasks(prev => prev.map(task => task.id === taskId ? updatedTask : task));
      
      // Update selectedTask if it's the same task
      if (selectedTask && selectedTask.id === taskId) {
        setSelectedTask(updatedTask);
      }
      
      toast.success('Task status updated!');
    } catch (error) {
      console.error('Error updating task status:', error);
      toast.error('Failed to update task status');
    }
  };

  const deleteTask = async (taskId: string) => {
    if (!window.confirm('Are you sure you want to delete this task?')) return;
    
    try {
      await apiService.deleteTask(taskId);
      setTasks(prev => prev.filter(task => task.id !== taskId));
      
      // Close modal if the deleted task was selected
      if (selectedTask && selectedTask.id === taskId) {
        setIsTaskDetailModalOpen(false);
        setSelectedTask(null);
      }
      
      toast.success('Task deleted successfully!');
    } catch (error) {
      console.error('Error deleting task:', error);
      toast.error('Failed to delete task');
    }
  };

  const getTasksByStatus = (status: string) => {
    return tasks.filter(task => task.status === status);
  };

  if (loading) {
    return (
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="animate-pulse space-y-6">
          <div className="h-8 bg-gray-200 rounded w-1/4"></div>
          <div className="h-64 bg-gray-200 rounded"></div>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            {[...Array(6)].map((_, i) => (
              <div key={i} className="h-48 bg-gray-200 rounded"></div>
            ))}
          </div>
        </div>
      </div>
    );
  }

  if (!project) {
    return (
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="text-center">
          <h1 className="text-2xl font-bold text-gray-900 mb-4">Project not found</h1>
          <button
            onClick={() => navigate('/app/projects')}
            className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
          >
            Back to Projects
          </button>
        </div>
      </div>
    );
  }

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8"
    >
      {/* Header */}
      <div className="flex items-center justify-between mb-8">
        <div className="flex items-center gap-4">
          <button
            onClick={() => navigate('/app/projects')}
            className="p-2 hover:bg-gray-100 rounded-lg transition-colors"
          >
            <ChevronLeftIcon className="h-5 w-5 text-gray-600" />
          </button>
          <div>
            <h1 className="text-3xl font-bold text-gray-900">{project.name}</h1>
            <p className="text-gray-600 mt-1">{project.description}</p>
          </div>
        </div>
        <button
          onClick={() => setIsCreateTaskModalOpen(true)}
          className="flex items-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
        >
          <PlusIcon className="h-5 w-5" />
          New Task
        </button>
      </div>

      {/* Project Stats */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-8">
        <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-6">
          <div className="flex items-center gap-3">
            <div className="p-2 bg-blue-100 rounded-lg">
              <CheckCircleIcon className="h-6 w-6 text-blue-600" />
            </div>
            <div>
              <p className="text-sm text-gray-600">Total Tasks</p>
              <p className="text-2xl font-semibold text-gray-900">{tasks.length}</p>
            </div>
          </div>
        </div>

        <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-6">
          <div className="flex items-center gap-3">
            <div className="p-2 bg-green-100 rounded-lg">
              <CheckCircleIcon className="h-6 w-6 text-green-600" />
            </div>
            <div>
              <p className="text-sm text-gray-600">Completed</p>
              <p className="text-2xl font-semibold text-gray-900">{getTasksByStatus('done').length}</p>
            </div>
          </div>
        </div>

        <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-6">
          <div className="flex items-center gap-3">
            <div className="p-2 bg-yellow-100 rounded-lg">
              <ClockIcon className="h-6 w-6 text-yellow-600" />
            </div>
            <div>
              <p className="text-sm text-gray-600">In Progress</p>
              <p className="text-2xl font-semibold text-gray-900">{getTasksByStatus('in_progress').length}</p>
            </div>
          </div>
        </div>

        <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-6">
          <div className="flex items-center gap-3">
            <div className="p-2 bg-purple-100 rounded-lg">
              <UserGroupIcon className="h-6 w-6 text-purple-600" />
            </div>
            <div>
              <p className="text-sm text-gray-600">Team Members</p>
              <p className="text-2xl font-semibold text-gray-900">{project.member_count}</p>
            </div>
          </div>
        </div>
      </div>

      {/* Task Board */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* To Do Column */}
        <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-6">
          <h3 className="text-lg font-semibold text-gray-900 mb-4 flex items-center gap-2">
            <div className="w-3 h-3 bg-gray-400 rounded-full"></div>
            To Do ({getTasksByStatus('todo').length})
          </h3>
          <div className="space-y-3">
            {getTasksByStatus('todo').map((task) => (
              <motion.div
                key={task.id}
                initial={{ opacity: 0, scale: 0.9 }}
                animate={{ opacity: 1, scale: 1 }}
                whileHover={{ scale: 1.02 }}
                onClick={() => handleTaskClick(task)}
                className="p-4 border border-gray-200 rounded-lg hover:shadow-md transition-all cursor-pointer"
              >
                <h4 className="font-medium text-gray-900 mb-2">{task.title}</h4>
                <p className="text-sm text-gray-600 mb-3 line-clamp-2">{task.description}</p>
                
                <div className="flex items-center justify-between text-xs text-gray-500">
                  <div className="flex items-center gap-2">
                    {task.assignee && (
                      <span className="bg-gray-100 px-2 py-1 rounded">
                        {task.assignee.display_name || task.assignee.username}
                      </span>
                    )}
                  </div>
                  {task.due_date && (
                    <div className="flex items-center gap-1">
                      <CalendarIcon className="h-3 w-3" />
                      <span>{new Date(task.due_date).toLocaleDateString()}</span>
                    </div>
                  )}
                </div>
              </motion.div>
            ))}
          </div>
        </div>

        {/* In Progress Column */}
        <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-6">
          <h3 className="text-lg font-semibold text-gray-900 mb-4 flex items-center gap-2">
            <div className="w-3 h-3 bg-blue-400 rounded-full"></div>
            In Progress ({getTasksByStatus('in_progress').length})
          </h3>
          <div className="space-y-3">
            {getTasksByStatus('in_progress').map((task) => (
              <motion.div
                key={task.id}
                initial={{ opacity: 0, scale: 0.9 }}
                animate={{ opacity: 1, scale: 1 }}
                whileHover={{ scale: 1.02 }}
                onClick={() => handleTaskClick(task)}
                className="p-4 border border-blue-200 bg-blue-50 rounded-lg hover:shadow-md transition-all cursor-pointer"
              >
                <h4 className="font-medium text-gray-900 mb-2">{task.title}</h4>
                <p className="text-sm text-gray-600 mb-3 line-clamp-2">{task.description}</p>
                
                <div className="flex items-center justify-between text-xs text-gray-500">
                  <div className="flex items-center gap-2">
                    {task.assignee && (
                      <span className="bg-white px-2 py-1 rounded">
                        {task.assignee.display_name || task.assignee.username}
                      </span>
                    )}
                  </div>
                  {task.due_date && (
                    <div className="flex items-center gap-1">
                      <CalendarIcon className="h-3 w-3" />
                      <span>{new Date(task.due_date).toLocaleDateString()}</span>
                    </div>
                  )}
                </div>
              </motion.div>
            ))}
          </div>
        </div>

        {/* Done Column */}
        <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-6">
          <h3 className="text-lg font-semibold text-gray-900 mb-4 flex items-center gap-2">
            <div className="w-3 h-3 bg-green-400 rounded-full"></div>
            Done ({getTasksByStatus('done').length})
          </h3>
          <div className="space-y-3">
            {getTasksByStatus('done').map((task) => (
              <motion.div
                key={task.id}
                initial={{ opacity: 0, scale: 0.9 }}
                animate={{ opacity: 1, scale: 1 }}
                whileHover={{ scale: 1.02 }}
                onClick={() => handleTaskClick(task)}
                className="p-4 border border-green-200 bg-green-50 rounded-lg hover:shadow-md transition-all cursor-pointer"
              >
                <h4 className="font-medium text-gray-900 mb-2">{task.title}</h4>
                <p className="text-sm text-gray-600 mb-3 line-clamp-2">{task.description}</p>
                
                <div className="flex items-center justify-between text-xs text-gray-500">
                  <div className="flex items-center gap-2">
                    {task.assignee && (
                      <span className="bg-white px-2 py-1 rounded">
                        {task.assignee.display_name || task.assignee.username}
                      </span>
                    )}
                  </div>
                  {task.due_date && (
                    <div className="flex items-center gap-1">
                      <CalendarIcon className="h-3 w-3" />
                      <span>{new Date(task.due_date).toLocaleDateString()}</span>
                    </div>
                  )}
                </div>
              </motion.div>
            ))}
          </div>
        </div>
      </div>

      {/* Create Task Modal */}
      {isCreateTaskModalOpen && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <motion.div
            initial={{ opacity: 0, scale: 0.9 }}
            animate={{ opacity: 1, scale: 1 }}
            className="bg-white rounded-xl shadow-xl max-w-md w-full mx-4"
          >
            <div className="p-6">
              <h2 className="text-xl font-semibold text-gray-900 mb-4">Create New Task</h2>
              
              <form onSubmit={handleSubmit(handleCreateTask as any)} className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Task Title
                  </label>
                  <input
                    type="text"
                    {...register('title')}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                    placeholder="Enter task title"
                  />
                  {errors.title && (
                    <p className="text-red-500 text-sm mt-1">{errors.title.message}</p>
                  )}
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Description
                  </label>
                  <textarea
                    {...register('description')}
                    rows={3}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                    placeholder="Enter task description"
                  />
                  {errors.description && (
                    <p className="text-red-500 text-sm mt-1">{errors.description.message}</p>
                  )}
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Assignee (Optional)
                  </label>
                  <select
                    {...register('assignee')}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  >
                    <option value="">Unassigned</option>
                    {projectMembers.map((membership) => (
                      <option key={membership.user.id} value={membership.user.id}>
                        {membership.user.display_name || membership.user.username}
                      </option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Due Date (Optional)
                  </label>
                  <input
                    type="date"
                    {...register('due_date')}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  />
                </div>

                <div className="flex gap-3 pt-4">
                  <button
                    type="button"
                    onClick={() => {
                      setIsCreateTaskModalOpen(false);
                      reset();
                    }}
                    className="flex-1 px-4 py-2 text-gray-700 bg-gray-100 rounded-lg hover:bg-gray-200 transition-colors"
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    className="flex-1 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
                  >
                    Create Task
                  </button>
                </div>
              </form>
            </div>
          </motion.div>
        </div>
      )}

      {/* Task Detail Modal */}
      {isTaskDetailModalOpen && selectedTask && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <motion.div
            initial={{ opacity: 0, scale: 0.9 }}
            animate={{ opacity: 1, scale: 1 }}
            className="bg-white rounded-xl shadow-xl max-w-2xl w-full mx-4 max-h-[90vh] overflow-y-auto"
          >
            <div className="p-6">
              <div className="flex items-start justify-between mb-6">
                <div className="flex-1">
                  <h2 className="text-2xl font-semibold text-gray-900 mb-2">{selectedTask.title}</h2>
                  <span className={`inline-block px-2 py-1 text-xs font-medium rounded-full ${statusColors[selectedTask.status]}`}>
                    {selectedTask.status.replace('_', ' ').toUpperCase()}
                  </span>
                </div>
                <button
                  onClick={() => setIsTaskDetailModalOpen(false)}
                  className="p-2 hover:bg-gray-100 rounded-lg transition-colors"
                >
                  ×
                </button>
              </div>

              <div className="space-y-6">
                <div>
                  <h3 className="text-sm font-medium text-gray-700 mb-2">Description</h3>
                  <p className="text-gray-900 bg-gray-50 p-3 rounded-lg">{selectedTask.description}</p>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <div>
                    <h3 className="text-sm font-medium text-gray-700 mb-2">Assignee</h3>
                    <p className="text-gray-900">
                      {selectedTask.assignee 
                        ? (selectedTask.assignee.display_name || selectedTask.assignee.username)
                        : 'Unassigned'
                      }
                    </p>
                  </div>

                  <div>
                    <h3 className="text-sm font-medium text-gray-700 mb-2">Due Date</h3>
                    <p className="text-gray-900">
                      {selectedTask.due_date 
                        ? new Date(selectedTask.due_date).toLocaleDateString()
                        : 'No due date'
                      }
                    </p>
                  </div>

                  <div>
                    <h3 className="text-sm font-medium text-gray-700 mb-2">Created</h3>
                    <p className="text-gray-900">
                      {new Date(selectedTask.created_at).toLocaleDateString()}
                    </p>
                  </div>

                  <div>
                    <h3 className="text-sm font-medium text-gray-700 mb-2">Last Updated</h3>
                    <p className="text-gray-900">
                      {new Date(selectedTask.updated_at).toLocaleDateString()}
                    </p>
                  </div>
                </div>

                <div>
                  <h3 className="text-sm font-medium text-gray-700 mb-3">Status</h3>
                  <div className="flex gap-2">
                    {['todo', 'in_progress', 'done'].map((status) => (
                      <button
                        key={status}
                        onClick={() => updateTaskStatus(selectedTask.id, status as 'todo' | 'in_progress' | 'done')}
                        className={`px-3 py-2 text-sm rounded-lg transition-colors ${
                          selectedTask.status === status
                            ? 'bg-blue-600 text-white'
                            : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                        }`}
                      >
                        {status.replace('_', ' ').toUpperCase()}
                      </button>
                    ))}
                  </div>
                </div>

                <div className="flex gap-3 pt-4 border-t border-gray-200">
                  <button
                    onClick={() => setIsTaskDetailModalOpen(false)}
                    className="flex-1 px-4 py-2 text-gray-700 bg-gray-100 rounded-lg hover:bg-gray-200 transition-colors"
                  >
                    Close
                  </button>
                  <button
                    onClick={() => deleteTask(selectedTask.id)}
                    className="px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 transition-colors flex items-center gap-2"
                  >
                    <TrashIcon className="h-4 w-4" />
                    Delete
                  </button>
                </div>
              </div>
            </div>
          </motion.div>
        </div>
      )}
    </motion.div>
  );
};
