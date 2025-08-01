import { Pipe, PipeTransform } from '@angular/core';
import { Collection } from '../models/dashboard-data.model';

@Pipe({
  name: 'collectionType',
  standalone: true
})
export class CollectionTypePipe implements PipeTransform {
  transform(collection: Collection, output: 'icon' | 'label' | 'color'): string {
    if (!collection) return '';
    
    switch (output) {
      case 'icon':
        return this.getCollectionIcon(collection);
      case 'label':
        return this.getCollectionLabel(collection);
      case 'color':
        return this.getCollectionColor(collection);
      default:
        return '';
    }
  }

  private getCollectionIcon(collection: Collection): string {
    if (collection.is_public) {
      return 'public';
    }
    
    // Could add more logic here based on collection name or other properties
    const name = collection.name.toLowerCase();
    
    if (name.includes('favorite') || name.includes('fav')) {
      return 'favorite';
    } else if (name.includes('dessert') || name.includes('sweet')) {
      return 'cake';
    } else if (name.includes('quick') || name.includes('fast')) {
      return 'flash_on';
    } else if (name.includes('healthy') || name.includes('diet')) {
      return 'eco';
    } else if (name.includes('breakfast')) {
      return 'free_breakfast';
    } else if (name.includes('dinner') || name.includes('lunch')) {
      return 'restaurant';
    } else if (name.includes('drink') || name.includes('beverage')) {
      return 'local_cafe';
    } else if (name.includes('vegetarian') || name.includes('vegan')) {
      return 'eco';
    } else if (name.includes('holiday') || name.includes('party')) {
      return 'celebration';
    } else {
      return 'folder';
    }
  }

  private getCollectionLabel(collection: Collection): string {
    const baseLabel = collection.is_public ? 'Public Collection' : 'Private Collection';
    const recipeCount = collection.recipe_count || 0;
    const recipeText = recipeCount === 1 ? 'recipe' : 'recipes';
    
    return `${baseLabel} • ${recipeCount} ${recipeText}`;
  }

  private getCollectionColor(collection: Collection): string {
    if (collection.is_public) {
      return 'text-green-600';
    }
    
    // Return different colors based on collection characteristics
    const name = collection.name.toLowerCase();
    
    if (name.includes('favorite') || name.includes('fav')) {
      return 'text-red-600';
    } else if (name.includes('dessert') || name.includes('sweet')) {
      return 'text-pink-600';
    } else if (name.includes('quick') || name.includes('fast')) {
      return 'text-orange-600';
    } else if (name.includes('healthy') || name.includes('diet')) {
      return 'text-green-600';
    } else if (name.includes('vegetarian') || name.includes('vegan')) {
      return 'text-emerald-600';
    } else {
      return 'text-blue-600';
    }
  }
}