'use client';

import { useCallback } from 'react';
import { usePathname, useRouter, useSearchParams } from 'next/navigation';
import { clsx } from 'clsx';
import { formatWholePrice } from '@/lib/format';
import { minutesLabel } from '@/lib/when';
import { useSettings } from '@/contexts/settings-context';
import { Plate } from '@/components/brand/plate';
import { SafeImage } from '@/components/ui/safe-image';
import { SlotRack } from '@/components/rack/slot-rack';
import type { RackCoach, RackOffering, RackSite } from '@/components/rack/types';

/**
 * Service cards across the top (the URL's `?service=`), then the rack for the
 * chosen one. `?coach=<slug>` preselects a coach (from the coach pages).
 */
export function RackPage({ offerings, coaches, sites }: { offerings: RackOffering[]; coaches: Record<string, RackCoach>; sites: Record<string, RackSite> }) {
	const params = useSearchParams();
	const router = useRouter();
	const pathname = usePathname();
	const { currency } = useSettings();
	const key = params.get('service');
	const active = offerings.find((o) => o.key === key) ?? offerings[0];
	const choose = useCallback((k: string) => router.replace(`${pathname}?service=${k}#rack`, { scroll: false }), [router, pathname]);
	if (!active) return <p className="text-muted">Nothing to book here yet.</p>;
	const from = (o: RackOffering) => Math.min(...o.series.map((s) => s.price));

	return (
		<div>
			<div role="tablist" aria-label="Services" className="no-scrollbar -mx-4 flex gap-2 overflow-x-auto px-4 pb-2 md:mx-0 md:grid md:grid-cols-3 md:overflow-visible md:px-0 xl:grid-cols-4">
				{offerings.map((o) => {
					const on = o.key === active.key;
					const s0 = o.series[0];
					return (
						<button
							key={o.key}
							type="button"
							role="tab"
							aria-selected={on}
							onClick={() => choose(o.key)}
							className={clsx('group flex w-64 shrink-0 gap-3 border p-2 text-left transition-colors md:w-auto', on ? 'border-ink bg-ink text-chalk' : 'border-chalk-line bg-chalk-3 hover:border-ink')}
						>
							<span className="image-placeholder relative h-20 w-20 shrink-0 overflow-hidden">
								<SafeImage src={o.image} alt="" fill sizes="80px" className="object-cover" />
								<Plate plate={o.plate} size="sm" className="absolute bottom-1 left-1" />
							</span>
							<span className="min-w-0 py-0.5">
								<span className="display block text-xl leading-none">{o.short}</span>
								<span className={clsx('mt-1 line-clamp-2 block text-xs', on ? 'text-chalk/65' : 'text-muted')}>{o.tagline}</span>
								<span className="mono mt-1 block text-[0.72rem]">
									{from(o) === 0 ? 'Free' : `from ${formatWholePrice(from(o), currency)}`}
									{s0 ? ` · ${minutesLabel(s0.durationMin)}` : ''}
								</span>
							</span>
						</button>
					);
				})}
			</div>

			<div id="rack" className="mt-10 scroll-mt-24">
				<div className="grid gap-6 md:grid-cols-12">
					<div className="md:col-span-7">
						<h2 className="display display-md">{active.title}</h2>
						<p className="mt-3 max-w-2xl text-ink-2">{active.description}</p>
					</div>
					<ul className="space-y-1.5 text-sm md:col-span-5 md:pt-2">
						{active.includes.map((i) => (
							<li key={i} className="flex gap-2.5">
								<span aria-hidden className="mt-1.5 h-2 w-2 shrink-0 bg-ink" />
								{i}
							</li>
						))}
						{active.whatToBring.length ? <li className="pt-1 text-muted">Bring: {active.whatToBring.join(' · ')}</li> : null}
						{active.people > 1 ? <li className="pt-1 font-semibold">One booking for {active.people} people.</li> : null}
					</ul>
				</div>
				<div className="mt-8">
					<SlotRack key={active.key} offering={active} coaches={coaches} sites={sites} initialCoach={params.get('coach')} />
				</div>
			</div>
		</div>
	);
}
