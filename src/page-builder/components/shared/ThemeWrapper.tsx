import clsx from "clsx";
import type { DesignSettings } from "../../types";
import { FONT_FAMILIES, PREVIEW_WIDTHS } from "../../constants";

/**
 * Builds CSS custom property overrides from DesignSettings.
 * Only sets variables the user has explicitly customized — otherwise
 * the HeroUI defaults from globals.css apply automatically.
 */
export function buildThemeVars(design: DesignSettings): React.CSSProperties {
  const vars: Record<string, string> = {};

  if (design.mood === "dark") {
    if (design.darkForeground) vars["--foreground"] = design.darkForeground;
    if (design.darkBackground) vars["--background"] = design.darkBackground;
    if (design.darkMuted) vars["--muted"] = design.darkMuted;
    if (design.darkSurface) vars["--surface"] = design.darkSurface;
    if (design.darkSeparator) vars["--separator"] = design.darkSeparator;
  } else {
    if (design.lightForeground) vars["--foreground"] = design.lightForeground;
    if (design.lightBackground) vars["--background"] = design.lightBackground;
    if (design.lightMuted) vars["--muted"] = design.lightMuted;
    if (design.lightSurface) vars["--surface"] = design.lightSurface;
    if (design.lightSeparator) vars["--separator"] = design.lightSeparator;
  }

  if (design.successColor) vars["--success"] = `#${design.successColor}`;
  if (design.warningColor) vars["--warning"] = `#${design.warningColor}`;
  if (design.dangerColor) vars["--danger"] = `#${design.dangerColor}`;

  return vars as unknown as React.CSSProperties;
}

/**
 * Wraps page content with the correct theme class and CSS variable overrides.
 * Used by both Canvas and PreviewMode to avoid duplicating theme logic.
 */
export function ThemeWrapper({
  design,
  previewMode = "desktop",
  children,
  className,
  style,
}: {
  design: DesignSettings;
  previewMode?: string;
  children: React.ReactNode;
  className?: string;
  style?: React.CSSProperties;
}) {
  const fontFamily = FONT_FAMILIES[design.typography] || "system-ui, sans-serif";
  const maxWidth = PREVIEW_WIDTHS[previewMode] || "100%";
  const themeVars = buildThemeVars(design);

  return (
    <div
      className={clsx(
        "mx-auto min-h-full overflow-hidden transition-all duration-300 bg-background text-foreground",
        design.mood === "dark" ? "dark" : "",
        className,
      )}
      style={{
        maxWidth,
        fontFamily,
        ...themeVars,
        ...style,
      }}
    >
      {children}
    </div>
  );
}
