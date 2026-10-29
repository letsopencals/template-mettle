import type { BookingView } from '@/lib/booking-view';
import { siteConfig } from '@/lib/site-config';

/** What to bring (deduped across sessions), arrival, and how to get to each site you booked. */
export function BeforeYouCome({ views }: { views: BookingView[] }) {
	const bring = [...new Set(views.flatMap((v) => v.whatToBring))];
	const sites = [...new Map(views.filter((v) => !v.isOnline && v.siteSlug).map((v) => [v.siteSlug, v])).values()];
	const remote = views.some((v) => v.isOnline);
	return (
		<div className="grid gap-8 md:grid-cols-2">
			<div>
				<h3 className="display text-3xl">Before you come</h3>
				<ul className="mt-4 space-y-2 text-[0.95rem]">
					<li className="flex gap-3">
						<span className="mono shrink-0 text-muted">01</span>Arrive 10 minutes early. First time? The desk walks you through the floor.
					</li>
					<li className="flex gap-3">
						<span className="mono shrink-0 text-muted">02</span>
						{bring.length ? `Bring: ${bring.join(', ')}.` : 'Bring water and trainers. Towels are at the desk.'}
					</li>
					<li className="flex gap-3">
						<span className="mono shrink-0 text-muted">03</span>Free to move or cancel up to {siteConfig.policies.cancelHours} hours before, from your Training log.
					</li>
					{remote ? (
						<li className="flex gap-3">
							<span className="mono shrink-0 text-muted">04</span>Remote sessions: the Join button opens in your Training log {siteConfig.joinWindowMinutes} minutes before.
						</li>
					) : null}
				</ul>
			</div>
			{sites.length ? (
				<div>
					<h3 className="display text-3xl">Getting there</h3>
					<div className="mt-4 space-y-5">
						{sites.map((v) => (
							<div key={v.siteSlug} className="border-l-4 border-ink pl-4">
								<p className="font-semibold">{v.locationTitle}</p>
								{v.address ? <p className="text-sm text-muted">{v.address}</p> : null}
								{v.transit ? <p className="mt-1.5 text-sm">{v.transit}</p> : null}
								{v.parking ? <p className="text-sm text-muted">{v.parking}</p> : null}
								{v.address ? (
									<a href={`https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(v.address)}`} target="_blank" rel="noopener noreferrer" className="index-label mt-2 inline-block underline underline-offset-4">
										Open in Maps
									</a>
								) : null}
							</div>
						))}
					</div>
				</div>
			) : null}
		</div>
	);
}
