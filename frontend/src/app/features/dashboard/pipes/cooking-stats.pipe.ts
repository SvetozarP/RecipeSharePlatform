import { Pipe, PipeTransform } from '@angular/core';

@Pipe({
  name: 'cookingStats',
  standalone: true
})
export class CookingStatsPipe implements PipeTransform {
  transform(value: number, type: 'duration' | 'percentage' | 'count' | 'rating'): string {
    if (value === null || value === undefined) return '—';
    
    switch (type) {
      case 'duration':
        return this.formatDuration(value);
      case 'percentage':
        return `${Math.round(value)}%`;
      case 'count':
        return this.formatCount(value);
      case 'rating':
        return this.formatRating(value);
      default:
        return value.toString();
    }
  }

  private formatDuration(minutes: number): string {
    if (minutes < 60) {
      return `${minutes}m`;
    } else if (minutes < 1440) { // Less than 24 hours
      const hours = Math.floor(minutes / 60);
      const remainingMinutes = minutes % 60;
      return remainingMinutes > 0 ? `${hours}h ${remainingMinutes}m` : `${hours}h`;
    } else {
      const days = Math.floor(minutes / 1440);
      const remainingHours = Math.floor((minutes % 1440) / 60);
      return remainingHours > 0 ? `${days}d ${remainingHours}h` : `${days}d`;
    }
  }

  private formatCount(count: number): string {
    if (count < 1000) {
      return count.toString();
    } else if (count < 1000000) {
      const k = Math.floor(count / 100) / 10;
      return k % 1 === 0 ? `${Math.floor(k)}k` : `${k}k`;
    } else {
      const m = Math.floor(count / 100000) / 10;
      return m % 1 === 0 ? `${Math.floor(m)}M` : `${m}M`;
    }
  }

  private formatRating(rating: number): string {
    return rating.toFixed(1);
  }
}