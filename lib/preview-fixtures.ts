import type { BookingView } from '@/lib/booking-view';
import { localDates, localParts, localToUtc } from '@/lib/timetable';
import { plateFor, siteConfig } from '@/lib/site-config';

/**
 * Fixture bookings for /preview/[screen] (design review and screenshots of
 * post-booking states without a real order). Relative to "now", Melbourne time.
 */
function view(id: string, dayOffset: number, time: string, minutes: number, o: Partial<BookingView> & { title: string; discipline: string }): BookingView {
	const today = localParts(Date.now()).date;
	const date = dayOffset >= 0 ? localDates(today, dayOffset + 1).at(-1)! : shift(today, dayOffset);
	const start = localToUtc(date, time);
	const site = siteConfig.sites['mettle-collingwood'];
	return {
		id,
		start,
		end: start + minutes * 60_000,
		status: dayOffset < 0 ? 'completed' : 'scheduled',
		siteSlug: 'mettle-collingwood',
		whatToBring: [],
		transit: site.transit,
		parking: site.parking,
		offeringKey: null,
		variant: null,
		kindLabel: 'Class',
		people: 1,
		coach: null,
		coachFirstName: null,
		coachImage: null,
		coachSlug: null,
		isOnline: false,
		joinUrl: null,
		locationTitle: 'Mettle Collingwood · The Engine House',
		address: '212 Smith Street, Collingwood VIC 3066',
		minutes,
		bookAgainHref: '/schedule',
		plate: plateFor(o.discipline),
		...o,
		awaiting: o.awaiting ?? null,
		isHold: o.isHold ?? false,
	};
}

function shift(date: string, days: number): string {
	const d = new Date(`${date}T00:00:00Z`);
	d.setUTCDate(d.getUTCDate() + days);
	return d.toISOString().slice(0, 10);
}

export function bibFixture(): BookingView[] {
	return [
		view('p1', 1, '17:30', 60, { title: 'Barbell Club', discipline: 'strength', offeringKey: 'barbell-club', coach: 'Jo Mercer', coachFirstName: 'Jo', whatToBring: ['Flat shoes', 'A lifting belt if you use one'] }),
		view('p2', 2, '18:45', 60, { title: 'Muay Thai', discipline: 'fight', offeringKey: 'muay-thai', coach: 'Aisha Daniels', coachFirstName: 'Aisha', whatToBring: ['Hand wraps', 'Gloves (or hire a pair)'] }),
		view('p3', 3, '07:00', 60, { title: 'Personal Training', variant: 'Head Coach', kindLabel: 'Session', discipline: 'coaching', offeringKey: 'personal-training', coach: 'Tane Wiremu', coachFirstName: 'Tane' }),
		view('p4', 3, '19:00', 50, { title: 'Contrast Suite', kindLabel: 'Session', discipline: 'recovery', offeringKey: 'contrast-suite', whatToBring: ['Swimwear', 'Thongs'] }),
	];
}

export function logFixture(): BookingView[] {
	const past: Array<[number, string, string, string]> = [
		[-26, '17:30', 'First Round', 'lab'],
		[-23, '17:30', 'Boxing Fundamentals', 'fight'],
		[-21, '06:00', 'Barbell Club', 'strength'],
		[-16, '06:00', 'Engine Room', 'conditioning'],
		[-14, '07:00', 'Personal Training', 'coaching'],
		[-12, '12:15', 'Bag Rounds', 'fight'],
		[-12, '19:00', 'Contrast Suite', 'recovery'],
		[-9, '06:00', 'Barbell Club', 'strength'],
		[-7, '07:00', "Lifter's Yoga", 'mobility'],
		[-5, '18:45', 'Muay Thai', 'fight'],
		[-2, '06:00', 'Barbell Club', 'strength'],
	];
	return [
		...past.map(([d, t, title, discipline], i) => view(`l${i}`, d, t, 60, { title, discipline, coachFirstName: ['Jo', 'Tane', 'Liam', 'Mei'][i % 4]! })),
		...bibFixture(),
		view('r1', 4, '12:30', 45, { title: 'Nutrition Consult', kindLabel: 'Session', discipline: 'lab', isOnline: true, joinUrl: 'https://meet.mettle.club/live', locationTitle: 'Mettle Remote', address: null, coachFirstName: 'Georgie', coach: 'Georgie Walsh' }),
	];
}
