
"use client";

import { useState } from "react";
import {
  Activity,
  Check,
  Info,
  RotateCcw,
  Save,
  Target,
  UserRound,
  Utensils,
  Weight,
  Ruler,
  Droplets,
  Flame,
} from "lucide-react";

// import { AppShell } from "@/components/layout/app-shell";
import { useDemo } from "@/lib/demo/demo-store";
import type {
  FitnessGoals,
  GoalType,
  UnitSystem,
  UserProfile,
} from "@/types/fitness";

const KG_TO_LB = 2.20462262;
const CM_TO_IN = 1 / 2.54;

function toDisplayWeight(kg: number, unit: UnitSystem) {
  return Number((unit === "metric" ? kg : kg * KG_TO_LB).toFixed(1));
}

function toKg(value: number, unit: UnitSystem) {
  return unit === "metric" ? value : value / KG_TO_LB;
}

function toDisplayHeight(cm: number, unit: UnitSystem) {
  return Math.round(unit === "metric" ? cm : cm * CM_TO_IN);
}

function toCm(value: number, unit: UnitSystem) {
  return unit === "metric" ? value : value / CM_TO_IN;
}

function activityToKey(value: string) {
  const text = value.toLowerCase();

  if (text.includes("extra") || text.includes("elite")) return "elite";
  if (text.includes("very")) return "very_active";
  if (text.includes("moderate")) return "moderate";
  if (text.includes("light")) return "light";
  return "sedentary";
}

function activityToLabel(value: string) {
  const labels: Record<string, string> = {
    sedentary: "Sedentary",
    light: "Lightly active",
    moderate: "Moderately active",
    very_active: "Very active",
    elite: "Extra active",
  };

  return labels[value] ?? "Moderately active";
}

const goalOptions: {
  value: GoalType;
  title: string;
  description: string;
  badge: string;
  symbol: string;
}[] = [
  {
    value: "lose",
    title: "Lose fat",
    description: "Focus on gradual weight loss while maintaining healthy habits.",
    badge: "WEIGHT LOSS",
    symbol: "↘",
  },
  {
    value: "maintain",
    title: "Maintain",
    description: "Keep your weight steady and build consistent fitness habits.",
    badge: "MAINTENANCE",
    symbol: "↔",
  },
  {
    value: "gain",
    title: "Build muscle",
    description: "Support muscle growth with training and suitable nutrition.",
    badge: "MUSCLE GAIN",
    symbol: "↗",
  },
];

function Field({
  label,
  value,
  onChange,
  type = "number",
  min,
  max,
  step,
  suffix,
  id,
}: {
  label: string;
  value: string | number;
  onChange: (value: string) => void;
  type?: string;
  min?: number;
  max?: number;
  step?: number;
  suffix?: string;
  id: string;
}) {
  return (
    <div className="min-w-0 space-y-2">
      <label
        htmlFor={id}
        className="block text-xs font-semibold uppercase tracking-wider text-zinc-400"
      >
        {label}
      </label>
      <div className="flex items-center rounded-xl border border-white/10 bg-[#0b0e0c] px-3 transition-colors focus-within:border-lime-300/60">
        <input
          id={id}
          type={type}
          value={value}
          min={min}
          max={max}
          step={step}
          onChange={(event) => onChange(event.target.value)}
          className="min-w-0 w-full bg-transparent py-3 text-sm text-white outline-none"
        />
        {suffix && (
          <span className="shrink-0 pl-2 text-xs text-zinc-500">{suffix}</span>
        )}
      </div>
    </div>
  );
}

export default function ProfileGoalsPage() {
  
const { profile, goals, updateProfile, updateGoals } = useDemo();

const initialProfile = useState(() => ({ ...profile }))[0];
const initialGoals = useState(() => ({ ...goals }))[0];

const [name, setName] = useState(profile.name);
const [age, setAge] = useState(String(profile.age));
const [height, setHeight] = useState(
  String(toDisplayHeight(profile.heightCm, profile.units)),
);
const [currentWeightInput, setCurrentWeightInput] = useState<string | null>(
  null,
);

const currentWeight =
  currentWeightInput ??
  String(toDisplayWeight(profile.weightKg, profile.units));

  const [targetWeight, setTargetWeight] = useState(
    String(toDisplayWeight(goals.targetWeightKg, profile.units)),
  );
  const [activityLevel, setActivityLevel] = useState(
    activityToKey(profile.activityLevel),
  );
  const [dietaryPreference, setDietaryPreference] = useState(
    profile.dietaryPreference,
  );
  const [unit, setUnit] = useState<UnitSystem>(profile.units);
  const [goalType, setGoalType] = useState<GoalType>(goals.type);
  const [calories, setCalories] = useState(String(goals.dailyCalories));
  const [protein, setProtein] = useState(String(goals.dailyProtein));
  const [saved, setSaved] = useState(false);
  const [error, setError] = useState("");

// Carbohydrate, fat, and hydration targets are stored in FitnessGoals.
  const [carbs, setCarbs] = useState(String(goals.dailyCarbs));
  const [fat, setFat] = useState(String(goals.dailyFat));
  const [hydration, setHydration] = useState(String(goals.dailyWaterMl));

  const changeUnit = (nextUnit: UnitSystem) => {
    if (nextUnit === unit) return;

    const weight = Number(currentWeight);
    const target = Number(targetWeight);
    const heightValue = Number(height);

    if (
      !Number.isFinite(weight) ||
      !Number.isFinite(target) ||
      !Number.isFinite(heightValue)
    ) {
      setError("Enter valid measurements before changing units.");
      return;
    }

    setCurrentWeightInput(
  String(toDisplayWeight(toKg(weight, unit), nextUnit)),
);
    setTargetWeight(
      String(toDisplayWeight(toKg(target, unit), nextUnit)),
    );
    setHeight(
      String(toDisplayHeight(toCm(heightValue, unit), nextUnit)),
    );

    setUnit(nextUnit);
    setSaved(false);
    setError("");
  };

  
const resetForm = () => {
  setName(initialProfile.name);
  setAge(String(initialProfile.age));
  setHeight(
    String(toDisplayHeight(initialProfile.heightCm, initialProfile.units)),
  );
  setCurrentWeightInput(null);
  setTargetWeight(
    String(toDisplayWeight(initialGoals.targetWeightKg, initialProfile.units)),
  );
  setActivityLevel(activityToKey(initialProfile.activityLevel));
  setDietaryPreference(initialProfile.dietaryPreference);
  setUnit(initialProfile.units);
  setGoalType(initialGoals.type);
  setCalories(String(initialGoals.dailyCalories));
  setProtein(String(initialGoals.dailyProtein));
  setCarbs(String(initialGoals.dailyCarbs));
  setFat(String(initialGoals.dailyFat));
  setHydration(String(initialGoals.dailyWaterMl));

  setSaved(false);
  setError("");

  updateProfile({ ...initialProfile });
  updateGoals({ ...initialGoals });
};

  const saveChanges = () => {
    const ageValue = Number(age);
    const carbValue = Number(carbs);
const fatValue = Number(fat);
const hydrationValue = Number(hydration);
    const heightValue = Number(height);
    const weightValue = Number(currentWeight);
    const targetValue = Number(targetWeight);
    const calorieValue = Number(calories);
    const proteinValue = Number(protein);

    if (!name.trim()) {
      setError("Please enter your name.");
      return;
    }

    if (!Number.isFinite(ageValue) || ageValue < 1 || ageValue > 120) {
      setError("Age must be between 1 and 120 years.");
      return;
    }

    if (
      !Number.isFinite(heightValue) ||
      heightValue <= 0 ||
      toCm(heightValue, unit) < 50 ||
      toCm(heightValue, unit) > 260
    ) {
      setError(
        unit === "metric"
          ? "Height must be between 50 and 260 cm."
          : "Please enter a valid height in inches.",
      );
      return;
    }

    const currentWeightKg = toKg(weightValue, unit);
const targetWeightKg = toKg(targetValue, unit);

if (
  !Number.isFinite(weightValue) ||
  !Number.isFinite(targetValue) ||
  currentWeightKg < 20 ||
  currentWeightKg > 350 ||
  targetWeightKg < 20 ||
  targetWeightKg > 350
) {
  setError("Current and target weight must be between 20 and 350 kg.");
  return;
}

    if (
      !Number.isInteger(calorieValue) ||
      calorieValue < 500 ||
      calorieValue > 10000
    ) {
      setError("Daily calories must be between 500 and 10,000.");
      return;
    }

    if (
      !Number.isInteger(proteinValue) ||
      proteinValue < 1 ||
      proteinValue > 500
    ) {
      setError("Daily protein must be between 1 and 500 grams.");
      return;
    }

    if (
  !Number.isInteger(carbValue) ||
  carbValue < 1 ||
  carbValue > 600
) {
  setError("Daily carbohydrates must be between 1 and 600 grams.");
  return;
}

if (
  !Number.isInteger(fatValue) ||
  fatValue < 1 ||
  fatValue > 200
) {
  setError("Daily fat must be between 1 and 200 grams.");
  return;
}

if (
  !Number.isInteger(hydrationValue) ||
  hydrationValue < 250 ||
  hydrationValue > 10000
) {
  setError("Daily hydration must be between 250 and 10,000 mL.");
  return;
}

    const updatedProfile: UserProfile = {
      ...profile,
      name: name.trim(),
      age: ageValue,
      heightCm: Number(toCm(heightValue, unit).toFixed(1)),
      weightKg: Number(toKg(weightValue, unit).toFixed(2)),
      activityLevel: activityToLabel(activityLevel),
      dietaryPreference: dietaryPreference.trim(),
      units: unit,
    };

    const updatedGoals: FitnessGoals = {
  ...goals,
  type: goalType,
  targetWeightKg: Number(toKg(targetValue, unit).toFixed(2)),
  dailyCalories: calorieValue,
  dailyProtein: proteinValue,
  dailyCarbs: carbValue,
  dailyFat: fatValue,
  dailyWaterMl: hydrationValue,
};

    updateProfile(updatedProfile);
    updateGoals(updatedGoals);

    setSaved(true);
    setError("");
  };

  const calorieValue = Number(calories) || 0;
  const proteinValue = Number(protein) || 0;
  const carbValue = Number(carbs) || 0;
  const fatValue = Number(fat) || 0;
  const proteinCalories = proteinValue * 4;
  const carbCalories = carbValue * 4;
  const fatCalories = fatValue * 9;
  const macroCalories = proteinCalories + carbCalories + fatCalories;
  const macroPercent = (value: number) =>
    macroCalories ? Math.round((value / macroCalories) * 100) : 0;

  return (
  <div className="mx-auto max-w-[1500px] space-y-6">
        <header className="space-y-2">
          <div className="flex items-center gap-2 text-[10px] font-bold uppercase tracking-[0.2em] text-lime-300">
            <span className="h-2 w-2 rounded-full bg-lime-300" />
            Demo configuration · Phase 2
          </div>
          <h1 className="text-3xl font-bold tracking-tight text-white sm:text-4xl">
            Profile &amp; Fitness Goals
          </h1>
          <p className="max-w-2xl text-sm leading-6 text-zinc-400">
            Update your personal information, measurements, fitness goal, and
            daily nutrition targets.
          </p>
        </header>

        <div className="flex items-start gap-3 rounded-xl border border-lime-300/15 bg-lime-300/5 p-4">
          <Info size={18} className="mt-0.5 shrink-0 text-lime-300" />
          <p className="text-xs leading-5 text-zinc-400">
            <strong className="text-lime-300">Sample data only.</strong> Saved
            profile and nutrition goals update the in-memory demo store.
            Changes are not permanently stored and will reset when the demo
            provider is reinitialized.
          </p>
        </div>

        {error && (
          <div
            role="alert"
            className="rounded-xl border border-red-500/30 bg-red-500/10 px-4 py-3 text-sm text-red-300"
          >
            {error}
          </div>
        )}

        {saved && (
          <div
            role="status"
            className="flex items-center gap-2 rounded-xl border border-lime-300/20 bg-lime-300/5 px-4 py-3 text-sm text-lime-300"
          >
            <Check size={17} />
            Profile and fitness goals updated in demo state.
          </div>
        )}

        <div className="grid grid-cols-1 items-start gap-5 xl:grid-cols-12">
          <div className="space-y-5 xl:col-span-5">
            <section className="rounded-2xl border border-white/5 bg-[#111512] p-5 sm:p-6">
              <div className="flex items-center gap-3">
                <div className="flex h-11 w-11 items-center justify-center rounded-xl bg-lime-300/10 text-lime-300">
                  <UserRound size={22} />
                </div>
                <div>
                  <h2 className="font-bold text-white">Personal profile</h2>
                  <p className="mt-1 text-xs text-zinc-500">
                    Your basic information
                  </p>
                </div>
              </div>

              <div className="mt-6 space-y-4">
                <Field
                  id="profile-name"
                  label="Name"
                  type="text"
                  value={name}
                  onChange={(value) => {
                    setName(value);
                    setSaved(false);
                  }}
                />

                <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
                  <Field
                    id="profile-age"
                    label="Age"
                    value={age}
                    onChange={(value) => {
                      setAge(value);
                      setSaved(false);
                    }}
                    min={1}
                    max={120}
                    suffix="years"
                  />

                  <div className="space-y-2">
                    <label
                      htmlFor="activity-level"
                      className="block text-xs font-semibold uppercase tracking-wider text-zinc-400"
                    >
                      Activity level
                    </label>
                    <select
                      id="activity-level"
                      value={activityLevel}
                      onChange={(event) => {
                        setActivityLevel(event.target.value);
                        setSaved(false);
                      }}
                      className="w-full rounded-xl border border-white/10 bg-[#0b0e0c] px-3 py-3 text-sm text-white outline-none focus:border-lime-300/60"
                    >
                      <option value="sedentary">Sedentary</option>
                      <option value="light">Lightly active</option>
                      <option value="moderate">Moderately active</option>
                      <option value="very_active">Very active</option>
                      <option value="elite">Extra active</option>
                    </select>
                  </div>
                </div>

                <div className="flex items-center justify-between gap-3 border-t border-white/5 pt-4">
                  <div>
                    <p className="text-sm font-semibold text-white">
                      Measurement units
                    </p>
                    <p className="mt-1 text-xs text-zinc-500">
                      Change weight and height units
                    </p>
                  </div>
                  <div className="flex rounded-xl border border-white/10 bg-[#0b0e0c] p-1">
                    <button
                      type="button"
                      onClick={() => changeUnit("metric")}
                      aria-pressed={unit === "metric"}
                      className={`rounded-lg px-3 py-2 text-xs font-bold ${
                        unit === "metric"
                          ? "bg-lime-300 text-zinc-950"
                          : "text-zinc-400 hover:text-white"
                      }`}
                    >
                      KG / CM
                    </button>
                    <button
                      type="button"
                      onClick={() => changeUnit("imperial")}
                      aria-pressed={unit === "imperial"}
                      className={`rounded-lg px-3 py-2 text-xs font-bold ${
                        unit === "imperial"
                          ? "bg-lime-300 text-zinc-950"
                          : "text-zinc-400 hover:text-white"
                      }`}
                    >
                      LB / IN
                    </button>
                  </div>
                </div>
              </div>
            </section>

            <section className="rounded-2xl border border-white/5 bg-[#111512] p-5 sm:p-6">
              <div className="flex items-center gap-3">
                <div className="flex h-11 w-11 items-center justify-center rounded-xl bg-lime-300/10 text-lime-300">
                  <Ruler size={22} />
                </div>
                <div>
                  <h2 className="font-bold text-white">Biometrics</h2>
                  <p className="mt-1 text-xs text-zinc-500">
                    Your current and target measurements
                  </p>
                </div>
              </div>

              <div className="mt-6 grid grid-cols-1 gap-4 sm:grid-cols-2">
                <Field
                  id="profile-height"
                  label="Height"
                  value={height}
                  onChange={(value) => {
                    setHeight(value);
                    setSaved(false);
                  }}
                  min={1}
                  max={unit === "metric" ? 260 : 103}
                  step={unit === "metric" ? 1 : 0.5}
                  suffix={unit === "metric" ? "cm" : "in"}
                />

                <Field
                  id="profile-current-weight"
                  label="Current weight"
                  value={currentWeight}
                  onChange={(value) => {
  setCurrentWeightInput(value);
  setSaved(false);
}}
                  min={1}
                  step={0.1}
                  suffix={unit === "metric" ? "kg" : "lb"}
                />

                <div className="sm:col-span-2">
                  <Field
                    id="profile-target-weight"
                    label="Target weight"
                    value={targetWeight}
                    onChange={(value) => {
                      setTargetWeight(value);
                      setSaved(false);
                    }}
                    min={1}
                    step={0.1}
                    suffix={unit === "metric" ? "kg" : "lb"}
                  />
                </div>
              </div>

              <div className="mt-5 rounded-xl bg-[#0b0e0c] p-4">
                <div className="flex items-center gap-2 text-xs text-zinc-400">
                  <Weight size={15} className="text-lime-300" />
                  Current measurement summary
                </div>
                <div className="mt-3 grid grid-cols-2 gap-4">
                  <div>
                    <p className="text-xs text-zinc-500">Current</p>
                    <p className="mt-1 text-lg font-bold text-white">
                      {Number(currentWeight || 0).toFixed(1)}{" "}
                      {unit === "metric" ? "kg" : "lb"}
                    </p>
                  </div>
                  <div>
                    <p className="text-xs text-zinc-500">Target</p>
                    <p className="mt-1 text-lg font-bold text-lime-300">
                      {Number(targetWeight || 0).toFixed(1)}{" "}
                      {unit === "metric" ? "kg" : "lb"}
                    </p>
                  </div>
                </div>
              </div>
            </section>

            <section className="rounded-2xl border border-white/5 bg-[#111512] p-5 sm:p-6">
              <div className="flex items-center gap-3">
                <div className="flex h-11 w-11 items-center justify-center rounded-xl bg-lime-300/10 text-lime-300">
                  <Utensils size={22} />
                </div>
                <div>
                  <h2 className="font-bold text-white">Dietary preference</h2>
                  <p className="mt-1 text-xs text-zinc-500">
                    Used as a demo profile setting
                  </p>
                </div>
              </div>

              <label
                htmlFor="dietary-preference"
                className="mt-5 block text-xs font-semibold uppercase tracking-wider text-zinc-400"
              >
                Preference
              </label>
              <select
                id="dietary-preference"
                value={dietaryPreference}
                onChange={(event) => {
                  setDietaryPreference(event.target.value);
                  setSaved(false);
                }}
                className="mt-2 w-full rounded-xl border border-white/10 bg-[#0b0e0c] px-3 py-3 text-sm text-white outline-none focus:border-lime-300/60"
              >
                <option>No specific preference</option>
                <option>Vegetarian</option>
                <option>Vegan</option>
                <option>High protein</option>
                <option>Low carbohydrate</option>
                <option>Keto</option>
                <option>Pescatarian</option>
              </select>
            </section>
          </div>

          <div className="space-y-5 xl:col-span-7">
            <section className="rounded-2xl border border-white/5 bg-[#111512] p-5 sm:p-6">
              <div className="flex items-center gap-3">
                <div className="flex h-11 w-11 items-center justify-center rounded-xl bg-lime-300/10 text-lime-300">
                  <Target size={22} />
                </div>
                <div>
                  <h2 className="font-bold text-white">Primary fitness goal</h2>
                  <p className="mt-1 text-xs text-zinc-500">
                    Choose the direction of your fitness plan
                  </p>
                </div>
              </div>

              <div className="mt-5 grid grid-cols-1 gap-3 md:grid-cols-3">
                {goalOptions.map((option) => {
                  const active = goalType === option.value;

                  return (
                    <button
                      key={option.value}
                      type="button"
                      onClick={() => {
                        setGoalType(option.value);
                        setSaved(false);
                      }}
                      aria-pressed={active}
                      className={`flex h-full flex-col rounded-xl border p-4 text-left transition-colors ${
                        active
                          ? "border-lime-300/70 bg-lime-300/5 ring-1 ring-lime-300/20"
                          : "border-white/5 bg-[#0b0e0c] hover:border-white/15"
                      }`}
                    >
                      <div className="flex items-center justify-between">
                        <span
                          className={`text-2xl font-bold ${
                            active ? "text-lime-300" : "text-zinc-500"
                          }`}
                        >
                          {option.symbol}
                        </span>
                        <span
                          className={`flex h-5 w-5 items-center justify-center rounded-full border ${
                            active
                              ? "border-lime-300 bg-lime-300 text-zinc-950"
                              : "border-zinc-600"
                          }`}
                        >
                          {active && <Check size={12} />}
                        </span>
                      </div>
                      <span className="mt-4 font-bold text-white">
                        {option.title}
                      </span>
                      <span className="mt-2 flex-1 text-xs leading-5 text-zinc-400">
                        {option.description}
                      </span>
                      <span
                        className={`mt-4 text-[9px] font-bold tracking-wider ${
                          active ? "text-lime-300" : "text-zinc-500"
                        }`}
                      >
                        {option.badge}
                      </span>
                    </button>
                  );
                })}
              </div>
            </section>

            <section className="rounded-2xl border border-white/5 bg-[#111512] p-5 sm:p-6">
              <div className="flex items-center gap-3">
                <div className="flex h-11 w-11 items-center justify-center rounded-xl bg-lime-300/10 text-lime-300">
                  <Flame size={22} />
                </div>
                <div>
                  <h2 className="font-bold text-white">
                    Daily nutrition targets
                  </h2>
                  <p className="mt-1 text-xs text-zinc-500">
                    Set your calorie and protein goals
                  </p>
                </div>
              </div>

              <div className="mt-6 space-y-6">
                <div>
                  <div className="mb-3 flex items-center justify-between gap-3">
                    <label
                      htmlFor="daily-calories"
                      className="text-sm font-medium text-white"
                    >
                      Daily calorie target
                    </label>
                    <span className="text-sm font-bold text-lime-300">
                      {calorieValue.toLocaleString()} kcal
                    </span>
                  </div>
                  <input
                    id="daily-calories"
                    type="range"
                    min={1000}
                    max={4500}
                    step={50}
                    value={Math.min(4500, Math.max(1000, calorieValue))}
                    onChange={(event) => {
                      setCalories(event.target.value);
                      setSaved(false);
                    }}
                    className="w-full cursor-pointer accent-lime-300"
                  />
                  <div className="mt-2 flex justify-between text-[10px] text-zinc-500">
                    <span>1,000 kcal</span>
                    <span>4,500 kcal</span>
                  </div>
                  <div className="mt-3">
                    <Field
                      id="daily-calories-number"
                      label="Enter exact calorie target"
                      value={calories}
                      onChange={(value) => {
                        setCalories(value);
                        setSaved(false);
                      }}
                      min={500}
                      max={10000}
                      step={50}
                      suffix="kcal"
                    />
                  </div>
                </div>

                <div>
                  <div className="mb-3 flex items-center justify-between gap-3">
                    <label
                      htmlFor="daily-protein"
                      className="text-sm font-medium text-white"
                    >
                      Daily protein target
                    </label>
                    <span className="text-sm font-bold text-lime-300">
                      {proteinValue} g
                    </span>
                  </div>
                  <input
                    id="daily-protein"
                    type="range"
                    min={25}
                    max={300}
                    step={5}
                    value={Math.min(300, Math.max(25, proteinValue))}
                    onChange={(event) => {
                      setProtein(event.target.value);
                      setSaved(false);
                    }}
                    className="w-full cursor-pointer accent-lime-300"
                  />
                  <div className="mt-2 flex justify-between text-[10px] text-zinc-500">
                    <span>25 g</span>
                    <span>300 g</span>
                  </div>
                  <div className="mt-3">
                    <Field
                      id="daily-protein-number"
                      label="Enter exact protein target"
                      value={protein}
                      onChange={(value) => {
                        setProtein(value);
                        setSaved(false);
                      }}
                      min={1}
                      max={500}
                      suffix="grams"
                    />
                  </div>
                </div>
              </div>
            </section>

            <section className="rounded-2xl border border-white/5 bg-[#111512] p-5 sm:p-6">
              <div className="flex items-center gap-3">
                <div className="flex h-11 w-11 items-center justify-center rounded-xl bg-lime-300/10 text-lime-300">
                  <Activity size={22} />
                </div>
                <div>
                  <h2 className="font-bold text-white">
                    Macro planning preview
                  </h2>
                  <p className="mt-1 text-xs text-zinc-500">
                    Adjust these sample targets to preview your macro split
                  </p>
                </div>
              </div>

              <div className="mt-5 space-y-5">
                {[
                  {
                    label: "Protein",
                    value: proteinValue,
                    setter: setProtein,
                    color: "bg-lime-300",
                    calories: proteinCalories,
                  },
                  {
                    label: "Carbohydrates",
                    value: carbValue,
                    setter: setCarbs,
                    color: "bg-sky-400",
                    calories: carbCalories,
                  },
                  {
                    label: "Fat",
                    value: fatValue,
                    setter: setFat,
                    color: "bg-orange-400",
                    calories: fatCalories,
                  },
                ].map((item) => (
                  <div key={item.label}>
                    <div className="mb-2 flex items-center justify-between gap-3">
                      <label
                        htmlFor={`macro-${item.label}`}
                        className="text-sm text-zinc-300"
                      >
                        {item.label}
                      </label>
                      <span className="text-xs text-zinc-400">
                        {item.value} g · {macroPercent(item.calories)}%
                      </span>
                    </div>
                    <div className="mb-3 h-2 overflow-hidden rounded-full bg-zinc-800">
                      <div
                        className={`h-full rounded-full ${item.color}`}
                        style={{
                          width: `${macroPercent(item.calories)}%`,
                        }}
                      />
                    </div>
                    <input
                      id={`macro-${item.label}`}
                      type="range"
                      min={item.label === "Protein" ? 1 : item.label === "Fat" ? 10 : 1}
                      max={item.label === "Protein" ? 500 : item.label === "Fat" ? 200 : 600}
                      value={Math.min(
                        item.label === "Protein" ? 500 : item.label === "Fat" ? 200 : 600,
                        Math.max(
                          item.label === "Protein" ? 1 : item.label === "Fat" ? 10 : 1,
                          item.value,
                        ),
                      )}
                      onChange={(event) => {
                        item.setter(event.target.value);
                        setSaved(false);
                      }}
                      className="w-full cursor-pointer accent-lime-300"
                    />
                  </div>
                ))}

                <div className="rounded-xl bg-[#0b0e0c] p-4">
                  <div className="flex items-center justify-between gap-3">
                    <div>
                      <p className="text-xs text-zinc-500">
                        Preview of macro calories
                      </p>
                      <p className="mt-1 text-xl font-bold text-white">
                        {macroCalories.toLocaleString()} kcal
                      </p>
                    </div>
                    <div className="text-right">
                      <p className="text-xs text-zinc-500">
                        Daily calorie goal
                      </p>
                      <p className="mt-1 text-xl font-bold text-lime-300">
                        {calorieValue.toLocaleString()} kcal
                      </p>
                    </div>
                  </div>
                  <p className="mt-3 text-xs leading-5 text-zinc-500">
                    Macro preview uses 4 kcal/g for protein and carbohydrates
                    and 9 kcal/g for fat. Macro targets are saved with your profile. Their calorie total may differ from your daily calorie target.
                  </p>
                </div>
              </div>
            </section>

            <section className="rounded-2xl border border-white/5 bg-[#111512] p-5 sm:p-6">
              <div className="flex items-center gap-3">
                <div className="flex h-11 w-11 items-center justify-center rounded-xl bg-lime-300/10 text-lime-300">
                  <Droplets size={22} />
                </div>
                <div>
                  <h2 className="font-bold text-white">Hydration preview</h2>
                  <p className="mt-1 text-xs text-zinc-500">
                    Sample daily water goal
                  </p>
                </div>
              </div>

              <div className="mt-5">
                <Field
                  id="hydration-goal"
                  label="Daily hydration goal"
                  value={hydration}
                  onChange={(value) => {
  setHydration(value);
  setSaved(false);
}}
                  min={250}
                  max={10000}
                  step={250}
                  suffix="mL"
                />
                <p className="mt-2 text-xs text-zinc-500">
                  This target is saved to your demo profile and is used as your daily hydration goal.
                </p>
              </div>
            </section>

            <div className="flex flex-col-reverse gap-3 sm:flex-row sm:justify-end">
              <button
                type="button"
                onClick={resetForm}
                className="inline-flex items-center justify-center gap-2 rounded-xl border border-white/10 bg-[#111512] px-5 py-3 text-sm font-semibold text-zinc-300 transition-colors hover:bg-zinc-800 hover:text-white"
              >
                <RotateCcw size={16} />
                Reset form
              </button>
              <button
                type="button"
                onClick={saveChanges}
                className="inline-flex items-center justify-center gap-2 rounded-xl bg-lime-300 px-6 py-3 text-sm font-bold text-zinc-950 transition-colors hover:bg-lime-200 focus:outline-none focus:ring-2 focus:ring-lime-300 focus:ring-offset-2 focus:ring-offset-[#080a09]"
              >
                <Save size={16} />
                Save profile &amp; goals
              </button>
            </div>
          </div>
        </div>
      </div>
  );
}
