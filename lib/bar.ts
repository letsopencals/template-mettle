import { disciplineForSlug } from '@/lib/booking-meta';
import { plateFor, siteConfig, type Plate } from '@/lib/site-config';

/**
 * The Bar: the cart drawn as a loaded barbell. Pure helpers over the cart
 * response so the drawer, the header button, checkout and the Training Block
 * builder agree. Totals always come from the cart; the thresholds only drive
 * the "A$40 to Loaded" progress copy.
 */

interface CartItemLike {
	id: string;
	originalSubtotal: number;
	appointment?: { from?: string; product?: { slug?: string | null; title?: string | null } | null } | null;
}

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
