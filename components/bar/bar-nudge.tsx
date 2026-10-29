import { clsx } from 'clsx';
import type { BarProgress } from '@/lib/bar';
import { formatPrice } from '@/lib/format';

/** One line under the bar: what the next Training Block threshold unlocks. */
export function BarNudge({ progress, currency, tone = 'chalk', className }: { progress: BarProgress; currency: string; tone?: 'chalk' | 'rubber'; className?: string }) {
	const muted = tone === 'chalk' ? 'text-muted' : 'text-chalk/70';
	if (progress.loaded === 0) return <p className={clsx('text-sm', muted, className)}>Load {formatPrice(150, currency)} in one order and the Training Block discount kicks in.</p>;
	return (
		<p className={clsx('text-sm', muted, className)}>
			{progress.reached ? (
				<>
					<span className="font-semibold text-plate-yellow">{progress.reached.label}: {progress.reached.percent}% off</span> wherever it beats your other offers.{' '}
				</>
			) : null}
			{progress.next ? (
				<>
					Add {formatPrice(progress.toNext, currency)} more for <span className={tone === 'chalk' ? 'font-semibold text-ink' : 'font-semibold text-chalk'}>{progress.next.label} · {progress.next.percent}% off</span>.
				</>
			) : (
				'Fully loaded.'
			)}
		</p>
	);
}
