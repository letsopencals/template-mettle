import Link from 'next/link';
import type { BookingView } from '@/lib/booking-view';
import { floorHref } from '@/lib/floor-url';
import { buttonClasses } from '@/components/ui/button';
import { CalibrationStrip } from '@/components/brand/calibration-strip';
import { Bib } from '@/components/bib/bib';
import { HeatSheet } from '@/components/bib/heat-sheet';
import { BeforeYouCome } from '@/components/bib/before-you-come';

/** The full confirmation layout, shared by /thank-you and the preview screens. */
export function BibPage({ orderName, name, email, views, total }: { orderName: string | null; name: string | null; email: string | null; views: BookingView[]; total: string | null }) {
	const firstClass = views.find((v) => v.kindLabel === 'Class');
	return (
		<>
			<section className="rubber-texture text-chalk">
				<div className="container-x grid gap-10 pb-16 pt-12 lg:grid-cols-12 lg:items-center">
					<div className="lg:col-span-5">
						<p className="index-label text-chalk/50">
							<span className="text-chalk">Booked /</span> {orderName ?? ''}
						</p>
						<h1 className="display display-xl mt-2">You&rsquo;re in.</h1>
						<p className="mt-4 max-w-md text-chalk/75">
							{views.length} {views.length === 1 ? 'session is' : 'sessions are'} locked in{total ? ` (${total})` : ''}.{email ? ` The confirmation is on its way to ${email}.` : ''} Pin this on.
						</p>
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
