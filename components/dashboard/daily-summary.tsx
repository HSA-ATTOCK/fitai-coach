
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
import { useDemo } from "@/lib/demo/demo-store";
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

export function DailySummary() {
  const {
    foodEntries,
    waterEntries,
    activityEntries,
    goals,
  } = useDemo();

  const [today, setToday] = useState<string | null>(null);

  useEffect(() => {
    const timer = window.setTimeout(() => {
      setToday(new Date().toDateString());
    }, 0);

    return () => window.clearTimeout(timer);
  }, []);

  if (today === null) {
    return null;
  }

  const foods = foodEntries.filter(
    (entry) => new Date(entry.date).toDateString() === today,
  );

  const water = waterEntries
    .filter((entry) => new Date(entry.date).toDateString() === today)
    .reduce((total, entry) => total + entry.milliliters, 0);

  const activity = activityEntries
    .filter((entry) => new Date(entry.date).toDateString() === today)
    .reduce((total, entry) => total + entry.minutes, 0);

  const calories = foods.reduce((total, entry) => total + entry.calories, 0);
  const protein = foods.reduce((total, entry) => total + entry.protein, 0);
  const carbs = foods.reduce((total, entry) => total + entry.carbs, 0);
  const fat = foods.reduce((total, entry) => total + entry.fat, 0);

  return (
    <Card className="p-4 sm:p-5">
      <SectionTitle
        title="Today's snapshot"
        subtitle="Illustrative demo totals"
      />

      <div className="grid grid-cols-2 gap-3">
        <Metric
          icon={Flame}
          label="Calories"
          value={calories}
          target={goals.dailyCalories}
          unit="kcal"
        />

        <Metric
          icon={Beef}
          label="Protein"
          value={protein}
          target={goals.dailyProtein}
          unit="g"
        />

        <Metric
          icon={Wheat}
          label="Carbs"
          value={carbs}
          target={goals.dailyCarbs}
          unit="g"
        />

        <Metric
          icon={Salad}
          label="Fat"
          value={fat}
          target={goals.dailyFat}
          unit="g"
        />

        <Metric
          icon={Droplets}
          label="Water"
          value={water}
          target={goals.dailyWaterMl}
          unit="ml"
        />

        <Metric
          icon={Footprints}
          label="Activity"
          value={activity}
          target={45}
          unit="min"
        />
      </div>

      <div className="mt-4 flex items-center justify-between border-t border-white/5 pt-4 text-sm">
        <span className="flex items-center gap-2 text-zinc-400">
          <Utensils size={15} />
          {foods.length} meals logged today
        </span>

        <Link
          href="/food-history"
          className="flex items-center gap-1 text-lime-300 hover:text-lime-200"
        >
          History <ArrowUpRight size={14} />
        </Link>
      </div>

      <p className="mt-3 text-[11px] leading-relaxed text-zinc-600">
        Nutrition values are estimates for this demo, not verified dietary
        advice.
      </p>
    </Card>
  );
}
