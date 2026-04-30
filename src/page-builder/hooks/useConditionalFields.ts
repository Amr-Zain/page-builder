// ── useConditionalFields Hook ──
// Evaluates field conditions, tracks visibility, and provides validation

import { useMemo, useCallback } from "react";
import { ConditionEvaluator } from "../field-conditions";
import type { ConditionalField, FieldDependency } from "../field-conditions";
import { DependencyManager } from "../dependency-manager";
import { ValidationEngine } from "../validation-engine";

export function useConditionalFields(
  conditionalFields: ConditionalField[],
  dependencies: FieldDependency[],
  props: Record<string, unknown>
) {
  const evaluator = useMemo(() => new ConditionEvaluator(), []);
  const validationEngine = useMemo(() => new ValidationEngine(), []);

  const dependencyManager = useMemo(() => {
    const mgr = new DependencyManager();
    mgr.registerDependencies(dependencies);
    return mgr;
  }, [dependencies]);

  // Compute visible fields based on condition evaluation
  const visibleFields = useMemo(() => {
    const visible = new Set<string>();
    for (const cf of conditionalFields) {
      if (evaluator.evaluateCondition(cf.condition, props)) {
        visible.add(cf.fieldName);
      }
    }
    return visible;
  }, [conditionalFields, props, evaluator]);

  // Check if a field is visible (fields without conditions are always visible)
  const isFieldVisible = useCallback(
    (fieldName: string): boolean => {
      const hasCondition = conditionalFields.some(
        (cf) => cf.fieldName === fieldName
      );
      if (!hasCondition) return true; // No condition defined = always visible
      return visibleFields.has(fieldName);
    },
    [conditionalFields, visibleFields]
  );

  // Compute field errors for visible fields
  const fieldErrors = useMemo(() => {
    const result = validationEngine.validateBlock(
      props,
      conditionalFields,
      evaluator
    );
    return result.fieldErrors;
  }, [props, conditionalFields, evaluator, validationEngine]);

  // Validate only visible fields on demand
  const validateVisibleFields = useCallback((): {
    valid: boolean;
    fieldErrors: Record<string, string[]>;
  } => {
    return validationEngine.validateBlock(props, conditionalFields, evaluator);
  }, [props, conditionalFields, evaluator, validationEngine]);

  return {
    visibleFields,
    isFieldVisible,
    fieldErrors,
    validateVisibleFields,
    dependencyManager,
  };
}
