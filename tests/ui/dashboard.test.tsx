import { createEvent, fireEvent, render, screen } from "@testing-library/react";

import SalaryPage from "@/app/(app)/salary/page";
import TransactionsPage from "@/app/(app)/transactions/page";
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
    const currencyFormatter = new Intl.NumberFormat("en-GB", {
      style: "currency",
      currency: "GBP"
    });
    const initialEstimate = estimateUkMonthlyPay({
      annualSalary: 42_000,
      pensionPercent: 5
    }).netMonthly;
    const updatedSalaryEstimate = estimateUkMonthlyPay({
      annualSalary: 50_000,
      pensionPercent: 5
    }).netMonthly;
    const updatedPensionEstimate = estimateUkMonthlyPay({
      annualSalary: 50_000,
      pensionPercent: 10
    }).netMonthly;

    expect(annualSalaryInput).toBeInTheDocument();
    expect(pensionInput).toBeInTheDocument();
    expect(screen.getByText("Estimated monthly net pay")).toBeInTheDocument();
    expect(
      screen.getByText(currencyFormatter.format(initialEstimate))
    ).toBeInTheDocument();

    fireEvent.change(annualSalaryInput, { target: { value: "50000" } });

    expect(
      screen.getByText(currencyFormatter.format(updatedSalaryEstimate))
    ).toBeInTheDocument();

    fireEvent.change(pensionInput, { target: { value: "10" } });

    expect(
      screen.getByText(currencyFormatter.format(updatedPensionEstimate))
    ).toBeInTheDocument();
  });

  it("prevents form submission and keeps the current estimate intact", () => {
    render(<SalaryPage />);

    const annualSalaryInput = screen.getByLabelText("Annual salary");
    const pensionInput = screen.getByLabelText("Pension percent");
    const form = annualSalaryInput.closest("form");
    const currencyFormatter = new Intl.NumberFormat("en-GB", {
      style: "currency",
      currency: "GBP"
    });
    const submittedEstimate = estimateUkMonthlyPay({
      annualSalary: 50_000,
      pensionPercent: 10
    }).netMonthly;

    if (!form) {
      throw new Error("Expected salary inputs to be inside a form");
    }

    fireEvent.change(annualSalaryInput, { target: { value: "50000" } });
    fireEvent.change(pensionInput, { target: { value: "10" } });

    const submitEvent = createEvent.submit(form);
    fireEvent(form, submitEvent);

    expect(submitEvent.defaultPrevented).toBe(true);
    expect(annualSalaryInput).toHaveValue(50000);
    expect(pensionInput).toHaveValue(10);
    expect(
      screen.getByText(currencyFormatter.format(submittedEstimate))
    ).toBeInTheDocument();
  });
});

describe("TransactionsPage", () => {
  it("shows account assignment and category creation controls", () => {
    render(<TransactionsPage />);

    expect(screen.getByLabelText("Account")).toBeInTheDocument();
    expect(screen.getByLabelText("Category")).toBeInTheDocument();
    expect(screen.getByText("Create category")).toBeInTheDocument();
  });
});
