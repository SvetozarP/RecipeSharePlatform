import { Component, Input } from '@angular/core';
import { CommonModule } from '@angular/common';
import { MaterialModule } from '../../material.module';

@Component({
  selector: 'app-loading',
  standalone: true,
  imports: [CommonModule, MaterialModule],
  template: `
    <!-- Inline mode for buttons and compact spaces -->
    <div *ngIf="inline" class="flex items-center gap-2">
      <mat-spinner [diameter]="size"></mat-spinner>
      <span *ngIf="message" class="text-sm">{{ message }}</span>
    </div>
    
    <!-- Full mode for page loading -->
    <div *ngIf="!inline" class="flex justify-center items-center" [ngClass]="{'h-64': fullHeight, 'py-4': !fullHeight}">
      <div class="text-center">
        <mat-spinner [diameter]="size"></mat-spinner>
        <p class="mt-4 text-gray-600" *ngIf="message">{{ message }}</p>
      </div>
    </div>
  `
})
export class LoadingComponent {
  @Input() message = 'Loading...';
  @Input() size = 50;
  @Input() fullHeight = false;
  @Input() inline = false;
} 