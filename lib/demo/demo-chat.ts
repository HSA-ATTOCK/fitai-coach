
import type {
  ActivityEntry,
  FoodEntry,
  WaterEntry,
  WeightEntry,
} from "@/types/fitness";

export type ProposedAction =
  | { kind: "food"; entry: FoodEntry }
  | { kind: "weight"; entry: WeightEntry }
  | { kind: "activity"; entry: ActivityEntry }
  | { kind: "water"; entry: WaterEntry };

export function makeDemoResponse(
  input: string,
): { text: string; action?: ProposedAction } {
  const text = input.toLowerCase();
  const now = new Date().toISOString();
  const id = `demo-${crypto.randomUUID()}`;

  // Water logging
if (/(water|drink|drank|hydration|ml|litres?|liters?)/i.test(text)) {
  const match = text.match(
    /(\d+(?:\.\d+)?)\s*(ml|milliliters?|l|litres?|liters?)\b/i,
  );

  if (!match) {
    return {
      text: "How much water did you drink? Please include ml or litres, for example: I drank 500 ml water or I drank 1 litre water.",
    };
  }

  const amount = Number(match[1]);
  const unit = match[2].toLowerCase();

  const milliliters =
    unit === "l" || unit.startsWith("lit")
      ? amount * 1000
      : amount;

  if (
    !Number.isFinite(milliliters) ||
    milliliters <= 0 ||
    milliliters > 10000
  ) {
    return {
      text: "Please enter a water amount greater than 0 and no more than 10,000 ml (10 litres).",
    };
  }

  const entry: WaterEntry = {
    id,
    date: now,
    milliliters: Math.round(milliliters),
  };

  return {
    text: `I prepared a demo water entry for ${entry.milliliters} ml. Please confirm before adding it to this session.`,
    action: { kind: "water", entry },
  };
}

  // Weight logging
  if (/(weight|weigh)/i.test(text)) {
    const match = text.match(
      /(\d{1,3}(?:\.\d+)?)\s*(kg|kilograms?|lb|lbs|pounds?)?/i,
    );

    if (!match) {
      return {
        text: "What is your weight? Include kg or lb, for example: My weight is 78 kg.",
      };
    }

    const raw = Number(match[1]);
    const unit = (match[2] || "kg").toLowerCase();
    const weightKg = unit.startsWith("lb") || unit.startsWith("pound")
      ? raw / 2.20462
      : raw;

    if (!Number.isFinite(weightKg) || weightKg < 20 || weightKg > 350) {
      return {
        text: "Please enter a weight between 20 and 350 kg, or the equivalent in pounds.",
      };
    }

    const entry: WeightEntry = {
      id,
      date: now,
      weightKg: Math.round(weightKg * 10) / 10,
    };

    return {
      text: `I prepared a demo weight entry of ${entry.weightKg.toFixed(1)} kg. Confirm to add it to this session.`,
      action: { kind: "weight", entry },
    };
  }

  // Activity logging
  if (/(walk|workout|exercise|run|cycling|cycle|gym|training|swim|swimming)/i.test(text)) {
    const match = text.match(/\b(\d{1,4})\s*(?:minutes?|mins?)\b/i);

    if (!match) {
      return {
        text: "How long did you exercise? Include the duration in minutes, for example: I walked for 30 minutes.",
      };
    }

    const minutes = Number(match[1]);

    if (!Number.isInteger(minutes) || minutes < 1 || minutes > 1440) {
      return {
        text: "Please enter an activity duration between 1 and 1,440 minutes.",
      };
    }

    const name = /swim/i.test(text)
  ? "Swimming"
  : /run/i.test(text)
    ? "Run"
    : /cycl/i.test(text)
      ? "Cycling"
      : /strength|gym|training|workout/i.test(text)
        ? "Workout"
        : "Walk";

    const entry: ActivityEntry = {
      id,
      date: now,
      name,
      minutes,
    };

    return {
      text: `I prepared a ${minutes}-minute ${name.toLowerCase()} demo entry. Confirm to add it to this session.`,
      action: { kind: "activity", entry },
    };
  }

  // Food logging — nutrition values are illustrative demo estimates.
  if (
    /(ate|eat|meal|breakfast|lunch|dinner|snack|chicken|salad|egg|rice|oat|yogurt|banana|sandwich)/i.test(
      text,
    )
  ) {
    const name =
      input
        .replace(/^(log|add|i ate|i had|for lunch|for breakfast)\s*/i, "")
        .trim() || "Sample meal";

    const entry: FoodEntry = {
      id,
      name: name.slice(0, 100),
      category: /breakfast/i.test(text)
        ? "Breakfast"
        : /dinner/i.test(text)
          ? "Dinner"
          : /snack/i.test(text)
            ? "Snack"
            : "Lunch",
      date: now,
      calories: 420,
      protein: 28,
      carbs: 46,
      fat: 13,
      notes: "Illustrative demo estimate",
    };

    return {
      text: `I interpreted that as "${entry.name}". The nutrition numbers are illustrative demo estimates, not a verified nutrition calculation. Confirm to add it to this session.`,
      action: { kind: "food", entry },
    };
  }

  if (/(calorie|protein|nutrition|today)/i.test(text)) {
    return {
      text: "This is a frontend demo. Your dashboard summary uses the sample entries currently loaded in this session. Open the daily summary to review the illustrative totals.",
    };
  }

  if (/(progress|chart|trend|week)/i.test(text)) {
    return {
      text: "You can review the sample weight, calorie, protein, and activity charts on the Progress page.",
    };
  }

  return {
    text: 'I can demonstrate meal, weight, water, and workout logging. Try "I ate chicken and rice for lunch", "My weight is 78 kg", "I drank 500 ml water", or "I walked for 30 minutes." This is a local frontend demo, not a live AI assistant.',
  };
}
