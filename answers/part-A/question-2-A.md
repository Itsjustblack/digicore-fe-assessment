# Fix: State Handling Issue

## The Problem

The component keeps **two lists** (`transactions` and `filteredTransactions`) in sync by hand. The second isn't needed, it can be **derived** from `transactions` + the search term. Storing it separately lets the two **drift out of sync**: on load both point to the _same_ array, and any new feature (sorting, pagination) can forget to update the filtered copy, so the UI no longer matches the real data.

## The Fix

Keep **one source of truth** and **derive** the filtered view **reactively**.

1. `transactionService.getTransactions()` is the only data source.
2. Each keystroke pushes into a `search$` `Subject`, making the term a stream too.
3. A single derived stream **combines** data + term and emits the filtered list, rendered via the `async` pipe, with no stored filtered property.

The view recomputes whenever data _or_ term changes, so the two **can never drift**.
