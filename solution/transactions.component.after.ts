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
		<div *ngFor="let t of filteredTransactions$ | async; trackBy: trackById">
			{{ t.category }} - {{ t.amount | currency }}
		</div>
	`,
})
export class TransactionsComponent implements OnInit {
	private transactionService = inject(TransactionService);
	private search$ = new Subject<string>();
	private transactions: Transaction[] = [];

	filteredTransactions$ = this.search$.pipe(
		debounceTime(250),
		startWith(""),
		map((term) => {
			const q = term.toLowerCase();
			return this.transactions.filter((t) =>
				(t.category ?? "").toLowerCase().includes(q),
			);
		}),
	);

	ngOnInit(): void {
		this.transactionService.getTransactions().subscribe((data) => {
			this.transactions = data;
		});
	}

	onSearch(event: Event): void {
		this.search$.next((event.target as HTMLInputElement).value);
	}

	trackById(_index: number, t: Transaction): string | number {
		return t.id;
	}
}
