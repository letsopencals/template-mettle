import { clsx } from 'clsx';
import { siteConfig } from '@/lib/site-config';
import type { BookingView } from '@/lib/booking-view';
import { dayLabel, timeLabel } from '@/lib/when';
import { SafetyPin } from '@/components/bib/safety-pin';

/** The race number from the order name (`#M4012` → `4012`). */
export function bibNumber(orderName: string | null): string {
	const digits = (orderName ?? '').replace(/\D/g, '');
	return digits ? digits.slice(-5) : '0000';
}

/**
 * The confirmation artifact: a race bib, pinned at the four corners. The
 * order number is the race number; one plate stripe per booked session.
 */
export function Bib({ orderName, name, views, className }: { orderName: string | null; name: string | null; views: BookingView[]; className?: string }) {
	const first = views[0];
	return (
		<div className={clsx('relative mx-auto w-full max-w-[34rem] md:-rotate-[1.2deg]', className)}>
			<SafetyPin className="absolute -left-3 -top-2 z-10 w-16 -rotate-[24deg]" />
			<SafetyPin className="absolute -right-3 -top-2 z-10 w-16 rotate-[24deg]" flip />
			<SafetyPin className="absolute -bottom-2 -left-3 z-10 w-16 rotate-[20deg]" />
			<SafetyPin className="absolute -bottom-2 -right-3 z-10 w-16 -rotate-[20deg]" flip />
			<div className="relative overflow-hidden bg-[#F7F7F2] text-ink shadow-[0_30px_60px_-30px_rgba(0,0,0,0.7)]">
				{/* punched holes */}
				{['left-3 top-3', 'right-3 top-3', 'left-3 bottom-3', 'right-3 bottom-3'].map((p) => (
					<span key={p} aria-hidden className={clsx('absolute h-3 w-3 rounded-full bg-rubber/90 ring-2 ring-[#d9d6cc]', p)} />
				))}
				<div className="flex items-center justify-between bg-plate-red px-8 py-2.5 text-white">
					<span className="display text-xl tracking-[0.04em]">{siteConfig.name}</span>
					<span className="mono text-[0.7rem] uppercase tracking-[0.18em]">Melbourne · {new Date().getFullYear()}</span>
				</div>
				<div className="px-8 pb-4 pt-5 text-center">
					<p className="index-label text-muted">Booking</p>
					<p className="display text-[clamp(6rem,24vw,10.5rem)] leading-[0.82]" aria-label={`Booking number ${bibNumber(orderName)}`}>
						{bibNumber(orderName)}
					</p>
					<p className="display mt-1 text-3xl tracking-[0.03em]">{name || 'Athlete'}</p>
				</div>
				<div className="flex h-5" aria-hidden>
					{(views.length ? views : [null]).map((v, i) => (
						<span key={v?.id ?? i} className="flex-1 border-r border-[#F7F7F2] last:border-r-0" style={{ backgroundColor: v ? siteConfig.plates[v.plate].hex : '#8A9399' }} />
					))}
				</div>
				<div className="flex items-center justify-between gap-4 border-t-2 border-dashed border-ink/25 px-8 py-3">
					<span className="mono text-[0.72rem] uppercase tracking-[0.12em]">
						{views.length} {views.length === 1 ? 'session' : 'sessions'}
					</span>
					{first ? (
						<span className="mono text-[0.72rem] uppercase tracking-[0.12em]">
							First: {dayLabel(first.start)} · {timeLabel(first.start)}
						</span>
					) : null}
				</div>
			</div>
		</div>
	);
}
