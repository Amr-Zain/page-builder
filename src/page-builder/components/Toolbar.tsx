import { Button, Tooltip } from "@heroui/react";
import clsx from "clsx";

export function Toolbar({
  previewMode,
  onPreviewModeChange,
  onUndo,
  onRedo,
  canUndo,
  canRedo,
  leftSidebarVisible,
  rightSidebarVisible,
  onToggleLeftSidebar,
  onToggleRightSidebar,
  language,
  onLanguageChange,
  theme,
  onThemeChange,
  onPreview,
  onExportHtml,
  onExportReact,
}: {
  previewMode: "desktop" | "tablet" | "mobile";
  onPreviewModeChange: (mode: "desktop" | "tablet" | "mobile") => void;
  onUndo: () => void;
  onRedo: () => void;
  canUndo: boolean;
  canRedo: boolean;
  leftSidebarVisible: boolean;
  rightSidebarVisible: boolean;
  onToggleLeftSidebar: () => void;
  onToggleRightSidebar: () => void;
  language: "en" | "ar";
  onLanguageChange: (lang: "en" | "ar") => void;
  theme: "light" | "dark";
  onThemeChange: (theme: "light" | "dark") => void;
  onPreview: () => void;
  onExportHtml: () => void;
  onExportReact: () => void;
}) {
  const devices = [
    {
      id: "desktop" as const,
      label: "Desktop",
      icon: (
        <svg
          className="h-4 w-4"
          fill="none"
          stroke="currentColor"
          viewBox="0 0 24 24"
        >
          <path
            d="M9.75 17L9 20l-1 1h8l-1-1-.75-3M3 13h18M5 17h14a2 2 0 002-2V5a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z"
            strokeLinecap="round"
            strokeLinejoin="round"
            strokeWidth={1.5}
          />
        </svg>
      ),
    },
    {
      id: "tablet" as const,
      label: "Tablet",
      icon: (
        <svg
          className="h-4 w-4"
          fill="none"
          stroke="currentColor"
          viewBox="0 0 24 24"
        >
          <path
            d="M12 18h.01M7 21h10a2 2 0 002-2V5a2 2 0 00-2-2H7a2 2 0 00-2 2v14a2 2 0 002 2z"
            strokeLinecap="round"
            strokeLinejoin="round"
            strokeWidth={1.5}
          />
        </svg>
      ),
    },
    {
      id: "mobile" as const,
      label: "Mobile",
      icon: (
        <svg
          className="h-4 w-4"
          fill="none"
          stroke="currentColor"
          viewBox="0 0 24 24"
        >
          <path
            d="M12 18h.01M8 21h8a2 2 0 002-2V5a2 2 0 00-2-2H8a2 2 0 00-2 2v14a2 2 0 002 2z"
            strokeLinecap="round"
            strokeLinejoin="round"
            strokeWidth={1.5}
          />
        </svg>
      ),
    },
  ];

  return (
    <nav className="sticky top-0 z-40 flex h-12 items-center justify-between border-b border-separator/50 bg-white/90 dark:bg-background/90 backdrop-blur-xl px-3 gap-2">
      {/* ── Left: Logo + Sidebar Toggle ── */}
      <div className="flex items-center gap-2">
        <span className="text-sm font-bold text-[#634CF8]">⬡</span>
        <span className="text-[13px] font-semibold text-foreground">
          Page Builder
        </span>

        <div className="w-px h-5 bg-separator/50 mx-1" />

        {/* Toggle left sidebar */}
        <Tooltip delay={200}>
          <button
            className={clsx(
              "flex h-7 w-7 items-center justify-center rounded-md transition-colors",
              leftSidebarVisible
                ? "text-foreground bg-surface"
                : "text-muted hover:text-foreground hover:bg-surface",
            )}
            onClick={onToggleLeftSidebar}
          >
            <svg
              className="h-4 w-4"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
            >
              <path
                d="M3 3h7v18H3zM10 3h11v18H10"
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={1.5}
              />
            </svg>
          </button>
          <Tooltip.Content>
            <p className="text-xs">
              {leftSidebarVisible ? "Hide" : "Show"} left panel
            </p>
          </Tooltip.Content>
        </Tooltip>

        {/* Toggle right sidebar */}
        <Tooltip delay={200}>
          <button
            className={clsx(
              "flex h-7 w-7 items-center justify-center rounded-md transition-colors",
              rightSidebarVisible
                ? "text-foreground bg-surface"
                : "text-muted hover:text-foreground hover:bg-surface",
            )}
            onClick={onToggleRightSidebar}
          >
            <svg
              className="h-4 w-4"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
            >
              <path
                d="M14 3h7v18h-7zM3 3h11v18H3"
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={1.5}
              />
            </svg>
          </button>
          <Tooltip.Content>
            <p className="text-xs">
              {rightSidebarVisible ? "Hide" : "Show"} right panel
            </p>
          </Tooltip.Content>
        </Tooltip>
      </div>

      {/* ── Center: Device Preview + Undo/Redo ── */}
      <div className="flex items-center gap-3">
        {/* Undo / Redo */}
        <div className="flex items-center gap-0.5">
          <Tooltip delay={200}>
            <button
              className="flex h-7 w-7 items-center justify-center rounded-md text-muted hover:text-foreground hover:bg-surface disabled:opacity-30 disabled:cursor-not-allowed transition-colors"
              disabled={!canUndo}
              onClick={onUndo}
            >
              <svg
                className="h-4 w-4"
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
              >
                <path
                  d="M3 10h10a5 5 0 015 5v2M3 10l4-4M3 10l4 4"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                />
              </svg>
            </button>
            <Tooltip.Content>
              <p className="text-xs">Undo</p>
            </Tooltip.Content>
          </Tooltip>
          <Tooltip delay={200}>
            <button
              className="flex h-7 w-7 items-center justify-center rounded-md text-muted hover:text-foreground hover:bg-surface disabled:opacity-30 disabled:cursor-not-allowed transition-colors"
              disabled={!canRedo}
              onClick={onRedo}
            >
              <svg
                className="h-4 w-4"
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
              >
                <path
                  d="M21 10H11a5 5 0 00-5 5v2M21 10l-4-4M21 10l-4 4"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                />
              </svg>
            </button>
            <Tooltip.Content>
              <p className="text-xs">Redo</p>
            </Tooltip.Content>
          </Tooltip>
        </div>

        <div className="w-px h-5 bg-separator/50" />

        {/* Device preview toggle */}
        <div className="flex items-center gap-0.5 rounded-lg bg-[#F5F5F5] dark:bg-surface p-0.5">
          {devices.map((device) => (
            <Tooltip delay={200} key={device.id}>
              <button
                className={clsx(
                  "flex h-7 w-8 items-center justify-center rounded-md transition-all",
                  previewMode === device.id
                    ? "bg-white dark:bg-background shadow-sm text-foreground"
                    : "text-muted hover:text-foreground",
                )}
                onClick={() => onPreviewModeChange(device.id)}
              >
                {device.icon}
              </button>
              <Tooltip.Content>
                <p className="text-xs">{device.label}</p>
              </Tooltip.Content>
            </Tooltip>
          ))}
        </div>
      </div>

      {/* ── Right: Language, Theme, Actions ── */}
      <div className="flex items-center gap-2">
        {/* Language switcher */}
        <div className="flex items-center gap-0.5 rounded-lg bg-[#F5F5F5] dark:bg-surface p-0.5">
          <button
            className={clsx(
              "flex h-7 items-center justify-center rounded-md px-2 text-[11px] font-semibold transition-all",
              language === "en"
                ? "bg-white dark:bg-background shadow-sm text-foreground"
                : "text-muted hover:text-foreground",
            )}
            onClick={() => onLanguageChange("en")}
          >
            EN
          </button>
          <button
            className={clsx(
              "flex h-7 items-center justify-center rounded-md px-2 text-[11px] font-semibold transition-all",
              language === "ar"
                ? "bg-white dark:bg-background shadow-sm text-foreground"
                : "text-muted hover:text-foreground",
            )}
            onClick={() => onLanguageChange("ar")}
          >
            AR
          </button>
        </div>

        <div className="w-px h-5 bg-separator/50" />

        {/* Theme switcher */}
        <Tooltip delay={200}>
          <button
            className="flex h-7 w-7 items-center justify-center rounded-md text-muted hover:text-foreground hover:bg-surface transition-colors"
            onClick={() => onThemeChange(theme === "light" ? "dark" : "light")}
          >
            {theme === "light" ? (
              <svg
                className="h-4 w-4"
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
              >
                <path
                  d="M21.752 15.002A9.718 9.718 0 0118 15.75c-5.385 0-9.75-4.365-9.75-9.75 0-1.33.266-2.597.748-3.752A9.753 9.753 0 003 11.25C3 16.635 7.365 21 12.75 21a9.753 9.753 0 009.002-5.998z"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={1.5}
                />
              </svg>
            ) : (
              <svg
                className="h-4 w-4"
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
              >
                <path
                  d="M12 3v1m0 16v1m9-9h-1M4 12H3m15.364 6.364l-.707-.707M6.343 6.343l-.707-.707m12.728 0l-.707.707M6.343 17.657l-.707.707M16 12a4 4 0 11-8 0 4 4 0 018 0z"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={1.5}
                />
              </svg>
            )}
          </button>
          <Tooltip.Content>
            <p className="text-xs">
              {theme === "light" ? "Dark" : "Light"} mode
            </p>
          </Tooltip.Content>
        </Tooltip>

        <div className="w-px h-5 bg-separator/50" />

        <Button size="sm" variant="secondary" onPress={onPreview}>
          Preview
        </Button>
        <Button size="sm" variant="secondary" onPress={onExportHtml}>
          HTML
        </Button>
        <Button size="sm" variant="secondary" onPress={onExportReact}>
          React
        </Button>
        <Button size="sm" style={{ backgroundColor: "#634CF8", color: "#fff" }}>
          Publish
        </Button>
      </div>
    </nav>
  );
}
