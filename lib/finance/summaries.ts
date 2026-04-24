export interface BuildFinancialSummaryInput {
  accounts: Array<{
    kind: string;
    balance: number;
    overdraft_limit: number | null;
  }>;
  recurringItems: Array<{ amount: number }>;
  goals: Array<{ target_amount: number; saved_amount: number }>;
}

export function buildFinancialSummary(input: BuildFinancialSummaryInput) {
  const cash = input.accounts
    .filter((account) => account.kind !== "credit")
    .reduce((sum, account) => sum + account.balance, 0);

  const debt = input.accounts
    .filter((account) => account.kind === "credit" && account.balance < 0)
    .reduce((sum, account) => sum + Math.abs(account.balance), 0);

  const committedMonthly = input.recurringItems.reduce(
    (sum, item) => sum + item.amount,
    0
  );

  const totalGoalTarget = input.goals.reduce(
    (sum, goal) => sum + goal.target_amount,
    0
  );
  const totalGoalSaved = input.goals.reduce(
    (sum, goal) => sum + goal.saved_amount,
    0
  );

  return {
    cash,
    debt,
    committedMonthly,
    goalProgressPercent:
      totalGoalTarget === 0
        ? 0
        : Math.round((totalGoalSaved / totalGoalTarget) * 100)
  };
}
