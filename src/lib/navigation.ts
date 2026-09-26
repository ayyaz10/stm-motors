export function navigateTo(path: string, replace = false) {
  const nextMethod = replace ? "replaceState" : "pushState";
  const targetUrl = new URL(path, window.location.href);

  window.history[nextMethod](null, "", path);
  window.dispatchEvent(new PopStateEvent("popstate"));

  // Page-to-page SPA navigation should behave like a normal document load.
  // Hash destinations keep their intentional section-scrolling behaviour.
  if (!targetUrl.hash) {
    window.scrollTo({ top: 0, left: 0, behavior: "auto" });
  }
}
