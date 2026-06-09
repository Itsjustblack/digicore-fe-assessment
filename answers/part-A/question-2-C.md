# Fix: Performance Issue

## The Problem

Two compounding problems.

**No debounce on the search input**: `onSearch` is bound to the `(input)` event, so it fires on every keystroke, each one synchronously running `Array.filter()` over the full transactions list on the main thread. Invisible for small datasets, but for a banking app with thousands of transactions it causes measurable lag and jank per keystroke.

**No `trackBy` in `*ngFor`**: Without `trackBy`, Angular has no stable identity for list items, so on every filter result it tears down and recreates the entire list of DOM nodes, even if only one item changed. This forces needless rerenders.

## The Fix

**Debounce**: instead of filtering in the `(input)` handler, push each keystroke into a `search$` `Subject`, and have the `filteredTransactions$` pipeline apply **`debounceTime(250)`** before the `map` that filters. The filter then runs only after the user pauses (~250ms), not per keystroke.

**`trackBy`**: add a `trackBy` function to the `*ngFor` returning a stable unique id (e.g. `t.id`). Angular compares items by that key and updates only the DOM nodes that actually changed.
