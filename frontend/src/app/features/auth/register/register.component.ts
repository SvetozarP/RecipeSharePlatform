import { Component } from '@angular/core';
import { CommonModule } from '@angular/common';
import { MaterialModule } from '../../../shared/material.module';

@Component({
  selector: 'app-register',
  standalone: true,
  imports: [CommonModule, MaterialModule],
  template: `
    <div class="container mx-auto px-4 py-8 max-w-md">
      <mat-card>
        <mat-card-header>
          <mat-card-title>Register</mat-card-title>
          <mat-card-subtitle>Registration will be implemented in Step 10</mat-card-subtitle>
        </mat-card-header>
        <mat-card-content>
          <p class="text-center text-gray-600">Registration form coming in Step 10 - Authentication UI Module</p>
        </mat-card-content>
      </mat-card>
    </div>
  `
})
export class RegisterComponent {

} 