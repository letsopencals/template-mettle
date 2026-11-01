import type { AppointmentListItemLocation } from '@opencals/storefront-sdk';
import { offeringKeyForSlug, classKeyForSlug } from '@/lib/catalog';
import { classMeta, plateFor, serviceMeta, siteConfig, type Plate } from '@/lib/site-config';

/**
 * Turns an appointment (list, detail or order-embedded) into the facts the
 * account, the bib and the log show: the offering key, its discipline and
 * plate, the coach, whether it's Remote (and the live link), the site address,
 * the head count for a partner session, and where "Book again" goes.
 *
 * Remote vs on-site comes from the booked location's `type`; the join link is
 * that location's `link`, set once on the Mettle Remote location in the dashboard.
 */

interface AddressFields {
	addressLine1?: string | null;
	addressLine2?: string | null;
	city?: string | null;
	state?: string | null;
	postalCode?: string | null;
	country?: string | null;
	displayAddress?: string | null;
}

/** Structural subset shared by the SDK's appointment list, detail and order shapes. */
export interface AppointmentLike {
	from: string;
	to: string;
	numberOfAttendees?: number | null;
	staffMember?: {
		firstName?: string | null;
		lastName?: string | null;
		slug?: string | null;
		image?: { url?: string | null } | null;
	} | null;
	customAttributes?: Record<string, string> | null;
	product?: {
		title?: string | null;
		variantTitle?: string | null;
		slug?: string | null;
		color?: string | null;
		maxAttendees?: number | null;
		price?: number | null;
	} | null;
	location?: (AddressFields & {
		title?: string | null;
		type?: AppointmentListItemLocation['type'] | null;
		link?: string | null;
		address?: string | null;
	}) | null;
}

export interface BookingMeta {
	title: string;
	/** Offering key (`barbell-club`, `pt-coach`, `deadlift-clinic`), from the product slug. */
	offeringKey: string | null;
	/** Discipline slug from the template's own key lists (`strength`…), `coaching` when unknown. */
	discipline: string;
	plate: Plate;
	variant: string | null;
	/** "Class" | "Session". */
	kindLabel: string;
	/** People on the booking (a partner session is one booking for 2). */
	people: number;
	coach: string | null;
	coachFirstName: string | null;
	coachImage: string | null;
	coachSlug: string | null;
	isOnline: boolean;
	joinUrl: string | null;
	locationTitle: string | null;
	address: string | null;
	minutes: number;
	bookAgainHref: string;
}

function joinAddress(a: AddressFields | null | undefined): string | null {
	if (!a) return null;
	if (a.displayAddress) return a.displayAddress;
	const parts = [a.addressLine1, a.addressLine2, a.city, a.state, a.postalCode].filter(Boolean);
	return parts.length ? parts.join(', ') : null;
}

/** Discipline of a booked product from its slug alone (appointments don't carry collections). */
export function disciplineForSlug(slug: string | null | undefined): string {
	const key = offeringKeyForSlug(slug);
	if (!key) return 'coaching';
	if (key in siteConfig.events) return 'events';
	return classMeta(key)?.discipline ?? serviceMeta(key)?.discipline ?? 'coaching';
}

export function getBookingMeta(appt: AppointmentLike): BookingMeta {
	const staff = appt.staffMember;
	const coach = staff ? [staff.firstName, staff.lastName].filter(Boolean).join(' ') || null : null;
	const isOnline = appt.location?.type === siteConfig.locationTypes.online;
	const slug = appt.product?.slug ?? null;
	const discipline = disciplineForSlug(slug);
	const key = offeringKeyForSlug(slug);
	const isClass = Boolean(classKeyForSlug(slug));
	return {
		title: appt.product?.title ?? 'Session',
		offeringKey: key,
		discipline,
		plate: plateFor(discipline),
		variant: appt.product?.variantTitle || null,
		kindLabel: isClass ? 'Class' : discipline === 'events' ? 'Event' : 'Session',
		people: appt.customAttributes?.[siteConfig.customAttributeKeys.people] === '2' ? 2 : Math.max(1, appt.numberOfAttendees ?? 1),
		coach,
		coachFirstName: staff?.firstName ?? null,
		coachImage: staff?.image?.url ?? null,
		coachSlug: staff?.slug ?? null,
		isOnline,
		joinUrl: isOnline ? appt.location?.link || null : null,
		locationTitle: appt.location?.title ?? null,
		address: isOnline ? null : (joinAddress(appt.location) ?? appt.location?.address ?? null),
		minutes: Math.max(0, Math.round((Date.parse(appt.to) - Date.parse(appt.from)) / 60_000)),
		bookAgainHref: bookAgain(key, discipline, isClass),
	};
}

function bookAgain(key: string | null, discipline: string, isClass: boolean): string {
	if (isClass && key) return `/schedule?class=${encodeURIComponent(key)}`;
	if (discipline === 'events') return '/events';
	if (discipline === 'recovery') return key ? `/recovery?service=${key}` : '/recovery';
	if (discipline === 'lab') return key ? `/lab?service=${key}` : '/lab';
	return key ? `/coaching?service=${key}` : '/coaching';
}

export type JoinState = 'early' | 'open' | 'ended';

/**
 * Whether the "Join" button is live: from `joinWindowMinutes` before the
 * start until the session ends.
 */
export function getJoinState(from: string, to: string, now: number = Date.now()): JoinState {
	const opensAt = Date.parse(from) - siteConfig.joinWindowMinutes * 60_000;
	if (now < opensAt) return 'early';
	if (now > Date.parse(to)) return 'ended';
	return 'open';
}
