import { Component, Inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { MatDialogRef, MAT_DIALOG_DATA, MatDialogModule } from '@angular/material/dialog';
import { MatCardModule } from '@angular/material/card';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { MatChipsModule } from '@angular/material/chips';
import { MatDividerModule } from '@angular/material/divider';

interface DialogData {
  review: string;
  rating: number;
  user: {
    username: string;
    email: string;
  };
  recipe: {
    title: string;
  };
  created_at: string;
}

@Component({
  selector: 'app-review-detail-dialog',
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
    <div class="review-detail-dialog">
      <div class="dialog-header">
        <h2 mat-dialog-title>
          <mat-icon>rate_review</mat-icon>
          Review Details
        </h2>
        <button mat-icon-button mat-dialog-close>
          <mat-icon>close</mat-icon>
        </button>
      </div>

      <mat-dialog-content>
        <div class="review-content">
          <!-- Rating Display -->
          <div class="rating-section">
            <h3>Rating</h3>
            <div class="rating-display">
              <div class="stars">
                <span *ngFor="let star of [1,2,3,4,5]" 
                      [class.filled]="star <= data.rating"
                      class="star">
                  ★
                </span>
              </div>
              <div class="rating-value">{{ data.rating }}/5</div>
            </div>
          </div>

          <mat-divider></mat-divider>

          <!-- Recipe Information -->
          <div class="info-section">
            <h3>Recipe</h3>
            <div class="info-item">
              <label>Title:</label>
              <span>{{ data.recipe.title }}</span>
            </div>
          </div>

          <mat-divider></mat-divider>

          <!-- User Information -->
          <div class="info-section">
            <h3>User</h3>
            <div class="info-item">
              <label>Username:</label>
              <span>{{ data.user.username }}</span>
            </div>
            <div class="info-item">
              <label>Email:</label>
              <span>{{ data.user.email }}</span>
            </div>
          </div>

          <mat-divider></mat-divider>

          <!-- Review Content -->
          <div class="review-section">
            <h3>Review Content</h3>
            <div class="review-text">
              <p>{{ data.review }}</p>
            </div>
            <div class="review-stats">
              <div class="stat-item">
                <mat-icon>text_fields</mat-icon>
                <span>{{ data.review.length }} characters</span>
              </div>
              <div class="stat-item">
                <mat-icon>schedule</mat-icon>
                <span>{{ data.created_at | date:'medium' }}</span>
              </div>
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
    .review-detail-dialog {
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

    .review-content {
      display: flex;
      flex-direction: column;
      gap: 16px;
    }

    .rating-section,
    .info-section,
    .review-section {
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

    .review-text {
      background-color: #f8f9fa;
      padding: 16px;
      border-radius: 8px;
      border-left: 4px solid #1976d2;
      margin-bottom: 16px;
    }

    .review-text p {
      margin: 0;
      line-height: 1.6;
      color: #333;
      white-space: pre-wrap;
      font-size: 1rem;
    }

    .review-stats {
      display: flex;
      gap: 24px;
    }

    .stat-item {
      display: flex;
      align-items: center;
      gap: 8px;
      color: #666;
      font-size: 0.9rem;
    }

    .stat-item mat-icon {
      font-size: 18px;
      width: 18px;
      height: 18px;
      color: #1976d2;
    }

    mat-dialog-actions {
      padding: 16px 0 0 0;
      margin: 0;
    }

    @media (max-width: 768px) {
      .review-detail-dialog {
        min-width: auto;
        width: 100%;
      }

      .review-stats {
        flex-direction: column;
        gap: 12px;
      }
    }
  `]
})
export class ReviewDetailDialogComponent {
  constructor(
    public dialogRef: MatDialogRef<ReviewDetailDialogComponent>,
    @Inject(MAT_DIALOG_DATA) public data: DialogData
  ) {}
} 