import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { Router, RouterLink, RouterOutlet } from '@angular/router';
import { MatSidenavModule } from '@angular/material/sidenav';
import { MatToolbarModule } from '@angular/material/toolbar';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { MatListModule } from '@angular/material/list';
import { MatDividerModule } from '@angular/material/divider';
import { MatBadgeModule } from '@angular/material/badge';
import { MatMenuModule } from '@angular/material/menu';
import { MatSnackBar } from '@angular/material/snack-bar';
import { AuthService } from '../../../core/services/auth.service';
import { AdminService } from '../services/admin.service';
import { ModerationQueue } from '../models/admin.models';

@Component({
  selector: 'app-admin',
  standalone: true,
  imports: [
    CommonModule,
    RouterOutlet,
    MatSidenavModule,
    MatToolbarModule,
    MatButtonModule,
    MatIconModule,
    MatListModule,
    MatDividerModule,
    MatBadgeModule,
    MatMenuModule,
    RouterLink
  ],
  templateUrl: './admin.component.html',
  styleUrls: ['./admin.component.scss']})
export class AdminComponent implements OnInit {
  moderationQueue?: ModerationQueue;
  isMobile = false;

  // Getter methods for safe access to moderation queue counts
  get pendingRecipesCount(): number {
    return this.moderationQueue?.recipes?.pending || 0;
  }

  get pendingRatingsCount(): number {
    return this.moderationQueue?.ratings?.pending || 0;
  }

  get hasPendingRecipes(): boolean {
    return this.pendingRecipesCount > 0;
  }

  get hasPendingRatings(): boolean {
    return this.pendingRatingsCount > 0;
  }

  constructor(
    private router: Router,
    private authService: AuthService,
    private adminService: AdminService,
    private snackBar: MatSnackBar
  ) {}

  ngOnInit(): void {
    this.checkAdminAccess();
    this.loadModerationQueue();
    this.checkScreenSize();
    window.addEventListener('resize', () => this.checkScreenSize());
  }

  private checkScreenSize(): void {
    this.isMobile = window.innerWidth <= 768;
  }

  private checkAdminAccess(): void {
    const user = this.authService.getCurrentUser();
    if (!user || !user.isStaff) {
      this.snackBar.open('Access denied. Admin privileges required.', 'Close', {
        duration: 5000,
        panelClass: ['error-snackbar']
      });
      this.router.navigate(['/']);
    }
  }

  private loadModerationQueue(): void {
    this.adminService.getModerationQueue().subscribe({
      next: (queue) => {
        this.moderationQueue = queue;
      },
      error: (error) => {
        console.error('Failed to load moderation queue:', error);
      }
    });
  }

  logout(): void {
    this.authService.logout();
    this.router.navigate(['/auth/login']);
  }

  goToMainSite(): void {
    this.router.navigate(['/']);
  }
} 