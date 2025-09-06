export interface User {
  id: string;
  email: string;
  username: string;
  display_name: string;
  full_name: string;
  created_at: string;
}

export interface Project {
  id: string;
  name: string;
  description: string;
  created_at: string;
  updated_at: string;
  owner: User;
  member_count: number;
  user_role: 'owner' | 'admin' | 'member' | null;
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
  status: 'todo' | 'in_progress' | 'done';
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
  created_at?: string; // Make optional since backend might not send it
  updated_at?: string; // Make optional as well
  project: string; // Project ID
  project_name?: string;
  created_by: User;
  message_count: number;
  can_delete: boolean;
  recent_messages: Message[];
  messages?: Message[];
}

export interface Message {
  id: string;
  content: string;
  text?: string; // Backend might return this field
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
  display_name: string;
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

export interface Notification {
  id: string;
  type: 'task_assigned' | 'task_status_changed' | 'task_due_soon' | 'new_message' | 'project_invited' | 'project_role_changed';
  title: string;
  body: string;
  read: boolean;
  project: string | null;
  project_name?: string;
  created_at: string;
}
