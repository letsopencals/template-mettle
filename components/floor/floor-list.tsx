'use client';

import { useMemo } from 'react';
import type { Occurrence } from '@/lib/timetable';
import { byHour } from '@/lib/floor';
import { SessionBlock } from '@/components/floor/session-block';
import type { FloorCoach, FloorSite } from '@/components/floor/types';

/** Phone layout: the same blocks, grouped by hour. */
export function FloorList({ occurrences, coaches, sites, selectedKey, onSelect }: { occurrences: Occurrence[]; coaches: Record<string, FloorCoach>; sites: Record<string, FloorSite>; selectedKey: string | null; onSelect: (o: Occurrence) => void }) {
	const groups = useMemo(() => byHour(occurrences), [occurrences]);
	return (
		<div className="space-y-5">
			{groups.map((g) => (
				<section key={g.hour} aria-label={`${g.hour}:00`}>
					<p className="led mb-2 text-sm text-led-red">{g.hour}:00</p>
					<ul className="space-y-1.5">
						{g.items.map((o) => (
							<li key={o.key}>
								<SessionBlock
									variant="list"
									occurrence={o}
									coach={o.coachId ? (coaches[o.coachId]?.firstName ?? null) : null}
									site={o.siteKey ? (sites[o.siteKey]?.nickname ?? null) : null}
									selected={o.key === selectedKey}
									onSelect={onSelect}
								/>
							</li>
						))}
					</ul>
				</section>
			))}
		</div>
	);
}
