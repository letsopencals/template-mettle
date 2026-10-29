import { getCatalog, getTimetable } from '@/lib/server-data';
import { physicalSites, servicesIn } from '@/lib/catalog';
import { localParts } from '@/lib/timetable';
import { siteConfig, type DisciplineMeta } from '@/lib/site-config';
import { formatWholePrice } from '@/lib/format';
import { weekStart, localDates } from '@/lib/timetable';
import { CalibrationStrip } from '@/components/brand/calibration-strip';
import { SectionHead } from '@/components/brand/section-head';
import { Hero } from '@/components/home/hero';
import { PlateRack, type RackRow } from '@/components/home/plate-rack';
import { HomeFloor } from '@/components/home/home-floor';
import { BlocksTeaser } from '@/components/home/blocks-teaser';
import { CoachesStrip } from '@/components/home/coaches-strip';
import { RecoverMeasure } from '@/components/home/recover-measure';
import { MembershipsTeaser } from '@/components/home/memberships-teaser';
import { SitesBand } from '@/components/home/sites-band';
import Link from 'next/link';
import { buttonClasses } from '@/components/ui/button';

export const revalidate = 60;

export default async function HomePage() {
	const [catalog, timetable] = await Promise.all([getCatalog(), getTimetable()]);
	const today = localParts(Date.now()).date;
	const week = new Set(localDates(weekStart(today), 7));
	const coachNames = Object.fromEntries(catalog.coaches.map((c) => [c.id, c.firstName]));
	const next = timetable.filter((o) => o.status !== 'full').slice(0, 5);

	const rows: RackRow[] = (Object.entries(siteConfig.disciplines) as Array<[string, DisciplineMeta]>).map(([slug, meta]) => {
		const offers = [...catalog.classes, ...catalog.services, ...catalog.events].filter((o) => o.discipline === slug);
		return {
			slug,
			meta,
			weekCount: meta.mode === 'timetable' ? timetable.filter((o) => o.discipline === slug && week.has(o.localDate)).length : null,
			fromPrice: offers.length ? Math.min(...offers.map((o) => o.fromPrice)) : null,
			names: [...new Set(offers.map((o) => o.classMeta?.short ?? o.serviceMeta?.short ?? o.title))].slice(0, 5),
		};
	});
	const pt = catalog.services.find((s) => s.key === 'personal-training');

	return (
		<>
			<Hero next={next} coachNames={coachNames} />
			<CalibrationStrip />
			<PlateRack rows={rows} />
			<section className="rubber-texture py-20 text-chalk">
				<div className="container-x">
					<SectionHead index="02" label="The Floor" title="Today, on one clock." tone="rubber">
						Every class plotted against the day. Tap one to see the coach, the places left and the price, then load it on the bar.
					</SectionHead>
					<div className="mt-10">
						<HomeFloor
							day={today}
							occurrences={timetable.filter((o) => o.localDate === today)}
							coaches={catalog.coaches.map((c) => ({ id: c.id, slug: c.slug, name: c.name, firstName: c.firstName, image: c.image, role: c.meta?.role ?? null }))}
							sites={catalog.sites.map((s) => ({ key: s.key, id: s.id, nickname: s.nickname, name: s.name, online: s.online }))}
						/>
					</div>
					<Link href="/schedule" className={buttonClasses({ variant: 'chalk', size: 'lg', className: 'mt-8' })}>
						Open the full Floor
					</Link>
				</div>
			</section>
			<CalibrationStrip />
			<BlocksTeaser />
			<CoachesStrip coaches={catalog.coaches} ptFrom={pt ? formatWholePrice(pt.fromPrice) : null} />
			<RecoverMeasure recovery={servicesIn(catalog, 'recovery')} lab={servicesIn(catalog, 'lab')} />
			<MembershipsTeaser />
			<SitesBand sites={physicalSites(catalog)} />
			<section className="bg-plate-yellow py-14 text-ink">
				<div className="container-x flex flex-wrap items-center justify-between gap-6">
					<p className="display display-md max-w-3xl">Never trained with us? The First Round is free.</p>
					<Link href={`/lab?service=${siteConfig.introService}`} className={buttonClasses({ variant: 'primary', size: 'lg' })}>
						Book 20 minutes
					</Link>
				</div>
			</section>
		</>
	);
}
