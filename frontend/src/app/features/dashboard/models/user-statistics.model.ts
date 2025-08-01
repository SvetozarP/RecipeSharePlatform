export interface CategoryStats {
  category_name: string;
  recipe_count: number;
  percentage: number;
}

export interface DifficultyStats {
  difficulty: string;
  recipe_count: number;
  percentage: number;
}

export interface Achievement {
  id: string;
  title: string;
  description: string;
  icon: string;
  unlocked: boolean;
  unlockedDate?: string;
  progress?: number;
  maxProgress?: number;
}

export interface Insight {
  type: string;
  title: string;
  description: string;
  value: number;
  icon: string;
  trend?: 'up' | 'down' | 'stable';
  percentage?: number;
}