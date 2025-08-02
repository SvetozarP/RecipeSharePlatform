import { Component, OnInit, inject, signal, computed, Inject, OnDestroy } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { ActivatedRoute, Router, RouterModule } from '@angular/router';
import { MaterialModule } from '../../../shared/material.module';
import { RecipeService } from '../../../core/services/recipe.service';
import { AuthService } from '../../../core/services/auth.service';
import { Recipe, Rating, RatingListItem, RatingCreate, RatingUpdate } from '../../../shared/models/recipe.models';
import { StarRatingComponent, ReviewDisplayComponent, RatingFormComponent } from '../../../shared/components';
import { catchError, finalize } from 'rxjs/operators';
import { of, Subject } from 'rxjs';
import { MatDialog, MatDialogRef, MAT_DIALOG_DATA } from '@angular/material/dialog';
import { MatSnackBar } from '@angular/material/snack-bar';
import { RecipeViewsService } from '../../dashboard/services/recipe-views.service';

@Component({
  selector: 'app-recipe-detail',
  standalone: true,
  imports: [CommonModule, FormsModule, MaterialModule, RouterModule, StarRatingComponent, ReviewDisplayComponent, RatingFormComponent],
  template: `
    <div class="container mx-auto px-4 py-8">
      <!-- Loading State -->
      <div *ngIf="loading()" class="flex justify-center items-center min-h-[400px]">
        <mat-spinner diameter="40"></mat-spinner>
      </div>

      <!-- Error State -->
      <div *ngIf="error()" class="text-center py-8">
        <mat-icon class="text-gray-400 text-6xl mb-4">error_outline</mat-icon>
        <h2 class="text-xl font-semibold text-gray-600 mb-2">Recipe Not Found</h2>
        <p class="text-gray-500 mb-4">{{ error() }}</p>
        <button mat-raised-button color="primary" (click)="goBack()">
          <mat-icon>arrow_back</mat-icon>
          Go Back
        </button>
      </div>

      <!-- Recipe Content -->
      <div *ngIf="recipe() && !loading()" class="space-y-6">
        <!-- Header Section -->
        <div class="bg-white rounded-lg shadow-sm p-6">
          <div class="flex justify-between items-start mb-4">
            <div class="flex-1">
              <div class="flex items-center gap-2 mb-2">
                <button mat-icon-button (click)="goBack()" class="text-gray-600">
                  <mat-icon>arrow_back</mat-icon>
                </button>
                <nav class="text-sm text-gray-500">
                  <a routerLink="/recipes" class="hover:text-primary">Recipes</a>
                  <span class="mx-2">/</span>
                  <span>{{ recipe()?.title }}</span>
                </nav>
              </div>
              
              <h1 class="text-3xl font-bold text-gray-900 mb-2">{{ recipe()?.title }}</h1>
              <p class="text-gray-600 text-lg mb-4">{{ recipe()?.description }}</p>
              
              <!-- Author and Meta Info -->
              <div class="flex flex-wrap items-center gap-4 text-sm text-gray-600">
                <div class="flex items-center gap-2">
                  <mat-icon class="text-lg flex-shrink-0">person</mat-icon>
                  <span>{{ recipe()?.author?.firstName }} {{ recipe()?.author?.lastName }}</span>
                </div>
                <div class="flex items-center gap-2">
                  <mat-icon class="text-lg flex-shrink-0">schedule</mat-icon>
                  <span>{{ recipe()?.total_time }} minutes</span>
                </div>
                <div class="flex items-center gap-2">
                  <mat-icon class="text-lg flex-shrink-0">restaurant</mat-icon>
                  <span>{{ recipe()?.servings }} servings</span>
                </div>
                <div class="flex items-center gap-2">
                  <mat-icon class="text-lg flex-shrink-0">trending_up</mat-icon>
                  <span class="capitalize">{{ recipe()?.difficulty }}</span>
                </div>
              </div>
            </div>
            
            <!-- Action Buttons -->
            <div class="flex flex-col gap-3 ml-4">
              <!-- General Actions -->
              <div class="flex gap-2">
                <button *ngIf="isAuthenticated$ | async" mat-icon-button (click)="toggleFavorite()" 
                        [class.text-red-500]="recipe()?.is_favorited"
                        matTooltip="{{ recipe()?.is_favorited ? 'Remove from favorites' : 'Add to favorites' }}"
                        class="w-10 h-10 flex items-center justify-center">
                  <mat-icon class="text-xl">{{ recipe()?.is_favorited ? 'favorite' : 'favorite_border' }}</mat-icon>
                </button>
                <button mat-icon-button (click)="shareRecipe()" matTooltip="Share recipe"
                        class="w-10 h-10 flex items-center justify-center">
                  <mat-icon class="text-xl">share</mat-icon>
                </button>
                <button mat-icon-button (click)="printRecipe()" matTooltip="Print recipe"
                        class="w-10 h-10 flex items-center justify-center">
                  <mat-icon class="text-xl">print</mat-icon>
                </button>
              </div>
              
              <!-- Owner Actions -->
              <div *ngIf="canEditRecipe() || canDeleteRecipe()" class="flex gap-2 border-t pt-3">
                <button *ngIf="canEditRecipe()" mat-raised-button color="primary" (click)="editRecipe()" 
                        class="flex items-center gap-2 px-4 py-2">
                  <mat-icon class="text-lg">edit</mat-icon>
                  <span>Edit Recipe</span>
                </button>
                <button *ngIf="canDeleteRecipe()" mat-raised-button color="warn" (click)="deleteRecipe()" 
                        class="flex items-center gap-2 px-4 py-2"
                        matTooltip="Delete this recipe permanently">
                  <mat-icon class="text-lg">delete</mat-icon>
                  <span>Delete</span>
                </button>
              </div>
            </div>
          </div>

          <!-- Rating Display -->
          <div *ngIf="recipe()?.rating_stats" class="flex items-center gap-2 mb-4">
            <div class="flex items-center gap-2">
              <div class="flex">
                <mat-icon *ngFor="let star of getStarArray(recipe()?.rating_stats?.average_rating || 0)" 
                         class="text-yellow-400 text-lg flex-shrink-0">{{ star }}</mat-icon>
              </div>
              <span class="font-semibold">{{ recipe()?.rating_stats?.average_rating | number:'1.1-1' }}</span>
              <span class="text-gray-500">({{ recipe()?.rating_stats?.total_ratings }} reviews)</span>
            </div>
          </div>

          <!-- Categories and Tags -->
          <div class="flex flex-wrap gap-2">
            <mat-chip-set *ngIf="recipe()?.categories?.length">
              <mat-chip *ngFor="let category of recipe()?.categories" class="bg-blue-100 text-blue-800">
                {{ category.name }}
              </mat-chip>
            </mat-chip-set>
            <mat-chip-set *ngIf="recipe()?.tags?.length">
              <mat-chip *ngFor="let tag of recipe()?.tags" class="bg-gray-100 text-gray-700">
                #{{ tag }}
              </mat-chip>
            </mat-chip-set>
          </div>
        </div>

        <!-- Image Gallery Section -->
        <div *ngIf="recipe()?.images?.length" class="bg-white rounded-lg shadow-sm overflow-hidden">
          <div class="relative">
            <!-- Main Image -->
            <img [src]="currentImage().image" 
                 [alt]="currentImage().alt_text || recipe()?.title"
                 class="w-full h-96 object-cover">
            
            <!-- Image Navigation -->
            <button *ngIf="recipeImages().length > 1" 
                    mat-fab class="absolute left-4 top-1/2 -translate-y-1/2" 
                    color="primary" size="mini"
                    (click)="previousImage()">
              <mat-icon>chevron_left</mat-icon>
            </button>
            <button *ngIf="recipeImages().length > 1" 
                    mat-fab class="absolute right-4 top-1/2 -translate-y-1/2" 
                    color="primary" size="mini"
                    (click)="nextImage()">
              <mat-icon>chevron_right</mat-icon>
            </button>
            
            <!-- Image Counter -->
            <div *ngIf="recipeImages().length > 1" 
                 class="absolute bottom-4 right-4 bg-black bg-opacity-50 text-white px-3 py-1 rounded">
              {{ currentImageIndex() + 1 }} / {{ recipeImages().length }}
            </div>
          </div>
          
          <!-- Thumbnail Gallery -->
          <div *ngIf="recipeImages().length > 1" class="p-4">
            <div class="flex gap-2 overflow-x-auto">
              <img *ngFor="let image of recipeImages(); let i = index" 
                   [src]="image.image"
                   [alt]="image.alt_text || recipe()?.title"
                   class="w-16 h-16 object-cover rounded cursor-pointer border-2"
                   [class.border-primary]="i === currentImageIndex()"
                   [class.border-gray-200]="i !== currentImageIndex()"
                   (click)="setCurrentImage(i)">
            </div>
          </div>
        </div>

        <!-- Recipe Details Grid -->
        <div class="grid lg:grid-cols-3 gap-6">
          <!-- Left Column: Ingredients and Instructions -->
          <div class="lg:col-span-2 space-y-6">
            <!-- Ingredients -->
            <mat-card>
              <mat-card-header>
                <mat-card-title class="flex items-center gap-2">
                  <!-- <mat-icon>shopping_list</mat-icon> -->
                  Ingredients
                </mat-card-title>
              </mat-card-header>
              <mat-card-content>
                <div class="space-y-2">
                  <div *ngFor="let ingredient of recipeIngredients(); let i = index" 
                       class="flex items-start gap-3 p-2 hover:bg-gray-50 rounded ingredient-item">
                    <mat-checkbox [(ngModel)]="checkedIngredients[i]" class="mt-0.5 flex-shrink-0"></mat-checkbox>
                    <span [class.line-through]="checkedIngredients[i]" 
                          [class.text-gray-500]="checkedIngredients[i]"
                          class="flex-1 leading-relaxed recipe-text">
                      {{ ingredient }}
                    </span>
                  </div>
                </div>
              </mat-card-content>
            </mat-card>

            <!-- Instructions -->
            <mat-card>
              <mat-card-header>
                <mat-card-title class="flex items-center gap-2">
                  <mat-icon class="flex-shrink-0">list_alt</mat-icon>
                  Instructions
                </mat-card-title>
              </mat-card-header>
              <mat-card-content>
                <div class="space-y-4">
                  <div *ngFor="let instruction of recipe()?.instructions; let i = index" 
                       class="flex gap-4">
                    <div class="flex-shrink-0 w-8 h-8 bg-primary text-white rounded-full flex items-center justify-center text-sm font-semibold">
                      {{ i + 1 }}
                    </div>
                    <p class="flex-1 pt-1 leading-relaxed recipe-text">{{ instruction }}</p>
                  </div>
                </div>
              </mat-card-content>
            </mat-card>
          </div>

          <!-- Right Column: Recipe Info -->
          <div class="space-y-6">
            <!-- Timing Information -->
            <mat-card>
              <mat-card-header>
                <mat-card-title class="flex items-center gap-2">
                  <mat-icon class="flex-shrink-0">schedule</mat-icon>
                  Timing
                </mat-card-title>
              </mat-card-header>
              <mat-card-content>
                <div class="space-y-3">
                  <div class="flex justify-between">
                    <span class="text-gray-600">Prep Time:</span>
                    <span class="font-semibold">{{ recipe()?.prep_time }} min</span>
                  </div>
                  <div class="flex justify-between">
                    <span class="text-gray-600">Cook Time:</span>
                    <span class="font-semibold">{{ recipe()?.cook_time }} min</span>
                  </div>
                  <div class="flex justify-between border-t pt-3">
                    <span class="text-gray-600">Total Time:</span>
                    <span class="font-semibold text-primary">{{ recipe()?.total_time }} min</span>
                  </div>
                </div>
              </mat-card-content>
            </mat-card>

            <!-- Recipe Details -->
      <mat-card>
        <mat-card-header>
                <mat-card-title class="flex items-center gap-2">
                  <mat-icon class="flex-shrink-0">info</mat-icon>
                  Details
                </mat-card-title>
              </mat-card-header>
              <mat-card-content>
                <div class="space-y-3">
                  <div class="flex justify-between">
                    <span class="text-gray-600">Servings:</span>
                    <span class="font-semibold">{{ recipe()?.servings }}</span>
                  </div>
                  <div class="flex justify-between">
                    <span class="text-gray-600">Difficulty:</span>
                    <span class="font-semibold capitalize">{{ recipe()?.difficulty }}</span>
                  </div>
                  <div *ngIf="recipe()?.cooking_method" class="flex justify-between">
                    <span class="text-gray-600">Method:</span>
                    <span class="font-semibold capitalize">{{ recipe()?.cooking_method }}</span>
                  </div>
                  <div *ngIf="recipe()?.cuisine_type" class="flex justify-between">
                    <span class="text-gray-600">Cuisine:</span>
                    <span class="font-semibold capitalize">{{ recipe()?.cuisine_type }}</span>
                  </div>
                </div>
              </mat-card-content>
            </mat-card>



            <!-- Nutrition Information -->
            <mat-card *ngIf="recipe()?.nutrition_info">
              <mat-card-header>
                <mat-card-title class="flex items-center gap-2">
                  <mat-icon class="flex-shrink-0">nutrition</mat-icon>
                  Nutrition (per serving)
                </mat-card-title>
        </mat-card-header>
        <mat-card-content>
                <div class="space-y-2">
                  <div *ngIf="recipe()?.nutrition_info?.calories" class="flex justify-between">
                    <span class="text-gray-600">Calories:</span>
                    <span class="font-semibold">{{ recipe()?.nutrition_info?.calories }}</span>
                  </div>
                  <div *ngIf="recipe()?.nutrition_info?.protein" class="flex justify-between">
                    <span class="text-gray-600">Protein:</span>
                    <span class="font-semibold">{{ recipe()?.nutrition_info?.protein }}g</span>
                  </div>
                  <div *ngIf="recipe()?.nutrition_info?.carbs" class="flex justify-between">
                    <span class="text-gray-600">Carbs:</span>
                    <span class="font-semibold">{{ recipe()?.nutrition_info?.carbs }}g</span>
                  </div>
                  <div *ngIf="recipe()?.nutrition_info?.fat" class="flex justify-between">
                    <span class="text-gray-600">Fat:</span>
                    <span class="font-semibold">{{ recipe()?.nutrition_info?.fat }}g</span>
                  </div>
                </div>
        </mat-card-content>
      </mat-card>
    </div>
        </div>

        <!-- Ratings and Reviews Section -->
        <div class="bg-white rounded-lg shadow-sm p-6">
          <div class="mb-6">
            <h2 class="text-2xl font-bold text-gray-900 mb-4 flex items-center gap-2">
              <mat-icon class="flex-shrink-0">star</mat-icon>
              Ratings & Reviews
            </h2>
            
            <!-- Rating Statistics -->
            <div *ngIf="recipe()?.rating_stats" class="rating-stats mb-6 p-4 bg-gray-50 rounded-lg">
              <div class="flex items-center justify-between mb-4">
                <div class="flex items-center gap-4">
                  <div class="text-center">
                    <div class="text-3xl font-bold text-gray-900">{{ recipe()?.rating_stats?.average_rating | number:'1.1-1' }}</div>
                    <app-star-rating 
                      [value]="recipe()?.rating_stats?.average_rating || 0" 
                      [interactive]="false"
                      [size]="20">
                    </app-star-rating>
                    <div class="text-sm text-gray-600 mt-1">{{ recipe()?.rating_stats?.total_ratings }} reviews</div>
                  </div>
                </div>
                
                <!-- Rating Distribution -->
                <div class="flex-1 max-w-md ml-8">
                  <div *ngFor="let star of [5,4,3,2,1]" class="flex items-center gap-2 mb-1">
                    <span class="text-sm w-6 flex-shrink-0">{{ star }}</span>
                    <mat-icon class="text-yellow-400 text-sm flex-shrink-0">star</mat-icon>
                    <div class="flex-1 bg-gray-200 rounded-full h-2">
                      <div 
                        class="bg-yellow-400 h-2 rounded-full transition-all duration-300"
                        [style.width.%]="getRatingPercentage(star)">
                      </div>
                    </div>
                    <span class="text-sm text-gray-600 w-8 flex-shrink-0">{{ getRatingCount(star) }}</span>
                  </div>
                </div>
              </div>
            </div>
          </div>

          <!-- Rating Form -->
          <div class="mb-8">
            <app-rating-form
              [recipeId]="recipe()?.id || ''"
              [isOwnRecipe]="isOwnRecipe()"
              [existingRating]="currentUserRating() || undefined"
              [showCancelButton]="showRatingForm()"
              (ratingSubmitted)="onRatingSubmitted($event)"
              (ratingDeleted)="onRatingDeleted()"
              (cancelled)="onRatingFormCancelled()">
            </app-rating-form>
          </div>

          <!-- Reviews Display -->
          <div>
            <app-review-display
              [reviews]="reviews()"
              [loading]="reviewsLoading()"
              [loadingMore]="reviewsLoadingMore()"
              [hasMore]="reviewsHasMore()"
              [totalCount]="reviewsTotalCount()"
              [sortBy]="reviewsSortBy()"
              [currentUserReview]="currentUserRatingListItem()"
              [isRecipeAuthor]="isOwnRecipe()"
              (sortChange)="onReviewsSortChange($event)"
              (loadMore)="onLoadMoreReviews()"
              (markHelpful)="onMarkReviewHelpful($event)"
              (editReview)="onEditReview($event)"
              (deleteReview)="onDeleteReview($event)">
            </app-review-display>
          </div>
        </div>

        <!-- Browse More Recipes -->
        <div class="bg-white rounded-lg shadow-sm p-6">
          <div class="flex justify-center">
            <a routerLink="/recipes" mat-raised-button color="primary">
              <mat-icon class="flex-shrink-0">view_list</mat-icon>
              Browse More Recipes
            </a>
          </div>
        </div>
      </div>
    </div>

    <!-- Print-friendly version (hidden by default) -->
    <div class="print-only">
      <div *ngIf="recipe()" class="max-w-4xl mx-auto p-8">
        <h1 class="text-2xl font-bold mb-4">{{ recipe()?.title }}</h1>
        <p class="mb-4">{{ recipe()?.description }}</p>
        
        <div class="grid grid-cols-2 gap-8 mb-8">
          <div>
            <h2 class="text-lg font-semibold mb-3">Ingredients</h2>
            <ul class="space-y-1">
              <li *ngFor="let ingredient of recipeIngredients()">• {{ ingredient }}</li>
            </ul>
          </div>
          
          <div>
            <h2 class="text-lg font-semibold mb-3">Recipe Info</h2>
            <div class="space-y-1 text-sm">
              <div><strong>Prep Time:</strong> {{ recipe()?.prep_time }} minutes</div>
              <div><strong>Cook Time:</strong> {{ recipe()?.cook_time }} minutes</div>
              <div><strong>Total Time:</strong> {{ recipe()?.total_time }} minutes</div>
              <div><strong>Servings:</strong> {{ recipe()?.servings }}</div>
              <div><strong>Difficulty:</strong> {{ recipe()?.difficulty }}</div>
            </div>
          </div>
        </div>
        
        <div>
          <h2 class="text-lg font-semibold mb-3">Instructions</h2>
          <ol class="space-y-2">
            <li *ngFor="let instruction of recipe()?.instructions; let i = index">
              <strong>{{ i + 1 }}.</strong> {{ instruction }}
            </li>
          </ol>
        </div>
      </div>
    </div>
  `,
  styles: [`
    @media print {
      .print-only { display: block !important; }
      .container { display: none !important; }
    }
    
    .print-only {
      display: none;
    }

    mat-chip {
      margin: 2px;
    }

    .star-rating {
      color: #ffd700;
    }

    /* Fix icon spacing and prevent overlapping */
    mat-icon {
      display: inline-flex;
      align-items: center;
      justify-content: center;
    }

    /* Ensure proper spacing for action buttons */
    .mat-mdc-icon-button {
      min-width: 40px;
      min-height: 40px;
    }

    /* Improve ingredient list spacing */
    .ingredient-item {
      min-height: 24px;
    }

    /* Ensure proper text wrapping */
    .recipe-text {
      word-wrap: break-word;
      overflow-wrap: break-word;
    }
  `]
})
export class RecipeDetailComponent implements OnInit, OnDestroy {
  private route = inject(ActivatedRoute);
  private router = inject(Router);
  private recipeService = inject(RecipeService);
  private authService = inject(AuthService);
  private dialog = inject(MatDialog);
  private snackBar = inject(MatSnackBar);
  private recipeViewsService = inject(RecipeViewsService);
  private destroy$ = new Subject<void>();
  private viewStartTime = Date.now();
  private isDeleting = false;

  // Authentication state
  isAuthenticated$ = this.authService.isAuthenticated$;

  // Signals for reactive state management
  recipe = signal<Recipe | null>(null);
  loading = signal(false);
  error = signal<string | null>(null);
  currentImageIndex = signal(0);

  // Computed values
  recipeImages = computed(() => {
    const recipe = this.recipe();
    // Handle different image formats from backend
    if (Array.isArray(recipe?.images) && recipe.images.length > 0) {
      return recipe.images;
    }
    
    // Fallback to thumbnail_url if images array is empty but thumbnail exists
    if (recipe?.thumbnail_url) {
      return [{
        id: 1,
        image: recipe.thumbnail_url,
        alt_text: recipe.title || 'Recipe image',
        is_primary: true,
        ordering: 0
      }];
    }
    
    return [];
  });

  currentImage = computed(() => {
    const images = this.recipeImages();
    return images[this.currentImageIndex()] || { image: '', alt_text: '', is_primary: true, ordering: 0, id: 0 };
  });

  recipeIngredients = computed(() => {
    const recipe = this.recipe();
    if (!recipe?.ingredients) return [];
    
    // Handle both string and structured ingredient formats
    return recipe.ingredients.map(ingredient => {
      if (typeof ingredient === 'string') {
        return ingredient;
      } else {
        return `${ingredient.amount} ${ingredient.name}`;
      }
    });
  });

  // Component state
  checkedIngredients: boolean[] = [];
  private cameFromEdit = false;

  // Rating and Reviews state
  currentUserRating = signal<Rating | null>(null);
  reviews = signal<RatingListItem[]>([]);
  reviewsLoading = signal(false);
  reviewsLoadingMore = signal(false);
  reviewsHasMore = signal(false);
  reviewsTotalCount = signal(0);
  reviewsSortBy = signal('-created_at');
  editingReview = signal(false);
  showRatingFormSignal = signal(false);
  private currentReviewsPage = 1;

  // Computed properties for ratings and reviews
  isOwnRecipe = computed(() => {
    const recipe = this.recipe();
    const currentUser = this.authService.getCurrentUser();
    
    if (!recipe || !currentUser || !recipe.author || !recipe.author.id) {
      return false;
    }
    
    const recipeAuthorId = recipe.author.id.toString();
    const currentUserId = currentUser.id.toString();
    
    return recipeAuthorId === currentUserId;
  });

  showRatingForm = computed(() => {
    return this.showRatingFormSignal() || this.editingReview();
  });

  currentUserRatingListItem = computed(() => {
    const rating = this.currentUserRating();
    if (!rating) return undefined;
    
    const currentUser = this.authService.getCurrentUser();
    return {
      id: rating.id,
      rating: rating.rating,
      review: rating.review,
      user_name: currentUser?.firstName + ' ' + currentUser?.lastName || 'You',
      star_display: rating.star_display || '',
      helpful_count: rating.helpful_count,
      is_verified_purchase: rating.is_verified_purchase,
      created_at: rating.created_at
    } as RatingListItem;
  });
  
  ngOnInit(): void {
    this.route.params.subscribe(params => {
      const idOrSlug = params['id'];
      if (idOrSlug) {
        this.loadRecipe(idOrSlug);
      }
    });

    // Check if we came from edit and clean the URL
    this.route.queryParams.subscribe(queryParams => {
      if (queryParams['fromEdit']) {
        this.cameFromEdit = true;
        // Remove the query parameter from URL without affecting navigation
        this.router.navigate([], {
          relativeTo: this.route,
          queryParams: {},
          replaceUrl: true
        });
      }
    });
  }

  ngOnDestroy(): void {
    // Record view duration when component is destroyed
    // Skip recording if recipe is being deleted
    if (this.recipe() && !this.isDeleting) {
      const viewDuration = Math.floor((Date.now() - this.viewStartTime) / 1000);
      this.recipeViewsService.recordView(this.recipe()!.id, viewDuration).catch(error => {
        console.error('Failed to record recipe view:', error);
      });
    }
    
    this.destroy$.next();
    this.destroy$.complete();
  }

  private loadRecipe(idOrSlug: string): void {
    this.loading.set(true);
    this.error.set(null);

    this.recipeService.getRecipe(idOrSlug).pipe(
      catchError((error) => {
        this.error.set(error.error?.detail || 'Recipe not found');
        return of(null);
      }),
      finalize(() => this.loading.set(false))
    ).subscribe(recipe => {
      if (recipe) {
        this.recipe.set(recipe);
        const ingredients = recipe.ingredients || [];
        this.checkedIngredients = new Array(ingredients.length).fill(false);
        
        // Set primary image as current or first image
        const images = this.recipeImages();
        const primaryIndex = images.findIndex(img => img.is_primary);
        this.currentImageIndex.set(primaryIndex >= 0 ? primaryIndex : 0);

        // Load rating and review data
        this.loadCurrentUserRating(recipe.id);
        this.loadReviews(recipe.id);
      }
    });
  }

  // Image gallery methods
  nextImage(): void {
    const images = this.recipeImages();
    if (images.length > 1) {
      this.currentImageIndex.set((this.currentImageIndex() + 1) % images.length);
    }
  }

  previousImage(): void {
    const images = this.recipeImages();
    if (images.length > 1) {
      const newIndex = this.currentImageIndex() - 1;
      this.currentImageIndex.set(newIndex < 0 ? images.length - 1 : newIndex);
    }
  }

  setCurrentImage(index: number): void {
    this.currentImageIndex.set(index);
  }

  // Rating and Review methods
  private loadCurrentUserRating(recipeId: string): void {
    if (!this.authService.isAuthenticated()) {
      return;
    }

    this.recipeService.getMyRatingForRecipe(recipeId).subscribe({
      next: (rating) => {
        this.currentUserRating.set(rating);
      },
      error: (error) => {
        console.error('Error loading user rating:', error);
      }
    });
  }

  private loadReviews(recipeId: string, append = false): void {
    this.reviewsLoading.set(!append);
    if (append) {
      this.reviewsLoadingMore.set(true);
    }

    const page = append ? this.currentReviewsPage + 1 : 1;
    
    this.recipeService.getRecipeRatings(recipeId, {
      page,
      page_size: 10,
      ordering: this.reviewsSortBy()
    }).subscribe({
      next: (response) => {
        if (append) {
          this.reviews.set([...this.reviews(), ...response.results]);
          this.currentReviewsPage++;
        } else {
          this.reviews.set(response.results);
          this.currentReviewsPage = 1;
        }
        
        this.reviewsTotalCount.set(response.count);
        this.reviewsHasMore.set(!!response.next);
      },
      error: (error) => {
        console.error('Error loading reviews:', error);
        this.snackBar.open('Failed to load reviews', 'Close', { duration: 3000 });
      },
      complete: () => {
        this.reviewsLoading.set(false);
        this.reviewsLoadingMore.set(false);
      }
    });
  }

  onRatingSubmitted(ratingData: RatingCreate | RatingUpdate): void {
    const recipe = this.recipe();
    if (!recipe) return;

    if ('recipe' in ratingData) {
      // Creating new rating
      this.recipeService.createRating(ratingData as RatingCreate).subscribe({
        next: (rating) => {
          this.currentUserRating.set(rating);
          this.showRatingFormSignal.set(false);
          this.editingReview.set(false);
          this.snackBar.open('Your review has been submitted!', 'Close', { duration: 3000 });
          
          // Reload recipe to get updated stats and reviews
          this.loadRecipe(recipe.id);
        },
        error: (error) => {
          console.error('Error creating rating:', error);
          this.snackBar.open(
            error.error?.detail || 'Failed to submit review', 
            'Close', 
            { duration: 3000 }
          );
        }
      });
    } else {
      // Updating existing rating
      const currentRating = this.currentUserRating();
      if (!currentRating) return;

      this.recipeService.updateRating(currentRating.id, ratingData as RatingUpdate).subscribe({
        next: (rating) => {
          this.currentUserRating.set(rating);
          this.editingReview.set(false);
          this.snackBar.open('Your review has been updated!', 'Close', { duration: 3000 });
          
          // Reload recipe to get updated stats and reviews
          this.loadRecipe(recipe.id);
        },
        error: (error) => {
          console.error('Error updating rating:', error);
          this.snackBar.open(
            error.error?.detail || 'Failed to update review', 
            'Close', 
            { duration: 3000 }
          );
        }
      });
    }
  }

  onRatingDeleted(): void {
    const currentRating = this.currentUserRating();
    const recipe = this.recipe();
    if (!currentRating || !recipe) return;

    this.recipeService.deleteRating(currentRating.id).subscribe({
      next: () => {
        this.currentUserRating.set(null);
        this.editingReview.set(false);
        this.snackBar.open('Your review has been deleted', 'Close', { duration: 3000 });
        
        // Reload recipe to get updated stats and reviews
        this.loadRecipe(recipe.id);
      },
      error: (error) => {
        console.error('Error deleting rating:', error);
        this.snackBar.open('Failed to delete review', 'Close', { duration: 3000 });
      }
    });
  }

  onRatingFormCancelled(): void {
    this.showRatingFormSignal.set(false);
    this.editingReview.set(false);
  }

  onReviewsSortChange(sortBy: string): void {
    this.reviewsSortBy.set(sortBy);
    this.loadReviews(this.recipe()?.id || '');
  }

  onLoadMoreReviews(): void {
    const recipe = this.recipe();
    if (recipe) {
      this.loadReviews(recipe.id, true);
    }
  }

  onMarkReviewHelpful(review: RatingListItem): void {
    this.recipeService.markRatingHelpful(review.id).subscribe({
      next: (response) => {
        // Update the review in the list
        const updatedReviews = this.reviews().map(r => 
          r.id === review.id 
            ? { ...r, helpful_count: response.helpful_count }
            : r
        );
        this.reviews.set(updatedReviews);
        this.snackBar.open('Review marked as helpful', 'Close', { duration: 3000 });
      },
      error: (error) => {
        console.error('Error marking review as helpful:', error);
        this.snackBar.open(
          error.error?.error || 'Failed to mark review as helpful', 
          'Close', 
          { duration: 3000 }
        );
      }
    });
  }

  onEditReview(_review: RatingListItem): void {
    this.editingReview.set(true);
    this.showRatingFormSignal.set(true);
  }

  onDeleteReview(review: RatingListItem): void {
    // This should only be called for the current user's review
    if (review.id === this.currentUserRating()?.id) {
      this.onRatingDeleted();
    }
  }

  // Rating statistics helper methods
  getRatingPercentage(stars: number): number {
    const stats = this.recipe()?.rating_stats;
    if (!stats || stats.total_ratings === 0) return 0;
    
    const count = stats.rating_distribution[stars as keyof typeof stats.rating_distribution] || 0;
    return (count / stats.total_ratings) * 100;
  }

  getRatingCount(stars: number): number {
    const stats = this.recipe()?.rating_stats;
    if (!stats) return 0;
    
    return stats.rating_distribution[stars as keyof typeof stats.rating_distribution] || 0;
  }

  // Action methods
  toggleFavorite(): void {
    const recipe = this.recipe();
    if (!recipe || !recipe.id) return;

    // Check if user is authenticated
    if (!this.authService.isAuthenticated()) {
      this.snackBar.open('Please log in to add favorites', 'Close', { duration: 3000 });
      return;
    }

    this.recipeService.toggleFavorite(recipe.id.toString()).subscribe({
      next: (result) => {
        this.recipe.update(current => 
          current ? { ...current, is_favorited: result.is_favorited } : current
        );
        this.snackBar.open(
          result.is_favorited ? 'Added to favorites' : 'Removed from favorites',
          'Close',
          { duration: 3000 }
        );
      },
      error: (error) => {
        console.error('Favorite toggle error:', error);
        if (error.status === 404) {
          this.snackBar.open('Favorites feature is coming soon!', 'Close', { duration: 3000 });
        } else {
          this.snackBar.open('Failed to update favorite status', 'Close', { duration: 3000 });
        }
      }
    });
  }

  shareRecipe(): void {
    const recipe = this.recipe();
    if (!recipe) return;

    if (navigator.share) {
      navigator.share({
        title: recipe.title,
        text: recipe.description,
        url: window.location.href
      });
    } else {
      // Fallback: copy to clipboard
      navigator.clipboard.writeText(window.location.href).then(() => {
        this.snackBar.open('Recipe link copied to clipboard', 'Close', { duration: 3000 });
      });
    }
  }

  printRecipe(): void {
    window.print();
  }

  editRecipe(): void {
    const recipe = this.recipe();
    if (recipe) {
      this.router.navigate(['/recipes', recipe.id, 'edit']);
    }
  }

  deleteRecipe(): void {
    const recipe = this.recipe();
    if (!recipe) return;

    const dialogRef = this.dialog.open(DeleteConfirmationDialog, {
      width: '400px',
      data: { 
        title: 'Delete Recipe',
        message: `Are you sure you want to delete "${recipe.title}"? This action cannot be undone.`,
        confirmText: 'Delete',
        cancelText: 'Cancel'
      }
    });

    dialogRef.afterClosed().subscribe(result => {
      if (result && recipe && !this.isDeleting) {
        this.performDelete(recipe.id);
      }
    });
  }

  private performDelete(recipeId: string): void {
    this.isDeleting = true; // Set deletion flag to prevent view recording
    
    this.recipeService.deleteRecipe(recipeId).subscribe({
      next: () => {
        this.snackBar.open('Recipe deleted successfully', 'Close', { duration: 3000 });
        this.router.navigate(['/recipes']);
      },
      error: () => {
        this.isDeleting = false; // Reset flag on error
        this.snackBar.open('Failed to delete recipe', 'Close', { duration: 3000 });
      }
    });
  }

  // Permission checks
  canEditRecipe(): boolean {
    const recipe = this.recipe();
    const currentUser = this.authService.getCurrentUser();
    
    // Check if we have valid recipe, user, and author data
    if (!recipe || !currentUser || !recipe.author || !recipe.author.id) {
      return false;
    }
    
    // Convert both IDs to strings for comparison (handle UUID vs string inconsistencies)
    const recipeAuthorId = recipe.author.id.toString();
    const currentUserId = currentUser.id.toString();
    
    // Check isStaff with both possible field names (isStaff and is_staff)
    const isStaff = !!(currentUser.isStaff || (currentUser as { is_staff?: boolean }).is_staff);
    
    return recipeAuthorId === currentUserId || isStaff;
  }

  canDeleteRecipe(): boolean {
    return this.canEditRecipe();
  }



  // Navigation methods
  goBack(): void {
    // If we came from edit, always go to recipes list to avoid history issues
    if (this.cameFromEdit) {
      this.router.navigate(['/recipes']);
    } else {
      // Use normal back navigation with fallback to recipes list
      window.history.length > 1 ? window.history.back() : this.router.navigate(['/recipes']);
    }
  }



  // Helper methods
  getStarArray(rating: number): string[] {
    const stars: string[] = [];
    const fullStars = Math.floor(rating);
    const hasHalfStar = rating % 1 >= 0.5;
    
    for (let i = 0; i < fullStars; i++) {
      stars.push('star');
    }
    
    if (hasHalfStar) {
      stars.push('star_half');
    }
    
    while (stars.length < 5) {
      stars.push('star_border');
    }
    
    return stars;
  }
}

// Confirmation Dialog Component
interface DialogData {
  title: string;
  message: string;
  confirmText: string;
  cancelText: string;
}

@Component({
  selector: 'app-delete-confirmation-dialog',
  standalone: true,
  imports: [CommonModule, MaterialModule],
  template: `
    <h2 mat-dialog-title>{{ data.title }}</h2>
    <mat-dialog-content>
      <p>{{ data.message }}</p>
    </mat-dialog-content>
    <mat-dialog-actions align="end">
      <button mat-button (click)="onCancel()">{{ data.cancelText }}</button>
      <button mat-raised-button color="warn" (click)="onConfirm()">{{ data.confirmText }}</button>
    </mat-dialog-actions>
  `
})
export class DeleteConfirmationDialog {
  constructor(
    public dialogRef: MatDialogRef<DeleteConfirmationDialog>,
    @Inject(MAT_DIALOG_DATA) public data: DialogData
  ) {}

  onCancel(): void {
    this.dialogRef.close(false);
  }

  onConfirm(): void {
    this.dialogRef.close(true);
  }
} 