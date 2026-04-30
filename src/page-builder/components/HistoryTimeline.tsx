import { Button, Checkbox, Chip } from "@heroui/react";
import { RotateCcw, GitBranch, Tag } from "lucide-react";

import type { VersionSnapshot } from "../version-history";
import type { Page } from "../pages";
import { formatRelativeTime } from "../utils/format-time";

interface HistoryTimelineProps {
  versions: VersionSnapshot[];
  pages: Page[];
  compareSelection: string[];
  onToggleCompare: (versionId: string) => void;
  onRestore: (version: VersionSnapshot) => void;
}

export function HistoryTimeline({
  versions,
  pages,
  compareSelection,
  onToggleCompare,
  onRestore,
}: HistoryTimelineProps) {
  const getPageTitle = (pageId: string): string => {
    const page = pages.find((p) => p.id === pageId);
    return page?.settings.title || "Unknown Page";
  };

  if (versions.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center py-12 text-center">
        <GitBranch size={32} className="text-muted mb-3" />
        <p className="text-sm text-muted">No version history yet</p>
      </div>
    );
  }

  return (
    <div className="relative">
      {/* Vertical timeline line */}
      <div className="absolute left-4 top-0 bottom-0 w-0.5 bg-separator/40" />

      <div className="flex flex-col gap-0">
        {versions.map((version) => {
          const isSelected = compareSelection.includes(version.id);

          return (
            <div key={version.id} className="relative pl-10 py-3">
              {/* Timeline dot */}
              <div
                className={`absolute left-[11px] top-5 w-2.5 h-2.5 rounded-full border-2 ${
                  isSelected
                    ? "bg-accent border-accent"
                    : "bg-background border-muted"
                }`}
              />

              <div className="flex flex-col gap-1.5">
                {/* Header: page title + timestamp */}
                <div className="flex items-center justify-between gap-2">
                  <span className="text-[13px] font-medium text-foreground">
                    {getPageTitle(version.pageId)}
                  </span>
                  <span className="text-[11px] text-muted shrink-0">
                    {formatRelativeTime(version.timestamp)}
                  </span>
                </div>

                {/* Change summary */}
                <p className="text-[12px] text-muted">
                  {version.changeSummary.description}
                </p>

                {/* Restored indicator */}
                {version.parentVersionId && (
                  <div className="flex items-center gap-1.5 text-[11px] text-accent">
                    <RotateCcw size={12} />
                    <span>Restored from previous version</span>
                  </div>
                )}

                {/* Tags */}
                {version.tags.length > 0 && (
                  <div className="flex items-center gap-1.5 flex-wrap">
                    <Tag size={12} className="text-muted" />
                    {version.tags.map((tag) => (
                      <Chip key={tag.id} size="sm" variant="soft">
                        {tag.label}
                      </Chip>
                    ))}
                  </div>
                )}

                {/* Actions */}
                <div className="flex items-center gap-2 mt-1">
                  <Button
                    size="sm"
                    variant="tertiary"
                    onPress={() => onRestore(version)}
                    aria-label="Restore this version"
                  >
                    <RotateCcw size={12} />
                    Restore
                  </Button>

                  <Checkbox
                    isSelected={isSelected}
                    onChange={() => onToggleCompare(version.id)}
                    aria-label="Select for comparison"
                  >
                    <Checkbox.Control>
                      <Checkbox.Indicator />
                    </Checkbox.Control>
                    <Checkbox.Content>
                      <span className="text-[11px] text-muted">Compare</span>
                    </Checkbox.Content>
                  </Checkbox>
                </div>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}
