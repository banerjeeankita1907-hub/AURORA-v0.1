# Algebraic foundations and convergence argument

## 1. Join-semilattices

A join-semilattice is a partially ordered set (L, <=) in which every pair
x,y has a least upper bound, written x join y. The join operation satisfies:

- Idempotence: x join x = x.
- Commutativity: x join y = y join x.
- Associativity: (x join y) join z = x join (y join z).

The induced order is x <= y exactly when x join y = y. If a least element
bottom is supplied, bottom join x = x for every x in L.

AURORA checks operation closure before the three join laws. It then checks
reflexivity, antisymmetry and transitivity of the induced relation, and the
bottom law when requested. This redundancy gives a direct witness for a
violated order property rather than relying only on the algebraic implication.

## 2. Monotone, inflationary updates

A state-based update u:L->L is inflationary when x <= u(x), and monotone when
x <= y implies u(x) <= u(y).

Inflationarity prevents an update from retracting information already held
by a replica. Monotonicity ensures that adding information to an input state
cannot make the updated result smaller in the semilattice order.

For a finite carrier, AURORA evaluates every update at every state and checks
every ordered pair x <= y. It rejects outputs outside the carrier.

## 3. State-based convergence argument

Consider replicas whose states lie in a join-semilattice (L, join). A
receive/merge event replaces replica state x with x join y, where y is a
received state. Local updates are inflationary and monotone. Assume:

1. only finitely many local update events occur in the execution prefix;
2. every generated state is eventually disseminated to every replica
   (strong eventual dissemination);
3. replicas continue processing delivered states and do not discard state;
4. all replicas use the same join operation over the same semilattice.

Let S be the set of all generated states, including initial states and
post-update states. Define J as the join of every state in S.

**Claim.** Once dissemination is complete, every replica state equals J.

**Argument.**

- A merge is a join, so it incorporates information from both operands.
- Idempotence means receiving the same state repeatedly has no additional
  effect.
- Commutativity means changing message order does not change the result of
  merging a fixed set of states.
- Associativity means changing message grouping or batching does not change
  the result.
- Inflationary updates do not remove information already present locally.
- Under strong eventual dissemination, every replica eventually incorporates
  every generated state. Its final state is therefore the least upper bound
  of S, namely J.

Thus all replicas converge to the same least upper bound. Monotonicity ensures
the update functions respect the semilattice information order; it is checked
as part of the state-based CRDT contract.

This is a conditional convergence result. It assumes eventual dissemination
and a common correct algebra. It does not guarantee message delivery,
termination of the network, availability, or application-level invariants.

## 4. What AURORA verifies

For a supplied finite carrier Lf, join implementation, bottom element, and
finite list of update functions, AURORA exhaustively checks the identities
and inequalities for every element or tuple in Lf. If a law fails, it returns
the first concrete witness encountered.

This is executable finite-instance verification, not a proof for an
unbounded carrier. A bounded G-Counter is a finite abstraction whose local
increment saturates at the configured maximum. The mathematical G-Counter
normally uses unbounded natural-number components; the finite experiment
cannot establish all natural-number instances.

A successful result means the supplied implementation satisfies the checked
laws on the supplied finite carrier. It does not prove that the implementation
models the intended application semantics or that a deployment meets its
network assumptions.

## 5. References

- M. Shapiro, N. Preguiça, C. Baquero and M. Zawirski. A Comprehensive Study
  of Convergent and Commutative Replicated Data Types. INRIA Research Report
  RR-7506 (2011). https://hal.inria.fr/inria-00555588.
- P. A. Bernstein, V. Hadzilacos and N. Goodman. Concurrency Control and
  Recovery in Database Systems. Addison-Wesley (1987).
- M. Herlihy and N. Shavit. The Art of Multiprocessor Programming.
  Revised Reprint, Morgan Kaufmann (2012).

AURORA implements a small finite verifier for established state-based CRDT
conditions. It does not claim a new convergence theorem or CRDT construction.
