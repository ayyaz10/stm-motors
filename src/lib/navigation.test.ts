import { navigateTo } from "./navigation";

describe("SPA navigation scroll position", () => {
  const scrollTo = jest.fn();

  beforeEach(() => {
    window.history.replaceState(null, "", "/current");
    Object.defineProperty(window, "scrollTo", {
      configurable: true,
      value: scrollTo,
    });
    scrollTo.mockClear();
  });

  test("scrolls to the top when opening another page", () => {
    navigateTo("/contact");

    expect(window.location.pathname).toBe("/contact");
    expect(scrollTo).toHaveBeenCalledWith({
      top: 0,
      left: 0,
      behavior: "auto",
    });
  });

  test("preserves intentional hash-section navigation", () => {
    navigateTo("/#faq");

    expect(window.location.hash).toBe("#faq");
    expect(scrollTo).not.toHaveBeenCalled();
  });

  test("also resets scroll for replace navigation", () => {
    navigateTo("/book", true);

    expect(window.location.pathname).toBe("/book");
    expect(scrollTo).toHaveBeenCalledTimes(1);
  });
});
