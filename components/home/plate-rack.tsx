import Link from 'next/link';
import { clsx } from 'clsx';
import { siteConfig, type DisciplineMeta } from '@/lib/site-config';
import { formatWholePrice } from '@/lib/format';
import { Plate } from '@/components/brand/plate';
import { SafeImage } from '@/components/ui/safe-image';
import { SectionHead } from '@/components/brand/section-head';

export interface RackRow {
	slug: string;
	meta: DisciplineMeta;
	weekCount: number | null;
	fromPrice: number | null;
	names: string[];
}

/**
 * The plate rack: every discipline as a slot in a rack, heaviest first. Each
 * row: a big edge-on plate, the name, what's in it, this week's count, the
 * starting price. Hover pulls the photo in.
 */
export function PlateRack({ rows }: { rows: RackRow[] }) {
	return (
		<section className="chalk-texture py-20">
			<div className="container-x">
				<SectionHead index="01" label="Disciplines" title="Pick your plate.">
					Eight disciplines, colour-coded like the plates on the floor. Red is the heavy end, white is the way back down.
				</SectionHead>
				<ul className="mt-12 border-t-2 border-ink">
					{rows.map((r) => (
						<li key={r.slug} className="border-b border-ink/15">
							<Link href={r.meta.href} className="group grid grid-cols-[auto_minmax(0,1fr)_auto] items-center gap-4 py-4 md:grid-cols-[auto_16rem_minmax(0,1fr)_9rem_8rem] md:gap-8">
								<Plate plate={r.meta.plate} size="lg" className="transition-transform duration-200 group-hover:-translate-y-1" />
								<span>
									<span className="display block text-4xl leading-none md:text-5xl">{r.meta.label}</span>
									<span className="mono text-[0.7rem] text-muted">{r.meta.plateWeight}</span>
								</span>
								<span className="hidden text-ink-2 md:block">
									{r.meta.tagline}
									<span className="mt-1 block truncate text-sm text-muted">{r.names.join(' · ')}</span>
								</span>
								<span className="hidden text-right md:block">
									{r.weekCount !== null ? (
										<>
											<span className="display block text-3xl leading-none">{r.weekCount}</span>
											<span className="mono text-[0.7rem] text-muted">sessions this week</span>
										</>
									) : null}
								</span>
								<span className="flex items-center justify-end gap-4">
									<span className="mono text-sm">{r.fromPrice === null ? '' : r.fromPrice === 0 ? 'Free intro' : `from ${formatWholePrice(r.fromPrice)}`}</span>
									<span className="image-placeholder relative hidden h-14 w-20 overflow-hidden lg:block">
										<SafeImage src={siteConfig.media.disciplines[r.slug]} alt="" fill sizes="80px" className={clsx('object-cover grayscale transition duration-300 group-hover:grayscale-0')} />
									</span>
									<span aria-hidden className="text-2xl transition-transform group-hover:translate-x-1">
										→
									</span>
								</span>
							</Link>
						</li>
					))}
				</ul>
			</div>
		</section>
	);
}
