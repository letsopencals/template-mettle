'use client';

import { useMemo, useState } from 'react';
import Link from 'next/link';
import { clsx } from 'clsx';
import type { Occurrence } from '@/lib/timetable';
import { nextWithSpace } from '@/lib/timetable';
import { classMeta, disciplineMeta, siteConfig } from '@/lib/site-config';
import { formatPrice } from '@/lib/format';
import { longDayLabel, minutesLabel } from '@/lib/when';
import { useAddOns } from '@/hooks/use-add-ons';
import { useLoadBar } from '@/hooks/use-load-bar';
import { PlateTag } from '@/components/brand/plate';
import { Intensity, PlacesMeter } from '@/components/brand/places-meter';
import { Led } from '@/components/brand/led';
import { SafeImage } from '@/components/ui/safe-image';
import { Button } from '@/components/ui/button';
import { CloseButton } from '@/components/ui/overlay';
import { AddOnPicker } from '@/components/booking/add-on-picker';
import type { FloorCoach, FloorSite } from '@/components/floor/types';

/**
 * The session panel, docked under the board (desktop) or in a bottom sheet
 * (phone): who, where, how hard, extras, the price and "Load the bar".
 */
export function SessionPanel({
	occurrence: o,
	all,
	coach,
	site,
	currency,
	onClose,
	onJump,
}: {
	occurrence: Occurrence;
	all: Occurrence[];
	coach: FloorCoach | null;
	site: FloorSite | null;
	currency: string;
	onClose: () => void;
	onJump: (o: Occurrence) => void;
}) {
	const meta = classMeta(o.classKey);
	const d = disciplineMeta(o.discipline);
	const full = o.status === 'full';
	const { addOns, picked, setQuantity, selection, loading } = useAddOns(full ? null : o.seriesSlug);
	const { load, pending, error } = useLoadBar();
	const [people, setPeople] = useState(1);
	const maxPeople = Math.max(1, Math.min(3, o.seatsLeft));
	const next = useMemo(() => (full ? nextWithSpace(o, all) : null), [full, o, all]);
	const extras = selection.reduce((s, x) => s + (addOns.find((a) => a.id === x.addOnId)?.price ?? 0) * x.quantity, 0);
	const total = o.price * people + extras;
	const isEvent = o.kind === 'event';

	return (
		<div className="grid gap-6 lg:grid-cols-12">
			<div className="lg:col-span-5">
				<div className="flex items-start justify-between gap-3">
					<PlateTag plate={o.plate} tone="rubber">
						{isEvent ? 'Event' : d?.label} · {meta?.level ?? o.level}
					</PlateTag>
					<span className="lg:hidden">
						<CloseButton onClick={onClose} tone="rubber" />
					</span>
				</div>
				<h3 className="display mt-2 text-[2.4rem] lg:text-5xl">{o.title}</h3>
				<p className="mono mt-2 flex flex-wrap items-center gap-x-3 text-sm text-chalk/80">
					<Led time={o.localTime} color={full ? 'red' : 'green'} className="text-xl" />
					<span>{longDayLabel(o.start)}</span>
					<span>{minutesLabel(o.minutes)}</span>
				</p>
				{meta?.tagline ? <p className="mt-3 text-chalk/75">{meta.tagline}</p> : null}
				<dl className="mt-4 grid grid-cols-2 gap-3 text-sm">
					<div>
						<dt className="index-label text-chalk/45">Site</dt>
						<dd className="mt-0.5">{site ? (site.online ? 'Mettle Remote (live video)' : site.name) : '—'}</dd>
					</div>
					<div>
						<dt className="index-label text-chalk/45">Intensity</dt>
						<dd className="mt-1.5">
							<Intensity value={o.intensity} tone="rubber" />
						</dd>
					</div>
				</dl>
				{meta?.prerequisite ? <p className="mt-4 border-l-2 border-plate-yellow pl-3 text-sm text-chalk/80">{meta.prerequisite}</p> : null}
			</div>

			<div className="lg:col-span-4">
				{coach ? (
					<Link href={`/coaches/${coach.slug}`} className="flex items-center gap-3 border border-rubber-line p-2.5 hover:border-chalk/40">
						<span className="image-placeholder relative h-14 w-14 shrink-0 overflow-hidden">
							<SafeImage src={coach.image} alt="" fill sizes="56px" className="object-cover grayscale" />
						</span>
						<span>
							<span className="index-label block text-chalk/45">Coach</span>
							<span className="block font-semibold">{coach.name}</span>
							{coach.role ? <span className="block text-xs text-chalk/60">{coach.role}</span> : null}
						</span>
					</Link>
				) : null}
				{full ? null : (
					<div className="mt-4">
						<p className="index-label mb-2 text-chalk/45">Extras</p>
						<AddOnPicker addOns={addOns} picked={picked} onChange={setQuantity} currency={currency} tone="rubber" loading={loading} />
						{!loading && addOns.length === 0 ? <p className="text-sm text-chalk/50">No extras for this one.</p> : null}
					</div>
				)}
				{meta?.whatToBring?.length ? (
					<p className="mt-4 text-xs text-chalk/55">
						<span className="index-label text-chalk/45">Bring </span>
						{meta.whatToBring.join(' · ')}
					</p>
				) : null}
			</div>

			<div className="lg:col-span-3">
				{full ? (
					<div className="hatch-full border border-rubber-line p-4">
						<Led color="red" className="text-2xl">
							FULL
						</Led>
						<p className="mt-2 text-sm text-chalk/75">Every place is taken. The next {o.short} with space:</p>
						{next ? (
							<button type="button" onClick={() => onJump(next)} className="mt-3 w-full border border-chalk/40 px-3 py-2.5 text-left hover:border-chalk">
								<span className="mono block text-sm">
									{longDayLabel(next.start)} · {next.localTime}
								</span>
								<span className="text-xs text-chalk/60">{next.seatsLeft} {next.seatsLeft === 1 ? 'place' : 'places'} left →</span>
							</button>
						) : (
							<p className="mt-2 text-sm text-chalk/60">Nothing in the next four weeks. Try another class.</p>
						)}
					</div>
				) : (
					<div className="border border-rubber-line bg-rubber-2 p-4">
						<PlacesMeter capacity={o.capacity} left={o.seatsLeft} tone="rubber" />
						{maxPeople > 1 ? (
							<div className="mt-4 flex items-center justify-between gap-3">
								<span className="text-sm">Places</span>
								<span className="flex items-center">
									<button type="button" aria-label="One fewer place" disabled={people <= 1} onClick={() => setPeople((p) => p - 1)} className="h-9 w-9 border border-chalk/30 disabled:opacity-30">
										−
									</button>
									<span className="mono w-8 text-center">{people}</span>
									<button type="button" aria-label="One more place" disabled={people >= maxPeople} onClick={() => setPeople((p) => p + 1)} className="h-9 w-9 border border-chalk/30 disabled:opacity-30">
										+
									</button>
								</span>
							</div>
						) : null}
						<div className="mt-4 flex items-baseline justify-between">
							<span className="text-sm text-chalk/60">{people > 1 ? `${people} × ${formatPrice(o.price, currency)}` : 'Drop-in'}</span>
							<span className="display text-4xl">{formatPrice(total, currency)}</span>
						</div>
						{o.offPeak ? <p className="mt-1 text-xs text-plate-yellow">{siteConfig.offPeak.label}: {siteConfig.offPeak.discountLabel}, taken off at checkout.</p> : <p className="mt-1 text-xs text-chalk/50">First order? {siteConfig.introOffer.headline}, at checkout.</p>}
						<Button
							variant="plate"
							size="lg"
							fullWidth
							className="mt-4"
							loading={pending}
							onClick={() =>
								load([
									{
										slot: { productId: o.seriesId, start: o.start, end: o.end, staffMemberId: o.coachId, locationId: o.siteId },
										numberOfAttendees: people,
										addOns: selection,
									},
								])
							}
						>
							Load the bar
						</Button>
						{error ? (
							<p role="alert" className="mt-2 text-sm text-led-red">
								{error}
							</p>
						) : null}
						<p className={clsx('mt-3 text-[0.72rem] text-chalk/45')}>Free to move or cancel up to {siteConfig.policies.cancelHours} hours before.</p>
					</div>
				)}
			</div>
		</div>
	);
}
