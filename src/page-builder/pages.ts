import type { BlockInstance, DesignSettings } from "./types";
import { DEFAULT_BLOCKS, DEFAULT_DESIGN, createBlockId } from "./data";

// ── Page Types ──
export interface PageSettings {
  title: string;
  slug: string;
  description: string;
  ogImage: string;
  published: boolean;
  locale: "en" | "ar";
  createdAt: string;
  updatedAt: string;
  customCSS: string;
  headCode: string;
  bodyCode: string;
  translationGroupId?: string;
}

export interface Page {
  id: string;
  settings: PageSettings;
  blocks: BlockInstance[];
  design: DesignSettings;
}

export interface PagesState {
  pages: Page[];
  activePageId: string;
}

const PAGES_STORAGE_KEY = "page-builder-pages";

// ── Create a new page ──
export function createPage(
  name: string,
  template?: { blocks: BlockInstance[]; design: DesignSettings },
  locale: "en" | "ar" = "en",
): Page {
  const id = `page-${Date.now()}`;
  const slug = name
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-|-$/g, "");

  return {
    id,
    settings: {
      title: name,
      slug: slug || "untitled",
      locale,
      description: "",
      ogImage: "",
      published: false,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
      customCSS: "",
      headCode: "",
      bodyCode: "",
    },
    blocks: template?.blocks.map((b) => ({ ...b, id: createBlockId() })) || [
      ...DEFAULT_BLOCKS,
    ],
    design: template?.design ? { ...template.design } : { ...DEFAULT_DESIGN },
  };
}

// ── Default pages state ──
export function getDefaultPagesState(): PagesState {
  const homePage = createPage("Home");
  return {
    pages: [homePage],
    activePageId: homePage.id,
  };
}

// ── Persistence ──
export function loadPages(): PagesState | null {
  try {
    const raw = localStorage.getItem(PAGES_STORAGE_KEY);
    if (!raw) return null;
    return JSON.parse(raw);
  } catch {
    return null;
  }
}

export function savePages(state: PagesState) {
  try {
    localStorage.setItem(PAGES_STORAGE_KEY, JSON.stringify(state));
  } catch {
    /* ignore */
  }
}
