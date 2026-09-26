import { act, fireEvent, render, screen } from "@testing-library/react";
import {
  MECHANIC_RECRUITMENT_COOLDOWN_MS,
  MECHANIC_RECRUITMENT_DELAY_MS,
  MECHANIC_RECRUITMENT_DISMISSED_KEY,
  MECHANIC_RECRUITMENT_SESSION_KEY,
} from "../../lib/mechanicRecruitment";
import MechanicRecruitmentModal from "./MechanicRecruitmentModal";

const now = Date.UTC(2026, 8, 3, 12);

function openModal(delayMs = 1_000) {
  render(<MechanicRecruitmentModal delayMs={delayMs} pathname="/" siteMode="service" />);
  act(() => jest.advanceTimersByTime(delayMs));
}

describe("MechanicRecruitmentModal", () => {
  beforeEach(() => {
    jest.useFakeTimers();
    jest.setSystemTime(now);
    window.localStorage.clear();
    window.sessionStorage.clear();
    window.history.replaceState(null, "", "/");
    document.body.style.overflow = "";
  });

  afterEach(() => {
    jest.runOnlyPendingTimers();
    jest.useRealTimers();
    document.body.style.overflow = "";
  });

  test("does not appear immediately and opens after the configured delay", () => {
    render(<MechanicRecruitmentModal pathname="/" siteMode="service" />);
    expect(screen.queryByRole("dialog")).not.toBeInTheDocument();
    act(() => jest.advanceTimersByTime(MECHANIC_RECRUITMENT_DELAY_MS - 1));
    expect(screen.queryByRole("dialog")).not.toBeInTheDocument();
    act(() => jest.advanceTimersByTime(1));
    expect(screen.getByRole("dialog")).toBeInTheDocument();
    expect(
      screen.getByRole("img", {
        name: "STM Motors mobile mechanic working beside a customer vehicle",
      }),
    ).toHaveAttribute("src", "/images/mechanic-recruitment.jpg");
    expect(
      screen.queryByText(/applications are reviewed/i),
    ).not.toBeInTheDocument();
  });

  test.each([
    ["service", "/book"],
    ["service", "/mechanic/apply"],
    ["marketplace", "/"],
    ["staff", "/"],
  ] as const)("does not open for %s at %s", (siteMode, pathname) => {
    render(<MechanicRecruitmentModal delayMs={1_000} pathname={pathname} siteMode={siteMode} />);
    act(() => jest.advanceTimersByTime(1_000));
    expect(screen.queryByRole("dialog")).not.toBeInTheDocument();
  });

  test("the close button dismisses, stores a timestamp and restores scrolling", () => {
    document.body.style.overflow = "auto";
    openModal();
    expect(document.body.style.overflow).toBe("hidden");
    fireEvent.click(screen.getByRole("button", { name: "Close mechanic recruitment message" }));
    expect(screen.queryByRole("dialog")).not.toBeInTheDocument();
    expect(window.localStorage.getItem(MECHANIC_RECRUITMENT_DISMISSED_KEY)).toBe(
      String(now + 1_000),
    );
    expect(document.body.style.overflow).toBe("auto");
  });

  test("Maybe later dismisses the popup", () => {
    openModal();
    fireEvent.click(screen.getByRole("button", { name: "Maybe later" }));
    expect(screen.queryByRole("dialog")).not.toBeInTheDocument();
  });

  test("Escape dismisses the popup", () => {
    openModal();
    fireEvent.keyDown(document, { key: "Escape" });
    expect(screen.queryByRole("dialog")).not.toBeInTheDocument();
  });

  test("CTA stores dismissal and opens the mechanic application route", () => {
    openModal();
    fireEvent.click(screen.getByRole("button", { name: /Apply to join STM Motors/i }));
    expect(window.location.pathname).toBe("/mechanic/apply");
    expect(window.localStorage.getItem(MECHANIC_RECRUITMENT_DISMISSED_KEY)).toBe(
      String(now + 1_000),
    );
  });

  test("does not reappear during the same session", () => {
    window.sessionStorage.setItem(MECHANIC_RECRUITMENT_SESSION_KEY, "true");
    render(<MechanicRecruitmentModal delayMs={1_000} pathname="/" siteMode="service" />);
    act(() => jest.advanceTimersByTime(1_000));
    expect(screen.queryByRole("dialog")).not.toBeInTheDocument();
  });

  test("does not reappear within seven days", () => {
    window.localStorage.setItem(MECHANIC_RECRUITMENT_DISMISSED_KEY, String(now - 1_000));
    render(<MechanicRecruitmentModal delayMs={1_000} pathname="/" siteMode="service" />);
    act(() => jest.advanceTimersByTime(1_000));
    expect(screen.queryByRole("dialog")).not.toBeInTheDocument();
  });

  test("can reappear after seven days", () => {
    window.localStorage.setItem(
      MECHANIC_RECRUITMENT_DISMISSED_KEY,
      String(now - MECHANIC_RECRUITMENT_COOLDOWN_MS - 1),
    );
    openModal();
    expect(screen.getByRole("dialog")).toBeInTheDocument();
  });

  test("handles malformed localStorage data safely", () => {
    window.localStorage.setItem(MECHANIC_RECRUITMENT_DISMISSED_KEY, "not-a-timestamp");
    openModal();
    expect(screen.getByRole("dialog")).toBeInTheDocument();
  });

  test("cancels its pending timer when unmounted", () => {
    const view = render(<MechanicRecruitmentModal delayMs={1_000} pathname="/" siteMode="service" />);
    view.unmount();
    act(() => jest.advanceTimersByTime(1_000));
    expect(screen.queryByRole("dialog")).not.toBeInTheDocument();
  });
});
