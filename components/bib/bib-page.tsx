import type { ReactNode } from 'react';
import Link from 'next/link';
import type { Awaiting } from '@/lib/checkout-outcome';
import type { BookingView } from '@/lib/booking-view';
import { floorHref } from '@/lib/floor-url';
import { buttonClasses } from '@/components/ui/button';
import { CalibrationStrip } from '@/components/brand/calibration-strip';
import { Bib } from '@/components/bib/bib';
import { HeatSheet } from '@/components/bib/heat-sheet';
import { BeforeYouCome } from '@/components/bib/before-you-come';

const HEAD: Record<'confirmed' | NonNullable<Awaiting>, { label: string; title: string }> = {
	confirmed: { label: 'Booked', title: 'You’re in.' },
	awaiting_payment: { label: 'Held', title: 'Places held.' },
	awaiting_approval: { label: 'Requested', title: 'Request in.' },
};

function lede(awaiting: Awaiting, count: number, total: string | null, email: string | null): string {
	const sessions = count === 1 ? 'session is' : 'sessions are';
	const sum = total ? ` (${total})` : '';
	if (awaiting === 'awaiting_payment') return `${count} ${sessions} held for you${sum}, awaiting payment. They lock in once it lands.${email ? ` Details are on their way to ${email}.` : ''}`;
	if (awaiting === 'awaiting_approval') return `${count} ${sessions} waiting for the club to confirm${sum}. We email ${email ?? 'you'} as soon as a coach signs it off.`;
	return `${count} ${sessions} locked in${sum}.${email ? ` The confirmation is on its way to ${email}.` : ''} Pin this on.`;
}

/**
 * The full confirmation layout, shared by /thank-you and the preview screens.
 * `awaiting` is set only for a booking that is pending with a reason (payment
 * or the club's approval); everything else prints as booked.
 */
export function BibPage({
	orderName,
	name,
	email,
	views,
	total,
	awaiting = null,
	paySlip = null,
}: {
	orderName: string | null;
	name: string | null;
	email: string | null;
	views: BookingView[];
	total: string | null;
	awaiting?: Awaiting;
	paySlip?: ReactNode;
}) {
	const firstClass = views.find((v) => v.kindLabel === 'Class');
	const head = HEAD[awaiting ?? 'confirmed'];
	return (
		<>
			<section className="rubber-texture text-chalk">
				<div className="container-x grid gap-10 pb-16 pt-12 lg:grid-cols-12 lg:items-center">
					<div className="lg:col-span-5">
						<p className="index-label text-chalk/50">
							<span className="text-chalk">{head.label} /</span> {orderName ?? ''}
						</p>
						<h1 className="display display-xl mt-2">{head.title}</h1>
						<p className="mt-4 max-w-md text-chalk/75">{lede(awaiting, views.length, total, email)}</p>
						{paySlip}
						<div className="mt-6 flex flex-wrap gap-2">
							<Link href="/account" className={buttonClasses({ variant: 'chalk', size: 'lg' })}>
								Training log
							</Link>
							<Link href="/blocks" className={buttonClasses({ variant: 'outline-chalk', size: 'lg' })}>
								Build a block
							</Link>
						</div>
					</div>
					<div className="py-6 lg:col-span-7">
						<Bib orderName={orderName} name={name} views={views} />
					</div>
				</div>
				<CalibrationStrip />
			</section>
			<section className="chalk-texture py-14">
				<div className="container-x grid gap-14 lg:grid-cols-12">
					<HeatSheet views={views} className="lg:col-span-7" />
					<div className="lg:col-span-5">
						<BeforeYouCome views={views} />
						{firstClass?.offeringKey ? (
							<div className="mt-10 bg-rubber p-5 text-chalk">
								<p className="index-label text-chalk/50">Same time next week?</p>
								<p className="display mt-1 text-2xl">{firstClass.title} runs every week.</p>
								<Link href={floorHref({ class: firstClass.offeringKey })} className={buttonClasses({ variant: 'plate', className: 'mt-4' })}>
									See the next ones
								</Link>
							</div>
						) : null}
					</div>
				</div>
			</section>
		</>
	);
}
