import { Component, Inject, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule, ReactiveFormsModule, FormBuilder, FormGroup, Validators } from '@angular/forms';
import { MatDialogRef, MAT_DIALOG_DATA, MatDialogModule } from '@angular/material/dialog';
import { MatCardModule } from '@angular/material/card';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { MatInputModule } from '@angular/material/input';
import { MatSelectModule } from '@angular/material/select';
import { MatCheckboxModule } from '@angular/material/checkbox';
import { MatChipsModule } from '@angular/material/chips';
import { MatSnackBar } from '@angular/material/snack-bar';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';
import { MatExpansionModule } from '@angular/material/expansion';
import { AdminService } from '../../services/admin.service';
import { AdminRecipe } from '../../models/admin.models';

interface DialogData {
  recipe: AdminRecipe;
  mode: 'view' | 'edit';
}

@Component({
  selector: 'app-recipe-detail-dialog',
  standalone: true,
  imports: [
    CommonModule,
    FormsModule,
    ReactiveFormsModule,
    MatDialogModule,
    MatCardModule,
    MatButtonModule,
    MatIconModule,
    MatInputModule,
    MatSelectModule,
    MatCheckboxModule,
    MatChipsModule,
    MatProgressSpinnerModule,
    MatExpansionModule,
  ],
  template: `
    <div class="recipe-detail-dialog">
      <div class="dialog-header">
        <h2 mat-dialog-title>
          <mat-icon>{{ data.mode === 'view' ? 'visibility' : 'edit' }}</mat-icon>
          {{ data.mode === 'view' ? 'Recipe Details' : 'Edit Recipe' }}
        </h2>
        <button mat-icon-button mat-dialog-close>
          <mat-icon>close</mat-icon>
        </button>
      </div>

      <mat-dialog-content>
        <!-- Loading State -->
        <div *ngIf="loading" class="loading-container">
          <mat-spinner></mat-spinner>
          <p>Saving changes...</p>
        </div>

        <!-- Recipe Details Form -->
        <div *ngIf="!loading">
          <form [formGroup]="recipeForm" (ngSubmit)="onSubmit()">
            <div class="form-grid">
              <!-- Basic Information -->
              <div class="form-section">
                <h3>Basic Information</h3>
                
                <mat-form-field appearance="fill">
                  <mat-label>Title</mat-label>
                  <input matInput formControlName="title" [readonly]="data.mode === 'view'">
                  <mat-error *ngIf="recipeForm.get('title')?.hasError('required')">
                    Title is required
                  </mat-error>
                </mat-form-field>

                <mat-form-field appearance="fill">
                  <mat-label>Description</mat-label>
                  <textarea matInput formControlName="description" rows="3" [readonly]="data.mode === 'view'"></textarea>
                  <mat-error *ngIf="recipeForm.get('description')?.hasError('required')">
                    Description is required
                  </mat-error>
                </mat-form-field>
              </div>

              <!-- Recipe Status -->
              <div class="form-section">
                <h3>Recipe Status</h3>
                
                <div class="status-controls" [class.readonly]="data.mode === 'view'">
                  <mat-checkbox formControlName="is_published" [disabled]="data.mode === 'view'">
                    Published
                  </mat-checkbox>
                </div>

                <!-- Current Status Display -->
                <div class="status-display">
                  <h4>Current Status</h4>
                  <mat-chip-set>
                    <mat-chip *ngIf="recipeForm.get('is_published')?.value" color="primary" variant="outlined">
                      Published
                    </mat-chip>
                    <mat-chip *ngIf="!recipeForm.get('is_published')?.value" color="warn" variant="outlined">
                      Draft
                    </mat-chip>
                  </mat-chip-set>
                </div>
              </div>

              <!-- Recipe Information -->
              <div class="form-section">
                <h3>Recipe Information</h3>
                
                <div class="info-item">
                  <label>Author:</label>
                  <span>{{ data.recipe.author?.username || 'Unknown' }}</span>
                </div>
                
                <div class="info-item">
                  <label>Created:</label>
                  <span>{{ data.recipe.created_at | date:'medium' }}</span>
                </div>
                
                <div class="info-item">
                  <label>Last Updated:</label>
                  <span>{{ data.recipe.updated_at | date:'medium' }}</span>
                </div>
                
                <div class="info-item">
                  <label>Total Ratings:</label>
                  <span>{{ data.recipe.rating_stats?.total_ratings || 0 }}</span>
                </div>
                
                <div class="info-item">
                  <label>Average Rating:</label>
                  <span>{{ data.recipe.rating_stats?.average_rating || 0 }}/5</span>
                </div>
                
                <div class="info-item">
                  <label>Views:</label>
                  <span>{{ data.recipe.view_count || 0 }}</span>
                </div>
                
                <div class="info-item">
                  <label>Favorites:</label>
                  <span>{{ data.recipe.favorite_count || 0 }}</span>
                </div>
              </div>

              <!-- Categories -->
              <div class="form-section">
                <h3>Categories</h3>
                <div class="categories-display">
                  <mat-chip-set>
                    <mat-chip *ngFor="let category of data.recipe.categories" color="primary" variant="outlined">
                      {{ category.name }}
                    </mat-chip>
                    <mat-chip *ngIf="data.recipe.categories?.length === 0" color="warn" variant="outlined">
                      No categories assigned
                    </mat-chip>
                  </mat-chip-set>
                </div>
              </div>
            </div>
          </form>
        </div>
      </mat-dialog-content>

      <mat-dialog-actions align="end">
        <button mat-button mat-dialog-close>Cancel</button>
        <button 
          *ngIf="data.mode === 'edit'"
          mat-raised-button 
          color="primary" 
          (click)="onSubmit()"
          [disabled]="recipeForm.invalid || loading">
          <mat-icon>save</mat-icon>
          Save Changes
        </button>
      </mat-dialog-actions>
    </div>
  `,
  styles: [`
    .recipe-detail-dialog {
      min-width: 600px;
      max-width: 800px;
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

    .loading-container {
      display: flex;
      flex-direction: column;
      align-items: center;
      justify-content: center;
      padding: 32px;
    }

    .loading-container p {
      margin-top: 16px;
      color: #666;
    }

    .form-grid {
      display: grid;
      gap: 24px;
    }

    .form-section {
      border: 1px solid #e0e0e0;
      border-radius: 8px;
      padding: 16px;
    }

    .form-section h3 {
      margin: 0 0 16px 0;
      color: #1976d2;
      font-size: 1.1rem;
    }

    .form-section mat-form-field {
      width: 100%;
      margin-bottom: 16px;
    }

    .status-controls {
      display: flex;
      flex-direction: column;
      gap: 12px;
      margin-bottom: 16px;
    }

    .status-controls.readonly mat-checkbox {
      pointer-events: none;
      opacity: 0.7;
    }

    .status-display h4 {
      margin: 0 0 8px 0;
      font-size: 0.9rem;
      color: #666;
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

    .categories-display {
      margin-top: 8px;
    }

    mat-chip-set {
      display: flex;
      flex-wrap: wrap;
      gap: 4px;
    }

    mat-chip {
      font-size: 0.7rem;
    }

    mat-dialog-actions {
      padding: 16px 0 0 0;
      margin: 0;
    }

    @media (max-width: 768px) {
      .recipe-detail-dialog {
        min-width: auto;
        width: 100%;
      }

      .form-grid {
        grid-template-columns: 1fr;
      }
    }
  `]
})
export class RecipeDetailDialogComponent implements OnInit {
  recipeForm: FormGroup;
  loading = false;

  constructor(
    public dialogRef: MatDialogRef<RecipeDetailDialogComponent>,
    @Inject(MAT_DIALOG_DATA) public data: DialogData,
    private formBuilder: FormBuilder,
    private adminService: AdminService,
    private snackBar: MatSnackBar
  ) {
    this.recipeForm = this.formBuilder.group({
      title: ['', Validators.required],
      description: ['', Validators.required],
      is_published: [false]
    });
  }

  ngOnInit(): void {
    this.populateForm();
  }

  private populateForm(): void {
    const recipe = this.data.recipe;
    this.recipeForm.patchValue({
      title: recipe.title || '',
      description: recipe.description || '',
      is_published: recipe.is_published || false
    });

    if (this.data.mode === 'view') {
      this.recipeForm.disable();
    }
  }

  onSubmit(): void {
    if (this.recipeForm.invalid || this.data.mode === 'view') {
      return;
    }

    this.loading = true;
    const updatedRecipe = {
      ...this.recipeForm.value
    };

    this.adminService.updateRecipe(this.data.recipe.id, updatedRecipe).subscribe({
      next: (result) => {
        this.loading = false;
        this.snackBar.open('Recipe updated successfully', 'Close', {
          duration: 3000
        });
        this.dialogRef.close(true);
      },
      error: (error) => {
        this.loading = false;
        console.error('Failed to update recipe:', error);
        this.snackBar.open('Failed to update recipe', 'Close', {
          duration: 5000
        });
      }
    });
  }
} 