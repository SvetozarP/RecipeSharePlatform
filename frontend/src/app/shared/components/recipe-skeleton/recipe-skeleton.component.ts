import { Component, ChangeDetectionStrategy } from '@angular/core';
import { CommonModule } from '@angular/common';
import { MaterialModule } from '../../material.module';

@Component({
  selector: 'app-recipe-skeleton',
  standalone: true,
  imports: [CommonModule, MaterialModule],
  changeDetection: ChangeDetectionStrategy.OnPush,
  templateUrl: './recipe-skeleton.component.html',
  styleUrls: ['./recipe-skeleton.component.scss']})
export class RecipeSkeletonComponent {
}