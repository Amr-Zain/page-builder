import { useState, useRef, useEffect, useCallback } from "react";
import { Chip } from "@heroui/react";
import clsx from "clsx";
import { Search, Clock, X, GripVertical } from "lucide-react";
import { useDraggable } from "@dnd-kit/core";

import type { SearchableItem, SearchResult, SearchMatch } from "../search-engine";
import { SearchEngine } from "../search-engine";
import { BLOCK_DEFINITIONS, COMPONENT_DEFINITIONS } from "../data";
import { renderIcon } from "../icon-map";

// ── Props ──

interface EnhancedSearchProps {
  searchEngine: SearchEngine;
  onSelect: (item: SearchableItem) => void;
  placeholder?: string;
}

// ── Highlight Helper ──

function HighlightedText({ text, indices }: { text: string; indices: [number, number][] }) {
  if (!indices.length) return <>{text}</>;

  const parts: React.ReactNode[] = [];
  let lastEnd = 0;

  for (const [start, end] of indices) {
    if (start > lastEnd) {
      parts.push(<span key={`t-${lastEnd}`}>{text.slice(lastEnd, start)}</span>);
    }
    parts.push(
      <span key={`h-${start}`} className="font-bold text-[#634CF8]">
        {text.slice(start, end + 1)}
      </span>
    );
    lastEnd = end + 1;
  }

  if (lastEnd < text.length) {
    parts.push(<span key={`t-${lastEnd}`}>{text.slice(lastEnd)}</span>);
  }

  return <>{parts}</>;
}

// ── Draggable Search Result Item ──

function DraggableSearchResultItem({
  result,
  selectedIndex,
  idx,
  onSelect,
  onMouseEnter,
  getLabelMatch,
}: {
  result: SearchResult;
  selectedIndex: number;
  idx: number;
  onSelect: (result: SearchResult) => void;
  onMouseEnter: (idx: number) => void;
  getLabelMatch: (result: SearchResult) => SearchMatch | undefined;
}) {
  const blockType = result.item.metadata?.blockType as string;
  const { attributes, listeners, setNodeRef, isDragging } = useDraggable({
    id: `search-result-${result.item.id}`,
    data: {
      type: "sidebar-block",
      blockType: blockType,
    },
  });

  const labelMatch = getLabelMatch(result);
  const def = BLOCK_DEFINITIONS.find((b) => b.type === blockType) ||
              COMPONENT_DEFINITIONS.find((c) => c.type === blockType);
  const icon = def?.icon || "Box";

  return (
    <div
      ref={setNodeRef}
      data-index={idx}
      className={clsx(
        "flex items-center gap-2.5 rounded-lg border px-3 py-2 cursor-grab active:cursor-grabbing select-none transition-all outline-none",
        isDragging
          ? "opacity-50 border-[#634CF8] shadow-lg scale-95 z-50 bg-white dark:bg-surface"
          : idx === selectedIndex
            ? "border-[#634CF8]/50 bg-[#634CF8]/5"
            : "border-separator/30 bg-white dark:bg-surface hover:border-[#634CF8]/30"
      )}
      onClick={() => onSelect(result)}
      onMouseEnter={() => onMouseEnter(idx)}
      {...attributes}
      {...listeners}
    >
      <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-md bg-[#F8F8FA] dark:bg-[#1a1a2e]">
        <span className="opacity-50">{renderIcon(icon)}</span>
      </div>
      <div className="flex-1 min-w-0">
        <p className="text-[11px] font-medium text-foreground truncate">
          {labelMatch ? (
            <HighlightedText text={labelMatch.text} indices={labelMatch.indices} />
          ) : (
            result.item.label
          )}
        </p>
        {result.item.description && (
          <p className="text-[9px] text-muted truncate">
            {result.item.description}
          </p>
        )}
      </div>
      <Chip size="sm" variant="soft" className="shrink-0 h-5 text-[9px]">
        {result.item.category}
      </Chip>
      <GripVertical size={14} className="text-muted/30 shrink-0" />
    </div>
  );
}

// ── EnhancedSearch Component ──

export function EnhancedSearch({ searchEngine, onSelect, placeholder }: EnhancedSearchProps) {
  const [query, setQuery] = useState("");
  const [results, setResults] = useState<SearchResult[]>([]);
  const [selectedIndex, setSelectedIndex] = useState(0);
  const [categoryFilter, setCategoryFilter] = useState<string | null>(null);
  const [showHistory, setShowHistory] = useState(false);
  const [isFocused, setIsFocused] = useState(false);

  const inputRef = useRef<HTMLInputElement>(null);
  const debounceRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const resultsRef = useRef<HTMLDivElement>(null);

  // Get categories from the search index
  const categories = searchEngine.getIndex().getCategories();

  // Debounced search (150ms)
  const performSearch = useCallback(
    (text: string) => {
      if (!text.trim()) {
        setResults([]);
        setSelectedIndex(0);
        return;
      }

      const searchResults = searchEngine.search({
        text,
        category: categoryFilter ?? undefined,
        limit: 50,
      });

      setResults(searchResults);
      setSelectedIndex(0);
      setShowHistory(false);
    },
    [searchEngine, categoryFilter]
  );

  // Handle input change with debouncing
  const handleInputChange = (value: string) => {
    setQuery(value);

    if (debounceRef.current) {
      clearTimeout(debounceRef.current);
    }

    debounceRef.current = setTimeout(() => {
      performSearch(value);
    }, 150);
  };

  // Re-search when category filter changes
  useEffect(() => {
    if (query.trim()) {
      performSearch(query);
    }
  }, [categoryFilter, performSearch, query]);

  // Cleanup debounce on unmount
  useEffect(() => {
    return () => {
      if (debounceRef.current) {
        clearTimeout(debounceRef.current);
      }
    };
  }, []);

  // Scroll selected result into view
  useEffect(() => {
    if (resultsRef.current) {
      const selected = resultsRef.current.querySelector(`[data-index="${selectedIndex}"]`);
      if (selected) {
        selected.scrollIntoView({ block: "nearest" });
      }
    }
  }, [selectedIndex]);

  // Keyboard navigation
  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === "ArrowDown") {
      e.preventDefault();
      setSelectedIndex((i) => Math.min(i + 1, results.length - 1));
    } else if (e.key === "ArrowUp") {
      e.preventDefault();
      setSelectedIndex((i) => Math.max(i - 1, 0));
    } else if (e.key === "Enter") {
      e.preventDefault();
      if (results[selectedIndex]) {
        handleSelectResult(results[selectedIndex]);
      }
    } else if (e.key === "Escape") {
      e.preventDefault();
      setQuery("");
      setResults([]);
      setShowHistory(false);
      inputRef.current?.blur();
    } else if (e.key === "Tab") {
      e.preventDefault();
      // Cycle through category filters
      const allFilters = [null, ...categories];
      const currentIdx = allFilters.indexOf(categoryFilter);
      const nextIdx = (currentIdx + 1) % allFilters.length;
      setCategoryFilter(allFilters[nextIdx]);
    }
  };

  const handleSelectResult = (result: SearchResult) => {
    searchEngine.addToHistory(query, results.length);
    onSelect(result.item);
    setQuery("");
    setResults([]);
    setShowHistory(false);
  };

  const handleFocus = () => {
    setIsFocused(true);
    if (!query.trim()) {
      setShowHistory(true);
    }
  };

  const handleBlur = () => {
    // Delay to allow click events on results
    setTimeout(() => {
      setIsFocused(false);
      setShowHistory(false);
    }, 200);
  };

  const handleHistoryClick = (historyQuery: string) => {
    setQuery(historyQuery);
    setShowHistory(false);
    performSearch(historyQuery);
  };

  // Get result counts per category
  const getCategoryCount = (cat: string | null): number => {
    if (!query.trim()) return 0;
    if (cat === null) {
      // "All" - search without category filter
      const allResults = searchEngine.search({ text: query });
      return allResults.length;
    }
    const catResults = searchEngine.search({ text: query, category: cat });
    return catResults.length;
  };

  const history = searchEngine.getHistory();

  // Get the best match for highlighting
  const getLabelMatch = (result: SearchResult): SearchMatch | undefined => {
    return result.matches.find((m) => m.field === "label");
  };

  return (
    <div className="relative">
      {/* Search Input */}
      <div className="relative">
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-3.5 w-3.5 text-muted" />
        <input
          ref={inputRef}
          className="w-full h-8 rounded-lg border border-separator/50 bg-[#FAFAFA] dark:bg-surface pl-9 pr-8 text-[11px] text-foreground outline-none focus:border-[#634CF8] placeholder:text-muted/50"
          placeholder={placeholder ?? "Search..."}
          value={query}
          onChange={(e) => handleInputChange(e.target.value)}
          onKeyDown={handleKeyDown}
          onFocus={handleFocus}
          onBlur={handleBlur}
        />
        {query && (
          <button
            className="absolute right-2 top-1/2 -translate-y-1/2 text-muted hover:text-foreground"
            onClick={() => {
              setQuery("");
              setResults([]);
              inputRef.current?.focus();
            }}
          >
            <X size={12} />
          </button>
        )}
      </div>

      {/* Category Filter Tabs */}
      {query.trim() && results.length > 0 && (
        <div className="flex gap-1 mt-2 flex-wrap">
          <button
            className={clsx(
              "px-2 py-0.5 rounded-md text-[10px] font-medium transition-colors",
              categoryFilter === null
                ? "bg-[#634CF8] text-white"
                : "bg-[#F0F0F0] dark:bg-surface text-muted hover:text-foreground"
            )}
            onClick={() => setCategoryFilter(null)}
          >
            All ({getCategoryCount(null)})
          </button>
          {categories.map((cat) => {
            const count = getCategoryCount(cat);
            return (
              <button
                key={cat}
                disabled={count === 0}
                className={clsx(
                  "px-2 py-0.5 rounded-md text-[10px] font-medium transition-colors capitalize",
                  categoryFilter === cat
                    ? "bg-[#634CF8] text-white"
                    : count === 0
                      ? "bg-[#F0F0F0] dark:bg-surface text-muted/40 cursor-not-allowed"
                      : "bg-[#F0F0F0] dark:bg-surface text-muted hover:text-foreground"
                )}
                onClick={() => count > 0 && setCategoryFilter(cat)}
              >
                {cat} ({count})
              </button>
            );
          })}
        </div>
      )}

      {/* Search Results */}
      {results.length > 0 && (
        <div
          ref={resultsRef}
          className="mt-2 flex flex-col gap-0.5 max-h-[300px] overflow-y-auto"
        >
          <p className="text-[9px] text-muted/60 px-1 mb-1">
            {results.length} result{results.length !== 1 ? "s" : ""}
          </p>
          {results.map((result, idx) => (
            <DraggableSearchResultItem
              key={result.item.id}
              getLabelMatch={getLabelMatch}
              idx={idx}
              result={result}
              selectedIndex={selectedIndex}
              onMouseEnter={setSelectedIndex}
              onSelect={handleSelectResult}
            />
          ))}
        </div>
      )}

      {/* Empty state */}
      {query.trim() && results.length === 0 && isFocused && (
        <div className="mt-2 rounded-lg bg-[#F8F8FA] dark:bg-surface p-3 text-center">
          <p className="text-[11px] text-muted">No results for &ldquo;{query}&rdquo;</p>
          <p className="text-[9px] text-muted/50 mt-1">
            Try a different search term
          </p>
        </div>
      )}

      {/* Search History Dropdown */}
      {showHistory && !query.trim() && history.length > 0 && isFocused && (
        <div className="mt-2 rounded-lg border border-separator/40 bg-white dark:bg-surface overflow-hidden">
          <div className="flex items-center justify-between px-3 py-1.5 border-b border-separator/30">
            <span className="text-[10px] font-medium text-muted">Recent searches</span>
            <button
              className="text-[9px] text-muted hover:text-foreground"
              onClick={() => {
                searchEngine.clearHistory();
                setShowHistory(false);
              }}
            >
              Clear
            </button>
          </div>
          {history.map((entry, idx) => (
            <button
              key={`${entry.query}-${idx}`}
              className="flex items-center gap-2 w-full px-3 py-2 text-left hover:bg-[#F8F8FA] dark:hover:bg-[#1a1a2e] transition-colors"
              onClick={() => handleHistoryClick(entry.query)}
            >
              <Clock size={12} className="text-muted/50 shrink-0" />
              <span className="text-[11px] text-foreground truncate flex-1">
                {entry.query}
              </span>
              <span className="text-[9px] text-muted/50">
                {entry.resultCount} result{entry.resultCount !== 1 ? "s" : ""}
              </span>
            </button>
          ))}
        </div>
      )}
    </div>
  );
}
