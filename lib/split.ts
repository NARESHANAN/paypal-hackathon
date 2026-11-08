export type Expense = {
  payer: string;
  amount: number;
  description: string;
  excluded: string[];
};

export type Transfer = {
  from: string;
  to: string;
  amount: number;
};

export type SplitResult = {
  expenses: Expense[];
  transfers: Transfer[];
  participants: string[];
};

function normalizedName(name: string) {
  return name.trim().toLocaleLowerCase();
}

export function calculateTransfers(
  participants: string[],
  expenses: Expense[],
  fractionDigits = 2,
): Transfer[] {
  const unit = 10 ** fractionDigits;
  const balances = new Map<string, number>();
  const canonicalNames = new Map<string, string>();

  for (const name of participants) {
    canonicalNames.set(normalizedName(name), name);
    balances.set(name, 0);
  }

  for (const expense of expenses) {
    if (!Number.isFinite(expense.amount) || expense.amount <= 0) continue;

    const expenseUnits = Math.round(expense.amount * unit);
    if (!Number.isSafeInteger(expenseUnits) || expenseUnits <= 0) continue;
    const payer = canonicalNames.get(normalizedName(expense.payer));
    if (!payer) continue;
    const excluded = new Set(
      expense.excluded
        .map((name) => canonicalNames.get(normalizedName(name)))
        .filter((name): name is string => Boolean(name)),
    );
    const included = participants.filter((name) => !excluded.has(name));
    if (!included.length) continue;

    const baseShare = Math.floor(expenseUnits / included.length);
    const remainder = expenseUnits % included.length;
    for (const [index, name] of included.entries()) {
      const share = baseShare + (index < remainder ? 1 : 0);
      balances.set(name, (balances.get(name) ?? 0) + share);
    }
    balances.set(payer, (balances.get(payer) ?? 0) - expenseUnits);
  }

  const debtors = participants
    .map((name) => ({ name, amount: balances.get(name) ?? 0 }))
    .filter((entry) => entry.amount > 0)
    .sort((a, b) => b.amount - a.amount);
  const creditors = participants
    .map((name) => ({ name, amount: -(balances.get(name) ?? 0) }))
    .filter((entry) => entry.amount > 0)
    .sort((a, b) => b.amount - a.amount);

  const transfers: Transfer[] = [];
  let debtorIndex = 0;
  let creditorIndex = 0;

  while (debtorIndex < debtors.length && creditorIndex < creditors.length) {
    const debtor = debtors[debtorIndex];
    const creditor = creditors[creditorIndex];
    const amount = Math.min(debtor.amount, creditor.amount);

    if (amount > 0) {
      transfers.push({
        from: debtor.name,
        to: creditor.name,
        amount: amount / unit,
      });
    }
    debtor.amount -= amount;
    creditor.amount -= amount;
    if (debtor.amount === 0) debtorIndex += 1;
    if (creditor.amount === 0) creditorIndex += 1;
  }

  return transfers;
}

export function parseExpensesLocally(
  chat: string,
  participants: string[],
): Expense[] {
  const expenses: Expense[] = [];
  const lines = chat.split(/\r?\n/).map((line) =>
    line
      .replace(/^\s*\[[^\]]+\]\s*/, "")
      .replace(/^\s*\d{1,2}\/\d{1,2}\/\d{2,4},?\s+\d{1,2}:\d{2}(?:\s*[ap]m)?\s+-\s+/i, ""),
  );

  for (const line of lines) {
    const amountMatch = line.match(
      /\b(?:paid|covered|spent)\b[\s\S]{0,60}?(?:₹|rs\.?\s*)?(\d[\d,]*(?:\.\d{1,2})?)/i,
    );
    if (!amountMatch) continue;
    const amount = Number(amountMatch[1].replace(/,/g, ""));
    if (!Number.isFinite(amount) || amount <= 0) continue;

    const payer = participants.find((name) =>
      new RegExp(
        `\\b${name.replace(/[.*+?^${}()|[\]\\]/g, "\\$&")}\\b\\s*:?\\s*(?:paid|covered|spent)\\b`,
        "i",
      ).test(line),
    );
    const selfPayer = /\b(?:i|me)\s+(?:paid|covered|spent)\b/i.test(line);
    const resolvedPayer = payer ?? (selfPayer ? participants.find((name) => /^you$/i.test(name)) : undefined);
    if (!resolvedPayer) continue;

    const exclusions: string[] = [];
    const exclusionPattern =
      /(?:but|except|excluding)\s+(.+?)(?:\s+(?:didn't|did not|wasn't|was not|isn't|is not)\b|$)/i;
    const exclusionMatch = line.match(exclusionPattern);
    if (exclusionMatch) {
      for (const name of participants) {
        if (new RegExp(`\\b${name.replace(/[.*+?^${}()|[\]\\]/g, "\\$&")}\\b`, "i").test(exclusionMatch[1])) {
          exclusions.push(name);
        }
      }
    }

    const description = line
      .replace(
        new RegExp(
          `\\b(?:${resolvedPayer.replace(/[.*+?^${}()|[\]\\]/g, "\\$&")}|i|me)\\s*:?\\s+(?:paid|covered|spent)\\b`,
          "i",
        ),
        "",
      )
      .replace(amountMatch[1], "")
      .replace(/\s*,?\s*but\b.*$/i, "")
      .replace(/[.;,].*$/, "")
      .trim()
      .replace(/^for\s+/i, "")
      .replace(/\s+for\s*$/i, "")
      .replace(/^(?:the|a|an)\s+/i, "");

    expenses.push({
      payer: resolvedPayer,
      amount,
      description: description || "Group expense",
      excluded: exclusions,
    });
  }

  return expenses;
}
