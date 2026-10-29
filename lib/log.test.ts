import { describe, expect, it } from 'vitest';
import { byWeek, plateCounts, splitLog, weekStreak } from '@/lib/log';
import { localToUtc } from '@/lib/timetable';
import type { BookingView } from '@/lib/booking-view';

const v = (id: string, date: string, status = 'completed', discipline = 'strength', plate: BookingView['plate'] = 'red'): BookingView =>
	({ id, start: localToUtc(date, '07:00'), end: localToUtc(date, '08:00'), status, discipline, plate }) as BookingView;

describe('training log', () => {
	const now = localToUtc('2026-11-04', '12:00'); // Wednesday
	const views = [v('a', '2026-10-20'), v('b', '2026-10-27', 'completed', 'fight', 'blue'), v('c', '2026-11-02'), v('d', '2026-11-06', 'scheduled'), v('e', '2026-11-05', 'canceled')];

	it('splits up next, done and cancelled', () => {
		const s = splitLog(views, now);
		expect(s.upcoming.map((x) => x.id)).toEqual(['d']);
		expect(s.done.map((x) => x.id)).toEqual(['c', 'b', 'a']);
		expect(s.cancelled.map((x) => x.id)).toEqual(['e']);
	});

	it('counts plates and the week streak', () => {
		const done = splitLog(views, now).done;
		expect(plateCounts(done)).toEqual([
			{ discipline: 'strength', plate: 'red', count: 2 },
			{ discipline: 'fight', plate: 'blue', count: 1 },
		]);
		expect(weekStreak(done, now)).toBe(3);
		expect(weekStreak([v('x', '2026-10-13')], now)).toBe(0);
	});

	it('groups by Monday week', () => {
		expect(byWeek(splitLog(views, now).done).map((w) => w.week)).toEqual(['2026-11-02', '2026-10-26', '2026-10-19']);
	});
});
