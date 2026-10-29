'use client';

import { useCallback, useState } from 'react';
import { useCart } from '@/contexts/cart-context';
import { useBarUi } from '@/contexts/bar-ui-context';
import { siteConfig } from '@/lib/site-config';

export interface LoadSlot {
	productId: string;
	/** UTC instants. */
	start: string | number;
	end: string | number;
	staffMemberId?: string | null;
	locationId?: string | null;
}

export interface LoadRequest {
	slot: LoadSlot;
	numberOfAttendees?: number;
	addOns?: Array<{ addOnId: string; quantity: number }>;
	/** Partner sessions: 2 people on one booking. */
	people?: number;
}

const utc = (v: string | number) => {
	const iso = new Date(v).toISOString();
	return { date: iso.slice(0, 10), time: iso.slice(11, 19) };
};

/** Turns an API error into one plain sentence. */
function message(status: number, body: { error?: string; message?: string } | null): string {
	const raw = body?.error || body?.message || '';
	if (status === 409 || /not available|maximum attendees|seats/i.test(raw)) return 'Someone just took that spot. Pick another time.';
	if (status === 429) return 'Too many requests at once. Give it a second and try again.';
	return raw || 'That didn’t load. Try again.';
}

/** POST one or more sessions to the cart (in order), then open the Bar so the plates rack on. */
export function useLoadBar() {
	const { cartId, setCart } = useCart();
	const { setOpen } = useBarUi();
	const [pending, setPending] = useState(false);
	const [error, setError] = useState<string | null>(null);

	const load = useCallback(
		async (requests: LoadRequest[], { openBar = true }: { openBar?: boolean } = {}): Promise<boolean> => {
			setPending(true);
			setError(null);
			let id = cartId;
			try {
				for (const r of requests) {
					const from = utc(r.slot.start);
					const to = utc(r.slot.end);
					const res = await fetch('/api/book', {
						method: 'POST',
						headers: { 'Content-Type': 'application/json', ...(id ? { 'X-Cart-Id': id } : {}) },
						body: JSON.stringify({
							slot: { productId: r.slot.productId, fromDate: from.date, fromTime: from.time, toDate: to.date, toTime: to.time, staffMemberId: r.slot.staffMemberId ?? null, locationId: r.slot.locationId ?? null },
							numberOfAttendees: r.numberOfAttendees ?? 1,
							addOns: r.addOns ?? [],
							...(r.people && r.people > 1 ? { people: r.people } : {}),
						}),
					});
					const body = await res.json().catch(() => null);
					if (!res.ok) {
						setError(message(res.status, body));
						return false;
					}
					if (body?.cart) {
						setCart(body.cart);
						id = body.cart.id;
					}
				}
				if (openBar) setOpen(true);
				return true;
			} catch {
				setError('No connection. Check your signal and try again.');
				return false;
			} finally {
				setPending(false);
			}
		},
		[cartId, setCart, setOpen],
	);

	return { load, pending, error, setError };
}

export const PEOPLE_KEY = siteConfig.customAttributeKeys.people;
