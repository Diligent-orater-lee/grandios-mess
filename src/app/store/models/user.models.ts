// User management models for the Grandios Mess application
import { DaySchedule } from '.';
import { UserType } from './auth.models';

export interface UserListItem {
  id: string;
  email: string;
  username: string;
  name: string;
  userType: UserType;
  createdAt: string;
  updatedAt: string;
}

export interface CustomerListItem extends UserListItem {
  todayMeals: DaySchedule;
}

export interface PaginationParams {
  page?: number;
  limit?: number;
  search?: string;
}

export interface PaginationInfo {
  page: number;
  limit: number;
  total: number;
  totalPages: number;
}

export interface PaginatedResponse<T> {
  data: T[];
  pagination: PaginationInfo;
}

export interface UserListState {
  clients: CustomerListItem[];
  delivery: UserListItem[];
  clientsPagination: PaginationInfo | null;
  deliveryPagination: PaginationInfo | null;
  loading: boolean;
  error: string | null;
  searchTerm: string;
  currentPage: number;
  pageSize: number;
}
