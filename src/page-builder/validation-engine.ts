// ── Conditional Validation Engine ──
// Validates fields based on their visibility and configured rules

import type { FieldValidationRule, ConditionalField } from './field-conditions';
import { ConditionEvaluator } from './field-conditions';

export class ValidationEngine {
  validateField(
    value: unknown,
    rules: FieldValidationRule[]
  ): { valid: boolean; errors: string[] } {
    const errors: string[] = [];

    for (const rule of rules) {
      switch (rule.type) {
        case 'required': {
          if (value === null || value === undefined || value === '') {
            errors.push(rule.message);
          }
          break;
        }
        case 'minLength': {
          const len = String(value ?? '').length;
          if (len < (rule.value as number)) {
            errors.push(rule.message);
          }
          break;
        }
        case 'maxLength': {
          const len = String(value ?? '').length;
          if (len > (rule.value as number)) {
            errors.push(rule.message);
          }
          break;
        }
        case 'pattern': {
          try {
            const regex = new RegExp(rule.value as string);
            if (!regex.test(String(value ?? ''))) {
              errors.push(rule.message);
            }
          } catch {
            errors.push(rule.message);
          }
          break;
        }
        case 'custom': {
          if (rule.validate && !rule.validate(value)) {
            errors.push(rule.message);
          }
          break;
        }
      }
    }

    return { valid: errors.length === 0, errors };
  }

  validateBlock(
    props: Record<string, unknown>,
    conditionalFields: ConditionalField[],
    evaluator: ConditionEvaluator
  ): { valid: boolean; fieldErrors: Record<string, string[]> } {
    const fieldErrors: Record<string, string[]> = {};

    for (const cf of conditionalFields) {
      // Only validate if the field is visible (condition is true) and has rules
      const isVisible = evaluator.evaluateCondition(cf.condition, props);
      if (!isVisible || !cf.validationRules || cf.validationRules.length === 0) {
        continue;
      }

      const fieldValue = this.getFieldValue(props, cf.fieldName);
      const result = this.validateField(fieldValue, cf.validationRules);

      if (!result.valid) {
        fieldErrors[cf.fieldName] = result.errors;
      }
    }

    return {
      valid: Object.keys(fieldErrors).length === 0,
      fieldErrors,
    };
  }

  private getFieldValue(props: Record<string, unknown>, path: string): unknown {
    const parts = path.split('.');
    let current: unknown = props;
    for (const part of parts) {
      if (current === null || current === undefined) return undefined;
      if (typeof current !== 'object') return undefined;
      current = (current as Record<string, unknown>)[part];
    }
    return current;
  }
}
