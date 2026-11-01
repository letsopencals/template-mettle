import type { BookingView } from '@/lib/booking-view';
import { localParts, weekStart } from '@/lib/timetable';

/**
 * The Training log: bookings split into up next / done / cancelled, weekly
 * groups, a plate count per discipline and the week streak. Pure.
 */
export interface LogSplit {
	upcoming: BookingView[];
	done: BookingView[];
	cancelled: BookingView[];
}

export function splitLog(views: readonly BookingView[], now: number): LogSplit {
	const upcoming: BookingView[] = [];
	const done: BookingView[] = [];
	const cancelled: BookingView[] = [];
	for (const v of views) {
		// A pending session with no order is a cart hold that expires on its own, not a booking.
		if (v.isHold) continue;
		if (v.status === 'canceled') cancelled.push(v);
		// Pending bookings (awaiting payment or the club's approval) are still up next.
		else if (v.end > now && (v.status === 'scheduled' || v.status === 'pending')) upcoming.push(v);
		else if (v.start <= now && v.status !== 'pending') done.push(v);
	}
	upcoming.sort((a, b) => a.start - b.start);
	done.sort((a, b) => b.start - a.start);
	return { upcoming, done, cancelled };
}

export function byWeek(views: readonly BookingView[]): Array<{ week: string; items: BookingView[] }> {
	const map = new Map<string, BookingView[]>();
	for (const v of views) {
		const w = weekStart(localParts(v.start).date);
		if (!map.has(w)) map.set(w, []);
		map.get(w)!.push(v);
	}
	return [...map.entries()].map(([week, items]) => ({ week, items }));
}

export function plateCounts(views: readonly BookingView[]): Array<{ discipline: string; plate: BookingView['plate']; count: number }> {
	const map = new Map<string, { discipline: string; plate: BookingView['plate']; count: number }>();
	for (const v of views) {
		const e = map.get(v.discipline) ?? { discipline: v.discipline, plate: v.plate, count: 0 };
		e.count += 1;
		map.set(v.discipline, e);
	}
	return [...map.values()].sort((a, b) => b.count - a.count);
}

/** Consecutive weeks (ending this week or last week) with at least one finished session. */
export function weekStreak(done: readonly BookingView[], now: number): number {
	const weeks = new Set(done.map((v) => weekStart(localParts(v.start).date)));
	let cursor = weekStart(localParts(now).date);
	if (!weeks.has(cursor)) cursor = shift(cursor, -7);
	let n = 0;
	while (weeks.has(cursor)) {
		n++;
		cursor = shift(cursor, -7);
	}
	return n;
}

function shift(date: string, days: number): string {
	const d = new Date(`${date}T00:00:00Z`);
	d.setUTCDate(d.getUTCDate() + days);
	return d.toISOString().slice(0, 10);
}
