import type { Metadata } from 'next';
import { Suspense } from 'react';
import { getCatalog } from '@/lib/server-data';
import { servicesIn } from '@/lib/catalog';
import { rackLookups, toRackOffering } from '@/lib/rack-data';
import { siteConfig } from '@/lib/site-config';
import { RackHero } from '@/components/rack/rack-hero';
import { RackPage } from '@/components/rack/rack-page';

export const revalidate = 300;

export const metadata: Metadata = {
	title: 'The Lab: testing, screens and nutrition',
	description: 'InBody scans, movement screens, VO2 max testing and nutrition consults at METTLE, plus the free First Round intro.',
};

export default async function LabPage() {
	const catalog = await getCatalog();
	const offerings = servicesIn(catalog, 'lab').map(toRackOffering);
	const { coaches, sites } = rackLookups(catalog);
	return (
		<>
			<RackHero index="04" label="Lab" title="Measure it." plate="steel">
				{siteConfig.disciplines.lab.blurb}
			</RackHero>
			<div className="chalk-texture">
				<div className="container-x pb-16 pt-10">
					<Suspense>
						<RackPage offerings={offerings} coaches={coaches} sites={sites} />
					</Suspense>
				</div>
			</div>
		</>
	);
}
