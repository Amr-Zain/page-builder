import { useState } from "react";
import { Button, Drawer, TextField, Label, Input } from "@heroui/react";
import clsx from "clsx";
import { FileText } from "lucide-react";

import type { Page } from "../pages";

export function PagesPanel({
  pages,
  activePageId,
  onSelectPage,
  onCreatePage,
  onDeletePage,
  onDuplicatePage,
  onUpdatePageSettings,
}: {
  pages: Page[];
  activePageId: string;
  onSelectPage: (id: string) => void;
  onCreatePage: (name: string, locale: "en" | "ar") => void;
  onDeletePage: (id: string) => void;
  onDuplicatePage: (id: string) => void;
  onUpdatePageSettings: (
    id: string,
    settings: Partial<Page["settings"]>,
  ) => void;
}) {
  const [isCreating, setIsCreating] = useState(false);
  const [newPageName, setNewPageName] = useState("");
  const [newPageLocale, setNewPageLocale] = useState<"en" | "ar">("en");
  const [cssDrawerPageId, setCssDrawerPageId] = useState<string | null>(null);

  const cssDrawerPage = pages.find((p) => p.id === cssDrawerPageId);

  const handleCreate = () => {
    if (!newPageName.trim()) return;
    onCreatePage(newPageName.trim(), newPageLocale);
    setNewPageName("");
    setNewPageLocale("en");
    setIsCreating(false);
  };

  return (
    <div className="flex flex-col gap-4 pt-2">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <p className="text-[13px] font-semibold text-foreground">Pages</p>
          <p className="text-[10px] text-muted">
            {pages.length} page{pages.length !== 1 ? "s" : ""}
          </p>
        </div>
        <Button
          variant="primary"
          size="sm"
          onPress={() => setIsCreating(true)}
        >
          + New
        </Button>
      </div>

      {/* Create */}
      {isCreating && (
        <div className="flex flex-col gap-2 p-4 rounded-sm border border-[#634CF8]/30 bg-[#634CF8]/5">
          <p className="text-[11px] font-semibold text-foreground">
            Create new page
          </p>
          <TextField
            autoFocus
            className="w-full"
            value={newPageName}
            onChange={setNewPageName}
            onKeyDown={(e) => e.key === "Enter" && handleCreate()}
          >
            <Input placeholder="Page name..." />
          </TextField>

          <div className="flex flex-col gap-1.5 mt-1">
            <p className="text-[10px] text-muted font-medium uppercase tracking-wider">Language</p>
            <div className="flex gap-1.5 p-1 bg-surface rounded-sm border border-separator/40">
              <button
                className={clsx(
                  "flex-1 py-1 text-[11px] font-semibold rounded-md transition-all",
                  newPageLocale === "en" ? "bg-white shadow-sm text-foreground" : "text-muted hover:text-foreground"
                )}
                onClick={() => setNewPageLocale("en")}
              >
                English
              </button>
              <button
                className={clsx(
                  "flex-1 py-1 text-[11px] font-semibold rounded-md transition-all",
                  newPageLocale === "ar" ? "bg-white shadow-sm text-foreground" : "text-muted hover:text-foreground"
                )}
                onClick={() => setNewPageLocale("ar")}
              >
                Arabic
              </button>
            </div>
          </div>
          <div className="flex gap-2">
            <Button
              className="flex-1"
              variant="primary"
              size="sm"
              onPress={handleCreate}
            >
              Create Page
            </Button>
            <Button
              className="flex-1"
              variant="secondary"
              size="sm"
              onPress={() => {
                setIsCreating(false);
                setNewPageName("");
              }}
            >
              Cancel
            </Button>
          </div>
        </div>
      )}

      {/* Page list */}
      <div className="flex flex-col gap-2">
        {pages.map((page) => {
          const isActive = page.id === activePageId;
          return (
            <div
              className={clsx(
                "rounded-sm border transition-all duration-300 cursor-pointer overflow-hidden",
                isActive
                  ? "border-[#634CF8] bg-white dark:bg-[#151525] shadow-[0_2px_12px_rgba(99,76,248,0.06)] ring-1 ring-[#634CF8]/20"
                  : "border-separator/30 bg-white dark:bg-surface/50 hover:border-[#634CF8]/30 hover:bg-white dark:hover:bg-surface",
              )}
              key={page.id}
              onClick={() => onSelectPage(page.id)}
            >
              {/* Page info */}
              <div className="p-4">
                <div className="flex items-start justify-between gap-3">
                  <div className="flex items-center gap-3 min-w-0">
                    <div
                      className={clsx(
                        "flex h-10 w-10 items-center justify-center rounded-sm shrink-0 text-lg transition-colors duration-300",
                        isActive
                          ? "bg-[#634CF8] text-white shadow-md shadow-[#634CF8]/15"
                          : "bg-surface dark:bg-[#1C1C2E] border border-separator/20 text-muted",
                      )}
                    >
                      <FileText size={18} />
                    </div>
                    <div className="min-w-0">
                      <div className="flex items-center gap-2">
                        <p className={clsx(
                          "text-[13px] font-bold truncate transition-colors",
                          isActive ? "text-foreground" : "text-foreground/80"
                        )}>
                          {page.settings.title}
                        </p>
                        <span className={clsx(
                          "text-[9px] font-bold px-1.5 py-0.5 rounded-md border uppercase tracking-wider",
                          page.settings.locale === "ar" 
                            ? "bg-amber-500/10 text-amber-600 border-amber-500/20" 
                            : "bg-[#634CF8]/10 text-[#634CF8] border-[#634CF8]/20"
                        )}>
                          {page.settings.locale || "en"}
                        </span>
                      </div>
                      <p className="text-[11px] text-muted/60 font-mono mt-0.5">
                        /{page.settings.slug}
                      </p>
                    </div>
                  </div>
                  <span
                    className={clsx(
                      "text-[9px] font-bold px-2 py-0.5 rounded-full shrink-0 uppercase tracking-widest border",
                      page.settings.published
                        ? "bg-green-500/10 text-green-600 border-green-500/20"
                        : "bg-amber-500/10 text-amber-600 border-amber-500/20",
                    )}
                  >
                    {page.settings.published ? "Published" : "Draft"}
                  </span>
                </div>

                {/* Meta */}
                <div className="flex items-center gap-3 mt-4 text-[10px] text-muted/50 font-medium">
                  <div className="flex items-center gap-1">
                    <span className="w-1 h-1 rounded-full bg-muted/30" />
                    {page.blocks?.length || 0} blocks
                  </div>
                  <div className="flex items-center gap-1">
                    <span className="w-1 h-1 rounded-full bg-muted/30" />
                    Modified {new Date(page.settings.updatedAt).toLocaleDateString()}
                  </div>
                </div>
              </div>

              {/* Actions — only for active page */}
              {isActive && (
                <div className="flex items-center gap-1 px-3 py-2 border-t border-separator/20 bg-surface/30 dark:bg-black/20">
                  <ActionLink
                    label="⧉ Duplicate"
                    onClick={(e) => {
                      e.stopPropagation();
                      onDuplicatePage(page.id);
                    }}
                  />
                  <ActionLink
                    label="🎨 Custom CSS"
                    onClick={(e) => {
                      e.stopPropagation();
                      setCssDrawerPageId(page.id);
                    }}
                  />
                  {pages.length > 1 && (
                    <ActionLink
                      danger
                      label="✕ Delete"
                      onClick={(e) => {
                        e.stopPropagation();
                        onDeletePage(page.id);
                      }}
                    />
                  )}
                </div>
              )}
            </div>
          );
        })}
      </div>

      {/* Tip */}
      <div className="rounded-xl bg-[#F8F8FA] dark:bg-surface p-4">
        <p className="text-[11px] text-muted leading-relaxed">
          💡 Select a page to edit it. Page settings (SEO, permalink,
          visibility) are in the right panel.
        </p>
      </div>

      {/* ── Custom CSS Drawer ── */}
      <Drawer.Backdrop
        isOpen={!!cssDrawerPageId}
        variant="blur"
        onOpenChange={(open) => !open && setCssDrawerPageId(null)}
      >
        <Drawer.Content placement="right">
          <Drawer.Dialog className="w-[500px]">
            <Drawer.CloseTrigger />
            <Drawer.Header>
              <Drawer.Heading>
                Custom CSS — {cssDrawerPage?.settings.title}
              </Drawer.Heading>
            </Drawer.Header>
            <Drawer.Body>
              <div className="flex flex-col gap-4">
                <div className="rounded-lg bg-amber-50 dark:bg-amber-900/20 border border-amber-200 dark:border-amber-800 p-3">
                  <p className="text-[11px] text-amber-800 dark:text-amber-300">
                    ⚠️ Custom CSS is not validated and incorrect code may impact
                    your website's performance.
                  </p>
                </div>

                <div>
                  <Label className="text-[12px] font-semibold text-foreground block mb-2">
                    Custom CSS
                  </Label>
                  <p className="text-[11px] text-muted mb-2">
                    Add custom CSS styles to this page only.
                  </p>
                  <textarea
                    className="w-full rounded-lg border border-separator/50 bg-[#0f0f1a] text-green-400 px-4 py-3 text-[12px] font-mono outline-none focus:border-[#634CF8] resize-none h-64 leading-relaxed"
                    placeholder={`/* Custom styles */\n\n.hero-section {\n  background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);\n}\n\n.cta-button {\n  box-shadow: 0 4px 14px rgba(0, 0, 0, 0.1);\n}`}
                    value={cssDrawerPage?.settings.customCSS || ""}
                    onChange={(e) =>
                      cssDrawerPageId &&
                      onUpdatePageSettings(cssDrawerPageId, {
                        customCSS: e.target.value,
                      })
                    }
                  />
                </div>

                <div>
                  <Label className="text-[12px] font-semibold text-foreground block mb-2">
                    Inside &lt;head&gt;
                  </Label>
                  <p className="text-[11px] text-muted mb-2">
                    Add custom code inside the head section of this page.
                  </p>
                  <textarea
                    className="w-full rounded-lg border border-separator/50 bg-[#0f0f1a] text-blue-400 px-4 py-3 text-[11px] font-mono outline-none focus:border-[#634CF8] resize-none h-32 leading-relaxed"
                    placeholder={`<!-- Analytics, meta tags, etc. -->\n<script async src="https://..."></script>`}
                    value={cssDrawerPage?.settings.headCode || ""}
                    onChange={(e) =>
                      cssDrawerPageId &&
                      onUpdatePageSettings(cssDrawerPageId, {
                        headCode: e.target.value,
                      })
                    }
                  />
                </div>

                <div>
                  <Label className="text-[12px] font-semibold text-foreground block mb-2">
                    Before &lt;/body&gt;
                  </Label>
                  <p className="text-[11px] text-muted mb-2">
                    Add custom code before the closing body tag.
                  </p>
                  <textarea
                    className="w-full rounded-lg border border-separator/50 bg-[#0f0f1a] text-blue-400 px-4 py-3 text-[11px] font-mono outline-none focus:border-[#634CF8] resize-none h-32 leading-relaxed"
                    placeholder={`<!-- Chat widgets, scripts, etc. -->\n<script>...</script>`}
                    value={cssDrawerPage?.settings.bodyCode || ""}
                    onChange={(e) =>
                      cssDrawerPageId &&
                      onUpdatePageSettings(cssDrawerPageId, {
                        bodyCode: e.target.value,
                      })
                    }
                  />
                </div>
              </div>
            </Drawer.Body>
            <Drawer.Footer>
              <Button variant="secondary" onPress={() => setCssDrawerPageId(null)}>
                Cancel
              </Button>
              <Button
                variant="primary"
                onPress={() => setCssDrawerPageId(null)}
              >
                Save Changes
              </Button>
            </Drawer.Footer>
          </Drawer.Dialog>
        </Drawer.Content>
      </Drawer.Backdrop>
    </div>
  );
}

function ActionLink({
  label,
  danger,
  onClick,
}: {
  label: string;
  danger?: boolean;
  onClick: (e: React.MouseEvent) => void;
}) {
  return (
    <button
      className={clsx(
        "text-[10px] font-medium px-2 py-1 rounded-md transition-colors",
        danger
          ? "text-danger hover:bg-danger/10 ml-auto"
          : "text-muted hover:text-foreground hover:bg-white dark:hover:bg-surface",
      )}
      onClick={onClick}
    >
      {label}
    </button>
  );
}
