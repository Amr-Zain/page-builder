/**
 * Link list editor for navigation links with label + URL support.
 * Supports both simple string[] (legacy) and { label, url }[] formats.
 */

export interface LinkItem {
  label: string;
  url: string;
}

export function LinksEditor({
  items,
  label,
  addLabel,
  showUrl = false,
  onChange,
}: {
  items: string[] | LinkItem[];
  label: string;
  addLabel?: string;
  showUrl?: boolean;
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

  const updateUrl = (index: number, value: string) => {
    emit(normalized.map((item, i) => (i === index ? { ...item, url: value } : item)));
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
              <input
                className="flex-1 h-7 rounded border border-separator/40 bg-[#FAFAFA] dark:bg-surface px-2 text-[11px] text-foreground outline-none focus:border-[#634CF8]"
                placeholder={`Label ${index + 1}`}
                value={item.label}
                onChange={(e) => updateLabel(index, e.target.value)}
              />
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
              <input
                className="h-6 rounded border border-separator/30 bg-[#FAFAFA] dark:bg-surface px-2 text-[10px] text-muted font-mono outline-none focus:border-[#634CF8] focus:text-foreground"
                placeholder="URL (e.g. /features or https://...)"
                value={item.url}
                onChange={(e) => updateUrl(index, e.target.value)}
              />
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
