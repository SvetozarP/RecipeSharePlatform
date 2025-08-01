import { Injectable } from '@angular/core';
import { Observable } from 'rxjs';
import { ApiService } from '../../../core/services/api.service';
import { Collection } from '../models/dashboard-data.model';
import { Recipe } from '../../../shared/models/recipe.models';

@Injectable({
  providedIn: 'root'
})
export class CollectionsService {
  constructor(private apiService: ApiService) {}

  async getUserCollections(limit?: number): Promise<Collection[]> {
    try {
      const params = limit ? this.apiService.buildParams({ limit }) : undefined;
      const result = await this.apiService.get<Collection[]>('/dashboard/collections/', params).toPromise();
      if (!result) {
        throw new Error('No collections data received');
      }
      return result;
    } catch (error) {
      console.error('Failed to load user collections:', error);
      throw error;
    }
  }

  async getCollection(id: number): Promise<Collection> {
    try {
      const result = await this.apiService.get<Collection>(`/dashboard/collections/${id}/`).toPromise();
      if (!result) {
        throw new Error('No collection data received');
      }
      return result;
    } catch (error) {
      console.error('Failed to load collection:', error);
      throw error;
    }
  }

  async createCollection(data: { name: string; description: string; is_public: boolean }): Promise<Collection> {
    try {
      const result = await this.apiService.post<Collection>('/dashboard/collections/', data).toPromise();
      if (!result) {
        throw new Error('No collection result received');
      }
      return result;
    } catch (error) {
      console.error('Failed to create collection:', error);
      throw error;
    }
  }

  async updateCollection(id: number, data: Partial<Collection>): Promise<Collection> {
    try {
      const result = await this.apiService.patch<Collection>(`/dashboard/collections/${id}/`, data).toPromise();
      if (!result) {
        throw new Error('No collection update result received');
      }
      return result;
    } catch (error) {
      console.error('Failed to update collection:', error);
      throw error;
    }
  }

  async deleteCollection(id: number): Promise<void> {
    try {
      await this.apiService.delete<void>(`/dashboard/collections/${id}/`).toPromise();
    } catch (error) {
      console.error('Failed to delete collection:', error);
      throw error;
    }
  }

  async addRecipeToCollections(recipeId: number, collectionIds: number[]): Promise<void> {
    try {
      await this.apiService.post<void>('/dashboard/collections/add-recipe/', {
        recipe_id: recipeId,
        collection_ids: collectionIds
      }).toPromise();
    } catch (error) {
      console.error('Failed to add recipe to collections:', error);
      throw error;
    }
  }

  async removeRecipeFromCollection(collectionId: number, recipeId: number): Promise<void> {
    try {
      await this.apiService.delete<void>(`/dashboard/collections/${collectionId}/recipes/${recipeId}/`).toPromise();
    } catch (error) {
      console.error('Failed to remove recipe from collection:', error);
      throw error;
    }
  }

  async bulkAddRecipesToCollections(recipeIds: number[], collectionIds: number[]): Promise<void> {
    try {
      await this.apiService.post<void>('/dashboard/collections/bulk-add/', {
        recipe_ids: recipeIds,
        collection_ids: collectionIds
      }).toPromise();
    } catch (error) {
      console.error('Failed to bulk add recipes to collections:', error);
      throw error;
    }
  }

  async getCollectionRecipes(collectionId: number, params?: any): Promise<Recipe[]> {
    try {
      const queryParams = params ? this.apiService.buildParams(params) : undefined;
      const result = await this.apiService.get<Recipe[]>(`/dashboard/collections/${collectionId}/recipes/`, queryParams).toPromise();
      if (!result) {
        throw new Error('No collection recipes data received');
      }
      return result;
    } catch (error) {
      console.error('Failed to load collection recipes:', error);
      throw error;
    }
  }

  // Observable methods
  getUserCollectionsObservable(limit?: number): Observable<Collection[]> {
    const params = limit ? this.apiService.buildParams({ limit }) : undefined;
    return this.apiService.get<Collection[]>('/dashboard/collections/', params);
  }

  createCollectionObservable(data: { name: string; description: string; is_public: boolean }): Observable<Collection> {
    return this.apiService.post<Collection>('/dashboard/collections/', data);
  }

  // Helper methods
  getCollectionTypeIcon(collection: Collection): string {
    if (collection.is_public) {
      return 'public';
    }
    return 'folder';
  }

  getCollectionTypeLabel(collection: Collection): string {
    return collection.is_public ? 'Public Collection' : 'Private Collection';
  }
}