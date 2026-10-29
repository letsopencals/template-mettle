'use client';

import { clsx } from 'clsx';
import { localDateParts } from '@/lib/when';

/** The day row: plain buttons, today first, the open-session count under each. */
export function DayStrip({ days, value, onChange, today }: { days: Array<{ date: string; open: number }>; value: string; onChange: (d: string) => void; today: string | null }) {
	return (
		<div role="radiogroup" aria-label="Day" className="no-scrollbar -mx-4 flex gap-1.5 overflow-x-auto px-4 pb-1 md:mx-0 md:px-0">
			{days.map((d) => {
				const p = localDateParts(d.date);
				const on = d.date === value;
				return (
					<button
						key={d.date}
						type="button"
						role="radio"
						aria-checked={on}
						aria-label={`${p.long}, ${d.open} sessions with space`}
						onClick={() => onChange(d.date)}
						className={clsx(
							'flex w-[4.4rem] shrink-0 flex-col items-start rounded-[2px] border px-2.5 py-2 text-left transition-colors',
							on ? 'border-chalk bg-chalk text-ink' : 'border-rubber-line bg-rubber-2 text-chalk hover:border-chalk/50',
						)}
					>
						<span className="index-label opacity-70">{d.date === today ? 'Today' : p.weekday}</span>
						<span className="display text-3xl leading-none">{p.day}</span>
						<span className={clsx('mono mt-1 text-[0.66rem]', on ? 'text-muted' : 'text-chalk/50')}>{d.open ? `${d.open} open` : 'Rest day'}</span>
					</button>
				);
			})}
		</div>
	);
}
