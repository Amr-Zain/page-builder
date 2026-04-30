import { useState, useMemo } from "react";
import { Button, Chip, Input } from "@heroui/react";
import { Clock, Tag, GitCompare, Download, RotateCcw } from "lucide-react";

import type { VersionSnapshot } from "../version-history";
import { VersionManager } from "../version-history";

interface VersionHistoryPanelProps {
  pageId: string;
  onRestore: (version: VersionSnapshot) => void;
  onCompare: (versionA: VersionSnapshot, versionB: VersionSnapshot) => void;
}

export function VersionHistoryPanel({
  pageId,
  onRestore,
  onCompare,
}: VersionHistoryPanelProps) {
  const [manager] = useState(() => new VersionManager());
  const [versions, setVersions] = useState<VersionSnapshot[]>(() =>
    manager.getVersions(pageId),
  );
  const [tagFilter, setTagFilter] = useState<string>("");
  const [tagInput, setTagInput] = useState<{ versionId: string; value: string } | null>(null);
  const [compareSelection, setCompareSelection] = useState<string[]>([]);

  // Refresh versions from storage
  const refreshVersions = () => {
    setVersions(manager.getVersions(pageId));
  };

  // Filter versions by tag
  const filteredVersions = useMemo(() => {
    if (!tagFilter.trim()) return versions;
    const filter = tagFilter.toLowerCase();
    return versions.filter((v) =>
      v.tags.some((t) => t.label.toLowerCase().includes(filter)),
    );
  }, [versions, tagFilter]);

  // Handle adding a tag
  const handleAddTag = (versionId: string) => {
    if (!tagInput || tagInput.versionId !== versionId || !tagInput.value.trim()) return;
    manager.addTag(pageId, versionId, tagInput.value.trim());
    setTagInput(null);
    refreshVersions();
  };

  // Handle removing a tag
  const handleRemoveTag = (versionId: string, tagId: string) => {
    manager.removeTag(pageId, versionId, tagId);
    refreshVersions();
  };

  // Handle compare selection
  const handleToggleCompare = (versionId: string) => {
    setCompareSelection((prev) => {
      if (prev.includes(versionId)) {
        return prev.filter((id) => id !== versionId);
      }
      if (prev.length >= 2) {
        return [prev[1], versionId];
      }
      return [...prev, versionId];
    });
  };

  // Execute comparison
  const handleCompare = () => {
    if (compareSelection.length !== 2) return;
    const vA = versions.find((v) => v.id === compareSelection[0]);
    const vB = versions.find((v) => v.id === compareSelection[1]);
    if (vA && vB) {
      onCompare(vA, vB);
    }
  };

  // Export a single version
  const handleExport = (versionId: string) => {
    const json = manager.exportVersion(pageId, versionId);
    if (!json) return;
    const blob = new Blob([json], { type: "application/json" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `version-${versionId}.json`;
    a.click();
    URL.revokeObjectURL(url);
  };

  return (
    <div className="flex flex-col h-full">
      {/* Header */}
      <div className="flex items-center justify-between px-4 py-3 border-b border-separator/30">
        <div className="flex items-center gap-2">
          <Clock size={16} className="text-muted" />
          <span className="text-[13px] font-semibold text-foreground">
            Version History
          </span>
          <span className="text-[11px] text-muted">({versions.length})</span>
        </div>
        {compareSelection.length === 2 && (
          <Button size="sm" variant="secondary" onPress={handleCompare}>
            <GitCompare size={14} />
            Compare
          </Button>
        )}
      </div>

      {/* Tag filter */}
      <div className="px-4 py-2 border-b border-separator/30">
        <Input
          placeholder="Filter by tag..."
          className="text-sm"
          value={tagFilter}
          onChange={(e) => setTagFilter(e.target.value)}
        />
      </div>

      {/* Version list */}
      <div className="flex-1 overflow-y-auto">
        {filteredVersions.length === 0 ? (
          <div className="flex items-center justify-center h-32 text-[12px] text-muted">
            No versions found
          </div>
        ) : (
          <div className="flex flex-col">
            {filteredVersions.map((version) => {
              const isSelected = compareSelection.includes(version.id);
              return (
                <div
                  key={version.id}
                  className={`px-4 py-3 border-b border-separator/20 hover:bg-surface/50 transition-colors ${
                    isSelected ? "bg-[#634CF8]/5 border-l-2 border-l-[#634CF8]" : ""
                  }`}
                >
                  {/* Timestamp and summary */}
                  <div className="flex items-start justify-between gap-2">
                    <div className="min-w-0 flex-1">
                      <p className="text-[12px] font-medium text-foreground truncate">
                        {version.changeSummary.description}
                      </p>
                      <p className="text-[10px] text-muted mt-0.5">
                        {new Date(version.timestamp).toLocaleString()}
                      </p>
                    </div>
                    <input
                      type="checkbox"
                      checked={isSelected}
                      onChange={() => handleToggleCompare(version.id)}
                      className="mt-1 shrink-0"
                      title="Select for comparison"
                    />
                  </div>

                  {/* Tags */}
                  {version.tags.length > 0 && (
                    <div className="flex flex-wrap gap-1 mt-2">
                      {version.tags.map((tag) => (
                        <span key={tag.id} className="inline-flex items-center gap-0.5">
                          <Chip
                            size="sm"
                            variant="soft"
                          >
                            {tag.label}
                          </Chip>
                          <button
                            className="text-[10px] text-muted hover:text-danger ml-0.5"
                            onClick={() => handleRemoveTag(version.id, tag.id)}
                            title="Remove tag"
                          >
                            ×
                          </button>
                        </span>
                      ))}
                    </div>
                  )}

                  {/* Tag input */}
                  {tagInput?.versionId === version.id ? (
                    <div className="flex gap-1 mt-2">
                      <input
                        autoFocus
                        className="flex-1 h-7 rounded border border-separator/50 bg-white dark:bg-surface px-2 text-[11px] outline-none focus:border-[#634CF8]"
                        placeholder="Tag label (max 50 chars)"
                        maxLength={50}
                        value={tagInput.value}
                        onChange={(e) =>
                          setTagInput({ ...tagInput, value: e.target.value })
                        }
                        onKeyDown={(e) => {
                          if (e.key === "Enter") handleAddTag(version.id);
                          if (e.key === "Escape") setTagInput(null);
                        }}
                      />
                      <Button
                        size="sm"
                        variant="secondary"
                        onPress={() => handleAddTag(version.id)}
                      >
                        Add
                      </Button>
                    </div>
                  ) : null}

                  {/* Actions */}
                  <div className="flex items-center gap-1 mt-2">
                    <button
                      className="text-[10px] text-muted hover:text-foreground px-1.5 py-0.5 rounded hover:bg-surface transition-colors flex items-center gap-1"
                      onClick={() => onRestore(version)}
                      title="Restore this version"
                    >
                      <RotateCcw size={10} />
                      Restore
                    </button>
                    <button
                      className="text-[10px] text-muted hover:text-foreground px-1.5 py-0.5 rounded hover:bg-surface transition-colors flex items-center gap-1"
                      onClick={() =>
                        setTagInput({ versionId: version.id, value: "" })
                      }
                      title="Add tag"
                    >
                      <Tag size={10} />
                      Tag
                    </button>
                    <button
                      className="text-[10px] text-muted hover:text-foreground px-1.5 py-0.5 rounded hover:bg-surface transition-colors flex items-center gap-1"
                      onClick={() => handleExport(version.id)}
                      title="Export version"
                    >
                      <Download size={10} />
                      Export
                    </button>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
}
