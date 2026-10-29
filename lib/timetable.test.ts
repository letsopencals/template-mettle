import { describe, expect, it } from 'vitest';
import {
	buildTimetable,
	filterOccurrences,
	groupByDay,
	inferFull,
	isOffPeak,
	localDates,
	localParts,
	localToUtc,
	nextWithSpace,
	seatStatus,
	slotsToOccurrences,
	timeOfDay,
	weekStart,
} from '@/lib/timetable';
import { series, slot } from '@/lib/test-fixtures';

const DAY = 86_400_000;
/** Melbourne local date + time → UTC ISO. */
const at = (date: string, time: string) => new Date(localToUtc(date, time)).toISOString();

describe('Melbourne time helpers', () => {
	it('reads local parts in summer (AEDT, UTC+11) and winter (AEST, UTC+10)', () => {
		expect(localParts('2026-11-01T19:00:00Z')).toEqual({ date: '2026-11-02', time: '06:00', weekday: 1 });
		expect(localParts('2026-07-05T20:00:00Z')).toEqual({ date: '2026-07-06', time: '06:00', weekday: 1 });
	});

	it('converts local time to UTC across both DST switches', () => {
		// spring forward, Sun 4 Oct 2026
		expect(at('2026-10-03', '18:00')).toBe('2026-10-03T08:00:00.000Z');
		expect(at('2026-10-04', '18:00')).toBe('2026-10-04T07:00:00.000Z');
		// fall back, Sun 4 Apr 2027
		expect(at('2027-04-03', '09:00')).toBe('2027-04-02T22:00:00.000Z');
		expect(at('2027-04-04', '09:00')).toBe('2027-04-03T23:00:00.000Z');
	});

	it('lists dates and weeks', () => {
		expect(localDates('2026-10-30', 4)).toEqual(['2026-10-30', '2026-10-31', '2026-11-01', '2026-11-02']);
		expect(weekStart('2026-11-01')).toBe('2026-10-26');
		expect(weekStart('2026-11-02')).toBe('2026-11-02');
	});

	it('flags Midday-shift starts Mon–Fri 11:00–14:30 inclusive', () => {
		expect(isOffPeak({ weekday: 1, time: '12:15' })).toBe(true);
		expect(isOffPeak({ weekday: 5, time: '11:00' })).toBe(true);
		expect(isOffPeak({ weekday: 5, time: '14:30' })).toBe(true);
		expect(isOffPeak({ weekday: 5, time: '14:31' })).toBe(false);
		expect(isOffPeak({ weekday: 3, time: '10:59' })).toBe(false);
		expect(isOffPeak({ weekday: 6, time: '12:00' })).toBe(false);
	});

	it('buckets time of day', () => {
		expect(timeOfDay('06:00')).toBe('morning');
		expect(timeOfDay('12:15')).toBe('midday');
		expect(timeOfDay('18:00')).toBe('evening');
	});
});

describe('slotsToOccurrences', () => {
	const club = series({ id: 'barbell-club-collingwood-jo', offeringKey: 'barbell-club' });
	const now = Date.parse(at('2026-11-01', '12:00'));
	const until = now + 30 * DAY;

	it('computes places left and status from attendees', () => {
		const occ = slotsToOccurrences(club, [slot(at('2026-11-02', '06:00'), 60, 4, 10), slot(at('2026-11-03', '18:00'), 60, 8, 10)], { now, until });
		expect(occ.map((o) => [o.localTime, o.seatsLeft, o.status])).toEqual([
			['06:00', 6, 'open'],
			['18:00', 2, 'low'],
		]);
		expect(occ[0]!.minutes).toBe(60);
		expect(occ[0]!.discipline).toBe('strength');
		expect(occ[0]!.plate).toBe('red');
	});

	it('drops past and out-of-horizon slots', () => {
		const occ = slotsToOccurrences(club, [slot(at('2026-11-01', '06:00'), 60), slot(at('2026-12-20', '06:00'), 60), slot(at('2026-11-04', '06:00'), 60)], { now, until });
		expect(occ).toHaveLength(1);
	});

	it('splits a range that merged two back-to-back classes', () => {
		const occ = slotsToOccurrences(club, [slot(at('2026-11-02', '06:00'), 120, 3)], { now, until });
		expect(occ.map((o) => o.localTime)).toEqual(['06:00', '07:00']);
	});

	it('flags Midday-shift classes', () => {
		const [o] = slotsToOccurrences(club, [slot(at('2026-11-03', '12:15'), 60)], { now, until });
		expect(o!.offPeak).toBe(true);
	});

	it('maps place status', () => {
		expect(seatStatus(0)).toBe('full');
		expect(seatStatus(3)).toBe('low');
		expect(seatStatus(4)).toBe('open');
	});
});

describe('Full inference', () => {
	const now = Date.parse(at('2026-11-01', '12:00')); // Sunday
	const club = series({ id: 'barbell-club-collingwood-jo', offeringKey: 'barbell-club' });

	it('infers a missing weekly slot as Full', () => {
		const slots = { [club.id]: [slot(at('2026-11-03', '18:15'), 60), slot(at('2026-11-17', '18:15'), 60)] };
		const tt = buildTimetable([club], slots, { now, horizonDays: 21 });
		expect(tt.map((o) => [o.localDate, o.localTime, o.status, o.inferred])).toEqual([
			['2026-11-03', '18:15', 'open', false],
			['2026-11-10', '18:15', 'full', true],
			['2026-11-17', '18:15', 'open', false],
		]);
		expect(tt[1]!.seatsLeft).toBe(0);
		expect(tt[1]!.attendees).toBe(tt[1]!.capacity);
	});

	it('keeps one pattern across the April fall-back (no phantom twins)', () => {
		const early = Date.parse(at('2027-03-21', '12:00'));
		const slots = { [club.id]: [slot(at('2027-03-22', '06:00'), 60), slot(at('2027-04-05', '06:00'), 60), slot(at('2027-04-12', '06:00'), 60)] };
		const tt = buildTimetable([club], slots, { now: early, horizonDays: 25 });
		expect(tt).toHaveLength(4);
		expect(tt.every((o) => o.localTime === '06:00' && o.weekday === 1)).toBe(true);
		expect(tt.filter((o) => o.inferred).map((o) => o.localDate)).toEqual(['2027-03-29']);
	});

	it('never infers past the last start the API returned', () => {
		const other = series({ id: 'engine-room-collingwood-priya', offeringKey: 'engine-room' });
		const slots = {
			[club.id]: [slot(at('2026-11-02', '06:00'), 60), slot(at('2026-11-09', '06:00'), 60)],
			[other.id]: [slot(at('2026-11-11', '18:00'), 45)],
		};
		const tt = buildTimetable([club, other], slots, { now, horizonDays: 21 });
		expect(tt.some((o) => o.inferred && o.seriesId === club.id)).toBe(false);
	});

	it('does not infer slots inside the advance-booking threshold', () => {
		const near = Date.parse(at('2026-11-02', '05:30'));
		const s = series({ id: 'barbell-x', offeringKey: 'barbell-club', advanceThreshold: 3600 });
		const observed = slotsToOccurrences(s, [slot(at('2026-11-09', '06:00'), 60), slot(at('2026-11-16', '06:00'), 60)], { now: near, until: near + 21 * DAY });
		expect(inferFull(s, observed, { now: near, cutoff: Date.parse(at('2026-11-16', '06:00')) })).toEqual([]);
	});

	it('never infers events or services', () => {
		const event = series({ id: 'deadlift-clinic', offeringKey: 'deadlift-clinic', kind: 'event' });
		const svc = series({ id: 'contrast-suite', offeringKey: 'contrast-suite', kind: 'service', capacity: 6 });
		const slots = {
			[event.id]: [slot(at('2026-11-07', '10:00'), 120)],
			[svc.id]: [slot(at('2026-11-02', '07:00'), 50), slot(at('2026-11-16', '07:00'), 50)],
		};
		expect(buildTimetable([event, svc], slots, { now, horizonDays: 21 }).some((o) => o.inferred)).toBe(false);
	});
});

describe('queries', () => {
	const now = Date.parse(at('2026-11-01', '12:00'));
	const clubC = series({ id: 'barbell-club-collingwood-jo', offeringKey: 'barbell-club' });
	const yard = { id: 'loc-cremorne', slug: 'mettle-cremorne', key: 'cremorne', name: 'The Yard', nickname: 'Yard', online: false };
	const ben = { id: 'staff-ben', slug: 'ben-castellano', name: 'Ben Castellano', firstName: 'Ben', image: null };
	const clubY = series({ id: 'barbell-club-cremorne-ben', offeringKey: 'barbell-club', site: yard, sites: [yard], coach: ben, coaches: [ben] });
	const bag = series({ id: 'bag-rounds-collingwood-tane', offeringKey: 'bag-rounds', discipline: 'fight', plate: 'blue', capacity: 16, duration: 45 * 60 });
	const tt = buildTimetable(
		[clubC, clubY, bag],
		{
			[clubC.id]: [slot(at('2026-11-02', '18:00'), 60), slot(at('2026-11-16', '18:00'), 60)],
			[clubY.id]: [slot(at('2026-11-10', '07:00'), 60, 10, 10), slot(at('2026-11-11', '07:00'), 60, 9, 10)],
			[bag.id]: [slot(at('2026-11-04', '06:00'), 45, 1, 16)],
		},
		{ now, horizonDays: 21 },
	);

	it('finds the next of the same class with a free place, any site', () => {
		const full = tt.find((o) => o.inferred && o.seriesId === clubC.id)!;
		expect(full.localDate).toBe('2026-11-09');
		const next = nextWithSpace(full, tt)!;
		expect(next.seriesId).toBe(clubY.id);
		expect(next.localDate).toBe('2026-11-11');
		expect(next.seatsLeft).toBe(1);
	});

	it('filters by site, discipline, class, coach, intensity and time of day', () => {
		expect(filterOccurrences(tt, { site: 'cremorne' }).every((o) => o.siteKey === 'cremorne')).toBe(true);
		expect(filterOccurrences(tt, { discipline: 'fight' }).every((o) => o.classKey === 'bag-rounds')).toBe(true);
		expect(filterOccurrences(tt, { coach: 'ben-castellano' }, (s) => (s === 'ben-castellano' ? 'staff-ben' : null)).every((o) => o.coachId === 'staff-ben')).toBe(true);
		expect(filterOccurrences(tt, { maxIntensity: 3 })).toHaveLength(0);
		expect(filterOccurrences(tt, { time: 'evening' }).every((o) => o.localTime >= '16:00')).toBe(true);
		expect(filterOccurrences(tt, {})).toHaveLength(tt.length);
	});

	it('groups by local day, keeping empty days', () => {
		expect(groupByDay([], ['2026-11-02'])).toEqual([{ date: '2026-11-02', occurrences: [] }]);
		const days = groupByDay(tt, localDates('2026-11-02', 3));
		expect(days.map((d) => [d.date, d.occurrences.length])).toEqual([
			['2026-11-02', 1],
			['2026-11-03', 1],
			['2026-11-04', 2],
		]);
	});
});
