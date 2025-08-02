import { Component, Inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { MatDialogRef, MAT_DIALOG_DATA, MatDialogModule } from '@angular/material/dialog';
import { MatCardModule } from '@angular/material/card';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { MatChipsModule } from '@angular/material/chips';
import { MatDividerModule } from '@angular/material/divider';
import { AdminRating } from '../../models/admin.models';

interface DialogData {
  rating: AdminRating;
}

@Component({
  selector: 'app-rating-detail-dialog',
  standalone: true,
  imports: [
    CommonModule,
    MatDialogModule,
    MatCardModule,
    MatButtonModule,
    MatIconModule,
    MatChipsModule,
    MatDividerModule,
  ],
  template: `
    <div class="rating-detail-dialog">
      <div class="dialog-header">
        <h2 mat-dialog-title>
          <mat-icon>visibility</mat-icon>
          Rating Details
        </h2>
        <button mat-icon-button mat-dialog-close>
          <mat-icon>close</mat-icon>
        </button>
      </div>

      <mat-dialog-content>
        <div class="rating-content">
          <!-- Rating Display -->
          <div class="rating-section">
            <h3>Rating</h3>
            <div class="rating-display">
              <div class="stars">
                <span *ngFor="let star of [1,2,3,4,5]" 
                      [class.filled]="star <= data.rating.rating"
                      class="star">
                  ★
                </span>
              </div>
              <div class="rating-value">{{ data.rating.rating }}/5</div>
            </div>
          </div>

          <mat-divider></mat-divider>

          <!-- Recipe Information -->
          <div class="info-section">
            <h3>Recipe</h3>
            <div class="info-item">
              <label>Title:</label>
              <span>{{ data.rating.recipe.title }}</span>
            </div>
            <div class="info-item">
              <label>Slug:</label>
              <span>{{ data.rating.recipe.slug }}</span>
            </div>
            <div class="info-item">
              <label>Recipe ID:</label>
              <span>{{ data.rating.recipe.id }}</span>
            </div>
          </div>

          <mat-divider></mat-divider>

          <!-- User Information -->
          <div class="info-section">
            <h3>User</h3>
            <div class="info-item">
              <label>Username:</label>
              <span>{{ data.rating.user.username }}</span>
            </div>
            <div class="info-item">
              <label>Email:</label>
              <span>{{ data.rating.user.email }}</span>
            </div>
            <div class="info-item">
              <label>User ID:</label>
              <span>{{ data.rating.user.id }}</span>
            </div>
          </div>

          <mat-divider></mat-divider>

          <!-- Review Content -->
          <div class="review-section">
            <h3>Review</h3>
            <div *ngIf="data.rating.review" class="review-content">
              <p>{{ data.rating.review }}</p>
            </div>
            <div *ngIf="!data.rating.review" class="no-review">
              <mat-icon>comment_off</mat-icon>
              <span>No review text provided</span>
            </div>
          </div>

          <mat-divider></mat-divider>

          <!-- Engagement -->
          <div class="engagement-section">
            <h3>Engagement</h3>
            <div class="engagement-info">
              <div class="engagement-item">
                <mat-icon>thumb_up</mat-icon>
                <span>{{ data.rating.helpful_count }} helpful votes</span>
              </div>
              <div class="engagement-item" *ngIf="data.rating.is_verified_purchase">
                <mat-icon>verified</mat-icon>
                <span>Verified Purchase</span>
              </div>
            </div>
          </div>

          <mat-divider></mat-divider>

          <!-- Timestamps -->
          <div class="timestamps-section">
            <h3>Timestamps</h3>
            <div class="info-item">
              <label>Created:</label>
              <span>{{ data.rating.created_at | date:'medium' }}</span>
            </div>
            <div class="info-item" *ngIf="data.rating.updated_at">
              <label>Last Updated:</label>
              <span>{{ data.rating.updated_at | date:'medium' }}</span>
            </div>
          </div>
        </div>
      </mat-dialog-content>

      <mat-dialog-actions align="end">
        <button mat-button mat-dialog-close>Close</button>
      </mat-dialog-actions>
    </div>
  `,
  styles: [`
    .rating-detail-dialog {
      min-width: 500px;
      max-width: 700px;
    }

    .dialog-header {
      display: flex;
      justify-content: space-between;
      align-items: center;
      margin-bottom: 16px;
    }

    .dialog-header h2 {
      display: flex;
      align-items: center;
      margin: 0;
    }

    .dialog-header mat-icon {
      margin-right: 8px;
    }

    .rating-content {
      display: flex;
      flex-direction: column;
      gap: 16px;
    }

    .rating-section,
    .info-section,
    .review-section,
    .status-section,
    .timestamps-section {
      padding: 8px 0;
    }

    h3 {
      margin: 0 0 12px 0;
      color: #1976d2;
      font-size: 1.1rem;
      display: flex;
      align-items: center;
    }

    h3 mat-icon {
      margin-right: 8px;
      font-size: 20px;
      width: 20px;
      height: 20px;
    }

    .rating-display {
      display: flex;
      align-items: center;
      gap: 12px;
    }

    .stars {
      display: flex;
      gap: 2px;
    }

    .star {
      color: #ddd;
      font-size: 1.5rem;
    }

    .star.filled {
      color: #ffc107;
    }

    .rating-value {
      font-size: 1.1rem;
      font-weight: 500;
      color: #333;
    }

    .info-item {
      display: flex;
      justify-content: space-between;
      align-items: center;
      padding: 8px 0;
      border-bottom: 1px solid #f0f0f0;
    }

    .info-item:last-child {
      border-bottom: none;
    }

    .info-item label {
      font-weight: 500;
      color: #333;
    }

    .info-item span {
      color: #666;
    }

    .review-content {
      background-color: #f8f9fa;
      padding: 12px;
      border-radius: 6px;
      border-left: 4px solid #1976d2;
    }

    .review-content p {
      margin: 0;
      line-height: 1.5;
      color: #333;
      white-space: pre-wrap;
    }

    .no-review {
      display: flex;
      align-items: center;
      gap: 8px;
      color: #999;
      font-style: italic;
      padding: 12px;
      background-color: #f8f9fa;
      border-radius: 6px;
    }

    .status-display {
      margin-bottom: 12px;
    }

    .engagement-info {
      display: flex;
      flex-direction: column;
      gap: 8px;
    }

    .engagement-item {
      display: flex;
      align-items: center;
      gap: 8px;
      color: #666;
    }

    .engagement-item mat-icon {
      font-size: 18px;
      width: 18px;
      height: 18px;
      color: #1976d2;
    }

    .moderation-notes {
      padding: 8px 0;
    }

    .moderation-notes h3 {
      color: #f44336;
    }

    .notes-content {
      background-color: #fff3e0;
      padding: 12px;
      border-radius: 6px;
      border-left: 4px solid #ff9800;
      color: #e65100;
      font-size: 0.9rem;
      line-height: 1.4;
      white-space: pre-wrap;
    }

    mat-chip-set {
      display: flex;
      flex-wrap: wrap;
      gap: 4px;
    }

    mat-chip {
      font-size: 0.8rem;
    }

    mat-dialog-actions {
      padding: 16px 0 0 0;
      margin: 0;
    }

    @media (max-width: 768px) {
      .rating-detail-dialog {
        min-width: auto;
        width: 100%;
      }
    }
  `]
})
export class RatingDetailDialogComponent {
  constructor(
    public dialogRef: MatDialogRef<RatingDetailDialogComponent>,
    @Inject(MAT_DIALOG_DATA) public data: DialogData
  ) {}
} 