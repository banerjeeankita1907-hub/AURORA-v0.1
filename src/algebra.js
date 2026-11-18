function keyOf(value) {
  const seen = new Set();
  function normalize(item) {
    if (item === null || typeof item === "string" || typeof item === "boolean") return item;
    if (typeof item === "number" && Number.isFinite(item)) return item;
    if (!item || typeof item !== "object" || seen.has(item)) {
      throw new TypeError("carrier values must be finite, acyclic JSON values");
    }
    seen.add(item);
    let result;
    if (Array.isArray(item)) result = item.map(normalize);
    else {
      const prototype = Object.getPrototypeOf(item);
      if (prototype !== Object.prototype && prototype !== null) {
        throw new TypeError("carrier values must use plain objects and arrays");
      }
      result = {};
      for (const name of Object.keys(item).sort()) result[name] = normalize(item[name]);
    }
    seen.delete(item);
    return result;
  }
  return JSON.stringify(normalize(value));
}

function failure(law, values, observed, checks) {
  return {
    status: "invalid",
    law,
    checks,
    counterexample: { values, observed },
  };
}

export function verifyJoinSemilattice({ elements, join, bottom } = {}) {
  if (!Array.isArray(elements) || elements.length === 0) {
    throw new TypeError("elements must be a non-empty finite array");
  }
  if (typeof join !== "function") throw new TypeError("join must be a function");

  const carrier = new Map();
  for (const element of elements) {
    const key = keyOf(element);
    if (carrier.has(key)) throw new TypeError("carrier elements must be unique");
    carrier.set(key, element);
  }
  if (bottom !== undefined && !carrier.has(keyOf(bottom))) {
    return failure("bottom-in-carrier", [bottom], "bottom is not in the carrier", 0);
  }

  let checks = 0;
  function joined(a, b, law) {
    const value = join(a, b);
    const key = keyOf(value);
    checks += 1;
    if (!carrier.has(key)) {
      return { error: failure("closure", [a, b], value, checks) };
    }
    return { value: carrier.get(key), key };
  }

  const values = [...carrier.values()];
  for (const a of values) {
    const result = joined(a, a, "idempotence");
    if (result.error) return result.error;
    if (result.key !== keyOf(a)) return failure("idempotence", [a], result.value, checks);
  }

  for (const a of values) {
    for (const b of values) {
      const ab = joined(a, b, "commutativity");
      if (ab.error) return ab.error;
      const ba = joined(b, a, "commutativity");
      if (ba.error) return ba.error;
      if (ab.key !== ba.key) {
        return failure("commutativity", [a, b], { joinAB: ab.value, joinBA: ba.value }, checks);
      }
    }
  }

  for (const a of values) {
    for (const b of values) {
      const ab = joined(a, b, "associativity");
      if (ab.error) return ab.error;
      for (const c of values) {
        const left = joined(ab.value, c, "associativity");
        if (left.error) return left.error;
        const bc = joined(b, c, "associativity");
        if (bc.error) return bc.error;
        const right = joined(a, bc.value, "associativity");
        if (right.error) return right.error;
        if (left.key !== right.key) {
          return failure("associativity", [a, b, c], {
            left: left.value,
            right: right.value,
          }, checks);
        }
      }
    }
  }

  const leq = (a, b) => {
    const result = joined(a, b, "induced-order");
    if (result.error) throw new Error("closure was already verified");
    return result.key === keyOf(b);
  };

  for (const a of values) {
    checks += 1;
    if (!leq(a, a)) return failure("order-reflexivity", [a], false, checks);
  }
  for (const a of values) {
    for (const b of values) {
      if (leq(a, b) && leq(b, a)) {
        checks += 1;
        if (keyOf(a) !== keyOf(b)) {
          return failure("order-antisymmetry", [a, b], true, checks);
        }
      }
      for (const c of values) {
        if (leq(a, b) && leq(b, c)) {
          checks += 1;
          if (!leq(a, c)) return failure("order-transitivity", [a, b, c], false, checks);
        }
      }
    }
  }

  if (bottom !== undefined) {
    for (const a of values) {
      const result = joined(bottom, a, "bottom");
      if (result.error) return result.error;
      if (result.key !== keyOf(a)) return failure("bottom", [bottom, a], result.value, checks);
    }
  }

  return {
    status: "valid",
    carrierSize: values.length,
    checks,
    laws: [
      "closure",
      "idempotence",
      "commutativity",
      "associativity",
      "induced-order-reflexivity",
      "induced-order-antisymmetry",
      "induced-order-transitivity",
      ...(bottom === undefined ? [] : ["bottom-is-least-element"]),
    ],
    order: { leq },
  };
}

export function verifyInflationaryMonotoneUpdates({ elements, join, updates, bottom } = {}) {
  const lattice = verifyJoinSemilattice({ elements, join, bottom });
  if (lattice.status !== "valid") return { ...lattice, component: "join" };
  if (!Array.isArray(updates) || updates.some((update) => typeof update !== "function")) {
    throw new TypeError("updates must be an array of functions");
  }

  const keys = new Map(elements.map((value) => [keyOf(value), value]));
  const leq = lattice.order.leq;
  let checks = lattice.checks;
  for (let updateIndex = 0; updateIndex < updates.length; updateIndex += 1) {
    const update = updates[updateIndex];
    const outputs = new Map();
    for (const state of elements) {
      const output = update(state);
      const outputKey = keyOf(output);
      checks += 1;
      if (!keys.has(outputKey)) {
        return {
          ...failure("update-closure", [state], output, checks),
          component: "update",
          updateIndex,
        };
      }
      if (!leq(state, output)) {
        return {
          ...failure("inflationarity", [state], output, checks),
          component: "update",
          updateIndex,
        };
      }
      outputs.set(keyOf(state), keys.get(outputKey));
    }
    for (const a of elements) {
      for (const b of elements) {
        if (leq(a, b)) {
          checks += 1;
          if (!leq(outputs.get(keyOf(a)), outputs.get(keyOf(b)))) {
            return {
              ...failure("update-monotonicity", [a, b], {
                updateA: outputs.get(keyOf(a)),
                updateB: outputs.get(keyOf(b)),
              }, checks),
              component: "update",
              updateIndex,
            };
          }
        }
      }
    }
  }

  return {
    status: "valid",
    carrierSize: elements.length,
    updateCount: updates.length,
    checks,
    laws: [...lattice.laws, "update-inflationarity", "update-monotonicity"],
  };
}
