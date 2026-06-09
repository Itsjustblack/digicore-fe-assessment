# Fix: Subscription Issue

## The Problem

The component calls `.subscribe()` in `ngOnInit` but never keeps a reference to it, so it can't be cancelled. Every time the user navigates to this component a new subscription opens, and because nothing calls `.unsubscribe()`, they pile up in memory and leak. If the observable emits again (e.g. a polling stream), destroyed components still react to the values, which can trigger change detection on a component that's no longer on screen.

If `getTransactions()` wraps an `HttpClient` call the observable would complete on its own after one emission, so the leak wouldn't show in practice. But I can't tell that from the snippet alone, so the fix shouldn't rely on it.

---

## The Fix

Pipe the observable through `takeUntilDestroyed()` before subscribing. Angular completes the observable when the component is destroyed, so the subscription is torn down for you. No `ngOnDestroy`, no manual `Subscription` tracking, and no `.unsubscribe()` call. This is the modern idiomatic approach (Angular 16+).

```ts
import { Component, OnInit, inject } from '@angular/core';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';

@Component({ /* ... */ })
export class TransactionsComponent implements OnInit {
  private transactionService = inject(TransactionService);
  // takeUntilDestroyed() needs the injection context, so capture it here
  private destroyRef = takeUntilDestroyed();

  ngOnInit(): void {
    this.transactionService
      .getTransactions()
      .pipe(this.destroyRef)
      .subscribe((data) => {
        this.transactions = data;
      });
  }
}
```

Note: `takeUntilDestroyed()` reads the current injection context, so when it's used outside a field initializer or constructor (e.g. inside `ngOnInit`) you must capture it as a field, as above, or pass an explicit `DestroyRef` via `takeUntilDestroyed(this.destroyRef)`.
