# Implementation Plan: Page Builder UI Enhancement

## Overview

This plan implements nested block layouts, enhanced sidebar search, contextual action bar, breadcrumb navigation, tabbed property panel with per-block style overrides, and visual polish for the page builder. The approach is bottom-up: foundational types and tree utilities first, then UI components that consume them, and finally integration and wiring.

## Tasks

- [x] 1. Extend data model and types for nested blocks
  - [x] 1.1 Extend BlockInstance and BlockDefinition types with nesting support
    - Add `ZoneDefinition` interface with `name`, `label`, and optional `allow` fields to `types.ts`
    - Add optional `zones?: ZoneDefinition[]` to `BlockDefinition`
    - Add optional `children?: Record<string, BlockInstance[]>` to `BlockInstance`
    - Add `BlockStyleOverrides` interface with typography, border, color, spacing, responsive visibility, animation, and CSS class fields
    - Add `ResponsiveVisibility` interface with `desktop`, `tablet`, `mobile` booleans
    - Add `hoveredBlockId: string | null` and `expandedLayerIds: Set<string>` to `BuilderState`
    - _Requirements: 2.1, 2.2, 12.1–12.6, 13.1–13.6, 14.1–14.5_

  - [x] 1.2 Update Columns block definition with zones
    - Add `zones: [{ name: "left", label: "Left Column" }, { name: "right", label: "Right Column" }]` to the Columns block in `data.ts`
    - Ensure `defaultProps` includes `count: 2`
    - _Requirements: 1.1, 2.2_

- [-] 2. Implement tree utility functions
  - [x] 2.1 Create `tree-utils.ts` with core tree operations
    - Implement `findBlock(blocks, id)` — recursive search returning block or null
    - Implement `getBlockPath(blocks, id)` — returns array of ancestor IDs from root to target
    - Implement `getParentBlock(blocks, id)` — returns `{ parent, zone }` or null for root blocks
    - Implement `insertBlock(blocks, newBlock, targetParentId, targetZone, targetIndex)` — immutable insert into zone or root
    - Implement `removeBlock(blocks, id)` — immutable removal from any depth
    - Implement `moveBlock(blocks, blockId, targetParentId, targetZone, targetIndex)` — remove then insert
    - Implement `duplicateBlock(blocks, id)` — deep clone with new IDs, placed after original
    - Implement `isAncestor(blocks, ancestorId, descendantId)` — checks ancestor relationship
    - Implement `wouldCreateCycle(blocks, blockId, targetId)` — returns true if drop would create cycle
    - Implement `flattenTree(blocks, depth)` — returns flat array with `{ block, depth, zone, parentId }`
    - Implement `serializeTree(blocks)` — JSON.stringify wrapper
    - Implement `deserializeTree(json)` — JSON.parse with validation, throws on invalid input
    - All functions must be pure and return new arrays/objects (immutable)
    - _Requirements: 1.3, 1.6, 1.8, 2.1, 2.3, 2.4, 2.5, 7.1, 8.1–8.7_

  - [ ]* 2.2 Write property test: Block insertion into correct zone (Property 1)
    - **Property 1: Block insertion places block in correct zone**
    - Generate random block trees and valid insertion targets using fast-check
    - Verify inserted block appears in exactly the specified zone at the specified index
    - Verify no other zones are modified
    - **Validates: Requirements 1.3**

  - [ ]* 2.3 Write property test: Select parent correctness (Property 2)
    - **Property 2: Select parent returns the correct ancestor**
    - Generate random nested block trees, pick random nested blocks
    - Verify `getParentBlock` returns the immediate parent container and correct zone name
    - **Validates: Requirements 1.6**

  - [ ]* 2.4 Write property test: Circular nesting prevention (Property 3)
    - **Property 3: Circular nesting prevention**
    - Generate random block trees with containers
    - For each container, verify `wouldCreateCycle` returns true for all descendants and false for non-descendants
    - **Validates: Requirements 1.8**

  - [ ]* 2.5 Write property test: Serialization round-trip (Property 4)
    - **Property 4: Serialization round-trip preserves tree**
    - Generate random nested BlockInstance trees with varying depth and zones
    - Verify `deserializeTree(serializeTree(tree))` produces a deeply equal tree
    - **Validates: Requirements 2.3, 2.4, 2.5**

  - [ ]* 2.6 Write property test: Duplicate placement (Property 7)
    - **Property 7: Duplicate inserts copy after original in same zone**
    - Generate random block trees, duplicate random blocks
    - Verify new block has different ID, same type/props, appears immediately after original in same zone
    - **Validates: Requirements 4.7**

  - [ ]* 2.7 Write property test: Delete preserves integrity (Property 8)
    - **Property 8: Delete removes block and preserves tree integrity**
    - Generate random block trees with at least one block, delete random blocks
    - Verify deleted ID no longer exists, all other blocks remain in relative positions
    - **Validates: Requirements 4.8**

  - [ ]* 2.8 Write property test: Breadcrumb path correctness (Property 9)
    - **Property 9: Breadcrumb path matches actual ancestor chain**
    - Generate random nested trees, pick blocks at depth > 1
    - Verify `getBlockPath` returns ordered ancestor IDs where each is a valid ancestor of the next
    - **Validates: Requirements 7.1**

- [ ] 3. Checkpoint — Ensure tree utilities and property tests pass
  - Ensure all tests pass, ask the user if questions arise.

- [x] 4. Implement DropZone component for nested blocks
  - [x] 4.1 Create DropZone component
    - Create `src/page-builder/components/DropZone.tsx`
    - Use dnd-kit `useDroppable` with compound ID `${parentId}:${zone}`
    - Render children as `SortableBlock` components within a `SortableContext`
    - When empty: show dashed border placeholder with "Drop blocks here" text and 64px minimum height
    - When drag active over zone: expand height, show accent-colored dashed border accept state
    - When zone has children: hide dashed border, render children with standard block spacing
    - Distinguish root-level drop positions (solid line) from nested zone positions (dashed line)
    - _Requirements: 1.2, 1.5, 6.1, 6.2, 6.4, 10.1–10.5_

  - [x] 4.2 Update Canvas to support recursive block rendering
    - Modify `Canvas.tsx` to check if a block's definition has `zones`
    - For container blocks, render `<DropZone>` for each zone defined in the block definition
    - Each DropZone renders its children from `block.children[zoneName]`
    - Support at least two levels of nesting
    - Integrate `wouldCreateCycle` check to reject invalid drops (no insertion indicator for circular drops)
    - Update `handleDragEnd` in `PageBuilder.tsx` to parse compound droppable IDs (`parentId:zone`) and use `insertBlock`/`moveBlock` from tree-utils
    - _Requirements: 1.1, 1.2, 1.3, 1.4, 1.5, 1.8, 6.5_

  - [ ]* 4.3 Write unit tests for DropZone rendering states
    - Test empty zone placeholder rendering
    - Test zone with children renders blocks
    - Test drag-active visual state
    - _Requirements: 1.5, 10.1, 10.3, 10.4_

- [x] 5. Implement ActionBar component
  - [x] 5.1 Create ActionBar portal overlay component
    - Create `src/page-builder/components/ActionBar.tsx`
    - Render as a portal attached to `document.body`
    - Position above the selected block using `getBoundingClientRect()`
    - Use `ResizeObserver` and scroll listener to keep position in sync
    - Display block label (from definition) in center
    - Display Duplicate and Delete action buttons on the right using HeroUI `Button` with `Tooltip`
    - Show "Select Parent" button on the left only when block is nested (`isNested` prop)
    - Hide when `isDragging` is true
    - Use z-index 30 (below Toolbar at z-40, above canvas content)
    - Wire Duplicate action to call `duplicateBlock` from tree-utils
    - Wire Delete action to call `removeBlock` from tree-utils and clear selection
    - Wire Select Parent to call `getParentBlock` and select the parent ID
    - _Requirements: 4.1–4.8_

- [x] 6. Implement BreadcrumbNav component
  - [x] 6.1 Create BreadcrumbNav component using HeroUI Breadcrumbs
    - Create `src/page-builder/components/BreadcrumbNav.tsx`
    - Use HeroUI `Breadcrumbs` component
    - Compute ancestor path using `getBlockPath()` from tree-utils
    - Each breadcrumb item shows the block's label from its definition
    - Clicking an ancestor selects that block via `onSelectBlock`
    - Only render when selected block is at depth > 1
    - Position between Toolbar and Canvas as a thin horizontal bar
    - _Requirements: 7.1–7.5_

  - [x] 6.2 Integrate BreadcrumbNav into PageBuilder layout
    - Add BreadcrumbNav between Toolbar and main layout in `PageBuilder.tsx`
    - Pass `blocks`, `selectedBlockId`, and `onSelectBlock` props
    - Conditionally render based on selected block depth
    - _Requirements: 7.4, 7.5_

- [ ] 7. Checkpoint — Ensure nested blocks, ActionBar, and BreadcrumbNav work
  - Ensure all tests pass, ask the user if questions arise.

- [x] 8. Enhance BlockSearch with categorized results
  - [x] 8.1 Update BlockSearch with category grouping and enhanced UI
    - Modify `src/page-builder/components/BlockSearch.tsx`
    - Group matching results by category (sections, content, layout, media) with category headers
    - Show each result with icon, label, description, and category badge (HeroUI `Chip`)
    - Show "Press Esc to clear" keyboard hint when input is focused
    - Add Escape key handler to clear search input
    - Ensure results remain draggable using `useDraggable`
    - Match against label, type, description, and category using case-insensitive substring matching
    - Show empty state message when no results match
    - _Requirements: 3.1–3.8_

  - [ ]* 8.2 Write property test: Search grouping by category (Property 5)
    - **Property 5: Search results grouped by category**
    - Generate random block definitions and search queries
    - Verify all returned results are grouped by category (same category appears consecutively)
    - Verify every matching block appears exactly once
    - **Validates: Requirements 3.2**

  - [ ]* 8.3 Write property test: Case-insensitive substring matching (Property 6)
    - **Property 6: Case-insensitive substring matching**
    - Generate random block definitions and substrings from their fields with arbitrary case transformations
    - Verify searching with that substring includes the block in results
    - **Validates: Requirements 3.5**

- [x] 9. Implement tabbed RightPanel with Content/Style/Advanced tabs
  - [x] 9.1 Refactor RightPanel to use HeroUI Tabs with three tabs
    - Modify `src/page-builder/components/RightPanel.tsx`
    - Add HeroUI `Tabs` component with "Content", "Style", and "Advanced" tabs
    - Move existing block-specific property fields into the Content tab
    - Remember last active tab per block type using a `Map<BlockType, PropertyTab>` in component state
    - Display block icon, label, and position index in header with close button
    - Preserve all entered values when switching tabs (no state reset)
    - _Requirements: 11.1, 11.2, 11.5, 11.6, 11.7_

  - [x] 9.2 Implement Style tab with typography, border, and color controls
    - Add typography controls: font size presets (sm, base, lg, xl, 2xl, 3xl, 4xl) + custom input, font weight selector, text alignment icon toggles, text color picker, line height presets
    - Add border controls: border width (0, 1px, 2px, 4px), border color picker, border style (solid, dashed, dotted, none), border radius presets + per-corner option
    - Add background color picker
    - Store all style overrides in `block.props._style` as `BlockStyleOverrides`
    - _Requirements: 11.3, 12.1–12.6, 13.1–13.6_

  - [x] 9.3 Implement Advanced tab with animation, CSS class, and responsive visibility
    - Move existing animation settings and CSS class override from `BlockStyleEditor` into Advanced tab
    - Add responsive visibility toggles for desktop, tablet, and mobile with toggle switches
    - Add section layout options (contained/full-width)
    - Store responsive visibility in `block.props._style.visibleDesktop/Tablet/Mobile`
    - _Requirements: 11.4, 14.1–14.4_

  - [x] 9.4 Implement enhanced color picker with presets and opacity
    - Create a reusable `ColorPicker` component with native color input, hex text field, and opacity slider (0-100%)
    - Display preset color row derived from design settings (accent, success, warning, danger, neutral)
    - Support rgba output when opacity < 100%
    - Use in text color, border color, and background color fields
    - _Requirements: 15.1–15.5_

  - [ ]* 9.5 Write property test: Tab switching preserves values (Property 10)
    - **Property 10: Tab switching preserves property values**
    - Generate random block prop objects, simulate tab switches
    - Verify block props remain deeply equal before and after tab switches
    - **Validates: Requirements 11.5**

- [x] 10. Apply style overrides to Canvas rendering
  - [x] 10.1 Update BlockRenderer to apply BlockStyleOverrides
    - Modify `src/page-builder/components/BlockRenderer.tsx`
    - Read `block.props._style` and apply typography, border, color, and spacing overrides as inline styles
    - Apply responsive visibility: when canvas preview mode matches a disabled viewport, render block with semi-transparent overlay and "hidden on [viewport]" label
    - Apply animation classes based on style override settings
    - _Requirements: 12.6, 13.6, 14.2, 14.5, 15.5_

  - [ ]* 10.2 Write property test: Style overrides applied (Property 11)
    - **Property 11: Style overrides applied to canvas rendering**
    - Generate random style override objects
    - Verify rendered block element reflects specified overrides
    - **Validates: Requirements 12.6, 13.6, 15.5**

  - [ ]* 10.3 Write property test: Responsive visibility (Property 12)
    - **Property 12: Responsive visibility per viewport**
    - Generate random visibility configs and preview modes
    - Verify block is hidden when viewport toggle is disabled and preview mode matches
    - **Validates: Requirements 14.2**

- [ ] 11. Checkpoint — Ensure tabbed panel, style overrides, and search enhancements work
  - Ensure all tests pass, ask the user if questions arise.

- [x] 12. Enhance LayersPanel with tree view and nesting support
  - [x] 12.1 Refactor LayersPanel for recursive tree display
    - Modify `src/page-builder/components/LayersPanel.tsx`
    - Use `flattenTree()` to convert recursive tree into flat list with depth info
    - Indent each item by `depth * 16px`
    - Show expand/collapse chevron icon on container blocks
    - Display zone labels (e.g., "Left Column", "Right Column") as section headers between child groups
    - Add alternating subtle background tones for even/odd rows
    - Show visibility indicator icon for blocks with disabled viewports
    - Add `onHover` callback to sync hover state with canvas highlight
    - Accept `expandedIds` and `onToggleExpand` props for expand/collapse state
    - Support drag-and-drop reordering within same zone and between zones
    - _Requirements: 8.1–8.7, 5.6, 14.3_

- [x] 13. Visual styling improvements and drag feedback
  - [x] 13.1 Apply consistent spacing, colors, and hover/selection states
    - Update Sidebar spacing: 12px between panel sections, 8px between items
    - Ensure primary accent color (#634CF8) is used consistently for selection states, active indicators, and primary actions
    - Update Canvas hover state: 1px solid border with 30% opacity accent color on block hover
    - Update Canvas selection state: 2px solid accent border with subtle background tint
    - Update Toolbar: grouped actions with visual dividers, consistent 16px icon sizes, 7px minimum touch targets
    - Update Property Panel: 16px between fields, section headers with clear visual hierarchy
    - Ensure consistent border-radius: rounded-lg for containers, rounded-md for buttons, rounded-sm for badges
    - _Requirements: 5.1–5.8_

  - [x] 13.2 Improve drag-and-drop visual feedback
    - Highlight all valid drop zones with dashed border and subtle background during sidebar drags
    - Show 2px accent-colored horizontal insertion line at exact insertion point on hover
    - Display dragged element at 50% opacity following cursor
    - Animate inserted block with 200ms fade-in on successful drop
    - _Requirements: 6.1–6.6_

  - [x] 13.3 Update sidebar block cards with wireframe previews
    - Ensure section blocks display mini wireframe preview thumbnails (44px height)
    - Display block label in 11px medium-weight font below thumbnail
    - Add hover border color change (accent at 30% opacity) and small shadow elevation
    - Add drag source visual: 50% opacity and 95% scale while dragging
    - Display section blocks in 2-column grid, content/component blocks in single-column list
    - Add keyboard focus highlight matching hover state for accessibility
    - _Requirements: 9.1–9.6_

  - [ ]* 13.4 Write property test: Panel resize bounds (Property 13)
    - **Property 13: Panel resize stays within bounds**
    - Generate random sequences of resize drag deltas
    - Verify resulting width is always clamped between 280px min and 440px max
    - **Validates: Requirements 16.1**

- [x] 14. Integration and wiring
  - [x] 14.1 Wire all new components into PageBuilder
    - Update `PageBuilder.tsx` to use tree-utils for all block operations (insert, delete, move, duplicate)
    - Replace flat `blocks` array operations with recursive tree operations
    - Add `hoveredBlockId` and `expandedLayerIds` state
    - Wire ActionBar to selected block with proper positioning
    - Wire BreadcrumbNav between Toolbar and Canvas
    - Wire enhanced LayersPanel with expand/collapse state and hover sync
    - Wire enhanced RightPanel with tabbed interface
    - Update DnD handlers to support nested drop targets (parse compound IDs)
    - Ensure undo/redo history works with the recursive tree structure
    - _Requirements: 1.1–1.8, 4.1–4.8, 7.1–7.5, 8.1–8.7_

  - [x] 14.2 Update serialization and persistence for nested trees
    - Update `saveToStorage` and `loadState` to handle recursive block trees
    - Update page save/load to preserve nested children
    - Update HTML export to handle nested block rendering
    - Update React export to handle nested block rendering
    - _Requirements: 2.3, 2.4, 2.5_

  - [ ]* 14.3 Write integration tests for full editing flows
    - Test: drag block from sidebar into container zone, verify tree update
    - Test: select nested block → edit in Content tab → switch to Style tab → apply typography → verify props preserved
    - Test: build nested page → serialize → deserialize → verify structure matches
    - _Requirements: 1.3, 2.5, 11.5_

- [ ] 15. Final checkpoint — Ensure all tests pass
  - Ensure all tests pass, ask the user if questions arise.

## Notes

- Tasks marked with `*` are optional and can be skipped for faster MVP
- Each task references specific requirements for traceability
- Checkpoints ensure incremental validation
- Property tests validate universal correctness properties from the design document using fast-check
- Unit tests validate specific examples and edge cases
- The tree-utils module is the foundation — all UI components depend on it
- Style overrides are stored in `block.props._style` to keep the existing props structure compatible
