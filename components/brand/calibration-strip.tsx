import { clsx } from 'clsx';
import { siteConfig, type Plate } from '@/lib/site-config';

const ORDER: Plate[] = ['red', 'blue', 'yellow', 'green', 'white', 'black', 'steel'];

/** The seven plate colours in stack order: the only divider between slabs. */
export function CalibrationStrip({ className }: { className?: string }) {
	return (
		<div aria-hidden className={clsx('flex h-1.5 w-full', className)}>
			{ORDER.map((p) => (
				<span key={p} className="h-full flex-1" style={{ backgroundColor: siteConfig.plates[p].hex }} />
			))}
		</div>
	);
}
