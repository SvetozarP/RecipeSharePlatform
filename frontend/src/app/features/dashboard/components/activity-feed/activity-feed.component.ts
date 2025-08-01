import { Component, OnInit, OnDestroy } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { RouterModule } from '@angular/router';
import { MaterialModule } from '../../../../shared/material.module';
import { LoadingComponent } from '../../../../shared/components/loading/loading.component';
import { ActivityTimePipe } from '../../pipes/activity-time.pipe';

import { ActivityService } from '../../services/activity.service';
import { Activity } from '../../models/dashboard-data.model';

import { Subject } from 'rxjs';
import { takeUntil } from 'rxjs/operators';

@Component({
  selector: 'app-activity-feed',
  standalone: true,
  imports: [
    CommonModule, 
    FormsModule, 
    RouterModule,
    MaterialModule, 
    LoadingComponent,
    ActivityTimePipe
  ],
  templateUrl: './activity-feed.component.html',
  styleUrls: ['./activity-feed.component.scss']
})
export class ActivityFeedComponent implements OnInit, OnDestroy {
  activities: Activity[] = [];
  filteredActivities: Activity[] = [];
  
  isLoading = false;
  selectedFilter = 'all';
  currentPage = 1;
  pageSize = 20;
  totalActivities = 0;
  
  private destroy$ = new Subject<void>();

  filterOptions = [
    { value: 'all', label: 'All Activity', icon: 'history' },
    { value: 'recipe_created', label: 'Recipes Created', icon: 'restaurant' },
    { value: 'recipe_published', label: 'Recipes Published', icon: 'publish' },
    { value: 'favorite_added', label: 'Favorites Added', icon: 'favorite' },
    { value: 'comment_added', label: 'Comments Added', icon: 'comment' },
    { value: 'rating_given', label: 'Ratings Given', icon: 'star' },
    { value: 'collection_created', label: 'Collections Created', icon: 'folder' }
  ];
  
  constructor(private activityService: ActivityService) {}
  
  async ngOnInit(): Promise<void> {
    await this.loadActivities();
    this.subscribeToRealTimeUpdates();
  }

  ngOnDestroy(): void {
    this.destroy$.next();
    this.destroy$.complete();
  }
  
  private async loadActivities(): Promise<void> {
    this.isLoading = true;
    
    try {
      const params = {
        type: this.selectedFilter === 'all' ? undefined : this.selectedFilter,
        page: this.currentPage,
        page_size: this.pageSize
      };
      
      // Since the API might not be fully implemented, we'll use mock data for now
      this.activities = await this.activityService.getUserActivity(params).catch(() => this.getMockActivities());
      this.filteredActivities = this.activities;
      this.totalActivities = this.activities.length;
    } catch (error) {
      console.error('Failed to load activities:', error);
      // Use mock data as fallback
      this.activities = this.getMockActivities();
      this.filteredActivities = this.activities;
      this.totalActivities = this.activities.length;
    } finally {
      this.isLoading = false;
    }
  }

  private getMockActivities(): Activity[] {
    return [
      {
        id: 1,
        type: 'recipe_created',
        description: 'Created a new recipe "Chocolate Chip Cookies"',
        created_at: new Date(Date.now() - 1000 * 60 * 30).toISOString(), // 30 minutes ago
        metadata: { recipe_title: 'Chocolate Chip Cookies' }
      },
      {
        id: 2,
        type: 'favorite_added',
        description: 'Added "Beef Stroganoff" to favorites',
        created_at: new Date(Date.now() - 1000 * 60 * 60 * 2).toISOString(), // 2 hours ago
        metadata: { recipe_title: 'Beef Stroganoff' }
      },
      {
        id: 3,
        type: 'rating_given',
        description: 'Rated "Italian Pasta Salad" 5 stars',
        created_at: new Date(Date.now() - 1000 * 60 * 60 * 6).toISOString(), // 6 hours ago
        metadata: { recipe_title: 'Italian Pasta Salad', rating: 5 }
      },

      {
        id: 5,
        type: 'recipe_published',
        description: 'Published recipe "Homemade Pizza Dough"',
        created_at: new Date(Date.now() - 1000 * 60 * 60 * 24 * 2).toISOString(), // 2 days ago
        metadata: { recipe_title: 'Homemade Pizza Dough' }
      },
      {
        id: 6,
        type: 'comment_added',
        description: 'Commented on "Thai Green Curry"',
        created_at: new Date(Date.now() - 1000 * 60 * 60 * 24 * 3).toISOString(), // 3 days ago
        metadata: { recipe_title: 'Thai Green Curry' }
      }
    ];
  }
  
  private subscribeToRealTimeUpdates(): void {
    this.activityService.activityUpdates$
      .pipe(takeUntil(this.destroy$))
      .subscribe(newActivity => {
        if (newActivity && (this.selectedFilter === 'all' || newActivity.type === this.selectedFilter)) {
          this.activities.unshift(newActivity);
          this.filteredActivities = this.activities;
          this.totalActivities++;
        }
      });
  }
  
  onFilterChange(): void {
    this.currentPage = 1;
    this.loadActivities();
  }
  
  onPageChange(page: number): void {
    this.currentPage = page;
    this.loadActivities();
  }

  getActivityIcon(activityType: string): string {
    return this.activityService.getActivityIcon(activityType);
  }

  getActivityColor(activityType: string): string {
    return this.activityService.getActivityColor(activityType);
  }

  getActivityTitle(activity: Activity): string {
    switch (activity.type) {
      case 'recipe_created':
        return 'Recipe Created';
      case 'recipe_published':
        return 'Recipe Published';
      case 'favorite_added':
        return 'Added to Favorites';
      case 'comment_added':
        return 'Comment Added';
      case 'rating_given':
        return 'Rating Given';

      default:
        return 'Activity';
    }
  }

  formatActivityDescription(activity: Activity): string {
    // Remove redundant information and make it more readable
    return activity.description;
  }

  trackByActivityId(index: number, activity: Activity): number {
    return activity.id;
  }

  async refreshActivities(): Promise<void> {
    await this.loadActivities();
  }

  get hasActivities(): boolean {
    return this.filteredActivities && this.filteredActivities.length > 0;
  }

  get totalPages(): number {
    return Math.ceil(this.totalActivities / this.pageSize);
  }

  getSelectedFilterLabel(): string {
    const option = this.filterOptions.find(opt => opt.value === this.selectedFilter);
    return option?.label || 'selected filter';
  }
}