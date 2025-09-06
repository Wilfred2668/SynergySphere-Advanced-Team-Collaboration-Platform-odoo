import React, { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { PlusIcon, ChatBubbleLeftRightIcon, UserIcon, XMarkIcon } from '@heroicons/react/24/outline';
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

// Helper function to safely format dates
const formatDate = (dateString: string | null | undefined) => {
  if (!dateString) return 'Date not available';
  
  try {
    const date = new Date(dateString);
    if (isNaN(date.getTime())) return 'Invalid date';
    
    return date.toLocaleDateString();
  } catch (error) {
    console.error('Date formatting error:', error);
    return 'Date error';
  }
};

const formatTime = (dateString: string | null | undefined) => {
  if (!dateString) return 'Time not available';
  
  try {
    const date = new Date(dateString);
    if (isNaN(date.getTime())) return 'Invalid time';
    
    return date.toLocaleTimeString([], {hour: '2-digit', minute:'2-digit'});
  } catch (error) {
    console.error('Time formatting error:', error);
    return 'Time error';
  }
};

export const Discussions: React.FC = () => {
  const [discussions, setDiscussions] = useState<DiscussionThread[]>([]);
  const [projects, setProjects] = useState<Project[]>([]);
  const [isCreateModalOpen, setIsCreateModalOpen] = useState(false);
  const [isDiscussionModalOpen, setIsDiscussionModalOpen] = useState(false);
  const [selectedDiscussion, setSelectedDiscussion] = useState<DiscussionThread | null>(null);
  const [newMessage, setNewMessage] = useState('');
  const [isSendingMessage, setIsSendingMessage] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
  const [currentUser, setCurrentUser] = useState<any>(null);

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
      console.log('Fetched discussions:', discussions);
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

  const fetchCurrentUser = async () => {
    try {
      // Get current user info from the API
      const user = await apiService.getProfile();
      setCurrentUser(user);
      console.log('Current user:', user);
    } catch (error) {
      console.error('Error fetching current user:', error);
      // Fallback: try to get user info from localStorage
      const userEmail = localStorage.getItem('userEmail');
      const userName = localStorage.getItem('userName');
      const userId = localStorage.getItem('userId');
      if (userEmail || userName || userId) {
        setCurrentUser({
          id: userId,
          email: userEmail,
          username: userName || userEmail,
          display_name: userName || userEmail?.split('@')[0]
        });
      }
    }
  };

  useEffect(() => {
    const loadData = async () => {
      setIsLoading(true);
      await Promise.all([
        fetchDiscussions(),
        fetchProjects(),
        fetchCurrentUser()
      ]);
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

  const handleJoinDiscussion = async (discussion: DiscussionThread) => {
    console.log('Selected discussion:', discussion);
    setSelectedDiscussion(discussion);
    setIsDiscussionModalOpen(true);
    
    // Fetch messages for this discussion
    try {
      const messages = await apiService.getMessages(discussion.id);
      console.log('Fetched messages:', messages);
      setSelectedDiscussion(prev => prev ? { ...prev, messages } : null);
    } catch (error) {
      console.error('Error fetching messages:', error);
      // Still show the modal even if messages fail to load
    }
  };

  const handleSendMessage = async () => {
    if (!newMessage.trim() || !selectedDiscussion || isSendingMessage) return;

    setIsSendingMessage(true);
    try {
      console.log('Sending message to discussion:', selectedDiscussion.id);
      console.log('Message content:', newMessage.trim());
      
      // Send message to the discussion
      const newMessageResponse = await apiService.createMessage(selectedDiscussion.id, newMessage.trim());
      
      // Update the selected discussion with the new message
      setSelectedDiscussion(prev => {
        if (!prev) return prev;
        const updatedMessages = [...(prev.messages || []), newMessageResponse];
        return { ...prev, messages: updatedMessages, message_count: updatedMessages.length };
      });

      // Update the discussions list to reflect the new message count
      setDiscussions(prev => prev.map(disc => 
        disc.id === selectedDiscussion.id 
          ? { ...disc, message_count: (disc.message_count || 0) + 1 }
          : disc
      ));

      setNewMessage('');
      toast.success('Message sent successfully!');
    } catch (error: any) {
      console.error('Error sending message:', error);
      
      let errorMessage = 'Failed to send message';
      if (error.response) {
        console.error('Response data:', error.response.data);
        console.error('Response status:', error.response.status);
        
        if (error.response.data?.detail) {
          errorMessage = error.response.data.detail;
        } else if (error.response.data?.message) {
          errorMessage = error.response.data.message;
        } else if (error.response.data?.error) {
          errorMessage = error.response.data.error;
        }
      }
      
      toast.error(errorMessage);
    } finally {
      setIsSendingMessage(false);
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
                    <span>{discussion.created_at ? formatDate(discussion.created_at) : 'Recent'}</span>
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
                <button 
                  onClick={() => handleJoinDiscussion(discussion)}
                  className="px-4 py-2 text-sm bg-blue-50 text-blue-600 rounded-lg hover:bg-blue-100 transition-colors"
                >
                  Join Discussion
                </button>
                <button 
                  onClick={() => handleJoinDiscussion(discussion)}
                  className="px-4 py-2 text-sm bg-gray-50 text-gray-600 rounded-lg hover:bg-gray-100 transition-colors"
                >
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

      {/* Discussion Detail Modal - WhatsApp-like Chat UI */}
      {isDiscussionModalOpen && selectedDiscussion && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <motion.div
            initial={{ opacity: 0, scale: 0.9 }}
            animate={{ opacity: 1, scale: 1 }}
            className="bg-white rounded-xl shadow-xl max-w-2xl w-full h-[80vh] flex flex-col overflow-hidden"
          >
            {/* Chat Header */}
            <div className="p-4 border-b border-gray-200 bg-gray-50 flex justify-between items-center">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 bg-blue-500 rounded-full flex items-center justify-center">
                  <ChatBubbleLeftRightIcon className="h-6 w-6 text-white" />
                </div>
                <div>
                  <h2 className="text-lg font-semibold text-gray-900">{selectedDiscussion.title}</h2>
                  <p className="text-sm text-gray-500">
                    {selectedDiscussion.messages?.length || selectedDiscussion.message_count || 0} messages
                  </p>
                </div>
              </div>
              <button
                onClick={() => {
                  setIsDiscussionModalOpen(false);
                  setSelectedDiscussion(null);
                }}
                className="p-2 hover:bg-gray-200 rounded-lg transition-colors"
              >
                <XMarkIcon className="h-5 w-5 text-gray-500" />
              </button>
            </div>

            {/* Chat Messages Area */}
            <div className="flex-1 overflow-y-auto bg-gray-50 p-4 space-y-4">
              {/* Initial Discussion Message */}
              <div className="flex justify-center">
                <div className="bg-white rounded-lg shadow-sm p-4 max-w-md text-center border">
                  <div className="flex items-center justify-center gap-2 text-sm text-gray-500 mb-2">
                    <UserIcon className="h-4 w-4" />
                    <span>{selectedDiscussion.created_by?.display_name || 'Unknown'}</span>
                    <span>started this discussion</span>
                  </div>
                  <p className="text-gray-700 font-medium">{selectedDiscussion.content || selectedDiscussion.description}</p>
                  <p className="text-xs text-gray-400 mt-2">
                    {selectedDiscussion.created_at ? (
                      `${formatDate(selectedDiscussion.created_at)} at ${formatTime(selectedDiscussion.created_at)}`
                    ) : (
                      'Started recently'
                    )}
                  </p>
                </div>
              </div>

              {/* Chat Messages */}
              {selectedDiscussion.messages && selectedDiscussion.messages.length > 0 ? (
                selectedDiscussion.messages.map((message, index) => {
                  // Debug logging to understand the data structure
                  console.log('Full message object:', message);
                  console.log('Message author:', message.author);
                  console.log('Current user:', currentUser);
                  
                  // Better user detection logic with more robust checking
                  const isCurrentUser = currentUser && message.author && (
                    String(message.author.id) === String(currentUser.id) ||
                    message.author.email === currentUser.email ||
                    message.author.username === currentUser.username
                  );
                  
                  console.log('Is current user:', isCurrentUser);
                  
                  // Better author name extraction with fallbacks
                  const getAuthorName = () => {
                    if (!message.author) {
                      console.warn('Message has no author:', message);
                      return 'Unknown User';
                    }
                    
                    return message.author.display_name || 
                           message.author.full_name || 
                           message.author.username || 
                           message.author.email || 
                           'Unknown User';
                  };
                  
                  return (
                    <div key={message.id || index} className={`flex ${isCurrentUser ? 'justify-end' : 'justify-start'}`}>
                      <div className={`max-w-xs lg:max-w-md px-4 py-2 rounded-2xl ${
                        isCurrentUser 
                          ? 'bg-blue-500 text-white rounded-br-sm' 
                          : 'bg-white text-gray-800 rounded-bl-sm shadow-sm border'
                      }`}>
                        {!isCurrentUser && (
                          <p className="text-xs font-medium mb-1 text-gray-600">
                            {getAuthorName()}
                          </p>
                        )}
                        <p className="text-sm">{message.content || message.text}</p>
                        <p className={`text-xs mt-1 ${isCurrentUser ? 'text-blue-100' : 'text-gray-400'}`}>
                          {formatTime(message.created_at)}
                        </p>
                      </div>
                    </div>
                  );
                })
              ) : (
                <div className="flex justify-center py-8">
                  <div className="text-center text-gray-500">
                    <ChatBubbleLeftRightIcon className="h-12 w-12 mx-auto mb-2 text-gray-300" />
                    <p className="text-sm">No messages yet. Start the conversation!</p>
                  </div>
                </div>
              )}
            </div>
            
            {/* Chat Input Area */}
            <div className="p-4 border-t border-gray-200 bg-white">
              <div className="flex items-center gap-3">
                <div className="flex-1 relative">
                  <input
                    type="text"
                    value={newMessage}
                    onChange={(e) => setNewMessage(e.target.value)}
                    onKeyPress={(e) => {
                      if (e.key === 'Enter' && !e.shiftKey) {
                        e.preventDefault();
                        handleSendMessage();
                      }
                    }}
                    placeholder="Type a message..."
                    className="w-full px-4 py-3 pr-12 border border-gray-300 rounded-full focus:ring-2 focus:ring-blue-500 focus:border-transparent bg-gray-50"
                    disabled={isSendingMessage}
                  />
                  {newMessage.trim() && (
                    <button 
                      onClick={handleSendMessage}
                      disabled={!newMessage.trim() || isSendingMessage}
                      className="absolute right-2 top-1/2 transform -translate-y-1/2 w-8 h-8 bg-blue-500 text-white rounded-full hover:bg-blue-600 transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center"
                    >
                      {isSendingMessage ? (
                        <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
                      ) : (
                        <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 19l9 2-9-18-9 18 9-2zm0 0v-8" />
                        </svg>
                      )}
                    </button>
                  )}
                </div>
              </div>
            </div>
          </motion.div>
        </div>
      )}
    </motion.div>
  );
};
