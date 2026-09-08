/**
 * Server-side fetch helper for use in Server Components. Uses API_BASE_URL
 * (server-only — reachable via the docker-compose service network as
 * http://api:4000) rather than NEXT_PUBLIC_API_BASE_URL (browser-facing,
 * typically http://localhost:4000), since inside a container "localhost"
 * would not reach the API service.
 */
const SERVER_API_BASE_URL = process.env.API_BASE_URL ?? process.env.NEXT_PUBLIC_API_BASE_URL ?? "http://localhost:4000";

/**
 * Always fetches fresh data (no ISR caching). Marketplace data — categories,
 * plumber availability, booking status — must never be served stale from a
 * build-time snapshot, so every caller of this helper lives on a route
 * marked `export const dynamic = "force-dynamic"`. Mixing a cached/ISR
 * fetch with a force-dynamic route is also unsupported by Next in
 * production (it throws DYNAMIC_SERVER_USAGE), so this intentionally never
 * passes a `next: { revalidate }` option.
 */
export async function serverGet<T>(path: string): Promise<T | null> {
  try {
    const res = await fetch(`${SERVER_API_BASE_URL}/api/v1${path}`, { cache: "no-store" });
    if (!res.ok) return null;
    return (await res.json()) as T;
  } catch {
    return null;
  }
}
