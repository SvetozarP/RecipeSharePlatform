import { Component, OnInit, inject, signal, computed } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ReactiveFormsModule, FormBuilder, FormGroup, Validators, FormArray } from '@angular/forms';
import { ActivatedRoute, Router, RouterModule } from '@angular/router';
import { MaterialModule } from '../../../shared/material.module';
import { RecipeService } from '../../../core/services/recipe.service';
import { AuthService } from '../../../core/services/auth.service';
import { Recipe, Category, DIFFICULTY_OPTIONS } from '../../../shared/models/recipe.models';
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
  templateUrl: './recipe-form.component.html',
  styleUrls: ['./recipe-form.component.scss']})
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

  cookingMethodOptions = [
    { value: 'baking', label: 'Baking' },
    { value: 'frying', label: 'Frying' },
    { value: 'boiling', label: 'Boiling' },
    { value: 'grilling', label: 'Grilling' },
    { value: 'steaming', label: 'Steaming' },
    { value: 'other', label: 'Other' }
  ];

  // Form definition
  recipeForm: FormGroup = this.fb.group({
    title: ['', [Validators.required, Validators.minLength(3)]],
    description: ['', Validators.required],
    prep_time: [null, [Validators.required, Validators.min(1)]],
    cook_time: [null, [Validators.required, Validators.min(1)]],
    servings: [null, [Validators.required, Validators.min(1)]],
    difficulty: ['', Validators.required],
    cooking_method: ['other'],
    cuisine_type: [''],
    categories: [[]],
    
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
    is_published: [false] // Default to false for non-staff users
  });

  // Form array getters
  get ingredientsArray(): FormArray {
    return this.recipeForm.get('ingredients') as FormArray;
  }

  get instructionsArray(): FormArray {
    return this.recipeForm.get('instructions') as FormArray;
  }

  // Helper method to check if form has specific errors
  hasFormErrors(): boolean {
    return this.recipeForm.invalid && this.recipeForm.touched;
  }

  // Helper method to get specific error messages
  getFormErrorMessages(): string[] {
    const errors: string[] = [];
    
    if (this.recipeForm.get('title')?.invalid && this.recipeForm.get('title')?.touched) {
      errors.push('Title is required (minimum 3 characters)');
    }
    if (this.recipeForm.get('description')?.invalid && this.recipeForm.get('description')?.touched) {
      errors.push('Description is required');
    }
    if (this.recipeForm.get('prep_time')?.invalid && this.recipeForm.get('prep_time')?.touched) {
      errors.push('Prep time is required (minimum 1 minute)');
    }
    if (this.recipeForm.get('cook_time')?.invalid && this.recipeForm.get('cook_time')?.touched) {
      errors.push('Cook time is required (minimum 1 minute)');
    }
    if (this.recipeForm.get('servings')?.invalid && this.recipeForm.get('servings')?.touched) {
      errors.push('Servings is required (minimum 1)');
    }
    if (this.recipeForm.get('difficulty')?.invalid && this.recipeForm.get('difficulty')?.touched) {
      errors.push('Difficulty level is required');
    }

    // Check ingredients array
    this.ingredientsArray.controls.forEach((control, index) => {
      if (control.invalid && control.touched) {
        errors.push(`Ingredient ${index + 1}: Name and amount are required`);
      }
    });

    // Check instructions array
    this.instructionsArray.controls.forEach((control, index) => {
      if (control.invalid && control.touched) {
        errors.push(`Instruction ${index + 1}: Step description is required`);
      }
    });

    return errors;
  }

  ngOnInit(): void {
    this.loadCategories();
    
    // Set default publication status based on user permissions
    if (this.isStaff()) {
      this.recipeForm.patchValue({ is_published: true });
    } else {
      // For regular users, default to draft (false) but they can choose to publish
      this.recipeForm.patchValue({ is_published: false });
    }
    
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
    if (recipe.ingredients && recipe.ingredients.length > 0) {
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
    } else {
      // Ensure at least one ingredient field exists
      this.ingredientsArray.push(this.createIngredientGroup());
    }

    // Populate instructions
    if (recipe.instructions && recipe.instructions.length > 0) {
      recipe.instructions.forEach(instruction => {
        this.instructionsArray.push(this.fb.control(instruction, Validators.required));
      });
    } else {
      // Ensure at least one instruction field exists
      this.instructionsArray.push(this.fb.control('', Validators.required));
    }

    // Populate tags
    this.tags.set([...recipe.tags]);

    // Populate main form with proper defaults
    this.recipeForm.patchValue({
      title: recipe.title || '',
      description: recipe.description || '',
      prep_time: recipe.prep_time || 1,
      cook_time: recipe.cook_time || 1,
      servings: recipe.servings || 1,
      difficulty: recipe.difficulty || 'medium',
      cooking_method: recipe.cooking_method || 'other',
      cuisine_type: recipe.cuisine_type || '',
      categories: recipe.categories?.map(cat => cat.id) || [],

      nutrition_info: recipe.nutrition_info || {},
      is_published: this.isStaff() ? recipe.is_published : false // Non-staff users cannot publish recipes
    });

    // Debug: Log form validation status
    console.log('Form populated. Valid:', this.recipeForm.valid);
    console.log('Form errors:', this.getFormValidationErrors());
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
    if (this.recipeForm.valid) {
      // Use the user's choice for publication status (from radio buttons)
      this.submitForm();
    } else {
      this.markFormGroupTouched(this.recipeForm);
      const errors = this.getFormValidationErrors();
      console.log('Form validation errors:', errors);
      
      // Create a more helpful error message
      let errorMessage = 'Please fix the following form errors:\n';
      Object.keys(errors).forEach(field => {
        if (field === 'ingredients' || field === 'instructions') {
          errorMessage += `- ${field}: Some items are incomplete\n`;
        } else {
          errorMessage += `- ${field}: Required field\n`;
        }
      });
      
      this.snackBar.open(errorMessage, 'Close', { duration: 5000 });
    }
  }

  private getFormValidationErrors(): any {
    const formErrors: any = {};
    
    Object.keys(this.recipeForm.controls).forEach(key => {
      const control = this.recipeForm.get(key);
      const controlErrors = control?.errors;
      if (controlErrors) {
        formErrors[key] = {
          errors: controlErrors,
          value: control?.value,
          valid: control?.valid,
          touched: control?.touched
        };
      }
    });

    // Check form arrays for errors
    const ingredientsErrors = this.ingredientsArray.controls.map((control, index) => {
      const errors = control.errors;
      if (errors) {
        return { index, errors, value: control.value };
      }
      return null;
    }).filter(error => error !== null);

    const instructionsErrors = this.instructionsArray.controls.map((control, index) => {
      const errors = control.errors;
      if (errors) {
        return { index, errors, value: control.value };
      }
      return null;
    }).filter(error => error !== null);

    if (ingredientsErrors.length > 0) {
      formErrors.ingredients = ingredientsErrors;
    }
    if (instructionsErrors.length > 0) {
      formErrors.instructions = instructionsErrors;
    }
    
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
    
    const operation = this.isEditing() 
      ? this.recipeService.updateRecipe(this.recipeId!, formData)
      : this.recipeService.createRecipe(formData);

    operation.pipe(
      finalize(() => this.submitting.set(false))
    ).subscribe({
      next: (recipe) => {
        const message = this.isEditing() ? 'Recipe updated successfully' : 'Recipe created successfully';
        this.snackBar.open(message, 'Close', { duration: 3000 });
        // Replace URL to prevent going back to form when user clicks back
        // Add fromEdit flag if we were editing
        const queryParams = this.isEditing() ? { fromEdit: 'true' } : {};
        this.router.navigate(['/recipes', recipe.id], { 
          replaceUrl: true,
          queryParams 
        });
      },
      error: (error) => {
        console.error('Recipe submission error:', error);
        
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
      is_published: this.isStaff() ? (formValue.is_published !== undefined ? formValue.is_published : true) : false
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

    // Handle optional arrays (don't JSON.stringify - send as individual form fields)
    if (formValue.categories && formValue.categories.length > 0) {
      formValue.categories.forEach((categoryId: string) => {
        formData.append('categories', categoryId);
      });
    }



    // Handle tags from signal (send as JSON array for consistency)
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
      // Navigate to recipe detail with a flag indicating we came from edit
      this.router.navigate(['/recipes', this.recipeId], { 
        replaceUrl: true,
        queryParams: { fromEdit: 'true' }
      });
    } else {
      this.router.navigate(['/recipes']);
    }
  }

  isStaff(): boolean {
    return this.authService.isStaff();
  }
}