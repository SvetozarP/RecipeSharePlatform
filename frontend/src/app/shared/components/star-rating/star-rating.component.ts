import { Component, Input, Output, EventEmitter, signal, computed } from '@angular/core';
import { CommonModule } from '@angular/common';
import { MaterialModule } from '../../material.module';

@Component({
  selector: 'app-star-rating',
  standalone: true,
  imports: [CommonModule, MaterialModule],
  template: `
    <div class="star-rating-container" [class]="cssClass">
      <!-- Display Mode (non-interactive) -->
      <div *ngIf="!interactive" class="star-display" [attr.aria-label]="'Rating: ' + value + ' out of 5 stars'">
        <mat-icon 
          *ngFor="let star of starArray(); let i = index" 
          class="star"
          [class.filled]="star === 'star'"
          [class.half]="star === 'star_half'"
          [class.empty]="star === 'star_border'"
          [style.color]="getStarColor(star)"
          [style.font-size.px]="size">
          {{ star }}
        </mat-icon>
        <span *ngIf="showValue" class="rating-value">{{ value | number:'1.1-1' }}</span>
        <span *ngIf="showCount && count !== undefined" class="rating-count">({{ count }})</span>
      </div>

      <!-- Interactive Mode (for rating input) -->
      <div *ngIf="interactive" class="star-input" [attr.aria-label]="'Rate this item from 1 to 5 stars'">
        <button
          *ngFor="let star of interactiveStars(); let i = index"
          type="button"
          class="star-button"
          [class.hovered]="hoveredRating() >= i + 1"
          [class.selected]="selectedRating() >= i + 1"
          [disabled]="disabled"
          [style.font-size.px]="size"
          (click)="onStarClick(i + 1)"
          (mouseenter)="onStarHover(i + 1)"
          (mouseleave)="onStarLeave()"
          [attr.aria-label]="'Rate ' + (i + 1) + ' star' + (i > 0 ? 's' : '')">
          <mat-icon 
            class="star"
            [style.color]="getInteractiveStarColor(i + 1)">
            {{ getInteractiveStarIcon(i + 1) }}
          </mat-icon>
        </button>
        <button 
          *ngIf="allowClear && selectedRating() > 0"
          type="button"
          class="clear-button"
          (click)="onClear()"
          [disabled]="disabled"
          matTooltip="Clear rating">
          <mat-icon class="clear-icon">clear</mat-icon>
        </button>
      </div>
    </div>
  `,
  styles: [`
    .star-rating-container {
      display: inline-flex;
      align-items: center;
      gap: 4px;
    }

    .star-display {
      display: flex;
      align-items: center;
      gap: 2px;
    }

    .star-input {
      display: flex;
      align-items: center;
      gap: 2px;
    }

    .star {
      cursor: inherit;
      user-select: none;
    }

    .star.filled {
      color: #ffd700;
    }

    .star.half {
      color: #ffd700;
    }

    .star.empty {
      color: #e0e0e0;
    }

    .star-button {
      background: none;
      border: none;
      padding: 2px;
      cursor: pointer;
      border-radius: 4px;
      transition: background-color 0.2s ease;
      display: flex;
      align-items: center;
      justify-content: center;
    }

    .star-button:hover:not(:disabled) {
      background-color: rgba(0, 0, 0, 0.04);
    }

    .star-button:focus {
      outline: 2px solid #1976d2;
      outline-offset: 2px;
    }

    .star-button:disabled {
      cursor: default;
      opacity: 0.6;
    }

    .star-button .star {
      transition: color 0.2s ease, transform 0.1s ease;
    }

    .star-button:hover:not(:disabled) .star {
      transform: scale(1.1);
    }

    .star-button.hovered .star,
    .star-button.selected .star {
      color: #ffd700;
    }

    .clear-button {
      background: none;
      border: none;
      padding: 4px;
      cursor: pointer;
      border-radius: 50%;
      margin-left: 8px;
      display: flex;
      align-items: center;
      justify-content: center;
      opacity: 0.7;
      transition: opacity 0.2s ease, background-color 0.2s ease;
    }

    .clear-button:hover:not(:disabled) {
      opacity: 1;
      background-color: rgba(0, 0, 0, 0.04);
    }

    .clear-button:focus {
      outline: 2px solid #1976d2;
      outline-offset: 2px;
    }

    .clear-icon {
      font-size: 18px;
      color: #666;
    }

    .rating-value {
      font-weight: 500;
      margin-left: 8px;
      color: #333;
    }

    .rating-count {
      color: #666;
      margin-left: 4px;
    }

    /* Size variations */
    .small {
      font-size: 16px;
    }

    .medium {
      font-size: 20px;
    }

    .large {
      font-size: 24px;
    }
  `]
})
export class StarRatingComponent {
  @Input() value: number = 0; // Current rating value (0-5)
  @Input() interactive: boolean = false; // Whether rating can be changed
  @Input() disabled: boolean = false; // Whether interactive rating is disabled
  @Input() showValue: boolean = false; // Show numeric value next to stars
  @Input() showCount: boolean = false; // Show count in parentheses
  @Input() count?: number; // Number of ratings/reviews
  @Input() allowClear: boolean = true; // Allow clearing the rating in interactive mode
  @Input() size: number = 20; // Star size in pixels
  @Input() cssClass: string = ''; // Additional CSS classes

  @Output() ratingChange = new EventEmitter<number>();
  @Output() ratingHover = new EventEmitter<number>();
  @Output() ratingClear = new EventEmitter<void>();

  // Signals for reactive state management
  selectedRating = signal(0);
  hoveredRating = signal(0);

  ngOnInit() {
    this.selectedRating.set(this.value);
  }

  ngOnChanges() {
    this.selectedRating.set(this.value);
  }

  // Computed array of star icons for display mode
  starArray = computed(() => {
    const stars: string[] = [];
    const rating = this.value;
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
  });

  // Array for interactive stars (always 5 stars)
  interactiveStars = computed(() => Array(5).fill(0));

  onStarClick(rating: number): void {
    if (this.disabled) return;
    
    this.selectedRating.set(rating);
    this.ratingChange.emit(rating);
  }

  onStarHover(rating: number): void {
    if (this.disabled) return;
    
    this.hoveredRating.set(rating);
    this.ratingHover.emit(rating);
  }

  onStarLeave(): void {
    this.hoveredRating.set(0);
  }

  onClear(): void {
    if (this.disabled) return;
    
    this.selectedRating.set(0);
    this.hoveredRating.set(0);
    this.ratingChange.emit(0);
    this.ratingClear.emit();
  }

  getStarColor(starType: string): string {
    switch (starType) {
      case 'star':
      case 'star_half':
        return '#ffd700';
      default:
        return '#e0e0e0';
    }
  }

  getInteractiveStarIcon(position: number): string {
    const currentRating = this.hoveredRating() || this.selectedRating();
    return currentRating >= position ? 'star' : 'star_border';
  }

  getInteractiveStarColor(position: number): string {
    const currentRating = this.hoveredRating() || this.selectedRating();
    return currentRating >= position ? '#ffd700' : '#e0e0e0';
  }
}