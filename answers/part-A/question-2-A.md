# Fix: State Handling Issue

## The Problem

The component keeps **two lists** (`transactions` and `filteredTransactions`) in sync by hand, but the second one isn't needed. It can simply be derived from `transactions` and the search term. Storing it separately means the two can drift out of sync. On load both point to the _same_ array, so changing one changes the other, and as features like sorting or pagination are added, it's easy to forget to update the filtered list, and then what the user sees no longer matches the real data.

---

## The Fix

Keep **one** source of truth and _derive_ the filtered view from it reactively, rather than storing a second array and keeping it in sync by hand.

1. The raw transactions come straight from `transactionService.getTransactions()` — that stream is the only source of data.
2. The search term is pushed into a `search$` `Subject` on each keystroke, so it too is a stream.
3. A single derived stream combines the transactions and the search term and emits the filtered list. The template renders it through the `async` pipe — there is no stored filtered list property at all.

The filtered view is recomputed whenever _either_ the data or the term changes, so the two can never drift out of sync — no matter how many filters or sorts are added later. An initial empty search term is seeded so the full list renders before the user types.
