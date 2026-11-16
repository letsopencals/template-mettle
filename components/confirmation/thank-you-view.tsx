'use client';

import { useEffect, useMemo, useState } from 'react';
import Link from 'next/link';
import useSWR from 'swr';
import { useSession } from 'next-auth/react';
import type { OrderDetailResponse, PaymentInstructions, PaymentProviderName } from '@opencals/storefront-sdk';
import { fetcher } from '@/lib/fetcher';
import { formatPrice } from '@/lib/format';
import { toBookingView, type BookingView } from '@/lib/booking-view';
import { buttonClasses } from '@/components/ui/button';
import { BibPage } from '@/components/bib/bib-page';
import { PaySlip } from '@/components/bib/pay-slip';
import { awaitingOf, loadPaymentInstructions, orderAwaiting, type Awaiting } from '@/lib/checkout-outcome';

const MANUAL_PROVIDERS = new Set<PaymentProviderName>(['cash', 'bank_transfer', 'stripe_invoice']);

function awaitingOfOrder(order: OrderDetailResponse | undefined): Awaiting {
	return orderAwaiting((order?.lineItems ?? []).map((li) => (li.appointment ? awaitingOf(li.appointment.status, li.appointment.pendingReason) : null)));
}

/** Unpaid order on a manual method whose pay slip is gone (a reload): point to the email instead. */
function owesManually(order: OrderDetailResponse | undefined): boolean {
	if (!order || order.isFullyPaid || order.paymentStatus === 'paid' || order.paymentStatus === 'voided') return false;
	const provider = order.transactions?.[0]?.provider;
	return provider ? MANUAL_PROVIDERS.has(provider) && provider !== 'cash' : awaitingOfOrder(order) === 'awaiting_payment';
}

function viewsOf(order: OrderDetailResponse | undefined): BookingView[] {
	return (order?.lineItems ?? [])
		.map((li) => li.appointment)
		.filter((a) => a != null)
		.map((a) => toBookingView(a))
		.sort((a, b) => a.start - b.start);
}

/**
 * Confirmation. Checkout signs a trusted customer in (`auth` comes back only
 * for them); with a session we load the order and print the bib. Without one,
 * the booking is safe and a sign-in code brings the bib here.
 */
export function ThankYouView({ orderId }: { orderId: string | null }) {
	const { status } = useSession();
	const key = orderId && status === 'authenticated' ? `/api/account/orders/${encodeURIComponent(orderId)}` : null;
	const { data: order, error, isLoading, mutate } = useSWR<OrderDetailResponse>(key, fetcher, { revalidateOnFocus: false, errorRetryCount: 2 });
	const views = useMemo(() => viewsOf(order), [order]);
	// What checkout submit returned for this order (bank details, invoice link). Read after mount: sessionStorage.
	const [instructions, setInstructions] = useState<PaymentInstructions | null>(null);
	useEffect(() => setInstructions(loadPaymentInstructions(orderId)), [orderId]);

	if (status === 'loading' || isLoading) {
		return (
			<section className="rubber-texture min-h-[70vh] text-chalk" aria-busy="true" aria-label="Loading your booking">
				<div className="container-x py-16">
					<p className="mono text-[0.72rem] uppercase tracking-[0.2em] text-chalk/60">Booked · printing your bib</p>
					<div className="mt-6 h-24 w-2/3 max-w-xl animate-pulse bg-chalk/10" />
					<div className="mt-8 h-56 max-w-md animate-pulse bg-chalk/10" />
				</div>
			</section>
		);
	}
	if (status !== 'authenticated') {
		const back = orderId ? `/thank-you?orderId=${encodeURIComponent(orderId)}` : '/account';
		return (
			<section className="rubber-texture text-chalk">
				<div className="container-x py-20">
					<h1 className="display display-xl">{instructions && instructions.provider !== 'cash' ? 'Booking received.' : 'You’re in.'}</h1>
					<p className="mt-4 max-w-xl text-chalk/75">
						{instructions && instructions.provider !== 'cash' ? 'Your places are held and the details are on their way by email.' : 'Your places are booked and the confirmation email is on its way.'} To see your bib here, move or cancel a session, sign in with the email you booked with. We send a 6-digit code, no password.
					</p>
					<PaySlip instructions={instructions} reference={null} emailFallback={false} />
					<Link href={`/login?callbackUrl=${encodeURIComponent(back)}`} className={buttonClasses({ variant: 'plate', size: 'lg', className: 'mt-8' })}>
						Email me a code
					</Link>
				</div>
			</section>
		);
	}
	if (!views.length) {
		return (
			<section className="container-x py-20">
				<h1 className="display display-md">{error || !orderId ? 'Your booking is in. The bib didn’t load.' : 'Nothing to show for this order.'}</h1>
				<p className="mt-3 text-muted">Your confirmation email has the details, and your Training log has every session.</p>
				<button type="button" onClick={() => void mutate()} className="mt-4 underline underline-offset-4">
					Try again
				</button>
			</section>
		);
	}
	const name = [order?.customer?.firstName, order?.customer?.lastName].filter(Boolean).join(' ') || null;
	const orderName = order?.name ?? null;
	return (
		<BibPage
			orderName={orderName}
			name={name}
			email={order?.customerEmail ?? order?.customer?.email ?? null}
			views={views}
			total={order ? formatPrice(order.total, order.paymentCurrencyCode) : null}
			awaiting={awaitingOfOrder(order)}
			paySlip={<PaySlip instructions={instructions} reference={orderName} emailFallback={owesManually(order)} />}
		/>
	);
}
