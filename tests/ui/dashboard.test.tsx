import { render, screen } from "@testing-library/react";

import { AppShell } from "@/components/app-shell";

describe("AppShell", () => {
  it("renders primary finance navigation", () => {
    render(
      <AppShell>
        <div>Content</div>
      </AppShell>
    );

    expect(screen.getByText("Dashboard")).toBeInTheDocument();
    expect(screen.getByText("Transactions")).toBeInTheDocument();
    expect(screen.getByText("Wishlist")).toBeInTheDocument();
  });
});
