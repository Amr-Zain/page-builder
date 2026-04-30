# Requirements Document

## Introduction

This feature adds two new views to the page-builder SPA: a Projects Dashboard that lists all websites/projects built with the page builder, and a Website History view that shows the complete version history across all pages of a selected project. These views are accessible via new routes (`/projects` and `/projects/:id/history`) and leverage existing localStorage-based persistence (PagesState, VersionManager).

## Glossary

- **Dashboard**: The top-level view at `/projects` that displays all projects as cards with summary information.
- **Project**: A collection of pages stored in a single PagesState entry in localStorage. Currently the app has one implicit project; this feature surfaces it as a named entity.
- **Page**: An individual page within a project, represented by the existing `Page` interface (id, settings, blocks, design).
- **History_View**: The view at `/projects/:id/history` that displays a chronological timeline of version snapshots across all pages of a project.
- **Version_Snapshot**: An existing data structure from `VersionManager` containing id, pageId, timestamp, contentHash, blocks, design, settings, tags, parentVersionId, and changeSummary.
- **Project_Card**: A UI card on the Dashboard representing a single project, showing title, status, page count, and last-updated date.
- **Timeline**: A chronological list of Version_Snapshots in the History_View, ordered newest-first.
- **Router**: The React Router (react-router-dom) instance that manages navigation between views.

## Requirements

### Requirement 1: Project Dashboard Route

**User Story:** As a user, I want to navigate to a dedicated projects page, so that I can see all the websites I have built.

#### Acceptance Criteria

1. WHEN the user navigates to `/projects`, THE Router SHALL render the Dashboard view.
2. THE Dashboard SHALL display a Project_Card for each project stored in localStorage.
3. WHEN no projects exist in localStorage, THE Dashboard SHALL display an empty state message with a call-to-action to create a new project.

### Requirement 2: Project Card Information

**User Story:** As a user, I want each project card to show key details, so that I can quickly assess the state of my projects.

#### Acceptance Criteria

1. THE Project_Card SHALL display the project title derived from the first Page's settings title or a user-assigned project name.
2. THE Project_Card SHALL display the publication status as "Published" when at least one Page in the project has `settings.published` set to true, and "Draft" otherwise.
3. THE Project_Card SHALL display the total number of pages in the project.
4. THE Project_Card SHALL display the most recent `settings.updatedAt` value across all pages in the project, formatted as a relative time (e.g., "2 hours ago").
5. THE Project_Card SHALL display a visual thumbnail or preview placeholder representing the project.

### Requirement 3: Project Card Actions

**User Story:** As a user, I want to perform common actions directly from a project card, so that I can manage my projects efficiently.

#### Acceptance Criteria

1. WHEN the user clicks the "Edit" action on a Project_Card, THE Router SHALL navigate to the `/page-builder` route with the corresponding project loaded.
2. WHEN the user clicks the "History" action on a Project_Card, THE Router SHALL navigate to `/projects/:id/history` for the corresponding project.
3. WHEN the user clicks the "Delete" action on a Project_Card, THE Dashboard SHALL display a confirmation dialog before removing the project.
4. WHEN the user confirms deletion, THE Dashboard SHALL remove the project and all associated version history from localStorage.
5. IF the deletion confirmation is cancelled, THEN THE Dashboard SHALL retain the project without changes.

### Requirement 4: Project Creation from Dashboard

**User Story:** As a user, I want to create a new project from the dashboard, so that I can start building a new website.

#### Acceptance Criteria

1. THE Dashboard SHALL display a "New Project" action that is accessible at all times.
2. WHEN the user activates the "New Project" action, THE Dashboard SHALL prompt the user to enter a project name.
3. WHEN the user submits a valid project name, THE Dashboard SHALL create a new project with a default home page and navigate to the `/page-builder` route.
4. IF the user submits an empty project name, THEN THE Dashboard SHALL display a validation error and remain on the creation prompt.

### Requirement 5: Website History Route

**User Story:** As a user, I want to view the complete version history of a project, so that I can track all changes made across its pages.

#### Acceptance Criteria

1. WHEN the user navigates to `/projects/:id/history`, THE Router SHALL render the History_View for the specified project.
2. IF the project ID in the URL does not match any stored project, THEN THE History_View SHALL display an error message and a link to return to the Dashboard.

### Requirement 6: History Timeline Display

**User Story:** As a user, I want to see a chronological timeline of all changes, so that I can understand the evolution of my project.

#### Acceptance Criteria

1. THE History_View SHALL display a Timeline of all Version_Snapshots across all pages of the project, ordered by timestamp from newest to oldest.
2. THE Timeline SHALL display for each Version_Snapshot: the page title, the change summary description, the timestamp formatted as a readable date and time, and any associated tags.
3. WHEN a Version_Snapshot has a parentVersionId, THE Timeline SHALL indicate that the snapshot was a restoration from a previous version.

### Requirement 7: History Filtering

**User Story:** As a user, I want to filter the version history by page, so that I can focus on changes to a specific page.

#### Acceptance Criteria

1. THE History_View SHALL provide a page filter control listing all pages in the project.
2. WHEN the user selects a specific page in the filter, THE Timeline SHALL display only Version_Snapshots belonging to that page.
3. WHEN the user clears the page filter, THE Timeline SHALL display Version_Snapshots for all pages.

### Requirement 8: Version Restoration from History View

**User Story:** As a user, I want to restore a previous version from the history view, so that I can revert unwanted changes.

#### Acceptance Criteria

1. THE History_View SHALL provide a "Restore" action for each Version_Snapshot in the Timeline.
2. WHEN the user activates the "Restore" action, THE History_View SHALL display a confirmation dialog indicating which page and version will be restored.
3. WHEN the user confirms the restoration, THE History_View SHALL invoke the VersionManager restoreVersion method with the current page state and the selected Version_Snapshot, and update the page in localStorage.
4. WHEN the restoration completes, THE History_View SHALL refresh the Timeline to reflect the new version entry created by the restore operation.
5. IF the restoration fails, THEN THE History_View SHALL display an error message describing the failure.

### Requirement 9: Version Diff from History View

**User Story:** As a user, I want to compare two versions from the history view, so that I can understand what changed between them.

#### Acceptance Criteria

1. THE History_View SHALL allow the user to select two Version_Snapshots for comparison.
2. WHEN two Version_Snapshots are selected, THE History_View SHALL display a "Compare" action.
3. WHEN the user activates the "Compare" action, THE History_View SHALL display the diff results including blocks added, blocks removed, blocks modified, settings changes, design changes, and the similarity percentage.

### Requirement 10: Navigation Between Dashboard and History

**User Story:** As a user, I want to navigate seamlessly between the dashboard and history views, so that I can manage my projects without losing context.

#### Acceptance Criteria

1. THE History_View SHALL display a breadcrumb or back link that navigates to the Dashboard at `/projects`.
2. THE Dashboard SHALL be accessible from the main application navigation.
3. WHEN the user navigates from the History_View back to the Dashboard, THE Dashboard SHALL preserve the scroll position or display the previously viewed project in the viewport.
