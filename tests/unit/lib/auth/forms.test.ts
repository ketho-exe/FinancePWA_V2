import { describe, expect, it } from "vitest";

import {
  getAuthErrorCode,
  getAuthMessage,
  parseAuthForm,
  validateAuthForm
} from "@/lib/auth/forms";

function buildFormData(entries: Record<string, string>) {
  const formData = new FormData();

  Object.entries(entries).forEach(([key, value]) => {
    formData.set(key, value);
  });

  return formData;
}

describe("parseAuthForm", () => {
  it("trims fields and normalizes email case", () => {
    const formData = buildFormData({
      displayName: "  Katie  ",
      email: "  USER@Example.COM ",
      password: " secretpass ",
      confirmPassword: " secretpass "
    });

    expect(parseAuthForm(formData)).toEqual({
      displayName: "Katie",
      email: "user@example.com",
      password: "secretpass",
      confirmPassword: "secretpass"
    });
  });
});

describe("validateAuthForm", () => {
  it("accepts a valid login payload", () => {
    const formData = buildFormData({
      email: "user@example.com",
      password: "secretpass"
    });

    expect(validateAuthForm(formData, "login")).toEqual({
      ok: true,
      values: {
        displayName: "",
        email: "user@example.com",
        password: "secretpass",
        confirmPassword: ""
      }
    });
  });

  it("requires a display name on signup", () => {
    const formData = buildFormData({
      email: "user@example.com",
      password: "secretpass",
      confirmPassword: "secretpass"
    });

    expect(validateAuthForm(formData, "signup")).toEqual({
      ok: false,
      message: "Add a name for your account."
    });
  });

  it("rejects mismatched signup passwords", () => {
    const formData = buildFormData({
      displayName: "Katie",
      email: "user@example.com",
      password: "secretpass",
      confirmPassword: "anotherpass"
    });

    expect(validateAuthForm(formData, "signup")).toEqual({
      ok: false,
      message: "Your password confirmation did not match."
    });
  });
});

describe("auth message helpers", () => {
  it("maps known auth result codes to copy", () => {
    expect(getAuthMessage("signed-out")).toBe("You have been signed out.");
    expect(getAuthMessage("missing-code")).toBe(
      "Something went wrong with authentication. Please try again."
    );
  });

  it("maps Supabase errors to redirect-safe codes", () => {
    expect(getAuthErrorCode("Invalid login credentials")).toBe(
      "invalid-credentials"
    );
    expect(getAuthErrorCode("User already registered")).toBe("account-exists");
  });
});
