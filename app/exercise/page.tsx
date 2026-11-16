
"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import {
  Activity,
  CalendarDays,
  Dumbbell,
  Flame,
  Clock3,
  TrendingUp,
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
};

type Workout = {
  id: string;
  activity_type: string;
  duration_minutes: number;
  calories_burned: number;
  logged_at: string;
  notes: string | null;
  exercises: Exercise[];
};

type Range = 1 | 7 | 30 | 90;

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
  const [today, setToday] = useState<Date | null>(null);

useEffect(() => {
  const date = new Date();
  date.setHours(0, 0, 0, 0);
  setToday(date);
}, []);
  const [expandedWorkout, setExpandedWorkout] = useState<string | null>(null);

  const [supabase] = useState(() => createClient());

  const loadWorkouts = useCallback(async () => {
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
          "id, activity_type, duration_minutes, calories_burned, logged_at, notes",
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
                        <p className="truncate text-sm font-semibold text-white">
                          {formatWorkoutName(workout.activity_type)}
                        </p>

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
                                Reps
                              </p>
                              <p className="mt-1 text-sm font-bold text-white">
                                {exercise.reps}
                              </p>
                            </div>

                            <div className="rounded-lg bg-[#0c0f0d] p-2">
                              <p className="text-[10px] text-zinc-500">
                                Weight
                              </p>
                              <p className="mt-1 text-sm font-bold text-white">
                                {exercise.weight_kg} kg
                              </p>
                            </div>
                          </div>

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
