import Link from 'next/link';
import type { Site } from '@/lib/catalog';
import { SafeImage } from '@/components/ui/safe-image';
import { SectionHead } from '@/components/brand/section-head';

export function SitesBand({ sites }: { sites: Site[] }) {
	return (
		<section className="chalk-texture py-20">
			<div className="container-x">
				<SectionHead index="06" label="Sites" title="Two buildings with history.">
					The Engine House in Collingwood and the Yard in Cremorne, ten minutes apart on the 86 and the 70. Train at either, any day.
				</SectionHead>
				<div className="mt-10 grid gap-10 md:grid-cols-2">
					{sites.map((s) => (
						<Link key={s.id} href={`/sites/${s.key}`} className="group block">
							<div className="image-placeholder relative aspect-[4/3] overflow-hidden">
								<SafeImage src={s.meta?.images[0]} alt={s.name} fill sizes="(min-width: 768px) 50vw, 100vw" className="object-cover transition-transform duration-500 group-hover:scale-[1.02]" />
								<span className="index-label absolute left-3 top-3 bg-rubber px-2 py-1 text-chalk">{s.meta?.suburb}</span>
							</div>
							<p className="display mt-4 text-5xl leading-none">{s.name}</p>
							<p className="mt-2 text-ink-2">{s.address}</p>
							<p className="mono mt-1 text-xs text-muted">{s.meta?.hours}</p>
						</Link>
					))}
				</div>
			</div>
		</section>
	);
}
