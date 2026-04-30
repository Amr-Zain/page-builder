// ── Field Dependency Manager ──
// Manages field dependencies: copy, transform, and compute relationships

import type { FieldDependency } from './field-conditions';

export class DependencyManager {
  private dependencies: FieldDependency[] = [];

  registerDependency(dep: FieldDependency): void {
    this.dependencies.push(dep);
  }

  registerDependencies(deps: FieldDependency[]): void {
    this.dependencies.push(...deps);
  }

  executeDependencies(
    sourceField: string,
    props: Record<string, unknown>
  ): Record<string, unknown> {
    const relevantDeps = this.dependencies.filter(
      (dep) => dep.sourceField === sourceField
    );

    if (relevantDeps.length === 0) return props;

    let updatedProps = { ...props };

    for (const dep of relevantDeps) {
      try {
        switch (dep.type) {
          case 'copy': {
            const sourceValue = this.getNestedValue(updatedProps, dep.sourceField);
            updatedProps = this.setNestedValue(updatedProps, dep.targetField, sourceValue);
            break;
          }
          case 'transform': {
            if (!dep.transform) break;
            const sourceValue = this.getNestedValue(updatedProps, dep.sourceField);
            const transformed = dep.transform(sourceValue);
            updatedProps = this.setNestedValue(updatedProps, dep.targetField, transformed);
            break;
          }
          case 'compute': {
            if (!dep.compute || !dep.sourceFields) break;
            const values: Record<string, unknown> = {};
            for (const field of dep.sourceFields) {
              values[field] = this.getNestedValue(updatedProps, field);
            }
            const computed = dep.compute(values);
            updatedProps = this.setNestedValue(updatedProps, dep.targetField, computed);
            break;
          }
        }
      } catch {
        // On error, return original props for this dependency
        // Continue processing other dependencies
      }
    }

    return updatedProps;
  }

  detectCircularDependencies(): string[] {
    // Build directed graph: sourceField -> targetField
    const graph = new Map<string, Set<string>>();

    for (const dep of this.dependencies) {
      if (!graph.has(dep.sourceField)) {
        graph.set(dep.sourceField, new Set());
      }
      graph.get(dep.sourceField)!.add(dep.targetField);
    }

    const cycles: string[] = [];
    const visited = new Set<string>();
    const inStack = new Set<string>();
    const path: string[] = [];

    const dfs = (node: string): void => {
      if (inStack.has(node)) {
        // Found a cycle - extract it from path
        const cycleStart = path.indexOf(node);
        const cycle = [...path.slice(cycleStart), node];
        cycles.push(cycle.join(' -> '));
        return;
      }
      if (visited.has(node)) return;

      visited.add(node);
      inStack.add(node);
      path.push(node);

      const neighbors = graph.get(node);
      if (neighbors) {
        for (const neighbor of neighbors) {
          dfs(neighbor);
        }
      }

      path.pop();
      inStack.delete(node);
    };

    for (const node of graph.keys()) {
      if (!visited.has(node)) {
        dfs(node);
      }
    }

    return cycles;
  }

  getDependencies(): FieldDependency[] {
    return [...this.dependencies];
  }

  private getNestedValue(obj: Record<string, unknown>, path: string): unknown {
    const parts = path.split('.');
    let current: unknown = obj;
    for (const part of parts) {
      if (current === null || current === undefined) return undefined;
      if (typeof current !== 'object') return undefined;
      current = (current as Record<string, unknown>)[part];
    }
    return current;
  }

  private setNestedValue(
    obj: Record<string, unknown>,
    path: string,
    value: unknown
  ): Record<string, unknown> {
    const parts = path.split('.');
    if (parts.length === 1) {
      return { ...obj, [parts[0]]: value };
    }

    const [first, ...rest] = parts;
    const nested = (obj[first] as Record<string, unknown>) || {};
    return {
      ...obj,
      [first]: this.setNestedValue(
        typeof nested === 'object' && nested !== null
          ? { ...nested }
          : {},
        rest.join('.'),
        value
      ),
    };
  }
}
