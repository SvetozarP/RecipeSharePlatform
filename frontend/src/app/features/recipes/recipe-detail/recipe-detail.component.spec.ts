import { ComponentFixture, TestBed } from '@angular/core/testing';
import { ActivatedRoute, Router } from '@angular/router';
import { MatDialog, MatDialogRef, MAT_DIALOG_DATA } from '@angular/material/dialog';
import { MatSnackBar } from '@angular/material/snack-bar';
import { NoopAnimationsModule } from '@angular/platform-browser/animations';
import { of, throwError } from 'rxjs';
import { signal } from '@angular/core';

import { RecipeDetailComponent, DeleteConfirmationDialog } from './recipe-detail.component';
import { RecipeService } from '../../../core/services/recipe.service';
import { AuthService } from '../../../core/services/auth.service';
import { Recipe } from '../../../shared/models/recipe.models';

describe('RecipeDetailComponent', () => {
  let component: RecipeDetailComponent;
  let fixture: ComponentFixture<RecipeDetailComponent>;
  let mockRecipeService: jasmine.SpyObj<RecipeService>;
  let mockAuthService: jasmine.SpyObj<AuthService>;
  let mockRouter: jasmine.SpyObj<Router>;
  let mockRoute: jasmine.SpyObj<ActivatedRoute>;
  let mockDialog: jasmine.SpyObj<MatDialog>;
  let mockSnackBar: jasmine.SpyObj<MatSnackBar>;

  const mockRecipe: Recipe = {
    id: '1',
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
    images: [
      { id: 1, image: 'test.jpg', alt_text: 'Test image', is_primary: true, ordering: 1 }
    ],
    categories: [
      { id: 1, name: 'Breakfast', slug: 'breakfast', is_active: true, ordering: 1 }
    ],
    author: {
      id: '1',
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
    const recipeServiceSpy = jasmine.createSpyObj('RecipeService', ['getRecipe', 'toggleFavorite', 'deleteRecipe']);
    const authServiceSpy = jasmine.createSpyObj('AuthService', ['getCurrentUser', 'isAuthenticated']);
    authServiceSpy.isAuthenticated.and.returnValue(true);
    const routerSpy = jasmine.createSpyObj('Router', ['navigate', 'createUrlTree', 'serializeUrl']);
    routerSpy.createUrlTree.and.returnValue({} as any);
    routerSpy.serializeUrl.and.returnValue('');
    // Add events observable for RouterLink
    (routerSpy as any).events = of({});
    const routeSpy = jasmine.createSpyObj('ActivatedRoute', [], {
      params: of({ id: '1' }),
      queryParams: of({})
    });
    const dialogSpy = jasmine.createSpyObj('MatDialog', ['open']);
    const snackBarSpy = jasmine.createSpyObj('MatSnackBar', ['open']);

    await TestBed.configureTestingModule({
      imports: [
        RecipeDetailComponent,
        DeleteConfirmationDialog,
        NoopAnimationsModule
      ],
      providers: [
        { provide: RecipeService, useValue: recipeServiceSpy },
        { provide: AuthService, useValue: authServiceSpy },
        { provide: Router, useValue: routerSpy },
        { provide: ActivatedRoute, useValue: routeSpy },
        { provide: MatDialog, useValue: dialogSpy },
        { provide: MatSnackBar, useValue: snackBarSpy }
      ]
    }).compileComponents();

    fixture = TestBed.createComponent(RecipeDetailComponent);
    component = fixture.componentInstance;
    mockRecipeService = TestBed.inject(RecipeService) as jasmine.SpyObj<RecipeService>;
    mockAuthService = TestBed.inject(AuthService) as jasmine.SpyObj<AuthService>;
    mockRouter = TestBed.inject(Router) as jasmine.SpyObj<Router>;
    mockRoute = TestBed.inject(ActivatedRoute) as jasmine.SpyObj<ActivatedRoute>;
    mockDialog = TestBed.inject(MatDialog) as jasmine.SpyObj<MatDialog>;
    mockSnackBar = TestBed.inject(MatSnackBar) as jasmine.SpyObj<MatSnackBar>;
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });

  describe('Recipe Loading', () => {
    it('should load recipe on init', () => {
      mockRecipeService.getRecipe.and.returnValue(of(mockRecipe));
      
      fixture.detectChanges(); // This triggers ngOnInit
      
      expect(mockRecipeService.getRecipe).toHaveBeenCalledWith('1');
      expect(component.recipe()).toEqual(mockRecipe);
      expect(component.loading()).toBe(false);
    });

    it('should handle recipe loading error', () => {
      const error = { error: { detail: 'Recipe not found' } };
      mockRecipeService.getRecipe.and.returnValue(throwError(() => error));
      
      fixture.detectChanges(); // This triggers ngOnInit
      
      expect(component.error()).toBe('Recipe not found');
      expect(component.loading()).toBe(false);
    });
  });

  describe('Image Gallery', () => {
    beforeEach(() => {
      component.recipe.set(mockRecipe);
    });

    it('should navigate to next image', () => {
      const recipeWithMultipleImages = {
        ...mockRecipe,
        images: [
          { id: 1, image: 'image1.jpg', alt_text: 'Image 1', is_primary: true, ordering: 1 },
          { id: 2, image: 'image2.jpg', alt_text: 'Image 2', is_primary: false, ordering: 2 }
        ]
      };
      component.recipe.set(recipeWithMultipleImages);
      component.currentImageIndex.set(0);
      
      component.nextImage();
      
      expect(component.currentImageIndex()).toBe(1);
    });

    it('should navigate to previous image', () => {
      const recipeWithMultipleImages = {
        ...mockRecipe,
        images: [
          { id: 1, image: 'image1.jpg', alt_text: 'Image 1', is_primary: true, ordering: 1 },
          { id: 2, image: 'image2.jpg', alt_text: 'Image 2', is_primary: false, ordering: 2 }
        ]
      };
      component.recipe.set(recipeWithMultipleImages);
      component.currentImageIndex.set(1);
      
      component.previousImage();
      
      expect(component.currentImageIndex()).toBe(0);
    });
  });

  describe('Actions', () => {
    beforeEach(() => {
      component.recipe.set(mockRecipe);
    });

    it('should toggle favorite', () => {
      mockRecipeService.toggleFavorite.and.returnValue(of({ is_favorited: true }));
      
      component.toggleFavorite();
      
      expect(mockRecipeService.toggleFavorite).toHaveBeenCalledWith('1');
      expect(component.recipe()?.is_favorited).toBe(true);
    });

    it('should share recipe via Web Share API', () => {
      const mockShare = jasmine.createSpy('share').and.returnValue(Promise.resolve());
      (navigator as any).share = mockShare;
      
      component.shareRecipe();
      
      expect(mockShare).toHaveBeenCalledWith({
        title: mockRecipe.title,
        text: mockRecipe.description,
        url: window.location.href
      });
    });

    it('should print recipe', () => {
      spyOn(window, 'print');
      
      component.printRecipe();
      
      expect(window.print).toHaveBeenCalled();
    });
  });

  describe('Permissions', () => {
    it('should allow edit for recipe author', () => {
      component.recipe.set(mockRecipe);
      mockAuthService.getCurrentUser.and.returnValue({ 
        id: '1', 
        email: 'test@example.com',
        username: 'testuser',
        first_name: 'Test',
        last_name: 'User',
        isStaff: false 
      });
      
      expect(component.canEditRecipe()).toBe(true);
    });

    it('should allow edit for staff user', () => {
      component.recipe.set(mockRecipe);
      mockAuthService.getCurrentUser.and.returnValue({ 
        id: '2', 
        email: 'staff@example.com',
        username: 'staff',
        first_name: 'Staff',
        last_name: 'User',
        isStaff: true 
      });
      
      expect(component.canEditRecipe()).toBe(true);
    });

    it('should not allow edit for other users', () => {
      component.recipe.set(mockRecipe);
      mockAuthService.getCurrentUser.and.returnValue({ 
        id: '2', 
        email: 'other@example.com',
        username: 'other',
        first_name: 'Other',
        last_name: 'User',
        isStaff: false 
      });
      
      expect(component.canEditRecipe()).toBe(false);
    });

    it('should not allow edit when user is null', () => {
      component.recipe.set(mockRecipe);
      mockAuthService.getCurrentUser.and.returnValue(null);
      
      expect(component.canEditRecipe()).toBe(false);
    });

    it('should not allow edit when recipe is null', () => {
      component.recipe.set(null);
      mockAuthService.getCurrentUser.and.returnValue({ 
        id: '1', 
        email: 'test@example.com',
        username: 'testuser',
        first_name: 'Test',
        last_name: 'User',
        isStaff: false 
      });
      
      expect(component.canEditRecipe()).toBe(false);
    });

    it('should not allow edit when recipe author is null', () => {
      const recipeWithoutAuthor = { ...mockRecipe, author: null as any };
      component.recipe.set(recipeWithoutAuthor);
      mockAuthService.getCurrentUser.and.returnValue({ 
        id: '1', 
        email: 'test@example.com',
        username: 'testuser',
        first_name: 'Test',
        last_name: 'User',
        isStaff: false 
      });
      
      expect(component.canEditRecipe()).toBe(false);
    });
  });

  describe('Helper Methods', () => {
    it('should generate star array for rating', () => {
      const stars = component.getStarArray(4.3);
      
      expect(stars).toEqual(['star', 'star', 'star', 'star', 'star_border']);
    });

    it('should generate star array with half star', () => {
      const stars = component.getStarArray(3.7);
      
      expect(stars).toEqual(['star', 'star', 'star', 'star_half', 'star_border']);
    });
  });
});

describe('DeleteConfirmationDialog', () => {
  let component: DeleteConfirmationDialog;
  let fixture: ComponentFixture<DeleteConfirmationDialog>;
  let mockDialogRef: jasmine.SpyObj<any>;

  beforeEach(async () => {
    const dialogRefSpy = jasmine.createSpyObj('MatDialogRef', ['close']);

    await TestBed.configureTestingModule({
      imports: [DeleteConfirmationDialog, NoopAnimationsModule],
      providers: [
        { provide: MatDialogRef, useValue: dialogRefSpy },
        { provide: MAT_DIALOG_DATA, useValue: { 
          title: 'Test', 
          message: 'Test message', 
          confirmText: 'Delete', 
          cancelText: 'Cancel' 
        }}
      ]
    }).compileComponents();

    fixture = TestBed.createComponent(DeleteConfirmationDialog);
    component = fixture.componentInstance;
    mockDialogRef = TestBed.inject(MatDialogRef) as jasmine.SpyObj<any>;
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });

  it('should close with false on cancel', () => {
    component.onCancel();
    expect(mockDialogRef.close).toHaveBeenCalledWith(false);
  });

  it('should close with true on confirm', () => {
    component.onConfirm();
    expect(mockDialogRef.close).toHaveBeenCalledWith(true);
  });
});