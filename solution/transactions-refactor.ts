// import { Component, DestroyRef, OnInit, inject } from "@angular/core";
// import { takeUntilDestroyed } from "@angular/core/rxjs-interop";
// import { Subject } from "rxjs";
// import { debounceTime } from "rxjs/operators";
// import { TransactionService } from "./transaction.service";

// fix-E4: explicit shape — plain [] gave no compile-time safety on field access
interface Transaction {
	id: string | number;
	amount: number;
	category: string | null;
}

@Component({
	selector: "app-transactions",
	template: `
		<input
			(input)="onSearch($event)"
			placeholder="Search"
		/>

		<!-- fix-C: trackBy gives each row a stable identity, preventing full DOM rebuild on filter -->
		<!-- fix-D: currency pipe adds symbol, thousands separator, and 2 decimal places -->
		<div *ngFor="let t of filteredTransactions; trackBy: trackById">
			{{ t.category }} - {{ t.amount | currency }}
		</div>
	`,
})
// fix-E3: implements OnInit — TypeScript now enforces the method signature at compile time
export class TransactionsComponent implements OnInit {
	// fix-E4: Transaction[] — field accesses on t are now type-checked
	transactions: Transaction[] = [];
	searchTerm = "";

	// fix-A: getter replaces the stored filteredTransactions array — derived on read,
	// never out of sync with transactions
	get filteredTransactions(): Transaction[] {
		const term = this.searchTerm.toLowerCase();
		return this.transactions.filter(
			// fix-E2: ?? '' — missing/null category resolves to '' instead of throwing TypeError
			(t) => (t.category ?? "").toLowerCase().includes(term),
		);
	}

	// fix-C: Subject + debounceTime — filter runs after typing pauses, not on every keystroke
	private search$ = new Subject<string>();

	// fix-B: DestroyRef passed to takeUntilDestroyed so subscriptions close on component destroy
	private destroyRef = inject(DestroyRef);

	// fix-E1: constructor injection — Angular DI can now resolve the service instance
	constructor(private transactionService: TransactionService) {}

	ngOnInit(): void {
		// fix-C: 250ms debounce before updating searchTerm (and triggering the getter)
		this.search$
			.pipe(debounceTime(250), takeUntilDestroyed(this.destroyRef))
			.subscribe((term: string) => (this.searchTerm = term));

		// fix-B: takeUntilDestroyed replaces manual unsubscribe — no ngOnDestroy needed
		this.transactionService
			.getTransactions()
			.pipe(takeUntilDestroyed(this.destroyRef))
			.subscribe((data: Transaction[]) => (this.transactions = data));
	}

	// fix-E5: Event instead of any — cast to HTMLInputElement makes .value type-safe
	onSearch(event: Event): void {
		this.search$.next((event.target as HTMLInputElement).value);
	}

	// fix-C: stable key for trackBy — Angular diffs by id, not by object reference
	trackById(_index: number, t: Transaction): string | number {
		return t.id;
	}
}
