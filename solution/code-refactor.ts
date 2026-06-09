import { Component, inject } from "@angular/core";
import { combineLatest, Subject } from "rxjs";
import { debounceTime, map, startWith } from "rxjs/operators";
import { TransactionService } from "./transaction.service";

interface Transaction {
	id: string | number;
	amount: number;
	category: string | null;
}

@Component({
	selector: "app-transactions",
	template: `
		<input (input)="onSearch($event)" placeholder="Search" />

		<!-- trackBy gives rows stable identity so filtering doesn't rebuild the whole list -->
		<div *ngFor="let t of filteredTransactions$ | async; trackBy: trackById">
			{{ t.category }} - {{ t.amount | currency }}
		</div>
	`,
})
export class TransactionsComponent {
	private transactionService = inject(TransactionService);

	private search$ = new Subject<string>();

	// Single derived stream: re-filters whenever the data or the (debounced)
	// search term changes. AsyncPipe subscribes/unsubscribes for us, so there's
	// no manual subscription, no DestroyRef, and no ngOnInit needed.
	filteredTransactions$ = combineLatest([
		this.transactionService.getTransactions(),
		this.search$.pipe(debounceTime(250), startWith("")),
	]).pipe(
		map(([transactions, term]: [Transaction[], string]) => {
			const q = term.toLowerCase();
			return transactions.filter((t) =>
				(t.category ?? "").toLowerCase().includes(q),
			);
		}),
	);

	onSearch(event: Event): void {
		this.search$.next((event.target as HTMLInputElement).value);
	}

	trackById(_index: number, t: Transaction): string | number {
		return t.id;
	}
}
