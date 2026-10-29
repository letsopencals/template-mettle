import type { Metadata } from 'next';
import Link from 'next/link';
import { notFound } from 'next/navigation';
import { getCatalog, getTimetable } from '@/lib/server-data';
import { upcomingFor } from '@/lib/timetable';
import { disciplineMeta, siteConfig } from '@/lib/site-config';
import { floorHref } from '@/lib/floor-url';
import { formatWholePrice } from '@/lib/format';
import { minutesLabel } from '@/lib/when';
import { RackHero } from '@/components/rack/rack-hero';
import { SafeImage } from '@/components/ui/safe-image';
import { Intensity } from '@/components/brand/places-meter';
import { buttonClasses } from '@/components/ui/button';
import { OccurrenceList } from '@/components/sessions/occurrence-list';

export const revalidate = 60;

type Params = Promise<{ slug: string }>;
const TIMETABLE = Object.entries(siteConfig.disciplines).filter(([, d]) => d.mode === 'timetable').map(([k]) => k);

export function generateStaticParams() {
	return TIMETABLE.map((slug) => ({ slug }));
}

export async function generateMetadata({ params }: { params: Params }): Promise<Metadata> {
	const d = disciplineMeta((await params).slug);
	return d ? { title: `${d.label} classes`, description: d.blurb } : {};
}

/** A discipline: its classes as rows (length, intensity, level, price) and the next sessions. */
export default async function DisciplinePage({ params }: { params: Params }) {
	const { slug } = await params;
	const meta = disciplineMeta(slug);
	if (!meta || !TIMETABLE.includes(slug)) notFound();
	const [catalog, timetable] = await Promise.all([getCatalog(), getTimetable()]);
	const classes = catalog.classes.filter((c) => c.discipline === slug);
	const names = Object.fromEntries(catalog.coaches.map((c) => [c.id, c.firstName]));
	const sites = Object.fromEntries(catalog.sites.map((s) => [s.key, s.nickname]));
	const index = String(Object.keys(siteConfig.disciplines).indexOf(slug) + 1).padStart(2, '0');
	return (
		<>
			<RackHero index={index} label={`${meta.label} · ${meta.plateWeight}`} title={meta.tagline} plate={meta.plate}>
				{meta.blurb}
			</RackHero>
			<div className="chalk-texture">
				<div className="container-x pb-20 pt-12">
					<ul className="border-t-2 border-ink">
						{classes.map((c) => (
							<li key={c.key} className="grid gap-5 border-b border-ink/15 py-6 md:grid-cols-12 md:items-center">
								<div className="image-placeholder relative aspect-[4/3] overflow-hidden md:col-span-3">
									<SafeImage src={c.images[0]} alt="" fill sizes="(min-width: 768px) 25vw, 100vw" className="object-cover" />
								</div>
								<div className="md:col-span-5">
									<h2 className="display text-5xl leading-none">{c.title}</h2>
									<p className="mt-2 text-ink-2">{c.classMeta?.tagline ?? c.description}</p>
									{c.classMeta?.prerequisite ? <p className="mt-2 border-l-2 border-plate-yellow pl-3 text-sm text-muted">{c.classMeta.prerequisite}</p> : null}
								</div>
								<dl className="grid grid-cols-3 gap-3 text-sm md:col-span-2 md:grid-cols-1">
									<div>
										<dt className="index-label text-muted">Length</dt>
										<dd className="mono">{minutesLabel(Math.round(c.duration / 60))}</dd>
									</div>
									<div>
										<dt className="index-label text-muted">Intensity</dt>
										<dd className="mt-1">
											<Intensity value={c.classMeta?.intensity ?? 3} />
										</dd>
									</div>
									<div>
										<dt className="index-label text-muted">Level</dt>
										<dd>{c.classMeta?.level ?? 'All levels'}</dd>
									</div>
								</dl>
								<div className="flex items-center justify-between gap-3 md:col-span-2 md:flex-col md:items-end">
									<span className="display text-3xl">{formatWholePrice(c.fromPrice)}</span>
									<Link href={floorHref({ class: c.key })} className={buttonClasses({ size: 'sm' })}>
										See times
									</Link>
								</div>
							</li>
						))}
					</ul>
					<h2 className="display mt-16 text-5xl">Next up</h2>
					<div className="mt-4">
						<OccurrenceList items={upcomingFor(timetable, { discipline: slug, open: true }, 12)} names={names} sites={sites} />
					</div>
					<Link href={floorHref({ discipline: slug })} className={buttonClasses({ variant: 'outline', className: 'mt-6' })}>
						All {meta.label.toLowerCase()} on the Floor
					</Link>
				</div>
			</div>
		</>
	);
}
