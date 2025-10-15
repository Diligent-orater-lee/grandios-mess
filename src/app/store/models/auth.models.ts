// Authentication models for the Grandios Mess application

export interface LoginRequest {
  username: string;
  password: string;
}

export interface RegisterRequest {
  email: string;
  username: string;
  password: string;
  name?: string;
  userType?: 'ADMIN' | 'CLIENT';
}

export interface AuthResponse {
  access_token: string;
  user: User;
}

export interface User {
  id: string;
  email: string;
  username: string;
  name: string;
  userType: 'ADMIN' | 'CLIENT';
}

export interface AuthState {
  user: User | null;
  token: string | null;
  isAuthenticated: boolean;
  loading: boolean;
  error: string | null;
}

export interface ApiError {
  message: string;
  statusCode: number;
  error?: string;
}
