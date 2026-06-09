# Code Review: Issues That Could Break or Degrade Production

## 🔴 Bugs

1. **No transactionService injection**: The service is used but never injected, so the app crashes the moment the component loads.

2. **Unmanaged subscription**: The subscription is never cleaned up, so it leaks memory every time the user leaves and returns to the page.

3. **Unguarded `t.category` access**: If a transaction has no category, the filter crashes and the whole list breaks.

4. **Missing OnInit implementation**: `ngOnInit` exists but the class doesn't `implement OnInit`, so a typo in the name fails silently and no data loads.

5. **Shared array reference**: Both lists point to the same array, so changing one accidentally changes the other.

6. **Case-sensitive search**: Searching "food" won't find "Food", so search feels broken.

7. **Untyped event parameter**: The event is typed as `any`, so mistakes in the handler aren't caught until runtime.

8. **Untyped data models**: The lists are plain `[]` with no type, so bad API data goes unchecked.

9. **Unformatted amounts**: Money shows raw values like `19.9999999` instead of proper currency.

---

## 🟠 Performance Issues

1. **No source of truth**: The filtered list is rebuilt by hand, so it can easily fall out of sync with the real data.

2. **No search debounce**: The list is re-filtered on every keystroke, which lags on large datasets.

3. **No trackBy in ngFor**: Angular rebuilds every row on each change instead of reusing them, wasting work.
