'use client';

import { useMemo } from 'react';
import Link from 'next/link';
import useSWR from 'swr';
import { clsx } from 'clsx';
import { useSession } from 'next-auth/react';
import type { AppointmentListItemResponse } from '@opencals/storefront-sdk';
import { fetcher } from '@/lib/fetcher';
import { toBookingView, type BookingView } from '@/lib/booking-view';
import { byWeek, plateCounts, splitLog, weekStreak } from '@/lib/log';
import { dayLabel, localDateParts, minutesLabel, timeLabel } from '@/lib/when';
import { useNow } from '@/hooks/use-now';
import { Plate } from '@/components/brand/plate';
import { Led } from '@/components/brand/led';
import { buttonClasses } from '@/components/ui/button';
import { PlateStack } from '@/components/log/plate-stack';
import { JoinButton } from '@/components/account/join-button';
import { AccountError, AccountLoading } from '@/components/account/states';
import { AWAITING_TAG } from '@/lib/checkout-outcome';

export const BOOKINGS_KEY = '/api/account/appointments?take=100&orderBy=from&order=DESC';

/**
 * The Training log: up next (with Join / Manage), the plate stack of finished
 * sessions, and every session in a ruled log by week.
 */
export function TrainingLog() {
	const { data: session } = useSession();
	const { data, error, isLoading, mutate } = useSWR<{ data: AppointmentListItemResponse[] }>(BOOKINGS_KEY, fetcher, { revalidateOnFocus: false });
	const views = useMemo(() => (data?.data ?? []).map((a) => toBookingView(a)), [data]);
	if (error && !data) return <div className="container-x py-10"><AccountError what="your log" onRetry={() => void mutate()} /></div>;
	return <TrainingLogView views={views} loading={isLoading} name={session?.customer?.firstName ?? null} />;
}

/** The log itself, from booking views (also used by the preview screens). */
export function TrainingLogView({ views, loading, name }: { views: BookingView[]; loading: boolean; name: string | null }) {
	const now = useNow(60_000);
	const split = useMemo(() => (now ? splitLog(views, now.getTime()) : null), [views, now]);
	const counts = useMemo(() => (split ? plateCounts(split.done) : []), [split]);
	const weeks = useMemo(() => (split ? byWeek([...split.upcoming].reverse().concat(split.done)) : []), [split]);
	const streak = split && now ? weekStreak(split.done, now.getTime()) : 0;

	return (
		<>
			<section className="rubber-texture text-chalk">
				<div className="container-x grid gap-10 pb-12 pt-8 lg:grid-cols-12">
					<div className="lg:col-span-5">
						<h1 className="display display-lg">{name ? `${name}'s log` : 'Training log'}</h1>
						<dl className="mt-6 grid grid-cols-3 gap-3">
							{[
								['Done', split?.done.length ?? 0],
								['Up next', split?.upcoming.length ?? 0],
								['Week streak', streak],
							].map(([k, n]) => (
								<div key={k as string} className="border border-rubber-line bg-black/30 p-3">
									<dt className="index-label text-chalk/50">{k}</dt>
									<dd>
										<Led color="green" className="text-3xl">
											{String(n).padStart(2, '0')}
										</Led>
									</dd>
								</div>
							))}
						</dl>
					</div>
					<div className="lg:col-span-7">
						<p className="index-label mb-3 text-chalk/50">Plates on the bar so far</p>
						<PlateStack counts={counts} />
					</div>
				</div>
			</section>

			<section className="container-x py-12">
				{loading || !split ? (
					<AccountLoading label="Loading your log" />
				) : (
					<div className="grid gap-12 lg:grid-cols-12">
						<div className="lg:col-span-5">
							<h2 className="display text-4xl">Up next</h2>
							{split.upcoming.length === 0 ? (
								<div className="mt-4 border border-dashed border-ink/25 p-6">
									<p>Nothing booked. The bar is waiting.</p>
									<Link href="/schedule" className={buttonClasses({ className: 'mt-4' })}>
										Find a session
									</Link>
								</div>
							) : (
								<ul className="mt-4 space-y-3">
									{split.upcoming.slice(0, 5).map((v) => (
										<li key={v.id} className="flex gap-4 border border-ink/15 bg-chalk-3 p-4">
											<div className="flex w-20 shrink-0 flex-col items-center justify-center bg-rubber py-2 text-chalk">
												<span className="mono text-[0.66rem] uppercase text-chalk/60">{dayLabel(v.start)}</span>
												<Led time={timeLabel(v.start)} color="green" className="text-xl" />
											</div>
											<div className="min-w-0 flex-1">
												<p className="flex items-center gap-2 font-semibold">
													<Plate plate={v.plate} size="xs" />
													{v.title}
												</p>
												<p className="text-sm text-muted">{[minutesLabel(v.minutes), v.coachFirstName ? `with ${v.coachFirstName}` : null, v.isOnline ? 'Remote' : v.locationTitle].filter(Boolean).join(' · ')}</p>
												{v.awaiting ? <p className="mono mt-1 text-xs text-plate-red">{AWAITING_TAG[v.awaiting]}</p> : null}
												<div className="mt-2 flex flex-wrap items-center gap-3">
													{v.isOnline ? <JoinButton from={new Date(v.start).toISOString()} to={new Date(v.end).toISOString()} url={v.joinUrl} /> : null}
													<Link href={`/account/appointments/${v.id}`} className="index-label underline underline-offset-4">
														Move or cancel
													</Link>
												</div>
											</div>
										</li>
									))}
								</ul>
							)}
						</div>
						<div className="lg:col-span-7">
							<h2 className="display text-4xl">The log</h2>
							{weeks.length === 0 ? <p className="mt-4 text-muted">Your sessions will be written here.</p> : null}
							<div className="mt-4 space-y-8">
								{weeks.map((w) => (
									<div key={w.week}>
										<p className="index-label border-b-2 border-ink pb-1">Week of {localDateParts(w.week).day} {localDateParts(w.week).month}</p>
										<table className="log-ruled w-full text-sm">
											<thead className="sr-only">
												<tr>
													<th>When</th>
													<th>Session</th>
													<th>Coach</th>
													<th>Status</th>
												</tr>
											</thead>
											<tbody>
												{w.items.map((v) => {
													const upcoming = now ? v.start > now.getTime() : false;
													return (
														<tr key={v.id} className="h-11">
															<td className="mono w-40 whitespace-nowrap pr-3 text-muted">
																{dayLabel(v.start)} {timeLabel(v.start)}
															</td>
															<td>
																<Link href={`/account/appointments/${v.id}`} className="flex items-center gap-2 font-semibold hover:underline">
																	<Plate plate={v.plate} size="xs" />
																	<span className="truncate">{v.title}</span>
																</Link>
															</td>
															<td className="hidden text-muted sm:table-cell">{v.coachFirstName ?? '—'}</td>
															<td className={clsx('mono w-20 text-right text-xs', v.awaiting ? 'text-plate-red' : upcoming ? 'text-plate-blue' : 'text-plate-green')}>{v.awaiting ? (v.awaiting === 'awaiting_payment' ? 'TO PAY' : 'TO CONFIRM') : upcoming ? 'NEXT' : 'DONE ✓'}</td>
														</tr>
													);
												})}
											</tbody>
										</table>
									</div>
								))}
							</div>
						</div>
					</div>
				)}
			</section>
		</>
	);
}
