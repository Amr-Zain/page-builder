# Design Document: Editor Enhancements

## Overview

This design document specifies the architecture and implementation details for four major enhancement areas to the page-builder editor:

1. **Draft Mode & Version History** - A complete publishing workflow with comprehensive version management, tagging, comparison, and export/import capabilities
2. **Component Overrides** - A flexible system for customizing editor UI components and themes
3. **Field Conditions** - A declarative framework for conditional field visibility and dependencies
4. **Enhanced Search** - An optimized search system with fuzzy matching, history, and keyboard navigation

### Context

The page-builder is a visual editor built with Vite, React 19, HeroUI v3, and dnd-kit for drag-and-drop. It uses localStorage for persistence and follows a component-based architecture with clear separation between state management (PageBuilder.tsx), UI components (components/), and data utilities (tree-utils.ts, pages.ts, menus.ts).

### Goals

- Enable content creators to work on drafts without affecting published pages
- Provide comprehensive version history with tagging, comparison, and restoration
- Allow developers to customize the editor's appearance and behavior
- Implement conditional field logic to simplify the editing experience
- Deliver fast, intuitive search with fuzzy matching and keyboard navigation

### Non-Goals

- Real-time collaboration (future consideration)
- Server-side version storage (localStorage only for now)
- Visual diff rendering (text-based diff only)
- AI-powered change summaries (manual summaries for now)


## Architecture

### System Components

```
┌─────────────────────────────────────────────────────────────┐
│                      PageBuilder.tsx                         │
│  ┌──────────────┐  ┌──────────────┐  ┌──────────────┐      │
│  │ BuilderState │  │ PagesState   │  │ MenusState   │      │
│  └──────────────┘  └──────────────┘  └──────────────┘      │
│         │                  │                  │              │
│         └──────────────────┴──────────────────┘              │
│                            │                                 │
│              ┌─────────────┴─────────────┐                  │
│              │                           │                  │
│    ┌─────────▼────────┐      ┌──────────▼─────────┐        │
│    │  Version Manager │      │  Override System   │        │
│    │  - History       │      │  - Components      │        │
│    │  - Tags          │      │  - Themes          │        │
│    │  - Comparison    │      │  - Plugins         │        │
│    │  - Export/Import │      └────────────────────┘        │
│    └──────────────────┘                                     │
│              │                                               │
│    ┌─────────▼────────┐      ┌──────────────────┐          │
│    │ Field Conditions │      │  Search Engine   │          │
│    │  - Evaluator     │      │  - Index         │          │
│    │  - Dependencies  │      │  - Fuzzy Match   │          │
│    │  - Validation    │      │  - History       │          │
│    └──────────────────┘      └──────────────────┘          │
└─────────────────────────────────────────────────────────────┘
```

### Data Flow

1. **Version History Flow**
   - User saves page → Version snapshot created → Stored in localStorage
   - User tags version → Tag metadata attached to version
   - User compares versions → Diff engine calculates changes
   - User exports version → JSON file generated with content hash

2. **Component Override Flow**
   - Developer provides overrides → Validated at initialization
   - Override components receive props → Render with fallback on error
   - Theme overrides → CSS custom properties updated

3. **Field Conditions Flow**
   - Field value changes → Condition evaluator triggered
   - Conditions evaluated → Dependent fields shown/hidden
   - Dependencies executed → Dependent field values updated

4. **Search Flow**
   - User types query → Debounced search triggered
   - Query processed → Fuzzy matching against index
   - Results ranked → Displayed with highlights
   - User selects result → Block added to canvas


## Components and Interfaces

### 1. Version History System

#### Version Manager (`src/page-builder/version-history.ts`)

```typescript
export interface VersionSnapshot {
  id: string;
  timestamp: string;
  blocks: BlockInstance[];
  design: DesignSettings;
  author: string;
  changeSummary: VersionChangeSummary;
  tags: VersionTag[];
  parentVersionId?: string; // For tracking restoration lineage
  contentHash: string; // SHA-256 hash for deduplication
}

export interface VersionTag {
  id: string;
  label: string;
  color: string;
  createdAt: string;
}

export interface VersionChangeSummary {
  blocksAdded: number;
  blocksRemoved: number;
  blocksModified: number;
  designChanged: boolean;
  description: string; // Auto-generated or user-provided
}

export interface VersionDiff {
  added: BlockInstance[];
  removed: BlockInstance[];
  modified: Array<{
    blockId: string;
    oldProps: Record<string, unknown>;
    newProps: Record<string, unknown>;
    propChanges: PropertyDiff[];
  }>;
  designChanges: Array<{
    key: keyof DesignSettings;
    oldValue: unknown;
    newValue: unknown;
  }>;
  similarityPercentage: number;
}

export interface PropertyDiff {
  path: string; // e.g., "props.title" or "props.items[0].text"
  oldValue: unknown;
  newValue: unknown;
  type: 'added' | 'removed' | 'modified';
}

export class VersionManager {
  private readonly MAX_VERSIONS = 50;
  private readonly STORAGE_KEY_PREFIX = 'page-version-history-';
  
  createVersion(pageId: string, blocks: BlockInstance[], design: DesignSettings): VersionSnapshot;
  getVersions(pageId: string): VersionSnapshot[];
  restoreVersion(pageId: string, versionId: string): { blocks: BlockInstance[]; design: DesignSettings };
  addTag(pageId: string, versionId: string, tag: VersionTag): void;
  removeTag(pageId: string, versionId: string, tagId: string): void;
  compareVersions(pageId: string, versionId1: string, versionId2: string): VersionDiff;
  exportVersion(pageId: string, versionId: string): string; // JSON string
  exportAllVersions(pageId: string): Blob; // ZIP archive
  importVersion(pageId: string, jsonData: string): VersionSnapshot;
  importVersionArchive(pageId: string, zipFile: Blob): VersionSnapshot[];
  private pruneOldVersions(pageId: string): void; // Remove oldest untagged versions
  private calculateContentHash(blocks: BlockInstance[], design: DesignSettings): string;
  private generateChangeSummary(oldVersion: VersionSnapshot | null, newVersion: VersionSnapshot): VersionChangeSummary;
}
```

#### Version History Panel Component (`src/page-builder/components/VersionHistoryPanel.tsx`)

```typescript
interface VersionHistoryPanelProps {
  pageId: string;
  onRestore: (blocks: BlockInstance[], design: DesignSettings) => void;
}

export function VersionHistoryPanel({ pageId, onRestore }: VersionHistoryPanelProps) {
  // Displays list of versions in reverse chronological order
  // Shows tags, timestamps, change summaries
  // Provides actions: restore, tag, compare, export
  // Supports filtering by tags
  // Implements virtualized list for performance
}
```

#### Version Comparison View (`src/page-builder/components/VersionComparisonView.tsx`)

```typescript
interface VersionComparisonViewProps {
  diff: VersionDiff;
  version1: VersionSnapshot;
  version2: VersionSnapshot;
  onRestore: (versionId: string) => void;
}

export function VersionComparisonView({ diff, version1, version2, onRestore }: VersionComparisonViewProps) {
  // Side-by-side comparison view
  // Color-coded changes (green=added, red=removed, yellow=modified)
  // Navigation controls to jump between changes
  // Similarity percentage display
  // Restore buttons for either version
}
```


### 2. Component Override System

#### Override Configuration (`src/page-builder/overrides.ts`)

```typescript
export interface ComponentOverrides {
  Toolbar?: React.ComponentType<ToolbarProps>;
  Sidebar?: React.ComponentType<SidebarProps>;
  RightPanel?: React.ComponentType<RightPanelProps>;
  Canvas?: React.ComponentType<CanvasProps>;
  // Additional overridable components
  BlockRenderer?: React.ComponentType<BlockRendererProps>;
  PropertyDrawer?: React.ComponentType<PropertyDrawerProps>;
}

export interface ThemeOverrides {
  colors?: {
    primary?: string;
    background?: string;
    foreground?: string;
    muted?: string;
    border?: string;
    success?: string;
    warning?: string;
    danger?: string;
  };
  typography?: {
    fontFamily?: string;
    fontSize?: {
      xs?: string;
      sm?: string;
      base?: string;
      lg?: string;
      xl?: string;
    };
  };
  spacing?: {
    base?: number; // Multiplier for spacing scale
  };
  borderRadius?: {
    sm?: string;
    md?: string;
    lg?: string;
    xl?: string;
  };
  shadows?: {
    sm?: string;
    md?: string;
    lg?: string;
  };
}

export interface Plugin {
  id: string;
  name: string;
  version: string;
  init: (context: PluginContext) => void | Promise<void>;
  cleanup?: () => void;
}

export interface PluginContext {
  // Editor state access
  getState: () => BuilderState;
  setState: (updater: (state: BuilderState) => BuilderState) => void;
  
  // Actions
  addBlock: (block: BlockInstance) => void;
  removeBlock: (blockId: string) => void;
  updateBlock: (blockId: string, props: Record<string, unknown>) => void;
  
  // Lifecycle hooks
  onBlockAdded: (callback: (block: BlockInstance) => void) => void;
  onBlockRemoved: (callback: (blockId: string) => void) => void;
  onSave: (callback: () => void) => void;
  
  // UI extensions
  registerToolbarAction: (action: ToolbarAction) => void;
  registerSidebarPanel: (panel: SidebarPanelDefinition) => void;
  registerBlockType: (definition: BlockDefinition) => void;
}

export interface ToolbarAction {
  id: string;
  label: string;
  icon: string;
  onClick: () => void;
  position?: 'left' | 'center' | 'right';
}

export interface SidebarPanelDefinition {
  id: string;
  label: string;
  icon: string;
  component: React.ComponentType;
}

export class OverrideManager {
  private componentOverrides: ComponentOverrides = {};
  private themeOverrides: ThemeOverrides = {};
  private plugins: Plugin[] = [];
  
  registerComponentOverrides(overrides: ComponentOverrides): void;
  registerThemeOverrides(overrides: ThemeOverrides): void;
  registerPlugins(plugins: Plugin[]): Promise<void>;
  
  getComponent<K extends keyof ComponentOverrides>(
    key: K,
    defaultComponent: ComponentOverrides[K]
  ): ComponentOverrides[K];
  
  applyTheme(): void; // Updates CSS custom properties
  
  private validateComponent(component: React.ComponentType): boolean;
  private initializePlugin(plugin: Plugin, context: PluginContext): Promise<void>;
}
```


### 3. Field Conditions System

#### Condition Evaluator (`src/page-builder/field-conditions.ts`)

```typescript
export type ConditionOperator = 
  | 'equals' 
  | 'notEquals' 
  | 'contains' 
  | 'notContains'
  | 'greaterThan' 
  | 'lessThan'
  | 'greaterThanOrEqual'
  | 'lessThanOrEqual'
  | 'in'
  | 'notIn'
  | 'isEmpty'
  | 'isNotEmpty'
  | 'custom';

export type LogicalOperator = 'AND' | 'OR';

export interface FieldCondition {
  field: string; // Field path, e.g., "props.layout" or "props.items[0].visible"
  operator: ConditionOperator;
  value?: unknown;
  customFn?: (fieldValue: unknown, blockProps: Record<string, unknown>) => boolean;
}

export interface CompositeCondition {
  operator: LogicalOperator;
  conditions: (FieldCondition | CompositeCondition)[];
}

export type Condition = FieldCondition | CompositeCondition;

export interface FieldDependency {
  type: 'copy' | 'transform' | 'compute';
  sourceFields: string[]; // Field paths
  targetField: string;
  transform?: (sourceValues: unknown[]) => unknown;
  compute?: (blockProps: Record<string, unknown>) => unknown;
}

export interface FieldValidationRule {
  type: 'required' | 'minLength' | 'maxLength' | 'pattern' | 'custom';
  value?: unknown;
  message: string;
  customFn?: (fieldValue: unknown) => boolean;
}

export interface ConditionalField {
  fieldPath: string;
  condition: Condition;
  validation?: FieldValidationRule[];
}

export class ConditionEvaluator {
  evaluateCondition(
    condition: Condition,
    blockProps: Record<string, unknown>
  ): boolean;
  
  evaluateFieldCondition(
    condition: FieldCondition,
    blockProps: Record<string, unknown>
  ): boolean;
  
  evaluateCompositeCondition(
    condition: CompositeCondition,
    blockProps: Record<string, unknown>
  ): boolean;
  
  getFieldValue(fieldPath: string, blockProps: Record<string, unknown>): unknown;
  
  private compareValues(
    operator: ConditionOperator,
    fieldValue: unknown,
    compareValue: unknown
  ): boolean;
}

export class DependencyManager {
  private dependencies: Map<string, FieldDependency[]> = new Map();
  private circularDependencyCache: Set<string> = new Set();
  
  registerDependency(blockType: string, dependency: FieldDependency): void;
  
  executeDependencies(
    blockType: string,
    changedField: string,
    blockProps: Record<string, unknown>
  ): Record<string, unknown>;
  
  detectCircularDependencies(blockType: string): boolean;
  
  private executeDependency(
    dependency: FieldDependency,
    blockProps: Record<string, unknown>
  ): unknown;
}

export class ValidationEngine {
  validateField(
    fieldPath: string,
    fieldValue: unknown,
    rules: FieldValidationRule[]
  ): { valid: boolean; errors: string[] };
  
  validateBlock(
    blockProps: Record<string, unknown>,
    conditionalFields: ConditionalField[],
    evaluator: ConditionEvaluator
  ): { valid: boolean; fieldErrors: Record<string, string[]> };
  
  private validateRule(
    rule: FieldValidationRule,
    fieldValue: unknown
  ): { valid: boolean; error?: string };
}
```

#### Conditional Field Hook (`src/page-builder/hooks/useConditionalFields.ts`)

```typescript
export function useConditionalFields(
  blockType: string,
  blockProps: Record<string, unknown>,
  conditionalFields: ConditionalField[]
) {
  const [visibleFields, setVisibleFields] = useState<Set<string>>(new Set());
  const [fieldErrors, setFieldErrors] = useState<Record<string, string[]>>({});
  
  // Re-evaluate conditions when props change
  useEffect(() => {
    const evaluator = new ConditionEvaluator();
    const visible = new Set<string>();
    
    for (const cf of conditionalFields) {
      if (evaluator.evaluateCondition(cf.condition, blockProps)) {
        visible.add(cf.fieldPath);
      }
    }
    
    setVisibleFields(visible);
  }, [blockProps, conditionalFields]);
  
  const isFieldVisible = (fieldPath: string): boolean => {
    return visibleFields.has(fieldPath);
  };
  
  const validateVisibleFields = (): boolean => {
    const validator = new ValidationEngine();
    const evaluator = new ConditionEvaluator();
    const result = validator.validateBlock(blockProps, conditionalFields, evaluator);
    setFieldErrors(result.fieldErrors);
    return result.valid;
  };
  
  return { isFieldVisible, fieldErrors, validateVisibleFields };
}
```


### 4. Enhanced Search System

#### Search Engine (`src/page-builder/search-engine.ts`)

```typescript
export interface SearchableItem {
  id: string;
  type: 'block' | 'component';
  label: string;
  category: string;
  description: string;
  keywords: string[]; // Additional searchable terms
  definition: BlockDefinition | ComponentDefinition;
}

export interface SearchResult {
  item: SearchableItem;
  score: number; // Relevance score (0-1)
  matches: SearchMatch[];
}

export interface SearchMatch {
  field: 'label' | 'description' | 'keywords';
  text: string;
  indices: number[][]; // Character ranges that matched
}

export interface SearchQuery {
  text: string;
  category?: string; // Filter by category
  minScore?: number; // Minimum relevance threshold
}

export interface SearchHistory {
  queries: string[];
  maxSize: number;
}

export class SearchIndex {
  private items: SearchableItem[] = [];
  private indexMap: Map<string, SearchableItem> = new Map();
  
  build(blocks: BlockDefinition[], components: ComponentDefinition[]): void;
  update(item: SearchableItem): void;
  remove(id: string): void;
  getAll(): SearchableItem[];
  
  private createSearchableItem(
    definition: BlockDefinition | ComponentDefinition,
    type: 'block' | 'component'
  ): SearchableItem;
}

export class FuzzyMatcher {
  private readonly MATCH_THRESHOLD = 0.6;
  
  match(query: string, text: string): { score: number; indices: number[][] } | null;
  
  private calculateScore(query: string, text: string, indices: number[][]): number;
  private findMatchIndices(query: string, text: string): number[][] | null;
  
  // Levenshtein distance for fuzzy matching
  private levenshteinDistance(a: string, b: string): number;
}

export class SearchEngine {
  private index: SearchIndex;
  private matcher: FuzzyMatcher;
  private history: SearchHistory;
  private resultCache: Map<string, SearchResult[]> = new Map();
  
  constructor(
    blocks: BlockDefinition[],
    components: ComponentDefinition[],
    historySize: number = 10
  ) {
    this.index = new SearchIndex();
    this.index.build(blocks, components);
    this.matcher = new FuzzyMatcher();
    this.history = { queries: [], maxSize: historySize };
  }
  
  search(query: SearchQuery): SearchResult[];
  
  addToHistory(query: string): void;
  getHistory(): string[];
  clearHistory(): void;
  
  clearCache(): void;
  
  private rankResults(results: SearchResult[]): SearchResult[];
  private searchItem(item: SearchableItem, query: string): SearchResult | null;
}
```

#### Search Component (`src/page-builder/components/EnhancedSearch.tsx`)

```typescript
interface EnhancedSearchProps {
  onSelectBlock: (blockType: BlockType) => void;
  onSelectComponent: (componentType: ComponentType) => void;
}

export function EnhancedSearch({ onSelectBlock, onSelectComponent }: EnhancedSearchProps) {
  const [query, setQuery] = useState('');
  const [results, setResults] = useState<SearchResult[]>([]);
  const [selectedIndex, setSelectedIndex] = useState(0);
  const [categoryFilter, setCategoryFilter] = useState<string | null>(null);
  const [showHistory, setShowHistory] = useState(false);
  
  const searchEngine = useRef(new SearchEngine(BLOCK_DEFINITIONS, COMPONENT_DEFINITIONS));
  
  // Debounced search (150ms)
  const debouncedSearch = useMemo(
    () => debounce((q: string) => {
      if (!q.trim()) {
        setResults([]);
        return;
      }
      
      const searchResults = searchEngine.current.search({
        text: q,
        category: categoryFilter || undefined,
        minScore: 0.6,
      });
      
      setResults(searchResults.slice(0, 50)); // Limit to 50 results
      setSelectedIndex(0);
    }, 150),
    [categoryFilter]
  );
  
  // Keyboard navigation
  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'ArrowDown') {
      e.preventDefault();
      setSelectedIndex((i) => Math.min(i + 1, results.length - 1));
    } else if (e.key === 'ArrowUp') {
      e.preventDefault();
      setSelectedIndex((i) => Math.max(i - 1, 0));
    } else if (e.key === 'Enter' && results[selectedIndex]) {
      e.preventDefault();
      handleSelectResult(results[selectedIndex]);
    } else if (e.key === 'Escape') {
      setQuery('');
      setResults([]);
    } else if (e.key === 'Tab') {
      e.preventDefault();
      // Cycle through category filters
    }
  };
  
  const handleSelectResult = (result: SearchResult) => {
    searchEngine.current.addToHistory(query);
    if (result.item.type === 'block') {
      onSelectBlock(result.item.definition.type as BlockType);
    } else {
      onSelectComponent(result.item.definition.type as ComponentType);
    }
    setQuery('');
    setResults([]);
  };
  
  // Render search input, results list with highlights, category filters, history
}
```


## Data Models

### Version History Storage

```typescript
// localStorage key pattern: 'page-version-history-{pageId}'
interface VersionHistoryStorage {
  versions: VersionSnapshot[];
  maxVersions: number;
}

// Example stored data:
{
  "versions": [
    {
      "id": "v-1234567890",
      "timestamp": "2026-01-15T10:30:00.000Z",
      "blocks": [...],
      "design": {...},
      "author": "user@example.com",
      "changeSummary": {
        "blocksAdded": 2,
        "blocksRemoved": 0,
        "blocksModified": 1,
        "designChanged": true,
        "description": "Added hero section, modified navbar, changed primary color"
      },
      "tags": [
        {
          "id": "tag-1",
          "label": "Launch Ready",
          "color": "#10B981",
          "createdAt": "2026-01-15T11:00:00.000Z"
        }
      ],
      "parentVersionId": "v-1234567880",
      "contentHash": "a3f5b8c9d2e1..."
    }
  ],
  "maxVersions": 50
}
```

### Component Override Configuration

```typescript
// Passed to PageBuilder at initialization
interface PageBuilderConfig {
  componentOverrides?: ComponentOverrides;
  themeOverrides?: ThemeOverrides;
  plugins?: Plugin[];
  fieldConditions?: Record<string, ConditionalField[]>; // Keyed by block type
  fieldDependencies?: Record<string, FieldDependency[]>; // Keyed by block type
}

// Example usage:
const config: PageBuilderConfig = {
  themeOverrides: {
    colors: {
      primary: '#FF6B6B',
      background: '#1A1A1A',
    },
    typography: {
      fontFamily: 'Inter, sans-serif',
    },
  },
  plugins: [
    {
      id: 'analytics-plugin',
      name: 'Analytics Tracker',
      version: '1.0.0',
      init: (context) => {
        context.onSave(() => {
          console.log('Page saved!');
        });
      },
    },
  ],
};
```

### Field Conditions Configuration

```typescript
// Example: Show "subtitle" field only when "showSubtitle" is true
const heroConditions: ConditionalField[] = [
  {
    fieldPath: 'props.subtitle',
    condition: {
      field: 'props.showSubtitle',
      operator: 'equals',
      value: true,
    },
    validation: [
      {
        type: 'required',
        message: 'Subtitle is required when enabled',
      },
      {
        type: 'maxLength',
        value: 200,
        message: 'Subtitle must be less than 200 characters',
      },
    ],
  },
  {
    fieldPath: 'props.ctaSecondary',
    condition: {
      operator: 'AND',
      conditions: [
        {
          field: 'props.layout',
          operator: 'equals',
          value: 'two-column',
        },
        {
          field: 'props.showCTA',
          operator: 'equals',
          value: true,
        },
      ],
    },
  },
];

// Example: Copy "title" to "metaTitle" when metaTitle is empty
const heroDependencies: FieldDependency[] = [
  {
    type: 'copy',
    sourceFields: ['props.title'],
    targetField: 'props.metaTitle',
  },
  {
    type: 'transform',
    sourceFields: ['props.title'],
    targetField: 'props.slug',
    transform: (values) => {
      const title = values[0] as string;
      return title.toLowerCase().replace(/\s+/g, '-');
    },
  },
  {
    type: 'compute',
    sourceFields: ['props.items'],
    targetField: 'props.itemCount',
    compute: (props) => {
      const items = props.items as unknown[];
      return items?.length || 0;
    },
  },
];
```

### Search Index Structure

```typescript
// In-memory search index (rebuilt on initialization)
interface SearchIndexData {
  items: SearchableItem[];
  categoryMap: Map<string, SearchableItem[]>;
  typeMap: Map<'block' | 'component', SearchableItem[]>;
}

// localStorage key: 'page-builder-search-history'
interface SearchHistoryStorage {
  queries: string[];
  timestamp: string;
}
```

### Page Settings Extension

```typescript
// Extended PageSettings to include draft status
export interface PageSettings {
  title: string;
  slug: string;
  description: string;
  ogImage: string;
  published: boolean; // Draft mode flag
  createdAt: string;
  updatedAt: string;
  customCSS: string;
  headCode: string;
  bodyCode: string;
}
```


## Correctness Properties

*A property is a characteristic or behavior that should hold true across all valid executions of a system—essentially, a formal statement about what the system should do. Properties serve as the bridge between human-readable specifications and machine-verifiable correctness guarantees.*

### Property Reflection

After analyzing all acceptance criteria, I identified the following redundancies and consolidations:

**Redundancies Eliminated:**
- 1.4 and 1.5 (badge display) → Combined into Property 1 (badge rendering based on published status)
- 2.4 (reverse chronological order) → Subsumed by general version list rendering
- 4.3, 4.4, 4.5 (color highlighting) → Combined into Property 11 (diff highlighting)
- 5.6 and 5.7 (ZIP export) → Combined into Property 14 (batch export)
- 6.1 and 6.2 (button text) → Combined into Property 16 (publish button text)
- 13.2 and 13.3 (result ranking) → Combined into Property 24 (search ranking)

**Properties Consolidated:**
- Version creation (2.1, 2.7) → Property 3 covers both initial creation and restoration
- Tag operations (3.3, 3.6, 3.8) → Property 7 covers all tag management
- Dependency types (11.4, 11.5, 11.6) → Property 31 covers all dependency execution
- Validation types (12.6) → Covered by examples, not a separate property


### Property 1: Draft mode default state

*For any* newly created page, the published field should be set to false by default.

**Validates: Requirements 1.1**

### Property 2: Publishing updates status and timestamp

*For any* draft page (published=false), when the publish action is executed, the published field should be set to true and the updatedAt timestamp should be updated to the current time.

**Validates: Requirements 1.2**

### Property 3: Unpublishing reverts status

*For any* published page (published=true), when the unpublish action is executed, the published field should be set to false.

**Validates: Requirements 1.3**

### Property 4: Badge rendering reflects published status

*For any* page, the badge display function should return "Draft" when published is false and "Published" when published is true.

**Validates: Requirements 1.4, 1.5**

### Property 5: Draft preview indicator

*For any* draft page (published=false), when rendered in preview mode, the preview component should include a "Draft Preview" indicator.

**Validates: Requirements 1.6**

### Property 6: Publish validation requires non-empty fields

*For any* page, attempting to publish should fail validation if required fields (title or slug) are empty strings or contain only whitespace.

**Validates: Requirements 1.7, 1.8**

### Property 7: Version creation includes all required data

*For any* page state (blocks + design), when a version is created, the resulting VersionSnapshot should contain a timestamp, blocks snapshot, design snapshot, auto-generated change summary, and a unique content hash.

**Validates: Requirements 2.1**

### Property 8: Version history respects maximum limit

*For any* page with 50 or more versions, when a new version is created, the total number of stored versions should not exceed 50.

**Validates: Requirements 2.2**

### Property 9: Oldest untagged version is pruned

*For any* page with 50 versions where at least one version is untagged, when a new version is created, the oldest untagged version should be removed from storage.

**Validates: Requirements 2.3**

### Property 10: Version restoration replaces current state

*For any* historical version, when restored, the current page blocks and design should match the restored version's blocks and design exactly.

**Validates: Requirements 2.6**

### Property 11: Restoration creates new version with lineage

*For any* version restoration, a new VersionSnapshot should be created with a parentVersionId field pointing to the restored version's ID.

**Validates: Requirements 2.7**

### Property 12: Change summary accurately counts modifications

*For any* two consecutive versions, the change summary should correctly count the number of blocks added, blocks removed, blocks modified, and whether design settings changed.

**Validates: Requirements 2.9**

### Property 13: Tag label length validation

*For any* tag label, if the label exceeds 50 characters, the tag creation should be rejected with a validation error.

**Validates: Requirements 3.2**

### Property 14: Tag association persists with version

*For any* version and tag, when the tag is added to the version, the version's tags array should contain that tag, and retrieving the version should return the tag.

**Validates: Requirements 3.3**

### Property 15: Tag filtering returns only tagged versions

*For any* tag filter query, the returned versions should only include versions that have at least one tag matching the filter criteria.

**Validates: Requirements 3.5, 3.9**

### Property 16: Tag removal preserves version

*For any* version with tags, when a tag is removed, the version should still exist in storage with the tag removed from its tags array.

**Validates: Requirements 3.6**

### Property 17: Tagged versions protected from pruning

*For any* page at the version limit, when pruning occurs, no version with tags should be removed regardless of age.

**Validates: Requirements 3.7**

### Property 18: Multiple tags per version

*For any* version, adding multiple distinct tags should result in all tags being stored in the version's tags array.

**Validates: Requirements 3.8**

### Property 19: Version comparison orders by timestamp

*For any* two versions being compared, the comparison view should display the version with the earlier timestamp on the left and the later timestamp on the right.

**Validates: Requirements 4.2**

### Property 20: Property diff shows old and new values

*For any* modified block in a version diff, the property diff should include the old value and new value for each changed property.

**Validates: Requirements 4.6**

### Property 21: Similarity percentage calculation

*For any* two versions, the calculated similarity percentage should be between 0 and 100, where 100 means identical and 0 means completely different.

**Validates: Requirements 4.9**

### Property 22: Version export produces valid JSON

*For any* version, exporting should produce a valid JSON string that can be parsed back into a VersionSnapshot object with all fields intact.

**Validates: Requirements 5.1, 5.2**

### Property 23: Import validation rejects invalid data

*For any* import attempt with invalid JSON or missing required fields (id, timestamp, blocks, design, contentHash), the import should fail with a descriptive error message.

**Validates: Requirements 5.3, 5.5**

### Property 24: Valid import adds to history

*For any* valid version JSON, importing should add a new VersionSnapshot to the page's version history.

**Validates: Requirements 5.4**

### Property 25: Batch export creates ZIP archive

*For any* set of versions, exporting all versions should create a ZIP file containing individual JSON files for each version.

**Validates: Requirements 5.6, 5.7**

### Property 26: Export includes parent-child relationships

*For any* version with a parentVersionId, the exported JSON should include the parentVersionId field.

**Validates: Requirements 5.8**

### Property 27: Import preserves tags

*For any* imported version with tags, the imported VersionSnapshot should retain all tag associations from the original export.

**Validates: Requirements 5.9**

### Property 28: Content hash prevents duplicates

*For any* import attempt where a version with the same content hash already exists, the import should either reject the duplicate or merge it without creating a new version.

**Validates: Requirements 5.10**

### Property 29: Publish button text reflects status

*For any* page, the toolbar publish button should display "Publish" when published is false and "Unpublish" when published is true.

**Validates: Requirements 6.1, 6.2**

### Property 30: Draft watermark in HTML export

*For any* draft page (published=false), the exported HTML should contain a comment indicating draft status.

**Validates: Requirements 6.4**

### Property 31: Draft comment in React export

*For any* draft page (published=false), the exported React component should contain a comment indicating draft status.

**Validates: Requirements 6.5**

### Property 32: Draft status persists to localStorage

*For any* page, saving to localStorage and then loading should preserve the published field value.

**Validates: Requirements 6.6**

### Property 33: Component override replaces default

*For any* overridden component (Toolbar, Sidebar, RightPanel, Canvas), the custom implementation should be rendered instead of the default component.

**Validates: Requirements 7.2**

### Property 34: Invalid override falls back to default

*For any* component override that throws an error during render, the default component should be rendered instead.

**Validates: Requirements 7.4**

### Property 35: Override components receive correct props

*For any* overridden component, the props passed to the custom component should match the interface of the default component.

**Validates: Requirements 7.5**

### Property 36: Theme overrides update CSS properties

*For any* theme override (colors, typography, spacing, borderRadius), the corresponding CSS custom properties in the DOM should be updated to match the override values.

**Validates: Requirements 8.2, 8.4**

### Property 37: Invalid theme values ignored

*For any* theme override with invalid values (e.g., malformed color strings), the invalid values should be ignored and default values used instead.

**Validates: Requirements 8.5**

### Property 38: Unspecified theme properties use defaults

*For any* theme property not included in themeOverrides, the default theme value should be used.

**Validates: Requirements 8.6**

### Property 39: Plugin initialization receives context

*For any* registered plugin, the init function should be called with a PluginContext object containing getState, setState, and action methods.

**Validates: Requirements 9.2, 9.3**

### Property 40: Plugin toolbar actions appear in toolbar

*For any* plugin that registers a toolbar action, the action should appear in the toolbar UI with the specified label and icon.

**Validates: Requirements 9.4**

### Property 41: Plugin sidebar panels appear in sidebar

*For any* plugin that registers a sidebar panel, the panel should appear in the sidebar navigation with the specified label and icon.

**Validates: Requirements 9.5**

### Property 42: Plugin block types available in blocks panel

*For any* plugin that registers a block type, the block should be available in the blocks panel for dragging onto the canvas.

**Validates: Requirements 9.6**

### Property 43: Plugin errors don't prevent other plugins

*For any* plugin that throws an error during initialization, other plugins should still be initialized successfully.

**Validates: Requirements 9.7**

### Property 44: Plugin cleanup called on unmount

*For any* plugin with a cleanup function, the cleanup function should be called when the editor component unmounts.

**Validates: Requirements 9.8**

### Property 45: Condition evaluation determines field visibility

*For any* field with a condition, when the condition evaluates to false, the field should not be visible in the RightPanel; when true, it should be visible.

**Validates: Requirements 10.4, 10.5**

### Property 46: Field value changes trigger re-evaluation

*For any* field that is referenced in other fields' conditions, changing that field's value should trigger re-evaluation of all dependent conditions.

**Validates: Requirements 10.6**

### Property 47: Composite conditions with AND/OR

*For any* composite condition using AND, all sub-conditions must be true for the condition to be true; for OR, at least one sub-condition must be true.

**Validates: Requirements 10.7**

### Property 48: Hidden fields preserve values

*For any* field that is hidden by a condition, the field's value in block props should remain unchanged.

**Validates: Requirements 10.8**

### Property 49: Source field changes execute dependencies

*For any* field with dependencies, when the source field changes, all dependency functions targeting that field should be executed.

**Validates: Requirements 11.2**

### Property 50: Copy dependency sets target to source value

*For any* copy dependency, the target field should be set to exactly the same value as the source field.

**Validates: Requirements 11.4**

### Property 51: Transform dependency applies function

*For any* transform dependency, the target field should be set to the result of applying the transform function to the source field value.

**Validates: Requirements 11.5**

### Property 52: Compute dependency calculates from multiple sources

*For any* compute dependency, the target field should be set to the result of the compute function applied to all source field values.

**Validates: Requirements 11.6**

### Property 53: Dependency errors don't corrupt data

*For any* dependency function that throws an error, the target field should remain unchanged and the error should be logged.

**Validates: Requirements 11.7**

### Property 54: Circular dependencies detected

*For any* set of field dependencies that form a cycle (A depends on B, B depends on A), the system should detect the circular dependency and log a warning.

**Validates: Requirements 11.8**

### Property 55: Hidden fields skip validation

*For any* field that is hidden by a condition, validation rules for that field should not be executed.

**Validates: Requirements 12.1**

### Property 56: Visible fields apply validation

*For any* field that becomes visible (condition evaluates to true), validation rules for that field should be executed.

**Validates: Requirements 12.2**

### Property 57: Invalid fields prevent saving

*For any* page with visible fields that fail validation, attempting to save should display validation errors and prevent the save operation.

**Validates: Requirements 12.3**

### Property 58: Valid fields allow saving

*For any* page where all visible fields pass validation, the save operation should be allowed to proceed.

**Validates: Requirements 12.5**

### Property 59: Validation errors include messages

*For any* field that fails validation, the validation error should include a descriptive error message specific to the failed rule.

**Validates: Requirements 12.7**

### Property 60: Fuzzy search finds approximate matches

*For any* search query, the search engine should return results that approximately match the query even if they don't match exactly, using fuzzy matching with a minimum similarity threshold of 60%.

**Validates: Requirements 13.1, 13.5**

### Property 61: Search results ranked by relevance

*For any* search query with multiple results, the results should be ordered by relevance score in descending order (highest score first).

**Validates: Requirements 13.2, 13.3**

### Property 62: Search debounced to 150ms

*For any* sequence of search input changes, the search function should not execute more frequently than once every 150 milliseconds.

**Validates: Requirements 13.7**

### Property 63: Search adds to history

*For any* search query executed, the query string should be added to the search history.

**Validates: Requirements 14.1**

### Property 64: Search history limited to 10 entries

*For any* search history, the number of stored queries should not exceed 10, with oldest queries removed when the limit is exceeded.

**Validates: Requirements 14.2**

### Property 65: Clear history removes all entries

*For any* search history, when the clear action is executed, all stored queries should be removed.

**Validates: Requirements 14.5**

### Property 66: Search history persists to localStorage

*For any* search history, saving to localStorage and then loading should preserve all query strings.

**Validates: Requirements 14.6**

### Property 67: Search history deduplicated

*For any* search query that already exists in history, adding it again should not create a duplicate entry.

**Validates: Requirements 14.7**

### Property 68: Keyboard navigation moves selection

*For any* search results list, pressing the down arrow key should move the selection to the next result, and pressing the up arrow key should move to the previous result.

**Validates: Requirements 15.2, 15.3**

### Property 69: Enter key selects highlighted result

*For any* highlighted search result, pressing the Enter key should select that result and trigger the appropriate action (add block or component).

**Validates: Requirements 15.4**

### Property 70: Escape key clears search

*For any* active search with results displayed, pressing the Escape key should clear the search query and close the results.

**Validates: Requirements 15.5**

### Property 71: Tab key cycles categories

*For any* search with category filters, pressing the Tab key should cycle through the available category filters.

**Validates: Requirements 15.6**

### Property 72: Search index updates with definitions

*For any* change to block or component definitions, the search index should be updated to reflect the new definitions.

**Validates: Requirements 16.2**

### Property 73: Search results cached for identical queries

*For any* search query, if the same query is executed again without clearing the cache, the cached results should be returned instead of re-executing the search.

**Validates: Requirements 16.5**

### Property 74: Cache cleared when search cleared

*For any* search cache, when the search input is cleared, the cache should be emptied.

**Validates: Requirements 16.6**

### Property 75: Search results limited to 50 items

*For any* search query, the number of returned results should not exceed 50 items.

**Validates: Requirements 16.7**

### Property 76: Category filter shows only matching results

*For any* selected category filter, the displayed search results should only include items from that category.

**Validates: Requirements 17.2**

### Property 77: All filter shows unfiltered results

*For any* search query, when the "All" category filter is selected, results from all categories should be displayed.

**Validates: Requirements 17.4**

### Property 78: Empty categories disabled

*For any* category with zero matching results, the category filter button should be disabled.

**Validates: Requirements 17.6**

### Property 79: Category filter persists during session

*For any* selected category filter, the selection should persist across multiple searches until the session ends or the filter is changed.

**Validates: Requirements 17.7**

### Property 80: Component overrides config round-trip

*For any* valid componentOverrides object, parsing it to a configuration string, then parsing that string back, should produce an equivalent object.

**Validates: Requirements 18.4**

### Property 81: Invalid config returns error

*For any* invalid component overrides configuration, the parser should return a descriptive error message indicating what is invalid.

**Validates: Requirements 18.2**

### Property 82: Field conditions config round-trip

*For any* valid fieldConditions object, parsing it to a configuration string, then parsing that string back, should produce an equivalent object.

**Validates: Requirements 19.4**

### Property 83: Invalid condition syntax returns error

*For any* invalid field condition syntax, the parser should return a descriptive error message indicating what is invalid.

**Validates: Requirements 19.2**


## Error Handling

### Version History Errors

1. **Storage Quota Exceeded**
   - Detection: Catch localStorage quota errors during version save
   - Recovery: Prune additional old versions beyond normal limit, notify user
   - Fallback: Disable version history temporarily, log error

2. **Corrupted Version Data**
   - Detection: JSON parse errors or missing required fields
   - Recovery: Skip corrupted version, load remaining versions
   - Fallback: Initialize empty version history

3. **Content Hash Collision**
   - Detection: Different content produces same hash (extremely rare)
   - Recovery: Append timestamp to hash for uniqueness
   - Fallback: Allow duplicate with warning

4. **Import Validation Failures**
   - Detection: Invalid JSON structure, missing fields, type mismatches
   - Recovery: Display specific error message to user
   - Fallback: Reject import, preserve existing versions

### Component Override Errors

1. **Invalid Component Type**
   - Detection: Override is not a valid React component
   - Recovery: Log warning, use default component
   - Fallback: Continue with default components

2. **Component Render Error**
   - Detection: Component throws error during render
   - Recovery: Catch error with error boundary, render default component
   - Fallback: Display error message in dev mode

3. **Missing Required Props**
   - Detection: PropTypes validation or runtime checks
   - Recovery: Log warning with missing prop names
   - Fallback: Provide default prop values where possible

4. **Theme Override Validation**
   - Detection: Invalid color format, malformed CSS values
   - Recovery: Ignore invalid values, use defaults
   - Fallback: Log validation errors for debugging

### Field Condition Errors

1. **Circular Dependency Detection**
   - Detection: Graph traversal finds cycle in dependencies
   - Recovery: Break cycle by ignoring last dependency in chain
   - Fallback: Log warning with dependency path

2. **Condition Evaluation Error**
   - Detection: Custom condition function throws error
   - Recovery: Treat condition as false, log error
   - Fallback: Show field by default (fail-open)

3. **Dependency Function Error**
   - Detection: Transform/compute function throws error
   - Recovery: Leave target field unchanged, log error
   - Fallback: Preserve last valid value

4. **Validation Rule Error**
   - Detection: Custom validation function throws error
   - Recovery: Treat validation as passed, log error
   - Fallback: Allow save to proceed (fail-open for user convenience)

### Search Engine Errors

1. **Index Build Failure**
   - Detection: Error during index initialization
   - Recovery: Retry index build once
   - Fallback: Use linear search through definitions (slower)

2. **Fuzzy Match Algorithm Error**
   - Detection: Matcher throws error on specific input
   - Recovery: Fall back to exact string matching
   - Fallback: Return empty results for problematic query

3. **Cache Corruption**
   - Detection: Cached results don't match expected structure
   - Recovery: Clear cache, re-execute search
   - Fallback: Disable caching for session

4. **History Storage Error**
   - Detection: localStorage write fails
   - Recovery: Continue without persisting history
   - Fallback: Use in-memory history only

### Plugin System Errors

1. **Plugin Initialization Failure**
   - Detection: Plugin init function throws error
   - Recovery: Log error, continue loading other plugins
   - Fallback: Skip failed plugin, notify user in console

2. **Plugin Lifecycle Hook Error**
   - Detection: Registered callback throws error
   - Recovery: Log error, continue executing other callbacks
   - Fallback: Unregister problematic callback

3. **Plugin Cleanup Error**
   - Detection: Cleanup function throws error
   - Recovery: Log error, continue cleanup of other plugins
   - Fallback: Force unmount despite error


## Testing Strategy

### Dual Testing Approach

This feature requires both **unit tests** and **property-based tests** for comprehensive coverage:

- **Unit tests** verify specific examples, edge cases, and error conditions
- **Property-based tests** verify universal properties across all inputs
- Together they provide comprehensive coverage: unit tests catch concrete bugs, property tests verify general correctness

### Unit Testing Focus

Unit tests should focus on:

1. **Specific Examples**
   - Creating a page with default published=false
   - Publishing a specific page and verifying timestamp update
   - Tagging a specific version with a known label
   - Importing a known valid version JSON

2. **Edge Cases**
   - Empty search queries
   - Version history at exactly 50 versions
   - Tag labels at exactly 50 characters
   - Circular dependencies with 2 fields (A→B→A)
   - Search with no results

3. **Error Conditions**
   - Publishing with empty title
   - Importing invalid JSON
   - Component override that throws error
   - Custom validation function that throws error
   - localStorage quota exceeded

4. **Integration Points**
   - Version manager integration with localStorage
   - Plugin context integration with editor state
   - Search engine integration with block definitions
   - Condition evaluator integration with RightPanel

### Property-Based Testing Configuration

**Library Selection:**
- **JavaScript/TypeScript**: Use `fast-check` library
- Installation: `npm install --save-dev fast-check`

**Test Configuration:**
- Minimum 100 iterations per property test (due to randomization)
- Each property test must reference its design document property
- Tag format: `// Feature: editor-enhancements, Property {number}: {property_text}`

**Example Property Test Structure:**

```typescript
import fc from 'fast-check';

// Feature: editor-enhancements, Property 1: Draft mode default state
test('newly created pages default to draft mode', () => {
  fc.assert(
    fc.property(
      fc.string({ minLength: 1, maxLength: 100 }), // page name
      (pageName) => {
        const page = createPage(pageName);
        expect(page.settings.published).toBe(false);
      }
    ),
    { numRuns: 100 }
  );
});

// Feature: editor-enhancements, Property 7: Version creation includes all required data
test('version creation includes all required fields', () => {
  fc.assert(
    fc.property(
      fc.array(fc.anything()), // blocks
      fc.record({ mood: fc.constantFrom('light', 'dark') }), // design
      (blocks, design) => {
        const version = versionManager.createVersion('page-1', blocks, design);
        expect(version).toHaveProperty('id');
        expect(version).toHaveProperty('timestamp');
        expect(version).toHaveProperty('blocks');
        expect(version).toHaveProperty('design');
        expect(version).toHaveProperty('changeSummary');
        expect(version).toHaveProperty('contentHash');
      }
    ),
    { numRuns: 100 }
  );
});

// Feature: editor-enhancements, Property 60: Fuzzy search finds approximate matches
test('fuzzy search finds approximate matches above threshold', () => {
  fc.assert(
    fc.property(
      fc.string({ minLength: 3, maxLength: 20 }), // query
      (query) => {
        const results = searchEngine.search({ text: query, minScore: 0.6 });
        // All results should have score >= 0.6
        results.forEach(result => {
          expect(result.score).toBeGreaterThanOrEqual(0.6);
        });
      }
    ),
    { numRuns: 100 }
  );
});
```

### Test Organization

```
src/page-builder/
├── __tests__/
│   ├── version-history.test.ts          # Unit tests for version management
│   ├── version-history.property.test.ts # Property tests for version management
│   ├── overrides.test.ts                # Unit tests for component overrides
│   ├── overrides.property.test.ts       # Property tests for overrides
│   ├── field-conditions.test.ts         # Unit tests for conditions
│   ├── field-conditions.property.test.ts # Property tests for conditions
│   ├── search-engine.test.ts            # Unit tests for search
│   └── search-engine.property.test.ts   # Property tests for search
```

### Property Test Generators

**Custom Generators for Domain Objects:**

```typescript
// Generator for valid page names
const pageNameArb = fc.string({ minLength: 1, maxLength: 100 })
  .filter(s => s.trim().length > 0);

// Generator for block instances
const blockInstanceArb = fc.record({
  id: fc.string(),
  type: fc.constantFrom('hero', 'navbar', 'footer', 'text'),
  props: fc.dictionary(fc.string(), fc.anything()),
});

// Generator for version tags
const versionTagArb = fc.record({
  id: fc.string(),
  label: fc.string({ maxLength: 50 }),
  color: fc.hexaString({ minLength: 6, maxLength: 6 }).map(s => `#${s}`),
  createdAt: fc.date().map(d => d.toISOString()),
});

// Generator for field conditions
const fieldConditionArb = fc.record({
  field: fc.string(),
  operator: fc.constantFrom('equals', 'notEquals', 'contains', 'greaterThan'),
  value: fc.anything(),
});

// Generator for search queries
const searchQueryArb = fc.record({
  text: fc.string({ minLength: 1, maxLength: 50 }),
  category: fc.option(fc.constantFrom('sections', 'content', 'layout', 'media')),
  minScore: fc.option(fc.double({ min: 0, max: 1 })),
});
```

### Coverage Goals

- **Unit Test Coverage**: Minimum 80% line coverage for all new code
- **Property Test Coverage**: All 83 correctness properties must have corresponding property tests
- **Integration Test Coverage**: Key user workflows (publish, version restore, search) tested end-to-end

### Performance Testing

While not part of unit/property tests, the following performance benchmarks should be validated manually:

- Search query execution: < 50ms for typical queries
- Version comparison: < 200ms for typical page sizes
- Condition evaluation: < 10ms for typical block configurations
- Plugin initialization: < 100ms per plugin

