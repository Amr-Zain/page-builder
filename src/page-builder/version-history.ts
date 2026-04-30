import type { BlockInstance, DesignSettings } from "./types";
import type { PageSettings } from "./pages";

// ── Version History Interfaces ──

export interface VersionTag {
  id: string;
  label: string;
  color?: string;
  createdAt: string;
}

export interface VersionChangeSummary {
  blocksAdded: number;
  blocksRemoved: number;
  blocksModified: number;
  settingsChanged: boolean;
  designChanged: boolean;
  description: string;
}

export interface VersionSnapshot {
  id: string;
  pageId: string;
  timestamp: string;
  contentHash: string;
  blocks: BlockInstance[];
  design: DesignSettings;
  settings: PageSettings;
  tags: VersionTag[];
  parentVersionId: string | null;
  changeSummary: VersionChangeSummary;
}

export interface PropertyDiff {
  path: string;
  oldValue: unknown;
  newValue: unknown;
  type: "added" | "removed" | "modified";
}

export interface VersionDiff {
  blocks: {
    added: BlockInstance[];
    removed: BlockInstance[];
    modified: {
      before: BlockInstance;
      after: BlockInstance;
      changes: PropertyDiff[];
    }[];
  };
  settings: PropertyDiff[];
  design: PropertyDiff[];
  similarityPercentage: number;
}


// ── Version History Storage Shape ──

interface VersionHistoryStorage {
  versions: VersionSnapshot[];
  maxVersions: number;
}

// ── Version Manager ──

export class VersionManager {
  private readonly MAX_VERSIONS = 50;
  private readonly STORAGE_KEY_PREFIX = "page-builder-versions-";

  /**
   * Create a new version snapshot for the given page.
   */
  async createVersion(
    pageId: string,
    blocks: BlockInstance[],
    design: DesignSettings,
    settings: PageSettings,
    parentVersionId: string | null = null,
  ): Promise<VersionSnapshot> {
    const versions = this.getVersions(pageId);
    const previousVersion = versions.length > 0 ? versions[0] : null;

    const contentHash = await this.calculateContentHash(blocks, design);

    const snapshot: VersionSnapshot = {
      id: `v-${Date.now()}-${Math.random().toString(36).slice(2, 8)}`,
      pageId,
      timestamp: new Date().toISOString(),
      contentHash,
      blocks: structuredClone(blocks),
      design: structuredClone(design),
      settings: structuredClone(settings),
      tags: [],
      parentVersionId,
      changeSummary: this.generateChangeSummary(previousVersion, blocks, design, settings),
    };

    versions.unshift(snapshot);
    this.saveVersions(pageId, versions);

    return snapshot;
  }

  /**
   * Get all versions for a page, sorted by timestamp (newest first).
   */
  getVersions(pageId: string): VersionSnapshot[] {
    try {
      const key = this.getStorageKey(pageId);
      const raw = localStorage.getItem(key);
      if (!raw) return [];

      const storage: VersionHistoryStorage = JSON.parse(raw);
      // Ensure sorted newest first
      return storage.versions.sort(
        (a, b) => new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime(),
      );
    } catch {
      return [];
    }
  }

  /**
   * Restore a version by ID. Creates a new version snapshot before restoring
   * to preserve history, then returns the restored state.
   */
  async restoreVersion(
    pageId: string,
    versionId: string,
    currentBlocks: BlockInstance[],
    currentDesign: DesignSettings,
    currentSettings: PageSettings,
  ): Promise<{ blocks: BlockInstance[]; design: DesignSettings; settings: PageSettings } | null> {
    const versions = this.getVersions(pageId);
    const targetVersion = versions.find((v) => v.id === versionId);

    if (!targetVersion) return null;

    // Create a snapshot of the current state before restoring (to preserve history)
    await this.createVersion(
      pageId,
      currentBlocks,
      currentDesign,
      currentSettings,
      null,
    );

    // Create a new version representing the restoration with lineage
    await this.createVersion(
      pageId,
      targetVersion.blocks,
      targetVersion.design,
      targetVersion.settings,
      versionId,
    );

    return {
      blocks: structuredClone(targetVersion.blocks),
      design: structuredClone(targetVersion.design),
      settings: structuredClone(targetVersion.settings),
    };
  }

  // ── Version Comparison ──

  /**
   * Compare two versions and produce a detailed diff.
   * Returns null if either version is not found.
   */
  compareVersions(pageId: string, versionIdA: string, versionIdB: string): VersionDiff | null {
    const versions = this.getVersions(pageId);
    const versionA = versions.find((v) => v.id === versionIdA);
    const versionB = versions.find((v) => v.id === versionIdB);

    if (!versionA || !versionB) return null;

    // Blocks comparison: match by block ID
    const blockIdsA = new Set(versionA.blocks.map((b) => b.id));
    const blockIdsB = new Set(versionB.blocks.map((b) => b.id));

    const added: BlockInstance[] = versionB.blocks.filter((b) => !blockIdsA.has(b.id));
    const removed: BlockInstance[] = versionA.blocks.filter((b) => !blockIdsB.has(b.id));

    const modified: VersionDiff["blocks"]["modified"] = [];
    for (const blockB of versionB.blocks) {
      if (blockIdsA.has(blockB.id)) {
        const blockA = versionA.blocks.find((b) => b.id === blockB.id)!;
        if (JSON.stringify(blockA) !== JSON.stringify(blockB)) {
          const changes = this.diffObjects(
            blockA.props as Record<string, unknown>,
            blockB.props as Record<string, unknown>,
            "props",
          );
          // Also diff children if present
          if (blockA.children || blockB.children) {
            const childDiffs = this.diffObjects(
              (blockA.children ?? {}) as Record<string, unknown>,
              (blockB.children ?? {}) as Record<string, unknown>,
              "children",
            );
            changes.push(...childDiffs);
          }
          modified.push({ before: blockA, after: blockB, changes });
        }
      }
    }

    // Settings comparison
    const settings = this.diffObjects(
      versionA.settings as unknown as Record<string, unknown>,
      versionB.settings as unknown as Record<string, unknown>,
      "",
    );

    // Design comparison
    const design = this.diffObjects(
      versionA.design as unknown as Record<string, unknown>,
      versionB.design as unknown as Record<string, unknown>,
      "",
    );

    // Similarity percentage: (unchanged properties / total properties) * 100
    const similarityPercentage = this.calculateSimilarity(versionA, versionB);

    return {
      blocks: { added, removed, modified },
      settings,
      design,
      similarityPercentage,
    };
  }

  // ── Tag Management ──

  /**
   * Add a tag to a specific version.
   * Returns the created tag, or null if the version is not found or the label is invalid.
   */
  addTag(pageId: string, versionId: string, label: string, color?: string): VersionTag | null {
    const trimmedLabel = label.trim();

    // Validate tag label: must be non-empty and max 50 characters
    if (trimmedLabel.length === 0 || trimmedLabel.length > 50) {
      return null;
    }

    const versions = this.getVersions(pageId);
    const version = versions.find((v) => v.id === versionId);

    if (!version) return null;

    const tag: VersionTag = {
      id: `tag-${Date.now()}-${Math.random().toString(36).slice(2, 8)}`,
      label: trimmedLabel,
      color,
      createdAt: new Date().toISOString(),
    };

    version.tags.push(tag);
    this.saveVersions(pageId, versions);

    return tag;
  }

  /**
   * Remove a tag from a version.
   * Returns false if the version or tag is not found.
   */
  removeTag(pageId: string, versionId: string, tagId: string): boolean {
    const versions = this.getVersions(pageId);
    const version = versions.find((v) => v.id === versionId);

    if (!version) return false;

    const tagIndex = version.tags.findIndex((t) => t.id === tagId);
    if (tagIndex === -1) return false;

    version.tags.splice(tagIndex, 1);
    this.saveVersions(pageId, versions);

    return true;
  }

  /**
   * Get all versions for a page that have at least one tag.
   */
  getTaggedVersions(pageId: string): VersionSnapshot[] {
    const versions = this.getVersions(pageId);
    return versions.filter((v) => v.tags.length > 0);
  }

  // ── Export Methods ──

  /**
   * Export a single version as a JSON string.
   * Includes all metadata, tags, and parent-child relationships.
   */
  exportVersion(pageId: string, versionId: string): string | null {
    const versions = this.getVersions(pageId);
    const version = versions.find((v) => v.id === versionId);
    if (!version) return null;
    return JSON.stringify(version, null, 2);
  }

  /**
   * Export all versions for a page as a JSON array string.
   * Includes all metadata, tags, and parent-child relationships.
   */
  exportAllVersions(pageId: string): string {
    const versions = this.getVersions(pageId);
    return JSON.stringify(versions, null, 2);
  }

  // ── Import Methods ──

  /**
   * Import a single version from a JSON string.
   * Validates the structure and deduplicates by content hash.
   * Returns the imported version, or null if invalid or duplicate.
   */
  importVersion(pageId: string, jsonData: string): VersionSnapshot | null {
    let parsed: unknown;
    try {
      parsed = JSON.parse(jsonData);
    } catch {
      return null;
    }

    if (!this.isValidVersionSnapshot(parsed)) return null;

    const version = parsed as VersionSnapshot;
    const versions = this.getVersions(pageId);

    // Content hash deduplication: skip if same hash already exists
    if (versions.some((v) => v.contentHash === version.contentHash)) {
      return null;
    }

    // Override pageId to match the target page
    version.pageId = pageId;
    versions.unshift(version);
    this.saveVersions(pageId, versions);

    return version;
  }

  /**
   * Import multiple versions from a JSON array string.
   * Validates each version and deduplicates by content hash.
   * Preserves tag associations.
   * Returns the array of successfully imported versions.
   */
  importVersionArchive(pageId: string, jsonData: string): VersionSnapshot[] {
    let parsed: unknown;
    try {
      parsed = JSON.parse(jsonData);
    } catch {
      return [];
    }

    if (!Array.isArray(parsed)) return [];

    const versions = this.getVersions(pageId);
    const existingHashes = new Set(versions.map((v) => v.contentHash));
    const imported: VersionSnapshot[] = [];

    for (const item of parsed) {
      if (!this.isValidVersionSnapshot(item)) continue;

      const version = item as VersionSnapshot;

      // Content hash deduplication
      if (existingHashes.has(version.contentHash)) continue;

      version.pageId = pageId;
      versions.unshift(version);
      existingHashes.add(version.contentHash);
      imported.push(version);
    }

    if (imported.length > 0) {
      this.saveVersions(pageId, versions);
    }

    return imported;
  }

  /**
   * Validate that a parsed object has the shape of a VersionSnapshot.
   */
  private isValidVersionSnapshot(obj: unknown): boolean {
    if (!obj || typeof obj !== "object") return false;
    const v = obj as Record<string, unknown>;
    return (
      typeof v.id === "string" &&
      typeof v.timestamp === "string" &&
      typeof v.contentHash === "string" &&
      Array.isArray(v.blocks) &&
      typeof v.design === "object" &&
      v.design !== null &&
      typeof v.settings === "object" &&
      v.settings !== null &&
      Array.isArray(v.tags)
    );
  }

  // ── Private Helpers ──

  /**
   * Calculate a SHA-256 content hash for deduplication.
   * Falls back to a simple string hash if crypto.subtle is unavailable.
   */
  private async calculateContentHash(
    blocks: BlockInstance[],
    design: DesignSettings,
  ): Promise<string> {
    const content = JSON.stringify({ blocks, design });

    if (typeof crypto !== "undefined" && crypto.subtle) {
      const encoder = new TextEncoder();
      const data = encoder.encode(content);
      const hashBuffer = await crypto.subtle.digest("SHA-256", data);
      const hashArray = Array.from(new Uint8Array(hashBuffer));
      return hashArray.map((b) => b.toString(16).padStart(2, "0")).join("");
    }

    // Fallback: simple hash for environments without crypto.subtle
    return this.simpleHash(content);
  }

  /**
   * Simple string hash fallback (djb2 algorithm).
   */
  private simpleHash(str: string): string {
    let hash = 5381;
    for (let i = 0; i < str.length; i++) {
      hash = (hash * 33) ^ str.charCodeAt(i);
    }
    return (hash >>> 0).toString(16).padStart(8, "0");
  }

  /**
   * Generate a change summary by comparing current state with the previous version.
   */
  private generateChangeSummary(
    previousVersion: VersionSnapshot | null,
    currentBlocks: BlockInstance[],
    currentDesign: DesignSettings,
    currentSettings: PageSettings,
  ): VersionChangeSummary {
    if (!previousVersion) {
      return {
        blocksAdded: currentBlocks.length,
        blocksRemoved: 0,
        blocksModified: 0,
        settingsChanged: false,
        designChanged: false,
        description: "Initial version",
      };
    }

    const prevBlockIds = new Set(previousVersion.blocks.map((b) => b.id));
    const currBlockIds = new Set(currentBlocks.map((b) => b.id));

    const blocksAdded = currentBlocks.filter((b) => !prevBlockIds.has(b.id)).length;
    const blocksRemoved = previousVersion.blocks.filter((b) => !currBlockIds.has(b.id)).length;

    // Count modified blocks (same ID but different content)
    let blocksModified = 0;
    for (const currBlock of currentBlocks) {
      if (prevBlockIds.has(currBlock.id)) {
        const prevBlock = previousVersion.blocks.find((b) => b.id === currBlock.id);
        if (prevBlock && JSON.stringify(prevBlock) !== JSON.stringify(currBlock)) {
          blocksModified++;
        }
      }
    }

    const designChanged =
      JSON.stringify(previousVersion.design) !== JSON.stringify(currentDesign);
    const settingsChanged =
      JSON.stringify(previousVersion.settings) !== JSON.stringify(currentSettings);

    // Build a human-readable description
    const parts: string[] = [];
    if (blocksAdded > 0) parts.push(`${blocksAdded} block${blocksAdded > 1 ? "s" : ""} added`);
    if (blocksRemoved > 0) parts.push(`${blocksRemoved} block${blocksRemoved > 1 ? "s" : ""} removed`);
    if (blocksModified > 0) parts.push(`${blocksModified} block${blocksModified > 1 ? "s" : ""} modified`);
    if (designChanged) parts.push("design changed");
    if (settingsChanged) parts.push("settings changed");

    const description = parts.length > 0 ? parts.join(", ") : "No changes";

    return {
      blocksAdded,
      blocksRemoved,
      blocksModified,
      settingsChanged,
      designChanged,
      description,
    };
  }

  /**
   * Save versions to localStorage, enforcing the max version limit.
   */
  private saveVersions(pageId: string, versions: VersionSnapshot[]): void {
    // Prune if over limit
    const pruned = this.pruneVersions(versions);

    const storage: VersionHistoryStorage = {
      versions: pruned,
      maxVersions: this.MAX_VERSIONS,
    };

    try {
      const key = this.getStorageKey(pageId);
      localStorage.setItem(key, JSON.stringify(storage));
    } catch {
      // Handle localStorage quota exceeded silently
    }
  }

  /**
   * Remove oldest untagged versions when over the limit.
   */
  private pruneVersions(versions: VersionSnapshot[]): VersionSnapshot[] {
    if (versions.length <= this.MAX_VERSIONS) return versions;

    // Sort newest first for consistent ordering
    const sorted = [...versions].sort(
      (a, b) => new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime(),
    );

    // Remove oldest untagged versions until within limit
    while (sorted.length > this.MAX_VERSIONS) {
      // Find the oldest untagged version (from the end)
      const oldestUntaggedIndex = this.findOldestUntaggedIndex(sorted);
      if (oldestUntaggedIndex === -1) {
        // All versions are tagged; remove the absolute oldest
        sorted.pop();
      } else {
        sorted.splice(oldestUntaggedIndex, 1);
      }
    }

    return sorted;
  }

  /**
   * Find the index of the oldest untagged version (searching from the end).
   */
  private findOldestUntaggedIndex(versions: VersionSnapshot[]): number {
    for (let i = versions.length - 1; i >= 0; i--) {
      if (versions[i].tags.length === 0) {
        return i;
      }
    }
    return -1;
  }

  /**
   * Recursively diff two objects, tracking the property path.
   * Returns an array of PropertyDiff entries for all differences.
   */
  private diffObjects(
    oldObj: Record<string, unknown>,
    newObj: Record<string, unknown>,
    basePath: string,
  ): PropertyDiff[] {
    const diffs: PropertyDiff[] = [];
    const allKeys = new Set([...Object.keys(oldObj), ...Object.keys(newObj)]);

    for (const key of allKeys) {
      const path = basePath ? `${basePath}.${key}` : key;
      const oldVal = oldObj[key];
      const newVal = newObj[key];

      if (!(key in oldObj)) {
        diffs.push({ path, oldValue: undefined, newValue: newVal, type: "added" });
      } else if (!(key in newObj)) {
        diffs.push({ path, oldValue: oldVal, newValue: undefined, type: "removed" });
      } else if (this.isPlainObject(oldVal) && this.isPlainObject(newVal)) {
        // Recurse into nested objects
        const nestedDiffs = this.diffObjects(
          oldVal as Record<string, unknown>,
          newVal as Record<string, unknown>,
          path,
        );
        diffs.push(...nestedDiffs);
      } else if (!this.deepEqual(oldVal, newVal)) {
        diffs.push({ path, oldValue: oldVal, newValue: newVal, type: "modified" });
      }
    }

    return diffs;
  }

  /**
   * Calculate similarity percentage between two versions.
   * Based on (unchanged properties / total properties) * 100.
   */
  private calculateSimilarity(versionA: VersionSnapshot, versionB: VersionSnapshot): number {
    let totalProperties = 0;
    let unchangedProperties = 0;

    // Count block properties
    const blockIdsA = new Set(versionA.blocks.map((b) => b.id));
    const blockIdsB = new Set(versionB.blocks.map((b) => b.id));
    const allBlockIds = new Set([...blockIdsA, ...blockIdsB]);

    for (const blockId of allBlockIds) {
      const blockA = versionA.blocks.find((b) => b.id === blockId);
      const blockB = versionB.blocks.find((b) => b.id === blockId);

      if (blockA && blockB) {
        // Both exist: count individual properties
        const allProps = new Set([...Object.keys(blockA.props), ...Object.keys(blockB.props)]);
        for (const prop of allProps) {
          totalProperties++;
          if (this.deepEqual(blockA.props[prop], blockB.props[prop])) {
            unchangedProperties++;
          }
        }
      } else {
        // Block only in one version: count all its props as changed
        const block = blockA ?? blockB!;
        totalProperties += Math.max(Object.keys(block.props).length, 1);
      }
    }

    // Count settings properties
    const settingsA = versionA.settings as unknown as Record<string, unknown>;
    const settingsB = versionB.settings as unknown as Record<string, unknown>;
    const allSettingsKeys = new Set([...Object.keys(settingsA), ...Object.keys(settingsB)]);
    for (const key of allSettingsKeys) {
      totalProperties++;
      if (this.deepEqual(settingsA[key], settingsB[key])) {
        unchangedProperties++;
      }
    }

    // Count design properties
    const designA = versionA.design as unknown as Record<string, unknown>;
    const designB = versionB.design as unknown as Record<string, unknown>;
    const allDesignKeys = new Set([...Object.keys(designA), ...Object.keys(designB)]);
    for (const key of allDesignKeys) {
      totalProperties++;
      if (this.deepEqual(designA[key], designB[key])) {
        unchangedProperties++;
      }
    }

    if (totalProperties === 0) return 100;
    return Math.round((unchangedProperties / totalProperties) * 100 * 100) / 100;
  }

  /**
   * Check if a value is a plain object (not null, not array).
   */
  private isPlainObject(value: unknown): value is Record<string, unknown> {
    return typeof value === "object" && value !== null && !Array.isArray(value);
  }

  /**
   * Deep equality check for two values.
   */
  private deepEqual(a: unknown, b: unknown): boolean {
    if (a === b) return true;
    if (a === null || b === null) return false;
    if (typeof a !== typeof b) return false;

    if (Array.isArray(a) && Array.isArray(b)) {
      if (a.length !== b.length) return false;
      return a.every((val, i) => this.deepEqual(val, b[i]));
    }

    if (this.isPlainObject(a) && this.isPlainObject(b)) {
      const keysA = Object.keys(a);
      const keysB = Object.keys(b);
      if (keysA.length !== keysB.length) return false;
      return keysA.every((key) => this.deepEqual(a[key], b[key]));
    }

    return false;
  }

  private getStorageKey(pageId: string): string {
    return `${this.STORAGE_KEY_PREFIX}${pageId}`;
  }
}
