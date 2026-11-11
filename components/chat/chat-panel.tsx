
"use client";

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
  Sparkles,
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
import { useDemo } from "@/lib/demo/demo-store";
import {
  makeDemoResponse,
  type ProposedAction,
} from "@/lib/demo/demo-chat";
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
  const {
    messages,
    addMessage,
    addFood,
    addWeight,
    addActivity,
    addWater,
  } = useDemo();

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

  function send(value: string) {
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

    // Phase 2: simulate a response locally without making a network request.
    window.setTimeout(() => {
      try {
        const response = makeDemoResponse(content);

        setPending(response.action || null);

        addMessage({
          id: `assistant-${crypto.randomUUID()}`,
          role: "assistant",
          content: response.text,
          createdAt: new Date().toISOString(),
          actionId: response.action?.kind,
        });
      } catch {
        setError(
          "We couldn't prepare a demo response. Please try your message again.",
        );
      } finally {
        setBusy(false);
      }
    }, 450);
  }

  function accept() {
    if (!pending) return;

    if (pending.kind === "food") addFood(pending.entry);
    if (pending.kind === "weight") addWeight(pending.entry);
    if (pending.kind === "activity") addActivity(pending.entry);
    if (pending.kind === "water") addWater(pending.entry);

    addMessage({
      id: `confirm-${crypto.randomUUID()}`,
      role: "assistant",
      content:
        "Your entry has been added to this demo session. Nothing was sent to a database.",
      createdAt: new Date().toISOString(),
    });

    setPending(null);
    setError("");
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
              Local demo assistant
            </p>
          </div>
        </div>

        <span className="inline-flex shrink-0 items-center gap-1.5 rounded-full border border-lime-300/15 bg-lime-300/[0.06] px-2.5 py-1.5 text-[10px] font-medium text-lime-300 sm:px-3 sm:text-xs">
          <Sparkles size={12} />
          Demo mode
        </span>
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
              Let's work on your goals
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
              Preparing a demo response…
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
                  Check the details before adding them to your demo records.
                </p>
              </div>
            </div>

            <div className="mt-4 rounded-xl border border-white/[0.06] bg-[#0c0f0d] p-3">
              {pending.kind === "food" && (
                <>
                  <p className="break-words text-sm font-medium text-white">
                    {pending.entry.name}
                  </p>
                  <p className="mt-1 text-xs text-zinc-400">
                    Approx. {pending.entry.calories} kcal ·{" "}
                    {pending.entry.protein} g protein
                  </p>
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
                className="inline-flex min-h-10 flex-1 items-center justify-center gap-2 rounded-xl bg-lime-300 px-3 py-2 text-xs font-semibold text-zinc-950 transition hover:bg-lime-200 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-lime-300"
              >
                <Check size={15} />
                Accept demo entry
              </button>

              <button
                type="button"
                onClick={cancelPending}
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
          Message FitAI Coach demo
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
            Demo data only
          </span>
        </div>
      </form>
    </Card>
  );
}
