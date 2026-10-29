import type { Metadata } from 'next';
import { Suspense } from 'react';
import { getCatalog, getTimetable } from '@/lib/server-data';
import { toRackOffering } from '@/lib/rack-data';
import { localDates, localParts } from '@/lib/timetable';
import { siteConfig } from '@/lib/site-config';
import { formatWholePrice } from '@/lib/format';
import { RackHero } from '@/components/rack/rack-hero';
import { BlocksView } from '@/components/blocks/blocks-view';

export const revalidate = 60;

export const metadata: Metadata = {
	title: 'Training Blocks',
	description: 'Book a week of METTLE sessions in one go. Load A$150 on the bar for 10% off, A$300 for 15%.',
};

export default async function BlocksPage() {
	const [catalog, timetable] = await Promise.all([getCatalog(), getTimetable()]);
	const today = localParts(Date.now()).date;
	const last = localDates(today, 14).at(-1)!;
	const classes = timetable.filter((o) => o.status !== 'full' && o.localDate <= last);
	const keys = new Set(siteConfig.blocks.flatMap((b) => b.lines.map((l) => (l.pick.type === 'service' ? l.pick.serviceKey : null)).filter(Boolean) as string[]));
	const services = Object.fromEntries(catalog.services.filter((s) => keys.has(s.key)).map((s) => [s.key, toRackOffering(s)]));
	const siteNames = Object.fromEntries(catalog.sites.map((s) => [s.key, s.nickname]));
	const [t1, t2] = siteConfig.blockThresholds;
	return (
		<>
			<RackHero index="05" label="Training Blocks" title="Load the bar." plate="yellow">
				Book a run of sessions in one order. Put {t1 ? formatWholePrice(t1.amount) : ''} on the bar and every session gets {t1?.percent}% off; {t2 ? formatWholePrice(t2.amount) : ''} gets {t2?.percent}%. Build your own on the Floor, or start from one of ours.
			</RackHero>
			<div className="chalk-texture">
				<div className="container-x pb-20 pt-10">
					<Suspense>
						<BlocksView classes={classes} services={services} siteNames={siteNames} />
					</Suspense>
				</div>
			</div>
		</>
	);
}
