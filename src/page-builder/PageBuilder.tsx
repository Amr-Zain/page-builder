import { useState, useCallback, useRef, useEffect } from "react";
import { useParams, Link } from "react-router-dom";
import clsx from "clsx";
import {
  DndContext,
  DragOverlay,
  pointerWithin,
  rectIntersection,
  PointerSensor,
  KeyboardSensor,
  useSensor,
  useSensors,
  type DragStartEvent,
  type DragEndEvent,
  type CollisionDetection,
} from "@dnd-kit/core";
import { arrayMove, sortableKeyboardCoordinates } from "@dnd-kit/sortable";

import type {
  BlockInstance,
  BlockType,
  BuilderState,
  DesignSettings,
  SidebarPanel,
  Template,
} from "./types";
import {
  DEFAULT_BLOCKS,
  DEFAULT_DESIGN,
  BLOCK_DEFINITIONS,
  COMPONENT_DEFINITIONS,
  createBlockId,
} from "./data";
import {
  findBlock,
  getParentBlock,
  insertBlock as treeInsertBlock,
  removeBlock,
  moveBlock as treeMoveBlock,
  duplicateBlock as treeDuplicateBlock,
  wouldCreateCycle,
} from "./tree-utils";
import { Toolbar } from "./components/Toolbar";
import { Sidebar } from "./components/Sidebar";
import { Canvas } from "./components/Canvas";
import { RightPanel } from "./components/RightPanel";
import { ResizeHandle } from "./components/ResizeHandle";
import { BreadcrumbNav } from "./components/BreadcrumbNav";
import { ActionBar } from "./components/ActionBar";
import { FloatingBar } from "./components/FloatingBar";
import { PreviewMode } from "./components/PreviewMode";
import { PagesPanel } from "./components/PagesPanel";
import { MenuManager } from "./components/MenuManager";
import { generateHtml, downloadHtml, exportProject, downloadAllPages } from "./html-export";
import { generateReactComponent, downloadReactFile } from "./react-export";
import { useClipboard } from "./hooks/useClipboard";
import {
  type Page,
  type PagesState,
  createPage,
  getDefaultPagesState,
  loadPages,
  savePages,
} from "./pages";
import {
  type MenusState,
  getDefaultMenusState,
  loadMenus,
  saveMenus,
} from "./menus";
import { VersionManager } from "./version-history";
import { type PageBuilderConfig, useBuilderConfig } from "./builder-config";
import { ErrorBoundary } from "./components/ErrorBoundary";
import { ProjectStorage } from "./project-storage";

const MIN_LEFT = 300;
const MAX_LEFT = 480;
const MIN_RIGHT = 280;
const MAX_RIGHT = 440;

const STORAGE_KEY = "page-builder-state";
const FONT_URLS: Record<string, string> = {
  inter:
    "https://fonts.googleapis.com/css2?family=Inter:wght@400;500;600;700&display=swap",
  "plus-jakarta":
    "https://fonts.googleapis.com/css2?family=Plus+Jakarta+Sans:wght@400;500;600;700&display=swap",
  "space-grotesk":
    "https://fonts.googleapis.com/css2?family=Space+Grotesk:wght@400;500;600;700&display=swap",
  poppins:
    "https://fonts.googleapis.com/css2?family=Poppins:wght@400;500;600;700&display=swap",
  "dm-sans":
    "https://fonts.googleapis.com/css2?family=DM+Sans:wght@400;500;600;700&display=swap",
  sora: "https://fonts.googleapis.com/css2?family=Sora:wght@400;500;600;700&display=swap",
};

// ── Load state from localStorage ──
function loadState(): {
  blocks: BlockInstance[];
  design: DesignSettings;
} | null {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (!raw) return null;
    return JSON.parse(raw);
  } catch {
    return null;
  }
}

function saveToStorage(blocks: BlockInstance[], design: DesignSettings) {
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify({ blocks, design }));
  } catch {
    /* ignore quota errors */
  }
}

/** Recursively find and update a block's props at any depth in the tree */
function updateBlockInTree(
  blocks: BlockInstance[],
  blockId: string,
  props: Record<string, unknown>,
): BlockInstance[] {
  return blocks.map((b) => {
    if (b.id === blockId) return { ...b, props };
    if (b.children) {
      return {
        ...b,
        children: Object.fromEntries(
          Object.entries(b.children).map(([zone, zoneBlocks]) => [
            zone,
            updateBlockInTree(zoneBlocks, blockId, props),
          ]),
        ),
      };
    }
    return b;
  });
}

export default function PageBuilder({ config }: { config?: PageBuilderConfig } = {}) {
  // Initialize override manager and plugin context
  const { manager } = useBuilderConfig(config);

  // ── Pages Management (Initialized First) ──
  // Read optional projectId from route params
  const { projectId: routeProjectId } = useParams<{ projectId?: string }>();

  // Determine initial project ID synchronously to prevent mount races
  const initialProjectId = routeProjectId || (() => {
    const projects = ProjectStorage.listProjects();
    if (projects.length > 0) {
      const sorted = [...projects].sort(
        (a, b) => new Date(b.updatedAt).getTime() - new Date(a.updatedAt).getTime(),
      );
      return sorted[0].id;
    }
    return null;
  })();

  const [resolvedProjectId, setResolvedProjectId] = useState<string | null>(initialProjectId);
  const [projectNotFound, setProjectNotFound] = useState(false);

  const [pagesState, setPagesState] = useState<PagesState>(() => {
    if (initialProjectId) {
      return ProjectStorage.loadProjectPages(initialProjectId);
    }
    return loadPages() || getDefaultPagesState();
  });

  // Read initial values from URL search params
  const initialParams = new URLSearchParams(window.location.search);
  const initialTab = (initialParams.get("tab") || "blocks") as SidebarPanel;
  const initialDevice = (initialParams.get("device") || "desktop") as "desktop" | "tablet" | "mobile";
  const initialMood = initialParams.get("mood") as "light" | "dark" | null;
  const initialMode = initialParams.get("mode");

  // Load persisted state or use defaults
  const persisted = useRef(loadState());
  const [state, setState] = useState<BuilderState>(() => {
    const activePage = pagesState.pages.find((p) => p.id === pagesState.activePageId);
    return {
      blocks: activePage?.blocks || persisted.current?.blocks || DEFAULT_BLOCKS,
      design: {
        ...(activePage?.design || persisted.current?.design || DEFAULT_DESIGN),
        ...(initialMood ? { mood: initialMood } : {}),
      },
      selectedBlockId: null,
      sidebarPanel: initialTab,
      isDrawerOpen: false,
      previewMode: initialDevice,
      hoveredBlockId: null,
      expandedLayerIds: new Set<string>(),
    };
  });

  // Preview mode state — must be before URL sync effect
  const [isPreviewOpen, setIsPreviewOpen] = useState(initialMode === "preview");

  // Sync state to URL search params
  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    params.set("tab", state.sidebarPanel);
    params.set("device", state.previewMode);
    params.set("mood", state.design.mood);
    params.set("mode", isPreviewOpen ? "preview" : "edit");
    const newUrl = `${window.location.pathname}?${params.toString()}`;
    window.history.replaceState(null, "", newUrl);
  }, [state.sidebarPanel, state.previewMode, state.design.mood, isPreviewOpen]);

  // ── Dirty tracking (must be before pages section) ──
  const [hasUnsavedChanges, setHasUnsavedChanges] = useState(false);
  const savedStateRef = useRef(
    JSON.stringify({ blocks: state.blocks, design: state.design }),
  );
  const markDirty = useCallback(() => setHasUnsavedChanges(true), []);

  useEffect(() => {
    if (routeProjectId) {
      // Validate the project exists
      const project = ProjectStorage.getProject(routeProjectId);
      if (project) {
        setResolvedProjectId(routeProjectId);
        setProjectNotFound(false);
      } else {
        setProjectNotFound(true);
        setResolvedProjectId(null);
      }
    } else {
      // No projectId in URL: load most recently updated project or create one
      const projects = ProjectStorage.listProjects();
      if (projects.length > 0) {
        const sorted = [...projects].sort(
          (a, b) => new Date(b.updatedAt).getTime() - new Date(a.updatedAt).getTime(),
        );
        setResolvedProjectId(sorted[0].id);
        setProjectNotFound(false);
      } else {
        // Create a new project
        const newProject = ProjectStorage.createProject("My Website");
        setResolvedProjectId(newProject.id);
        setProjectNotFound(false);
      }
    }
  }, [routeProjectId]);

  // Reload pages when resolvedProjectId changes
  useEffect(() => {
    if (resolvedProjectId) {
      const loaded = ProjectStorage.loadProjectPages(resolvedProjectId);
      setPagesState(loaded);
    }
  }, [resolvedProjectId]);

  // Sync active page blocks/design with builder state
  useEffect(() => {
    const activePage = pagesState.pages.find(
      (p) => p.id === pagesState.activePageId,
    );
    if (activePage) {
      setState((s) => ({
        ...s,
        blocks: activePage.blocks,
        design: activePage.design,
        selectedBlockId: null,
      }));
    }
  }, [pagesState.activePageId]);

  // Save pages state to localStorage
  const isInitialMount = useRef(true);
  useEffect(() => {
    if (isInitialMount.current) {
      isInitialMount.current = false;
      return;
    }
    // Update the active page's blocks/design from builder state
    setPagesState((ps) => ({
      ...ps,
      pages: ps.pages.map((p) =>
        p.id === ps.activePageId
          ? {
              ...p,
              blocks: state.blocks,
              design: state.design,
              settings: { ...p.settings, updatedAt: new Date().toISOString() },
            }
          : p,
      ),
    }));
  }, [state.blocks, state.design]);

  useEffect(() => {
    if (resolvedProjectId) {
      ProjectStorage.saveProjectPages(resolvedProjectId, pagesState);
    } else {
      savePages(pagesState);
    }
  }, [pagesState, resolvedProjectId]);

  // Auto-create version snapshots on save (debounced to avoid excessive versions)
  const versionManagerRef = useRef(new VersionManager());
  const versionTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  useEffect(() => {
    const activePage = pagesState.pages.find((p) => p.id === pagesState.activePageId);
    if (!activePage) return;

    // Debounce version creation: only create a version after 5 seconds of inactivity
    if (versionTimerRef.current) {
      clearTimeout(versionTimerRef.current);
    }

    versionTimerRef.current = setTimeout(() => {
      versionManagerRef.current.createVersion(
        activePage.id,
        activePage.blocks,
        activePage.design,
        activePage.settings,
      );
    }, 5000);

    return () => {
      if (versionTimerRef.current) {
        clearTimeout(versionTimerRef.current);
      }
    };
  }, [pagesState]);

  const handleSelectPage = useCallback((id: string) => {
    setPagesState((ps) => ({ ...ps, activePageId: id }));
  }, []);

  const handleCreatePage = useCallback((name: string, locale: "en" | "ar") => {
    const page = createPage(name, undefined, locale);
    setPagesState((ps) => ({
      ...ps,
      pages: [...ps.pages, page],
      activePageId: page.id,
    }));
  }, []);

  const handleDeletePage = useCallback((id: string) => {
    setPagesState((ps) => {
      const remaining = ps.pages.filter((p) => p.id !== id);
      if (remaining.length === 0) return ps;
      return {
        ...ps,
        pages: remaining,
        activePageId:
          ps.activePageId === id ? remaining[0].id : ps.activePageId,
      };
    });
  }, []);

  const handleDuplicatePage = useCallback((id: string) => {
    setPagesState((ps) => {
      const original = ps.pages.find((p) => p.id === id);
      if (!original) return ps;
      const copy = createPage(`${original.settings.title} (Copy)`, {
        blocks: original.blocks,
        design: original.design,
      });
      return { ...ps, pages: [...ps.pages, copy], activePageId: copy.id };
    });
  }, []);

  const handleUpdatePageSettings = useCallback(
    (id: string, settings: Partial<Page["settings"]>) => {
      setPagesState((ps) => ({
        ...ps,
        pages: ps.pages.map((p) =>
          p.id === id ? { ...p, settings: { ...p.settings, ...settings } } : p,
        ),
      }));
      markDirty();
    },
    [markDirty],
  );

  // Panel visibility & widths
  const [leftVisible, setLeftVisible] = useState(true);
  const [rightVisible, setRightVisible] = useState(true);
  const [leftWidth, setLeftWidth] = useState(320);
  const [rightWidth, setRightWidth] = useState(300);

  // Auto-hide sidebars on small screens
  useEffect(() => {
    const handleResize = () => {
      if (!window.matchMedia("(min-width: 768px)").matches) {
        setLeftVisible(false);
        setRightVisible(false);
      }
    };
    handleResize(); // run on mount
    window.addEventListener("resize", handleResize);
    return () => window.removeEventListener("resize", handleResize);
  }, []);

  // ── Menus Management ──
  const [menusState, setMenusState] = useState<MenusState>(
    () => loadMenus() || getDefaultMenusState(),
  );
  useEffect(() => {
    saveMenus(menusState);
  }, [menusState]);

  const handleUpdateMenus = useCallback(
    (menus: MenusState["menus"]) => {
      setMenusState({ menus });
      markDirty();
    },
    [markDirty],
  );

  // Language, theme, preview — persisted
  const [language, setLanguage] = useState<"en" | "ar">(() => {
    try {
      return (localStorage.getItem("pb-lang") as "en" | "ar") || "en";
    } catch {
      return "en";
    }
  });
  const [theme, setTheme] = useState<"light" | "dark">(() => {
    try {
      return (localStorage.getItem("pb-theme") as "light" | "dark") || "light";
    } catch {
      return "light";
    }
  });

  // Persist theme & language
  useEffect(() => {
    try {
      localStorage.setItem("pb-theme", theme);
    } catch {}
  }, [theme]);
  useEffect(() => {
    try {
      localStorage.setItem("pb-lang", language);
    } catch {}
  }, [language]);

  const [activeDragId, setActiveDragId] = useState<string | null>(null);
  const [activeDragLabel, setActiveDragLabel] = useState<string | null>(null);
  const [history, setHistory] = useState<BuilderState[]>([]);
  const [future, setFuture] = useState<BuilderState[]>([]);

  // ── Apply theme to DOM ──
  useEffect(() => {
    const root = document.documentElement;
    if (theme === "dark") {
      root.classList.add("dark");
      root.setAttribute("data-theme", "dark");
    } else {
      root.classList.remove("dark");
      root.setAttribute("data-theme", "light");
    }
  }, [theme]);

  // ── Apply language/direction to DOM ──
  useEffect(() => {
    const root = document.documentElement;
    root.setAttribute("dir", language === "ar" ? "rtl" : "ltr");
    root.setAttribute("lang", language);
  }, [language]);

  // ── Load Google Fonts ──
  useEffect(() => {
    const fontUrl = FONT_URLS[state.design.typography];
    if (!fontUrl) return;
    const id = `gfont-${state.design.typography}`;
    if (document.getElementById(id)) return;
    const link = document.createElement("link");
    link.id = id;
    link.rel = "stylesheet";
    link.href = fontUrl;
    document.head.appendChild(link);
  }, [state.design.typography]);

  // ── Auto-save to localStorage on changes ──
  useEffect(() => {
    saveToStorage(state.blocks, state.design);
  }, [state.blocks, state.design]);

  // ── Keyboard shortcuts ──
  useEffect(() => {
    function handleKeyDown(e: KeyboardEvent) {
      const meta = e.metaKey || e.ctrlKey;

      // Ctrl+Z = Undo
      if (meta && e.key === "z" && !e.shiftKey) {
        e.preventDefault();
        undo();
        return;
      }
      // Ctrl+Shift+Z or Ctrl+Y = Redo
      if ((meta && e.key === "z" && e.shiftKey) || (meta && e.key === "y")) {
        e.preventDefault();
        redo();
        return;
      }
      // Ctrl+S = Save
      if (meta && e.key === "s") {
        e.preventDefault();
        handleSave();
        return;
      }
      // Delete/Backspace = Delete selected block
      if (
        (e.key === "Delete" || e.key === "Backspace") &&
        state.selectedBlockId
      ) {
        // Don't delete if user is typing in an input or contenteditable
        const tag = (e.target as HTMLElement)?.tagName;
        if (tag === "INPUT" || tag === "TEXTAREA") return;
        const el = e.target as HTMLElement;
        if (el?.isContentEditable || el?.closest?.("[contenteditable]")) return;
        e.preventDefault();
        deleteBlock(state.selectedBlockId);
        return;
      }
      // Ctrl+D = Duplicate selected block
      if (meta && e.key === "d" && state.selectedBlockId) {
        e.preventDefault();
        duplicateBlock(state.selectedBlockId);
        return;
      }
      // Ctrl+C = Copy selected block
      if (meta && e.key === "c" && state.selectedBlockId) {
        const block = findBlock(state.blocks, state.selectedBlockId);
        if (block) {
          const tag = (e.target as HTMLElement)?.tagName;
          if (tag !== "INPUT" && tag !== "TEXTAREA") {
            clipboard.copy(block);
          }
        }
        return;
      }
      // Ctrl+V = Paste block
      if (meta && e.key === "v" && clipboard.hasCopied) {
        const tag = (e.target as HTMLElement)?.tagName;
        if (tag === "INPUT" || tag === "TEXTAREA") return;
        e.preventDefault();
        const newBlock = clipboard.paste(state.selectedBlockId, state.blocks);
        if (newBlock) {
          pushHistory();
          setState((s) => {
            const idx = s.selectedBlockId
              ? s.blocks.findIndex((b) => b.id === s.selectedBlockId)
              : -1;
            const newBlocks = [...s.blocks];
            newBlocks.splice(
              idx >= 0 ? idx + 1 : newBlocks.length,
              0,
              newBlock,
            );
            return { ...s, blocks: newBlocks, selectedBlockId: newBlock.id };
          });
        }
        return;
      }
      // Escape = Deselect / Close preview
      if (e.key === "Escape") {
        if (isPreviewOpen) {
          setIsPreviewOpen(false);
        } else {
          setState((s) => ({ ...s, selectedBlockId: null }));
        }
        return;
      }
      // Ctrl+P = Preview
      if (meta && e.key === "p") {
        e.preventDefault();
        setIsPreviewOpen(true);
        return;
      }
    }

    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  });

  // ── History ──
  const pushHistory = useCallback(() => {
    setHistory((prev) => [...prev.slice(-20), state]);
    setFuture([]);
    markDirty();
  }, [state, markDirty]);

  const undo = useCallback(() => {
    if (history.length === 0) return;
    const prev = history[history.length - 1];
    setFuture((f) => [state, ...f]);
    setHistory((h) => h.slice(0, -1));
    setState(prev);
    markDirty();
  }, [history, state, markDirty]);

  const redo = useCallback(() => {
    if (future.length === 0) return;
    const next = future[0];
    setHistory((h) => [...h, state]);
    setFuture((f) => f.slice(1));
    setState(next);
    markDirty();
  }, [future, state, markDirty]);

  // ── Resize ──
  const handleLeftResize = useCallback((delta: number) => {
    setLeftWidth((w) => Math.min(MAX_LEFT, Math.max(MIN_LEFT, w + delta)));
  }, []);
  const handleRightResize = useCallback((delta: number) => {
    setRightWidth((w) => Math.min(MAX_RIGHT, Math.max(MIN_RIGHT, w + delta)));
  }, []);

  const sensors = useSensors(
    useSensor(PointerSensor, { activationConstraint: { distance: 5 } }),
    useSensor(KeyboardSensor, {
      coordinateGetter: sortableKeyboardCoordinates,
    }),
  );

  // ── DnD ──
  function handleDragStart(event: DragStartEvent) {
    const { active } = event;
    setActiveDragId(active.id as string);
    const data = active.data.current;
    if (data?.type === "sidebar-block") {
      const def = BLOCK_DEFINITIONS.find((b) => b.type === data.blockType)
        || COMPONENT_DEFINITIONS.find((c) => c.type === (data.blockType as string));
      setActiveDragLabel(def ? `${def.label}` : data.blockType);
    } else {
      const block = findBlock(state.blocks, active.id as string);
      if (block) {
        const def = BLOCK_DEFINITIONS.find((b) => b.type === block.type)
          || COMPONENT_DEFINITIONS.find((c) => c.type === (block.type as string));
        setActiveDragLabel(def ? def.label : block.type);
      }
    }
  }

  function handleDragEnd(event: DragEndEvent) {
    const { active, over } = event;
    setActiveDragId(null);
    setActiveDragLabel(null);
    if (!over) return;
    const activeData = active.data.current;
    const overId = over.id as string;

    // ── Sidebar block drop (new block creation) ──
    if (activeData?.type === "sidebar-block") {
      const blockType = activeData.blockType as BlockType;
      const def = BLOCK_DEFINITIONS.find((b) => b.type === blockType)
        || COMPONENT_DEFINITIONS.find((c) => c.type === (blockType as string));
      pushHistory();
      const newBlock: BlockInstance = {
        id: createBlockId(),
        type: blockType,
        props: def && "defaultProps" in def ? { ...def.defaultProps } : {},
      };

      // Check if dropping into a nested zone (compound ID: parentId:zoneName)
      if (overId.includes(":") && !overId.startsWith("drop-before-") && !overId.startsWith("drop-after-")) {
        const parts = overId.split(":");
        const parentId = parts[0];
        const zoneName = parts[1];
        // Parse optional position hint: parentId:zone:before-blockId or parentId:zone:after-blockId
        let targetIndex = 0;
        if (parts.length >= 3) {
          const posHint = parts.slice(2).join(":");
          if (posHint.startsWith("before-")) {
            const refId = posHint.replace("before-", "");
            const parent = findBlock(state.blocks, parentId);
            const zoneBlocks = parent?.children?.[zoneName] ?? [];
            const idx = zoneBlocks.findIndex((b) => b.id === refId);
            targetIndex = idx >= 0 ? idx : 0;
          } else if (posHint.startsWith("after-")) {
            const refId = posHint.replace("after-", "");
            const parent = findBlock(state.blocks, parentId);
            const zoneBlocks = parent?.children?.[zoneName] ?? [];
            const idx = zoneBlocks.findIndex((b) => b.id === refId);
            targetIndex = idx >= 0 ? idx + 1 : zoneBlocks.length;
          }
        } else {
          // Drop at end of zone
          const parent = findBlock(state.blocks, parentId);
          targetIndex = parent?.children?.[zoneName]?.length ?? 0;
        }
        setState((s) => ({
          ...s,
          blocks: treeInsertBlock(s.blocks, newBlock, parentId, zoneName, targetIndex),
          selectedBlockId: newBlock.id,
        }));
        return;
      }

      // Root-level drops
      setState((s) => {
        let newBlocks = [...s.blocks];
        if (overId === "canvas-drop-empty") newBlocks = [newBlock];
        else if (overId.startsWith("drop-before-")) {
          const idx = newBlocks.findIndex(
            (b) => b.id === overId.replace("drop-before-", ""),
          );
          newBlocks.splice(idx >= 0 ? idx : 0, 0, newBlock);
        } else if (overId.startsWith("drop-after-")) {
          const idx = newBlocks.findIndex(
            (b) => b.id === overId.replace("drop-after-", ""),
          );
          newBlocks.splice(idx >= 0 ? idx + 1 : newBlocks.length, 0, newBlock);
        } else {
          const idx = newBlocks.findIndex((b) => b.id === overId);
          newBlocks.splice(idx >= 0 ? idx + 1 : newBlocks.length, 0, newBlock);
        }
        return { ...s, blocks: newBlocks, selectedBlockId: newBlock.id };
      });
      return;
    }

    // ── Reorder existing block ──
    if (active.id !== over.id) {
      const activeId = active.id as string;
      const activeParentInfo = getParentBlock(state.blocks, activeId);
      
      let targetParentId: string | null = null;
      let targetZone: string | null = null;
      let targetIndex = 0;

      if (overId.includes(":") && !overId.startsWith("drop-before-") && !overId.startsWith("drop-after-")) {
        // Drop into nested zone
        const parts = overId.split(":");
        targetParentId = parts[0];
        targetZone = parts[1];

        if (wouldCreateCycle(state.blocks, activeId, targetParentId)) return;

        const parent = findBlock(state.blocks, targetParentId);
        const zoneBlocks = parent?.children?.[targetZone] ?? [];

        if (parts.length >= 3) {
          const posHint = parts.slice(2).join(":");
          if (posHint.startsWith("before-")) {
            const refId = posHint.replace("before-", "");
            const idx = zoneBlocks.findIndex((b) => b.id === refId);
            targetIndex = idx >= 0 ? idx : 0;
          } else if (posHint.startsWith("after-")) {
            const refId = posHint.replace("after-", "");
            const idx = zoneBlocks.findIndex((b) => b.id === refId);
            targetIndex = idx >= 0 ? idx + 1 : zoneBlocks.length;
          }
        } else {
          targetIndex = zoneBlocks.length;
        }
      } else {
        // Root-level reorder or dropping into root drop zones
        targetParentId = null;
        targetZone = null;
        
        if (overId.startsWith("drop-before-")) {
          const refId = overId.replace("drop-before-", "");
          const idx = state.blocks.findIndex((b) => b.id === refId);
          targetIndex = idx >= 0 ? idx : 0;
        } else if (overId.startsWith("drop-after-")) {
          const refId = overId.replace("drop-after-", "");
          const idx = state.blocks.findIndex((b) => b.id === refId);
          targetIndex = idx >= 0 ? idx + 1 : state.blocks.length;
        } else {
          const idx = state.blocks.findIndex((b) => b.id === overId);
          targetIndex = idx >= 0 ? idx + 1 : state.blocks.length;
        }
      }

      // Adjustment for moving within the same zone:
      // If we move a block to a later position in the same zone, 
      // the index will shift once the block is removed.
      const isSameZone = (activeParentInfo?.parent.id ?? null) === targetParentId && 
                         (activeParentInfo?.zone ?? null) === targetZone;
      
      if (isSameZone) {
        const zoneBlocks = targetParentId 
          ? findBlock(state.blocks, targetParentId)?.children?.[targetZone!] ?? []
          : state.blocks;
        const activeIdx = zoneBlocks.findIndex(b => b.id === activeId);
        if (activeIdx >= 0 && activeIdx < targetIndex) {
          targetIndex--;
        }
      }

      pushHistory();
      setState((s) => ({
        ...s,
        blocks: treeMoveBlock(s.blocks, activeId, targetParentId, targetZone, targetIndex),
      }));
    }
  }

  // ── Block Operations ──
  const deleteBlock = useCallback(
    (id: string) => {
      pushHistory();
      setState((s) => ({
        ...s,
        blocks: removeBlock(s.blocks, id),
        selectedBlockId: s.selectedBlockId === id ? null : s.selectedBlockId,
      }));
    },
    [pushHistory],
  );

  const selectBlock = useCallback((id: string | null) => {
    setState((s) => {
      // Verify the block exists in the tree (not just root level)
      if (id !== null && !findBlock(s.blocks, id)) return s;
      return { ...s, selectedBlockId: id };
    });
  }, []);

  const updateBlockProps = useCallback(
    (blockId: string, props: Record<string, unknown>) => {
      setState((s) => ({
        ...s,
        blocks: updateBlockInTree(s.blocks, blockId, props),
      }));
      markDirty();
    },
    [markDirty],
  );

  const moveBlockUp = useCallback(
    (id: string) => {
      pushHistory();
      setState((s) => {
        // Check if block is nested
        const parentInfo = getParentBlock(s.blocks, id);
        if (parentInfo) {
          const { parent, zone } = parentInfo;
          const zoneBlocks = parent.children?.[zone] ?? [];
          const idx = zoneBlocks.findIndex((b) => b.id === id);
          if (idx <= 0) return s;
          return { ...s, blocks: treeMoveBlock(s.blocks, id, parent.id, zone, idx - 1) };
        }
        // Root level
        const idx = s.blocks.findIndex((b) => b.id === id);
        if (idx <= 0) return s;
        return { ...s, blocks: arrayMove(s.blocks, idx, idx - 1) };
      });
    },
    [pushHistory],
  );

  const moveBlockDown = useCallback(
    (id: string) => {
      pushHistory();
      setState((s) => {
        // Check if block is nested
        const parentInfo = getParentBlock(s.blocks, id);
        if (parentInfo) {
          const { parent, zone } = parentInfo;
          const zoneBlocks = parent.children?.[zone] ?? [];
          const idx = zoneBlocks.findIndex((b) => b.id === id);
          if (idx < 0 || idx >= zoneBlocks.length - 1) return s;
          return { ...s, blocks: treeMoveBlock(s.blocks, id, parent.id, zone, idx + 1) };
        }
        // Root level
        const idx = s.blocks.findIndex((b) => b.id === id);
        if (idx < 0 || idx >= s.blocks.length - 1) return s;
        return { ...s, blocks: arrayMove(s.blocks, idx, idx + 1) };
      });
    },
    [pushHistory],
  );

  const duplicateBlock = useCallback(
    (id: string) => {
      pushHistory();
      setState((s) => ({
        ...s,
        blocks: treeDuplicateBlock(s.blocks, id),
      }));
    },
    [pushHistory],
  );

  const updateDesign = useCallback(
    <K extends keyof DesignSettings>(key: K, value: DesignSettings[K]) => {
      pushHistory();
      setState((s) => ({ ...s, design: { ...s.design, [key]: value } }));
    },
    [pushHistory],
  );

  // ── Hover & Expand state handlers ──
  const setHoveredBlockId = useCallback((id: string | null) => {
    setState((s) => ({ ...s, hoveredBlockId: id }));
  }, []);

  const toggleExpandLayer = useCallback((id: string) => {
    setState((s) => {
      const next = new Set(s.expandedLayerIds);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return { ...s, expandedLayerIds: next };
    });
  }, []);

  const applyTemplate = useCallback(
    (template: Template) => {
      pushHistory();
      setState((s) => ({
        ...s,
        blocks: template.blocks.map((b) => ({ ...b, id: createBlockId() })),
        design: { ...template.design },
        selectedBlockId: null,
        sidebarPanel: "blocks",
      }));
    },
    [pushHistory],
  );

  // ── Save / Discard ──
  const handleSave = useCallback(() => {
    savedStateRef.current = JSON.stringify({
      blocks: state.blocks,
      design: state.design,
    });
    saveToStorage(state.blocks, state.design);
    setHasUnsavedChanges(false);
  }, [state.blocks, state.design]);

  const handleDiscard = useCallback(() => {
    try {
      const saved = JSON.parse(savedStateRef.current);
      setState((s) => ({
        ...s,
        blocks: saved.blocks,
        design: saved.design,
        selectedBlockId: null,
      }));
    } catch {
      /* ignore */
    }
    setHasUnsavedChanges(false);
    setHistory([]);
    setFuture([]);
  }, []);

  const selectedBlock =
    findBlock(state.blocks, state.selectedBlockId ?? "") || null;

  // ── Clipboard ──
  const clipboard = useClipboard();

  // ── Export Handlers ──
  const handleExportHtml = useCallback(() => {
    const activePage = pagesState.pages.find(
      (p) => p.id === pagesState.activePageId,
    );
    if (!activePage) return;
    const html = generateHtml({
      blocks: state.blocks,
      design: state.design,
      pageSettings: activePage.settings,
    });
    downloadHtml(html, `${activePage.settings.slug || "page"}.html`);
  }, [state.blocks, state.design, pagesState]);

  const handleExportReact = useCallback(() => {
    const activePage = pagesState.pages.find(
      (p) => p.id === pagesState.activePageId,
    );
    if (!activePage) return;
    const content = generateReactComponent({
      blocks: state.blocks,
      design: state.design,
      pageSettings: activePage.settings,
    });
    const name =
      activePage.settings.slug
        .split("-")
        .map((w: string) => w.charAt(0).toUpperCase() + w.slice(1))
        .join("") || "Page";
    downloadReactFile(content, `${name}.tsx`);
  }, [state.blocks, state.design, pagesState]);

  const handleExportProject = useCallback(() => {
    const files = exportProject(pagesState.pages, state.design);
    downloadAllPages(files);
  }, [pagesState.pages, state.design]);

  // ── Preview Mode ──
  if (projectNotFound) {
    return (
      <div className="flex flex-col items-center justify-center h-screen gap-4 bg-background">
        <p className="text-lg text-foreground">Project not found</p>
        <Link
          to="/projects"
          className="text-sm text-accent hover:underline"
        >
          ← Back to Projects
        </Link>
      </div>
    );
  }

  if (isPreviewOpen) {
    return (
      <PreviewMode
        blocks={state.blocks}
        design={state.design}
        isDraft={!(pagesState.pages.find((p) => p.id === pagesState.activePageId)?.settings.published)}
        onClose={() => setIsPreviewOpen(false)}
      />
    );
  }

  // Custom collision detection: try pointerWithin first, fall back to rectIntersection
  const customCollision: CollisionDetection = (args) => {
    const pointerCollisions = pointerWithin(args);
    if (pointerCollisions.length > 0) return pointerCollisions;
    return rectIntersection(args);
  };

  return (
    <DndContext
      collisionDetection={customCollision}
      sensors={sensors}
      onDragEnd={handleDragEnd}
      onDragStart={handleDragStart}
    >
      <div className="flex h-screen flex-col bg-background overflow-hidden">
        {(() => {
          const toolbarProps = {
            canRedo: future.length > 0,
            canUndo: history.length > 0,
            language,
            leftSidebarVisible: leftVisible,
            previewMode: state.previewMode,
            rightSidebarVisible: rightVisible,
            theme,
            isPublished: pagesState.pages.find((p) => p.id === pagesState.activePageId)?.settings.published ?? false,
            pageTitle: pagesState.pages.find((p) => p.id === pagesState.activePageId)?.settings.title ?? "",
            pageSlug: pagesState.pages.find((p) => p.id === pagesState.activePageId)?.settings.slug ?? "",
            onPublish: () => {
              setPagesState((ps) => ({
                ...ps,
                pages: ps.pages.map((p) =>
                  p.id === ps.activePageId
                    ? { ...p, settings: { ...p.settings, published: true, updatedAt: new Date().toISOString() } }
                    : p,
                ),
              }));
            },
            onUnpublish: () => {
              setPagesState((ps) => ({
                ...ps,
                pages: ps.pages.map((p) =>
                  p.id === ps.activePageId
                    ? { ...p, settings: { ...p.settings, published: false, updatedAt: new Date().toISOString() } }
                    : p,
                ),
              }));
            },
            onLanguageChange: setLanguage,
            onPreview: () => setIsPreviewOpen(true),
            onExportHtml: handleExportHtml,
            onExportReact: handleExportReact,
            onExportProject: handleExportProject,
            onPreviewModeChange: (mode: "desktop" | "tablet" | "mobile") =>
              setState((s) => ({ ...s, previewMode: mode })),
            onRedo: redo,
            onThemeChange: setTheme,
            onToggleLeftSidebar: () => {
              setLeftVisible((v) => {
                const next = !v;
                if (next && !window.matchMedia("(min-width: 768px)").matches) {
                  setRightVisible(false);
                }
                return next;
              });
            },
            onToggleRightSidebar: () => {
              setRightVisible((v) => {
                const next = !v;
                if (next && !window.matchMedia("(min-width: 768px)").matches) {
                  setLeftVisible(false);
                }
                return next;
              });
            },
            onUndo: undo,
          };
          const ToolbarComponent = manager.getComponent(
            "Toolbar",
            Toolbar as unknown as React.ComponentType<Record<string, unknown>>,
          );
          if (ToolbarComponent !== Toolbar) {
            return (
              <ErrorBoundary
                componentName="Toolbar"
                fallback={<Toolbar {...toolbarProps} />}
              >
                <ToolbarComponent {...toolbarProps} />
              </ErrorBoundary>
            );
          }
          return <Toolbar {...toolbarProps} />;
        })()}

        <BreadcrumbNav
          blocks={state.blocks}
          selectedBlockId={state.selectedBlockId}
          onSelectBlock={selectBlock}
        />

        <div className="flex flex-1 min-h-0 relative">
          {/* Left sidebar — overlay on mobile, inline on desktop */}
          <div
            className={clsx(
              "shrink-0 transition-all duration-300 ease-out overflow-hidden h-full",
              "max-md:fixed max-md:inset-y-12 max-md:left-0 max-md:z-40 max-md:shadow-xl",
              !leftVisible && "max-md:pointer-events-none",
            )}
            style={{ width: leftVisible ? `${leftWidth}px` : "0px" }}
          >
            <div className="h-full" style={{ width: `${leftWidth}px` }}>
              {(() => {
                const sidebarProps = {
                  activePanel: state.sidebarPanel,
                  design: state.design,
                  pagesPanel: (
                    <PagesPanel
                      activePageId={pagesState.activePageId}
                      pages={pagesState.pages}
                      onCreatePage={handleCreatePage}
                      onDeletePage={handleDeletePage}
                      onDuplicatePage={handleDuplicatePage}
                      onSelectPage={handleSelectPage}
                      onUpdatePageSettings={handleUpdatePageSettings}
                    />
                  ),
                  menusPanel: (
                    <MenuManager
                      menus={menusState.menus}
                      pages={pagesState.pages}
                      onUpdate={handleUpdateMenus}
                    />
                  ),
                  width: leftWidth,
                  onDesignUpdate: updateDesign,
                  onPanelChange: (panel: SidebarPanel) =>
                    setState((s) => ({ ...s, sidebarPanel: panel })),
                  onTemplateSelect: applyTemplate,
                  onBlockSelect: (blockType: BlockType) => {
                    const def = BLOCK_DEFINITIONS.find((b) => b.type === blockType)
                      || COMPONENT_DEFINITIONS.find((c) => c.type === (blockType as string));
                    pushHistory();
                    const newBlock: BlockInstance = {
                      id: createBlockId(),
                      type: blockType,
                      props: def && "defaultProps" in def ? { ...def.defaultProps } : {},
                    };
                    setState((s) => ({
                      ...s,
                      blocks: [...s.blocks, newBlock],
                      selectedBlockId: newBlock.id,
                    }));
                  },
                };
                const SidebarComponent = manager.getComponent(
                  "Sidebar",
                  Sidebar as unknown as React.ComponentType<Record<string, unknown>>,
                );
                if (SidebarComponent !== Sidebar) {
                  return (
                    <ErrorBoundary
                      componentName="Sidebar"
                      fallback={<Sidebar {...sidebarProps} />}
                    >
                      <SidebarComponent {...sidebarProps} />
                    </ErrorBoundary>
                  );
                }
                return <Sidebar {...sidebarProps} />;
              })()}
            </div>
          </div>
          {leftVisible && (
            <ResizeHandle className="hidden md:flex" side="left" onResize={handleLeftResize} />
          )}

          {(() => {
            const canvasProps = {
              blocks: state.blocks,
              design: state.design,
              isDragActive: activeDragId !== null,
              hoveredBlockId: state.hoveredBlockId,
              previewMode: state.previewMode,
              selectedBlockId: state.selectedBlockId,
              onBlockDelete: deleteBlock,
              onBlockSelect: selectBlock,
            };
            const CanvasComponent = manager.getComponent(
              "Canvas",
              Canvas as unknown as React.ComponentType<Record<string, unknown>>,
            );
            if (CanvasComponent !== Canvas) {
              return (
                <ErrorBoundary
                  componentName="Canvas"
                  fallback={<Canvas {...canvasProps} />}
                >
                  <CanvasComponent {...canvasProps} />
                </ErrorBoundary>
              );
            }
            return <Canvas {...canvasProps} />;
          })()}

          {/* Right sidebar with slide animation */}
          {rightVisible && (
            <ResizeHandle className="hidden md:flex" side="right" onResize={handleRightResize} />
          )}
          <div
            className={clsx(
              "shrink-0 transition-all duration-300 ease-out overflow-hidden h-full",
              "max-md:fixed max-md:inset-y-12 max-md:right-0 max-md:z-40 max-md:shadow-xl",
              !rightVisible && "max-md:pointer-events-none",
            )}
            style={{ width: rightVisible ? `${rightWidth}px` : "0px" }}
          >
            <div className="h-full max-md:w-full" style={{ width: `${rightWidth}px` }}>
              {(() => {
                const rightPanelProps = {
                  activePage: pagesState.pages.find(
                    (p) => p.id === pagesState.activePageId,
                  ),
                  block: selectedBlock,
                  blocks: state.blocks,
                  pages: pagesState.pages,
                  width: rightWidth,
                  expandedLayerIds: state.expandedLayerIds,
                  onToggleExpand: toggleExpandLayer,
                  onHoverBlock: setHoveredBlockId,
                  onDelete: deleteBlock,
                  onDeselect: () => selectBlock(null),
                  onDuplicate: duplicateBlock,
                  onMoveDown: moveBlockDown,
                  onMoveUp: moveBlockUp,
                  onUpdate: updateBlockProps,
                  onUpdatePageSettings: handleUpdatePageSettings,
                };
                const RightPanelComponent = manager.getComponent(
                  "RightPanel",
                  RightPanel as unknown as React.ComponentType<Record<string, unknown>>,
                );
                if (RightPanelComponent !== RightPanel) {
                  return (
                    <ErrorBoundary
                      componentName="RightPanel"
                      fallback={<RightPanel {...rightPanelProps} />}
                    >
                      <RightPanelComponent {...rightPanelProps} />
                    </ErrorBoundary>
                  );
                }
                return <RightPanel {...rightPanelProps} />;
              })()}
            </div>
          </div>
        </div>

        {/* Mobile backdrop when sidebar is open */}
        {(leftVisible || rightVisible) && (
          <div
            className="fixed inset-0 z-30 bg-black/30 md:hidden"
            onClick={() => {
              setLeftVisible(false);
              setRightVisible(false);
            }}
          />
        )}

        <FloatingBar
          visible={hasUnsavedChanges}
          onDiscard={handleDiscard}
          onPreview={() => setIsPreviewOpen(true)}
          onSave={handleSave}
        />

        {/* ActionBar for selected block */}
        {selectedBlock && !activeDragId && (
          <ActionBar
            block={selectedBlock}
            blockRef={document.querySelector(`[data-block-id="${state.selectedBlockId}"]`) as HTMLElement | null}
            isNested={!!getParentBlock(state.blocks, state.selectedBlockId!)}
            isDragging={!!activeDragId}
            onDuplicate={() => duplicateBlock(state.selectedBlockId!)}
            onDelete={() => deleteBlock(state.selectedBlockId!)}
            onSelectParent={() => {
              const parentInfo = getParentBlock(state.blocks, state.selectedBlockId!);
              if (parentInfo) selectBlock(parentInfo.parent.id);
            }}
          />
        )}

        <DragOverlay>
          {activeDragId && activeDragLabel && (
            <div className="flex items-center gap-2 rounded-xl bg-white dark:bg-surface border-2 border-[#634CF8] shadow-xl px-4 py-2.5 pointer-events-none">
              <span className="text-sm">{activeDragLabel}</span>
            </div>
          )}
        </DragOverlay>
      </div>
    </DndContext>
  );
}
