import { clsx } from 'clsx';
import { siteConfig } from '@/lib/site-config';

/** Places taken as a fill; the remaining count in mono. Full = hatched. */
export function PlacesMeter({ capacity, left, tone = 'chalk', compact = false, className }: { capacity: number; left: number; tone?: 'chalk' | 'rubber'; compact?: boolean; className?: string }) {
	const taken = Math.max(0, Math.min(capacity, capacity - left));
	const pct = capacity > 0 ? (taken / capacity) * 100 : 100;
	const full = left <= 0;
	const low = !full && left <= siteConfig.lowSeatsThreshold;
	return (
		<span className={clsx('flex items-center gap-2', className)}>
			<span className={clsx('relative h-1.5 flex-1 overflow-hidden rounded-[1px]', tone === 'chalk' ? 'bg-ink/10' : 'bg-chalk/12')}>
				<span
					className={clsx('meter-fill absolute inset-y-0 left-0', full ? 'bg-led-red' : low ? 'bg-led-amber' : tone === 'chalk' ? 'bg-ink' : 'bg-chalk')}
					style={{ width: `${pct}%` }}
				/>
			</span>
			{compact ? null : (
				<span className={clsx('mono shrink-0 text-[0.72rem]', full ? 'text-led-red' : low ? (tone === 'chalk' ? 'text-[#b46a00]' : 'text-led-amber') : 'opacity-70')}>
					{full ? 'Full' : `${left} left`}
				</span>
			)}
		</span>
	);
}

/** Intensity 1–5 as five short bars. */
export function Intensity({ value, tone = 'chalk', className }: { value: number; tone?: 'chalk' | 'rubber'; className?: string }) {
	return (
		<span className={clsx('inline-flex items-end gap-[2px]', className)} aria-label={`Intensity ${value} of 5`} role="img">
			{[1, 2, 3, 4, 5].map((i) => (
				<span
					key={i}
					className={clsx('w-[3px] rounded-[1px]', i <= value ? (tone === 'chalk' ? 'bg-ink' : 'bg-chalk') : tone === 'chalk' ? 'bg-ink/15' : 'bg-chalk/20')}
					style={{ height: `${4 + i * 2}px` }}
				/>
			))}
		</span>
	);
}
