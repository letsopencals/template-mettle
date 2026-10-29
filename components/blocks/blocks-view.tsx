'use client';

import { usePathname, useRouter, useSearchParams } from 'next/navigation';
import { clsx } from 'clsx';
import { siteConfig } from '@/lib/site-config';
import type { Occurrence } from '@/lib/timetable';
import { Plate } from '@/components/brand/plate';
import { BlockBuilder } from '@/components/blocks/block-builder';
import type { RackOffering } from '@/components/rack/types';

/** Block picker (`?block=`) above the builder. */
export function BlocksView({ classes, services, siteNames }: { classes: Occurrence[]; services: Record<string, RackOffering>; siteNames: Record<string, string> }) {
	const params = useSearchParams();
	const router = useRouter();
	const pathname = usePathname();
	const blocks = siteConfig.blocks;
	const active = blocks.find((b) => b.key === params.get('block')) ?? blocks[0]!;
	return (
		<div>
			<div role="tablist" aria-label="Training Blocks" className="grid gap-2 sm:grid-cols-2 xl:grid-cols-4">
				{blocks.map((b) => {
					const on = b.key === active.key;
					return (
						<button key={b.key} role="tab" aria-selected={on} type="button" onClick={() => router.replace(`${pathname}?block=${b.key}`, { scroll: false })} className={clsx('flex gap-3 border p-4 text-left', on ? 'border-ink bg-ink text-chalk' : 'border-ink/15 bg-chalk-3 hover:border-ink')}>
							<Plate plate={b.plate} size="lg" />
							<span>
								<span className="display block text-3xl leading-none">{b.name}</span>
								<span className={clsx('mt-1 block text-sm', on ? 'text-chalk/70' : 'text-muted')}>{b.tagline}</span>
								<span className="mono mt-1 block text-xs">{b.lines.map((l) => `${l.count}× ${l.label}`).join(' + ')}</span>
							</span>
						</button>
					);
				})}
			</div>
			<p className="mt-8 max-w-2xl text-ink-2">{active.description}</p>
			<div className="mt-6">
				<BlockBuilder key={active.key} block={active} classes={classes} services={services} siteNames={siteNames} />
			</div>
		</div>
	);
}
