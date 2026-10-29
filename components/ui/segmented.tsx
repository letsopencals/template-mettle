'use client';

import { clsx } from 'clsx';
import type { ReactNode } from 'react';

export interface SegmentOption<T extends string> {
	value: T;
	label: ReactNode;
	sub?: ReactNode;
	disabled?: boolean;
}

/**
 * A row of plain, square toggle buttons (site, coach, length, suite…). Real
 * radio semantics; wraps on narrow screens.
 */
export function Segmented<T extends string>({
	label,
	options,
	value,
	onChange,
	tone = 'chalk',
	className,
}: {
	label: string;
	options: SegmentOption<T>[];
	value: T | null;
	onChange: (v: T) => void;
	tone?: 'chalk' | 'rubber';
	className?: string;
}) {
	return (
		<div role="radiogroup" aria-label={label} className={clsx('flex flex-wrap gap-1.5', className)}>
			{options.map((o) => {
				const on = o.value === value;
				return (
					<button
						key={o.value}
						type="button"
						role="radio"
						aria-checked={on}
						disabled={o.disabled}
						onClick={() => onChange(o.value)}
						className={clsx(
							'min-h-11 rounded-[2px] border px-3.5 py-2 text-left text-sm font-semibold transition-colors disabled:opacity-35',
							tone === 'chalk'
								? on
									? 'border-ink bg-ink text-chalk'
									: 'border-chalk-line bg-chalk-3 text-ink hover:border-ink'
								: on
									? 'border-chalk bg-chalk text-ink'
									: 'border-rubber-line bg-rubber-2 text-chalk hover:border-chalk/60',
						)}
					>
						<span className="block leading-tight">{o.label}</span>
						{o.sub ? <span className={clsx('mono mt-0.5 block text-[0.7rem] font-normal', on ? 'opacity-80' : 'opacity-60')}>{o.sub}</span> : null}
					</button>
				);
			})}
		</div>
	);
}
