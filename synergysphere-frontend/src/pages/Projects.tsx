import React, { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { useNavigate } from 'react-router-dom';
import { PlusIcon, FolderIcon, UserGroupIcon, CalendarIcon, XMarkIcon, TrashIcon, PencilIcon, ClockIcon, EnvelopeIcon, EyeIcon } from '@heroicons/react/24/outline';
import { useForm } from 'react-hook-form';
import { yupResolver } from '@hookform/resolvers/yup';
import * as yup from 'yup';
import { apiService } from '../services/api';
import { Project, ProjectMembership } from '../types';
import toast from 'react-hot-toast';

const projectSchema = yup.object({
  name: yup.string().required('Project name is required'),
  description: yup.string().required('Description is required'),
});

const memberSchema = yup.object({
  email: yup.string().email('Invalid email').required('Email is required'),
  role: yup.string().oneOf(['member', 'admin'], 'Invalid role').required('Role is required'),
});

interface ProjectFormData {
  name: string;
  description: string;
}

interface MemberFormData {
  email: string;
  role: 'member' | 'admin';
}

interface ProjectMember {
  email: string;
  role: 'member' | 'admin';
}

export const Projects: React.FC = () => {
  const navigate = useNavigate();
  const [projects, setProjects] = useState<Project[]>([]);
  const [isCreateModalOpen, setIsCreateModalOpen] = useState(false);
  const [isEditModalOpen, setIsEditModalOpen] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
  const [selectedProject, setSelectedProject] = useState<Project | null>(null);
  const [isDetailsModalOpen, setIsDetailsModalOpen] = useState(false);
  const [isSettingsModalOpen, setIsSettingsModalOpen] = useState(false);
  const [isInviteMemberModalOpen, setIsInviteMemberModalOpen] = useState(false);
  const [projectMembers, setProjectMembers] = useState<ProjectMembership[]>([]);
  const [isLoadingMembers, setIsLoadingMembers] = useState(false);
  
  // State for managing members during project creation/edit
  const [newProjectMembers, setNewProjectMembers] = useState<ProjectMember[]>([]);
  const [isAddingMember, setIsAddingMember] = useState(false);

  const {
    register,
    handleSubmit,
    reset,
    setValue,
    formState: { errors, isSubmitting }
  } = useForm<ProjectFormData>({
    resolver: yupResolver(projectSchema)
  });

  // Separate form for editing projects
  const {
    register: registerEdit,
    handleSubmit: handleSubmitEdit,
    reset: resetEdit,
    setValue: setValueEdit,
    formState: { errors: editErrors, isSubmitting: isEditSubmitting }
  } = useForm<ProjectFormData>({
    resolver: yupResolver(projectSchema)
  });

  // Form for adding members during project creation
  const {
    register: registerNewMember,
    handleSubmit: handleSubmitNewMember,
    reset: resetNewMember,
    formState: { errors: newMemberErrors }
  } = useForm<MemberFormData>({
    resolver: yupResolver(memberSchema)
  });

  const {
    register: registerMember,
    handleSubmit: handleSubmitMember,
    reset: resetMember,
    formState: { errors: memberErrors, isSubmitting: isSubmittingMember }
  } = useForm<MemberFormData>({
    resolver: yupResolver(memberSchema)
  });

  const fetchProjects = async () => {
    try {
      const projects = await apiService.getProjects();
      setProjects(projects || []);
    } catch (error) {
      toast.error('Failed to load projects');
      console.error('Error fetching projects:', error);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchProjects();
  }, []);

  const onSubmit = async (data: ProjectFormData) => {
    try {
      const newProject = await apiService.createProject(data);
      
      // Add members to the project if any were specified
      if (newProjectMembers.length > 0) {
        for (const member of newProjectMembers) {
          try {
            await apiService.addProjectMember(newProject.id, member.email, member.role);
          } catch (memberError) {
            console.warn(`Failed to add member ${member.email}:`, memberError);
            toast.error(`Failed to add member ${member.email}`);
          }
        }
      }
      
      setProjects(prev => [newProject, ...prev]);
      setIsCreateModalOpen(false);
      reset();
      setNewProjectMembers([]);
      toast.success('Project created successfully!');
    } catch (error) {
      toast.error('Failed to create project');
      console.error('Error creating project:', error);
    }
  };

  const onEditSubmit = async (data: ProjectFormData) => {
    if (!selectedProject) return;
    
    try {
      const updatedProject = await apiService.updateProject(selectedProject.id, data);
      setProjects(prev => prev.map(p => p.id === selectedProject.id ? updatedProject : p));
      setIsEditModalOpen(false);
      setSelectedProject(null);
      resetEdit();
      toast.success('Project updated successfully!');
    } catch (error) {
      toast.error('Failed to update project');
      console.error('Error updating project:', error);
    }
  };

  const handleAddMemberToNewProject = (data: MemberFormData) => {
    // Check if member already exists
    if (newProjectMembers.some(member => member.email === data.email)) {
      toast.error('Member already added');
      return;
    }
    
    setNewProjectMembers(prev => [...prev, data]);
    resetNewMember();
    toast.success('Member added to project');
  };

  const handleRemoveMemberFromNewProject = (email: string) => {
    setNewProjectMembers(prev => prev.filter(member => member.email !== email));
  };

  const handleEditProject = (project: Project) => {
    setSelectedProject(project);
    setValueEdit('name', project.name);
    setValueEdit('description', project.description);
    setIsEditModalOpen(true);
  };

  const handleCloseCreateModal = () => {
    setIsCreateModalOpen(false);
    reset();
    setNewProjectMembers([]);
    resetNewMember();
  };

  const handleCloseEditModal = () => {
    setIsEditModalOpen(false);
    resetEdit();
    setSelectedProject(null);
  };

  const handleViewDetails = (project: Project) => {
    navigate(`/app/projects/${project.id}`);
  };

  const handleSettings = (project: Project) => {
    setSelectedProject(project);
    setIsSettingsModalOpen(true);
  };

  const handleDeleteProject = async (projectId: string) => {
    if (window.confirm('Are you sure you want to delete this project? This action cannot be undone.')) {
      try {
        await apiService.deleteProject(projectId);
        setProjects(prev => prev.filter(p => p.id !== projectId));
        setIsSettingsModalOpen(false);
        toast.success('Project deleted successfully!');
      } catch (error) {
        toast.error('Failed to delete project');
        console.error('Error deleting project:', error);
      }
    }
  };

  const handleManageMembers = async (project: Project) => {
    setSelectedProject(project);
    setIsLoadingMembers(true);
    try {
      console.log('Loading members for project:', project.id);
      const members = await apiService.getProjectMembers(project.id);
      console.log('Members loaded successfully:', members);
      setProjectMembers(members);
      setIsInviteMemberModalOpen(true);
    } catch (error: any) {
      console.error('Full error object:', error);
      console.error('Error response:', error.response);
      console.error('Error message:', error.message);
      if (error.response?.data) {
        console.error('Error data:', error.response.data);
        toast.error(`Failed to load project members: ${error.response.data.detail || error.response.data.message || 'Unknown error'}`);
      } else {
        toast.error('Failed to load project members');
      }
    } finally {
      setIsLoadingMembers(false);
    }
  };

  const handleInviteMember = async (data: MemberFormData) => {
    if (!selectedProject) return;
    
    try {
      await apiService.addProjectMember(selectedProject.id, data.email, data.role);
      toast.success('Member invited successfully!');
      resetMember();
      // Refresh members list
      const members = await apiService.getProjectMembers(selectedProject.id);
      setProjectMembers(members);
    } catch (error: any) {
      if (error.response?.data?.detail) {
        toast.error(error.response.data.detail);
      } else {
        toast.error('Failed to invite member');
      }
      console.error('Error inviting member:', error);
    }
  };

  const handleRemoveMember = async (memberId: string) => {
    if (!selectedProject) return;
    
    if (window.confirm('Are you sure you want to remove this member from the project?')) {
      try {
        await apiService.removeProjectMember(selectedProject.id, memberId);
        toast.success('Member removed successfully!');
        // Refresh members list
        const members = await apiService.getProjectMembers(selectedProject.id);
        setProjectMembers(members);
      } catch (error) {
        toast.error('Failed to remove member');
        console.error('Error removing member:', error);
      }
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
        <h1 className="text-3xl font-bold text-gray-900">Projects</h1>
        <button
          onClick={() => setIsCreateModalOpen(true)}
          className="flex items-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
        >
          <PlusIcon className="h-5 w-5" />
          New Project
        </button>
      </div>

      {projects.length === 0 ? (
        <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-12 text-center">
          <FolderIcon className="h-16 w-16 text-gray-400 mx-auto mb-4" />
          <h2 className="text-xl font-semibold text-gray-900 mb-2">No projects yet</h2>
          <p className="text-gray-600 mb-6">Create your first project to get started!</p>
          <button
            onClick={() => setIsCreateModalOpen(true)}
            className="px-6 py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
          >
            Create Project
          </button>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {projects.map((project) => (
            <motion.div
              key={project.id}
              initial={{ opacity: 0, scale: 0.9 }}
              animate={{ opacity: 1, scale: 1 }}
              whileHover={{ scale: 1.02 }}
              onClick={() => navigate(`/app/projects/${project.id}`)}
              className="bg-white rounded-xl shadow-sm border border-gray-100 p-6 hover:shadow-md transition-shadow cursor-pointer"
            >
              <div className="flex items-start justify-between mb-4">
                <div className="flex-1">
                  <h3 className="text-lg font-semibold text-gray-900 mb-2">{project.name}</h3>
                  <p className="text-gray-600 text-sm line-clamp-2">{project.description}</p>
                </div>
              </div>
              
              <div className="flex items-center justify-between text-sm text-gray-500">
                <div className="flex items-center gap-2">
                  <UserGroupIcon className="h-4 w-4" />
                  <span>{project.member_count} members</span>
                </div>
                <div className="flex items-center gap-2">
                  <CalendarIcon className="h-4 w-4" />
                  <span>{new Date(project.created_at).toLocaleDateString()}</span>
                </div>
              </div>
              
              <div className="mt-4 flex gap-2">
                <button 
                  onClick={(e) => {
                    e.stopPropagation();
                    navigate(`/app/projects/${project.id}`);
                  }}
                  className="flex-1 px-3 py-2 text-sm bg-blue-50 text-blue-600 rounded-lg hover:bg-blue-100 transition-colors flex items-center justify-center gap-1"
                >
                  <EyeIcon className="h-4 w-4" />
                  Open Project
                </button>
                <button 
                  onClick={(e) => {
                    e.stopPropagation();
                    handleEditProject(project);
                  }}
                  className="px-3 py-2 text-sm bg-green-50 text-green-600 rounded-lg hover:bg-green-100 transition-colors"
                  title="Edit Project"
                >
                  <PencilIcon className="h-4 w-4" />
                </button>
                <button 
                  onClick={(e) => {
                    e.stopPropagation();
                    handleSettings(project);
                  }}
                  className="px-3 py-2 text-sm bg-gray-50 text-gray-600 rounded-lg hover:bg-gray-100 transition-colors"
                >
                  Settings
                </button>
              </div>
            </motion.div>
          ))}
        </div>
      )}

      {/* Create Project Modal */}
      {isCreateModalOpen && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <motion.div
            initial={{ opacity: 0, scale: 0.9 }}
            animate={{ opacity: 1, scale: 1 }}
            className="bg-white rounded-xl shadow-xl max-w-2xl w-full mx-4 max-h-[90vh] overflow-y-auto"
          >
            <div className="p-6">
              <h2 className="text-xl font-semibold text-gray-900 mb-4">Create New Project</h2>
              
              <form onSubmit={handleSubmit(onSubmit)} className="space-y-6">
                {/* Project Details */}
                <div className="space-y-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Project Name
                    </label>
                    <input
                      {...register('name')}
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-blue-500 focus:border-blue-500"
                      placeholder="Enter project name"
                    />
                    {errors.name && (
                      <p className="text-red-500 text-sm mt-1">{errors.name.message}</p>
                    )}
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Description
                    </label>
                    <textarea
                      {...register('description')}
                      rows={3}
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-blue-500 focus:border-blue-500"
                      placeholder="Describe your project"
                    />
                    {errors.description && (
                      <p className="text-red-500 text-sm mt-1">{errors.description.message}</p>
                    )}
                  </div>
                </div>

                {/* Add Members Section */}
                <div className="border-t border-gray-200 pt-6">
                  <h3 className="text-lg font-medium text-gray-900 mb-4">Add Team Members (Optional)</h3>
                  
                  {/* Add Member Form */}
                  <div className="bg-blue-50 rounded-lg p-4 mb-4">
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                      <div className="md:col-span-2">
                        <label className="block text-sm font-medium text-gray-700 mb-1">
                          Email Address
                        </label>
                        <input
                          type="email"
                          {...registerNewMember('email')}
                          className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                          placeholder="Enter team member email"
                        />
                        {newMemberErrors.email && (
                          <p className="text-red-500 text-sm mt-1">{newMemberErrors.email.message}</p>
                        )}
                      </div>

                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">
                          Role
                        </label>
                        <select
                          {...registerNewMember('role')}
                          className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                        >
                          <option value="member">Member</option>
                          <option value="admin">Admin</option>
                        </select>
                        {newMemberErrors.role && (
                          <p className="text-red-500 text-sm mt-1">{newMemberErrors.role.message}</p>
                        )}
                      </div>
                    </div>

                    <button
                      type="button"
                      onClick={handleSubmitNewMember(handleAddMemberToNewProject)}
                      className="mt-3 flex items-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
                    >
                      <PlusIcon className="h-4 w-4" />
                      Add Member
                    </button>
                  </div>

                  {/* Members List */}
                  {newProjectMembers.length > 0 && (
                    <div className="space-y-2">
                      <h4 className="text-sm font-medium text-gray-700">Added Members:</h4>
                      {newProjectMembers.map((member, index) => (
                        <div key={index} className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
                          <div className="flex items-center gap-3">
                            <div className="h-8 w-8 bg-gray-200 rounded-full flex items-center justify-center">
                              <UserGroupIcon className="h-4 w-4 text-gray-600" />
                            </div>
                            <div>
                              <p className="text-sm font-medium text-gray-900">{member.email}</p>
                              <p className="text-xs text-gray-500 capitalize">{member.role}</p>
                            </div>
                          </div>
                          <button
                            type="button"
                            onClick={() => handleRemoveMemberFromNewProject(member.email)}
                            className="text-red-600 hover:text-red-800 p-1"
                            title="Remove member"
                          >
                            <TrashIcon className="h-4 w-4" />
                          </button>
                        </div>
                      ))}
                    </div>
                  )}
                </div>

                <div className="flex justify-end gap-3 pt-4 border-t border-gray-200">
                  <button
                    type="button"
                    onClick={handleCloseCreateModal}
                    className="px-4 py-2 text-gray-600 border border-gray-300 rounded-lg hover:bg-gray-50 transition-colors"
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    disabled={isSubmitting}
                    className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors disabled:opacity-50"
                  >
                    {isSubmitting ? 'Creating...' : 'Create Project'}
                  </button>
                </div>
              </form>
            </div>
          </motion.div>
        </div>
      )}

      {/* Edit Project Modal */}
      {isEditModalOpen && selectedProject && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <motion.div
            initial={{ opacity: 0, scale: 0.9 }}
            animate={{ opacity: 1, scale: 1 }}
            className="bg-white rounded-xl shadow-xl max-w-md w-full mx-4"
          >
            <div className="p-6">
              <h2 className="text-xl font-semibold text-gray-900 mb-4">Edit Project</h2>
              
              <form onSubmit={handleSubmitEdit(onEditSubmit)} className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Project Name
                  </label>
                  <input
                    {...registerEdit('name')}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-blue-500 focus:border-blue-500"
                    placeholder="Enter project name"
                  />
                  {editErrors.name && (
                    <p className="text-red-500 text-sm mt-1">{editErrors.name.message}</p>
                  )}
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Description
                  </label>
                  <textarea
                    {...registerEdit('description')}
                    rows={3}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-blue-500 focus:border-blue-500"
                    placeholder="Describe your project"
                  />
                  {editErrors.description && (
                    <p className="text-red-500 text-sm mt-1">{editErrors.description.message}</p>
                  )}
                </div>

                <div className="flex justify-end gap-3 pt-4">
                  <button
                    type="button"
                    onClick={handleCloseEditModal}
                    className="px-4 py-2 text-gray-600 border border-gray-300 rounded-lg hover:bg-gray-50 transition-colors"
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    disabled={isEditSubmitting}
                    className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors disabled:opacity-50"
                  >
                    {isEditSubmitting ? 'Updating...' : 'Update Project'}
                  </button>
                </div>
              </form>
            </div>
          </motion.div>
        </div>
      )}

      {/* Project Details Modal */}
      {isDetailsModalOpen && selectedProject && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <motion.div
            initial={{ opacity: 0, scale: 0.9 }}
            animate={{ opacity: 1, scale: 1 }}
            className="bg-white rounded-xl shadow-xl max-w-2xl w-full mx-4 max-h-[90vh] overflow-y-auto"
          >
            <div className="p-6">
              <div className="flex items-start justify-between mb-6">
                <div>
                  <h2 className="text-2xl font-semibold text-gray-900 mb-2">{selectedProject.name}</h2>
                  <p className="text-gray-600">{selectedProject.description}</p>
                </div>
                <button
                  onClick={() => setIsDetailsModalOpen(false)}
                  className="p-2 hover:bg-gray-100 rounded-lg transition-colors"
                >
                  <XMarkIcon className="h-5 w-5" />
                </button>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div className="space-y-4">
                  <div>
                    <h3 className="text-sm font-medium text-gray-700 mb-2">Project Owner</h3>
                    <div className="flex items-center gap-3">
                      <div className="w-8 h-8 bg-blue-500 rounded-full flex items-center justify-center text-white text-sm font-medium">
                        {selectedProject.owner.display_name?.charAt(0) || selectedProject.owner.username?.charAt(0)}
                      </div>
                      <div>
                        <p className="text-sm font-medium text-gray-900">{selectedProject.owner.display_name || selectedProject.owner.username}</p>
                        <p className="text-xs text-gray-500">{selectedProject.owner.email}</p>
                      </div>
                    </div>
                  </div>

                  <div>
                    <h3 className="text-sm font-medium text-gray-700 mb-2">Members</h3>
                    <div className="flex items-center gap-2 text-sm text-gray-600">
                      <UserGroupIcon className="h-4 w-4" />
                      <span>{selectedProject.member_count} member{selectedProject.member_count !== 1 ? 's' : ''}</span>
                    </div>
                  </div>

                  <div>
                    <h3 className="text-sm font-medium text-gray-700 mb-2">Your Role</h3>
                    <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-blue-100 text-blue-800">
                      {selectedProject.user_role || 'Member'}
                    </span>
                  </div>
                </div>

                <div className="space-y-4">
                  <div>
                    <h3 className="text-sm font-medium text-gray-700 mb-2">Created</h3>
                    <div className="flex items-center gap-2 text-sm text-gray-600">
                      <CalendarIcon className="h-4 w-4" />
                      <span>{new Date(selectedProject.created_at).toLocaleDateString()}</span>
                    </div>
                  </div>

                  <div>
                    <h3 className="text-sm font-medium text-gray-700 mb-2">Last Updated</h3>
                    <div className="flex items-center gap-2 text-sm text-gray-600">
                      <ClockIcon className="h-4 w-4" />
                      <span>{new Date(selectedProject.updated_at).toLocaleDateString()}</span>
                    </div>
                  </div>
                </div>
              </div>

              <div className="mt-6 pt-6 border-t border-gray-200">
                <div className="flex justify-end gap-3">
                  <button
                    onClick={() => setIsDetailsModalOpen(false)}
                    className="px-4 py-2 text-gray-600 border border-gray-300 rounded-lg hover:bg-gray-50 transition-colors"
                  >
                    Close
                  </button>
                  <button
                    onClick={() => {
                      setIsDetailsModalOpen(false);
                      handleSettings(selectedProject);
                    }}
                    className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
                  >
                    Project Settings
                  </button>
                </div>
              </div>
            </div>
          </motion.div>
        </div>
      )}

      {/* Project Settings Modal */}
      {isSettingsModalOpen && selectedProject && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <motion.div
            initial={{ opacity: 0, scale: 0.9 }}
            animate={{ opacity: 1, scale: 1 }}
            className="bg-white rounded-xl shadow-xl max-w-md w-full mx-4"
          >
            <div className="p-6">
              <div className="flex items-start justify-between mb-6">
                <h2 className="text-xl font-semibold text-gray-900">Project Settings</h2>
                <button
                  onClick={() => setIsSettingsModalOpen(false)}
                  className="p-2 hover:bg-gray-100 rounded-lg transition-colors"
                >
                  <XMarkIcon className="h-5 w-5" />
                </button>
              </div>

              <div className="space-y-4">
                <div className="p-4 bg-gray-50 rounded-lg">
                  <h3 className="font-medium text-gray-900 mb-2">{selectedProject.name}</h3>
                  <p className="text-sm text-gray-600">{selectedProject.description}</p>
                </div>

                <div className="space-y-3">
                  <button
                    onClick={() => {
                      setIsSettingsModalOpen(false);
                      handleEditProject(selectedProject);
                    }}
                    className="w-full flex items-center gap-3 px-4 py-3 text-left text-gray-700 hover:bg-gray-50 rounded-lg transition-colors"
                  >
                    <PencilIcon className="h-5 w-5" />
                    <span>Edit Project Details</span>
                  </button>

                  <button
                    onClick={() => {
                      setIsSettingsModalOpen(false);
                      handleManageMembers(selectedProject);
                    }}
                    className="w-full flex items-center gap-3 px-4 py-3 text-left text-gray-700 hover:bg-gray-50 rounded-lg transition-colors"
                  >
                    <UserGroupIcon className="h-5 w-5" />
                    <span>Manage Members</span>
                  </button>
                </div>

                {selectedProject.user_role === 'owner' && (
                  <div className="pt-4 border-t border-gray-200">
                    <button
                      onClick={() => handleDeleteProject(selectedProject.id)}
                      className="w-full flex items-center gap-3 px-4 py-3 text-left text-red-600 hover:bg-red-50 rounded-lg transition-colors"
                    >
                      <TrashIcon className="h-5 w-5" />
                      <span>Delete Project</span>
                    </button>
                  </div>
                )}
              </div>

              <div className="mt-6 pt-6 border-t border-gray-200">
                <button
                  onClick={() => setIsSettingsModalOpen(false)}
                  className="w-full px-4 py-2 text-gray-600 border border-gray-300 rounded-lg hover:bg-gray-50 transition-colors"
                >
                  Close
                </button>
              </div>
            </div>
          </motion.div>
        </div>
      )}

      {/* Invite Members Modal */}
      {isInviteMemberModalOpen && selectedProject && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <motion.div
            initial={{ opacity: 0, scale: 0.9 }}
            animate={{ opacity: 1, scale: 1 }}
            className="bg-white rounded-xl shadow-xl max-w-2xl w-full mx-4 max-h-[90vh] overflow-y-auto"
          >
            <div className="p-6">
              <div className="flex items-center justify-between mb-6">
                <h2 className="text-xl font-semibold text-gray-900">
                  Manage Members - {selectedProject.name}
                </h2>
                <button
                  onClick={() => setIsInviteMemberModalOpen(false)}
                  className="text-gray-400 hover:text-gray-600"
                >
                  <XMarkIcon className="h-6 w-6" />
                </button>
              </div>

              {/* Invite New Member Form */}
              <div className="mb-8 p-4 bg-blue-50 rounded-lg">
                <h3 className="text-lg font-medium text-gray-900 mb-4">Invite New Member</h3>
                <form onSubmit={handleSubmitMember(handleInviteMember)} className="space-y-4">
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">
                        Email Address
                      </label>
                      <input
                        type="email"
                        {...registerMember('email')}
                        className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                        placeholder="Enter email address"
                      />
                      {memberErrors.email && (
                        <p className="text-red-500 text-sm mt-1">{memberErrors.email.message}</p>
                      )}
                    </div>

                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">
                        Role
                      </label>
                      <select
                        {...registerMember('role')}
                        className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                      >
                        <option value="member">Member</option>
                        <option value="admin">Admin</option>
                      </select>
                      {memberErrors.role && (
                        <p className="text-red-500 text-sm mt-1">{memberErrors.role.message}</p>
                      )}
                    </div>
                  </div>

                  <button
                    type="submit"
                    disabled={isSubmittingMember}
                    className="flex items-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors disabled:opacity-50"
                  >
                    <EnvelopeIcon className="h-5 w-5" />
                    {isSubmittingMember ? 'Inviting...' : 'Send Invitation'}
                  </button>
                </form>
              </div>

              {/* Current Members List */}
              <div>
                <h3 className="text-lg font-medium text-gray-900 mb-4">Current Members</h3>
                {isLoadingMembers ? (
                  <div className="text-center py-4">
                    <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600 mx-auto"></div>
                  </div>
                ) : (
                  <div className="space-y-3">
                    {/* Project Owner */}
                    <div className="flex items-center justify-between p-4 bg-green-50 rounded-lg">
                      <div className="flex items-center gap-3">
                        <div className="h-10 w-10 bg-green-100 rounded-full flex items-center justify-center">
                          <UserGroupIcon className="h-5 w-5 text-green-600" />
                        </div>
                        <div>
                          <p className="font-medium text-gray-900">{selectedProject.owner.display_name}</p>
                          <p className="text-sm text-gray-600">{selectedProject.owner.email}</p>
                        </div>
                      </div>
                      <span className="px-3 py-1 bg-green-100 text-green-800 text-sm font-medium rounded-full">
                        Owner
                      </span>
                    </div>

                    {/* Project Members */}
                    {projectMembers.map((member) => (
                      <div key={member.id} className="flex items-center justify-between p-4 bg-gray-50 rounded-lg">
                        <div className="flex items-center gap-3">
                          <div className="h-10 w-10 bg-gray-100 rounded-full flex items-center justify-center">
                            <UserGroupIcon className="h-5 w-5 text-gray-600" />
                          </div>
                          <div>
                            <p className="font-medium text-gray-900">{member.user.display_name}</p>
                            <p className="text-sm text-gray-600">{member.user.email}</p>
                            <p className="text-xs text-gray-500">
                              Joined: {new Date(member.joined_at).toLocaleDateString()}
                            </p>
                          </div>
                        </div>
                        <div className="flex items-center gap-3">
                          <span className={`px-3 py-1 text-sm font-medium rounded-full ${
                            member.role === 'admin' 
                              ? 'bg-blue-100 text-blue-800' 
                              : 'bg-gray-100 text-gray-800'
                          }`}>
                            {member.role.charAt(0).toUpperCase() + member.role.slice(1)}
                          </span>
                          <button
                            onClick={() => handleRemoveMember(member.id)}
                            className="text-red-600 hover:text-red-800 p-1"
                            title="Remove member"
                          >
                            <TrashIcon className="h-4 w-4" />
                          </button>
                        </div>
                      </div>
                    ))}

                    {projectMembers.length === 0 && !isLoadingMembers && (
                      <div className="text-center py-6 text-gray-500">
                        No additional members yet. Invite someone to get started!
                      </div>
                    )}
                  </div>
                )}
              </div>

              <div className="mt-6 pt-6 border-t border-gray-200">
                <button
                  onClick={() => {
                    setIsInviteMemberModalOpen(false);
                    resetMember();
                  }}
                  className="w-full px-4 py-2 text-gray-600 border border-gray-300 rounded-lg hover:bg-gray-50 transition-colors"
                >
                  Close
                </button>
              </div>
            </div>
          </motion.div>
        </div>
      )}
    </motion.div>
  );
};
