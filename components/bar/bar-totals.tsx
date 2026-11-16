'use client';

import { clsx } from 'clsx';
import type { CartResponse } from '@opencals/storefront-sdk';
import { formatPrice } from '@/lib/format';
import { codeState } from '@/lib/discount-state';
import { grossSubtotal } from '@/lib/bar';

/** The gross before offers, every applied offer, tax and the cart's total. */
export function BarTotals({ cart, currency, tone = 'chalk', className }: { cart: CartResponse; currency: string; tone?: 'chalk' | 'rubber'; className?: string }) {
	const state = codeState(cart);
	const discounts = cart.appliedDiscounts ?? [];
	const gross = grossSubtotal(cart.items);
	const saved = Math.max(0, Math.round((gross - cart.subtotal) * 100) / 100);
	return (
		<dl className={clsx('space-y-1.5 text-sm', className)}>
			<div className="flex justify-between gap-4">
				<dt className={tone === 'chalk' ? 'text-muted' : 'text-chalk/60'}>Sessions & extras</dt>
				<dd className="mono">{formatPrice(gross, currency)}</dd>
			</div>
			{discounts.map((d) => (
				<div key={d.id} className="flex justify-between gap-4">
					<dt className="flex items-center gap-2">
						<span aria-hidden className="h-2 w-2 shrink-0 bg-plate-yellow" />
						{d.title}
					</dt>
					<dd className="mono text-plate-green">−{formatPrice(d.totalAmount, currency)}</dd>
				</div>
			))}
			{!cart.taxesIncluded && cart.totalTax > 0 ? (
				<div className="flex justify-between gap-4">
					<dt className={tone === 'chalk' ? 'text-muted' : 'text-chalk/60'}>Tax</dt>
					<dd className="mono">{formatPrice(cart.totalTax, currency)}</dd>
				</div>
			) : null}
			{state.status === 'outranked' ? (
				<p className={clsx('text-xs', tone === 'chalk' ? 'text-muted' : 'text-chalk/60')}>
					{state.code} is on the order, but a better offer already applies. Offers don&rsquo;t stack: each session gets the biggest one.
				</p>
			) : null}
			<div className={clsx('flex items-baseline justify-between gap-4 border-t pt-2.5', tone === 'chalk' ? 'border-ink/15' : 'border-chalk/15')}>
				<dt className="font-semibold uppercase tracking-[0.06em]">Total</dt>
				<dd className="display text-[2rem]">{formatPrice(cart.total, currency)}</dd>
			</div>
			{saved > 0 ? <p className="mono text-right text-xs text-plate-green">You save {formatPrice(saved, currency)}</p> : null}
		</dl>
	);
}
