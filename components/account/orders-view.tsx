'use client';

import { useState } from 'react';
import Link from 'next/link';
import useSWR from 'swr';
import type { OrderListItemResponse, OrderListResponse, OrderListTransaction } from '@opencals/storefront-sdk';
import { fetcher } from '@/lib/fetcher';
import { formatPrice } from '@/lib/format';
import { dayLabel } from '@/lib/when';
import { AccountError, AccountLoading } from '@/components/account/states';

const DUE_BY_PROVIDER: Partial<Record<OrderListTransaction['provider'], string>> = {
	cash: 'Pay at the desk',
	bank_transfer: 'Awaiting transfer',
	stripe_invoice: 'Invoice due',
};

/** The payment word on an order line. Never blank: an unknown status reads as "Payment due". */
export function paymentLabel(o: Pick<OrderListItemResponse, 'isFullyPaid' | 'paymentStatus'> & { transactions?: ReadonlyArray<Pick<OrderListTransaction, 'provider'>> | null }): string {
	if (o.paymentStatus === 'voided') return 'Cancelled, not charged';
	if (o.isFullyPaid || o.paymentStatus === 'paid') return 'Paid';
	if (o.paymentStatus === 'partially-paid') return 'Part paid';
	const provider = o.transactions?.find((t) => t.provider)?.provider;
	return (provider && DUE_BY_PROVIDER[provider]) || 'Payment due';
}

/** Every order, newest first, as ruled log lines. */
export function OrdersView() {
	const [page, setPage] = useState(1);
	const { data, error, isLoading, mutate } = useSWR<OrderListResponse>(`/api/account/orders?take=15&page=${page}`, fetcher, { revalidateOnFocus: false, keepPreviousData: true });
	const orders = data?.data ?? [];
	if (error && !data) return <AccountError what="your orders" onRetry={() => void mutate()} />;
	if (isLoading && !data) return <AccountLoading label="Loading orders" />;
	if (!orders.length)
		return (
			<p className="text-muted">
				No orders yet.{' '}
				<Link href="/schedule" className="underline underline-offset-4">
					See the Floor
				</Link>
			</p>
		);
	return (
		<>
			<ul className="border-t-2 border-ink">
				{orders.map((o) => {
					const first = o.lineItems[0]?.appointment?.product?.title ?? 'Booking';
					const more = o.lineItems.length - 1;
					return (
						<li key={o.id} className="border-b border-chalk-line">
							<Link href={`/account/orders/${o.id}`} className="grid grid-cols-[6rem_minmax(0,1fr)_auto] items-baseline gap-4 py-3.5 hover:bg-chalk-2 sm:px-2">
								<span className="mono text-sm text-muted">{o.name}</span>
								<span className="min-w-0">
									<span className="block truncate font-semibold">
										{first}
										{more > 0 ? <span className="font-normal text-muted"> + {more} more</span> : null}
									</span>
									<span className="mono text-xs text-muted">
										{dayLabel(o.createdAt)} · {paymentLabel(o)}
									</span>
								</span>
								<span className="mono">{formatPrice(o.total, o.paymentCurrencyCode)}</span>
							</Link>
						</li>
					);
				})}
			</ul>
			<nav aria-label="Order pages" className="mt-5 flex justify-between text-sm">
				<button type="button" disabled={!data?.meta.hasPreviousPage} onClick={() => setPage((p) => p - 1)} className="underline underline-offset-4 disabled:opacity-30">
					← Newer
				</button>
				<span className="mono text-muted">Page {page}</span>
				<button type="button" disabled={!data?.meta.hasNextPage} onClick={() => setPage((p) => p + 1)} className="underline underline-offset-4 disabled:opacity-30">
					Older →
				</button>
			</nav>
		</>
	);
}
