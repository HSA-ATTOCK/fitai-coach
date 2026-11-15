
"use client";

import { useEffect, useMemo, useState, type FormEvent } from "react";
import {
  Search,
  Trash2,
  Utensils,
  CalendarDays,
  Pencil,
  X,
} from "lucide-react";

import { createClient } from "@/lib/supabase/client";
import type { FoodEntry, MealCategory } from "@/types/fitness";
import {
  Card,
  EmptyState,
  PrimaryButton,
  SectionTitle,
} from "@/components/ui/primitives";

const categories = [
  "All meals",
  "Breakfast",
  "Lunch",
  "Dinner",
  "Snack",
] as const;

const mealCategories: MealCategory[] = [
  "Breakfast",
  "Lunch",
  "Dinner",
  "Snack",
];

export default function FoodHistoryPage() {
  const [supabase] = useState(() => createClient());

  const [foodEntries, setFoodEntries] = useState<FoodEntry[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false);
  const [isDeleting, setIsDeleting] = useState(false);
  const [error, setError] = useState("");

  const [search, setSearch] = useState("");
  const [category, setCategory] =
    useState<(typeof categories)[number]>("All meals");
    type DateRange = 1 | 7 | 30 | 90;

const [dateRange, setDateRange] = useState<DateRange>(30);
const [today, setToday] = useState<Date | null>(null);

useEffect(() => {
  const date = new Date();
  date.setHours(0, 0, 0, 0);
  setToday(date);
}, []);

  const [confirmId, setConfirmId] = useState<string | null>(null);
  const [editingEntry, setEditingEntry] = useState<FoodEntry | null>(null);

  // Load meals from Supabase
  useEffect(() => {
    async function loadMeals() {
      setIsLoading(true);
      setError("");

      const {
        data: { user },
        error: authError,
      } = await supabase.auth.getUser();

      if (authError || !user) {
        setError("Unable to verify your account. Please log in again.");
        setIsLoading(false);
        return;
      }

      const { data, error: mealsError } = await supabase
        .from("meals")
        .select(
          "id, meal_type, description, calories, protein_g, carbs_g, fat_g, logged_at"
        )
        .eq("user_id", user.id)
        .order("logged_at", { ascending: false });

      if (mealsError) {
        setError(mealsError.message);
        setIsLoading(false);
        return;
      }

      const meals: FoodEntry[] = (data ?? []).map((meal) => ({
        id: meal.id,
        name: meal.description,
        category: (meal.meal_type.charAt(0).toUpperCase() +
  meal.meal_type.slice(1)) as MealCategory,
        date: meal.logged_at,
        calories: Number(meal.calories),
        protein: Number(meal.protein_g),
        carbs: Number(meal.carbs_g),
        fat: Number(meal.fat_g),
      }));

      setFoodEntries(meals);
      setIsLoading(false);
    }

    loadMeals();
  }, [supabase]);

  // Date range filtering
const startDate = useMemo(() => {
  if (!today) return null;

  const date = new Date(today);
  date.setDate(date.getDate() - (dateRange - 1));

  return date;
}, [today, dateRange]);

const endDate = useMemo(() => {
  if (!today) return null;

  const date = new Date(today);
  date.setHours(23, 59, 59, 999);

  return date;
}, [today]);

// Search, category and date filtering
const filtered = useMemo(
  () =>
    foodEntries.filter((entry) => {
      if (!startDate || !endDate) return false;

      const timestamp = new Date(entry.date).getTime();

      const matchesDate =
        Number.isFinite(timestamp) &&
        timestamp >= startDate.getTime() &&
        timestamp <= endDate.getTime();

      const matchesSearch = entry.name
        .toLowerCase()
        .includes(search.trim().toLowerCase());

      const matchesCategory =
        category === "All meals" || entry.category === category;

      return matchesDate && matchesSearch && matchesCategory;
    }),
  [foodEntries, search, category, startDate, endDate],
);

  // Calculate nutrition totals
  const totals = filtered.reduce(
    (total, entry) => ({
      calories: total.calories + entry.calories,
      protein: total.protein + entry.protein,
      carbs: total.carbs + entry.carbs,
      fat: total.fat + entry.fat,
    }),
    { calories: 0, protein: 0, carbs: 0, fat: 0 },
  );

  // Update an existing meal
  async function handleEditSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();

    if (!editingEntry || !editingEntry.name.trim()) {
      return;
    }

    const values = [
      editingEntry.calories,
      editingEntry.protein,
      editingEntry.carbs,
      editingEntry.fat,
    ];

    if (
      values.some(
        (value) => !Number.isFinite(value) || value < 0,
      )
    ) {
      setError("Nutrition values must be valid non-negative numbers.");
      return;
    }

    setIsSaving(true);
    setError("");

    const {
      data: { user },
      error: authError,
    } = await supabase.auth.getUser();

    if (authError || !user) {
      setError("Please log in again.");
      setIsSaving(false);
      return;
    }

    const { error: updateError } = await supabase
      .from("meals")
      .update({
        description: editingEntry.name.trim(),
        meal_type: editingEntry.category,
        calories: editingEntry.calories,
        protein_g: editingEntry.protein,
        carbs_g: editingEntry.carbs,
        fat_g: editingEntry.fat,
      })
      .eq("id", editingEntry.id)
      .eq("user_id", user.id);

    if (updateError) {
      setError(updateError.message);
      setIsSaving(false);
      return;
    }

    setFoodEntries((current) =>
      current.map((entry) =>
        entry.id === editingEntry.id
          ? {
              ...editingEntry,
              name: editingEntry.name.trim(),
            }
          : entry,
      ),
    );

    setEditingEntry(null);
    setIsSaving(false);
  }

  // Delete a meal
  async function handleDeleteMeal() {
    if (!confirmId || isDeleting) return;

    setIsDeleting(true);
    setError("");

    const {
      data: { user },
      error: authError,
    } = await supabase.auth.getUser();

    if (authError || !user) {
      setError("Please log in again.");
      setConfirmId(null);
      setIsDeleting(false);
      return;
    }

    const { error: deleteError } = await supabase
      .from("meals")
      .delete()
      .eq("id", confirmId)
      .eq("user_id", user.id);

    if (deleteError) {
      setError(deleteError.message);
      setIsDeleting(false);
      setConfirmId(null);
      return;
    }

    setFoodEntries((current) =>
      current.filter((entry) => entry.id !== confirmId),
    );

    setConfirmId(null);
    setIsDeleting(false);
  }

  return (
    <div className="space-y-5">
      {error && (
        <div className="rounded-xl border border-red-400/20 bg-red-400/10 p-3 text-sm text-red-300">
          {error}
        </div>
      )}

      <div className="flex flex-col justify-between gap-3 sm:flex-row sm:items-end">
        <div>
          <p className="text-xs font-semibold uppercase tracking-widest text-lime-300">
            Nutrition journal
          </p>
          <h1 className="mt-2 text-3xl font-bold">Food History</h1>
          <p className="mt-2 text-sm text-zinc-500">
            Review and manage your saved meals and nutrition information.
          </p>
        </div>

        <span className="rounded-xl border border-white/10 bg-zinc-900 px-3 py-2 text-xs text-zinc-400">
          {foodEntries.length} meals
        </span>
      </div>

      {/* Nutrition totals */}
      <div className="grid grid-cols-2 gap-3 xl:grid-cols-4">
        {[
          ["Calories", totals.calories.toLocaleString(), "kcal"],
          ["Protein", totals.protein, "g"],
          ["Carbs", totals.carbs, "g"],
          ["Fat", totals.fat, "g"],
        ].map(([label, value, unit]) => (
          <Card key={label} className="p-4">
            <p className="text-xs text-zinc-500">{label}</p>
            <p className="mt-2 text-2xl font-bold">
              {value}
              <span className="ml-1 text-xs font-normal text-zinc-500">
                {unit}
              </span>
            </p>
            <p className="mt-1 text-[10px] text-zinc-600">
              Filtered saved meals
            </p>
          </Card>
        ))}
      </div>

      {/* Meals */}
      <Card className="p-4 sm:p-5">
        <SectionTitle
  title="Your meals"
  subtitle="Search and filter your saved meals."
/>

{/* Date range filters */}
<div className="flex flex-wrap gap-2">
  {(
    [
      { days: 1, label: "Daily" },
      { days: 7, label: "7 Days" },
      { days: 30, label: "30 Days" },
      { days: 90, label: "90 Days" },
    ] as const
  ).map(({ days, label }) => (
    <button
      key={days}
      type="button"
      onClick={() => setDateRange(days)}
      aria-pressed={dateRange === days}
      className={`min-h-10 rounded-xl px-4 text-xs font-bold transition-colors ${
        dateRange === days
          ? "bg-lime-300 text-zinc-950"
          : "border border-white/10 bg-zinc-900 text-zinc-400 hover:text-white"
      }`}
    >
      {label}
    </button>
  ))}
</div>

<p className="text-xs text-zinc-500">
  Showing {filtered.length} matching meals
</p>

<div className="flex flex-col gap-3 lg:flex-row">
          <label className="relative flex-1">
            <span className="sr-only">Search meals</span>
            <Search
              size={17}
              className="absolute left-3 top-1/2 -translate-y-1/2 text-zinc-500"
            />
            <input
              value={search}
              onChange={(event) => setSearch(event.target.value)}
              placeholder="Search food or meal…"
              className="min-h-11 w-full rounded-xl border border-white/10 bg-[#0c0f0d] pl-10 pr-3 text-sm outline-none focus:border-lime-300/50"
            />
          </label>

          <div className="flex gap-2 overflow-x-auto pb-1">
            {categories.map((item) => (
              <button
                key={item}
                type="button"
                onClick={() => setCategory(item)}
                className={`min-h-10 shrink-0 rounded-xl px-3 text-xs font-medium ${
                  category === item
                    ? "bg-lime-300 text-zinc-950"
                    : "border border-white/10 bg-zinc-900 text-zinc-400 hover:text-white"
                }`}
              >
                {item}
              </button>
            ))}
          </div>
        </div>

        <div className="mt-5 space-y-3">
          {isLoading && (
            <p className="py-8 text-center text-sm text-zinc-400">
              Loading your meals...
            </p>
          )}

          {!isLoading &&
            filtered.map((entry) => (
              <div
                key={entry.id}
                className="flex flex-col gap-3 rounded-xl border border-white/[0.07] bg-[#0d100e] p-4 sm:flex-row sm:items-center"
              >
                <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-xl bg-lime-300/10 text-lime-300">
                  <Utensils size={20} />
                </div>

                <div className="min-w-0 flex-1">
                  <div className="flex flex-wrap items-center gap-2">
                    <h3 className="font-semibold">{entry.name}</h3>
                    <span className="rounded-full bg-zinc-800 px-2 py-1 text-[10px] text-zinc-400">
                      {entry.category}
                    </span>
                  </div>

                  <p className="mt-1 flex items-center gap-1 text-xs text-zinc-600">
                    <CalendarDays size={12} />
                    {new Date(entry.date).toLocaleString([], {
                      dateStyle: "medium",
                      timeStyle: "short",
                    })}
                  </p>

                  <div className="mt-3 flex flex-wrap gap-x-4 gap-y-1 text-xs text-zinc-400">
                    <span>
                      <strong className="text-white">{entry.calories}</strong>{" "}
                      kcal
                    </span>
                    <span>
                      <strong className="text-white">{entry.protein}g</strong>{" "}
                      protein
                    </span>
                    <span>
                      <strong className="text-white">{entry.carbs}g</strong>{" "}
                      carbs
                    </span>
                    <span>
                      <strong className="text-white">{entry.fat}g</strong>{" "}
                      fat
                    </span>
                  </div>
                </div>

                <div className="flex shrink-0 gap-2 self-start sm:self-center">
                  <button
                    type="button"
                    onClick={() => setEditingEntry({ ...entry })}
                    aria-label={`Edit ${entry.name}`}
                    className="flex min-h-10 items-center justify-center gap-2 rounded-lg border border-white/10 px-3 text-xs text-zinc-400 transition hover:border-lime-300/30 hover:text-lime-300"
                  >
                    <Pencil size={14} />
                    Edit
                  </button>

                  <button
                    type="button"
                    onClick={() => setConfirmId(entry.id)}
                    aria-label={`Delete ${entry.name}`}
                    className="flex min-h-10 items-center justify-center gap-2 rounded-lg border border-white/10 px-3 text-xs text-zinc-400 transition hover:border-red-400/30 hover:text-red-300"
                  >
                    <Trash2 size={14} />
                    Remove
                  </button>
                </div>
              </div>
            ))}

          {!isLoading && filtered.length === 0 && (
            <EmptyState
              title="No meals found"
              description="Try another search or category, or reset your filters."
              action={
                <PrimaryButton
                  onClick={() => {
  setSearch("");
  setCategory("All meals");
  setDateRange(30);
}}
                >
                  Reset filters
                </PrimaryButton>
              }
            />
          )}
        </div>
      </Card>

      {/* Edit meal modal */}
      {editingEntry && (
        <div
          className="fixed inset-0 z-[80] flex items-center justify-center overflow-y-auto bg-black/75 p-4"
          onMouseDown={(event) => {
            if (event.target === event.currentTarget && !isSaving) {
              setEditingEntry(null);
            }
          }}
        >
          <div
            role="dialog"
            aria-modal="true"
            aria-labelledby="edit-meal-title"
            className="my-auto w-full max-w-lg rounded-2xl border border-white/10 bg-[#171b18] p-5 shadow-2xl sm:p-6"
          >
            <div className="mb-5 flex items-center justify-between gap-3">
              <div>
                <h2 id="edit-meal-title" className="text-lg font-semibold">
                  Edit meal
                </h2>
                <p className="mt-1 text-xs text-zinc-500">
                  Update the meal details and nutrition estimates.
                </p>
              </div>

              <button
                type="button"
                onClick={() => !isSaving && setEditingEntry(null)}
                disabled={isSaving}
                aria-label="Close edit meal dialog"
                className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg border border-white/10 text-zinc-400 hover:text-white disabled:opacity-50"
              >
                <X size={18} />
              </button>
            </div>

            <form onSubmit={handleEditSubmit} className="space-y-4">
              <div>
                <label
                  htmlFor="meal-name"
                  className="mb-1.5 block text-xs font-medium text-zinc-400"
                >
                  Meal name
                </label>
                <input
                  id="meal-name"
                  required
                  maxLength={100}
                  value={editingEntry.name}
                  onChange={(event) =>
                    setEditingEntry({
                      ...editingEntry,
                      name: event.target.value,
                    })
                  }
                  className="min-h-11 w-full rounded-xl border border-white/10 bg-[#0c0f0d] px-3 text-sm text-white outline-none focus:border-lime-300/50"
                />
              </div>

              <div>
                <label
                  htmlFor="meal-category"
                  className="mb-1.5 block text-xs font-medium text-zinc-400"
                >
                  Category
                </label>
                <select
                  id="meal-category"
                  value={editingEntry.category}
                  onChange={(event) =>
                    setEditingEntry({
                      ...editingEntry,
                      category: event.target.value as MealCategory,
                    })
                  }
                  className="min-h-11 w-full rounded-xl border border-white/10 bg-[#0c0f0d] px-3 text-sm text-white outline-none focus:border-lime-300/50"
                >
                  {mealCategories.map((item) => (
                    <option key={item} value={item}>
                      {item}
                    </option>
                  ))}
                </select>
              </div>

              <div className="grid grid-cols-2 gap-3">
                {(
                  [
                    ["calories", "Calories", "kcal"],
                    ["protein", "Protein", "g"],
                    ["carbs", "Carbs", "g"],
                    ["fat", "Fat", "g"],
                  ] as const
                ).map(([field, label, unit]) => (
                  <div key={field}>
                    <label
                      htmlFor={`meal-${field}`}
                      className="mb-1.5 block text-xs font-medium text-zinc-400"
                    >
                      {label} ({unit})
                    </label>
                    <input
                      id={`meal-${field}`}
                      type="number"
                      min="0"
                      step="any"
                      required
                      value={editingEntry[field]}
                      onChange={(event) =>
                        setEditingEntry({
                          ...editingEntry,
                          [field]:
                            event.target.value === ""
                              ? 0
                              : Number(event.target.value),
                        })
                      }
                      className="min-h-11 w-full rounded-xl border border-white/10 bg-[#0c0f0d] px-3 text-sm text-white outline-none focus:border-lime-300/50"
                    />
                  </div>
                ))}
              </div>

              <div className="flex flex-col-reverse gap-2 pt-2 sm:flex-row sm:justify-end">
                <button
                  type="button"
                  onClick={() => setEditingEntry(null)}
                  disabled={isSaving}
                  className="min-h-11 rounded-xl border border-white/10 px-4 text-sm text-zinc-300 transition hover:bg-white/5 disabled:cursor-not-allowed disabled:opacity-50"
                >
                  Cancel
                </button>

                <PrimaryButton type="submit" disabled={isSaving}>
                  {isSaving ? "Saving..." : "Save changes"}
                </PrimaryButton>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Delete confirmation */}
      {confirmId && (
        <div className="fixed inset-0 z-[70] flex items-center justify-center bg-black/70 p-4">
          <div
            role="dialog"
            aria-modal="true"
            aria-labelledby="delete-title"
            className="w-full max-w-sm rounded-2xl border border-white/10 bg-[#171b18] p-5 shadow-2xl"
          >
            <h2 id="delete-title" className="text-lg font-semibold">
              Remove this meal?
            </h2>

            <p className="mt-2 text-sm text-zinc-400">
              This meal will be permanently removed from your food history.
            </p>

            <div className="mt-5 flex justify-end gap-2">
              <button
                type="button"
                onClick={() => setConfirmId(null)}
                disabled={isDeleting}
                className="min-h-10 rounded-lg border border-white/10 px-4 text-sm disabled:opacity-50"
              >
                Cancel
              </button>

              <button
                type="button"
                onClick={handleDeleteMeal}
                disabled={isDeleting}
                className="min-h-10 rounded-lg bg-red-400 px-4 text-sm font-semibold text-zinc-950 disabled:cursor-not-allowed disabled:opacity-50"
              >
                {isDeleting ? "Removing..." : "Remove"}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
