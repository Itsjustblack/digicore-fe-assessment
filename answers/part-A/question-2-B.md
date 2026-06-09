# Fix: Subscription Issue

## The Problem

The component calls `.subscribe()` in `ngOnInit` but never keeps a reference, so it can't be cancelled. Each navigation opens a new subscription, and with no `.unsubscribe()` they pile up and **leak memory**. If the observable keeps emitting, destroyed components still run their handlers off-screen.

Usually HTTP observables only emit one value and complete on their own, so the leak wouldn't show in practice. But I can't tell what `getTransactions()` returns from the snippet, so I have to assume it isn't an HTTP observable.

## The Fix

Expose the filtered list as `filteredTransactions$` and render it through the template's **`async` pipe**, which subscribes and **unsubscribes automatically** on destroy, so the rendered stream needs no manual cleanup.

Data is still loaded with a single manual `.subscribe()` in `ngOnInit`. That call is a one-shot HTTP request that emits once and **completes on its own**, so its subscription tears down without an `ngOnDestroy`. If `getTransactions()` were instead a long-lived stream, this subscription would leak and should be guarded with `takeUntilDestroyed()` (or unsubscribed in `ngOnDestroy`).
