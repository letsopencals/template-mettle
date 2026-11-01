'use client';

import { useMemo, useState } from 'react';
import type { AppointmentDetailProduct, AppointmentDetailResponse } from '@opencals/storefront-sdk';
import useSWR from 'swr';
import { fetcher } from '@/lib/fetcher';
import { classKeyForSlug, serviceKeyForSlug } from '@/lib/catalog';
import { serviceMeta, siteConfig } from '@/lib/site-config';
import { startsByDay, startsFrom, type FreeRange, type RackStart } from '@/lib/rack';
import { localDates, localParts } from '@/lib/timetable';
import { useNow } from '@/hooks/use-now';
import { RackDays } from '@/components/rack/rack-days';
import { SlotGrid } from '@/components/rack/slot-grid';
import { Button } from '@/components/ui/button';

type Appt = Pick<AppointmentDetailResponse, 'id' | 'productId' | 'staffMemberId' | 'locationId' | 'from' | 'to' | 'numberOfAttendees'> & {
	product?: Pick<AppointmentDetailProduct, 'slug' | 'duration'> | null;
};

const utc = (ms: number) => {
	const iso = new Date(ms).toISOString();
	return { date: iso.slice(0, 10), time: iso.slice(11, 19) };
};

/**
 * Move a booking: the same coach, site and length, any free time. Classes
 * only move to another start of the same weekly series; everything else gets
 * the rack grid. The booking's own time is added back (merged availability
 * counts it as taken).
 */
export function ReschedulePicker({ appt, onMove, pending }: { appt: Appt; onMove: (slot: Record<string, string | null>) => void; pending: boolean }) {
	const now = useNow(60_000);
	const q = new URLSearchParams({ productId: appt.productId });
	if (appt.staffMemberId) q.set('staffMemberId', appt.staffMemberId);
	if (appt.locationId) q.set('locationId', appt.locationId);
	const { data: ranges } = useSWR<FreeRange[]>(`/api/ranges?${q}`, fetcher, { revalidateOnFocus: false });
	const own = Date.parse(appt.from);
	const lenMin = Math.round((Date.parse(appt.to) - own) / 60_000);
	const isClass = Boolean(classKeyForSlug(appt.product?.slug));
	const places = Math.max(1, appt.numberOfAttendees ?? 1);

	const starts = useMemo<RackStart[]>(() => {
		if (!ranges || !now) return [];
		if (isClass) {
			return ranges
				.filter((r) => r.end - r.start >= lenMin * 60_000 && r.maxAttendees - r.attendees >= places && r.start > now.getTime() && r.start !== own)
				.map((r) => {
					const p = localParts(r.start);
					return { start: r.start, end: r.start + lenMin * 60_000, staffMemberId: appt.staffMemberId, left: r.maxAttendees - r.attendees, localDate: p.date, localTime: p.time };
				});
		}
		const mine: FreeRange = { start: own, end: Date.parse(appt.to), attendees: 0, maxAttendees: places, staffMemberIds: appt.staffMemberId ? [appt.staffMemberId] : [] };
		const step = serviceMeta(serviceKeyForSlug(appt.product?.slug))?.startStep ?? (lenMin >= 60 ? 30 : 15);
		return startsFrom([...ranges, mine], { durationMin: lenMin, stepMin: step, now: now.getTime(), places }).filter((s) => s.start !== own);
	}, [ranges, now, isClass, lenMin, places, own, appt.staffMemberId, appt.to, appt.product?.slug]);

	const byDay = useMemo(() => startsByDay(starts), [starts]);
	const today = now ? localParts(now.getTime()).date : null;
	const days = useMemo(() => (today ? localDates(today, siteConfig.policies.bookingWindowDays).map((date) => ({ date, count: byDay[date]?.length ?? 0 })) : []), [today, byDay]);
	const [day, setDay] = useState<string | null>(null);
	const activeDay = day ?? days.find((d) => d.count)?.date ?? null;
	const [pick, setPick] = useState<RackStart | null>(null);

	if (!ranges) return <div className="h-32 animate-pulse bg-chalk-2" aria-busy="true" />;
	if (!starts.length) return <p className="text-muted">No other times free with the same coach and site. Email {siteConfig.contact.email} and we&rsquo;ll sort it.</p>;
	return (
		<div className="space-y-4">
			<RackDays days={days} value={activeDay} onChange={(d) => { setDay(d); setPick(null); }} today={today} />
			{activeDay ? <SlotGrid starts={byDay[activeDay] ?? []} value={pick?.start ?? null} onChange={setPick} showLeft={isClass} /> : null}
			<Button
				size="lg"
				disabled={!pick}
				loading={pending}
				onClick={() => {
					if (!pick) return;
					const a = utc(pick.start);
					const b = utc(pick.end);
					onMove({ productId: appt.productId, fromDate: a.date, fromTime: a.time, toDate: b.date, toTime: b.time, staffMemberId: appt.staffMemberId, locationId: appt.locationId });
				}}
			>
				{pick ? `Move to ${pick.localTime}` : 'Pick a new time'}
			</Button>
		</div>
	);
}
