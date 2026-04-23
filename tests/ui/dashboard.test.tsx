import { render, screen } from "@testing-library/react";
import RootPage from "@/app/page";

describe("RootPage", () => {
  it("renders the product value proposition", () => {
    render(<RootPage />);

    expect(screen.getByText("Your money, clearly")).toBeInTheDocument();
  });
});
