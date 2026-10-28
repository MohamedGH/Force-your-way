import test from 'node:test';
import assert from 'node:assert/strict';
import { analyzeCongestion } from './traffic-analyzer';

test('Traffic Analyzer: Detects fluid conditions with low delay', () => {
  const result = analyzeCongestion(3600, 3700); // ~1.5 min delay
  assert.equal(result.level, 'FLUIDE');
  assert.equal(result.delayMinutes, 2);
  assert.ok(result.severityScore < 15);
});

test('Traffic Analyzer: Detects moderate traffic slowdown', () => {
  const result = analyzeCongestion(3600, 4200); // 10 min delay (16% increase)
  assert.equal(result.level, 'MODÉRÉ');
  assert.equal(result.delayMinutes, 10);
});

test('Traffic Analyzer: Detects severe gridlock/bouchon sévère', () => {
  const result = analyzeCongestion(1800, 3600); // Double duration (100% delay)
  assert.equal(result.level, 'BOUCHON SÉVÈRE');
  assert.equal(result.delayMinutes, 30);
  assert.ok(result.severityScore >= 80);
});
