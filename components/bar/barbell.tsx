import { clsx } from 'clsx';
import { siteConfig, type Plate } from '@/lib/site-config';
import type { BarPlate, BarProgress } from '@/lib/bar';
import { formatWholePrice } from '@/lib/format';

/** Plate height (as a share of the bumper diameter) and thickness, by colour. */
const PLATE_SHAPE: Record<Plate, { h: number; w: number }> = {
	red: { h: 1, w: 16 },
	blue: { h: 1, w: 14 },
	yellow: { h: 1, w: 12 },
	green: { h: 1, w: 10 },
	black: { h: 0.82, w: 12 },
	white: { h: 0.62, w: 9 },
	steel: { h: 0.5, w: 8 },
};

const MAX_DRAWN = 8;

function Sleeve({ plates, side, size }: { plates: BarPlate[]; side: 'left' | 'right'; size: 'sm' | 'lg' }) {
	const scale = size === 'lg' ? 2.1 : 1.15;
	const shown = plates.slice(0, MAX_DRAWN);
	return (
		<div className={clsx('flex h-full items-center gap-[2px]', side === 'left' ? 'flex-row-reverse' : 'flex-row')}>
			{shown.map((p, i) => {
				const shape = PLATE_SHAPE[p.plate];
				return (
					<span
						key={p.key}
						title={p.label}
						className={clsx('rack-in relative block rounded-[2px]', (p.plate === 'white' || p.plate === 'black') && 'ring-1 ring-inset ring-black/40')}
						style={{
							height: `${shape.h * 100}%`,
							width: `${shape.w * scale}px`,
							backgroundColor: siteConfig.plates[p.plate].hex,
							animationDelay: `${i * 40}ms`,
							...(side === 'left' ? { animationName: 'rack-in-left' } : {}),
						}}
					>
						<span className="absolute inset-x-0 top-1/2 h-[3px] -translate-y-1/2 bg-black/25" />
					</span>
				);
			})}
			{plates.length > MAX_DRAWN ? <span className="mono px-1 text-[0.7rem] opacity-70">+{plates.length - MAX_DRAWN}</span> : null}
		</div>
	);
}

/**
 * The loaded bar. Each cart item is a plate on both sleeves, mirrored; an empty
 * bar is the bare 20 kg shaft. With `progress`, a scale under the bar marks the
 * Training Block thresholds as collars.
 */
export function Barbell({ plates, progress, currency = siteConfig.currency, size = 'lg', tone = 'rubber', className }: { plates: BarPlate[]; progress?: BarProgress; currency?: string; size?: 'sm' | 'lg'; tone?: 'rubber' | 'chalk'; className?: string }) {
	const height = size === 'lg' ? 'h-28 sm:h-36' : 'h-14';
	const metal = tone === 'rubber' ? 'bg-[#b9bec2]' : 'bg-[#6f767b]';
	return (
		<div className={clsx('w-full', className)}>
			<div className={clsx('relative flex items-center', height)} role="img" aria-label={plates.length ? `${plates.length} ${plates.length === 1 ? 'session' : 'sessions'} on the bar` : 'The bar is empty'}>
				{/* shaft */}
				<span className={clsx('knurl absolute inset-x-[4%] top-1/2 h-[6px] -translate-y-1/2 rounded-full', metal)} />
				{/* left sleeve + collar */}
				<div className="relative z-10 flex h-full w-[38%] items-center justify-end pr-1">
					<Sleeve plates={plates} side="left" size={size} />
					<span className={clsx('ml-[2px] h-[38%] w-[6px] rounded-[1px]', metal)} />
				</div>
				<div className="flex-1" />
				<div className="relative z-10 flex h-full w-[38%] items-center pl-1">
					<span className={clsx('mr-[2px] h-[38%] w-[6px] rounded-[1px]', metal)} />
					<Sleeve plates={plates} side="right" size={size} />
				</div>
			</div>
			{progress ? <BarScale progress={progress} currency={currency} tone={tone} /> : null}
		</div>
	);
}

function BarScale({ progress, currency, tone }: { progress: BarProgress; currency: string; tone: 'rubber' | 'chalk' }) {
	const thresholds = siteConfig.blockThresholds;
	const top = (thresholds[thresholds.length - 1]?.amount ?? 1) * 1.1;
	return (
		<div className="mt-3">
			<div className={clsx('relative h-2 rounded-[1px]', tone === 'rubber' ? 'bg-chalk/10' : 'bg-ink/10')}>
				<span className="meter-fill absolute inset-y-0 left-0 bg-plate-yellow" style={{ width: `${progress.ratio * 100}%` }} />
				{thresholds.map((t) => (
					<span key={t.amount} className={clsx('absolute -top-1 h-4 w-[3px]', progress.loaded >= t.amount ? 'bg-plate-yellow' : tone === 'rubber' ? 'bg-chalk/50' : 'bg-ink/40')} style={{ left: `${(t.amount / top) * 100}%` }} />
				))}
			</div>
			<div className="relative mt-2 h-8">
				{thresholds.map((t) => (
					<span key={t.amount} className={clsx('mono absolute -translate-x-1/2 text-center text-[0.68rem] leading-tight', progress.loaded >= t.amount ? 'text-plate-yellow' : 'opacity-60')} style={{ left: `${(t.amount / top) * 100}%` }}>
						{formatWholePrice(t.amount, currency)}
						<br />
						{t.label} · {t.percent}%
					</span>
				))}
			</div>
		</div>
	);
}
