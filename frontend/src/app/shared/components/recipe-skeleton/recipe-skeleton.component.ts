import { Component, ChangeDetectionStrategy } from '@angular/core';
import { CommonModule } from '@angular/common';
import { MaterialModule } from '../../material.module';

@Component({
  selector: 'app-recipe-skeleton',
  standalone: true,
  imports: [CommonModule, MaterialModule],
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `
    <mat-card class="recipe-skeleton">
      <!-- Image Skeleton -->
      <div class="skeleton-image">
        <div class="skeleton-badge"></div>
        <div class="skeleton-favorite"></div>
      </div>

      <mat-card-content class="skeleton-content">
        <!-- Title Skeleton -->
        <div class="skeleton-title-section">
          <div class="skeleton-title"></div>
          <div class="skeleton-description"></div>
          <div class="skeleton-description short"></div>
        </div>

        <!-- Rating Skeleton -->
        <div class="skeleton-rating-section">
          <div class="skeleton-stars">
            <div class="skeleton-star" *ngFor="let star of [1,2,3,4,5]"></div>
          </div>
          <div class="skeleton-rating-text"></div>
        </div>

        <!-- Meta Section Skeleton -->
        <div class="skeleton-meta-section">
          <div class="skeleton-meta-item">
            <div class="skeleton-icon"></div>
            <div class="skeleton-meta-text"></div>
          </div>
          <div class="skeleton-meta-item">
            <div class="skeleton-icon"></div>
            <div class="skeleton-meta-text"></div>
          </div>
        </div>

        <!-- Categories Skeleton -->
        <div class="skeleton-categories">
          <div class="skeleton-chip"></div>
          <div class="skeleton-chip"></div>
          <div class="skeleton-chip small"></div>
        </div>

        <!-- Author Section Skeleton -->
        <div class="skeleton-author-section">
          <div class="skeleton-author">
            <div class="skeleton-icon"></div>
            <div class="skeleton-author-text"></div>
          </div>
          <div class="skeleton-date"></div>
        </div>
      </mat-card-content>

      <!-- Actions Skeleton -->
      <div class="skeleton-actions">
        <div class="skeleton-button"></div>
        <div class="skeleton-button small"></div>
      </div>
    </mat-card>
  `,
  styles: [`
    .recipe-skeleton {
      max-width: 350px;
      margin: 0 auto;
      overflow: hidden;
    }

    .skeleton-image {
      position: relative;
      width: 100%;
      height: 200px;
      background: linear-gradient(90deg, #f0f0f0 25%, #e0e0e0 50%, #f0f0f0 75%);
      background-size: 200% 100%;
      animation: shimmer 1.5s infinite;
    }

    .skeleton-badge {
      position: absolute;
      top: 8px;
      left: 8px;
      width: 60px;
      height: 24px;
      border-radius: 12px;
      background: rgba(255, 255, 255, 0.8);
    }

    .skeleton-favorite {
      position: absolute;
      top: 8px;
      right: 8px;
      width: 40px;
      height: 40px;
      border-radius: 50%;
      background: rgba(255, 255, 255, 0.8);
    }

    .skeleton-content {
      padding: 16px;
    }

    .skeleton-title-section {
      margin-bottom: 12px;
    }

    .skeleton-title {
      height: 20px;
      background: linear-gradient(90deg, #f0f0f0 25%, #e0e0e0 50%, #f0f0f0 75%);
      background-size: 200% 100%;
      animation: shimmer 1.5s infinite;
      border-radius: 4px;
      margin-bottom: 8px;
      width: 85%;
    }

    .skeleton-description {
      height: 14px;
      background: linear-gradient(90deg, #f0f0f0 25%, #e0e0e0 50%, #f0f0f0 75%);
      background-size: 200% 100%;
      animation: shimmer 1.5s infinite;
      border-radius: 4px;
      margin-bottom: 4px;
      width: 100%;
    }

    .skeleton-description.short {
      width: 70%;
    }

    .skeleton-rating-section {
      display: flex;
      align-items: center;
      gap: 8px;
      margin-bottom: 12px;
    }

    .skeleton-stars {
      display: flex;
      gap: 2px;
    }

    .skeleton-star {
      width: 16px;
      height: 16px;
      background: linear-gradient(90deg, #f0f0f0 25%, #e0e0e0 50%, #f0f0f0 75%);
      background-size: 200% 100%;
      animation: shimmer 1.5s infinite;
      border-radius: 2px;
    }

    .skeleton-rating-text {
      width: 60px;
      height: 14px;
      background: linear-gradient(90deg, #f0f0f0 25%, #e0e0e0 50%, #f0f0f0 75%);
      background-size: 200% 100%;
      animation: shimmer 1.5s infinite;
      border-radius: 4px;
    }

    .skeleton-meta-section {
      display: flex;
      justify-content: space-between;
      margin-bottom: 12px;
    }

    .skeleton-meta-item {
      display: flex;
      align-items: center;
      gap: 4px;
    }

    .skeleton-icon {
      width: 18px;
      height: 18px;
      background: linear-gradient(90deg, #f0f0f0 25%, #e0e0e0 50%, #f0f0f0 75%);
      background-size: 200% 100%;
      animation: shimmer 1.5s infinite;
      border-radius: 50%;
    }

    .skeleton-meta-text {
      width: 50px;
      height: 14px;
      background: linear-gradient(90deg, #f0f0f0 25%, #e0e0e0 50%, #f0f0f0 75%);
      background-size: 200% 100%;
      animation: shimmer 1.5s infinite;
      border-radius: 4px;
    }

    .skeleton-categories {
      display: flex;
      gap: 8px;
      margin-bottom: 12px;
      flex-wrap: wrap;
    }

    .skeleton-chip {
      height: 24px;
      width: 80px;
      background: linear-gradient(90deg, #f0f0f0 25%, #e0e0e0 50%, #f0f0f0 75%);
      background-size: 200% 100%;
      animation: shimmer 1.5s infinite;
      border-radius: 12px;
    }

    .skeleton-chip.small {
      width: 60px;
    }

    .skeleton-author-section {
      display: flex;
      justify-content: space-between;
      align-items: center;
      margin-bottom: 12px;
    }

    .skeleton-author {
      display: flex;
      align-items: center;
      gap: 4px;
    }

    .skeleton-author-text {
      width: 100px;
      height: 14px;
      background: linear-gradient(90deg, #f0f0f0 25%, #e0e0e0 50%, #f0f0f0 75%);
      background-size: 200% 100%;
      animation: shimmer 1.5s infinite;
      border-radius: 4px;
    }

    .skeleton-date {
      width: 70px;
      height: 12px;
      background: linear-gradient(90deg, #f0f0f0 25%, #e0e0e0 50%, #f0f0f0 75%);
      background-size: 200% 100%;
      animation: shimmer 1.5s infinite;
      border-radius: 4px;
    }

    .skeleton-actions {
      padding: 8px 16px;
      display: flex;
      justify-content: space-between;
      border-top: 1px solid #f0f0f0;
    }

    .skeleton-button {
      height: 36px;
      width: 120px;
      background: linear-gradient(90deg, #f0f0f0 25%, #e0e0e0 50%, #f0f0f0 75%);
      background-size: 200% 100%;
      animation: shimmer 1.5s infinite;
      border-radius: 4px;
    }

    .skeleton-button.small {
      width: 80px;
    }

    @keyframes shimmer {
      0% {
        background-position: -200% 0;
      }
      100% {
        background-position: 200% 0;
      }
    }

    @media (max-width: 600px) {
      .recipe-skeleton {
        max-width: 100%;
        margin: 0;
      }
      
      .skeleton-image {
        height: 180px;
      }
      
      .skeleton-content {
        padding: 12px;
      }
    }
  `]
})
export class RecipeSkeletonComponent {
}