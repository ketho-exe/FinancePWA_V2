import { fireEvent, render, screen } from "@testing-library/react";

import SalaryPage from "@/app/(app)/salary/page";
import { AppShell } from "@/components/app-shell";
import { estimateUkMonthlyPay } from "@/lib/salary/uk";

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

describe("SalaryPage", () => {
  it("shows salary inputs and updates the estimated take-home output", () => {
    render(<SalaryPage />);

    const annualSalaryInput = screen.getByLabelText("Annual salary");
    const pensionInput = screen.getByLabelText("Pension percent");
    const initialEstimate = estimateUkMonthlyPay({
      annualSalary: 42_000,
      pensionPercent: 5
    }).netMonthly;
    const updatedEstimate = estimateUkMonthlyPay({
      annualSalary: 50_000,
      pensionPercent: 5
    }).netMonthly;

    expect(annualSalaryInput).toBeInTheDocument();
    expect(pensionInput).toBeInTheDocument();
    expect(screen.getByText("Estimated monthly net pay")).toBeInTheDocument();
    expect(
      screen.getByText(
        new Intl.NumberFormat("en-GB", {
          style: "currency",
          currency: "GBP"
        }).format(initialEstimate)
      )
    ).toBeInTheDocument();

    fireEvent.change(annualSalaryInput, { target: { value: "50000" } });

    expect(
      screen.getByText(
        new Intl.NumberFormat("en-GB", {
          style: "currency",
          currency: "GBP"
        }).format(updatedEstimate)
      )
    ).toBeInTheDocument();
  });
});
