import { useDroppable } from "@dnd-kit/core";
import {
  SortableContext,
  useSortable,
  verticalListSortingStrategy,
} from "@dnd-kit/sortable";
import { CSS } from "@dnd-kit/utilities";
import clsx from "clsx";

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
      {/* Drag handle + actions — left gutter */}
      <div
        className={clsx(
          "absolute -left-11 top-1/2 -translate-y-1/2 flex flex-col gap-1 transition-all duration-150",
          isSelected
            ? "opacity-100 translate-x-0"
            : "opacity-0 -translate-x-1 group-hover/block:opacity-100 group-hover/block:translate-x-0",
        )}
      >
        <button
          className="flex h-7 w-7 items-center justify-center rounded-md bg-white dark:bg-surface border border-separator/50 text-muted hover:text-foreground hover:border-[#634CF8]/30 cursor-grab active:cursor-grabbing shadow-sm transition-colors"
          title="Drag to reorder"
          {...attributes}
          {...listeners}
        >
          <svg className="h-4 w-4" fill="currentColor" viewBox="0 0 16 16">
            <circle cx="5" cy="4" r="1.2" />
            <circle cx="11" cy="4" r="1.2" />
            <circle cx="5" cy="8" r="1.2" />
            <circle cx="11" cy="8" r="1.2" />
            <circle cx="5" cy="12" r="1.2" />
            <circle cx="11" cy="12" r="1.2" />
          </svg>
        </button>
        <button
          className="flex h-7 w-7 items-center justify-center rounded-md bg-white dark:bg-surface border border-separator/50 text-muted hover:text-danger hover:border-danger/30 shadow-sm transition-colors"
          title="Delete block"
          onClick={(e) => {
            e.stopPropagation();
            onDelete();
          }}
        >
          <svg
            className="h-3.5 w-3.5"
            fill="none"
            stroke="currentColor"
            viewBox="0 0 24 24"
          >
            <path
              d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16"
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth={1.5}
            />
          </svg>
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
      {zones && zones.length > 0 && (
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
                zones.length === 2 && "grid-cols-2",
                zones.length === 3 && "grid-cols-3",
                zones.length >= 4 && "grid-cols-4",
                zones.length === 1 && "grid-cols-1",
              ],
            block.type === "flex-row" && "flex flex-row",
            block.type === "flex-col" && "flex flex-col",
            block.type === "container" && "flex flex-col max-w-full mx-auto",
            block.type === "columns" && [
              "grid",
              zones.length === 2 && "grid-cols-2",
              zones.length === 3 && "grid-cols-3",
              zones.length >= 4 && "grid-cols-4",
            ],
          )}
          style={{
            ...(block.type === "grid"
              ? {
                  display: "grid",
                  gridTemplateColumns: (block.props.templateColumns as string) || `repeat(${(block.props.columns as number) || zones.length}, 1fr)`,
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
              ? { gap: (block.props.gap as string) || "1rem" }
              : {}),
            ...(block.type === "flex-col"
              ? { gap: (block.props.gap as string) || "1rem" }
              : {}),
            ...(block.type === "container"
              ? { maxWidth: (block.props.maxWidth as string) || "1200px" }
              : {}),
          }}
        >
          {zones.map((zoneDef) => (
            <div
              key={zoneDef.name}
              className={clsx(
                block.type === "flex-row" && "flex-1 min-w-0",
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
      )}
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
          <span className="text-3xl">{isOver ? "📥" : "🏗️"}</span>
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
        "transition-all duration-150 mx-4",
        isOver
          ? "h-[2px] bg-[#634CF8] my-1.5 shadow-[0_0_6px_rgba(99,76,248,0.3)]"
          : isDragActive
            ? "h-6 rounded-md border-2 border-dashed border-[#634CF8]/30 bg-[#634CF8]/[0.02] my-0.5"
            : "h-3",
      )}
    />
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
  const pageMoodClass = design.mood === "dark" ? "dark" : "";

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
          "mx-auto min-h-full overflow-hidden transition-all duration-300",
          pageMoodClass,
          design.mood === "dark"
            ? "bg-[#0f0f1a] text-white"
            : "bg-white text-[#1a1a2e]",
          previewMode === "desktop"
            ? "rounded-none shadow-none border-x border-separator/20"
            : "rounded-xl shadow-xl border border-separator/30",
        )}
        style={{ maxWidth: canvasWidth, fontFamily, ...bgStyles }}
      >
        {blocks.length === 0 ? (
          <div className="flex flex-col items-center justify-center gap-4 text-center min-h-[400px] m-6">
            <div className="flex h-16 w-16 items-center justify-center rounded-lg bg-[#634CF8]/10">
              <span className="text-3xl">🏗️</span>
            </div>
            <div>
              <p className="text-sm font-semibold text-foreground">
                Start building your page
              </p>
              <p className="text-xs text-muted mt-1 max-w-[240px]">
                Drag blocks from the left panel or pick a template to get
                started
              </p>
            </div>
          </div>
        ) : (
          <SortableContext
            items={blocks.map((b) => b.id)}
            strategy={verticalListSortingStrategy}
          >
            <div className="pl-14 pr-4 py-2 flex flex-col">
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
