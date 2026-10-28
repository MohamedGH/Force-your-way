/**
 * Functional Programming Core Utilities
 * Pure functions, Result/Either type, pipe, and composition helpers.
 */

export type Result<T, E = Error> =
  | { success: true; data: T; error?: never }
  | { success: false; error: E; data?: never };

export const ok = <T>(data: T): Result<T, never> => ({
  success: true,
  data,
});

export const err = <E = Error>(error: E): Result<never, E> => ({
  success: false,
  error,
});

export const isOk = <T, E>(result: Result<T, E>): result is { success: true; data: T } =>
  result.success;

export const isErr = <T, E>(result: Result<T, E>): result is { success: false; error: E } =>
  !result.success;

export const mapResult =
  <T, U, E>(fn: (val: T) => U) =>
  (result: Result<T, E>): Result<U, E> => {
    if (result.success) {
      return ok(fn(result.data));
    }
    return result;
  };

export const flatMapResult =
  <T, U, E>(fn: (val: T) => Result<U, E>) =>
  (result: Result<T, E>): Result<U, E> => {
    if (result.success) {
      return fn(result.data);
    }
    return result;
  };

export const getOrElse =
  <T, E>(defaultValue: T) =>
  (result: Result<T, E>): T =>
    result.success ? result.data : defaultValue;

export const pipe = <T>(input: T, ...fns: Array<(arg: any) => any>): any =>
  fns.reduce((acc, fn) => fn(acc), input);

export const clamp =
  (min: number, max: number) =>
  (val: number): number =>
    Math.max(min, Math.min(max, val));

export const roundTo =
  (decimals: number) =>
  (val: number): number => {
    const factor = Math.pow(10, decimals);
    return Math.round(val * factor) / factor;
  };
