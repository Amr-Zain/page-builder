import { useState } from "react";
import { Button } from "@heroui/react";
import clsx from "clsx";
import { ChevronUp, ChevronDown, X } from "lucide-react";

import type { Menu, MenuItem, MenuItemType, MenuLocation } from "../menus";
import { renderIcon } from "../icon-map";
import {
  createMenu,
  createMenuItem,
  MENU_LOCATIONS,
  MENU_ITEM_TYPES,
} from "../menus";

export function MenuManager({
  menus,
  onUpdate,
}: {
  menus: Menu[];
  onUpdate: (menus: Menu[]) => void;
}) {
  const [activeMenuId, setActiveMenuId] = useState<string | null>(
    menus[0]?.id || null,
  );
  const [editingItemId, setEditingItemId] = useState<string | null>(null);
  const [isCreatingMenu, setIsCreatingMenu] = useState(false);
  const [newMenuName, setNewMenuName] = useState("");
  const [newMenuLocation, setNewMenuLocation] =
    useState<MenuLocation>("header");

  const activeMenu = menus.find((m) => m.id === activeMenuId);

  // ── Menu CRUD ──
  const handleCreateMenu = () => {
    if (!newMenuName.trim()) return;
    const menu = createMenu(newMenuName.trim(), newMenuLocation);
    onUpdate([...menus, menu]);
    setActiveMenuId(menu.id);
    setIsCreatingMenu(false);
    setNewMenuName("");
  };

  const handleDeleteMenu = (id: string) => {
    const updated = menus.filter((m) => m.id !== id);
    onUpdate(updated);
    setActiveMenuId(updated[0]?.id || null);
  };

  // ── Item operations ──
  const updateMenuItems = (menuId: string, items: MenuItem[]) => {
    onUpdate(menus.map((m) => (m.id === menuId ? { ...m, items } : m)));
  };

  const addItem = (menuId: string, type: MenuItemType) => {
    const menu = menus.find((m) => m.id === menuId);
    if (!menu) return;
    const item = createMenuItem({ type, label: MENU_ITEM_TYPES[type].label });
    updateMenuItems(menuId, [...menu.items, item]);
    setEditingItemId(item.id);
  };

  const removeItem = (menuId: string, itemId: string) => {
    const menu = menus.find((m) => m.id === menuId);
    if (!menu) return;
    const removeFromList = (items: MenuItem[]): MenuItem[] =>
      items
        .filter((i) => i.id !== itemId)
        .map((i) => ({ ...i, children: removeFromList(i.children) }));
    updateMenuItems(menuId, removeFromList(menu.items));
    if (editingItemId === itemId) setEditingItemId(null);
  };

  const updateItem = (
    menuId: string,
    itemId: string,
    updates: Partial<MenuItem>,
  ) => {
    const menu = menus.find((m) => m.id === menuId);
    if (!menu) return;
    const updateInList = (items: MenuItem[]): MenuItem[] =>
      items.map((i) =>
        i.id === itemId
          ? { ...i, ...updates }
          : { ...i, children: updateInList(i.children) },
      );
    updateMenuItems(menuId, updateInList(menu.items));
  };

  const moveItem = (menuId: string, itemId: string, direction: -1 | 1) => {
    const menu = menus.find((m) => m.id === menuId);
    if (!menu) return;
    const items = [...menu.items];
    const idx = items.findIndex((i) => i.id === itemId);
    if (idx < 0) return;
    const newIdx = idx + direction;
    if (newIdx < 0 || newIdx >= items.length) return;
    [items[idx], items[newIdx]] = [items[newIdx], items[idx]];
    updateMenuItems(menuId, items);
  };

  const indentItem = (menuId: string, itemId: string) => {
    const menu = menus.find((m) => m.id === menuId);
    if (!menu) return;
    const items = [...menu.items];
    const idx = items.findIndex((i) => i.id === itemId);
    if (idx <= 0) return; // Can't indent first item
    const item = items.splice(idx, 1)[0];
    items[idx - 1].children = [...items[idx - 1].children, item];
    updateMenuItems(menuId, items);
  };

  const outdentItem = (menuId: string, parentId: string, itemId: string) => {
    const menu = menus.find((m) => m.id === menuId);
    if (!menu) return;
    const items = [...menu.items];
    const parentIdx = items.findIndex((i) => i.id === parentId);
    if (parentIdx < 0) return;
    const parent = items[parentIdx];
    const childIdx = parent.children.findIndex((c) => c.id === itemId);
    if (childIdx < 0) return;
    const item = parent.children.splice(childIdx, 1)[0];
    items.splice(parentIdx + 1, 0, item);
    updateMenuItems(menuId, items);
  };

  return (
    <div className="flex flex-col gap-4 pt-2">
      {/* Menu selector */}
      <div className="flex items-center justify-between">
        <p className="text-[13px] font-semibold text-foreground">
          Navigation Menus
        </p>
        <button
          className="text-[11px] font-semibold text-[#634CF8]"
          onClick={() => setIsCreatingMenu(true)}
        >
          + New Menu
        </button>
      </div>

      {/* Create menu form */}
      {isCreatingMenu && (
        <div className="p-4 rounded-xl border border-[#634CF8]/30 bg-[#634CF8]/5 flex flex-col gap-3">
          <input
            autoFocus
            className="h-9 rounded-lg border border-separator/50 bg-white dark:bg-surface px-3 text-[12px] outline-none focus:border-[#634CF8]"
            placeholder="Menu name..."
            value={newMenuName}
            onChange={(e) => setNewMenuName(e.target.value)}
          />
          <div>
            <label className="text-[10px] text-muted block mb-1">
              Location
            </label>
            <div className="grid grid-cols-2 gap-1.5">
              {(Object.keys(MENU_LOCATIONS) as MenuLocation[]).map((loc) => (
                <button
                  className={clsx(
                    "flex items-center gap-1.5 rounded-lg border-2 px-2.5 py-1.5 text-[10px] font-medium transition-all",
                    newMenuLocation === loc
                      ? "border-[#634CF8] bg-[#634CF8]/5 text-[#634CF8]"
                      : "border-separator/40 text-muted",
                  )}
                  key={loc}
                  onClick={() => setNewMenuLocation(loc)}
                >
                  <span>{renderIcon(MENU_LOCATIONS[loc].icon)}</span>
                  {MENU_LOCATIONS[loc].label}
                </button>
              ))}
            </div>
          </div>
          <div className="flex gap-2">
            <Button
              className="flex-1"
              size="sm"
              style={{ backgroundColor: "#634CF8", color: "#fff" }}
              onPress={handleCreateMenu}
            >
              Create
            </Button>
            <Button
              className="flex-1"
              size="sm"
              variant="secondary"
              onPress={() => setIsCreatingMenu(false)}
            >
              Cancel
            </Button>
          </div>
        </div>
      )}

      {/* Menu tabs */}
      <div className="flex gap-1.5 flex-col overflow-x-auto scrollbar-none">
        {menus.map((menu) => (
          <button
            className={clsx(
              "shrink-0 flex items-center gap-1.5 rounded-lg px-3 py-2 text-[11px] font-semibold transition-all border-2",
              activeMenuId === menu.id
                ? "border-[#634CF8] bg-[#634CF8]/5 text-[#634CF8]"
                : "border-separator/30 text-muted hover:border-muted/50",
            )}
            key={menu.id}
            onClick={() => setActiveMenuId(menu.id)}
          >
            <span>{renderIcon(MENU_LOCATIONS[menu.location]?.icon || "")}</span>
            {menu.name}
          </button>
        ))}
      </div>

      {/* Active menu editor */}
      {activeMenu && (
        <div className="flex flex-col gap-3">
          {/* Menu info */}
          <div className="flex items-center justify-between rounded-lg bg-[#F8F8FA] dark:bg-surface p-3">
            <div>
              <p className="text-[12px] font-semibold text-foreground">
                {activeMenu.name}
              </p>
              <p className="text-[10px] text-muted">
                Location: {MENU_LOCATIONS[activeMenu.location]?.label} ·{" "}
                {activeMenu.items.length} items
              </p>
            </div>
            {menus.length > 1 && (
              <button
                className="text-[10px] text-danger"
                onClick={() => handleDeleteMenu(activeMenu.id)}
              >
                Delete
              </button>
            )}
          </div>

          {/* Menu items */}
          <div className="flex flex-col gap-1">
            {activeMenu.items.length === 0 && (
              <div className="rounded-lg border-2 border-dashed border-separator/40 p-6 text-center">
                <p className="text-[12px] text-muted">No menu items yet</p>
                <p className="text-[10px] text-muted/60 mt-1">
                  Add items using the buttons below
                </p>
              </div>
            )}

            {activeMenu.items.map((item, idx) => (
              <MenuItemCard
                activeMenu={activeMenu}
                editingItemId={editingItemId}
                index={idx}
                isLast={idx === activeMenu.items.length - 1}
                item={item}
                key={item.id}
                level={0}
                onEdit={setEditingItemId}
                onIndent={(id) => indentItem(activeMenu.id, id)}
                onMove={(id, dir) => moveItem(activeMenu.id, id, dir)}
                onOutdent={(parentId, id) =>
                  outdentItem(activeMenu.id, parentId, id)
                }
                onRemove={(id) => removeItem(activeMenu.id, id)}
                onUpdate={(id, updates) =>
                  updateItem(activeMenu.id, id, updates)
                }
              />
            ))}
          </div>

          {/* Add item buttons */}
          <div>
            <p className="text-[10px] font-semibold text-muted uppercase tracking-wider mb-2">
              Add Menu Item
            </p>
            <div className="grid grid-cols-2 gap-1.5">
              {(Object.keys(MENU_ITEM_TYPES) as MenuItemType[]).map((type) => (
                <button
                  className="flex items-center gap-2 rounded-lg border border-separator/40 bg-white dark:bg-surface px-3 py-2 text-[11px] font-medium text-foreground hover:border-[#634CF8]/30 hover:shadow-sm transition-all"
                  key={type}
                  onClick={() => addItem(activeMenu.id, type)}
                >
                  <span>{renderIcon(MENU_ITEM_TYPES[type].icon)}</span>
                  {MENU_ITEM_TYPES[type].label}
                </button>
              ))}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

// ── Menu Item Card ──
function MenuItemCard({
  item,
  level,
  index,
  isLast,
  activeMenu,
  editingItemId,
  onEdit,
  onRemove,
  onUpdate,
  onMove,
  onIndent,
  onOutdent,
}: {
  item: MenuItem;
  level: number;
  index: number;
  isLast: boolean;
  activeMenu: Menu;
  editingItemId: string | null;
  onEdit: (id: string | null) => void;
  onRemove: (id: string) => void;
  onUpdate: (id: string, updates: Partial<MenuItem>) => void;
  onMove: (id: string, direction: -1 | 1) => void;
  onIndent: (id: string) => void;
  onOutdent: (parentId: string, id: string) => void;
}) {
  const isEditing = editingItemId === item.id;
  const typeInfo = MENU_ITEM_TYPES[item.type];

  return (
    <div style={{ marginLeft: `${level * 20}px` }}>
      <div
        className={clsx(
          "rounded-lg border transition-all",
          isEditing
            ? "border-[#634CF8] bg-[#634CF8]/[0.02]"
            : "border-separator/40 bg-white dark:bg-surface",
        )}
      >
        {/* Item header */}
        <div
          className="flex items-center gap-2 px-3 py-2 cursor-pointer"
          onClick={() => onEdit(isEditing ? null : item.id)}
        >
          <span className="text-xs shrink-0">{renderIcon(typeInfo.icon)}</span>
          <span className="flex-1 text-[12px] font-medium text-foreground truncate">
            {item.label}
          </span>
          {item.highlighted && (
            <span className="text-[8px] bg-[#634CF8]/10 text-[#634CF8] rounded px-1 py-0.5 font-bold">
              CTA
            </span>
          )}
          {item.children.length > 0 && (
            <span className="text-[9px] text-muted">
              {item.children.length} sub
            </span>
          )}
          <div className="flex items-center gap-0.5">
            <button
              className="text-[10px] text-muted hover:text-foreground px-0.5 disabled:opacity-20"
              disabled={index === 0}
              onClick={(e) => {
                e.stopPropagation();
                onMove(item.id, -1);
              }}
            >
              <ChevronUp size={12} />
            </button>
            <button
              className="text-[10px] text-muted hover:text-foreground px-0.5 disabled:opacity-20"
              disabled={isLast}
              onClick={(e) => {
                e.stopPropagation();
                onMove(item.id, 1);
              }}
            >
              <ChevronDown size={12} />
            </button>
            <button
              className="text-[10px] text-danger px-0.5"
              onClick={(e) => {
                e.stopPropagation();
                onRemove(item.id);
              }}
            >
              <X size={12} />
            </button>
          </div>
        </div>

        {/* Expanded editor */}
        {isEditing && (
          <div className="px-3 pb-3 pt-1 border-t border-separator/30 flex flex-col gap-2">
            <div>
              <label className="text-[9px] text-muted block mb-0.5">
                Label
              </label>
              <input
                className="w-full h-8 rounded border border-separator/40 bg-[#FAFAFA] dark:bg-background px-2 text-[11px] outline-none focus:border-[#634CF8]"
                value={item.label}
                onChange={(e) => onUpdate(item.id, { label: e.target.value })}
              />
            </div>
            <div>
              <label className="text-[9px] text-muted block mb-0.5">Type</label>
              <select
                className="w-full h-8 rounded border border-separator/40 bg-[#FAFAFA] dark:bg-background px-2 text-[11px] outline-none"
                value={item.type}
                onChange={(e) =>
                  onUpdate(item.id, { type: e.target.value as MenuItemType })
                }
              >
                {(Object.keys(MENU_ITEM_TYPES) as MenuItemType[]).map((t) => (
                  <option key={t} value={t}>
                    {MENU_ITEM_TYPES[t].label}
                  </option>
                ))}
              </select>
            </div>
            {item.type !== "dropdown" && (
              <div>
                <label className="text-[9px] text-muted block mb-0.5">
                  URL
                </label>
                <input
                  className="w-full h-8 rounded border border-separator/40 bg-[#FAFAFA] dark:bg-background px-2 text-[11px] font-mono outline-none focus:border-[#634CF8]"
                  placeholder={
                    item.type === "section" ? "#section-id" : "https://..."
                  }
                  value={item.url}
                  onChange={(e) => onUpdate(item.id, { url: e.target.value })}
                />
              </div>
            )}
            <div className="flex items-center gap-3">
              <label className="flex items-center gap-1.5 text-[10px] text-muted cursor-pointer">
                <input
                  checked={item.target === "_blank"}
                  className="rounded"
                  type="checkbox"
                  onChange={(e) =>
                    onUpdate(item.id, {
                      target: e.target.checked ? "_blank" : "_self",
                    })
                  }
                />
                Open in new tab
              </label>
              <label className="flex items-center gap-1.5 text-[10px] text-muted cursor-pointer">
                <input
                  checked={item.highlighted || false}
                  className="rounded"
                  type="checkbox"
                  onChange={(e) =>
                    onUpdate(item.id, { highlighted: e.target.checked })
                  }
                />
                CTA style
              </label>
            </div>
            <div>
              <label className="text-[9px] text-muted block mb-0.5">
                CSS Class (optional)
              </label>
              <input
                className="w-full h-8 rounded border border-separator/40 bg-[#FAFAFA] dark:bg-background px-2 text-[11px] font-mono outline-none focus:border-[#634CF8]"
                placeholder="custom-class"
                value={item.cssClass || ""}
                onChange={(e) =>
                  onUpdate(item.id, { cssClass: e.target.value })
                }
              />
            </div>
            {/* Nesting controls */}
            <div className="flex gap-2 pt-1">
              {level === 0 && index > 0 && (
                <button
                  className="text-[10px] text-muted hover:text-[#634CF8] font-medium"
                  onClick={() => onIndent(item.id)}
                >
                  → Make sub-item
                </button>
              )}
            </div>
          </div>
        )}
      </div>

      {/* Render children */}
      {item.children.map((child, childIdx) => (
        <MenuItemCard
          activeMenu={activeMenu}
          editingItemId={editingItemId}
          index={childIdx}
          isLast={childIdx === item.children.length - 1}
          item={child}
          key={child.id}
          level={level + 1}
          onEdit={onEdit}
          onIndent={onIndent}
          onMove={onMove}
          onOutdent={onOutdent}
          onRemove={onRemove}
          onUpdate={onUpdate}
        />
      ))}
    </div>
  );
}
