import { describe, expect, it } from 'vitest';
import { buildCatalog, classKeyForSlug, findCoach, findSite, offeringKeyForSlug, serviceKeyForSlug } from '@/lib/catalog';
import { LOC, STAFF, collection, group, location, staffMember, variant } from '@/lib/test-fixtures';

const v = (slug: string, productId: string, title: string, o: Partial<Parameters<typeof variant>[0]> = {}) =>
	variant({ id: slug, slug, productId, title, variantTitle: '', price: 30, duration: 3600, maxAttendees: 10, loc: LOC.collingwood!, staff: [STAFF.jo!], ...o });

const barbellJo = v('barbell-club-collingwood-jo', 'group-barbell-club', 'Barbell Club');
const barbellYard = v('barbell-club-cremorne-marco', 'group-barbell-club', 'Barbell Club', { loc: LOC.cremorne!, staff: [STAFF.priya!] });
const semi = v('semi-private-strength-collingwood-jo', 'group-semi', 'Semi-Private Strength', { maxAttendees: 4 });
const ptCoach = v('pt-coach', 'group-personal-training', 'Personal Training', { maxAttendees: 1, duration: 1800, staff: [STAFF.priya!, STAFF.tane!] });
const ptHead = v('pt-head', 'group-personal-training', 'Personal Training', { maxAttendees: 1, duration: 1800, staff: [STAFF.jo!] });
const openFloor = v('open-floor-collingwood', 'group-open-floor', 'Open Floor', { maxAttendees: 30, duration: 7200, staff: [] });
const clinic = v('event-deadlift-clinic', 'group-event-deadlift-clinic', 'Deadlift Clinic', { maxAttendees: 12, duration: 9000 });
const nutrition = v('nutrition-consult', 'group-nutrition', 'Nutrition Consult', { maxAttendees: 1, loc: LOC.online!, staff: [STAFF.nina!] });

const catalog = buildCatalog({
	products: [
		group('group-barbell-club', 'Barbell Club', [barbellJo, barbellYard]),
		group('group-semi', 'Semi-Private Strength', [semi]),
		group('group-personal-training', 'Personal Training', [ptCoach, ptHead]),
		group('group-open-floor', 'Open Floor', [openFloor]),
		group('group-event-deadlift-clinic', 'Deadlift Clinic', [clinic]),
		group('group-nutrition', 'Nutrition Consult', [nutrition]),
	],
	collections: [
		collection('strength', ['group-barbell-club', 'group-open-floor']),
		collection('recovery', ['group-open-floor']),
		collection('coaching', ['group-semi', 'group-personal-training']),
		collection('events', ['group-event-deadlift-clinic']),
		collection('lab', ['group-nutrition']),
	],
	staff: [staffMember(STAFF.jo!, [LOC.collingwood!]), staffMember(STAFF.priya!, [LOC.collingwood!, LOC.cremorne!]), staffMember(STAFF.tane!, [LOC.collingwood!]), staffMember(STAFF.nina!, [LOC.online!])],
	locations: [location(LOC.collingwood!), location(LOC.cremorne!), location(LOC.online!)],
});

describe('slug keys', () => {
	it('maps variant slugs to class, service and event keys', () => {
		expect(classKeyForSlug('olympic-lifting-lab-collingwood-jo')).toBe('olympic-lifting-lab');
		expect(serviceKeyForSlug('pt-senior')).toBe('personal-training');
		expect(serviceKeyForSlug('fight-padwork-60')).toBe('fight-padwork');
		expect(serviceKeyForSlug('infrared-suite-2')).toBe('infrared-suite');
		expect(offeringKeyForSlug('event-hybrid-race-day')).toBe('event-hybrid-race-day');
		expect(offeringKeyForSlug('unknown-thing')).toBeNull();
	});
});

describe('buildCatalog', () => {
	it('builds weekly classes with one series per site × coach', () => {
		const club = catalog.classes.find((c) => c.key === 'barbell-club')!;
		expect(club.kind).toBe('class');
		expect(club.discipline).toBe('strength');
		expect(club.plate).toBe('red');
		expect(club.series.map((s) => [s.site?.key, s.coach?.slug])).toEqual([
			['collingwood', 'jo-mercer'],
			['cremorne', 'priya-raman'],
		]);
	});

	it('treats semi-private strength as a coaching class on the Floor', () => {
		const sp = catalog.classes.find((c) => c.key === 'semi-private-strength')!;
		expect(sp.discipline).toBe('coaching');
		expect(sp.plate).toBe('black');
	});

	it('groups the PT tiers into one personal-training service', () => {
		const pt = catalog.services.find((s) => s.key === 'personal-training')!;
		expect(pt.kind).toBe('service');
		expect(pt.series.map((s) => s.slug)).toEqual(['pt-coach', 'pt-head']);
		expect(pt.coachIds).toEqual(expect.arrayContaining(['staff-jo', 'staff-priya', 'staff-tane']));
	});

	it('lets site copy pick the discipline for products in two collections', () => {
		const floor = catalog.services.find((s) => s.key === 'open-floor')!;
		expect(floor.discipline).toBe('recovery');
		expect(floor.kind).toBe('service');
	});

	it('finds events, sites and coaches', () => {
		expect(catalog.events.map((e) => e.key)).toEqual(['event-deadlift-clinic']);
		expect(findSite(catalog, 'remote')?.online).toBe(true);
		expect(findSite(catalog, 'collingwood')?.offeringKeys).toEqual(expect.arrayContaining(['barbell-club', 'personal-training']));
		expect(findCoach(catalog, 'staff-jo-mercer')?.id).toBe('staff-jo');
	});
});
