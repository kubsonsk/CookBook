export interface Ingredient {
  name: string;
  amount: number;
  unit: string;
}

export interface Step {
  text: string;
  imageUrl?: string;
}

export interface Recipe {
  id?: string;
  title: string;
  heroImageUrl?: string;
  videoUrl?: string;
  servings: number;
  prepTime?: number;
  categories: string[];
  ingredients: Ingredient[];
  steps: Step[];
  ownerId: string;
  createdAt?: any;
  updatedAt?: any;
}

export type Category = 'Breakfast' | 'Lunch' | 'Dinner' | 'Snack' | 'Dessert' | 'Appetizer' | 'Side' | 'Drink';

export const CATEGORIES: Category[] = ['Breakfast', 'Lunch', 'Dinner', 'Snack', 'Dessert', 'Appetizer', 'Side', 'Drink'];
