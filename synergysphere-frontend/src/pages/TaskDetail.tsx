import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';
import { 
  ChevronLeftIcon,
  PencilIcon,
  TrashIcon,
  CalendarIcon,
  ClockIcon,
  UserIcon,
  TagIcon,
  CheckIcon,
  XMarkIcon,
  ChatBubbleLeftRightIcon
} from '@heroicons/react/24/outline';
import { useForm } from 'react-hook-form';
import { yupResolver } from '@hookform/resolvers/yup';
import * as yup from 'yup';
import { apiService } from '../services/api';
import { Task, User, ProjectMembership } from '../types';
import toast from 'react-hot-toast';

const taskSchema = yup.object({
  title: yup.string().required('Task title is required'),
  description: yup.string().required('Description is required'),
  assignee: yup.string().optional(),
  due_date: yup.string().nullable().optional(),
  status: yup.string().required('Status is required'),
});

interface TaskFormData {
  title: string;
  description: string;
  assignee?: string;
  due_date?: string | null;
  status: string;
}

const statusColors = {
  todo: 'bg-gray-100 text-gray-800',
  in_progress: 'bg-blue-100 text-blue-800',
  done: 'bg-green-100 text-green-800',
  cancelled: 'bg-red-100 text-red-800',
};

const statusOptions = [
  { value: 'todo', label: 'To Do', color: 'bg-gray-500' },
  { value: 'in_progress', label: 'In Progress', color: 'bg-blue-500' },
  { value: 'done', label: 'Done', color: 'bg-green-500' },
  { value: 'cancelled', label: 'Cancelled', color: 'bg-red-500' },
];

export const TaskDetail: React.FC = () => {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const [task, setTask] = useState<Task | null>(null);
  const [projectMembers, setProjectMembers] = useState<ProjectMembership[]>([]);
  const [loading, setLoading] = useState(true);
  const [isEditing, setIsEditing] = useState(false);

  const {
    register,
    handleSubmit,
    formState: { errors },
    reset,
    setValue,
  } = useForm<TaskFormData>({
    resolver: yupResolver(taskSchema) as any,
  });

  useEffect(() => {
    if (id) {
      fetchTask();
    }
  }, [id]);

  const fetchTask = async () => {
    try {
      if (!id) return;
      const taskData = await apiService.getTask(id);
      setTask(taskData);
      
      // Set form values
      setValue('title', taskData.title);
      setValue('description', taskData.description);
      setValue('assignee', taskData.assignee?.id || '');
      setValue('due_date', taskData.due_date || '');
      setValue('status', taskData.status);

      // Fetch project members if we have a project
      if (taskData.project) {
        fetchProjectMembers(taskData.project);
      }
    } catch (error) {
      console.error('Error fetching task:', error);
      toast.error('Failed to load task details');
    } finally {
      setLoading(false);
    }
  };

  const fetchProjectMembers = async (projectId: string) => {
    try {
      const membersData = await apiService.getProjectMembers(projectId);
      setProjectMembers(membersData);
    } catch (error) {
      console.error('Error fetching project members:', error);
    }
  };

  const handleUpdateTask = async (data: TaskFormData) => {
    try {
      if (!id || !task) return;
      
      const updatedTask = await apiService.updateTask(id, {
        title: data.title,
        description: data.description,
        status: data.status as 'todo' | 'in_progress' | 'done',
        assignee_id: data.assignee || null, // Use assignee_id instead of assignee
        due_date: data.due_date || null,
      });
      
      setTask(updatedTask);
      setIsEditing(false);
      toast.success('Task updated successfully!');
    } catch (error) {
      console.error('Error updating task:', error);
      toast.error('Failed to update task');
    }
  };

  const handleDeleteTask = async () => {
    if (!id || !task) return;
    
    if (window.confirm('Are you sure you want to delete this task?')) {
      try {
        await apiService.deleteTask(id);
        toast.success('Task deleted successfully!');
        navigate('/app/tasks');
      } catch (error) {
        console.error('Error deleting task:', error);
        toast.error('Failed to delete task');
      }
    }
  };

  const handleStatusUpdate = async (newStatus: 'todo' | 'in_progress' | 'done') => {
    try {
      if (!id || !task) return;
      
      const updatedTask = await apiService.updateTask(id, { status: newStatus });
      setTask(updatedTask);
      setValue('status', newStatus);
      toast.success('Task status updated!');
    } catch (error) {
      console.error('Error updating task status:', error);
      toast.error('Failed to update task status');
    }
  };

  const formatDate = (dateString: string) => {
    try {
      return new Date(dateString).toLocaleDateString();
    } catch {
      return 'Invalid date';
    }
  };

  const formatDateTime = (dateString: string) => {
    try {
      return new Date(dateString).toLocaleString();
    } catch {
      return 'Invalid date';
    }
  };

  if (loading) {
    return (
      <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="animate-pulse space-y-6">
          <div className="h-8 bg-gray-200 rounded w-1/4"></div>
          <div className="h-64 bg-gray-200 rounded"></div>
          <div className="h-48 bg-gray-200 rounded"></div>
        </div>
      </div>
    );
  }

  if (!task) {
    return (
      <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="text-center">
          <h1 className="text-2xl font-bold text-gray-900 mb-4">Task not found</h1>
          <button
            onClick={() => navigate('/app/tasks')}
            className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
          >
            Back to Tasks
          </button>
        </div>
      </div>
    );
  }

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-8"
    >
      {/* Header */}
      <div className="flex items-center justify-between mb-8">
        <div className="flex items-center gap-4">
          <button
            onClick={() => navigate(-1)}
            className="p-2 hover:bg-gray-100 rounded-lg transition-colors"
          >
            <ChevronLeftIcon className="h-5 w-5 text-gray-600" />
          </button>
          <div>
            <h1 className="text-3xl font-bold text-gray-900">{task.title}</h1>
            <p className="text-gray-600 mt-1">Task Details</p>
          </div>
        </div>
        
        <div className="flex gap-3">
          {!isEditing ? (
            <button
              onClick={() => setIsEditing(true)}
              className="flex items-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
            >
              <PencilIcon className="h-4 w-4" />
              Edit Task
            </button>
          ) : (
            <button
              onClick={() => {
                setIsEditing(false);
                reset();
              }}
              className="flex items-center gap-2 px-4 py-2 bg-gray-100 text-gray-700 rounded-lg hover:bg-gray-200 transition-colors"
            >
              <XMarkIcon className="h-4 w-4" />
              Cancel
            </button>
          )}
          
          <button
            onClick={handleDeleteTask}
            className="flex items-center gap-2 px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 transition-colors"
          >
            <TrashIcon className="h-4 w-4" />
            Delete
          </button>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        {/* Main Content */}
        <div className="lg:col-span-2 space-y-6">
          {!isEditing ? (
            <>
              {/* Task Info */}
              <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-6">
                <div className="flex items-center justify-between mb-6">
                  <h2 className="text-xl font-semibold text-gray-900">Task Information</h2>
                  <span className={`px-3 py-1 text-sm font-medium rounded-full ${statusColors[task.status]}`}>
                    {task.status.replace('_', ' ').toUpperCase()}
                  </span>
                </div>

                <div className="space-y-4">
                  <div>
                    <h3 className="text-sm font-medium text-gray-700 mb-2">Description</h3>
                    <p className="text-gray-900 bg-gray-50 p-4 rounded-lg">
                      {task.description}
                    </p>
                  </div>
                </div>
              </div>

              {/* Status Quick Actions */}
              <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-6">
                <h2 className="text-xl font-semibold text-gray-900 mb-4">Quick Actions</h2>
                <div className="flex flex-wrap gap-2">
                  {statusOptions.map((status) => (
                    <button
                      key={status.value}
                      onClick={() => handleStatusUpdate(status.value as 'todo' | 'in_progress' | 'done')}
                      className={`px-4 py-2 text-sm rounded-lg transition-colors ${
                        task.status === status.value
                          ? 'bg-blue-600 text-white'
                          : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                      }`}
                    >
                      {status.label}
                    </button>
                  ))}
                </div>
              </div>
            </>
          ) : (
            /* Edit Form */
            <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-6">
              <h2 className="text-xl font-semibold text-gray-900 mb-6">Edit Task</h2>
              
              <form onSubmit={handleSubmit(handleUpdateTask as any)} className="space-y-6">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">Title</label>
                  <input
                    type="text"
                    {...register('title')}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  />
                  {errors.title && (
                    <p className="text-red-500 text-sm mt-1">{errors.title.message}</p>
                  )}
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">Description</label>
                  <textarea
                    {...register('description')}
                    rows={4}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  />
                  {errors.description && (
                    <p className="text-red-500 text-sm mt-1">{errors.description.message}</p>
                  )}
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">Status</label>
                    <select
                      {...register('status')}
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                    >
                      {statusOptions.map((status) => (
                        <option key={status.value} value={status.value}>
                          {status.label}
                        </option>
                      ))}
                    </select>
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">Assignee</label>
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
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">Due Date</label>
                  <input
                    type="date"
                    {...register('due_date')}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  />
                </div>

                <div className="flex gap-3 pt-4">
                  <button
                    type="submit"
                    className="flex items-center gap-2 px-6 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
                  >
                    <CheckIcon className="h-4 w-4" />
                    Save Changes
                  </button>
                  <button
                    type="button"
                    onClick={() => {
                      setIsEditing(false);
                      reset();
                    }}
                    className="px-6 py-2 bg-gray-100 text-gray-700 rounded-lg hover:bg-gray-200 transition-colors"
                  >
                    Cancel
                  </button>
                </div>
              </form>
            </div>
          )}
        </div>

        {/* Sidebar */}
        <div className="space-y-6">
          {/* Task Details */}
          <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-6">
            <h3 className="text-lg font-semibold text-gray-900 mb-4">Task Details</h3>
            
            <div className="space-y-4">
              <div className="flex items-center gap-3">
                <TagIcon className="h-5 w-5 text-gray-400" />
                <div>
                  <p className="text-sm text-gray-600">Status</p>
                  <span className={`inline-block px-2 py-1 text-xs font-medium rounded-full ${statusColors[task.status]}`}>
                    {task.status.replace('_', ' ').toUpperCase()}
                  </span>
                </div>
              </div>

              <div className="flex items-center gap-3">
                <UserIcon className="h-5 w-5 text-gray-400" />
                <div>
                  <p className="text-sm text-gray-600">Assignee</p>
                  <p className="text-sm font-medium text-gray-900">
                    {task.assignee 
                      ? (task.assignee.display_name || task.assignee.username)
                      : 'Unassigned'
                    }
                  </p>
                </div>
              </div>

              {task.due_date && (
                <div className="flex items-center gap-3">
                  <CalendarIcon className="h-5 w-5 text-gray-400" />
                  <div>
                    <p className="text-sm text-gray-600">Due Date</p>
                    <p className="text-sm font-medium text-gray-900">
                      {formatDate(task.due_date)}
                    </p>
                  </div>
                </div>
              )}

              <div className="flex items-center gap-3">
                <ClockIcon className="h-5 w-5 text-gray-400" />
                <div>
                  <p className="text-sm text-gray-600">Created</p>
                  <p className="text-sm font-medium text-gray-900">
                    {formatDateTime(task.created_at)}
                  </p>
                </div>
              </div>

              <div className="flex items-center gap-3">
                <ClockIcon className="h-5 w-5 text-gray-400" />
                <div>
                  <p className="text-sm text-gray-600">Last Updated</p>
                  <p className="text-sm font-medium text-gray-900">
                    {formatDateTime(task.updated_at)}
                  </p>
                </div>
              </div>

              {task.created_by && (
                <div className="flex items-center gap-3">
                  <UserIcon className="h-5 w-5 text-gray-400" />
                  <div>
                    <p className="text-sm text-gray-600">Created By</p>
                    <p className="text-sm font-medium text-gray-900">
                      {task.created_by.display_name || task.created_by.username}
                    </p>
                  </div>
                </div>
              )}
            </div>
          </div>

          {/* Project Info */}
          {task.project_name && (
            <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-6">
              <h3 className="text-lg font-semibold text-gray-900 mb-4">Project</h3>
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 bg-blue-100 rounded-lg flex items-center justify-center">
                  <UserIcon className="h-5 w-5 text-blue-600" />
                </div>
                <div>
                  <p className="font-medium text-gray-900">{task.project_name}</p>
                  <button
                    onClick={() => navigate(`/app/projects/${task.project}`)}
                    className="text-sm text-blue-600 hover:text-blue-800"
                  >
                    View Project
                  </button>
                </div>
              </div>
            </div>
          )}

          {/* Quick Actions */}
          <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-6">
            <h3 className="text-lg font-semibold text-gray-900 mb-4">Actions</h3>
            <div className="space-y-3">
              <button
                onClick={() => setIsEditing(true)}
                className="w-full flex items-center gap-3 p-3 text-left border border-gray-200 rounded-lg hover:bg-gray-50 transition-colors"
              >
                <PencilIcon className="h-5 w-5 text-gray-400" />
                <span className="text-sm font-medium text-gray-900">Edit Task</span>
              </button>

              <button className="w-full flex items-center gap-3 p-3 text-left border border-gray-200 rounded-lg hover:bg-gray-50 transition-colors">
                <ChatBubbleLeftRightIcon className="h-5 w-5 text-gray-400" />
                <span className="text-sm font-medium text-gray-900">Add Comment</span>
              </button>

              <button
                onClick={handleDeleteTask}
                className="w-full flex items-center gap-3 p-3 text-left border border-red-200 rounded-lg hover:bg-red-50 transition-colors text-red-600"
              >
                <TrashIcon className="h-5 w-5" />
                <span className="text-sm font-medium">Delete Task</span>
              </button>
            </div>
          </div>
        </div>
      </div>
    </motion.div>
  );
};
