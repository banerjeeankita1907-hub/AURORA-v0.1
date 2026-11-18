import { verifyInflationaryMonotoneUpdates } from "./algebra.js";

function powerset(items) {
  let subsets = [[]];
  for (const item of items) {
    subsets = subsets.concat(subsets.map((subset) => [...subset, item]));
  }
  return subsets.map((subset) => subset.sort());
}

function union(a, b) {
  return [...new Set([...a, ...b])].sort();
}

export function createGSet(universe) {
  const items = [...new Set(universe)].sort();
  const elements = powerset(items);
  const updates = items.map((item) => (state) => union(state, [item]));
  return {
    name: "G-Set",
    universe: items,
    elements,
    bottom: [],
    join: union,
    updates,
    verify: () => verifyInflationaryMonotoneUpdates({
      elements,
      bottom: [],
      join: union,
      updates,
    }),
  };
}

function cartesianVectors(width, maximum) {
  let vectors = [[]];
  for (let index = 0; index < width; index += 1) {
    const next = [];
    for (const prefix of vectors) {
      for (let value = 0; value <= maximum; value += 1) next.push([...prefix, value]);
    }
    vectors = next;
  }
  return vectors;
}

function pointwiseMax(a, b) {
  return a.map((value, index) => Math.max(value, b[index]));
}

export function createBoundedGCounter({ replicas = 2, maximum = 2 } = {}) {
  if (!Number.isSafeInteger(replicas) || replicas < 1 || replicas > 4) {
    throw new RangeError("replicas must be an integer from 1 through 4");
  }
  if (!Number.isSafeInteger(maximum) || maximum < 1 || maximum > 4) {
    throw new RangeError("maximum must be an integer from 1 through 4");
  }
  const elements = cartesianVectors(replicas, maximum);
  const updates = Array.from({ length: replicas }, (_, owner) => (state) =>
    state.map((value, index) => index === owner ? Math.min(maximum, value + 1) : value)
  );
  return {
    name: "Bounded G-Counter abstraction",
    replicas,
    maximum,
    elements,
    bottom: Array(replicas).fill(0),
    join: pointwiseMax,
    updates,
    verify: () => verifyInflationaryMonotoneUpdates({
      elements,
      bottom: Array(replicas).fill(0),
      join: pointwiseMax,
      updates,
    }),
  };
}
