# Fix: Subscription Issue

## The Problem

The component calls `.subscribe()` in `ngOnInit` but never keeps a reference to it, so it can't be cancelled. Every time the user navigates to this component a new subscription opens, and because nothing calls `.unsubscribe()`, they pile up in memory and leak. If the observable emits again (e.g. a polling stream), destroyed components still react to the values, which can trigger change detection on a component that's no longer on screen.

If `getTransactions()` wraps an `HttpClient` call the observable would complete on its own after one emission, so the leak wouldn't show in practice. But I can't tell that from the snippet alone, so the fix shouldn't rely on it.

---

## The Fix

Don't subscribe manually at all. Expose the data as an observable and let the template's `async` pipe own the subscription — it subscribes when the view renders and **unsubscribes automatically** when the component is destroyed. No `.subscribe()` in the class, no `Subscription` to track, no `ngOnDestroy`, and no `.unsubscribe()` call. The leak is removed by construction rather than by remembering to clean up.

If a case ever genuinely needs an imperative `.subscribe()` (e.g. firing a side effect rather than rendering a value), the modern idiomatic guard is `takeUntilDestroyed()`, which completes the stream when the component is destroyed. Used outside a field initializer or constructor it needs a captured `DestroyRef` passed in. But for simply rendering a value in the template, the `async` pipe is the cleaner answer and is what this solution uses.
