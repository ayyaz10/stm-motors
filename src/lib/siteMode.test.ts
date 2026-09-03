import {
  MARKETPLACE_SITE_ORIGIN,
  SERVICE_SITE_ORIGIN,
  STAFF_SITE_ORIGIN,
  resolveSiteMode,
} from "./siteMode";

describe("STM site mode", () => {
  test("routes the UK sales domain to the marketplace", () => {
    expect(resolveSiteMode("stmmotors.co.uk", "auto")).toBe("marketplace");
    expect(resolveSiteMode("www.stmmotors.co.uk", "auto")).toBe("marketplace");
  });

  test("keeps the .com domain on the service website", () => {
    expect(resolveSiteMode("stmmotors.com", "auto")).toBe("service");
  });

  test("routes the staff subdomain to the central staff portal", () => {
    expect(resolveSiteMode("staff.stmmotors.com", "auto", "/login")).toBe("staff");
  });

  test("allows an explicit deployment mode for preview builds", () => {
    expect(resolveSiteMode("localhost", "marketplace")).toBe("marketplace");
    expect(resolveSiteMode("stmmotors.co.uk", "service")).toBe("service");
  });

  test("opens marketplace-only routes locally when mode is auto", () => {
    expect(resolveSiteMode("localhost", "auto", "/sell-your-car")).toBe(
      "marketplace",
    );
    expect(resolveSiteMode("127.0.0.1", "auto", "/cars")).toBe(
      "marketplace",
    );
    expect(resolveSiteMode("localhost", "auto", "/cars-for-sale")).toBe(
      "marketplace",
    );
    expect(
      resolveSiteMode("localhost", "auto", "/cars-for-sale/example-car"),
    ).toBe("marketplace");
    expect(resolveSiteMode("localhost", "auto", "/admin/login")).toBe("staff");
  });

  test("opens central staff routes locally without a production redirect", () => {
    expect(resolveSiteMode("localhost", "auto", "/login")).toBe("staff");
    expect(resolveSiteMode("127.0.0.1", "auto", "/operations/jobs")).toBe("staff");
    expect(resolveSiteMode("localhost", "staff", "/")).toBe("staff");
  });

  test("keeps the service homepage as the local auto-mode default", () => {
    expect(resolveSiteMode("localhost", "auto", "/")).toBe("service");
  });

  test("uses distinct production origins", () => {
    expect(MARKETPLACE_SITE_ORIGIN).toBe("https://stmmotors.co.uk");
    expect(SERVICE_SITE_ORIGIN).toBe("https://stmmotors.com");
    expect(STAFF_SITE_ORIGIN).toBe("https://staff.stmmotors.com");
  });
});
