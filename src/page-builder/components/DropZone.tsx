import { useDroppable } from "@dnd-kit/core";
import {
  SortableContext,
  verticalListSortingStrategy,
} from "@dnd-kit/sortable";
import clsx from "clsx";

import type { BlockInstance, DesignSettings } from "../types";

/**
 * DropZone — A nested droppable zone for container blocks.
 *
 * Uses dnd-kit `useDroppable` with a compound ID `${parentId}:${zone}`.
 * Renders children as SortableBlock components within a SortableContext.
 *
 * States:
 * - Empty: dashed border placeholder with "Drop blocks here" text, 64px min height
 * - Drag active over zone: expanded height, accent-colored dashed border
 * - Has children: no dashed border, renders children with standard spacing
 * - Root-level: solid line drop indicators
 * - Nested zone: dashed line drop indicators
 */

interface DropZoneProps {
  /** ID of the parent container block */
  parentId: string;
  /** Zone name (e.g., "left", "right") */
  zone: string;
  /** Human-readable zone label */
  zoneLabel: string;
  /** Children blocks in this zone */
  children: BlockInstance[];
  /** Design settings for rendering */
  design: DesignSettings;
  /** Currently selected block ID */
  selectedBlockId: string | null;
  /** Whether a drag is currently active anywhere */
  isDragActive: boolean;
  /** Callback to select a block */
  onBlockSelect: (id: string | null) => void;
  /** Callback to delete a block */
  onBlockDelete: (id: string) => void;
  /** Render function for each child block — provided by Canvas to support recursion */
  renderBlock: (
    block: BlockInstance,
    index: number,
  ) => React.ReactNode;
}

export function DropZone({
  parentId,
  zone,
  zoneLabel,
  children,
  isDragActive,
  renderBlock,
}: DropZoneProps) {
  const droppableId = `${parentId}:${zone}`;
  const { isOver, setNodeRef } = useDroppable({ id: droppableId });

  const isEmpty = children.length === 0;

  return (
    <div className="flex flex-col gap-1">
      {/* Zone label */}
      <div className="flex items-center gap-1.5 px-2 py-1">
        <div
          className="h-px flex-1"
          style={{ backgroundColor: "var(--separator)" }}
        />
        <span className="text-[10px] font-medium text-muted uppercase tracking-wider shrink-0">
          {zoneLabel}
        </span>
        <div
          className="h-px flex-1"
          style={{ backgroundColor: "var(--separator)" }}
        />
      </div>

      <div
        ref={setNodeRef}
        className={clsx(
          "relative rounded-lg transition-all duration-200",
          isEmpty && [
            "border-2 border-dashed flex items-center justify-center",
            isOver
              ? "border-[#634CF8] bg-[#634CF8]/5 min-h-[96px]"
              : isDragActive
                ? "border-[#634CF8]/40 bg-[#634CF8]/[0.03] min-h-[80px]"
                : "border-separator/40 min-h-[64px]",
          ],
          !isEmpty && [
            "min-h-[32px]",
            isDragActive && !isOver && "border-2 border-dashed border-[#634CF8]/20 bg-[#634CF8]/[0.01]",
            isOver && !isEmpty && "border-2 border-dashed border-[#634CF8] bg-[#634CF8]/5",
          ],
        )}
      >
        {isEmpty ? (
          <div className="flex flex-col items-center gap-1 py-3">
            <span
              className={clsx(
                "text-[11px] font-medium transition-colors",
                isOver ? "text-[#634CF8]" : "text-muted/60",
              )}
            >
              {isOver ? "Release to drop here" : "Drop blocks here"}
            </span>
          </div>
        ) : (
          <SortableContext
            items={children.map((b) => b.id)}
            strategy={verticalListSortingStrategy}
          >
            <div className="flex flex-col gap-1 p-1">
              {children.map((block, index) => (
                <div key={block.id} className="relative">
                  {/* Nested drop indicator — dashed line */}
                  {isDragActive && index === 0 && (
                    <NestedDropIndicator
                      id={`${droppableId}:before-${block.id}`}
                    />
                  )}
                  {renderBlock(block, index)}
                  {isDragActive && (
                    <NestedDropIndicator
                      id={`${droppableId}:after-${block.id}`}
                    />
                  )}
                </div>
              ))}
            </div>
          </SortableContext>
        )}
      </div>
    </div>
  );
}

/**
 * Nested drop indicator — dashed line style to distinguish from root-level solid indicators.
 */
function NestedDropIndicator({ id }: { id: string }) {
  const { isOver, setNodeRef } = useDroppable({ id });

  return (
    <div
      ref={setNodeRef}
      className={clsx(
        "transition-all duration-150",
        isOver
          ? "h-[2px] rounded-full bg-[#634CF8] my-1.5 shadow-[0_0_6px_rgba(99,76,248,0.3)]"
          : "h-2",
      )}
    />
  );
}
