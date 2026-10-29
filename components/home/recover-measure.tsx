import Link from 'next/link';
import type { Offering } from '@/lib/catalog';
import { siteConfig } from '@/lib/site-config';
import { formatWholePrice } from '@/lib/format';
import { minutesLabel } from '@/lib/when';
import { SafeImage } from '@/components/ui/safe-image';
import { PlateTag } from '@/components/brand/plate';

function Half({ discipline, title, offerings, href }: { discipline: 'recovery' | 'lab'; title: string; offerings: Offering[]; href: string }) {
	const meta = siteConfig.disciplines[discipline];
	return (
		<div className="flex flex-col">
			<div className="image-placeholder relative aspect-[16/10] overflow-hidden">
				<SafeImage src={siteConfig.media.disciplines[discipline]} alt="" fill sizes="(min-width: 768px) 50vw, 100vw" className="object-cover" />
			</div>
			<div className="mt-5">
				<PlateTag plate={meta.plate}>{meta.label}</PlateTag>
				<h3 className="display mt-2 text-5xl">{title}</h3>
				<p className="mt-2 max-w-md text-ink-2">{meta.blurb}</p>
				<ul className="mt-4 border-t border-ink/15">
					{offerings.map((o) => (
						<li key={o.key} className="border-b border-ink/15">
							<Link href={`${href}?service=${o.key}`} className="flex items-baseline justify-between gap-4 py-2.5 hover:bg-chalk-2">
								<span className="font-semibold">{o.serviceMeta?.short ?? o.title}</span>
								<span className="mono text-sm text-muted">
									{minutesLabel(Math.round(o.duration / 60))} · {o.fromPrice === 0 ? 'Free' : formatWholePrice(o.fromPrice)}
								</span>
							</Link>
						</li>
					))}
				</ul>
			</div>
		</div>
	);
}

export function RecoverMeasure({ recovery, lab }: { recovery: Offering[]; lab: Offering[] }) {
	return (
		<section className="chalk-texture border-t border-ink/10 py-20">
			<div className="container-x">
				<p className="index-label text-muted">
					<span className="text-ink">05 /</span> Recovery & Lab
				</p>
				<div className="mt-8 grid gap-14 md:grid-cols-2">
					<Half discipline="recovery" title="Heat. Ice. Quiet." offerings={recovery} href="/recovery" />
					<Half discipline="lab" title="Measure it." offerings={lab} href="/lab" />
				</div>
			</div>
		</section>
	);
}
