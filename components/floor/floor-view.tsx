'use client';

import { useCallback, useMemo } from 'react';
import { usePathname, useRouter, useSearchParams } from 'next/navigation';
import type { Occurrence } from '@/lib/timetable';
import { filterOccurrences } from '@/lib/timetable';
import { floorHref, sessionKey } from '@/lib/floor-url';
import { siteConfig } from '@/lib/site-config';
import { useSettings } from '@/contexts/settings-context';
import { useMediaQuery } from '@/hooks/use-media-query';
import { useNow } from '@/hooks/use-now';
import { Overlay } from '@/components/ui/overlay';
import { DayStrip } from '@/components/floor/day-strip';
import { FloorFilters, type FloorFilterState } from '@/components/floor/floor-filters';
import { FloorBoard } from '@/components/floor/floor-board';
import { FloorList } from '@/components/floor/floor-list';
import { SessionPanel } from '@/components/floor/session-panel';
import type { FloorCoach, FloorSite } from '@/components/floor/types';

/**
 * The Floor (`/schedule`): filters, the day row, the board (or the phone
 * list), and the session panel docked under it. All state lives in the URL
 * (see lib/floor-url.ts), so a session can be linked to.
 */
export function FloorView({ occurrences, dates, today, coaches, sites }: { occurrences: Occurrence[]; dates: string[]; today: string; coaches: FloorCoach[]; sites: FloorSite[] }) {
	const router = useRouter();
	const pathname = usePathname();
	const params = useSearchParams();
	const { currency } = useSettings();
	const now = useNow(60_000);
	const desktop = useMediaQuery('(min-width: 768px)', true);

	const coachById = useMemo(() => Object.fromEntries(coaches.map((c) => [c.id, c])), [coaches]);
	const siteByKey = useMemo(() => Object.fromEntries(sites.map((s) => [s.key, s])), [sites]);
	const disciplines = useMemo(() => {
		const order = Object.keys(siteConfig.disciplines);
		return [...new Set(occurrences.map((o) => o.discipline))].sort((a, b) => order.indexOf(a) - order.indexOf(b));
	}, [occurrences]);

	// URL → state
	const sParam = params.get('s');
	const selectedFromUrl = useMemo(() => (sParam ? (occurrences.find((o) => sessionKey(o) === sParam) ?? null) : null), [sParam, occurrences]);
	const dayParam = params.get('day');
	const day = selectedFromUrl?.localDate ?? (dayParam && dates.includes(dayParam) ? dayParam : (dates[0] ?? today));
	const filters: FloorFilterState = {
		site: siteByKey[params.get('site') ?? ''] ? params.get('site') : null,
		discipline: disciplines.includes(params.get('discipline') ?? '') ? params.get('discipline') : null,
		coach: coaches.some((c) => c.slug === params.get('coach')) ? params.get('coach') : null,
		max: Number(params.get('max')) || null,
	};
	const classFilter = params.get('class');

	const push = useCallback(
		(next: { day?: string; filters?: Partial<FloorFilterState>; occ?: Occurrence | null }) => {
			const f = { ...filters, ...next.filters };
			const href = floorHref({
				day: next.day ?? day,
				site: f.site,
				discipline: f.discipline,
				coach: f.coach,
				max: f.max,
				class: next.filters ? null : classFilter,
				occ: next.occ === undefined ? selectedFromUrl : next.occ,
			});
			router.replace(href.replace('/schedule', pathname), { scroll: false });
		},
		// eslint-disable-next-line react-hooks/exhaustive-deps
		[day, filters.site, filters.discipline, filters.coach, filters.max, classFilter, selectedFromUrl, router, pathname],
	);

	const filtered = useMemo(
		() =>
			filterOccurrences(occurrences, { site: filters.site, discipline: filters.discipline, class: classFilter, maxIntensity: filters.max, coach: filters.coach }, (slug) => coaches.find((c) => c.slug === slug)?.id ?? null).filter((o) =>
				now ? Date.parse(o.start) > now.getTime() : true,
			),
		[occurrences, filters.site, filters.discipline, filters.max, filters.coach, classFilter, coaches, now],
	);
	const dayCounts = useMemo(() => dates.map((date) => ({ date, open: filtered.filter((o) => o.localDate === date && o.status !== 'full').length })), [dates, filtered]);
	const ofDay = useMemo(() => filtered.filter((o) => o.localDate === day), [filtered, day]);
	const selected = selectedFromUrl;

	const select = useCallback((o: Occurrence) => push({ occ: o, day: o.localDate }), [push]);
	const close = useCallback(() => push({ occ: null }), [push]);

	const panel = selected ? (
		<SessionPanel
			key={selected.key}
			occurrence={selected}
			all={occurrences}
			coach={selected.coachId ? (coachById[selected.coachId] ?? null) : null}
			site={selected.siteKey ? (siteByKey[selected.siteKey] ?? null) : null}
			currency={currency}
			onClose={close}
			onJump={select}
		/>
	) : null;

	const activeClass = classFilter ? (siteConfig.classes as Record<string, { short: string }>)[classFilter]?.short : null;

	return (
		<div>
			<FloorFilters value={filters} onChange={(f) => push({ filters: f, occ: null })} sites={sites} disciplines={disciplines} coaches={coaches} />
			{activeClass ? (
				<p className="mt-3 text-sm text-chalk/70">
					Showing {activeClass} only.{' '}
					<button type="button" className="underline underline-offset-4" onClick={() => push({ filters: {}, occ: null })}>
						Show everything
					</button>
				</p>
			) : null}
			<div className="mt-4">
				<DayStrip days={dayCounts} value={day} onChange={(d) => push({ day: d, occ: null })} today={today} />
			</div>
			<div className="mt-6">
				{ofDay.length === 0 ? (
					<div className="border border-dashed border-rubber-line px-6 py-14 text-center">
						<p className="display text-3xl">Nothing on the floor</p>
						<p className="mt-2 text-chalk/60">No sessions match on this day. Try another day or clear a filter.</p>
					</div>
				) : (
					<>
						<div className="md:hidden">
							<FloorList occurrences={ofDay} coaches={coachById} sites={siteByKey} selectedKey={selected?.key ?? null} onSelect={select} />
						</div>
						<div className="hidden md:block">
							<FloorBoard occurrences={ofDay} coaches={coachById} sites={siteByKey} selectedKey={selected?.key ?? null} onSelect={select} now={now} day={day} />
						</div>
					</>
				)}
			</div>
			{/* Docked under the board; sticks to the bottom of the screen until the board scrolls past, so Load the bar is always in view. */}
			<div className="sticky bottom-0 z-30 mt-6 hidden md:block">
					{panel && desktop ? (
						<div className="relative max-h-[46vh] overflow-y-auto border-t-4 border-plate-yellow bg-rubber-2 p-6 shadow-[0_-24px_40px_-12px_rgba(0,0,0,0.6)]">
							<button type="button" onClick={close} className="index-label absolute right-4 top-4 text-chalk/60 hover:text-chalk">
								Close ✕
							</button>
							{panel}
						</div>
					) : (
						<p className="mono border border-dashed border-rubber-line bg-rubber px-4 py-4 text-sm text-chalk/50">Pick a session on the board. Its details, extras and price open here.</p>
					)}
			</div>
			<Overlay open={Boolean(selected) && !desktop} onClose={close} kind="sheet" label={selected?.title ?? 'Session'} tone="rubber" className="overflow-y-auto p-5">
				{panel}
			</Overlay>
		</div>
	);
}
