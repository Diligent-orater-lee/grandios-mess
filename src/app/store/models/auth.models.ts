// Authentication models for the Grandios Mess application

export enum UserType {
  ADMIN = 'ADMIN',
  CLIENT = 'CLIENT',
  DELIVERY = 'DELIVERY'
}

export interface LoginRequest {
  username: string;
  password: string;
}

export interface RegisterRequest {
  email: string;
  username: string;
  password: string;
  name?: string;
  userType?: UserType;
}

export interface AuthResponse {
  access_token: string;
  refresh_token: string;
  user: User;
}

export interface User {
  id: string;
  email: string;
  username: string;
  name: string;
  userType: UserType;
}

export interface AuthState {
  user: User | null;
  accessToken: string | null;
  isAuthenticated: boolean;
  loading: boolean;
  error: string | null;
}

export interface ApiError {
  message: string;
  statusCode: number;
  error?: string;
}
