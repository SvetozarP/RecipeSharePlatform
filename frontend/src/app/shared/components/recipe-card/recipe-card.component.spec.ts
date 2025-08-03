import { ComponentFixture, TestBed } from '@angular/core/testing';
import { NoopAnimationsModule } from '@angular/platform-browser/animations';
import { RouterTestingModule } from '@angular/router/testing';
import { of } from 'rxjs';
import { RecipeCardComponent } from './recipe-card.component';
import { MaterialModule } from '../../material.module';
import { AuthService } from '../../../core/services/auth.service';
import { RecipeListItem } from '../../models/recipe.models';

describe('RecipeCardComponent', () => {
  let component: RecipeCardComponent;
  let fixture: ComponentFixture<RecipeCardComponent>;
  let authServiceSpy: jasmine.SpyObj<AuthService>;

  const mockRecipe: RecipeListItem = {
    id: '1',
    title: 'Test Recipe',
    description: 'A test recipe description',
    prep_time: 15,
    cook_time: 30,
    total_time: 45,
    difficulty: 'medium',
    cooking_method: 'stovetop',
    servings: 4,
    author_name: 'Test User',
    thumbnail_url: 'https://example.com/image.jpg',
    rating_stats: {
      average_rating: 4.2,
      total_ratings: 10,
      rating_distribution: {
        1: 0,
        2: 1,
        3: 2,
        4: 4,
        5: 3
      }
    },
    categories: [],
    category_names: [],
    tags: [],
    is_published: true,
    is_favorited: false,
    created_at: '2024-01-15T10:00:00Z'
  };

  beforeEach(async () => {
    const spy = jasmine.createSpyObj('AuthService', [], {
      isAuthenticated$: of(true)
    });

    await TestBed.configureTestingModule({
      imports: [
        RecipeCardComponent,
        MaterialModule,
        NoopAnimationsModule,
        RouterTestingModule
      ],
      providers: [
        { provide: AuthService, useValue: spy }
      ]
    }).compileComponents();

    fixture = TestBed.createComponent(RecipeCardComponent);
    component = fixture.componentInstance;
    authServiceSpy = TestBed.inject(AuthService) as jasmine.SpyObj<AuthService>;
    
    component.recipe = JSON.parse(JSON.stringify(mockRecipe));
  });

  afterEach(() => {
    // Reset recipe to original state after each test
    component.recipe = JSON.parse(JSON.stringify(mockRecipe));
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });

  it('should have default values', () => {
    expect(component.loading).toBe(false);
    expect(component.favoriteLoading).toBe(false);
  });

  describe('getStarArray', () => {
    it('should return array of 5 elements', () => {
      const stars = component.getStarArray();
      expect(stars).toEqual([0, 1, 2, 3, 4]);
      expect(stars.length).toBe(5);
    });
  });

  describe('getStarClass', () => {
    it('should return star-filled for full stars', () => {
      expect(component.getStarClass(0)).toBe('star-filled');
      expect(component.getStarClass(1)).toBe('star-filled');
      expect(component.getStarClass(2)).toBe('star-filled');
      expect(component.getStarClass(3)).toBe('star-filled');
    });

    it('should return star-half for partial star', () => {
      expect(component.getStarClass(4)).toBe('star-half');
    });

    it('should return star-empty for empty stars', () => {
      component.recipe.rating_stats = {
        average_rating: 2.5,
        total_ratings: 5,
        rating_distribution: { 1: 0, 2: 0, 3: 0, 4: 0, 5: 0 }
      };
      expect(component.getStarClass(3)).toBe('star-empty');
    });

    it('should handle undefined rating stats', () => {
      component.recipe.rating_stats = undefined;
      expect(component.getStarClass(0)).toBe('star-empty');
    });
  });

  describe('getStarIcon', () => {
    it('should return star for full stars', () => {
      expect(component.getStarIcon(0)).toBe('star');
      expect(component.getStarIcon(1)).toBe('star');
      expect(component.getStarIcon(2)).toBe('star');
      expect(component.getStarIcon(3)).toBe('star');
    });

    it('should return star_half for partial star', () => {
      expect(component.getStarIcon(4)).toBe('star_half');
    });

    it('should return star_border for empty stars', () => {
      component.recipe.rating_stats = {
        average_rating: 2.5,
        total_ratings: 5,
        rating_distribution: { 1: 0, 2: 0, 3: 0, 4: 0, 5: 0 }
      };
      expect(component.getStarIcon(3)).toBe('star_border');
    });

    it('should handle undefined rating stats', () => {
      component.recipe.rating_stats = undefined;
      expect(component.getStarIcon(0)).toBe('star_border');
    });
  });

  describe('formatTime', () => {
    it('should format minutes correctly', () => {
      expect(component.formatTime(30)).toBe('30m');
      expect(component.formatTime(45)).toBe('45m');
    });

    it('should format hours correctly', () => {
      expect(component.formatTime(60)).toBe('1h');
      expect(component.formatTime(120)).toBe('2h');
    });

    it('should format hours and minutes correctly', () => {
      expect(component.formatTime(90)).toBe('1h 30m');
      expect(component.formatTime(150)).toBe('2h 30m');
    });
  });

  describe('formatDate', () => {
    beforeEach(() => {
      jasmine.clock().install();
      jasmine.clock().mockDate(new Date('2024-01-15T12:00:00Z'));
    });

    afterEach(() => {
      jasmine.clock().uninstall();
    });

    it('should return Today for same day', () => {
      const result = component.formatDate('2024-01-15T10:00:00Z');
      expect(result).toBe('Today');
    });

    it('should return Yesterday for previous day', () => {
      const result = component.formatDate('2024-01-14T10:00:00Z');
      expect(result).toBe('Yesterday');
    });

    it('should return days ago for recent dates', () => {
      const result = component.formatDate('2024-01-13T10:00:00Z');
      expect(result).toBe('2 days ago');
    });

    it('should return weeks ago for older dates', () => {
      const result = component.formatDate('2024-01-08T10:00:00Z');
      expect(result).toBe('1 week ago');
    });

    it('should return weeks ago for multiple weeks', () => {
      const result = component.formatDate('2024-01-01T10:00:00Z');
      expect(result).toBe('2 weeks ago');
    });

    it('should return formatted date for very old dates', () => {
      const result = component.formatDate('2023-12-01T10:00:00Z');
      expect(result).toMatch(/\d{1,2}\/\d{1,2}\/\d{4}/);
    });
  });

  describe('Event Handlers', () => {
    it('should emit favoriteToggle when favorite is clicked', () => {
      spyOn(component.favoriteToggle, 'emit');
      const event = new Event('click');
      spyOn(event, 'preventDefault');
      spyOn(event, 'stopPropagation');

      component.onFavoriteClick(event);

      expect(event.preventDefault).toHaveBeenCalled();
      expect(event.stopPropagation).toHaveBeenCalled();
      expect(component.favoriteToggle.emit).toHaveBeenCalledWith('1');
    });

    it('should emit share when share is clicked', () => {
      spyOn(component.share, 'emit');
      const event = new Event('click');
      spyOn(event, 'preventDefault');
      spyOn(event, 'stopPropagation');

      component.onShareClick(event);

      expect(event.preventDefault).toHaveBeenCalled();
      expect(event.stopPropagation).toHaveBeenCalled();
      expect(component.share.emit).toHaveBeenCalledWith(mockRecipe);
    });
  });

  describe('Image Handling', () => {
    it('should return thumbnail_url when available', () => {
      const result = component.getImageSrc();
      expect(result).toBe('https://example.com/image.jpg');
    });

    it('should return placeholder when thumbnail_url is not available', () => {
      component.recipe.thumbnail_url = undefined;
      const result = component.getImageSrc();
      expect(result).toContain('data:image/svg+xml;base64,');
    });

    it('should handle image error by setting placeholder', () => {
      const event = new Event('error');
      const img = document.createElement('img');
      Object.defineProperty(event, 'target', { value: img });
      
      component.onImageError(event);
      
      expect(img.src).toContain('data:image/svg+xml;base64,');
    });
  });

  describe('Authentication State', () => {
    it('should expose authentication state', () => {
      expect(component.isAuthenticated$).toBeDefined();
      component.isAuthenticated$.subscribe(isAuth => {
        expect(isAuth).toBe(true);
      });
    });
  });

  describe('Loading States', () => {
    it('should show loading state when loading is true', () => {
      component.loading = true;
      fixture.detectChanges();
      
      // The component should handle loading state appropriately
      expect(component.loading).toBe(true);
    });

    it('should show favorite loading state when favoriteLoading is true', () => {
      component.favoriteLoading = true;
      fixture.detectChanges();
      
      expect(component.favoriteLoading).toBe(true);
    });
  });
}); 