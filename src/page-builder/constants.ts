/**
 * Centralized constants — no hardcoded strings in components.
 */

// ── Accent / Brand ──
export const DEFAULT_ACCENT = "634CF8";

// ── Layout Constraints ──
export const SIDEBAR_MIN_WIDTH = 300;
export const SIDEBAR_MAX_WIDTH = 480;
export const PANEL_MIN_WIDTH = 280;
export const PANEL_MAX_WIDTH = 440;

// ── Storage Keys ──
export const STORAGE_KEY = "page-builder-state";

// ── Font URLs ──
export const FONT_URLS: Record<string, string> = {
  inter: "https://fonts.googleapis.com/css2?family=Inter:wght@400;500;600;700&display=swap",
  "plus-jakarta": "https://fonts.googleapis.com/css2?family=Plus+Jakarta+Sans:wght@400;500;600;700&display=swap",
  "space-grotesk": "https://fonts.googleapis.com/css2?family=Space+Grotesk:wght@400;500;600;700&display=swap",
  poppins: "https://fonts.googleapis.com/css2?family=Poppins:wght@400;500;600;700&display=swap",
  "dm-sans": "https://fonts.googleapis.com/css2?family=DM+Sans:wght@400;500;600;700&display=swap",
  sora: "https://fonts.googleapis.com/css2?family=Sora:wght@400;500;600;700&display=swap",
};

export const FONT_FAMILIES: Record<string, string> = {
  inter: "'Inter', system-ui, sans-serif",
  "plus-jakarta": "'Plus Jakarta Sans', sans-serif",
  "space-grotesk": "'Space Grotesk', sans-serif",
  poppins: "'Poppins', sans-serif",
  "dm-sans": "'DM Sans', sans-serif",
  sora: "'Sora', sans-serif",
};

// ── Preview Widths ──
export const PREVIEW_WIDTHS: Record<string, string> = {
  desktop: "100%",
  tablet: "768px",
  mobile: "375px",
};

// ── Style Presets ──
export const FONT_SIZE_PRESETS = [
  { label: "SM", value: "sm" },
  { label: "Base", value: "base" },
  { label: "LG", value: "lg" },
  { label: "XL", value: "xl" },
  { label: "2XL", value: "2xl" },
  { label: "3XL", value: "3xl" },
  { label: "4XL", value: "4xl" },
] as const;

export const FONT_WEIGHT_OPTIONS = [
  { label: "Light", value: "light" },
  { label: "Normal", value: "normal" },
  { label: "Medium", value: "medium" },
  { label: "Semibold", value: "semibold" },
  { label: "Bold", value: "bold" },
] as const;

export const LINE_HEIGHT_PRESETS = [
  { label: "Tight", value: "tight" },
  { label: "Normal", value: "normal" },
  { label: "Relaxed", value: "relaxed" },
  { label: "Loose", value: "loose" },
] as const;

export const BORDER_WIDTH_OPTIONS = ["0", "1px", "2px", "4px"] as const;
export const BORDER_STYLE_OPTIONS = ["solid", "dashed", "dotted", "none"] as const;

export const BORDER_RADIUS_PRESETS = [
  { label: "None", value: "none" },
  { label: "SM", value: "sm" },
  { label: "MD", value: "md" },
  { label: "LG", value: "lg" },
  { label: "XL", value: "xl" },
  { label: "2XL", value: "2xl" },
  { label: "Full", value: "full" },
] as const;

// ── Animation Presets ──
export const ANIMATION_OPTIONS = [
  { label: "None", value: "none" },
  { label: "Fade In", value: "fade-in" },
  { label: "Fade Up", value: "fade-up" },
  { label: "Fade Down", value: "fade-down" },
  { label: "Slide Up", value: "slide-up" },
  { label: "Slide Down", value: "slide-down" },
  { label: "Slide Left", value: "slide-left" },
  { label: "Slide Right", value: "slide-right" },
  { label: "Zoom In", value: "zoom-in" },
  { label: "Zoom Out", value: "zoom-out" },
  { label: "Bounce", value: "bounce" },
] as const;

// ── Quick Color Presets ──
export const QUICK_COLOR_PRESETS = [
  "634CF8", "3B82F6", "10B981", "F59E0B",
  "EC4899", "EF4444", "8B5CF6", "06B6D4", "171717",
] as const;

// ── Theme Defaults ──
export const LIGHT_THEME_DEFAULTS = {
  foreground: "#1c1c1e",
  background: "#f7f7f8",
  muted: "#71717a",
  surface: "#ffffff",
  separator: "#e4e4e7",
} as const;

export const DARK_THEME_DEFAULTS = {
  foreground: "#fafafa",
  background: "#18181b",
  muted: "#a1a1aa",
  surface: "#27272a",
  separator: "#3f3f46",
} as const;
