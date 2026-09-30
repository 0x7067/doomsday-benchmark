import { test } from "node:test";
import assert from "node:assert/strict";
import { getRemaining, RELEASE_AT } from "../src/countdown.ts";

test("release is exactly midnight Eastern, after daylight saving ends", () => {
  assert.equal(new Date(RELEASE_AT).toISOString(), "2026-11-05T05:00:00.000Z");
});
test("remaining duration includes all four units", () => {
  const remaining = getRemaining(
    RELEASE_AT - (37 * 86400 + 11 * 3600 + 10 * 60 + 5) * 1000,
  );
  assert.equal(remaining.duration, "P37DT11H10M5S");
  assert.deepEqual(remaining.values, [37, 11, 10, 5]);
});
test("final ten seconds tick through zero and stay there", () => {
  for (let seconds = 10; seconds >= -3; seconds--) {
    const result = getRemaining(RELEASE_AT - seconds * 1000);
    assert.equal(result.total, Math.max(0, seconds));
    assert.equal(result.duration, seconds > 0 ? `P0DT0H0M${seconds}S` : "PT0S");
  }
});
test("partial seconds do not announce release early", () => {
  assert.equal(getRemaining(RELEASE_AT - 1).total, 1);
  assert.equal(getRemaining(RELEASE_AT).total, 0);
});
test("units carry correctly across a day boundary", () => {
  assert.deepEqual(getRemaining(RELEASE_AT - 86400000).values, [1, 0, 0, 0]);
  assert.deepEqual(getRemaining(RELEASE_AT - 86399000).values, [0, 23, 59, 59]);
});
