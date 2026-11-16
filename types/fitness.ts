export type MealCategory = "Breakfast" | "Lunch" | "Dinner" | "Snack";
export type ChatRole = "user" | "assistant";
export type GoalType = "lose" | "maintain" | "gain";
export type UnitSystem = "metric" | "imperial";

export interface ChatMessage {
  id: string;
  role: ChatRole;
  content: string;
  createdAt: string;
  actionId?: string;
}

export interface NutritionIngredient {
  name: string;
  portion: string;
  calories: number;
  protein: number;
  carbs: number;
  fat: number;
}

export interface FoodEntry {
  id: string;
  name: string;
  category: MealCategory;
  date: string;
  calories: number;
  protein: number;
  carbs: number;
  fat: number;
  notes?: string;
  ingredients?: NutritionIngredient[];
}

export interface WeightEntry {
  id: string;
  date: string;
  weightKg: number;
}

export interface ActivityEntry {
  id: string;
  date: string;
  name: string;
  minutes: number;
}

export interface WorkoutExerciseEntry {
  id?: string;
  exerciseName: string;
  sets: number;
  reps: number;
  weightKg: number;
  notes?: string;
}

export interface WorkoutEntry {
  id: string;
  date: string;
  name: string;
  minutes: number;
  caloriesBurned?: number;
  distanceKm?: number;
  notes?: string;
  exercises: WorkoutExerciseEntry[];
}

export interface WaterEntry {
  id: string;
  date: string;
  milliliters: number;
}

export interface UserProfile {
  name: string;
  age: number;
  heightCm: number;
  weightKg: number;
  units: UnitSystem;
  dietaryPreference: string;
  activityLevel: string;
}

export interface FitnessGoals {
  type: GoalType;
  targetWeightKg: number;
  dailyCalories: number;
  dailyProtein: number;
  dailyCarbs: number;
  dailyFat: number;
  dailyWaterMl: number;
}

export interface DemoState {
  messages: ChatMessage[];
  foodEntries: FoodEntry[];
  weightEntries: WeightEntry[];
  activityEntries: ActivityEntry[];
  waterEntries: WaterEntry[];
  profile: UserProfile;
  goals: FitnessGoals;
}
