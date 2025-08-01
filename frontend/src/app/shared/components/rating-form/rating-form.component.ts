import { Component, Input, Output, EventEmitter, OnInit, OnDestroy, inject, signal, computed } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ReactiveFormsModule, FormBuilder, FormGroup, Validators } from '@angular/forms';
import { MaterialModule } from '../../material.module';
import { StarRatingComponent } from '../star-rating/star-rating.component';
import { Rating, RatingCreate, RatingUpdate } from '../../models/recipe.models';
import { AuthService } from '../../../core/services/auth.service';
import { MatSnackBar } from '@angular/material/snack-bar';
import { Subject, takeUntil } from 'rxjs';

@Component({
  selector: 'app-rating-form',
  standalone: true,
  imports: [CommonModule, ReactiveFormsModule, MaterialModule, StarRatingComponent],
  template: `
    <div class="rating-form-container">
      <!-- Form Header -->
      <div class="form-header">
        <h4 class="form-title">
          <mat-icon>{{ isEditing ? 'edit' : 'rate_review' }}</mat-icon>
          {{ isEditing ? 'Edit Your Review' : 'Write a Review' }}
        </h4>
        <button 
          *ngIf="showCancelButton"
          mat-icon-button
          (click)="onCancel()"
          matTooltip="Cancel">
          <mat-icon>close</mat-icon>
        </button>
      </div>

      <!-- Authentication Check -->
      <div *ngIf="!isAuthenticated" class="auth-prompt">
        <mat-icon>info</mat-icon>
        <p>Please <a routerLink="/auth/login">log in</a> to write a review.</p>
      </div>

      <!-- Own Recipe Check -->
      <div *ngIf="isAuthenticated && isOwnRecipe" class="own-recipe-notice">
        <mat-icon>info</mat-icon>
        <p>You cannot rate your own recipe.</p>
      </div>

      <!-- Rating Form -->
      <form 
        *ngIf="isAuthenticated && !isOwnRecipe" 
        [formGroup]="ratingForm" 
        (ngSubmit)="onSubmit()"
        class="rating-form">
        
        <!-- Star Rating -->
        <div class="rating-section">
          <label class="rating-label">Your Rating *</label>
          <div class="star-rating-wrapper">
            <app-star-rating
              [value]="selectedRating()"
              [interactive]="true"
              [disabled]="submitting()"
              [size]="32"
              [allowClear]="false"
              (ratingChange)="onRatingChange($event)">
            </app-star-rating>
            <span class="rating-text">{{ getRatingText() }}</span>
          </div>
          <mat-error *ngIf="ratingForm.get('rating')?.invalid && ratingForm.get('rating')?.touched">
            Please select a rating
          </mat-error>
        </div>

        <!-- Review Text -->
        <div class="review-section">
          <mat-form-field appearance="fill" class="review-field">
            <mat-label>Your Review (optional)</mat-label>
            <textarea 
              matInput
              formControlName="review"
              placeholder="Share your experience with this recipe..."
              rows="4"
              maxlength="2000"
              [disabled]="submitting()">
            </textarea>
            <mat-hint align="end">{{ reviewLength() }}/2000</mat-hint>
            <mat-error *ngIf="ratingForm.get('review')?.invalid">
              Review must be less than 2000 characters
            </mat-error>
          </mat-form-field>
        </div>

        <!-- Form Actions -->
        <div class="form-actions">
          <button 
            type="button"
            mat-button
            *ngIf="showCancelButton"
            (click)="onCancel()"
            [disabled]="submitting()">
            Cancel
          </button>
          
          <button 
            type="submit"
            mat-raised-button
            color="primary"
            [disabled]="ratingForm.invalid || submitting()">
            <mat-spinner diameter="20" *ngIf="submitting()"></mat-spinner>
            <span *ngIf="!submitting()">
              {{ isEditing ? 'Update Review' : 'Submit Review' }}
            </span>
            <span *ngIf="submitting()">
              {{ isEditing ? 'Updating...' : 'Submitting...' }}
            </span>
          </button>

          <button 
            type="button"
            mat-stroked-button
            color="warn"
            *ngIf="isEditing"
            (click)="onDelete()"
            [disabled]="submitting()">
            <mat-icon>delete</mat-icon>
            Delete Review
          </button>
        </div>

        <!-- Form Validation Summary -->
        <div class="validation-summary" *ngIf="showValidationSummary()">
          <mat-icon color="warn">warning</mat-icon>
          <span>Please correct the errors above before submitting.</span>
        </div>
      </form>
    </div>
  `,
  styles: [`
    .rating-form-container {
      background: white;
      border: 1px solid #e0e0e0;
      border-radius: 8px;
      padding: 24px;
      margin-bottom: 24px;
    }

    .form-header {
      display: flex;
      justify-content: space-between;
      align-items: center;
      margin-bottom: 20px;
    }

    .form-title {
      display: flex;
      align-items: center;
      gap: 8px;
      margin: 0;
      font-size: 1.1rem;
      font-weight: 600;
      color: #333;
    }

    .auth-prompt,
    .own-recipe-notice {
      display: flex;
      align-items: center;
      gap: 12px;
      padding: 16px;
      background: #f5f5f5;
      border-radius: 4px;
      color: #666;
    }

    .auth-prompt a {
      color: #1976d2;
      text-decoration: none;
    }

    .auth-prompt a:hover {
      text-decoration: underline;
    }

    .rating-form {
      display: flex;
      flex-direction: column;
      gap: 24px;
    }

    .rating-section {
      display: flex;
      flex-direction: column;
      gap: 8px;
    }

    .rating-label {
      font-weight: 500;
      color: #333;
      margin-bottom: 4px;
    }

    .star-rating-wrapper {
      display: flex;
      align-items: center;
      gap: 16px;
    }

    .rating-text {
      font-weight: 500;
      color: #666;
      min-width: 80px;
    }

    .review-section {
      display: flex;
      flex-direction: column;
    }

    .review-field {
      width: 100%;
    }

    .form-actions {
      display: flex;
      justify-content: flex-end;
      gap: 12px;
      align-items: center;
      flex-wrap: wrap;
    }

    .validation-summary {
      display: flex;
      align-items: center;
      gap: 8px;
      padding: 12px;
      background: #fff3cd;
      border: 1px solid #ffeaa7;
      border-radius: 4px;
      color: #856404;
      font-size: 14px;
    }

    @media (max-width: 768px) {
      .rating-form-container {
        padding: 16px;
      }

      .form-actions {
        flex-direction: column;
        align-items: stretch;
      }

      .form-actions button {
        width: 100%;
      }

      .star-rating-wrapper {
        flex-direction: column;
        align-items: flex-start;
        gap: 8px;
      }
    }
  `]
})
export class RatingFormComponent implements OnInit, OnDestroy {
  @Input() recipeId!: string;
  @Input() isOwnRecipe: boolean = false;
  @Input() existingRating?: Rating;
  @Input() showCancelButton: boolean = true;

  @Output() ratingSubmitted = new EventEmitter<RatingCreate | RatingUpdate>();
  @Output() ratingDeleted = new EventEmitter<void>();
  @Output() cancelled = new EventEmitter<void>();

  private fb = inject(FormBuilder);
  private authService = inject(AuthService);
  private snackBar = inject(MatSnackBar);
  private destroy$ = new Subject<void>();

  // Signals for reactive state management
  selectedRating = signal(0);
  submitting = signal(false);

  // Form setup
  ratingForm!: FormGroup;

  // Computed properties
  reviewLength = computed(() => {
    const review = this.ratingForm?.get('review')?.value || '';
    return review.length;
  });

  get isAuthenticated(): boolean {
    return this.authService.isAuthenticated();
  }

  get isEditing(): boolean {
    return !!this.existingRating;
  }

  ngOnInit() {
    this.initializeForm();
    this.setupFormWatching();
  }

  ngOnDestroy() {
    this.destroy$.next();
    this.destroy$.complete();
  }

  private initializeForm(): void {
    this.ratingForm = this.fb.group({
      rating: [
        this.existingRating?.rating || 0, 
        [Validators.required, Validators.min(1), Validators.max(5)]
      ],
      review: [
        this.existingRating?.review || '', 
        [Validators.maxLength(2000)]
      ]
    });

    if (this.existingRating) {
      this.selectedRating.set(this.existingRating.rating);
    }
  }

  private setupFormWatching(): void {
    // Watch for changes to update validation display
    this.ratingForm.valueChanges
      .pipe(takeUntil(this.destroy$))
      .subscribe(() => {
        // Any additional form change handling can go here
      });
  }

  onRatingChange(rating: number): void {
    this.selectedRating.set(rating);
    this.ratingForm.patchValue({ rating });
    this.ratingForm.get('rating')?.markAsTouched();
  }

  onSubmit(): void {
    if (this.ratingForm.invalid || this.submitting()) {
      this.markFormGroupTouched();
      return;
    }

    this.submitting.set(true);

    const formValue = this.ratingForm.value;
    const ratingData = {
      rating: formValue.rating,
      review: formValue.review?.trim() || ''
    };

    if (this.isEditing) {
      this.ratingSubmitted.emit(ratingData as RatingUpdate);
    } else {
      this.ratingSubmitted.emit({
        ...ratingData,
        recipe: this.recipeId
      } as RatingCreate);
    }
  }

  onCancel(): void {
    this.cancelled.emit();
  }

  onDelete(): void {
    if (!this.isEditing) return;

    // Could add a confirmation dialog here
    this.ratingDeleted.emit();
  }

  getRatingText(): string {
    const rating = this.selectedRating();
    const texts = {
      0: '',
      1: 'Poor',
      2: 'Fair',
      3: 'Good',
      4: 'Very Good',
      5: 'Excellent'
    };
    return texts[rating as keyof typeof texts] || '';
  }

  showValidationSummary(): boolean {
    return this.ratingForm.invalid && 
           (this.ratingForm.dirty || this.ratingForm.touched) &&
           !this.submitting();
  }

  private markFormGroupTouched(): void {
    Object.keys(this.ratingForm.controls).forEach(key => {
      this.ratingForm.get(key)?.markAsTouched();
    });
  }

  // Method to reset the submission state (called from parent)
  resetSubmissionState(): void {
    this.submitting.set(false);
  }
}