import type {
  ActivityEntry,
  FoodEntry,
  WaterEntry,
  WeightEntry,
  WorkoutEntry,
} from "@/types/fitness";

export type ProposedAction =
  | { kind: "food"; entry: FoodEntry }
  | { kind: "weight"; entry: WeightEntry }
  | { kind: "activity"; entry: ActivityEntry }
  | { kind: "water"; entry: WaterEntry }
  | { kind: "workout"; entry: WorkoutEntry };