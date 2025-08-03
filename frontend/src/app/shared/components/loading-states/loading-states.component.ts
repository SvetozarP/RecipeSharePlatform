import { Component, Input, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';
import { MatCardModule } from '@angular/material/card';
import { MatIconModule } from '@angular/material/icon';

export interface SkeletonConfig {
  lines?: number;
  showImage?: boolean;
  showTitle?: boolean;
  showSubtitle?: boolean;
  showActions?: boolean;
  imageHeight?: string;
  titleWidth?: string;
  subtitleWidth?: string;
}

@Component({
  selector: 'app-loading-spinner',
  standalone: true,
  imports: [CommonModule, MatProgressSpinnerModule],
  templateUrl: './loading-states.component.html',
  styleUrls: ['./loading-states.component.scss']})
export class LoadingSpinnerComponent {
  @Input() size: number = 40;
  @Input() color: 'primary' | 'accent' | 'warn' = 'primary';
  @Input() mode: 'determinate' | 'indeterminate' = 'indeterminate';
  @Input() message: string = '';
  @Input() overlay: boolean = false;
}

@Component({
  selector: 'app-skeleton-card',
  standalone: true,
  imports: [CommonModule, MatCardModule],
  template: `
    <mat-card class="skeleton-card">
      <mat-card-header>
        <mat-card-title>
          <div 
            *ngIf="config.showTitle"
            class="skeleton-line skeleton-title"
            [style.width]="config.titleWidth || '60%'">
          </div>
        </mat-card-title>
        <mat-card-subtitle>
          <div 
            *ngIf="config.showSubtitle"
            class="skeleton-line skeleton-subtitle"
            [style.width]="config.subtitleWidth || '40%'">
          </div>
        </mat-card-subtitle>
      </mat-card-header>
      
      <mat-card-content>
        <div 
          *ngIf="config.showImage"
          class="skeleton-line skeleton-image"
          [style.height]="config.imageHeight || '200px'"
          [style.width]="'100%'">
        </div>
        
        <div *ngFor="let line of skeletonLines" class="skeleton-line">
          <div class="skeleton-line" [style.width]="getLineWidth(line)">
          </div>
        </div>
      </mat-card-content>
      
      <mat-card-actions *ngIf="config.showActions">
        <div class="skeleton-line skeleton-action" style="width: 80px"></div>
        <div class="skeleton-line skeleton-action" style="width: 100px"></div>
      </mat-card-actions>
    </mat-card>
  `,
  styles: [`
    .skeleton-card {
      margin: 1rem 0;
    }
    
    .skeleton-line {
      height: 16px;
      margin: 0.5rem 0;
      background: linear-gradient(90deg, #f0f0f0 25%, #e0e0e0 50%, #f0f0f0 75%);
      background-size: 200% 100%;
      animation: loading 1.5s infinite;
      border-radius: 4px;
    }
    
    .skeleton-title {
      height: 20px;
    }
    
    .skeleton-subtitle {
      height: 16px;
    }
    
    .skeleton-image {
      height: 200px;
      width: 100%;
    }
    
    .skeleton-action {
      height: 32px;
    }
    
    @keyframes loading {
      0% { background-position: 200% 0; }
      100% { background-position: -200% 0; }
    }
    
    mat-card-actions {
      display: flex;
      gap: 1rem;
    }
  `]
})
export class SkeletonCardComponent implements OnInit {
  @Input() config: SkeletonConfig = {
    lines: 3,
    showImage: true,
    showTitle: true,
    showSubtitle: true,
    showActions: true
  };
  
  skeletonLines: number[] = [];

  ngOnInit() {
    this.skeletonLines = Array(this.config.lines || 3).fill(0).map((_, i) => i);
  }

  getLineWidth(lineIndex: number): string {
    // Vary line widths for more realistic appearance
    const widths = ['90%', '75%', '60%', '85%', '70%'];
    return widths[lineIndex % widths.length];
  }
}

@Component({
  selector: 'app-skeleton-list',
  standalone: true,
  imports: [CommonModule, SkeletonCardComponent],
  template: `
    <div class="skeleton-list">
      <app-skeleton-card 
        *ngFor="let item of skeletonItems" 
        [config]="config">
      </app-skeleton-card>
    </div>
  `,
  styles: [`
    .skeleton-list {
      display: grid;
      gap: 1rem;
      grid-template-columns: repeat(auto-fill, minmax(300px, 1fr));
    }
    
    @media (max-width: 768px) {
      .skeleton-list {
        grid-template-columns: 1fr;
      }
    }
  `]
})
export class SkeletonListComponent {
  @Input() count: number = 6;
  @Input() config: SkeletonConfig = {
    lines: 3,
    showImage: true,
    showTitle: true,
    showSubtitle: true,
    showActions: true
  };
  
  get skeletonItems(): number[] {
    return Array(this.count).fill(0).map((_, i) => i);
  }
}

@Component({
  selector: 'app-skeleton-table',
  standalone: true,
  imports: [CommonModule],
  template: `
    <div class="skeleton-table">
      <div class="skeleton-header">
        <div 
          *ngFor="let header of headers" 
          class="skeleton-header-cell">
          <div class="skeleton-line" [style.width]="header.width || '100px'"></div>
        </div>
      </div>
      
      <div class="skeleton-rows">
        <div 
          *ngFor="let row of skeletonRows" 
          class="skeleton-row">
          <div 
            *ngFor="let cell of headers" 
            class="skeleton-cell">
            <div class="skeleton-line" [style.width]="cell.width || '100px'"></div>
          </div>
        </div>
      </div>
    </div>
  `,
  styles: [`
    .skeleton-table {
      border: 1px solid #e0e0e0;
      border-radius: 4px;
      overflow: hidden;
    }
    
    .skeleton-header {
      display: flex;
      background: #f5f5f5;
      padding: 1rem;
      border-bottom: 1px solid #e0e0e0;
    }
    
    .skeleton-header-cell {
      margin-right: 1rem;
    }
    
    .skeleton-rows {
      padding: 1rem;
    }
    
    .skeleton-row {
      display: flex;
      margin-bottom: 1rem;
    }
    
    .skeleton-cell {
      margin-right: 1rem;
    }
  `]
})
export class SkeletonTableComponent {
  @Input() rows: number = 5;
  @Input() headers: Array<{ width?: string }> = [
    { width: '150px' },
    { width: '200px' },
    { width: '100px' },
    { width: '120px' }
  ];
  
  get skeletonRows(): number[] {
    return Array(this.rows).fill(0).map((_, i) => i);
  }
}

@Component({
  selector: 'app-progressive-image',
  standalone: true,
  imports: [CommonModule, MatProgressSpinnerModule, MatIconModule],
  template: `
    <div class="progressive-image-container" [style.width]="width" [style.height]="height">
      <!-- Low quality placeholder -->
      <img 
        *ngIf="showPlaceholder"
        [src]="placeholderSrc" 
        [alt]="alt"
        class="progressive-placeholder"
        [class.loaded]="imageLoaded">
      
      <!-- High quality image -->
      <img 
        [src]="src" 
        [alt]="alt"
        class="progressive-image"
        [class.loaded]="imageLoaded"
        (load)="onImageLoad()"
        (error)="onImageError()">
      
      <!-- Loading overlay -->
      <div *ngIf="!imageLoaded && !imageError" class="loading-overlay">
        <mat-spinner diameter="30"></mat-spinner>
      </div>
      
      <!-- Error state -->
      <div *ngIf="imageError" class="error-overlay">
        <mat-icon>broken_image</mat-icon>
        <span>Failed to load image</span>
      </div>
    </div>
  `,
  styles: [`
    .progressive-image-container {
      position: relative;
      overflow: hidden;
      background: #f0f0f0;
    }
    
    .progressive-placeholder,
    .progressive-image {
      width: 100%;
      height: 100%;
      object-fit: cover;
      transition: opacity 0.3s ease;
      opacity: 0;
    }
    
    .progressive-placeholder.loaded,
    .progressive-image.loaded {
      opacity: 1;
    }
    
    .progressive-placeholder {
      filter: blur(10px);
      transform: scale(1.1);
    }
    
    .loading-overlay,
    .error-overlay {
      position: absolute;
      top: 0;
      left: 0;
      right: 0;
      bottom: 0;
      display: flex;
      flex-direction: column;
      align-items: center;
      justify-content: center;
      background: rgba(255, 255, 255, 0.8);
    }
    
    .error-overlay {
      color: #666;
      font-size: 0.9rem;
    }
    
    .error-overlay mat-icon {
      font-size: 2rem;
      margin-bottom: 0.5rem;
    }
  `]
})
export class ProgressiveImageComponent {
  @Input() src: string = '';
  @Input() placeholderSrc: string = '';
  @Input() alt: string = '';
  @Input() width: string = '100%';
  @Input() height: string = '200px';
  
  imageLoaded = false;
  imageError = false;
  showPlaceholder = true;

  onImageLoad() {
    this.imageLoaded = true;
    this.imageError = false;
    
    // Hide placeholder after a short delay
    setTimeout(() => {
      this.showPlaceholder = false;
    }, 300);
  }

  onImageError() {
    this.imageError = true;
    this.imageLoaded = false;
  }
} 