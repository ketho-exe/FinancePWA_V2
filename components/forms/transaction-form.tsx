"use client";

import { useState } from "react";

export function TransactionForm() {
  const [account, setAccount] = useState("monzo");
  const [category, setCategory] = useState("");
  const [categoryStatus, setCategoryStatus] = useState("");
  const [saveStatus, setSaveStatus] = useState("");

  return (
    <form
      className="space-y-4 rounded-[28px] border border-black/10 bg-white/60 p-6"
      onSubmit={(event) => {
        event.preventDefault();

        if (!category.trim()) {
          setSaveStatus("Add a category before saving this draft locally");
          return;
        }

        setSaveStatus("Draft transaction saved locally");
      }}
    >
      <label className="block space-y-2">
        <span className="text-sm uppercase tracking-[0.2em] text-[var(--muted)]">
          Account
        </span>
        <select
          aria-label="Account"
          className="w-full rounded-2xl border border-black/10 bg-white px-4 py-3 text-lg text-[var(--fg)] outline-none"
          onChange={(event) => setAccount(event.target.value)}
          value={account}
        >
          <option value="monzo">Monzo</option>
        </select>
      </label>

      <label className="block space-y-2">
        <span className="text-sm uppercase tracking-[0.2em] text-[var(--muted)]">
          Category
        </span>
        <input
          aria-label="Category"
          className="w-full rounded-2xl border border-black/10 bg-white px-4 py-3 text-lg text-[var(--fg)] outline-none"
          onChange={(event) => setCategory(event.target.value)}
          placeholder="Groceries"
          value={category}
        />
      </label>

      <div className="flex flex-wrap gap-3">
        <button
          className="rounded-full bg-[#172129] px-4 py-2 text-sm font-medium text-white"
          onClick={() => {
            const trimmedCategory = category.trim();

            if (!trimmedCategory) {
              setCategoryStatus("Enter a category name to create it locally");
              return;
            }

            setCategoryStatus(`Category "${trimmedCategory}" ready`);
            setSaveStatus("");
          }}
          type="button"
        >
          Create category
        </button>

        <button
          className="rounded-full border border-black/10 bg-white px-4 py-2 text-sm font-medium text-[var(--fg)]"
          type="submit"
        >
          Save draft transaction
        </button>
      </div>

      {categoryStatus ? (
        <p aria-live="polite" className="text-sm text-[var(--muted)]">
          {categoryStatus}
        </p>
      ) : null}

      {saveStatus ? (
        <p aria-live="polite" className="text-sm text-[var(--muted)]">
          {saveStatus}
        </p>
      ) : null}
    </form>
  );
}
