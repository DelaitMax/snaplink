/**
 * Colors used to render the QR code image.
 *
 * These intentionally do NOT follow the active app theme (light/dark): the
 * QR code is baked into a raster image at generation time via the `qrcode`
 * package, which needs plain color strings, not CSS variables — and it
 * always needs dark modules on a light background to stay scannable and
 * legible, regardless of which theme the surrounding UI is in.
 *
 * Values are kept in sync with the light theme's `--app-ink` / `--app-surface`
 * tokens in src/index.css.
 */
export const QR_CODE_COLORS = {
  dark: "#14171f",
  light: "#ffffff",
} as const;
