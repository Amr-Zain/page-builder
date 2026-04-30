# Implementation Plan: Editor Enhancements

## Overview

This implementation plan covers four major enhancement areas for the page-builder editor:

1. **Draft Mode & Version History** - Publishing workflow with comprehensive version management
2. **Component Override System** - Flexible UI customization and plugin architecture
3. **Field Conditions Framework** - Conditional field visibility and dependencies
4. **Enhanced Search** - Optimized search with fuzzy matching and keyboard navigation

The implementation uses TypeScript, React 19, and HeroUI v3.

## Tasks

### Phase 1: Project Setup and Core Infrastructure

- [x] 1. Set up testing infrastructure
  - Install fast-check for property-based testing
  - Configure test files structure in `src/page-builder/__tests__/`
  - Set up test utilities and custom generators for domain objects
  - _Requirements: All testing requirements_

- [x] 1. Extend PageSettings interface for draft mode
  - Add `published: boolean` field to PageSettings interface in `src/page-builder/types.ts`
  - Update default page creation to set `published: false`
  - Update localStorage persistence to include published field
  - _Requirements: 1.1, 6.6_

### Phase 2: Draft Mode & Version History

- [x] 2. Implement Version Manager core classes
  - [x] 2.1 Create version-history.ts with interfaces (VersionSnapshot, VersionTag, VersionChangeSummary, VersionDiff, PropertyDiff)
    - Define all TypeScript interfaces for version management
    - _Requirements: 2.1, 2.9, 3.1, 4.6_
  
  - [x] 2.2 Implement VersionManager class with storage methods
    - Implement createVersion, getVersions, restoreVersion methods
    - Add localStorage integration with STORAGE_KEY_PREFIX pattern
    - Implement content hash calculation using SHA-256
    - Implement automatic change summary generation
    - _Requirements: 2.1, 2.6, 2.7, 2.9_

- [x] 3. Implement version history limits and pruning
  - Add version limit enforcement (MAX_VERSIONS = 50)
  - Implement pruneOldVersions method
  - Ensure oldest untagged versions removed first
  - _Requirements: 2.2, 2.3_

- [x] 4. Implement version tagging system
  - Add tag management methods to VersionManager
  - Implement addTag, removeTag methods
  - Add tag label validation (max 50 characters)
  - Support multiple tags per version
  - _Requirements: 3.2, 3.3, 3.6, 3.8_

- [x] 5. Implement version comparison and diff engine
  - Add compareVersions method to VersionManager
  - Implement diff calculation for blocks (added, removed, modified)
  - Implement property-level diff with path tracking
  - Implement design settings diff
  - Calculate similarity percentage
  - _Requirements: 2.10, 4.1, 4.6, 4.9_

- [x] 6. Implement version export and import
  - [x] 6.1 Add export methods to VersionManager
    - Implement exportVersion (single version to JSON)
    - Implement exportAllVersions (ZIP archive)
    - Include all metadata, tags, and parent-child relationships
    - _Requirements: 5.1, 5.2, 5.6, 5.7, 5.8_
  
  - [x] 6.2 Add import methods to VersionManager
    - Implement importVersion with validation
    - Implement importVersionArchive for ZIP files
    - Add content hash deduplication
    - Preserve tag associations
    - _Requirements: 5.3, 5.4, 5.5, 5.9, 5.10_

- [x] 7. Create VersionHistoryPanel component
  - Implement VersionHistoryPanel.tsx
  - Display versions in reverse chronological order
  - Show timestamps, change summaries, and tags
  - Add restore, tag, compare, export actions
  - Implement tag filtering
  - Use virtualized list for performance
  - _Requirements: 2.4, 2.5, 2.8, 3.4, 3.5, 3.9, 3.10_

- [x] 8. Create VersionComparisonView component
  - Implement VersionComparisonView.tsx
  - Side-by-side comparison layout
  - Color-coded changes (green=added, red=removed, yellow=modified)
  - Navigation controls for jumping between changes
  - Display similarity percentage
  - Restore buttons for either version
  - _Requirements: 4.2, 4.3, 4.4, 4.5, 4.7, 4.8, 4.10_

- [x] 9. Integrate draft mode UI into PageBuilder
  - [x] 9.1 Add publish/unpublish button to Toolbar
    - Display "Publish" for draft pages, "Unpublish" for published pages
    - Update published status and timestamp on click
    - Add validation for required fields (title, slug)
    - _Requirements: 1.2, 1.3, 1.7, 1.8, 6.1, 6.2_
  
  - [x] 9.2 Add draft/published badges to page list
    - Display "Draft" badge when published=false
    - Display "Published" badge when published=true
    - _Requirements: 1.4, 1.5_
  
  - [x] 9.3 Add draft preview indicator
    - Show "Draft Preview" indicator in preview mode for draft pages
    - _Requirements: 1.6_
  
  - [x] 9.4 Add draft comments to export functions
    - Add draft watermark comment to HTML export
    - Add draft comment to React export
    - _Requirements: 6.4, 6.5_

### Phase 3: Component Override System

- [x] 10. Create override system core infrastructure
  - [x] 10.1 Create overrides.ts with interfaces
    - Define ComponentOverrides, ThemeOverrides, Plugin, PluginContext interfaces
    - Define ToolbarAction, SidebarPanelDefinition interfaces
    - _Requirements: 7.1, 8.1, 9.1_
  
  - [x] 10.2 Implement OverrideManager class
    - Implement registerComponentOverrides method
    - Implement registerThemeOverrides method
    - Implement registerPlugins method
    - Implement getComponent method with fallback logic
    - Implement applyTheme method for CSS custom properties
    - Add component validation
    - _Requirements: 7.2, 7.4, 7.5, 8.2, 8.4, 8.5, 8.6_

- [x] 11. Implement plugin system
  - [x] 11.1 Create plugin context implementation
    - Implement PluginContext with getState, setState, action methods
    - Implement lifecycle hooks (onBlockAdded, onBlockRemoved, onSave)
    - Implement UI extension methods (registerToolbarAction, registerSidebarPanel, registerBlockType)
    - _Requirements: 9.2, 9.3, 9.4, 9.5, 9.6_
  
  - [x] 11.2 Add plugin initialization and error handling
    - Implement plugin init with error isolation
    - Implement plugin cleanup on unmount
    - Add error logging for failed plugins
    - _Requirements: 9.7, 9.8_

- [x] 12. Integrate override system into PageBuilder
  - [x] 12.1 Add PageBuilderConfig interface
    - Extend PageBuilder props to accept componentOverrides, themeOverrides, plugins
    - Initialize OverrideManager on mount
    - Apply theme overrides to CSS custom properties
    - _Requirements: 7.1, 8.1, 9.1_
  
  - [x] 12.2 Update component rendering to use overrides
    - Wrap Toolbar, Sidebar, RightPanel, Canvas with override logic
    - Add error boundaries for override components
    - Pass correct props to overridden components
    - Log warnings for missing props
    - _Requirements: 7.3, 7.5, 7.6_

### Phase 4: Field Conditions Framework

- [x] 13. Create field conditions core classes
  - [x] 13.1 Create field-conditions.ts with interfaces
    - Define FieldCondition, CompositeCondition, FieldDependency interfaces
    - Define FieldValidationRule, ConditionalField interfaces
    - Define ConditionOperator and LogicalOperator types
    - _Requirements: 10.1, 10.3, 11.1, 12.6_
  
  - [x] 13.2 Implement ConditionEvaluator class
    - Implement evaluateCondition method
    - Implement evaluateFieldCondition for single conditions
    - Implement evaluateCompositeCondition for AND/OR logic
    - Implement getFieldValue with path traversal
    - Implement compareValues for all operators
    - _Requirements: 10.2, 10.3, 10.7_

- [x] 14. Implement field dependency system
  - Implement DependencyManager class
  - Implement registerDependency method
  - Implement executeDependencies method
  - Implement detectCircularDependencies method
  - Support copy, transform, and compute dependency types
  - _Requirements: 11.1, 11.2, 11.4, 11.5, 11.6, 11.8_

- [x] 15. Implement conditional validation
  - Implement ValidationEngine class
  - Implement validateField method
  - Implement validateBlock method
  - Support required, minLength, maxLength, pattern, custom validation rules
  - _Requirements: 12.1, 12.2, 12.6, 12.7_

- [x] 16. Create useConditionalFields hook
  - Implement useConditionalFields.ts
  - Track visible fields based on condition evaluation
  - Re-evaluate conditions when props change
  - Provide isFieldVisible helper
  - Provide validateVisibleFields helper
  - Track field errors
  - _Requirements: 10.4, 10.5, 10.6, 12.2, 12.3, 12.4_

- [x] 17. Integrate field conditions into RightPanel
  - Update RightPanel to use useConditionalFields
  - Accept fieldConditions and fieldDependencies in block definitions
  - Use useConditionalFields hook to determine field visibility
  - Execute dependencies when source fields change
  - Display validation errors for visible fields
  - Highlight invalid fields
  - _Requirements: 10.2, 10.4, 10.5, 10.6, 11.2, 12.3, 12.4_

### Phase 5: Enhanced Search

- [x] 18. Create search engine core classes
  - Create search-engine.ts with interfaces
  - Define SearchableItem, SearchResult, SearchMatch, SearchQuery interfaces
  - Define SearchHistory interface
  - Implement SearchIndex class
  - Implement build method to create index from block/component definitions
  - Implement update and remove methods
  - Create searchable items with labels, descriptions, keywords
  - _Requirements: 13.1, 14.1, 16.1, 16.2_

- [x] 19. Implement fuzzy matching algorithm
  - Implement FuzzyMatcher class
  - Implement match method with Levenshtein distance
  - Implement findMatchIndices for character highlighting
  - Implement calculateScore for relevance ranking
  - Set MATCH_THRESHOLD to 0.6 (60%)
  - _Requirements: 13.1, 13.4, 13.5_

- [x] 20. Implement SearchEngine class
  - [x] 20.1 Add search and ranking methods
    - Implement search method with fuzzy matching
    - Implement rankResults for relevance sorting
    - Implement result caching
    - Limit results to 50 items
    - _Requirements: 13.2, 13.3, 16.3, 16.4, 16.5, 16.7_
  
  - [x] 20.2 Add search history management
    - Implement addToHistory method
    - Implement getHistory and clearHistory methods
    - Limit history to 10 entries
    - Deduplicate history entries
    - Persist to localStorage
    - _Requirements: 14.1, 14.2, 14.5, 14.6, 14.7_

- [x] 21. Create EnhancedSearch component
  - [x] 21.1 Implement EnhancedSearch.tsx
    - Create search input with debouncing (150ms)
    - Display search results with highlighting
    - Show recent search history on focus
    - Implement category filters
    - Display result counts per category
    - _Requirements: 13.1, 13.4, 13.6, 13.7, 14.3, 14.4, 17.1, 17.2, 17.3, 17.4, 17.5, 17.6_
  
  - [x] 21.2 Add keyboard navigation
    - Implement arrow key navigation (up/down)
    - Implement Enter key selection
    - Implement Escape key to clear search
    - Implement Tab key to cycle categories
    - Highlight currently selected result
    - _Requirements: 15.1, 15.2, 15.3, 15.4, 15.5, 15.6, 15.7_

- [x] 22. Integrate EnhancedSearch into Sidebar
  - Replace existing search with EnhancedSearch component
  - Update Sidebar to use EnhancedSearch
  - Connect search results to block/component selection
  - Initialize SearchEngine with block and component definitions
  - _Requirements: 13.1, 13.6, 16.1_

### Phase 6: Configuration Parsers (Optional)

- [ ]* 23. Implement configuration parsers
  - [ ]* 23.1 Create parser for component overrides
    - Implement parser to convert config files to ComponentOverrides objects
    - Implement pretty-printer to format ComponentOverrides back to config
    - Add validation and error messages
    - _Requirements: 18.1, 18.2, 18.3_
  
  - [ ]* 23.2 Create parser for field conditions
    - Implement parser to convert config files to FieldCondition objects
    - Implement pretty-printer to format conditions back to config
    - Add validation and error messages
    - _Requirements: 19.1, 19.2, 19.3_

### Phase 7: Error Handling and Edge Cases

- [ ] 24. Implement error handling for all systems
  - [ ] 24.1 Add error handling for version history
    - Handle localStorage quota exceeded
    - Handle corrupted version data
    - Handle content hash collisions
    - Handle import validation failures
    - _Requirements: All version history requirements_
  
  - [ ] 24.2 Add error handling for component overrides
    - Handle invalid component types
    - Handle component render errors with error boundaries
    - Handle missing required props
    - Handle theme override validation
    - _Requirements: All override requirements_
  
  - [ ] 24.3 Add error handling for field conditions
    - Handle circular dependency detection
    - Handle condition evaluation errors
    - Handle dependency function errors
    - Handle validation rule errors
    - _Requirements: All field condition requirements_
  
  - [ ] 24.4 Add error handling for search
    - Handle index build failures
    - Handle fuzzy match algorithm errors
    - Handle cache corruption
    - Handle history storage errors
    - _Requirements: All search requirements_

### Phase 8: Integration and Documentation

- [ ] 25. Integration and polish
  - Test all features together
  - Test draft mode with version history
  - Test component overrides with field conditions
  - Test search with custom block types from plugins
  - _Requirements: All requirements_

- [ ] 26. Performance validation
  - Verify search query execution < 50ms
  - Verify version comparison < 200ms
  - Verify condition evaluation < 10ms
  - _Requirements: 16.4_

- [ ] 27. Documentation and examples
  - Create usage examples for each feature area
  - Document configuration options
  - Add inline code comments
  - Update README with new features

- [ ] 28. Final verification
  - Manual testing of UI components
  - Verify all features work as expected

## Notes

- Tasks marked with `*` are optional and can be skipped for faster MVP
- Each task references specific requirements for traceability
- The 4 major feature areas can be implemented in parallel:
  - Phase 2: Draft Mode & Version History (Tasks 2-9)
  - Phase 3: Component Override System (Tasks 10-12)
  - Phase 4: Field Conditions Framework (Tasks 13-17)
  - Phase 5: Enhanced Search (Tasks 18-22)
- All code uses TypeScript with React 19 and HeroUI v3
