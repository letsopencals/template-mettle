'use client';

import { useMemo } from 'react';
import Link from 'next/link';
import useSWR from 'swr';
import { useSession } from 'next-auth/react';
import type { OrderDetailResponse } from '@opencals/storefront-sdk';
import { fetcher } from '@/lib/fetcher';
import { formatPrice } from '@/lib/format';
import { toBookingView, type BookingView } from '@/lib/booking-view';
import { buttonClasses } from '@/components/ui/button';
import { BibPage } from '@/components/bib/bib-page';

function viewsOf(order: OrderDetailResponse | undefined): BookingView[] {
	return (order?.lineItems ?? [])
		.map((li) => li.appointment)
		.filter((a) => a != null)
		.map((a) => toBookingView(a as Parameters<typeof toBookingView>[0]))
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

	if (status === 'loading' || isLoading) {
		return <div className="rubber-texture min-h-[70vh]" aria-busy="true" />;
	}
	if (status !== 'authenticated') {
		const back = orderId ? `/thank-you?orderId=${encodeURIComponent(orderId)}` : '/account';
		return (
			<section className="rubber-texture text-chalk">
				<div className="container-x py-20">
					<h1 className="display display-xl">You&rsquo;re in.</h1>
					<p className="mt-4 max-w-xl text-chalk/75">Your places are booked and the confirmation email is on its way. To see your bib here, move or cancel a session, sign in with the email you booked with. We send a 6-digit code, no password.</p>
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
	return <BibPage orderName={order?.name ?? null} name={name} email={order?.customerEmail ?? order?.customer?.email ?? null} views={views} total={order ? formatPrice(order.total, order.paymentCurrencyCode) : null} />;
}
