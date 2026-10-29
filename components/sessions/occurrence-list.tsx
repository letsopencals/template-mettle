import Link from 'next/link';
import type { Occurrence } from '@/lib/timetable';
import { floorHref } from '@/lib/floor-url';
import { dayLabel } from '@/lib/when';
import { Plate } from '@/components/brand/plate';
import { PlacesMeter } from '@/components/brand/places-meter';

/** Upcoming sessions as ruled rows linking into the Floor. Server-safe. */
export function OccurrenceList({ items, names, sites, tone = 'chalk' }: { items: Occurrence[]; names: Record<string, string>; sites: Record<string, string>; tone?: 'chalk' | 'rubber' }) {
	if (!items.length) return <p className={tone === 'chalk' ? 'text-muted' : 'text-chalk/60'}>Nothing coming up in the next four weeks.</p>;
	return (
		<ul className={tone === 'chalk' ? 'divide-y divide-ink/10 border-y border-ink/15' : 'divide-y divide-rubber-line border-y border-rubber-line'}>
			{items.map((o) => (
				<li key={o.key}>
					<Link href={floorHref({ occ: o })} className="grid grid-cols-[6.5rem_minmax(0,1fr)_7rem] items-center gap-3 py-2.5 hover:opacity-80 sm:grid-cols-[8rem_minmax(0,1fr)_10rem]">
						<span className="mono text-sm">
							{dayLabel(o.start)} <span className="font-semibold">{o.localTime}</span>
						</span>
						<span className="flex min-w-0 items-center gap-2">
							<Plate plate={o.plate} size="xs" />
							<span className="truncate font-semibold">{o.short}</span>
							<span className="hidden truncate text-sm opacity-60 sm:inline">{[o.coachId ? names[o.coachId] : null, o.siteKey ? sites[o.siteKey] : null].filter(Boolean).join(' · ')}</span>
						</span>
						<PlacesMeter capacity={o.capacity} left={o.seatsLeft} tone={tone} />
					</Link>
				</li>
			))}
		</ul>
	);
}
