import { useEffect, useRef, useState, useCallback } from "react";
import { createPortal } from "react-dom";
import { Button, Tooltip } from "@heroui/react";

import type { BlockInstance } from "../types";
import { BLOCK_DEFINITIONS } from "../data";

/**
 * ActionBar — A floating toolbar that appears above the selected block.
 *
 * Renders as a React portal attached to `document.body`.
 * Positions above the selected block using `getBoundingClientRect()`.
 * Uses `ResizeObserver` + scroll listener to keep position in sync.
 *
 * Structure:
 * ┌─────────────────────────────────────────┐
 * │ [↑ Parent]  Hero Block  │  [⧉] [🗑]   │
 * └─────────────────────────────────────────┘
 */

interface ActionBarProps {
  /** The currently selected block */
  block: BlockInstance;
  /** Ref to the selected block's DOM element */
  blockRef: HTMLElement | null;
  /** Whether the block is nested inside a container */
  isNested: boolean;
  /** Whether a drag operation is in progress */
  isDragging: boolean;
  /** Callback to duplicate the block */
  onDuplicate: () => void;
  /** Callback to delete the block */
  onDelete: () => void;
  /** Callback to select the parent block */
  onSelectParent: () => void;
}

export function ActionBar({
  block,
  blockRef,
  isNested,
  isDragging,
  onDuplicate,
  onDelete,
  onSelectParent,
}: ActionBarProps) {
  const [position, setPosition] = useState<{
    top: number;
    left: number;
    width: number;
  } | null>(null);
  const barRef = useRef<HTMLDivElement>(null);

  const blockDef = BLOCK_DEFINITIONS.find((d) => d.type === block.type);
  const label = blockDef ? `${blockDef.icon} ${blockDef.label}` : block.type;

  const syncPosition = useCallback(() => {
    if (!blockRef) return;
    const rect = blockRef.getBoundingClientRect();
    const scrollY = window.scrollY || document.documentElement.scrollTop;
    const scrollX = window.scrollX || document.documentElement.scrollLeft;

    setPosition({
      top: rect.top + scrollY,
      left: rect.left + scrollX,
      width: rect.width,
    });
  }, [blockRef]);

  useEffect(() => {
    if (!blockRef) return;

    // Initial sync
    syncPosition();

    // ResizeObserver to track block size changes
    const resizeObserver = new ResizeObserver(() => {
      syncPosition();
    });
    resizeObserver.observe(blockRef);

    // Scroll listener — capture phase to catch scrolling containers
    const onScroll = () => syncPosition();
    document.addEventListener("scroll", onScroll, true);
    window.addEventListener("resize", onScroll);

    return () => {
      resizeObserver.disconnect();
      document.removeEventListener("scroll", onScroll, true);
      window.removeEventListener("resize", onScroll);
    };
  }, [blockRef, syncPosition]);

  // Hide when dragging or no position
  if (isDragging || !position || !blockRef) return null;

  const barHeight = 40; // approximate height of the action bar
  const gap = 8;

  return createPortal(
    <div
      ref={barRef}
      className="fixed z-30 pointer-events-auto"
      style={{
        top: `${position.top - barHeight - gap}px`,
        left: `${position.left}px`,
        width: `${position.width}px`,
      }}
      onClick={(e) => e.stopPropagation()}
    >
      <div className="flex items-center justify-between rounded-xl bg-foreground/90 dark:bg-surface/95 backdrop-blur-xl shadow-2xl border border-white/10 px-3 py-1.5 mx-auto w-fit max-w-full">
        {/* Left: Select Parent (only when nested) */}
        <div className="flex items-center gap-1">
          {isNested && (
            <Tooltip delay={200}>
              <Button
                size="sm"
                variant="ghost"
                isIconOnly
                onPress={onSelectParent}
                className="text-background/70 dark:text-foreground/70 hover:text-background dark:hover:text-foreground h-7 w-7 min-w-7"
              >
                <svg
                  className="h-3.5 w-3.5"
                  fill="none"
                  stroke="currentColor"
                  viewBox="0 0 24 24"
                >
                  <path
                    d="M9 11l-4 4m0 0l4 4m-4-4h11a4 4 0 000-8h-1"
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                  />
                </svg>
              </Button>
              <Tooltip.Content>
                <p>Select Parent</p>
              </Tooltip.Content>
            </Tooltip>
          )}
        </div>

        {/* Center: Block label */}
        <span className="text-[11px] font-medium text-background dark:text-foreground px-3 truncate">
          {label}
        </span>

        {/* Right: Duplicate + Delete */}
        <div className="flex items-center gap-0.5">
          <Tooltip delay={200}>
            <Button
              size="sm"
              variant="ghost"
              isIconOnly
              onPress={onDuplicate}
              className="text-background/70 dark:text-foreground/70 hover:text-background dark:hover:text-foreground h-7 w-7 min-w-7"
            >
              <svg
                className="h-3.5 w-3.5"
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
              >
                <path
                  d="M8 16H6a2 2 0 01-2-2V6a2 2 0 012-2h8a2 2 0 012 2v2m-6 12h8a2 2 0 002-2v-8a2 2 0 00-2-2h-8a2 2 0 00-2 2v8a2 2 0 002 2z"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={1.5}
                />
              </svg>
            </Button>
            <Tooltip.Content>
              <p>Duplicate</p>
            </Tooltip.Content>
          </Tooltip>

          <Tooltip delay={200}>
            <Button
              size="sm"
              variant="ghost"
              isIconOnly
              onPress={onDelete}
              className="text-background/70 dark:text-foreground/70 hover:text-danger h-7 w-7 min-w-7"
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
            </Button>
            <Tooltip.Content>
              <p>Delete</p>
            </Tooltip.Content>
          </Tooltip>
        </div>
      </div>
    </div>,
    document.body,
  );
}
