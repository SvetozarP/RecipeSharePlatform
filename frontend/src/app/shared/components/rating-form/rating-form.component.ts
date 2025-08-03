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
  templateUrl: './rating-form.component.html',
  styleUrls: ['./rating-form.component.scss']})
export class RatingFormComponent implements OnInit, OnDestroy {
  @Input() recipeId!: string;
  @Input() isOwnRecipe = false;
  @Input() existingRating?: Rating;
  @Input() showCancelButton = true;

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