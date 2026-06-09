# Fix: State Handling Issue

## The Problem

The component keeps **two lists** (`transactions` and `filteredTransactions`) in sync by hand. The second isn't needed, it can be **derived** from `transactions` + the search term. Storing it separately lets the two **drift out of sync**: on load both point to the _same_ array, and any new feature (sorting, pagination) can forget to update the filtered copy, so the UI no longer matches the real data.

## The Fix

Keep **one source of truth** and **derive** the filtered view instead of storing it.

1. `transactionService.getTransactions()` is the only data source; its result is stored once in a single `transactions` array (loaded in `ngOnInit`).
2. Each keystroke pushes into a Subject (Observable) `search$`, making the term a stream.
3. A single derived stream, `filteredTransactions$`, filters that one `transactions` array by the current term and is rendered via the `async` pipe, with no stored filtered property.

There is only ever **one stored list**, so a separate filtered copy **can never drift** out of sync. (The filtered view is recomputed from `transactions` each time the search term changes.)
