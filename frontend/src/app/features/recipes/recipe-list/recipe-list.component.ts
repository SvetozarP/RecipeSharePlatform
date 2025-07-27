import { Component } from '@angular/core';
import { CommonModule } from '@angular/common';
import { MaterialModule } from '../../../shared/material.module';

@Component({
  selector: 'app-recipe-list',
  standalone: true,
  imports: [CommonModule, MaterialModule],
  template: `
    <div class="container mx-auto px-4 py-8">
      <mat-card>
        <mat-card-header>
          <mat-card-title>Recipe List</mat-card-title>
          <mat-card-subtitle>Browse our collection of recipes</mat-card-subtitle>
        </mat-card-header>
        <mat-card-content>
          <p>Recipe list will be implemented in Step 11 - Recipe Listing UI Module</p>
        </mat-card-content>
      </mat-card>
    </div>
  `
})
export class RecipeListComponent {

} 