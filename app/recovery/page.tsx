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
	title: 'Recovery: contrast suite, infrared and open floor',
	description: 'Book the METTLE contrast suite (sauna and 6 °C plunge), a private infrared suite on the Yard roof, or an open-floor pass.',
};

export default async function RecoveryPage() {
	const catalog = await getCatalog();
	const offerings = servicesIn(catalog, 'recovery').map(toRackOffering);
	const { coaches, sites } = rackLookups(catalog);
	return (
		<>
			<RackHero index="03" label="Recovery" title="Heat. Ice. Quiet." plate="white">
				{siteConfig.disciplines.recovery.blurb}
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
