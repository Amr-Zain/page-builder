import { useState } from "react";
import { Button, Drawer } from "@heroui/react";
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
  onCreatePage: (name: string) => void;
  onDeletePage: (id: string) => void;
  onDuplicatePage: (id: string) => void;
  onUpdatePageSettings: (
    id: string,
    settings: Partial<Page["settings"]>,
  ) => void;
}) {
  const [isCreating, setIsCreating] = useState(false);
  const [newPageName, setNewPageName] = useState("");
  const [cssDrawerPageId, setCssDrawerPageId] = useState<string | null>(null);

  const cssDrawerPage = pages.find((p) => p.id === cssDrawerPageId);

  const handleCreate = () => {
    if (!newPageName.trim()) return;
    onCreatePage(newPageName.trim());
    setNewPageName("");
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
          size="sm"
          style={{ backgroundColor: "#634CF8", color: "#fff" }}
          onPress={() => setIsCreating(true)}
        >
          + New
        </Button>
      </div>

      {/* Create */}
      {isCreating && (
        <div className="flex flex-col gap-2 p-4 rounded-xl border border-[#634CF8]/30 bg-[#634CF8]/5">
          <p className="text-[11px] font-semibold text-foreground">
            Create new page
          </p>
          <input
            autoFocus
            className="h-10 rounded-lg border border-separator/50 bg-white dark:bg-surface px-3 text-[13px] text-foreground outline-none focus:border-[#634CF8]"
            placeholder="Page name..."
            value={newPageName}
            onChange={(e) => setNewPageName(e.target.value)}
            onKeyDown={(e) => e.key === "Enter" && handleCreate()}
          />
          <div className="flex gap-2">
            <Button
              className="flex-1"
              size="sm"
              style={{ backgroundColor: "#634CF8", color: "#fff" }}
              onPress={handleCreate}
            >
              Create Page
            </Button>
            <Button
              className="flex-1"
              size="sm"
              variant="secondary"
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
                "rounded-xl border-2 transition-all cursor-pointer",
                isActive
                  ? "border-[#634CF8] bg-[#634CF8]/[0.03] shadow-sm"
                  : "border-separator/30 bg-white dark:bg-surface hover:border-muted/50",
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
                        "flex h-10 w-10 items-center justify-center rounded-lg shrink-0 text-lg",
                        isActive
                          ? "bg-[#634CF8]/10"
                          : "bg-[#F5F5F5] dark:bg-surface",
                      )}
                    >
                      <FileText size={18} className={clsx(isActive ? "text-[#634CF8]" : "text-muted")} />
                    </div>
                    <div className="min-w-0">
                      <p className="text-[13px] font-semibold text-foreground truncate">
                        {page.settings.title}
                      </p>
                      <p className="text-[11px] text-muted font-mono">
                        /{page.settings.slug}
                      </p>
                    </div>
                  </div>
                  <span
                    className={clsx(
                      "text-[9px] font-bold px-2 py-1 rounded-full shrink-0 uppercase tracking-wider",
                      page.settings.published
                        ? "bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-400"
                        : "bg-amber-100 text-amber-700 dark:bg-amber-900/30 dark:text-amber-400",
                    )}
                  >
                    {page.settings.published ? "Live" : "Draft"}
                  </span>
                </div>

                {/* Meta */}
                <div className="flex items-center gap-3 mt-3 text-[10px] text-muted">
                  <span>{page.blocks?.length || 0} blocks</span>
                  <span>·</span>
                  <span>
                    Updated{" "}
                    {new Date(page.settings.updatedAt).toLocaleDateString()}
                  </span>
                </div>
              </div>

              {/* Actions — only for active page */}
              {isActive && (
                <div className="flex items-center gap-1 px-4 py-2.5 border-t border-separator/30 bg-[#FAFAFA] dark:bg-surface/50 rounded-b-[10px]">
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
                  <label className="text-[12px] font-semibold text-foreground block mb-2">
                    Custom CSS
                  </label>
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
                  <label className="text-[12px] font-semibold text-foreground block mb-2">
                    Inside &lt;head&gt;
                  </label>
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
                  <label className="text-[12px] font-semibold text-foreground block mb-2">
                    Before &lt;/body&gt;
                  </label>
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
              <Button slot="close" variant="secondary">
                Cancel
              </Button>
              <Button
                slot="close"
                style={{ backgroundColor: "#634CF8", color: "#fff" }}
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
