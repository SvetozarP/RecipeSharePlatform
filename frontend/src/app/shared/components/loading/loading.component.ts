import { Component, Input } from '@angular/core';
import { CommonModule } from '@angular/common';
import { MaterialModule } from '../../material.module';

@Component({
  selector: 'app-loading',
  standalone: true,
  imports: [CommonModule, MaterialModule],
  templateUrl: './loading.component.html'
})
export class LoadingComponent {
  @Input() message = 'Loading...';
  @Input() size = 50;
  @Input() fullHeight = false;
  @Input() inline = false;
} 