# Fix: Unaddressed Breaking Bugs & Structural Issues

---

## Bug 1 — `transactionService` Never Injected

### The Problem

The component calls `this.transactionService.getTransactions()` in `ngOnInit`, but `transactionService` is never declared or injected. Angular's dependency injection system has no knowledge of it, so accessing `this.transactionService` throws a runtime error immediately on load — the component crashes before rendering anything.

### The Fix

Declare the service as a private constructor parameter. Angular's DI will resolve and inject the instance automatically:

```ts
constructor(private transactionService: TransactionService) {}
```

---

## Bug 2 — `t.category` Accessed Without a Null Guard

### The Problem

The filter calls `t.category.includes(value)` with no guard on `t.category`. If any transaction object has a `null`, `undefined`, or missing `category` field — which is realistic in real API data — calling `.includes()` on it throws a `TypeError` and crashes the entire filter, breaking the UI for all transactions.

### The Fix

Use optional chaining combined with a nullish coalescing fallback so that a missing category is treated as an empty string rather than an error:

```ts
(t.category ?? '').toLowerCase().includes(value.toLowerCase())
```

This means transactions with no category are simply excluded from search results rather than causing a crash.

---

## Bug 3 — Class Does Not `implement OnInit`

### The Problem

The class defines `ngOnInit` but does not declare `implements OnInit` on the class signature. TypeScript therefore does not enforce that the method matches the `OnInit` interface contract. If `ngOnInit` is accidentally misspelled or renamed (e.g. `ngOnint`), TypeScript will not flag it and Angular will silently skip the lifecycle hook — the component loads with no data and no error.

### The Fix

Add `implements OnInit` to the class declaration:

```ts
export class TransactionsComponent implements OnInit {
```

TypeScript will now raise a compile-time error if `ngOnInit` is missing or has the wrong signature, making the contract explicit and enforced.

---

## Bug 4 — Arrays Typed as Plain `[]` With No Interface

### The Problem

Both `transactions` and `filteredTransactions` are typed as `[]` (an empty tuple type), which gives TypeScript no information about the shape of the objects inside. Accessing `t.amount`, `t.category`, or any other field gets no type checking, no autocomplete, and no protection against malformed API responses. A field rename or API schema change will not surface as a compile error anywhere in the component.

### The Fix

Define a `Transaction` interface that matches the API shape and use it to type both arrays:

```ts
interface Transaction {
  id: string | number;
  amount: number;
  category: string | null;
  // ...other fields
}

transactions: Transaction[] = [];
```

All field accesses are now verified at compile time, and the null on `category` is explicitly modelled — which also makes the null guard from Bug 2 above a required part of the type contract rather than a guess.

---

## Bug 5 — `event: any` on `onSearch`

### The Problem

The `onSearch` handler types its parameter as `any`, which disables all TypeScript checks on the event object. Accessing `event.target.value` cannot be verified at compile time — a typo, a missing `.target`, or a future refactor that changes how the value is read will produce no warning. Using `any` is also contagious: any value derived from it inherits the `any` type and propagates the loss of safety downstream.

### The Fix

Type the parameter as the standard `Event` interface and cast `.target` to `HTMLInputElement`, which is the concrete DOM type for an `<input>` element:

```ts
onSearch(event: Event): void {
  const value = (event.target as HTMLInputElement).value;
  // ...
}
```

The cast is necessary because the DOM's `EventTarget` interface does not expose `.value` directly — it covers all possible event targets. The cast is safe here because we know the event comes from an `<input>` element in the template.
