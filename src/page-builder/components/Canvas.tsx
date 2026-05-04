import { useDroppable } from "@dnd-kit/core";
import {
  SortableContext,
  useSortable,
  verticalListSortingStrategy,
} from "@dnd-kit/sortable";
import { CSS } from "@dnd-kit/utilities";
import clsx from "clsx";
import { GripVertical, X, Construction, Download } from "lucide-react";

import type { BlockInstance, DesignSettings } from "../types";
import { BLOCK_DEFINITIONS } from "../data";
import { BlockRenderer } from "./BlockRenderer";
import { DropZone } from "./DropZone";

// ── Sortable Block Wrapper ──
function SortableBlock({
  block,
  design,
  isSelected,
  isHovered,
  isDragActive,
  selectedBlockId,
  hoveredBlockId,
  previewMode,
  onDelete,
  onSelect,
  onBlockSelect,
  onBlockDelete,
}: {
  block: BlockInstance;
  design: DesignSettings;
  isSelected: boolean;
  isHovered?: boolean;
  isDragActive?: boolean;
  selectedBlockId: string | null;
  hoveredBlockId?: string | null;
  previewMode?: string;
  onDelete: () => void;
  onSelect: () => void;
  onBlockSelect: (id: string | null) => void;
  onBlockDelete: (id: string) => void;
}) {
  const {
    attributes,
    listeners,
    setNodeRef,
    transform,
    transition,
    isDragging,
  } = useSortable({ id: block.id });

  const style = {
    transform: CSS.Transform.toString(transform),
    transition,
  };

  // Check if this block's definition has zones (container block)
  const blockDef = BLOCK_DEFINITIONS.find((d) => d.type === block.type);
  const zones = (blockDef as unknown as Record<string, unknown>)?.zones as
    | Array<{ name: string; label: string }>
    | undefined;

  return (
    <div
      ref={setNodeRef}
      className={clsx(
        "relative group/block transition-all duration-200",
        isDragging && "z-50 opacity-40 scale-[0.98]",
        !isDragging && isSelected && "ring-2 ring-[#634CF8] bg-[#634CF8]/[0.02] rounded-lg",
        !isDragging && !isSelected && isHovered && "ring-1 ring-[#634CF8]/30 bg-[#634CF8]/[0.01] rounded-lg",
        !isDragging && !isSelected && !isHovered && "hover:ring-1 hover:ring-[#634CF8]/30 rounded-lg",
        !isDragging && "animate-block-fade-in",
      )}
      data-block-id={block.id}
      style={style}
    >
      {/* Drag handle + actions — overlay on top-right, Puck-style */}
      <div
        className={clsx(
          "absolute top-2 right-2 z-20 flex items-center gap-1 transition-all duration-150",
          isSelected
            ? "opacity-100"
            : "opacity-0 group-hover/block:opacity-100",
        )}
      >
        <button
          className="flex h-6 w-6 items-center justify-center rounded-md bg-white/90 dark:bg-surface/90 backdrop-blur-sm border border-separator/50 text-muted hover:text-foreground hover:border-[#634CF8]/30 cursor-grab active:cursor-grabbing shadow-sm transition-colors"
          title="Drag to reorder"
          {...attributes}
          {...listeners}
        >
          <GripVertical size={12} />
        </button>
        <button
          className="flex h-6 w-6 items-center justify-center rounded-md bg-white/90 dark:bg-surface/90 backdrop-blur-sm border border-separator/50 text-muted hover:text-danger hover:border-danger/30 shadow-sm transition-colors"
          title="Delete block"
          onClick={(e) => {
            e.stopPropagation();
            onDelete();
          }}
        >
          <X size={12} />
        </button>
      </div>

      <BlockRenderer
        block={block}
        design={design}
        isSelected={isSelected}
        previewMode={previewMode}
        onClick={onSelect}
      />

      {/* Render nested DropZones for container blocks */}
      {zones && zones.length > 0 && (() => {
        // Generate zones dynamically based on block props
        let visibleZones: Array<{ name: string; label: string }>;

        if (block.type === "columns") {
          const count = Math.max(1, (block.props.count as number) || 2);
          visibleZones = Array.from({ length: count }, (_, i) => ({
            name: `col-${i + 1}`,
            label: `Column ${i + 1}`,
          }));
        } else if (block.type === "grid") {
          const cols = Math.max(1, (block.props.columns as number) || 2);
          // Show enough cells: at least cols, plus any extra that have children
          const childZoneNames = Object.keys(block.children ?? {});
          const maxUsedIndex = childZoneNames.reduce((max, name) => {
            const match = name.match(/^cell-(\d+)$/);
            return match ? Math.max(max, parseInt(match[1])) : max;
          }, 0);
          const cellCount = Math.max(cols, maxUsedIndex);
          visibleZones = Array.from({ length: cellCount }, (_, i) => ({
            name: `cell-${i + 1}`,
            label: `Cell ${i + 1}`,
          }));
        } else if (block.type === "flex-row" || block.type === "flex-col" || block.type === "flex-container") {
          // Show zones that have children + one extra empty slot
          const childZoneNames = Object.keys(block.children ?? {});
          const maxUsedIndex = childZoneNames.reduce((max, name) => {
            const match = name.match(/^item-(\d+)$/);
            if (match && (block.children?.[name]?.length ?? 0) > 0) {
              return Math.max(max, parseInt(match[1]));
            }
            return max;
          }, 0);
          const itemCount = Math.max(maxUsedIndex + 1, 2);
          visibleZones = Array.from({ length: itemCount }, (_, i) => ({
            name: `item-${i + 1}`,
            label: `Item ${i + 1}`,
          }));
        } else {
          visibleZones = zones;
        }

        return (
        <div
          className={clsx(
            "mt-1 gap-2",
            block.type !== "grid" &&
              block.type !== "flex-container" &&
              block.type !== "flex-row" &&
              block.type !== "flex-col" &&
              block.type !== "container" &&
              block.type !== "columns" && [
                "grid",
                previewMode === "mobile"
                  ? "grid-cols-1"
                  : previewMode === "tablet" && visibleZones.length >= 3
                    ? "grid-cols-2"
                    : visibleZones.length === 2 && "grid-cols-2",
                previewMode !== "mobile" && visibleZones.length === 3 && "grid-cols-3",
                previewMode !== "mobile" && previewMode !== "tablet" && visibleZones.length >= 4 && "grid-cols-4",
                visibleZones.length === 1 && "grid-cols-1",
              ],
            block.type === "flex-row" && (previewMode === "mobile" ? "flex flex-col" : "flex flex-row"),
            block.type === "flex-col" && "flex flex-col",
            block.type === "container" && "flex flex-col max-w-full mx-auto",
            block.type === "columns" && [
              "grid",
              previewMode === "mobile"
                ? "grid-cols-1"
                : previewMode === "tablet"
                  ? visibleZones.length <= 2 ? "grid-cols-2" : "grid-cols-2"
                  : visibleZones.length === 2 ? "grid-cols-2"
                  : visibleZones.length === 3 ? "grid-cols-3"
                  : visibleZones.length >= 4 ? "grid-cols-4"
                  : "grid-cols-1",
            ],
          )}
          style={{
            ...(block.type === "grid"
              ? {
                  display: "grid",
                  gridTemplateColumns: previewMode === "mobile"
                    ? "1fr"
                    : previewMode === "tablet"
                      ? `repeat(${Math.min((block.props.columns as number) || visibleZones.length, 2)}, 1fr)`
                      : (block.props.templateColumns as string) || `repeat(${(block.props.columns as number) || visibleZones.length}, 1fr)`,
                  ...(block.props.templateRows ? { gridTemplateRows: block.props.templateRows as string } : {}),
                  gap: `${block.props.gap || "16"}px`,
                  ...(block.props.rowGap ? { rowGap: `${block.props.rowGap}px` } : {}),
                  ...(block.props.columnGap ? { columnGap: `${block.props.columnGap}px` } : {}),
                  justifyItems: (block.props.justifyItems as string) || "stretch",
                  alignItems: (block.props.alignItems as string) || "stretch",
                  ...(block.props.autoFlow ? { gridAutoFlow: block.props.autoFlow as string } : {}),
                }
              : {}),
            ...(block.type === "flex-container"
              ? {
                  display: "flex",
                  flexDirection: (block.props.direction as React.CSSProperties["flexDirection"]) || "row",
                  gap: `${block.props.gap || "16"}px`,
                  justifyContent: (block.props.justifyContent as string) || "flex-start",
                  alignItems: (block.props.alignItems as string) || "stretch",
                  flexWrap: (block.props.wrap as React.CSSProperties["flexWrap"]) || "nowrap",
                }
              : {}),
            ...(block.type === "flex-row"
              ? { 
                  gap: (block.props.gap as string) || "1rem",
                  justifyContent: (block.props.justify as string) || "flex-start",
                  alignItems: (block.props.align as string) || "stretch",
                }
              : {}),
            ...(block.type === "flex-col"
              ? { 
                  gap: (block.props.gap as string) || "1rem",
                  justifyContent: (block.props.justify as string) || "flex-start",
                  alignItems: (block.props.align as string) || "stretch",
                }
              : {}),
            ...(block.type === "container"
              ? { maxWidth: (block.props.maxWidth as string) || "1200px" }
              : {}),
          }}
        >
          {visibleZones.map((zoneDef) => (
            <div
              key={zoneDef.name}
              className={clsx(
                (block.type === "flex-row" || block.type === "flex-col" || block.type === "flex-container") && "min-w-0 flex flex-col"
              )}
            >
              <DropZone
              key={zoneDef.name}
              parentId={block.id}
              zone={zoneDef.name}
              zoneLabel={zoneDef.label}
              children={block.children?.[zoneDef.name] ?? []}
              design={design}
              selectedBlockId={selectedBlockId}
              isDragActive={isDragActive ?? false}
              onBlockSelect={onBlockSelect}
              onBlockDelete={onBlockDelete}
              renderBlock={(childBlock) => (
                <SortableBlock
                  key={childBlock.id}
                  block={childBlock}
                  design={design}
                  isSelected={selectedBlockId === childBlock.id}
                  isHovered={hoveredBlockId === childBlock.id}
                  isDragActive={isDragActive}
                  selectedBlockId={selectedBlockId}
                  hoveredBlockId={hoveredBlockId}
                  previewMode={previewMode}
                  onDelete={() => onBlockDelete(childBlock.id)}
                  onSelect={() => onBlockSelect(childBlock.id)}
                  onBlockSelect={onBlockSelect}
                  onBlockDelete={onBlockDelete}
                />
              )}
            />
            </div>
          ))}
        </div>
      );
      })()}
    </div>
  );
}

// ── Drop Zone ──
function CanvasDropZone({
  id,
  isEmpty,
  isDragActive,
}: {
  id: string;
  isEmpty: boolean;
  isDragActive?: boolean;
}) {
  const { isOver, setNodeRef } = useDroppable({ id });

  if (isEmpty) {
    return (
      <div
        ref={setNodeRef}
        className={clsx(
          "flex flex-col items-center justify-center gap-4 text-center rounded-lg border-2 border-dashed transition-all duration-200 m-6",
          isOver
            ? "border-[#634CF8] bg-[#634CF8]/5 min-h-[300px]"
            : "border-separator/40 bg-transparent min-h-[400px]",
        )}
      >
        <div
          className={clsx(
            "flex h-16 w-16 items-center justify-center rounded-lg transition-colors",
            isOver ? "bg-[#634CF8]/10" : "bg-surface",
          )}
        >
          <span className="text-3xl">{isOver ? <Download size={32} /> : <Construction size={32} />}</span>
        </div>
        <div>
          <p className="text-sm font-semibold text-foreground">
            {isOver ? "Drop to add block" : "Start building your page"}
          </p>
          <p className="text-xs text-muted mt-1 max-w-[240px]">
            {isOver
              ? "Release to place the block here"
              : "Drag blocks from the left panel or pick a template to get started"}
          </p>
        </div>
      </div>
    );
  }

  return (
    <div
      ref={setNodeRef}
      className={clsx(
        "transition-all duration-150 mx-4 flex items-center justify-center",
        isDragActive ? "h-14 my-2" : "h-2 my-0.5",
      )}
    >
      <div
        className={clsx(
          "w-full transition-all duration-150 flex items-center justify-center",
          isOver
            ? "h-1 bg-[#634CF8] rounded-full shadow-[0_0_10px_rgba(99,76,248,0.5)] scale-y-125"
            : isDragActive
              ? "h-full rounded-xl border-2 border-dashed border-[#634CF8]/40 bg-[#634CF8]/[0.05]"
              : "h-0",
        )}
      >
        {isDragActive && !isOver && (
          <span className="text-[9px] text-[#634CF8]/40 font-bold uppercase tracking-widest">
            Drop here
          </span>
        )}
      </div>
    </div>
  );
}

// ── Canvas ──
export function Canvas({
  blocks,
  design,
  isDragActive,
  hoveredBlockId,
  previewMode,
  selectedBlockId,
  onBlockSelect,
  onBlockDelete,
}: {
  blocks: BlockInstance[];
  design: DesignSettings;
  isDragActive?: boolean;
  hoveredBlockId?: string | null;
  previewMode: "desktop" | "tablet" | "mobile";
  selectedBlockId: string | null;
  onBlockSelect: (id: string | null) => void;
  onBlockDelete: (id: string) => void;
}) {
  // Make the entire canvas a droppable fallback
  const { setNodeRef: setCanvasRef } = useDroppable({
    id: "canvas-drop-empty",
  });

  const canvasWidth = {
    desktop: "100%",
    tablet: "768px",
    mobile: "375px",
  }[previewMode];

  // Typography font family mapping
  const fontFamily =
    {
      inter: "'Inter', system-ui, sans-serif",
      "plus-jakarta": "'Plus Jakarta Sans', sans-serif",
      "space-grotesk": "'Space Grotesk', sans-serif",
      poppins: "'Poppins', sans-serif",
      "dm-sans": "'DM Sans', sans-serif",
      sora: "'Sora', sans-serif",
    }[design.typography] || "system-ui, sans-serif";

  // The page preview should reflect the design mood, not the builder theme
  // Explicitly set both light/dark to isolate from the builder's root theme
  const pageMoodClass = design.mood === "dark" ? "dark" : "light";

  // Background styles based on design settings
  const bgStyles: React.CSSProperties = {};
  if (design.backgroundTheme === "pattern") {
    const opacity = design.backgroundOpacity / 100;
    bgStyles.backgroundImage = `radial-gradient(circle, rgba(${parseInt(design.mainColor.slice(0, 2), 16)}, ${parseInt(design.mainColor.slice(2, 4), 16)}, ${parseInt(design.mainColor.slice(4, 6), 16)}, ${opacity * 0.15}) 1px, transparent 1px)`;
    bgStyles.backgroundSize = "20px 20px";
  } else if (design.backgroundTheme === "gradient") {
    const opacity = design.backgroundOpacity / 100;
    bgStyles.backgroundImage = `linear-gradient(135deg, rgba(${parseInt(design.mainColor.slice(0, 2), 16)}, ${parseInt(design.mainColor.slice(2, 4), 16)}, ${parseInt(design.mainColor.slice(4, 6), 16)}, ${opacity * 0.1}) 0%, transparent 50%, rgba(${parseInt(design.mainColor.slice(0, 2), 16)}, ${parseInt(design.mainColor.slice(2, 4), 16)}, ${parseInt(design.mainColor.slice(4, 6), 16)}, ${opacity * 0.05}) 100%)`;
  }

  return (
    <div
      className="flex-1 overflow-y-auto p-4"
      onClick={() => onBlockSelect(null)}
      style={{
        backgroundImage:
          "radial-gradient(circle, var(--separator) 0.5px, transparent 0.5px)",
        backgroundSize: "24px 24px",
      }}
    >
      {/* Canvas width indicator */}
      {previewMode !== "desktop" && (
        <div className="text-center mb-2">
          <span className="text-[10px] font-mono text-muted bg-white dark:bg-surface rounded-full px-3 py-1 shadow-sm border border-separator/30">
            {previewMode === "tablet" ? "768px" : "375px"}
          </span>
        </div>
      )}

      <div
        ref={setCanvasRef}
        className={clsx(
          "mx-auto min-h-full overflow-hidden transition-all duration-300 bg-background text-foreground",
          pageMoodClass,
          previewMode === "desktop"
            ? "rounded-none shadow-none border-x border-separator/20"
            : "rounded-xl shadow-xl border border-separator/30",
        )}
        data-theme={design.mood}
        style={{
          maxWidth: canvasWidth,
          fontFamily,
          ...bgStyles,
          // Only override CSS variables when user has set custom values
          ...(design.mood === "dark" ? {
            ...(design.darkForeground ? { "--foreground": design.darkForeground } as React.CSSProperties : {}),
            ...(design.darkBackground ? { "--background": design.darkBackground } as React.CSSProperties : {}),
            ...(design.darkMuted ? { "--muted": design.darkMuted } as React.CSSProperties : {}),
            ...(design.darkSurface ? { "--surface": design.darkSurface } as React.CSSProperties : {}),
            ...(design.darkSeparator ? { "--separator": design.darkSeparator } as React.CSSProperties : {}),
          } : {
            ...(design.lightForeground ? { "--foreground": design.lightForeground } as React.CSSProperties : {}),
            ...(design.lightBackground ? { "--background": design.lightBackground } as React.CSSProperties : {}),
            ...(design.lightMuted ? { "--muted": design.lightMuted } as React.CSSProperties : {}),
            ...(design.lightSurface ? { "--surface": design.lightSurface } as React.CSSProperties : {}),
            ...(design.lightSeparator ? { "--separator": design.lightSeparator } as React.CSSProperties : {}),
          }),
          ...(design.successColor ? { "--success": `#${design.successColor}` } as React.CSSProperties : {}),
          ...(design.warningColor ? { "--warning": `#${design.warningColor}` } as React.CSSProperties : {}),
          ...(design.dangerColor ? { "--danger": `#${design.dangerColor}` } as React.CSSProperties : {}),
        }}
      >
        {blocks.length === 0 ? (
          <CanvasDropZone
            id="canvas-drop-empty"
            isDragActive={isDragActive}
            isEmpty={true}
          />
        ) : (
          <SortableContext
            items={blocks.map((b) => b.id)}
            strategy={verticalListSortingStrategy}
          >
            <div className="px-4 py-2 flex flex-col">
              {blocks.map((block, index) => (
                <div key={block.id}>
                  {index === 0 && (
                    <CanvasDropZone
                      id={`drop-before-${block.id}`}
                      isEmpty={false} isDragActive={isDragActive}
                    />
                  )}
                  <SortableBlock
                    block={block}
                    design={design}
                    isSelected={selectedBlockId === block.id}
                    isHovered={hoveredBlockId === block.id}
                    isDragActive={isDragActive}
                    selectedBlockId={selectedBlockId}
                    hoveredBlockId={hoveredBlockId}
                    previewMode={previewMode}
                    onDelete={() => onBlockDelete(block.id)}
                    onSelect={() => onBlockSelect(block.id)}
                    onBlockSelect={onBlockSelect}
                    onBlockDelete={onBlockDelete}
                  />
                  <CanvasDropZone
                    id={`drop-after-${block.id}`}
                    isEmpty={false} isDragActive={isDragActive}
                  />
                </div>
              ))}
            </div>
          </SortableContext>
        )}
      </div>
    </div>
  );
}
