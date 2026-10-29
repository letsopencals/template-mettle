import { clsx } from 'clsx';

/**
 * Interval-timer readout: Chivo Mono with a glow. `time` "18:15" gets a
 * blinking colon. Status only (green = open, amber = few left, red = full/now).
 */
export function Led({ time, children, color = 'green', className }: { time?: string; children?: React.ReactNode; color?: 'green' | 'red' | 'amber'; className?: string }) {
	const tone = { green: 'text-led-green', red: 'text-led-red', amber: 'text-led-amber' }[color];
	if (time) {
		const [h, m] = time.split(':');
		return (
			<span className={clsx('led', tone, className)}>
				{h}
				<span className="led-colon">:</span>
				{m}
			</span>
		);
	}
	return <span className={clsx('led', tone, className)}>{children}</span>;
}
