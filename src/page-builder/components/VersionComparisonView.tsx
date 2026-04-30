import { useState } from "react";
import { Button, Chip } from "@heroui/react";
import { ArrowLeft, ArrowRight, RotateCcw, X } from "lucide-react";

import type { VersionSnapshot, VersionDiff, PropertyDiff } from "../version-history";
import type { BlockInstance } from "../types";

interface VersionComparisonViewProps {
  versionA: VersionSnapshot;
  versionB: VersionSnapshot;
  diff: VersionDiff;
  onRestore: (version: VersionSnapshot) => void;
  onClose: () => void;
}

export function VersionComparisonView({
  versionA,
  versionB,
  diff,
  onRestore,
  onClose,
}: VersionComparisonViewProps) {
  // Collect all changes for navigation
  const allChanges: Array<{ type: "added" | "removed" | "modified"; label: string; index: number }> = [];
  diff.blocks.added.forEach((b, i) => allChanges.push({ type: "added", label: `Block added: ${b.type}`, index: i }));
  diff.blocks.removed.forEach((b, i) => allChanges.push({ type: "removed", label: `Block removed: ${b.type}`, index: i }));
  diff.blocks.modified.forEach((m, i) => allChanges.push({ type: "modified", label: `Block modified: ${m.after.type}`, index: i }));

  const [currentChangeIndex, setCurrentChangeIndex] = useState(0);

  const navigateNext = () => {
    setCurrentChangeIndex((i) => Math.min(i + 1, allChanges.length - 1));
  };

  const navigatePrev = () => {
    setCurrentChangeIndex((i) => Math.max(i - 1, 0));
  };

  return (
    <div className="flex flex-col h-full bg-background">
      {/* Header */}
      <div className="flex items-center justify-between px-4 py-3 border-b border-separator/30 bg-surface/50">
        <div className="flex items-center gap-3">
          <span className="text-[13px] font-semibold text-foreground">
            Version Comparison
          </span>
          <Chip size="sm" variant="soft">
            {diff.similarityPercentage}% similar
          </Chip>
        </div>
        <div className="flex items-center gap-2">
          {/* Navigation controls */}
          {allChanges.length > 0 && (
            <div className="flex items-center gap-1 mr-2">
              <Button
                size="sm"
                variant="ghost"
                isDisabled={currentChangeIndex === 0}
                onPress={navigatePrev}
              >
                <ArrowLeft size={14} />
              </Button>
              <span className="text-[11px] text-muted min-w-[60px] text-center">
                {currentChangeIndex + 1} / {allChanges.length}
              </span>
              <Button
                size="sm"
                variant="ghost"
                isDisabled={currentChangeIndex >= allChanges.length - 1}
                onPress={navigateNext}
              >
                <ArrowRight size={14} />
              </Button>
            </div>
          )}
          <Button size="sm" variant="ghost" onPress={onClose}>
            <X size={14} />
          </Button>
        </div>
      </div>

      {/* Side-by-side layout */}
      <div className="flex-1 overflow-y-auto">
        <div className="grid grid-cols-2 gap-0 min-h-0">
          {/* Version A (older) */}
          <div className="border-r border-separator/30">
            <div className="sticky top-0 z-10 flex items-center justify-between px-4 py-2 bg-surface/80 backdrop-blur-sm border-b border-separator/30">
              <div>
                <p className="text-[11px] font-semibold text-foreground">
                  Version A (Older)
                </p>
                <p className="text-[10px] text-muted">
                  {new Date(versionA.timestamp).toLocaleString()}
                </p>
              </div>
              <Button
                size="sm"
                variant="secondary"
                onPress={() => onRestore(versionA)}
              >
                <RotateCcw size={12} />
                Restore
              </Button>
            </div>
            <div className="p-4">
              <BlockList
                blocks={versionA.blocks}
                addedIds={new Set()}
                removedIds={new Set(diff.blocks.removed.map((b) => b.id))}
                modifiedIds={new Set(diff.blocks.modified.map((m) => m.before.id))}
              />
            </div>
          </div>

          {/* Version B (newer) */}
          <div>
            <div className="sticky top-0 z-10 flex items-center justify-between px-4 py-2 bg-surface/80 backdrop-blur-sm border-b border-separator/30">
              <div>
                <p className="text-[11px] font-semibold text-foreground">
                  Version B (Newer)
                </p>
                <p className="text-[10px] text-muted">
                  {new Date(versionB.timestamp).toLocaleString()}
                </p>
              </div>
              <Button
                size="sm"
                variant="secondary"
                onPress={() => onRestore(versionB)}
              >
                <RotateCcw size={12} />
                Restore
              </Button>
            </div>
            <div className="p-4">
              <BlockList
                blocks={versionB.blocks}
                addedIds={new Set(diff.blocks.added.map((b) => b.id))}
                removedIds={new Set()}
                modifiedIds={new Set(diff.blocks.modified.map((m) => m.after.id))}
              />
            </div>
          </div>
        </div>

        {/* Property diffs for modified blocks */}
        {diff.blocks.modified.length > 0 && (
          <div className="border-t border-separator/30 px-4 py-3">
            <p className="text-[12px] font-semibold text-foreground mb-2">
              Property Changes
            </p>
            {diff.blocks.modified.map((mod) => (
              <div key={mod.after.id} className="mb-3">
                <p className="text-[11px] font-medium text-foreground mb-1">
                  {mod.after.type} ({mod.after.id.slice(0, 8)})
                </p>
                <PropertyDiffList changes={mod.changes} />
              </div>
            ))}
          </div>
        )}

        {/* Settings diff */}
        {diff.settings.length > 0 && (
          <div className="border-t border-separator/30 px-4 py-3">
            <p className="text-[12px] font-semibold text-foreground mb-2">
              Settings Changes
            </p>
            <PropertyDiffList changes={diff.settings} />
          </div>
        )}

        {/* Design diff */}
        {diff.design.length > 0 && (
          <div className="border-t border-separator/30 px-4 py-3">
            <p className="text-[12px] font-semibold text-foreground mb-2">
              Design Changes
            </p>
            <PropertyDiffList changes={diff.design} />
          </div>
        )}
      </div>
    </div>
  );
}

/** Renders a list of blocks with color-coded change indicators */
function BlockList({
  blocks,
  addedIds,
  removedIds,
  modifiedIds,
}: {
  blocks: BlockInstance[];
  addedIds: Set<string>;
  removedIds: Set<string>;
  modifiedIds: Set<string>;
}) {
  return (
    <div className="flex flex-col gap-1">
      {blocks.map((block) => {
        let bgClass = "";
        let label = "";
        if (addedIds.has(block.id)) {
          bgClass = "bg-green-50 dark:bg-green-900/20 border-l-2 border-l-green-500";
          label = "Added";
        } else if (removedIds.has(block.id)) {
          bgClass = "bg-red-50 dark:bg-red-900/20 border-l-2 border-l-red-500";
          label = "Removed";
        } else if (modifiedIds.has(block.id)) {
          bgClass = "bg-yellow-50 dark:bg-yellow-900/20 border-l-2 border-l-yellow-500";
          label = "Modified";
        }

        return (
          <div
            key={block.id}
            className={`flex items-center justify-between px-3 py-2 rounded-lg text-[11px] ${bgClass || "bg-surface/30"}`}
          >
            <span className="font-medium text-foreground">{block.type}</span>
            {label && (
              <span
                className={`text-[9px] font-bold uppercase ${
                  label === "Added"
                    ? "text-green-600"
                    : label === "Removed"
                      ? "text-red-600"
                      : "text-yellow-600"
                }`}
              >
                {label}
              </span>
            )}
          </div>
        );
      })}
    </div>
  );
}

/** Renders a list of property-level diffs */
function PropertyDiffList({ changes }: { changes: PropertyDiff[] }) {
  return (
    <div className="flex flex-col gap-1">
      {changes.map((change, i) => (
        <div
          key={`${change.path}-${i}`}
          className={`flex items-start gap-2 px-3 py-1.5 rounded text-[10px] ${
            change.type === "added"
              ? "bg-green-50 dark:bg-green-900/20"
              : change.type === "removed"
                ? "bg-red-50 dark:bg-red-900/20"
                : "bg-yellow-50 dark:bg-yellow-900/20"
          }`}
        >
          <span className="font-mono font-medium text-foreground shrink-0">
            {change.path}
          </span>
          <span className="text-muted truncate">
            {change.type === "added" && (
              <span className="text-green-600">
                + {JSON.stringify(change.newValue)}
              </span>
            )}
            {change.type === "removed" && (
              <span className="text-red-600">
                - {JSON.stringify(change.oldValue)}
              </span>
            )}
            {change.type === "modified" && (
              <>
                <span className="text-red-600">
                  {JSON.stringify(change.oldValue)}
                </span>
                {" → "}
                <span className="text-green-600">
                  {JSON.stringify(change.newValue)}
                </span>
              </>
            )}
          </span>
        </div>
      ))}
    </div>
  );
}
