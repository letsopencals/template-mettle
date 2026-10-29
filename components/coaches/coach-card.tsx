import Link from 'next/link';
import { clsx } from 'clsx';
import type { Coach } from '@/lib/catalog';
import { siteConfig, plateFor } from '@/lib/site-config';
import { SafeImage } from '@/components/ui/safe-image';
import { Plate } from '@/components/brand/plate';

/** A coach as a tall portrait with a plate stack for their disciplines. */
export function CoachCard({ coach, tone = 'chalk', compact = false }: { coach: Coach; tone?: 'chalk' | 'rubber'; compact?: boolean }) {
	const tier = coach.meta?.tier ? siteConfig.tiers[coach.meta.tier].label : null;
	return (
		<Link href={`/coaches/${coach.slug}`} className="group block">
			<div className={clsx('image-placeholder relative overflow-hidden', compact ? 'aspect-[4/5]' : 'aspect-[3/4]')}>
				<SafeImage src={coach.image} alt={coach.name} fill sizes="(min-width: 1024px) 22vw, 50vw" className="object-cover grayscale transition-[filter,transform] duration-300 group-hover:scale-[1.02] group-hover:grayscale-0" />
				<span className="absolute left-2 top-2 flex gap-[3px]">
					{coach.disciplines.slice(0, 3).map((d) => (
						<Plate key={d} plate={plateFor(d)} size="md" />
					))}
				</span>
				{tier ? <span className="index-label absolute bottom-2 left-2 bg-rubber px-2 py-1 text-chalk">{tier}</span> : null}
			</div>
			<p className={clsx('display mt-3 text-2xl leading-none', tone === 'rubber' && 'text-chalk')}>{coach.name}</p>
			<p className={clsx('mt-1 text-sm', tone === 'chalk' ? 'text-muted' : 'text-chalk/60')}>{coach.meta?.role ?? coach.meta?.specialities.join(', ')}</p>
		</Link>
	);
}
