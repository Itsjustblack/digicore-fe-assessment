# Fix: Unaddressed Breaking Bugs & Structural Issues

## Bug 1: `transactionService` Never Injected

### Problem

The component calls `this.transactionService.getTransactions()`, but the service is never injected. DI doesn't know it exists, so `this.transactionService` is undefined and the call throws on load, crashing the component before it renders.

### Fix

Inject it with the `inject()` function as a field initializer (`private transactionService = inject(TransactionService)`).

## Bug 2: `t.category` Accessed Without a Null Guard

### Problem

The filter calls `t.category.includes(value)` with no guard. If a transaction has a `null` or missing `category` (realistic in real API data), `.includes()` throws and crashes the whole filter.

### Fix

Use optional chaining with a nullish fallback so a missing category becomes an empty string.

## Bug 3: `ngOnInit` Hook With No `implements OnInit`

### Problem

The original loaded data in `ngOnInit`, but the class didn't declare `implements OnInit`.

### Fix

Remove the lifecycle hook entirely. Data loading lives in the `filteredTransactions$` field initializer consumed by the `async` pipe, so there's no `ngOnInit` to mistype or forget, the bug is designed out.

## Bug 4: Arrays Typed as Plain `[]` With No Interface

### Problem

Arrays typed as `[]` give TypeScript no idea what's inside. Accesses like `t.amount` get no checking and no autocomplete.

### Fix

Define a `Transaction` interface matching the API shape and type the stream with it. The `map` is annotated `([transactions, term]: [Transaction[], string])`, so every `t.amount` / `t.category` access and `trackById`'s parameter are checked at compile time.

## Bug 5: `event: any` on `onSearch`

### Problem

Typing the parameter as `any` disables all checks. `event.target.value` can't be verified, and `any` is contagious, anything derived from it loses safety too.

### Fix

Type the parameter as the standard `Event` and cast `.target` to `HTMLInputElement` before reading `.value`.
