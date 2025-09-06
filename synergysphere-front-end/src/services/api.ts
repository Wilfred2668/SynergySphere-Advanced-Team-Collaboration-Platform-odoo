import axios, { AxiosInstance } from 'axios';
import { 
  User, 
  Project, 
  Task, 
  DiscussionThread, 
  Message, 
  Notification,
  AuthTokens,
  LoginCredentials,
  RegisterData,
  ApiResponse,
  TaskFilters
} from '../types';

const API_BASE_URL = process.env.REACT_APP_API_URL || 'http://127.0.0.1:8000/api';

class ApiService {
  private api: AxiosInstance;

  constructor() {
    this.api = axios.create({
      baseURL: API_BASE_URL,
      headers: {
        'Content-Type': 'application/json',
      },
    });

    // Request interceptor to add auth token
    this.api.interceptors.request.use(
      (config) => {
        const token = localStorage.getItem('access_token');
        if (token) {
          config.headers.Authorization = `Bearer ${token}`;
        }
        return config;
      },
      (error) => Promise.reject(error)
    );

    // Response interceptor to handle token refresh
    this.api.interceptors.response.use(
      (response) => response,
      async (error) => {
        const originalRequest = error.config;
        
        if (error.response?.status === 401 && !originalRequest._retry) {
          originalRequest._retry = true;
          
          try {
            const refreshToken = localStorage.getItem('refresh_token');
            if (refreshToken) {
              const response = await axios.post(`${API_BASE_URL}/auth/token/refresh/`, {
                refresh: refreshToken,
              });
              
              const { access } = response.data;
              localStorage.setItem('access_token', access);
              
              return this.api(originalRequest);
            }
          } catch (refreshError) {
            localStorage.removeItem('access_token');
            localStorage.removeItem('refresh_token');
            window.location.href = '/login';
          }
        }
        
        return Promise.reject(error);
      }
    );
  }

  // Auth methods
  async login(credentials: LoginCredentials): Promise<AuthTokens> {
    const response = await this.api.post<AuthTokens>('/auth/login/', credentials);
    return response.data;
  }

  async register(data: RegisterData): Promise<User> {
    const response = await this.api.post<User>('/auth/register/', data);
    return response.data;
  }

  async logout(): Promise<void> {
    const refreshToken = localStorage.getItem('refresh_token');
    if (refreshToken) {
      await this.api.post('/auth/logout/', { refresh: refreshToken });
    }
  }

  async getProfile(): Promise<User> {
    const response = await this.api.get<User>('/auth/profile/');
    return response.data;
  }

  async updateProfile(data: Partial<User>): Promise<User> {
    const response = await this.api.put<User>('/auth/profile/', data);
    return response.data;
  }

  // Project methods
  async getProjects(): Promise<Project[]> {
    const response = await this.api.get<ApiResponse<Project>>('/projects/');
    return response.data.results;
  }

  async getProject(id: string): Promise<Project> {
    const response = await this.api.get<Project>(`/projects/${id}/`);
    return response.data;
  }

  async createProject(data: Partial<Project>): Promise<Project> {
    const response = await this.api.post<Project>('/projects/', data);
    return response.data;
  }

  async updateProject(id: string, data: Partial<Project>): Promise<Project> {
    const response = await this.api.put<Project>(`/projects/${id}/`, data);
    return response.data;
  }

  async deleteProject(id: string): Promise<void> {
    await this.api.delete(`/projects/${id}/`);
  }

  async addProjectMember(projectId: string, email: string, role: string): Promise<void> {
    await this.api.post(`/projects/${projectId}/add_member/`, { email, role });
  }

  async removeProjectMember(projectId: string, memberId: string): Promise<void> {
    await this.api.delete(`/projects/${projectId}/members/${memberId}/`);
  }

  // Task methods
  async getTasks(filters?: TaskFilters): Promise<Task[]> {
    const params = new URLSearchParams();
    if (filters) {
      Object.entries(filters).forEach(([key, value]) => {
        if (value) params.append(key, value);
      });
    }
    const response = await this.api.get<ApiResponse<Task>>(`/tasks/?${params}`);
    return response.data.results;
  }

  async getTask(id: string): Promise<Task> {
    const response = await this.api.get<Task>(`/tasks/${id}/`);
    return response.data;
  }

  async createTask(data: Partial<Task>): Promise<Task> {
    const response = await this.api.post<Task>('/tasks/', data);
    return response.data;
  }

  async updateTask(id: string, data: Partial<Task>): Promise<Task> {
    const response = await this.api.put<Task>(`/tasks/${id}/`, data);
    return response.data;
  }

  async deleteTask(id: string): Promise<void> {
    await this.api.delete(`/tasks/${id}/`);
  }

  // Discussion methods
  async getDiscussionThreads(projectId?: string): Promise<DiscussionThread[]> {
    const params = projectId ? `?project=${projectId}` : '';
    const response = await this.api.get<ApiResponse<DiscussionThread>>(`/discussions/threads/${params}`);
    return response.data.results;
  }

  async getDiscussionThread(id: string): Promise<DiscussionThread> {
    const response = await this.api.get<DiscussionThread>(`/discussions/threads/${id}/`);
    return response.data;
  }

  async createDiscussionThread(data: Partial<DiscussionThread>): Promise<DiscussionThread> {
    const response = await this.api.post<DiscussionThread>('/discussions/threads/', data);
    return response.data;
  }

  async getMessages(threadId: string): Promise<Message[]> {
    const response = await this.api.get<ApiResponse<Message>>(`/discussions/threads/${threadId}/messages/`);
    return response.data.results;
  }

  async createMessage(threadId: string, content: string): Promise<Message> {
    const response = await this.api.post<Message>(`/discussions/threads/${threadId}/create_message/`, {
      content,
    });
    return response.data;
  }

  async deleteMessage(id: string): Promise<void> {
    await this.api.delete(`/discussions/messages/${id}/`);
  }

  // Notification methods
  async getNotifications(): Promise<Notification[]> {
    const response = await this.api.get<ApiResponse<Notification>>('/notifications/');
    return response.data.results;
  }

  async markNotificationRead(id: string): Promise<void> {
    await this.api.patch(`/notifications/${id}/mark_read/`);
  }

  async markAllNotificationsRead(): Promise<void> {
    await this.api.post('/notifications/mark_all_read/');
  }

  async getUnreadNotificationCount(): Promise<number> {
    const response = await this.api.get<{ count: number }>('/notifications/unread_count/');
    return response.data.count;
  }
}

export const apiService = new ApiService();
