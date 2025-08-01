import { Component, OnInit, OnDestroy } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule, ReactiveFormsModule, FormBuilder, FormGroup, Validators } from '@angular/forms';
import { ActivatedRoute, Router } from '@angular/router';
import { MaterialModule } from '../../../../shared/material.module';
import { LoadingComponent } from '../../../../shared/components/loading/loading.component';
import { StarRatingComponent } from '../../../../shared/components/star-rating/star-rating.component';

import { CollectionsService } from '../../services/collections.service';
import { Collection } from '../../models/dashboard-data.model';
import { Recipe } from '../../../../shared/models/recipe.models';

import { Subject } from 'rxjs';
import { takeUntil } from 'rxjs/operators';

@Component({
  selector: 'app-collections-detail',
  standalone: true,
  imports: [
    CommonModule, 
    FormsModule, 
    ReactiveFormsModule,
    MaterialModule, 
    LoadingComponent,
    StarRatingComponent
  ],
  templateUrl: './collections-detail.component.html',
  styleUrls: ['./collections-detail.component.scss']
})
export class CollectionsDetailComponent implements OnInit, OnDestroy {
  collections: Collection[] = [];
  selectedCollection: Collection | null = null;
  collectionRecipes: Recipe[] = [];
  
  isLoading = false;
  isCreatingCollection = false;
  isEditingCollection = false;
  viewMode: 'grid' | 'list' = 'grid';
  
  collectionForm: FormGroup;
  
  private destroy$ = new Subject<void>();
  
  constructor(
    private collectionsService: CollectionsService,
    private route: ActivatedRoute,
    private router: Router,
    private fb: FormBuilder
  ) {
    this.collectionForm = this.fb.group({
      name: ['', [Validators.required, Validators.minLength(2), Validators.maxLength(50)]],
      description: ['', [Validators.maxLength(200)]],
      is_public: [false]
    });
  }
  
  async ngOnInit(): Promise<void> {
    await this.loadCollections();
    
    // Check if we have a collection ID in the route
    this.route.params.pipe(takeUntil(this.destroy$)).subscribe(params => {
      if (params['id']) {
        this.selectCollectionById(params['id']);
      } else if (this.collections.length > 0) {
        this.selectCollection(this.collections[0]);
      }
    });
  }

  ngOnDestroy(): void {
    this.destroy$.next();
    this.destroy$.complete();
  }
  
  private async loadCollections(): Promise<void> {
    this.isLoading = true;
    
    try {
      this.collections = await this.collectionsService.getUserCollections().catch(() => this.getMockCollections());
    } catch (error) {
      console.error('Failed to load collections:', error);
      this.collections = this.getMockCollections();
    } finally {
      this.isLoading = false;
    }
  }

  private getMockCollections(): Collection[] {
    return [
      {
        id: 1,
        name: 'Weekend Favorites',
        description: 'Recipes perfect for weekend cooking',
        recipe_count: 8,
        is_public: false,
        created_at: '2024-01-15',
        updated_at: '2024-01-15'
      },
      {
        id: 2,
        name: 'Quick & Easy',
        description: 'Fast recipes for busy weekdays',
        recipe_count: 12,
        is_public: true,
        created_at: '2024-02-01',
        updated_at: '2024-02-01'
      },
      {
        id: 3,
        name: 'Healthy Options',
        description: 'Nutritious and delicious recipes',
        recipe_count: 6,
        is_public: false,
        created_at: '2024-02-15',
        updated_at: '2024-02-15'
      }
    ];
  }

  private getMockRecipes(): Recipe[] {
    return [
      {
        id: '1',
        title: 'Chocolate Chip Cookies',
        description: 'Classic homemade chocolate chip cookies',
        slug: 'chocolate-chip-cookies',
        ingredients: [],
        instructions: [],
        prep_time: 15,
        cook_time: 12,
        total_time: 27,
        servings: 24,
        difficulty: 'easy',
        cooking_method: 'baking',
        tags: ['dessert', 'cookies'],
        images: [],
        categories: [],
        author: { id: '1', username: 'user', firstName: 'John', lastName: 'Doe' },
        rating_stats: { average_rating: 4.5, total_ratings: 8, rating_distribution: { 5: 5, 4: 2, 3: 1, 2: 0, 1: 0 } },
        created_at: '2024-01-15',
        updated_at: '2024-01-15'
      },
      {
        id: '2',
        title: 'Vegetarian Pasta Salad',
        description: 'Fresh and colorful pasta salad with vegetables',
        slug: 'vegetarian-pasta-salad',
        ingredients: [],
        instructions: [],
        prep_time: 20,
        cook_time: 10,
        total_time: 30,
        servings: 6,
        difficulty: 'easy',
        cooking_method: 'no-cook',
        tags: ['vegetarian', 'salad'],
        images: [],
        categories: [],
        author: { id: '1', username: 'user', firstName: 'John', lastName: 'Doe' },
        rating_stats: { average_rating: 4.2, total_ratings: 5, rating_distribution: { 5: 2, 4: 2, 3: 1, 2: 0, 1: 0 } },
        created_at: '2024-02-01',
        updated_at: '2024-02-01'
      }
    ];
  }
  
  private async selectCollectionById(id: string): Promise<void> {
    const collection = this.collections.find(c => c.id.toString() === id);
    if (collection) {
      await this.selectCollection(collection);
    }
  }
  
  async selectCollection(collection: Collection): Promise<void> {
    this.selectedCollection = collection;
    
    // Update URL without triggering navigation
    this.router.navigate(['/dashboard/collections', collection.id], { replaceUrl: true });
    
    // Load recipes for this collection
    try {
      this.collectionRecipes = await this.collectionsService.getCollectionRecipes(collection.id).catch(() => this.getMockRecipes());
    } catch (error) {
      console.error('Failed to load collection recipes:', error);
      this.collectionRecipes = this.getMockRecipes();
    }
  }
  
  onCreateCollection(): void {
    this.isCreatingCollection = true;
    this.collectionForm.reset({
      name: '',
      description: '',
      is_public: false
    });
  }
  
  onEditCollection(): void {
    if (!this.selectedCollection) return;
    
    this.isEditingCollection = true;
    this.collectionForm.patchValue({
      name: this.selectedCollection.name,
      description: this.selectedCollection.description,
      is_public: this.selectedCollection.is_public
    });
  }
  
  async onSaveCollection(): Promise<void> {
    if (!this.collectionForm.valid) return;
    
    const formData = this.collectionForm.value;
    
    try {
      if (this.isCreatingCollection) {
        const newCollection = await this.collectionsService.createCollection(formData);
        this.collections.push(newCollection);
        await this.selectCollection(newCollection);
      } else if (this.isEditingCollection && this.selectedCollection) {
        const updatedCollection = await this.collectionsService.updateCollection(this.selectedCollection.id, formData);
        const index = this.collections.findIndex(c => c.id === updatedCollection.id);
        if (index !== -1) {
          this.collections[index] = updatedCollection;
          this.selectedCollection = updatedCollection;
        }
      }
      
      this.cancelCollectionEdit();
    } catch (error) {
      console.error('Failed to save collection:', error);
    }
  }
  
  cancelCollectionEdit(): void {
    this.isCreatingCollection = false;
    this.isEditingCollection = false;
    this.collectionForm.reset();
  }
  
  async onDeleteCollection(): Promise<void> {
    if (!this.selectedCollection) return;
    
    // In a real app, you'd show a confirmation dialog
    try {
      await this.collectionsService.deleteCollection(this.selectedCollection.id);
      this.collections = this.collections.filter(c => c.id !== this.selectedCollection!.id);
      
      if (this.collections.length > 0) {
        await this.selectCollection(this.collections[0]);
      } else {
        this.selectedCollection = null;
        this.collectionRecipes = [];
      }
    } catch (error) {
      console.error('Failed to delete collection:', error);
    }
  }
  
  async onRemoveRecipeFromCollection(recipe: Recipe): Promise<void> {
    if (!this.selectedCollection) return;
    
    try {
      await this.collectionsService.removeRecipeFromCollection(this.selectedCollection.id, Number(recipe.id));
      this.collectionRecipes = this.collectionRecipes.filter(r => r.id !== recipe.id);
      
      // Update collection recipe count
      if (this.selectedCollection) {
        this.selectedCollection.recipe_count = Math.max(0, this.selectedCollection.recipe_count - 1);
      }
    } catch (error) {
      console.error('Failed to remove recipe from collection:', error);
    }
  }
  
  onViewRecipe(recipe: Recipe): void {
    this.router.navigate(['/recipes', recipe.id]);
  }
  
  onViewModeChange(mode: 'grid' | 'list'): void {
    this.viewMode = mode;
  }

  getRecipeImageUrl(recipe: Recipe): string {
    return recipe.thumbnail_url || recipe.main_image_url || '/assets/images/recipe-placeholder.jpg';
  }

  getRecipeRating(recipe: Recipe): number {
    return recipe.rating_stats?.average_rating || 0;
  }

  getRecipeRatingCount(recipe: Recipe): number {
    return recipe.rating_stats?.total_ratings || 0;
  }
  
  trackByCollectionId(index: number, collection: Collection): number {
    return collection.id;
  }
  
  trackByRecipeId(index: number, recipe: Recipe): string {
    return recipe.id;
  }

  get hasCollections(): boolean {
    return this.collections && this.collections.length > 0;
  }

  get hasRecipes(): boolean {
    return this.collectionRecipes && this.collectionRecipes.length > 0;
  }
}