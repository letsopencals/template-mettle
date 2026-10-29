import { getBookingMeta, type AppointmentLike, type BookingMeta } from '@/lib/booking-meta';
import { classMeta, serviceMeta, siteConfig, siteMeta } from '@/lib/site-config';

/** One booked session as the bib, the log and the detail page show it. */
export interface BookingView extends BookingMeta {
	id: string;
	start: number;
	end: number;
	status: string;
	siteSlug: string | null;
	whatToBring: string[];
	transit: string | null;
	parking: string | null;
}

type Appt = AppointmentLike & { id: string; status?: string | null; location?: (AppointmentLike['location'] & { slug?: string | null }) | null };

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
		siteSlug: a.location?.slug ?? null,
		whatToBring: bring,
		transit: site?.transit ?? null,
		parking: site?.parking || null,
	};
}
