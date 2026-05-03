import { ImagePicker } from "./ImagePicker";

/**
 * Generic list editor for items with configurable fields.
 * Used for: features, FAQ, stats, testimonials, team members, pricing tiers, etc.
 */
export function ItemListEditor<T extends Record<string, unknown>>({
  items,
  fields,
  label,
  addLabel,
  emptyLabel,
  onChange,
  renderPreview,
}: {
  items: T[];
  fields: {
    key: keyof T;
    label: string;
    type?: "text" | "textarea" | "url" | "image";
    placeholder?: string;
  }[];
  label: string;
  addLabel?: string;
  emptyLabel?: string;
  onChange: (items: T[]) => void;
  renderPreview?: (item: T, index: number) => React.ReactNode;
}) {
  const addItem = () => {
    const newItem = {} as T;
    fields.forEach((f) => {
      (newItem as Record<string, unknown>)[f.key as string] = "";
    });
    onChange([...items, newItem]);
  };

  const removeItem = (index: number) => {
    onChange(items.filter((_, i) => i !== index));
  };

  const updateItem = (index: number, key: keyof T, value: unknown) => {
    const updated = items.map((item, i) =>
      i === index ? { ...item, [key]: value } : item,
    );
    onChange(updated);
  };

  const moveItem = (index: number, direction: -1 | 1) => {
    const newIndex = index + direction;
    if (newIndex < 0 || newIndex >= items.length) return;
    const updated = [...items];
    [updated[index], updated[newIndex]] = [updated[newIndex], updated[index]];
    onChange(updated);
  };

  return (
    <div>
      <div className="flex items-center justify-between mb-2">
        <label className="text-[11px] font-semibold text-muted">{label}</label>
        <span className="text-[10px] text-muted/60">{items.length} items</span>
      </div>

      {items.length === 0 && (
        <div className="rounded-lg bg-[#F8F8FA] dark:bg-surface p-3 text-center mb-2">
          <p className="text-[11px] text-muted">
            {emptyLabel || "No items yet"}
          </p>
        </div>
      )}

      <div className="flex flex-col gap-2 mb-2">
        {items.map((item, index) => (
          <div
            className="rounded-lg border border-separator/50 bg-[#FAFAFA] dark:bg-surface overflow-hidden"
            key={index}
          >
            {/* Item header with actions */}
            <div className="flex items-center gap-1 px-2 py-1.5 bg-[#F5F5F5] dark:bg-surface/80 border-b border-separator/30">
              {renderPreview ? (
                <div className="flex-1 min-w-0 truncate text-[10px] text-foreground font-medium">
                  {renderPreview(item, index)}
                </div>
              ) : (
                <span className="flex-1 text-[10px] text-muted font-medium">
                  Item {index + 1}
                </span>
              )}
              <button
                className="text-[10px] text-muted hover:text-foreground px-1 disabled:opacity-30"
                disabled={index === 0}
                title="Move up"
                onClick={() => moveItem(index, -1)}
              >
                ↑
              </button>
              <button
                className="text-[10px] text-muted hover:text-foreground px-1 disabled:opacity-30"
                disabled={index === items.length - 1}
                title="Move down"
                onClick={() => moveItem(index, 1)}
              >
                ↓
              </button>
              <button
                className="text-[10px] text-danger hover:text-danger/80 px-1"
                title="Remove"
                onClick={() => removeItem(index)}
              >
                ✕
              </button>
            </div>

            {/* Item fields */}
            <div className="p-2 flex flex-col gap-1.5">
              {fields.map((field) => (
                <div key={field.key as string}>
                  <label className="text-[9px] text-muted/70 block mb-0.5">
                    {field.label}
                  </label>
                  {field.type === "image" ? (
                    <ImagePicker
                      label=""
                      value={(item[field.key] as string) || ""}
                      onChange={(v) => updateItem(index, field.key, v)}
                    />
                  ) : field.type === "textarea" ? (
                    <textarea
                      className="w-full rounded border border-separator/40 bg-white dark:bg-background px-2 py-1 text-[11px] text-foreground outline-none focus:border-[#634CF8] resize-none h-14"
                      placeholder={field.placeholder}
                      value={(item[field.key] as string) || ""}
                      onChange={(e) =>
                        updateItem(index, field.key, e.target.value)
                      }
                    />
                  ) : (
                    <input
                      className="w-full h-7 rounded border border-separator/40 bg-white dark:bg-background px-2 text-[11px] text-foreground outline-none focus:border-[#634CF8]"
                      placeholder={field.placeholder}
                      type={field.type === "url" ? "url" : "text"}
                      value={(item[field.key] as string) || ""}
                      onChange={(e) =>
                        updateItem(index, field.key, e.target.value)
                      }
                    />
                  )}
                </div>
              ))}
            </div>
          </div>
        ))}
      </div>

      <button
        className="w-full h-8 rounded-lg border-2 border-dashed border-separator/50 text-[11px] font-medium text-muted hover:text-[#634CF8] hover:border-[#634CF8]/30 transition-colors"
        onClick={addItem}
      >
        + {addLabel || "Add item"}
      </button>
    </div>
  );
}
