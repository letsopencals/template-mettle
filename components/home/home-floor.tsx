'use client';

import { useCallback, useMemo } from 'react';
import { useRouter } from 'next/navigation';
import type { Occurrence } from '@/lib/timetable';
import { floorHref } from '@/lib/floor-url';
import { useNow } from '@/hooks/use-now';
import { FloorBoard } from '@/components/floor/floor-board';
import { FloorList } from '@/components/floor/floor-list';
import type { FloorCoach, FloorSite } from '@/components/floor/types';

/** Today on the Floor, read-only: tapping a session opens it on /schedule. */
export function HomeFloor({ occurrences, coaches, sites, day }: { occurrences: Occurrence[]; coaches: FloorCoach[]; sites: FloorSite[]; day: string }) {
	const router = useRouter();
	const now = useNow(60_000);
	const coachById = useMemo(() => Object.fromEntries(coaches.map((c) => [c.id, c])), [coaches]);
	const siteByKey = useMemo(() => Object.fromEntries(sites.map((s) => [s.key, s])), [sites]);
	const shown = useMemo(() => occurrences.filter((o) => !now || Date.parse(o.start) > now.getTime()), [occurrences, now]);
	const open = useCallback((o: Occurrence) => router.push(floorHref({ occ: o })), [router]);
	if (!shown.length) return <p className="mono text-chalk/60">Today&rsquo;s sessions are done. Tomorrow&rsquo;s are on the Floor.</p>;
	return (
		<>
			<div className="md:hidden">
				<FloorList occurrences={shown.slice(0, 8)} coaches={coachById} sites={siteByKey} selectedKey={null} onSelect={open} />
			</div>
			<div className="hidden md:block">
				<FloorBoard occurrences={shown} coaches={coachById} sites={siteByKey} selectedKey={null} onSelect={open} now={now} day={day} />
			</div>
		</>
	);
}
