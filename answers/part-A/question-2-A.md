# Fix: State Handling Issue

## The Problem

The component keeps **two lists** (`transactions` and `filteredTransactions`) in sync by hand, but the second one isn't needed. It can simply be derived from `transactions` and the search term. Storing it separately means the two can drift out of sync. On load both point to the *same* array, so changing one changes the other, and as features like sorting or pagination are added, it's easy to forget to update the filtered list, and then what the user sees no longer matches the real data.

---

## The Fix

Keep **one** list as the truth, and *calculate* the filtered view from it whenever it's needed. Never store it separately.

1. Store the raw `transactions` from the API. This only changes when new data arrives.
2. Store the current `searchTerm` as a simple string, updated on each keystroke.
3. Replace the `filteredTransactions` property with a **getter** that filters `transactions` by `searchTerm` on the fly.

Now there's only one source of truth. The filtered list is always derived from it, so the two can never drift out of sync, no matter how many filters or sorts you add later.
