# Experimental design

## Research question

For finite instances of state-based replicated data types, can an exhaustive
algebraic checker distinguish valid join/update structures from deliberately
broken structures, and what is the state-space cost of checking representative
G-Set and bounded G-Counter instances?

## Hypotheses

- H1: Set union over a finite powerset is a join-semilattice with the empty set
  as bottom; element-addition updates are inflationary and monotone.
- H2: Pointwise maximum over bounded replica-counter vectors is a
  join-semilattice; a local saturating increment is inflationary and monotone.
- H3: A deliberately non-commutative idempotent merge is rejected with a
  concrete witness.

These are implementation checks of known mathematical structures, not novel
claims about CRDT theory.

## Methods

The verifier enumerates the carrier and performs exhaustive checks. For a
carrier with n elements, closure, idempotence and commutativity require
O(n^2) operation evaluations, associativity requires O(n^3), and the explicit
induced-order checks require O(n^3) relation checks. Update verification also
checks each update on all n states and all comparable pairs, hence O(k n^2)
comparisons for k update functions, ignoring representation and comparison
costs.

The experiments are deterministic and use no random sampling, external
dataset, network calls, or wall-clock-performance claim.

### G-Set family

For a universe U of size m, the carrier is its powerset and has 2^m states.
Join is set union and bottom is the empty set. There is one update per universe
element; each update inserts that element.

### Bounded G-Counter family

For r replicas and component bound b=2, the carrier is {0,1,2}^r, with 3^r
vectors. Join is componentwise maximum. Each local update increments only its
owner's component and saturates at b. This is explicitly a finite abstraction
of the unbounded natural-number G-Counter.

### Negative control

The left-projection operation a join b = a is idempotent but not commutative.
The verifier must reject it for commutativity and produce a pair of carrier
values witnessing the asymmetry.

## Reproducibility

From the repository root, run:

    npm ci
    npm test
    npm run check
    npm run experiments

GitHub Actions runs the same test and experiment commands on Node.js 20 and
22. The JSON output contains carrier sizes, exact expected carrier sizes,
number of checks, outcomes and negative-control evidence.

## Interpretation limits

- Carrier sizes are finite and intentionally small.
- The bounded counter's saturation changes the unbounded data type's behavior
  beyond its chosen bound.
- Exhaustive finite verification cannot establish arbitrary infinite-domain
  properties unless a separate abstraction theorem is supplied.
- No network scheduler, packet loss, partitions, or replica crash model is
  simulated here.
- Operation-based CRDTs and causal delivery conditions are outside this
  project's current model.
- The experiment reports operation counts, not elapsed-time speedups.


## Exhaustive small-algebra search

A second experiment enumerates every commutative, idempotent binary operation
on a labelled carrier of size n. Idempotence fixes each diagonal table entry
to its row index. Commutativity means a single choice is made for every
unordered off-diagonal pair. There are exactly

    n ^ (n * (n - 1) / 2)

such tables. The experiment enumerates all candidates for n = 2, 3 and 4,
then invokes the same verifier used by the CRDT examples. Since closure,
idempotence and commutativity are guaranteed by construction, every rejected
table must fail associativity. The enumerator asserts that its operation count
matches the closed-form count and that the outcome categories partition the
complete search space.

This is an exhaustive finite classification of these labelled binary tables
at the selected sizes. It is not a classification of all semilattices up to
isomorphism and is not a new algebraic theorem. Its purpose is to make the
logical independence of the axioms executable and to provide minimal
counterexamples to implementations that check only idempotence and
commutativity.

Run the experiment with:

    npm run synthesize

The output records the number of candidate operations, the number accepted as
join-semilattices, the number rejected for associativity, and a concrete
associativity witness from the first rejected table.
