import type { Metadata } from 'next';
import Link from 'next/link';
import { Suspense } from 'react';
import { getCatalog } from '@/lib/server-data';
import { servicesIn } from '@/lib/catalog';
import { rackLookups, toRackOffering } from '@/lib/rack-data';
import { siteConfig } from '@/lib/site-config';
import { floorHref } from '@/lib/floor-url';
import { RackHero } from '@/components/rack/rack-hero';
import { RackPage } from '@/components/rack/rack-page';
import { SectionHead } from '@/components/brand/section-head';
import { CoachCard } from '@/components/coaches/coach-card';
import { CalibrationStrip } from '@/components/brand/calibration-strip';

export const revalidate = 300;

export const metadata: Metadata = {
	title: 'Coaching: personal training, padwork and partner sessions',
	description: 'Personal training in Melbourne for 30, 60 or 90 minutes with a coach, senior coach or head coach. Partner PT, fight padwork and ring hire at METTLE.',
};

export default async function CoachingPage() {
	const catalog = await getCatalog();
	const offerings = servicesIn(catalog, 'coaching').map(toRackOffering);
	const { coaches, sites } = rackLookups(catalog);
	const tiers = (['head', 'senior', 'coach'] as const).map((t) => ({ tier: t, info: siteConfig.tiers[t], list: catalog.coaches.filter((c) => c.meta?.tier === t) }));
	const semi = catalog.classes.find((c) => c.discipline === 'coaching');

	return (
		<>
			<RackHero index="02" label="Coaching" title="One coach. Your programme." plate="black">
				{siteConfig.disciplines.coaching.blurb}
			</RackHero>
			<div className="chalk-texture">
				<div className="container-x pb-16 pt-10">
					<Suspense>
						<RackPage offerings={offerings} coaches={coaches} sites={sites} />
					</Suspense>
					{semi ? (
						<p className="mt-10 border-l-4 border-ink pl-4 text-ink-2">
							Training with three others? <strong>{semi.title}</strong> runs as a weekly class on the Floor: four people, one coach, your own programme.{' '}
							<Link href={floorHref({ discipline: 'coaching' })} className="font-semibold underline underline-offset-4">
								See the times
							</Link>
						</p>
					) : null}
				</div>
			</div>
			<CalibrationStrip />
			<section className="rubber-texture py-20 text-chalk">
				<div className="container-x">
					<SectionHead index="02.1" label="The coaches" title="Pick by person, not by slot." tone="rubber">
						Every coach teaches classes and takes PT. Tiers set the price per 30 minutes; the person sets everything else.
					</SectionHead>
					<div className="mt-12 space-y-14">
						{tiers.map(({ tier, info, list }) =>
							list.length ? (
								<div key={tier}>
									<div className="flex items-baseline gap-4 border-b border-rubber-line pb-3">
										<h3 className="display text-3xl">{info.label}</h3>
										<p className="text-sm text-chalk/60">{info.blurb}</p>
									</div>
									<div className="mt-6 grid grid-cols-2 gap-6 md:grid-cols-4 lg:grid-cols-6">
										{list.map((c) => (
											<CoachCard key={c.id} coach={c} tone="rubber" compact />
										))}
									</div>
								</div>
							) : null,
						)}
					</div>
				</div>
			</section>
		</>
	);
}
