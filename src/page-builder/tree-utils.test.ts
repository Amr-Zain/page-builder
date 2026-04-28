import { describe, it, expect } from "vitest";
import {
  findBlock,
  getBlockPath,
  getParentBlock,
  insertBlock,
  removeBlock,
  moveBlock,
  duplicateBlock,
  isAncestor,
  wouldCreateCycle,
  flattenTree,
  serializeTree,
  deserializeTree,
} from "./tree-utils";
import type { BlockInstance } from "./types";

// ── Test fixtures ──

function makeBlock(id: string, type = "text"): BlockInstance {
  return { id, type: type as BlockInstance["type"], props: {} };
}

function makeContainer(
  id: string,
  children: Record<string, BlockInstance[]>
): BlockInstance {
  return { id, type: "columns", props: { count: 2 }, children };
}

/** A nested tree for testing:
 * root: [A, B(container: left=[C, D], right=[E]), F]
 */
function buildTestTree(): BlockInstance[] {
  return [
    makeBlock("A"),
    makeContainer("B", {
      left: [makeBlock("C"), makeBlock("D")],
      right: [makeBlock("E")],
    }),
    makeBlock("F"),
  ];
}

// ── findBlock ──

describe("findBlock", () => {
  it("finds a root-level block", () => {
    const tree = buildTestTree();
    expect(findBlock(tree, "A")).toEqual(makeBlock("A"));
  });

  it("finds a nested block", () => {
    const tree = buildTestTree();
    expect(findBlock(tree, "D")?.id).toBe("D");
  });

  it("returns null for non-existent ID", () => {
    const tree = buildTestTree();
    expect(findBlock(tree, "Z")).toBeNull();
  });

  it("returns null for empty tree", () => {
    expect(findBlock([], "A")).toBeNull();
  });
});

// ── getBlockPath ──

describe("getBlockPath", () => {
  it("returns single-element path for root block", () => {
    const tree = buildTestTree();
    expect(getBlockPath(tree, "A")).toEqual(["A"]);
  });

  it("returns full path for nested block", () => {
    const tree = buildTestTree();
    expect(getBlockPath(tree, "D")).toEqual(["B", "D"]);
  });

  it("returns empty array for non-existent block", () => {
    const tree = buildTestTree();
    expect(getBlockPath(tree, "Z")).toEqual([]);
  });
});

// ── getParentBlock ──

describe("getParentBlock", () => {
  it("returns null for root-level block", () => {
    const tree = buildTestTree();
    expect(getParentBlock(tree, "A")).toBeNull();
  });

  it("returns parent and zone for nested block", () => {
    const tree = buildTestTree();
    const result = getParentBlock(tree, "C");
    expect(result?.parent.id).toBe("B");
    expect(result?.zone).toBe("left");
  });

  it("returns correct zone for right-column block", () => {
    const tree = buildTestTree();
    const result = getParentBlock(tree, "E");
    expect(result?.parent.id).toBe("B");
    expect(result?.zone).toBe("right");
  });
});

// ── insertBlock ──

describe("insertBlock", () => {
  it("inserts at root level", () => {
    const tree = buildTestTree();
    const newBlock = makeBlock("G");
    const result = insertBlock(tree, newBlock, null, null, 1);
    expect(result[1].id).toBe("G");
    expect(result.length).toBe(4);
  });

  it("inserts into a container zone", () => {
    const tree = buildTestTree();
    const newBlock = makeBlock("G");
    const result = insertBlock(tree, newBlock, "B", "right", 0);
    const container = findBlock(result, "B");
    expect(container?.children?.right[0].id).toBe("G");
    expect(container?.children?.right.length).toBe(2);
  });

  it("clamps index to valid range", () => {
    const tree = buildTestTree();
    const newBlock = makeBlock("G");
    const result = insertBlock(tree, newBlock, null, null, 999);
    expect(result[result.length - 1].id).toBe("G");
  });

  it("does not mutate the original tree", () => {
    const tree = buildTestTree();
    const original = JSON.stringify(tree);
    insertBlock(tree, makeBlock("G"), null, null, 0);
    expect(JSON.stringify(tree)).toBe(original);
  });
});

// ── removeBlock ──

describe("removeBlock", () => {
  it("removes a root-level block", () => {
    const tree = buildTestTree();
    const result = removeBlock(tree, "A");
    expect(result.length).toBe(2);
    expect(findBlock(result, "A")).toBeNull();
  });

  it("removes a nested block", () => {
    const tree = buildTestTree();
    const result = removeBlock(tree, "C");
    const container = findBlock(result, "B");
    expect(container?.children?.left.length).toBe(1);
    expect(container?.children?.left[0].id).toBe("D");
  });

  it("does not mutate the original tree", () => {
    const tree = buildTestTree();
    const original = JSON.stringify(tree);
    removeBlock(tree, "C");
    expect(JSON.stringify(tree)).toBe(original);
  });
});

// ── moveBlock ──

describe("moveBlock", () => {
  it("moves a block from root to a zone", () => {
    const tree = buildTestTree();
    const result = moveBlock(tree, "F", "B", "left", 0);
    expect(findBlock(result, "F")).not.toBeNull();
    const container = findBlock(result, "B");
    expect(container?.children?.left[0].id).toBe("F");
    // F should no longer be at root
    expect(result.map((b) => b.id)).not.toContain("F");
  });

  it("returns unchanged tree if block not found", () => {
    const tree = buildTestTree();
    const result = moveBlock(tree, "Z", null, null, 0);
    expect(JSON.stringify(result)).toBe(JSON.stringify(tree));
  });
});

// ── duplicateBlock ──

describe("duplicateBlock", () => {
  it("duplicates a root-level block", () => {
    const tree = buildTestTree();
    const result = duplicateBlock(tree, "A");
    expect(result.length).toBe(4);
    expect(result[0].id).toBe("A");
    expect(result[1].type).toBe("text");
    expect(result[1].id).not.toBe("A");
  });

  it("duplicates a nested block", () => {
    const tree = buildTestTree();
    const result = duplicateBlock(tree, "C");
    const container = findBlock(result, "B");
    expect(container?.children?.left.length).toBe(3);
    expect(container?.children?.left[0].id).toBe("C");
    expect(container?.children?.left[1].id).not.toBe("C");
    expect(container?.children?.left[1].type).toBe("text");
  });

  it("deep-clones children with new IDs", () => {
    const tree = buildTestTree();
    const result = duplicateBlock(tree, "B");
    expect(result.length).toBe(4);
    const clone = result[2]; // clone of B is after B (index 2)
    expect(clone.type).toBe("columns");
    expect(clone.id).not.toBe("B");
    // Children should have new IDs
    expect(clone.children?.left[0].id).not.toBe("C");
    expect(clone.children?.left[1].id).not.toBe("D");
    expect(clone.children?.right[0].id).not.toBe("E");
  });
});

// ── isAncestor ──

describe("isAncestor", () => {
  it("returns true for direct parent", () => {
    const tree = buildTestTree();
    expect(isAncestor(tree, "B", "C")).toBe(true);
  });

  it("returns false for non-ancestor", () => {
    const tree = buildTestTree();
    expect(isAncestor(tree, "A", "C")).toBe(false);
  });

  it("returns false for same block", () => {
    const tree = buildTestTree();
    expect(isAncestor(tree, "B", "B")).toBe(false);
  });

  it("returns false for descendant-to-ancestor direction", () => {
    const tree = buildTestTree();
    expect(isAncestor(tree, "C", "B")).toBe(false);
  });
});

// ── wouldCreateCycle ──

describe("wouldCreateCycle", () => {
  it("returns true when dropping block into itself", () => {
    const tree = buildTestTree();
    expect(wouldCreateCycle(tree, "B", "B")).toBe(true);
  });

  it("returns true when dropping container into its own child", () => {
    const tree = buildTestTree();
    expect(wouldCreateCycle(tree, "B", "C")).toBe(true);
  });

  it("returns false for valid drop target", () => {
    const tree = buildTestTree();
    expect(wouldCreateCycle(tree, "C", "B")).toBe(false);
  });

  it("returns false for unrelated blocks", () => {
    const tree = buildTestTree();
    expect(wouldCreateCycle(tree, "A", "F")).toBe(false);
  });
});

// ── flattenTree ──

describe("flattenTree", () => {
  it("flattens a nested tree with correct depths", () => {
    const tree = buildTestTree();
    const flat = flattenTree(tree);
    expect(flat.length).toBe(6); // A, B, C, D, E, F
    expect(flat[0]).toEqual({ block: tree[0], depth: 0, zone: undefined, parentId: undefined });
    expect(flat[1].block.id).toBe("B");
    expect(flat[1].depth).toBe(0);
    // C and D are in left zone of B
    expect(flat[2].block.id).toBe("C");
    expect(flat[2].depth).toBe(1);
    expect(flat[2].zone).toBe("left");
    expect(flat[2].parentId).toBe("B");
  });

  it("returns empty array for empty tree", () => {
    expect(flattenTree([])).toEqual([]);
  });
});

// ── serializeTree / deserializeTree ──

describe("serialization", () => {
  it("round-trips a simple tree", () => {
    const tree = buildTestTree();
    const json = serializeTree(tree);
    const restored = deserializeTree(json);
    expect(restored).toEqual(tree);
  });

  it("throws on invalid JSON", () => {
    expect(() => deserializeTree("not json")).toThrow("Invalid JSON");
  });

  it("throws on non-array JSON", () => {
    expect(() => deserializeTree('{"a":1}')).toThrow("expected an array");
  });

  it("throws on block missing id", () => {
    expect(() => deserializeTree('[{"type":"text","props":{}}]')).toThrow("missing or empty 'id'");
  });

  it("throws on block missing type", () => {
    expect(() => deserializeTree('[{"id":"1","props":{}}]')).toThrow("missing or empty 'type'");
  });

  it("throws on block missing props", () => {
    expect(() => deserializeTree('[{"id":"1","type":"text"}]')).toThrow("missing or invalid 'props'");
  });

  it("throws on invalid children format", () => {
    expect(() =>
      deserializeTree('[{"id":"1","type":"text","props":{},"children":[]}]')
    ).toThrow("'children' must be a record");
  });

  it("validates nested children recursively", () => {
    const invalid = JSON.stringify([
      {
        id: "1",
        type: "columns",
        props: {},
        children: { left: [{ id: "", type: "text", props: {} }] },
      },
    ]);
    expect(() => deserializeTree(invalid)).toThrow("missing or empty 'id'");
  });
});
