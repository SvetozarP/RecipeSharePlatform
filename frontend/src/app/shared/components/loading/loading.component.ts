import { Component, Input } from '@angular/core';
import { CommonModule } from '@angular/common';
import { MaterialModule } from '../../material.module';

@Component({
  selector: 'app-loading',
  standalone: true,
  imports: [CommonModule, MaterialModule],
  template: `
    <div class="flex justify-center items-center" [ngClass]="{'h-64': fullHeight, 'py-4': !fullHeight}">
      <div class="text-center">
        <mat-spinner [diameter]="size"></mat-spinner>
        <p class="mt-4 text-gray-600" *ngIf="message">{{ message }}</p>
      </div>
    </div>
  `
})
export class LoadingComponent {
  @Input() message: string = 'Loading...';
  @Input() size: number = 50;
  @Input() fullHeight: boolean = false;
} 