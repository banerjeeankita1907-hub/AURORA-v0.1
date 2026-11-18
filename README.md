# AURORA — Algebraic CRDT Verification Lab

[![CI](https://github.com/banerjeeankita1907-hub/AURORA-v0.1/actions/workflows/ci.yml/badge.svg)](https://github.com/banerjeeankita1907-hub/AURORA-v0.1/actions/workflows/ci.yml)

**A finite, exhaustive verifier for the algebraic conditions behind state-based
conflict-free replicated data types (CRDTs).**

AURORA checks whether a finite merge operation forms a join-semilattice and
whether supplied state updates are inflationary and monotone. It returns a
specific counterexample when a law fails. It includes G-Set and bounded
G-Counter instances, plus a deliberately invalid merge as a negative control.

> This is a research-oriented verification prototype, not a Turing-Award-level
> result and not a new CRDT convergence theorem. It operationalizes established
> algebraic conditions over finite carriers and documents precisely what that
> finite verification does and does not prove.

## Quick start

Requires Node.js 20 or newer. There are no runtime dependencies.

    npm ci
    npm test
    npm run check
    npm run experiments

## What is checked

For a carrier L, merge join, and optional bottom, AURORA checks:

- closure of merge over the supplied finite carrier;
- idempotence, commutativity and associativity;
- reflexivity, antisymmetry and transitivity of the induced order;
- the bottom identity when a bottom element is supplied;
- closure, inflationarity and monotonicity of each state update.

The induced order is a <= b exactly when a join b = b. The verifier uses
exhaustive enumeration, not sampled tests. Violations return the law name and
a concrete witness.

## Included models

| Model | Carrier | Join | Updates |
|---|---|---|---|
| G-Set | Powerset of a finite universe | Set union | Insert one element |
| Bounded G-Counter | Vectors in {0,...,b}^r | Pointwise maximum | Increment one replica component, saturating at b |

The bounded counter is explicitly a finite abstraction of the usual
unbounded natural-number G-Counter.

## Mathematical argument

Read the algebraic foundations and convergence argument in
docs/algebraic-foundations.md. It defines the checked laws and gives the
conditional convergence argument for state-based replication under strong
eventual dissemination.

## Experimental record

See docs/experimental-design.md and the reproducible JSON emitted by
npm run experiments. Experiments report exact carrier and operation counts;
they deliberately make no wall-clock speedup claim.

## Repository layout

    src/algebra.js       Finite semilattice and update-law verifier
    src/crdts.js         G-Set and bounded G-Counter models
    src/experiment.js    Deterministic experiment runner
    tests/               Positive cases and law-specific negative controls
    docs/                Algebraic argument, experimental design and limits

## Scope and limitations

AURORA checks only the supplied finite carrier and supplied functions. It
cannot infer whether a state encoding matches an application's intended
semantics, prove arbitrary infinite-domain behavior, or guarantee a network
will eventually deliver messages. It does not model operation-based CRDTs,
causal broadcast, partitions, crashes, liveness, or Byzantine adversaries.

The verifier is intended to make assumptions visible, not replace formal
proofs for a production system.

## License

MIT.
