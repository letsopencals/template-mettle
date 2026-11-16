'use client';

import { memo } from 'react';
import { clsx } from 'clsx';
import type { Occurrence } from '@/lib/timetable';
import { siteConfig } from '@/lib/site-config';
import { PlacesMeter } from '@/components/brand/places-meter';

/**
 * A session on the Floor: the plate colour as the block, the time, the class,
 * coach and site, and the places-left fill. Full sessions are hatched black.
 */
export const SessionBlock = memo(function SessionBlock({
	occurrence: o,
	coach,
	site,
	selected,
	onSelect,
	style,
	variant = 'board',
}: {
	occurrence: Occurrence;
	coach: string | null;
	site: string | null;
	selected: boolean;
	onSelect: (o: Occurrence) => void;
	style?: React.CSSProperties;
	variant?: 'board' | 'list';
}) {
	const full = o.status === 'full';
	const plate = siteConfig.plates[o.plate];
	const light = o.plate === 'yellow' || o.plate === 'white';
	return (
		<button
			type="button"
			onClick={() => onSelect(o)}
			aria-pressed={selected}
			aria-label={`${o.short}, ${o.localTime}, ${o.minutes} minutes${coach ? `, with ${coach}` : ''}${site ? `, ${site}` : ''}, ${full ? 'full' : `${o.seatsLeft} ${o.seatsLeft === 1 ? 'place' : 'places'} left`}`}
			style={{ ...style, ...(full ? {} : { backgroundColor: plate.hex, color: plate.ink }) }}
			className={clsx(
				'group overflow-hidden rounded-[2px] text-left transition-[transform,box-shadow] duration-150',
				variant === 'board' ? 'absolute inset-y-1 px-2 py-1.5' : 'relative flex w-full items-stretch gap-3 px-3 py-2.5',
				full ? 'hatch-full bg-rubber-3 text-chalk/60' : 'hover:-translate-y-px',
				o.plate === 'white' && !full && 'ring-1 ring-inset ring-ink/20',
				o.plate === 'black' && !full && 'ring-1 ring-inset ring-chalk/25',
				selected && 'z-10 outline outline-2 outline-offset-2 outline-plate-yellow',
			)}
		>
			{variant === 'list' ? <span className="mono w-12 shrink-0 pt-0.5 text-sm font-semibold">{o.localTime}</span> : null}
			<span className="block min-w-0 flex-1">
				{variant === 'board' ? <span className="mono block text-[0.7rem] font-semibold opacity-80">{o.localTime}</span> : null}
				<span className={clsx('block font-sans font-bold uppercase leading-[1.05] tracking-[0.02em]', variant === 'board' ? 'line-clamp-2 text-[0.74rem]' : 'truncate text-[0.95rem]')}>{o.short}</span>
				<span className={clsx('block truncate text-[0.7rem]', light && !full ? 'text-ink/70' : 'opacity-75')}>
					{[coach, site].filter(Boolean).join(' · ')}
				</span>
				{variant === 'list' && full ? <span className="mono mt-1 block text-[0.7rem] text-led-red">Full</span> : null}
			</span>
			{full ? (
				variant === 'board' ? (
					<span className="mono mt-1 block text-[0.66rem] text-led-red">FULL</span>
				) : null
			) : (
				<span className={clsx(variant === 'board' ? 'mt-1 block' : 'flex w-24 shrink-0 items-center')}>
					<PlacesMeter capacity={o.capacity} left={o.seatsLeft} tone={light ? 'chalk' : 'rubber'} compact={variant === 'board' && o.minutes < 45} className="w-full" />
				</span>
			)}
		</button>
	);
});
