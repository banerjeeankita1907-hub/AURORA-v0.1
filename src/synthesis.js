import { verifyJoinSemilattice } from "./algebra.js";

/**
 * Enumerate every commutative, idempotent binary operation on {0,...,n-1}.
 * Diagonal entries are fixed to their input; each unordered off-diagonal
 * pair independently selects one carrier element.
 *
 * There are n^(n choose 2) such operations. This exact enumerator is capped
 * at n=4 so the search remains a small, transparent finite experiment.
 */
export function enumerateCommutativeIdempotentOperations(size) {
  if (!Number.isSafeInteger(size) || size < 1 || size > 4) {
    throw new RangeError("size must be an integer from 1 through 4");
  }
  const pairs = [];
  const table = Array.from({ length: size }, (_, row) =>
    Array.from({ length: size }, (_, column) => row === column ? row : -1)
  );
  for (let left = 0; left < size; left += 1) {
    for (let right = left + 1; right < size; right += 1) {
      pairs.push([left, right]);
    }
  }

  const operations = [];
  function assign(index) {
    if (index === pairs.length) {
      operations.push(table.map((row) => [...row]));
      return;
    }
    const [left, right] = pairs[index];
    for (let result = 0; result < size; result += 1) {
      table[left][right] = result;
      table[right][left] = result;
      assign(index + 1);
    }
  }
  assign(0);
  return operations;
}

export function analyzeFiniteMergeTables(size) {
  const operations = enumerateCommutativeIdempotentOperations(size);
  const elements = Array.from({ length: size }, (_, index) => index);
  let semilattices = 0;
  let associativityFailures = 0;
  let otherFailures = 0;
  let firstCounterexample = null;

  for (const table of operations) {
    const report = verifyJoinSemilattice({
      elements,
      join: (left, right) => table[left][right],
    });
    if (report.status === "valid") {
      semilattices += 1;
    } else if (report.law === "associativity") {
      associativityFailures += 1;
      if (firstCounterexample === null) {
        firstCounterexample = {
          table,
          witness: report.counterexample,
        };
      }
    } else {
      otherFailures += 1;
    }
  }

  const expected = size ** (size * (size - 1) / 2);
  if (operations.length !== expected) {
    throw new Error("enumerator count differs from n^(n choose 2)");
  }
  if (semilattices + associativityFailures + otherFailures !== operations.length) {
    throw new Error("enumeration categories do not partition the search space");
  }

  return {
    carrierSize: size,
    enumeratedOperations: operations.length,
    expectedOperations: expected,
    joinSemilattices: semilattices,
    failAssociativity: associativityFailures,
    failOtherLaws: otherFailures,
    firstAssociativityCounterexample: firstCounterexample,
  };
}

export function runSynthesisExperiments() {
  return {
    method: "Exact enumeration of all commutative, idempotent binary tables",
    results: [2, 3, 4].map(analyzeFiniteMergeTables),
  };
}

if (process.argv[1] && import.meta.url.endsWith(process.argv[1].replaceAll("\\", "/"))) {
  process.stdout.write(JSON.stringify(runSynthesisExperiments(), null, 2) + "\n");
}
