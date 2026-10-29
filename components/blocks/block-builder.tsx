'use client';

import { useMemo, useState } from 'react';
import { clsx } from 'clsx';
import type { Occurrence } from '@/lib/timetable';
import type { RackStart } from '@/lib/rack';
import { priceFor } from '@/lib/rack';
import { progressFor } from '@/lib/bar';
import { formatPrice } from '@/lib/format';
import { dayLabel, timeLabel } from '@/lib/when';
import { siteConfig, type TrainingBlock } from '@/lib/site-config';
import { useSettings } from '@/contexts/settings-context';
import { useLoadBar, type LoadRequest } from '@/hooks/use-load-bar';
import { Barbell } from '@/components/bar/barbell';
import { BarNudge } from '@/components/bar/bar-nudge';
import { Button } from '@/components/ui/button';
import { Plate } from '@/components/brand/plate';
import { Led } from '@/components/brand/led';
import { ServicePick, blockLength } from '@/components/blocks/service-pick';
import type { RackOffering } from '@/components/rack/types';

interface Pick {
	key: string;
	line: number;
	label: string;
	plate: TrainingBlock['plate'];
	price: number;
	start: number;
	request: LoadRequest;
}

/**
 * A Training Block: fill each line (classes from the next fortnight, service
 * times from the rack), watch the bar load, then book every session in one
 * order so the store's threshold discount applies.
 */
export function BlockBuilder({ block, classes, services, siteNames }: { block: TrainingBlock; classes: Occurrence[]; services: Record<string, RackOffering>; siteNames: Record<string, string> }) {
	const { currency } = useSettings();
	const { load, pending, error } = useLoadBar();
	const [picks, setPicks] = useState<Pick[]>([]);
	const [openLine, setOpenLine] = useState(0);
	const countOn = (line: number) => picks.filter((p) => p.line === line).length;
	const total = picks.reduce((s, p) => s + p.price, 0);
	const progress = progressFor(total);
	const plates = picks.slice().sort((a, b) => a.start - b.start).map((p) => ({ key: p.key, plate: p.plate, discipline: '', label: p.label }));
	const complete = block.lines.every((l, i) => countOn(i) >= l.count);

	const add = (line: number, p: Omit<Pick, 'line'>) => {
		setPicks((prev) => {
			const next = [...prev, { ...p, line }];
			const l = block.lines[line]!;
			if (next.filter((x) => x.line === line).length >= l.count) {
				const nextOpen = block.lines.findIndex((ll, i) => next.filter((x) => x.line === i).length < ll.count);
				setOpenLine(nextOpen);
			}
			return next;
		});
	};

	return (
		<div className="grid gap-10 lg:grid-cols-12">
			<ol className="space-y-4 lg:col-span-7">
				{block.lines.map((line, i) => {
					const have = countOn(i);
					const done = have >= line.count;
					const open = openLine === i && !done;
					const offering = line.pick.type === 'service' ? services[line.pick.serviceKey] : null;
					const options = line.pick.type === 'class' ? classes.filter((o) => (line.pick.type === 'class' ? line.pick.disciplines.includes(o.discipline) : false) && !picks.some((p) => p.key === o.key)) : [];
					return (
						<li key={i} className={clsx('border', open ? 'border-ink bg-chalk-3' : 'border-ink/15')}>
							<button type="button" onClick={() => setOpenLine(i)} className="flex w-full items-center justify-between gap-4 p-4 text-left">
								<span className="flex items-center gap-3">
									<span className="mono text-sm text-muted">{String(i + 1).padStart(2, '0')}</span>
									<span className="display text-3xl">
										{line.count} × {line.label}
									</span>
								</span>
								<Led color={done ? 'green' : 'amber'} className="text-lg">
									{have}/{line.count}
								</Led>
							</button>
							{picks.filter((p) => p.line === i).length ? (
								<ul className="flex flex-wrap gap-1.5 px-4 pb-3">
									{picks
										.filter((p) => p.line === i)
										.map((p) => (
											<li key={p.key} className="flex items-center gap-2 bg-ink py-1 pl-2 pr-1 text-xs text-chalk">
												<span className="mono">
													{dayLabel(p.start)} {timeLabel(p.start)}
												</span>
												<button type="button" aria-label={`Remove ${p.label} ${dayLabel(p.start)}`} onClick={() => setPicks((prev) => prev.filter((x) => x.key !== p.key))} className="px-1.5 text-chalk/60 hover:text-chalk">
													✕
												</button>
											</li>
										))}
								</ul>
							) : null}
							{open ? (
								<div className="border-t border-ink/10 p-4">
									{line.pick.type === 'class' ? (
										options.length ? (
											<ul className="max-h-80 divide-y divide-ink/10 overflow-y-auto">
												{options.slice(0, 40).map((o) => (
													<li key={o.key}>
														<button
															type="button"
															onClick={() =>
																add(i, {
																	key: o.key,
																	label: o.short,
																	plate: o.plate,
																	price: o.price,
																	start: Date.parse(o.start),
																	request: { slot: { productId: o.seriesId, start: o.start, end: o.end, staffMemberId: o.coachId, locationId: o.siteId } },
																})
															}
															className="grid w-full grid-cols-[7.5rem_minmax(0,1fr)_auto] items-center gap-3 py-2 text-left hover:bg-chalk-2"
														>
															<span className="mono text-sm">
																{dayLabel(o.start)} {o.localTime}
															</span>
															<span className="flex min-w-0 items-center gap-2">
																<Plate plate={o.plate} size="xs" />
																<span className="truncate font-semibold">{o.short}</span>
																<span className="truncate text-xs text-muted">{o.siteKey ? siteNames[o.siteKey] : ''}</span>
															</span>
															<span className="mono text-xs text-muted">{o.seatsLeft} left · Add</span>
														</button>
													</li>
												))}
											</ul>
										) : (
											<p className="text-muted">No open classes for this line in the next two weeks.</p>
										)
									) : offering ? (
										<ServicePick
											offering={offering}
											taken={picks.map((p) => p.start)}
											onPick={(s: RackStart) => {
												const series = offering.series[0]!;
												const len = blockLength(offering);
												add(i, {
													key: `${series.id}@${s.start}`,
													label: offering.short,
													plate: offering.plate,
													price: priceFor(series.price, series.durationMin, len),
													start: s.start,
													request: { slot: { productId: series.id, start: s.start, end: s.end, staffMemberId: s.staffMemberId, locationId: series.siteIds[0] ?? null }, people: offering.people > 1 ? offering.people : undefined },
												});
											}}
										/>
									) : (
										<p className="text-muted">This service isn&rsquo;t on sale right now.</p>
									)}
								</div>
							) : null}
						</li>
					);
				})}
			</ol>
			<aside className="lg:col-span-5">
				<div className="rubber-texture sticky top-24 p-5 text-chalk">
					<p className="index-label text-chalk/50">{block.name}</p>
					<Barbell plates={plates} progress={progress} currency={currency} size="sm" tone="rubber" className="mt-2" />
					<BarNudge progress={progress} currency={currency} tone="rubber" />
					<div className="mt-4 flex items-baseline justify-between border-t border-chalk/15 pt-3">
						<span className="text-sm text-chalk/60">Before offers</span>
						<span className="display text-4xl">{formatPrice(total, currency)}</span>
					</div>
					<p className="mt-1 text-xs text-chalk/50">The bar shows the final price: each session gets its biggest offer (first order, Midday shift or the block).</p>
					<Button variant="plate" size="lg" fullWidth className="mt-4" disabled={!complete} loading={pending} onClick={() => void load(picks.slice().sort((a, b) => a.start - b.start).map((p) => p.request))}>
						{complete ? `Load the block · ${picks.length} sessions` : `Fill every line (${picks.length}/${block.lines.reduce((s, l) => s + l.count, 0)})`}
					</Button>
					{error ? (
						<p role="alert" className="mt-2 text-sm text-led-red">
							{error}
						</p>
					) : null}
					<p className="mt-3 text-[0.72rem] text-chalk/45">Thresholds: {siteConfig.blockThresholds.map((t) => `${formatPrice(t.amount, currency)} → ${t.percent}%`).join(' · ')}</p>
				</div>
			</aside>
		</div>
	);
}
