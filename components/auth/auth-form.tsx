import Link from "next/link";

type AuthFormProps = {
  action: (formData: FormData) => Promise<void>;
  alternateHref: string;
  alternateLabel: string;
  alternatePrompt: string;
  description: string;
  isSupabaseReady: boolean;
  mode: "login" | "signup";
  notice?: string | null;
  submitLabel: string;
  title: string;
};

export function AuthForm({
  action,
  alternateHref,
  alternateLabel,
  alternatePrompt,
  description,
  isSupabaseReady,
  mode,
  notice,
  submitLabel,
  title
}: AuthFormProps) {
  const noticeTone = isSupabaseReady
    ? "border-[rgba(214,139,87,0.36)] bg-[rgba(214,139,87,0.12)] text-[var(--fg)]"
    : "border-[rgba(195,83,83,0.32)] bg-[rgba(195,83,83,0.12)] text-[var(--fg)]";

  return (
    <div
      className="w-full max-w-md rounded-[32px] border p-6 shadow-[0_24px_80px_rgba(15,23,42,0.14)] backdrop-blur md:p-8"
      style={{
        background: "var(--panel)",
        borderColor: "var(--panel-border)"
      }}
    >
      <div className="space-y-3">
        <p
          className="text-xs uppercase tracking-[0.32em]"
          style={{ color: "var(--muted)" }}
        >
          Finance Homebase
        </p>
        <h1 className="text-3xl font-semibold tracking-tight">{title}</h1>
        <p className="text-sm leading-6" style={{ color: "var(--muted)" }}>
          {description}
        </p>
      </div>

      {notice ? (
        <div className={`mt-6 rounded-[24px] border px-4 py-3 text-sm ${noticeTone}`}>
          {notice}
        </div>
      ) : null}

      <form action={action} className="mt-6 space-y-4">
        {mode === "signup" ? (
          <label className="block space-y-2">
            <span className="text-sm font-medium">Name</span>
            <input
              required
              autoComplete="name"
              className="w-full rounded-[22px] border px-4 py-3 outline-none transition focus:border-[rgba(214,139,87,0.65)]"
              name="displayName"
              placeholder="How should we label your account?"
              style={{
                background: "var(--nav-item)",
                borderColor: "var(--panel-border)"
              }}
              type="text"
            />
          </label>
        ) : null}

        <label className="block space-y-2">
          <span className="text-sm font-medium">Email</span>
          <input
            required
            autoComplete="email"
            className="w-full rounded-[22px] border px-4 py-3 outline-none transition focus:border-[rgba(214,139,87,0.65)]"
            name="email"
            placeholder="you@example.com"
            style={{
              background: "var(--nav-item)",
              borderColor: "var(--panel-border)"
            }}
            type="email"
          />
        </label>

        <label className="block space-y-2">
          <span className="text-sm font-medium">Password</span>
          <input
            required
            autoComplete={mode === "signup" ? "new-password" : "current-password"}
            className="w-full rounded-[22px] border px-4 py-3 outline-none transition focus:border-[rgba(214,139,87,0.65)]"
            name="password"
            placeholder={mode === "signup" ? "Use at least 8 characters" : "Your password"}
            style={{
              background: "var(--nav-item)",
              borderColor: "var(--panel-border)"
            }}
            type="password"
          />
        </label>

        {mode === "signup" ? (
          <label className="block space-y-2">
            <span className="text-sm font-medium">Confirm password</span>
            <input
              required
              autoComplete="new-password"
              className="w-full rounded-[22px] border px-4 py-3 outline-none transition focus:border-[rgba(214,139,87,0.65)]"
              name="confirmPassword"
              placeholder="Repeat your password"
              style={{
                background: "var(--nav-item)",
                borderColor: "var(--panel-border)"
              }}
              type="password"
            />
          </label>
        ) : null}

        {!isSupabaseReady ? (
          <p className="text-sm leading-6" style={{ color: "var(--muted)" }}>
            Add `NEXT_PUBLIC_SUPABASE_URL` and
            ` NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY ` in `.env.local` to enable
            authentication.
          </p>
        ) : null}

        <button
          className="w-full rounded-[22px] px-4 py-3 text-sm font-medium text-[#172129] transition hover:opacity-95 disabled:cursor-not-allowed disabled:opacity-60"
          disabled={!isSupabaseReady}
          style={{
            background:
              "linear-gradient(135deg, rgba(255,213,160,1) 0%, rgba(214,139,87,1) 100%)"
          }}
          type="submit"
        >
          {submitLabel}
        </button>
      </form>

      <p className="mt-5 text-sm" style={{ color: "var(--muted)" }}>
        {alternatePrompt}{" "}
        <Link className="font-medium text-[var(--fg)]" href={alternateHref}>
          {alternateLabel}
        </Link>
      </p>
    </div>
  );
}
