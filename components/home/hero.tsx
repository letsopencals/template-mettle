import Link from 'next/link';
import type { Occurrence } from '@/lib/timetable';
import { floorHref } from '@/lib/floor-url';
import { siteConfig } from '@/lib/site-config';
import { buttonClasses } from '@/components/ui/button';
import { Led } from '@/components/brand/led';
import { Plate } from '@/components/brand/plate';
import { HeroVideo } from '@/components/home/hero-video';

/**
 * Rubber hero: the lockup on the left, the "On the floor" interval board on
 * the right (the next sessions with places), over the gym video.
 */
export function Hero({ next, coachNames }: { next: Occurrence[]; coachNames: Record<string, string> }) {
	return (
		<section className="relative overflow-hidden bg-rubber text-chalk">
			<div aria-hidden className="absolute inset-0">
				<HeroVideo src={siteConfig.media.heroVideo} poster={siteConfig.media.heroPoster} />
				<div className="absolute inset-0 bg-[linear-gradient(90deg,rgba(18,18,18,0.94)_0%,rgba(18,18,18,0.72)_48%,rgba(18,18,18,0.35)_100%)]" />
			</div>
			<div className="container-x relative grid gap-12 pb-16 pt-14 md:pt-20 lg:grid-cols-12 lg:items-end lg:pb-20">
				<div className="lg:col-span-7">
					<p className="index-label text-chalk/60">
						Collingwood · Cremorne · Remote <span className="text-plate-red">●</span> Melbourne
					</p>
					<h1 className="display mt-4 text-[clamp(4.2rem,13vw,12.5rem)] leading-[0.8]">
						Built
						<br />
						with
						<br />
						<span className="text-plate-yellow">mettle.</span>
					</h1>
					<p className="mt-6 max-w-xl text-lg text-chalk/80">
						Barbell, boxing, conditioning and the slow stuff that keeps you training. Coaches who know your name, a contrast suite where the boiler room used to be, and a lab to prove it&rsquo;s working.
					</p>
					<div className="mt-8 flex flex-wrap gap-2">
						<Link href="/schedule" className={buttonClasses({ variant: 'plate', size: 'lg' })}>
							See today&rsquo;s floor
						</Link>
						<Link href={`/lab?service=${siteConfig.introService}`} className={buttonClasses({ variant: 'outline-chalk', size: 'lg' })}>
							Free First Round
						</Link>
					</div>
				</div>
				<div className="lg:col-span-5">
					<div className="border border-rubber-line bg-black/80 p-4 backdrop-blur-sm">
						<div className="flex items-center justify-between border-b border-rubber-line pb-3">
							<p className="index-label text-chalk/60">On the floor</p>
							<span className="flex items-center gap-1.5">
								<span className="led-colon h-2 w-2 rounded-full bg-led-red shadow-[0_0_8px_var(--color-led-red)]" />
								<span className="index-label text-led-red">Live</span>
							</span>
						</div>
						<ul className="divide-y divide-rubber-line">
							{next.map((o) => (
								<li key={o.key}>
									<Link href={floorHref({ occ: o })} className="grid grid-cols-[4.5rem_minmax(0,1fr)_auto] items-center gap-3 py-2.5 hover:bg-rubber-2">
										<Led time={o.localTime} color="red" className="text-2xl" />
										<span className="min-w-0">
											<span className="flex items-center gap-2 truncate text-sm font-bold uppercase tracking-[0.04em]">
												<Plate plate={o.plate} size="xs" />
												{o.short}
											</span>
											<span className="block truncate text-xs text-chalk/55">{[o.coachId ? coachNames[o.coachId] : null, o.variantTitle.split(' · ')[0]].filter(Boolean).join(' · ')}</span>
										</span>
										<Led color={o.seatsLeft <= siteConfig.lowSeatsThreshold ? 'amber' : 'green'} className="text-sm">
											{o.seatsLeft} left
										</Led>
									</Link>
								</li>
							))}
						</ul>
						<Link href="/schedule" className="index-label mt-3 flex justify-between text-chalk/70 hover:text-chalk">
							<span>The whole week</span>
							<span>→</span>
						</Link>
					</div>
				</div>
			</div>
		</section>
	);
}
