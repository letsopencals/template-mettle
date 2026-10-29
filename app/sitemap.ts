import type { MetadataRoute } from 'next';
import { siteConfig } from '@/lib/site-config';
import { physicalSites } from '@/lib/catalog';
import { getCatalog } from '@/lib/server-data';

export const revalidate = 3600;

export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
	const base = siteConfig.url;
	const now = new Date();
	const entry = (path: string, priority: number, changeFrequency: 'daily' | 'weekly' | 'monthly' = 'weekly') => ({
		url: `${base}${path}`,
		lastModified: now,
		changeFrequency,
		priority,
	});

	const catalog = await getCatalog();

	return [
		entry('', 1),
		entry('/schedule', 0.95, 'daily'),
		entry('/coaching', 0.9),
		entry('/recovery', 0.85),
		entry('/lab', 0.85),
		entry('/blocks', 0.8),
		entry('/events', 0.8, 'daily'),
		entry('/coaches', 0.8),
		entry('/memberships', 0.6),
		...Object.keys(siteConfig.disciplines)
			.filter((d) => siteConfig.disciplines[d as keyof typeof siteConfig.disciplines].mode === 'timetable')
			.map((d) => entry(`/disciplines/${d}`, 0.85)),
		...physicalSites(catalog).map((s) => entry(`/sites/${s.key}`, 0.8)),
		...catalog.coaches.map((c) => entry(`/coaches/${c.slug}`, 0.7)),
	];
}
