const protectedPrefixes = [
  "/dashboard",
  "/salary",
  "/accounts",
  "/transactions",
  "/bills",
  "/pots",
  "/goals",
  "/wishlist"
];

export function isProtectedPath(pathname: string) {
  return protectedPrefixes.some(
    (prefix) => pathname === prefix || pathname.startsWith(`${prefix}/`)
  );
}
