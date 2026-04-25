import { signOutAction } from "@/lib/auth/actions";

export function SignOutButton() {
  return (
    <form action={signOutAction}>
      <button
        className="rounded-[18px] border px-3 py-2 text-sm font-medium transition hover:border-[rgba(214,139,87,0.55)]"
        style={{
          background: "var(--nav-item)",
          borderColor: "var(--panel-border)"
        }}
        type="submit"
      >
        Sign out
      </button>
    </form>
  );
}
