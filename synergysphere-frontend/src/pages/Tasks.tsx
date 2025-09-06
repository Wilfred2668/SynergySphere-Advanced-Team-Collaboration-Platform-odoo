import React, { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { useNavigate } from 'react-router-dom';
import { PlusIcon, CheckCircleIcon, ClockIcon, ExclamationTriangleIcon, PencilIcon, EyeIcon } from '@heroicons/react/24/outline';
import { useForm } from 'react-hook-form';
import { yupResolver } from '@hookform/resolvers/yup';
import * as yup from 'yup';
import { apiService } from '../services/api';
import { Task, Project } from '../types';
import toast from 'react-hot-toast';

const taskSchema = yup.object({
  title: yup.string().required('Task title is required'),
  description: yup.string().required('Description is required'),
  project: yup.string().required('Project is required'),
  due_date: yup.string().nullable().optional(),
  status: yup.string().oneOf(['todo', 'in_progress', 'done']).optional(),
});

interface TaskFormData {
  title: string;
  description: string;
  project: string;
  due_date: string | null | undefined;
  status?: 'todo' | 'in_progress' | 'done';
}

const statusColors = {
  todo: 'bg-gray-100 text-gray-800',
  in_progress: 'bg-blue-100 text-blue-800',
  done: 'bg-green-100 text-green-800'
};

export const Tasks: React.FC = () => {
  const navigate = useNavigate();
  const [tasks, setTasks] = useState<Task[]>([]);
  const [projects, setProjects] = useState<Project[]>([]);
  const [isCreateModalOpen, setIsCreateModalOpen] = useState(false);
  const [isEditModalOpen, setIsEditModalOpen] = useState(false);
  const [editingTask, setEditingTask] = useState<Task | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  const {
    register,
    handleSubmit,
    formState: { errors },
    reset
  } = useForm<TaskFormData>({
    resolver: yupResolver(taskSchema) as any
  });

  const {
    register: editRegister,
    handleSubmit: editHandleSubmit,
    formState: { errors: editErrors },
    reset: editReset,
    setValue: editSetValue
  } = useForm<TaskFormData>({
    resolver: yupResolver(taskSchema) as any
  });

  const fetchTasks = async () => {
    try {
      const tasks = await apiService.getTasks();
      setTasks(tasks || []);
    } catch (error) {
      toast.error('Failed to load tasks');
      console.error('Error fetching tasks:', error);
    }
  };

  const fetchProjects = async () => {
    try {
      const projects = await apiService.getProjects();
      setProjects(projects || []);
    } catch (error) {
      console.error('Error fetching projects:', error);
    }
  };

  useEffect(() => {
    const loadData = async () => {
      setIsLoading(true);
      await Promise.all([fetchTasks(), fetchProjects()]);
      setIsLoading(false);
    };
    loadData();
  }, []);

  const onSubmit = async (data: TaskFormData) => {
    try {
      const newTask = await apiService.createTask({
        ...data,
        project: data.project // Keep as string since backend expects string ID
      });
      setTasks(prev => [newTask, ...prev]);
      setIsCreateModalOpen(false);
      reset();
      toast.success('Task created successfully!');
    } catch (error) {
      toast.error('Failed to create task');
      console.error('Error creating task:', error);
    }
  };

  const openEditModal = (task: Task) => {
    setEditingTask(task);
    editSetValue('title', task.title);
    editSetValue('description', task.description);
    editSetValue('project', task.project);
    editSetValue('due_date', task.due_date);
    editSetValue('status', task.status);
    setIsEditModalOpen(true);
  };

  const onEditSubmit = async (data: TaskFormData) => {
    if (!editingTask) return;
    
    try {
      const updatedTask = await apiService.updateTask(editingTask.id, {
        title: data.title,
        description: data.description,
        project: data.project,
        due_date: data.due_date || null,
        status: data.status || editingTask.status
      });
      
      setTasks(prev => prev.map(task => 
        task.id === editingTask.id ? { ...task, ...updatedTask } : task
      ));
      setIsEditModalOpen(false);
      setEditingTask(null);
      editReset();
      toast.success('Task updated successfully!');
    } catch (error) {
      toast.error('Failed to update task');
      console.error('Error updating task:', error);
    }
  };

  const updateTaskStatus = async (taskId: string, status: 'todo' | 'in_progress' | 'done') => {
    try {
      // Check authentication first
      const token = localStorage.getItem('token');
      console.log('Auth token exists:', !!token);
      if (token) {
        console.log('Token preview:', token.substring(0, 20) + '...');
      }
      
      // Find the current task to get all its fields
      const currentTask = tasks.find(task => task.id === taskId);
      if (!currentTask) {
        toast.error('Task not found');
        return;
      }
      
      console.log('Current task:', currentTask);
      console.log('Updating task:', taskId, 'to status:', status);
      console.log('Making API call to:', `/tasks/${taskId}/`);
      
      // Only send the status field for the update to avoid validation issues
      const updateData = {
        status: status
      };
      
      console.log('With data:', updateData);
      
      const updatedTask = await apiService.updateTask(taskId, updateData);
      console.log('Update successful:', updatedTask);
      
      setTasks(prev => prev.map(task => 
        task.id === taskId ? { ...task, status } : task
      ));
      toast.success('Task status updated!');
    } catch (error: any) {
      console.error('Error updating task status:', error);
      
      let errorMessage = 'Failed to update task status';
      
      if (error.response) {
        console.error('Response data:', error.response.data);
        console.error('Response status:', error.response.status);
        console.error('Response headers:', error.response.headers);
        
        if (error.response.status === 403) {
          errorMessage = 'You do not have permission to update this task';
        } else if (error.response.status === 401) {
          errorMessage = 'Please log in to update tasks';
        } else if (error.response.status === 404) {
          errorMessage = 'Task not found';
        } else if (error.response.data?.detail) {
          errorMessage = error.response.data.detail;
        } else if (error.response.data?.message) {
          errorMessage = error.response.data.message;
        } else if (error.response.data?.error) {
          errorMessage = error.response.data.error;
        }
      } else if (error.request) {
        console.error('Request error:', error.request);
        errorMessage = 'Network error - could not reach server';
      } else {
        console.error('Error message:', error.message);
        errorMessage = error.message;
      }
      
      toast.error(errorMessage);
    }
  };

  if (isLoading) {
    return (
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="animate-pulse">
          <div className="h-8 bg-gray-200 rounded w-1/4 mb-6"></div>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {[...Array(6)].map((_, i) => (
              <div key={i} className="h-64 bg-gray-200 rounded-xl"></div>
            ))}
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
      <div className="flex justify-between items-center mb-8">
        <h1 className="text-3xl font-bold text-gray-900">Tasks</h1>
        <button
          onClick={() => setIsCreateModalOpen(true)}
          className="flex items-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
        >
          <PlusIcon className="h-5 w-5" />
          New Task
        </button>
      </div>

      {tasks.length === 0 ? (
        <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-12 text-center">
          <CheckCircleIcon className="h-16 w-16 text-gray-400 mx-auto mb-4" />
          <h2 className="text-xl font-semibold text-gray-900 mb-2">No tasks yet</h2>
          <p className="text-gray-600 mb-6">Create your first task to get started!</p>
          <button
            onClick={() => setIsCreateModalOpen(true)}
            className="px-6 py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
          >
            Create Task
          </button>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {tasks.map((task) => (
            <motion.div
              key={task.id}
              initial={{ opacity: 0, scale: 0.9 }}
              animate={{ opacity: 1, scale: 1 }}
              whileHover={{ scale: 1.02 }}
              onClick={() => navigate(`/app/tasks/${task.id}`)}
              className="bg-white rounded-xl shadow-sm border border-gray-100 p-6 hover:shadow-md transition-shadow cursor-pointer"
            >
              <div className="flex items-start justify-between mb-4">
                <div className="flex-1">
                  <h3 className="text-lg font-semibold text-gray-900 mb-2">{task.title}</h3>
                  <p className="text-gray-600 text-sm line-clamp-2">{task.description}</p>
                </div>
              </div>
              
              <div className="flex flex-wrap gap-2 mb-4">
                <span className={`px-2 py-1 text-xs font-medium rounded-full ${statusColors[task.status]}`}>
                  {task.status.replace('_', ' ')}
                </span>
              </div>
              
              <div className="flex items-center justify-between text-sm text-gray-500 mb-4">
                <div className="flex items-center gap-2">
                  <ClockIcon className="h-4 w-4" />
                  {task.due_date ? (
                    <span>Due: {new Date(task.due_date).toLocaleDateString()}</span>
                  ) : (
                    <span>No due date</span>
                  )}
                </div>
                {task.assignee && (
                  <span className="text-xs bg-gray-100 px-2 py-1 rounded">
                    {task.assignee.display_name}
                  </span>
                )}
              </div>
              
              <div className="flex gap-2">
                <button
                  onClick={(e) => {
                    e.stopPropagation();
                    navigate(`/app/tasks/${task.id}`);
                  }}
                  className="flex-1 px-3 py-2 text-sm bg-green-50 text-green-600 rounded-lg hover:bg-green-100 transition-colors flex items-center justify-center gap-1"
                  title="View Task Details"
                >
                  <EyeIcon className="h-4 w-4" />
                  View
                </button>
                {task.status !== 'done' && (
                  <button
                    onClick={(e) => {
                      e.stopPropagation();
                      updateTaskStatus(task.id, task.status === 'todo' ? 'in_progress' : 'done');
                    }}
                    className="flex-1 px-3 py-2 text-sm bg-blue-50 text-blue-600 rounded-lg hover:bg-blue-100 transition-colors"
                    title={task.status === 'todo' ? 'Start Task' : 'Mark Complete'}
                  >
                    {task.status === 'todo' ? 'Start' : 'Complete'}
                  </button>
                )}
                <button 
                  onClick={(e) => {
                    e.stopPropagation();
                    openEditModal(task);
                  }}
                  className="px-3 py-2 text-sm bg-gray-50 text-gray-600 rounded-lg hover:bg-gray-100 transition-colors flex items-center gap-1"
                  title="Edit Task"
                >
                  <PencilIcon className="h-4 w-4" />
                </button>
              </div>
            </motion.div>
          ))}
        </div>
      )}

      {/* Create Task Modal */}
      {isCreateModalOpen && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <motion.div
            initial={{ opacity: 0, scale: 0.9 }}
            animate={{ opacity: 1, scale: 1 }}
            className="bg-white rounded-xl shadow-xl max-w-md w-full mx-4"
          >
            <div className="p-6">
              <h2 className="text-xl font-semibold text-gray-900 mb-4">Create New Task</h2>
              
              <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Title
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
                    rows={3}
                    {...register('description')}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                    placeholder="Enter task description"
                  />
                  {errors.description && (
                    <p className="text-red-500 text-sm mt-1">{errors.description.message}</p>
                  )}
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Project
                  </label>
                  <select
                    {...register('project')}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  >
                    <option value="">Select a project</option>
                    {projects.map((project) => (
                      <option key={project.id} value={project.id}>
                        {project.name}
                      </option>
                    ))}
                  </select>
                  {errors.project && (
                    <p className="text-red-500 text-sm mt-1">{errors.project.message}</p>
                  )}
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
                  {errors.due_date && (
                    <p className="text-red-500 text-sm mt-1">{errors.due_date.message}</p>
                  )}
                </div>

                <div className="flex gap-3 pt-4">
                  <button
                    type="button"
                    onClick={() => {
                      setIsCreateModalOpen(false);
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

      {/* Edit Task Modal */}
      {isEditModalOpen && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <motion.div
            initial={{ opacity: 0, scale: 0.9 }}
            animate={{ opacity: 1, scale: 1 }}
            className="bg-white rounded-xl shadow-xl max-w-md w-full mx-4"
          >
            <div className="p-6">
              <h2 className="text-xl font-semibold text-gray-900 mb-4">Edit Task</h2>
              
              <form onSubmit={editHandleSubmit(onEditSubmit)} className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Task Title
                  </label>
                  <input
                    {...editRegister('title')}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                    placeholder="Enter task title"
                  />
                  {editErrors.title && (
                    <p className="text-red-500 text-sm mt-1">{editErrors.title.message}</p>
                  )}
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Description
                  </label>
                  <textarea
                    {...editRegister('description')}
                    rows={3}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                    placeholder="Enter task description"
                  />
                  {editErrors.description && (
                    <p className="text-red-500 text-sm mt-1">{editErrors.description.message}</p>
                  )}
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Project
                  </label>
                  <select
                    {...editRegister('project')}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  >
                    <option value="">Select a project</option>
                    {projects.map(project => (
                      <option key={project.id} value={project.id}>
                        {project.name}
                      </option>
                    ))}
                  </select>
                  {editErrors.project && (
                    <p className="text-red-500 text-sm mt-1">{editErrors.project.message}</p>
                  )}
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Status
                  </label>
                  <select
                    {...editRegister('status')}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  >
                    <option value="todo">To Do</option>
                    <option value="in_progress">In Progress</option>
                    <option value="done">Done</option>
                  </select>
                  {editErrors.status && (
                    <p className="text-red-500 text-sm mt-1">{editErrors.status.message}</p>
                  )}
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Due Date
                  </label>
                  <input
                    {...editRegister('due_date')}
                    type="datetime-local"
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  />
                  {editErrors.due_date && (
                    <p className="text-red-500 text-sm mt-1">{editErrors.due_date.message}</p>
                  )}
                </div>

                <div className="flex gap-3 pt-4">
                  <button
                    type="button"
                    onClick={() => {
                      setIsEditModalOpen(false);
                      setEditingTask(null);
                      editReset();
                    }}
                    className="flex-1 px-4 py-2 text-gray-700 bg-gray-100 rounded-lg hover:bg-gray-200 transition-colors"
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    className="flex-1 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
                  >
                    Update Task
                  </button>
                </div>
              </form>
            </div>
          </motion.div>
        </div>
      )}
    </div>
  );
};