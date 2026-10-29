'use client';

import { clsx } from 'clsx';
import { disciplineMeta } from '@/lib/site-config';
import { Plate } from '@/components/brand/plate';
import type { FloorCoach, FloorSite } from '@/components/floor/types';

export interface FloorFilterState {
	site: string | null;
	discipline: string | null;
	coach: string | null;
	max: number | null;
}

const selectCls = 'h-10 rounded-[2px] border border-rubber-line bg-rubber-2 px-3 pr-8 text-sm text-chalk focus:border-chalk focus:outline-none';

/** One row of filters above the days: site, discipline (plates), coach, intensity. */
export function FloorFilters({ value, onChange, sites, disciplines, coaches }: { value: FloorFilterState; onChange: (v: Partial<FloorFilterState>) => void; sites: FloorSite[]; disciplines: string[]; coaches: FloorCoach[] }) {
	return (
		<div className="flex flex-col gap-3 xl:flex-row xl:items-center xl:justify-between">
			<div role="radiogroup" aria-label="Discipline" className="no-scrollbar -mx-4 flex gap-1.5 overflow-x-auto px-4 md:mx-0 md:flex-wrap md:px-0">
				{[null, ...disciplines].map((d) => {
					const on = value.discipline === d;
					const meta = d ? disciplineMeta(d) : null;
					return (
						<button
							key={d ?? 'all'}
							type="button"
							role="radio"
							aria-checked={on}
							onClick={() => onChange({ discipline: d })}
							className={clsx('flex h-10 shrink-0 items-center gap-2 rounded-[2px] border px-3 text-[0.78rem] font-semibold uppercase tracking-[0.06em]', on ? 'border-chalk bg-chalk text-ink' : 'border-rubber-line text-chalk/80 hover:border-chalk/50')}
						>
							{meta ? <Plate plate={meta.plate} size="sm" /> : null}
							{meta?.label ?? 'Everything'}
						</button>
					);
				})}
			</div>
			<div className="grid grid-cols-3 gap-1.5 sm:flex">
				<label className="sr-only" htmlFor="floor-site">
					Site
				</label>
				<select id="floor-site" className={selectCls} value={value.site ?? ''} onChange={(e) => onChange({ site: e.target.value || null })}>
					<option value="">All sites</option>
					{sites.map((s) => (
						<option key={s.key} value={s.key}>
							{s.nickname}
						</option>
					))}
				</select>
				<label className="sr-only" htmlFor="floor-coach">
					Coach
				</label>
				<select id="floor-coach" className={selectCls} value={value.coach ?? ''} onChange={(e) => onChange({ coach: e.target.value || null })}>
					<option value="">Any coach</option>
					{coaches.map((c) => (
						<option key={c.slug} value={c.slug}>
							{c.name}
						</option>
					))}
				</select>
				<label className="sr-only" htmlFor="floor-max">
					Intensity
				</label>
				<select id="floor-max" className={selectCls} value={value.max ?? ''} onChange={(e) => onChange({ max: e.target.value ? Number(e.target.value) : null })}>
					<option value="">Any intensity</option>
					<option value="2">Easy (1–2)</option>
					<option value="3">Up to 3</option>
					<option value="4">Up to 4</option>
				</select>
			</div>
		</div>
	);
}
