'use client';

import { useMemo, useState } from 'react';
import useSWR from 'swr';
import { clsx } from 'clsx';
import { fetcher } from '@/lib/fetcher';
import { lengthsFor, priceFor, startsByDay, startsFrom, type FreeRange, type RackStart } from '@/lib/rack';
import { localDates, localParts } from '@/lib/timetable';
import { formatPrice } from '@/lib/format';
import { longDayLabel, minutesLabel, timeLabel } from '@/lib/when';
import { siteConfig } from '@/lib/site-config';
import { useSettings } from '@/contexts/settings-context';
import { useNow } from '@/hooks/use-now';
import { useAddOns } from '@/hooks/use-add-ons';
import { useLoadBar } from '@/hooks/use-load-bar';
import { Segmented } from '@/components/ui/segmented';
import { Button } from '@/components/ui/button';
import { SafeImage } from '@/components/ui/safe-image';
import { Plate } from '@/components/brand/plate';
import { AddOnPicker } from '@/components/booking/add-on-picker';
import { RackDays } from '@/components/rack/rack-days';
import { SlotGrid } from '@/components/rack/slot-grid';
import type { RackCoach, RackOffering, RackSite } from '@/components/rack/types';

const ANY = 'any';

function Step({ n, title, children, aside }: { n: string; title: string; children: React.ReactNode; aside?: React.ReactNode }) {
	return (
		<section className="border-t border-ink/15 pt-4">
			<div className="mb-3 flex items-baseline justify-between gap-3">
				<h3 className="index-label text-ink">
					<span className="text-muted">{n} </span>
					{title}
				</h3>
				{aside}
			</div>
			{children}
		</section>
	);
}

/**
 * The Slot rack: pick the option (tier, suite, length…), the coach and the
 * site as plain segmented buttons, then a day and a time. Free windows load
 * once per (service, coach, site) and every day and start is derived from them.
 * The summary with the price and "Load the bar" sits beside the slots on
 * desktop and is pinned to the bottom on phones.
 */
export function SlotRack({
	offering,
	coaches,
	sites,
	initialCoach,
}: {
	offering: RackOffering;
	coaches: Record<string, RackCoach>;
	sites: Record<string, RackSite>;
	initialCoach?: string | null;
}) {
	const { currency } = useSettings();
	const now = useNow(60_000);
	// Options in price order (Coach, Senior, Head), not the API's slug order.
	const options = useMemo(() => [...offering.series].sort((a, b) => a.price - b.price), [offering.series]);
	const [seriesId, setSeriesId] = useState(options[0]?.id ?? '');
	const series = offering.series.find((s) => s.id === seriesId) ?? offering.series[0]!;

	const coachChoices = useMemo(() => series.coachIds.map((id) => coaches[id]).filter((c): c is RackCoach => Boolean(c)), [series, coaches]);
	const initialCoachId = coachChoices.find((c) => c.slug === initialCoach)?.id ?? null;
	const [coachId, setCoachId] = useState<string>(initialCoachId ?? ANY);
	const coach = coachId === ANY ? null : (coaches[coachId] ?? null);

	const siteChoices = useMemo(() => series.siteIds.map((id) => sites[id]).filter((s): s is RackSite => Boolean(s)).filter((s) => !coach || coach.siteIds.includes(s.id)), [series, sites, coach]);
	const [siteIdRaw, setSiteId] = useState<string | null>(null);
	const siteId = siteChoices.some((s) => s.id === siteIdRaw) ? siteIdRaw! : (siteChoices[0]?.id ?? null);

	const lengths = series.allowCustomDuration ? lengthsFor(series.durationMin, series.maxDurationMin, offering.lengths ?? undefined) : [series.durationMin];
	const [lengthRaw, setLength] = useState<number | null>(null);
	const length = lengthRaw && lengths.includes(lengthRaw) ? lengthRaw : lengths.includes(60) ? 60 : lengths[0]!;

	const q = new URLSearchParams({ productId: series.id });
	if (coach) q.set('staffMemberId', coach.id);
	if (siteId && (siteChoices.length > 1 || coach)) q.set('locationId', siteId);
	const { data: ranges, isLoading, error: rangesError } = useSWR<FreeRange[]>(`/api/ranges?${q}`, fetcher, { revalidateOnFocus: false, keepPreviousData: true });

	const starts = useMemo(
		() => (ranges && now ? startsFrom(ranges, { durationMin: length, stepMin: offering.stepMin, now: now.getTime(), advanceSeconds: series.advanceSeconds, places: 1 }) : []),
		[ranges, now, length, offering.stepMin, series.advanceSeconds],
	);
	const byDay = useMemo(() => startsByDay(starts), [starts]);
	const today = now ? localParts(now.getTime()).date : null;
	const days = useMemo(() => (today ? localDates(today, 21).map((date) => ({ date, count: byDay[date]?.length ?? 0 })) : []), [today, byDay]);
	const firstOpen = days.find((d) => d.count > 0)?.date ?? null;
	const [dayRaw, setDay] = useState<string | null>(null);
	const day = dayRaw && days.some((d) => d.date === dayRaw) ? dayRaw : firstOpen;
	const [picked, setPicked] = useState<RackStart | null>(null);
	const pick = picked && byDay[picked.localDate]?.some((s) => s.start === picked.start) ? picked : null;

	const { addOns, picked: addOnPicks, setQuantity, selection, loading: addOnsLoading } = useAddOns(series.slug);
	const { load, pending, error } = useLoadBar();

	const base = priceFor(series.price, series.durationMin, length);
	const extras = selection.reduce((s, x) => s + (addOns.find((a) => a.id === x.addOnId)?.price ?? 0) * x.quantity, 0);
	const total = base + extras;
	const site = siteId ? sites[siteId] : null;
	const pickCoach = pick?.staffMemberId ? (coaches[pick.staffMemberId] ?? null) : coach;
	const capacity = series.capacity > 1;

	const book = () => {
		if (!pick) return;
		void load([
			{
				slot: { productId: series.id, start: pick.start, end: pick.end, staffMemberId: coach?.id ?? pick.staffMemberId, locationId: siteId },
				addOns: selection,
				people: offering.people > 1 ? offering.people : undefined,
			},
		]);
	};

	const summary = (
		<div className="rubber-texture p-5 text-chalk">
			<div className="flex items-center gap-3">
				<Plate plate={offering.plate} size="md" />
				<div>
					<p className="display text-2xl leading-none">{offering.short}</p>
					<p className="mono mt-1 text-xs text-chalk/60">
						{[series.label, minutesLabel(length), offering.people > 1 ? `${offering.people} people` : null].filter(Boolean).join(' · ')}
					</p>
				</div>
			</div>
			<dl className="mt-4 space-y-1.5 text-sm">
				<div className="flex justify-between gap-3">
					<dt className="text-chalk/50">When</dt>
					<dd className="mono text-right">{pick ? `${longDayLabel(pick.start)} · ${timeLabel(pick.start)}` : 'Pick a time'}</dd>
				</div>
				{coachChoices.length ? (
					<div className="flex justify-between gap-3">
						<dt className="text-chalk/50">Coach</dt>
						<dd className="text-right">{pickCoach?.name ?? 'First free coach'}</dd>
					</div>
				) : null}
				<div className="flex justify-between gap-3">
					<dt className="text-chalk/50">Where</dt>
					<dd className="text-right">{site ? (site.online ? 'Mettle Remote (video)' : site.name) : '—'}</dd>
				</div>
			</dl>
			<div className="mt-4 flex items-baseline justify-between border-t border-chalk/15 pt-3">
				<span className="text-sm text-chalk/60">{series.allowCustomDuration && length !== series.durationMin ? `${length / series.durationMin} × ${formatPrice(series.price, currency)}` : 'Price'}</span>
				<span className="display text-4xl">{formatPrice(total, currency)}</span>
			</div>
			<Button variant="plate" size="lg" fullWidth className="mt-4" disabled={!pick} loading={pending} onClick={book}>
				{pick ? 'Load the bar' : 'Pick a time first'}
			</Button>
			{error ? (
				<p role="alert" className="mt-2 text-sm text-led-red">
					{error}
				</p>
			) : null}
			<p className="mt-3 text-[0.72rem] text-chalk/45">Free to move or cancel up to {siteConfig.policies.cancelHours} hours before.</p>
		</div>
	);

	return (
		<div className="grid gap-8 lg:grid-cols-12">
			<div className="space-y-6 lg:col-span-8">
				{offering.series.length > 1 ? (
					<Step n="A" title="Option">
						<Segmented
							label="Option"
							value={series.id}
							onChange={(v) => {
								setSeriesId(v);
								setPicked(null);
							}}
							options={options.map((s) => ({ value: s.id, label: s.label || offering.short, sub: `${formatPrice(s.price, currency)}${s.allowCustomDuration ? ` / ${s.durationMin} min` : ''}` }))}
						/>
					</Step>
				) : null}
				{coachChoices.length > 1 ? (
					<Step n="B" title="Coach">
						<div role="radiogroup" aria-label="Coach" className="flex flex-wrap gap-1.5">
							{[null, ...coachChoices].map((c) => {
								const on = (c?.id ?? ANY) === coachId;
								return (
									<button
										key={c?.id ?? ANY}
										type="button"
										role="radio"
										aria-checked={on}
										onClick={() => {
											setCoachId(c?.id ?? ANY);
											setPicked(null);
										}}
										className={clsx('flex min-h-14 items-center gap-2.5 rounded-[2px] border py-1.5 pl-1.5 pr-3.5 text-left', on ? 'border-ink bg-ink text-chalk' : 'border-chalk-line bg-chalk-3 hover:border-ink')}
									>
										<span className="image-placeholder relative h-10 w-10 shrink-0 overflow-hidden">
											{c ? <SafeImage src={c.image} alt="" fill sizes="40px" className="object-cover grayscale" /> : <span className="display flex h-full items-center justify-center text-lg text-chalk">ANY</span>}
										</span>
										<span>
											<span className="block text-sm font-semibold leading-tight">{c?.name ?? 'Any coach'}</span>
											<span className={clsx('block text-[0.7rem]', on ? 'text-chalk/60' : 'text-muted')}>{c ? (c.role ?? '') : 'First one free'}</span>
										</span>
									</button>
								);
							})}
						</div>
					</Step>
				) : null}
				{siteChoices.length > 1 || lengths.length > 1 ? (
					<div className="grid gap-6 sm:grid-cols-2">
						{siteChoices.length > 1 ? (
							<Step n="C" title="Site">
								<Segmented
									label="Site"
									value={siteId}
									onChange={(v) => {
										setSiteId(v);
										setPicked(null);
									}}
									options={siteChoices.map((s) => ({ value: s.id, label: s.name, sub: s.nickname }))}
								/>
							</Step>
						) : null}
						{lengths.length > 1 ? (
							<Step n="D" title="Length">
								<Segmented
									label="Length"
									value={String(length)}
									onChange={(v) => {
										setLength(Number(v));
										setPicked(null);
									}}
									options={lengths.map((l) => ({ value: String(l), label: minutesLabel(l), sub: formatPrice(priceFor(series.price, series.durationMin, l), currency) }))}
								/>
							</Step>
						) : null}
					</div>
				) : null}
				<Step n="E" title="Day & time" aside={isLoading ? <span className="mono text-xs text-muted">Loading times…</span> : null}>
					{rangesError ? <p className="text-sm text-plate-red">Times didn&rsquo;t load. Refresh to try again.</p> : null}
					{!rangesError && ranges && !firstOpen ? <p className="border border-dashed border-ink/20 px-4 py-6 text-center text-muted">Nothing free in the next three weeks{coach ? ` with ${coach.firstName}. Try any coach.` : '.'}</p> : null}
					{days.length ? (
						<>
							<RackDays
								days={days}
								loading={isLoading && !ranges}
								value={day}
								today={today}
								onChange={(d) => {
									setDay(d);
									setPicked(null);
								}}
							/>
							<div className="mt-3">{day ? <SlotGrid starts={byDay[day] ?? []} value={pick?.start ?? null} onChange={setPicked} showLeft={capacity} /> : null}</div>
						</>
					) : (
						<div className="h-40 animate-pulse bg-chalk-2" />
					)}
				</Step>
				{addOns.length || addOnsLoading ? (
					<Step n="F" title="Extras">
						<AddOnPicker addOns={addOns} picked={addOnPicks} onChange={setQuantity} currency={currency} loading={addOnsLoading} />
					</Step>
				) : null}
			</div>
			<aside className="hidden lg:col-span-4 lg:block">
				<div className="sticky top-24">{summary}</div>
			</aside>
			{/* Phone: the total and the action pinned to the bottom. */}
			<div className="sticky bottom-0 z-30 -mx-4 border-t-4 border-plate-yellow bg-rubber px-4 py-3 text-chalk lg:hidden">
				<div className="flex items-center gap-3">
					<div className="min-w-0 flex-1">
						<p className="mono truncate text-xs text-chalk/60">{pick ? `${longDayLabel(pick.start)} · ${timeLabel(pick.start)}` : `${offering.short} · ${minutesLabel(length)}`}</p>
						<p className="display text-3xl leading-none">{formatPrice(total, currency)}</p>
					</div>
					<Button variant="plate" size="md" disabled={!pick} loading={pending} onClick={book}>
						{pick ? 'Load the bar' : 'Pick a time'}
					</Button>
				</div>
				{error ? (
					<p role="alert" className="mt-1 text-xs text-led-red">
						{error}
					</p>
				) : null}
			</div>
		</div>
	);
}
