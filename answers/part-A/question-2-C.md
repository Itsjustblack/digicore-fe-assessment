# Fix: Performance Issue

## The Problem

There are two compounding performance problems in this component.

**No debounce on the search input** — `onSearch` is bound directly to the `(input)` event, which fires on every single keystroke. Each keystroke synchronously runs `Array.filter()` over the full transactions list on the main thread. For small datasets this is invisible, but for a real banking app with hundreds or thousands of transactions, this causes measurable lag and jank with every key press — especially on lower-end devices.

**No `trackBy` in `*ngFor`** — Angular's `*ngFor` directive needs a way to identify which items in the list have changed between renders. Without `trackBy`, it has no identity for each item, so on every filter result change it tears down every existing DOM node and recreates the entire list from scratch — even if only one item changed, or most items are the same. This causes unnecessary reflows and repaints on every keystroke.

Together these mean that every single keystroke triggers both a full array scan and a full DOM rebuild simultaneously.

---

## The Fix

**For the debounce** — Rather than filtering directly in the `(input)` handler, each keystroke is pushed into a `search$` `Subject`, and the `filteredTransactions$` pipeline applies `debounceTime(250)` to that stream before the `map` that runs the filter. So the filter only runs after the user pauses typing (~250ms), not on every individual keystroke. (`startWith("")` seeds the stream so the unfiltered list still renders immediately on load.)

**For `trackBy`** — A `trackBy` function should be added to the `*ngFor` that returns a stable unique identifier for each transaction (e.g. `t.id`). Angular will then compare items by that key between renders and only update the DOM nodes that actually changed, leaving untouched nodes alone.
