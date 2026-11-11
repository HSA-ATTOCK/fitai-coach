
"use client";

import {
  createContext,
  useCallback,
  useContext,
  useMemo,
  useState,
  type ReactNode,
} from "react";

import { initialDemoState } from "./demo-data";

import type {
  DemoState,
  FoodEntry,
  WeightEntry,
  ActivityEntry,
  WaterEntry,
  UserProfile,
  FitnessGoals,
  ChatMessage,
} from "@/types/fitness";

interface DemoContextValue extends DemoState {
  addMessage: (message: ChatMessage) => void;
  addFood: (entry: FoodEntry) => void;
  updateFood: (entry: FoodEntry) => void;
  deleteFood: (id: string) => void;
  addWeight: (entry: WeightEntry) => void;
  addActivity: (entry: ActivityEntry) => void;
  addWater: (entry: WaterEntry) => void;
  updateProfile: (profile: UserProfile) => void;
  updateGoals: (goals: FitnessGoals) => void;
  resetDemo: () => void;
}

const DemoContext = createContext<DemoContextValue | null>(null);

// Create a fresh copy so the original demo data is never modified.
function createInitialDemoState(): DemoState {
  return structuredClone(initialDemoState);
}

export function DemoProvider({ children }: { children: ReactNode }) {
  const [state, setState] = useState<DemoState>(createInitialDemoState);

  const addMessage = useCallback((message: ChatMessage) => {
  setState((current) => {
    if (current.messages.some((item) => item.id === message.id)) {
      return current;
    }

    return {
      ...current,
      messages: [...current.messages, message],
    };
  });
}, []);

  const addFood = useCallback((entry: FoodEntry) => {
    setState((current) => {
      if (current.foodEntries.some((item) => item.id === entry.id)) {
        return current;
      }

      return {
        ...current,
        foodEntries: [entry, ...current.foodEntries],
      };
    });
  }, []);

  const updateFood = useCallback((entry: FoodEntry) => {
  setState((current) => {
    const exists = current.foodEntries.some(
      (item) => item.id === entry.id
    );

    if (!exists) {
      return current;
    }

    return {
      ...current,
      foodEntries: current.foodEntries.map((item) =>
        item.id === entry.id ? entry : item
      ),
    };
  });
}, []);

  const deleteFood = useCallback((id: string) => {
    setState((current) => ({
      ...current,
      foodEntries: current.foodEntries.filter((item) => item.id !== id),
    }));
  }, []);

  
const addWeight = useCallback((entry: WeightEntry) => {
  setState((current) => {
    if (current.weightEntries.some((item) => item.id === entry.id)) {
      return current;
    }

    return {
      ...current,
      profile: {
        ...current.profile,
        weightKg: entry.weightKg,
      },
      weightEntries: [entry, ...current.weightEntries],
    };
  });
}, []);


  const addActivity = useCallback((entry: ActivityEntry) => {
    setState((current) => {
      if (current.activityEntries.some((item) => item.id === entry.id)) {
        return current;
      }

      return {
        ...current,
        activityEntries: [entry, ...current.activityEntries],
      };
    });
  }, []);

  const addWater = useCallback((entry: WaterEntry) => {
    setState((current) => {
      if (current.waterEntries.some((item) => item.id === entry.id)) {
        return current;
      }

      return {
        ...current,
        waterEntries: [entry, ...current.waterEntries],
      };
    });
  }, []);

  
const updateProfile = useCallback((profile: UserProfile) => {
  const now = new Date();
  now.setHours(8, 0, 0, 0);

  const today = now.toDateString();
  const timestamp = now.toISOString();
  const newEntryId = `weight-profile-${crypto.randomUUID()}`;

  setState((current) => {
    const weightChanged =
      current.profile.weightKg !== profile.weightKg;

    if (!weightChanged) {
      return {
        ...current,
        profile,
      };
    }

    const todayEntry = current.weightEntries.find(
      (entry) => new Date(entry.date).toDateString() === today,
    );

    let weightEntries: WeightEntry[];

    if (todayEntry) {
      weightEntries = current.weightEntries.map((entry) =>
        entry.id === todayEntry.id
          ? { ...entry, weightKg: profile.weightKg }
          : entry,
      );
    } else {
      weightEntries = [
        {
          id: newEntryId,
          date: timestamp,
          weightKg: profile.weightKg,
        },
        ...current.weightEntries,
      ];
    }

    return {
      ...current,
      profile,
      weightEntries,
    };
  });
}, []);

  const updateGoals = useCallback((goals: FitnessGoals) => {
    setState((current) => ({
      ...current,
      goals,
    }));
  }, []);

  const resetDemo = useCallback(() => {
    setState(createInitialDemoState());
  }, []);

  const value = useMemo(
    () => ({
      ...state,
      addMessage,
      addFood,
      updateFood,
      deleteFood,
      addWeight,
      addActivity,
      addWater,
      updateProfile,
      updateGoals,
      resetDemo,
    }),
    [
      state,
      addMessage,
      addFood,
      updateFood,
      deleteFood,
      addWeight,
      addActivity,
      addWater,
      updateProfile,
      updateGoals,
      resetDemo,
    ]
  );

  return (
    <DemoContext.Provider value={value}>
      {children}
    </DemoContext.Provider>
  );
}

export function useDemo() {
  const context = useContext(DemoContext);

  if (!context) {
    throw new Error("useDemo must be used within DemoProvider");
  }

  return context;
}
