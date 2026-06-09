# Fix: Template Issue

## The Problem

The template has two issues that affect correctness and user experience.

**`t.amount` rendered with no formatting** — The template outputs `{{ t.amount }}` raw. Financial amounts coming from an API are typically floating-point numbers (e.g. `1999.9999999`) and will render exactly as the raw value with no currency symbol, no thousands separator, and no controlled decimal places. For a transactions UI this is both visually incorrect and potentially misleading.

**Case-sensitive string matching in the search** — The filter uses `.includes(value)` with no case normalisation on either side. This means searching `"food"` will not match a transaction categorised as `"Food"` or `"FOOD"`. From the user's perspective the search is simply broken — they type a word they can see on screen and get no results back.

---

## The Fix

**For the amount** — Use Angular's built-in `currency` pipe in the template: `{{ t.amount | currency }}`. This automatically formats the value with the correct currency symbol, thousands separators, and two decimal places. The locale and currency code can be configured at the module level so it is consistent across the app without touching each template individually.

**For the case-sensitive search** — Before comparing, normalise both the transaction category and the search input to the same case (e.g. lowercase). This way `"food"`, `"Food"`, and `"FOOD"` all match the same transactions. The normalisation belongs in the filter logic, not the template, but it directly fixes what the user sees when interacting with the search field.
