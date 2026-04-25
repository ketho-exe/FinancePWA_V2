export type AuthMode = "login" | "signup";

export type ParsedAuthForm = {
  confirmPassword: string;
  displayName: string;
  email: string;
  password: string;
};

export type AuthValidationResult =
  | {
      ok: true;
      values: ParsedAuthForm;
    }
  | {
      message: string;
      ok: false;
    };

const authMessageMap: Record<string, string> = {
  "account-created": "Account created. Check your email to confirm your address.",
  "account-exists":
    "An account already exists for this email. Try logging in instead.",
  "auth-unavailable":
    "Add your Supabase URL and publishable key before using authentication.",
  "invalid-credentials": "Check your email and password, then try again.",
  "password-mismatch": "Your password confirmation did not match.",
  "password-too-short": "Use at least 8 characters for your password.",
  "signed-out": "You have been signed out.",
  "unexpected-auth-error":
    "Something went wrong with authentication. Please try again.",
  "welcome-back": "Welcome back."
};

function getStringValue(value: FormDataEntryValue | null) {
  return typeof value === "string" ? value.trim() : "";
}

export function parseAuthForm(formData: FormData): ParsedAuthForm {
  return {
    displayName: getStringValue(formData.get("displayName")),
    email: getStringValue(formData.get("email")).toLowerCase(),
    password: getStringValue(formData.get("password")),
    confirmPassword: getStringValue(formData.get("confirmPassword"))
  };
}

export function validateAuthForm(
  formData: FormData,
  mode: AuthMode
): AuthValidationResult {
  const values = parseAuthForm(formData);

  if (!values.email || !values.email.includes("@")) {
    return {
      ok: false,
      message: "Enter a valid email address."
    };
  }

  if (!values.password) {
    return {
      ok: false,
      message: "Enter your password."
    };
  }

  if (mode === "signup") {
    if (!values.displayName) {
      return {
        ok: false,
        message: "Add a name for your account."
      };
    }

    if (values.password.length < 8) {
      return {
        ok: false,
        message: getAuthMessage("password-too-short") ?? "Use at least 8 characters for your password."
      };
    }

    if (values.password !== values.confirmPassword) {
      return {
        ok: false,
        message:
          getAuthMessage("password-mismatch") ??
          "Your password confirmation did not match."
      };
    }
  }

  return {
    ok: true,
    values
  };
}

export function getAuthMessage(code?: string | null) {
  if (!code) {
    return null;
  }

  return authMessageMap[code] ?? authMessageMap["unexpected-auth-error"];
}

export function getAuthErrorCode(message: string) {
  const normalized = message.toLowerCase();

  if (
    normalized.includes("invalid login credentials") ||
    normalized.includes("email not confirmed")
  ) {
    return "invalid-credentials";
  }

  if (
    normalized.includes("user already registered") ||
    normalized.includes("already been registered")
  ) {
    return "account-exists";
  }

  return "unexpected-auth-error";
}
