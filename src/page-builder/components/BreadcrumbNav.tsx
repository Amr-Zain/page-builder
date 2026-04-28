import { useMemo } from "react";
import { Breadcrumbs } from "@heroui/react";

import type { BlockInstance } from "../types";
import { BLOCK_DEFINITIONS } from "../data";
import { getBlockPath, findBlock } from "../tree-utils";

/**
 * BreadcrumbNav — Shows the ancestor path for a nested selected block.
 *
 * Uses HeroUI v3 `Breadcrumbs` component with compound pattern.
 * Computes ancestor path using `getBlockPath()` from tree-utils.
 * Each breadcrumb shows the block's label from its definition.
 * Clicking an ancestor selects that block.
 * Only renders when selected block depth > 1.
 * Positioned between Toolbar and Canvas as a thin horizontal bar.
 */

interface BreadcrumbNavProps {
  /** The full block tree */
  blocks: BlockInstance[];
  /** Currently selected block ID */
  selectedBlockId: string | null;
  /** Callback to select a block */
  onSelectBlock: (id: string | null) => void;
}

/** Get the display label for a block */
function getBlockLabel(block: BlockInstance): string {
  const def = BLOCK_DEFINITIONS.find((d) => d.type === block.type);
  return def ? `${def.icon} ${def.label}` : block.type;
}

export function BreadcrumbNav({
  blocks,
  selectedBlockId,
  onSelectBlock,
}: BreadcrumbNavProps) {
  const ancestorPath = useMemo(() => {
    if (!selectedBlockId) return [];
    return getBlockPath(blocks, selectedBlockId);
  }, [blocks, selectedBlockId]);

  // Only render when selected block is at depth > 1 (has ancestors)
  // The path includes the block itself, so length > 1 means it has at least one ancestor
  if (ancestorPath.length <= 1) return null;

  return (
    <div className="flex items-center px-4 py-1.5 bg-background border-b border-separator/30 shrink-0">
      <Breadcrumbs>
        {/* "Canvas" root breadcrumb */}
        <Breadcrumbs.Item
          onPress={() => onSelectBlock(null)}
          className="text-[11px] text-muted cursor-pointer hover:text-foreground"
        >
          Canvas
        </Breadcrumbs.Item>

        {/* Ancestor blocks (all except the last which is the selected block) */}
        {ancestorPath.slice(0, -1).map((ancestorId: string) => {
          const block = findBlock(blocks, ancestorId);
          if (!block) return null;
          return (
            <Breadcrumbs.Item
              key={ancestorId}
              onPress={() => onSelectBlock(ancestorId)}
              className="text-[11px] text-muted cursor-pointer hover:text-foreground"
            >
              {getBlockLabel(block)}
            </Breadcrumbs.Item>
          );
        })}

        {/* Current selected block (non-clickable) */}
        {(() => {
          const currentBlock = findBlock(
            blocks,
            ancestorPath[ancestorPath.length - 1],
          );
          if (!currentBlock) return null;
          return (
            <Breadcrumbs.Item className="text-[11px] font-medium text-foreground">
              {getBlockLabel(currentBlock)}
            </Breadcrumbs.Item>
          );
        })()}
      </Breadcrumbs>
    </div>
  );
}
