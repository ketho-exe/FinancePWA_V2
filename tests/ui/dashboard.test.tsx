import { createEvent, fireEvent, render, screen } from "@testing-library/react";

import AccountsPage from "@/app/(app)/accounts/page";
import BillsPage from "@/app/(app)/bills/page";
import DashboardPage from "@/app/(app)/dashboard/page";
import GoalsPage from "@/app/(app)/goals/page";
import PotsPage from "@/app/(app)/pots/page";
import SalaryPage from "@/app/(app)/salary/page";
import TransactionsPage from "@/app/(app)/transactions/page";
import WishlistPage from "@/app/(app)/wishlist/page";
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

describe("DashboardPage", () => {
  it("shows the key financial overview cards", () => {
    render(<DashboardPage />);

    expect(screen.getByText("Net monthly position")).toBeInTheDocument();
    expect(screen.getByText("Upcoming bills")).toBeInTheDocument();
    expect(screen.getByText("Savings progress")).toBeInTheDocument();
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

  it("lets the user create a local category and save a draft transaction", () => {
    render(<TransactionsPage />);

    const categoryInput = screen.getByLabelText("Category");
    const form = categoryInput.closest("form");

    if (!form) {
      throw new Error("Expected transaction controls to be inside a form");
    }

    fireEvent.change(categoryInput, { target: { value: "Travel" } });
    fireEvent.click(screen.getByRole("button", { name: "Create category" }));

    expect(screen.getByText('Category "Travel" ready')).toBeInTheDocument();

    const submitEvent = createEvent.submit(form);
    fireEvent(form, submitEvent);

    expect(submitEvent.defaultPrevented).toBe(true);
    expect(screen.getByText("Draft transaction saved locally")).toBeInTheDocument();
  });
});

describe("AccountsPage", () => {
  it("shows account controls and saves the account locally", () => {
    render(<AccountsPage />);

    const accountNameInput = screen.getByLabelText("Account name");
    const accountTypeInput = screen.getByLabelText("Account type");
    const form = accountNameInput.closest("form");

    if (!form) {
      throw new Error("Expected account controls to be inside a form");
    }

    expect(accountNameInput).toBeInTheDocument();
    expect(accountTypeInput).toBeInTheDocument();

    fireEvent.change(accountNameInput, { target: { value: "Holiday fund" } });
    fireEvent.change(accountTypeInput, { target: { value: "savings" } });

    const submitEvent = createEvent.submit(form);
    fireEvent(form, submitEvent);

    expect(submitEvent.defaultPrevented).toBe(true);
    expect(
      screen.getByText("Saved Holiday fund as a savings account locally")
    ).toBeInTheDocument();
  });
});

describe("WishlistPage", () => {
  it("shows wishlist tracking controls", () => {
    render(<WishlistPage />);

    expect(screen.getByLabelText("Item name")).toBeInTheDocument();
    expect(screen.getByLabelText("Target amount")).toBeInTheDocument();
    expect(screen.getByLabelText("Current saved amount")).toBeInTheDocument();
  });
});

describe("GoalsPage", () => {
  it("shows the core saving goal fields", () => {
    render(<GoalsPage />);

    expect(screen.getByLabelText("Goal name")).toBeInTheDocument();
    expect(screen.getByLabelText("Target amount")).toBeInTheDocument();
    expect(screen.getByLabelText("Target date")).toBeInTheDocument();
    expect(screen.getByLabelText("Current saved amount")).toBeInTheDocument();
  });
});

describe("BillsPage", () => {
  it("shows recurring item cadence and next due date controls", () => {
    render(<BillsPage />);

    expect(screen.getByLabelText("Bill name")).toBeInTheDocument();
    expect(screen.getByLabelText("Cadence")).toBeInTheDocument();
    expect(screen.getByLabelText("Next due date")).toBeInTheDocument();
  });

  it("requires the next due date before saving a recurring item locally", () => {
    render(<BillsPage />);

    const billNameInput = screen.getByLabelText("Bill name");
    const amountInput = screen.getByLabelText("Amount");
    const cadenceInput = screen.getByLabelText("Cadence");
    const form = billNameInput.closest("form");

    if (!form) {
      throw new Error("Expected recurring item controls to be inside a form");
    }

    fireEvent.change(billNameInput, { target: { value: "Council tax" } });
    fireEvent.change(amountInput, { target: { value: "145" } });
    fireEvent.change(cadenceInput, { target: { value: "monthly" } });

    const submitEvent = createEvent.submit(form);
    fireEvent(form, submitEvent);

    expect(submitEvent.defaultPrevented).toBe(true);
    expect(
      screen.getByText(
        "Enter a bill name, amount, and next due date to save it locally"
      )
    ).toBeInTheDocument();
  });
});

describe("PotsPage", () => {
  it("shows savings pot progress controls", () => {
    render(<PotsPage />);

    expect(screen.getByLabelText("Pot name")).toBeInTheDocument();
    expect(screen.getByLabelText("Target amount")).toBeInTheDocument();
    expect(screen.getByLabelText("Current saved amount")).toBeInTheDocument();
  });
});
