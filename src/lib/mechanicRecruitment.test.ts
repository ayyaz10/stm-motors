import {
  MECHANIC_RECRUITMENT_COOLDOWN_MS,
  isMechanicRecruitmentEligible,
  isMechanicRecruitmentInCooldown,
} from "./mechanicRecruitment";

describe("mechanic recruitment popup rules", () => {
  test("is eligible only on the service homepage", () => {
    expect(isMechanicRecruitmentEligible("service", "/", "stmmotors.com")).toBe(true);
    expect(isMechanicRecruitmentEligible("service", "/", "localhost")).toBe(true);
    expect(isMechanicRecruitmentEligible("service", "/book", "stmmotors.com")).toBe(false);
    expect(isMechanicRecruitmentEligible("marketplace", "/", "stmmotors.co.uk")).toBe(false);
    expect(isMechanicRecruitmentEligible("staff", "/", "staff.stmmotors.com")).toBe(false);
    expect(isMechanicRecruitmentEligible("service", "/", "preview.example.com")).toBe(false);
  });

  test("uses a seven-day dismissal cooldown and ignores malformed values", () => {
    const now = Date.UTC(2026, 8, 3);
    expect(isMechanicRecruitmentInCooldown(String(now - 1_000), now)).toBe(true);
    expect(
      isMechanicRecruitmentInCooldown(
        String(now - MECHANIC_RECRUITMENT_COOLDOWN_MS),
        now,
      ),
    ).toBe(false);
    expect(isMechanicRecruitmentInCooldown("invalid", now)).toBe(false);
    expect(isMechanicRecruitmentInCooldown(String(now + 1_000), now)).toBe(false);
  });
});
