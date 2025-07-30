import { Component, OnInit, inject, signal, computed } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ReactiveFormsModule, FormBuilder, FormGroup, Validators, FormArray } from '@angular/forms';
import { ActivatedRoute, Router, RouterModule } from '@angular/router';
import { MaterialModule } from '../../../shared/material.module';
import { RecipeService } from '../../../core/services/recipe.service';
import { AuthService } from '../../../core/services/auth.service';
import { Recipe, Category, DIFFICULTY_OPTIONS, DIETARY_RESTRICTION_OPTIONS } from '../../../shared/models/recipe.models';
import { catchError, finalize } from 'rxjs/operators';
import { of } from 'rxjs';
import { MatSnackBar } from '@angular/material/snack-bar';

interface RecipeFormData {
  title: string;
  description: string;
  prep_time: number;
  cook_time: number;
  servings: number;
  difficulty: 'easy' | 'medium' | 'hard';
  cooking_method: string;
  cuisine_type?: string;
  ingredients: { name: string; amount: string; }[];
  instructions: string[];
  tags: string[];
  dietary_restrictions: string[];
  categories: number[];
  nutrition_info?: {
    calories?: number;
    protein?: number;
    carbs?: number;
    fat?: number;
    fiber?: number;
    sugar?: number;
  };
  is_published: boolean;
}

@Component({
  selector: 'app-recipe-form',
  standalone: true,
  imports: [CommonModule, ReactiveFormsModule, MaterialModule, RouterModule],
  template: `
    <div class="container mx-auto px-4 py-8 max-w-4xl">
      <!-- Loading State -->
      <div *ngIf="loading()" class="flex justify-center items-center min-h-[400px]">
        <mat-spinner diameter="40"></mat-spinner>
      </div>

      <!-- Form Content -->
      <div *ngIf="!loading()">
        <!-- Header -->
        <div class="mb-6">
          <div class="flex items-center gap-2 mb-4">
            <button mat-icon-button (click)="goBack()" class="text-gray-600">
              <mat-icon>arrow_back</mat-icon>
            </button>
            <h1 class="text-3xl font-bold text-gray-900">
              {{ isEditing() ? 'Edit Recipe' : 'Create New Recipe' }}
            </h1>
          </div>
          <p class="text-gray-600">
            {{ isEditing() ? 'Update your recipe details below' : 'Share your culinary creation with the community' }}
          </p>
        </div>

        <!-- Recipe Form -->
        <form [formGroup]="recipeForm" (ngSubmit)="onSubmit()" class="space-y-6">
          <!-- Basic Information -->
          <mat-card>
            <mat-card-header>
              <mat-card-title class="flex items-center gap-2">
                <mat-icon>info</mat-icon>
                Basic Information
              </mat-card-title>
            </mat-card-header>
            <mat-card-content class="space-y-4">
              <!-- Title -->
              <mat-form-field appearance="fill" class="w-full">
                <mat-label>Recipe Title</mat-label>
                <input matInput formControlName="title" placeholder="Enter a catchy recipe title">
                <mat-error *ngIf="recipeForm.get('title')?.hasError('required')">
                  Title is required
                </mat-error>
                <mat-error *ngIf="recipeForm.get('title')?.hasError('minlength')">
                  Title must be at least 3 characters
                </mat-error>
              </mat-form-field>

              <!-- Description -->
              <mat-form-field appearance="fill" class="w-full">
                <mat-label>Description</mat-label>
                <textarea matInput formControlName="description" rows="3" 
                         placeholder="Describe your recipe..."></textarea>
                <mat-error *ngIf="recipeForm.get('description')?.hasError('required')">
                  Description is required
                </mat-error>
              </mat-form-field>

              <!-- Image Upload -->
              <div class="space-y-3">
                <label class="block text-sm font-medium text-gray-700">Recipe Image</label>
                <div class="flex items-center gap-4">
                  <input type="file" #fileInput (change)="onImageSelected($event)" 
                         accept="image/*" class="hidden">
                  <button type="button" mat-stroked-button (click)="fileInput.click()">
                    <mat-icon>cloud_upload</mat-icon>
                    {{ selectedImage() ? 'Change Image' : 'Upload Image' }}
                  </button>
                  <span *ngIf="selectedImage()" class="text-sm text-gray-600">
                    {{ selectedImage()?.name }}
                  </span>
                </div>
                <!-- Image Preview -->
                <div *ngIf="imagePreview()" class="mt-3">
                  <img [src]="imagePreview()" alt="Preview" 
                       class="w-32 h-32 object-cover rounded border">
                </div>
              </div>
            </mat-card-content>
          </mat-card>

          <!-- Time and Serving Information -->
          <mat-card>
            <mat-card-header>
              <mat-card-title class="flex items-center gap-2">
                <mat-icon>schedule</mat-icon>
                Timing & Servings
              </mat-card-title>
            </mat-card-header>
            <mat-card-content>
              <div class="grid md:grid-cols-2 lg:grid-cols-4 gap-4">
                <mat-form-field appearance="fill">
                  <mat-label>Prep Time (minutes)</mat-label>
                  <input matInput type="number" formControlName="prep_time" min="1">
                  <mat-error *ngIf="recipeForm.get('prep_time')?.hasError('required')">
                    Prep time is required
                  </mat-error>
                  <mat-error *ngIf="recipeForm.get('prep_time')?.hasError('min')">
                    Prep time must be at least 1 minute
                  </mat-error>
                </mat-form-field>

                <mat-form-field appearance="fill">
                  <mat-label>Cook Time (minutes)</mat-label>
                  <input matInput type="number" formControlName="cook_time" min="1">
                  <mat-error *ngIf="recipeForm.get('cook_time')?.hasError('required')">
                    Cook time is required
                  </mat-error>
                  <mat-error *ngIf="recipeForm.get('cook_time')?.hasError('min')">
                    Cook time must be at least 1 minute
                  </mat-error>
                </mat-form-field>

                <mat-form-field appearance="fill">
                  <mat-label>Servings</mat-label>
                  <input matInput type="number" formControlName="servings" min="1">
                  <mat-error *ngIf="recipeForm.get('servings')?.hasError('required')">
                    Servings is required
                  </mat-error>
                  <mat-error *ngIf="recipeForm.get('servings')?.hasError('min')">
                    Must serve at least 1 person
                  </mat-error>
                </mat-form-field>

                <mat-form-field appearance="fill">
                  <mat-label>Difficulty</mat-label>
                  <mat-select formControlName="difficulty">
                    <mat-option *ngFor="let difficulty of difficultyOptions" [value]="difficulty.value">
                      {{ difficulty.label }}
                    </mat-option>
                  </mat-select>
                  <mat-error *ngIf="recipeForm.get('difficulty')?.hasError('required')">
                    Difficulty is required
                  </mat-error>
                </mat-form-field>
              </div>

              <!-- Total Time Display -->
              <div *ngIf="totalTime() > 0" class="mt-3 p-3 bg-blue-50 rounded">
                <span class="text-sm font-medium text-blue-800">
                  Total Time: {{ totalTime() }} minutes
                </span>
              </div>
            </mat-card-content>
          </mat-card>

          <!-- Recipe Details -->
          <mat-card>
            <mat-card-header>
              <mat-card-title class="flex items-center gap-2">
                <mat-icon>restaurant</mat-icon>
                Recipe Details
              </mat-card-title>
            </mat-card-header>
            <mat-card-content class="space-y-4">
              <div class="grid md:grid-cols-2 gap-4">
                <mat-form-field appearance="fill">
                  <mat-label>Cooking Method</mat-label>
                  <input matInput formControlName="cooking_method" placeholder="e.g., Baking, Grilling">
                </mat-form-field>

                <mat-form-field appearance="fill">
                  <mat-label>Cuisine Type</mat-label>
                  <input matInput formControlName="cuisine_type" placeholder="e.g., Italian, Mexican">
                </mat-form-field>
              </div>

              <!-- Categories -->
              <mat-form-field appearance="fill" class="w-full">
                <mat-label>Categories</mat-label>
                <mat-select formControlName="categories" multiple>
                  <mat-option *ngFor="let category of categories()" [value]="category.id">
                    {{ category.name }}
                  </mat-option>
                </mat-select>
              </mat-form-field>

              <!-- Dietary Restrictions -->
              <mat-form-field appearance="fill" class="w-full">
                <mat-label>Dietary Restrictions</mat-label>
                <mat-select formControlName="dietary_restrictions" multiple>
                  <mat-option *ngFor="let restriction of dietaryOptions" [value]="restriction.value">
                    {{ restriction.label }}
                  </mat-option>
                </mat-select>
              </mat-form-field>

              <!-- Tags -->
              <div class="space-y-2">
                <label class="block text-sm font-medium text-gray-700">Tags</label>
                <div class="flex gap-2 flex-wrap mb-2">
                  <mat-chip *ngFor="let tag of tags(); let i = index" 
                           (removed)="removeTag(i)" removable>
                    {{ tag }}
                    <mat-icon matChipRemove>cancel</mat-icon>
                  </mat-chip>
                </div>
                <div class="flex gap-2">
                  <mat-form-field appearance="fill" class="flex-1">
                    <mat-label>Add Tag</mat-label>
                    <input matInput #tagInput (keyup.enter)="addTag(tagInput.value); tagInput.value = ''" 
                           placeholder="Enter a tag and press Enter">
                  </mat-form-field>
                  <button type="button" mat-button (click)="addTag(tagInput.value); tagInput.value = ''"
                          [disabled]="!tagInput.value.trim()">
                    Add
                  </button>
                </div>
              </div>
            </mat-card-content>
          </mat-card>

          <!-- Ingredients -->
          <mat-card>
            <mat-card-header>
              <mat-card-title class="flex items-center gap-2">
                <mat-icon>shopping_list</mat-icon>
                Ingredients
              </mat-card-title>
            </mat-card-header>
            <mat-card-content>
              <div formArrayName="ingredients" class="space-y-3">
                <div *ngFor="let ingredient of ingredientsArray.controls; let i = index" 
                     class="flex gap-2 items-start">
                  <div [formGroupName]="i" class="flex gap-2 flex-1">
                    <mat-form-field appearance="fill" style="width: 120px; min-width: 120px; max-width: 150px;">
                      <mat-label>Amount</mat-label>
                      <input matInput formControlName="amount" placeholder="e.g., 2 cups">
                      <mat-error *ngIf="ingredient.get('amount')?.hasError('required')">
                        Amount is required
                      </mat-error>
                    </mat-form-field>
                    <mat-form-field appearance="fill" style="flex: 1; min-width: 0;">
                      <mat-label>Ingredient</mat-label>
                      <input matInput formControlName="name" placeholder="e.g., flour">
                      <mat-error *ngIf="ingredient.get('name')?.hasError('required')">
                        Ingredient name is required
                      </mat-error>
                    </mat-form-field>
                  </div>
                  <button type="button" mat-icon-button color="warn" 
                          (click)="removeIngredient(i)" [disabled]="ingredientsArray.length <= 1">
                    <mat-icon>delete</mat-icon>
                  </button>
                </div>
              </div>
              <button type="button" mat-button (click)="addIngredient()" class="mt-3">
                <mat-icon>add</mat-icon>
                Add Ingredient
              </button>
            </mat-card-content>
          </mat-card>

          <!-- Instructions -->
          <mat-card>
            <mat-card-header>
              <mat-card-title class="flex items-center gap-2">
                <mat-icon>list_alt</mat-icon>
                Instructions
              </mat-card-title>
            </mat-card-header>
            <mat-card-content>
              <div formArrayName="instructions" class="space-y-3">
                <div *ngFor="let instruction of instructionsArray.controls; let i = index" 
                     class="flex gap-2 items-start">
                  <div class="flex-shrink-0 w-8 h-8 bg-primary text-white rounded-full flex items-center justify-center text-sm font-semibold mt-2">
                    {{ i + 1 }}
                  </div>
                  <mat-form-field appearance="fill" class="flex-1">
                    <mat-label>Step {{ i + 1 }}</mat-label>
                    <textarea matInput [formControlName]="i" rows="2" 
                             placeholder="Describe this step in detail"></textarea>
                    <mat-error *ngIf="instruction.hasError('required')">
                      Instruction is required
                    </mat-error>
                  </mat-form-field>
                  <button type="button" mat-icon-button color="warn" 
                          (click)="removeInstruction(i)" [disabled]="instructionsArray.length <= 1">
                    <mat-icon>delete</mat-icon>
                  </button>
                </div>
              </div>
              <button type="button" mat-button (click)="addInstruction()" class="mt-3">
                <mat-icon>add</mat-icon>
                Add Step
              </button>
            </mat-card-content>
          </mat-card>

          <!-- Nutrition Information (Optional) -->
          <mat-card>
            <mat-card-header>
              <mat-card-title class="flex items-center gap-2">
                <mat-icon>nutrition</mat-icon>
                Nutrition Information (Optional)
              </mat-card-title>
              <mat-card-subtitle>Per serving</mat-card-subtitle>
            </mat-card-header>
            <mat-card-content>
              <div formGroupName="nutrition_info" class="grid md:grid-cols-2 lg:grid-cols-3 gap-4">
                <mat-form-field appearance="fill">
                  <mat-label>Calories</mat-label>
                  <input matInput type="number" formControlName="calories" min="0">
                </mat-form-field>

                <mat-form-field appearance="fill">
                  <mat-label>Protein (g)</mat-label>
                  <input matInput type="number" formControlName="protein" min="0" step="0.1">
                </mat-form-field>

                <mat-form-field appearance="fill">
                  <mat-label>Carbs (g)</mat-label>
                  <input matInput type="number" formControlName="carbs" min="0" step="0.1">
                </mat-form-field>

                <mat-form-field appearance="fill">
                  <mat-label>Fat (g)</mat-label>
                  <input matInput type="number" formControlName="fat" min="0" step="0.1">
                </mat-form-field>

                <mat-form-field appearance="fill">
                  <mat-label>Fiber (g)</mat-label>
                  <input matInput type="number" formControlName="fiber" min="0" step="0.1">
                </mat-form-field>

                <mat-form-field appearance="fill">
                  <mat-label>Sugar (g)</mat-label>
                  <input matInput type="number" formControlName="sugar" min="0" step="0.1">
                </mat-form-field>
              </div>
            </mat-card-content>
          </mat-card>

          <!-- Publication Settings -->
          <mat-card>
            <mat-card-header>
              <mat-card-title class="flex items-center gap-2">
                <mat-icon>visibility</mat-icon>
                Publication Settings
              </mat-card-title>
            </mat-card-header>
            <mat-card-content>
              <mat-checkbox formControlName="is_published" class="mb-2">
                Publish this recipe
              </mat-checkbox>
              <p class="text-sm text-gray-600">
                Published recipes are visible to all users. Unpublished recipes are only visible to you.
              </p>
            </mat-card-content>
          </mat-card>

          <!-- Form Actions -->
          <div class="flex gap-4 justify-end pt-6 border-t">
            <button type="button" mat-button (click)="goBack()">
              Cancel
            </button>
            <button type="button" mat-button color="primary" 
                    (click)="saveDraft()" [disabled]="submitting()">
              Save as Draft
            </button>
            <button type="submit" mat-raised-button color="primary" 
                    [disabled]="recipeForm.invalid || submitting()">
              <mat-icon *ngIf="submitting()">hourglass_empty</mat-icon>
              <mat-icon *ngIf="!submitting()">{{ isEditing() ? 'update' : 'publish' }}</mat-icon>
              {{ submitting() ? 'Saving...' : (isEditing() ? 'Update Recipe' : 'Create Recipe') }}
            </button>
          </div>
        </form>
      </div>
    </div>
  `,
  styles: [`
    mat-form-field {
      width: 100%;
    }
    
    mat-chip {
      margin: 2px;
    }

    .ingredient-step-number {
      min-width: 32px;
    }
  `]
})
export class RecipeFormComponent implements OnInit {
  private route = inject(ActivatedRoute);
  private router = inject(Router);
  private fb = inject(FormBuilder);
  private recipeService = inject(RecipeService);
  private authService = inject(AuthService);
  private snackBar = inject(MatSnackBar);

  // Signals for reactive state management
  loading = signal(false);
  submitting = signal(false);
  selectedImage = signal<File | null>(null);
  imagePreview = signal<string | null>(null);
  categories = signal<Category[]>([]);
  tags = signal<string[]>([]);
  
  // Computed values
  isEditing = computed(() => !!this.recipeId);
  totalTime = computed(() => {
    const prepTime = this.recipeForm.get('prep_time')?.value || 0;
    const cookTime = this.recipeForm.get('cook_time')?.value || 0;
    return prepTime + cookTime;
  });

  // Component state
  recipeId: string | null = null;
  difficultyOptions = DIFFICULTY_OPTIONS;
  dietaryOptions = DIETARY_RESTRICTION_OPTIONS;

  // Form definition
  recipeForm: FormGroup = this.fb.group({
    title: ['', [Validators.required, Validators.minLength(3)]],
    description: ['', Validators.required],
    prep_time: [null, [Validators.required, Validators.min(1)]],
    cook_time: [null, [Validators.required, Validators.min(1)]],
    servings: [null, [Validators.required, Validators.min(1)]],
    difficulty: ['', Validators.required],
    cooking_method: [''],
    cuisine_type: [''],
    categories: [[]],
    dietary_restrictions: [[]],
    ingredients: this.fb.array([this.createIngredientGroup()]),
    instructions: this.fb.array([this.fb.control('', Validators.required)]),
    nutrition_info: this.fb.group({
      calories: [null],
      protein: [null],
      carbs: [null],
      fat: [null],
      fiber: [null],
      sugar: [null]
    }),
    is_published: [true]
  });

  // Form array getters
  get ingredientsArray(): FormArray {
    return this.recipeForm.get('ingredients') as FormArray;
  }

  get instructionsArray(): FormArray {
    return this.recipeForm.get('instructions') as FormArray;
  }

  ngOnInit(): void {
    this.loadCategories();
    
    this.route.params.subscribe(params => {
      this.recipeId = params['id'] || null;
      if (this.recipeId) {
        this.loadRecipe(this.recipeId);
      }
    });
  }

  private loadCategories(): void {
    this.recipeService.getCategories().subscribe(categories => {
      this.categories.set(categories);
    });
  }

  private loadRecipe(id: string): void {
    this.loading.set(true);
    
    this.recipeService.getRecipe(id).pipe(
      catchError((error) => {
        this.snackBar.open('Failed to load recipe', 'Close', { duration: 3000 });
        this.router.navigate(['/recipes']);
        return of(null);
      }),
      finalize(() => this.loading.set(false))
    ).subscribe(recipe => {
      if (recipe) {
        this.populateForm(recipe);
      }
    });
  }

  private populateForm(recipe: Recipe): void {
    // Clear existing form arrays
    this.ingredientsArray.clear();
    this.instructionsArray.clear();

    // Populate ingredients - handle both string and object formats for backward compatibility
    recipe.ingredients.forEach(ingredient => {
      if (typeof ingredient === 'string') {
        // Legacy format - try to parse "amount name" format
        const parts = ingredient.split(' ');
        const amount = parts.slice(0, 2).join(' '); // First 1-2 words as amount
        const name = parts.slice(2).join(' '); // Rest as name
        this.ingredientsArray.push(this.fb.group({
          name: [name || ingredient, Validators.required],
          amount: [amount || '1', Validators.required]
        }));
      } else {
        // New structured format
        this.ingredientsArray.push(this.fb.group({
          name: [ingredient.name || '', Validators.required],
          amount: [ingredient.amount || '', Validators.required]
        }));
      }
    });

    // Populate instructions
    recipe.instructions.forEach(instruction => {
      this.instructionsArray.push(this.fb.control(instruction, Validators.required));
    });

    // Populate tags
    this.tags.set([...recipe.tags]);

    // Populate main form
    this.recipeForm.patchValue({
      title: recipe.title,
      description: recipe.description,
      prep_time: recipe.prep_time,
      cook_time: recipe.cook_time,
      servings: recipe.servings,
      difficulty: recipe.difficulty,
      cooking_method: recipe.cooking_method,
      cuisine_type: recipe.cuisine_type,
      categories: recipe.categories.map(cat => cat.id),
      dietary_restrictions: recipe.dietary_restrictions,
      nutrition_info: recipe.nutrition_info || {},
      is_published: true // Assuming we can edit published recipes
    });
  }

  // Image handling
  onImageSelected(event: Event): void {
    const file = (event.target as HTMLInputElement).files?.[0];
    if (file) {
      this.selectedImage.set(file);
      
      // Create preview
      const reader = new FileReader();
      reader.onload = (e) => {
        this.imagePreview.set(e.target?.result as string);
      };
      reader.readAsDataURL(file);
    }
  }

  // Tag management
  addTag(tagValue: string): void {
    const tag = tagValue.trim().toLowerCase();
    if (tag && !this.tags().includes(tag)) {
      this.tags.update(tags => [...tags, tag]);
    }
  }

  removeTag(index: number): void {
    this.tags.update(tags => tags.filter((_, i) => i !== index));
  }

  // Helper method to create ingredient form group
  private createIngredientGroup(): FormGroup {
    return this.fb.group({
      name: ['', Validators.required],
      amount: ['', Validators.required]
    });
  }

  // Dynamic form array management
  addIngredient(): void {
    this.ingredientsArray.push(this.createIngredientGroup());
  }

  removeIngredient(index: number): void {
    if (this.ingredientsArray.length > 1) {
      this.ingredientsArray.removeAt(index);
    }
  }

  addInstruction(): void {
    this.instructionsArray.push(this.fb.control('', Validators.required));
  }

  removeInstruction(index: number): void {
    if (this.instructionsArray.length > 1) {
      this.instructionsArray.removeAt(index);
    }
  }

  // Form submission
  onSubmit(): void {
    console.log('Form submission attempted');
    console.log('Form valid:', this.recipeForm.valid);
    console.log('Form errors:', this.getFormValidationErrors());
    
    if (this.recipeForm.valid) {
      this.recipeForm.patchValue({ is_published: true });
      this.submitForm();
    } else {
      console.log('Form is invalid, cannot submit');
      this.markFormGroupTouched(this.recipeForm);
      this.snackBar.open('Please fix the form errors before submitting', 'Close', { duration: 3000 });
    }
  }

  private getFormValidationErrors(): any {
    const formErrors: any = {};
    
    Object.keys(this.recipeForm.controls).forEach(key => {
      const controlErrors = this.recipeForm.get(key)?.errors;
      if (controlErrors) {
        formErrors[key] = controlErrors;
      }
    });
    
    return formErrors;
  }

  private markFormGroupTouched(formGroup: FormGroup): void {
    Object.keys(formGroup.controls).forEach(key => {
      const control = formGroup.get(key);
      control?.markAsTouched();
      
      if (control instanceof FormGroup) {
        this.markFormGroupTouched(control);
      }
    });
  }

  saveDraft(): void {
    this.recipeForm.patchValue({ is_published: false });
    this.submitForm();
  }

  private submitForm(): void {
    this.submitting.set(true);

    const formData = this.buildFormData();
    
    // Debug: Log the form data being sent
    console.log('=== RECIPE FORM DEBUG ===');
    console.log('Form values:', this.recipeForm.value);
    console.log('FormData entries:');
    for (let [key, value] of formData.entries()) {
      console.log(`${key}:`, value);
    }
    console.log('=== END DEBUG ===');
    
    const operation = this.isEditing() 
      ? this.recipeService.updateRecipe(this.recipeId!, formData)
      : this.recipeService.createRecipe(formData);

    operation.pipe(
      finalize(() => this.submitting.set(false))
    ).subscribe({
      next: (recipe) => {
        const message = this.isEditing() ? 'Recipe updated successfully' : 'Recipe created successfully';
        this.snackBar.open(message, 'Close', { duration: 3000 });
        this.router.navigate(['/recipes', recipe.id]);
      },
      error: (error) => {
        console.error('Recipe submission error:', error);
        console.error('Error status:', error.status);
        console.error('Error response:', error.error);
        
        // Try to show specific error messages from backend
        let errorMessage = 'Failed to save recipe. Please try again.';
        if (error.error && typeof error.error === 'object') {
          const errors = [];
          for (const [field, messages] of Object.entries(error.error)) {
            if (Array.isArray(messages)) {
              errors.push(`${field}: ${messages.join(', ')}`);
            } else {
              errors.push(`${field}: ${messages}`);
            }
          }
          if (errors.length > 0) {
            errorMessage = errors.join('\n');
          }
        }
        
        this.snackBar.open(errorMessage, 'Close', { duration: 5000 });
      }
    });
  }

  private buildFormData(): FormData {
    const formData = new FormData();
    const formValue = this.recipeForm.value;

    // Ensure all required fields are present with proper defaults
    const requiredFields = {
      title: formValue.title || '',
      description: formValue.description || '',
      prep_time: formValue.prep_time || 1,
      cook_time: formValue.cook_time || 1,
      servings: formValue.servings || 1,
      difficulty: formValue.difficulty || 'easy',
      cooking_method: formValue.cooking_method || 'other',
      is_published: formValue.is_published !== undefined ? formValue.is_published : true
    };

    // Add required fields
    Object.keys(requiredFields).forEach(key => {
      formData.append(key, (requiredFields as any)[key]);
    });

    // Handle ingredients (required)
    const ingredients = formValue.ingredients || [];
    if (ingredients.length === 0) {
      // Add a default ingredient if none provided to prevent validation error
      formData.append('ingredients', JSON.stringify([{ name: 'Please add ingredients', amount: '1' }]));
    } else {
      formData.append('ingredients', JSON.stringify(ingredients));
    }

    // Handle instructions (required)
    const instructions = formValue.instructions || [];
    if (instructions.length === 0) {
      // Add a default instruction if none provided
      formData.append('instructions', JSON.stringify(['Please add cooking instructions']));
    } else {
      formData.append('instructions', JSON.stringify(instructions));
    }

    // Handle optional arrays
    if (formValue.categories && formValue.categories.length > 0) {
      formData.append('categories', JSON.stringify(formValue.categories));
    }

    if (formValue.dietary_restrictions && formValue.dietary_restrictions.length > 0) {
      formData.append('dietary_restrictions', JSON.stringify(formValue.dietary_restrictions));
    }

    // Handle tags from signal
    const tags = this.tags();
    if (tags.length > 0) {
      formData.append('tags', JSON.stringify(tags));
    }

    // Handle optional fields
    if (formValue.cuisine_type && formValue.cuisine_type.trim()) {
      formData.append('cuisine_type', formValue.cuisine_type.trim());
    }

    // Handle nutrition info (optional nested object)
    const nutritionInfo = formValue.nutrition_info;
    if (nutritionInfo && Object.values(nutritionInfo).some(val => val !== null && val !== '' && val !== undefined)) {
      formData.append('nutrition_info', JSON.stringify(nutritionInfo));
    }

    // Add image if selected
    if (this.selectedImage()) {
      formData.append('image', this.selectedImage()!);
    }

    return formData;
  }

  // Navigation
  goBack(): void {
    if (this.isEditing()) {
      this.router.navigate(['/recipes', this.recipeId]);
    } else {
      this.router.navigate(['/recipes']);
    }
  }
}