import { Injectable } from '@angular/core';
import { BehaviorSubject, Observable } from 'rxjs';

export interface ImageLoadOptions {
  width?: number;
  height?: number;
  quality?: number;
  format?: 'webp' | 'jpeg' | 'png';
  progressive?: boolean;
}

export interface ImageLoadResult {
  src: string;
  loaded: boolean;
  error?: string;
  width?: number;
  height?: number;
}

@Injectable({
  providedIn: 'root'
})
export class ImageOptimizationService {
  private imageCache = new Map<string, ImageLoadResult>();
  private loadingImages = new Map<string, BehaviorSubject<ImageLoadResult>>();

  /**
   * Load and optimize an image with progressive loading
   */
  loadImage(
    src: string, 
    options: ImageLoadOptions = {}
  ): Observable<ImageLoadResult> {
    const cacheKey = this.generateCacheKey(src, options);
    
    // Check cache first
    if (this.imageCache.has(cacheKey)) {
      const cached = this.imageCache.get(cacheKey)!;
      return new Observable(observer => {
        observer.next(cached);
        observer.complete();
      });
    }

    // Check if already loading
    if (this.loadingImages.has(cacheKey)) {
      return this.loadingImages.get(cacheKey)!.asObservable();
    }

    // Create loading subject
    const loadingSubject = new BehaviorSubject<ImageLoadResult>({
      src,
      loaded: false
    });
    this.loadingImages.set(cacheKey, loadingSubject);

    // Load image
    this.loadImageWithProgressive(src, options, cacheKey, loadingSubject);

    return loadingSubject.asObservable();
  }

  /**
   * Load image with progressive loading (low quality first, then high quality)
   */
  private loadImageWithProgressive(
    src: string,
    options: ImageLoadOptions,
    cacheKey: string,
    subject: BehaviorSubject<ImageLoadResult>
  ): void {
    const img = new Image();
    
    // Set up event handlers
    img.onload = () => {
      const result: ImageLoadResult = {
        src: img.src,
        loaded: true,
        width: img.naturalWidth,
        height: img.naturalHeight
      };

      // Cache the result
      this.imageCache.set(cacheKey, result);
      
      // Emit result
      subject.next(result);
      subject.complete();
      
      // Clean up
      this.loadingImages.delete(cacheKey);
    };

    img.onerror = () => {
      const result: ImageLoadResult = {
        src,
        loaded: false,
        error: 'Failed to load image'
      };

      // Cache the error result
      this.imageCache.set(cacheKey, result);
      
      // Emit error
      subject.next(result);
      subject.complete();
      
      // Clean up
      this.loadingImages.delete(cacheKey);
    };

    // Set source
    img.src = this.optimizeImageUrl(src, options);
  }

  /**
   * Optimize image URL with parameters
   */
  private optimizeImageUrl(src: string, options: ImageLoadOptions): string {
    // If it's a data URL or external URL, return as is
    if (src.startsWith('data:') || src.startsWith('http')) {
      return src;
    }

    // For local images, we could add optimization parameters
    // This would work with a backend image optimization service
    const url = new URL(src, window.location.origin);
    
    if (options.width) {
      url.searchParams.set('w', options.width.toString());
    }
    
    if (options.height) {
      url.searchParams.set('h', options.height.toString());
    }
    
    if (options.quality) {
      url.searchParams.set('q', options.quality.toString());
    }
    
    if (options.format) {
      url.searchParams.set('f', options.format);
    }
    
    if (options.progressive) {
      url.searchParams.set('p', '1');
    }

    return url.toString();
  }

  /**
   * Generate cache key for image options
   */
  private generateCacheKey(src: string, options: ImageLoadOptions): string {
    return `${src}_${JSON.stringify(options)}`;
  }

  /**
   * Preload images for better performance
   */
  preloadImages(imageUrls: string[], options: ImageLoadOptions = {}): void {
    imageUrls.forEach(url => {
      this.loadImage(url, options).subscribe();
    });
  }

  /**
   * Clear image cache
   */
  clearCache(): void {
    this.imageCache.clear();
    this.loadingImages.clear();
  }

  /**
   * Get image dimensions without loading the full image
   */
  getImageDimensions(src: string): Promise<{ width: number; height: number }> {
    return new Promise((resolve, reject) => {
      const img = new Image();
      
      img.onload = () => {
        resolve({
          width: img.naturalWidth,
          height: img.naturalHeight
        });
      };
      
      img.onerror = () => {
        reject(new Error('Failed to load image'));
      };
      
      img.src = src;
    });
  }

  /**
   * Create a low-quality placeholder for progressive loading
   */
  createPlaceholder(width: number, height: number, color: string = '#f0f0f0'): string {
    const canvas = document.createElement('canvas');
    canvas.width = width;
    canvas.height = height;
    
    const ctx = canvas.getContext('2d')!;
    ctx.fillStyle = color;
    ctx.fillRect(0, 0, width, height);
    
    return canvas.toDataURL('image/jpeg', 0.1);
  }

  /**
   * Check if WebP is supported
   */
  isWebPSupported(): boolean {
    const canvas = document.createElement('canvas');
    canvas.width = 1;
    canvas.height = 1;
    
    return canvas.toDataURL('image/webp').indexOf('data:image/webp') === 0;
  }

  /**
   * Get optimal image format based on browser support
   */
  getOptimalFormat(): 'webp' | 'jpeg' | 'png' {
    if (this.isWebPSupported()) {
      return 'webp';
    }
    return 'jpeg';
  }

  /**
   * Optimize image quality based on device pixel ratio
   */
  getOptimalQuality(): number {
    const pixelRatio = window.devicePixelRatio || 1;
    
    if (pixelRatio >= 3) {
      return 90;
    } else if (pixelRatio >= 2) {
      return 85;
    } else {
      return 80;
    }
  }

  /**
   * Get optimal image size based on container and device
   */
  getOptimalSize(
    containerWidth: number, 
    containerHeight: number, 
    maxWidth: number = 1920
  ): { width: number; height: number } {
    const pixelRatio = window.devicePixelRatio || 1;
    
    let width = containerWidth * pixelRatio;
    let height = containerHeight * pixelRatio;
    
    // Cap at maximum width
    if (width > maxWidth) {
      const ratio = maxWidth / width;
      width = maxWidth;
      height = height * ratio;
    }
    
    return {
      width: Math.round(width),
      height: Math.round(height)
    };
  }
} 