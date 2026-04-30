import { createPage, getDefaultPagesState } from "./pages";
import type { PagesState } from "./pages";

// ── Interfaces ──

export interface ProjectMeta {
  id: string;
  name: string;
  createdAt: string;
  updatedAt: string;
}

export interface ProjectsRegistry {
  projects: ProjectMeta[];
}

// ── Constants ──

export const PROJECTS_REGISTRY_KEY = "page-builder-projects";
export const PAGES_KEY_PREFIX = "page-builder-pages-";

const LEGACY_PAGES_KEY = "page-builder-pages";
const VERSIONS_KEY_PREFIX = "page-builder-versions-";

// ── ProjectStorage Class ──

export class ProjectStorage {
  /**
   * List all projects from the registry.
   * Triggers legacy migration if the registry doesn't exist yet.
   */
  static listProjects(): ProjectMeta[] {
    try {
      const raw = localStorage.getItem(PROJECTS_REGISTRY_KEY);
      if (!raw) {
        ProjectStorage.migrateFromLegacy();
        const afterMigration = localStorage.getItem(PROJECTS_REGISTRY_KEY);
        if (!afterMigration) return [];
        const registry: ProjectsRegistry = JSON.parse(afterMigration);
        return registry.projects;
      }
      const registry: ProjectsRegistry = JSON.parse(raw);
      return registry.projects;
    } catch {
      return [];
    }
  }

  /**
   * Get a single project by ID, or null if not found.
   */
  static getProject(id: string): ProjectMeta | null {
    try {
      const projects = ProjectStorage.listProjects();
      return projects.find((p) => p.id === id) ?? null;
    } catch {
      return null;
    }
  }

  /**
   * Create a new project with the given name.
   * Validates that the name is non-empty and non-whitespace.
   * Generates an ID like "proj-{timestamp}", creates a default PagesState
   * with one Home page, and saves both the registry and pages.
   */
  static createProject(name: string): ProjectMeta {
    const trimmed = name.trim();
    if (!trimmed) {
      throw new Error("Project name cannot be empty or whitespace only");
    }

    const now = new Date().toISOString();
    const project: ProjectMeta = {
      id: `proj-${Date.now()}`,
      name: trimmed,
      createdAt: now,
      updatedAt: now,
    };

    // Create default PagesState with one Home page
    const homePage = createPage("Home");
    const pagesState: PagesState = {
      pages: [homePage],
      activePageId: homePage.id,
    };

    // Save pages for this project
    try {
      localStorage.setItem(
        `${PAGES_KEY_PREFIX}${project.id}`,
        JSON.stringify(pagesState),
      );
    } catch {
      // Storage quota exceeded or other error
    }

    // Add to registry
    try {
      const raw = localStorage.getItem(PROJECTS_REGISTRY_KEY);
      const registry: ProjectsRegistry = raw
        ? JSON.parse(raw)
        : { projects: [] };
      registry.projects.push(project);
      localStorage.setItem(PROJECTS_REGISTRY_KEY, JSON.stringify(registry));
    } catch {
      // Storage quota exceeded or other error
    }

    return project;
  }

  /**
   * Delete a project by ID.
   * Removes from registry, deletes pages key, and deletes all version keys
   * for that project's pages.
   */
  static deleteProject(id: string): void {
    try {
      // Load pages to find all page IDs for version cleanup
      const pagesState = ProjectStorage.loadProjectPages(id);
      const pageIds = pagesState.pages.map((p) => p.id);

      // Remove version history for each page
      for (const pageId of pageIds) {
        try {
          localStorage.removeItem(`${VERSIONS_KEY_PREFIX}${pageId}`);
        } catch {
          // Continue even if individual version key removal fails
        }
      }

      // Remove pages key
      try {
        localStorage.removeItem(`${PAGES_KEY_PREFIX}${id}`);
      } catch {
        // Continue even if pages key removal fails
      }

      // Remove from registry
      const raw = localStorage.getItem(PROJECTS_REGISTRY_KEY);
      if (raw) {
        const registry: ProjectsRegistry = JSON.parse(raw);
        registry.projects = registry.projects.filter((p) => p.id !== id);
        localStorage.setItem(PROJECTS_REGISTRY_KEY, JSON.stringify(registry));
      }
    } catch {
      // Silently handle errors during deletion
    }
  }

  /**
   * Update a project's metadata (currently only name).
   * Returns the updated project, or null if not found.
   */
  static updateProject(
    id: string,
    updates: Partial<Pick<ProjectMeta, "name">>,
  ): ProjectMeta | null {
    try {
      const raw = localStorage.getItem(PROJECTS_REGISTRY_KEY);
      if (!raw) return null;

      const registry: ProjectsRegistry = JSON.parse(raw);
      const project = registry.projects.find((p) => p.id === id);
      if (!project) return null;

      if (updates.name !== undefined) {
        const trimmed = updates.name.trim();
        if (!trimmed) return null;
        project.name = trimmed;
      }

      project.updatedAt = new Date().toISOString();
      localStorage.setItem(PROJECTS_REGISTRY_KEY, JSON.stringify(registry));
      return project;
    } catch {
      return null;
    }
  }

  /**
   * Load the PagesState for a given project.
   * Returns a default PagesState if not found.
   */
  static loadProjectPages(projectId: string): PagesState {
    try {
      const raw = localStorage.getItem(`${PAGES_KEY_PREFIX}${projectId}`);
      if (!raw) return getDefaultPagesState();
      return JSON.parse(raw);
    } catch {
      return getDefaultPagesState();
    }
  }

  /**
   * Save the PagesState for a given project.
   * Also updates the project's updatedAt timestamp.
   */
  static saveProjectPages(projectId: string, state: PagesState): void {
    try {
      localStorage.setItem(
        `${PAGES_KEY_PREFIX}${projectId}`,
        JSON.stringify(state),
      );
    } catch {
      // Storage quota exceeded or other error
    }

    // Update the project's updatedAt timestamp
    try {
      const raw = localStorage.getItem(PROJECTS_REGISTRY_KEY);
      if (raw) {
        const registry: ProjectsRegistry = JSON.parse(raw);
        const project = registry.projects.find((p) => p.id === projectId);
        if (project) {
          project.updatedAt = new Date().toISOString();
          localStorage.setItem(
            PROJECTS_REGISTRY_KEY,
            JSON.stringify(registry),
          );
        }
      }
    } catch {
      // Silently handle errors
    }
  }

  /**
   * Migrate from legacy single-project storage to the new multi-project format.
   * - If registry key already exists, do nothing (already migrated).
   * - If legacy "page-builder-pages" key exists with valid JSON, create a project
   *   from it, move data to the new key format, save registry, and remove legacy key.
   * - If legacy key has invalid JSON, skip silently and create an empty registry.
   */
  static migrateFromLegacy(): void {
    try {
      // If registry already exists, nothing to do
      const existing = localStorage.getItem(PROJECTS_REGISTRY_KEY);
      if (existing) return;

      // Check for legacy key
      const legacyRaw = localStorage.getItem(LEGACY_PAGES_KEY);
      if (!legacyRaw) {
        // No legacy data, create empty registry
        const emptyRegistry: ProjectsRegistry = { projects: [] };
        localStorage.setItem(
          PROJECTS_REGISTRY_KEY,
          JSON.stringify(emptyRegistry),
        );
        return;
      }

      // Try to parse legacy data
      let legacyState: PagesState;
      try {
        legacyState = JSON.parse(legacyRaw);
      } catch {
        // Invalid JSON — skip silently, create empty registry
        const emptyRegistry: ProjectsRegistry = { projects: [] };
        localStorage.setItem(
          PROJECTS_REGISTRY_KEY,
          JSON.stringify(emptyRegistry),
        );
        return;
      }

      // Derive project name from first page title or fallback
      const projectName =
        legacyState.pages?.[0]?.settings?.title || "My Website";

      const now = new Date().toISOString();
      const project: ProjectMeta = {
        id: `proj-${Date.now()}`,
        name: projectName,
        createdAt: now,
        updatedAt: now,
      };

      // Move data to new key
      localStorage.setItem(
        `${PAGES_KEY_PREFIX}${project.id}`,
        JSON.stringify(legacyState),
      );

      // Save registry
      const registry: ProjectsRegistry = { projects: [project] };
      localStorage.setItem(PROJECTS_REGISTRY_KEY, JSON.stringify(registry));

      // Remove legacy key
      localStorage.removeItem(LEGACY_PAGES_KEY);
    } catch {
      // If anything goes wrong during migration, create empty registry
      try {
        const emptyRegistry: ProjectsRegistry = { projects: [] };
        localStorage.setItem(
          PROJECTS_REGISTRY_KEY,
          JSON.stringify(emptyRegistry),
        );
      } catch {
        // Cannot even write empty registry — give up silently
      }
    }
  }
}
