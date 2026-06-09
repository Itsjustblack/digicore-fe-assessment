# Fix: Unaddressed Breaking Bugs & Structural Issues

---

## Bug 1: `transactionService` Never Injected

**Problem.** The component calls `this.transactionService.getTransactions()`, but the service is never injected. Angular's DI doesn't know it exists, so `this.transactionService` is undefined and calling a method on it throws a runtime error on load, crashing the component before it renders.

**Fix.** Obtain the service with the `inject()` function as a field initializer (`private transactionService = inject(TransactionService)`) so Angular's DI resolves it automatically. This is the modern idiomatic form and, unlike a constructor parameter, it's available in time for the `filteredTransactions$` field initializer that uses it.

---

## Bug 2: `t.category` Accessed Without a Null Guard

**Problem.** The filter calls `t.category.includes(value)` with no guard. If any transaction has a `null` or missing `category`, which is realistic in real API data, `.includes()` throws and crashes the whole filter.

**Fix.** Use optional chaining with a nullish fallback so a missing category becomes an empty string instead of an error. Such transactions are simply excluded from search rather than breaking it.

---

## Bug 3: Data Load Relied on a `ngOnInit` Hook With No `implements OnInit`

**Problem.** The original loaded data in an `ngOnInit` method, but the class didn't declare `implements OnInit`. TypeScript won't enforce the contract, so a misspelling (e.g. `ngOnint`) goes unflagged — Angular silently skips the hook and the component loads with no data and no error.

**Fix.** This solution removes the lifecycle hook entirely. Data loading lives in the `filteredTransactions$` field initializer and is consumed by the `async` pipe, so there is no `ngOnInit` to mistype or forget. The whole class of "hook silently not called" bug is designed out rather than guarded against. (If a lifecycle hook were still needed, declaring `implements OnInit` would be the fix so TypeScript checks the signature.)

---

## Bug 4: Arrays Typed as Plain `[]` With No Interface

**Problem.** The arrays were typed as `[]`, giving TypeScript no idea what's inside. Field accesses like `t.amount` get no checking and no autocomplete, and a schema change won't surface as a compile error.

**Fix.** Define a `Transaction` interface matching the API shape and type the stream with it — the `map` is annotated `([transactions, term]: [Transaction[], string])`, so every `t.amount` / `t.category` access inside the filter, and `trackById`'s parameter, are all checked at compile time. Modelling `category` as `string | null` makes the Bug 2 guard a required part of the contract rather than a guess.

---

## Bug 5: `event: any` on `onSearch`

**Problem.** Typing the parameter as `any` disables all checks on the event. `event.target.value` can't be verified, and `any` is contagious, so anything derived from it loses safety too.

**Fix.** Type the parameter as the standard `Event` and cast `.target` to `HTMLInputElement` before reading `.value`. The cast is needed because the DOM's generic `EventTarget` doesn't expose `.value`, and it's safe here since the event comes from an `<input>`.
