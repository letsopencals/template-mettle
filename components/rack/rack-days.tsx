'use client';

import { clsx } from 'clsx';
import { localDateParts } from '@/lib/when';

/** The day row for the rack (chalk version): days with no time are disabled. */
/** `loading`: the times aren't in yet, so a day with no count is pending, not empty. */
export function RackDays({ days, value, onChange, today, loading = false }: { days: Array<{ date: string; count: number }>; value: string | null; onChange: (d: string) => void; today: string | null; loading?: boolean }) {
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
						disabled={loading || d.count === 0}
						onClick={() => onChange(d.date)}
						aria-label={`${p.long}, ${loading ? 'loading' : d.count ? `${d.count} ${d.count === 1 ? 'time' : 'times'}` : 'no times'}`}
						className={clsx(
							'flex w-[4.2rem] shrink-0 flex-col items-start rounded-[2px] border px-2.5 py-2 text-left transition-colors disabled:opacity-35',
							on ? 'border-ink bg-ink text-chalk' : 'border-chalk-line bg-chalk-3 hover:border-ink',
						)}
					>
						<span className="index-label opacity-70">{d.date === today ? 'Today' : p.weekday}</span>
						<span className="display text-3xl leading-none">{p.day}</span>
						<span className={clsx('mono mt-1 text-[0.62rem]', on ? 'text-chalk/60' : 'text-muted')}>{loading ? '…' : d.count ? `${d.count} ${d.count === 1 ? 'time' : 'times'}` : 'No times'}</span>
					</button>
				);
			})}
		</div>
	);
}
