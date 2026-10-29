'use client';

import { useMemo, useState } from 'react';
import Link from 'next/link';
import type { CartItem } from '@opencals/storefront-sdk';
import { useCart } from '@/contexts/cart-context';
import { useBarUi } from '@/contexts/bar-ui-context';
import { useSettings } from '@/contexts/settings-context';
import { Overlay, CloseButton } from '@/components/ui/overlay';
import { buttonClasses } from '@/components/ui/button';
import { Barbell } from '@/components/bar/barbell';
import { BarLine } from '@/components/bar/bar-line';
import { BarTotals } from '@/components/bar/bar-totals';
import { PromoCode } from '@/components/bar/promo-code';
import { HoldTimer } from '@/components/bar/hold-timer';
import { BarNudge } from '@/components/bar/bar-nudge';
import { barPlates, barProgress } from '@/lib/bar';

/** The Bar drawer: the loaded barbell, each session, the offers and Checkout. */
export function BarDrawer() {
	const { open, setOpen } = useBarUi();
	const { cart, removeItem, timeRemaining, extendCart } = useCart();
	const { currency } = useSettings();
	const [removing, setRemoving] = useState<string | null>(null);
	const items = useMemo(() => ((cart?.items ?? []) as CartItem[]).slice().sort((a, b) => (a.appointment?.from ?? '').localeCompare(b.appointment?.from ?? '')), [cart?.items]);
	const plates = useMemo(() => barPlates(items), [items]);
	const progress = useMemo(() => barProgress(items), [items]);
	const close = () => setOpen(false);

	return (
		<Overlay open={open} onClose={close} kind="drawer" label="The Bar" tone="chalk">
			<div className="rubber-texture px-5 pb-4 pt-3 text-chalk">
				<div className="flex items-center justify-between">
					<p className="display text-3xl">The Bar</p>
					<CloseButton onClick={close} tone="rubber" />
				</div>
				<Barbell plates={plates} progress={progress} currency={currency} size="sm" tone="rubber" className="mt-2" />
				<BarNudge progress={progress} currency={currency} tone="rubber" className="mt-1" />
			</div>
			<HoldTimer seconds={items.length ? timeRemaining : null} onExtend={extendCart} />
			<div className="flex-1 overflow-y-auto px-5">
				{items.length === 0 ? (
					<div className="py-10">
						<p className="display text-2xl">Nothing on the bar yet</p>
						<p className="mt-2 text-muted">Pick a class on the Floor, book a coach, or load a whole Training Block in one go.</p>
						<div className="mt-6 flex flex-wrap gap-2">
							<Link href="/schedule" onClick={close} className={buttonClasses({ variant: 'primary' })}>
								The Floor
							</Link>
							<Link href="/blocks" onClick={close} className={buttonClasses({ variant: 'outline' })}>
								Training Blocks
							</Link>
						</div>
					</div>
				) : (
					<ul className="divide-y divide-ink/10">
						{items.map((it) => (
							<BarLine
								key={it.id}
								item={it}
								currency={currency}
								removing={removing === it.id}
								onRemove={async () => {
									setRemoving(it.id);
									try {
										await removeItem(it.id);
									} finally {
										setRemoving(null);
									}
								}}
							/>
						))}
					</ul>
				)}
			</div>
			{cart && items.length ? (
				<div className="border-t border-ink/15 bg-chalk-3 px-5 pb-5 pt-4">
					<PromoCode className="mb-3" />
					<BarTotals cart={cart} currency={currency} />
					<Link href="/checkout" onClick={close} className={buttonClasses({ variant: 'primary', size: 'lg', fullWidth: true, className: 'mt-4' })}>
						Checkout · {items.length} {items.length === 1 ? 'session' : 'sessions'}
					</Link>
				</div>
			) : null}
		</Overlay>
	);
}
