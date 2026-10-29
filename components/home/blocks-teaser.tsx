import Link from 'next/link';
import { siteConfig } from '@/lib/site-config';
import { formatWholePrice } from '@/lib/format';
import { progressFor } from '@/lib/bar';
import { Barbell } from '@/components/bar/barbell';
import { SectionHead } from '@/components/brand/section-head';
import { Plate } from '@/components/brand/plate';
import { buttonClasses } from '@/components/ui/button';

const DEMO = [
	{ key: 'a', plate: 'blue', discipline: 'fight', label: 'Bag Rounds' },
	{ key: 'b', plate: 'red', discipline: 'strength', label: 'Barbell Club' },
	{ key: 'c', plate: 'blue', discipline: 'fight', label: 'Muay Thai' },
	{ key: 'd', plate: 'black', discipline: 'coaching', label: 'Personal Training' },
	{ key: 'e', plate: 'white', discipline: 'recovery', label: 'Contrast Suite' },
] as const;

/** "Load the bar": the cart idea told on the homepage, with the four Training Blocks. */
export function BlocksTeaser() {
	const [t1, t2] = siteConfig.blockThresholds;
	return (
		<section className="rubber-texture py-20 text-chalk">
			<div className="container-x">
				<SectionHead index="03" label="Training Blocks" title="The more you load, the less it weighs." tone="rubber">
					Every session you book goes on the Bar as a plate. Load {t1 ? formatWholePrice(t1.amount) : ''} in one order and each session gets {t1?.percent}% off; {t2 ? formatWholePrice(t2.amount) : ''} gets {t2?.percent}%.
				</SectionHead>
				<div className="mt-10 border border-rubber-line bg-black/40 p-6 md:p-10">
					<Barbell plates={DEMO.map((d) => ({ ...d }))} progress={progressFor(186)} tone="rubber" />
				</div>
				<ul className="mt-8 grid gap-2 md:grid-cols-2 xl:grid-cols-4">
					{siteConfig.blocks.map((b) => (
						<li key={b.key}>
							<Link href={`/blocks?block=${b.key}`} className="group flex h-full gap-3 border border-rubber-line p-4 hover:border-chalk/60">
								<Plate plate={b.plate} size="lg" />
								<span>
									<span className="display block text-3xl leading-none group-hover:text-plate-yellow">{b.name}</span>
									<span className="mt-1 block text-sm text-chalk/65">{b.tagline}</span>
									<span className="mono mt-2 block text-[0.7rem] text-chalk/45">{b.lines.map((l) => `${l.count}× ${l.label}`).join(' + ')}</span>
								</span>
							</Link>
						</li>
					))}
				</ul>
				<Link href="/blocks" className={buttonClasses({ variant: 'plate', size: 'lg', className: 'mt-8' })}>
					Build a block
				</Link>
			</div>
		</section>
	);
}
