export function navigateTo(path: string, replace = false) {
  const nextMethod = replace ? "replaceState" : "pushState";

  window.history[nextMethod](null, "", path);
  window.dispatchEvent(new PopStateEvent("popstate"));
}
