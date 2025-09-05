export interface Category {
  id: number;
  name: string;
  created_at: string;
  updated_at: string;
}

export interface Item {
  id: number;
  name: string;
  category: number;
  category_name: string;
  default_unit: string;
  created_at: string;
  updated_at: string;
}

export interface User {
  id: number;
  username: string;
  email: string;
  first_name: string;
  last_name: string;
}

export interface GroceryList {
  id: number;
  name: string;
  owner: number;
  owner_username?: string;
  shared_with: User[];
  created_at: string;
  updated_at: string;
  item_count?: number;
}

export interface GroceryListItem {
  id: number;
  grocery_list: number;
  item: number;
  item_name?: string;
  item_category?: string;
  custom_name?: string;
  display_name?: string;
  quantity: string;
  unit: string;
  notes?: string;
  is_checked: boolean;
  added_by: number;
  added_by_username?: string;
  checked_by?: number;
  checked_by_username?: string;
  created_at: string;
  updated_at: string;
  checked_at?: string;
}

export interface PaginatedResponse<T> {
  count: number;
  next?: string;
  previous?: string;
  results: T[];
}

export interface AuthUser {
  id: number;
  username: string;
  email: string;
  first_name: string;
  last_name: string;
  token?: string;
}

export interface LoginRequest {
  username: string;
  password: string;
}

export interface LoginResponse {
  user: AuthUser;
  token: string;
}
