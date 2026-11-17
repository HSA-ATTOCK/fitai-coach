
import Link from "next/link";
import {
  ArrowRight,
  BarChart3,
  Utensils,
  Target,
  Sparkles,
} from "lucide-react";

const features = [
  {
    icon: Utensils,
    title: "Nutrition tracking",
    description:
      "Review your meals, calories, and macronutrients in one place.",
    href: "/food-history",
    label: "Explore food history",
  },
  {
    icon: BarChart3,
    title: "Progress analytics",
    description:
      "Track your weight trends, workout activity, and nutrition consistency.",
    href: "/progress",
    label: "View progress",
  },
  {
    icon: Target,
    title: "Personal fitness goals",
    description:
      "Review your fitness profile, target weight, and nutrition goals.",
    href: "/profile",
    label: "Manage goals",
  },
];

export default function Home() {
  return (
    <div className="mx-auto max-w-6xl space-y-10 py-6 sm:py-10">
      <section className="relative overflow-hidden rounded-3xl border border-lime-300/15 bg-gradient-to-br from-lime-300/10 via-[#151a15] to-[#101211] p-7 sm:p-12">
        <div className="pointer-events-none absolute -right-16 -top-16 h-64 w-64 rounded-full bg-lime-300/10 blur-3xl" />

        <div className="relative max-w-3xl">
          <div className="mb-6 inline-flex items-center gap-2 rounded-full border border-lime-300/20 bg-lime-300/5 px-3 py-2 text-xs font-medium text-lime-300">
            <Sparkles size={15} />
            YOUR PERSONAL FITNESS COMPANION
          </div>

          <h1 className="text-4xl font-extrabold leading-tight tracking-tight sm:text-6xl">
            Build better habits.
            <span className="block text-lime-300">
              Track your progress.
            </span>
          </h1>

          <p className="mt-5 max-w-2xl text-base leading-7 text-zinc-400 sm:text-lg">
            Your fitness journey starts with understanding your nutrition,
            monitoring your progress, and setting goals that work for you.
          </p>

          <div className="mt-8 flex flex-wrap gap-3">
            <Link
              href="/dashboard"
              className="inline-flex items-center gap-2 rounded-xl bg-lime-300 px-5 py-3 font-semibold text-zinc-950 transition hover:bg-lime-200"
            >
              Open dashboard <ArrowRight size={18} />
            </Link>

            <Link
              href="/profile"
              className="inline-flex items-center gap-2 rounded-xl border border-white/10 bg-white/5 px-5 py-3 font-medium text-white transition hover:bg-white/10"
            >
              Set fitness goals
            </Link>
          </div>
        </div>
      </section>

      <section>
        <div className="mb-5">
          <p className="text-xs font-semibold uppercase tracking-[0.2em] text-lime-300">
            YOUR FITNESS WORKSPACE
          </p>
          <h2 className="mt-2 text-2xl font-bold sm:text-3xl">
            Everything you need to stay on track
          </h2>
          <p className="mt-2 text-sm leading-6 text-zinc-400">
  Access your nutrition, progress, and personal fitness goals.
</p>
        </div>

        <div className="grid gap-4 md:grid-cols-3">
          {features.map((feature) => {
            const Icon = feature.icon;

            return (
              <article
                key={feature.href}
                className="flex flex-col rounded-2xl border border-white/10 bg-[#111412] p-6 transition hover:border-lime-300/30"
              >
                <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-lime-300/10 text-lime-300">
                  <Icon size={24} />
                </div>

                <h3 className="mt-5 text-lg font-bold">{feature.title}</h3>
                <p className="mt-2 flex-1 text-sm leading-6 text-zinc-400">
                  {feature.description}
                </p>

                <Link
                  href={feature.href}
                  className="mt-6 inline-flex items-center gap-2 text-sm font-semibold text-lime-300 hover:text-lime-200"
                >
                  {feature.label} <ArrowRight size={16} />
                </Link>
              </article>
            );
          })}
        </div>
      </section>

    </div>
  );
}
