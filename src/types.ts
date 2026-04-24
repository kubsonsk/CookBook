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
  ingredients: Ingredient[];
  steps: Step[];
  ownerId: string;
  createdAt?: any;
  updatedAt?: any;
}
