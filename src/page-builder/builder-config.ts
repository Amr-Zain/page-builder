import { useEffect, useRef } from "react";
import {
  type ComponentOverrides,
  type ThemeOverrides,
  type Plugin,
  OverrideManager,
} from "./overrides";
import {
  PluginContextImpl,
  initializePlugins,
  cleanupPlugins,
} from "./plugin-context";

/**
 * Configuration object for the PageBuilder.
 */
export interface PageBuilderConfig {
  componentOverrides?: ComponentOverrides;
  themeOverrides?: ThemeOverrides;
  plugins?: Plugin[];
}

/**
 * Hook that initializes the OverrideManager and PluginContext on mount.
 * Returns the manager and context for use in the PageBuilder component.
 */
export function useBuilderConfig(config?: PageBuilderConfig) {
  const managerRef = useRef<OverrideManager | null>(null);
  const pluginContextRef = useRef<PluginContextImpl | null>(null);

  // Initialize on first render
  if (!managerRef.current) {
    managerRef.current = new OverrideManager();
  }
  if (!pluginContextRef.current) {
    pluginContextRef.current = new PluginContextImpl();
  }

  const manager = managerRef.current;
  const pluginContext = pluginContextRef.current;

  // Register overrides and plugins on mount / config change
  useEffect(() => {
    if (!config) return;

    if (config.componentOverrides) {
      manager.registerComponentOverrides(config.componentOverrides);
    }

    if (config.themeOverrides) {
      manager.registerThemeOverrides(config.themeOverrides);
      manager.applyTheme(config.themeOverrides);
    }

    if (config.plugins && config.plugins.length > 0) {
      manager.registerPlugins(config.plugins);
      initializePlugins(config.plugins, pluginContext);
    }

    // Cleanup plugins on unmount
    return () => {
      if (config.plugins) {
        cleanupPlugins(config.plugins);
      }
    };
  }, []); // eslint-disable-line react-hooks/exhaustive-deps

  return { manager, pluginContext };
}
