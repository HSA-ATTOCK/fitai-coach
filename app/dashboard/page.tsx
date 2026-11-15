
"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import {
  ArrowRight,
  ChartNoAxesCombined,
  ClipboardList,
  MessageCircle,
  Target,
  Utensils,
  Droplets,
  Flame,
} from "lucide-react";

import { createClient } from "@/lib/supabase/client";
import { ChatPanel } from "@/components/chat/chat-panel";
import { DailySummary } from "@/components/dashboard/daily-summary";
import { DemoBanner, Card } from "@/components/ui/primitives";

type DashboardProfile = {
  full_name: string | null;
  daily_calories: number | null;
  daily_protein: number | null;
  daily_carbs: number | null;
  daily_fat: number | null;
  daily_water_ml: number | null;
};

export default function DashboardPage() {
  const [profileName, setProfileName] = useState("there");
  const [loading, setLoading] = useState(true);

  const [goals, setGoals] = useState({
    dailyCalories: null as number | null,
    dailyProtein: null as number | null,
    dailyCarbs: null as number | null,
    dailyFat: null as number | null,
    dailyWaterMl: null as number | null,
  });

  useEffect(() => {
    const supabase = createClient();
    let active = true;

    async function loadDashboardProfile() {
      try {
        const {
          data: { user },
          error: userError,
        } = await supabase.auth.getUser();

        if (userError) throw userError;

        if (!user) {
          if (active) setLoading(false);
          return;
        }

        const { data, error } = await supabase
          .from("profiles")
          .select(
            "full_name, daily_calories, daily_protein, daily_carbs, daily_fat, daily_water_ml"
          )
          .eq("id", user.id)
          .maybeSingle();

        if (error) throw error;

        if (!active) return;

        const profile = data as DashboardProfile | null;

        const metadataName =
          user.user_metadata?.full_name;

        setProfileName(
          profile?.full_name?.trim() ||
            (typeof metadataName === "string"
              ? metadataName.trim()
              : "") ||
            user.email?.split("@")[0] ||
            "there"
        );

        if (profile) {
          setGoals({
            dailyCalories: profile.daily_calories,
            dailyProtein: profile.daily_protein,
            dailyCarbs: profile.daily_carbs,
            dailyFat: profile.daily_fat,
            dailyWaterMl: profile.daily_water_ml,
          });
        }
      } catch (error) {
        console.error("Dashboard profile loading error:", error);
      } finally {
        if (active) setLoading(false);
      }
    }

    loadDashboardProfile();

    return () => {
      active = false;
    };
  }, []);

  const formatGoal = (value: number | null, unit: string) => {
    if (value === null || value === undefined) {
      return "Not set";
    }

    return `${value.toLocaleString()} ${unit}`;
  };

  const targets = [
    {
      label: "Daily calories",
      value: formatGoal(goals.dailyCalories, "kcal"),
      icon: Flame,
    },
    {
      label: "Protein",
      value: formatGoal(goals.dailyProtein, "g"),
      icon: Utensils,
    },
    {
      label: "Carbohydrates",
      value: formatGoal(goals.dailyCarbs, "g"),
      icon: Target,
    },
    {
      label: "Fat",
      value: formatGoal(goals.dailyFat, "g"),
      icon: Target,
    },
    {
      label: "Water",
      value:
        goals.dailyWaterMl === null
          ? "Not set"
          : `${Number(
              (goals.dailyWaterMl / 1000).toFixed(2)
            )} L`,
      icon: Droplets,
    },
  ];

  return (
    <div className="mx-auto w-full max-w-[1600px] space-y-6 pb-6">
      <DemoBanner />

      <section className="relative overflow-hidden rounded-3xl border border-lime-300/15 bg-gradient-to-br from-[#172018] via-[#111512] to-[#0c0f0d] p-5 sm:p-7 lg:p-8">
        <div className="pointer-events-none absolute -right-16 -top-20 h-64 w-64 rounded-full bg-lime-300/[0.07] blur-3xl" />

        <div className="relative flex flex-col justify-between gap-6 sm:flex-row sm:items-end">
          <div className="min-w-0">
            <div className="inline-flex items-center gap-2 rounded-full border border-lime-300/20 bg-lime-300/[0.07] px-3 py-1.5 text-[10px] font-semibold uppercase tracking-[0.18em] text-lime-300 sm:text-xs">
              <span className="h-1.5 w-1.5 rounded-full bg-lime-300" />
              Your fitness command center
            </div>

            <h1 className="mt-5 text-3xl font-bold tracking-tight text-white sm:text-4xl lg:text-5xl">
              Welcome back,
              <span className="block break-words text-lime-300">
                {loading ? "..." : `${profileName}!`}
              </span>
            </h1>

            <p className="mt-3 max-w-xl text-sm leading-6 text-zinc-400 sm:text-base">
              Your fitness journey, all in one place. Log your meals,
              track your activity, and build consistent habits.
            </p>
          </div>

          <Link
            href="/profile"
            className="inline-flex min-h-11 shrink-0 items-center justify-center gap-2 self-start rounded-xl bg-lime-300 px-4 py-3 text-sm font-semibold text-zinc-950 transition hover:bg-lime-200 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-lime-300 focus-visible:ring-offset-2 focus-visible:ring-offset-[#111512] sm:self-auto"
          >
            <Target size={17} />
            Fitness goals
            <ArrowRight size={16} />
          </Link>
        </div>
      </section>

      <section className="grid grid-cols-1 items-start gap-6 xl:grid-cols-[minmax(0,1.55fr)_minmax(300px,0.85fr)]">
        <div className="min-w-0 space-y-4">
          <div className="flex items-center gap-3">
            <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-2xl border border-lime-300/15 bg-lime-300/[0.07] text-lime-300">
              <MessageCircle size={21} />
            </div>

            <div className="min-w-0">
              <h2 className="text-lg font-semibold text-white sm:text-xl">
                Your fitness assistant
              </h2>
              <p className="mt-1 text-sm leading-5 text-zinc-500">
                Tell the assistant about your day.
              </p>
            </div>
          </div>

          <ChatPanel />
        </div>

        <aside className="min-w-0 space-y-5">
          <DailySummary />

          <Card className="p-5 sm:p-6">
            <div className="flex items-start justify-between gap-3">
              <div className="flex items-center gap-3">
                <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-2xl bg-lime-300/10 text-lime-300">
                  <Target size={21} />
                </div>

                <div>
                  <h2 className="font-semibold text-white">
                    Daily targets
                  </h2>
                  <p className="mt-1 text-xs text-zinc-500">
                    Your saved daily goals
                  </p>
                </div>
              </div>

              <Link
                href="/profile"
                aria-label="Edit fitness goals"
                className="flex h-9 w-9 shrink-0 items-center justify-center rounded-xl border border-white/10 text-zinc-400 transition hover:border-lime-300/30 hover:text-lime-300"
              >
                <ArrowRight size={16} />
              </Link>
            </div>

            <div className="mt-5 space-y-2.5">
              {targets.map((target) => {
                const Icon = target.icon;

                return (
                  <div
                    key={target.label}
                    className="flex items-center justify-between gap-3 rounded-xl border border-white/[0.06] bg-[#0c0f0d] px-3 py-3 transition hover:border-white/10"
                  >
                    <div className="flex min-w-0 items-center gap-3">
                      <Icon
                        size={16}
                        className="shrink-0 text-lime-300/80"
                      />
                      <span className="text-sm text-zinc-400">
                        {target.label}
                      </span>
                    </div>

                    <strong className="shrink-0 text-sm font-semibold tabular-nums text-white">
                      {loading ? "Loading..." : target.value}
                    </strong>
                  </div>
                );
              })}
            </div>

            <Link
              href="/profile"
              className="mt-4 inline-flex min-h-10 items-center gap-2 text-sm font-medium text-lime-300 transition hover:text-lime-200"
            >
              Customize your targets
              <ArrowRight size={15} />
            </Link>
          </Card>

          <Card className="p-5 sm:p-6">
            <div className="flex items-center gap-3">
              <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-2xl bg-lime-300/10 text-lime-300">
                <ClipboardList size={21} />
              </div>

              <div>
                <h2 className="font-semibold text-white">Your records</h2>
                <p className="mt-1 text-xs text-zinc-500">
                  Review your logged activity
                </p>
              </div>
            </div>

            <div className="mt-5 space-y-2.5">
              <Link
                href="/food-history"
                className="group flex min-h-12 items-center justify-between gap-3 rounded-xl border border-white/[0.07] bg-[#0c0f0d] px-4 text-sm text-zinc-300 transition hover:border-lime-300/30 hover:bg-lime-300/[0.04]"
              >
                <span className="flex items-center gap-3">
                  <Utensils size={17} className="text-lime-300" />
                  Food history
                </span>
                <ArrowRight
                  size={16}
                  className="text-zinc-500 transition group-hover:translate-x-0.5 group-hover:text-lime-300"
                />
              </Link>

              <Link
                href="/progress"
                className="group flex min-h-12 items-center justify-between gap-3 rounded-xl border border-white/[0.07] bg-[#0c0f0d] px-4 text-sm text-zinc-300 transition hover:border-lime-300/30 hover:bg-lime-300/[0.04]"
              >
                <span className="flex items-center gap-3">
                  <ChartNoAxesCombined
                    size={17}
                    className="text-lime-300"
                  />
                  Progress analytics
                </span>
                <ArrowRight
                  size={16}
                  className="text-zinc-500 transition group-hover:translate-x-0.5 group-hover:text-lime-300"
                />
              </Link>
            </div>

            <div className="mt-5 flex items-start gap-2.5 rounded-xl border border-white/[0.06] bg-white/[0.02] p-3 text-xs leading-5 text-zinc-500">
              <MessageCircle
                size={15}
                className="mt-0.5 shrink-0 text-lime-300"
              />
              <p>
                Your accepted records are saved to your account.
                AI assistant responses are still using the demo mode.
              </p>
            </div>
          </Card>
        </aside>
      </section>
    </div>
  );
}
