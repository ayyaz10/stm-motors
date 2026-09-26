import { fireEvent, render, screen } from "@testing-library/react";
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

  test("captures the marketing source and optional referral details at the end", () => {
    window.localStorage.setItem(
      "stm-mechanic-application-draft",
      JSON.stringify({ currentStep: 3, formState: {}, hasQualifications: null }),
    );

    render(<MechanicApplicationPage />);

    const sourceSelect = screen.getByLabelText(
      "How did you hear about STM Motors?",
    );
    expect(sourceSelect).toBeInTheDocument();
    expect(
      screen.getByRole("option", { name: "Google search" }),
    ).toBeInTheDocument();
    expect(
      screen.getByRole("option", { name: "Friend or colleague referral" }),
    ).toBeInTheDocument();

    fireEvent.change(sourceSelect, {
      target: { value: "friend_or_colleague" },
    });

    expect(
      screen.getByLabelText(/Who can we thank for the referral/i),
    ).toBeInTheDocument();
  });
});
