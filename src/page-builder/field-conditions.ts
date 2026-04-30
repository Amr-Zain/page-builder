// ── Field Conditions Framework ──
// Provides conditional field visibility, dependency management, and validation

// ── Types ──

export type ConditionOperator =
  | 'equals'
  | 'notEquals'
  | 'contains'
  | 'notContains'
  | 'greaterThan'
  | 'lessThan'
  | 'isEmpty'
  | 'isNotEmpty'
  | 'matches';

export type LogicalOperator = 'and' | 'or';

export interface FieldCondition {
  field: string;
  operator: ConditionOperator;
  value?: unknown;
}

export interface CompositeCondition {
  logic: LogicalOperator;
  conditions: (FieldCondition | CompositeCondition)[];
}

export interface FieldDependency {
  sourceField: string;
  targetField: string;
  type: 'copy' | 'transform' | 'compute';
  transform?: (value: unknown) => unknown;
  compute?: (values: Record<string, unknown>) => unknown;
  sourceFields?: string[];
}

export interface FieldValidationRule {
  type: 'required' | 'minLength' | 'maxLength' | 'pattern' | 'custom';
  value?: unknown;
  message: string;
  validate?: (value: unknown) => boolean;
}

export interface ConditionalField {
  fieldName: string;
  condition: FieldCondition | CompositeCondition;
  validationRules?: FieldValidationRule[];
}

// ── Condition Evaluator ──

export class ConditionEvaluator {
  evaluateCondition(
    condition: FieldCondition | CompositeCondition,
    props: Record<string, unknown>
  ): boolean {
    if (this.isCompositeCondition(condition)) {
      return this.evaluateCompositeCondition(condition, props);
    }
    return this.evaluateFieldCondition(condition, props);
  }

  private isCompositeCondition(
    condition: FieldCondition | CompositeCondition
  ): condition is CompositeCondition {
    return 'logic' in condition && 'conditions' in condition;
  }

  evaluateFieldCondition(
    condition: FieldCondition,
    props: Record<string, unknown>
  ): boolean {
    const fieldValue = this.getFieldValue(props, condition.field);
    return this.compareValues(fieldValue, condition.operator, condition.value);
  }

  evaluateCompositeCondition(
    condition: CompositeCondition,
    props: Record<string, unknown>
  ): boolean {
    if (condition.logic === 'and') {
      return condition.conditions.every((c) => this.evaluateCondition(c, props));
    }
    // 'or'
    return condition.conditions.some((c) => this.evaluateCondition(c, props));
  }

  getFieldValue(props: Record<string, unknown>, path: string): unknown {
    const parts = path.split('.');
    let current: unknown = props;
    for (const part of parts) {
      if (current === null || current === undefined) return undefined;
      if (typeof current !== 'object') return undefined;
      current = (current as Record<string, unknown>)[part];
    }
    return current;
  }

  compareValues(
    fieldValue: unknown,
    operator: ConditionOperator,
    conditionValue?: unknown
  ): boolean {
    switch (operator) {
      case 'equals':
        return this.deepEquals(fieldValue, conditionValue);
      case 'notEquals':
        return !this.deepEquals(fieldValue, conditionValue);
      case 'contains':
        return String(fieldValue ?? '').includes(String(conditionValue ?? ''));
      case 'notContains':
        return !String(fieldValue ?? '').includes(String(conditionValue ?? ''));
      case 'greaterThan':
        return Number(fieldValue) > Number(conditionValue);
      case 'lessThan':
        return Number(fieldValue) < Number(conditionValue);
      case 'isEmpty':
        return this.checkEmpty(fieldValue);
      case 'isNotEmpty':
        return !this.checkEmpty(fieldValue);
      case 'matches':
        try {
          return new RegExp(String(conditionValue ?? '')).test(String(fieldValue ?? ''));
        } catch {
          return false;
        }
      default:
        return false;
    }
  }

  private checkEmpty(value: unknown): boolean {
    if (value === null || value === undefined) return true;
    if (value === '') return true;
    if (Array.isArray(value) && value.length === 0) return true;
    return false;
  }

  private deepEquals(a: unknown, b: unknown): boolean {
    if (a === b) return true;
    if (a === null || b === null) return false;
    if (a === undefined || b === undefined) return false;
    if (typeof a !== 'object' || typeof b !== 'object') return false;
    const keysA = Object.keys(a as Record<string, unknown>);
    const keysB = Object.keys(b as Record<string, unknown>);
    if (keysA.length !== keysB.length) return false;
    return keysA.every((key) =>
      this.deepEquals(
        (a as Record<string, unknown>)[key],
        (b as Record<string, unknown>)[key]
      )
    );
  }
}
