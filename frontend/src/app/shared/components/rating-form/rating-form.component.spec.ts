import { ComponentFixture, TestBed } from '@angular/core/testing';
import { NoopAnimationsModule } from '@angular/platform-browser/animations';
import { ReactiveFormsModule } from '@angular/forms';
import { MatSnackBar } from '@angular/material/snack-bar';
import { of } from 'rxjs';
import { RatingFormComponent } from './rating-form.component';
import { MaterialModule } from '../../material.module';
import { StarRatingComponent } from '../star-rating/star-rating.component';
import { AuthService } from '../../../core/services/auth.service';
import { Rating } from '../../models/recipe.models';

describe('RatingFormComponent', () => {
  let component: RatingFormComponent;
  let fixture: ComponentFixture<RatingFormComponent>;
  let authServiceSpy: jasmine.SpyObj<AuthService>;
  let snackBarSpy: jasmine.SpyObj<MatSnackBar>;

  const mockRating: Rating = {
    id: '1',
    rating: 4,
    review: 'Great recipe!',
    user: '1', // UUID of user
    created_at: '2024-01-15T10:00:00Z',
    updated_at: '2024-01-15T10:00:00Z',
    helpful_count: 2,
    is_verified_purchase: false
  };

  beforeEach(async () => {
    const authSpy = jasmine.createSpyObj('AuthService', ['isAuthenticated'], {
      isAuthenticated$: of(true)
    });
    const snackSpy = jasmine.createSpyObj('MatSnackBar', ['open']);

    await TestBed.configureTestingModule({
      imports: [
        RatingFormComponent,
        ReactiveFormsModule,
        MaterialModule,
        NoopAnimationsModule
      ],
      providers: [
        { provide: AuthService, useValue: authSpy },
        { provide: MatSnackBar, useValue: snackSpy }
      ]
    }).compileComponents();

    fixture = TestBed.createComponent(RatingFormComponent);
    component = fixture.componentInstance;
    authServiceSpy = TestBed.inject(AuthService) as jasmine.SpyObj<AuthService>;
    snackBarSpy = TestBed.inject(MatSnackBar) as jasmine.SpyObj<MatSnackBar>;

    component.recipeId = '1';
    authServiceSpy.isAuthenticated.and.returnValue(true);
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });

  it('should have default values', () => {
    expect(component.isOwnRecipe).toBe(false);
    expect(component.showCancelButton).toBe(true);
    expect(component.existingRating).toBeUndefined();
  });

  describe('Form Initialization', () => {
    it('should initialize form with default values', () => {
      component.ngOnInit();
      
      expect(component.ratingForm).toBeDefined();
      expect(component.ratingForm.get('rating')?.value).toBe(0);
      expect(component.ratingForm.get('review')?.value).toBe('');
    });

    it('should initialize form with existing rating values', () => {
      component.existingRating = mockRating;
      component.ngOnInit();
      
      expect(component.ratingForm.get('rating')?.value).toBe(4);
      expect(component.ratingForm.get('review')?.value).toBe('Great recipe!');
      expect(component.selectedRating()).toBe(4);
    });

    it('should set up form validation', () => {
      component.ngOnInit();
      
      const ratingControl = component.ratingForm.get('rating');
      const reviewControl = component.ratingForm.get('review');
      
      expect(ratingControl?.hasValidator).toBeTruthy();
      expect(reviewControl?.hasValidator).toBeTruthy();
    });
  });

  describe('Rating Change', () => {
    beforeEach(() => {
      component.ngOnInit();
    });

    it('should update selected rating and form value', () => {
      component.onRatingChange(3);
      
      expect(component.selectedRating()).toBe(3);
      expect(component.ratingForm.get('rating')?.value).toBe(3);
    });

    it('should mark rating control as touched', () => {
      const ratingControl = component.ratingForm.get('rating');
      spyOn(ratingControl!, 'markAsTouched');
      
      component.onRatingChange(4);
      
      expect(ratingControl?.markAsTouched).toHaveBeenCalled();
    });
  });

  describe('Form Submission', () => {
    beforeEach(() => {
      component.ngOnInit();
    });

    it('should emit rating data for new rating', () => {
      spyOn(component.ratingSubmitted, 'emit');
      component.onRatingChange(4);
      component.ratingForm.patchValue({ review: 'Great recipe!' });
      
      component.onSubmit();
      
      expect(component.ratingSubmitted.emit).toHaveBeenCalledWith({
        rating: 4,
        review: 'Great recipe!',
        recipe: '1'
      });
    });

    it('should emit rating data for existing rating update', () => {
      component.existingRating = mockRating;
      component.ngOnInit();
      spyOn(component.ratingSubmitted, 'emit');
      
      component.onRatingChange(5);
      component.ratingForm.patchValue({ review: 'Updated review' });
      
      component.onSubmit();
      
      expect(component.ratingSubmitted.emit).toHaveBeenCalledWith({
        rating: 5,
        review: 'Updated review'
      });
    });

    it('should not submit when form is invalid', () => {
      spyOn(component.ratingSubmitted, 'emit');
      
      component.onSubmit();
      
      expect(component.ratingSubmitted.emit).not.toHaveBeenCalled();
    });

    it('should not submit when already submitting', () => {
      component.submitting.set(true);
      spyOn(component.ratingSubmitted, 'emit');
      
      component.onSubmit();
      
      expect(component.ratingSubmitted.emit).not.toHaveBeenCalled();
    });

    it('should set submitting state to true when submitting', () => {
      component.onRatingChange(4);
      component.ratingForm.patchValue({ review: 'Test review' });
      
      component.onSubmit();
      
      expect(component.submitting()).toBe(true);
    });

    it('should trim review text', () => {
      spyOn(component.ratingSubmitted, 'emit');
      component.onRatingChange(4);
      component.ratingForm.patchValue({ review: '  Test review  ' });
      
      component.onSubmit();
      
      expect(component.ratingSubmitted.emit).toHaveBeenCalledWith({
        rating: 4,
        review: 'Test review',
        recipe: '1'
      });
    });
  });

  describe('Event Handlers', () => {
    it('should emit cancelled event', () => {
      spyOn(component.cancelled, 'emit');
      
      component.onCancel();
      
      expect(component.cancelled.emit).toHaveBeenCalled();
    });

    it('should emit ratingDeleted event when editing', () => {
      component.existingRating = mockRating;
      component.ngOnInit();
      spyOn(component.ratingDeleted, 'emit');
      
      component.onDelete();
      
      expect(component.ratingDeleted.emit).toHaveBeenCalled();
    });

    it('should not emit ratingDeleted event when not editing', () => {
      spyOn(component.ratingDeleted, 'emit');
      
      component.onDelete();
      
      expect(component.ratingDeleted.emit).not.toHaveBeenCalled();
    });
  });

  describe('Rating Text', () => {
    it('should return correct rating text', () => {
      expect(component.getRatingText()).toBe('');
      
      component.selectedRating.set(1);
      expect(component.getRatingText()).toBe('Poor');
      
      component.selectedRating.set(2);
      expect(component.getRatingText()).toBe('Fair');
      
      component.selectedRating.set(3);
      expect(component.getRatingText()).toBe('Good');
      
      component.selectedRating.set(4);
      expect(component.getRatingText()).toBe('Very Good');
      
      component.selectedRating.set(5);
      expect(component.getRatingText()).toBe('Excellent');
    });
  });

  describe('Validation', () => {
    beforeEach(() => {
      component.ngOnInit();
    });

    it('should show validation summary when form is invalid and touched', () => {
      component.ratingForm.markAsTouched();
      
      expect(component.showValidationSummary()).toBe(true);
    });

    it('should not show validation summary when form is valid', () => {
      component.onRatingChange(4);
      component.ratingForm.markAsTouched();
      
      expect(component.showValidationSummary()).toBe(false);
    });

    it('should not show validation summary when submitting', () => {
      component.submitting.set(true);
      component.ratingForm.markAsTouched();
      
      expect(component.showValidationSummary()).toBe(false);
    });

    it('should mark all form controls as touched', () => {
      const ratingControl = component.ratingForm.get('rating');
      const reviewControl = component.ratingForm.get('review');
      spyOn(ratingControl!, 'markAsTouched');
      spyOn(reviewControl!, 'markAsTouched');
      
      (component as any).markFormGroupTouched();
      
      expect(ratingControl?.markAsTouched).toHaveBeenCalled();
      expect(reviewControl?.markAsTouched).toHaveBeenCalled();
    });
  });

  describe('Computed Properties', () => {
    beforeEach(() => {
      component.ngOnInit();
    });

    it('should calculate review length correctly', () => {
      component.ratingForm.patchValue({ review: 'Test review' });
      
      expect(component.reviewLength()).toBe(11);
    });

    it('should return 0 for empty review', () => {
      expect(component.reviewLength()).toBe(0);
    });

    it('should return authentication status', () => {
      expect(component.isAuthenticated).toBe(true);
    });

    it('should return editing status', () => {
      expect(component.isEditing).toBe(false);
      
      component.existingRating = mockRating;
      expect(component.isEditing).toBe(true);
    });
  });

  describe('State Management', () => {
    it('should reset submission state', () => {
      component.submitting.set(true);
      
      component.resetSubmissionState();
      
      expect(component.submitting()).toBe(false);
    });
  });

  describe('Lifecycle', () => {
    it('should clean up subscriptions on destroy', () => {
      component.ngOnInit();
      spyOn(component['destroy$'], 'next');
      spyOn(component['destroy$'], 'complete');
      
      component.ngOnDestroy();
      
      expect(component['destroy$'].next).toHaveBeenCalled();
      expect(component['destroy$'].complete).toHaveBeenCalled();
    });
  });
}); 