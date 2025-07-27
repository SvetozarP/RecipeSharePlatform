import { Component } from '@angular/core';
import { CommonModule } from '@angular/common';
import { MaterialModule } from '../../../shared/material.module';

@Component({
  selector: 'app-recipe-detail',
  standalone: true,
  imports: [CommonModule, MaterialModule],
  template: `
    <div class="container mx-auto px-4 py-8">
      <mat-card>
        <mat-card-header>
          <mat-card-title>Recipe Detail</mat-card-title>
          <mat-card-subtitle>Detailed recipe view will be implemented in Step 12</mat-card-subtitle>
        </mat-card-header>
        <mat-card-content>
          <p>Recipe detail view coming in Step 12 - Recipe Detail & Management UI</p>
        </mat-card-content>
      </mat-card>
    </div>
  `
})
export class RecipeDetailComponent {

} 