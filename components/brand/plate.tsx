import { clsx } from 'clsx';
import { siteConfig, type Plate as PlateColor } from '@/lib/site-config';

/**
 * A bumper plate seen edge-on: a rounded vertical slab with a steel hub line.
 * The discipline marker everywhere (chips, cards, lanes, the Bar).
 */
export function Plate({ plate, size = 'md', className, title }: { plate: PlateColor; size?: 'xs' | 'sm' | 'md' | 'lg'; className?: string; title?: string }) {
	const dims = { xs: 'h-3.5 w-1.5', sm: 'h-5 w-2', md: 'h-8 w-3', lg: 'h-14 w-5' }[size];
	const outlined = plate === 'white' || plate === 'black';
	return (
		<span
			aria-hidden={title ? undefined : true}
			title={title}
			className={clsx('relative inline-block shrink-0 rounded-[2px]', dims, outlined && (plate === 'white' ? 'ring-1 ring-ink/70 ring-inset' : 'ring-1 ring-chalk/40 ring-inset'), className)}
			style={{ backgroundColor: siteConfig.plates[plate].hex }}
		>
			<span className="absolute inset-x-0 top-1/2 h-px -translate-y-1/2 bg-black/25" />
		</span>
	);
}

/** Discipline chip: a small plate + the label. */
export function PlateTag({ plate, children, tone = 'chalk', className }: { plate: PlateColor; children: React.ReactNode; tone?: 'chalk' | 'rubber'; className?: string }) {
	return (
		<span className={clsx('index-label inline-flex items-center gap-2', tone === 'chalk' ? 'text-ink-2' : 'text-chalk/80', className)}>
			<Plate plate={plate} size="xs" />
			{children}
		</span>
	);
}
