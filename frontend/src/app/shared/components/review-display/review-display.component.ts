import { Component, Input, Output, EventEmitter, OnInit, inject, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { MaterialModule } from '../../material.module';
import { StarRatingComponent } from '../star-rating/star-rating.component';
import { RatingListItem } from '../../models/recipe.models';
import { AuthService } from '../../../core/services/auth.service';
import { MatSnackBar } from '@angular/material/snack-bar';

@Component({
  selector: 'app-review-display',
  standalone: true,
  imports: [CommonModule, MaterialModule, StarRatingComponent],
  templateUrl: './review-display.component.html',
  styleUrls: ['./review-display.component.scss']})
export class ReviewDisplayComponent implements OnInit {
  @Input() reviews: RatingListItem[] = [];
  @Input() loading = false;
  @Input() loadingMore = false;
  @Input() hasMore = false;
  @Input() totalCount = 0;
  @Input() sortBy = '-created_at';
  @Input() showHeader = true;
  @Input() highlightedReviewId?: string;
  @Input() currentUserReview?: RatingListItem;
  @Input() isRecipeAuthor = false;

  @Output() sortChange = new EventEmitter<string>();
  @Output() loadMore = new EventEmitter<void>();
  @Output() markHelpful = new EventEmitter<RatingListItem>();
  @Output() editReview = new EventEmitter<RatingListItem>();
  @Output() deleteReview = new EventEmitter<RatingListItem>();

  private authService = inject(AuthService);
  private snackBar = inject(MatSnackBar);

  // Track which reviews have been marked as helpful to prevent duplicate clicks
  helpfulClicked = signal(new Set<string>());

  get isAuthenticated(): boolean {
    return this.authService.isAuthenticated();
  }

  ngOnInit() {
    // Reset helpful clicks when component initializes
    this.helpfulClicked.set(new Set());
  }

  onSortChange(newSortBy: string): void {
    this.sortChange.emit(newSortBy);
  }

  onLoadMore(): void {
    this.loadMore.emit();
  }

  onMarkHelpful(review: RatingListItem): void {
    if (!this.isAuthenticated) {
      this.snackBar.open('Please log in to mark reviews as helpful', 'Close', { duration: 3000 });
      return;
    }

    if (this.helpfulClicked().has(review.id)) {
      return;
    }

    // Add to clicked set to prevent duplicate clicks
    const clicked = new Set(this.helpfulClicked());
    clicked.add(review.id);
    this.helpfulClicked.set(clicked);

    this.markHelpful.emit(review);
  }

  onEditReview(review: RatingListItem): void {
    this.editReview.emit(review);
  }

  onDeleteReview(review: RatingListItem): void {
    this.deleteReview.emit(review);
  }

  formatDate(dateString: string): string {
    const date = new Date(dateString);
    const now = new Date();
    const diffInHours = (now.getTime() - date.getTime()) / (1000 * 60 * 60);

    if (diffInHours < 24) {
      if (diffInHours < 1) {
        return 'Just now';
      }
      return `${Math.floor(diffInHours)}h ago`;
    } else if (diffInHours < 24 * 7) {
      return `${Math.floor(diffInHours / 24)}d ago`;
    } else {
      return date.toLocaleDateString();
    }
  }

  trackByReviewId(index: number, review: RatingListItem): string {
    return review.id;
  }
}