import type { ComponentType, ReactNode } from "react";

// ── Component Override Interfaces ──

/**
 * Maps component names to React components that can override the defaults.
 * Each override receives the same props as the default component.
 */
export interface ComponentOverrides {
  Toolbar?: ComponentType<Record<string, unknown>>;
  Sidebar?: ComponentType<Record<string, unknown>>;
  RightPanel?: ComponentType<Record<string, unknown>>;
  Canvas?: ComponentType<Record<string, unknown>>;
}

/**
 * Theme overrides as CSS custom property names mapped to values.
 * Applied to document.documentElement as CSS custom properties.
 */
export type ThemeOverrides = Record<string, string>;

/**
 * A toolbar action registered by a plugin.
 */
export interface ToolbarAction {
  id: string;
  label: string;
  icon?: ReactNode;
  onClick: () => void;
}

/**
 * A sidebar panel definition registered by a plugin.
 */
export interface SidebarPanelDefinition {
  id: string;
  title: string;
  icon?: ReactNode;
  render: () => ReactNode;
}

/**
 * Context provided to plugins during initialization.
 */
export interface PluginContext {
  getState: () => Record<string, unknown>;
  setState: (updater: (state: Record<string, unknown>) => Record<string, unknown>) => void;
  registerToolbarAction: (action: ToolbarAction) => void;
  registerSidebarPanel: (panel: SidebarPanelDefinition) => void;
  registerBlockType: (definition: Record<string, unknown>) => void;
  onBlockAdded: (callback: (block: Record<string, unknown>) => void) => void;
  onBlockRemoved: (callback: (blockId: string) => void) => void;
  onSave: (callback: () => void) => void;
}

/**
 * A plugin that extends editor functionality.
 */
export interface Plugin {
  name: string;
  version: string;
  init: (context: PluginContext) => void;
  cleanup?: () => void;
}

// ── Override Manager ──

/**
 * Manages component overrides, theme overrides, and plugin registration.
 */
export class OverrideManager {
  private componentOverrides: ComponentOverrides = {};
  private themeOverrides: ThemeOverrides = {};
  private plugins: Plugin[] = [];

  /**
   * Register component overrides. Validates that each override is a function (React component).
   */
  registerComponentOverrides(overrides: ComponentOverrides): void {
    const validKeys: Array<keyof ComponentOverrides> = [
      "Toolbar",
      "Sidebar",
      "RightPanel",
      "Canvas",
    ];

    for (const key of validKeys) {
      const component = overrides[key];
      if (component !== undefined) {
        if (this.validateComponent(component)) {
          this.componentOverrides[key] = component;
        } else {
          console.warn(
            `[OverrideManager] Invalid component override for "${key}": expected a function or class component.`,
          );
        }
      }
    }
  }

  /**
   * Register theme overrides (CSS custom property name → value).
   */
  registerThemeOverrides(overrides: ThemeOverrides): void {
    this.themeOverrides = { ...this.themeOverrides, ...overrides };
  }

  /**
   * Register plugins for later initialization.
   */
  registerPlugins(plugins: Plugin[]): void {
    this.plugins = [...this.plugins, ...plugins];
  }

  /**
   * Returns the override component if registered, otherwise the default component.
   */
  getComponent(
    name: keyof ComponentOverrides,
    defaultComponent: ComponentType<Record<string, unknown>>,
  ): ComponentType<Record<string, unknown>> {
    const override = this.componentOverrides[name];
    if (override && this.validateComponent(override)) {
      return override;
    }
    return defaultComponent;
  }

  /**
   * Apply theme overrides by setting CSS custom properties on document.documentElement.
   */
  applyTheme(overrides: ThemeOverrides): void {
    const root = document.documentElement;
    for (const [property, value] of Object.entries(overrides)) {
      if (typeof value === "string" && value.trim() !== "") {
        root.style.setProperty(property, value);
      }
    }
  }

  /**
   * Get all registered plugins.
   */
  getPlugins(): Plugin[] {
    return this.plugins;
  }

  /**
   * Get current theme overrides.
   */
  getThemeOverrides(): ThemeOverrides {
    return this.themeOverrides;
  }

  /**
   * Validate that a component is a function or class (valid React component).
   */
  private validateComponent(component: unknown): boolean {
    return typeof component === "function";
  }
}
