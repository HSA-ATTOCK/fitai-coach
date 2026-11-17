"use client";

import type { NutritionIngredient } from "@/types/fitness";
import { createClient } from "@/lib/supabase/client";
import {
  useRef,
  useState,
  useEffect,
  type FormEvent,
  type KeyboardEvent,
} from "react";
import {
  Bot,
  Send,
  UserRound,
  Check,
  X,
  LoaderCircle,
  Utensils,
  Droplets,
  Scale,
  Footprints,
  MessageCircle,
} from "lucide-react";
import { useChat } from "@/lib/chat/chat-store";
import type { ProposedAction } from "@/lib/chat/chat-types";
import { Card } from "@/components/ui/primitives";


type QuickAction = "food" | "water" | "weight" | "activity";

const quickPrompts: {
  label: string;
  message: string;
  question: string;
  placeholder: string;
  icon: typeof Utensils;
  action: QuickAction;
}[] = [
  {
    label: "Log a meal",
    message: "What did you eat? Include the portion size if possible.",
    question: "What did you eat? Include the portion size if possible.",
    placeholder: "e.g. 2 eggs and 2 slices of toast",
    icon: Utensils,
    action: "food",
  },
  {
    label: "Log water",
    message: "How much water did you drink?",
    question: "How much water did you drink? You can enter ml or litres.",
    placeholder: "e.g. 500 ml",
    icon: Droplets,
    action: "water",
  },
  {
    label: "Log weight",
    message: "What is your current weight in kg?",
    question: "What is your current weight in kg?",
    placeholder: "e.g. 72.5 kg",
    icon: Scale,
    action: "weight",
  },
  {
    label: "Log a walk",
    message: "What activity did you do, and for how many minutes?",
    question: "What activity did you do, and for how long?",
    placeholder: "e.g. walked for 30 minutes",
    icon: Footprints,
    action: "activity",
  },
];


function buildQuickActionMessage(action: QuickAction, answer: string) {
  const value = answer.trim();

  switch (action) {
    case "food":
      return /^(i ate|i had|i consumed|i logged|log meal|meal:)/i.test(value)
        ? value
        : `I ate ${value}`;

    case "water":
      return /^(i drank|i drink|i had|drank|water:)/i.test(value)
        ? value
        : `I drank ${value} water`;

    case "weight":
      return /^(my weight|i weigh|weight:)/i.test(value)
        ? value
        : `My weight is ${value}`;

    case "activity":
  if (
    /^(i walked|i ran|i jogged|i cycled|i swam|i exercised|i did|i completed|activity:)/i.test(value)
  ) {
    return value;
  }

  // The "Log a walk" quick action already tells us
  // which activity the user wants to log.
  if (/^\d+(?:\.\d+)?\s*(?:minutes?|mins?)$/i.test(value)) {
    return `I walked for ${value}`;
  }

  return `I did ${value}`;
  }
}

function resolveActivityFollowUp(
  answer: string,
  messages: { role: string; content: string }[],
): string {
  const value = answer.trim();

  // Only interpret a duration-only answer as a follow-up
  // when the assistant just asked about exercise duration.
  if (!/^\d+(?:\.\d+)?\s*(?:minutes?|mins?)$/i.test(value)) {
    return value;
  }

  const lastAssistantIndex = messages.findLastIndex(
    (message) => message.role === "assistant",
  );

  if (lastAssistantIndex === -1) return value;

  const lastAssistant = messages[lastAssistantIndex].content;

  if (!/how long did you exercise|include the duration/i.test(lastAssistant)) {
    return value;
  }

  // Find the user's activity message before the duration question.
  const previousUser = messages
    .slice(0, lastAssistantIndex)
    .findLast((message) => message.role === "user");

  if (!previousUser) return value;

  const activityMatch = previousUser.content.match(
    /\b(walked|ran|jogged|cycled|swam|exercised|worked out)\b/i,
  );

  if (!activityMatch) return value;

  const activity = activityMatch[1].toLowerCase();

  return `I ${activity} for ${value}`;
}

export function ChatPanel() {
const { messages, addMessage } = useChat();

  const [supabase] = useState(() => createClient());
const [isAccepting, setIsAccepting] = useState(false);

  const [input, setInput] = useState("");
  const [busy, setBusy] = useState(false);
  const [quickAction, setQuickAction] = useState<QuickAction | null>(null);
const [inputPlaceholder, setInputPlaceholder] = useState(
  "Tell me about your meals or activity…",
);
  const [pending, setPending] = useState<ProposedAction | null>(null);
  const [error, setError] = useState("");
  const bottomRef = useRef<HTMLDivElement>(null);
  const textareaRef = useRef<HTMLTextAreaElement>(null);

  useEffect(() => {
    bottomRef.current?.scrollIntoView({
      behavior: "smooth",
      block: "end",
    });
  }, [messages.length, busy, pending]);

  
function startQuickAction(prompt: (typeof quickPrompts)[number]) {
  if (busy || pending) return;

  setError("");
  setQuickAction(prompt.action);
  setInput("");
  setInputPlaceholder(prompt.placeholder);

  addMessage({
    id: `assistant-${crypto.randomUUID()}`,
    role: "assistant",
    content: prompt.question,
    createdAt: new Date().toISOString(),
  });

  textareaRef.current?.focus();
}

  
async function send(value: string) {
  const answer = value.trim();

  const content = quickAction
    ? buildQuickActionMessage(quickAction, answer)
    : resolveActivityFollowUp(answer, messages);

  if (!content || busy) return;

  if (pending) {
    setError(
      "Please accept or cancel the proposed entry before sending another message.",
    );
    return;
  }

  setError("");
  setInput("");
  setQuickAction(null);
  setInputPlaceholder("Tell me about your meals or activity…");

  addMessage({
    id: `user-${crypto.randomUUID()}`,
    role: "user",
    content,
    createdAt: new Date().toISOString(),
  });

  setBusy(true);

  try {
    const conversation = [
      ...messages.slice(-19).map((message) => ({
        role: message.role,
        content: message.content,
      })),
      {
        role: "user" as const,
        content,
      },
    ];

    const response = await fetch("/api/chat", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        messages: conversation,
      }),
    });

    const result = (await response.json()) as {
      text?: string;
      action?: ProposedAction | null;
      error?: string;
    };

    if (!response.ok) {
      throw new Error(
        result.error || "The AI assistant could not process your message.",
      );
    }

    if (!result.text) {
      throw new Error("The AI assistant returned an empty response.");
    }

    setPending(result.action ?? null);

    addMessage({
      id: `assistant-${crypto.randomUUID()}`,
      role: "assistant",
      content: result.text,
      createdAt: new Date().toISOString(),
      actionId: result.action?.kind,
    });
  } catch (err) {
    setError(
      err instanceof Error
        ? err.message
        : "Something went wrong. Please try again.",
    );
  } finally {
    setBusy(false);
  }
}

function updateFoodIngredient(
  index: number,
  field: keyof NutritionIngredient,
  value: string,
) {
  if (!pending || pending.kind !== "food") return;

  const ingredients = (pending.entry.ingredients ?? []).map(
    (ingredient, i) => {
      if (i !== index) return ingredient;

      if (field === "name" || field === "portion") {
        return { ...ingredient, [field]: value };
      }

      return {
        ...ingredient,
        [field]: Math.max(0, Number(value) || 0),
      };
    },
  );

  const totals = ingredients.reduce(
    (total, ingredient) => ({
      calories: total.calories + ingredient.calories,
      protein: total.protein + ingredient.protein,
      carbs: total.carbs + ingredient.carbs,
      fat: total.fat + ingredient.fat,
    }),
    { calories: 0, protein: 0, carbs: 0, fat: 0 },
  );

  setPending({
    ...pending,
    entry: {
      ...pending.entry,
      ingredients,
      calories: Math.round(totals.calories),
      protein: Math.round(totals.protein * 10) / 10,
      carbs: Math.round(totals.carbs * 10) / 10,
      fat: Math.round(totals.fat * 10) / 10,
    },
  });
}

  async function accept() {
  if (!pending || isAccepting) return;

  setIsAccepting(true);
  setError("");

  try {
    // Save confirmed meals to Supabase.
    if (pending.kind === "food") {
      const {
        data: { user },
        error: authError,
      } = await supabase.auth.getUser();

      if (authError || !user) {
        throw new Error("Your session has expired. Please log in again.");
      }

      const { error: insertError } = await supabase
  .from("meals")
  .insert({
    user_id: user.id,
    meal_type: pending.entry.category.toLowerCase(),
    description: pending.entry.name,
    calories: pending.entry.calories,
    protein_g: pending.entry.protein,
    carbs_g: pending.entry.carbs,
    fat_g: pending.entry.fat,
    logged_at: pending.entry.date,
    ingredients: pending.entry.ingredients ?? [],
  });

      if (insertError) {
        throw new Error(insertError.message);
      }

      addMessage({
        id: `confirm-${crypto.randomUUID()}`,
        role: "assistant",
        content:
          "Your meal has been successfully saved to your account. You can view it in Food History.",
        createdAt: new Date().toISOString(),
      });
    } else if (pending.kind === "water") {
  // Get the logged-in user.
  const {
    data: { user },
    error: userError,
  } = await supabase.auth.getUser();

  if (userError) throw userError;

  if (!user) {
    throw new Error("Please log in before saving water entries.");
  }

  // Save water entry to Supabase.
  const { error: insertError } = await supabase
    .from("water_logs")
    .insert({
      user_id: user.id,
      amount_ml: pending.entry.milliliters,
      logged_at: pending.entry.date,
    });

  if (insertError) throw insertError;

  addMessage({
    id: `confirm-${crypto.randomUUID()}`,
    role: "assistant",
    content: `Successfully saved ${pending.entry.milliliters} ml of water to your account.`,
    createdAt: new Date().toISOString(),
  });
} else if (pending.kind === "weight") {
  // Get the logged-in user.
  const {
    data: { user },
    error: userError,
  } = await supabase.auth.getUser();

  if (userError) throw userError;

  if (!user) {
    throw new Error("Please log in before saving weight entries.");
  }

  // Save weight entry to Supabase.
  const { error: insertError } = await supabase
    .from("weight_logs")
    .insert({
      user_id: user.id,
      weight_kg: pending.entry.weightKg,
      notes: "Logged via FitAI chat",
      logged_at: pending.entry.date,
    });

  if (insertError) throw insertError;

  addMessage({
    id: `confirm-${crypto.randomUUID()}`,
    role: "assistant",
    content: `Successfully saved your weight of ${pending.entry.weightKg.toFixed(1)} kg to your account.`,
    createdAt: new Date().toISOString(),
  });
} else if (pending.kind === "activity") {
  // Get the logged-in user.
  const {
    data: { user },
    error: userError,
  } = await supabase.auth.getUser();

  if (userError) throw userError;

  if (!user) {
    throw new Error("Please log in before saving activity entries.");
  }

  // Save activity to Supabase.
  const { error: insertError } = await supabase
    .from("activities")
    .insert({
      user_id: user.id,
      activity_type: pending.entry.name.toLowerCase(),
      duration_minutes: pending.entry.minutes,
      notes: "Logged via FitAI chat",
      logged_at: pending.entry.date,
    });

  if (insertError) throw insertError;

  addMessage({
    id: `confirm-${crypto.randomUUID()}`,
    role: "assistant",
    content: `Successfully saved your ${pending.entry.name.toLowerCase()} activity (${pending.entry.minutes} minutes) to your account.`,
    createdAt: new Date().toISOString(),
  });
}


else if (pending.kind === "workout") {
  const {
    data: { user },
    error: userError,
  } = await supabase.auth.getUser();

  if (userError) throw userError;

  if (!user) {
    throw new Error("Please log in before saving workouts.");
  }

  // First, save the main workout session.
  const { data: activity, error: activityError } = await supabase
    .from("activities")
    .insert({
      user_id: user.id,
      entry_source: "ai_chat",
      activity_type: pending.entry.name.toLowerCase(),
      duration_minutes: pending.entry.minutes,
      calories_burned: pending.entry.caloriesBurned ?? 0,
      distance_km: pending.entry.distanceKm ?? null,
      notes: "Gym workout logged via FitAI chat",
      logged_at: pending.entry.date,
    })
    .select("id")
    .single();

  if (activityError) throw activityError;

  // Then, save every individual exercise.
  const exerciseRows = pending.entry.exercises.map((exercise) => ({
    activity_id: activity.id,
    user_id: user.id,
    exercise_name: exercise.exerciseName,
    sets: exercise.sets,
    reps: exercise.reps,
    weight_kg: exercise.weightKg,
    notes: exercise.notes || null,
  }));

  const { error: exerciseError } = await supabase
    .from("workout_exercises")
    .insert(exerciseRows);

  if (exerciseError) {
    // Roll back the workout if its exercises cannot be saved.
    const { error: rollbackError } = await supabase
      .from("activities")
      .delete()
      .eq("id", activity.id)
      .eq("user_id", user.id);

    if (rollbackError) {
      console.error("Workout rollback failed:", rollbackError);
      throw new Error(
        "Exercise saving failed, and the workout could not be rolled back. Please check your Exercise History."
      );
    }

    throw new Error(
      `Could not save workout exercises: ${exerciseError.message}`
    );
  }

  addMessage({
    id: `confirm-${crypto.randomUUID()}`,
    role: "assistant",
    content: `Successfully saved your ${pending.entry.name} workout with ${pending.entry.exercises.length} exercises (${pending.entry.minutes} minutes).`,
    createdAt: new Date().toISOString(),
  });
}

    setPending(null);
  } catch (err) {
    setError(
      err instanceof Error
        ? err.message
        : "We couldn't save your entry. Please try again.",
    );
  } finally {
    setIsAccepting(false);
  }
}

  function cancelPending() {
    setPending(null);
    setError("");
  }

  function submit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    send(input);
  }

  function keyDown(event: KeyboardEvent<HTMLTextAreaElement>) {
    if (event.key === "Enter" && !event.shiftKey) {
      event.preventDefault();
      send(input);
    }
  }

  return (
    <Card className="flex h-[min(720px,calc(100dvh-180px))] min-h-[500px] flex-col overflow-hidden border-white/[0.08] bg-[#101311] shadow-2xl shadow-black/20">
      {/* Chat header */}
      <div className="flex items-center justify-between gap-3 border-b border-white/[0.07] px-4 py-4 sm:px-5">
        <div className="flex min-w-0 items-center gap-3">
          <div className="relative flex h-11 w-11 shrink-0 items-center justify-center rounded-2xl border border-lime-300/15 bg-lime-300/[0.08] text-lime-300">
            <Bot size={23} />
            <span className="absolute -bottom-1 -right-1 h-3 w-3 rounded-full border-2 border-[#101311] bg-lime-300" />
          </div>

          <div className="min-w-0">
            <h2 className="truncate text-sm font-semibold text-white sm:text-base">
              FitAI Assistant
            </h2>
            <p className="mt-1 flex items-center gap-1.5 text-[11px] text-zinc-500">
              <span className="h-1.5 w-1.5 rounded-full bg-lime-300/80" />
              Meal logging connected
            </p>
          </div>
        </div>

      </div>

      {/* Quick prompts */}
      <div className="border-b border-white/[0.06] px-4 py-3.5 sm:px-5">
        <p className="mb-2.5 text-[10px] font-semibold uppercase tracking-[0.16em] text-zinc-500">
          Quick actions
        </p>

        <div className="grid grid-cols-2 gap-2 sm:grid-cols-4">
          {quickPrompts.map((prompt) => {
            const Icon = prompt.icon;

            return (
              <button
                key={prompt.label}
                type="button"
                onClick={() => startQuickAction(prompt)}
                disabled={busy || Boolean(pending)}
                title={prompt.message}
                className="flex min-h-10 items-center justify-center gap-2 rounded-xl border border-white/[0.08] bg-[#171b18] px-2 py-2 text-xs font-medium text-zinc-300 transition hover:border-lime-300/30 hover:bg-lime-300/[0.05] hover:text-lime-300 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-lime-300 disabled:cursor-not-allowed disabled:opacity-40"
              >
                <Icon size={14} className="shrink-0" />
                <span>{prompt.label}</span>
              </button>
            );
          })}
        </div>
      </div>

      {/* Messages */}
      <div
        className="min-h-0 flex-1 space-y-5 overflow-y-auto overscroll-contain px-3 py-5 sm:px-5"
        aria-live="polite"
        aria-relevant="additions text"
      >
        {messages.length === 0 && (
          <div className="flex min-h-full flex-col items-center justify-center px-3 py-8 text-center">
            <div className="flex h-16 w-16 items-center justify-center rounded-3xl border border-lime-300/15 bg-lime-300/[0.06] text-lime-300">
              <MessageCircle size={29} />
            </div>

            <h3 className="mt-5 text-lg font-semibold text-white">
              Let&apos;s work on your goals
            </h3>

            <p className="mt-2 max-w-xs text-sm leading-6 text-zinc-500">
              Tell me what you ate, how much water you drank, your weight,
              or what activity you completed.
            </p>

            <p className="mt-4 text-xs text-zinc-600">
              Choose a quick action above or type your first message below.
            </p>
          </div>
        )}

        {messages.map((message) => {
          const isAssistant = message.role === "assistant";

          return (
            <div
              key={message.id}
              className={`flex items-end gap-2.5 ${
                isAssistant ? "" : "flex-row-reverse"
              }`}
            >
              <div
                className={`flex h-8 w-8 shrink-0 items-center justify-center rounded-xl ${
                  isAssistant
                    ? "border border-lime-300/10 bg-lime-300/[0.07] text-lime-300"
                    : "bg-zinc-800 text-zinc-300"
                }`}
              >
                {isAssistant ? (
                  <Bot size={16} />
                ) : (
                  <UserRound size={16} />
                )}
              </div>

              <div
                className={`min-w-0 max-w-[88%] rounded-2xl px-3.5 py-3 sm:max-w-[80%] sm:px-4 ${
                  isAssistant
                    ? "rounded-bl-sm border border-white/[0.05] bg-[#191d1a] text-zinc-300"
                    : "rounded-br-sm bg-lime-300 text-zinc-950"
                }`}
              >
                <p className="whitespace-pre-wrap break-words text-sm leading-6">
                  {message.content}
                </p>

                <time
                  className={`mt-2 block text-[10px] ${
                    isAssistant ? "text-zinc-600" : "text-zinc-700"
                  }`}
                >
                  {new Date(message.createdAt).toLocaleTimeString([], {
                    hour: "2-digit",
                    minute: "2-digit",
                  })}
                </time>
              </div>
            </div>
          );
        })}

        {busy && (
          <div className="flex items-center gap-2.5">
            <div className="flex h-8 w-8 items-center justify-center rounded-xl bg-lime-300/[0.07] text-lime-300">
              <Bot size={16} />
            </div>

            <div className="flex items-center gap-2 rounded-2xl rounded-bl-sm border border-white/[0.05] bg-[#191d1a] px-4 py-3 text-sm text-zinc-400">
              <LoaderCircle size={15} className="animate-spin text-lime-300" />
              FitAI is thinking…
            </div>
          </div>
        )}

        {pending && (
          <div className="ml-2 rounded-2xl border border-lime-300/20 bg-lime-300/[0.04] p-4 sm:ml-10">
            <div className="flex items-start gap-3">
              <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-xl bg-lime-300/10 text-lime-300">
                <Check size={18} />
              </div>

              <div className="min-w-0">
                <h3 className="text-sm font-semibold text-white">
                  Review your entry
                </h3>
                <p className="mt-1 text-xs leading-5 text-zinc-500">
                  Check the details before saving your entry.
                </p>
              </div>
            </div>

            <div className="mt-4 rounded-xl border border-white/[0.06] bg-[#0c0f0d] p-3">
              {pending.kind === "food" && (
  <>
    <p className="break-words text-sm font-semibold text-white">
      {pending.entry.name}
    </p>

    <p className="mt-1 text-xs text-zinc-500">
      Edit ingredient details and the meal totals will update automatically.
    </p>

    <div className="mt-4 space-y-3">
      {(pending.entry.ingredients ?? []).map((ingredient, index) => (
        <div
          key={`${ingredient.name}-${index}`}
          className="rounded-xl border border-white/[0.07] bg-[#151916] p-3"
        >
          <p className="mb-2 text-xs font-semibold text-lime-300">
            Ingredient {index + 1}
          </p>

          <div className="grid grid-cols-1 gap-2 sm:grid-cols-2">
            <label className="text-[11px] text-zinc-400">
              Ingredient name
              <input
                value={ingredient.name}
                onChange={(event) =>
                  updateFoodIngredient(index, "name", event.target.value)
                }
                className="mt-1 w-full rounded-lg border border-white/10 bg-[#0c0f0d] px-2.5 py-2 text-xs text-white outline-none focus:border-lime-300/40"
              />
            </label>

            <label className="text-[11px] text-zinc-400">
              Portion
              <input
                value={ingredient.portion}
                onChange={(event) =>
                  updateFoodIngredient(index, "portion", event.target.value)
                }
                className="mt-1 w-full rounded-lg border border-white/10 bg-[#0c0f0d] px-2.5 py-2 text-xs text-white outline-none focus:border-lime-300/40"
              />
            </label>
          </div>

          <div className="mt-3 grid grid-cols-2 gap-2 sm:grid-cols-4">
            {([
              ["calories", "Calories", "kcal"],
              ["protein", "Protein", "g"],
              ["carbs", "Carbs", "g"],
              ["fat", "Fat", "g"],
            ] as const).map(([field, label, unit]) => (
              <label key={field} className="text-[11px] text-zinc-400">
                {label} ({unit})
                <input
                  type="number"
                  min="0"
                  step="0.1"
                  value={ingredient[field]}
                  onChange={(event) =>
                    updateFoodIngredient(index, field, event.target.value)
                  }
                  className="mt-1 w-full rounded-lg border border-white/10 bg-[#0c0f0d] px-2.5 py-2 text-xs text-white outline-none focus:border-lime-300/40"
                />
              </label>
            ))}
          </div>
        </div>
      ))}
    </div>

    <div className="mt-4 rounded-xl border border-lime-300/15 bg-lime-300/[0.05] p-3">
      <p className="text-[10px] font-semibold uppercase tracking-wider text-zinc-400">
        Updated meal totals
      </p>

      <p className="mt-1 text-2xl font-bold text-lime-300">
        {pending.entry.calories} kcal
      </p>

      <div className="mt-2 grid grid-cols-3 gap-2 text-xs">
        <div>
          <p className="text-zinc-500">Protein</p>
          <p className="font-semibold text-white">
            {pending.entry.protein} g
          </p>
        </div>

        <div>
          <p className="text-zinc-500">Carbs</p>
          <p className="font-semibold text-white">
            {pending.entry.carbs} g
          </p>
        </div>

        <div>
          <p className="text-zinc-500">Fat</p>
          <p className="font-semibold text-white">
            {pending.entry.fat} g
          </p>
        </div>
      </div>
    </div>

    <p className="mt-2 text-[10px] leading-4 text-zinc-500">
      Nutrition values are estimates. Review and adjust them before saving.
    </p>
  </>
)}


{pending.kind === "workout" && (
  <>
    <p className="break-words text-sm font-semibold text-white">
      {pending.entry.name}
    </p>

    <div className="mt-2 flex flex-wrap gap-3 text-xs text-zinc-400">
      <span>{pending.entry.minutes} minutes</span>
      <span>{pending.entry.exercises.length} exercises</span>
    </div>

    <div className="mt-4 space-y-2">
      {pending.entry.exercises.map((exercise, index) => (
        <div
          key={`${exercise.exerciseName}-${index}`}
          className="rounded-xl border border-white/[0.07] bg-[#151916] p-3"
        >
          <p className="text-sm font-semibold text-lime-300">
            {index + 1}. {exercise.exerciseName}
          </p>

          <div className="mt-2 grid grid-cols-3 gap-2 text-xs">
            <div>
              <p className="text-zinc-500">Sets</p>
              <p className="font-semibold text-white">
                {exercise.sets}
              </p>
            </div>

            <div>
              <p className="text-zinc-500">Reps</p>
              <p className="font-semibold text-white">
                {exercise.reps}
              </p>
            </div>

            <div>
              <p className="text-zinc-500">Weight</p>
              <p className="font-semibold text-white">
                {exercise.weightKg} kg
              </p>
            </div>
          </div>

          {exercise.notes && (
            <p className="mt-2 text-xs text-zinc-500">
              {exercise.notes}
            </p>
          )}
        </div>
      ))}
    </div>
  </>
)}


              {pending.kind === "weight" && (
                <>
                  <p className="text-xs text-zinc-500">Body weight</p>
                  <p className="mt-1 text-xl font-semibold text-white">
                    {pending.entry.weightKg.toFixed(1)}{" "}
                    <span className="text-sm font-normal text-zinc-400">
                      kg
                    </span>
                  </p>
                </>
              )}

              {pending.kind === "activity" && (
                <>
                  <p className="break-words text-sm font-medium text-white">
                    {pending.entry.name}
                  </p>
                  <p className="mt-1 text-xs text-zinc-400">
                    {pending.entry.minutes} minutes
                  </p>
                </>
              )}

              {pending.kind === "water" && (
                <>
                  <p className="text-xs text-zinc-500">Water intake</p>
                  <p className="mt-1 text-xl font-semibold text-white">
                    {pending.entry.milliliters}{" "}
                    <span className="text-sm font-normal text-zinc-400">
                      ml
                    </span>
                  </p>
                </>
              )}
            </div>

            <div className="mt-3 flex flex-col gap-2 sm:flex-row">
              <button
                type="button"
                onClick={accept}
                disabled={isAccepting}
                className="inline-flex min-h-10 flex-1 items-center justify-center gap-2 rounded-xl bg-lime-300 px-3 py-2 text-xs font-semibold text-zinc-950 transition hover:bg-lime-200 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-lime-300"
              >
                <Check size={15} />
{isAccepting
  ? "Saving..."
  : pending.kind === "food"
    ? "Save meal"
    : pending.kind === "water"
      ? "Save water"
      : pending.kind === "weight"
        ? "Save weight"
        : pending.kind === "activity"
  ? "Save activity"
  : pending.kind === "workout"
    ? "Save workout"
    : "Save entry"}
              </button>

              <button
                type="button"
                onClick={cancelPending}
                disabled={isAccepting}
                className="inline-flex min-h-10 items-center justify-center gap-2 rounded-xl border border-white/10 px-3 py-2 text-xs text-zinc-300 transition hover:bg-white/[0.04] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-zinc-400"
              >
                <X size={15} />
                Cancel
              </button>
            </div>
          </div>
        )}

        {error && (
          <div
            role="alert"
            className="rounded-xl border border-red-500/20 bg-red-500/[0.06] p-3 text-sm text-red-300"
          >
            <p>{error}</p>
            <button
              type="button"
              onClick={() => {
                setError("");
                textareaRef.current?.focus();
              }}
              className="mt-2 text-xs underline underline-offset-4 hover:text-red-200"
            >
              Dismiss and continue
            </button>
          </div>
        )}

        <div ref={bottomRef} />
      </div>

      {/* Message composer */}
      <form
        onSubmit={submit}
        className="shrink-0 border-t border-white/[0.07] bg-[#0c0f0d] p-3 sm:p-4"
      >
        <label htmlFor="chat-message" className="sr-only">
          Message FitAI Coach
        </label>

        <div className="rounded-2xl border border-white/10 bg-[#171b18] p-2 transition focus-within:border-lime-300/40 focus-within:ring-1 focus-within:ring-lime-300/10">
          <div className="flex items-end gap-2">
            <textarea
              ref={textareaRef}
              id="chat-message"
              value={input}
              onChange={(event) => setInput(event.target.value)}
              onKeyDown={keyDown}
              rows={1}
              placeholder={inputPlaceholder}
              aria-label="Write a message"
              className="max-h-32 min-h-11 min-w-0 flex-1 resize-y bg-transparent px-2 py-3 text-sm leading-5 text-white outline-none placeholder:text-zinc-600"
              disabled={busy || Boolean(pending)}
            />

            <button
              type="submit"
              aria-label="Send message"
              title="Send message"
              disabled={!input.trim() || busy || Boolean(pending)}
              className="flex h-11 w-11 shrink-0 items-center justify-center rounded-xl bg-lime-300 text-zinc-950 transition hover:bg-lime-200 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-lime-300 focus-visible:ring-offset-2 focus-visible:ring-offset-[#171b18] disabled:cursor-not-allowed disabled:opacity-35"
            >
              <Send size={17} />
            </button>
          </div>
        </div>

        <div className="mt-2 flex flex-wrap items-center justify-between gap-2 px-1 text-[10px] text-zinc-600">
          <span>Enter to send · Shift + Enter for a new line</span>
          <span className="inline-flex items-center gap-1">
            <span className="h-1.5 w-1.5 rounded-full bg-lime-300/70" />
            Meals save to your account
          </span>
        </div>
      </form>
    </Card>
  );
}
