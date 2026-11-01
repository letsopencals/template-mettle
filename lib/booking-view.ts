import type { AppointmentStatusType, StorefrontAppointmentPendingReason } from '@opencals/storefront-sdk';
import { getBookingMeta, type AppointmentLike, type BookingMeta } from '@/lib/booking-meta';
import { awaitingOf, type Awaiting } from '@/lib/checkout-outcome';
import { classMeta, serviceMeta, siteConfig, siteMeta } from '@/lib/site-config';

/** One booked session as the bib, the log and the detail page show it. */
export interface BookingView extends BookingMeta {
	id: string;
	start: number;
	end: number;
	status: AppointmentStatusType;
	/** Set only when the booking is pending with a reason: waiting for payment or for the club to approve it. */
	awaiting: Awaiting;
	/** A pending session with no order behind it: a cart hold, not a booking. The log skips it. */
	isHold: boolean;
	siteSlug: string | null;
	whatToBring: string[];
	transit: string | null;
	parking: string | null;
}

type Appt = AppointmentLike & {
	id: string;
	status?: AppointmentStatusType | null;
	pendingReason?: StorefrontAppointmentPendingReason | null;
	/** Present on list/detail appointments; absent on the ones embedded in an order. */
	orderLineItem?: unknown;
	location?: (AppointmentLike['location'] & { slug?: string | null }) | null;
};

export function toBookingView(a: Appt): BookingView {
	const meta = getBookingMeta(a);
	const key = meta.offeringKey;
	const bring = (key && (classMeta(key)?.whatToBring ?? serviceMeta(key)?.whatToBring ?? siteConfig.events[key]?.whatToBring)) || [];
	const site = siteMeta(a.location?.slug ?? null);
	return {
		...meta,
		id: a.id,
		start: Date.parse(a.from),
		end: Date.parse(a.to),
		status: a.status ?? 'scheduled',
		awaiting: awaitingOf(a.status, a.pendingReason),
		isHold: a.status === 'pending' && a.orderLineItem === null,
		siteSlug: a.location?.slug ?? null,
		whatToBring: bring,
		transit: site?.transit ?? null,
		parking: site?.parking || null,
	};
}
