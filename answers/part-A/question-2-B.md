# Fix: Subscription Issue

## The Problem

The component calls `.subscribe()` in `ngOnInit` but never keeps a reference, so it can't be cancelled. Each navigation opens a new subscription, and with no `.unsubscribe()` they pile up and **leak memory**. If the observable keeps emitting, destroyed components still run their handlers off-screen.

Usually HTTP observables only emit one value and complete on their own, so the leak wouldn't show in practice. But I can't tell what `getTransactions()` returns from the snippet, so I have to assume it isn't an HTTP observable.

## The Fix

Don't subscribe manually. Expose the data as an observable and let the template's **`async` pipe** own the subscription, it subscribes and **unsubscribes automatically** on destroy. No `.subscribe()`, no `Subscription` to track, no `ngOnDestroy`.
