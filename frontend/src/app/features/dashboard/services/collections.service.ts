import { Injectable } from '@angular/core';
import { Observable, BehaviorSubject } from 'rxjs';
import { ApiService } from '../../../core/services/api.service';
import { AuthService } from '../../../core/services/auth.service';
import { Collection } from '../models/dashboard-data.model';
import { Recipe } from '../../../shared/models/recipe.models';

@Injectable({
  providedIn: 'root'
})
export class CollectionsService {
  private collectionsSubject = new BehaviorSubject<Collection[]>([]);
  public collections$ = this.collectionsSubject.asObservable();
  private collectionsCache: Collection[] = [];

  constructor(
    private apiService: ApiService,
    private authService: AuthService
  ) {
    this.loadCollectionsFromStorage();
  }

  async getUserCollections(limit?: number): Promise<Collection[]> {
    try {
      // Return cached collections
      let collections = [...this.collectionsCache];
      
      if (limit && limit > 0) {
        collections = collections.slice(0, limit);
      }

      return collections;
    } catch (error) {
      console.error('Failed to load user collections:', error);
      return [];
    }
  }

  async getCollection(id: number): Promise<Collection> {
    try {
      const collection = this.collectionsCache.find(c => c.id === id);
      if (!collection) {
        throw new Error(`Collection with id ${id} not found`);
      }
      return collection;
    } catch (error) {
      console.error('Failed to load collection:', error);
      throw error;
    }
  }

  async createCollection(data: { name: string; description: string; is_public: boolean }): Promise<Collection> {
    try {
      const currentUser = this.authService.getCurrentUser();
      if (!currentUser) {
        throw new Error('User not authenticated');
      }

      const newCollection: Collection = {
        id: Date.now(), // Simple ID generation
        name: data.name,
        description: data.description,
        is_public: data.is_public,
        recipe_count: 0,
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString(),
        recipes: []
      };

      this.collectionsCache.push(newCollection);
      this.saveCollectionsToStorage();
      this.collectionsSubject.next([...this.collectionsCache]);

      return newCollection;
    } catch (error) {
      console.error('Failed to create collection:', error);
      throw error;
    }
  }

  async updateCollection(id: number, data: Partial<Collection>): Promise<Collection> {
    try {
      const collectionIndex = this.collectionsCache.findIndex(c => c.id === id);
      if (collectionIndex === -1) {
        throw new Error(`Collection with id ${id} not found`);
      }

      const updatedCollection = {
        ...this.collectionsCache[collectionIndex],
        ...data,
        updated_at: new Date().toISOString()
      };

      this.collectionsCache[collectionIndex] = updatedCollection;
      this.saveCollectionsToStorage();
      this.collectionsSubject.next([...this.collectionsCache]);

      return updatedCollection;
    } catch (error) {
      console.error('Failed to update collection:', error);
      throw error;
    }
  }

  async deleteCollection(id: number): Promise<void> {
    try {
      const collectionIndex = this.collectionsCache.findIndex(c => c.id === id);
      if (collectionIndex === -1) {
        throw new Error(`Collection with id ${id} not found`);
      }

      this.collectionsCache.splice(collectionIndex, 1);
      this.saveCollectionsToStorage();
      this.collectionsSubject.next([...this.collectionsCache]);
    } catch (error) {
      console.error('Failed to delete collection:', error);
      throw error;
    }
  }

  async addRecipeToCollections(recipeId: string, collectionIds: number[]): Promise<void> {
    try {
      // Verify the recipe exists
      const recipe = await this.apiService.get<Recipe>(`/recipes/${recipeId}/`).toPromise();
      if (!recipe) {
        throw new Error('Recipe not found');
      }

      for (const collectionId of collectionIds) {
        await this.addRecipeToCollection(collectionId, recipeId);
      }
    } catch (error) {
      console.error('Failed to add recipe to collections:', error);
      throw error;
    }
  }

  async addRecipeToCollection(collectionId: number, recipeId: string): Promise<void> {
    try {
      // First, verify the recipe exists
      const recipe = await this.apiService.get<Recipe>(`/recipes/${recipeId}/`).toPromise();
      if (!recipe) {
        throw new Error('Recipe not found');
      }

      const collectionIndex = this.collectionsCache.findIndex(c => c.id === collectionId);
      if (collectionIndex === -1) {
        throw new Error(`Collection with id ${collectionId} not found`);
      }

      const collection = this.collectionsCache[collectionIndex];
      
      // Check if recipe is already in collection
      if (collection.recipes && !collection.recipes.some(r => r.id === recipeId)) {
        collection.recipes.push(recipe);
        collection.recipe_count = collection.recipes.length;
        collection.updated_at = new Date().toISOString();

        this.saveCollectionsToStorage();
        this.collectionsSubject.next([...this.collectionsCache]);
      }
    } catch (error) {
      console.error('Failed to add recipe to collection:', error);
      throw error;
    }
  }

  async removeRecipeFromCollection(collectionId: number, recipeId: string): Promise<void> {
    try {
      const collectionIndex = this.collectionsCache.findIndex(c => c.id === collectionId);
      if (collectionIndex === -1) {
        throw new Error(`Collection with id ${collectionId} not found`);
      }

      const collection = this.collectionsCache[collectionIndex];
      if (collection.recipes) {
        const recipeIndex = collection.recipes.findIndex(r => r.id === recipeId);
        
        if (recipeIndex > -1) {
          collection.recipes.splice(recipeIndex, 1);
          collection.recipe_count = collection.recipes.length;
          collection.updated_at = new Date().toISOString();

          this.saveCollectionsToStorage();
          this.collectionsSubject.next([...this.collectionsCache]);
        }
      }
    } catch (error) {
      console.error('Failed to remove recipe from collection:', error);
      throw error;
    }
  }

  async bulkAddRecipesToCollections(recipeIds: string[], collectionIds: number[]): Promise<void> {
    try {
      for (const collectionId of collectionIds) {
        for (const recipeId of recipeIds) {
          await this.addRecipeToCollection(collectionId, recipeId);
        }
      }
    } catch (error) {
      console.error('Failed to bulk add recipes to collections:', error);
      throw error;
    }
  }

  async getCollectionRecipes(collectionId: number, params?: any): Promise<Recipe[]> {
    try {
      const collection = await this.getCollection(collectionId);
      const recipes: Recipe[] = [];
      
      // Return recipes that are already stored in the collection
      if (collection.recipes) {
        recipes.push(...collection.recipes);
      }

      return recipes;
    } catch (error) {
      console.error('Failed to load collection recipes:', error);
      return [];
    }
  }

  // Local storage management
  private loadCollectionsFromStorage(): void {
    try {
      const currentUser = this.authService.getCurrentUser();
      if (!currentUser) return;

      const storageKey = `collections_${currentUser.id}`;
      const stored = localStorage.getItem(storageKey);
      
      if (stored) {
        this.collectionsCache = JSON.parse(stored);
      } else {
        // Create default collections for new users
        this.createDefaultCollections();
      }
      
      this.collectionsSubject.next([...this.collectionsCache]);
    } catch (error) {
      console.error('Failed to load collections from storage:', error);
      this.collectionsCache = [];
      this.createDefaultCollections();
    }
  }

  private saveCollectionsToStorage(): void {
    try {
      const currentUser = this.authService.getCurrentUser();
      if (!currentUser) return;

      const storageKey = `collections_${currentUser.id}`;
      localStorage.setItem(storageKey, JSON.stringify(this.collectionsCache));
    } catch (error) {
      console.error('Failed to save collections to storage:', error);
    }
  }

  private createDefaultCollections(): void {
    const currentUser = this.authService.getCurrentUser();
    if (!currentUser) return;

    const defaultCollections: Collection[] = [
      {
        id: 1,
        name: 'My Favorites',
        description: 'A collection of my favorite recipes',
        is_public: false,
        recipe_count: 0,
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString(),
        recipes: []
      },
      {
        id: 2,
        name: 'Quick Meals',
        description: 'Fast and easy recipes for busy days',
        is_public: true,
        recipe_count: 0,
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString(),
        recipes: []
      }
    ];

    this.collectionsCache = defaultCollections;
    this.saveCollectionsToStorage();
    this.collectionsSubject.next([...this.collectionsCache]);
  }

  // Get collections count for dashboard
  getCollectionsCount(): number {
    return this.collectionsCache.length;
  }

  // Observable methods
  getUserCollectionsObservable(limit?: number): Observable<Collection[]> {
    return new Observable(observer => {
      this.getUserCollections(limit).then(collections => {
        observer.next(collections);
        observer.complete();
      }).catch(error => {
        observer.error(error);
      });
    });
  }

  createCollectionObservable(data: { name: string; description: string; is_public: boolean }): Observable<Collection> {
    return new Observable(observer => {
      this.createCollection(data).then(collection => {
        observer.next(collection);
        observer.complete();
      }).catch(error => {
        observer.error(error);
      });
    });
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

  // Clear collections cache
  clearCache(): void {
    this.collectionsCache = [];
    this.collectionsSubject.next([]);
    const currentUser = this.authService.getCurrentUser();
    if (currentUser) {
      const storageKey = `collections_${currentUser.id}`;
      localStorage.removeItem(storageKey);
    }
  }
}