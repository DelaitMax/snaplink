/**
 * statsUrl приходит в виде `${PUBLIC_BASE_URL}/api/links/{statsToken}/stats`.
 * Достаём токен для клиентского роута /s/:statsToken.
 */
export function extractStatsToken(statsUrl: string): string {
  const segments = statsUrl.split("/").filter(Boolean);
  const statsIndex = segments.lastIndexOf("stats");
  return statsIndex > 0 ? (segments[statsIndex - 1] ?? "") : "";
}
