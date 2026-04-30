import { useState, useEffect, useCallback } from "react";
import { useParams, Link } from "react-router-dom";
import { Button, Select, Label, ListBox } from "@heroui/react";
import { ArrowLeft, GitCompare } from "lucide-react";

import { ProjectStorage } from "../page-builder/project-storage";
import { VersionManager } from "../page-builder/version-history";
import type { VersionSnapshot, VersionDiff } from "../page-builder/version-history";
import type { Page } from "../page-builder/pages";
import { HistoryTimeline } from "../page-builder/components/HistoryTimeline";
import { VersionComparisonView } from "../page-builder/components/VersionComparisonView";

export default function WebsiteHistory() {
  const { id } = useParams<{ id: string }>();
  const [pages, setPages] = useState<Page[]>([]);
  const [versions, setVersions] = useState<VersionSnapshot[]>([]);
  const [pageFilter, setPageFilter] = useState<string | null>(null);
  const [compareSelection, setCompareSelection] = useState<string[]>([]);
  const [showComparison, setShowComparison] = useState(false);
  const [comparisonData, setComparisonData] = useState<{
    versionA: VersionSnapshot;
    versionB: VersionSnapshot;
    diff: VersionDiff;
  } | null>(null);
  const [restoreConfirm, setRestoreConfirm] = useState<VersionSnapshot | null>(null);
  const [error, setError] = useState<string | null>(null);

  const project = id ? ProjectStorage.getProject(id) : null;

  // Load versions
  const loadVersions = useCallback(() => {
    if (!id) return;
    const pagesState = ProjectStorage.loadProjectPages(id);
    setPages(pagesState.pages);

    const versionManager = new VersionManager();
    const allVersions: VersionSnapshot[] = [];

    for (const page of pagesState.pages) {
      const pageVersions = versionManager.getVersions(page.id);
      allVersions.push(...pageVersions);
    }

    // Sort newest-first
    allVersions.sort(
      (a, b) => new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime(),
    );

    setVersions(allVersions);
  }, [id]);

  useEffect(() => {
    loadVersions();
  }, [loadVersions]);

  // Not found
  if (!project) {
    return (
      <div className="flex flex-col items-center justify-center min-h-screen gap-4">
        <p className="text-lg text-foreground">Project not found</p>
        <Link
          to="/projects"
          className="text-sm text-accent hover:underline flex items-center gap-1"
        >
          <ArrowLeft size={14} />
          Back to Projects
        </Link>
      </div>
    );
  }

  // Filter versions by page
  const filteredVersions = pageFilter
    ? versions.filter((v) => v.pageId === pageFilter)
    : versions;

  const handleToggleCompare = (versionId: string) => {
    setCompareSelection((prev) => {
      if (prev.includes(versionId)) {
        return prev.filter((id) => id !== versionId);
      }
      if (prev.length >= 2) {
        // Replace the oldest selection
        return [prev[1], versionId];
      }
      return [...prev, versionId];
    });
  };

  const handleCompare = () => {
    if (compareSelection.length !== 2) return;

    const versionA = versions.find((v) => v.id === compareSelection[0]);
    const versionB = versions.find((v) => v.id === compareSelection[1]);

    if (!versionA || !versionB) return;

    // Both versions must be from the same page for comparison
    if (versionA.pageId !== versionB.pageId) {
      setError("Can only compare versions from the same page");
      return;
    }

    const versionManager = new VersionManager();
    const diff = versionManager.compareVersions(
      versionA.pageId,
      versionA.id,
      versionB.id,
    );

    if (!diff) {
      setError("Unable to compare versions");
      return;
    }

    setComparisonData({ versionA, versionB, diff });
    setShowComparison(true);
    setError(null);
  };

  const handleRestore = (version: VersionSnapshot) => {
    setRestoreConfirm(version);
  };

  const confirmRestore = async () => {
    if (!restoreConfirm) return;

    const versionManager = new VersionManager();
    const page = pages.find((p) => p.id === restoreConfirm.pageId);
    if (!page) {
      setError("Page not found for this version");
      setRestoreConfirm(null);
      return;
    }

    const result = await versionManager.restoreVersion(
      restoreConfirm.pageId,
      restoreConfirm.id,
      page.blocks,
      page.design,
      page.settings,
    );

    if (!result) {
      setError("Unable to restore — version not found.");
      setRestoreConfirm(null);
      return;
    }

    // Update the page in project storage
    if (id) {
      const pagesState = ProjectStorage.loadProjectPages(id);
      const updatedPages = pagesState.pages.map((p) =>
        p.id === restoreConfirm.pageId
          ? { ...p, blocks: result.blocks, design: result.design, settings: result.settings }
          : p,
      );
      ProjectStorage.saveProjectPages(id, {
        ...pagesState,
        pages: updatedPages,
      });
    }

    setRestoreConfirm(null);
    setError(null);
    loadVersions();
  };

  // Show comparison view
  if (showComparison && comparisonData) {
    return (
      <div className="h-screen flex flex-col">
        <VersionComparisonView
          versionA={comparisonData.versionA}
          versionB={comparisonData.versionB}
          diff={comparisonData.diff}
          onRestore={(version) => {
            setShowComparison(false);
            handleRestore(version);
          }}
          onClose={() => {
            setShowComparison(false);
            setComparisonData(null);
          }}
        />
      </div>
    );
  }

  return (
    <div className="max-w-4xl mx-auto px-6 py-8">
      {/* Breadcrumb / back link */}
      <Link
        to="/projects"
        className="inline-flex items-center gap-1.5 text-sm text-muted hover:text-foreground mb-6"
      >
        <ArrowLeft size={14} />
        Back to Projects
      </Link>

      {/* Header */}
      <div className="mb-6">
        <h1 className="text-2xl font-semibold text-foreground">
          {project.name} — History
        </h1>
        <p className="text-sm text-muted mt-1">
          Browse and restore previous versions across all pages
        </p>
      </div>

      {/* Controls */}
      <div className="flex items-center gap-4 mb-6 flex-wrap">
        {/* Page filter */}
        <Select
          className="w-[200px]"
          placeholder="All pages"
          value={pageFilter ?? "__all__"}
          onChange={(value) => setPageFilter(value === "__all__" ? null : (value as string))}
        >
          <Label className="sr-only">Filter by page</Label>
          <Select.Trigger>
            <Select.Value />
            <Select.Indicator />
          </Select.Trigger>
          <Select.Popover>
            <ListBox>
              <ListBox.Item id="__all__" textValue="All pages">
                All pages
                <ListBox.ItemIndicator />
              </ListBox.Item>
              {pages.map((page) => (
                <ListBox.Item key={page.id} id={page.id} textValue={page.settings.title}>
                  {page.settings.title}
                  <ListBox.ItemIndicator />
                </ListBox.Item>
              ))}
            </ListBox>
          </Select.Popover>
        </Select>

        {/* Compare button */}
        {compareSelection.length === 2 && (
          <Button size="sm" variant="primary" onPress={handleCompare}>
            <GitCompare size={14} />
            Compare Selected
          </Button>
        )}

        {compareSelection.length > 0 && compareSelection.length < 2 && (
          <span className="text-[11px] text-muted">
            Select one more version to compare
          </span>
        )}
      </div>

      {/* Error message */}
      {error && (
        <div className="mb-4 px-4 py-2 rounded-lg bg-danger/10 text-danger text-sm">
          {error}
        </div>
      )}

      {/* Timeline */}
      <HistoryTimeline
        versions={filteredVersions}
        pages={pages}
        compareSelection={compareSelection}
        onToggleCompare={handleToggleCompare}
        onRestore={handleRestore}
      />

      {/* Restore confirmation dialog */}
      {restoreConfirm && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40">
          <div className="bg-background rounded-xl shadow-xl p-6 max-w-sm w-full mx-4">
            <h3 className="text-base font-semibold text-foreground mb-2">
              Restore Version?
            </h3>
            <p className="text-sm text-muted mb-4">
              This will restore the page to this version. A snapshot of the
              current state will be saved before restoring.
            </p>
            <div className="flex items-center gap-2 justify-end">
              <Button
                size="sm"
                variant="tertiary"
                onPress={() => setRestoreConfirm(null)}
              >
                Cancel
              </Button>
              <Button size="sm" variant="primary" onPress={confirmRestore}>
                Restore
              </Button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
