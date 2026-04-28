# Requirements Document

## Introduction

This document defines the requirements for enhancing the page builder UI to support nested block layouts, improved sidebar search, polished visual styling, and contextual component interaction patterns inspired by Puck's UX. The enhancements use the existing tech stack (React 19, HeroUI v3, Tailwind CSS v4, dnd-kit, TipTap) and follow Puck's UX patterns without copying its CSS module approach.

## Glossary

- **Page_Builder**: The main page builder application that allows users to visually construct web pages by dragging and arranging blocks on a canvas.
- **Canvas**: The central editing area where blocks are rendered and can be selected, reordered, and nested.
- **Block**: A page section or element (e.g., Hero, Navbar, Columns) that can be placed on the Canvas.
- **Container_Block**: A Block that can hold child Blocks within named zones (e.g., a Columns block with left/right zones).
- **Drop_Zone**: A droppable region within a Container_Block that accepts child Blocks via drag-and-drop.
- **Sidebar**: The left panel containing block search, block/component lists, design settings, and templates.
- **Block_Search**: The search/filter component in the Sidebar that allows users to find blocks and components by name, category, or description.
- **Action_Bar**: A contextual floating toolbar that appears above a selected block, providing quick actions (duplicate, delete, select parent).
- **Layers_Panel**: A tree-view panel showing the hierarchical structure of all blocks on the page, supporting nested display for Container_Blocks.
- **Property_Panel**: The right-side panel for editing properties of the currently selected block.
- **Toolbar**: The top navigation bar containing device preview toggles, undo/redo, theme switching, and export actions.
- **Drag_Overlay**: Visual feedback shown during drag-and-drop operations indicating valid drop targets and insertion points.
- **Breadcrumb_Navigation**: A navigation element showing the parent hierarchy of a selected nested block, allowing users to select ancestor blocks.

## Requirements

### Requirement 1: Nested Block Support via Container Blocks

**User Story:** As a page builder user, I want to place blocks inside other blocks (e.g., columns), so that I can create complex multi-column layouts.

#### Acceptance Criteria

1. THE Page_Builder SHALL support a Container_Block type that defines one or more named Drop_Zones for child Blocks.
2. WHEN a user drags a Block over a Drop_Zone inside a Container_Block, THE Canvas SHALL display a visual drop indicator within that Drop_Zone.
3. WHEN a user drops a Block into a Drop_Zone, THE Page_Builder SHALL insert the Block as a child of the Container_Block in the specified zone.
4. THE Page_Builder SHALL support at least two levels of nesting (a Container_Block inside another Container_Block).
5. WHILE a Container_Block is rendered on the Canvas, THE Canvas SHALL render each Drop_Zone as a distinct droppable region with a minimum height of 64px when empty.
6. WHEN a nested Block is selected, THE Action_Bar SHALL display a "Select Parent" action that selects the parent Container_Block.
7. THE Layers_Panel SHALL display nested Blocks as indented children under their parent Container_Block with expand/collapse controls.
8. IF a user attempts to drop a Container_Block into its own descendant Drop_Zone, THEN THE Page_Builder SHALL reject the drop and display no insertion indicator.

### Requirement 2: Block Data Model for Nesting

**User Story:** As a developer, I want the block data model to support parent-child relationships, so that nested layouts can be serialized and restored.

#### Acceptance Criteria

1. THE Page_Builder SHALL extend the BlockInstance type with an optional `children` property that maps zone names to arrays of child BlockInstances.
2. THE Page_Builder SHALL extend the BlockDefinition type with an optional `zones` property that defines the named Drop_Zones a Container_Block supports.
3. WHEN a page is serialized, THE Page_Builder SHALL produce a JSON tree structure where Container_Blocks contain their children inline.
4. WHEN a page is deserialized, THE Page_Builder SHALL reconstruct the nested block hierarchy from the JSON tree.
5. FOR ALL valid nested BlockInstance trees, serializing then deserializing SHALL produce an equivalent tree (round-trip property).

### Requirement 3: Enhanced Sidebar Block Search

**User Story:** As a page builder user, I want to search for blocks and components with categorized results, so that I can quickly find the element I need.

#### Acceptance Criteria

1. WHEN a user types in the Block_Search input, THE Sidebar SHALL filter results in real-time with no perceptible delay for up to 100 block definitions.
2. THE Block_Search SHALL group matching results by category (sections, content, layout, media) with category headers.
3. WHEN search results are displayed, THE Block_Search SHALL show each result with its icon, label, description, and category badge.
4. WHEN a user clears the search input, THE Block_Search SHALL return to the default categorized block list view.
5. THE Block_Search SHALL match against block label, type, description, and category fields using case-insensitive substring matching.
6. WHEN no results match the search query, THE Block_Search SHALL display an empty state message indicating no matches were found.
7. THE Block_Search results SHALL be draggable, allowing users to drag a search result directly onto the Canvas.
8. WHEN the Block_Search input is focused, THE Block_Search SHALL display a keyboard shortcut hint for clearing the search (Escape key).

### Requirement 4: Contextual Action Bar on Selected Blocks

**User Story:** As a page builder user, I want a floating toolbar on my selected block, so that I can quickly duplicate, delete, or navigate to parent blocks without using the sidebar.

#### Acceptance Criteria

1. WHEN a Block is selected on the Canvas, THE Action_Bar SHALL appear positioned above the selected Block.
2. THE Action_Bar SHALL display the Block label and action buttons for duplicate and delete operations.
3. WHEN the selected Block is a child of a Container_Block, THE Action_Bar SHALL display a "Select Parent" button that navigates selection to the parent.
4. WHEN the user scrolls the Canvas, THE Action_Bar SHALL reposition to remain visually attached to the selected Block.
5. WHILE a drag operation is in progress, THE Action_Bar SHALL be hidden.
6. THE Action_Bar SHALL render above other Canvas content using a z-index that prevents overlap with the Toolbar.
7. WHEN the user clicks a "Duplicate" action in the Action_Bar, THE Page_Builder SHALL insert a copy of the selected Block immediately after it in the same zone.
8. WHEN the user clicks a "Delete" action in the Action_Bar, THE Page_Builder SHALL remove the selected Block from its zone and clear the selection.

### Requirement 5: Improved Visual Styling and Color Scheme

**User Story:** As a page builder user, I want a polished and visually consistent interface, so that the builder feels professional and easy to use.

#### Acceptance Criteria

1. THE Sidebar SHALL use consistent spacing of 12px between panel sections and 8px between items within sections.
2. THE Page_Builder SHALL use a cohesive color palette where the primary accent color (#634CF8) is used for selection states, active indicators, and primary actions.
3. WHEN a Block on the Canvas is hovered, THE Canvas SHALL display a subtle border highlight (1px solid with 30% opacity accent color) around the Block.
4. WHEN a Block on the Canvas is selected, THE Canvas SHALL display a prominent border highlight (2px solid accent color) with a subtle background tint.
5. THE Toolbar SHALL use a clean design with grouped actions separated by visual dividers, consistent icon sizes (16px), and 7px by 7px minimum touch targets for buttons.
6. THE Layers_Panel SHALL use alternating subtle background tones for adjacent layer items to improve visual scanability.
7. THE Property_Panel SHALL use consistent field spacing (16px between fields) and section headers with clear visual hierarchy.
8. THE Page_Builder SHALL maintain consistent border-radius values using the design system tokens (rounded-lg for containers, rounded-md for buttons, rounded-sm for badges).

### Requirement 6: Drag-and-Drop Visual Feedback

**User Story:** As a page builder user, I want clear visual feedback during drag operations, so that I know exactly where my block will be placed.

#### Acceptance Criteria

1. WHILE a Block is being dragged from the Sidebar, THE Canvas SHALL highlight all valid Drop_Zones with a dashed border and subtle background color.
2. WHEN a dragged Block hovers over a valid drop position, THE Canvas SHALL display a horizontal insertion line (2px height, accent color) at the exact insertion point.
3. WHILE a Block is being dragged, THE dragged element SHALL display as a semi-transparent preview (50% opacity) following the cursor.
4. WHEN a dragged Block hovers over a Container_Block Drop_Zone, THE Drop_Zone SHALL expand its minimum height and display an "accept" visual state (accent-colored dashed border).
5. IF a dragged Block hovers over an invalid drop target, THEN THE Canvas SHALL display no insertion indicator for that target.
6. WHEN a drag operation completes successfully, THE Canvas SHALL briefly animate the inserted Block with a fade-in effect (200ms duration).

### Requirement 7: Breadcrumb Navigation for Nested Blocks

**User Story:** As a page builder user, I want to see the parent hierarchy of a nested block, so that I can navigate up through the nesting levels.

#### Acceptance Criteria

1. WHEN a nested Block (depth greater than 1) is selected, THE Page_Builder SHALL display a Breadcrumb_Navigation showing the path from root to the selected Block.
2. THE Breadcrumb_Navigation SHALL display each ancestor Block label separated by a chevron icon.
3. WHEN a user clicks an ancestor label in the Breadcrumb_Navigation, THE Page_Builder SHALL select that ancestor Block.
4. THE Breadcrumb_Navigation SHALL be positioned between the Toolbar and the Canvas, visible only when a nested Block is selected.
5. WHEN the selected Block is at root level (depth equals 1), THE Page_Builder SHALL hide the Breadcrumb_Navigation.

### Requirement 8: Improved Layers Panel with Nesting Support

**User Story:** As a page builder user, I want the layers panel to show my nested block hierarchy with expand/collapse, so that I can manage complex page structures.

#### Acceptance Criteria

1. THE Layers_Panel SHALL display Container_Blocks with an expand/collapse chevron icon indicating they contain child Blocks.
2. WHEN a user clicks the expand chevron on a Container_Block layer, THE Layers_Panel SHALL reveal the child Blocks indented under the parent.
3. WHEN a user clicks the collapse chevron on a Container_Block layer, THE Layers_Panel SHALL hide the child Blocks.
4. WHEN a Block is hovered in the Layers_Panel, THE Canvas SHALL highlight the corresponding Block with a hover indicator.
5. WHEN a Block is selected in the Layers_Panel, THE Canvas SHALL scroll to and select the corresponding Block.
6. THE Layers_Panel SHALL display zone labels (e.g., "Left Column", "Right Column") as section headers between groups of child Blocks within a Container_Block.
7. THE Layers_Panel SHALL support drag-and-drop reordering of Blocks within the same zone and between zones of the same parent.

### Requirement 9: Component Card Design in Sidebar

**User Story:** As a page builder user, I want visually appealing component cards in the sidebar, so that I can quickly identify and select the blocks I need.

#### Acceptance Criteria

1. THE Sidebar block cards SHALL display a mini wireframe preview thumbnail (44px height) that visually represents the block type.
2. THE Sidebar block cards SHALL display the block label in 11px medium-weight font below the preview thumbnail.
3. WHEN a Sidebar block card is hovered, THE card SHALL display a subtle border color change (accent at 30% opacity) and a small shadow elevation.
4. WHILE a Sidebar block card is being dragged, THE card SHALL reduce opacity to 50% and scale down to 95% to indicate the drag source.
5. THE Sidebar SHALL display section blocks in a 2-column grid layout and content/component blocks in a single-column list layout.
6. WHEN a Sidebar block card is focused via keyboard, THE card SHALL display the same visual highlight as the hover state for accessibility.

### Requirement 10: Canvas Drop Zone Indicators for Nested Layouts

**User Story:** As a page builder user, I want to see clear drop zones inside container blocks, so that I know where I can place child blocks.

#### Acceptance Criteria

1. WHILE a Container_Block is rendered on the Canvas, THE Canvas SHALL display each Drop_Zone with a subtle dashed border (1px, separator color at 40% opacity) when the zone is empty.
2. WHEN a drag operation is active and the cursor is over a Container_Block, THE Canvas SHALL highlight all Drop_Zones within that Container_Block.
3. THE Drop_Zone SHALL display a placeholder message ("Drop blocks here") when empty and no drag is active.
4. WHEN a Drop_Zone contains child Blocks, THE Drop_Zone border SHALL be hidden and the zone SHALL render its children with standard block spacing.
5. THE Canvas SHALL visually distinguish between root-level drop positions and nested Drop_Zone positions using different indicator styles (solid line for root, dashed line for nested).

### Requirement 11: Enhanced Right Panel with Tabbed Property Editing

**User Story:** As a page builder user, I want the right property panel to be organized into clear tabs (Content, Style, Advanced), so that I can find and edit settings efficiently.

#### Acceptance Criteria

1. WHEN a Block is selected, THE Property_Panel SHALL display three tabs: "Content", "Style", and "Advanced".
2. THE "Content" tab SHALL display all block-specific property fields (text, images, links, items) relevant to the selected Block type.
3. THE "Style" tab SHALL display visual customization controls including typography, colors, spacing, borders, and background settings.
4. THE "Advanced" tab SHALL display animation settings, CSS class overrides, responsive visibility, and section layout options.
5. WHEN the user switches between tabs, THE Property_Panel SHALL preserve all entered values without resetting.
6. THE Property_Panel SHALL remember the last active tab per block type during the current session.
7. THE Property_Panel header SHALL display the block icon, label, and position index with a close button to deselect.

### Requirement 12: Per-Block Typography Controls

**User Story:** As a page builder user, I want to customize typography settings on individual blocks, so that I can fine-tune the visual appearance of each section.

#### Acceptance Criteria

1. THE Property_Panel Style tab SHALL provide a font size control with preset options (sm, base, lg, xl, 2xl, 3xl, 4xl) and a custom numeric input.
2. THE Property_Panel Style tab SHALL provide a font weight selector with options (light, normal, medium, semibold, bold).
3. THE Property_Panel Style tab SHALL provide a text alignment control with options (left, center, right, justify) displayed as icon toggle buttons.
4. THE Property_Panel Style tab SHALL provide a text color picker with the current design accent color as a preset option.
5. THE Property_Panel Style tab SHALL provide a line height control with preset options (tight, normal, relaxed, loose).
6. WHEN typography settings are applied, THE Canvas SHALL render the selected Block with the specified typography overrides in real-time.

### Requirement 13: Per-Block Border and Radius Controls

**User Story:** As a page builder user, I want to customize borders and corner radius on individual blocks, so that I can create varied visual styles.

#### Acceptance Criteria

1. THE Property_Panel Style tab SHALL provide a border width control with options (0, 1px, 2px, 4px).
2. THE Property_Panel Style tab SHALL provide a border color picker.
3. THE Property_Panel Style tab SHALL provide a border style selector with options (solid, dashed, dotted, none).
4. THE Property_Panel Style tab SHALL provide a border radius control with preset tokens (none, sm, md, lg, xl, 2xl, full) matching the design system.
5. THE Property_Panel Style tab SHALL provide an option to apply border radius to individual corners (top-left, top-right, bottom-left, bottom-right).
6. WHEN border settings are applied, THE Canvas SHALL render the selected Block with the specified border overrides in real-time.

### Requirement 14: Responsive Visibility Controls

**User Story:** As a page builder user, I want to show or hide blocks on specific device sizes, so that I can create responsive layouts without code.

#### Acceptance Criteria

1. THE Property_Panel Advanced tab SHALL provide a "Responsive Visibility" section with toggle controls for desktop, tablet, and mobile viewports.
2. WHEN a viewport toggle is disabled, THE Page_Builder SHALL hide the Block when the Canvas preview mode matches that viewport.
3. THE Layers_Panel SHALL display a visibility indicator icon next to Blocks that have one or more viewports disabled.
4. WHEN all viewport toggles are enabled (default state), THE Block SHALL be visible in all preview modes.
5. THE Canvas SHALL display a semi-transparent overlay with a "hidden on [viewport]" label on Blocks that are hidden in the current preview mode.

### Requirement 15: Enhanced Color Picker with Presets and Opacity

**User Story:** As a page builder user, I want a rich color picker with presets and opacity control, so that I can quickly apply consistent colors across my page.

#### Acceptance Criteria

1. THE Property_Panel color fields SHALL display a color picker with a native color input, a hex code text field, and an opacity slider (0-100%).
2. THE Property_Panel color picker SHALL display a row of preset colors derived from the current design settings (accent, success, warning, danger, and neutral tones).
3. WHEN the user selects a preset color, THE color field SHALL update to that color value immediately.
4. THE Property_Panel color picker SHALL support rgba output format when opacity is less than 100%.
5. WHEN a color value is changed, THE Canvas SHALL update the corresponding Block style in real-time.

### Requirement 16: Resizable Right Panel with Improved Layout

**User Story:** As a page builder user, I want the right property panel to be resizable and well-organized, so that I can allocate screen space based on my editing needs.

#### Acceptance Criteria

1. THE Property_Panel SHALL be resizable by dragging its left border, with a minimum width of 280px and maximum width of 440px.
2. THE Property_Panel SHALL display a resize handle cursor when the user hovers over its left border.
3. THE Property_Panel field labels SHALL use consistent 11px semibold text with 1.5 spacing below the label.
4. THE Property_Panel input fields SHALL use consistent 9px rounded-lg borders with separator/50 color and transition to accent color on focus.
5. THE Property_Panel sections SHALL be separated by subtle dividers (border-separator/40) with 12px vertical spacing between sections.
6. WHEN no Block is selected, THE Property_Panel SHALL display page-level settings (title, slug, visibility, SEO) with a tab interface.
