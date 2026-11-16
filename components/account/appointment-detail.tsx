'use client';

import { useState } from 'react';
import Link from 'next/link';
import useSWR, { mutate as globalMutate } from 'swr';
import type { AppointmentDetailResponse } from '@opencals/storefront-sdk';
import { AWAITING_TAG } from '@/lib/checkout-outcome';
import { fetcher } from '@/lib/fetcher';
import { onSessionExpired } from '@/lib/session-expired';
import { toBookingView } from '@/lib/booking-view';
import { changeWindow, policyLine } from '@/lib/change-window';
import { longDayLabel, minutesLabel, timeLabel } from '@/lib/when';
import { useNow } from '@/hooks/use-now';
import { Plate, PlateTag } from '@/components/brand/plate';
import { Led } from '@/components/brand/led';
import { Button, buttonClasses } from '@/components/ui/button';
import { Overlay } from '@/components/ui/overlay';
import { JoinButton } from '@/components/account/join-button';
import { ReschedulePicker } from '@/components/account/reschedule-picker';
import { AccountError, AccountLoading } from '@/components/account/states';
import { BOOKINGS_KEY } from '@/components/log/training-log';

export type DetailAction = 'cancel' | 'reschedule' | 'feedback';

/** One session from the log: the facts, Join for Remote, Move (inline) and Cancel (confirm). */
export function AppointmentDetail({ id, initialAction }: { id: string; initialAction: DetailAction | null }) {
	const key = `/api/account/appointments/${encodeURIComponent(id)}`;
	const { data: appt, error, isLoading, mutate } = useSWR<AppointmentDetailResponse>(key, fetcher, { revalidateOnFocus: false });
	const now = useNow(30_000);
	const [moving, setMoving] = useState(initialAction === 'reschedule');
	const [confirmCancel, setConfirmCancel] = useState(initialAction === 'cancel');
	const [pending, setPending] = useState(false);
	const [message, setMessage] = useState<string | null>(null);

	if (error && !appt) return <AccountError what="this booking" onRetry={() => void mutate()} />;
	if (isLoading || !appt || !now) return <AccountLoading label="Loading the booking" />;
	const v = toBookingView(appt);
	const w = changeWindow(appt, now.getTime());

	const change = async (kind: 'cancel' | 'reschedule', slot?: Record<string, string | null>) => {
		setPending(true);
		setMessage(null);
		try {
			const res = await fetch(`${key}/${kind}`, { method: 'PUT', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(kind === 'reschedule' ? { slot } : {}) });
			if (res.status === 401) return onSessionExpired();
			const body = await res.json().catch(() => null);
			if (!res.ok) throw new Error(body?.error || (kind === 'cancel' ? 'We couldn’t cancel this.' : 'We couldn’t move this.'));
			await mutate(body as AppointmentDetailResponse, { revalidate: true });
			void globalMutate(BOOKINGS_KEY);
			setMoving(false);
			setConfirmCancel(false);
			setMessage(kind === 'cancel' ? 'Cancelled. The place is back on the floor.' : 'Moved. Same coach, new time.');
		} catch (err) {
			setMessage(err instanceof Error ? err.message : 'Something went wrong.');
		} finally {
			setPending(false);
		}
	};

	return (
		<div className="grid gap-10 lg:grid-cols-12">
			<div className="lg:col-span-7">
				<Link href="/account" className="index-label text-muted hover:text-ink">
					← Training log
				</Link>
				<div className="mt-4 flex gap-5 border border-ink/15 bg-chalk-3 p-5">
					<div className="flex w-28 shrink-0 flex-col items-center justify-center bg-rubber py-3 text-chalk">
						<Led time={timeLabel(v.start)} color={v.status === 'canceled' ? 'red' : 'green'} className="text-3xl" />
						<span className="mono mt-1 text-[0.66rem] uppercase text-chalk/60">{minutesLabel(v.minutes)}</span>
					</div>
					<div>
						<PlateTag plate={v.plate}>{v.kindLabel}</PlateTag>
						<h1 className="display mt-1 text-5xl leading-none">{v.title}</h1>
						<p className="mt-2 text-ink-2">{longDayLabel(v.start)}</p>
						<p className="text-sm text-muted">{[v.kindLabel === 'Class' ? null : v.variant, v.coach ? `with ${v.coach}` : null, v.isOnline ? 'Mettle Remote' : v.locationTitle, v.people > 1 ? `${v.people} people` : null].filter(Boolean).join(' · ')}</p>
						{v.address ? <p className="text-sm text-muted">{v.address}</p> : null}
						{v.status === 'canceled' ? <p className="mono mt-2 text-sm text-plate-red">CANCELLED</p> : v.awaiting ? <p className="mono mt-2 text-sm text-plate-red">{AWAITING_TAG[v.awaiting]}</p> : null}
					</div>
				</div>
				{message ? (
					<p role="status" className="mt-4 border-l-4 border-plate-yellow bg-chalk-3 px-4 py-3 text-sm">
						{message}
					</p>
				) : null}
				{v.isOnline && v.status === 'scheduled' ? (
					<div className="mt-4">
						<JoinButton from={appt.from} to={appt.to} url={v.joinUrl} />
					</div>
				) : null}
				{v.status === 'scheduled' && v.start > now.getTime() ? (
					<div className="mt-6">
						<p className="text-sm text-muted">{policyLine(w)}</p>
						<div className="mt-3 flex flex-wrap gap-2">
							{w.reschedule.allowed ? (
								<Button variant={moving ? 'primary' : 'outline'} onClick={() => setMoving((m) => !m)}>
									{moving ? 'Keep this time' : 'Move'}
								</Button>
							) : null}
							{w.cancel.allowed ? (
								<Button variant="outline" onClick={() => setConfirmCancel(true)}>
									Cancel
								</Button>
							) : null}
							<Link href={v.bookAgainHref} className={buttonClasses({ variant: 'ghost' })}>
								Book another
							</Link>
						</div>
						{moving ? (
							<div className="mt-6 border-t-2 border-ink pt-5">
								<h2 className="display mb-4 text-3xl">Pick a new time</h2>
								<ReschedulePicker appt={appt} pending={pending} onMove={(slot) => void change('reschedule', slot)} />
							</div>
						) : null}
					</div>
				) : (
					<Link href={v.bookAgainHref} className={buttonClasses({ className: 'mt-6' })}>
						Book it again
					</Link>
				)}
			</div>
			<aside className="lg:col-span-5">
				{v.whatToBring.length ? (
					<div className="border-l-4 border-ink pl-4">
						<p className="index-label text-muted">Bring</p>
						<p className="mt-1">{v.whatToBring.join(' · ')}</p>
					</div>
				) : null}
				{v.transit ? (
					<div className="mt-6 border-l-4 border-ink pl-4">
						<p className="index-label text-muted">Getting there</p>
						<p className="mt-1 text-sm">{v.transit}</p>
					</div>
				) : null}
				{appt.addOns?.length ? (
					<div className="mt-6 border-l-4 border-ink pl-4">
						<p className="index-label text-muted">Extras</p>
						<ul className="mt-1 text-sm">
							{appt.addOns.map((a) => (
								<li key={a.id} className="flex items-center gap-2">
									<Plate plate="steel" size="xs" />
									{a.addOn?.title}
									{a.quantity > 1 ? ` ×${a.quantity}` : ''}
								</li>
							))}
						</ul>
					</div>
				) : null}
			</aside>
			<Overlay open={confirmCancel} onClose={() => setConfirmCancel(false)} kind="sheet" label="Cancel this session" className="p-6">
				<h2 className="display text-4xl">Cancel {v.title}?</h2>
				<p className="mt-2 text-muted">
					{longDayLabel(v.start)} at {timeLabel(v.start)}. The place goes back on the floor. Refunds follow the gym&rsquo;s policy and go back to how you paid.
				</p>
				<div className="mt-6 flex gap-2">
					<Button variant="primary" loading={pending} onClick={() => void change('cancel')}>
						Yes, cancel
					</Button>
					<Button variant="outline" onClick={() => setConfirmCancel(false)}>
						Keep it
					</Button>
				</div>
			</Overlay>
		</div>
	);
}
