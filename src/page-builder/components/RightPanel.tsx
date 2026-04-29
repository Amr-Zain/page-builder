import clsx from "clsx";
import { useState, useRef } from "react";
import { Tabs, Switch, Label } from "@heroui/react";
import { X, ChevronUp, ChevronDown, Copy, Trash2, AlignLeft, AlignCenter, AlignRight, AlignJustify } from "lucide-react";

import type { BlockInstance, BlockType, BlockStyleOverrides } from "../types";
import type { Page } from "../pages";
import { BLOCK_DEFINITIONS } from "../data";
import {
  ItemListEditor,
  ImagePicker,
  LinksEditor,
  RichTextEditor,
} from "./block-editors";
import { LayersPanel } from "./LayersPanel";
import { SEOAnalyzer } from "./SEOAnalyzer";
import { ColorPicker } from "./ColorPicker";

/** Remember last active tab per block type */
type PropertyTab = "content" | "style" | "advanced";

export function RightPanel({
  block,
  blocks,
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
}) {
  const [settingsTab, setSettingsTab] = useState<"page" | "seo" | "layers">(
    "page",
  );

  // Remember last active tab per block type
  const tabMemory = useRef<Map<BlockType, PropertyTab>>(new Map());

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
        className="shrink-0 border-l border-separator/50 bg-white dark:bg-background flex flex-col items-center justify-center p-6 text-center h-full max-md:w-full"
        style={{ width: `${width}px` }}
      >
        <div className="flex h-14 w-14 items-center justify-center rounded-lg bg-[#F8F8FA] dark:bg-surface mb-4">
          <span className="text-2xl">👆</span>
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
  const rememberedTab = tabMemory.current.get(block.type) || "content";

  function handleTabChange(key: React.Key) {
    if (block) tabMemory.current.set(block.type, key as PropertyTab);
  }

  function set(key: string, value: unknown) {
    if (!block) return;
    onUpdate(block.id, { ...block.props, [key]: value });
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
      className="shrink-0 border-l border-separator/50 bg-white dark:bg-background flex flex-col overflow-hidden h-full max-md:w-full"
      style={{ width: `${width}px` }}
    >
      {/* Header with block info and close button */}
      <div className="flex items-center gap-3 px-4 py-3 border-b border-separator/40 bg-[#FAFAFA] dark:bg-surface/50">
        <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-[#634CF8]/10 text-sm">
          {definition?.icon}
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
      <div className="flex-1 overflow-y-auto">
        <Tabs
          defaultSelectedKey={rememberedTab}
          onSelectionChange={handleTabChange}
          className="w-full"
        >
          <Tabs.ListContainer className="border-b border-separator/40">
            <Tabs.List aria-label="Property tabs" className="w-full">
              <Tabs.Tab id="content" className="flex-1 text-[11px]">
                Content
                <Tabs.Indicator />
              </Tabs.Tab>
              <Tabs.Tab id="style" className="flex-1 text-[11px]">
                Style
                <Tabs.Indicator />
              </Tabs.Tab>
              <Tabs.Tab id="advanced" className="flex-1 text-[11px]">
                Advanced
                <Tabs.Indicator />
              </Tabs.Tab>
            </Tabs.List>
          </Tabs.ListContainer>

          {/* ═══ Content Tab ═══ */}
          <Tabs.Panel id="content" className="px-4 py-4">
            <ContentTabFields block={block} set={set} />
          </Tabs.Panel>

          {/* ═══ Style Tab ═══ */}
          <Tabs.Panel id="style" className="px-4 py-4">
            <StyleTab style={styleOverrides} setStyle={setStyle} />
          </Tabs.Panel>

          {/* ═══ Advanced Tab ═══ */}
          <Tabs.Panel id="advanced" className="px-4 py-4">
            <AdvancedTab
              block={block}
              style={styleOverrides}
              set={set}
              setStyle={setStyle}
            />
          </Tabs.Panel>
        </Tabs>
      </div>
    </aside>
  );
}


// ═══════════════════════════════════════════════════════════════════════════════
// Content Tab — Block-specific property fields
// ═══════════════════════════════════════════════════════════════════════════════

function ContentTabFields({
  block,
  set,
}: {
  block: BlockInstance;
  set: (key: string, value: unknown) => void;
}) {
  return (
    <div className="flex flex-col gap-4">
      <p className="text-[10px] font-bold uppercase tracking-widest text-muted/60 mb-1">
        Properties
      </p>

      {/* ── Navbar ── */}
      {block.type === "navbar" && (
        <>
          <Field
            label="Logo"
            value={(block.props.logo as string) || ""}
            onChange={(v) => set("logo", v)}
          />
          <LinksEditor
            addLabel="Add nav link"
            items={(block.props.links as string[]) || []}
            label="Navigation Links"
            onChange={(links) => set("links", links)}
          />
        </>
      )}

      {/* ── Hero ── */}
      {block.type === "hero" && (
        <>
          <Field
            label="Headline"
            value={(block.props.headline as string) || ""}
            onChange={(v) => set("headline", v)}
          />
          <Field
            label="Subtitle"
            multiline
            value={(block.props.subtitle as string) || ""}
            onChange={(v) => set("subtitle", v)}
          />
          <Field
            label="Button Text"
            value={(block.props.ctaText as string) || ""}
            onChange={(v) => set("ctaText", v)}
          />
          <ImagePicker
            label="Hero Image"
            value={(block.props.heroImage as string) || ""}
            onChange={(v) => set("heroImage", v)}
          />
        </>
      )}

      {/* ── Features ── */}
      {block.type === "features" && (
        <>
          <Field
            label="Section Title"
            value={(block.props.title as string) || ""}
            onChange={(v) => set("title", v)}
          />
          <Field
            label="Subtitle"
            multiline
            value={(block.props.subtitle as string) || ""}
            onChange={(v) => set("subtitle", v)}
          />
          <ItemListEditor
            addLabel="Add feature"
            fields={[
              { key: "icon", label: "Icon (emoji)", placeholder: "⚡" },
              { key: "title", label: "Title", placeholder: "Feature name" },
              {
                key: "description",
                label: "Description",
                type: "textarea",
                placeholder: "Describe this feature...",
              },
            ]}
            items={
              (block.props.items as Array<{
                icon: string;
                title: string;
                description: string;
              }>) || []
            }
            label="Feature Items"
            renderPreview={(item) => (
              <span>
                {item.icon} {item.title}
              </span>
            )}
            onChange={(items) => set("items", items)}
          />
        </>
      )}

      {/* ── Testimonials ── */}
      {block.type === "testimonials" && (
        <>
          <Field
            label="Section Title"
            value={(block.props.title as string) || ""}
            onChange={(v) => set("title", v)}
          />
          <ItemListEditor
            addLabel="Add testimonial"
            fields={[
              {
                key: "quote",
                label: "Quote",
                type: "textarea",
                placeholder: "What they said...",
              },
              { key: "name", label: "Name", placeholder: "Jane Doe" },
              { key: "role", label: "Role", placeholder: "CEO at Company" },
              {
                key: "avatar",
                label: "Avatar URL",
                type: "url",
                placeholder: "https://...",
              },
            ]}
            items={
              (block.props.testimonials as Array<{
                quote: string;
                name: string;
                role: string;
                avatar: string;
              }>) || []
            }
            label="Testimonials"
            renderPreview={(item) => <span>{item.name || "Unnamed"}</span>}
            onChange={(items) => set("testimonials", items)}
          />
        </>
      )}

      {/* ── Pricing ── */}
      {block.type === "pricing" && (
        <>
          <Field
            label="Title"
            value={(block.props.title as string) || ""}
            onChange={(v) => set("title", v)}
          />
          <Field
            label="Subtitle"
            value={(block.props.subtitle as string) || ""}
            onChange={(v) => set("subtitle", v)}
          />
        </>
      )}

      {/* ── Stats ── */}
      {block.type === "stats" && (
        <ItemListEditor
          addLabel="Add stat"
          fields={[
            { key: "value", label: "Value", placeholder: "10K+" },
            { key: "label", label: "Label", placeholder: "Active users" },
          ]}
          items={
            (block.props.items as Array<{
              value: string;
              label: string;
            }>) || []
          }
          label="Statistics"
          renderPreview={(item) => (
            <span>
              {item.value} — {item.label}
            </span>
          )}
          onChange={(items) => set("items", items)}
        />
      )}

      {/* ── Team ── */}
      {block.type === "team" && (
        <>
          <Field
            label="Title"
            value={(block.props.title as string) || ""}
            onChange={(v) => set("title", v)}
          />
          <Field
            label="Subtitle"
            multiline
            value={(block.props.subtitle as string) || ""}
            onChange={(v) => set("subtitle", v)}
          />
          <ItemListEditor
            addLabel="Add member"
            fields={[
              { key: "name", label: "Name", placeholder: "Alex Rivera" },
              { key: "role", label: "Role", placeholder: "CEO" },
              {
                key: "avatar",
                label: "Photo URL",
                type: "url",
                placeholder: "https://...",
              },
            ]}
            items={
              (block.props.members as Array<{
                name: string;
                role: string;
                avatar: string;
              }>) || []
            }
            label="Team Members"
            renderPreview={(item) => <span>{item.name || "Unnamed"}</span>}
            onChange={(items) => set("members", items)}
          />
        </>
      )}

      {/* ── FAQ ── */}
      {block.type === "faq" && (
        <>
          <Field
            label="Title"
            value={(block.props.title as string) || ""}
            onChange={(v) => set("title", v)}
          />
          <Field
            label="Subtitle"
            multiline
            value={(block.props.subtitle as string) || ""}
            onChange={(v) => set("subtitle", v)}
          />
          <ItemListEditor
            addLabel="Add question"
            fields={[
              {
                key: "q",
                label: "Question",
                placeholder: "How does it work?",
              },
              {
                key: "a",
                label: "Answer",
                type: "textarea",
                placeholder: "It's simple...",
              },
            ]}
            items={
              (block.props.items as Array<{ q: string; a: string }>) || []
            }
            label="Questions"
            renderPreview={(item) => <span>{item.q || "Untitled"}</span>}
            onChange={(items) => set("items", items)}
          />
        </>
      )}

      {/* ── CTA ── */}
      {block.type === "cta" && (
        <>
          <Field
            label="Headline"
            value={(block.props.headline as string) || ""}
            onChange={(v) => set("headline", v)}
          />
          <Field
            label="Subtitle"
            multiline
            value={(block.props.subtitle as string) || ""}
            onChange={(v) => set("subtitle", v)}
          />
          <Field
            label="Button Text"
            value={(block.props.ctaText as string) || ""}
            onChange={(v) => set("ctaText", v)}
          />
        </>
      )}

      {/* ── Contact ── */}
      {block.type === "contact" && (
        <>
          <Field
            label="Title"
            value={(block.props.title as string) || ""}
            onChange={(v) => set("title", v)}
          />
          <Field
            label="Subtitle"
            multiline
            value={(block.props.subtitle as string) || ""}
            onChange={(v) => set("subtitle", v)}
          />
        </>
      )}

      {/* ── Logos ── */}
      {block.type === "logos" && (
        <>
          <Field
            label="Title"
            value={(block.props.title as string) || ""}
            onChange={(v) => set("title", v)}
          />
          <LinksEditor
            addLabel="Add company"
            items={(block.props.companies as string[]) || []}
            label="Company Names"
            onChange={(companies) => set("companies", companies)}
          />
        </>
      )}

      {/* ── Banner ── */}
      {block.type === "banner" && (
        <Field
          label="Banner Text"
          value={(block.props.text as string) || ""}
          onChange={(v) => set("text", v)}
        />
      )}

      {/* ── Gallery ── */}
      {block.type === "gallery" && (
        <>
          <Field
            label="Title"
            value={(block.props.title as string) || ""}
            onChange={(v) => set("title", v)}
          />
          <NumberField
            label="Columns"
            max={6}
            min={1}
            value={(block.props.columns as number) || 3}
            onChange={(v) => set("columns", v)}
          />
        </>
      )}

      {/* ── Footer ── */}
      {block.type === "footer" && (
        <Field
          label="Copyright"
          value={(block.props.copyright as string) || ""}
          onChange={(v) => set("copyright", v)}
        />
      )}

      {/* ── Content ── */}
      {block.type === "content" && (
        <>
          <Field
            label="Heading"
            value={(block.props.heading as string) || ""}
            onChange={(v) => set("heading", v)}
          />
          <RichTextEditor
            label="Body"
            placeholder="Write your content here..."
            value={(block.props.body as string) || ""}
            onChange={(v) => set("body", v)}
          />
        </>
      )}

      {/* ── Text ── */}
      {block.type === "text" && (
        <RichTextEditor
          label="Content"
          placeholder="Start writing..."
          value={(block.props.content as string) || ""}
          onChange={(v) => set("content", v)}
        />
      )}

      {/* ── Image ── */}
      {block.type === "image" && (
        <>
          <ImagePicker
            label="Image"
            value={(block.props.src as string) || ""}
            onChange={(v) => set("src", v)}
          />
          <Field
            label="Alt Text"
            value={(block.props.alt as string) || ""}
            onChange={(v) => set("alt", v)}
          />
          <Field
            label="Caption"
            value={(block.props.caption as string) || ""}
            onChange={(v) => set("caption", v)}
          />
        </>
      )}

      {/* ── Video ── */}
      {block.type === "video" && (
        <>
          <Field
            label="Video URL"
            value={(block.props.url as string) || ""}
            onChange={(v) => set("url", v)}
          />
          <Field
            label="Duration"
            value={(block.props.duration as string) || ""}
            placeholder="3:45"
            onChange={(v) => set("duration", v)}
          />
        </>
      )}

      {/* ── Code ── */}
      {block.type === "code" && (
        <>
          <Field
            label="Filename"
            value={(block.props.filename as string) || ""}
            placeholder="app.ts"
            onChange={(v) => set("filename", v)}
          />
          <Field
            label="Language"
            value={(block.props.language as string) || ""}
            placeholder="typescript"
            onChange={(v) => set("language", v)}
          />
          <Field
            label="Code"
            multiline
            value={(block.props.code as string) || ""}
            onChange={(v) => set("code", v)}
          />
        </>
      )}

      {/* ── HTML ── */}
      {block.type === "html" && (
        <Field
          label="HTML Code"
          multiline
          value={(block.props.html as string) || ""}
          onChange={(v) => set("html", v)}
        />
      )}

      {/* ── Columns ── */}
      {block.type === "columns" && (
        <NumberField
          label="Number of Columns"
          max={6}
          min={1}
          value={(block.props.count as number) || 2}
          onChange={(v) => set("count", v)}
        />
      )}

      {/* ── Grid ── */}
      {block.type === "grid" && (
        <>
          <NumberField
            label="Columns"
            max={12}
            min={1}
            value={(block.props.columns as number) || 2}
            onChange={(v) => set("columns", v)}
          />
          <Field
            label="Gap (px)"
            value={(block.props.gap as string) || "16"}
            placeholder="16"
            onChange={(v) => set("gap", v)}
          />
          <Field
            label="Row Gap (optional override)"
            value={(block.props.rowGap as string) || ""}
            placeholder=""
            onChange={(v) => set("rowGap", v)}
          />
          <Field
            label="Column Gap (optional override)"
            value={(block.props.columnGap as string) || ""}
            placeholder=""
            onChange={(v) => set("columnGap", v)}
          />
          <div>
            <label className="text-[11px] font-semibold text-muted block mb-1.5">
              Justify Items
            </label>
            <select
              className="w-full h-9 rounded-lg border border-separator/50 bg-[#FAFAFA] dark:bg-surface px-3 text-[12px] outline-none focus:border-[#634CF8]"
              value={(block.props.justifyItems as string) || "stretch"}
              onChange={(e) => set("justifyItems", e.target.value)}
            >
              <option value="start">start</option>
              <option value="center">center</option>
              <option value="end">end</option>
              <option value="stretch">stretch</option>
            </select>
          </div>
          <div>
            <label className="text-[11px] font-semibold text-muted block mb-1.5">
              Align Items
            </label>
            <select
              className="w-full h-9 rounded-lg border border-separator/50 bg-[#FAFAFA] dark:bg-surface px-3 text-[12px] outline-none focus:border-[#634CF8]"
              value={(block.props.alignItems as string) || "stretch"}
              onChange={(e) => set("alignItems", e.target.value)}
            >
              <option value="start">start</option>
              <option value="center">center</option>
              <option value="end">end</option>
              <option value="stretch">stretch</option>
            </select>
          </div>
          <Field
            label="Template Columns (custom CSS)"
            value={(block.props.templateColumns as string) || ""}
            placeholder="e.g. 1fr 2fr 1fr"
            onChange={(v) => set("templateColumns", v)}
          />
          <Field
            label="Template Rows (custom CSS)"
            value={(block.props.templateRows as string) || ""}
            placeholder=""
            onChange={(v) => set("templateRows", v)}
          />
          <div>
            <label className="text-[11px] font-semibold text-muted block mb-1.5">
              Auto Flow
            </label>
            <select
              className="w-full h-9 rounded-lg border border-separator/50 bg-[#FAFAFA] dark:bg-surface px-3 text-[12px] outline-none focus:border-[#634CF8]"
              value={(block.props.autoFlow as string) || "row"}
              onChange={(e) => set("autoFlow", e.target.value)}
            >
              <option value="row">row</option>
              <option value="column">column</option>
              <option value="dense">dense</option>
            </select>
          </div>
        </>
      )}

      {/* ── Flex Container ── */}
      {block.type === "flex-container" && (
        <>
          <div>
            <label className="text-[11px] font-semibold text-muted block mb-1.5">
              Direction
            </label>
            <select
              className="w-full h-9 rounded-lg border border-separator/50 bg-[#FAFAFA] dark:bg-surface px-3 text-[12px] outline-none focus:border-[#634CF8]"
              value={(block.props.direction as string) || "row"}
              onChange={(e) => set("direction", e.target.value)}
            >
              <option value="row">row</option>
              <option value="row-reverse">row-reverse</option>
              <option value="column">column</option>
              <option value="column-reverse">column-reverse</option>
            </select>
          </div>
          <Field
            label="Gap (px)"
            value={(block.props.gap as string) || "16"}
            placeholder="16"
            onChange={(v) => set("gap", v)}
          />
          <div>
            <label className="text-[11px] font-semibold text-muted block mb-1.5">
              Justify Content
            </label>
            <select
              className="w-full h-9 rounded-lg border border-separator/50 bg-[#FAFAFA] dark:bg-surface px-3 text-[12px] outline-none focus:border-[#634CF8]"
              value={(block.props.justifyContent as string) || "flex-start"}
              onChange={(e) => set("justifyContent", e.target.value)}
            >
              <option value="flex-start">flex-start</option>
              <option value="center">center</option>
              <option value="flex-end">flex-end</option>
              <option value="space-between">space-between</option>
              <option value="space-around">space-around</option>
              <option value="space-evenly">space-evenly</option>
            </select>
          </div>
          <div>
            <label className="text-[11px] font-semibold text-muted block mb-1.5">
              Align Items
            </label>
            <select
              className="w-full h-9 rounded-lg border border-separator/50 bg-[#FAFAFA] dark:bg-surface px-3 text-[12px] outline-none focus:border-[#634CF8]"
              value={(block.props.alignItems as string) || "stretch"}
              onChange={(e) => set("alignItems", e.target.value)}
            >
              <option value="flex-start">flex-start</option>
              <option value="center">center</option>
              <option value="flex-end">flex-end</option>
              <option value="stretch">stretch</option>
              <option value="baseline">baseline</option>
            </select>
          </div>
          <div>
            <label className="text-[11px] font-semibold text-muted block mb-1.5">
              Wrap
            </label>
            <select
              className="w-full h-9 rounded-lg border border-separator/50 bg-[#FAFAFA] dark:bg-surface px-3 text-[12px] outline-none focus:border-[#634CF8]"
              value={(block.props.wrap as string) || "nowrap"}
              onChange={(e) => set("wrap", e.target.value)}
            >
              <option value="nowrap">nowrap</option>
              <option value="wrap">wrap</option>
              <option value="wrap-reverse">wrap-reverse</option>
            </select>
          </div>
        </>
      )}

      {/* ── Spacer ── */}
      {block.type === "spacer" && (
        <NumberField
          label="Height (px)"
          max={400}
          min={8}
          value={(block.props.height as number) || 64}
          onChange={(v) => set("height", v)}
        />
      )}

      {/* ── Button Group ── */}
      {block.type === "button-group" && (
        <>
          <Field
            label="Primary Text"
            value={(block.props.primaryText as string) || ""}
            onChange={(v) => set("primaryText", v)}
          />
          <Field
            label="Secondary Text"
            value={(block.props.secondaryText as string) || ""}
            onChange={(v) => set("secondaryText", v)}
          />
        </>
      )}

      {/* ── Divider ── */}
      {block.type === "divider" && (
        <Field
          label="Label (optional)"
          value={(block.props.label as string) || ""}
          placeholder="Section divider text"
          onChange={(v) => set("label", v)}
        />
      )}

      {/* ── Global Block (navbar/footer only) ── */}
      {(block.type === "navbar" || block.type === "footer") && (
        <div className="border-t border-separator/40 pt-3 mt-3">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-[11px] font-semibold text-foreground">
                🌐 Global Block
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
              className="w-full h-9 rounded-lg border border-separator/50 bg-[#FAFAFA] dark:bg-surface px-3 text-[12px] outline-none focus:border-[#634CF8]"
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
              <option value="localStorage">💾 Save to Browser</option>
              <option value="email">✉️ Send Email</option>
              <option value="webhook">🔗 Webhook</option>
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
                    ? "border-[#634CF8] bg-[#634CF8]/5 text-[#634CF8]"
                    : "border-separator/40 text-muted hover:border-muted",
                )}
                onClick={() => setStyle("fontSize", preset.value)}
              >
                {preset.label}
              </button>
            ))}
          </div>
          <input
            className="w-full h-8 rounded-lg border border-separator/50 bg-[#FAFAFA] dark:bg-surface px-2 text-[11px] font-mono outline-none focus:border-[#634CF8]"
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
            className="w-full h-8 rounded-lg border border-separator/50 bg-[#FAFAFA] dark:bg-surface px-2 text-[11px] outline-none focus:border-[#634CF8]"
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
                    ? "border-[#634CF8] bg-[#634CF8]/5 text-[#634CF8]"
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
                    ? "border-[#634CF8] bg-[#634CF8]/5 text-[#634CF8]"
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
                    ? "border-[#634CF8] bg-[#634CF8]/5 text-[#634CF8]"
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
                    ? "border-[#634CF8] bg-[#634CF8]/5 text-[#634CF8]"
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
                      ? "border-[#634CF8] bg-[#634CF8]/5 text-[#634CF8]"
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
                    className="w-full h-7 rounded border border-separator/40 bg-[#FAFAFA] dark:bg-surface px-2 text-[10px] font-mono outline-none focus:border-[#634CF8]"
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
            className="w-full h-9 rounded-lg border border-separator/50 bg-[#FAFAFA] dark:bg-surface px-3 text-[12px] outline-none focus:border-[#634CF8]"
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
                className="w-full h-7 rounded border border-separator/40 bg-[#FAFAFA] dark:bg-surface px-2 text-[10px] outline-none"
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
          className="w-full h-8 rounded-lg border border-separator/50 bg-[#FAFAFA] dark:bg-surface px-2 text-[11px] font-mono outline-none focus:border-[#634CF8]"
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
              <Label className="text-[11px]">🖥️ Desktop</Label>
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
              <Label className="text-[11px]">📱 Tablet</Label>
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
              <Label className="text-[11px]">📲 Mobile</Label>
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
                  ? "border-[#634CF8] bg-[#634CF8]/5 text-[#634CF8]"
                  : "border-separator/40 text-muted",
              )}
              onClick={() =>
                set("_section", {
                  ...((block.props._section as Record<string, unknown>) || {}),
                  layout: mode,
                })
              }
            >
              {mode === "contained" ? "📦 Contained" : "↔️ Full Width"}
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
      className="shrink-0 border-l border-separator/50 bg-white dark:bg-background flex flex-col overflow-hidden h-full max-md:w-full"
      style={{ width: `${width}px` }}
    >
      <div className="px-4 py-3 border-b border-separator/40 bg-[#FAFAFA] dark:bg-surface/50">
        <p className="text-[13px] font-semibold text-foreground">
          📄 Page Settings
        </p>
        <p className="text-[10px] text-muted">
          {activePage.settings.title}
        </p>
      </div>

      {/* Tab switcher */}
      <div className="flex border-b border-separator/40">
        {(["page", "seo", "layers"] as const).map((tab) => (
          <button
            className={clsx(
              "flex-1 py-2 text-[11px] font-semibold transition-colors border-b-2",
              settingsTab === tab
                ? "text-[#634CF8] border-[#634CF8]"
                : "text-muted border-transparent hover:text-foreground",
            )}
            key={tab}
            onClick={() => onSettingsTabChange(tab)}
          >
            {tab === "page" ? "General" : tab === "seo" ? "SEO" : "Layers"}
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
              <label className="text-[11px] font-semibold text-muted block mb-1.5">
                Permalink
              </label>
              <div className="flex items-center gap-1">
                <span className="text-[11px] text-muted">/</span>
                <input
                  className="flex-1 h-9 rounded-lg border border-separator/50 bg-[#FAFAFA] dark:bg-surface px-3 text-[12px] text-foreground font-mono outline-none focus:border-[#634CF8]"
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
              <label className="text-[11px] font-semibold text-muted block mb-1.5">
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
                        ? "border-[#634CF8] bg-[#634CF8]/5 text-[#634CF8]"
                        : "border-separator/40 text-muted hover:border-muted",
                    )}
                    key={v}
                    onClick={() =>
                      onUpdatePageSettings(activePage.id, {
                        published: v === "public",
                      })
                    }
                  >
                    {v === "public" ? "🌐 Public" : "📝 Draft"}
                  </button>
                ))}
              </div>
            </div>
            <div className="rounded-lg bg-[#F8F8FA] dark:bg-surface p-3 flex flex-col gap-1">
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
}: {
  label: string;
  value: string;
  multiline?: boolean;
  placeholder?: string;
  onChange: (v: string) => void;
}) {
  return (
    <div>
      <label className="text-[11px] font-semibold text-muted block mb-1.5">
        {label}
      </label>
      {multiline ? (
        <textarea
          className="w-full rounded-lg border border-separator/50 bg-[#FAFAFA] dark:bg-surface px-3 py-2 text-[12px] text-foreground outline-none focus:border-[#634CF8] focus:bg-white dark:focus:bg-background transition-all resize-none h-24 leading-relaxed"
          placeholder={placeholder}
          value={value}
          onChange={(e) => onChange(e.target.value)}
        />
      ) : (
        <input
          className="w-full h-9 rounded-lg border border-separator/50 bg-[#FAFAFA] dark:bg-surface px-3 text-[12px] text-foreground outline-none focus:border-[#634CF8] focus:bg-white dark:focus:bg-background transition-all"
          placeholder={placeholder}
          value={value}
          onChange={(e) => onChange(e.target.value)}
        />
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
      <label className="text-[11px] font-semibold text-muted block mb-1.5">
        {label}
      </label>
      <div className="flex items-center gap-2">
        <input
          className="flex-1 h-9 rounded-lg border border-separator/50 bg-[#FAFAFA] dark:bg-surface px-3 text-[12px] text-foreground outline-none focus:border-[#634CF8] transition-all"
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
          ? "text-danger hover:bg-danger/10"
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
      <label className="text-[11px] font-semibold text-muted block mb-1.5">
        {label}
      </label>
      <input
        className="w-full h-9 rounded-lg border border-separator/50 bg-[#FAFAFA] dark:bg-surface px-3 text-[12px] text-foreground outline-none focus:border-[#634CF8] transition-all"
        placeholder={placeholder}
        value={value}
        onChange={(e) => onChange(e.target.value)}
      />
    </div>
  );
}
