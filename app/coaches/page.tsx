import type { Metadata } from 'next';
import { getCatalog } from '@/lib/server-data';
import { siteConfig } from '@/lib/site-config';
import { RackHero } from '@/components/rack/rack-hero';
import { CoachCard } from '@/components/coaches/coach-card';

export const revalidate = 300;

export const metadata: Metadata = { title: 'Coaches', description: 'The METTLE coaching team: head coaches, senior coaches and coaches across strength, fight, conditioning, mobility and the Lab.' };

export default async function CoachesPage() {
	const catalog = await getCatalog();
	return (
		<>
			<RackHero index="07" label="Coaches" title="The people on the floor." plate="black">
				Every coach teaches classes and takes one-to-ones. The plates on each portrait are what they coach.
			</RackHero>
			<div className="chalk-texture">
				<div className="container-x space-y-14 pb-20 pt-12">
					{(['head', 'senior', 'coach'] as const).map((t) => {
						const list = catalog.coaches.filter((c) => (c.meta?.tier ?? 'coach') === t);
						return list.length ? (
							<section key={t}>
								<div className="flex items-baseline gap-4 border-b-2 border-ink pb-2">
									<h2 className="display text-4xl">{siteConfig.tiers[t].label}</h2>
									<p className="text-sm text-muted">{siteConfig.tiers[t].blurb}</p>
								</div>
								<div className="mt-6 grid grid-cols-2 gap-6 md:grid-cols-3 lg:grid-cols-4">
									{list.map((c) => (
										<CoachCard key={c.id} coach={c} />
									))}
								</div>
							</section>
						) : null;
					})}
				</div>
			</div>
		</>
	);
}
