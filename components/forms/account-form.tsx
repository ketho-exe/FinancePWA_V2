"use client";

import { useState } from "react";

export function AccountForm() {
  const [accountName, setAccountName] = useState("");
  const [accountType, setAccountType] = useState("current");
  const [savedMessage, setSavedMessage] = useState("");

  return (
    <form
      className="space-y-4 rounded-[28px] border border-black/10 bg-white/60 p-6"
      onSubmit={(event) => {
        event.preventDefault();

        const trimmedAccountName = accountName.trim();

        if (!trimmedAccountName) {
          setSavedMessage("Enter an account name to save it locally");
          return;
        }

        setSavedMessage(
          `Saved ${trimmedAccountName} as a ${accountType} account locally`
        );
      }}
    >
      <label className="block space-y-2">
        <span className="text-sm uppercase tracking-[0.2em] text-[var(--muted)]">
          Account name
        </span>
        <input
          aria-label="Account name"
          className="w-full rounded-2xl border border-black/10 bg-white px-4 py-3 text-lg text-[var(--fg)] outline-none"
          onChange={(event) => setAccountName(event.target.value)}
          placeholder="Monzo"
          value={accountName}
        />
      </label>

      <label className="block space-y-2">
        <span className="text-sm uppercase tracking-[0.2em] text-[var(--muted)]">
          Account type
        </span>
        <select
          aria-label="Account type"
          className="w-full rounded-2xl border border-black/10 bg-white px-4 py-3 text-lg text-[var(--fg)] outline-none"
          onChange={(event) => setAccountType(event.target.value)}
          value={accountType}
        >
          <option value="current">Current</option>
          <option value="savings">Savings</option>
          <option value="credit">Credit</option>
        </select>
      </label>

      <button
        className="rounded-full bg-[#172129] px-4 py-2 text-sm font-medium text-white"
        type="submit"
      >
        Save account
      </button>

      {savedMessage ? (
        <p aria-live="polite" className="text-sm text-[var(--muted)]">
          {savedMessage}
        </p>
      ) : null}
    </form>
  );
}
