
"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import {
  Activity,
  CalendarDays,
  Dumbbell,
  Flame,
  Clock3,
  ChevronDown,
  ChevronUp,
  RefreshCw,
} from "lucide-react";
import {
  Bar,
  BarChart,
  CartesianGrid,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from "recharts";
import { createClient } from "@/lib/supabase/client";

type Exercise = {
  id: string;
  exercise_name: string;
  sets: number;
  reps: number;
  weight_kg: number;
  notes: string | null;
  set_details: WorkoutSet[];
};

type Workout = {
  id: string;
  activity_type: string;
  duration_minutes: number;
  calories_burned: number;
  logged_at: string;
  notes: string | null;
  entry_source: "ai_chat" | "workout_tracker" | "manual";
  exercises: Exercise[];
};

type Range = 1 | 7 | 30 | 90;
type WorkoutSet = {
  id: string;
  set_number: number;
  reps: number;
  weight_kg: number;
  completed: boolean;
};

type ActiveExercise = {
  id: string;
  exercise_name: string;
  sets: WorkoutSet[];
};


const EXERCISE_OPTIONS = [
  { name: "Bench Press", category: "Chest" },
  { name: "Incline Bench Press", category: "Chest" },
  { name: "Decline Bench Press", category: "Chest" },
  { name: "Dumbbell Chest Press", category: "Chest" },
  { name: "Chest Fly", category: "Chest" },
  { name: "Cable Crossover", category: "Chest" },
  { name: "Push-ups", category: "Chest" },

  { name: "Pull-ups", category: "Back" },
  { name: "Lat Pulldown", category: "Back" },
  { name: "Seated Cable Row", category: "Back" },
  { name: "Bent Over Row", category: "Back" },
  { name: "T-Bar Row", category: "Back" },
  { name: "Deadlift", category: "Back" },

  { name: "Shoulder Press", category: "Shoulders" },
  { name: "Dumbbell Shoulder Press", category: "Shoulders" },
  { name: "Lateral Raises", category: "Shoulders" },
  { name: "Front Raises", category: "Shoulders" },
  { name: "Reverse Fly", category: "Shoulders" },

  { name: "Barbell Bicep Curl", category: "Arms" },
  { name: "Dumbbell Bicep Curl", category: "Arms" },
  { name: "Hammer Curl", category: "Arms" },
  { name: "Tricep Pushdown", category: "Arms" },
  { name: "Tricep Extension", category: "Arms" },
  { name: "Skull Crushers", category: "Arms" },

  { name: "Barbell Squat", category: "Legs" },
  { name: "Goblet Squat", category: "Legs" },
  { name: "Leg Press", category: "Legs" },
  { name: "Leg Extension", category: "Legs" },
  { name: "Leg Curl", category: "Legs" },
  { name: "Romanian Deadlift", category: "Legs" },
  { name: "Lunges", category: "Legs" },
  { name: "Calf Raises", category: "Legs" },

  { name: "Plank", category: "Core" },
  { name: "Crunches", category: "Core" },
  { name: "Leg Raises", category: "Core" },
  { name: "Russian Twists", category: "Core" },
  { name: "Mountain Climbers", category: "Core" },
];


const chartTooltip = {
  contentStyle: {
    background: "#171b18",
    border: "1px solid #303730",
    borderRadius: 12,
    color: "#f4f7f3",
  },
  itemStyle: { color: "#b7ff3c" },
  labelStyle: { color: "#a4ada5" },
};

function formatWorkoutName(value: string) {
  return value
    .replace(/_/g, " ")
    .replace(/\b\w/g, (letter) => letter.toUpperCase());
}

function formatDate(value: string) {
  return new Date(value).toLocaleDateString("en-US", {
    month: "short",
    day: "numeric",
    year: "numeric",
  });
}

function dayKey(value: string | Date) {
  const date = new Date(value);

  return `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, "0")}-${String(date.getDate()).padStart(2, "0")}`;
}

function MetricCard({
  label,
  value,
  unit,
  detail,
  icon: Icon,
}: {
  label: string;
  value: string;
  unit: string;
  detail: string;
  icon: typeof Activity;
}) {
  return (
    <div className="rounded-2xl border border-white/5 bg-[#111512] p-5 transition-colors hover:bg-[#151a16]">
      <div className="flex items-center justify-between gap-3">
        <p className="text-xs font-semibold uppercase tracking-wider text-zinc-400">
          {label}
        </p>
        <Icon size={19} className="shrink-0 text-lime-300" />
      </div>

      <div className="mt-5 flex items-baseline gap-2">
        <span className="text-3xl font-bold tracking-tight text-white">
          {value}
        </span>
        <span className="text-sm text-lime-300">{unit}</span>
      </div>

      <p className="mt-3 text-xs leading-5 text-zinc-500">{detail}</p>
    </div>
  );
}

export default function ExercisePage() {
  const [workouts, setWorkouts] = useState<Workout[]>([]);
  const [loading, setLoading] = useState(true);
  const [loadError, setLoadError] = useState("");
  const [range, setRange] = useState<Range>(7);
const [today] = useState(() => {
  const date = new Date();
  date.setHours(0, 0, 0, 0);
  return date;
});
  const [expandedWorkout, setExpandedWorkout] = useState<string | null>(null);
    // Active workout state
  const [isWorkoutActive, setIsWorkoutActive] = useState(false);

  const [activeWorkoutName, setActiveWorkoutName] = useState(
    "Strength Workout",
  );

  const [activeExercises, setActiveExercises] = useState<ActiveExercise[]>([]);

  const [exerciseNameInput, setExerciseNameInput] = useState("");

  const [showExerciseSuggestions, setShowExerciseSuggestions] =
  useState(false);

  const [workoutStartedAt, setWorkoutStartedAt] = useState<number | null>(
    null,
  );

  const [savingWorkout, setSavingWorkout] = useState(false);

  // Rest timer state
  const [restSeconds, setRestSeconds] = useState(90);
  const [restRemaining, setRestRemaining] = useState(90);
  const [restRunning, setRestRunning] = useState(false);

  const [workoutMessage, setWorkoutMessage] = useState("");

  const [supabase] = useState(() => createClient());
    // Rest timer countdown
useEffect(() => {
  if (!restRunning) return;

  const timer = window.setInterval(() => {
    setRestRemaining((current) => {
      if (current <= 1) {
        setRestRunning(false);
        return 0;
      }

      return current - 1;
    });
  }, 1000);

  return () => window.clearInterval(timer);
}, [restRunning]);


  // Start a new workout
  function startWorkout() {
    setActiveExercises([]);
    setActiveWorkoutName("Strength Workout");
    setWorkoutStartedAt(Date.now());
    setIsWorkoutActive(true);
    setWorkoutMessage("");
    setRestRemaining(restSeconds);
    setRestRunning(false);
  }

  
const filteredExerciseSuggestions = EXERCISE_OPTIONS.filter((exercise) =>
  exercise.name
    .toLowerCase()
    .includes(exerciseNameInput.trim().toLowerCase()),
).slice(0, 8);


  // Add an exercise with its first set
  function addExercise() {
    const name = exerciseNameInput.trim();

    if (!name) return;

    const newExercise: ActiveExercise = {
      id: crypto.randomUUID(),
      exercise_name: name,
      sets: [
        {
          id: crypto.randomUUID(),
          set_number: 1,
          reps: 10,
          weight_kg: 0,
          completed: false,
        },
      ],
    };

    setActiveExercises((current) => [...current, newExercise]);
    setExerciseNameInput("");
    setWorkoutMessage("");
  }

  // Add another set to an exercise
  function addSet(exerciseId: string) {
    setActiveExercises((current) =>
      current.map((exercise) => {
        if (exercise.id !== exerciseId) return exercise;

        const previousSet = exercise.sets[exercise.sets.length - 1];

        return {
          ...exercise,
          sets: [
            ...exercise.sets,
            {
              id: crypto.randomUUID(),
              set_number: exercise.sets.length + 1,
              reps: previousSet?.reps ?? 10,
              weight_kg: previousSet?.weight_kg ?? 0,
              completed: false,
            },
          ],
        };
      }),
    );
  }

  // Update weight or reps for an individual set
  function updateSet(
    exerciseId: string,
    setId: string,
    field: "reps" | "weight_kg",
    value: number,
  ) {
    setActiveExercises((current) =>
      current.map((exercise) =>
        exercise.id !== exerciseId
          ? exercise
          : {
              ...exercise,
              sets: exercise.sets.map((set) =>
                set.id === setId ? { ...set, [field]: value } : set,
              ),
            },
      ),
    );
  }

  // Mark a set as completed or incomplete
  function toggleSet(exerciseId: string, setId: string) {
    setActiveExercises((current) =>
      current.map((exercise) =>
        exercise.id !== exerciseId
          ? exercise
          : {
              ...exercise,
              sets: exercise.sets.map((set) =>
                set.id === setId
                  ? { ...set, completed: !set.completed }
                  : set,
              ),
            },
      ),
    );
  }

  // Remove an exercise from the active workout
  function removeExercise(exerciseId: string) {
    setActiveExercises((current) =>
      current.filter((exercise) => exercise.id !== exerciseId),
    );
  }


  const loadWorkouts = useCallback(async () => {
      // Save the completed workout to Supabase
    try {
      setLoadError("");

      const {
        data: { user },
        error: userError,
      } = await supabase.auth.getUser();

      if (userError) throw userError;

      if (!user) {
        throw new Error("Please log in to view your workouts.");
      }

      const { data: activities, error: activityError } = await supabase
        .from("activities")
        .select(
  "id, activity_type, duration_minutes, calories_burned, logged_at, notes, entry_source",
)
        .eq("user_id", user.id)
        .order("logged_at", { ascending: false });

      if (activityError) throw activityError;

      const activityRows = activities ?? [];

      if (activityRows.length === 0) {
        setWorkouts([]);
        return;
      }

      const activityIds = activityRows.map((activity) => activity.id);

      const { data: exercises, error: exerciseError } = await supabase
        .from("workout_exercises")
        .select(
          "id, activity_id, exercise_name, sets, reps, weight_kg, notes",
        )
        .eq("user_id", user.id)
        .in("activity_id", activityIds)
        .order("created_at", { ascending: true });

      if (exerciseError) throw exerciseError;

      const exerciseRows = exercises ?? [];
            // Load individual sets for all exercises
      const setMap = new Map<string, WorkoutSet[]>();

      if (exerciseRows.length > 0) {
        const exerciseIds = exerciseRows.map((exercise) => exercise.id);

        const { data: workoutSetRows, error: workoutSetsError } =
          await supabase
            .from("workout_sets")
            .select(
              "id, exercise_id, set_number, reps, weight_kg, completed",
            )
            .eq("user_id", user.id)
            .in("exercise_id", exerciseIds)
            .order("set_number", { ascending: true });

        if (workoutSetsError) throw workoutSetsError;

        for (const set of workoutSetRows ?? []) {
          const existing = setMap.get(set.exercise_id) ?? [];

          existing.push({
            id: set.id,
            set_number: Number(set.set_number),
            reps: Number(set.reps),
            weight_kg: Number(set.weight_kg),
            completed: set.completed,
          });

          setMap.set(set.exercise_id, existing);
        }
      }

      const exerciseMap = new Map<string, Exercise[]>();

      for (const exercise of exerciseRows) {
        const existing = exerciseMap.get(exercise.activity_id) ?? [];

                existing.push({
          id: exercise.id,
          exercise_name: exercise.exercise_name,
          sets: Number(exercise.sets),
          reps: Number(exercise.reps),
          weight_kg: Number(exercise.weight_kg),
          notes: exercise.notes,
          set_details: setMap.get(exercise.id) ?? [],
        });

        exerciseMap.set(exercise.activity_id, existing);
      }

      const result: Workout[] = activityRows
        .filter((activity) => (exerciseMap.get(activity.id) ?? []).length > 0)
        .map((activity) => ({
          id: activity.id,
          activity_type: activity.activity_type,
          duration_minutes: Number(activity.duration_minutes ?? 0),
          calories_burned: Number(activity.calories_burned ?? 0),
          logged_at: activity.logged_at,
          notes: activity.notes,
          entry_source: activity.entry_source,
          exercises: exerciseMap.get(activity.id) ?? [],
        }));

      setWorkouts(result);
    } catch (error) {
      console.error("Workout loading error:", error);

      setLoadError(
        error instanceof Error
          ? error.message
          : "Unable to load your workouts.",
      );
    } finally {
      setLoading(false);
    }
  }, [supabase]);
    async function finishWorkout() {
    if (!workoutStartedAt) {
      setWorkoutMessage("Please start a workout first.");
      return;
    }

    if (activeExercises.length === 0) {
      setWorkoutMessage("Please add at least one exercise.");
      return;
    }

    setSavingWorkout(true);
    setWorkoutMessage("");

    let activityId: string | null = null;

    try {
      const {
        data: { user },
        error: userError,
      } = await supabase.auth.getUser();

      if (userError) throw userError;
      if (!user) throw new Error("Please log in before saving workouts.");

      const duration = Math.max(
        1,
        Math.round((Date.now() - workoutStartedAt) / 60000),
      );

      // 1. Save the main workout session
      const { data: activity, error: activityError } = await supabase
        .from("activities")
        .insert({
  user_id: user.id,
  entry_source: "workout_tracker",
  activity_type: activeWorkoutName.toLowerCase(),
  duration_minutes: duration,
  calories_burned: 0,
  notes: "Gym workout recorded in Exercise tracker",
  logged_at: new Date().toISOString(),
})
        .select("id")
        .single();

      if (activityError) throw activityError;

      activityId = activity.id;

      // 2. Save each exercise and its individual sets
      for (const exercise of activeExercises) {
        const completedSets = exercise.sets.filter(
          (set) => set.completed,
        );

        const summarySets =
          completedSets.length > 0 ? completedSets : exercise.sets;

        const averageReps = Math.round(
          summarySets.reduce((sum, set) => sum + set.reps, 0) /
            summarySets.length,
        );

        const averageWeight =
          summarySets.reduce((sum, set) => sum + set.weight_kg, 0) /
          summarySets.length;

        const { data: savedExercise, error: exerciseError } =
          await supabase
            .from("workout_exercises")
            .insert({
              activity_id: activity.id,
              user_id: user.id,
              exercise_name: exercise.exercise_name,
              sets: exercise.sets.length,
              reps: averageReps,
              weight_kg: averageWeight,
              notes: null,
            })
            .select("id")
            .single();

        if (exerciseError) throw exerciseError;

        const setRows = exercise.sets.map((set) => ({
          activity_id: activity.id,
          exercise_id: savedExercise.id,
          user_id: user.id,
          set_number: set.set_number,
          reps: set.reps,
          weight_kg: set.weight_kg,
          completed: set.completed,
        }));

        const { error: setsError } = await supabase
          .from("workout_sets")
          .insert(setRows);

        if (setsError) throw setsError;
      }

      // 3. Reset the active workout
      setIsWorkoutActive(false);
      setActiveExercises([]);
      setWorkoutStartedAt(null);
      setRestRunning(false);
      setRestRemaining(restSeconds);

      setWorkoutMessage(
        `Workout saved successfully! Duration: ${duration} minutes.`,
      );

      await loadWorkouts();
    } catch (error) {
      console.error("Workout saving error:", error);

      // Roll back the session if saving its exercises or sets fails
      if (activityId) {
        const { error: rollbackError } = await supabase
          .from("activities")
          .delete()
          .eq("id", activityId);

        if (rollbackError) {
          console.error("Workout rollback failed:", rollbackError);
        }
      }

      setWorkoutMessage(
        error instanceof Error
          ? error.message
          : "Unable to save your workout.",
      );
    } finally {
      setSavingWorkout(false);
    }
  }

  useEffect(() => {
    let active = true;

    async function refresh() {
      if (!active) return;
      await loadWorkouts();
    }

    refresh();

    window.addEventListener("focus", refresh);
    window.addEventListener("fitai:data-updated", refresh);

    return () => {
      active = false;
      window.removeEventListener("focus", refresh);
      window.removeEventListener("fitai:data-updated", refresh);
    };
  }, [loadWorkouts]);

  const filteredWorkouts = useMemo(() => {
  if (!today) return [];

  const start = new Date(today);
  start.setDate(start.getDate() - (range - 1));

  const end = new Date(today);
  end.setHours(23, 59, 59, 999);

  return workouts.filter((workout) => {
    const date = new Date(workout.logged_at);
    return date >= start && date <= end;
  });
}, [workouts, range, today]);

  const totalMinutes = filteredWorkouts.reduce(
    (sum, workout) => sum + workout.duration_minutes,
    0,
  );

  const totalCalories = filteredWorkouts.reduce(
    (sum, workout) => sum + workout.calories_burned,
    0,
  );

  const totalExercises = filteredWorkouts.reduce(
    (sum, workout) => sum + workout.exercises.length,
    0,
  );

  
const chartData = useMemo(() => {
  if (!today) return [];

  const chartToday = new Date(today);
  chartToday.setHours(0, 0, 0, 0);

  const days = range;

  const result: {
    date: string;
    label: string;
    minutes: number;
  }[] = [];

  for (let offset = days - 1; offset >= 0; offset--) {
    const date = new Date(chartToday);
    date.setDate(date.getDate() - offset);

    const key = dayKey(date);

    const minutes = filteredWorkouts
      .filter((workout) => dayKey(workout.logged_at) === key)
      .reduce(
        (sum, workout) => sum + workout.duration_minutes,
        0,
      );

    result.push({
      date: key,
      label: date.toLocaleDateString("en-US", {
        month: "short",
        day: "numeric",
      }),
      minutes,
    });
  }

  return result;
}, [filteredWorkouts, range, today]);

  return (
    <div className="mx-auto w-full max-w-[1500px] space-y-6">
      {/* Page heading */}
      <div className="flex flex-col justify-between gap-4 sm:flex-row sm:items-end">
        <div>
          <div className="mb-2 flex items-center gap-2">
            <span className="h-2 w-2 animate-pulse rounded-full bg-lime-300" />
            <span className="text-[10px] font-bold uppercase tracking-[0.2em] text-lime-300">
              Strength &amp; training
            </span>
          </div>

          <h1 className="text-3xl font-bold tracking-tight text-white sm:text-4xl">
            Exercise &amp; Workouts
          </h1>

          <p className="mt-2 max-w-2xl text-sm leading-6 text-zinc-400">
            Track your gym sessions, exercises, sets, reps, and lifting
            progress. Your saved workout records appear here.
          </p>
        </div>

        <button
          type="button"
          onClick={loadWorkouts}
          disabled={loading}
          className="inline-flex min-h-10 items-center justify-center gap-2 rounded-xl border border-white/10 bg-[#111512] px-4 py-2 text-xs font-semibold text-zinc-300 transition hover:bg-zinc-800 disabled:opacity-50"
        >
          <RefreshCw size={15} className={loading ? "animate-spin" : ""} />
          Refresh workouts
        </button>
      </div>


      {/* Active Workout Tracker */}
      <section className="rounded-2xl border border-lime-300/20 bg-[#111512] p-4 sm:p-6">
        {!isWorkoutActive ? (
          <div className="flex flex-col justify-between gap-4 sm:flex-row sm:items-center">
            <div className="flex items-center gap-4">
              <div className="flex h-14 w-14 shrink-0 items-center justify-center rounded-2xl bg-lime-300/10 text-lime-300">
                <Dumbbell size={28} />
              </div>

              <div>
                <h2 className="text-lg font-bold text-white">
                  Ready to train?
                </h2>
                <p className="mt-1 text-xs text-zinc-400">
                  Start a workout and track every set, rep, and weight.
                </p>
              </div>
            </div>

            <button
              type="button"
              onClick={startWorkout}
              className="min-h-12 rounded-xl bg-lime-300 px-6 py-3 text-sm font-bold text-zinc-950 transition hover:bg-lime-200"
            >
              Start Workout
            </button>
          </div>
        ) : (
          <div className="space-y-5">
            <div className="flex flex-col justify-between gap-3 sm:flex-row sm:items-center">
              <div>
                <span className="text-[10px] font-bold uppercase tracking-widest text-lime-300">
                  Workout in progress
                </span>
                <h2 className="mt-1 text-xl font-bold text-white">
                  Active Workout
                </h2>
              </div>

              <button
                type="button"
                onClick={finishWorkout}
                disabled={savingWorkout}
                className="min-h-11 rounded-xl bg-lime-300 px-5 py-3 text-sm font-bold text-zinc-950 transition hover:bg-lime-200 disabled:opacity-50"
              >
                {savingWorkout ? "Saving Workout..." : "Finish & Save Workout"}
              </button>
            </div>

            <div>
              <label className="mb-2 block text-xs font-semibold text-zinc-400">
                Workout name
              </label>
              <input
                type="text"
                value={activeWorkoutName}
                onChange={(event) =>
                  setActiveWorkoutName(event.target.value)
                }
                placeholder="e.g. Chest Day"
                className="w-full rounded-xl border border-white/10 bg-[#0c0f0d] px-4 py-3 text-sm text-white outline-none focus:border-lime-300"
              />
            </div>

            {/* Add exercise */}
<div className="rounded-xl border border-white/[0.07] bg-[#0c0f0d] p-4">
  <label className="mb-2 block text-xs font-semibold text-zinc-400">
    Search or add an exercise
  </label>

  <div className="flex flex-col gap-2 sm:flex-row">
    <div className="relative min-w-0 flex-1">
      <input
        type="text"
        value={exerciseNameInput}
        onChange={(event) => {
          setExerciseNameInput(event.target.value);
          setShowExerciseSuggestions(true);
        }}
        onFocus={() => setShowExerciseSuggestions(true)}
        onKeyDown={(event) => {
          if (event.key === "Enter") {
            event.preventDefault();
            addExercise();
            setShowExerciseSuggestions(false);
          }

          if (event.key === "Escape") {
            setShowExerciseSuggestions(false);
          }
        }}
        placeholder="Search exercises, e.g. Bench Press"
        autoComplete="off"
        className="min-h-11 w-full rounded-lg border border-white/10 bg-[#151916] px-3 text-sm text-white outline-none focus:border-lime-300"
      />

      {showExerciseSuggestions && exerciseNameInput.trim() && (
        <div className="absolute left-0 right-0 top-full z-50 mt-2 max-h-64 overflow-y-auto rounded-xl border border-white/10 bg-[#171b18] p-2 shadow-2xl">
          {filteredExerciseSuggestions.length > 0 ? (
            
filteredExerciseSuggestions.map((exercise) => (
  <button
    key={exercise.name}
    type="button"
    onMouseDown={(event) => event.preventDefault()}
    onClick={() => {
      setExerciseNameInput(exercise.name);
      setShowExerciseSuggestions(false);
    }}
    className="flex w-full items-center justify-between gap-3 rounded-lg px-3 py-2.5 text-left transition hover:bg-lime-300/10"
  >
    <span className="text-sm text-zinc-200">
      {exercise.name}
    </span>

    <span className="shrink-0 rounded-full border border-lime-400/20 bg-lime-400/10 px-2 py-1 text-[10px] font-semibold text-lime-300">
      {exercise.category}
    </span>
  </button>
))

          ) : (
            <p className="px-3 py-2 text-xs text-zinc-500">
              No matching exercise found. You can add your custom exercise.
            </p>
          )}
        </div>
      )}
    </div>

    <button
      type="button"
      onClick={() => {
        addExercise();
        setShowExerciseSuggestions(false);
      }}
      disabled={!exerciseNameInput.trim()}
      className="min-h-11 rounded-lg bg-lime-300 px-5 text-sm font-bold text-zinc-950 disabled:opacity-40"
    >
      + Add Exercise
    </button>
  </div>

  <p className="mt-2 text-[11px] text-zinc-500">
    Choose a suggested exercise or type your own custom exercise name.
  </p>
</div>

            {/* Exercise list */}
            {activeExercises.length === 0 ? (
              <div className="rounded-xl border border-dashed border-white/10 p-8 text-center">
                <Dumbbell size={25} className="mx-auto text-zinc-500" />
                <p className="mt-3 text-sm font-semibold text-white">
                  No exercises added yet
                </p>
                <p className="mt-1 text-xs text-zinc-500">
                  Add your first exercise above to start tracking sets.
                </p>
              </div>
            ) : (
              <div className="space-y-4">
                {activeExercises.map((exercise, exerciseIndex) => (
                  <div
                    key={exercise.id}
                    className="rounded-xl border border-white/[0.07] bg-[#0c0f0d] p-4"
                  >
                    <div className="flex items-center justify-between gap-3">
                      <h3 className="text-sm font-bold text-lime-300">
                        {exerciseIndex + 1}. {exercise.exercise_name}
                      </h3>

                      <button
                        type="button"
                        onClick={() => removeExercise(exercise.id)}
                        className="text-xs font-semibold text-red-400 hover:text-red-300"
                      >
                        Remove
                      </button>
                    </div>

                    <div className="mt-4 grid grid-cols-[40px_1fr_1fr_75px] items-center gap-2 text-[10px] font-bold uppercase tracking-wider text-zinc-500">
                      <span>Set</span>
                      <span>Weight (kg)</span>
                      <span>Reps</span>
                      <span>Status</span>
                    </div>

                    <div className="mt-2 space-y-2">
                      {exercise.sets.map((set) => (
                        <div
                          key={set.id}
                          className="grid grid-cols-[40px_1fr_1fr_75px] items-center gap-2"
                        >
                          <span className="text-sm font-semibold text-zinc-400">
                            {set.set_number}
                          </span>

                          <input
                            type="number"
                            min="0"
                            step="0.5"
                            value={set.weight_kg}
                            onChange={(event) =>
                              updateSet(
                                exercise.id,
                                set.id,
                                "weight_kg",
                                Math.max(0, Number(event.target.value)),
                              )
                            }
                            className="h-10 w-full min-w-0 rounded-lg border border-white/10 bg-[#151916] px-2 text-sm text-white outline-none focus:border-lime-300"
                          />

                          <input
                            type="number"
                            min="0"
                            step="1"
                            value={set.reps}
                            onChange={(event) =>
                              updateSet(
                                exercise.id,
                                set.id,
                                "reps",
                                Math.max(0, Math.floor(Number(event.target.value))),
                              )
                            }
                            className="h-10 w-full min-w-0 rounded-lg border border-white/10 bg-[#151916] px-2 text-sm text-white outline-none focus:border-lime-300"
                          />

                          <button
                            type="button"
                            onClick={() => toggleSet(exercise.id, set.id)}
                            aria-label={`Mark set ${set.set_number} ${set.completed ? "incomplete" : "complete"}`}
                            className={`h-9 rounded-lg text-xs font-bold transition ${
                              set.completed
                                ? "bg-lime-300 text-zinc-950"
                                : "border border-white/10 text-zinc-400 hover:border-lime-300 hover:text-lime-300"
                            }`}
                          >
                            {set.completed ? "Done" : "Complete"}
                          </button>
                        </div>
                      ))}
                    </div>

                    <button
                      type="button"
                      onClick={() => addSet(exercise.id)}
                      className="mt-4 text-xs font-bold text-lime-300 hover:text-lime-200"
                    >
                      + Add Set
                    </button>
                  </div>
                ))}
              </div>
            )}

            {/* Rest timer */}
            <div className="flex flex-col justify-between gap-4 rounded-xl border border-white/[0.07] bg-[#0c0f0d] p-4 sm:flex-row sm:items-center">
              <div>
                <p className="text-xs font-bold uppercase tracking-wider text-zinc-400">
                  Rest Timer
                </p>

                <p className="mt-2 text-3xl font-bold tabular-nums text-lime-300">
                  {String(Math.floor(restRemaining / 60)).padStart(2, "0")}:
                  {String(restRemaining % 60).padStart(2, "0")}
                </p>

                <label className="mt-2 block text-xs text-zinc-500">
                  Rest duration
                </label>

                <select
                  value={restSeconds}
                  onChange={(event) => {
                    const seconds = Number(event.target.value);
                    setRestSeconds(seconds);
                    setRestRemaining(seconds);
                    setRestRunning(false);
                  }}
                  className="mt-1 rounded-lg border border-white/10 bg-[#151916] px-3 py-2 text-xs text-white"
                >
                  <option value={60}>1 minute</option>
                  <option value={90}>1 minute 30 seconds</option>
                  <option value={120}>2 minutes</option>
                  <option value={180}>3 minutes</option>
                </select>
              </div>

              <div className="flex gap-2">
                <button
                  type="button"
                  onClick={() => setRestRunning(!restRunning)}
                  disabled={restRemaining === 0}
                  className="rounded-lg bg-lime-300 px-4 py-2 text-xs font-bold text-zinc-950 disabled:opacity-40"
                >
                  {restRunning ? "Pause" : "Start Rest"}
                </button>

                <button
                  type="button"
                  onClick={() => {
                    setRestRunning(false);
                    setRestRemaining(restSeconds);
                  }}
                  className="rounded-lg border border-white/10 px-4 py-2 text-xs font-semibold text-zinc-300"
                >
                  Reset
                </button>
              </div>
            </div>

            {workoutMessage && (
              <p
                role="status"
                className="rounded-lg border border-lime-300/20 bg-lime-300/5 p-3 text-xs text-lime-300"
              >
                {workoutMessage}
              </p>
            )}
          </div>
        )}

        {!isWorkoutActive && workoutMessage && (
          <p role="status" className="mt-4 text-xs text-lime-300">
            {workoutMessage}
          </p>
        )}
      </section>


      {/* Range filter */}
      <div className="flex flex-wrap gap-2 rounded-xl border border-white/5 bg-[#111512] p-1 sm:w-fit">
        {(
          [
            { days: 1, label: "DAILY" },
            { days: 7, label: "7 DAYS" },
            { days: 30, label: "30 DAYS" },
            { days: 90, label: "90 DAYS" },
          ] as const
        ).map(({ days, label }) => (
          <button
            key={days}
            type="button"
            onClick={() => setRange(days)}
            aria-pressed={range === days}
            className={`rounded-lg px-4 py-2 text-xs font-bold transition-colors ${
              range === days
                ? "bg-lime-300 text-zinc-950"
                : "text-zinc-400 hover:bg-zinc-800 hover:text-white"
            }`}
          >
            {label}
          </button>
        ))}
      </div>

      {loadError && (
        <div
          role="alert"
          className="rounded-xl border border-red-400/20 bg-red-400/5 p-4 text-sm text-red-300"
        >
          {loadError}
        </div>
      )}

      {/* Summary cards */}
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 xl:grid-cols-4">
        <MetricCard
          label="Workouts"
          value={String(filteredWorkouts.length)}
          unit="sessions"
          detail="Gym sessions in selected period"
          icon={Dumbbell}
        />

        <MetricCard
          label="Active time"
          value={String(totalMinutes)}
          unit="min"
          detail="Total workout duration"
          icon={Clock3}
        />

        <MetricCard
          label="Calories burned"
          value={totalCalories.toLocaleString()}
          unit="kcal"
          detail="Recorded workout calories"
          icon={Flame}
        />

        <MetricCard
          label="Exercises"
          value={String(totalExercises)}
          unit="total"
          detail="Individual exercises completed"
          icon={Activity}
        />
      </div>

      {/* Weekly activity chart */}
      <section className="rounded-2xl border border-white/5 bg-[#111512] p-4 sm:p-6">
        <div className="mb-5 flex flex-col justify-between gap-2 sm:flex-row sm:items-center">
          <div>
            <h2 className="text-base font-bold text-white">
              Workout activity
            </h2>
            <p className="mt-1 text-xs text-zinc-500">
              Minutes spent training each day
            </p>
          </div>

          <div className="flex items-center gap-2 text-xs text-lime-300">
            <CalendarDays size={15} />
            {range === 1 ? "Today" : `Last ${range} days`}
          </div>
        </div>

        <div className="h-[260px] w-full">
          {loading ? (
            <div className="flex h-full items-center justify-center text-sm text-zinc-500">
              Loading workout chart...
            </div>
          ) : (
            <ResponsiveContainer width="100%" height="100%">
              <BarChart
                data={chartData}
                margin={{ top: 10, right: 8, left: -18, bottom: 0 }}
              >
                <CartesianGrid
                  stroke="#292f2a"
                  strokeDasharray="3 3"
                  vertical={false}
                />

                <XAxis
                  dataKey="label"
                  tick={{ fill: "#858e86", fontSize: 11 }}
                  axisLine={false}
                  tickLine={false}
                  interval={range === 1 || range === 7 ? 0 : range === 30 ? 4 : 13}
                />

                <YAxis
                  allowDecimals={false}
                  tick={{ fill: "#858e86", fontSize: 11 }}
                  axisLine={false}
                  tickLine={false}
                />

                <Tooltip
                  {...chartTooltip}
                  formatter={(value) => [`${value} min`, "Workout time"]}
                />

                <Bar
                  dataKey="minutes"
                  fill="#b7ff3c"
                  radius={[5, 5, 0, 0]}
                  maxBarSize={32}
                />
              </BarChart>
            </ResponsiveContainer>
          )}
        </div>
      </section>

      {/* Workout history */}
      <section className="rounded-2xl border border-white/5 bg-[#111512] p-4 sm:p-6">
        <div className="mb-5">
          <h2 className="text-base font-bold text-white">
            Recent workout history
          </h2>
          <p className="mt-1 text-xs text-zinc-500">
            Open a workout to see its exercises and lifting details.
          </p>
        </div>

        {loading ? (
          <div className="py-12 text-center text-sm text-zinc-500">
            Loading your workouts...
          </div>
        ) : filteredWorkouts.length === 0 ? (
          <div className="rounded-xl border border-dashed border-white/10 bg-[#0c0f0d] px-4 py-12 text-center">
            <Dumbbell size={30} className="mx-auto text-zinc-600" />

            <h3 className="mt-3 text-sm font-semibold text-white">
              No workouts in this period
            </h3>

            <p className="mx-auto mt-2 max-w-sm text-xs leading-5 text-zinc-500">
              Log a gym workout through FitAI Assistant and it will appear
              here with all its exercises.
            </p>
          </div>
        ) : (
          <div className="space-y-3">
            {filteredWorkouts.map((workout) => {
              const expanded = expandedWorkout === workout.id;

              return (
                <div
                  key={workout.id}
                  className="overflow-hidden rounded-xl border border-white/[0.07] bg-[#0c0f0d]"
                >
                  <button
                    type="button"
                    onClick={() =>
                      setExpandedWorkout(expanded ? null : workout.id)
                    }
                    aria-expanded={expanded}
                    className="flex w-full flex-col justify-between gap-3 p-4 text-left transition hover:bg-white/[0.02] sm:flex-row sm:items-center"
                  >
                    <div className="flex min-w-0 items-center gap-3">
                      <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-xl bg-lime-300/10 text-lime-300">
                        <Dumbbell size={20} />
                      </div>

                      <div className="min-w-0">
                        <div className="flex flex-wrap items-center gap-2">
  <p className="truncate text-sm font-semibold text-white">
    {formatWorkoutName(workout.activity_type)}
  </p>

  <span
    className={`rounded-full border px-2 py-0.5 text-[9px] font-semibold ${
      workout.entry_source === "ai_chat"
        ? "border-blue-400/20 bg-blue-400/10 text-blue-300"
        : workout.entry_source === "workout_tracker"
          ? "border-lime-400/20 bg-lime-400/10 text-lime-300"
          : "border-zinc-500/20 bg-zinc-500/10 text-zinc-400"
    }`}
  >
    {workout.entry_source === "ai_chat"
      ? "AI Added"
      : workout.entry_source === "workout_tracker"
        ? "Workout Tracker"
        : "Manually Added"}
  </span>
</div>

                        <p className="mt-1 text-xs text-zinc-500">
                          {formatDate(workout.logged_at)}
                        </p>
                      </div>
                    </div>

                    <div className="flex flex-wrap items-center gap-4 pl-14 text-xs text-zinc-400 sm:pl-0">
                      <span className="flex items-center gap-1.5">
                        <Clock3 size={14} />
                        {workout.duration_minutes} min
                      </span>

                      <span className="flex items-center gap-1.5">
                        <Activity size={14} />
                        {workout.exercises.length} exercises
                      </span>

                      <span className="text-lime-300">
                        {expanded ? (
                          <ChevronUp size={17} />
                        ) : (
                          <ChevronDown size={17} />
                        )}
                      </span>
                    </div>
                  </button>

                  {expanded && (
                    <div className="space-y-2 border-t border-white/[0.06] p-3 sm:p-4">
                      {workout.exercises.map((exercise, index) => (
                        <div
                          key={exercise.id}
                          className="rounded-xl border border-white/[0.06] bg-[#151916] p-3 sm:p-4"
                        >
                          <p className="text-sm font-semibold text-lime-300">
                            {index + 1}. {exercise.exercise_name}
                          </p>

                                                    {exercise.set_details.length > 0 ? (
                            <div className="mt-4 space-y-2">
                              <div className="grid grid-cols-4 gap-2 px-2 text-[10px] font-medium uppercase text-zinc-500">
                                <span>Set</span>
                                <span>Weight</span>
                                <span>Reps</span>
                                <span>Status</span>
                              </div>

                              {exercise.set_details.map((set) => (
                                <div
                                  key={set.id}
                                  className="grid grid-cols-4 items-center gap-2 rounded-lg bg-[#0c0f0d] p-3"
                                >
                                  <span className="text-xs font-semibold text-white">
                                    Set {set.set_number}
                                  </span>

                                  <span className="text-xs font-bold text-white">
                                    {set.weight_kg} kg
                                  </span>

                                  <span className="text-xs font-bold text-white">
                                    {set.reps}
                                  </span>

                                  <span
                                    className={`text-[10px] font-semibold ${
                                      set.completed
                                        ? "text-lime-300"
                                        : "text-zinc-500"
                                    }`}
                                  >
                                    {set.completed ? "Completed" : "Skipped"}
                                  </span>
                                </div>
                              ))}
                            </div>
                          ) : (
                            <div className="mt-3 grid grid-cols-3 gap-2">
                              <div className="rounded-lg bg-[#0c0f0d] p-2">
                                <p className="text-[10px] text-zinc-500">
                                  Sets
                                </p>
                                <p className="mt-1 text-sm font-bold text-white">
                                  {exercise.sets}
                                </p>
                              </div>

                              <div className="rounded-lg bg-[#0c0f0d] p-2">
                                <p className="text-[10px] text-zinc-500">
                                  Reps (average)
                                </p>
                                <p className="mt-1 text-sm font-bold text-white">
                                  {exercise.reps}
                                </p>
                              </div>

                              <div className="rounded-lg bg-[#0c0f0d] p-2">
                                <p className="text-[10px] text-zinc-500">
                                  Weight (average)
                                </p>
                                <p className="mt-1 text-sm font-bold text-white">
                                  {exercise.weight_kg} kg
                                </p>
                              </div>
                            </div>
                          )}

                          {exercise.notes && (
                            <p className="mt-3 text-xs text-zinc-500">
                              {exercise.notes}
                            </p>
                          )}
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        )}
      </section>

      <p className="text-center text-[10px] leading-5 text-zinc-600">
        Workout statistics are calculated from your saved exercise records.
        Calorie values are estimates when supplied.
      </p>
    </div>
  );
}
