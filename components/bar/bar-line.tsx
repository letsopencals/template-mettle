'use client';

import { clsx } from 'clsx';
import type { CartItem } from '@opencals/storefront-sdk';
import { Plate } from '@/components/brand/plate';
import { getBookingMeta } from '@/lib/booking-meta';
import { linePrice } from '@/lib/bar';
import { formatPrice } from '@/lib/format';
import { dayLabel, minutesLabel, timeLabel } from '@/lib/when';

/** One session on the bar: plate, what/when/where, extras, price, remove. */
export function BarLine({ item, currency, onRemove, removing, tone = 'chalk' }: { item: CartItem; currency: string; onRemove?: () => void; removing?: boolean; tone?: 'chalk' | 'rubber' }) {
	const appt = item.appointment;
	if (!appt) return null;
	const meta = getBookingMeta(appt);
	const muted = tone === 'chalk' ? 'text-muted' : 'text-chalk/60';
	return (
		<li className={clsx('flex gap-3 py-3.5', removing && 'opacity-40')}>
			<Plate plate={meta.plate} size="md" className="mt-0.5" />
			<div className="min-w-0 flex-1">
				<div className="flex items-start justify-between gap-3">
					<p className="font-semibold leading-tight">
						{meta.title}
						{meta.variant && meta.kindLabel !== 'Class' ? <span className={clsx('font-normal', muted)}> · {meta.variant}</span> : null}
					</p>
					<p className="mono shrink-0 text-sm">{formatPrice(linePrice(item), currency)}</p>
				</div>
				<p className={clsx('mono mt-1 text-[0.78rem]', muted)}>
					{dayLabel(appt.from)} · {timeLabel(appt.from)} · {minutesLabel(meta.minutes)}
				</p>
				<p className={clsx('mt-0.5 text-[0.8rem]', muted)}>
					{[meta.locationTitle?.replace(/^Mettle\s+\w+\s+·\s+/, ''), meta.coachFirstName ? `with ${meta.coachFirstName}` : null, meta.people > 1 ? `${meta.people} people` : null].filter(Boolean).join(' · ')}
				</p>
				{item.addOnItems?.length ? (
					<ul className={clsx('mt-1.5 space-y-0.5 text-[0.8rem]', muted)}>
						{item.addOnItems.map((a) => (
							<li key={a.id}>
								+ {a.addOn?.title}
								{a.quantity > 1 ? ` ×${a.quantity}` : ''}
							</li>
						))}
					</ul>
				) : null}
				{item.totalDiscount > 0 ? <p className="mono mt-1 text-[0.72rem] text-plate-green">{item.discounts?.[0]?.title ?? 'Offer'} · −{formatPrice(item.totalDiscount, currency)}</p> : null}
				{onRemove ? (
					<button type="button" onClick={onRemove} disabled={removing} className={clsx('mt-2 text-xs underline underline-offset-4', muted, 'hover:opacity-100')}>
						Take off the bar
					</button>
				) : null}
			</div>
		</li>
	);
}
