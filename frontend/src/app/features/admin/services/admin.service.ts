import { Injectable } from '@angular/core';
import { HttpClient, HttpParams } from '@angular/common/http';
import { Observable } from 'rxjs';
import { environment } from '../../../../environments/environment';
import {
  AdminUser,
  AdminRecipe,
  AdminCategory,
  AdminRating,
  PlatformStatistics,
  AnalyticsData,
  SystemSettings,
  BulkOperation,
  ModerationQueue,
  AdminFilters,
  AdminListResponse
} from '../models/admin.models';

@Injectable({
  providedIn: 'root'
})
export class AdminService {
  private readonly apiUrl = `${environment.apiUrl}/admin`;

  constructor(private http: HttpClient) {}

  // Platform Statistics
  getPlatformStatistics(): Observable<PlatformStatistics> {
    return this.http.get<PlatformStatistics>(`${this.apiUrl}/statistics/`);
  }

  getModerationQueue(): Observable<ModerationQueue> {
    return this.http.get<ModerationQueue>(`${this.apiUrl}/moderation-queue/`);
  }

  // User Management
  getUsers(
    page: number = 1,
    pageSize: number = 20,
    filters?: AdminFilters['users']
  ): Observable<AdminListResponse<AdminUser>> {
    let params = new HttpParams()
      .set('page', page.toString())
      .set('page_size', pageSize.toString());

    if (filters) {
      if (filters.search) params = params.set('search', filters.search);
      if (filters.status) params = params.set('status', filters.status);
      if (filters.date_joined_after) params = params.set('date_joined_after', filters.date_joined_after);
      if (filters.date_joined_before) params = params.set('date_joined_before', filters.date_joined_before);
    }

    return this.http.get<AdminListResponse<AdminUser>>(`${this.apiUrl}/users/`, { params });
  }

  getUserById(userId: string): Observable<AdminUser> {
    return this.http.get<AdminUser>(`${this.apiUrl}/users/${userId}/`);
  }

  updateUser(userId: string, userData: Partial<AdminUser>): Observable<AdminUser> {
    return this.http.patch<AdminUser>(`${this.apiUrl}/users/${userId}/`, userData);
  }

  toggleUserStatus(userId: string, isActive: boolean): Observable<AdminUser> {
    return this.http.patch<AdminUser>(`${this.apiUrl}/users/${userId}/`, { is_active: isActive });
  }

  toggleUserStaffStatus(userId: string, isStaff: boolean): Observable<AdminUser> {
    return this.http.patch<AdminUser>(`${this.apiUrl}/users/${userId}/`, { is_staff: isStaff });
  }

  deleteUser(userId: string): Observable<void> {
    return this.http.delete<void>(`${this.apiUrl}/users/${userId}/`);
  }

  // Recipe Moderation
  getRecipes(
    page: number = 1,
    pageSize: number = 20,
    filters?: AdminFilters['recipes']
  ): Observable<AdminListResponse<AdminRecipe>> {
    let params = new HttpParams()
      .set('page', page.toString())
      .set('page_size', pageSize.toString());

    if (filters) {
      if (filters.search) params = params.set('search', filters.search);
      if (filters.status) params = params.set('status', filters.status);
      if (filters.author) params = params.set('author', filters.author);
      if (filters.category) params = params.set('category', filters.category.toString());
      if (filters.date_created_after) params = params.set('date_created_after', filters.date_created_after);
      if (filters.date_created_before) params = params.set('date_created_before', filters.date_created_before);
    }

    return this.http.get<AdminListResponse<AdminRecipe>>(`${this.apiUrl}/recipes/`, { params });
  }

  getRecipeById(recipeId: string): Observable<AdminRecipe> {
    return this.http.get<AdminRecipe>(`${this.apiUrl}/recipes/${recipeId}/`);
  }

  approveRecipe(recipeId: string): Observable<AdminRecipe> {
    return this.http.post<AdminRecipe>(`${this.apiUrl}/recipes/${recipeId}/approve/`, {});
  }

  rejectRecipe(recipeId: string, reason?: string): Observable<AdminRecipe> {
    return this.http.post<AdminRecipe>(`${this.apiUrl}/recipes/${recipeId}/reject/`, { reason });
  }

  flagRecipe(recipeId: string, reason: string): Observable<AdminRecipe> {
    return this.http.post<AdminRecipe>(`${this.apiUrl}/recipes/${recipeId}/flag/`, { reason });
  }

  updateRecipe(recipeId: string, recipeData: Partial<AdminRecipe>): Observable<AdminRecipe> {
    return this.http.patch<AdminRecipe>(`${this.apiUrl}/recipes/${recipeId}/`, recipeData);
  }

  deleteRecipe(recipeId: string): Observable<void> {
    return this.http.delete<void>(`${this.apiUrl}/recipes/${recipeId}/`);
  }

  // Category Management
  getCategories(
    page: number = 1,
    pageSize: number = 20,
    filters?: AdminFilters['categories']
  ): Observable<AdminListResponse<AdminCategory>> {
    let params = new HttpParams()
      .set('page', page.toString())
      .set('page_size', pageSize.toString());

    if (filters) {
      if (filters.search) params = params.set('search', filters.search);
      if (filters.status) params = params.set('status', filters.status);
      if (filters.parent) params = params.set('parent', filters.parent.toString());
    }

    return this.http.get<AdminListResponse<AdminCategory>>(`${this.apiUrl}/categories/`, { params });
  }

  getCategoryById(categoryId: number): Observable<AdminCategory> {
    return this.http.get<AdminCategory>(`${this.apiUrl}/categories/${categoryId}/`);
  }

  createCategory(categoryData: Partial<AdminCategory>): Observable<AdminCategory> {
    return this.http.post<AdminCategory>(`${this.apiUrl}/categories/`, categoryData);
  }

  updateCategory(categoryId: number, categoryData: Partial<AdminCategory>): Observable<AdminCategory> {
    return this.http.patch<AdminCategory>(`${this.apiUrl}/categories/${categoryId}/`, categoryData);
  }

  deleteCategory(categoryId: number): Observable<void> {
    return this.http.delete<void>(`${this.apiUrl}/categories/${categoryId}/`);
  }

  reorderCategories(orders: Array<{ id: number; order: number }>): Observable<void> {
    return this.http.post<void>(`${this.apiUrl}/categories/reorder/`, { orders });
  }

  // Content Moderation (Ratings)
  getRatings(
    page: number = 1,
    pageSize: number = 20,
    filters?: AdminFilters['ratings']
  ): Observable<AdminListResponse<AdminRating>> {
    let params = new HttpParams()
      .set('page', page.toString())
      .set('page_size', pageSize.toString());

    if (filters) {
      if (filters.search) params = params.set('search', filters.search);
      if (filters.rating) params = params.set('rating', filters.rating.toString());
      if (filters.status) params = params.set('status', filters.status);
      if (filters.date_created_after) params = params.set('date_created_after', filters.date_created_after);
      if (filters.date_created_before) params = params.set('date_created_before', filters.date_created_before);
    }

    return this.http.get<AdminListResponse<AdminRating>>(`${this.apiUrl}/ratings/`, { params });
  }

  getRatingById(ratingId: string): Observable<AdminRating> {
    return this.http.get<AdminRating>(`${this.apiUrl}/ratings/${ratingId}/`);
  }

  approveRating(ratingId: string): Observable<AdminRating> {
    return this.http.post<AdminRating>(`${this.apiUrl}/ratings/${ratingId}/approve/`, {});
  }

  rejectRating(ratingId: string, reason?: string): Observable<AdminRating> {
    return this.http.post<AdminRating>(`${this.apiUrl}/ratings/${ratingId}/reject/`, { reason });
  }

  flagRating(ratingId: string, reason: string): Observable<AdminRating> {
    return this.http.post<AdminRating>(`${this.apiUrl}/ratings/${ratingId}/flag/`, { reason });
  }

  deleteRating(ratingId: string): Observable<void> {
    return this.http.delete<void>(`${this.apiUrl}/ratings/${ratingId}/`);
  }

  updateRating(ratingId: string, ratingData: Partial<AdminRating>): Observable<AdminRating> {
    return this.http.patch<AdminRating>(`${this.apiUrl}/ratings/${ratingId}/`, ratingData);
  }

  // Analytics
  getAnalyticsData(period: string = '30d'): Observable<AnalyticsData> {
    const params = new HttpParams().set('period', period);
    return this.http.get<AnalyticsData>(`${this.apiUrl}/analytics/`, { params });
  }

  // System Settings
  getSystemSettings(): Observable<SystemSettings> {
    return this.http.get<SystemSettings>(`${this.apiUrl}/settings/`);
  }

  updateSystemSettings(settings: Partial<SystemSettings>): Observable<SystemSettings> {
    return this.http.patch<SystemSettings>(`${this.apiUrl}/settings/`, settings);
  }

  // Bulk Operations
  createBulkOperation(operation: {
    type: BulkOperation['type'];
    target_type: BulkOperation['target_type'];
    target_ids: string[];
  }): Observable<BulkOperation> {
    return this.http.post<BulkOperation>(`${this.apiUrl}/bulk-operations/`, operation);
  }

  getBulkOperations(): Observable<BulkOperation[]> {
    return this.http.get<BulkOperation[]>(`${this.apiUrl}/bulk-operations/`);
  }

  getBulkOperationById(operationId: string): Observable<BulkOperation> {
    return this.http.get<BulkOperation>(`${this.apiUrl}/bulk-operations/${operationId}/`);
  }

  cancelBulkOperation(operationId: string): Observable<void> {
    return this.http.post<void>(`${this.apiUrl}/bulk-operations/${operationId}/cancel/`, {});
  }

  // Data Export
  exportData(dataType: 'users' | 'recipes' | 'ratings' | 'categories', format: 'csv' | 'json' = 'csv'): Observable<Blob> {
    const params = new HttpParams().set('format', format);
    return this.http.get(`${this.apiUrl}/export/${dataType}/`, { 
      params, 
      responseType: 'blob' 
    });
  }

  // Audit Log
  getAuditLog(
    page: number = 1,
    pageSize: number = 20,
    filters?: {
      action?: string;
      user?: string;
      date_after?: string;
      date_before?: string;
    }
  ): Observable<AdminListResponse<any>> {
    let params = new HttpParams()
      .set('page', page.toString())
      .set('page_size', pageSize.toString());

    if (filters) {
      if (filters.action) params = params.set('action', filters.action);
      if (filters.user) params = params.set('user', filters.user);
      if (filters.date_after) params = params.set('date_after', filters.date_after);
      if (filters.date_before) params = params.set('date_before', filters.date_before);
    }

    return this.http.get<AdminListResponse<any>>(`${this.apiUrl}/audit-log/`, { params });
  }
} 