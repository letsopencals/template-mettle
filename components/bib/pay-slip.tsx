import type { PaymentInstructions } from '@opencals/storefront-sdk';
import { buttonClasses } from '@/components/ui/button';
import { safeInvoiceUrl } from '@/lib/checkout-outcome';

/** "Pay by" in the visitor's own timezone (the one place on the site that isn't Melbourne time). */
function dueLabel(iso: string | null | undefined): string | null {
	if (!iso) return null;
	const d = new Date(iso);
	if (Number.isNaN(d.getTime())) return null;
	return new Intl.DateTimeFormat('en-AU', { weekday: 'short', day: 'numeric', month: 'short', hour: '2-digit', minute: '2-digit', hourCycle: 'h23', timeZoneName: 'short' }).format(d);
}

function Row({ k, v }: { k: string; v: string | null | undefined }) {
	if (!v) return null;
	return (
		<div className="grid grid-cols-[8.5rem_minmax(0,1fr)] gap-3 border-b border-rubber-line py-2 last:border-0">
			<dt className="index-label text-chalk/50">{k}</dt>
			<dd className="mono break-all text-sm">{v}</dd>
		</div>
	);
}

/**
 * The pay slip on the bib page, on rubber: how to pay for an order placed with
 * a manual method (bank transfer, invoice, the desk). `instructions` is what
 * checkout submit returned; after a reload it's gone, and `emailFallback`
 * points to the confirmation email instead.
 */
export function PaySlip({ instructions, reference, emailFallback }: { instructions: PaymentInstructions | null; reference: string | null; emailFallback: boolean }) {
	if (!instructions) {
		if (!emailFallback) return null;
		return (
			<div className="mt-6 max-w-md border-l-4 border-plate-yellow bg-black/30 px-4 py-3 text-sm text-chalk/80">
				Still to pay. Check your email for the payment details{reference ? ` and quote ${reference}` : ''}.
			</div>
		);
	}

	const due = dueLabel(instructions.dueAt);
	const invoice = safeInvoiceUrl(instructions.hostedInvoiceUrl);
	const bank = instructions.bankDetails;
	const hasBank = Boolean(bank && (bank.accountName || bank.bankName || bank.iban || bank.swift));

	return (
		<div className="mt-6 max-w-md border border-rubber-line bg-black/30 p-4">
			<p className="index-label text-plate-yellow">Pay slip</p>
			{instructions.provider === 'stripe_invoice' ? (
				<>
					<p className="mt-2 text-chalk/80">Your invoice is ready. Pay it online, by card or bank, to lock the sessions in.</p>
					{invoice ? (
						<a href={invoice} target="_blank" rel="noopener noreferrer" className={buttonClasses({ variant: 'plate', className: 'mt-4' })}>
							Pay invoice
						</a>
					) : (
						<p className="mt-2 text-sm text-chalk/60">The link is on its way to your email.</p>
					)}
				</>
			) : instructions.provider === 'bank_transfer' ? (
				<>
					<p className="mt-2 text-chalk/80">Transfer the total to the account below. Use the reference so we can match it.</p>
					{hasBank ? (
						<dl className="mt-3">
							<Row k="Account name" v={bank?.accountName} />
							<Row k="Bank" v={bank?.bankName} />
							<Row k="IBAN / account" v={bank?.iban} />
							<Row k="SWIFT / BIC" v={bank?.swift} />
							<Row k="Reference" v={reference} />
						</dl>
					) : (
						<p className="mt-2 text-sm text-chalk/60">The bank details are in your confirmation email.</p>
					)}
				</>
			) : instructions.provider === 'cash' ? (
				<p className="mt-2 text-chalk/80">Pay at the desk when you arrive, by card or phone.</p>
			) : (
				<p className="mt-2 text-chalk/80">The payment details are in your confirmation email.</p>
			)}
			{due ? (
				<p className="mono mt-4 text-sm">
					<span className="text-chalk/50">PAY BY </span>
					{due}
				</p>
			) : null}
		</div>
	);
}
