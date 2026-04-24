"use client";

import { useState } from "react";

export function WishlistForm() {
  const [itemName, setItemName] = useState("");
  const [targetAmount, setTargetAmount] = useState("");
  const [currentAmount, setCurrentAmount] = useState("");
  const [saveStatus, setSaveStatus] = useState("");

  return (
    <form
      className="space-y-4 rounded-[28px] border border-black/10 bg-white/60 p-6"
      onSubmit={(event) => {
        event.preventDefault();

        const trimmedItemName = itemName.trim();

        if (!trimmedItemName || !targetAmount.trim()) {
          setSaveStatus("Add an item name and target amount to track it locally");
          return;
        }

        setSaveStatus(
          `Tracking ${trimmedItemName} locally with a target of ${targetAmount} and ${currentAmount || "0"} already saved`
        );
      }}
    >
      <label className="block space-y-2">
        <span className="text-sm uppercase tracking-[0.2em] text-[var(--muted)]">
          Item name
        </span>
        <input
          aria-label="Item name"
          className="w-full rounded-2xl border border-black/10 bg-white px-4 py-3 text-lg text-[var(--fg)] outline-none"
          onChange={(event) => setItemName(event.target.value)}
          placeholder="Apple Watch"
          value={itemName}
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
          placeholder="399"
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
          placeholder="120"
          value={currentAmount}
        />
      </label>

      <button
        className="rounded-full bg-[#172129] px-4 py-2 text-sm font-medium text-white"
        type="submit"
      >
        Save wishlist item
      </button>

      {saveStatus ? (
        <p aria-live="polite" className="text-sm text-[var(--muted)]">
          {saveStatus}
        </p>
      ) : null}
    </form>
  );
}
