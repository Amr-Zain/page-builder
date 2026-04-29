import { useState } from "react";
import { useDraggable } from "@dnd-kit/core";
import { Slider } from "@heroui/react";
import clsx from "clsx";
import { ChevronUp, GripVertical, Search, LayoutGrid, Component, Palette, FileText, Files, Menu, Sun, Moon, CircleCheck, MousePointer, Ban, Monitor } from "lucide-react";

import type {
  BlockDefinition,
  BlockCategory,
  ComponentDefinition,
  DesignSettings,
  SidebarPanel,
  Template,
} from "../types";
import {
  BLOCK_DEFINITIONS,
  BLOCK_CATEGORIES,
  COMPONENT_DEFINITIONS,
  COMPONENT_CATEGORIES,
  TEMPLATES,
} from "../data";
import { RADIUS_TOKENS, type RadiusToken } from "../tokens";

// ── Collapsible Section ──
function CollapsibleSection({
  title,
  count,
  icon,
  children,
  defaultOpen = true,
}: {
  title: string;
  count?: number;
  icon?: string;
  children: React.ReactNode;
  defaultOpen?: boolean;
}) {
  const [isOpen, setIsOpen] = useState(defaultOpen);

  return (
    <div className="border-b border-separator/40">
      <button
        className="flex w-full items-center justify-between py-2.5 text-left"
        onClick={() => setIsOpen(!isOpen)}
      >
        <span className="text-[12px] font-semibold text-foreground flex items-center gap-1.5">
          {icon && <span className="text-sm">{icon}</span>}
          {title}
          {count !== undefined && (
            <span className="text-[10px] font-normal text-muted">
              ({count})
            </span>
          )}
        </span>
        <ChevronUp
          className={clsx(
            "h-3 w-3 text-muted transition-transform duration-200",
            !isOpen && "rotate-180",
          )}
        />
      </button>
      <div
        className={clsx(
          "grid transition-all duration-200 ease-out",
          isOpen ? "grid-rows-[1fr] pb-3" : "grid-rows-[0fr]",
        )}
      >
        <div className="overflow-hidden">{children}</div>
      </div>
    </div>
  );
}

// ── Draggable Block Card (2-column grid for sections) ──
function DraggableBlockCard({ block }: { block: BlockDefinition }) {
  const { attributes, listeners, setNodeRef, isDragging } = useDraggable({
    id: `sidebar-block-${block.type}`,
    data: { type: "sidebar-block", blockType: block.type },
  });

  return (
    <div
      ref={setNodeRef}
      className={clsx(
        "flex flex-col items-center gap-2 rounded-lg border-2 border-separator/40 bg-white dark:bg-surface p-3 transition-all cursor-grab active:cursor-grabbing select-none outline-none",
        isDragging
          ? "opacity-50 border-[#634CF8] shadow-lg scale-95"
          : "hover:border-[#634CF8]/30 hover:shadow-sm focus-visible:ring-2 focus-visible:ring-[#634CF8]/40 focus-visible:border-[#634CF8]/30 focus-visible:shadow-sm",
      )}
      {...listeners}
      {...attributes}
    >
      <BlockPreview block={block} />
      <span className="text-[11px] font-medium text-foreground text-center leading-tight">
        {block.label}
      </span>
    </div>
  );
}

// ── Draggable Block Card (single-column list for content/layout/media) ──
function DraggableBlockCardList({ block }: { block: BlockDefinition }) {
  const { attributes, listeners, setNodeRef, isDragging } = useDraggable({
    id: `sidebar-block-${block.type}`,
    data: { type: "sidebar-block", blockType: block.type },
  });

  return (
    <div
      ref={setNodeRef}
      className={clsx(
        "flex items-center gap-2.5 rounded-lg border border-separator/40 bg-white dark:bg-surface px-3 py-2.5 transition-all cursor-grab active:cursor-grabbing select-none outline-none",
        isDragging
          ? "opacity-50 border-[#634CF8] shadow-lg scale-95"
          : "hover:border-[#634CF8]/30 hover:shadow-sm focus-visible:ring-2 focus-visible:ring-[#634CF8]/40 focus-visible:border-[#634CF8]/30 focus-visible:shadow-sm",
      )}
      {...listeners}
      {...attributes}
    >
      <div className="flex h-[44px] w-[44px] shrink-0 items-center justify-center rounded-md bg-[#F8F8FA] dark:bg-[#1a1a2e]">
        <span className="text-lg opacity-50">{block.icon}</span>
      </div>
      <div className="flex-1 min-w-0">
        <span className="text-[11px] font-medium text-foreground block truncate">
          {block.label}
        </span>
        <span className="text-[9px] text-muted/60">{block.description}</span>
      </div>
      <GripVertical size={14} className="text-muted/30 shrink-0" />
    </div>
  );
}

// ── Block Preview Thumbnail ──
function BlockPreview({ block }: { block: BlockDefinition }) {
  const cat = block.category;

  if (cat === "sections") {
    // Section blocks get a mini wireframe
    if (block.type === "navbar") {
      return (
        <div className="flex h-[44px] w-full items-center justify-between rounded-lg bg-[#F8F8FA] dark:bg-[#1a1a2e] px-2.5">
          <div className="h-2 w-6 rounded bg-[#634CF8]/25" />
          <div className="flex gap-1.5">
            <div className="h-1.5 w-4 rounded-full bg-muted/20" />
            <div className="h-1.5 w-4 rounded-full bg-muted/20" />
            <div className="h-1.5 w-4 rounded-full bg-muted/20" />
          </div>
        </div>
      );
    }
    if (block.type === "hero") {
      return (
        <div className="flex h-[44px] w-full flex-col items-center justify-center rounded-lg bg-[#F8F8FA] dark:bg-[#1a1a2e] gap-1">
          <div className="h-2 w-14 rounded bg-foreground/15" />
          <div className="h-1 w-10 rounded-full bg-muted/15" />
          <div className="h-2.5 w-8 rounded bg-[#634CF8]/25" />
        </div>
      );
    }
    if (block.type === "features") {
      return (
        <div className="flex h-[44px] w-full items-center justify-center rounded-lg bg-[#F8F8FA] dark:bg-[#1a1a2e] gap-1.5 px-2">
          {[1, 2, 3].map((i) => (
            <div
              className="flex flex-1 flex-col items-center gap-0.5 rounded bg-white/60 dark:bg-surface/60 p-1"
              key={i}
            >
              <div className="h-2 w-2 rounded-full bg-[#634CF8]/20" />
              <div className="h-0.5 w-4 rounded-full bg-muted/15" />
            </div>
          ))}
        </div>
      );
    }
    if (block.type === "pricing") {
      return (
        <div className="flex h-[44px] w-full items-end justify-center rounded-lg bg-[#F8F8FA] dark:bg-[#1a1a2e] gap-1 px-3 pb-1.5">
          {[14, 20, 16].map((h, i) => (
            <div
              className={clsx(
                "w-5 rounded-t",
                i === 1 ? "bg-[#634CF8]/25" : "bg-muted/15",
              )}
              key={i}
              style={{ height: h }}
            />
          ))}
        </div>
      );
    }
    if (block.type === "testimonials") {
      return (
        <div className="flex h-[44px] w-full items-center justify-center rounded-lg bg-[#F8F8FA] dark:bg-[#1a1a2e] gap-2 px-3">
          <div className="text-[10px] text-muted/40 italic">"</div>
          <div className="flex flex-col gap-0.5">
            <div className="h-1 w-12 rounded-full bg-muted/15" />
            <div className="h-1 w-8 rounded-full bg-muted/10" />
          </div>
        </div>
      );
    }
    if (block.type === "footer") {
      return (
        <div className="flex h-[44px] w-full items-center justify-center rounded-lg bg-[#F8F8FA] dark:bg-[#1a1a2e] border-t-2 border-separator/30 px-3">
          <div className="flex gap-2">
            <div className="h-1 w-5 rounded-full bg-muted/15" />
            <div className="h-1 w-5 rounded-full bg-muted/15" />
            <div className="h-1 w-5 rounded-full bg-muted/15" />
          </div>
        </div>
      );
    }
    if (block.type === "cta") {
      return (
        <div className="flex h-[44px] w-full flex-col items-center justify-center rounded-lg bg-[#634CF8]/[0.06] gap-1">
          <div className="h-1.5 w-10 rounded bg-foreground/12" />
          <div className="h-2.5 w-8 rounded bg-[#634CF8]/25" />
        </div>
      );
    }
    if (block.type === "stats") {
      return (
        <div className="flex h-[44px] w-full items-center justify-center rounded-lg bg-[#F8F8FA] dark:bg-[#1a1a2e] gap-3 px-3">
          {[1, 2, 3].map((i) => (
            <div className="flex flex-col items-center gap-0.5" key={i}>
              <div className="text-[8px] font-bold text-[#634CF8]/40">99</div>
              <div className="h-0.5 w-4 rounded-full bg-muted/15" />
            </div>
          ))}
        </div>
      );
    }
    if (block.type === "faq") {
      return (
        <div className="flex h-[44px] w-full flex-col justify-center rounded-lg bg-[#F8F8FA] dark:bg-[#1a1a2e] gap-1 px-3">
          {[1, 2].map((i) => (
            <div className="flex items-center justify-between" key={i}>
              <div className="h-1 w-10 rounded-full bg-muted/15" />
              <div className="h-1.5 w-1.5 rounded-full bg-muted/20" />
            </div>
          ))}
        </div>
      );
    }
    // Generic section fallback
    return (
      <div className="flex h-[44px] w-full items-center justify-center rounded-lg bg-[#F8F8FA] dark:bg-[#1a1a2e]">
        <span className="text-lg opacity-50">{block.icon}</span>
      </div>
    );
  }

  // Content / Layout / Media
  return (
    <div className="flex h-[44px] w-full items-center justify-center rounded-lg bg-[#F8F8FA] dark:bg-[#1a1a2e]">
      <span className="text-lg opacity-50">{block.icon}</span>
    </div>
  );
}

// ── Draggable Component Card ──
function DraggableComponentCard({
  component,
}: {
  component: ComponentDefinition;
}) {
  const { attributes, listeners, setNodeRef, isDragging } = useDraggable({
    id: `sidebar-comp-${component.type}`,
    data: { type: "sidebar-block", blockType: component.type },
  });

  return (
    <div
      ref={setNodeRef}
      className={clsx(
        "flex items-center gap-2.5 rounded-lg border border-separator/40 bg-white dark:bg-surface px-3 py-2.5 transition-all cursor-grab active:cursor-grabbing select-none outline-none",
        isDragging
          ? "opacity-50 border-[#634CF8] shadow-lg scale-95"
          : "hover:border-[#634CF8]/30 hover:shadow-sm focus-visible:ring-2 focus-visible:ring-[#634CF8]/40 focus-visible:border-[#634CF8]/30 focus-visible:shadow-sm",
      )}
      {...listeners}
      {...attributes}
    >
      <span className="text-sm">{component.icon}</span>
      <div className="flex-1 min-w-0">
        <span className="text-[12px] font-medium text-foreground block truncate">
          {component.label}
        </span>
        <span className="text-[9px] text-muted/60">
          {component.description}
        </span>
      </div>
      {/* Drag indicator */}
      <GripVertical size={14} className="text-muted/30 shrink-0" />
    </div>
  );
}

// ── Selection Card ──
function SelectionCard({
  selected = false,
  children,
  label,
  className,
  onClick,
}: {
  selected?: boolean;
  children: React.ReactNode;
  label: string;
  className?: string;
  onClick: () => void;
}) {
  return (
    <button
      className={clsx(
        "flex flex-col items-center gap-1.5 rounded-lg border-2 p-2 transition-all cursor-pointer",
        selected
          ? "border-[#634CF8] bg-[#634CF8]/[0.03]"
          : "border-separator/40 bg-white dark:bg-surface hover:border-muted/80",
        className,
      )}
      onClick={onClick}
    >
      {children}
      <div className="flex items-center gap-1.5">
        {selected && (
          <CircleCheck size={14} className="text-[#634CF8]" />
        )}
        <span
          className={clsx(
            "text-[12px]",
            selected
              ? "text-[#634CF8] font-semibold"
              : "text-muted font-medium",
          )}
        >
          {label}
        </span>
      </div>
    </button>
  );
}

// ═══════════════════════════════════════════════════════════════════════════════
// PANELS
// ═══════════════════════════════════════════════════════════════════════════════

// ── Blocks Panel ──
function BlocksPanel({ query }: { query: string }) {
  const categories = Object.keys(BLOCK_CATEGORIES) as BlockCategory[];
  const q = query.toLowerCase().trim();

  return (
    <div className="flex flex-col gap-2">
      <p className="text-[11px] text-muted pb-1 leading-relaxed">
        Drag blocks onto the canvas to build your page.
      </p>
      {categories.map((cat) => {
        const meta = BLOCK_CATEGORIES[cat];
        const allBlocks = BLOCK_DEFINITIONS.filter((b) => b.category === cat);
        const blocks = q
          ? allBlocks.filter(
              (b) =>
                b.label.toLowerCase().includes(q) ||
                b.type.toLowerCase().includes(q) ||
                b.description.toLowerCase().includes(q),
            )
          : allBlocks;
        if (blocks.length === 0) return null;
        const isSections = cat === "sections";
        return (
          <CollapsibleSection
            count={blocks.length}
            defaultOpen={isSections || !!q}
            icon={meta.icon}
            key={cat}
            title={meta.label}
          >
            {isSections ? (
              <div className="grid grid-cols-2 gap-2">
                {blocks.map((block) => (
                  <DraggableBlockCard block={block} key={block.type} />
                ))}
              </div>
            ) : (
              <div className="flex flex-col gap-2">
                {blocks.map((block) => (
                  <DraggableBlockCardList block={block} key={block.type} />
                ))}
              </div>
            )}
          </CollapsibleSection>
        );
      })}
      {q && categories.every((cat) => {
        const blocks = BLOCK_DEFINITIONS.filter((b) => b.category === cat);
        return blocks.filter(
          (b) =>
            b.label.toLowerCase().includes(q) ||
            b.type.toLowerCase().includes(q) ||
            b.description.toLowerCase().includes(q),
        ).length === 0;
      }) && (
        <div className="rounded-lg bg-[#F8F8FA] dark:bg-surface p-3 text-center">
          <p className="text-[11px] text-muted">No blocks match &ldquo;{query}&rdquo;</p>
        </div>
      )}
    </div>
  );
}

// ── Components Panel ──
function ComponentsPanel({ query }: { query: string }) {
  const categories = Object.keys(
    COMPONENT_CATEGORIES,
  ) as (keyof typeof COMPONENT_CATEGORIES)[];
  const q = query.toLowerCase().trim();

  return (
    <div className="flex flex-col gap-2">
      <p className="text-[11px] text-muted py-1 leading-relaxed">
        UI elements to use inside blocks.
      </p>
      {categories.map((cat) => {
        const meta = COMPONENT_CATEGORIES[cat];
        const allComps = COMPONENT_DEFINITIONS.filter((c) => c.category === cat);
        const comps = q
          ? allComps.filter(
              (c) =>
                c.label.toLowerCase().includes(q) ||
                c.type.toLowerCase().includes(q) ||
                c.description.toLowerCase().includes(q),
            )
          : allComps;
        if (comps.length === 0) return null;
        return (
          <CollapsibleSection
            count={comps.length}
            defaultOpen={!!q || true}
            icon={meta.icon}
            key={cat}
            title={meta.label}
          >
            <div className="flex flex-col gap-2">
              {comps.map((comp) => (
                <DraggableComponentCard component={comp} key={comp.type} />
              ))}
            </div>
          </CollapsibleSection>
        );
      })}
    </div>
  );
}

// ── Design Panel ──
function DesignPanel({
  design,
  onUpdate,
  query,
}: {
  design: DesignSettings;
  onUpdate: <K extends keyof DesignSettings>(
    key: K,
    value: DesignSettings[K],
  ) => void;
  query: string;
}) {
  const q = query.toLowerCase().trim();
  const show = (label: string) => !q || label.toLowerCase().includes(q);
  return (
    <div className="flex flex-col gap-1">
      {show("mood light dark theme") && <CollapsibleSection title="Mood">
        <div className="flex gap-2">
          <SelectionCard
            label="Light"
            selected={design.mood === "light"}
            onClick={() => onUpdate("mood", "light")}
          >
            <div className="flex h-[40px] w-[40px] items-center justify-center rounded-lg bg-white border border-separator/50">
              <Sun className="h-5 w-5 text-gray-300" />
            </div>
          </SelectionCard>
          <SelectionCard
            label="Dark"
            selected={design.mood === "dark"}
            onClick={() => onUpdate("mood", "dark")}
          >
            <div className="flex h-[40px] w-[40px] items-center justify-center rounded-lg bg-[#1A1A2E]">
              <Moon className="h-5 w-5 text-white" />
            </div>
          </SelectionCard>
        </div>
      </CollapsibleSection>}

      {show("color main brand hex") && <CollapsibleSection title="Main Color">
        <div className="flex items-center gap-3">
          <input
            aria-label="Main color hex code"
            className="h-9 flex-1 min-w-0 rounded-lg border border-separator/60 bg-white dark:bg-surface px-3 text-sm font-mono text-foreground outline-none focus:border-[#634CF8] transition-colors"
            value={design.mainColor}
            onChange={(e) =>
              onUpdate("mainColor", e.target.value.replace("#", ""))
            }
          />
          <div className="relative">
            <div
              className="h-9 w-9 shrink-0 rounded-lg shadow-sm cursor-pointer hover:scale-105 transition-transform"
              style={{ backgroundColor: `#${design.mainColor}` }}
            />
            <input
              aria-label="Color picker"
              className="absolute inset-0 opacity-0 cursor-pointer w-full h-full"
              type="color"
              value={`#${design.mainColor}`}
              onChange={(e) =>
                onUpdate("mainColor", e.target.value.replace("#", ""))
              }
            />
          </div>
        </div>
        <p className="mt-2 text-[11px] text-muted">
          Enter hex code or click the swatch to pick a color.
        </p>
        {/* Quick color presets */}
        <div className="flex flex-wrap gap-1.5 mt-3">
          {[
            "634CF8",
            "3B82F6",
            "10B981",
            "F59E0B",
            "EC4899",
            "EF4444",
            "8B5CF6",
            "06B6D4",
            "171717",
          ].map((c) => (
            <button
              className={clsx(
                "h-5 w-5 rounded-md transition-all hover:scale-110",
                design.mainColor === c && "ring-2 ring-offset-1 ring-[#634CF8]",
              )}
              key={c}
              style={{ backgroundColor: `#${c}` }}
              title={`#${c}`}
              onClick={() => onUpdate("mainColor", c)}
            />
          ))}
        </div>
      </CollapsibleSection>}

      {show("background theme solid pattern gradient opacity") && <CollapsibleSection title="Background Theme">
        <div className="grid grid-cols-3 gap-2">
          {(["solid", "pattern", "gradient"] as const).map((theme) => (
            <SelectionCard
              key={theme}
              label={theme.charAt(0).toUpperCase() + theme.slice(1)}
              selected={design.backgroundTheme === theme}
              onClick={() => onUpdate("backgroundTheme", theme)}
            >
              <div
                className={clsx(
                  "h-[36px] w-[48px] rounded-md",
                  theme === "solid" &&
                    "bg-gradient-to-br from-gray-50 to-gray-100 dark:from-gray-700 dark:to-gray-800",
                  theme === "pattern" && "bg-[#F7F7F8] dark:bg-surface",
                  theme === "gradient" &&
                    "bg-gradient-to-br from-purple-100 via-white to-blue-100 dark:from-purple-900/40 dark:via-gray-800 dark:to-blue-900/40",
                )}
              />
            </SelectionCard>
          ))}
        </div>
        <div className="mt-4 flex items-center gap-3">
          <div className="flex-1">
            <Slider
              aria-label="Background opacity"
              maxValue={100}
              minValue={0}
              value={design.backgroundOpacity}
              onChange={(val) => onUpdate("backgroundOpacity", val as number)}
            >
              <Slider.Track>
                <Slider.Fill />
                <Slider.Thumb />
              </Slider.Track>
            </Slider>
          </div>
          <div className="flex h-8 w-14 items-center justify-center rounded-lg border border-separator/60 bg-white dark:bg-surface text-xs font-medium text-foreground tabular-nums">
            %{design.backgroundOpacity}
          </div>
        </div>
      </CollapsibleSection>}

      {show("typography font inter jakarta poppins sora grotesk") && <CollapsibleSection title="Typographies">
        <div className="grid grid-cols-3 gap-2">
          {(
            [
              { id: "inter", label: "Inter", family: "'Inter', sans-serif" },
              {
                id: "plus-jakarta",
                label: "Plus Jakarta",
                family: "'Plus Jakarta Sans', sans-serif",
              },
              {
                id: "space-grotesk",
                label: "Space Gr...",
                family: "'Space Grotesk', sans-serif",
              },
              {
                id: "poppins",
                label: "Poppins",
                family: "'Poppins', sans-serif",
              },
              {
                id: "dm-sans",
                label: "DM Sans",
                family: "'DM Sans', sans-serif",
              },
              { id: "sora", label: "Sora", family: "'Sora', sans-serif" },
            ] as const
          ).map((font) => (
            <SelectionCard
              key={font.id}
              label={font.label}
              selected={design.typography === font.id}
              onClick={() => onUpdate("typography", font.id)}
            >
              <div className="flex h-[38px] w-full items-center justify-center rounded-md bg-[#F8F8FA] dark:bg-[#1a1a2e]">
                <span
                  className="text-[20px] font-bold text-foreground"
                  style={{ fontFamily: font.family }}
                >
                  Aa
                </span>
              </div>
            </SelectionCard>
          ))}
        </div>
      </CollapsibleSection>}

      {show("radius border rounded corner") && <CollapsibleSection title="Radius">
        <div className="grid grid-cols-4 gap-2">
          {(
            [
              "none",
              "sm",
              "md",
              "lg",
              "xl",
              "2xl",
              "3xl",
              "full",
            ] as RadiusToken[]
          ).map((key) => {
            const token = RADIUS_TOKENS[key];
            return (
              <SelectionCard
                key={key}
                label={token.label}
                selected={design.radius === key}
                onClick={() =>
                  onUpdate("radius", key as DesignSettings["radius"])
                }
              >
                <div
                  className="h-[28px] w-full border-2 border-separator/40 bg-[#F8F8FA] dark:bg-[#1a1a2e]"
                  style={{ borderRadius: token.value }}
                />
              </SelectionCard>
            );
          })}
        </div>
      </CollapsibleSection>}

      {/* ── HeroUI Color Tokens ── */}
      {show("color token accent success warning danger") && <CollapsibleSection defaultOpen={false} title="Color Tokens">
        <div className="flex flex-col gap-2">
          <p className="text-[10px] text-muted mb-1">
            Semantic colors from HeroUI theme
          </p>
          {[
            {
              name: "Accent",
              var: "--accent",
              light: "oklch(0.62 0.195 253.83)",
            },
            {
              name: "Success",
              var: "--success",
              light: "oklch(0.73 0.19 150.81)",
            },
            {
              name: "Warning",
              var: "--warning",
              light: "oklch(0.78 0.16 72.33)",
            },
            {
              name: "Danger",
              var: "--danger",
              light: "oklch(0.65 0.23 25.74)",
            },
            {
              name: "Default",
              var: "--default",
              light: "oklch(0.94 0.001 286.38)",
            },
            { name: "Surface", var: "--surface", light: "oklch(1 0 0)" },
            {
              name: "Background",
              var: "--background",
              light: "oklch(0.97 0 0)",
            },
            {
              name: "Muted",
              var: "--muted",
              light: "oklch(0.55 0.014 285.94)",
            },
          ].map((c) => (
            <div className="flex items-center gap-2" key={c.var}>
              <div
                className="h-6 w-6 rounded-md border border-separator/40 shrink-0"
                style={{ background: `var(${c.var}, ${c.light})` }}
              />
              <div className="flex-1 min-w-0">
                <p className="text-[11px] font-medium text-foreground">
                  {c.name}
                </p>
                <p className="text-[9px] text-muted font-mono truncate">
                  {c.var}
                </p>
              </div>
            </div>
          ))}
        </div>
      </CollapsibleSection>}

      {/* ── Border & Separator ── */}
      {show("border separator width style") && <CollapsibleSection defaultOpen={false} title="Borders">
        <div className="flex flex-col gap-3">
          <div>
            <p className="text-[11px] font-medium text-muted mb-2">
              Border Width
            </p>
            <div className="flex gap-2">
              {["0px", "1px", "2px"].map((w) => (
                <div className="flex flex-col items-center gap-1" key={w}>
                  <div
                    className="h-8 w-full rounded-md bg-[#F8F8FA] dark:bg-[#1a1a2e]"
                    style={{ border: `${w} solid var(--border, #e5e5e5)` }}
                  />
                  <span className="text-[9px] text-muted">{w}</span>
                </div>
              ))}
            </div>
          </div>
          <div>
            <p className="text-[11px] font-medium text-muted mb-2">
              Separator Styles
            </p>
            <div className="flex flex-col gap-2">
              <hr className="border-separator" />
              <hr className="border-separator border-dashed" />
              <hr className="border-separator border-dotted" />
            </div>
          </div>
        </div>
      </CollapsibleSection>}

      {/* ── Shadows ── */}
      {show("shadow elevation") && <CollapsibleSection defaultOpen={false} title="Shadows">
        <div className="grid grid-cols-2 gap-2">
          {[
            { name: "None", shadow: "none" },
            {
              name: "Surface",
              shadow: "var(--surface-shadow, 0 2px 4px rgba(0,0,0,0.04))",
            },
            {
              name: "Overlay",
              shadow: "var(--overlay-shadow, 0 2px 8px rgba(0,0,0,0.06))",
            },
            {
              name: "Field",
              shadow: "var(--field-shadow, 0 1px 2px rgba(0,0,0,0.06))",
            },
          ].map((s) => (
            <div className="flex flex-col items-center gap-1.5" key={s.name}>
              <div
                className="h-10 w-full rounded-lg bg-white dark:bg-surface"
                style={{ boxShadow: s.shadow }}
              />
              <span className="text-[10px] text-muted">{s.name}</span>
            </div>
          ))}
        </div>
      </CollapsibleSection>}

      {/* ── Spacing ── */}
      {show("spacing padding margin gap") && <CollapsibleSection defaultOpen={false} title="Spacing Scale">
        <div className="flex flex-col gap-1">
          <p className="text-[10px] text-muted mb-1">
            Base: --spacing = 0.25rem (4px)
          </p>
          {[
            { label: "1", value: "0.25rem" },
            { label: "2", value: "0.5rem" },
            { label: "3", value: "0.75rem" },
            { label: "4", value: "1rem" },
            { label: "6", value: "1.5rem" },
            { label: "8", value: "2rem" },
            { label: "12", value: "3rem" },
            { label: "16", value: "4rem" },
            { label: "24", value: "6rem" },
          ].map((s) => (
            <div className="flex items-center gap-2" key={s.label}>
              <span className="text-[10px] text-muted w-5 text-right tabular-nums">
                {s.label}
              </span>
              <div
                className="h-3 rounded-sm bg-[#634CF8]/20"
                style={{ width: s.value }}
              />
              <span className="text-[9px] text-muted/60 font-mono">
                {s.value}
              </span>
            </div>
          ))}
        </div>
      </CollapsibleSection>}

      {/* ── Opacity ── */}
      {show("opacity transparency") && <CollapsibleSection defaultOpen={false} title="Opacity">
        <div className="flex gap-2">
          {[100, 80, 60, 40, 20].map((o) => (
            <div className="flex flex-col items-center gap-1" key={o}>
              <div
                className="h-8 w-8 rounded-md bg-[#634CF8]"
                style={{ opacity: o / 100 }}
              />
              <span className="text-[9px] text-muted">{o}%</span>
            </div>
          ))}
        </div>
        <p className="text-[10px] text-muted mt-2">
          Disabled opacity: 0.5 (--disabled-opacity)
        </p>
      </CollapsibleSection>}

      {/* ── Animations ── */}
      {show("animation easing transition") && <CollapsibleSection defaultOpen={false} title="Animations">
        <div className="flex flex-col gap-2">
          <p className="text-[10px] text-muted">
            Easing curves from HeroUI theme
          </p>
          {[
            { name: "Smooth", value: "ease" },
            { name: "Out Quint", value: "cubic-bezier(0.23, 1, 0.32, 1)" },
            { name: "Out Fluid", value: "cubic-bezier(0.32, 0.72, 0, 1)" },
            {
              name: "In Out Cubic",
              value: "cubic-bezier(0.645, 0.045, 0.355, 1)",
            },
            { name: "Linear", value: "linear" },
          ].map((e) => (
            <div className="flex items-center gap-2" key={e.name}>
              <div className="h-1.5 w-1.5 rounded-full bg-[#634CF8]" />
              <span className="text-[11px] font-medium text-foreground">
                {e.name}
              </span>
              <span className="text-[9px] text-muted/60 font-mono ml-auto truncate max-w-[120px]">
                {e.value}
              </span>
            </div>
          ))}
        </div>
      </CollapsibleSection>}

      {/* ── Cursor ── */}
      {show("cursor pointer disabled") && <CollapsibleSection defaultOpen={false} title="Cursor">
        <div className="flex gap-3">
          {[
            { name: "Interactive", value: "pointer", icon: <MousePointer size={14} /> },
            { name: "Disabled", value: "not-allowed", icon: <Ban size={14} /> },
          ].map((c) => (
            <div
              className="flex items-center gap-2 rounded-lg border border-separator/40 px-3 py-2"
              key={c.name}
              style={{ cursor: c.value }}
            >
              <span>{c.icon}</span>
              <span className="text-[11px] text-foreground">{c.name}</span>
            </div>
          ))}
        </div>
      </CollapsibleSection>}
    </div>
  );
}

// ── Templates Panel ──
function TemplatesPanel({
  onSelect,
  query,
}: {
  onSelect: (template: Template) => void;
  query: string;
}) {
  const q = query.toLowerCase().trim();
  const filtered = q
    ? TEMPLATES.filter(
        (t) =>
          t.name.toLowerCase().includes(q) ||
          t.category.toLowerCase().includes(q),
      )
    : TEMPLATES;

  return (
    <div className="flex flex-col gap-3 pt-2">
      <p className="text-[11px] text-muted leading-relaxed">
        Choose a template to start with.
      </p>
      <div className="grid grid-cols-2 gap-3">
        {filtered.map((template) => (
          <button
            className="group flex flex-col overflow-hidden rounded-xl border-2 border-separator/40 bg-white dark:bg-surface transition-all hover:border-[#634CF8]/40 hover:shadow-md active:scale-[0.98]"
            key={template.id}
            onClick={() => onSelect(template)}
          >
            <div className="h-28 w-full bg-gradient-to-br from-[#F8F8FA] to-[#EFEFEF] dark:from-gray-800 dark:to-gray-900 flex items-center justify-center relative">
              <Monitor size={32} className="opacity-25 text-muted" />
              <span className="absolute bottom-2 right-2 text-[9px] font-semibold text-[#634CF8] bg-[#634CF8]/10 rounded-md px-1.5 py-0.5 opacity-0 group-hover:opacity-100 transition-opacity">
                Use →
              </span>
            </div>
            <div className="p-3 text-left">
              <p className="text-[13px] font-semibold text-foreground">
                {template.name}
              </p>
              <p className="text-[11px] text-muted capitalize">
                {template.category}
              </p>
            </div>
          </button>
        ))}
      </div>
    </div>
  );
}

// ═══════════════════════════════════════════════════════════════════════════════
// MAIN SIDEBAR
// ═══════════════════════════════════════════════════════════════════════════════

// ── Sidebar Search Input ──
function SidebarSearch({
  placeholder,
  value,
  onChange,
}: {
  placeholder: string;
  value: string;
  onChange: (v: string) => void;
}) {
  return (
    <div className="relative">
      <Search
        className="absolute left-3 top-1/2 -translate-y-1/2 h-3.5 w-3.5 text-muted"
      />
      <input
        className="w-full h-8 rounded-lg border border-separator/50 bg-[#FAFAFA] dark:bg-surface pl-9 pr-8 text-[11px] text-foreground outline-none focus:border-[#634CF8] placeholder:text-muted/50"
        placeholder={placeholder}
        value={value}
        onChange={(e) => onChange(e.target.value)}
        onKeyDown={(e) => {
          if (e.key === "Escape") {
            onChange("");
            (e.target as HTMLInputElement).blur();
          }
        }}
      />
      {value && (
        <button
          className="absolute right-2 top-1/2 -translate-y-1/2 text-[10px] text-muted hover:text-foreground"
          onClick={() => onChange("")}
        >
          ✕
        </button>
      )}
    </div>
  );
}

// ── Nav Items ──
const NAV_ITEMS: { id: SidebarPanel; icon: React.ReactNode; label: string }[] = [
  { id: "blocks", icon: <LayoutGrid size={16} />, label: "Blocks" },
  { id: "components", icon: <Component size={16} />, label: "UI" },
  { id: "design", icon: <Palette size={16} />, label: "Design" },
  { id: "templates", icon: <FileText size={16} />, label: "Tpl" },
  { id: "pages", icon: <Files size={16} />, label: "Pages" },
  { id: "menus", icon: <Menu size={16} />, label: "Menus" },
];

export function Sidebar({
  activePanel,
  design,
  width,
  pagesPanel,
  menusPanel,
  onDesignUpdate,
  onPanelChange,
  onTemplateSelect,
}: {
  activePanel: SidebarPanel;
  design: DesignSettings;
  width: number;
  pagesPanel?: React.ReactNode;
  menusPanel?: React.ReactNode;
  onDesignUpdate: <K extends keyof DesignSettings>(
    key: K,
    value: DesignSettings[K],
  ) => void;
  onPanelChange: (panel: SidebarPanel) => void;
  onTemplateSelect: (template: Template) => void;
}) {
  const [searchQuery, setSearchQuery] = useState("");

  // Clear search when switching tabs
  const handlePanelChange = (panel: SidebarPanel) => {
    setSearchQuery("");
    onPanelChange(panel);
  };

  return (
    <aside
      className="flex h-full shrink-0 border-r border-separator/50 bg-white dark:bg-background overflow-hidden"
      style={{ width: `${width}px` }}
    >
      {/* Left icon strip — vertical on desktop, horizontal bottom bar on mobile */}
      <div className="flex w-full md:w-12 md:flex-col shrink-0 border-t md:border-t-0 md:border-r border-separator/50 bg-[#FAFAFA] dark:bg-[#0f0f1a] py-1 md:py-2 overflow-x-auto md:overflow-x-visible order-last md:order-first">
        {NAV_ITEMS.map((item) => {
          const isActive = activePanel === item.id;
          return (
            <button
              key={item.id}
              className={clsx(
                "relative flex flex-col items-center justify-center gap-0.5 py-1.5 md:py-2 px-3 md:px-0 md:w-10 md:mx-auto rounded-lg transition-colors outline-none",
                isActive
                  ? "text-[#634CF8] bg-[#634CF8]/8"
                  : "text-muted hover:text-foreground hover:bg-surface/80",
              )}
              title={item.label}
              onClick={() => handlePanelChange(item.id)}
            >
              {/* Active left border indicator (desktop only) */}
              {isActive && (
                <div className="hidden md:block absolute -left-1 top-1/2 -translate-y-1/2 w-[3px] h-5 rounded-r-full bg-[#634CF8]" />
              )}
              <span className="text-base leading-none flex items-center justify-center">{item.icon}</span>
              <span className="text-[9px] font-medium leading-tight">{item.label}</span>
            </button>
          );
        })}
      </div>

      {/* Right content area */}
      <div className="flex-1 overflow-y-auto overflow-x-hidden px-3 min-w-0">
        {/* Sticky search above all panels */}
        <div className="sticky top-0 z-10 bg-white dark:bg-background pt-3 pb-2">
          <SidebarSearch
            placeholder={
              activePanel === "blocks" ? "Search blocks..."
              : activePanel === "components" ? "Search components..."
              : activePanel === "design" ? "Search design options..."
              : activePanel === "templates" ? "Search templates..."
              : "Search..."
            }
            value={searchQuery}
            onChange={setSearchQuery}
          />
        </div>
        {activePanel === "blocks" && <BlocksPanel query={searchQuery} />}
        {activePanel === "components" && <ComponentsPanel query={searchQuery} />}
        {activePanel === "design" && (
          <DesignPanel design={design} onUpdate={onDesignUpdate} query={searchQuery} />
        )}
        {activePanel === "templates" && (
          <TemplatesPanel onSelect={onTemplateSelect} query={searchQuery} />
        )}
        {activePanel === "pages" && pagesPanel}
        {activePanel === "menus" && menusPanel}
      </div>
    </aside>
  );
}
