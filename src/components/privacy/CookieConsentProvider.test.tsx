import { act, fireEvent, render, screen } from "@testing-library/react";
import { COOKIE_CONSENT_STORAGE_KEY } from "../../lib/cookieConsent";
import MechanicRecruitmentModal from "../public/MechanicRecruitmentModal";
import ConsentAwareGoogleMap from "./ConsentAwareGoogleMap";
import CookieConsentProvider from "./CookieConsentProvider";
import { useCookieConsent } from "./CookieConsentContext";

function SettingsButton() {
  const { openPreferences } = useCookieConsent();
  return <button onClick={openPreferences}>Open settings</button>;
}

describe("CookieConsentProvider", () => {
  beforeEach(() => {
    window.localStorage.clear();
    window.sessionStorage.clear();
  });

  test("shows equal first-layer choices and keeps optional categories off after rejection", () => {
    render(<CookieConsentProvider siteMode="service"><div>Website</div></CookieConsentProvider>);
    expect(screen.getByRole("heading", { name: "Your privacy choices" })).toBeInTheDocument();
    expect(screen.getByRole("button", { name: "Reject optional" })).toBeInTheDocument();
    expect(screen.getByRole("button", { name: "Manage preferences" })).toBeInTheDocument();
    expect(screen.getByRole("button", { name: "Accept optional" })).toBeInTheDocument();

    fireEvent.click(screen.getByRole("button", { name: "Reject optional" }));
    expect(screen.queryByRole("heading", { name: "Your privacy choices" })).not.toBeInTheDocument();
    expect(JSON.parse(window.localStorage.getItem(COOKIE_CONSENT_STORAGE_KEY) ?? "{}").preferences).toEqual({
      necessary: true,
      functional: false,
      analytics: false,
      marketing: false,
    });
  });

  test("saves granular choices and lets a visitor reopen settings", () => {
    render(<CookieConsentProvider siteMode="marketplace"><SettingsButton /></CookieConsentProvider>);
    fireEvent.click(screen.getByRole("button", { name: "Manage preferences" }));
    fireEvent.click(screen.getByRole("switch", { name: "Functional cookies" }));
    fireEvent.click(screen.getByRole("button", { name: "Save preferences" }));
    expect(JSON.parse(window.localStorage.getItem(COOKIE_CONSENT_STORAGE_KEY) ?? "{}").preferences.functional).toBe(true);

    fireEvent.click(screen.getByRole("button", { name: "Open settings" }));
    expect(screen.getByRole("dialog", { name: "Cookie preferences" })).toBeInTheDocument();
  });

  test("does not render public consent UI on the staff site", () => {
    render(<CookieConsentProvider siteMode="staff"><div>Staff portal</div></CookieConsentProvider>);
    expect(screen.getByText("Staff portal")).toBeInTheDocument();
    expect(screen.queryByText("Your privacy choices")).not.toBeInTheDocument();
  });

  test("blocks the Google map until functional consent is granted", () => {
    render(
      <CookieConsentProvider siteMode="service">
        <SettingsButton />
        <ConsentAwareGoogleMap address="26 Melville Brodie Gardens, Kirkcaldy KY1 2FN" embedUrl="https://www.google.com/maps/embed?pb=test" />
      </CookieConsentProvider>,
    );
    expect(screen.queryByTitle(/Map showing STM Motors/)).not.toBeInTheDocument();
    fireEvent.click(screen.getByRole("button", { name: "Load map" }));
    expect(screen.getByTitle(/Map showing STM Motors/)).toHaveAttribute("src", "https://www.google.com/maps/embed?pb=test");
    fireEvent.click(screen.getByRole("button", { name: "Open settings" }));
    fireEvent.click(screen.getByRole("button", { name: "Reject optional" }));
    expect(screen.queryByTitle(/Map showing STM Motors/)).not.toBeInTheDocument();
  });

  test("keeps the recruitment popup behind unresolved consent", () => {
    jest.useFakeTimers();
    render(
      <CookieConsentProvider siteMode="service">
        <MechanicRecruitmentModal delayMs={1_000} pathname="/" hostname="stmmotors.com" siteMode="service" />
      </CookieConsentProvider>,
    );
    act(() => jest.advanceTimersByTime(2_000));
    expect(screen.queryByRole("dialog", { name: "Mechanics wanted in your area" })).not.toBeInTheDocument();
    fireEvent.click(screen.getByRole("button", { name: "Reject optional" }));
    act(() => jest.advanceTimersByTime(1_000));
    expect(screen.getByRole("dialog", { name: "Mechanics wanted in your area" })).toBeInTheDocument();
    jest.useRealTimers();
  });
});
