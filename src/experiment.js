import { verifyJoinSemilattice } from "./algebra.js";
import { createBoundedGCounter, createGSet } from "./crdts.js";

export function runExperiments() {
  const gset = [];
  for (let size = 1; size <= 5; size += 1) {
    const model = createGSet(Array.from({ length: size }, (_, i) => String.fromCharCode(97 + i)));
    const report = model.verify();
    if (report.status !== "valid") throw new Error("G-Set failed finite algebra verification");
    gset.push({
      universeSize: size,
      carrierSize: report.carrierSize,
      expectedCarrierSize: 2 ** size,
      checks: report.checks,
      result: report.status,
    });
  }

  const gcounter = [];
  for (let replicas = 1; replicas <= 4; replicas += 1) {
    const model = createBoundedGCounter({ replicas, maximum: 2 });
    const report = model.verify();
    if (report.status !== "valid") throw new Error("bounded G-Counter failed finite algebra verification");
    gcounter.push({
      replicas,
      perReplicaBound: 2,
      carrierSize: report.carrierSize,
      expectedCarrierSize: 3 ** replicas,
      updateFunctions: report.updateCount,
      checks: report.checks,
      result: report.status,
    });
  }

  const negativeControl = verifyJoinSemilattice({
    elements: [0, 1, 2],
    join: (a, b) => a,
  });
  if (negativeControl.status !== "invalid" || negativeControl.law !== "commutativity") {
    throw new Error("negative control was not rejected for non-commutativity");
  }

  return {
    title: "AURORA finite-state CRDT algebra experiments",
    method: "Exhaustive finite-carrier law checking; no random sampling",
    correctness: {
      allGSetInstancesVerified: gset.every((row) => row.result === "valid"
        && row.carrierSize === row.expectedCarrierSize),
      allGCounterInstancesVerified: gcounter.every((row) => row.result === "valid"
        && row.carrierSize === row.expectedCarrierSize),
      nonCommutativeNegativeControlRejected: true,
    },
    gset,
    gcounter,
    negativeControl: {
      result: negativeControl.status,
      rejectedLaw: negativeControl.law,
      counterexample: negativeControl.counterexample,
      checksBeforeFailure: negativeControl.checks,
    },
  };
}

if (process.argv[1] && import.meta.url.endsWith(process.argv[1].replaceAll("\\", "/"))) {
  process.stdout.write(JSON.stringify(runExperiments(), null, 2) + "\n");
}
