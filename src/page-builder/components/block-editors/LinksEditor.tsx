import {
  Select,
  Input,
  Label,
  ListBox,
  TextField,
} from "@heroui/react";

import type { Page } from "../../pages";

export interface LinkItem {
  label: string;
  url: string;
  pageId?: string;
}

export function LinksEditor({
  items,
  label,
  addLabel,
  showUrl = false,
  pages = [],
  onChange,
}: {
  items: string[] | LinkItem[];
  label: string;
  addLabel?: string;
  showUrl?: boolean;
  pages?: Page[];
  onChange: (items: string[] | LinkItem[]) => void;
}) {
  // Normalize to LinkItem[] internally
  const normalized: LinkItem[] = (items as unknown[]).map((item) =>
    typeof item === "string" ? { label: item, url: "" } : (item as LinkItem),
  );

  const isObjectMode = showUrl || (items.length > 0 && typeof items[0] === "object");

  function emit(updated: LinkItem[]) {
    if (isObjectMode) {
      onChange(updated);
    } else {
      onChange(updated.map((i) => i.label));
    }
  }

  const addItem = () => emit([...normalized, { label: "", url: "" }]);

  const removeItem = (index: number) =>
    emit(normalized.filter((_, i) => i !== index));

  const updateLabel = (index: number, value: string) => {
    emit(normalized.map((item, i) => (i === index ? { ...item, label: value } : item)));
  };

  const updateUrl = (index: number, value: string, pageId?: string) => {
    emit(normalized.map((item, i) => (i === index ? { ...item, url: value, pageId } : item)));
  };

  const moveItem = (index: number, direction: -1 | 1) => {
    const newIndex = index + direction;
    if (newIndex < 0 || newIndex >= normalized.length) return;
    const updated = [...normalized];
    [updated[index], updated[newIndex]] = [updated[newIndex], updated[index]];
    emit(updated);
  };

  return (
    <div>
      <div className="flex items-center justify-between mb-2">
        <label className="text-[11px] font-semibold text-muted">{label}</label>
        <span className="text-[10px] text-muted/60">{normalized.length}</span>
      </div>

      <div className="flex flex-col gap-2 mb-2">
        {normalized.map((item, index) => (
          <div className="flex flex-col gap-1 rounded-lg border border-separator/30 p-1.5" key={index}>
            <div className="flex items-center gap-1">
              <TextField
                className="flex-1"
                value={item.label}
                onChange={(v) => updateLabel(index, v)}
              >
                <Input placeholder={`Label ${index + 1}`} />
              </TextField>
              <button
                className="text-[10px] text-muted hover:text-foreground px-0.5 disabled:opacity-30"
                disabled={index === 0}
                onClick={() => moveItem(index, -1)}
              >
                ↑
              </button>
              <button
                className="text-[10px] text-muted hover:text-foreground px-0.5 disabled:opacity-30"
                disabled={index === normalized.length - 1}
                onClick={() => moveItem(index, 1)}
              >
                ↓
              </button>
              <button
                className="text-[10px] text-danger hover:text-danger/80 px-0.5"
                onClick={() => removeItem(index)}
              >
                ✕
              </button>
            </div>
            {isObjectMode && (
              <div className="flex flex-col gap-1.5 px-0.5 pb-1">
                <div className="flex gap-1">
                  <Select
                    className="flex-1"
                    placeholder="Internal Page..."
                    value={item.pageId}
                    onChange={(pageId) => {
                      const selectedPage = pages.find((p) => String(p.id) === String(pageId));
                      if (selectedPage) {
                        const locale = selectedPage.settings.locale || "en";
                        const url = locale === "ar" 
                          ? `/ar/${selectedPage.settings.slug}` 
                          : `/${selectedPage.settings.slug}`;
                        updateUrl(index, url, String(selectedPage.id));
                        if (!item.label) updateLabel(index, selectedPage.settings.title);
                      } else {
                        updateUrl(index, item.url, "");
                      }
                    }}
                  >
                    <Select.Trigger>
                      <Select.Value />
                      <Select.Indicator />
                    </Select.Trigger>
                    <Select.Popover>
                      <ListBox>
                        {pages.map((p) => (
                          <ListBox.Item id={p.id} key={p.id} textValue={p.settings.title}>
                            <div className="flex items-center justify-between text-[10px]">
                              <span>{p.settings.title}</span>
                              <span className="text-[8px] opacity-50 uppercase">{p.settings.locale || "en"}</span>
                            </div>
                            <ListBox.ItemIndicator />
                          </ListBox.Item>
                        ))}
                      </ListBox>
                    </Select.Popover>
                  </Select>
                  <TextField
                    className="flex-[1.5]"
                    value={item.url}
                    onChange={(v) => updateUrl(index, v, "")}
                  >
                    <Input placeholder="Custom URL..." />
                  </TextField>
                </div>
              </div>
            )}
          </div>
        ))}
      </div>

      <button
        className="w-full h-7 rounded-lg border-2 border-dashed border-separator/50 text-[10px] font-medium text-muted hover:text-[#634CF8] hover:border-[#634CF8]/30 transition-colors"
        onClick={addItem}
      >
        + {addLabel || "Add link"}
      </button>
    </div>
  );
}
