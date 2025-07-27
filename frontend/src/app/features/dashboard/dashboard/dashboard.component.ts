import { Component } from '@angular/core';
import { CommonModule } from '@angular/common';
import { MaterialModule } from '../../../shared/material.module';

@Component({
  selector: 'app-dashboard',
  standalone: true,
  imports: [CommonModule, MaterialModule],
  template: `
    <div class="container mx-auto px-4 py-8">
      <mat-card>
        <mat-card-header>
          <mat-card-title>Dashboard</mat-card-title>
          <mat-card-subtitle>User dashboard will be implemented in Step 14</mat-card-subtitle>
        </mat-card-header>
        <mat-card-content>
          <p>User dashboard coming in Step 14 - User Dashboard Module</p>
        </mat-card-content>
      </mat-card>
    </div>
  `
})
export class DashboardComponent {

} 