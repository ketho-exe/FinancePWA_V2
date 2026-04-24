import { render, screen } from "@testing-library/react";

import { AppShell } from "@/components/app-shell";

describe("AppShell", () => {
  it("renders primary finance navigation links and theme toggle", () => {
    render(
      <AppShell>
        <div>Content</div>
      </AppShell>
    );

    expect(screen.getByRole("link", { name: /dashboard/i })).toHaveAttribute(
      "href",
      "/dashboard"
    );
    expect(
      screen.getByRole("link", { name: /transactions/i })
    ).toHaveAttribute("href", "/transactions");
    expect(screen.getByRole("link", { name: /wishlist/i })).toHaveAttribute(
      "href",
      "/wishlist"
    );
    expect(
      screen.getByRole("button", { name: /toggle theme/i })
    ).toBeInTheDocument();
  });
});
