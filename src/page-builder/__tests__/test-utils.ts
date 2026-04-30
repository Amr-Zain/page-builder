/**
 * Test Utilities for Editor Enhancements
 * 
 * This file provides common test utilities, helpers, and setup functions
 * for testing the page-builder editor enhancements.
 */

import { vi } from 'vitest';

/**
 * Mock localStorage for testing
 */
export class MockLocalStorage {
  private store: Map<string, string> = new Map();

  getItem(key: string): string | null {
    return this.store.get(key) || null;
  }

  setItem(key: string, value: string): void {
    this.store.set(key, value);
  }

  removeItem(key: string): void {
    this.store.delete(key);
  }

  clear(): void {
    this.store.clear();
  }

  get length(): number {
    return this.store.size;
  }

  key(index: number): string | null {
    return Array.from(this.store.keys())[index] || null;
  }
}

/**
 * Setup mock localStorage for tests
 */
export function setupMockLocalStorage(): MockLocalStorage {
  const mockStorage = new MockLocalStorage();
  global.localStorage = mockStorage as any;
  return mockStorage;
}

/**
 * Clean up after tests
 */
export function cleanupMockLocalStorage(): void {
  global.localStorage.clear();
}

/**
 * Create a mock date that returns a fixed timestamp
 */
export function mockDate(isoString: string): void {
  const mockDate = new Date(isoString);
  vi.spyOn(global, 'Date').mockImplementation(() => mockDate as any);
}

/**
 * Restore the original Date implementation
 */
export function restoreDate(): void {
  vi.restoreAllMocks();
}

/**
 * Generate a unique ID for testing
 */
export function generateTestId(prefix: string = 'test'): string {
  return `${prefix}-${Math.random().toString(36).substring(2, 11)}`;
}

/**
 * Wait for a specified number of milliseconds
 */
export function wait(ms: number): Promise<void> {
  return new Promise(resolve => setTimeout(resolve, ms));
}

/**
 * Create a spy function that tracks calls
 */
export function createSpy<T extends (...args: any[]) => any>(): T & { calls: any[][] } {
  const calls: any[][] = [];
  const spy = ((...args: any[]) => {
    calls.push(args);
  }) as any;
  spy.calls = calls;
  return spy;
}

/**
 * Assert that a value is defined (not null or undefined)
 */
export function assertDefined<T>(value: T | null | undefined, message?: string): asserts value is T {
  if (value === null || value === undefined) {
    throw new Error(message || 'Expected value to be defined');
  }
}

/**
 * Deep clone an object using JSON serialization
 */
export function deepClone<T>(obj: T): T {
  return JSON.parse(JSON.stringify(obj));
}

/**
 * Compare two objects for deep equality
 */
export function deepEqual(a: any, b: any): boolean {
  return JSON.stringify(a) === JSON.stringify(b);
}

/**
 * Create a mock console that captures log messages
 */
export function mockConsole() {
  const logs: string[] = [];
  const warnings: string[] = [];
  const errors: string[] = [];

  const originalLog = console.log;
  const originalWarn = console.warn;
  const originalError = console.error;

  console.log = (...args: any[]) => {
    logs.push(args.map(String).join(' '));
  };

  console.warn = (...args: any[]) => {
    warnings.push(args.map(String).join(' '));
  };

  console.error = (...args: any[]) => {
    errors.push(args.map(String).join(' '));
  };

  return {
    logs,
    warnings,
    errors,
    restore: () => {
      console.log = originalLog;
      console.warn = originalWarn;
      console.error = originalError;
    },
  };
}
