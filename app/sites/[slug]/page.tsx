import type { Metadata } from 'next';
import Link from 'next/link';
import { notFound } from 'next/navigation';
import { getCatalog, getTimetable } from '@/lib/server-data';
import { findSite, physicalSites } from '@/lib/catalog';
import { upcomingFor } from '@/lib/timetable';
import { floorHref } from '@/lib/floor-url';
import { SafeImage } from '@/components/ui/safe-image';
import { buttonClasses } from '@/components/ui/button';
import { CalibrationStrip } from '@/components/brand/calibration-strip';
import { OccurrenceList } from '@/components/sessions/occurrence-list';
import { CoachCard } from '@/components/coaches/coach-card';

export const revalidate = 60;

type Params = Promise<{ slug: string }>;

export async function generateStaticParams() {
	return physicalSites(await getCatalog()).map((s) => ({ slug: s.key }));
}

export async function generateMetadata({ params }: { params: Params }): Promise<Metadata> {
	const s = findSite(await getCatalog(), (await params).slug);
	return s ? { title: `${s.name}, ${s.meta?.suburb ?? ''}`, description: s.meta?.blurb } : {};
}

export default async function SitePage({ params }: { params: Params }) {
	const { slug } = await params;
	const [catalog, timetable] = await Promise.all([getCatalog(), getTimetable()]);
	const site = findSite(catalog, slug);
	if (!site || site.online) notFound();
	const images = site.meta?.images ?? [];
	const names = Object.fromEntries(catalog.coaches.map((c) => [c.id, c.firstName]));
	const coaches = catalog.coaches.filter((c) => site.coachIds.includes(c.id));
	const maps = site.latitude && site.longitude ? `https://www.google.com/maps/search/?api=1&query=${site.latitude},${site.longitude}` : `https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(site.address)}`;
	return (
		<>
			<section className="rubber-texture text-chalk">
				<div className="container-x pb-10 pt-12">
					<p className="index-label text-chalk/50">
						<span className="text-chalk">Site /</span> {site.meta?.suburb}
					</p>
					<h1 className="display display-xl mt-2">{site.name}</h1>
				</div>
				<div className="container-x grid gap-2 pb-12 md:grid-cols-3">
					{[0, 1, 2].map((i) => (
						<div key={i} className={`image-placeholder relative overflow-hidden ${i === 0 ? 'aspect-[4/3] md:col-span-2 md:row-span-2 md:aspect-auto' : 'aspect-[4/3]'}`}>
							<SafeImage src={images[i]} alt={i === 0 ? site.name : ''} fill priority={i === 0} sizes="(min-width: 768px) 60vw, 100vw" className="object-cover" />
						</div>
					))}
				</div>
				<CalibrationStrip />
			</section>
			<section className="chalk-texture py-14">
				<div className="container-x grid gap-12 lg:grid-cols-12">
					<div className="lg:col-span-5">
						<p className="text-lg text-ink-2">{site.meta?.blurb}</p>
						<dl className="mt-6 space-y-4 border-t-2 border-ink pt-4 text-sm">
							<div>
								<dt className="index-label text-muted">Address</dt>
								<dd className="mt-1 font-semibold">{site.address}</dd>
							</div>
							<div>
								<dt className="index-label text-muted">Hours</dt>
								<dd className="mono mt-1">{site.meta?.hours}</dd>
							</div>
							<div>
								<dt className="index-label text-muted">Getting there</dt>
								<dd className="mt-1">{site.meta?.transit}</dd>
								{site.meta?.parking ? <dd className="text-muted">{site.meta.parking}</dd> : null}
							</div>
							<div>
								<dt className="index-label text-muted">On site</dt>
								<dd className="mt-1 flex flex-wrap gap-1.5">
									{site.meta?.facilities.map((f) => (
										<span key={f} className="border border-ink/20 px-2 py-1 text-xs">
											{f}
										</span>
									))}
								</dd>
							</div>
						</dl>
						<div className="mt-6 flex flex-wrap gap-2">
							<Link href={floorHref({ site: site.key })} className={buttonClasses({ size: 'lg' })}>
								Classes here
							</Link>
							<a href={maps} target="_blank" rel="noopener noreferrer" className={buttonClasses({ variant: 'outline', size: 'lg' })}>
								Open in Maps
							</a>
						</div>
					</div>
					<div className="lg:col-span-7">
						<h2 className="display text-4xl">Next at {site.meta?.nickname ?? site.name}</h2>
						<div className="mt-4">
							<OccurrenceList items={upcomingFor(timetable, { siteId: site.id, open: true }, 10)} names={names} sites={{}} />
						</div>
						{coaches.length ? (
							<>
								<h2 className="display mt-12 text-4xl">Coaches here</h2>
								<div className="mt-4 grid grid-cols-3 gap-4 md:grid-cols-4">
									{coaches.map((c) => (
										<CoachCard key={c.id} coach={c} compact />
									))}
								</div>
							</>
						) : null}
					</div>
				</div>
			</section>
		</>
	);
}
