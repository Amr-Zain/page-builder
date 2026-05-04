import { Button, Tooltip } from "@heroui/react";
import clsx from "clsx";
import { Monitor, Tablet, Smartphone, Undo2, Redo2, PanelLeft, PanelRight, Moon, Sun, Globe, GlobeLock, Download } from "lucide-react";
import { Link } from "react-router-dom";

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
    <nav className="sticky top-0 z-40 flex h-14 items-center justify-between border-b border-separator/30 bg-white/70 dark:bg-background/70 backdrop-blur-md px-4 gap-4 overflow-x-auto shadow-[0_1px_2px_rgba(0,0,0,0.02)]">
      {/* ── Left: Logo + Sidebar Toggle ── */}
      <div className="flex items-center gap-3">
        <Link to="/projects" className="flex items-center gap-2 group transition-transform hover:scale-[1.02]">
          <div className="flex h-8 w-8 items-center justify-center rounded-sm bg-gradient-to-tr from-[#634CF8] to-[#8E7CFF] text-white shadow-md shadow-[#634CF8]/15 transition-all group-hover:shadow-[#634CF8]/30">
            <span className="text-lg font-bold">⬡</span>
          </div>
          <span className="hidden lg:inline text-[14px] font-bold tracking-tight text-foreground/90">
            Page Builder
          </span>
        </Link>

        <div className="w-px h-6 bg-separator/30 mx-2" />

        {/* Sidebar Toggles */}
        <div className="flex items-center gap-1 bg-surface/50 p-1 rounded-sm border border-separator/20">
          <Tooltip delay={200}>
            <button
              className={clsx(
                "flex h-8 w-8 items-center justify-center rounded-sm transition-all duration-200",
                leftSidebarVisible
                  ? "text-[#634CF8] bg-white dark:bg-background shadow-sm ring-1 ring-separator/10"
                  : "text-muted hover:text-foreground hover:bg-white/50 dark:hover:bg-background/50",
              )}
              onClick={onToggleLeftSidebar}
            >
              <PanelLeft size={18} />
            </button>
            <Tooltip.Content>
              <p className="text-xs font-medium">
                {leftSidebarVisible ? "Hide" : "Show"} components
              </p>
            </Tooltip.Content>
          </Tooltip>

          <Tooltip delay={200}>
            <button
              className={clsx(
                "flex h-8 w-8 items-center justify-center rounded-sm transition-all duration-200",
                rightSidebarVisible
                  ? "text-[#634CF8] bg-white dark:bg-background shadow-sm ring-1 ring-separator/10"
                  : "text-muted hover:text-foreground hover:bg-white/50 dark:hover:bg-background/50",
              )}
              onClick={onToggleRightSidebar}
            >
              <PanelRight size={18} />
            </button>
            <Tooltip.Content>
              <p className="text-xs font-medium">
                {rightSidebarVisible ? "Hide" : "Show"} properties
              </p>
            </Tooltip.Content>
          </Tooltip>
        </div>
      </div>

      {/* ── Center: Device Preview + Undo/Redo ── */}
      <div className="flex items-center gap-4">
        {/* Undo / Redo */}
        <div className="flex items-center gap-1 bg-surface/50 p-1 rounded-sm border border-separator/20">
          <Tooltip delay={200}>
            <button
              className="flex h-8 w-8 items-center justify-center rounded-sm text-muted hover:text-foreground hover:bg-white/50 dark:hover:bg-background/50 disabled:opacity-20 disabled:cursor-not-allowed transition-all"
              disabled={!canUndo}
              onClick={onUndo}
            >
              <Undo2 size={18} />
            </button>
            <Tooltip.Content>
              <p className="text-xs font-medium">Undo (Ctrl+Z)</p>
            </Tooltip.Content>
          </Tooltip>
          <Tooltip delay={200}>
            <button
              className="flex h-8 w-8 items-center justify-center rounded-sm text-muted hover:text-foreground hover:bg-white/50 dark:hover:bg-background/50 disabled:opacity-20 disabled:cursor-not-allowed transition-all"
              disabled={!canRedo}
              onClick={onRedo}
            >
              <Redo2 size={18} />
            </button>
            <Tooltip.Content>
              <p className="text-xs font-medium">Redo (Ctrl+Y)</p>
            </Tooltip.Content>
          </Tooltip>
        </div>

        <div className="w-px h-6 bg-separator/30" />

        {/* Device preview toggle */}
        <div className="flex items-center gap-1 bg-surface/50 p-1 rounded-sm border border-separator/20">
          {devices.map((device) => (
            <Tooltip delay={200} key={device.id}>
              <button
                className={clsx(
                  "flex h-8 w-10 items-center justify-center rounded-sm transition-all duration-200",
                  previewMode === device.id
                    ? "bg-white dark:bg-background shadow-md text-[#634CF8] ring-1 ring-separator/5 scale-105"
                    : "text-muted hover:text-foreground hover:bg-white/30 dark:hover:bg-background/30",
                )}
                onClick={() => onPreviewModeChange(device.id)}
              >
                {device.icon}
              </button>
              <Tooltip.Content>
                <p className="text-xs font-medium">{device.label}</p>
              </Tooltip.Content>
            </Tooltip>
          ))}
        </div>
      </div>

      {/* ── Right: Language, Theme, Actions ── */}
      <div className="flex items-center gap-3">
        {/* Language switcher */}
        <div className="hidden xl:flex items-center gap-1 bg-surface/50 p-1 rounded-sm border border-separator/20">
          <button
            className={clsx(
              "flex h-8 px-3 items-center justify-center rounded-sm text-[11px] font-bold tracking-wider transition-all",
              language === "en"
                ? "bg-white dark:bg-background shadow-sm text-[#634CF8]"
                : "text-muted hover:text-foreground",
            )}
            onClick={() => onLanguageChange("en")}
          >
            EN
          </button>
          <button
            className={clsx(
              "flex h-8 px-3 items-center justify-center rounded-sm text-[11px] font-bold tracking-wider transition-all",
              language === "ar"
                ? "bg-white dark:bg-background shadow-sm text-[#634CF8]"
                : "text-muted hover:text-foreground",
            )}
            onClick={() => onLanguageChange("ar")}
          >
            AR
          </button>
        </div>

        {/* Theme switcher */}
        <Tooltip delay={200}>
          <button
            className="flex h-9 w-9 items-center justify-center rounded-sm bg-surface/50 border border-separator/20 text-muted hover:text-foreground hover:bg-white dark:hover:bg-background shadow-sm transition-all"
            onClick={() => onThemeChange(theme === "light" ? "dark" : "light")}
          >
            {theme === "light" ? (
              <Moon size={18} className="transition-transform group-hover:-rotate-12" />
            ) : (
              <Sun size={18} className="transition-transform group-hover:rotate-45" />
            )}
          </button>
          <Tooltip.Content>
            <p className="text-xs font-medium">
              {theme === "light" ? "Switch to Dark" : "Switch to Light"}
            </p>
          </Tooltip.Content>
        </Tooltip>

        <div className="w-px h-6 bg-separator/30 mx-1" />

        <div className="flex items-center gap-2">
          <Button 
            size="sm" 
            variant="secondary" 
            className="font-semibold bg-surface/80 hover:bg-surface border border-separator/10"
            onPress={onPreview}
          >
            Preview
          </Button>

          <div className="hidden lg:flex items-center gap-2">
            <Button 
              size="sm" 
              variant="secondary" 
              className="font-semibold bg-surface/80 hover:bg-surface border border-separator/10"
              onPress={onExportHtml}
            >
              HTML
            </Button>
            <Button 
              size="sm" 
              variant="secondary" 
              className="font-semibold bg-surface/80 hover:bg-surface border border-separator/10"
              onPress={onExportProject}
            >
              Full Site
            </Button>
            <Button 
              size="sm" 
              variant="secondary" 
              className="font-semibold bg-surface/80 hover:bg-surface border border-separator/10"
              onPress={onExportReact}
            >
              React
            </Button>
          </div>
          
          <Tooltip delay={200}>
            <Button
              size="sm"
              style={{ 
                background: "linear-gradient(135deg, #634CF8 0%, #8E7CFF 100%)",
                color: "#fff",
                fontWeight: 600,
                boxShadow: "0 2px 8px rgba(99, 76, 248, 0.15)"
              }}
              className="hover:scale-[1.02] active:scale-[0.98] transition-all"
              onPress={() => {
                if (!pageTitle?.trim() || !pageSlug?.trim()) {
                  alert("Please provide a title and slug in settings first.");
                  return;
                }
                isPublished ? onUnpublish?.() : onPublish?.();
              }}
            >
              {isPublished ? <GlobeLock size={16} /> : <Globe size={16} />}
              {isPublished ? "Unpublish" : "Publish"}
            </Button>
            <Tooltip.Content>
              <p className="text-xs font-medium">{isPublished ? "Make private" : "Go live"}</p>
            </Tooltip.Content>
          </Tooltip>
        </div>
      </div>
    </nav>
  );
}
