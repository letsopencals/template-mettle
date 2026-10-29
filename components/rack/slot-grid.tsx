'use client';

import { clsx } from 'clsx';
import type { RackStart } from '@/lib/rack';

/** Plain time buttons for one day. */
export function SlotGrid({ starts, value, onChange, showLeft }: { starts: RackStart[]; value: number | null; onChange: (s: RackStart) => void; showLeft: boolean }) {
	if (!starts.length) return <p className="border border-dashed border-ink/20 px-4 py-6 text-center text-muted">No times left on this day. Try the next one.</p>;
	return (
		<div role="radiogroup" aria-label="Start time" className="grid grid-cols-4 gap-1.5 sm:grid-cols-6 lg:grid-cols-7">
			{starts.map((s) => {
				const on = s.start === value;
				return (
					<button
						key={s.start}
						type="button"
						role="radio"
						aria-checked={on}
						onClick={() => onChange(s)}
						className={clsx('flex h-12 flex-col items-center justify-center rounded-[2px] border transition-colors', on ? 'border-ink bg-ink text-chalk' : 'border-chalk-line bg-chalk-3 hover:border-ink')}
					>
						<span className="mono text-[0.95rem] font-semibold">{s.localTime}</span>
						{showLeft ? <span className={clsx('mono text-[0.6rem]', on ? 'text-chalk/70' : 'text-muted')}>{s.left} left</span> : null}
					</button>
				);
			})}
		</div>
	);
}
