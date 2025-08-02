import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule, ReactiveFormsModule, FormBuilder, FormGroup, Validators } from '@angular/forms';
import { MatCardModule } from '@angular/material/card';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { MatInputModule } from '@angular/material/input';
import { MatSelectModule } from '@angular/material/select';
import { MatSlideToggleModule } from '@angular/material/slide-toggle';
import { MatSnackBarModule } from '@angular/material/snack-bar';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';
import { MatExpansionModule } from '@angular/material/expansion';
import { MatDividerModule } from '@angular/material/divider';
import { AdminService } from '../../services/admin.service';
import { SystemSettings } from '../../models/admin.models';

@Component({
  selector: 'app-system-settings',
  standalone: true,
  imports: [
    CommonModule,
    FormsModule,
    ReactiveFormsModule,
    MatCardModule,
    MatButtonModule,
    MatIconModule,
    MatInputModule,
    MatSelectModule,
    MatSlideToggleModule,
    MatSnackBarModule,
    MatProgressSpinnerModule,
    MatExpansionModule,
    MatDividerModule
  ],
  template: `
    <div class="system-settings">
      <div class="page-header">
        <h1>System Settings</h1>
        <p>Configure platform settings and features</p>
      </div>

      <!-- Loading State -->
      <div *ngIf="loading" class="loading-container">
        <mat-spinner></mat-spinner>
        <p>Loading settings...</p>
      </div>

      <!-- Settings Form -->
      <div *ngIf="!loading" class="settings-content">
        <form [formGroup]="settingsForm" (ngSubmit)="saveSettings()">
          <!-- General Settings -->
          <mat-card class="settings-card">
            <mat-card-header>
              <mat-card-title>General Settings</mat-card-title>
              <mat-card-subtitle>Basic platform configuration</mat-card-subtitle>
            </mat-card-header>
            <mat-card-content>
              <div class="form-grid">
                <mat-form-field appearance="fill">
                  <mat-label>Site Name</mat-label>
                  <input matInput formControlName="site_name" placeholder="Recipe Sharing Platform">
                </mat-form-field>

                <mat-form-field appearance="fill">
                  <mat-label>Site Description</mat-label>
                  <textarea matInput formControlName="site_description" rows="3" 
                           placeholder="A platform for sharing and discovering recipes"></textarea>
                </mat-form-field>

                <mat-form-field appearance="fill">
                  <mat-label>Contact Email</mat-label>
                  <input matInput formControlName="contact_email" type="email" 
                         placeholder="admin@example.com">
                </mat-form-field>
              </div>
            </mat-card-content>
          </mat-card>

          <!-- Content Settings -->
          <mat-card class="settings-card">
            <mat-card-header>
              <mat-card-title>Content Settings</mat-card-title>
              <mat-card-subtitle>Recipe and content management</mat-card-subtitle>
            </mat-card-header>
            <mat-card-content>
              <div class="form-grid">
                <mat-form-field appearance="fill">
                  <mat-label>Max Upload Size (MB)</mat-label>
                  <input matInput formControlName="max_upload_size" type="number" min="1" max="100">
                </mat-form-field>

                <mat-form-field appearance="fill">
                  <mat-label>Max Images per Recipe</mat-label>
                  <input matInput formControlName="max_images_per_recipe" type="number" min="1" max="20">
                </mat-form-field>

                <mat-form-field appearance="fill">
                  <mat-label>Max Recipes per User</mat-label>
                  <input matInput formControlName="max_recipes_per_user" type="number" min="1" max="1000">
                </mat-form-field>
              </div>
            </mat-card-content>
          </mat-card>

          <!-- Moderation Settings -->
          <mat-card class="settings-card">
            <mat-card-header>
              <mat-card-title>Moderation Settings</mat-card-title>
              <mat-card-subtitle>Content approval and moderation</mat-card-subtitle>
            </mat-card-header>
            <mat-card-content>
              <div class="toggle-settings">
                <div class="toggle-item">
                  <div class="toggle-info">
                    <h4>Enable Moderation</h4>
                    <p>Require admin approval for new content</p>
                  </div>
                  <mat-slide-toggle formControlName="moderation_enabled"></mat-slide-toggle>
                </div>

                <div class="toggle-item">
                  <div class="toggle-info">
                    <h4>Auto-approve Recipes</h4>
                    <p>Automatically approve new recipe submissions</p>
                  </div>
                  <mat-slide-toggle formControlName="auto_approve_recipes"></mat-slide-toggle>
                </div>

                <div class="toggle-item">
                  <div class="toggle-info">
                    <h4>Auto-approve Ratings</h4>
                    <p>Automatically approve new ratings and reviews</p>
                  </div>
                  <mat-slide-toggle formControlName="auto_approve_ratings"></mat-slide-toggle>
                </div>
              </div>
            </mat-card-content>
          </mat-card>

          <!-- User Settings -->
          <mat-card class="settings-card">
            <mat-card-header>
              <mat-card-title>User Settings</mat-card-title>
              <mat-card-subtitle>User registration and verification</mat-card-subtitle>
            </mat-card-header>
            <mat-card-content>
              <div class="toggle-settings">
                <div class="toggle-item">
                  <div class="toggle-info">
                    <h4>Enable Registration</h4>
                    <p>Allow new users to register</p>
                  </div>
                  <mat-slide-toggle formControlName="registration_enabled"></mat-slide-toggle>
                </div>

                <div class="toggle-item">
                  <div class="toggle-info">
                    <h4>Require Email Verification</h4>
                    <p>Require email verification for new accounts</p>
                  </div>
                  <mat-slide-toggle formControlName="email_verification_required"></mat-slide-toggle>
                </div>
              </div>
            </mat-card-content>
          </mat-card>

          <!-- Maintenance Settings -->
          <mat-card class="settings-card">
            <mat-card-header>
              <mat-card-title>Maintenance Settings</mat-card-title>
              <mat-card-subtitle>Site maintenance and downtime</mat-card-subtitle>
            </mat-card-header>
            <mat-card-content>
              <div class="toggle-settings">
                <div class="toggle-item">
                  <div class="toggle-info">
                    <h4>Maintenance Mode</h4>
                    <p>Put the site in maintenance mode</p>
                  </div>
                  <mat-slide-toggle formControlName="maintenance_mode"></mat-slide-toggle>
                </div>
              </div>

              <mat-form-field appearance="fill" class="full-width">
                <mat-label>Maintenance Message</mat-label>
                <textarea matInput formControlName="maintenance_message" rows="3" 
                         placeholder="Site is currently under maintenance. Please check back later."></textarea>
              </mat-form-field>
            </mat-card-content>
          </mat-card>

          <!-- Save Button -->
          <div class="save-actions">
            <button mat-raised-button color="primary" type="submit" [disabled]="saving">
              <mat-icon>save</mat-icon>
              {{ saving ? 'Saving...' : 'Save Settings' }}
            </button>
          </div>
        </form>
      </div>
    </div>
  `,
  styles: [`
    .system-settings {
      max-width: 800px;
      margin: 0 auto;
    }

    .page-header {
      margin-bottom: 24px;
    }

    .page-header h1 {
      margin: 0 0 8px 0;
      color: #1976d2;
      font-size: 2rem;
    }

    .page-header p {
      margin: 0;
      color: #666;
    }

    .loading-container {
      display: flex;
      flex-direction: column;
      align-items: center;
      justify-content: center;
      padding: 64px;
    }

    .loading-container p {
      margin-top: 16px;
      color: #666;
    }

    .settings-content {
      display: flex;
      flex-direction: column;
      gap: 24px;
    }

    .settings-card {
      margin-bottom: 16px;
    }

    .form-grid {
      display: grid;
      grid-template-columns: repeat(auto-fit, minmax(250px, 1fr));
      gap: 16px;
    }

    .toggle-settings {
      display: flex;
      flex-direction: column;
      gap: 16px;
    }

    .toggle-item {
      display: flex;
      justify-content: space-between;
      align-items: center;
      padding: 16px;
      background-color: #f9f9f9;
      border-radius: 8px;
    }

    .toggle-info h4 {
      margin: 0 0 4px 0;
      color: #333;
      font-size: 1rem;
    }

    .toggle-info p {
      margin: 0;
      color: #666;
      font-size: 0.9rem;
    }

    .full-width {
      width: 100%;
      margin-top: 16px;
    }

    .save-actions {
      display: flex;
      justify-content: center;
      margin-top: 32px;
    }

    @media (max-width: 768px) {
      .form-grid {
        grid-template-columns: 1fr;
      }

      .toggle-item {
        flex-direction: column;
        align-items: flex-start;
        gap: 12px;
      }
    }
  `]
})
export class SystemSettingsComponent implements OnInit {
  loading = false;
  saving = false;
  settingsForm: FormGroup;

  constructor(
    private adminService: AdminService,
    private formBuilder: FormBuilder
  ) {
    this.settingsForm = this.formBuilder.group({
      site_name: ['', Validators.required],
      site_description: [''],
      contact_email: ['', [Validators.required, Validators.email]],
      max_upload_size: [10, [Validators.required, Validators.min(1), Validators.max(100)]],
      max_images_per_recipe: [5, [Validators.required, Validators.min(1), Validators.max(20)]],
      max_recipes_per_user: [100, [Validators.required, Validators.min(1), Validators.max(1000)]],
      moderation_enabled: [true],
      auto_approve_recipes: [false],
      auto_approve_ratings: [false],
      registration_enabled: [true],
      email_verification_required: [true],
      maintenance_mode: [false],
      maintenance_message: ['']
    });
  }

  ngOnInit(): void {
    this.loadSettings();
  }

  private loadSettings(): void {
    this.loading = true;
    this.adminService.getSystemSettings().subscribe({
      next: (settings) => {
        this.settingsForm.patchValue(settings);
        this.loading = false;
      },
      error: (error) => {
        console.error('Failed to load settings:', error);
        this.loading = false;
      }
    });
  }

  saveSettings(): void {
    if (this.settingsForm.valid) {
      this.saving = true;
      const settings = this.settingsForm.value;

      this.adminService.updateSystemSettings(settings).subscribe({
        next: (updatedSettings) => {
          this.settingsForm.patchValue(updatedSettings);
          this.saving = false;
          // TODO: Show success message
        },
        error: (error) => {
          console.error('Failed to save settings:', error);
          this.saving = false;
          // TODO: Show error message
        }
      });
    }
  }
} 