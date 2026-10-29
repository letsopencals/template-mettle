import type { Metadata } from 'next';
import { Suspense } from 'react';
import { getCatalog, getEventOccurrences, getTimetable } from '@/lib/server-data';
import { localDates, localParts } from '@/lib/timetable';
import { siteConfig } from '@/lib/site-config';
import { FloorView } from '@/components/floor/floor-view';
import { CalibrationStrip } from '@/components/brand/calibration-strip';
import type { FloorCoach, FloorSite } from '@/components/floor/types';

export const revalidate = 60;

export const metadata: Metadata = {
	title: 'The Floor: class schedule',
	description: 'Every METTLE class on one clock: strength, fight, conditioning and mobility at the Engine House, the Yard and Remote, with live places left.',
};

export default async function SchedulePage() {
	const [catalog, classes, events] = await Promise.all([getCatalog(), getTimetable(), getEventOccurrences()]);
	const today = localParts(Date.now()).date;
	const dates = localDates(today, siteConfig.policies.bookingWindowDays);
	const last = dates[dates.length - 1] ?? today;
	const occurrences = [...classes, ...events.filter((e) => e.localDate <= last)].sort((a, b) => a.start.localeCompare(b.start));
	const coaches: FloorCoach[] = catalog.coaches.map((c) => ({ id: c.id, slug: c.slug, name: c.name, firstName: c.firstName, image: c.image, role: c.meta?.role ?? null }));
	const sites: FloorSite[] = catalog.sites.map((s) => ({ key: s.key, id: s.id, nickname: s.nickname, name: s.name, online: s.online }));

	return (
		<div className="rubber-texture min-h-screen text-chalk">
			<div className="container-x pb-24 pt-10 md:pt-14">
				<div className="flex flex-wrap items-end justify-between gap-6">
					<div>
						<p className="index-label text-chalk/50">
							<span className="text-chalk">01 /</span> Schedule
						</p>
						<h1 className="display display-xl mt-2">The Floor</h1>
					</div>
					<p className="max-w-md text-chalk/70">
						Every class on one clock. Pick a day, tap a session, load the bar. Places update live, and full sessions point you to the next one with space.
					</p>
				</div>
				<CalibrationStrip className="mt-8" />
				<div className="mt-8">
					<Suspense fallback={<p className="mono text-chalk/50">Loading the floor…</p>}>
						<FloorView occurrences={occurrences} dates={dates} today={today} coaches={coaches} sites={sites} />
					</Suspense>
				</div>
			</div>
		</div>
	);
}
