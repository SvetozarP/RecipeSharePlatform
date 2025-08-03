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
  templateUrl: './recipe-card.component.html',
  styleUrls: ['./recipe-card.component.scss']
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