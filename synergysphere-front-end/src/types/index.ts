export interface User {
  id: string;
  email: string;
  username: string;
  first_name: string;
  last_name: string;
  full_name?: string;
  bio?: string;
  date_joined: string;
  created_at: string;
  last_login?: string;
  is_active?: boolean;
  role?: string;
  phone_number?: string;
  profile_picture?: string;
  date_of_birth?: string;
  timezone?: string;
  email_notifications?: boolean;
  push_notifications?: boolean;
}

export interface Project {
  id: string;
  name: string;
  description: string;
  status?: 'active' | 'completed' | 'on_hold';
  priority?: 'low' | 'medium' | 'high';
  start_date?: string;
  end_date?: string;
  created_at: string;
  updated_at: string;
  owner?: User;
  created_by?: User;
  member_count: number;
  user_role: 'owner' | 'admin' | 'member' | null;
  members?: ProjectMembership[];
}

export interface ProjectMembership {
  id: string;
  user: User;
  role: 'owner' | 'admin' | 'member';
  joined_at: string;
}

export interface Task {
  id: string;
  title: string;
  description: string;
  status: 'todo' | 'in_progress' | 'review' | 'completed' | 'cancelled';
  due_date: string | null;
  created_at: string;
  updated_at: string;
  project: string; // Project ID
  project_name?: string;
  assignee: User | null;
  assignee_id?: string | null;
  created_by: User;
  is_overdue: boolean;
  is_due_soon: boolean;
  can_edit: boolean;
  can_delete: boolean;
}

export interface DiscussionThread {
  id: string;
  title: string;
  description: string;
  content?: string;
  created_at: string;
  updated_at: string;
  project: string; // Project ID
  project_name?: string;
  created_by: User;
  author?: User; // Alias for created_by for consistency
  message_count: number;
  can_delete: boolean;
  recent_messages: Message[];
  messages?: Message[];
  participants?: User[];
}

export interface Message {
  id: string;
  content: string;
  created_at: string;
  updated_at: string;
  author: User;
  thread: string;
  can_delete: boolean;
}

export interface Notification {
  id: string;
  title: string;
  message: string;
  notification_type: 'TASK_ASSIGNED' | 'TASK_DUE_SOON' | 'TASK_OVERDUE' | 'MESSAGE' | 'PROJECT_UPDATE';
  is_read: boolean;
  created_at: string;
  data: Record<string, any>;
}

export interface AuthTokens {
  access: string;
  refresh: string;
}

export interface LoginCredentials {
  email: string;
  password: string;
}

export interface RegisterData {
  email: string;
  username: string;
  first_name: string;
  last_name: string;
  password: string;
  password_confirm: string;
}

export interface ApiResponse<T> {
  count?: number;
  next?: string | null;
  previous?: string | null;
  results: T[];
}

export interface TaskFilters {
  project?: string;
  assignee?: string;
  status?: string;
  priority?: string;
  search?: string;
  ordering?: string;
}
