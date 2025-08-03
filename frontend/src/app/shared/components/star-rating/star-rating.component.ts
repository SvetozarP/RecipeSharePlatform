import { Component, Input, Output, EventEmitter, signal, computed, OnInit, OnChanges } from '@angular/core';
import { CommonModule } from '@angular/common';
import { MaterialModule } from '../../material.module';

@Component({
  selector: 'app-star-rating',
  standalone: true,
  imports: [CommonModule, MaterialModule],
  templateUrl: './star-rating.component.html',
  styleUrls: ['./star-rating.component.scss']
})
export class StarRatingComponent implements OnInit, OnChanges {
  @Input() value = 0; // Current rating value (0-5)
  @Input() interactive = false; // Whether rating can be changed
  @Input() disabled = false; // Whether interactive rating is disabled
  @Input() showValue = false; // Show numeric value next to stars
  @Input() showCount = false; // Show count in parentheses
  @Input() count?: number; // Number of ratings/reviews
  @Input() allowClear = true; // Allow clearing the rating in interactive mode
  @Input() size = 20; // Star size in pixels
  @Input() cssClass = ''; // Additional CSS classes

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