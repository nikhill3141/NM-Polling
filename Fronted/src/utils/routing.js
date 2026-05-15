export function getPublicToken() {
  const match = window.location.pathname.match(/^\/polls\/([^/]+)/);
  return match?.[1] || null;
}

export function getRoute() {
  if (window.location.pathname === "/dashboard") return "dashboard";
  return "landing";
}

export function navigateTo(path) {
  window.history.pushState({}, "", path);
}

