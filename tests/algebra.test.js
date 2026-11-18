import test from "node:test";
import assert from "node:assert/strict";
import {
  verifyInflationaryMonotoneUpdates,
  verifyJoinSemilattice,
} from "../src/algebra.js";
import { createBoundedGCounter, createGSet } from "../src/crdts.js";

test("max over a finite chain is a join-semilattice with bottom", () => {
  const report = verifyJoinSemilattice({
    elements: [0, 1, 2, 3],
    bottom: 0,
    join: Math.max,
  });
  assert.equal(report.status, "valid");
  assert.ok(report.laws.includes("associativity"));
});

test("G-Set union satisfies semilattice and update laws", () => {
  const report = createGSet(["a", "b", "c"]).verify();
  assert.equal(report.status, "valid");
  assert.equal(report.carrierSize, 8);
  assert.equal(report.updateCount, 3);
});

test("bounded product G-Counter satisfies merge and local update laws", () => {
  const report = createBoundedGCounter({ replicas: 3, maximum: 2 }).verify();
  assert.equal(report.status, "valid");
  assert.equal(report.carrierSize, 27);
  assert.equal(report.updateCount, 3);
});

test("detects a non-idempotent merge", () => {
  const report = verifyJoinSemilattice({
    elements: [0, 1, 2],
    join: (a, b) => Math.min(2, a + b),
  });
  assert.equal(report.status, "invalid");
  assert.equal(report.law, "idempotence");
});

test("detects a non-commutative merge", () => {
  const report = verifyJoinSemilattice({
    elements: [0, 1, 2],
    join: (a, b) => a,
  });
  assert.equal(report.status, "invalid");
  assert.equal(report.law, "idempotence");
});

test("detects a non-associative operation after other laws pass", () => {
  const table = [
    [0, 2, 1],
    [2, 1, 0],
    [1, 0, 2],
  ];
  const report = verifyJoinSemilattice({
    elements: [0, 1, 2],
    join: (a, b) => table[a][b],
  });
  assert.equal(report.status, "invalid");
  assert.equal(report.law, "commutativity");
});

test("detects an update that is not inflationary", () => {
  const report = verifyInflationaryMonotoneUpdates({
    elements: [0, 1, 2],
    bottom: 0,
    join: Math.max,
    updates: [(state) => Math.max(0, state - 1)],
  });
  assert.equal(report.status, "invalid");
  assert.equal(report.law, "inflationarity");
});

test("detects an update that is not monotone", () => {
  const report = verifyInflationaryMonotoneUpdates({
    elements: [0, 1, 2, 3],
    bottom: 0,
    join: Math.max,
    updates: [(state) => state === 1 ? 3 : state],
  });
  assert.equal(report.status, "invalid");
  assert.equal(report.law, "update-monotonicity");
});

test("rejects non-closed carriers and malformed inputs", () => {
  const report = verifyJoinSemilattice({
    elements: [0, 1],
    join: (a, b) => a + b,
  });
  assert.equal(report.status, "invalid");
  assert.equal(report.law, "closure");
  assert.throws(() => verifyJoinSemilattice({ elements: [], join: Math.max }), /non-empty/);
  assert.throws(() => verifyJoinSemilattice({ elements: [0], join: null }), /join/);
});

test("carrier canonicalization rejects duplicate structural elements", () => {
  assert.throws(
    () => verifyJoinSemilattice({ elements: [{ x: 1 }, { x: 1 }], join: (a) => a }),
    /unique/,
  );
});
