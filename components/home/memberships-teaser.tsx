import Link from 'next/link';
import { siteConfig } from '@/lib/site-config';
import { Plate } from '@/components/brand/plate';
import { Led } from '@/components/brand/led';
import { buttonClasses } from '@/components/ui/button';

export function MembershipsTeaser() {
	const m = siteConfig.memberships;
	return (
		<section className="rubber-texture py-20 text-chalk">
			<div className="container-x grid gap-10 lg:grid-cols-12 lg:items-center">
				<div className="lg:col-span-5">
					<Led color="amber" className="text-xl">
						{m.launch.toUpperCase()}
					</Led>
					<h2 className="display display-lg mt-3">Memberships are in the rack.</h2>
					<p className="mt-4 max-w-md text-chalk/70">{m.intro}</p>
					<Link href="/memberships" className={buttonClasses({ variant: 'outline-chalk', size: 'lg', className: 'mt-6' })}>
						See the tiers
					</Link>
				</div>
				<ul className="grid gap-2 sm:grid-cols-3 lg:col-span-7">
					{m.tiers.map((t) => (
						<li key={t.key} className="border border-rubber-line p-5">
							<Plate plate={t.plate} size="lg" />
							<p className="display mt-4 text-4xl">{t.name}</p>
							<p className="mono text-sm text-chalk/60">
								{t.priceHint} {t.cadence}
							</p>
							<ul className="mt-3 space-y-1 text-sm text-chalk/75">
								{t.includes.slice(0, 3).map((i) => (
									<li key={i}>— {i}</li>
								))}
							</ul>
						</li>
					))}
				</ul>
			</div>
		</section>
	);
}
