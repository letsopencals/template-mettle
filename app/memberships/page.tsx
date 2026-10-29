import type { Metadata } from 'next';
import Link from 'next/link';
import { siteConfig } from '@/lib/site-config';
import { formatWholePrice } from '@/lib/format';
import { RackHero } from '@/components/rack/rack-hero';
import { Plate } from '@/components/brand/plate';
import { Led } from '@/components/brand/led';
import { buttonClasses } from '@/components/ui/button';

export const metadata: Metadata = { title: 'Memberships (launching 2027)', description: 'METTLE memberships are coming in 2027. Until then, train pay-as-you-go and save with Training Blocks.' };

/**
 * Memberships are a preview: nothing here is for sale. The only action is
 * booking the free First Round, and Training Blocks are the way to save today.
 */
export default function MembershipsPage() {
	const m = siteConfig.memberships;
	const [t1, t2] = siteConfig.blockThresholds;
	return (
		<>
			<RackHero index="06" label="Memberships" title="In the rack for 2027." plate="red">
				<Led color="amber" className="text-lg">
					{m.launch.toUpperCase()}
				</Led>
				<span className="mt-2 block">{m.intro}</span>
			</RackHero>
			<div className="chalk-texture">
				<div className="container-x pb-20 pt-12">
					<div className="grid gap-3 md:grid-cols-3">
						{m.tiers.map((t, i) => (
							<article key={t.key} className={`relative border-2 p-6 ${i === 1 ? 'border-ink bg-rubber text-chalk' : 'border-ink/20 bg-chalk-3'}`}>
								<span className="index-label absolute right-4 top-4 border border-current px-2 py-0.5 opacity-70">Not on sale yet</span>
								<div className="flex items-end gap-1">
									{Array.from({ length: i + 1 }).map((_, k) => (
										<Plate key={k} plate={t.plate} size="lg" />
									))}
								</div>
								<h2 className="display mt-6 text-6xl">{t.name}</h2>
								<p className="mono mt-1 text-sm opacity-70">
									Indicative {t.priceHint} {t.cadence}
								</p>
								<ul className="mt-5 space-y-2">
									{t.includes.map((x) => (
										<li key={x} className="flex gap-2">
											<span aria-hidden className="mt-2 h-1.5 w-1.5 shrink-0 bg-plate-red" />
											{x}
										</li>
									))}
								</ul>
							</article>
						))}
					</div>
					<div className="mt-12 grid gap-10 md:grid-cols-2">
						<div className="border-l-4 border-ink pl-5">
							<h2 className="display text-4xl">Founding members</h2>
							<p className="mt-2 text-ink-2">Train with us before launch and you get first call on a founding membership:</p>
							<ul className="mt-3 space-y-1">
								{m.founding.map((f) => (
									<li key={f}>— {f}</li>
								))}
							</ul>
							<p className="mt-3 text-sm text-muted">We&rsquo;ll ask at the desk when memberships open. There&rsquo;s nothing to sign up for today.</p>
						</div>
						<div className="bg-rubber p-6 text-chalk">
							<h2 className="display text-4xl">Save today</h2>
							<p className="mt-2 text-chalk/75">
								Book sessions together and the bar discount applies: {t1 ? `${formatWholePrice(t1.amount)} → ${t1.percent}% off` : ''}
								{t2 ? `, ${formatWholePrice(t2.amount)} → ${t2.percent}% off` : ''}.
							</p>
							<div className="mt-5 flex flex-wrap gap-2">
								<Link href="/blocks" className={buttonClasses({ variant: 'plate' })}>
									Training Blocks
								</Link>
								<Link href={`/lab?service=${siteConfig.introService}`} className={buttonClasses({ variant: 'outline-chalk' })}>
									Free First Round
								</Link>
							</div>
						</div>
					</div>
				</div>
			</div>
		</>
	);
}
