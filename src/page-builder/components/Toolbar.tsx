import { Button, Tooltip } from "@heroui/react";
import clsx from "clsx";
import { Monitor, Tablet, Smartphone, Undo2, Redo2, PanelLeft, PanelRight, Moon, Sun, Globe, GlobeLock } from "lucide-react";

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
  onExportProject,
  isPublished,
  pageTitle,
  pageSlug,
  onPublish,
  onUnpublish,
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
  onExportProject: () => void;
  isPublished?: boolean;
  pageTitle?: string;
  pageSlug?: string;
  onPublish?: () => void;
  onUnpublish?: () => void;
}) {
  const devices = [
    {
      id: "desktop" as const,
      label: "Desktop",
      icon: <Monitor size={16} />,
    },
    {
      id: "tablet" as const,
      label: "Tablet",
      icon: <Tablet size={16} />,
    },
    {
      id: "mobile" as const,
      label: "Mobile",
      icon: <Smartphone size={16} />,
    },
  ];

  return (
    <nav className="sticky top-0 z-40 flex h-12 items-center justify-between border-b border-separator/50 bg-white/90 dark:bg-background/90 backdrop-blur-xl px-2 md:px-3 gap-2 overflow-x-auto">
      {/* ── Left: Logo + Sidebar Toggle ── */}
      <div className="flex items-center gap-2">
        <span className="text-sm font-bold text-[#634CF8]">⬡</span>
        <span className="hidden md:inline text-[13px] font-semibold text-foreground">
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
            <PanelLeft size={16} />
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
            <PanelRight size={16} />
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
              <Undo2 size={16} />
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
              <Redo2 size={16} />
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
                  "flex h-6 w-6 md:h-7 md:w-8 items-center justify-center rounded-md transition-all",
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
        <div className="hidden md:flex items-center gap-0.5 rounded-lg bg-[#F5F5F5] dark:bg-surface p-0.5">
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

        <div className="hidden md:block w-px h-5 bg-separator/50" />

        {/* Theme switcher */}
        <Tooltip delay={200}>
          <button
            className="flex h-7 w-7 items-center justify-center rounded-md text-muted hover:text-foreground hover:bg-surface transition-colors"
            onClick={() => onThemeChange(theme === "light" ? "dark" : "light")}
          >
            {theme === "light" ? (
              <Moon size={16} />
            ) : (
              <Sun size={16} />
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
        <Button className="hidden lg:inline-flex" size="sm" variant="secondary" onPress={onExportHtml}>
          HTML
        </Button>
        <Button className="hidden lg:inline-flex" size="sm" variant="secondary" onPress={onExportProject}>
          Full Site
        </Button>
        <Button className="hidden lg:inline-flex" size="sm" variant="secondary" onPress={onExportReact}>
          React
        </Button>
        {isPublished ? (
          <Tooltip delay={200}>
            <Button
              size="sm"
              variant="secondary"
              onPress={onUnpublish}
            >
              <GlobeLock size={14} />
              Unpublish
            </Button>
            <Tooltip.Content>
              <p className="text-xs">Revert to draft</p>
            </Tooltip.Content>
          </Tooltip>
        ) : (
          <Tooltip delay={200}>
            <Button
              size="sm"
              style={{ backgroundColor: "#634CF8", color: "#fff" }}
              onPress={() => {
                if (!pageTitle?.trim() || !pageSlug?.trim()) {
                  alert("Cannot publish: Title and slug must not be empty.");
                  return;
                }
                onPublish?.();
              }}
            >
              <Globe size={14} />
              Publish
            </Button>
            <Tooltip.Content>
              <p className="text-xs">Publish this page</p>
            </Tooltip.Content>
          </Tooltip>
        )}
      </div>
    </nav>
  );
}
