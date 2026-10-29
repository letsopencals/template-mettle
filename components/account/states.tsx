export function AccountLoading({ label }: { label: string }) {
	return (
		<div aria-busy="true" aria-label={label} className="space-y-3 py-6">
			<div className="h-10 w-1/3 animate-pulse bg-chalk-2" />
			<div className="h-28 animate-pulse bg-chalk-2" />
			<div className="h-28 animate-pulse bg-chalk-2" />
		</div>
	);
}

export function AccountError({ what, onRetry }: { what: string; onRetry: () => void }) {
	return (
		<div className="border-l-4 border-plate-red bg-chalk-3 p-5">
			<p className="font-semibold">We couldn&rsquo;t load {what}.</p>
			<button type="button" onClick={onRetry} className="mt-2 text-sm underline underline-offset-4">
				Try again
			</button>
		</div>
	);
}
