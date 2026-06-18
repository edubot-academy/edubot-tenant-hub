/**
 * Platform brand token utilities.
 *
 * Keeps palette resolution, validation, and CSS variable computation in one
 * place so BrandingHeadSync, app-context, and the early-brand script all draw
 * from the same source of truth.
 *
 * Semantic role contract (enforced at the component level):
 *   primary   — action, CTAs, progress, conversion moments
 *   secondary — live sessions, success / healthy states
 *   accent    — info, navigation emphasis, selected / link states
 */

// Platform default palette used when a tenant provides no branding.
export const PLATFORM_FALLBACK = {
  primary: "#e57315",   // orange — action
  secondary: "#14b8a6", // teal   — live / success
  accent: "#1f5bdb",    // blue   — info / navigation
} as const;

export interface BrandPalette {
  primary: string;
  secondary: string;
  accent: string;
}

export interface BrandTokens extends BrandPalette {
  /** "r, g, b" tuple string — used in rgba(var(--rgb), alpha) CSS patterns. */
  primaryRgb: string;
  secondaryRgb: string;
  accentRgb: string;
}

function normalizeHex(color: string | null | undefined): string | null {
  if (!color) return null;
  let hex: string;
  if (/^#[0-9A-Fa-f]{3}$/.test(color)) {
    const [, a, b, c] = color;
    hex = `#${a}${a}${b}${b}${c}${c}`.toLowerCase();
  } else if (/^#[0-9A-Fa-f]{6}$/.test(color)) {
    hex = color.toLowerCase();
  } else {
    return null;
  }
  // Reject near-white (avg channel ≥ 220) and near-black (avg channel ≤ 25) —
  // such extremes produce invisible soft-surface tints or unreadable text.
  const r = parseInt(hex.slice(1, 3), 16);
  const g = parseInt(hex.slice(3, 5), 16);
  const b = parseInt(hex.slice(5, 7), 16);
  const avg = (r + g + b) / 3;
  if (avg >= 220 || avg <= 25) return null;
  return hex;
}

function hexToRgbString(hex: string): string {
  const r = parseInt(hex.slice(1, 3), 16);
  const g = parseInt(hex.slice(3, 5), 16);
  const b = parseInt(hex.slice(5, 7), 16);
  return `${r}, ${g}, ${b}`;
}

/**
 * Accepts any partial/null/undefined branding input and returns a complete,
 * validated palette. Invalid hex values silently fall back to platform defaults.
 */
export function resolveBrandPalette(
  input: Partial<BrandPalette> | null | undefined,
): BrandPalette {
  return {
    primary: normalizeHex(input?.primary) ?? PLATFORM_FALLBACK.primary,
    secondary: normalizeHex(input?.secondary) ?? PLATFORM_FALLBACK.secondary,
    accent: normalizeHex(input?.accent) ?? PLATFORM_FALLBACK.accent,
  };
}

/**
 * Derives the full CSS token set from a resolved palette.
 * The RGB strings enable rgba() transparency without color-mix.
 */
export function computeBrandTokens(palette: BrandPalette): BrandTokens {
  const p = normalizeHex(palette.primary) ?? PLATFORM_FALLBACK.primary;
  const s = normalizeHex(palette.secondary) ?? PLATFORM_FALLBACK.secondary;
  const a = normalizeHex(palette.accent) ?? PLATFORM_FALLBACK.accent;
  return {
    primary: p,
    secondary: s,
    accent: a,
    primaryRgb: hexToRgbString(p),
    secondaryRgb: hexToRgbString(s),
    accentRgb: hexToRgbString(a),
  };
}
