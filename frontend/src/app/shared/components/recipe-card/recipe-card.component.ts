import { Component, Input, Output, EventEmitter, ChangeDetectionStrategy, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterModule } from '@angular/router';
import { MaterialModule } from '../../material.module';
import { RecipeListItem } from '../../models/recipe.models';
import { AuthService } from '../../../core/services/auth.service';
import { Observable } from 'rxjs';

@Component({
  selector: 'app-recipe-card',
  standalone: true,
  imports: [CommonModule, RouterModule, MaterialModule],
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `
    <mat-card class="recipe-card" [class.loading]="loading">
      <div class="card-header">
        <!-- Image Container -->
        <div class="image-container" [routerLink]="['/recipes', recipe.id]">
          <img 
            [src]="getImageSrc()" 
            [alt]="recipe.title"
            class="recipe-image"
            loading="lazy"
            (error)="onImageError($event)">
          
          <!-- Difficulty Badge -->
          <div class="difficulty-badge" [class]="'difficulty-' + recipe.difficulty">
            {{ recipe.difficulty | titlecase }}
          </div>
          
          <!-- Favorite Button (only for authenticated users) -->
          <button 
            *ngIf="isAuthenticated$ | async"
            mat-icon-button 
            class="favorite-btn"
            [class.favorited]="recipe.is_favorited"
            (click)="onFavoriteClick($event)"
            [disabled]="favoriteLoading"
            matTooltip="{{ recipe.is_favorited ? 'Remove from favorites' : 'Add to favorites' }}">
            <mat-icon>{{ recipe.is_favorited ? 'favorite' : 'favorite_border' }}</mat-icon>
          </button>
        </div>
      </div>

      <mat-card-content class="card-content">
        <!-- Title and Description -->
        <div class="title-section">
          <h3 class="recipe-title" [routerLink]="['/recipes', recipe.id]">
            {{ recipe.title }}
          </h3>
          <p class="recipe-description" [title]="recipe.description">
            {{ recipe.description }}
          </p>
        </div>

        <!-- Rating Section -->
        <div class="rating-section" *ngIf="recipe.rating_stats && recipe.rating_stats.total_ratings > 0">
          <div class="stars">
            <mat-icon 
              *ngFor="let star of getStarArray(); let i = index"
              [class]="getStarClass(i)"
              class="star-icon">
              {{ getStarIcon(i) }}
            </mat-icon>
          </div>
          <span class="rating-text">
            {{ recipe.rating_stats.average_rating | number:'1.1-1' }}
            ({{ recipe.rating_stats.total_ratings }})
          </span>
        </div>

        <!-- Recipe Meta Information -->
        <div class="meta-section">
          <div class="meta-item">
            <mat-icon class="meta-icon">schedule</mat-icon>
            <span>{{ formatTime(recipe.total_time) }}</span>
          </div>
          
          <div class="meta-item">
            <mat-icon class="meta-icon">restaurant</mat-icon>
            <span>{{ recipe.servings }} {{ recipe.servings === 1 ? 'serving' : 'servings' }}</span>
          </div>
        </div>

        <!-- Categories -->
        <div class="categories-section" *ngIf="recipe.categories && recipe.categories.length > 0">
          <mat-chip-set>
            <mat-chip 
              *ngFor="let category of recipe.categories.slice(0, 3)"
              [routerLink]="['/recipes']"
              [queryParams]="{ categories: [category.slug] }"
              class="category-chip">
              {{ category.name }}
            </mat-chip>
            <mat-chip *ngIf="recipe.categories.length > 3" class="more-categories">
              +{{ recipe.categories.length - 3 }} more
            </mat-chip>
          </mat-chip-set>
        </div>



        <!-- Author Information -->
        <div class="author-section">
          <div class="author-info">
            <mat-icon class="author-icon">person</mat-icon>
            <span class="author-name">{{ recipe.author_name || 'Unknown Author' }}</span>
          </div>
          <span class="created-date">{{ formatDate(recipe.created_at) }}</span>
        </div>
      </mat-card-content>

      <!-- Quick Actions -->
      <mat-card-actions class="card-actions">
        <button 
          mat-button 
          [routerLink]="['/recipes', recipe.id]"
          color="primary">
          <mat-icon>visibility</mat-icon>
          View Recipe
        </button>
        
        <button 
          mat-button 
          (click)="onShareClick($event)"
          matTooltip="Share recipe">
          <mat-icon>share</mat-icon>
          Share
        </button>
      </mat-card-actions>

      <!-- Loading Overlay -->
      <div class="loading-overlay" *ngIf="loading">
        <mat-spinner diameter="40"></mat-spinner>
      </div>
    </mat-card>
  `,
  styles: [`
    .recipe-card {
      max-width: 350px;
      margin: 0 auto;
      transition: transform 0.3s cubic-bezier(0.4, 0, 0.2, 1), box-shadow 0.3s cubic-bezier(0.4, 0, 0.2, 1);
      cursor: pointer;
      position: relative;
      overflow: hidden;
      border-radius: 8px;
      background: white;
      will-change: transform, box-shadow;
    }

    .recipe-card:hover {
      transform: translateY(-4px);
      box-shadow: 0 8px 25px rgba(0,0,0,0.15);
    }

    .recipe-card.loading {
      pointer-events: none;
    }

    .card-header {
      padding: 0;
      position: relative;
    }

    .image-container {
      position: relative;
      width: 100%;
      height: 200px;
      overflow: hidden;
      cursor: pointer;
      background-color: #f8f9fa;
    }

    .recipe-image {
      width: 100%;
      height: 100%;
      object-fit: cover;
      transition: transform 0.3s cubic-bezier(0.4, 0, 0.2, 1), opacity 0.2s ease;
      will-change: transform;
      opacity: 1;
    }
    
    .recipe-image[src=""] {
      opacity: 0;
    }

    .recipe-card:hover .recipe-image {
      transform: scale(1.05);
    }

    .difficulty-badge {
      position: absolute;
      top: 8px;
      left: 8px;
      padding: 4px 8px;
      border-radius: 12px;
      font-size: 0.75rem;
      font-weight: 500;
      text-transform: uppercase;
      color: white;
      z-index: 20;
      box-shadow: 0 2px 4px rgba(0,0,0,0.3);
      backdrop-filter: blur(4px);
    }

    .difficulty-easy { background-color: #4caf50; }
    .difficulty-medium { background-color: #ff9800; }
    .difficulty-hard { background-color: #f44336; }

    .favorite-btn {
      position: absolute;
      top: 8px;
      right: 8px;
      background-color: rgba(255, 255, 255, 0.9);
      color: #666;
      transition: all 0.2s cubic-bezier(0.4, 0, 0.2, 1);
      z-index: 20;
      box-shadow: 0 2px 4px rgba(0,0,0,0.1);
      border-radius: 50%;
      width: 40px;
      height: 40px;
      min-width: 40px;
      backdrop-filter: blur(4px);
    }

    .favorite-btn:hover {
      background-color: rgba(255, 255, 255, 1);
      transform: scale(1.1);
    }

    .favorite-btn.favorited {
      color: #e91e63;
    }

    .card-content {
      padding: 16px !important;
      position: relative;
      z-index: 1;
    }

    .title-section {
      margin-bottom: 12px;
    }

    .recipe-title {
      font-size: 1.25rem;
      font-weight: 500;
      margin: 0 0 8px 0;
      cursor: pointer;
      color: inherit;
      text-decoration: none;
      display: -webkit-box;
      -webkit-line-clamp: 2;
      -webkit-box-orient: vertical;
      overflow: hidden;
      line-height: 1.3;
      position: relative;
      z-index: 2;
      transition: color 0.2s ease;
    }
    
    .recipe-title:hover {
      color: #1976d2;
    }

    .recipe-description {
      color: rgba(0, 0, 0, 0.6);
      font-size: 0.875rem;
      margin: 0;
      display: -webkit-box;
      -webkit-line-clamp: 2;
      -webkit-box-orient: vertical;
      overflow: hidden;
      line-height: 1.4;
    }

    .rating-section {
      display: flex;
      align-items: center;
      gap: 8px;
      margin-bottom: 12px;
    }

    .stars {
      display: flex;
      gap: 2px;
    }

    .star-icon {
      font-size: 16px;
      width: 16px;
      height: 16px;
      line-height: 16px;
    }

    .star-filled { color: #ffc107; }
    .star-half { color: #ffc107; }
    .star-empty { color: #e0e0e0; }

    .rating-text {
      font-size: 0.875rem;
      color: rgba(0, 0, 0, 0.6);
    }

    .meta-section {
      display: flex;
      justify-content: space-between;
      margin-bottom: 12px;
    }

    .meta-item {
      display: flex;
      align-items: center;
      gap: 4px;
      font-size: 0.875rem;
      color: rgba(0, 0, 0, 0.6);
    }

    .meta-icon {
      font-size: 18px;
      width: 18px;
      height: 18px;
    }

    .categories-section {
      margin-bottom: 12px;
    }

    .category-chip {
      font-size: 0.75rem;
      height: 24px;
      cursor: pointer;
    }

    .more-categories {
      font-size: 0.75rem;
      height: 24px;
      background-color: #f5f5f5;
      color: rgba(0, 0, 0, 0.6);
    }

    .dietary-section {
      margin-bottom: 12px;
    }

    .dietary-tags {
      display: flex;
      flex-wrap: wrap;
      gap: 4px;
    }

    .dietary-tag {
      font-size: 0.75rem;
      padding: 2px 6px;
      border-radius: 8px;
      background-color: #e8f5e8;
      color: #2e7d32;
      border: 1px solid #c8e6c9;
    }

    .dietary-vegetarian, .dietary-vegan { 
      background-color: #e8f5e8; 
      color: #2e7d32; 
    }
    .dietary-gluten-free { 
      background-color: #fff3e0; 
      color: #ef6c00; 
    }
    .dietary-keto, .dietary-low-carb { 
      background-color: #fce4ec; 
      color: #c2185b; 
    }

    .author-section {
      display: flex;
      justify-content: space-between;
      align-items: center;
      font-size: 0.875rem;
      color: rgba(0, 0, 0, 0.6);
    }

    .author-info {
      display: flex;
      align-items: center;
      gap: 4px;
    }

    .author-icon {
      font-size: 16px;
      width: 16px;
      height: 16px;
    }

    .created-date {
      font-size: 0.75rem;
    }

    .card-actions {
      padding: 8px 16px !important;
      display: flex;
      justify-content: space-between;
      margin: 0 !important;
    }

    .loading-overlay {
      position: absolute;
      top: 0;
      left: 0;
      right: 0;
      bottom: 0;
      background-color: rgba(255, 255, 255, 0.8);
      display: flex;
      align-items: center;
      justify-content: center;
      z-index: 10;
    }

    @media (max-width: 600px) {
      .recipe-card {
        max-width: 100%;
        margin: 0;
      }
      
      .image-container {
        height: 180px;
      }
      
      .card-content {
        padding: 12px;
      }
      
      .recipe-title {
        font-size: 1.1rem;
      }
    }
  `]
})
export class RecipeCardComponent {
  @Input() recipe!: RecipeListItem;
  @Input() loading = false;
  @Input() favoriteLoading = false;

  @Output() favoriteToggle = new EventEmitter<string>();
  @Output() share = new EventEmitter<RecipeListItem>();

  // Authentication state
  private authService = inject(AuthService);
  isAuthenticated$ = this.authService.isAuthenticated$;

  getStarArray(): number[] {
    return Array.from({ length: 5 }, (_, i) => i);
  }

  getStarClass(index: number): string {
    const rating = this.recipe.rating_stats?.average_rating || 0;
    if (rating >= index + 1) {
      return 'star-filled';
    } else if (rating > index) {
      return 'star-half';
    } else {
      return 'star-empty';
    }
  }

  getStarIcon(index: number): string {
    const rating = this.recipe.rating_stats?.average_rating || 0;
    if (rating >= index + 1) {
      return 'star';
    } else if (rating > index) {
      return 'star_half';
    } else {
      return 'star_border';
    }
  }

  formatTime(minutes: number): string {
    if (minutes < 60) {
      return `${minutes}m`;
    } else {
      const hours = Math.floor(minutes / 60);
      const remainingMinutes = minutes % 60;
      return remainingMinutes > 0 ? `${hours}h ${remainingMinutes}m` : `${hours}h`;
    }
  }

  formatDate(dateString: string): string {
    const date = new Date(dateString);
    const now = new Date();
    const diffInDays = Math.floor((now.getTime() - date.getTime()) / (1000 * 60 * 60 * 24));
    
    if (diffInDays === 0) {
      return 'Today';
    } else if (diffInDays === 1) {
      return 'Yesterday';
    } else if (diffInDays < 7) {
      return `${diffInDays} days ago`;
    } else if (diffInDays < 30) {
      const weeks = Math.floor(diffInDays / 7);
      return `${weeks} ${weeks === 1 ? 'week' : 'weeks'} ago`;
    } else {
      return date.toLocaleDateString();
    }
  }

  onFavoriteClick(event: Event): void {
    event.preventDefault();
    event.stopPropagation();
    this.favoriteToggle.emit(this.recipe.id);
  }

  onShareClick(event: Event): void {
    event.preventDefault();
    event.stopPropagation();
    this.share.emit(this.recipe);
  }

  getImageSrc(): string {
    return this.recipe.thumbnail_url || this.getPlaceholderImage();
  }

  private getPlaceholderImage(): string {
    // Create a data URL for a clean placeholder
    const svg = `
      <svg width="350" height="200" xmlns="http://www.w3.org/2000/svg">
        <defs>
          <linearGradient id="bg" x1="0%" y1="0%" x2="100%" y2="100%">
            <stop offset="0%" style="stop-color:#f8f9fa;stop-opacity:1" />
            <stop offset="100%" style="stop-color:#e9ecef;stop-opacity:1" />
          </linearGradient>
        </defs>
        <rect width="100%" height="100%" fill="url(#bg)"/>
        <circle cx="175" cy="70" r="20" fill="#dee2e6"/>
        <path d="M165 75 L175 65 L185 75 L180 80 L175 75 L170 80 Z" fill="#6c757d"/>
        <rect x="155" y="110" width="40" height="4" rx="2" fill="#dee2e6"/>
        <rect x="160" y="120" width="30" height="3" rx="1" fill="#e9ecef"/>
        <rect x="165" y="128" width="20" height="3" rx="1" fill="#e9ecef"/>
      </svg>
    `;
    return `data:image/svg+xml;base64,${btoa(svg)}`;
  }

  onImageError(event: Event): void {
    const img = event.target as HTMLImageElement;
    img.src = this.getPlaceholderImage();
  }
}