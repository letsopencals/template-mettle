import { describe, expect, it } from 'vitest';
import { axisFor, byHour, lanesFor, placeOn } from '@/lib/floor';
import type { Occurrence } from '@/lib/timetable';

const occ = (key: string, discipline: string, localTime: string, minutes: number, startIso: string): Occurrence =>
	({ key, discipline, localTime, minutes, start: startIso, end: new Date(Date.parse(startIso) + minutes * 60_000).toISOString() }) as Occurrence;

describe('the Floor', () => {
	const a = occ('a', 'strength', '06:00', 60, '2026-11-01T19:00:00Z');
	const b = occ('b', 'strength', '06:30', 45, '2026-11-01T19:30:00Z');
	const c = occ('c', 'strength', '07:00', 60, '2026-11-01T20:00:00Z');
	const d = occ('d', 'fight', '06:15', 45, '2026-11-01T19:15:00Z');

	it('packs overlapping sessions into rows, lanes in discipline order', () => {
		const lanes = lanesFor([d, c, b, a]);
		expect(lanes.map((l) => l.discipline)).toEqual(['strength', 'fight']);
		expect(lanes[0]!.rows.map((r) => r.map((o) => o.key))).toEqual([['a', 'c'], ['b']]);
	});

	it('places sessions on the axis', () => {
		const axis = { start: 6 * 60, end: 22 * 60 };
		expect(placeOn(a, axis)).toEqual({ left: 0, width: (60 / 960) * 100 });
		expect(placeOn(c, axis).left).toBeCloseTo(6.25);
	});

	it('stretches the axis to fit early or late sessions', () => {
		expect(axisFor([occ('x', 'mobility', '05:30', 30, '2026-11-01T18:30:00Z')]).start).toBe(5 * 60);
		expect(axisFor([occ('y', 'mobility', '21:30', 60, '2026-11-02T10:30:00Z')]).end).toBe(23 * 60);
	});

	it('groups by hour for the phone list', () => {
		expect(byHour([c, a, d]).map((h) => [h.hour, h.items.map((o) => o.key)])).toEqual([
			['06', ['a', 'd']],
			['07', ['c']],
		]);
	});
});
