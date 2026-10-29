import type { Catalog, Offering } from '@/lib/catalog';
import type { RackCoach, RackOffering, RackSite } from '@/components/rack/types';

/** Catalog → the plain props the slot rack needs. Pure; used by RSC pages. */
export function toRackOffering(o: Offering): RackOffering {
	const meta = o.serviceMeta;
	const firstImage = o.images[0] ?? null;
	return {
		key: o.key,
		title: o.title,
		short: meta?.short ?? o.title,
		tagline: meta?.tagline ?? '',
		description: o.description,
		plate: o.plate,
		includes: meta?.includes ?? [],
		whatToBring: meta?.whatToBring ?? [],
		lengths: meta?.lengths ?? null,
		stepMin: meta?.startStep ?? (o.duration >= 3600 ? 30 : 15),
		people: meta?.people ?? 1,
		image: firstImage,
		series: o.series.map((s) => ({
			id: s.id,
			slug: s.slug,
			label: s.variantTitle.replace(/\s*·\s*(Collingwood|Cremorne|Both sites)$/i, '') || s.title,
			price: s.price,
			durationMin: Math.round(s.duration / 60),
			maxDurationMin: s.maxDuration && s.maxDuration > 0 ? Math.round(s.maxDuration / 60) : null,
			allowCustomDuration: s.allowCustomDuration,
			capacity: s.capacity,
			advanceSeconds: s.advanceThreshold,
			siteIds: s.sites.map((x) => x.id),
			coachIds: s.coaches.map((c) => c.id),
		})),
	};
}

export function rackLookups(catalog: Catalog): { coaches: Record<string, RackCoach>; sites: Record<string, RackSite> } {
	return {
		coaches: Object.fromEntries(
			catalog.coaches.map((c) => [c.id, { id: c.id, slug: c.slug, name: c.name, firstName: c.firstName, image: c.image, tier: c.meta?.tier ?? null, role: c.meta?.role ?? null, siteIds: c.siteIds }]),
		),
		sites: Object.fromEntries(catalog.sites.map((s) => [s.id, { id: s.id, key: s.key, name: s.name, nickname: s.nickname, online: s.online }])),
	};
}
