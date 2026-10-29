import type { Occurrence } from '@/lib/timetable';
import { siteConfig } from '@/lib/site-config';

/**
 * The Floor: one day of classes on a horizontal clock, one lane per
 * discipline. Pure layout maths, shared by the board and its tests.
 */

export interface FloorLane {
	discipline: string;
	/** Packed rows: sessions in one row never overlap. */
	rows: Occurrence[][];
}

const minutesOf = (hhmm: string) => {
	const [h, m] = hhmm.split(':').map(Number);
	return (h ?? 0) * 60 + (m ?? 0);
};

/** The axis for a day: the config hours, stretched to fit any session outside them. */
export function axisFor(occurrences: readonly Occurrence[]): { start: number; end: number } {
	let start = siteConfig.floor.startHour * 60;
	let end = siteConfig.floor.endHour * 60;
	for (const o of occurrences) {
		const s = minutesOf(o.localTime);
		start = Math.min(start, Math.floor(s / 60) * 60);
		end = Math.max(end, Math.ceil((s + o.minutes) / 60) * 60);
	}
	return { start, end: Math.min(end, 24 * 60) };
}

/** Left and width (percent of the axis) for one session. */
export function placeOn(o: Pick<Occurrence, 'localTime' | 'minutes'>, axis: { start: number; end: number }): { left: number; width: number } {
	const span = axis.end - axis.start;
	const s = minutesOf(o.localTime) - axis.start;
	return { left: (s / span) * 100, width: (o.minutes / span) * 100 };
}

/** Greedy row packing per discipline, lanes in `siteConfig.disciplines` order. */
export function lanesFor(occurrences: readonly Occurrence[]): FloorLane[] {
	const order = Object.keys(siteConfig.disciplines);
	const by = new Map<string, Occurrence[]>();
	for (const o of occurrences) {
		if (!by.has(o.discipline)) by.set(o.discipline, []);
		by.get(o.discipline)!.push(o);
	}
	return [...by.entries()]
		.sort(([a], [b]) => (order.indexOf(a) < 0 ? 99 : order.indexOf(a)) - (order.indexOf(b) < 0 ? 99 : order.indexOf(b)))
		.map(([discipline, list]) => {
			const rows: Occurrence[][] = [];
			const ends: number[] = [];
			for (const o of [...list].sort((a, b) => a.start.localeCompare(b.start))) {
				const s = Date.parse(o.start);
				const i = ends.findIndex((e) => e <= s);
				if (i >= 0) {
					rows[i]!.push(o);
					ends[i] = Date.parse(o.end);
				} else {
					rows.push([o]);
					ends.push(Date.parse(o.end));
				}
			}
			return { discipline, rows };
		});
}

/** Sessions grouped by local hour ("06", "07"…) for the phone list. */
export function byHour(occurrences: readonly Occurrence[]): Array<{ hour: string; items: Occurrence[] }> {
	const map = new Map<string, Occurrence[]>();
	for (const o of [...occurrences].sort((a, b) => a.start.localeCompare(b.start))) {
		const h = o.localTime.slice(0, 2);
		if (!map.has(h)) map.set(h, []);
		map.get(h)!.push(o);
	}
	return [...map.entries()].map(([hour, items]) => ({ hour, items }));
}
