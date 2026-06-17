type SearchLike =
  | URLSearchParams
  | {
      get(name: string): string | null;
    }
  | Record<string, string | string[] | undefined>;

function getParam(params: SearchLike, name: string): string | null {
  const maybeUrlParams = params as { get?: unknown };
  if (typeof maybeUrlParams.get === "function") {
    return (maybeUrlParams.get as (key: string) => string | null)(name);
  }

  const value = (params as Record<string, string | string[] | undefined>)[name];
  if (Array.isArray(value)) return value[0] ?? null;
  return value ?? null;
}

export function getSafeRedirectPath(value: string | null): string {
  if (!value || !value.startsWith("/") || value.startsWith("//")) return "/";
  if (value === "/login" || value.startsWith("/login?") || value.startsWith("/login/")) return "/";
  if (value === "/signup" || value.startsWith("/signup?") || value.startsWith("/signup/")) return "/";
  if (value === "/register" || value.startsWith("/register?") || value.startsWith("/register/")) return "/";
  return value;
}

function getKaemFormNextPath(params: SearchLike): string | null {
  if (getParam(params, "product") !== "kaemform") return null;

  const next = getParam(params, "next");
  if (!next || !next.startsWith("/") || next.startsWith("//")) return null;

  const url = new URL(next, "https://kaemnur.local");
  const allowedPaths = new Set([
    "/api/products/kaemform/web-login",
    "/api/products/kaemform/desktop-login",
  ]);
  if (!allowedPaths.has(url.pathname)) return null;

  url.searchParams.set("product", "kaemform");

  const redirectTo = getParam(params, "redirect_to");
  if (redirectTo) url.searchParams.set("redirect_to", redirectTo);

  const state = getParam(params, "state");
  if (state) url.searchParams.set("state", state);

  return `${url.pathname}${url.search}`;
}

export function getAuthRedirectPath(params: SearchLike): string {
  const explicit = getSafeRedirectPath(getParam(params, "redirect"));
  if (explicit !== "/") return explicit;

  return getKaemFormNextPath(params) ?? "/";
}
