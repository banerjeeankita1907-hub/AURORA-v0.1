# Exhaustive finite merge-table results

**Run provenance:** GitHub Actions, Node.js 22, 18 November 2026.
[Successful workflow run](https://github.com/banerjeeankita1907-hub/AURORA-v0.1/actions/runs/44330366519).

## Search definition

For a labelled carrier of size n, the experiment enumerates every binary
operation table whose diagonal is fixed (idempotence) and whose off-diagonal
entries are symmetric (commutativity). Each unordered pair independently
chooses one of n output elements, so the total number of candidates is

\[
n^{\binom{n}{2}}.
\]

All tables are closed by construction. The AURORA verifier then checks
associativity and the induced semilattice order. These are counts of labelled
tables; they are not counts modulo isomorphism.

## Results

| Carrier size | Candidate tables | Join-semilattices | Associativity failures | Other failures |
|---:|---:|---:|---:|---:|
| 2 | 2 | 2 | 0 | 0 |
| 3 | 27 | 9 | 18 | 0 |
| 4 | 4,096 | 76 | 4,020 | 0 |

The enumerator independently asserts the closed-form candidate count and
that the result categories exactly partition the search space. Since closure,
idempotence and commutativity are built into the construction, every rejected
candidate is expected to fail associativity; no other failure was observed.

For the labelled 3-element search, two thirds of the candidates fail
associativity. For the 4-element search, 4,020 of 4,096 candidates fail
(about 98.14%). These fractions describe only the deliberately restricted
space of labelled, commutative, idempotent operation tables.

## Smallest explicit counterexample

No counterexample exists on a 2-element carrier in this search. The first
counterexample appears at size 3. Its operation table is:

| join | 0 | 1 | 2 |
|---|---:|---:|---:|
| 0 | 0 | 0 | 1 |
| 1 | 0 | 1 | 0 |
| 2 | 1 | 0 | 2 |

The table is symmetric, so the operation is commutative. Its diagonal is
0, 1, 2, so it is idempotent. However, for (a,b,c)=(0,0,2):

\[
(0\sqcup 0)\sqcup 2 = 0\sqcup 2 = 1
\]

while

\[
0\sqcup(0\sqcup 2) = 0\sqcup 1 = 0.
\]

Thus associativity fails. AURORA's checker returns exactly this witness
(left result 1, right result 0).

## Interpretation

This finite enumeration makes a basic algebraic point executable: idempotence
and commutativity alone do not make a merge operation a join-semilattice;
associativity is an independent obligation. The result is an exact
classification within the enumerated small table spaces, not a new theorem
about arbitrary algebras, a count of semilattices up to isomorphism, or a
claim about the frequency of invalid CRDTs in deployed systems.

## Reproduction

Run:

    npm ci
    npm test
    npm run check
    npm run experiments
    npm run synthesize
