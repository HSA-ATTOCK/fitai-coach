import type { DemoState } from "@/types/fitness";

const day = (offset: number, hour = 12) => {
  const date = new Date();
  date.setDate(date.getDate() - offset);
  date.setHours(hour, 0, 0, 0);
  return date.toISOString();
};

export const initialDemoState: DemoState = {
  messages: [
    {
      id: "welcome-1",
      role: "assistant",
      content: "Hey Alex! I’m your FitAI Coach demo. Tell me what you ate, how you moved, or your latest weight. Any nutrition numbers here are illustrative estimates.",
      createdAt: day(0, 9),
    },
  ],
  foodEntries: [
    { id: "food-1", name: "Greek yogurt, berries & oats", category: "Breakfast", date: day(0, 8), calories: 340, protein: 24, carbs: 44, fat: 8 },
    { id: "food-2", name: "Grilled chicken salad with quinoa", category: "Lunch", date: day(0, 13), calories: 520, protein: 42, carbs: 48, fat: 16 },
    { id: "food-3", name: "Apple and almonds", category: "Snack", date: day(0, 15), calories: 210, protein: 6, carbs: 25, fat: 11 },
    { id: "food-4", name: "Eggs on whole-grain toast", category: "Breakfast", date: day(1, 8), calories: 390, protein: 23, carbs: 34, fat: 17 },
    { id: "food-5", name: "Salmon, rice and greens", category: "Dinner", date: day(1, 19), calories: 640, protein: 39, carbs: 62, fat: 22 },
    { id: "food-6", name: "Chicken wrap", category: "Lunch", date: day(2, 13), calories: 480, protein: 31, carbs: 51, fat: 15 },
    { id: "food-7", name: "Lentil bowl", category: "Dinner", date: day(3, 19), calories: 560, protein: 27, carbs: 76, fat: 12 },
    { id: "food-8", name: "Banana and peanut butter", category: "Snack", date: day(4, 16), calories: 260, protein: 7, carbs: 31, fat: 13 },
    { id: "food-9", name: "Omelette and toast", category: "Breakfast", date: day(5, 8), calories: 410, protein: 25, carbs: 32, fat: 19 },
    { id: "food-10", name: "Turkey rice bowl", category: "Lunch", date: day(6, 13), calories: 570, protein: 38, carbs: 64, fat: 14 },
  ],
  weightEntries: [
    { id: "weight-1", date: day(27, 8), weightKg: 80.2 },
    { id: "weight-2", date: day(21, 8), weightKg: 79.8 },
    { id: "weight-3", date: day(14, 8), weightKg: 79.4 },
    { id: "weight-4", date: day(7, 8), weightKg: 78.9 },
    { id: "weight-5", date: day(0, 8), weightKg: 78.6 },
  ],
  activityEntries: [
    { id: "activity-1", date: day(0, 17), name: "Brisk walk", minutes: 30 },
    { id: "activity-2", date: day(1, 18), name: "Strength training", minutes: 45 },
    { id: "activity-3", date: day(2, 17), name: "Cycling", minutes: 35 },
    { id: "activity-4", date: day(4, 18), name: "Strength training", minutes: 40 },
    { id: "activity-5", date: day(6, 17), name: "Walk", minutes: 25 },
  ],
  waterEntries: [
    { id: "water-1", date: day(0, 9), milliliters: 500 },
    { id: "water-2", date: day(0, 11), milliliters: 350 },
    { id: "water-3", date: day(0, 14), milliliters: 500 },
  ],
  profile: {
    name: "Alex Rivera",
    age: 28,
    heightCm: 176,
    weightKg: 78.6,
    units: "metric",
    dietaryPreference: "No specific preference",
    activityLevel: "Moderately active",
  },
  goals: {
    type: "maintain",
    targetWeightKg: 76,
    dailyCalories: 2100,
    dailyProtein: 130,
    dailyCarbs: 220,
    dailyFat: 70,
    dailyWaterMl: 3000,
  },
};
