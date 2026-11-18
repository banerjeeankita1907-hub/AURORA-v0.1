import test from "node:test";
import assert from "node:assert/strict";
import {
  analyzeFiniteMergeTables,
  enumerateCommutativeIdempotentOperations,
} from "../src/synthesis.js";

test("enumerator visits every commutative idempotent operation on two elements", () => {
  const operations = enumerateCommutativeIdempotentOperations(2);
  assert.equal(operations.length, 2);
  for (const table of operations) {
    assert.equal(table[0][0], 0);
    assert.equal(table[1][1], 1);
    assert.equal(table[0][1], table[1][0]);
  }
});

test("all two-element commutative idempotent operations are associative", () => {
  const result = analyzeFiniteMergeTables(2);
  assert.equal(result.enumeratedOperations, 2);
  assert.equal(result.joinSemilattices, 2);
  assert.equal(result.failAssociativity, 0);
  assert.equal(result.failOtherLaws, 0);
});

test("three-element exhaustive search finds non-associative counterexamples", () => {
  const result = analyzeFiniteMergeTables(3);
  assert.equal(result.enumeratedOperations, 27);
  assert.ok(result.joinSemilattices > 0);
  assert.ok(result.failAssociativity > 0);
  assert.equal(result.failOtherLaws, 0);
  assert.ok(result.firstAssociativityCounterexample);
});

test("four-element enumeration is complete and all candidates pass the first two laws", () => {
  const result = analyzeFiniteMergeTables(4);
  assert.equal(result.enumeratedOperations, 4096);
  assert.equal(result.expectedOperations, 4096);
  assert.equal(result.failOtherLaws, 0);
  assert.equal(
    result.joinSemilattices + result.failAssociativity,
    result.enumeratedOperations,
  );
});

test("search refuses state spaces beyond its documented exhaustive bound", () => {
  assert.throws(() => enumerateCommutativeIdempotentOperations(5), /1 through 4/);
});
