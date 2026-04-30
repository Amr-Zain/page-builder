# Implementation Plan: Project Dashboard

## Overview

Implement a multi-project dashboard and per-project history view for the page builder. This adds a `ProjectStorage` data layer on top of existing `PagesState`/`VersionManager` infrastructure, two new route-level pages (`/projects` and `/projects/:id/history`), supporting UI components, and routing/integration changes. All storage remains client-side via localStorage.

## Tasks

- [x] 1. Data layer — ProjectStorage and migration
  - [x] 1.1 Create `ProjectMeta` and `ProjectsRegistry` interfaces in `src/page-builder/project-storage.ts`
    - Define `ProjectMeta` (id, name, createdAt, updatedAt) and `ProjectsRegistry` (projects array)
    - Define localStorage key constants (`page-builder-projects`, `page-builder-pages-{id}` pattern)
    - _Requirements: 1.2, 2.1, 3.4_

  - [x] 1.2 Implement `ProjectStorage` class with CRUD methods
    - `listProjects()`: read registry from localStorage, return `ProjectMeta[]`
    - `getProject(id)`: return single project or null
    - `createProject(name)`: validate non-empty/non-whitespace name, generate ID, create default `PagesState` with one Home page, save registry and pages key
    - `deleteProject(id)`: remove from registry, delete `page-builder-pages-{id}`, delete all `page-builder-versions-{pageId}` keys for that project's pages
    - `updateProject(id, updates)`: update name, persist
    - `loadProjectPages(projectId)`: read `PagesState` from `page-builder-pages-{projectId}`
    - `saveProjectPages(projectId, state)`: write `PagesState` to `page-builder-pages-{projectId}`
    - Wrap all `localStorage` calls in try/catch per design error handling
    - _Requirements: 1.2, 3.4, 4.3, 4.4, 5.2_

  - [x] 1.3 Implement `migrateFromLegacy()` in `ProjectStorage`
    - On first `listProjects()` call, if registry key doesn't exist, check for legacy `page-builder-pages` key
    - If found, create a `ProjectMeta` with name from first page's title (or "My Website"), move data to `page-builder-pages-{newId}`, save registry, remove legacy key
    - If legacy key has invalid JSON, skip silently without deleting it
    - _Requirements: 1.2_

- [x] 2. Utility — formatRelativeTime
  - [x] 2.1 Create `src/page-builder/utils/format-time.ts` with `formatRelativeTime` function
    - Pure function: `(isoTimestamp: string) => string`
    - Handle ranges: "just now" (<60s), "X minutes ago", "X hours ago", "X days ago", "X months ago", "X years ago"
    - Handle invalid/empty input gracefully (return empty string or fallback)
    - _Requirements: 2.4_

- [x] 3. Dashboard components
  - [x] 3.1 Create `ProjectCard` component at `src/page-builder/components/ProjectCard.tsx`
    - Accept `ProjectCardProps` (project, pagesState, onEdit, onHistory, onDelete)
    - Display project name as title (fall back to first page's `settings.title`)
    - Show "Published" chip if any page has `settings.published === true`, "Draft" otherwise
    - Show page count and relative last-updated time via `formatRelativeTime`
    - Show preview placeholder/thumbnail area
    - Render Edit, History, Delete action buttons
    - Use HeroUI `Card`, `CardBody`, `CardFooter`, `Button`, `Chip` and lucide-react icons
    - _Requirements: 2.1, 2.2, 2.3, 2.4, 2.5, 3.1, 3.2, 3.3_

  - [x] 3.2 Create `CreateProjectModal` component at `src/page-builder/components/CreateProjectModal.tsx`
    - Accept `CreateProjectModalProps` (isOpen, onClose, onCreate)
    - Render HeroUI `Modal` with project name `Input` and submit/cancel buttons
    - Validate non-empty name; show inline error for empty/whitespace input
    - Call `onCreate(name)` on valid submit
    - _Requirements: 4.2, 4.3, 4.4_

  - [x] 3.3 Create `DeleteConfirmModal` component at `src/page-builder/components/DeleteConfirmModal.tsx`
    - Accept `DeleteConfirmModalProps` (isOpen, projectName, onClose, onConfirm)
    - Show confirmation message with project name
    - Confirm button triggers `onConfirm`, cancel triggers `onClose`
    - _Requirements: 3.3, 3.4, 3.5_

  - [x] 3.4 Create `ProjectsDashboard` page at `src/pages/projects.tsx`
    - Call `ProjectStorage.listProjects()` on mount (trigger migration if needed)
    - Load each project's `PagesState` for card display data
    - Render grid of `ProjectCard` components
    - Show empty state with "Create your first project" CTA when no projects exist
    - Wire "New Project" button to open `CreateProjectModal`
    - On create: call `ProjectStorage.createProject(name)`, navigate to `/page-builder/{id}`
    - On delete: open `DeleteConfirmModal`, on confirm call `ProjectStorage.deleteProject(id)`, refresh list
    - On edit: navigate to `/page-builder/{id}`
    - On history: navigate to `/projects/{id}/history`
    - _Requirements: 1.1, 1.2, 1.3, 3.1, 3.2, 3.3, 3.4, 3.5, 4.1, 4.2, 4.3, 4.4, 10.2_

- [x] 4. Checkpoint — Verify dashboard renders
  - Ensure all components compile without errors, ask the user if questions arise.

- [x] 5. History components
  - [x] 5.1 Create `HistoryTimeline` component at `src/page-builder/components/HistoryTimeline.tsx`
    - Accept `HistoryTimelineProps` (versions, pages, compareSelection, onToggleCompare, onRestore)
    - Render vertical timeline of version snapshots ordered newest-first
    - Each entry shows: page title, change summary, formatted timestamp, tags, restoration indicator if `parentVersionId` is set
    - Render Restore button and Compare checkbox per entry
    - Use HeroUI `Chip`, `Button` and lucide-react icons
    - _Requirements: 6.1, 6.2, 6.3, 8.1, 9.1_

  - [x] 5.2 Create `WebsiteHistory` page at `src/pages/project-history.tsx`
    - Read `id` from `useParams()`, load project via `ProjectStorage.getProject(id)`
    - If project not found, show error message with link back to `/projects`
    - Load all page IDs for the project, call `VersionManager.getVersions(pageId)` for each, merge and sort newest-first
    - Render page filter dropdown (list all pages, "All pages" option)
    - Filter timeline when a specific page is selected
    - Track `compareSelection` state (max 2 version IDs); show "Compare" button when 2 selected
    - On Compare: call `VersionManager.compareVersions()`, display results using existing `VersionComparisonView`
    - On Restore: show confirmation dialog, call `VersionManager.restoreVersion()`, refresh timeline on success, show error on failure
    - Render breadcrumb/back link to `/projects`
    - _Requirements: 5.1, 5.2, 6.1, 6.2, 6.3, 7.1, 7.2, 7.3, 8.1, 8.2, 8.3, 8.4, 8.5, 9.1, 9.2, 9.3, 10.1_

- [x] 6. Checkpoint — Verify history view compiles
  - Ensure all components compile without errors, ask the user if questions arise.

- [x] 7. Routing and integration
  - [x] 7.1 Update `src/App.tsx` with new routes
    - Add `/projects` route → `ProjectsDashboard`
    - Add `/projects/:id/history` route → `WebsiteHistory`
    - Change `/page-builder` to `/page-builder/:projectId?` → `PageBuilder`
    - Add necessary imports
    - _Requirements: 1.1, 5.1, 10.2_

  - [x] 7.2 Update `src/page-builder/PageBuilder.tsx` to support `projectId` param
    - Read optional `projectId` from `useParams()`
    - If `projectId` provided: load pages via `ProjectStorage.loadProjectPages(projectId)`, save via `ProjectStorage.saveProjectPages(projectId, state)`
    - If `projectId` absent: load most recently updated project or create a new one
    - If `projectId` doesn't match any project: show error with link to `/projects`
    - Update `updatedAt` on the `ProjectMeta` when saving
    - _Requirements: 3.1, 5.2_

- [x] 8. Polish — Empty states, error handling, navigation
  - [x] 8.1 Add empty state UI to `ProjectsDashboard`
    - Styled empty state with icon, message, and "New Project" CTA button
    - _Requirements: 1.3_

  - [x] 8.2 Add error states to `WebsiteHistory` and `PageBuilder`
    - Invalid project ID → error message + link to dashboard
    - Restore failure → error toast/message
    - _Requirements: 5.2, 8.5_

  - [x] 8.3 Add navigation elements
    - Back/breadcrumb link in `WebsiteHistory` pointing to `/projects`
    - Ensure dashboard is accessible from main app navigation
    - _Requirements: 10.1, 10.2_

- [x] 9. Final checkpoint — Full integration verification
  - Ensure all files compile without errors and all routes are wired correctly, ask the user if questions arise.

## Notes

- All code uses TypeScript with React, HeroUI v3 components, lucide-react icons, and Tailwind CSS — matching existing project conventions.
- `ProjectStorage` wraps existing `PagesState` and `VersionManager` infrastructure; no changes to version storage format.
- Legacy migration runs automatically on first dashboard load, preserving existing user data.
- Each task references specific requirement numbers from requirements.md for traceability.
