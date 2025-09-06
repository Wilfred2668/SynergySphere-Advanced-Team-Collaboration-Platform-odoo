import React, { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { PlusIcon, ChatBubbleLeftRightIcon, UserIcon } from '@heroicons/react/24/outline';
import { useForm } from 'react-hook-form';
import { yupResolver } from '@hookform/resolvers/yup';
import * as yup from 'yup';
import { apiService } from '../services/api';
import { DiscussionThread, Project } from '../types';
import toast from 'react-hot-toast';

const discussionSchema = yup.object({
  title: yup.string().required('Discussion title is required'),
  content: yup.string().required('Content is required'),
  project: yup.string().required('Project is required'),
});

interface DiscussionFormData {
  title: string;
  content: string;
  project: string;
}

export const Discussions: React.FC = () => {
  const [discussions, setDiscussions] = useState<DiscussionThread[]>([]);
  const [projects, setProjects] = useState<Project[]>([]);
  const [isCreateModalOpen, setIsCreateModalOpen] = useState(false);
  const [isLoading, setIsLoading] = useState(true);

  const {
    register,
    handleSubmit,
    reset,
    formState: { errors, isSubmitting }
  } = useForm<DiscussionFormData>({
    resolver: yupResolver(discussionSchema)
  });

  const fetchDiscussions = async () => {
    try {
      const discussions = await apiService.getDiscussionThreads();
      setDiscussions(discussions || []);
    } catch (error) {
      toast.error('Failed to load discussions');
      console.error('Error fetching discussions:', error);
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
      await Promise.all([fetchDiscussions(), fetchProjects()]);
      setIsLoading(false);
    };
    loadData();
  }, []);

  const onSubmit = async (data: DiscussionFormData) => {
    try {
      const newDiscussion = await apiService.createDiscussionThread({
        title: data.title,
        content: data.content,
        description: data.content,
        project: data.project // API expects project ID as string
      });
      setDiscussions(prev => [newDiscussion, ...prev]);
      setIsCreateModalOpen(false);
      reset();
      toast.success('Discussion started successfully!');
    } catch (error) {
      toast.error('Failed to start discussion');
      console.error('Error creating discussion:', error);
    }
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
      </div>
    );
  }

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      className="space-y-6"
    >
      <div className="flex items-center justify-between">
        <h1 className="text-3xl font-bold text-gray-900">Discussions</h1>
        <button
          onClick={() => setIsCreateModalOpen(true)}
          className="flex items-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
        >
          <PlusIcon className="h-5 w-5" />
          Start Discussion
        </button>
      </div>

      {discussions.length === 0 ? (
        <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-12 text-center">
          <ChatBubbleLeftRightIcon className="h-16 w-16 text-gray-400 mx-auto mb-4" />
          <h2 className="text-xl font-semibold text-gray-900 mb-2">No discussions yet</h2>
          <p className="text-gray-600 mb-6">Start your first discussion to collaborate with your team!</p>
          <button
            onClick={() => setIsCreateModalOpen(true)}
            className="px-6 py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
          >
            Start Discussion
          </button>
        </div>
      ) : (
        <div className="space-y-4">
          {discussions.map((discussion) => (
            <motion.div
              key={discussion.id}
              initial={{ opacity: 0, scale: 0.9 }}
              animate={{ opacity: 1, scale: 1 }}
              className="bg-white rounded-xl shadow-sm border border-gray-100 p-6 hover:shadow-md transition-shadow cursor-pointer"
            >
              <div className="flex items-start justify-between">
                <div className="flex-1">
                  <h3 className="text-lg font-semibold text-gray-900 mb-2">{discussion.title}</h3>
                  <p className="text-gray-600 mb-3 line-clamp-2">{discussion.content || discussion.description}</p>
                  
                  <div className="flex items-center gap-4 text-sm text-gray-500">
                    <div className="flex items-center gap-1">
                      <UserIcon className="h-4 w-4" />
                      <span>Started by {discussion.created_by?.username || 'Unknown'}</span>
                    </div>
                    <span>•</span>
                    <span>{new Date(discussion.created_at).toLocaleDateString()}</span>
                    <span>•</span>
                    <span>Project: {discussion.project_name || projects.find(p => p.id === discussion.project)?.name || 'Unknown'}</span>
                  </div>
                </div>
                
                <div className="flex items-center gap-2 text-sm text-gray-500">
                  <ChatBubbleLeftRightIcon className="h-4 w-4" />
                  <span>{discussion.messages?.length || discussion.message_count || 0} replies</span>
                </div>
              </div>
              
              <div className="mt-4 flex gap-2">
                <button className="px-4 py-2 text-sm bg-blue-50 text-blue-600 rounded-lg hover:bg-blue-100 transition-colors">
                  Join Discussion
                </button>
                <button className="px-4 py-2 text-sm bg-gray-50 text-gray-600 rounded-lg hover:bg-gray-100 transition-colors">
                  View Details
                </button>
              </div>
            </motion.div>
          ))}
        </div>
      )}

      {/* Create Discussion Modal */}
      {isCreateModalOpen && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <motion.div
            initial={{ opacity: 0, scale: 0.9 }}
            animate={{ opacity: 1, scale: 1 }}
            className="bg-white rounded-xl shadow-xl max-w-md w-full mx-4"
          >
            <div className="p-6">
              <h2 className="text-xl font-semibold text-gray-900 mb-4">Start New Discussion</h2>
              
              <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Discussion Title
                  </label>
                  <input
                    {...register('title')}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-blue-500 focus:border-blue-500"
                    placeholder="Enter discussion title"
                  />
                  {errors.title && (
                    <p className="text-red-500 text-sm mt-1">{errors.title.message}</p>
                  )}
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Content
                  </label>
                  <textarea
                    {...register('content')}
                    rows={4}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-blue-500 focus:border-blue-500"
                    placeholder="What would you like to discuss?"
                  />
                  {errors.content && (
                    <p className="text-red-500 text-sm mt-1">{errors.content.message}</p>
                  )}
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Project
                  </label>
                  <select
                    {...register('project')}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-blue-500 focus:border-blue-500"
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

                <div className="flex justify-end gap-3 pt-4">
                  <button
                    type="button"
                    onClick={() => {
                      setIsCreateModalOpen(false);
                      reset();
                    }}
                    className="px-4 py-2 text-gray-600 border border-gray-300 rounded-lg hover:bg-gray-50 transition-colors"
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    disabled={isSubmitting}
                    className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors disabled:opacity-50"
                  >
                    {isSubmitting ? 'Starting...' : 'Start Discussion'}
                  </button>
                </div>
              </form>
            </div>
          </motion.div>
        </div>
      )}
    </motion.div>
  );
};
