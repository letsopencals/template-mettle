'use client';

import { useEffect, useMemo, useRef } from 'react';
import { clsx } from 'clsx';
import type { Occurrence } from '@/lib/timetable';
import { axisFor, lanesFor, placeOn } from '@/lib/floor';
import { disciplineMeta } from '@/lib/site-config';
import { localParts } from '@/lib/timetable';
import { Plate } from '@/components/brand/plate';
import { SessionBlock } from '@/components/floor/session-block';
import type { FloorCoach, FloorSite } from '@/components/floor/types';

const ROW_H = 96;
/** Pixels per hour: wide enough that a 45-minute block reads without truncating. */
const HOUR_PX = 104;

/**
 * One day on a horizontal clock: an hour scale on top, one lane per
 * discipline, sessions placed by start and sized by length. A red line marks
 * now when the day is today.
 */
export function FloorBoard({
	occurrences,
	coaches,
	sites,
	selectedKey,
	onSelect,
	now,
	day,
}: {
	occurrences: Occurrence[];
	coaches: Record<string, FloorCoach>;
	sites: Record<string, FloorSite>;
	selectedKey: string | null;
	onSelect: (o: Occurrence) => void;
	now: Date | null;
	day: string;
}) {
	const axis = useMemo(() => axisFor(occurrences), [occurrences]);
	const lanes = useMemo(() => lanesFor(occurrences), [occurrences]);
	const hours = useMemo(() => {
		const out: number[] = [];
		for (let m = axis.start; m <= axis.end; m += 60) out.push(m / 60);
		return out;
	}, [axis]);
	const span = axis.end - axis.start;
	const scroller = useRef<HTMLDivElement>(null);
	// Open the day scrolled to its first session (or to now on today).
	const firstMinute = useMemo(() => {
		const first = occurrences[0];
		if (!first) return axis.start;
		const [h, m] = first.localTime.split(':').map(Number);
		return (h ?? 0) * 60 + (m ?? 0);
	}, [occurrences, axis.start]);
	const nowLeft = useMemo(() => {
		if (!now) return null;
		const p = localParts(now.getTime());
		if (p.date !== day) return null;
		const [h, m] = p.time.split(':').map(Number);
		const min = (h ?? 0) * 60 + (m ?? 0);
		if (min < axis.start || min > axis.end) return null;
		return ((min - axis.start) / span) * 100;
	}, [now, day, axis, span]);

	useEffect(() => {
		const el = scroller.current;
		if (!el) return;
		const nowMin = nowLeft !== null ? axis.start + (nowLeft / 100) * span : null;
		const target = Math.max(axis.start, (nowMin ?? firstMinute) - 45);
		el.scrollTo({ left: ((target - axis.start) / 60) * HOUR_PX, behavior: 'auto' });
		// Only when the day changes, not on every tick of the clock.
		// eslint-disable-next-line react-hooks/exhaustive-deps
	}, [day, firstMinute]);

	return (
		<div ref={scroller} className="overflow-x-auto pb-2 [scrollbar-color:var(--color-rubber-line)_transparent]">
			<div style={{ width: 144 + ((axis.end - axis.start) / 60) * HOUR_PX }}>
				{/* hour scale */}
				<div className="flex">
					<div className="w-36 shrink-0" />
					<div className="relative h-8 flex-1 border-b border-rubber-line">
						{hours.map((h) => (
							<span key={h} className="mono absolute bottom-1.5 -translate-x-1/2 text-[0.7rem] text-chalk/50" style={{ left: `${(((h * 60) - axis.start) / span) * 100}%` }}>
								{String(h).padStart(2, '0')}
							</span>
						))}
					</div>
				</div>
				<div className="relative">
				{lanes.map((lane) => {
					const meta = disciplineMeta(lane.discipline);
					return (
						<div key={lane.discipline} className="flex border-b border-rubber-line">
							<div className="sticky left-0 z-20 flex w-36 shrink-0 items-start gap-2.5 bg-rubber py-3 pr-3">
								<Plate plate={meta?.plate ?? 'steel'} size="md" />
								<span>
									<span className="display block text-xl leading-none">{meta?.label ?? lane.discipline}</span>
									<span className="mono text-[0.66rem] text-chalk/45">{meta?.plateWeight}</span>
								</span>
							</div>
							<div className="relative flex-1" style={{ height: lane.rows.length * ROW_H + 8 }}>
								{hours.map((h) => (
									<span key={h} aria-hidden className="absolute inset-y-0 w-px bg-rubber-line/70" style={{ left: `${(((h * 60) - axis.start) / span) * 100}%` }} />
								))}
								{lane.rows.map((row, r) => (
									<div key={r} className="absolute inset-x-0" style={{ top: r * ROW_H + 4, height: ROW_H }}>
										{row.map((o) => {
											const pos = placeOn(o, axis);
											const coach = o.coachId ? (coaches[o.coachId]?.firstName ?? null) : null;
											const site = o.siteKey ? (sites[o.siteKey]?.nickname ?? null) : null;
											return (
												<SessionBlock
													key={o.key}
													occurrence={o}
													coach={coach}
													site={site}
													selected={o.key === selectedKey}
													onSelect={onSelect}
													style={{ left: `calc(${pos.left}% + 1px)`, width: `calc(${Math.max(pos.width, 4)}% - 3px)` }}
												/>
											);
										})}
									</div>
								))}
							</div>
						</div>
					);
				})}
				{nowLeft !== null ? (
					<div aria-hidden className="pointer-events-none absolute inset-y-0 left-36 right-0 z-[5]">
						<span className={clsx('clock-sweep absolute inset-y-0 left-0 border-r-2 border-led-red bg-led-red/[0.07]')} style={{ width: `${nowLeft}%` }} />
					</div>
				) : null}
				</div>
			</div>
		</div>
	);
}
