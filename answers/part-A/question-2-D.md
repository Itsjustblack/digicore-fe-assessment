# Fix: Template Issue

## The Problem

Two issues affecting correctness and UX.

1. **`t.amount` rendered with no formatting**: The template outputs `{{ t.amount }}` raw. API amounts are typically floating-point (e.g. `1999.9999999`) and render as-is, with no currency symbol, thousands separator, or fixed decimal places, visually incorrect and misleading.

2. **Case-sensitive search**: The filter uses `.includes(value)` with no case normalisation, so searching `"food"` won't match `"Food"` or `"FOOD"`.

## The Fix

**Amount**: Use Angular's built-in **`currency` pipe**, `{{ t.amount | currency }}`, which formats with the correct currency symbol, thousands separators, and two decimals.

**Search**: Normalise both the transaction category and the search input to the same case (e.g. lowercase) before comparing, so `"food"`, `"Food"`, and `"FOOD"` all match.
