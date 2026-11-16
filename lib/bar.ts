import type { CartItem, CartItemAppointment, CartItemProduct } from '@opencals/storefront-sdk';
import { disciplineForSlug } from '@/lib/booking-meta';
import { plateFor, siteConfig, type Plate } from '@/lib/site-config';

/**
 * The Bar: the cart drawn as a loaded barbell. Pure helpers over the cart
 * response so the drawer, the header button, checkout and the Training Block
 * builder agree. Totals always come from the cart; the thresholds only drive
 * the "A$40 to Loaded" progress copy.
 */

type CartItemLike = Pick<CartItem, 'id' | 'originalSubtotal'> & {
	appointment?: (Partial<Pick<CartItemAppointment, 'from'>> & { product?: Partial<Pick<CartItemProduct, 'slug' | 'title'>> | null }) | null;
};

export interface BarPlate {
	/** Cart item id. */
	key: string;
	plate: Plate;
	discipline: string;
	label: string;
}

export function barPlates(items: readonly CartItemLike[] | null | undefined): BarPlate[] {
	return (items ?? [])
		.slice()
		.sort((a, b) => (a.appointment?.from ?? '').localeCompare(b.appointment?.from ?? ''))
		.map((it) => {
			const discipline = disciplineForSlug(it.appointment?.product?.slug);
			return { key: it.id, plate: plateFor(discipline), discipline, label: it.appointment?.product?.title ?? 'Session' };
		});
}

export interface Threshold {
	amount: number;
	percent: number;
	label: string;
}

export interface BarProgress {
	/** Pre-discount subtotal of the sessions (the discount engine's eligible subtotal). */
	loaded: number;
	reached: Threshold | null;
	next: Threshold | null;
	/** Amount still to add for `next` (0 when none). */
	toNext: number;
	/** 0–1 along the scale to the last threshold. */
	ratio: number;
}

export function barProgress(items: readonly CartItemLike[] | null | undefined, thresholds: readonly Threshold[] = siteConfig.blockThresholds): BarProgress {
	const loaded = Math.round((items ?? []).reduce((s, it) => s + (it.originalSubtotal ?? 0), 0) * 100) / 100;
	return progressFor(loaded, thresholds);
}

export function progressFor(loaded: number, thresholds: readonly Threshold[] = siteConfig.blockThresholds): BarProgress {
	const sorted = [...thresholds].sort((a, b) => a.amount - b.amount);
	const reached = [...sorted].reverse().find((t) => loaded >= t.amount) ?? null;
	const next = sorted.find((t) => loaded < t.amount) ?? null;
	const top = sorted[sorted.length - 1]?.amount ?? 1;
	return {
		loaded,
		reached,
		next,
		toNext: next ? Math.round((next.amount - loaded) * 100) / 100 : 0,
		ratio: Math.max(0, Math.min(1, loaded / (top * 1.1))),
	};
}

interface GrossLine {
	originalSubtotal: number;
	appointment?: { status?: string | null } | null;
	/** Cart lines carry `addOnItems`, order lines `addOnLineItems`. */
	addOnItems?: ReadonlyArray<{ originalSubtotal: number }> | null;
	addOnLineItems?: ReadonlyArray<{ originalSubtotal: number }> | null;
}

/**
 * Everything before offers, for a cart or an order. The API's `subtotal` is already net of discounts and has no
 * gross field, so this adds up each line's and add-on's `originalSubtotal` in whole cents, skipping cancelled
 * sessions as the order's own subtotal does.
 */
export function grossSubtotal(lines: readonly GrossLine[] | null | undefined): number {
	const cents = (lines ?? []).reduce((sum, line) => {
		if (line.appointment?.status === 'canceled') return sum;
		const addOns = (line.addOnItems ?? line.addOnLineItems ?? []).reduce((a, ao) => a + Math.round(ao.originalSubtotal * 100), 0);
		return sum + Math.round(line.originalSubtotal * 100) + addOns;
	}, 0);
	return cents / 100;
}

/** A session's price on the Bar and in an order: the session plus its add-ons, after offers. */
export function linePrice(line: { discountedTotal: number; addOnItems?: ReadonlyArray<{ discountedTotal: number }> | null; addOnLineItems?: ReadonlyArray<{ discountedTotal: number }> | null }): number {
	const cents = (line.addOnItems ?? line.addOnLineItems ?? []).reduce((a, ao) => a + Math.round(ao.discountedTotal * 100), Math.round(line.discountedTotal * 100));
	return cents / 100;
}
