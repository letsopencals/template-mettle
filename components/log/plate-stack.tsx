import { siteConfig, disciplineMeta, type Plate } from '@/lib/site-config';

/**
 * Completed sessions as plates stacked on a vertical post, one column per
 * discipline (up to 12 plates drawn, then a count).
 */
export function PlateStack({ counts }: { counts: Array<{ discipline: string; plate: Plate; count: number }> }) {
	if (!counts.length) return <p className="text-sm text-chalk/60">Your first finished session puts a plate here.</p>;
	return (
		<div className="flex items-end gap-5 overflow-x-auto pb-1">
			{counts.map((c) => (
				<div key={c.discipline} className="flex shrink-0 flex-col items-center">
					<div className="relative flex flex-col-reverse items-center gap-[2px] pb-1" style={{ minHeight: 120 }}>
						<span aria-hidden className="absolute inset-y-0 left-1/2 w-1.5 -translate-x-1/2 bg-[#b9bec2]" />
						{Array.from({ length: Math.min(c.count, 12) }).map((_, i) => (
							<span
								key={i}
								className="rack-in relative h-[7px] w-16 rounded-[1px]"
								style={{ backgroundColor: siteConfig.plates[c.plate].hex, animationDelay: `${i * 30}ms`, boxShadow: c.plate === 'white' || c.plate === 'black' ? 'inset 0 0 0 1px rgba(0,0,0,.45)' : undefined }}
							/>
						))}
					</div>
					<span className="display mt-2 text-3xl leading-none">{c.count}</span>
					<span className="index-label text-chalk/55">{disciplineMeta(c.discipline)?.label ?? c.discipline}</span>
				</div>
			))}
		</div>
	);
}
