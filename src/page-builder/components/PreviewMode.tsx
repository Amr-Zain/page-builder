import { Button } from "@heroui/react";
import clsx from "clsx";
import { Monitor, Tablet, Smartphone } from "lucide-react";
import { useState } from "react";

import type { BlockInstance, DesignSettings } from "../types";
import { BlockRenderer } from "./BlockRenderer";
import { BLOCK_DEFINITIONS } from "../data";

const FONT_FAMILIES: Record<string, string> = {
  inter: "'Inter', system-ui, sans-serif",
  "plus-jakarta": "'Plus Jakarta Sans', sans-serif",
  "space-grotesk": "'Space Grotesk', sans-serif",
  poppins: "'Poppins', sans-serif",
  "dm-sans": "'DM Sans', sans-serif",
  sora: "'Sora', sans-serif",
};

/**
 * Full-screen preview mode — shows the page without any builder chrome.
 * Press Escape or click the floating close button to exit.
 */
export function PreviewMode({
  blocks,
  design,
  onClose,
}: {
  blocks: BlockInstance[];
  design: DesignSettings;
  onClose: () => void;
}) {
  const [device, setDevice] = useState<"desktop" | "tablet" | "mobile">(
    "desktop",
  );

  const fontFamily =
    FONT_FAMILIES[design.typography] || "system-ui, sans-serif";
  const canvasWidth = { desktop: "100%", tablet: "768px", mobile: "375px" }[
    device
  ];

  return (
    <div className="fixed inset-0 z-50 flex flex-col bg-[#F0F0F3] dark:bg-[#0a0a0a]">
      {/* Floating toolbar */}
      <div className="absolute top-4 left-1/2 -translate-x-1/2 z-50 flex items-center gap-3 rounded-2xl bg-foreground/90 dark:bg-surface/95 backdrop-blur-xl shadow-2xl border border-white/10 px-4 py-2">
        {/* Device switcher */}
        <div className="flex items-center gap-0.5 rounded-lg bg-white/10 p-0.5">
          {(["desktop", "tablet", "mobile"] as const).map((d) => (
            <button
              className={clsx(
                "flex h-7 w-8 items-center justify-center rounded-md transition-all text-xs",
                device === d
                  ? "bg-white/20 text-white"
                  : "text-white/50 hover:text-white/80",
              )}
              key={d}
              onClick={() => setDevice(d)}
            >
              {d === "desktop" ? <Monitor size={14} /> : d === "tablet" ? <Tablet size={14} /> : <Smartphone size={14} />}
            </button>
          ))}
        </div>

        <div className="w-px h-5 bg-white/20" />

        <span className="text-[11px] text-white/60 font-medium">
          Preview Mode
        </span>

        <div className="w-px h-5 bg-white/20" />

        <Button
          size="sm"
          style={{ backgroundColor: "#634CF8", color: "#fff" }}
          onPress={onClose}
        >
          ← Back to Editor
        </Button>
      </div>

      {/* Page preview */}
      <div className="flex-1 overflow-y-auto pt-16 pb-8 px-4">
        <div
          className={clsx(
            "mx-auto overflow-hidden transition-all duration-300",
            design.mood === "dark"
              ? "bg-[#0f0f1a] text-white"
              : "bg-white text-[#1a1a2e]",
            device === "desktop"
              ? "rounded-none shadow-none"
              : "rounded-xl shadow-2xl border border-separator/30",
          )}
          style={{ maxWidth: canvasWidth, fontFamily }}
        >
          {blocks.map((block) => (
            <PreviewBlock
              block={block}
              design={design}
              previewMode={device}
              key={block.id}
            />
          ))}
        </div>
      </div>

      {/* Keyboard hint */}
      <div className="absolute bottom-4 left-1/2 -translate-x-1/2">
        <span className="text-[10px] text-muted bg-white/80 dark:bg-surface/80 backdrop-blur-sm rounded-full px-3 py-1 shadow-sm">
          Press <kbd className="font-mono font-semibold">Esc</kbd> to exit
          preview
        </span>
      </div>
    </div>
  );
}

/**
 * Recursively renders a block and its nested children for preview.
 * Passes previewMode so blocks can adapt their layout.
 */
function PreviewBlock({
  block,
  design,
  previewMode,
}: {
  block: BlockInstance;
  design: DesignSettings;
  previewMode: string;
}) {
  const blockDef = BLOCK_DEFINITIONS.find((d) => d.type === block.type);
  const staticZones = blockDef?.zones;

  // Generate zones dynamically for layout blocks (same logic as Canvas)
  let zones: Array<{ name: string; label: string }> | undefined;
  if (staticZones) {
    if (block.type === "columns") {
      const count = Math.max(1, (block.props.count as number) || 2);
      zones = Array.from({ length: count }, (_, i) => ({
        name: `col-${i + 1}`,
        label: `Column ${i + 1}`,
      }));
    } else if (block.type === "grid") {
      const cols = Math.max(1, (block.props.columns as number) || 2);
      const childZoneNames = Object.keys(block.children ?? {});
      const maxUsedIndex = childZoneNames.reduce((max, name) => {
        const match = name.match(/^cell-(\d+)$/);
        return match ? Math.max(max, parseInt(match[1])) : max;
      }, 0);
      const cellCount = Math.max(cols, maxUsedIndex);
      zones = Array.from({ length: cellCount }, (_, i) => ({
        name: `cell-${i + 1}`,
        label: `Cell ${i + 1}`,
      }));
    } else if (block.type === "flex-row") {
      const childZoneNames = Object.keys(block.children ?? {});
      const maxUsedIndex = childZoneNames.reduce((max, name) => {
        const match = name.match(/^item-(\d+)$/);
        if (match && (block.children?.[name]?.length ?? 0) > 0) {
          return Math.max(max, parseInt(match[1]));
        }
        return max;
      }, 0);
      const itemCount = Math.max(maxUsedIndex, 1);
      zones = Array.from({ length: itemCount }, (_, i) => ({
        name: `item-${i + 1}`,
        label: `Item ${i + 1}`,
      }));
    } else {
      zones = staticZones;
    }
  }

  const hasChildren = block.children && Object.values(block.children).some((z) => z.length > 0);

  return (
    <div>
      <BlockRenderer
        block={block}
        design={design}
        isSelected={false}
        previewMode={previewMode}
        onClick={() => {}}
      />
      {/* Render nested children for container blocks */}
      {zones && hasChildren && (
        <div
          className={clsx("px-4")}
          style={{
            ...(block.type === "grid"
              ? {
                  display: "grid",
                  gridTemplateColumns:
                    previewMode === "mobile"
                      ? "1fr"
                      : previewMode === "tablet"
                        ? `repeat(${Math.min((block.props.columns as number) || 2, 2)}, 1fr)`
                        : (block.props.templateColumns as string) ||
                          `repeat(${(block.props.columns as number) || 2}, 1fr)`,
                  gap: `${block.props.gap || "16"}px`,
                }
              : {}),
            ...(block.type === "flex-container"
              ? {
                  display: "flex",
                  flexDirection: previewMode === "mobile"
                    ? "column" as const
                    : (block.props.direction as React.CSSProperties["flexDirection"]) || "row",
                  gap: `${block.props.gap || "16"}px`,
                  flexWrap: (block.props.wrap as React.CSSProperties["flexWrap"]) || "nowrap",
                }
              : {}),
            ...(block.type === "flex-row"
              ? {
                  display: "flex",
                  flexDirection: previewMode === "mobile" ? "column" as const : "row" as const,
                  gap: (block.props.gap as string) || "1rem",
                }
              : {}),
            ...(block.type === "flex-col"
              ? {
                  display: "flex",
                  flexDirection: "column" as const,
                  gap: (block.props.gap as string) || "1rem",
                }
              : {}),
            ...(block.type === "columns"
              ? {
                  display: "grid",
                  gridTemplateColumns:
                    previewMode === "mobile"
                      ? "1fr"
                      : `repeat(${(block.props.count as number) || zones?.length || 2}, 1fr)`,
                  gap: "1.5rem",
                }
              : {}),
            ...(block.type === "container"
              ? { maxWidth: (block.props.maxWidth as string) || "1200px", margin: "0 auto" }
              : {}),
          }}
        >
          {zones.map((zoneDef) => {
            const zoneBlocks = block.children?.[zoneDef.name] ?? [];
            if (zoneBlocks.length === 0) return null;
            return (
              <div key={zoneDef.name} style={{ minWidth: 0, flex: block.type === "flex-row" ? 1 : undefined }}>
                {zoneBlocks.map((child) => (
                  <PreviewBlock
                    key={child.id}
                    block={child}
                    design={design}
                    previewMode={previewMode}
                  />
                ))}
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
