import type { Metadata } from 'next';
import Link from 'next/link';
import { getCatalog, getEventOccurrences } from '@/lib/server-data';
import { floorHref } from '@/lib/floor-url';
import { formatWholePrice } from '@/lib/format';
import { localDateParts, minutesLabel } from '@/lib/when';
import { siteConfig, plateFor } from '@/lib/site-config';
import { RackHero } from '@/components/rack/rack-hero';
import { Led } from '@/components/brand/led';
import { Plate } from '@/components/brand/plate';
import { PlacesMeter } from '@/components/brand/places-meter';
import { SafeImage } from '@/components/ui/safe-image';
import { buttonClasses } from '@/components/ui/button';

export const revalidate = 60;

export const metadata: Metadata = { title: 'Events and clinics', description: 'Dated METTLE workshops: deadlift clinic, fight night prep, hybrid race day and cold-water breathwork.' };

/** Events as a fight card: each one a bout with its date block, coach and places. */
export default async function EventsPage() {
	const [catalog, events] = await Promise.all([getCatalog(), getEventOccurrences()]);
	const coaches = Object.fromEntries(catalog.coaches.map((c) => [c.id, c]));
	const sites = Object.fromEntries(catalog.sites.map((s) => [s.key, s.name]));
	const byKey = Object.fromEntries(catalog.events.map((e) => [e.key, e]));
	return (
		<>
			<RackHero index="08" label="Events" title="On the card." plate="steel">
				{siteConfig.disciplines.events.blurb} A sold-out event drops off the card.
			</RackHero>
			<div className="rubber-texture text-chalk">
				<div className="container-x space-y-4 pb-20 pt-10">
					{events.length === 0 ? <p className="text-chalk/60">Nothing on the card right now. New dates go up every month.</p> : null}
					{events.map((o, i) => {
						const d = localDateParts(o.localDate);
						const offering = byKey[o.classKey];
						const coach = o.coachId ? coaches[o.coachId] : null;
						return (
							<article key={o.key} className="grid gap-5 border border-rubber-line bg-black/30 p-4 md:grid-cols-12 md:items-center md:p-6">
								<div className="flex items-center gap-4 md:col-span-2 md:flex-col md:items-start">
									<span className="mono text-xs text-chalk/50">BOUT {String(i + 1).padStart(2, '0')}</span>
									<span>
										<span className="index-label block text-chalk/60">
											{d.weekday} {d.month}
										</span>
										<span className="display block text-7xl leading-none">{d.day}</span>
									</span>
									<Led time={o.localTime} color="red" className="text-2xl" />
								</div>
								<div className="image-placeholder relative aspect-[16/10] overflow-hidden md:col-span-3">
									<SafeImage src={offering?.images[0]} alt="" fill sizes="(min-width: 768px) 25vw, 100vw" className="object-cover" />
								</div>
								<div className="md:col-span-4">
									<p className="flex items-center gap-2">
										<Plate plate={plateFor(offering?.collections.find((c) => c !== 'events'))} size="sm" />
										<span className="index-label text-chalk/60">{minutesLabel(o.minutes)} · {o.siteKey ? sites[o.siteKey] : ''}</span>
									</p>
									<h2 className="display mt-1 text-5xl leading-none">{o.title}</h2>
									<p className="mt-2 text-chalk/70">{offering?.eventMeta?.tagline ?? offering?.description}</p>
									{coach ? <p className="mt-2 text-sm">with {coach.name}</p> : null}
								</div>
								<div className="space-y-3 md:col-span-3">
									<PlacesMeter capacity={o.capacity} left={o.seatsLeft} tone="rubber" />
									<p className="display text-4xl">{formatWholePrice(o.price)}</p>
									<Link href={floorHref({ occ: o })} className={buttonClasses({ variant: 'plate', fullWidth: true })}>
										Book a place
									</Link>
								</div>
							</article>
						);
					})}
				</div>
			</div>
		</>
	);
}
