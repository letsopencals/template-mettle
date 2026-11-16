import { describe, expect, it } from 'vitest';
import { barPlates, barProgress, grossSubtotal, linePrice, progressFor } from '@/lib/bar';

const item = (id: string, slug: string, subtotal: number, from = '2026-11-02T08:00:00Z') => ({ id, originalSubtotal: subtotal, appointment: { from, product: { slug, title: slug } } });

describe('the Bar', () => {
	it('loads one plate per session, in start order, coloured by discipline', () => {
		const plates = barPlates([item('b', 'contrast-suite', 35, '2026-11-03T08:00:00Z'), item('a', 'bag-rounds-collingwood-ruby', 28), item('c', 'pt-head', 180, '2026-11-04T08:00:00Z')]);
		expect(plates.map((p) => [p.key, p.plate])).toEqual([
			['a', 'blue'],
			['b', 'white'],
			['c', 'black'],
		]);
	});

	it('tracks progress to the Training Block thresholds', () => {
		expect(progressFor(0)).toMatchObject({ reached: null, next: { amount: 150 }, toNext: 150 });
		expect(progressFor(149.5)).toMatchObject({ reached: null, toNext: 0.5 });
		expect(progressFor(150)).toMatchObject({ reached: { amount: 150, percent: 10 }, next: { amount: 300 }, toNext: 150 });
		expect(progressFor(320)).toMatchObject({ reached: { amount: 300 }, next: null, toNext: 0 });
		expect(barProgress([item('a', 'barbell-club-collingwood-jo', 32), item('b', 'pt-coach', 110)]).loaded).toBe(142);
	});
});

describe('Bar money', () => {
	const cartLine = { originalSubtotal: 30, discountedSubtotal: 22.5, addOnItems: [{ originalSubtotal: 15, discountedSubtotal: 15 }] };

	it('rebuilds the gross before offers from the lines, in whole cents', () => {
		const pt = { originalSubtotal: 110, discountedSubtotal: 110 };
		expect(grossSubtotal([cartLine, pt])).toBe(155);
		expect(grossSubtotal([{ originalSubtotal: 0.1 }, { originalSubtotal: 0.2 }])).toBe(0.3);
	});

	it('reads order lines (addOnLineItems) and skips cancelled sessions', () => {
		const order = [
			{ originalSubtotal: 50, appointment: { status: 'scheduled' }, addOnLineItems: [{ originalSubtotal: 9 }] },
			{ originalSubtotal: 50, appointment: { status: 'canceled' }, addOnLineItems: [] },
		];
		expect(grossSubtotal(order)).toBe(59);
	});

	it('prices a line as its session plus add-ons, after offers and before tax', () => {
		expect(linePrice(cartLine)).toBe(37.5);
		expect(linePrice({ discountedSubtotal: 100, addOnLineItems: [{ discountedSubtotal: 9.99 }] })).toBe(109.99);
	});
});
