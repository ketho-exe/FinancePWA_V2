"use client";

import { useState } from "react";

export function PotForm() {
  const [potName, setPotName] = useState("");
  const [targetAmount, setTargetAmount] = useState("");
  const [currentAmount, setCurrentAmount] = useState("");
  const [saveStatus, setSaveStatus] = useState("");

  return (
    <form
      className="space-y-4 rounded-[28px] border border-black/10 bg-white/60 p-6"
      onSubmit={(event) => {
        event.preventDefault();

        const trimmedPotName = potName.trim();

        if (!trimmedPotName || !targetAmount.trim()) {
          setSaveStatus("Add a pot name and target amount to save it locally");
          return;
        }

        setSaveStatus(
          `Saved ${trimmedPotName} with a target of ${targetAmount} and ${currentAmount || "0"} already saved locally`
        );
      }}
    >
      <label className="block space-y-2">
        <span className="text-sm uppercase tracking-[0.2em] text-[var(--muted)]">
          Pot name
        </span>
        <input
          aria-label="Pot name"
          className="w-full rounded-2xl border border-black/10 bg-white px-4 py-3 text-lg text-[var(--fg)] outline-none"
          onChange={(event) => setPotName(event.target.value)}
          placeholder="Emergency cushion"
          value={potName}
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
          placeholder="1200"
          value={targetAmount}
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
          placeholder="300"
          value={currentAmount}
        />
      </label>

      <button
        className="rounded-full bg-[#172129] px-4 py-2 text-sm font-medium text-white"
        type="submit"
      >
        Save pot
      </button>

      {saveStatus ? (
        <p aria-live="polite" className="text-sm text-[var(--muted)]">
          {saveStatus}
        </p>
      ) : null}
    </form>
  );
}
