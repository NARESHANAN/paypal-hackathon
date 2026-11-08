import { generateObject } from "ai";
import { google } from "@ai-sdk/google";
import { NextResponse } from "next/server";
import { z } from "zod";
import {
  calculateTransfers,
  parseExpensesLocally,
  type Expense,
} from "@/lib/split";
import {
  CURRENCY_OPTIONS,
  currencyFractionDigits,
  DEFAULT_CURRENCY,
} from "@/lib/region";

export const runtime = "nodejs";

const expenseSchema = z.object({
  expenses: z.array(
    z.object({
      payer: z.string(),
      amount: z.number().positive(),
      description: z.string(),
      excluded: z.array(z.string()),
    }),
  ),
});

function validateExpenses(
  value: unknown,
  participants: string[],
  currency: string,
): Expense[] {
  if (!Array.isArray(value)) {
    throw new Error("The parser did not return an expense list.");
  }
  const names = new Map(participants.map((name) => [name.toLowerCase(), name]));

  return value.map((item, index) => {
    if (!item || typeof item !== "object") {
      throw new Error(`Expense ${index + 1} is not valid.`);
    }
    const candidate = item as Record<string, unknown>;
    const payer =
      typeof candidate.payer === "string"
        ? names.get(candidate.payer.trim().toLowerCase())
        : undefined;
    const rawAmount = Number(candidate.amount);
    const fractionDigits = currencyFractionDigits(currency);
    const amount =
      Math.round(rawAmount * 10 ** fractionDigits) / 10 ** fractionDigits;
    if (!payer || !Number.isFinite(amount) || amount <= 0) {
      throw new Error(
        `Expense ${index + 1} needs a known payer and positive amount.`,
      );
    }
    const excluded = Array.isArray(candidate.excluded)
      ? candidate.excluded
          .filter((name): name is string => typeof name === "string")
          .map((name) => names.get(name.trim().toLowerCase()))
          .filter((name): name is string => Boolean(name))
      : [];
    return {
      payer,
      amount: Math.round(amount * 100) / 100,
      description:
        typeof candidate.description === "string" &&
        candidate.description.trim()
          ? candidate.description.trim().slice(0, 100)
          : "Group expense",
      excluded: [...new Set(excluded)],
    };
  });
}

async function parseWithGemini(chat: string, participants: string[]) {
  const { object } = await generateObject({
    model: google("gemini-2.5-flash"),
    schema: expenseSchema,
    system:
      "Extract clearly stated group expenses from the chat. " +
      "Use only the supplied participant names. If the payer says I or me, " +
      "map them to You if that participant is listed. Add a participant to " +
      "excluded only when the chat explicitly says they did not participate. " +
      "Do not invent expenses, names, or amounts.",
    prompt: JSON.stringify({ participants, chat }),
  });

  return object.expenses;
}

export async function POST(request: Request) {
  try {
    const body = (await request.json()) as {
      chat?: unknown;
      participants?: unknown;
      currency?: unknown;
    };
    if (typeof body.chat !== "string" || !body.chat.trim()) {
      return NextResponse.json(
        { error: "Paste a chat to get started." },
        { status: 400 },
      );
    }
    if (body.chat.length > 20_000) {
      return NextResponse.json(
        { error: "Chat text must be 20,000 characters or fewer." },
        { status: 413 },
      );
    }
    if (!Array.isArray(body.participants)) {
      return NextResponse.json(
        { error: "Add at least two participants." },
        { status: 400 },
      );
    }
    const participants = [
      ...new Set(
        body.participants
          .filter((name): name is string => typeof name === "string")
          .map((name) => name.trim())
          .filter(Boolean),
      ),
    ];
    if (participants.length < 2 || participants.length > 20) {
      return NextResponse.json(
        { error: "Add between 2 and 20 participants." },
        { status: 400 },
      );
    }
    const currency =
      typeof body.currency === "string" ? body.currency : DEFAULT_CURRENCY;
    if (!CURRENCY_OPTIONS.some(([code]) => code === currency)) {
      return NextResponse.json(
        { error: "Choose a supported currency." },
        { status: 400 },
      );
    }

    const useAI = Boolean(process.env.GOOGLE_GENERATIVE_AI_API_KEY);
    const parsedExpenses = useAI
      ? await parseWithGemini(body.chat, participants)
      : parseExpensesLocally(body.chat, participants);
    const expenses = validateExpenses(parsedExpenses, participants, currency);
    if (!expenses.length) {
      return NextResponse.json(
        {
          error: useAI
            ? "No clear expenses were found. Check the names and amounts, then try again."
            : "No recognizable expenses found. Add an expense like “Raju paid 1500 for dinner”.",
        },
        { status: 422 },
      );
    }

    return NextResponse.json({
      expenses,
      transfers: calculateTransfers(
        participants,
        expenses,
        currencyFractionDigits(currency),
      ),
      participants,
      currency,
      parser: useAI ? "ai" : "local",
    });
  } catch (error) {
    const message =
      error instanceof Error
        ? error.message
        : "Something went wrong while splitting.";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
