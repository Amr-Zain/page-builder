import type {
  PluginContext,
  ToolbarAction,
  SidebarPanelDefinition,
  Plugin,
} from "./overrides";

/**
 * Implementation of PluginContext that provides plugins with
 * state management, UI registration, and lifecycle hooks.
 */
export class PluginContextImpl implements PluginContext {
  private state: Record<string, unknown> = {};
  private toolbarActions: ToolbarAction[] = [];
  private sidebarPanels: SidebarPanelDefinition[] = [];
  private blockTypes: Record<string, unknown>[] = [];

  private blockAddedCallbacks: Array<(block: Record<string, unknown>) => void> = [];
  private blockRemovedCallbacks: Array<(blockId: string) => void> = [];
  private saveCallbacks: Array<() => void> = [];

  // ── PluginContext interface methods ──

  getState = (): Record<string, unknown> => {
    return { ...this.state };
  };

  setState = (updater: (state: Record<string, unknown>) => Record<string, unknown>): void => {
    this.state = updater(this.state);
  };

  registerToolbarAction = (action: ToolbarAction): void => {
    // Avoid duplicate registrations
    if (!this.toolbarActions.some((a) => a.id === action.id)) {
      this.toolbarActions.push(action);
    }
  };

  registerSidebarPanel = (panel: SidebarPanelDefinition): void => {
    // Avoid duplicate registrations
    if (!this.sidebarPanels.some((p) => p.id === panel.id)) {
      this.sidebarPanels.push(panel);
    }
  };

  registerBlockType = (definition: Record<string, unknown>): void => {
    this.blockTypes.push(definition);
  };

  onBlockAdded = (callback: (block: Record<string, unknown>) => void): void => {
    this.blockAddedCallbacks.push(callback);
  };

  onBlockRemoved = (callback: (blockId: string) => void): void => {
    this.blockRemovedCallbacks.push(callback);
  };

  onSave = (callback: () => void): void => {
    this.saveCallbacks.push(callback);
  };

  // ── Accessor methods for PageBuilder to consume ──

  getRegisteredActions(): ToolbarAction[] {
    return this.toolbarActions;
  }

  getRegisteredPanels(): SidebarPanelDefinition[] {
    return this.sidebarPanels;
  }

  getRegisteredBlockTypes(): Record<string, unknown>[] {
    return this.blockTypes;
  }

  // ── Lifecycle event triggers (called by PageBuilder) ──

  triggerBlockAdded(block: Record<string, unknown>): void {
    for (const cb of this.blockAddedCallbacks) {
      try {
        cb(block);
      } catch (err) {
        console.error("[PluginContext] Error in onBlockAdded callback:", err);
      }
    }
  }

  triggerBlockRemoved(blockId: string): void {
    for (const cb of this.blockRemovedCallbacks) {
      try {
        cb(blockId);
      } catch (err) {
        console.error("[PluginContext] Error in onBlockRemoved callback:", err);
      }
    }
  }

  triggerSave(): void {
    for (const cb of this.saveCallbacks) {
      try {
        cb();
      } catch (err) {
        console.error("[PluginContext] Error in onSave callback:", err);
      }
    }
  }
}

// ── Plugin Initialization and Cleanup ──

/**
 * Initialize all plugins by calling their init() method with the provided context.
 * Each plugin is wrapped in try/catch so a failed plugin does not prevent others from loading.
 */
export function initializePlugins(
  plugins: Plugin[],
  context: PluginContextImpl,
): void {
  for (const plugin of plugins) {
    try {
      plugin.init(context);
    } catch (err) {
      console.error(
        `[PluginSystem] Failed to initialize plugin "${plugin.name}@${plugin.version}":`,
        err,
      );
    }
  }
}

/**
 * Cleanup all plugins by calling their cleanup() method if defined.
 * Each plugin is wrapped in try/catch so a failed cleanup does not prevent others from running.
 */
export function cleanupPlugins(plugins: Plugin[]): void {
  for (const plugin of plugins) {
    if (plugin.cleanup) {
      try {
        plugin.cleanup();
      } catch (err) {
        console.error(
          `[PluginSystem] Failed to cleanup plugin "${plugin.name}@${plugin.version}":`,
          err,
        );
      }
    }
  }
}
