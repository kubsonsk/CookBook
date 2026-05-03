export interface Ingredient {
  name: string;
  amount: number;
  unit: string;
}

export interface Step {
  text: string;
  imageUrl?: string;
}

export interface Label {
  id?: string;
  name: string;
  ownerId: string;
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  createdAt?: any;
}

export interface Recipe {
  id?: string;
  title: string;
  heroImageUrl?: string;
  videoUrl?: string;
  servings: number;
  prepTime?: number;
  labels: string[];
  ingredients: Ingredient[];
  steps: Step[];
  ownerId: string;
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  createdAt?: any;
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  updatedAt?: any;
}
