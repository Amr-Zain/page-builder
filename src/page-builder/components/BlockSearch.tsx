import { useState, useMemo, useRef } from "react";
import { useDraggable } from "@dnd-kit/core";
import { Chip } from "@heroui/react";
import clsx from "clsx";
import { Search } from "lucide-react";
import { BLOCK_DEFINITIONS, BLOCK_CATEGORIES } from "../data";
import type { BlockDefinition, BlockCategory } from "../types";

/** Category display order */
const CATEGORY_ORDER: BlockCategory[] = [
  "sections",
  "content",
  "layout",
  "media",
];

/** Category color mapping for Chip badges */
const CATEGORY_COLORS: Record<BlockCategory, "accent" | "success" | "warning" | "danger"> = {
  sections: "accent",
  content: "success",
  layout: "warning",
  media: "danger",
};

/**
 * Block search/filter with categorized results.
 * Groups matching blocks by category with headers.
 */
export function BlockSearch() {
  const [query, setQuery] = useState("");
  const [isFocused, setIsFocused] = useState(false);
  const inputRef = useRef<HTMLInputElement>(null);

  /** Case-insensitive substring matching across label, type, description, category */
  const results = useMemo(() => {
    if (!query.trim()) return [];
    const q = query.toLowerCase();
    return BLOCK_DEFINITIONS.filter(
      (b) =>
        b.label.toLowerCase().includes(q) ||
        b.type.toLowerCase().includes(q) ||
        b.description.toLowerCase().includes(q) ||
        b.category.toLowerCase().includes(q),
    );
  }, [query]);

  /** Group results by category in display order */
  const groupedResults = useMemo(() => {
    if (results.length === 0) return [];

    const groups: { category: BlockCategory; blocks: BlockDefinition[] }[] = [];
    for (const cat of CATEGORY_ORDER) {
      const catBlocks = results.filter((b) => b.category === cat);
      if (catBlocks.length > 0) {
        groups.push({ category: cat, blocks: catBlocks });
      }
    }
    return groups;
  }, [results]);

  function handleKeyDown(e: React.KeyboardEvent<HTMLInputElement>) {
    if (e.key === "Escape") {
      e.preventDefault();
      setQuery("");
      inputRef.current?.blur();
    }
  }

  return (
    <div className="mb-3">
      <div className="relative">
        <Search
          className="absolute left-3 top-1/2 -translate-y-1/2 text-muted"
          size={14}
        />
        <input
          ref={inputRef}
          className="w-full h-9 rounded-lg border border-separator/50 bg-[#FAFAFA] dark:bg-surface pl-9 pr-3 text-[12px] text-foreground outline-none focus:border-[#634CF8] placeholder:text-muted/50"
          placeholder="Search blocks..."
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          onKeyDown={handleKeyDown}
          onFocus={() => setIsFocused(true)}
          onBlur={() => setIsFocused(false)}
        />
        {query && (
          <button
            className="absolute right-2 top-1/2 -translate-y-1/2 text-[10px] text-muted hover:text-foreground"
            onClick={() => setQuery("")}
          >
            ✕
          </button>
        )}
      </div>

      {/* Keyboard hint */}
      {isFocused && !query && (
        <p className="mt-1.5 text-[9px] text-muted/50 text-center">
          Press <kbd className="px-1 py-0.5 rounded bg-[#F0F0F0] dark:bg-surface text-[8px] font-mono">Esc</kbd> to clear
        </p>
      )}
      {isFocused && query && (
        <p className="mt-1.5 text-[9px] text-muted/50 text-center">
          Press <kbd className="px-1 py-0.5 rounded bg-[#F0F0F0] dark:bg-surface text-[8px] font-mono">Esc</kbd> to clear
        </p>
      )}

      {/* Categorized results */}
      {query && groupedResults.length > 0 && (
        <div className="mt-2 flex flex-col gap-0.5 max-h-[300px] overflow-y-auto">
          <p className="text-[9px] text-muted/60 px-1 mb-1">
            {results.length} result{results.length !== 1 ? "s" : ""}
          </p>
          {groupedResults.map((group) => {
            const catMeta = BLOCK_CATEGORIES[group.category];
            return (
              <div key={group.category}>
                {/* Category header */}
                <div className="flex items-center gap-1.5 px-2 py-1.5 mt-1 first:mt-0">
                  <span className="text-[10px]">{catMeta.icon}</span>
                  <span className="text-[10px] font-semibold text-muted/70 uppercase tracking-wider">
                    {catMeta.label}
                  </span>
                  <span className="text-[9px] text-muted/40">
                    ({group.blocks.length})
                  </span>
                </div>
                {/* Results in this category */}
                {group.blocks.map((block) => (
                  <SearchResultItem
                    block={block}
                    key={block.type}
                    categoryColor={CATEGORY_COLORS[block.category]}
                  />
                ))}
              </div>
            );
          })}
        </div>
      )}

      {/* Empty state */}
      {query && results.length === 0 && (
        <div className="mt-2 rounded-lg bg-[#F8F8FA] dark:bg-surface p-3 text-center">
          <p className="text-[11px] text-muted">No blocks match &ldquo;{query}&rdquo;</p>
          <p className="text-[9px] text-muted/50 mt-1">
            Try searching by name, type, or category
          </p>
        </div>
      )}
    </div>
  );
}

function SearchResultItem({
  block,
  categoryColor,
}: {
  block: BlockDefinition;
  categoryColor: "accent" | "success" | "warning" | "danger";
}) {
  const { attributes, listeners, setNodeRef, isDragging } = useDraggable({
    id: `search-block-${block.type}`,
    data: { type: "sidebar-block", blockType: block.type },
  });

  return (
    <div
      ref={setNodeRef}
      className={clsx(
        "flex items-center gap-2.5 rounded-lg border border-separator/30 bg-white dark:bg-surface px-3 py-2 cursor-grab active:cursor-grabbing select-none transition-all mx-1 mb-0.5",
        isDragging
          ? "opacity-50 border-[#634CF8]"
          : "hover:border-[#634CF8]/30",
      )}
      {...listeners}
      {...attributes}
    >
      <span className="text-sm shrink-0">{block.icon}</span>
      <div className="flex-1 min-w-0">
        <p className="text-[11px] font-medium text-foreground">{block.label}</p>
        <p className="text-[9px] text-muted truncate">{block.description}</p>
      </div>
      <Chip size="sm" color={categoryColor} variant="soft">
        {block.category}
      </Chip>
    </div>
  );
}
