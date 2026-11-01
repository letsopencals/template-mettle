import type {
	AppointmentStatusType,
	CheckoutErrorCode,
	CheckoutErrorResponse,
	CustomerProviderCatalogItem,
	PaymentInstructions,
	PaymentProviderName,
	StorefrontAppointmentPendingReason,
} from '@opencals/storefront-sdk';

/**
 * What the checkout needs to know after a request: the API's error `code`
 * (409 CART_ALREADY_CHECKED_OUT / CART_EXPIRED / CHECKOUT_IN_PROGRESS, 402
 * PAYMENT_NOT_AUTHORIZED), plus the `orderId` / `paymentStatus` the API sends
 * with some of them. Also the hand-off from submit to /thank-you, and the
 * booking status the bib and the log print. Pure, apart from sessionStorage.
 */

export class CheckoutRequestError extends Error {
	constructor(
		message: string,
		readonly status: number,
		readonly code: CheckoutErrorCode | null,
		readonly orderId: NonNullable<CheckoutErrorResponse['orderId']> | null,
		readonly paymentStatus: NonNullable<CheckoutErrorResponse['paymentStatus']> | null,
	) {
		super(message);
		this.name = 'CheckoutRequestError';
	}
}

/** A failed `/api/checkout/*` response body: `error` is the message, the rest is the API's checkout error body. */
type CheckoutErrorBody = { error?: string } & Partial<CheckoutErrorResponse>;

/** A non-empty string field, else null (the body is parsed JSON, so check at runtime). */
const str = <T extends string>(v: T | null | undefined): T | null => (typeof v === 'string' && v ? v : null);

/** Turns a failed `/api/checkout/*` response into a CheckoutRequestError (never throws on a non-JSON body). */
export async function checkoutError(res: Response, fallback: string): Promise<CheckoutRequestError> {
	let body: CheckoutErrorBody = {};
	try {
		const parsed: unknown = await res.json();
		if (parsed && typeof parsed === 'object') body = parsed as CheckoutErrorBody;
	} catch {
		// Not JSON (a proxy error page): keep the fallback message.
	}
	return new CheckoutRequestError(str(body.error) ?? fallback, res.status, str(body.code), str(body.orderId), str(body.paymentStatus));
}

export type CheckoutMode = CustomerProviderCatalogItem['checkoutMode'];

/**
 * How a provider checks out. Card (`internal`) mounts Stripe, `redirect` leaves
 * the site, `manual` (desk, transfer, invoice) and `none` (nothing to pay)
 * place the order straight away. The backend can swap in
 * `no_payment_required` at start, so that name always means `none`.
 */
export function checkoutModeOf(providerName: PaymentProviderName | null, providers: ReadonlyArray<Pick<CustomerProviderCatalogItem, 'name' | 'checkoutMode'>>): CheckoutMode {
	if (providerName === 'no_payment_required') return 'none';
	const mode = providers.find((p) => p.name === providerName)?.checkoutMode;
	if (mode === 'internal' || mode === 'redirect' || mode === 'manual' || mode === 'none') return mode;
	return providerName === 'stripe' ? 'internal' : 'manual';
}

// ── Submit → /thank-you hand-off ────────────────────────────────────────────

const HANDOFF_PREFIX = 'mettle:paid-how:';

export function savePaymentInstructions(orderId: string, instructions: PaymentInstructions | null | undefined): void {
	if (!orderId || !instructions) return;
	try {
		sessionStorage.setItem(HANDOFF_PREFIX + orderId, JSON.stringify(instructions));
	} catch {
		// Private mode or storage full: the page falls back to "check your email".
	}
}

export function loadPaymentInstructions(orderId: string | null): PaymentInstructions | null {
	if (!orderId) return null;
	try {
		const raw = sessionStorage.getItem(HANDOFF_PREFIX + orderId);
		const parsed: unknown = raw ? JSON.parse(raw) : null;
		return parsed && typeof parsed === 'object' && typeof (parsed as PaymentInstructions).provider === 'string' ? (parsed as PaymentInstructions) : null;
	} catch {
		return null;
	}
}

/** A hosted invoice link is only ever followed when it is https. */
export function safeInvoiceUrl(url: string | null | undefined): string | null {
	return typeof url === 'string' && url.startsWith('https://') ? url : null;
}

// ── Booking status ──────────────────────────────────────────────────────────

export type Awaiting = StorefrontAppointmentPendingReason | null;

/**
 * Waiting only when the booking is `pending` AND the API says why. Right after
 * submit an automatically confirmed booking is briefly `pending` with no
 * reason while a background job confirms it: that one counts as confirmed.
 */
export function awaitingOf(status: AppointmentStatusType | null | undefined, pendingReason: StorefrontAppointmentPendingReason | null | undefined): Awaiting {
	if (status !== 'pending' || !pendingReason) return null;
	if (pendingReason === 'awaiting_payment' || pendingReason === 'awaiting_approval') return pendingReason;
	return null;
}

/** The wait to headline for an order: payment first (the customer can act on it), then the club's approval. */
export function orderAwaiting(list: ReadonlyArray<Awaiting>): Awaiting {
	if (list.includes('awaiting_payment')) return 'awaiting_payment';
	if (list.includes('awaiting_approval')) return 'awaiting_approval';
	return null;
}

/** Short mono tag for a waiting booking in the log and on its detail page. */
export const AWAITING_TAG: Record<StorefrontAppointmentPendingReason, string> = {
	awaiting_payment: 'AWAITING PAYMENT',
	awaiting_approval: 'AWAITING CONFIRMATION',
};
