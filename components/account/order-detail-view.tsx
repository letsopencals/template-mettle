'use client';

import Link from 'next/link';
import useSWR from 'swr';
import type { OrderDetailResponse } from '@opencals/storefront-sdk';
import { fetcher } from '@/lib/fetcher';
import { formatPrice } from '@/lib/format';
import { toBookingView } from '@/lib/booking-view';
import { dayLabel, timeLabel } from '@/lib/when';
import { Plate } from '@/components/brand/plate';
import { paymentLabel } from '@/components/account/orders-view';
import { AccountError, AccountLoading } from '@/components/account/states';

/** One order: its sessions and the totals. */
export function OrderDetailView({ id }: { id: string }) {
	const { data: o, error, isLoading, mutate } = useSWR<OrderDetailResponse>(`/api/account/orders/${encodeURIComponent(id)}`, fetcher, { revalidateOnFocus: false });
	if (error && !o) return <AccountError what="this order" onRetry={() => void mutate()} />;
	if (isLoading || !o) return <AccountLoading label="Loading the order" />;
	const cur = o.paymentCurrencyCode;
	return (
		<div className="max-w-3xl">
			<Link href="/account/orders" className="index-label text-muted hover:text-ink">
				← Orders
			</Link>
			<h1 className="display mt-3 text-6xl">{o.name}</h1>
			<p className="mono text-sm text-muted">
				{dayLabel(o.createdAt)} · {paymentLabel(o)}
			</p>
			<ul className="mt-6 border-t-2 border-ink">
				{o.lineItems.map((li) => {
					const v = li.appointment ? toBookingView(li.appointment) : null;
					return (
						<li key={li.appointmentId ?? li.createdAt} className="flex items-center gap-3 border-b border-chalk-line py-3">
							{v ? <Plate plate={v.plate} size="md" /> : null}
							<span className="min-w-0 flex-1">
								{v ? (
									<Link href={`/account/appointments/${v.id}`} className="font-semibold hover:underline">
										{v.title}
									</Link>
								) : (
									'Session'
								)}
								{v ? (
									<span className="mono block text-xs text-muted">
										{dayLabel(v.start)} · {timeLabel(v.start)}
										{v.coachFirstName ? ` · ${v.coachFirstName}` : ''}
									</span>
								) : null}
							</span>
							<span className="mono">{formatPrice(li.discountedTotal, cur)}</span>
						</li>
					);
				})}
			</ul>
			<dl className="ml-auto mt-4 max-w-xs space-y-1 text-sm">
				<div className="flex justify-between">
					<dt className="text-muted">Subtotal</dt>
					<dd className="mono">{formatPrice(o.subtotal, cur)}</dd>
				</div>
				{o.subtotal > o.total ? (
					<div className="flex justify-between">
						<dt className="text-muted">Offers</dt>
						<dd className="mono text-plate-green">−{formatPrice(o.subtotal - o.total, cur)}</dd>
					</div>
				) : null}
				<div className="flex justify-between border-t border-ink/15 pt-2">
					<dt className="font-semibold uppercase">Total</dt>
					<dd className="display text-3xl">{formatPrice(o.total, cur)}</dd>
				</div>
			</dl>
		</div>
	);
}
