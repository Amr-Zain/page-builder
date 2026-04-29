/**
 * Menu Management System
 * WordPress-style navigation menu builder with full CRUD,
 * nested items, multiple menu locations, and item types.
 */

export type MenuItemType = "page" | "custom" | "section" | "dropdown";

export interface MenuItem {
  id: string;
  label: string;
  type: MenuItemType;
  url: string;
  target: "_self" | "_blank";
  icon?: string;
  children: MenuItem[];
  /** For page type — references a page ID */
  pageId?: string;
  /** CSS classes */
  cssClass?: string;
  /** Whether this item is highlighted (e.g., CTA button style) */
  highlighted?: boolean;
}

export interface Menu {
  id: string;
  name: string;
  location: MenuLocation;
  items: MenuItem[];
}

export type MenuLocation = "header" | "footer" | "sidebar" | "mobile";

export interface MenusState {
  menus: Menu[];
}

const MENUS_STORAGE_KEY = "page-builder-menus";

// ── Helpers ──
let menuItemCounter = 0;
export function createMenuItemId(): string {
  return `mi-${++menuItemCounter}-${Date.now()}`;
}

export function createMenuItem(overrides?: Partial<MenuItem>): MenuItem {
  return {
    id: createMenuItemId(),
    label: "New Item",
    type: "custom",
    url: "#",
    target: "_self",
    children: [],
    ...overrides,
  };
}

export function createMenu(name: string, location: MenuLocation): Menu {
  return {
    id: `menu-${Date.now()}`,
    name,
    location,
    items: [],
  };
}

// ── Default menus ──
export function getDefaultMenusState(): MenusState {
  return {
    menus: [
      {
        id: "menu-header",
        name: "Main Navigation",
        location: "header",
        items: [
          {
            id: "mi-1",
            label: "Products",
            type: "dropdown",
            url: "#",
            target: "_self",
            children: [
              {
                id: "mi-1a",
                label: "Features",
                type: "section",
                url: "#features",
                target: "_self",
                children: [],
              },
              {
                id: "mi-1b",
                label: "Pricing",
                type: "section",
                url: "#pricing",
                target: "_self",
                children: [],
              },
              {
                id: "mi-1c",
                label: "Integrations",
                type: "custom",
                url: "/integrations",
                target: "_self",
                children: [],
              },
            ],
          },
          {
            id: "mi-2",
            label: "Solutions",
            type: "custom",
            url: "/solutions",
            target: "_self",
            children: [],
          },
          {
            id: "mi-3",
            label: "Docs",
            type: "custom",
            url: "/docs",
            target: "_blank",
            children: [],
          },
          {
            id: "mi-4",
            label: "Blog",
            type: "page",
            url: "/blog",
            target: "_self",
            pageId: "",
            children: [],
          },
        ],
      },
      {
        id: "menu-footer",
        name: "Footer Navigation",
        location: "footer",
        items: [
          {
            id: "mi-f1",
            label: "Privacy Policy",
            type: "custom",
            url: "/privacy",
            target: "_self",
            children: [],
          },
          {
            id: "mi-f2",
            label: "Terms of Service",
            type: "custom",
            url: "/terms",
            target: "_self",
            children: [],
          },
          {
            id: "mi-f3",
            label: "Contact",
            type: "page",
            url: "/contact",
            target: "_self",
            children: [],
          },
        ],
      },
    ],
  };
}

// ── Persistence ──
export function loadMenus(): MenusState | null {
  try {
    const raw = localStorage.getItem(MENUS_STORAGE_KEY);
    if (!raw) return null;
    return JSON.parse(raw);
  } catch {
    return null;
  }
}

export function saveMenus(state: MenusState) {
  try {
    localStorage.setItem(MENUS_STORAGE_KEY, JSON.stringify(state));
  } catch {}
}

// ── Menu location labels ──
export const MENU_LOCATIONS: Record<
  MenuLocation,
  { label: string; icon: string; description: string }
> = {
  header: { label: "Header", icon: "menu", description: "Main site navigation" },
  footer: { label: "Footer", icon: "clipboard", description: "Footer links" },
  sidebar: { label: "Sidebar", icon: "book-open", description: "Sidebar navigation" },
  mobile: { label: "Mobile", icon: "smartphone", description: "Mobile menu" },
};

export const MENU_ITEM_TYPES: Record<
  MenuItemType,
  { label: string; icon: string }
> = {
  page: { label: "Page Link", icon: "file-text" },
  custom: { label: "Custom URL", icon: "link" },
  section: { label: "Section Anchor", icon: "hash" },
  dropdown: { label: "Dropdown", icon: "folder-open" },
};
