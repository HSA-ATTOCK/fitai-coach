
"use client";

import Link from "next/link";
import {
  Droplets,
  Flame,
  Footprints,
  Utensils,
  Beef,
  ArrowUpRight,
  Wheat,
  Salad,
} from "lucide-react";
import { useEffect, useState } from "react";
import { createClient } from "@/lib/supabase/client";
import { Card, SectionTitle } from "@/components/ui/primitives";

function Metric({
  icon: Icon,
  label,
  value,
  target,
  unit,
}: {
  icon: typeof Flame;
  label: string;
  value: number;
  target?: number;
  unit: string;
}) {
  const pct =
    target && target > 0 ? Math.min(100, (value / target) * 100) : 0;

  return (
    <div className="rounded-xl border border-white/5 bg-[#0c0f0d] p-3">
      <div className="flex items-center justify-between">
        <span className="text-xs text-zinc-500">{label}</span>
        <Icon size={16} className="text-lime-300" />
      </div>

      <p className="mt-2 text-xl font-bold tracking-tight">
        {Math.round(value).toLocaleString()}
        <span className="ml-1 text-xs font-normal text-zinc-500">
          {unit}
        </span>
      </p>

      {target !== undefined && (
        <>
          <div className="mt-3 h-1.5 overflow-hidden rounded-full bg-zinc-800">
            <div
              className="h-full rounded-full bg-lime-300"
              style={{ width: `${pct}%` }}
            />
          </div>
          <p className="mt-1 text-[11px] text-zinc-500">
            Target {target.toLocaleString()} {unit}
          </p>
        </>
      )}
    </div>
  );
}

interface DashboardSnapshot {
  calories: number;
  protein: number;
  carbs: number;
  fat: number;
  water: number;
  activity: number;
  mealCount: number;
  goals: {
    calories: number;
    protein: number;
    carbs: number;
    fat: number;
    water: number;
  };
}

const defaultSnapshot: DashboardSnapshot = {
  calories: 0,
  protein: 0,
  carbs: 0,
  fat: 0,
  water: 0,
  activity: 0,
  mealCount: 0,
  goals: {
    calories: 2000,
    protein: 120,
    carbs: 250,
    fat: 70,
    water: 2500,
  },
};

export function DailySummary() {
  const [supabase] = useState(() => createClient());
  const [snapshot, setSnapshot] = useState(defaultSnapshot);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  useEffect(() => {
    let active = true;

    async function loadToday() {
      try {
        setError("");

        const {
          data: { user },
          error: userError,
        } = await supabase.auth.getUser();

        if (userError) throw userError;

        if (!user) {
          throw new Error("Please log in to view your fitness summary.");
        }

        // Use local midnight so today's records match the user's local date.
        const now = new Date();
        const start = new Date(now);
        start.setHours(0, 0, 0, 0);

        const end = new Date(start);
        end.setDate(end.getDate() + 1);

        const startISO = start.toISOString();
        const endISO = end.toISOString();

        // Load today's records and the user's targets.
        const [
          profileResult,
          mealsResult,
          waterResult,
          activityResult,
        ] = await Promise.all([
          supabase
            .from("profiles")
            .select(
              "daily_calories, daily_protein, daily_carbs, daily_fat, daily_water_ml",
            )
            .eq("id", user.id)
            .maybeSingle(),

          supabase
            .from("meals")
            .select("calories, protein_g, carbs_g, fat_g")
            .eq("user_id", user.id)
            .gte("logged_at", startISO)
            .lt("logged_at", endISO),

          supabase
            .from("water_logs")
            .select("amount_ml")
            .eq("user_id", user.id)
            .gte("logged_at", startISO)
            .lt("logged_at", endISO),

          supabase
            .from("activities")
            .select("duration_minutes")
            .eq("user_id", user.id)
            .gte("logged_at", startISO)
            .lt("logged_at", endISO),
        ]);

        if (profileResult.error) throw profileResult.error;
        if (mealsResult.error) throw mealsResult.error;
        if (waterResult.error) throw waterResult.error;
        if (activityResult.error) throw activityResult.error;

        const meals = mealsResult.data ?? [];
        const waterLogs = waterResult.data ?? [];
        const activities = activityResult.data ?? [];
        const profile = profileResult.data;

        const total = (
  values: Array<number | null>,
): number => {
  return values.reduce<number>(
    (sum, value) => sum + Number(value ?? 0),
    0,
  );
};

        if (!active) return;

        setSnapshot({
          calories: total(meals.map((meal) => meal.calories)),
          protein: total(meals.map((meal) => meal.protein_g)),
          carbs: total(meals.map((meal) => meal.carbs_g)),
          fat: total(meals.map((meal) => meal.fat_g)),
          water: total(waterLogs.map((entry) => entry.amount_ml)),
          activity: total(
            activities.map((entry) => entry.duration_minutes),
          ),
          mealCount: meals.length,
          goals: {
            calories: Number(profile?.daily_calories ?? 2000),
            protein: Number(profile?.daily_protein ?? 120),
            carbs: Number(profile?.daily_carbs ?? 250),
            fat: Number(profile?.daily_fat ?? 70),
            water: Number(profile?.daily_water_ml ?? 2500),
          },
        });
      } catch (err) {
        if (!active) return;

        setError(
          err instanceof Error
            ? err.message
            : "Unable to load your daily summary.",
        );
      } finally {
        if (active) setLoading(false);
      }
    }

    loadToday();

    // Refresh when the page becomes active or new data is saved.
    window.addEventListener("focus", loadToday);
    window.addEventListener("fitai:data-updated", loadToday);

    return () => {
      active = false;
      window.removeEventListener("focus", loadToday);
      window.removeEventListener("fitai:data-updated", loadToday);
    };
  }, [supabase]);

  if (loading) {
    return (
      <Card className="p-5">
        <SectionTitle
          title="Today's snapshot"
          subtitle="Loading your fitness data..."
        />
        <div className="grid grid-cols-2 gap-3">
          {Array.from({ length: 6 }).map((_, index) => (
            <div
              key={index}
              className="h-24 animate-pulse rounded-xl bg-white/[0.04]"
            />
          ))}
        </div>
      </Card>
    );
  }

  if (error) {
    return (
      <Card className="p-5">
        <SectionTitle
          title="Today's snapshot"
          subtitle="Your fitness summary"
        />
        <p className="text-sm text-red-400">{error}</p>
      </Card>
    );
  }

  return (
    <Card className="p-4 sm:p-5">
      <SectionTitle
        title="Today's snapshot"
        subtitle="Your actual daily totals from Supabase"
      />

      <div className="grid grid-cols-2 gap-3">
        <Metric
          icon={Flame}
          label="Calories"
          value={snapshot.calories}
          target={snapshot.goals.calories}
          unit="kcal"
        />

        <Metric
          icon={Beef}
          label="Protein"
          value={snapshot.protein}
          target={snapshot.goals.protein}
          unit="g"
        />

        <Metric
          icon={Wheat}
          label="Carbs"
          value={snapshot.carbs}
          target={snapshot.goals.carbs}
          unit="g"
        />

        <Metric
          icon={Salad}
          label="Fat"
          value={snapshot.fat}
          target={snapshot.goals.fat}
          unit="g"
        />

        <Metric
          icon={Droplets}
          label="Water"
          value={snapshot.water}
          target={snapshot.goals.water}
          unit="ml"
        />

        <Metric
          icon={Footprints}
          label="Activity"
          value={snapshot.activity}
          target={45}
          unit="min"
        />
      </div>

      <div className="mt-4 flex items-center justify-between border-t border-white/5 pt-4 text-sm">
        <span className="flex items-center gap-2 text-zinc-400">
          <Utensils size={15} />
          {snapshot.mealCount} meals logged today
        </span>

        <Link
          href="/food-history"
          className="flex items-center gap-1 text-lime-300 hover:text-lime-200"
        >
          History <ArrowUpRight size={14} />
        </Link>
      </div>

      <p className="mt-3 text-[11px] leading-relaxed text-zinc-600">
        Nutrition values are based on the meal information saved to your account.
      </p>
    </Card>
  );
}
