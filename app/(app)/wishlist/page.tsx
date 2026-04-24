import { WishlistForm } from "@/components/forms/wishlist-form";

export default function WishlistPage() {
  return (
    <div className="space-y-6">
      <header className="max-w-2xl space-y-3">
        <p className="text-sm uppercase tracking-[0.3em] text-[var(--muted)]">
          Future buys
        </p>
        <h1 className="text-3xl font-semibold tracking-tight">Wishlist</h1>
        <p className="text-[var(--muted)]">
          Keep an eye on planned purchases and the savings target for each one.
        </p>
      </header>

      <WishlistForm />
    </div>
  );
}
