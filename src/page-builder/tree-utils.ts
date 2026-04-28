import type { BlockInstance } from "./types";

// ═══════════════════════════════════════════════════════════════════════════════
// Tree Utilities — Pure, immutable functions for recursive block tree operations
// ═══════════════════════════════════════════════════════════════════════════════

// ── ID Generation ──

let idCounter = 0;

/** Generate a unique block ID. */
export function generateId(): string {
  return `block-${++idCounter}-${Date.now()}`;
}

// ── Deep Clone ──

/** Deep-clone a block, assigning new IDs to the clone and all nested children. */
function deepCloneBlock(block: BlockInstance): BlockInstance {
  const clone: BlockInstance = {
    id: generateId(),
    type: block.type,
    props: structuredClone(block.props),
  };

  if (block.children) {
    clone.children = Object.fromEntries(
      Object.entries(block.children).map(([zone, blocks]) => [
        zone,
        blocks.map(deepCloneBlock),
      ])
    );
  }

  return clone;
}

// ── Find ──

/** Recursive search for a block by ID. Returns the block or null. */
export function findBlock(
  blocks: BlockInstance[],
  id: string
): BlockInstance | null {
  for (const block of blocks) {
    if (block.id === id) return block;

    if (block.children) {
      for (const zone of Object.values(block.children)) {
        const found = findBlock(zone, id);
        if (found) return found;
      }
    }
  }

  return null;
}

// ── Path ──

/** Returns the array of ancestor IDs from root to the target block (inclusive). */
export function getBlockPath(
  blocks: BlockInstance[],
  id: string
): string[] {
  for (const block of blocks) {
    if (block.id === id) return [block.id];

    if (block.children) {
      for (const zone of Object.values(block.children)) {
        const path = getBlockPath(zone, id);
        if (path.length > 0) return [block.id, ...path];
      }
    }
  }

  return [];
}

// ── Parent ──

/** Returns the immediate parent block and zone name, or null for root-level blocks. */
export function getParentBlock(
  blocks: BlockInstance[],
  id: string
): { parent: BlockInstance; zone: string } | null {
  for (const block of blocks) {
    if (block.children) {
      for (const [zoneName, zoneBlocks] of Object.entries(block.children)) {
        for (const child of zoneBlocks) {
          if (child.id === id) return { parent: block, zone: zoneName };
        }

        const found = getParentBlock(zoneBlocks, id);
        if (found) return found;
      }
    }
  }

  return null;
}

// ── Insert ──

/**
 * Immutably insert a block into the tree.
 * - If targetParentId is null, inserts at root level at targetIndex.
 * - Otherwise, inserts into the specified zone of the target parent.
 */
export function insertBlock(
  blocks: BlockInstance[],
  newBlock: BlockInstance,
  targetParentId: string | null,
  targetZone: string | null,
  targetIndex: number
): BlockInstance[] {
  // Root-level insert
  if (targetParentId === null) {
    const result = [...blocks];
    const clampedIndex = Math.max(0, Math.min(targetIndex, result.length));
    result.splice(clampedIndex, 0, newBlock);
    return result;
  }

  // Nested insert — walk the tree immutably
  return blocks.map((block) => {
    if (block.id === targetParentId && targetZone !== null) {
      const children = block.children ?? {};
      const zoneBlocks = [...(children[targetZone] ?? [])];
      const clampedIndex = Math.max(0, Math.min(targetIndex, zoneBlocks.length));
      zoneBlocks.splice(clampedIndex, 0, newBlock);

      return {
        ...block,
        children: { ...children, [targetZone]: zoneBlocks },
      };
    }

    // Recurse into children
    if (block.children) {
      const updatedChildren = Object.fromEntries(
        Object.entries(block.children).map(([zone, zoneBlocks]) => [
          zone,
          insertBlock(zoneBlocks, newBlock, targetParentId, targetZone, targetIndex),
        ])
      );

      return { ...block, children: updatedChildren };
    }

    return block;
  });
}

// ── Remove ──

/** Immutably remove a block by ID from any depth in the tree. */
export function removeBlock(
  blocks: BlockInstance[],
  id: string
): BlockInstance[] {
  const result: BlockInstance[] = [];

  for (const block of blocks) {
    if (block.id === id) continue; // skip the removed block

    if (block.children) {
      const updatedChildren = Object.fromEntries(
        Object.entries(block.children).map(([zone, zoneBlocks]) => [
          zone,
          removeBlock(zoneBlocks, id),
        ])
      );

      result.push({ ...block, children: updatedChildren });
    } else {
      result.push(block);
    }
  }

  return result;
}

// ── Move ──

/**
 * Move a block from its current position to a new position.
 * Removes the block first, then inserts it at the target location.
 */
export function moveBlock(
  blocks: BlockInstance[],
  blockId: string,
  targetParentId: string | null,
  targetZone: string | null,
  targetIndex: number
): BlockInstance[] {
  const block = findBlock(blocks, blockId);
  if (!block) return blocks;

  const withoutBlock = removeBlock(blocks, blockId);
  return insertBlock(withoutBlock, block, targetParentId, targetZone, targetIndex);
}

// ── Duplicate ──

/**
 * Deep-clone a block (with new IDs) and place the copy immediately after the original.
 * Works at any depth in the tree.
 */
export function duplicateBlock(
  blocks: BlockInstance[],
  id: string
): BlockInstance[] {
  const result: BlockInstance[] = [];

  for (const block of blocks) {
    result.push(
      block.children
        ? {
            ...block,
            children: Object.fromEntries(
              Object.entries(block.children).map(([zone, zoneBlocks]) => [
                zone,
                duplicateBlock(zoneBlocks, id),
              ])
            ),
          }
        : block
    );

    // Insert clone right after the original
    if (block.id === id) {
      result.push(deepCloneBlock(block));
    }
  }

  return result;
}

// ── Ancestor Checks ──

/** Returns true if ancestorId is an ancestor of descendantId in the tree. */
export function isAncestor(
  blocks: BlockInstance[],
  ancestorId: string,
  descendantId: string
): boolean {
  const path = getBlockPath(blocks, descendantId);
  // path includes the descendant itself, so check all entries before the last
  return path.length > 1 && path.slice(0, -1).includes(ancestorId);
}

/**
 * Returns true if dropping blockId into targetId would create a cycle.
 * A cycle occurs when the target is the block itself or a descendant of the block.
 */
export function wouldCreateCycle(
  blocks: BlockInstance[],
  blockId: string,
  targetId: string
): boolean {
  if (blockId === targetId) return true;
  return isAncestor(blocks, blockId, targetId);
}

// ── Flatten ──

export interface FlattenedBlock {
  block: BlockInstance;
  depth: number;
  zone?: string;
  parentId?: string;
}

/**
 * Flatten the recursive tree into a flat array with depth, zone, and parentId info.
 * Useful for rendering the layers panel.
 */
export function flattenTree(
  blocks: BlockInstance[],
  depth: number = 0,
  zone?: string,
  parentId?: string
): FlattenedBlock[] {
  const result: FlattenedBlock[] = [];

  for (const block of blocks) {
    result.push({ block, depth, zone, parentId });

    if (block.children) {
      for (const [zoneName, zoneBlocks] of Object.entries(block.children)) {
        result.push(
          ...flattenTree(zoneBlocks, depth + 1, zoneName, block.id)
        );
      }
    }
  }

  return result;
}

// ── Serialization ──

/** Serialize the block tree to a JSON string. */
export function serializeTree(blocks: BlockInstance[]): string {
  return JSON.stringify(blocks);
}

/** Deserialize a JSON string back to a block tree. Throws on invalid input. */
export function deserializeTree(json: string): BlockInstance[] {
  let parsed: unknown;

  try {
    parsed = JSON.parse(json);
  } catch {
    throw new Error("Invalid JSON: failed to parse input");
  }

  if (!Array.isArray(parsed)) {
    throw new Error("Invalid tree: expected an array of blocks");
  }

  for (const item of parsed) {
    validateBlock(item);
  }

  return parsed as BlockInstance[];
}

/** Validate that a value conforms to the BlockInstance shape. */
function validateBlock(value: unknown): void {
  if (typeof value !== "object" || value === null) {
    throw new Error("Invalid block: expected an object");
  }

  const obj = value as Record<string, unknown>;

  if (typeof obj.id !== "string" || obj.id.length === 0) {
    throw new Error("Invalid block: missing or empty 'id'");
  }

  if (typeof obj.type !== "string" || obj.type.length === 0) {
    throw new Error("Invalid block: missing or empty 'type'");
  }

  if (typeof obj.props !== "object" || obj.props === null) {
    throw new Error("Invalid block: missing or invalid 'props'");
  }

  if (obj.children !== undefined) {
    if (typeof obj.children !== "object" || obj.children === null || Array.isArray(obj.children)) {
      throw new Error("Invalid block: 'children' must be a record of zone arrays");
    }

    for (const [zoneName, zoneBlocks] of Object.entries(obj.children as Record<string, unknown>)) {
      if (!Array.isArray(zoneBlocks)) {
        throw new Error(`Invalid block: children zone '${zoneName}' must be an array`);
      }

      for (const child of zoneBlocks) {
        validateBlock(child);
      }
    }
  }
}
