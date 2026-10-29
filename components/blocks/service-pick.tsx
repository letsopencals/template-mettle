'use client';

import { useMemo, useState } from 'react';
import useSWR from 'swr';
import { fetcher } from '@/lib/fetcher';
import { lengthsFor, startsByDay, startsFrom, type FreeRange, type RackStart } from '@/lib/rack';
import { localDates, localParts } from '@/lib/timetable';
import { useNow } from '@/hooks/use-now';
import { RackDays } from '@/components/rack/rack-days';
import { SlotGrid } from '@/components/rack/slot-grid';
import type { RackOffering } from '@/components/rack/types';

/** Length a block books a service for: 60 min when the service can stretch to it, else its base. */
export function blockLength(o: RackOffering): number {
	const s = o.series[0]!;
	const lengths = s.allowCustomDuration ? lengthsFor(s.durationMin, s.maxDurationMin, o.lengths ?? undefined) : [s.durationMin];
	return lengths.includes(60) ? 60 : lengths[0]!;
}

/** One service time for a Training Block: day row + plain slots, first series, any coach. */
export function ServicePick({ offering, taken, onPick }: { offering: RackOffering; taken: number[]; onPick: (s: RackStart) => void }) {
	const series = offering.series[0]!;
	const now = useNow(60_000);
	const { data: ranges } = useSWR<FreeRange[]>(`/api/ranges?productId=${encodeURIComponent(series.id)}`, fetcher, { revalidateOnFocus: false });
	const length = blockLength(offering);
	const starts = useMemo(
		() => (ranges && now ? startsFrom(ranges, { durationMin: length, stepMin: offering.stepMin, now: now.getTime(), advanceSeconds: series.advanceSeconds }).filter((s) => !taken.includes(s.start)) : []),
		[ranges, now, length, offering.stepMin, series.advanceSeconds, taken],
	);
	const byDay = useMemo(() => startsByDay(starts), [starts]);
	const today = now ? localParts(now.getTime()).date : null;
	const days = useMemo(() => (today ? localDates(today, 14).map((date) => ({ date, count: byDay[date]?.length ?? 0 })) : []), [today, byDay]);
	const [day, setDay] = useState<string | null>(null);
	const active = day ?? days.find((d) => d.count)?.date ?? null;
	if (!ranges) return <div className="h-24 animate-pulse bg-chalk-2" />;
	return (
		<div className="space-y-3">
			<RackDays days={days} value={active} onChange={setDay} today={today} />
			{active ? <SlotGrid starts={byDay[active] ?? []} value={null} onChange={onPick} showLeft={series.capacity > 1} /> : null}
		</div>
	);
}
