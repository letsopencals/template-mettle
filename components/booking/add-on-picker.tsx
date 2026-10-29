'use client';

import { clsx } from 'clsx';
import type { AddOnListItemResponse } from '@opencals/storefront-sdk';
import { formatPrice } from '@/lib/format';

/** Extras as plain rows: tick for single ones, − / + for those with a quantity. */
export function AddOnPicker({ addOns, picked, onChange, currency, tone = 'chalk', loading }: { addOns: AddOnListItemResponse[]; picked: Record<string, number>; onChange: (id: string, q: number) => void; currency: string; tone?: 'chalk' | 'rubber'; loading?: boolean }) {
	if (loading) return <p className="mono text-xs opacity-60">Loading extras…</p>;
	if (!addOns.length) return null;
	const line = tone === 'chalk' ? 'border-ink/10' : 'border-chalk/10';
	return (
		<ul className={clsx('divide-y border-y', line, tone === 'chalk' ? 'divide-ink/10' : 'divide-chalk/10')}>
			{addOns.map((a) => {
				const q = picked[a.id] ?? 0;
				const max = a.maxQuantity && a.maxQuantity > 0 ? a.maxQuantity : 1;
				return (
					<li key={a.id} className="flex items-center gap-3 py-2.5">
						{max === 1 ? (
							<input id={`addon-${a.id}`} type="checkbox" checked={q > 0} onChange={(e) => onChange(a.id, e.target.checked ? 1 : 0)} className="h-5 w-5 shrink-0 accent-[var(--color-plate-yellow)]" />
						) : (
							<span className="flex shrink-0 items-center">
								<button type="button" aria-label={`Fewer ${a.title}`} disabled={q === 0} onClick={() => onChange(a.id, q - 1)} className="h-8 w-8 border border-current/30 disabled:opacity-30">
									−
								</button>
								<span className="mono w-7 text-center text-sm">{q}</span>
								<button type="button" aria-label={`More ${a.title}`} disabled={q >= max} onClick={() => onChange(a.id, q + 1)} className="h-8 w-8 border border-current/30 disabled:opacity-30">
									+
								</button>
							</span>
						)}
						<label htmlFor={max === 1 ? `addon-${a.id}` : undefined} className="min-w-0 flex-1 cursor-pointer">
							<span className="block text-sm font-semibold leading-tight">{a.title}</span>
							{a.description ? <span className={clsx('line-clamp-1 text-xs', tone === 'chalk' ? 'text-muted' : 'text-chalk/60')}>{a.description}</span> : null}
						</label>
						<span className="mono shrink-0 text-sm">+{formatPrice(a.price, currency)}</span>
					</li>
				);
			})}
		</ul>
	);
}
