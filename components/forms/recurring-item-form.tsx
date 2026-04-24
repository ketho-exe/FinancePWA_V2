"use client";

import { useState } from "react";

export function RecurringItemForm() {
  const [itemName, setItemName] = useState("");
  const [amount, setAmount] = useState("");
  const [cadence, setCadence] = useState("monthly");
  const [nextDueDate, setNextDueDate] = useState("");
  const [saveStatus, setSaveStatus] = useState("");

  return (
    <form
      className="space-y-4 rounded-[28px] border border-black/10 bg-white/60 p-6"
      onSubmit={(event) => {
        event.preventDefault();

        const trimmedItemName = itemName.trim();

        if (!trimmedItemName || !amount.trim() || !nextDueDate) {
          setSaveStatus(
            "Enter a bill name, amount, and next due date to save it locally"
          );
          return;
        }

        setSaveStatus(
          `Saved ${trimmedItemName} as a ${cadence} recurring item due next on ${nextDueDate} with a local amount of ${amount}`
        );
      }}
    >
      <label className="block space-y-2">
        <span className="text-sm uppercase tracking-[0.2em] text-[var(--muted)]">
          Bill name
        </span>
        <input
          aria-label="Bill name"
          className="w-full rounded-2xl border border-black/10 bg-white px-4 py-3 text-lg text-[var(--fg)] outline-none"
          onChange={(event) => setItemName(event.target.value)}
          placeholder="Council tax"
          value={itemName}
        />
      </label>

      <label className="block space-y-2">
        <span className="text-sm uppercase tracking-[0.2em] text-[var(--muted)]">
          Amount
        </span>
        <input
          aria-label="Amount"
          className="w-full rounded-2xl border border-black/10 bg-white px-4 py-3 text-lg text-[var(--fg)] outline-none"
          inputMode="decimal"
          onChange={(event) => setAmount(event.target.value)}
          placeholder="145"
          value={amount}
        />
      </label>

      <label className="block space-y-2">
        <span className="text-sm uppercase tracking-[0.2em] text-[var(--muted)]">
          Cadence
        </span>
        <select
          aria-label="Cadence"
          className="w-full rounded-2xl border border-black/10 bg-white px-4 py-3 text-lg text-[var(--fg)] outline-none"
          onChange={(event) => setCadence(event.target.value)}
          value={cadence}
        >
          <option value="weekly">Weekly</option>
          <option value="monthly">Monthly</option>
          <option value="yearly">Yearly</option>
        </select>
      </label>

      <label className="block space-y-2">
        <span className="text-sm uppercase tracking-[0.2em] text-[var(--muted)]">
          Next due date
        </span>
        <input
          aria-label="Next due date"
          className="w-full rounded-2xl border border-black/10 bg-white px-4 py-3 text-lg text-[var(--fg)] outline-none"
          onChange={(event) => setNextDueDate(event.target.value)}
          type="date"
          value={nextDueDate}
        />
      </label>

      <button
        className="rounded-full bg-[#172129] px-4 py-2 text-sm font-medium text-white"
        type="submit"
      >
        Save recurring item
      </button>

      {saveStatus ? (
        <p aria-live="polite" className="text-sm text-[var(--muted)]">
          {saveStatus}
        </p>
      ) : null}
    </form>
  );
}
