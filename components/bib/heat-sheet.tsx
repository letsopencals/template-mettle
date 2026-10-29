import Link from 'next/link';
import { clsx } from 'clsx';
import type { BookingView } from '@/lib/booking-view';
import { googleCalendarHref, icsHref, ICS_FILENAME, type CalendarEvent } from '@/lib/calendar';
import { siteConfig } from '@/lib/site-config';
import { dayLabel, minutesLabel, timeLabel } from '@/lib/when';
import { Plate } from '@/components/brand/plate';
import { Led } from '@/components/brand/led';

export function toCalendarEvent(v: BookingView): CalendarEvent {
	const where = v.isOnline ? (v.joinUrl ?? 'Mettle Remote (video link in your email)') : [v.locationTitle, v.address].filter(Boolean).join(', ');
	const lines = [v.coach ? `With ${v.coach}` : null, v.whatToBring.length ? `Bring: ${v.whatToBring.join(', ')}` : null, `Move or cancel: ${siteConfig.url}/account/appointments/${v.id}`].filter(Boolean);
	return { uid: v.id, title: `${v.title} · ${siteConfig.name}`, start: v.start, end: v.end, location: where || undefined, description: lines.join('\n') };
}

const LINK = 'index-label inline-flex h-9 items-center gap-2 border border-ink/25 px-3 hover:border-ink';

/** The sessions on the bib, in order: when (LED), what, who, where, calendar. */
export function HeatSheet({ views, className }: { views: BookingView[]; className?: string }) {
	const events = views.map(toCalendarEvent);
	return (
		<div className={className}>
			<div className="flex flex-wrap items-baseline justify-between gap-3 border-b-2 border-ink pb-2">
				<h2 className="display text-4xl">Heat sheet</h2>
				{views.length > 1 ? (
					<a href={icsHref(events)} download={ICS_FILENAME} className={LINK}>
						Add all {views.length} to calendar
					</a>
				) : null}
			</div>
			<ol className="divide-y divide-ink/10">
				{views.map((v, i) => (
					<li key={v.id} className="grid gap-3 py-4 sm:grid-cols-[7.5rem_minmax(0,1fr)_auto] sm:items-center">
						<div className="flex items-center gap-3 bg-rubber px-3 py-2 text-chalk sm:flex-col sm:items-start sm:gap-0.5">
							<span className="mono text-[0.7rem] uppercase text-chalk/60">{dayLabel(v.start)}</span>
							<Led time={timeLabel(v.start)} color="green" className="text-2xl" />
						</div>
						<div className="flex gap-3">
							<Plate plate={v.plate} size="md" className="mt-1" />
							<div>
								<p className="font-semibold leading-tight">
									{v.title}
									{v.variant && v.kindLabel !== 'Class' ? <span className="font-normal text-muted"> · {v.variant}</span> : null}
								</p>
								<p className="text-sm text-muted">{[minutesLabel(v.minutes), v.coach ? `with ${v.coach}` : null, v.isOnline ? 'Mettle Remote' : v.locationTitle, v.people > 1 ? `${v.people} people` : null].filter(Boolean).join(' · ')}</p>
							</div>
						</div>
						<div className="flex gap-2">
							<a href={icsHref([events[i]!])} download={ICS_FILENAME} className={clsx(LINK)}>
								.ics
							</a>
							<a href={googleCalendarHref(events[i]!)} target="_blank" rel="noopener noreferrer" className={LINK}>
								Google
							</a>
							<Link href={`/account/appointments/${v.id}`} className={LINK}>
								Manage
							</Link>
						</div>
					</li>
				))}
			</ol>
		</div>
	);
}
