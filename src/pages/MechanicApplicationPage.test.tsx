import { render, screen } from "@testing-library/react";
import MechanicApplicationPage from "./MechanicApplicationPage";

describe("MechanicApplicationPage", () => {
  beforeEach(() => {
    window.localStorage.clear();
    window.history.replaceState(null, "", "/mechanic/apply");
  });

  test("presents useful mechanic information without approval or review sections", () => {
    render(<MechanicApplicationPage />);

    expect(
      screen.getByRole("heading", {
        name: "Join STM Motors for more local work and flexibility.",
      }),
    ).toBeInTheDocument();
    expect(
      screen.getByRole("heading", { name: "A practical way to grow your workload" }),
    ).toBeInTheDocument();
    expect(
      screen.getByRole("heading", { name: "Straightforward from details to jobs" }),
    ).toBeInTheDocument();
    expect(screen.getByText("Local opportunities")).toBeInTheDocument();
    expect(screen.getByText("How are jobs matched to me?")).toBeInTheDocument();
    expect(screen.queryByText(/approval process/i)).not.toBeInTheDocument();
    expect(screen.queryByText(/review process/i)).not.toBeInTheDocument();
    expect(screen.queryByText(/approved mechanic/i)).not.toBeInTheDocument();
  });

  test("keeps the existing mechanic application form available", () => {
    render(<MechanicApplicationPage />);

    expect(
      screen.getByRole("heading", { name: "Mechanic application" }),
    ).toBeInTheDocument();
    expect(screen.getByPlaceholderText("First name")).toBeInTheDocument();
    expect(screen.getByPlaceholderText("Last name")).toBeInTheDocument();
    expect(screen.getByRole("button", { name: "Continue" })).toBeInTheDocument();
  });
});
