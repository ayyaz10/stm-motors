describe("Google tracking consent gate", () => {
  beforeEach(() => {
    jest.resetModules();
    document.head.querySelectorAll('script[data-stm-google-tag="true"]').forEach((script) => script.remove());
    delete window.gtag;
    delete window.dataLayer;
    Object.defineProperty(globalThis, "__STM_GA4_MEASUREMENT_ID__", { configurable: true, value: "G-TEST123" });
    Object.defineProperty(globalThis, "__STM_GOOGLE_ADS_ID__", { configurable: true, value: "AW-TEST123" });
    Object.defineProperty(globalThis, "__STM_GOOGLE_ADS_CONTACT_LABEL__", { configurable: true, value: "CONTACT" });
  });

  afterEach(() => {
    [
      "__STM_GA4_MEASUREMENT_ID__",
      "__STM_GOOGLE_ADS_ID__",
      "__STM_GOOGLE_ADS_CONTACT_LABEL__",
    ].forEach((key) => Reflect.deleteProperty(globalThis, key));
  });

  test("does not request Google tags while optional consent is denied", async () => {
    const { applyGoogleConsent } = await import("./googleTracking");
    applyGoogleConsent({ necessary: true, functional: false, analytics: false, marketing: false }, "service");
    expect(document.head.querySelector('script[data-stm-google-tag="true"]')).toBeNull();
    expect(window.dataLayer).toBeUndefined();
  });

  test("loads after analytics consent and queues default-denied before update", async () => {
    const { applyGoogleConsent } = await import("./googleTracking");
    applyGoogleConsent({ necessary: true, functional: false, analytics: true, marketing: false }, "service");
    expect(document.head.querySelector('script[data-stm-google-tag="true"]')).toHaveAttribute(
      "src",
      "https://www.googletagmanager.com/gtag/js?id=G-TEST123",
    );
    expect(window.dataLayer?.[0]).toEqual(expect.arrayContaining(["consent", "default"]));
    expect(window.dataLayer?.[2]).toEqual(expect.arrayContaining(["consent", "update"]));
  });

  test("never loads public tracking in staff mode", async () => {
    const { applyGoogleConsent } = await import("./googleTracking");
    applyGoogleConsent({ necessary: true, functional: true, analytics: true, marketing: true }, "staff");
    expect(document.head.querySelector('script[data-stm-google-tag="true"]')).toBeNull();
  });

  test("updates consent and removes accessible Google cookies after withdrawal", async () => {
    const { applyGoogleConsent } = await import("./googleTracking");
    applyGoogleConsent({ necessary: true, functional: true, analytics: true, marketing: true }, "service");
    document.cookie = "_ga=test; path=/";
    applyGoogleConsent({ necessary: true, functional: false, analytics: false, marketing: false }, "service");

    expect(document.cookie).not.toContain("_ga=test");
    expect(window.dataLayer).toContainEqual([
      "consent",
      "update",
      expect.objectContaining({ analytics_storage: "denied", ad_storage: "denied" }),
    ]);
  });
});
