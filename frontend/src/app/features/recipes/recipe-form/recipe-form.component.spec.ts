import { ComponentFixture, TestBed } from '@angular/core/testing';
import { ReactiveFormsModule } from '@angular/forms';
import { ActivatedRoute, Router } from '@angular/router';
import { MatSnackBar } from '@angular/material/snack-bar';
import { NoopAnimationsModule } from '@angular/platform-browser/animations';
import { of, throwError } from 'rxjs';

import { RecipeFormComponent } from './recipe-form.component';
import { RecipeService } from '../../../core/services/recipe.service';
import { AuthService } from '../../../core/services/auth.service';
import { Recipe, Category } from '../../../shared/models/recipe.models';

describe('RecipeFormComponent', () => {
  let component: RecipeFormComponent;
  let fixture: ComponentFixture<RecipeFormComponent>;
  let mockRecipeService: jasmine.SpyObj<RecipeService>;
  let mockAuthService: jasmine.SpyObj<AuthService>;
  let mockRouter: jasmine.SpyObj<Router>;
  let mockRoute: jasmine.SpyObj<ActivatedRoute>;
  let mockSnackBar: jasmine.SpyObj<MatSnackBar>;

  const mockCategories: Category[] = [
    { id: 1, name: 'Breakfast', slug: 'breakfast', is_active: true, ordering: 1 },
    { id: 2, name: 'Lunch', slug: 'lunch', is_active: true, ordering: 2 }
  ];

  const mockRecipe: Recipe = {
    id: 1,
    title: 'Test Recipe',
    slug: 'test-recipe',
    description: 'A test recipe description',
    ingredients: ['1 cup flour', '2 eggs'],
    instructions: ['Mix flour', 'Add eggs'],
    prep_time: 15,
    cook_time: 30,
    total_time: 45,
    servings: 4,
    difficulty: 'easy',
    cooking_method: 'baking',
    cuisine_type: 'american',
    dietary_restrictions: ['vegetarian'],
    tags: ['quick', 'easy'],
    nutrition_info: {
      calories: 250,
      protein: 8,
      carbs: 45,
      fat: 5
    },
    images: [],
    categories: mockCategories,
    author: {
      id: 1,
      username: 'testuser',
      firstName: 'Test',
      lastName: 'User'
    },
    rating_stats: {
      average_rating: 4.5,
      total_ratings: 10,
      rating_distribution: { 5: 6, 4: 3, 3: 1, 2: 0, 1: 0 }
    },
    is_favorited: false,
    created_at: '2024-01-01T00:00:00Z',
    updated_at: '2024-01-01T00:00:00Z'
  };

  beforeEach(async () => {
    const recipeServiceSpy = jasmine.createSpyObj('RecipeService', [
      'getCategories', 'getRecipe', 'createRecipe', 'updateRecipe'
    ]);
    const authServiceSpy = jasmine.createSpyObj('AuthService', ['getCurrentUser']);
    const routerSpy = jasmine.createSpyObj('Router', ['navigate']);
    const routeSpy = jasmine.createSpyObj('ActivatedRoute', [], {
      params: of({})
    });
    const snackBarSpy = jasmine.createSpyObj('MatSnackBar', ['open']);

    await TestBed.configureTestingModule({
      imports: [
        RecipeFormComponent,
        ReactiveFormsModule,
        NoopAnimationsModule
      ],
      providers: [
        { provide: RecipeService, useValue: recipeServiceSpy },
        { provide: AuthService, useValue: authServiceSpy },
        { provide: Router, useValue: routerSpy },
        { provide: ActivatedRoute, useValue: routeSpy },
        { provide: MatSnackBar, useValue: snackBarSpy }
      ]
    }).compileComponents();

    fixture = TestBed.createComponent(RecipeFormComponent);
    component = fixture.componentInstance;
    mockRecipeService = TestBed.inject(RecipeService) as jasmine.SpyObj<RecipeService>;
    mockAuthService = TestBed.inject(AuthService) as jasmine.SpyObj<AuthService>;
    mockRouter = TestBed.inject(Router) as jasmine.SpyObj<Router>;
    mockRoute = TestBed.inject(ActivatedRoute) as jasmine.SpyObj<ActivatedRoute>;
    mockSnackBar = TestBed.inject(MatSnackBar) as jasmine.SpyObj<MatSnackBar>;

    mockRecipeService.getCategories.and.returnValue(of(mockCategories));
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });

  describe('Form Initialization', () => {
    it('should initialize with empty form for new recipe', () => {
      component.ngOnInit();
      
      expect(component.isEditing()).toBe(false);
      expect(component.recipeForm.get('title')?.value).toBe('');
      expect(component.ingredientsArray.length).toBe(1);
      expect(component.instructionsArray.length).toBe(1);
    });

    it('should load and populate form for editing', () => {
      mockRoute.params = of({ id: '1' });
      mockRecipeService.getRecipe.and.returnValue(of(mockRecipe));
      
      component.ngOnInit();
      
      expect(component.isEditing()).toBe(true);
      expect(mockRecipeService.getRecipe).toHaveBeenCalledWith('1');
      expect(component.recipeForm.get('title')?.value).toBe(mockRecipe.title);
      expect(component.ingredientsArray.length).toBe(mockRecipe.ingredients.length);
      expect(component.instructionsArray.length).toBe(mockRecipe.instructions.length);
    });
  });

  describe('Form Validation', () => {
    beforeEach(() => {
      component.ngOnInit();
    });

    it('should be invalid with empty required fields', () => {
      expect(component.recipeForm.valid).toBe(false);
    });

    it('should be valid with all required fields filled', () => {
      component.recipeForm.patchValue({
        title: 'Test Recipe',
        description: 'Test description',
        prep_time: 15,
        cook_time: 30,
        servings: 4,
        difficulty: 'easy'
      });
      
      component.ingredientsArray.at(0)?.setValue('1 cup flour');
      component.instructionsArray.at(0)?.setValue('Mix ingredients');
      
      expect(component.recipeForm.valid).toBe(true);
    });
  });

  describe('Dynamic Form Arrays', () => {
    beforeEach(() => {
      component.ngOnInit();
    });

    it('should add ingredient', () => {
      const initialLength = component.ingredientsArray.length;
      
      component.addIngredient();
      
      expect(component.ingredientsArray.length).toBe(initialLength + 1);
    });

    it('should remove ingredient', () => {
      component.addIngredient(); // Add one more to have 2 total
      const initialLength = component.ingredientsArray.length;
      
      component.removeIngredient(1);
      
      expect(component.ingredientsArray.length).toBe(initialLength - 1);
    });

    it('should not remove last ingredient', () => {
      component.removeIngredient(0);
      
      expect(component.ingredientsArray.length).toBe(1);
    });

    it('should add instruction', () => {
      const initialLength = component.instructionsArray.length;
      
      component.addInstruction();
      
      expect(component.instructionsArray.length).toBe(initialLength + 1);
    });

    it('should remove instruction', () => {
      component.addInstruction(); // Add one more to have 2 total
      const initialLength = component.instructionsArray.length;
      
      component.removeInstruction(1);
      
      expect(component.instructionsArray.length).toBe(initialLength - 1);
    });
  });

  describe('Tag Management', () => {
    beforeEach(() => {
      component.ngOnInit();
    });

    it('should add tag', () => {
      component.addTag('test-tag');
      
      expect(component.tags()).toContain('test-tag');
    });

    it('should not add duplicate tag', () => {
      component.addTag('test-tag');
      component.addTag('test-tag');
      
      expect(component.tags().filter(tag => tag === 'test-tag').length).toBe(1);
    });

    it('should remove tag', () => {
      component.addTag('test-tag');
      component.removeTag(0);
      
      expect(component.tags()).not.toContain('test-tag');
    });
  });

  describe('Form Submission', () => {
    beforeEach(() => {
      component.ngOnInit();
      component.recipeForm.patchValue({
        title: 'Test Recipe',
        description: 'Test description',
        prep_time: 15,
        cook_time: 30,
        servings: 4,
        difficulty: 'easy'
      });
      component.ingredientsArray.at(0)?.setValue('1 cup flour');
      component.instructionsArray.at(0)?.setValue('Mix ingredients');
    });

    it('should create new recipe', () => {
      mockRecipeService.createRecipe.and.returnValue(of(mockRecipe));
      
      component.onSubmit();
      
      expect(mockRecipeService.createRecipe).toHaveBeenCalled();
      expect(mockRouter.navigate).toHaveBeenCalledWith(['/recipes', mockRecipe.id]);
    });

    it('should update existing recipe', () => {
      component.recipeId = '1';
      mockRecipeService.updateRecipe.and.returnValue(of(mockRecipe));
      
      component.onSubmit();
      
      expect(mockRecipeService.updateRecipe).toHaveBeenCalledWith('1', jasmine.any(FormData));
      expect(mockRouter.navigate).toHaveBeenCalledWith(['/recipes', mockRecipe.id]);
    });

    it('should save as draft', () => {
      mockRecipeService.createRecipe.and.returnValue(of({ ...mockRecipe, is_published: false }));
      
      component.saveDraft();
      
      expect(component.recipeForm.get('is_published')?.value).toBe(false);
      expect(mockRecipeService.createRecipe).toHaveBeenCalled();
    });
  });

  describe('Image Handling', () => {
    beforeEach(() => {
      component.ngOnInit();
    });

    it('should handle image selection', () => {
      const file = new File(['test'], 'test.jpg', { type: 'image/jpeg' });
      const event = { target: { files: [file] } } as any;
      
      component.onImageSelected(event);
      
      expect(component.selectedImage()).toBe(file);
    });
  });

  describe('Computed Values', () => {
    beforeEach(() => {
      component.ngOnInit();
    });

    it('should calculate total time', () => {
      component.recipeForm.patchValue({
        prep_time: 15,
        cook_time: 30
      });
      
      expect(component.totalTime()).toBe(45);
    });
  });
});