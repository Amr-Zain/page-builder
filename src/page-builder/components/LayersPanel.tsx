import { useMemo, useCallback, useState } from "react";
import {
  DndContext,
  closestCenter,
  PointerSensor,
  useSensor,
  useSensors,
  type DragEndEvent,
  DragOverlay,
  type DragStartEvent,
} from "@dnd-kit/core";
import {
  SortableContext,
  useSortable,
  verticalListSortingStrategy,
} from "@dnd-kit/sortable";
import { CSS } from "@dnd-kit/utilities";
import clsx from "clsx";
import { ChevronRight, ChevronUp, ChevronDown, Copy, X, GripVertical, Package, EyeOff, Diamond } from "lucide-react";
import type { BlockInstance, BlockStyleOverrides } from "../types";
import { BLOCK_DEFINITIONS } from "../data";
import { flattenTree, type FlattenedBlock } from "../tree-utils";

// ═══════════════════════════════════════════════════════════════════════════════
// LayersPanel — Tree view of all blocks with nesting, expand/collapse,
// selection, visibility indicators, hover sync, and reorder actions.
// Inspired by Puck's LayerTree pattern.
// ═══════════════════════════════════════════════════════════════════════════════

type ZoneLabelItem = { type: "zone-label"; label: string; depth: number; parentId: string };
type VisibleItem = FlattenedBlock | ZoneLabelItem;

function isZoneLabel(item: VisibleItem): item is ZoneLabelItem {
  return "type" in item && (item as ZoneLabelItem).type === "zone-label";
}

interface LayersPanelProps {
  blocks: BlockInstance[];
  selectedBlockId: string | null;
  expandedIds?: Set<string>;
  onToggleExpand?: (id: string) => void;
  onSelect: (id: string) => void;
  onDelete: (id: string) => void;
  onMoveUp: (id: string) => void;
  onMoveDown: (id: string) => void;
  onDuplicate: (id: string) => void;
  onHover?: (id: string | null) => void;
}

export function LayersPanel({
  blocks,
  selectedBlockId,
  expandedIds: externalExpandedIds,
  onToggleExpand: externalOnToggleExpand,
  onSelect,
  onDelete,
  onMoveUp,
  onMoveDown,
  onDuplicate,
  onHover,
}: LayersPanelProps) {
  // Internal expand/collapse state when not controlled externally
  const [internalExpandedIds, setInternalExpandedIds] = useState<Set<string>>(new Set());
  const expandedIds = externalExpandedIds ?? internalExpandedIds;
  const onToggleExpand = externalOnToggleExpand ?? ((id: string) => {
    setInternalExpandedIds((prev) => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });
  });

  // Flatten the recursive block tree into a displayable list
  const flatItems = useMemo(() => flattenTree(blocks), [blocks]);

  // Build a set of block IDs that are containers (have children with entries)
  const containerIds = useMemo(() => {
    const ids = new Set<string>();
    for (const { block } of flatItems) {
      if (block.children && Object.values(block.children).some((z) => z.length > 0)) {
        ids.add(block.id);
      }
    }
    return ids;
  }, [flatItems]);

  // Filter visible items: show root-level items always, show nested items
  // only if all ancestors are expanded
  const visibleItems = useMemo(() => {
    const result: VisibleItem[] = [];
    const collapsedAncestors = new Set<string>();

    for (let i = 0; i < flatItems.length; i++) {
      const item = flatItems[i];
      const { block, depth, parentId, zone } = item;

      // Skip items whose parent is collapsed or has a collapsed ancestor
      if (parentId && collapsedAncestors.has(parentId)) {
        collapsedAncestors.add(block.id);
        continue;
      }

      // Track collapsed containers so their descendants are hidden
      if (containerIds.has(block.id) && !expandedIds.has(block.id)) {
        collapsedAncestors.add(block.id);
      }

      // Insert zone label header when entering a new zone within a container
      if (parentId && zone && depth > 0) {
        const parentDef = BLOCK_DEFINITIONS.find(
          (d) => d.type === flatItems.find((fi) => fi.block.id === parentId)?.block.type
        );
        const zoneDef = parentDef?.zones?.find((z) => z.name === zone);
        const zoneLabel = zoneDef?.label || zone;

        // Only insert zone label if this is the first child in this zone
        const prevItem = result[result.length - 1];
        const isFirstInZone =
          !prevItem ||
          isZoneLabel(prevItem) ||
          ("block" in prevItem && (prevItem as FlattenedBlock).zone !== zone) ||
          ("block" in prevItem && (prevItem as FlattenedBlock).parentId !== parentId);

        if (isFirstInZone) {
          result.push({
            type: "zone-label",
            label: zoneLabel,
            depth,
            parentId,
          });
        }
      }

      result.push(item);
    }

    return result;
  }, [flatItems, expandedIds, containerIds]);

  // Collect all visible block IDs for the single SortableContext
  const sortableIds = useMemo(() => {
    const ids: string[] = [];
    for (const item of visibleItems) {
      if (!isZoneLabel(item)) {
        ids.push((item as FlattenedBlock).block.id);
      }
    }
    return ids;
  }, [visibleItems]);

  // Build a map from block ID to its zone key for drag restriction
  const blockZoneMap = useMemo(() => {
    const map = new Map<string, string>();
    for (const item of visibleItems) {
      if (isZoneLabel(item)) continue;
      const flatItem = item as FlattenedBlock;
      const key = flatItem.parentId && flatItem.zone
        ? `${flatItem.parentId}:${flatItem.zone}`
        : "root";
      map.set(flatItem.block.id, key);
    }
    return map;
  }, [visibleItems]);

  // DnD state
  const [activeDragId, setActiveDragId] = useState<string | null>(null);
  const sensors = useSensors(
    useSensor(PointerSensor, { activationConstraint: { distance: 5 } })
  );

  const handleDragStart = useCallback((event: DragStartEvent) => {
    setActiveDragId(event.active.id as string);
  }, []);

  const handleDragEnd = useCallback(
    (event: DragEndEvent) => {
      setActiveDragId(null);
      const { active, over } = event;
      if (!over || active.id === over.id) return;

      const activeId = active.id as string;
      const overId = over.id as string;

      // Only allow reordering within the same zone
      const activeZone = blockZoneMap.get(activeId);
      const overZone = blockZoneMap.get(overId);
      if (!activeZone || !overZone || activeZone !== overZone) return;

      // Find positions within the sortable list to determine direction
      const activeIdx = sortableIds.indexOf(activeId);
      const overIdx = sortableIds.indexOf(overId);
      if (activeIdx === -1 || overIdx === -1) return;

      if (activeIdx < overIdx) {
        for (let i = activeIdx; i < overIdx; i++) onMoveDown(activeId);
      } else {
        for (let i = activeIdx; i > overIdx; i--) onMoveUp(activeId);
      }
    },
    [blockZoneMap, sortableIds, onMoveUp, onMoveDown]
  );

  // Count total blocks for the header
  const totalBlocks = flatItems.length;

  // Find the active drag item for overlay
  const activeDragItem = activeDragId
    ? flatItems.find((fi) => fi.block.id === activeDragId)
    : null;

  return (
    <div className="flex flex-col gap-1">
      <div className="flex items-center justify-between mb-2">
        <p className="text-[11px] font-bold text-muted uppercase tracking-wider">
          Layers
        </p>
        <span className="text-[10px] text-muted/60 tabular-nums">
          {totalBlocks} block{totalBlocks !== 1 ? "s" : ""}
        </span>
      </div>

      {blocks.length === 0 && (
        <div className="rounded-lg bg-[#F8F8FA] dark:bg-surface p-4 text-center">
          <p className="text-[11px] text-muted">No blocks on this page</p>
        </div>
      )}

      <DndContext
        sensors={sensors}
        collisionDetection={closestCenter}
        onDragStart={handleDragStart}
        onDragEnd={handleDragEnd}
      >
        <SortableContext items={sortableIds} strategy={verticalListSortingStrategy}>
          <div className="flex flex-col gap-0.5">
            {visibleItems.map((item, rowIndex) => {
              if (isZoneLabel(item)) {
                return (
                  <ZoneLabelRow
                    key={`zone-${item.parentId}-${item.label}`}
                    label={item.label}
                    depth={item.depth}
                  />
                );
              }

              const flatItem = item as FlattenedBlock;
              return (
                <SortableLayerRow
                  key={flatItem.block.id}
                  item={flatItem}
                  rowIndex={rowIndex}
                  isSelected={selectedBlockId === flatItem.block.id}
                  isContainer={containerIds.has(flatItem.block.id)}
                  isExpanded={expandedIds.has(flatItem.block.id)}
                  blocks={blocks}
                  onSelect={onSelect}
                  onDelete={onDelete}
                  onMoveUp={onMoveUp}
                  onMoveDown={onMoveDown}
                  onDuplicate={onDuplicate}
                  onHover={onHover}
                  onToggleExpand={onToggleExpand}
                />
              );
            })}
          </div>
        </SortableContext>

        <DragOverlay>
          {activeDragItem && (
            <DragOverlayItem block={activeDragItem.block} />
          )}
        </DragOverlay>
      </DndContext>
    </div>
  );
}

// ── Zone Label Row ──

function ZoneLabelRow({ label, depth }: { label: string; depth: number }) {
  return (
    <div
      className="flex items-center gap-1.5 py-1 text-[9px] font-semibold text-muted/70 uppercase tracking-wider"
      style={{ paddingLeft: depth * 16 }}
    >
      <Diamond size={8} className="text-muted/70" />
      {label}
    </div>
  );
}

// ── Drag Overlay Item ──

function DragOverlayItem({ block }: { block: BlockInstance }) {
  const def = BLOCK_DEFINITIONS.find((d) => d.type === block.type);
  return (
    <div className="flex items-center gap-2 rounded-lg bg-white dark:bg-surface border-2 border-[#634CF8] shadow-xl px-3 py-2 pointer-events-none opacity-90">
      <span className="text-xs">{def?.icon || <Package size={12} />}</span>
      <span className="text-[11px] font-medium text-foreground">
        {def?.label || block.type}
      </span>
    </div>
  );
}

// ── Sortable Layer Row ──

function SortableLayerRow({
  item,
  rowIndex,
  isSelected,
  isContainer,
  isExpanded,
  blocks,
  onSelect,
  onDelete,
  onMoveUp,
  onMoveDown,
  onDuplicate,
  onHover,
  onToggleExpand,
}: {
  item: FlattenedBlock;
  rowIndex: number;
  isSelected: boolean;
  isContainer: boolean;
  isExpanded: boolean;
  blocks: BlockInstance[];
  onSelect: (id: string) => void;
  onDelete: (id: string) => void;
  onMoveUp: (id: string) => void;
  onMoveDown: (id: string) => void;
  onDuplicate: (id: string) => void;
  onHover?: (id: string | null) => void;
  onToggleExpand: (id: string) => void;
}) {
  const { block, depth } = item;
  const def = BLOCK_DEFINITIONS.find((d) => d.type === block.type);
  const label = getBlockLabel(block);
  const hasHiddenViewport = checkHiddenViewport(block);

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
    opacity: isDragging ? 0.4 : 1,
  };

  // Determine sibling context for move up/down
  const siblingInfo = useMemo(() => {
    if (item.parentId && item.zone) {
      const parent = findBlockById(blocks, item.parentId);
      if (parent?.children?.[item.zone]) {
        const siblings = parent.children[item.zone];
        const idx = siblings.findIndex((b) => b.id === block.id);
        return { index: idx, total: siblings.length };
      }
    }
    // Root level
    const idx = blocks.findIndex((b) => b.id === block.id);
    return { index: idx, total: blocks.length };
  }, [blocks, block.id, item.parentId, item.zone]);

  const handleMouseEnter = useCallback(() => onHover?.(block.id), [onHover, block.id]);
  const handleMouseLeave = useCallback(() => onHover?.(null), [onHover]);

  // Alternating row background: even = transparent, odd = subtle
  const isOddRow = rowIndex % 2 === 1;

  return (
    <div
      ref={setNodeRef}
      style={style}
      className={clsx(
        "flex items-center gap-2 rounded-lg px-2.5 py-2 cursor-pointer transition-all group",
        isSelected
          ? "bg-[#634CF8]/10 border border-[#634CF8]/30"
          : isOddRow
            ? "bg-[#FAFAFA] dark:bg-surface/30 hover:bg-[#F0F0F0] dark:hover:bg-surface/50 border border-transparent"
            : "hover:bg-[#F5F5F5] dark:hover:bg-surface border border-transparent"
      )}
      onClick={() => onSelect(block.id)}
      onMouseEnter={handleMouseEnter}
      onMouseLeave={handleMouseLeave}
    >
      {/* Drag Handle */}
      <button
        className="h-4 w-4 flex items-center justify-center rounded text-muted/40 hover:text-muted cursor-grab active:cursor-grabbing shrink-0"
        {...attributes}
        {...listeners}
        title="Drag to reorder"
        onClick={(e) => e.stopPropagation()}
      >
        <GripVertical size={12} />
      </button>

      {/* Indent spacer */}
      {depth > 0 && <span style={{ width: depth * 16 }} className="shrink-0" />}

      {/* Expand/Collapse Chevron */}
      {isContainer ? (
        <button
          className="h-4 w-4 flex items-center justify-center rounded text-muted hover:text-foreground shrink-0 transition-transform"
          title={isExpanded ? "Collapse" : "Expand"}
          onClick={(e) => {
            e.stopPropagation();
            onToggleExpand(block.id);
          }}
        >
          <ChevronRight
            size={12}
            className={clsx(
              "transition-transform duration-150",
              isExpanded ? "rotate-90" : "rotate-0"
            )}
          />
        </button>
      ) : (
        <span className="w-4 shrink-0" />
      )}

      {/* Icon */}
      <span className="text-xs shrink-0">{def?.icon || <Package size={12} />}</span>

      {/* Label */}
      <div className="flex-1 min-w-0">
        <p
          className={clsx(
            "text-[11px] font-medium truncate",
            isSelected ? "text-[#634CF8]" : "text-foreground"
          )}
        >
          {def?.label || block.type}
        </p>
        {label && (
          <p className="text-[9px] text-muted/60 truncate">{label}</p>
        )}
      </div>

      {/* Visibility Indicator */}
      {hasHiddenViewport && (
        <span
          className="text-[10px] text-muted/50 shrink-0"
          title="Some viewports hidden"
        >
          <EyeOff size={12} />
        </span>
      )}

      {/* Actions */}
      <div className="flex items-center gap-0.5 opacity-0 group-hover:opacity-100 transition-opacity">
        <button
          className="h-5 w-5 flex items-center justify-center rounded text-muted hover:text-foreground hover:bg-white dark:hover:bg-background disabled:opacity-20"
          disabled={siblingInfo.index === 0}
          title="Move up"
          onClick={(e) => {
            e.stopPropagation();
            onMoveUp(block.id);
          }}
        >
          <ChevronUp size={12} />
        </button>
        <button
          className="h-5 w-5 flex items-center justify-center rounded text-muted hover:text-foreground hover:bg-white dark:hover:bg-background disabled:opacity-20"
          disabled={siblingInfo.index === siblingInfo.total - 1}
          title="Move down"
          onClick={(e) => {
            e.stopPropagation();
            onMoveDown(block.id);
          }}
        >
          <ChevronDown size={12} />
        </button>
        <button
          className="h-5 w-5 flex items-center justify-center rounded text-muted hover:text-foreground hover:bg-white dark:hover:bg-background"
          title="Duplicate"
          onClick={(e) => {
            e.stopPropagation();
            onDuplicate(block.id);
          }}
        >
          <Copy size={12} />
        </button>
        <button
          className="h-5 w-5 flex items-center justify-center rounded text-danger hover:bg-danger/10"
          title="Delete"
          onClick={(e) => {
            e.stopPropagation();
            onDelete(block.id);
          }}
        >
          <X size={12} />
        </button>
      </div>
    </div>
  );
}

// ── Helpers ──

/** Extract a human-readable label from block props */
function getBlockLabel(block: BlockInstance): string {
  const p = block.props;
  if (p.headline) return p.headline as string;
  if (p.title) return p.title as string;
  if (p.logo) return p.logo as string;
  if (p.text) return p.text as string;
  if (p.content) return (p.content as string).slice(0, 40);
  if (p.heading) return p.heading as string;
  if (p.copyright) return p.copyright as string;
  return "";
}

/** Check if a block has any viewport visibility disabled in _style */
function checkHiddenViewport(block: BlockInstance): boolean {
  const style = block.props._style as BlockStyleOverrides | undefined;
  if (!style) return false;
  return (
    style.visibleDesktop === false ||
    style.visibleTablet === false ||
    style.visibleMobile === false
  );
}

/** Simple recursive find by ID (local helper to avoid circular import) */
function findBlockById(blocks: BlockInstance[], id: string): BlockInstance | null {
  for (const block of blocks) {
    if (block.id === id) return block;
    if (block.children) {
      for (const zone of Object.values(block.children)) {
        const found = findBlockById(zone, id);
        if (found) return found;
      }
    }
  }
  return null;
}
