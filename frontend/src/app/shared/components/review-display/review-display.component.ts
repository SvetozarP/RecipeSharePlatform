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
  template: `
    <div class="reviews-container">
      <!-- Reviews Header -->
      <div class="reviews-header" *ngIf="showHeader">
        <h3 class="reviews-title">
          <mat-icon>rate_review</mat-icon>
          Reviews ({{ totalCount }})
        </h3>
        
        <div class="sorting-controls" *ngIf="reviews.length > 0">
          <mat-form-field appearance="outline" class="sort-field">
            <mat-label>Sort by</mat-label>
            <mat-select [value]="sortBy" (selectionChange)="onSortChange($event.value)">
              <mat-option value="-created_at">Newest First</mat-option>
              <mat-option value="created_at">Oldest First</mat-option>
              <mat-option value="-rating">Highest Rated</mat-option>
              <mat-option value="rating">Lowest Rated</mat-option>
              <mat-option value="-helpful_count">Most Helpful</mat-option>
            </mat-select>
          </mat-form-field>
        </div>
      </div>

      <!-- Loading State -->
      <div *ngIf="loading" class="loading-container">
        <mat-spinner diameter="40"></mat-spinner>
        <p class="loading-text">Loading reviews...</p>
      </div>

      <!-- No Reviews State -->
      <div *ngIf="!loading && reviews.length === 0" class="no-reviews">
        <mat-icon class="no-reviews-icon">rate_review</mat-icon>
        <h4>No reviews yet</h4>
        <p>Be the first to share your thoughts about this recipe!</p>
      </div>

      <!-- Reviews List -->
      <div *ngIf="!loading && reviews.length > 0" class="reviews-list">
        <div 
          *ngFor="let review of reviews; trackBy: trackByReviewId" 
          class="review-item"
          [class.highlighted]="highlightedReviewId === review.id">
          
          <!-- Review Header -->
          <div class="review-header">
            <div class="reviewer-info">
              <div class="reviewer-avatar">
                <mat-icon>account_circle</mat-icon>
              </div>
              <div class="reviewer-details">
                <div class="reviewer-name">
                  {{ review.user_name }}
                  <mat-chip 
                    *ngIf="review.is_verified_purchase" 
                    class="verified-chip"
                    matTooltip="Verified - This user has made this recipe">
                    <mat-icon>verified</mat-icon>
                    Verified
                  </mat-chip>
                </div>
                <div class="review-meta">
                  <app-star-rating 
                    [value]="review.rating" 
                    [interactive]="false"
                    [size]="16">
                  </app-star-rating>
                  <span class="review-date">{{ formatDate(review.created_at) }}</span>
                </div>
              </div>
            </div>

            <!-- Review Actions (for authenticated users) -->
            <div class="review-actions" *ngIf="isAuthenticated">
              <button 
                mat-icon-button
                *ngIf="!currentUserReview || currentUserReview.id !== review.id"
                [disabled]="helpfulClicked().has(review.id)"
                (click)="onMarkHelpful(review)"
                [matTooltip]="helpfulClicked().has(review.id) ? 'Already marked as helpful' : 'Mark as helpful'">
                <mat-icon 
                  [class.text-primary]="helpfulClicked().has(review.id)">
                  thumb_up
                </mat-icon>
              </button>

              <!-- Edit/Delete buttons for own reviews -->
              <div *ngIf="currentUserReview && currentUserReview.id === review.id" class="own-review-actions">
                <button 
                  mat-icon-button
                  (click)="onEditReview(review)"
                  matTooltip="Edit your review">
                  <mat-icon>edit</mat-icon>
                </button>
                <button 
                  mat-icon-button
                  color="warn"
                  (click)="onDeleteReview(review)"
                  matTooltip="Delete your review">
                  <mat-icon>delete</mat-icon>
                </button>
              </div>
            </div>
          </div>

          <!-- Review Content -->
          <div class="review-content" *ngIf="review.review && review.review.trim()">
            <p class="review-text">{{ review.review }}</p>
          </div>

          <!-- Review Footer -->
          <div class="review-footer" *ngIf="review.helpful_count > 0">
            <div class="helpful-count">
              <mat-icon class="helpful-icon">thumb_up</mat-icon>
              <span>{{ review.helpful_count }} people found this helpful</span>
            </div>
          </div>
        </div>
      </div>

      <!-- Load More Button -->
      <div *ngIf="hasMore && !loading" class="load-more-container">
        <button 
          mat-raised-button 
          color="primary"
          (click)="onLoadMore()"
          [disabled]="loadingMore">
          <mat-spinner diameter="20" *ngIf="loadingMore"></mat-spinner>
          <span *ngIf="!loadingMore">Load More Reviews</span>
          <span *ngIf="loadingMore">Loading...</span>
        </button>
      </div>
    </div>
  `,
  styles: [`
    .reviews-container {
      width: 100%;
    }

    .reviews-header {
      display: flex;
      justify-content: space-between;
      align-items: center;
      margin-bottom: 24px;
      flex-wrap: wrap;
      gap: 16px;
    }

    .reviews-title {
      display: flex;
      align-items: center;
      gap: 8px;
      margin: 0;
      font-size: 1.25rem;
      font-weight: 600;
      color: #333;
    }

    .sorting-controls {
      display: flex;
      align-items: center;
    }

    .sort-field {
      width: 180px;
    }

    .loading-container {
      display: flex;
      flex-direction: column;
      align-items: center;
      padding: 40px 20px;
      gap: 16px;
    }

    .loading-text {
      color: #666;
      margin: 0;
    }

    .no-reviews {
      text-align: center;
      padding: 40px 20px;
      color: #666;
    }

    .no-reviews-icon {
      font-size: 48px;
      color: #ccc;
      margin-bottom: 16px;
    }

    .no-reviews h4 {
      margin: 0 0 8px 0;
      color: #555;
    }

    .no-reviews p {
      margin: 0;
    }

    .reviews-list {
      display: flex;
      flex-direction: column;
      gap: 24px;
    }

    .review-item {
      background: white;
      border: 1px solid #e0e0e0;
      border-radius: 8px;
      padding: 20px;
      transition: box-shadow 0.2s ease, border-color 0.2s ease;
    }

    .review-item:hover {
      box-shadow: 0 2px 8px rgba(0, 0, 0, 0.1);
      border-color: #ccc;
    }

    .review-item.highlighted {
      border-color: #1976d2;
      box-shadow: 0 0 0 2px rgba(25, 118, 210, 0.2);
    }

    .review-header {
      display: flex;
      justify-content: space-between;
      align-items: flex-start;
      margin-bottom: 12px;
    }

    .reviewer-info {
      display: flex;
      align-items: flex-start;
      gap: 12px;
      flex: 1;
    }

    .reviewer-avatar {
      color: #666;
    }

    .reviewer-avatar mat-icon {
      font-size: 32px;
      width: 32px;
      height: 32px;
    }

    .reviewer-details {
      flex: 1;
    }

    .reviewer-name {
      display: flex;
      align-items: center;
      gap: 8px;
      font-weight: 600;
      margin-bottom: 4px;
    }

    .verified-chip {
      font-size: 12px;
      padding: 2px 8px;
      background: #e8f5e8;
      color: #2e7d32;
    }

    .verified-chip mat-icon {
      font-size: 14px;
      width: 14px;
      height: 14px;
    }

    .review-meta {
      display: flex;
      align-items: center;
      gap: 12px;
      font-size: 14px;
      color: #666;
    }

    .review-date {
      font-size: 13px;
    }

    .review-actions {
      display: flex;
      align-items: center;
      gap: 4px;
    }

    .own-review-actions {
      display: flex;
      gap: 4px;
    }

    .review-content {
      margin: 16px 0;
    }

    .review-text {
      line-height: 1.6;
      color: #333;
      margin: 0;
      white-space: pre-wrap;
    }

    .review-footer {
      margin-top: 16px;
      padding-top: 12px;
      border-top: 1px solid #f0f0f0;
    }

    .helpful-count {
      display: flex;
      align-items: center;
      gap: 6px;
      font-size: 14px;
      color: #666;
    }

    .helpful-icon {
      font-size: 16px;
      color: #1976d2;
    }

    .load-more-container {
      display: flex;
      justify-content: center;
      margin-top: 24px;
    }

    .text-primary {
      color: #1976d2 !important;
    }

    @media (max-width: 768px) {
      .reviews-header {
        flex-direction: column;
        align-items: stretch;
      }

      .review-header {
        flex-direction: column;
        gap: 12px;
      }

      .review-actions {
        align-self: flex-end;
      }

      .sort-field {
        width: 100%;
      }
    }
  `]
})
export class ReviewDisplayComponent implements OnInit {
  @Input() reviews: RatingListItem[] = [];
  @Input() loading: boolean = false;
  @Input() loadingMore: boolean = false;
  @Input() hasMore: boolean = false;
  @Input() totalCount: number = 0;
  @Input() sortBy: string = '-created_at';
  @Input() showHeader: boolean = true;
  @Input() highlightedReviewId?: string;
  @Input() currentUserReview?: RatingListItem;

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