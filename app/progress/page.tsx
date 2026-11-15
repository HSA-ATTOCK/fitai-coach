
"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import {
  Activity,
  CalendarDays,
  ChevronDown,
  Dumbbell,
  Flame,
  Info,
  Scale,
  Table2,
  TrendingDown,
  TrendingUp,
  Utensils,
  Weight,
} from "lucide-react";
import {
  CartesianGrid,
  Line,
  LineChart,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
  Bar,
  BarChart,
  ReferenceLine,
} from "recharts";

// import { AppShell } from "@/components/layout/app-shell";
import { createClient } from "@/lib/supabase/client";

type Range = 1 | 7 | 30 | 90;
type ProgressWeight = {
  id: string;
  date: string;
  weightKg: number;
};

type ProgressFood = {
  id: string;
  date: string;
  calories: number;
  protein: number;
  carbs: number;
  fat: number;
};

type ProgressActivity = {
  id: string;
  date: string;
  name: string;
  minutes: number;
};

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

function dayKey(date: string | Date) {
  const value = new Date(date);
  return `${value.getFullYear()}-${String(value.getMonth() + 1).padStart(2, "0")}-${String(value.getDate()).padStart(2, "0")}`;
}

function shortDate(date: string | Date) {
  return new Date(date).toLocaleDateString("en-US", {
    month: "short",
    day: "numeric",
  });
}

function MetricCard({
  label,
  value,
  unit,
  detail,
  icon: Icon,
  progress,
}: {
  label: string;
  value: string;
  unit?: string;
  detail: string;
  icon: typeof Scale;
  progress?: number;
}) {
  const progressWidth = Math.min(100, Math.max(0, progress ?? 0));

  return (
    <section className="rounded-2xl border border-white/5 bg-[#111512] p-5 transition-colors hover:bg-[#151a16]">
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
        {unit && <span className="text-sm text-lime-300">{unit}</span>}
      </div>

      <p className="mt-3 text-xs leading-5 text-zinc-500">{detail}</p>

      <div className="mt-5 h-1 overflow-hidden rounded-full bg-zinc-800">
        <div
          className="h-full rounded-full bg-lime-300/70 transition-all"
          style={{ width: `${progressWidth}%` }}
        />
      </div>
    </section>
  );
}

export default function ProgressPage() {
  const [profile, setProfile] = useState({
  weightKg: 0,
});

const [goals, setGoals] = useState({
  dailyCalories: 2000,
  dailyProtein: 120,
  targetWeightKg: 0,
});

const [weightEntries, setWeightEntries] = useState<ProgressWeight[]>([]);
const [foodEntries, setFoodEntries] = useState<ProgressFood[]>([]);
const [activityEntries, setActivityEntries] = useState<ProgressActivity[]>([]);

const [isLoading, setIsLoading] = useState(true);
const [loadError, setLoadError] = useState("");

useEffect(() => {
  const supabase = createClient();
  let active = true;

  async function loadProgressData() {
    try {
      setLoadError("");

      const {
        data: { user },
        error: userError,
      } = await supabase.auth.getUser();

      if (userError) throw userError;

      if (!user) {
        throw new Error("You must be logged in to view your progress.");
      }

      const [
        profileResult,
        weightsResult,
        mealsResult,
        activitiesResult,
      ] = await Promise.all([
        supabase
          .from("profiles")
          .select(
            "weight_kg, goal_weight_kg, daily_calories, daily_protein"
          )
          .eq("id", user.id)
          .maybeSingle(),

        supabase
          .from("weight_logs")
          .select("id, weight_kg, logged_at")
          .eq("user_id", user.id)
          .order("logged_at", { ascending: true }),

        supabase
          .from("meals")
          .select(
            "id, calories, protein_g, carbs_g, fat_g, logged_at"
          )
          .eq("user_id", user.id)
          .order("logged_at", { ascending: true }),

        supabase
          .from("activities")
          .select("id, activity_type, duration_minutes, logged_at")
          .eq("user_id", user.id)
          .order("logged_at", { ascending: false }),
      ]);

      if (profileResult.error) throw profileResult.error;
      if (weightsResult.error) throw weightsResult.error;
      if (mealsResult.error) throw mealsResult.error;
      if (activitiesResult.error) throw activitiesResult.error;

      if (!active) return;

      const savedProfile = profileResult.data;

      setProfile({
        weightKg: Number(savedProfile?.weight_kg ?? 0),
      });

      setGoals({
        dailyCalories: Number(savedProfile?.daily_calories ?? 2000),
        dailyProtein: Number(savedProfile?.daily_protein ?? 120),
        targetWeightKg: Number(savedProfile?.goal_weight_kg ?? 0),
      });

      setWeightEntries(
        (weightsResult.data ?? []).map((entry) => ({
          id: entry.id,
          date: entry.logged_at,
          weightKg: Number(entry.weight_kg),
        }))
      );

      setFoodEntries(
        (mealsResult.data ?? []).map((entry) => ({
          id: entry.id,
          date: entry.logged_at,
          calories: Number(entry.calories ?? 0),
          protein: Number(entry.protein_g ?? 0),
          carbs: Number(entry.carbs_g ?? 0),
          fat: Number(entry.fat_g ?? 0),
        }))
      );

      setActivityEntries(
        (activitiesResult.data ?? []).map((entry) => ({
          id: entry.id,
          date: entry.logged_at,
          name: entry.activity_type
            .replace(/_/g, " ")
            .replace(/\b\w/g, (letter: string) => letter.toUpperCase()),
          minutes: Number(entry.duration_minutes ?? 0),
        }))
      );
    } catch (error) {
      console.error("Progress data loading error:", error);

      if (active) {
        setLoadError(
          error instanceof Error
            ? error.message
            : "Unable to load your progress data."
        );
      }
    } finally {
      if (active) setIsLoading(false);
    }
  }

  loadProgressData();

  const handleRefresh = () => {
    loadProgressData();
  };

  window.addEventListener("focus", handleRefresh);
  window.addEventListener("fitai:data-updated", handleRefresh);

  return () => {
    active = false;
    window.removeEventListener("focus", handleRefresh);
    window.removeEventListener("fitai:data-updated", handleRefresh);
  };
}, []);

  
  const [range, setRange] = useState<Range>(30);
  const [showTable, setShowTable] = useState(false);

  // Read the current date after the component mounts in the browser.
  
  const [today, setToday] = useState<Date | null>(null);

  useEffect(() => {
    const timer = window.setTimeout(() => {
      const date = new Date();
      date.setHours(0, 0, 0, 0);
      setToday(date);
    }, 0);

    return () => window.clearTimeout(timer);
  }, []);


  const startDate = useMemo(() => {
    if (!today) return null;

    const date = new Date(today);
    date.setDate(date.getDate() - (range - 1));
    return date;
  }, [today, range]);

  const endDate = useMemo(() => {
    if (!today) return null;

    const date = new Date(today);
    date.setHours(23, 59, 59, 999);
    return date;
  }, [today]);

  
  const inRange = useCallback(
    (date: string) => {
      if (!startDate || !endDate) return false;

      const timestamp = new Date(date).getTime();

      return (
        Number.isFinite(timestamp) &&
        timestamp >= startDate.getTime() &&
        timestamp <= endDate.getTime()
      );
    },
    [startDate, endDate],
  );

  const filteredWeights = useMemo(
  () =>
    weightEntries
      .filter((entry) => inRange(entry.date))
      .sort(
        (a, b) =>
          new Date(a.date).getTime() - new Date(b.date).getTime(),
      ),
  [weightEntries, inRange],
);
// console.table(
//   weightEntries.map((entry) => ({
//     id: entry.id,
//     weightKg: entry.weightKg,
//     dateStored: entry.date,
//     dateParsed: new Date(entry.date).toLocaleString(),
//     includedIn7Days: inRange(entry.date),
//   })),
// );

const filteredFood = useMemo(
  () => foodEntries.filter((entry) => inRange(entry.date)),
  [foodEntries, inRange],
);

const filteredActivities = useMemo(
  () => activityEntries.filter((entry) => inRange(entry.date)),
  [activityEntries, inRange],
);

  const dailyFood = useMemo(() => {
    const grouped: Record<
      string,
      { calories: number; protein: number; carbs: number; fat: number }
    > = {};

    for (const entry of filteredFood) {
      const key = dayKey(entry.date);
      if (!grouped[key]) {
        grouped[key] = { calories: 0, protein: 0, carbs: 0, fat: 0 };
      }
      grouped[key].calories += entry.calories;
      grouped[key].protein += entry.protein;
      grouped[key].carbs += entry.carbs;
      grouped[key].fat += entry.fat;
    }

    return grouped;
  }, [filteredFood]);

  
  const caloriesChart = useMemo(() => {
    if (!today) return [];

    const result: { date: string; calories: number; label: string }[] = [];

    for (let offset = range - 1; offset >= 0; offset--) {
      const date = new Date(today);
      date.setDate(date.getDate() - offset);

      const key = dayKey(date);

      result.push({
        date: key,
        label: shortDate(date),
        calories: dailyFood[key]?.calories ?? 0,
      });
    }

    return result;
  }, [today, range, dailyFood]);

  
const weightChart = useMemo(() => {
  if (!startDate || !endDate) return [];

  const sortedWeights = weightEntries
    .filter((entry) => {
      const timestamp = new Date(entry.date).getTime();
      return Number.isFinite(timestamp) && timestamp <= endDate.getTime();
    })
    .sort(
      (a, b) =>
        new Date(a.date).getTime() - new Date(b.date).getTime(),
    );

  // Keep the latest weight entry for each calendar day.
  const latestByDay = new Map<
    string,
    { date: string; label: string; weight: number }
  >();

  for (const entry of sortedWeights) {
    const key = dayKey(entry.date);
    const existing = latestByDay.get(key);

    if (
      !existing ||
      new Date(entry.date).getTime() >=
        new Date(existing.date).getTime()
    ) {
      latestByDay.set(key, {
        date: entry.date,
        label: shortDate(entry.date),
        weight: Number(entry.weightKg),
      });
    }
  }

  const allWeights = Array.from(latestByDay.values()).sort(
    (a, b) =>
      new Date(a.date).getTime() - new Date(b.date).getTime(),
  );

  // Include one previous record when the selected period has fewer
  // than two records, so the chart can show a useful comparison.
  const periodWeights = allWeights.filter((entry) =>
    inRange(entry.date),
  );

  if (periodWeights.length >= 2) {
    return periodWeights;
  }

  const previousWeights = allWeights.filter(
    (entry) => new Date(entry.date).getTime() < startDate.getTime(),
  );

  const previousWeight = previousWeights.at(-1);

  return previousWeight
    ? [previousWeight, ...periodWeights]
    : periodWeights;
}, [weightEntries, startDate, endDate, inRange]);


  const loggedDays = Object.keys(dailyFood).length;

  const totalCalories = filteredFood.reduce(
    (sum, entry) => sum + entry.calories,
    0,
  );

  const totalProtein = filteredFood.reduce(
    (sum, entry) => sum + entry.protein,
    0,
  );

  const averageCalories = loggedDays
    ? Math.round(totalCalories / loggedDays)
    : 0;

  const averageProtein = loggedDays
    ? Math.round(totalProtein / loggedDays)
    : 0;

  const latestWeight =
  filteredWeights.length > 0
    ? filteredWeights[filteredWeights.length - 1].weightKg
    : profile.weightKg;

const firstWeight = filteredWeights[0]?.weightKg;

const lastRecordedWeight =
  filteredWeights[filteredWeights.length - 1]?.weightKg;

const weightChange =
  filteredWeights.length > 1 &&
  firstWeight !== undefined &&
  lastRecordedWeight !== undefined
    ? lastRecordedWeight - firstWeight
    : null;

  const totalActivityMinutes = filteredActivities.reduce(
    (sum, entry) => sum + entry.minutes,
    0,
  );

  const macroTotals = filteredFood.reduce(
    (totals, entry) => ({
      protein: totals.protein + entry.protein,
      carbs: totals.carbs + entry.carbs,
      fat: totals.fat + entry.fat,
    }),
    { protein: 0, carbs: 0, fat: 0 },
  );

  const macroTotal =
    macroTotals.protein + macroTotals.carbs + macroTotals.fat;

  const macroItems = [
    {
      label: "Protein",
      grams: macroTotals.protein,
      color: "bg-lime-300",
    },
    {
      label: "Carbohydrates",
      grams: macroTotals.carbs,
      color: "bg-sky-400",
    },
    {
      label: "Fat",
      grams: macroTotals.fat,
      color: "bg-orange-400",
    },
  ];

  const tableRows = caloriesChart
    .filter((day) => day.calories > 0)
    .map((day) => {
      const dayEntries = filteredFood.filter(
        (entry) => dayKey(entry.date) === day.date,
      );
      const protein = dayEntries.reduce(
        (sum, entry) => sum + entry.protein,
        0,
      );
      const weight = filteredWeights
  .filter((entry) => dayKey(entry.date) === day.date)
  .sort(
    (a, b) =>
      new Date(a.date).getTime() - new Date(b.date).getTime(),
  )
  .at(-1);

      return {
        date: day.date,
        label: day.label,
        weight: weight?.weightKg,
        calories: day.calories,
        protein,
        meals: dayEntries.length,
      };
    });

  return (
    <div className="mx-auto w-full max-w-[1500px] space-y-6">
        <div className="flex flex-col justify-between gap-4 sm:flex-row sm:items-end">
          <div>
            <div className="mb-2 flex items-center gap-2">
              <span className="h-2 w-2 animate-pulse rounded-full bg-lime-300" />
              <span className="text-[10px] font-bold uppercase tracking-[0.2em] text-lime-300">
                Your fitness overview
              </span>
            </div>
            <h1 className="text-3xl font-bold tracking-tight text-white sm:text-4xl">
              Progress &amp; Analytics
            </h1>
            <p className="mt-2 max-w-2xl text-sm leading-6 text-zinc-400">
              Track your recorded weight, nutrition, and activity over time.
              All figures are based on your recorded fitness data.
            </p>
          </div>

          <div className="flex flex-wrap gap-2 rounded-xl border border-white/5 bg-[#111512] p-1">
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
        </div>

        {loadError && (
  <div className="rounded-xl border border-red-400/20 bg-red-400/5 p-4 text-sm text-red-300">
    {loadError}
  </div>
)}

        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 xl:grid-cols-4">
          <MetricCard
            label="Current weight"
            value={latestWeight > 0 ? latestWeight.toFixed(1) : "—"}
            unit="kg"
            detail={
              weightChange === null
                ? `${filteredWeights.length} weight records in this period`
                : `${weightChange > 0 ? "+" : ""}${weightChange.toFixed(1)} kg across recorded entries`
            }
            icon={Scale}
          />
          <MetricCard
            label="Average calories"
            value={averageCalories.toLocaleString()}
            unit="kcal/day"
            detail={
              loggedDays
                ? `${loggedDays} days with food records · goal ${goals.dailyCalories.toLocaleString()} kcal`
                : "No food records in this period"
            }
            icon={Flame}
          />
          <MetricCard
            label="Average protein"
            value={averageProtein.toString()}
            unit="g/day"
            detail={
              loggedDays
                ? `Goal: ${goals.dailyProtein} g · ${
  averageProtein >= goals.dailyProtein
    ? "goal reached on average"
    : "below daily goal"
}`
                : "No food records in this period"
            }
            icon={Utensils}
          />
          <MetricCard
            label="Recorded activity"
            value={filteredActivities.length.toString()}
            unit="sessions"
            detail={`${totalActivityMinutes} total minutes recorded in this period`}
            icon={Dumbbell}
          />
        </div>

        <div className="grid grid-cols-1 gap-4 xl:grid-cols-12">
          <section className="rounded-2xl border border-white/5 bg-[#111512] p-4 sm:p-6 xl:col-span-8">
            <div className="mb-5 flex flex-wrap items-start justify-between gap-3">
              <div>
                <p className="text-[10px] font-bold uppercase tracking-[0.18em] text-zinc-500">
                  Telemetry 01
                </p>
                <h2 className="mt-1 text-lg font-bold text-white">
                  Weight trajectory
                </h2>
                <p className="mt-1 text-xs text-zinc-500">
                  {filteredWeights.length} recorded weight entries in this period
{weightChart.length > filteredWeights.length
  ? " · Previous entry included for context"
  : ""}
                </p>
              </div>
              <div className="flex items-center gap-2 text-xs text-zinc-400">
                <span className="h-2 w-2 rounded-full bg-lime-300" />
                Actual weight
              </div>
            </div>

            {weightChart.length >= 2 ? (
              <div className="h-[280px] w-full">
                <ResponsiveContainer width="100%" height="100%">
                  <LineChart
                    data={weightChart}
                    margin={{ top: 8, right: 12, left: 0, bottom: 4 }}
                  >
                    <CartesianGrid
                      stroke="#293029"
                      strokeDasharray="3 5"
                      vertical={false}
                    />
                    <XAxis
                      dataKey="label"
                      tick={{ fill: "#8e988e", fontSize: 11 }}
                      axisLine={false}
                      tickLine={false}
                    />
                    <YAxis
                      domain={["dataMin - 1", "dataMax + 1"]}
                      tick={{ fill: "#8e988e", fontSize: 11 }}
                      axisLine={false}
                      tickLine={false}
                      width={42}
                    />
                    <Tooltip
  {...chartTooltip}
  formatter={(value) => [
    `${Number(value).toFixed(1)} kg`,
    "Weight",
  ]}
/>
                    {goals.targetWeightKg > 0 && (
  <ReferenceLine
    y={goals.targetWeightKg}
    stroke="#64748b"
    strokeDasharray="5 5"
    label={{
      value: `Goal ${goals.targetWeightKg} kg`,
      fill: "#94a3b8",
      fontSize: 10,
      position: "insideTopRight",
    }}
  />
)}
                    <Line
                      type="monotone"
                      dataKey="weight"
                      stroke="#b7ff3c"
                      strokeWidth={3}
                      dot={{
                        r: 4,
                        fill: "#111512",
                        stroke: "#b7ff3c",
                        strokeWidth: 2,
                      }}
                      activeDot={{ r: 6, fill: "#b7ff3c" }}
                    />
                  </LineChart>
                </ResponsiveContainer>
              </div>
            ) : (
              <div className="flex h-[280px] flex-col items-center justify-center text-center">
                <Weight size={28} className="mb-3 text-zinc-600" />
                <p className="font-semibold text-zinc-300">
  Not enough weight records yet
</p>
<p className="mt-1 max-w-sm text-sm text-zinc-500">
  Add at least two weight records to see your weight trajectory.
  Your previous record will be included for comparison when available.
</p>
<a
  href="/dashboard"
  className="mt-4 rounded-lg bg-lime-300 px-4 py-2 text-sm font-semibold text-zinc-950 transition-colors hover:bg-lime-200"
>
  Go to Dashboard
</a>
              </div>
            )}

            <div className="mt-4 grid grid-cols-2 gap-3 border-t border-white/5 pt-4 sm:grid-cols-3">
              <div>
                <p className="text-[10px] uppercase tracking-wider text-zinc-500">
                  Latest recorded
                </p>
                <p className="mt-1 text-lg font-bold text-white">
                  {latestWeight > 0 ? `${latestWeight.toFixed(1)} kg` : "Not recorded"}
                </p>
              </div>
              <div>
                <p className="text-[10px] uppercase tracking-wider text-zinc-500">
                  Target weight
                </p>
                <p className="mt-1 text-lg font-bold text-lime-300">
                  {goals.targetWeightKg > 0
  ? `${goals.targetWeightKg.toFixed(1)} kg`
  : "Not set"}
                </p>
              </div>
              <div className="col-span-2 sm:col-span-1">
                <p className="text-[10px] uppercase tracking-wider text-zinc-500">
                  Weight change
                </p>
                <p className="mt-1 flex items-center gap-1 text-lg font-bold text-white">
                  {weightChange !== null && weightChange !== 0 ? (
                    weightChange < 0 ? (
                      <TrendingDown size={17} className="text-lime-300" />
                    ) : (
                      <TrendingUp size={17} className="text-orange-300" />
                    )
                  ) : null}
                  {weightChange === null
                    ? "Not enough data"
                    : `${weightChange > 0 ? "+" : ""}${weightChange.toFixed(1)} kg`}
                </p>
              </div>
            </div>
          </section>

          <section className="rounded-2xl border border-white/5 bg-[#111512] p-4 sm:p-6 xl:col-span-4">
            <div className="mb-5">
              <p className="text-[10px] font-bold uppercase tracking-[0.18em] text-zinc-500">
                Telemetry 02
              </p>
              <h2 className="mt-1 text-lg font-bold text-white">
                Macro distribution
              </h2>
              <p className="mt-1 text-xs text-zinc-500">
                Total nutrients from logged meals
              </p>
            </div>

            {macroTotal > 0 ? (
              <>
                <div className="mb-6 space-y-2">
                  {macroItems.map((item) => {
                    const percentage = Math.round(
                      (item.grams / macroTotal) * 100,
                    );
                    return (
                      <div key={item.label}>
                        <div className="mb-1.5 flex justify-between gap-2 text-xs">
                          <span className="text-zinc-300">{item.label}</span>
                          <span className="text-zinc-400">
                            {item.grams} g · {percentage}%
                          </span>
                        </div>
                        <div className="h-2 overflow-hidden rounded-full bg-zinc-800">
                          <div
                            className={`h-full rounded-full ${item.color}`}
                            style={{ width: `${percentage}%` }}
                          />
                        </div>
                      </div>
                    );
                  })}
                </div>
                <div className="rounded-xl bg-[#0b0e0c] p-4">
                  <p className="text-xs text-zinc-500">Average calories</p>
                  <p className="mt-1 text-2xl font-bold text-white">
                    {averageCalories.toLocaleString()}
                    <span className="ml-2 text-xs font-normal text-zinc-500">
                      kcal / logged day
                    </span>
                  </p>
                </div>
              </>
            ) : (
              <div className="flex min-h-[200px] flex-col items-center justify-center text-center">
                <Utensils size={28} className="mb-3 text-zinc-600" />
                <p className="font-semibold text-zinc-300">No nutrition data</p>
                <p className="mt-1 text-sm text-zinc-500">
                  Food entries will appear here when recorded.
                </p>
              </div>
            )}

            <p className="mt-4 text-xs leading-5 text-zinc-500">
              Macro percentages are based on recorded grams, not calorie
              percentages.
            </p>
          </section>
        </div>

        <div className="grid grid-cols-1 gap-4 xl:grid-cols-12">
          <section className="rounded-2xl border border-white/5 bg-[#111512] p-4 sm:p-6 xl:col-span-7">
            <div className="mb-5">
              <p className="text-[10px] font-bold uppercase tracking-[0.18em] text-zinc-500">
                Telemetry 03
              </p>
              <h2 className="mt-1 text-lg font-bold text-white">
                Daily calorie intake
              </h2>
              <p className="mt-1 text-xs text-zinc-500">
                Recorded food totals compared with your daily goal
              </p>
            </div>

            {loggedDays > 0 ? (
              <div className="h-[280px] w-full">
                <ResponsiveContainer width="100%" height="100%">
                  <BarChart
                    data={caloriesChart}
                    margin={{ top: 8, right: 8, left: 0, bottom: 4 }}
                  >
                    <CartesianGrid
                      stroke="#293029"
                      strokeDasharray="3 5"
                      vertical={false}
                    />
                    <XAxis
                      dataKey="label"
                      interval={range === 7 ? 0 : range === 30 ? 4 : 13}
                      tick={{ fill: "#8e988e", fontSize: 10 }}
                      axisLine={false}
                      tickLine={false}
                    />
                    <YAxis
                      tick={{ fill: "#8e988e", fontSize: 10 }}
                      axisLine={false}
                      tickLine={false}
                      width={45}
                    />
                    <Tooltip
                      {...chartTooltip}
                      formatter={(value) => [
                        `${Number(value).toLocaleString()} kcal`,
                        "Calories",
                      ]}
                    />
                    <ReferenceLine
                      y={goals.dailyCalories}
                      stroke="#f97316"
                      strokeDasharray="5 5"
                    />
                    <Bar
                      dataKey="calories"
                      fill="#b7ff3c"
                      radius={[4, 4, 0, 0]}
                      maxBarSize={22}
                    />
                  </BarChart>
                </ResponsiveContainer>
              </div>
            ) : (
              <div className="flex h-[280px] items-center justify-center text-sm text-zinc-500">
                No food records in this period.
              </div>
            )}

            <div className="mt-3 flex flex-wrap items-center gap-x-5 gap-y-2 text-xs text-zinc-500">
              <span className="flex items-center gap-2">
                <span className="h-2 w-2 rounded-sm bg-lime-300" />
                Recorded calories
              </span>
              <span className="flex items-center gap-2">
                <span className="h-0.5 w-4 bg-orange-400" />
                Daily goal: {goals.dailyCalories.toLocaleString()} kcal
              </span>
            </div>
          </section>

          <section className="rounded-2xl border border-white/5 bg-[#111512] p-4 sm:p-6 xl:col-span-5">
            <div className="mb-5">
              <p className="text-[10px] font-bold uppercase tracking-[0.18em] text-zinc-500">
                Telemetry 04
              </p>
              <h2 className="mt-1 text-lg font-bold text-white">
                Training activity
              </h2>
              <p className="mt-1 text-xs text-zinc-500">
                Recorded exercise sessions in the selected period
              </p>
            </div>

            {filteredActivities.length > 0 ? (
              <>
                <div className="mb-5 rounded-xl bg-[#0b0e0c] p-4">
                  <div className="flex items-center gap-3">
                    <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-lime-300/10 text-lime-300">
                      <Activity size={20} />
                    </div>
                    <div>
                      <p className="text-2xl font-bold text-white">
                        {totalActivityMinutes} min
                      </p>
                      <p className="text-xs text-zinc-500">
                        Total recorded training time
                      </p>
                    </div>
                  </div>
                </div>

                <div className="space-y-4">
                  {filteredActivities
                    .slice()
                    .sort(
                      (a, b) =>
                        new Date(b.date).getTime() -
                        new Date(a.date).getTime(),
                    )
                    .slice(0, 6)
                    .map((entry) => (
                      <div
                        key={entry.id}
                        className="flex items-center justify-between gap-3 border-b border-white/5 pb-3 last:border-0"
                      >
                        <div className="flex min-w-0 items-center gap-3">
                          <Dumbbell
                            size={17}
                            className="shrink-0 text-lime-300"
                          />
                          <div className="min-w-0">
                            <p className="truncate text-sm font-medium text-white">
                              {entry.name}
                            </p>
                            <p className="mt-1 text-xs text-zinc-500">
                              {shortDate(entry.date)}
                            </p>
                          </div>
                        </div>
                        <span className="shrink-0 text-sm font-semibold text-lime-300">
                          {entry.minutes} min
                        </span>
                      </div>
                    ))}
                </div>
              </>
            ) : (
              <div className="flex min-h-[200px] flex-col items-center justify-center text-center">
                <CalendarDays size={28} className="mb-3 text-zinc-600" />
                <p className="font-semibold text-zinc-300">
                  No activity recorded
                </p>
                <p className="mt-1 text-sm text-zinc-500">
                  Logged workouts will appear here.
                </p>
              </div>
            )}
          </section>
        </div>

        <section className="overflow-hidden rounded-2xl border border-white/5 bg-[#111512]">
          <div className="flex flex-col justify-between gap-3 p-4 sm:flex-row sm:items-center sm:p-5">
            <div className="flex items-center gap-3">
              <Table2 size={20} className="text-lime-300" />
              <div>
                <h2 className="font-bold text-white">Recorded data table</h2>
                <p className="mt-1 text-xs text-zinc-500">
                  An accessible tabular view of logged nutrition and weight.
                </p>
              </div>
            </div>
            <button
              type="button"
              onClick={() => setShowTable((current) => !current)}
              aria-expanded={showTable}
              className="inline-flex items-center justify-center gap-2 rounded-lg bg-zinc-800 px-4 py-2.5 text-xs font-semibold text-white transition-colors hover:bg-zinc-700"
            >
              {showTable ? "Hide data table" : "Show data table"}
              <ChevronDown
                size={15}
                className={`transition-transform ${showTable ? "rotate-180" : ""}`}
              />
            </button>
          </div>

          {showTable && (
            <div className="overflow-x-auto border-t border-white/5">
              {tableRows.length > 0 ? (
                <table className="w-full min-w-[650px] text-left text-sm">
                  <thead className="bg-[#0b0e0c] text-[10px] uppercase tracking-wider text-zinc-500">
                    <tr>
                      <th className="px-4 py-3 font-semibold">Date</th>
                      <th className="px-4 py-3 font-semibold">Weight</th>
                      <th className="px-4 py-3 font-semibold">Calories</th>
                      <th className="px-4 py-3 font-semibold">Protein</th>
                      <th className="px-4 py-3 font-semibold">Food records</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-white/5">
                    {tableRows.map((row) => (
                      <tr key={row.date} className="hover:bg-white/[0.02]">
                        <td className="px-4 py-3 text-zinc-300">
                          {row.label}
                        </td>
                        <td className="px-4 py-3 text-zinc-300">
                          {row.weight === undefined
                            ? "—"
                            : `${row.weight.toFixed(1)} kg`}
                        </td>
                        <td className="px-4 py-3 font-medium text-white">
                          {row.calories.toLocaleString()}
                        </td>
                        <td className="px-4 py-3 text-zinc-300">
                          {row.protein} g
                        </td>
                        <td className="px-4 py-3 text-zinc-300">
                          {row.meals}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              ) : (
                <p className="p-6 text-sm text-zinc-500">
                  No food records are available for this period.
                </p>
              )}
            </div>
          )}
        </section>

        <p className="flex items-start gap-2 pb-2 text-xs leading-5 text-zinc-500">
          <Info size={15} className="mt-0.5 shrink-0" />
          These charts summarize your recorded fitness data and are not medical advice.
Missing records are not estimates of actual intake or activity.
        </p>
      </div>
  );
}
