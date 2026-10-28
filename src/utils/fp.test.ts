import test from 'node:test';
import assert from 'node:assert/strict';
import { ok, err, isOk, isErr, mapResult, flatMapResult, pipe, roundTo, clamp } from './fp';

test('FP: Result ok and err constructors', () => {
  const success = ok(42);
  const failure = err('Something failed');

  assert.equal(isOk(success), true);
  assert.equal(isErr(success), false);
  if (isOk(success)) {
    assert.equal(success.data, 42);
  }

  assert.equal(isOk(failure), false);
  assert.equal(isErr(failure), true);
  if (isErr(failure)) {
    assert.equal(failure.error, 'Something failed');
  }
});

test('FP: mapResult transforms successful values', () => {
  const double = (x: number) => x * 2;
  const res = pipe(ok(10), mapResult(double));
  assert.deepEqual(res, ok(20));

  const failedRes = pipe(err('error'), mapResult(double));
  assert.deepEqual(failedRes, err('error'));
});

test('FP: flatMapResult chains Result-returning functions', () => {
  const safeDivide = (n: number) => (n === 0 ? err('Division by zero') : ok(100 / n));
  const res1 = pipe(ok(4), flatMapResult(safeDivide));
  assert.deepEqual(res1, ok(25));

  const res2 = pipe(ok(0), flatMapResult(safeDivide));
  assert.deepEqual(res2, err('Division by zero'));
});

test('FP: pipe, clamp, and roundTo', () => {
  const rounded = pipe(3.14159, roundTo(2));
  assert.equal(rounded, 3.14);

  const clampedVal = pipe(15, clamp(0, 10));
  assert.equal(clampedVal, 10);
});
