import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';
import {
  Category,
  Item,
  GroceryList,
  GroceryListItem,
  PaginatedResponse,
} from '../models/api.models';

@Injectable({
  providedIn: 'root',
})
export class GroceryService {
  private apiUrl = this.getApiUrl();

  constructor(private http: HttpClient) {}

  private getApiUrl(): string {
    if (window.location.hostname === 'localhost' || window.location.hostname === '127.0.0.1') {
      return 'http://localhost:8000/api';
    }
    return '/api';
  }

  // Categories
  getCategories(): Observable<PaginatedResponse<Category>> {
    return this.http.get<PaginatedResponse<Category>>(`${this.apiUrl}/categories/`);
  }

  createCategory(name: string): Observable<Category> {
    return this.http.post<Category>(`${this.apiUrl}/categories/`, { name });
  }

  // Items
  getItems(): Observable<PaginatedResponse<Item>> {
    return this.http.get<PaginatedResponse<Item>>(`${this.apiUrl}/items/`);
  }

  searchItems(query: string): Observable<PaginatedResponse<Item>> {
    return this.http.get<PaginatedResponse<Item>>(
      `${this.apiUrl}/items/?search=${encodeURIComponent(query)}`
    );
  }

  createItem(item: Partial<Item>): Observable<Item> {
    return this.http.post<Item>(`${this.apiUrl}/items/`, item);
  }

  validateNewItem(name: string, category: number, defaultUnit: string): string[] {
    const errors: string[] = [];

    if (!name || name.trim().length === 0) {
      errors.push('Item name is required');
    }

    if (!category || category <= 0) {
      errors.push('Category is required');
    }

    if (!defaultUnit || defaultUnit.trim().length === 0) {
      errors.push('Default unit is required');
    }

    return errors;
  }

  updateItem(id: number, item: Partial<Item>): Observable<Item> {
    return this.http.put<Item>(`${this.apiUrl}/items/${id}/`, item);
  }

  deleteItem(id: number): Observable<void> {
    return this.http.delete<void>(`${this.apiUrl}/items/${id}/`);
  }

  // Grocery Lists
  getGroceryLists(): Observable<PaginatedResponse<GroceryList>> {
    return this.http.get<PaginatedResponse<GroceryList>>(`${this.apiUrl}/grocery-lists/`);
  }

  getGroceryList(id: number): Observable<GroceryList> {
    return this.http.get<GroceryList>(`${this.apiUrl}/grocery-lists/${id}/`);
  }

  createGroceryList(name: string): Observable<GroceryList> {
    return this.http.post<GroceryList>(`${this.apiUrl}/grocery-lists/`, { name });
  }

  updateGroceryList(id: number, list: Partial<GroceryList>): Observable<GroceryList> {
    return this.http.put<GroceryList>(`${this.apiUrl}/grocery-lists/${id}/`, list);
  }

  deleteGroceryList(id: number): Observable<void> {
    return this.http.delete<void>(`${this.apiUrl}/grocery-lists/${id}/`);
  }

  // Grocery List Items
  getGroceryListItems(listId?: number): Observable<PaginatedResponse<GroceryListItem>> {
    const url = listId
      ? `${this.apiUrl}/grocery-list-items/?grocery_list=${listId}`
      : `${this.apiUrl}/grocery-list-items/`;
    return this.http.get<PaginatedResponse<GroceryListItem>>(url);
  }

  addItemToList(
    listId: number,
    itemId: number,
    quantity: string,
    unit?: string
  ): Observable<GroceryListItem> {
    return this.http.post<GroceryListItem>(`${this.apiUrl}/grocery-lists/${listId}/add_item/`, {
      item_id: itemId,
      quantity,
      unit,
    });
  }

  updateGroceryListItem(id: number, item: Partial<GroceryListItem>): Observable<GroceryListItem> {
    return this.http.patch<GroceryListItem>(`${this.apiUrl}/grocery-list-items/${id}/`, item);
  }

  deleteGroceryListItem(id: number): Observable<void> {
    return this.http.delete<void>(`${this.apiUrl}/grocery-list-items/${id}/`);
  }

  toggleItemChecked(id: number): Observable<GroceryListItem> {
    return this.http.post<GroceryListItem>(
      `${this.apiUrl}/grocery-list-items/${id}/toggle_checked/`,
      {}
    );
  }

  shareList(listId: number, username: string): Observable<void> {
    return this.http.post<void>(`${this.apiUrl}/grocery-lists/${listId}/share_with/`, {
      username,
    });
  }
}
