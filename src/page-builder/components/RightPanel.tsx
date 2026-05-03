import clsx from "clsx";
import { useState, useRef } from "react";
import { Switch, Label } from "@heroui/react";
import { X, ChevronUp, ChevronDown, Copy, Trash2, AlignLeft, AlignCenter, AlignRight, AlignJustify, Globe, Monitor, Tablet, Smartphone, MousePointerClick, FileText } from "lucide-react";

import type { BlockInstance, BlockType, BlockStyleOverrides } from "../types";
import type { Page } from "../pages";
import type { ConditionalField, FieldDependency } from "../field-conditions";
import { BLOCK_DEFINITIONS } from "../data";
import { renderIcon } from "../icon-map";
import {
  ItemListEditor,
  ImagePicker,
  LinksEditor,
  RichTextEditor,
} from "./block-editors";
import { LayersPanel } from "./LayersPanel";
import { SEOAnalyzer } from "./SEOAnalyzer";
import { ColorPicker } from "./ColorPicker";
import { useConditionalFields } from "../hooks/useConditionalFields";

// ═══════════════════════════════════════════════════════════════════════════════
// Constants & Theme
// ═══════════════════════════════════════════════════════════════════════════════

const UI_COLORS = {
  PRIMARY: "#634CF8",
  PRIMARY_LIGHT_BG: "bg-[#634CF8]/10",
  PRIMARY_SOFT_BG: "bg-[#634CF8]/5",
  PRIMARY_TEXT: "text-[#634CF8]",
  PRIMARY_BORDER: "border-[#634CF8]",
  BG_LIGHT: "bg-[#FAFAFA]",
  BG_PANEL: "bg-[#F8F8FA]",
  DANGER: "text-danger",
  DANGER_BG: "hover:bg-danger/10",
} as const;

const TAB_TYPES = {
  BLOCK: ["content", "style", "advanced"] as const,
  PAGE: ["page", "seo", "layers"] as const,
} as const;

const TAB_LABELS: Record<string, string> = {
  content: "Content",
  style: "Style",
  advanced: "Advanced",
  page: "General",
  seo: "SEO",
  layers: "Layers",
};

const COMMON_CLASSES = {
  PANEL_BASE: "shrink-0 border-l border-separator/50 bg-white dark:bg-background flex flex-col overflow-hidden h-full max-md:w-full",
  HEADER: "flex items-center gap-3 px-4 py-3 border-b border-separator/40 bg-[#FAFAFA] dark:bg-surface/50",
  FIELD_LABEL: "text-[11px] font-semibold text-muted block mb-1.5",
  INPUT_BASE: "w-full h-9 rounded-lg border border-separator/50 bg-[#FAFAFA] dark:bg-surface px-3 text-[12px] text-foreground outline-none transition-all",
  INPUT_FOCUS: "focus:border-[#634CF8] focus:bg-white dark:focus:bg-background",
  SELECT_BASE: "w-full h-9 rounded-lg border border-separator/50 bg-[#FAFAFA] dark:bg-surface px-3 text-[12px] outline-none focus:border-[#634CF8]",
  TAB_BUTTON: "flex-1 py-2 text-[11px] font-semibold transition-colors border-b-2",
} as const;

// ═══════════════════════════════════════════════════════════════════════════════
// Field Configurations
// ═══════════════════════════════════════════════════════════════════════════════

type FieldConfig = {
  type: "text" | "textarea" | "number" | "select" | "image" | "links" | "items" | "richtext" | "boolean";
  key: string;
  label: string;
  placeholder?: string;
  multiline?: boolean;
  min?: number;
  max?: number;
  options?: { value: string; label: string }[];
  addLabel?: string;
  showUrl?: boolean;
  fields?: any[];
  renderPreview?: (item: any) => React.ReactNode;
};

const BLOCK_FIELD_CONFIGS: Record<string, FieldConfig[]> = {
  navbar: [
    { type: "text", key: "logo", label: "Logo" },
    { type: "links", key: "links", label: "Navigation Links", addLabel: "Add nav link", showUrl: true },
  ],
  hero: [
    { type: "text", key: "headline", label: "Headline" },
    { type: "textarea", key: "subtitle", label: "Subtitle" },
    { type: "text", key: "ctaText", label: "Button Text" },
    { type: "image", key: "heroImage", label: "Hero Image" },
  ],
  features: [
    { type: "text", key: "title", label: "Section Title" },
    { type: "textarea", key: "subtitle", label: "Subtitle" },
    {
      type: "items",
      key: "items",
      label: "Feature Items",
      addLabel: "Add feature",
      fields: [
        { key: "icon", label: "Icon (emoji)", placeholder: "⚡" },
        { key: "title", label: "Title", placeholder: "Feature name" },
        { key: "description", label: "Description", type: "textarea", placeholder: "Describe this feature..." },
      ],
      renderPreview: (item) => <span>{item.icon} {item.title}</span>,
    },
  ],
  testimonials: [
    { type: "text", key: "title", label: "Section Title" },
    {
      type: "items",
      key: "testimonials",
      label: "Testimonials",
      addLabel: "Add testimonial",
      fields: [
        { key: "quote", label: "Quote", type: "textarea", placeholder: "What they said..." },
        { key: "name", label: "Name", placeholder: "Jane Doe" },
        { key: "role", label: "Role", placeholder: "CEO at Company" },
        { key: "avatar", label: "Avatar URL", type: "url", placeholder: "https://..." },
      ],
      renderPreview: (item) => <span>{item.name || "Unnamed"}</span>,
    },
  ],
  pricing: [
    { type: "text", key: "title", label: "Title" },
    { type: "text", key: "subtitle", label: "Subtitle" },
  ],
  stats: [
    {
      type: "items",
      key: "items",
      label: "Statistics",
      addLabel: "Add stat",
      fields: [
        { key: "value", label: "Value", placeholder: "10K+" },
        { key: "label", label: "Label", placeholder: "Active users" },
      ],
      renderPreview: (item) => <span>{item.value} — {item.label}</span>,
    },
  ],
  team: [
    { type: "text", key: "title", label: "Title" },
    { type: "textarea", key: "subtitle", label: "Subtitle" },
    {
      type: "items",
      key: "members",
      label: "Team Members",
      addLabel: "Add member",
      fields: [
        { key: "name", label: "Name", placeholder: "Alex Rivera" },
        { key: "role", label: "Role", placeholder: "CEO" },
        { key: "avatar", label: "Photo URL", type: "url", placeholder: "https://..." },
      ],
      renderPreview: (item) => <span>{item.name || "Unnamed"}</span>,
    },
  ],
  faq: [
    { type: "text", key: "title", label: "Title" },
    { type: "textarea", key: "subtitle", label: "Subtitle" },
    {
      type: "items",
      key: "items",
      label: "Questions",
      addLabel: "Add question",
      fields: [
        { key: "q", label: "Question", placeholder: "How does it work?" },
        { key: "a", label: "Answer", type: "textarea", placeholder: "It's simple..." },
      ],
      renderPreview: (item) => <span>{item.q || "Untitled"}</span>,
    },
  ],
  cta: [
    { type: "text", key: "headline", label: "Headline" },
    { type: "textarea", key: "subtitle", label: "Subtitle" },
    { type: "text", key: "ctaText", label: "Button Text" },
  ],
  contact: [
    { type: "text", key: "title", label: "Title" },
    { type: "textarea", key: "subtitle", label: "Subtitle" },
  ],
  logos: [
    { type: "text", key: "title", label: "Title" },
    {
      type: "items",
      key: "items",
      label: "Logos",
      addLabel: "Add Logo",
      fields: [
        { key: "name", label: "Company Name", placeholder: "Acme Inc." },
        { key: "logo", label: "Logo Image", type: "image" },
      ],
      renderPreview: (item) => <span>{item.name || "Unnamed"}</span>,
    },
  ],
  banner: [{ type: "text", key: "text", label: "Banner Text" }],
  gallery: [
    { type: "text", key: "title", label: "Title" },
    { type: "number", key: "columns", label: "Columns", min: 1, max: 6 },
  ],
  footer: [
    { type: "text", key: "logo", label: "Logo Text" },
    { type: "textarea", key: "tagline", label: "Tagline" },
    { type: "text", key: "copyright", label: "Copyright" },
    {
      type: "items",
      key: "columns",
      label: "Footer Columns",
      addLabel: "Add column",
      fields: [
        { key: "title", label: "Column Title", placeholder: "Product" },
        { key: "linksText", label: "Links (one per line)", type: "textarea", placeholder: "Features\nPricing\nDocs" },
      ],
      renderPreview: (item) => <span>{item.title || "Untitled"}</span>,
    },
    { type: "links", key: "socials", label: "Social Links", addLabel: "Add social" },
  ],
  content: [
    { type: "text", key: "heading", label: "Heading" },
    { type: "richtext", key: "body", label: "Body", placeholder: "Write your content here..." },
  ],
  text: [{ type: "richtext", key: "content", label: "Content", placeholder: "Start writing..." }],
  image: [
    { type: "image", key: "src", label: "Image" },
    { type: "text", key: "alt", label: "Alt Text" },
    { type: "text", key: "caption", label: "Caption" },
  ],
  video: [
    { type: "text", key: "url", label: "Video URL" },
    { type: "text", key: "duration", label: "Duration", placeholder: "3:45" },
  ],
  code: [
    { type: "text", key: "filename", label: "Filename", placeholder: "app.ts" },
    { type: "text", key: "language", label: "Language", placeholder: "typescript" },
    { type: "textarea", key: "code", label: "Code" },
  ],
  html: [{ type: "textarea", key: "html", label: "HTML Code" }],
  columns: [{ type: "number", key: "count", label: "Number of Columns", min: 1, max: 6 }],
  grid: [
    { type: "number", key: "columns", label: "Columns", min: 1, max: 12 },
    { type: "text", key: "gap", label: "Gap (px)", placeholder: "16" },
    { type: "text", key: "rowGap", label: "Row Gap (optional override)" },
    { type: "text", key: "columnGap", label: "Column Gap (optional override)" },
    {
      type: "select",
      key: "justifyItems",
      label: "Justify Items",
      options: [
        { value: "start", label: "start" },
        { value: "center", label: "center" },
        { value: "end", label: "end" },
        { value: "stretch", label: "stretch" },
      ],
    },
    {
      type: "select",
      key: "alignItems",
      label: "Align Items",
      options: [
        { value: "start", label: "start" },
        { value: "center", label: "center" },
        { value: "end", label: "end" },
        { value: "stretch", label: "stretch" },
      ],
    },
    { type: "text", key: "templateColumns", label: "Template Columns (custom CSS)", placeholder: "e.g. 1fr 2fr 1fr" },
    { type: "text", key: "templateRows", label: "Template Rows (custom CSS)" },
    {
      type: "select",
      key: "autoFlow",
      label: "Auto Flow",
      options: [
        { value: "row", label: "row" },
        { value: "column", label: "column" },
        { value: "dense", label: "dense" },
      ],
    },
  ],
  "flex-container": [
    {
      type: "select",
      key: "direction",
      label: "Direction",
      options: [
        { value: "row", label: "row" },
        { value: "row-reverse", label: "row-reverse" },
        { value: "column", label: "column" },
        { value: "column-reverse", label: "column-reverse" },
      ],
    },
    { type: "text", key: "gap", label: "Gap (px)", placeholder: "16" },
    {
      type: "select",
      key: "justifyContent",
      label: "Justify Content",
      options: [
        { value: "flex-start", label: "flex-start" },
        { value: "center", label: "center" },
        { value: "flex-end", label: "flex-end" },
        { value: "space-between", label: "space-between" },
        { value: "space-around", label: "space-around" },
        { value: "space-evenly", label: "space-evenly" },
      ],
    },
    {
      type: "select",
      key: "alignItems",
      label: "Align Items",
      options: [
        { value: "flex-start", label: "flex-start" },
        { value: "center", label: "center" },
        { value: "flex-end", label: "flex-end" },
        { value: "stretch", label: "stretch" },
        { value: "baseline", label: "baseline" },
      ],
    },
    {
      type: "select",
      key: "wrap",
      label: "Wrap",
      options: [
        { value: "nowrap", label: "nowrap" },
        { value: "wrap", label: "wrap" },
        { value: "wrap-reverse", label: "wrap-reverse" },
      ],
    },
  ],
  "flex-row": [
    { type: "text", key: "gap", label: "Gap", placeholder: "1rem" },
    {
      type: "select",
      key: "justify",
      label: "Justify Content",
      options: [
        { value: "flex-start", label: "flex-start" },
        { value: "center", label: "center" },
        { value: "flex-end", label: "flex-end" },
        { value: "space-between", label: "space-between" },
        { value: "space-around", label: "space-around" },
        { value: "space-evenly", label: "space-evenly" },
      ],
    },
    {
      type: "select",
      key: "align",
      label: "Align Items",
      options: [
        { value: "flex-start", label: "flex-start" },
        { value: "center", label: "center" },
        { value: "flex-end", label: "flex-end" },
        { value: "stretch", label: "stretch" },
        { value: "baseline", label: "baseline" },
      ],
    },
  ],
  "flex-col": [
    { type: "text", key: "gap", label: "Gap", placeholder: "1rem" },
    {
      type: "select",
      key: "justify",
      label: "Justify Content",
      options: [
        { value: "flex-start", label: "flex-start" },
        { value: "center", label: "center" },
        { value: "flex-end", label: "flex-end" },
        { value: "space-between", label: "space-between" },
        { value: "space-around", label: "space-around" },
        { value: "space-evenly", label: "space-evenly" },
      ],
    },
    {
      type: "select",
      key: "align",
      label: "Align Items",
      options: [
        { value: "flex-start", label: "flex-start" },
        { value: "center", label: "center" },
        { value: "flex-end", label: "flex-end" },
        { value: "stretch", label: "stretch" },
        { value: "baseline", label: "baseline" },
      ],
    },
  ],
  container: [{ type: "text", key: "maxWidth", label: "Max Width", placeholder: "1200px" }],
  spacer: [{ type: "number", key: "height", label: "Height (px)", min: 8, max: 400 }],
  "button-group": [
    { type: "text", key: "primaryText", label: "Primary Text" },
    { type: "text", key: "secondaryText", label: "Secondary Text" },
  ],
  divider: [{ type: "text", key: "label", label: "Label (optional)", placeholder: "Section divider text" }],
  Card: [
    { type: "text", key: "title", label: "Title" },
    { type: "textarea", key: "description", label: "Description" },
  ],
  Button: [
    { type: "text", key: "text", label: "Button Text" },
    {
      type: "select",
      key: "variant",
      label: "Variant",
      options: [
        { value: "primary", label: "Primary" },
        { value: "secondary", label: "Secondary" },
        { value: "outline", label: "Outline" },
        { value: "ghost", label: "Ghost" },
      ],
    },
  ],
  Avatar: [{ type: "text", key: "name", label: "Name" }],
  Badge: [{ type: "text", key: "text", label: "Text" }],
  Chip: [{ type: "text", key: "text", label: "Text" }],
  Accordion: [
    { type: "text", key: "title", label: "Title" },
    { type: "textarea", key: "content", label: "Content" },
  ],
  Table: [
    { type: "text", key: "headers", label: "Headers (comma separated)" },
    { type: "textarea", key: "rows", label: "Rows" },
  ],
  Input: [
    { type: "text", key: "placeholder", label: "Placeholder" },
    { type: "text", key: "label", label: "Label" },
  ],
  TextField: [
    { type: "text", key: "placeholder", label: "Placeholder" },
    { type: "text", key: "label", label: "Label" },
  ],
  TextArea: [
    { type: "text", key: "placeholder", label: "Placeholder" },
    { type: "text", key: "label", label: "Label" },
  ],
};

// ═══════════════════════════════════════════════════════════════════════════════
// Dynamic Field Renderer
// ═══════════════════════════════════════════════════════════════════════════════

function DynamicFieldRenderer({
  fields,
  block,
  set,
  isFieldVisible,
  fieldErrors,
  pages = [],
}: {
  fields: FieldConfig[];
  block: BlockInstance;
  set: (key: string, value: unknown) => void;
  isFieldVisible?: (fieldName: string) => boolean;
  fieldErrors?: Record<string, string[]>;
  pages?: Page[];
}) {
  return (
    <>
      {fields.map((field) => {
        if (isFieldVisible && !isFieldVisible(field.key)) return null;

        const value = block.props[field.key];
        const errors = fieldErrors?.[field.key];

        switch (field.type) {
          case "text":
          case "textarea":
            return (
              <Field
                key={field.key}
                errors={errors}
                label={field.label}
                multiline={field.type === "textarea"}
                placeholder={field.placeholder}
                value={(value as string) || ""}
                onChange={(v) => set(field.key, v)}
              />
            );
          case "number":
            return (
              <NumberField
                key={field.key}
                label={field.label}
                max={field.max ?? 100}
                min={field.min ?? 0}
                value={(value as number) || 0}
                onChange={(v) => set(field.key, v)}
              />
            );
          case "select":
            return (
              <div key={field.key} className="mb-4">
                <label className={COMMON_CLASSES.FIELD_LABEL}>{field.label}</label>
                <select
                  className={COMMON_CLASSES.SELECT_BASE}
                  value={(value as string) || (field.options?.[0]?.value ?? "")}
                  onChange={(e) => set(field.key, e.target.value)}
                >
                  {field.options?.map((opt) => (
                    <option key={opt.value} value={opt.value}>
                      {opt.label}
                    </option>
                  ))}
                </select>
              </div>
            );
          case "boolean":
            return (
              <div key={field.key} className="flex items-center justify-between py-2">
                <label className={COMMON_CLASSES.FIELD_LABEL}>{field.label}</label>
                <Switch
                  size="sm"
                  isSelected={!!value}
                  onChange={(e: any) => set(field.key, e.target ? e.target.checked : e)}
                />
              </div>
            );
          case "image":
            return (
              <ImagePicker
                key={field.key}
                label={field.label}
                value={(value as string) || ""}
                onChange={(v) => set(field.key, v)}
              />
            );
          case "richtext":
            return (
              <RichTextEditor
                key={field.key}
                label={field.label}
                placeholder={field.placeholder}
                value={(value as string) || ""}
                onChange={(v) => set(field.key, v)}
              />
            );
          case "links":
            return (
              <LinksEditor
                key={field.key}
                addLabel={field.addLabel || "Add link"}
                items={(value as any[]) || []}
                label={field.label}
                pages={pages}
                showUrl={field.showUrl}
                onChange={(links) => set(field.key, links)}
              />
            );
          case "items":
            let itemsValue = value;
            if (field.key === "columns" && block.type === "footer") {
              itemsValue = ((value as any[]) || []).map((col) => ({
                title: col.title,
                linksText: col.links.join("\n"),
              }));
            }

            return (
              <ItemListEditor
                key={field.key}
                addLabel={field.addLabel || "Add item"}
                fields={field.fields || []}
                items={(itemsValue as any[]) || []}
                label={field.label}
                renderPreview={field.renderPreview || ((item) => <span>{JSON.stringify(item)}</span>)}
                onChange={(items) => {
                  if (field.key === "columns" && block.type === "footer") {
                    set(
                      "columns",
                      items.map((item) => ({
                        title: item.title,
                        links: (item.linksText as string).split("\n").filter((l: string) => l.trim()),
                      }))
                    );
                  } else {
                    set(field.key, items);
                  }
                }}
              />
            );
          default:
            return null;
        }
      })}
    </>
  );
}

/** Remember last active tab per block type */
type PropertyTab = "content" | "style" | "advanced";

export function RightPanel({
  block,
  blocks,
  pages,
  width,
  activePage,
  expandedLayerIds,
  onToggleExpand,
  onHoverBlock,
  onUpdate,
  onDelete,
  onMoveUp,
  onMoveDown,
  onDuplicate,
  onDeselect,
  onUpdatePageSettings,
  fieldConditions,
  fieldDependencies,
}: {
  block: BlockInstance | null;
  blocks: BlockInstance[];
  width: number;
  activePage?: Page;
  expandedLayerIds?: Set<string>;
  onToggleExpand?: (id: string) => void;
  onHoverBlock?: (id: string | null) => void;
  onUpdate: (blockId: string, props: Record<string, unknown>) => void;
  onDelete: (id: string) => void;
  onMoveUp: (id: string) => void;
  onMoveDown: (id: string) => void;
  onDuplicate: (id: string) => void;
  onDeselect: () => void;
  onUpdatePageSettings?: (
    id: string,
    settings: Partial<Page["settings"]>,
  ) => void;
  pages: Page[];
  fieldConditions?: ConditionalField[];
  fieldDependencies?: FieldDependency[];
}) {
  const [settingsTab, setSettingsTab] = useState<"page" | "seo" | "layers">(
    "page",
  );

  // Remember last active tab per block type
  const tabMemory = useRef<Map<BlockType, PropertyTab>>(new Map());

  // Must be called before any early returns to satisfy Rules of Hooks
  const [activeTab, setActiveTab] = useState<PropertyTab>("content");

  // Field conditions hook - must be called before early returns
  const { isFieldVisible, fieldErrors, dependencyManager } = useConditionalFields(
    fieldConditions ?? [],
    fieldDependencies ?? [],
    block?.props ?? {}
  );

  if (!block) {
    // Show page settings when no block is selected
    if (activePage && onUpdatePageSettings) {
      return (
        <PageSettingsPanel
          activePage={activePage}
          blocks={blocks}
          width={width}
          settingsTab={settingsTab}
          onSettingsTabChange={setSettingsTab}
          onDelete={onDelete}
          onDuplicate={onDuplicate}
          onMoveDown={onMoveDown}
          onMoveUp={onMoveUp}
          onUpdatePageSettings={onUpdatePageSettings}
          expandedLayerIds={expandedLayerIds}
          onToggleExpand={onToggleExpand}
          onHoverBlock={onHoverBlock}
        />
      );
    }

    return (
      <aside
        className={clsx(COMMON_CLASSES.PANEL_BASE, "items-center justify-center p-6 text-center")}
        style={{ width: `${width}px` }}
      >
        <div className={clsx("flex h-14 w-14 items-center justify-center rounded-lg mb-4", UI_COLORS.BG_PANEL)}>
          <span className="text-2xl"><MousePointerClick size={24} className="text-muted" /></span>
        </div>
        <p className="text-[13px] font-semibold text-foreground">
          Select a block
        </p>
        <p className="text-[11px] text-muted mt-1 max-w-[180px] leading-relaxed">
          Click any block on the canvas to edit its properties here.
        </p>
      </aside>
    );
  }

  const definition = BLOCK_DEFINITIONS.find((d) => d.type === block.type);
  const blockIndex = blocks.findIndex((b) => b.id === block.id);
  const isFirst = blockIndex === 0;
  const isLast = blockIndex === blocks.length - 1;

  // Get remembered tab for this block type, default to "content"
  const rememberedTab = tabMemory.current.get(block.type) || activeTab;

  function handleTabChange(tab: PropertyTab) {
    setActiveTab(tab);
    if (block) tabMemory.current.set(block.type, tab);
  }

  function set(key: string, value: unknown) {
    if (!block) return;
    let updatedProps = { ...block.props, [key]: value };
    // Execute field dependencies when a source field changes
    if (fieldDependencies && fieldDependencies.length > 0) {
      updatedProps = dependencyManager.executeDependencies(key, updatedProps);
    }
    onUpdate(block.id, updatedProps);
  }

  // Style overrides helper
  const styleOverrides: BlockStyleOverrides =
    (block.props._style as BlockStyleOverrides) || {};

  function setStyle(key: keyof BlockStyleOverrides, value: unknown) {
    if (!block) return;
    const current = (block.props._style as BlockStyleOverrides) || {};
    onUpdate(block.id, {
      ...block.props,
      _style: { ...current, [key]: value },
    });
  }

  return (
    <aside
      className={COMMON_CLASSES.PANEL_BASE}
      style={{ width: `${width}px` }}
    >
      {/* Header with block info and close button */}
      <div className={COMMON_CLASSES.HEADER}>
        <div className={clsx("flex h-8 w-8 items-center justify-center rounded-lg text-sm", UI_COLORS.PRIMARY_LIGHT_BG, UI_COLORS.PRIMARY_TEXT)}>
          {renderIcon(definition?.icon || "")}
        </div>
        <div className="flex-1 min-w-0">
          <p className="text-[13px] font-semibold text-foreground truncate">
            {definition?.label || block.type}
          </p>
          <p className="text-[10px] text-muted">Block #{blockIndex + 1}</p>
        </div>
        <button
          className="flex h-6 w-6 items-center justify-center rounded-md text-muted hover:text-foreground hover:bg-white dark:hover:bg-surface transition-colors"
          title="Deselect"
          onClick={onDeselect}
        >
          <X size={14} />
        </button>
      </div>

      {/* Actions */}
      <div className="flex items-center gap-0.5 px-3 py-2 border-b border-separator/40">
        <ActionBtn
          disabled={isFirst}
          icon={<ChevronUp size={14} />}
          label="Up"
          onClick={() => onMoveUp(block.id)}
        />
        <ActionBtn
          disabled={isLast}
          icon={<ChevronDown size={14} />}
          label="Down"
          onClick={() => onMoveDown(block.id)}
        />
        <ActionBtn
          icon={<Copy size={14} />}
          label="Copy"
          onClick={() => onDuplicate(block.id)}
        />
        <div className="flex-1" />
        <ActionBtn
          danger
          icon={<Trash2 size={14} />}
          label="Delete"
          onClick={() => onDelete(block.id)}
        />
      </div>

      {/* Tabbed property panel */}
      <div className="flex border-b border-separator/40">
        {TAB_TYPES.BLOCK.map((tab) => (
          <button
            className={clsx(
              COMMON_CLASSES.TAB_BUTTON,
              rememberedTab === tab
                ? `${UI_COLORS.PRIMARY_TEXT} ${UI_COLORS.PRIMARY_BORDER}`
                : "text-muted border-transparent hover:text-foreground",
            )}
            key={tab}
            onClick={() => handleTabChange(tab)}
          >
            {TAB_LABELS[tab]}
          </button>
        ))}
      </div>

      <div className="flex-1 overflow-y-auto px-4 py-4">
        {rememberedTab === "content" && (
          <ContentTabFields block={block} pages={pages} set={set} isFieldVisible={isFieldVisible} fieldErrors={fieldErrors} />
        )}
        {rememberedTab === "style" && (
          <StyleTab style={styleOverrides} setStyle={setStyle} />
        )}
        {rememberedTab === "advanced" && (
          <AdvancedTab
            block={block}
            style={styleOverrides}
            set={set}
            setStyle={setStyle}
          />
        )}
      </div>
    </aside>
  );
}


// ═══════════════════════════════════════════════════════════════════════════════
// Content Tab — Block-specific property fields
// ═══════════════════════════════════════════════════════════════════════════════

function GenericPropertiesEditor({
  block,
  set,
  isFieldVisible,
  pages,
}: {
  block: BlockInstance;
  set: (key: string, value: unknown) => void;
  isFieldVisible?: (fieldName: string) => boolean;
  pages: Page[];
}) {
  const config = BLOCK_FIELD_CONFIGS[block.type];

  if (!config) {
    // Fallback: Collect all string/number/boolean props
    const propsKeys = Object.keys(block.props).filter(k => !k.startsWith("_") && k !== "children");
    const inferredFields: FieldConfig[] = propsKeys.map(k => ({
      key: k,
      label: k.charAt(0).toUpperCase() + k.slice(1).replace(/([A-Z])/g, ' $1'),
      type: typeof block.props[k] === "number" ? "number" : typeof block.props[k] === "boolean" ? "boolean" : "text"
    }));

    if (inferredFields.length === 0) {
      return (
        <div className="text-center py-8">
          <p className="text-[11px] text-muted">No configurable content properties for {block.type}.</p>
        </div>
      );
    }

    return <DynamicFieldRenderer fields={inferredFields} block={block} pages={pages} set={set} isFieldVisible={isFieldVisible} />;
  }

  return <DynamicFieldRenderer fields={config} block={block} pages={pages} set={set} isFieldVisible={isFieldVisible} />;
}

function ContentTabFields({
  block,
  set,
  isFieldVisible,
  fieldErrors,
  pages,
}: {
  block: BlockInstance;
  set: (key: string, value: unknown) => void;
  isFieldVisible?: (fieldName: string) => boolean;
  fieldErrors?: Record<string, string[]>;
  pages: Page[];
}) {
  const config = BLOCK_FIELD_CONFIGS[block.type];

  return (
    <div className="flex flex-col gap-4">
      <p className="text-[10px] font-bold uppercase tracking-widest text-muted/60 mb-1">
        Properties
      </p>

      {config ? (
        <DynamicFieldRenderer
          block={block}
          fieldErrors={fieldErrors}
          fields={config}
          isFieldVisible={isFieldVisible}
          pages={pages}
          set={set}
        />
      ) : (
        <GenericPropertiesEditor block={block} isFieldVisible={isFieldVisible} pages={pages} set={set} />
      )}

      {/* ── Global Block (navbar/footer only) ── */}
      {(block.type === "navbar" || block.type === "footer") && (
        <div className="border-t border-separator/40 pt-3 mt-3">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-[11px] font-semibold text-foreground">
                <Globe size={12} className="inline" /> Global Block
              </p>
              <p className="text-[9px] text-muted">Appears on all pages</p>
            </div>
            <button
              className={clsx(
                "relative h-5 w-9 rounded-full transition-colors",
                block.props._global ? "bg-[#634CF8]" : "bg-muted/20",
              )}
              onClick={() => set("_global", !block.props._global)}
            >
              <div
                className={clsx(
                  "absolute top-0.5 h-4 w-4 rounded-full bg-white shadow-sm transition-transform",
                  block.props._global ? "translate-x-4" : "translate-x-0.5",
                )}
              />
            </button>
          </div>
        </div>
      )}

      {/* ── Form Action (contact only) ── */}
      {block.type === "contact" && (
        <div className="border-t border-separator/40 pt-3 mt-3">
          <p className="text-[10px] font-bold uppercase tracking-widest text-muted/60 mb-3">
            Form Action
          </p>
          <div className="flex flex-col gap-3">
            <select
              className={COMMON_CLASSES.SELECT_BASE}
              value={
                ((block.props._formAction as Record<string, unknown>)?.method as string) ||
                "localStorage"
              }
              onChange={(e) =>
                set("_formAction", {
                  ...((block.props._formAction as Record<string, unknown>) || {}),
                  method: e.target.value,
                })
              }
            >
              <option value="localStorage">Save to Browser</option>
              <option value="email">Send Email</option>
              <option value="webhook">Webhook</option>
            </select>
            {(block.props._formAction as Record<string, unknown>)?.method === "email" && (
              <Field
                label="Email Address"
                placeholder="hello@example.com"
                value={
                  ((block.props._formAction as Record<string, unknown>)?.email as string) || ""
                }
                onChange={(v) =>
                  set("_formAction", {
                    ...((block.props._formAction as Record<string, unknown>) || {}),
                    email: v,
                  })
                }
              />
            )}
            {(block.props._formAction as Record<string, unknown>)?.method === "webhook" && (
              <Field
                label="Webhook URL"
                placeholder="https://api.example.com/submit"
                value={
                  ((block.props._formAction as Record<string, unknown>)
                    ?.webhookUrl as string) || ""
                }
                onChange={(v) =>
                  set("_formAction", {
                    ...((block.props._formAction as Record<string, unknown>) || {}),
                    webhookUrl: v,
                  })
                }
              />
            )}
          </div>
        </div>
      )}
    </div>
  );
}


// ═══════════════════════════════════════════════════════════════════════════════
// Style Tab — Typography, Borders, Colors
// ═══════════════════════════════════════════════════════════════════════════════

const FONT_SIZE_PRESETS = [
  { label: "SM", value: "sm" },
  { label: "Base", value: "base" },
  { label: "LG", value: "lg" },
  { label: "XL", value: "xl" },
  { label: "2XL", value: "2xl" },
  { label: "3XL", value: "3xl" },
  { label: "4XL", value: "4xl" },
];

const FONT_WEIGHT_OPTIONS = [
  { label: "Light", value: "light" },
  { label: "Normal", value: "normal" },
  { label: "Medium", value: "medium" },
  { label: "Semibold", value: "semibold" },
  { label: "Bold", value: "bold" },
];

const TEXT_ALIGN_OPTIONS = [
  { label: "≡", value: "left", title: "Left" },
  { label: "≡", value: "center", title: "Center" },
  { label: "≡", value: "right", title: "Right" },
  { label: "≡", value: "justify", title: "Justify" },
];

const LINE_HEIGHT_PRESETS = [
  { label: "Tight", value: "tight" },
  { label: "Normal", value: "normal" },
  { label: "Relaxed", value: "relaxed" },
  { label: "Loose", value: "loose" },
];

const BORDER_WIDTH_OPTIONS = ["0", "1px", "2px", "4px"];
const BORDER_STYLE_OPTIONS = ["solid", "dashed", "dotted", "none"];
const BORDER_RADIUS_PRESETS = [
  { label: "None", value: "none" },
  { label: "SM", value: "sm" },
  { label: "MD", value: "md" },
  { label: "LG", value: "lg" },
  { label: "XL", value: "xl" },
  { label: "2XL", value: "2xl" },
  { label: "Full", value: "full" },
];

function StyleTab({
  style,
  setStyle,
}: {
  style: BlockStyleOverrides;
  setStyle: (key: keyof BlockStyleOverrides, value: unknown) => void;
}) {
  const [showPerCorner, setShowPerCorner] = useState(false);

  return (
    <div className="flex flex-col gap-5">
      {/* ── Typography ── */}
      <div>
        <p className="text-[10px] font-bold uppercase tracking-widest text-muted/60 mb-3">
          Typography
        </p>

        {/* Font Size */}
        <div className="mb-3">
          <label className="text-[10px] font-semibold text-muted block mb-1.5">
            Font Size
          </label>
          <div className="flex flex-wrap gap-1 mb-1.5">
            {FONT_SIZE_PRESETS.map((preset) => (
              <button
                key={preset.value}
                className={clsx(
                  "h-7 px-2.5 rounded-md text-[10px] font-medium border transition-all",
                  style.fontSize === preset.value
                    ? `${UI_COLORS.PRIMARY_BORDER} ${UI_COLORS.PRIMARY_SOFT_BG} ${UI_COLORS.PRIMARY_TEXT}`
                    : "border-separator/40 text-muted hover:border-muted",
                )}
                onClick={() => setStyle("fontSize", preset.value)}
              >
                {preset.label}
              </button>
            ))}
          </div>
          <input
            className={clsx(COMMON_CLASSES.INPUT_BASE, COMMON_CLASSES.INPUT_FOCUS, "h-8 font-mono")}
            placeholder="Custom (e.g. 18px, 1.5rem)"
            value={
              FONT_SIZE_PRESETS.some((p) => p.value === style.fontSize)
                ? ""
                : style.fontSize || ""
            }
            onChange={(e) => setStyle("fontSize", e.target.value || undefined)}
          />
        </div>

        {/* Font Weight */}
        <div className="mb-3">
          <label className="text-[10px] font-semibold text-muted block mb-1.5">
            Font Weight
          </label>
          <select
            className={clsx(COMMON_CLASSES.SELECT_BASE, "h-8")}
            value={style.fontWeight || ""}
            onChange={(e) => setStyle("fontWeight", e.target.value || undefined)}
          >
            <option value="">Default</option>
            {FONT_WEIGHT_OPTIONS.map((opt) => (
              <option key={opt.value} value={opt.value}>
                {opt.label}
              </option>
            ))}
          </select>
        </div>

        {/* Text Alignment */}
        <div className="mb-3">
          <label className="text-[10px] font-semibold text-muted block mb-1.5">
            Text Align
          </label>
          <div className="flex gap-1">
            {TEXT_ALIGN_OPTIONS.map((opt) => (
              <button
                key={opt.value}
                className={clsx(
                  "flex-1 h-8 rounded-md text-[12px] font-medium border transition-all flex items-center justify-center",
                  style.textAlign === opt.value
                    ? `${UI_COLORS.PRIMARY_BORDER} ${UI_COLORS.PRIMARY_SOFT_BG} ${UI_COLORS.PRIMARY_TEXT}`
                    : "border-separator/40 text-muted hover:border-muted",
                )}
                title={opt.title}
                onClick={() =>
                  setStyle(
                    "textAlign",
                    style.textAlign === opt.value ? undefined : opt.value,
                  )
                }
              >
                {opt.value === "left" && <AlignLeft size={14} />}
                {opt.value === "center" && <AlignCenter size={14} />}
                {opt.value === "right" && <AlignRight size={14} />}
                {opt.value === "justify" && <AlignJustify size={14} />}
              </button>
            ))}
          </div>
        </div>

        {/* Text Color */}
        <div className="mb-3">
          <ColorPicker
            label="Text Color"
            value={style.textColor || ""}
            onChange={(v) => setStyle("textColor", v || undefined)}
          />
        </div>

        {/* Line Height */}
        <div>
          <label className="text-[10px] font-semibold text-muted block mb-1.5">
            Line Height
          </label>
          <div className="flex gap-1">
            {LINE_HEIGHT_PRESETS.map((preset) => (
              <button
                key={preset.value}
                className={clsx(
                  "flex-1 h-7 rounded-md text-[9px] font-medium border transition-all",
                  style.lineHeight === preset.value
                    ? `${UI_COLORS.PRIMARY_BORDER} ${UI_COLORS.PRIMARY_SOFT_BG} ${UI_COLORS.PRIMARY_TEXT}`
                    : "border-separator/40 text-muted hover:border-muted",
                )}
                onClick={() =>
                  setStyle(
                    "lineHeight",
                    style.lineHeight === preset.value ? undefined : preset.value,
                  )
                }
              >
                {preset.label}
              </button>
            ))}
          </div>
        </div>
      </div>

      {/* ── Borders ── */}
      <div className="border-t border-separator/40 pt-4">
        <p className="text-[10px] font-bold uppercase tracking-widest text-muted/60 mb-3">
          Borders
        </p>

        {/* Border Width */}
        <div className="mb-3">
          <label className="text-[10px] font-semibold text-muted block mb-1.5">
            Border Width
          </label>
          <div className="flex gap-1">
            {BORDER_WIDTH_OPTIONS.map((w) => (
              <button
                key={w}
                className={clsx(
                  "flex-1 h-7 rounded-md text-[10px] font-medium border transition-all",
                  style.borderWidth === w
                    ? `${UI_COLORS.PRIMARY_BORDER} ${UI_COLORS.PRIMARY_SOFT_BG} ${UI_COLORS.PRIMARY_TEXT}`
                    : "border-separator/40 text-muted hover:border-muted",
                )}
                onClick={() =>
                  setStyle("borderWidth", style.borderWidth === w ? undefined : w)
                }
              >
                {w}
              </button>
            ))}
          </div>
        </div>

        {/* Border Color */}
        <div className="mb-3">
          <ColorPicker
            label="Border Color"
            value={style.borderColor || ""}
            onChange={(v) => setStyle("borderColor", v || undefined)}
          />
        </div>

        {/* Border Style */}
        <div className="mb-3">
          <label className="text-[10px] font-semibold text-muted block mb-1.5">
            Border Style
          </label>
          <div className="flex gap-1">
            {BORDER_STYLE_OPTIONS.map((s) => (
              <button
                key={s}
                className={clsx(
                  "flex-1 h-7 rounded-md text-[9px] font-medium border transition-all capitalize",
                  style.borderStyle === s
                    ? `${UI_COLORS.PRIMARY_BORDER} ${UI_COLORS.PRIMARY_SOFT_BG} ${UI_COLORS.PRIMARY_TEXT}`
                    : "border-separator/40 text-muted hover:border-muted",
                )}
                onClick={() =>
                  setStyle("borderStyle", style.borderStyle === s ? undefined : s)
                }
              >
                {s}
              </button>
            ))}
          </div>
        </div>

        {/* Border Radius */}
        <div className="mb-3">
          <div className="flex items-center justify-between mb-1.5">
            <label className="text-[10px] font-semibold text-muted">
              Border Radius
            </label>
            <button
              className="text-[9px] text-[#634CF8] hover:underline"
              onClick={() => setShowPerCorner(!showPerCorner)}
            >
              {showPerCorner ? "Uniform" : "Per corner"}
            </button>
          </div>
          {!showPerCorner ? (
            <div className="flex flex-wrap gap-1">
              {BORDER_RADIUS_PRESETS.map((preset) => (
                <button
                  key={preset.value}
                  className={clsx(
                    "h-7 px-2 rounded-md text-[9px] font-medium border transition-all",
                    style.borderRadius === preset.value
                      ? `${UI_COLORS.PRIMARY_BORDER} ${UI_COLORS.PRIMARY_SOFT_BG} ${UI_COLORS.PRIMARY_TEXT}`
                      : "border-separator/40 text-muted hover:border-muted",
                  )}
                  onClick={() =>
                    setStyle(
                      "borderRadius",
                      style.borderRadius === preset.value
                        ? undefined
                        : preset.value,
                    )
                  }
                >
                  {preset.label}
                </button>
              ))}
            </div>
          ) : (
            <div className="grid grid-cols-2 gap-2">
              {(
                [
                  ["borderRadiusTL", "Top Left"],
                  ["borderRadiusTR", "Top Right"],
                  ["borderRadiusBL", "Bottom Left"],
                  ["borderRadiusBR", "Bottom Right"],
                ] as const
              ).map(([key, label]) => (
                <div key={key}>
                  <label className="text-[9px] text-muted block mb-1">
                    {label}
                  </label>
                  <input
                    className={clsx(COMMON_CLASSES.INPUT_BASE, "h-7 font-mono px-2 text-[10px]", COMMON_CLASSES.INPUT_FOCUS)}
                    placeholder="0px"
                    value={(style[key] as string) || ""}
                    onChange={(e) =>
                      setStyle(key, e.target.value || undefined)
                    }
                  />
                </div>
              ))}
            </div>
          )}
        </div>
      </div>

      {/* ── Background ── */}
      <div className="border-t border-separator/40 pt-4">
        <p className="text-[10px] font-bold uppercase tracking-widest text-muted/60 mb-3">
          Background
        </p>
        <ColorPicker
          label="Background Color"
          value={style.backgroundColor || ""}
          onChange={(v) => setStyle("backgroundColor", v || undefined)}
        />
      </div>
    </div>
  );
}


// ═══════════════════════════════════════════════════════════════════════════════
// Advanced Tab — Animation, CSS Class, Responsive Visibility, Layout
// ═══════════════════════════════════════════════════════════════════════════════

function AdvancedTab({
  block,
  style,
  set,
  setStyle,
}: {
  block: BlockInstance;
  style: BlockStyleOverrides;
  set: (key: string, value: unknown) => void;
  setStyle: (key: keyof BlockStyleOverrides, value: unknown) => void;
}) {
  return (
    <div className="flex flex-col gap-5">
      {/* ── Animation ── */}
      <div>
        <p className="text-[10px] font-bold uppercase tracking-widest text-muted/60 mb-3">
          Animation
        </p>
        <div className="flex flex-col gap-2">
          <select
            className={COMMON_CLASSES.SELECT_BASE}
            value={style.animation || "none"}
            onChange={(e) =>
              setStyle("animation", e.target.value === "none" ? undefined : e.target.value)
            }
          >
            <option value="none">None</option>
            <option value="fade-in">Fade In</option>
            <option value="fade-up">Fade Up</option>
            <option value="fade-down">Fade Down</option>
            <option value="slide-up">Slide Up</option>
            <option value="slide-down">Slide Down</option>
            <option value="slide-left">Slide Left</option>
            <option value="slide-right">Slide Right</option>
            <option value="zoom-in">Zoom In</option>
            <option value="zoom-out">Zoom Out</option>
            <option value="bounce">Bounce</option>
          </select>
          {style.animation && style.animation !== "none" && (
            <div>
              <label className="text-[9px] text-muted block mb-1">
                Delay (ms)
              </label>
              <input
                className={clsx(COMMON_CLASSES.INPUT_BASE, "h-7 px-2 text-[10px]", COMMON_CLASSES.INPUT_FOCUS)}
                max={2000}
                min={0}
                step={100}
                type="number"
                value={style.animationDelay || 0}
                onChange={(e) =>
                  setStyle("animationDelay", parseInt(e.target.value) || 0)
                }
              />
            </div>
          )}
        </div>
      </div>

      {/* ── CSS Class Override ── */}
      <div className="border-t border-separator/40 pt-4">
        <p className="text-[10px] font-bold uppercase tracking-widest text-muted/60 mb-3">
          CSS Class
        </p>
        <input
          className={clsx(COMMON_CLASSES.INPUT_BASE, "h-8 font-mono px-2 text-[11px]", COMMON_CLASSES.INPUT_FOCUS)}
          placeholder="custom-class another-class"
          value={style.cssClass || ""}
          onChange={(e) => setStyle("cssClass", e.target.value || undefined)}
        />
        <p className="text-[9px] text-muted/50 mt-1">
          Space-separated CSS class names
        </p>
      </div>

      {/* ── Responsive Visibility ── */}
      <div className="border-t border-separator/40 pt-4">
        <p className="text-[10px] font-bold uppercase tracking-widest text-muted/60 mb-3">
          Responsive Visibility
        </p>
        <div className="flex flex-col gap-3">
          <Switch
            isSelected={style.visibleDesktop !== false}
            onChange={(v) => setStyle("visibleDesktop", v)}
          >
            <Switch.Control>
              <Switch.Thumb />
            </Switch.Control>
            <Switch.Content>
              <Label className="text-[11px]"><Monitor size={12} className="inline" /> Desktop</Label>
            </Switch.Content>
          </Switch>
          <Switch
            isSelected={style.visibleTablet !== false}
            onChange={(v) => setStyle("visibleTablet", v)}
          >
            <Switch.Control>
              <Switch.Thumb />
            </Switch.Control>
            <Switch.Content>
              <Label className="text-[11px]"><Tablet size={12} className="inline" /> Tablet</Label>
            </Switch.Content>
          </Switch>
          <Switch
            isSelected={style.visibleMobile !== false}
            onChange={(v) => setStyle("visibleMobile", v)}
          >
            <Switch.Control>
              <Switch.Thumb />
            </Switch.Control>
            <Switch.Content>
              <Label className="text-[11px]"><Smartphone size={12} className="inline" /> Mobile</Label>
            </Switch.Content>
          </Switch>
        </div>
      </div>

      {/* ── Section Layout ── */}
      <div className="border-t border-separator/40 pt-4">
        <p className="text-[10px] font-bold uppercase tracking-widest text-muted/60 mb-3">
          Section Layout
        </p>
        <div className="flex gap-2">
          {(["contained", "full-width"] as const).map((mode) => (
            <button
              key={mode}
              className={clsx(
                "flex-1 h-8 rounded-lg text-[10px] font-semibold border-2 transition-all",
                ((block.props._section as Record<string, unknown>)?.layout ||
                  "contained") === mode
                  ? `${UI_COLORS.PRIMARY_BORDER} ${UI_COLORS.PRIMARY_SOFT_BG} ${UI_COLORS.PRIMARY_TEXT}`
                  : "border-separator/40 text-muted",
              )}
              onClick={() =>
                set("_section", {
                  ...((block.props._section as Record<string, unknown>) || {}),
                  layout: mode,
                })
              }
            >
              {mode === "contained" ? "Contained" : "Full Width"}
            </button>
          ))}
        </div>
      </div>
    </div>
  );
}

// ═══════════════════════════════════════════════════════════════════════════════
// Page Settings Panel (when no block is selected)
// ═══════════════════════════════════════════════════════════════════════════════

function PageSettingsPanel({
  activePage,
  blocks,
  width,
  settingsTab,
  onSettingsTabChange,
  onDelete,
  onDuplicate,
  onMoveDown,
  onMoveUp,
  onUpdatePageSettings,
  expandedLayerIds,
  onToggleExpand,
  onHoverBlock,
}: {
  activePage: Page;
  blocks: BlockInstance[];
  width: number;
  settingsTab: "page" | "seo" | "layers";
  onSettingsTabChange: (tab: "page" | "seo" | "layers") => void;
  onDelete: (id: string) => void;
  onDuplicate: (id: string) => void;
  onMoveDown: (id: string) => void;
  onMoveUp: (id: string) => void;
  onUpdatePageSettings: (
    id: string,
    settings: Partial<Page["settings"]>,
  ) => void;
  expandedLayerIds?: Set<string>;
  onToggleExpand?: (id: string) => void;
  onHoverBlock?: (id: string | null) => void;
}) {
  return (
    <aside
      className={COMMON_CLASSES.PANEL_BASE}
      style={{ width: `${width}px` }}
    >
      <div className={COMMON_CLASSES.HEADER}>
        <p className="text-[13px] font-semibold text-foreground">
          <FileText size={14} className="inline" /> Page Settings
        </p>
        <p className="text-[10px] text-muted">
          {activePage.settings.title}
        </p>
      </div>

      <div className="flex border-b border-separator/40">
        {TAB_TYPES.PAGE.map((tab) => (
          <button
            className={clsx(
              COMMON_CLASSES.TAB_BUTTON,
              settingsTab === tab
                ? `${UI_COLORS.PRIMARY_TEXT} ${UI_COLORS.PRIMARY_BORDER}`
                : "text-muted border-transparent hover:text-foreground",
            )}
            key={tab}
            onClick={() => onSettingsTabChange(tab)}
          >
            {TAB_LABELS[tab]}
          </button>
        ))}
      </div>

      <div className="flex-1 overflow-y-auto px-4 py-4">
        {settingsTab === "page" && (
          <div className="flex flex-col gap-4">
            <SettingField
              label="Page Title"
              value={activePage.settings.title}
              onChange={(v) =>
                onUpdatePageSettings(activePage.id, { title: v })
              }
            />
            <div>
              <label className={COMMON_CLASSES.FIELD_LABEL}>
                Language
              </label>
              <div className="flex gap-2">
                {(["en", "ar"] as const).map((lang) => (
                  <button
                    className={clsx(
                      "flex-1 h-9 rounded-lg text-[11px] font-semibold transition-all border-2",
                      activePage.settings.locale === lang
                        ? `${UI_COLORS.PRIMARY_BORDER} ${UI_COLORS.PRIMARY_SOFT_BG} ${UI_COLORS.PRIMARY_TEXT}`
                        : "border-separator/40 text-muted hover:border-muted",
                    )}
                    key={lang}
                    onClick={() =>
                      onUpdatePageSettings(activePage.id, {
                        locale: lang,
                      })
                    }
                  >
                    {lang === "en" ? "English (EN)" : "Arabic (AR)"}
                  </button>
                ))}
              </div>
            </div>
            <div>
              <label className={COMMON_CLASSES.FIELD_LABEL}>
                Permalink
              </label>
              <div className="flex items-center gap-1">
                <span className="text-[11px] text-muted">/</span>
                <input
                  className={clsx(COMMON_CLASSES.INPUT_BASE, COMMON_CLASSES.INPUT_FOCUS, "flex-1 font-mono")}
                  value={activePage.settings.slug}
                  onChange={(e) =>
                    onUpdatePageSettings(activePage.id, {
                      slug: e.target.value
                        .toLowerCase()
                        .replace(/[^a-z0-9-]/g, ""),
                    })
                  }
                />
              </div>
            </div>
            <div>
              <label className={COMMON_CLASSES.FIELD_LABEL}>
                Visibility
              </label>
              <div className="flex gap-2">
                {(["public", "draft"] as const).map((v) => (
                  <button
                    className={clsx(
                      "flex-1 h-9 rounded-lg text-[11px] font-semibold transition-all border-2",
                      (
                        v === "public"
                          ? activePage.settings.published
                          : !activePage.settings.published
                      )
                        ? `${UI_COLORS.PRIMARY_BORDER} ${UI_COLORS.PRIMARY_SOFT_BG} ${UI_COLORS.PRIMARY_TEXT}`
                        : "border-separator/40 text-muted hover:border-muted",
                    )}
                    key={v}
                    onClick={() =>
                      onUpdatePageSettings(activePage.id, {
                        published: v === "public",
                      })
                    }
                  >
                    {v === "public" ? "Public" : "Draft"}
                  </button>
                ))}
              </div>
            </div>
            <div className={clsx("rounded-lg p-3 flex flex-col gap-1", UI_COLORS.BG_PANEL)}>
              <div className="flex justify-between text-[10px]">
                <span className="text-muted">Created</span>
                <span className="text-foreground font-mono">
                  {new Date(
                    activePage.settings.createdAt,
                  ).toLocaleDateString()}
                </span>
              </div>
              <div className="flex justify-between text-[10px]">
                <span className="text-muted">Updated</span>
                <span className="text-foreground font-mono">
                  {new Date(
                    activePage.settings.updatedAt,
                  ).toLocaleDateString()}
                </span>
              </div>
              <div className="flex justify-between text-[10px]">
                <span className="text-muted">Blocks</span>
                <span className="text-foreground">{blocks.length}</span>
              </div>
            </div>
          </div>
        )}

        {settingsTab === "seo" && (
          <SEOAnalyzer
            blocks={blocks}
            page={activePage}
            onUpdateSettings={(settings) =>
              onUpdatePageSettings(activePage.id, settings)
            }
          />
        )}

        {settingsTab === "layers" && (
          <LayersPanel
            blocks={blocks}
            selectedBlockId={null}
            expandedIds={expandedLayerIds ?? new Set<string>()}
            onToggleExpand={onToggleExpand ?? (() => {})}
            onHover={onHoverBlock ?? (() => {})}
            onDelete={onDelete}
            onDuplicate={onDuplicate}
            onMoveDown={onMoveDown}
            onMoveUp={onMoveUp}
            onSelect={() => {}}
          />
        )}
      </div>
    </aside>
  );
}

// ═══════════════════════════════════════════════════════════════════════════════
// Shared Field Components
// ═══════════════════════════════════════════════════════════════════════════════

function Field({
  label,
  value,
  multiline,
  placeholder,
  onChange,
  errors,
}: {
  label: string;
  value: string;
  multiline?: boolean;
  placeholder?: string;
  onChange: (v: string) => void;
  errors?: string[];
}) {
  const hasError = errors && errors.length > 0;
  return (
    <div>
      <label className={COMMON_CLASSES.FIELD_LABEL}>
        {label}
      </label>
      {multiline ? (
        <textarea
          className={clsx(
            COMMON_CLASSES.INPUT_BASE,
            "py-2 resize-none h-24 leading-relaxed",
            hasError ? "border-red-500 focus:border-red-500" : COMMON_CLASSES.INPUT_FOCUS
          )}
          placeholder={placeholder}
          value={value}
          onChange={(e) => onChange(e.target.value)}
        />
      ) : (
        <input
          className={clsx(
            COMMON_CLASSES.INPUT_BASE,
            hasError ? "border-red-500 focus:border-red-500" : COMMON_CLASSES.INPUT_FOCUS
          )}
          placeholder={placeholder}
          value={value}
          onChange={(e) => onChange(e.target.value)}
        />
      )}
      {hasError && (
        <div className="mt-1">
          {errors.map((err, i) => (
            <p key={i} className="text-red-500 text-xs">{err}</p>
          ))}
        </div>
      )}
    </div>
  );
}

function NumberField({
  label,
  value,
  min,
  max,
  onChange,
}: {
  label: string;
  value: number;
  min: number;
  max: number;
  onChange: (v: number) => void;
}) {
  return (
    <div>
      <label className={COMMON_CLASSES.FIELD_LABEL}>
        {label}
      </label>
      <div className="flex items-center gap-2">
        <input
          className={clsx(COMMON_CLASSES.INPUT_BASE, COMMON_CLASSES.INPUT_FOCUS, "flex-1")}
          max={max}
          min={min}
          type="number"
          value={value}
          onChange={(e) =>
            onChange(
              Math.min(max, Math.max(min, parseInt(e.target.value) || min)),
            )
          }
        />
        <span className="text-[10px] text-muted tabular-nums">
          {min}–{max}
        </span>
      </div>
    </div>
  );
}

function ActionBtn({
  icon,
  label,
  danger,
  disabled,
  onClick,
}: {
  icon: React.ReactNode;
  label: string;
  danger?: boolean;
  disabled?: boolean;
  onClick: () => void;
}) {
  return (
    <button
      className={clsx(
        "flex h-7 items-center gap-1 rounded-lg px-2.5 text-[11px] font-medium transition-colors",
        disabled && "opacity-25 cursor-not-allowed",
        danger
          ? UI_COLORS.DANGER_BG + " " + UI_COLORS.DANGER
          : "text-muted hover:text-foreground hover:bg-[#F5F5F5] dark:hover:bg-surface",
      )}
      disabled={disabled}
      title={label}
      onClick={onClick}
    >
      <span className="text-[11px] flex items-center">{icon}</span>
      {label}
    </button>
  );
}

function SettingField({
  label,
  value,
  placeholder,
  onChange,
}: {
  label: string;
  value: string;
  placeholder?: string;
  onChange: (v: string) => void;
}) {
  return (
    <div>
      <label className={COMMON_CLASSES.FIELD_LABEL}>
        {label}
      </label>
      <input
        className={clsx(COMMON_CLASSES.INPUT_BASE, COMMON_CLASSES.INPUT_FOCUS)}
        placeholder={placeholder}
        value={value}
        onChange={(e) => onChange(e.target.value)}
      />
    </div>
  );
}
