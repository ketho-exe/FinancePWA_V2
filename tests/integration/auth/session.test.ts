import { describe, expect, it } from "vitest";
import { isProtectedPath } from "@/lib/auth/session";

describe("isProtectedPath", () => {
  it("marks app routes as protected", () => {
    expect(isProtectedPath("/dashboard")).toBe(true);
  });

  it("leaves marketing and auth routes public", () => {
    expect(isProtectedPath("/")).toBe(false);
    expect(isProtectedPath("/login")).toBe(false);
  });
});
