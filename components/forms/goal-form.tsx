"use client";

import { useState } from "react";

export function GoalForm() {
  const [goalName, setGoalName] = useState("");
  const [targetAmount, setTargetAmount] = useState("");
  const [targetDate, setTargetDate] = useState("");
  const [currentAmount, setCurrentAmount] = useState("");
  const [saveStatus, setSaveStatus] = useState("");

  return (
    <form
      className="space-y-4 rounded-[28px] border border-black/10 bg-white/60 p-6"
      onSubmit={(event) => {
        event.preventDefault();

        const trimmedGoalName = goalName.trim();

        if (!trimmedGoalName || !targetAmount.trim() || !targetDate) {
          setSaveStatus(
            "Add a goal name, target amount, and target date to save it locally"
          );
          return;
        }

        setSaveStatus(
          `Saved ${trimmedGoalName} with a target of ${targetAmount}, ${currentAmount || "0"} saved, and a target date of ${targetDate}`
        );
      }}
    >
      <label className="block space-y-2">
        <span className="text-sm uppercase tracking-[0.2em] text-[var(--muted)]">
          Goal name
        </span>
        <input
          aria-label="Goal name"
          className="w-full rounded-2xl border border-black/10 bg-white px-4 py-3 text-lg text-[var(--fg)] outline-none"
          onChange={(event) => setGoalName(event.target.value)}
          placeholder="House deposit"
          value={goalName}
        />
      </label>

      <label className="block space-y-2">
        <span className="text-sm uppercase tracking-[0.2em] text-[var(--muted)]">
          Target amount
        </span>
        <input
          aria-label="Target amount"
          className="w-full rounded-2xl border border-black/10 bg-white px-4 py-3 text-lg text-[var(--fg)] outline-none"
          inputMode="decimal"
          onChange={(event) => setTargetAmount(event.target.value)}
          placeholder="25000"
          value={targetAmount}
        />
      </label>

      <label className="block space-y-2">
        <span className="text-sm uppercase tracking-[0.2em] text-[var(--muted)]">
          Target date
        </span>
        <input
          aria-label="Target date"
          className="w-full rounded-2xl border border-black/10 bg-white px-4 py-3 text-lg text-[var(--fg)] outline-none"
          onChange={(event) => setTargetDate(event.target.value)}
          type="date"
          value={targetDate}
        />
      </label>

      <label className="block space-y-2">
        <span className="text-sm uppercase tracking-[0.2em] text-[var(--muted)]">
          Current saved amount
        </span>
        <input
          aria-label="Current saved amount"
          className="w-full rounded-2xl border border-black/10 bg-white px-4 py-3 text-lg text-[var(--fg)] outline-none"
          inputMode="decimal"
          onChange={(event) => setCurrentAmount(event.target.value)}
          placeholder="8500"
          value={currentAmount}
        />
      </label>

      <button
        className="rounded-full bg-[#172129] px-4 py-2 text-sm font-medium text-white"
        type="submit"
      >
        Save goal
      </button>

      {saveStatus ? (
        <p aria-live="polite" className="text-sm text-[var(--muted)]">
          {saveStatus}
        </p>
      ) : null}
    </form>
  );
}
