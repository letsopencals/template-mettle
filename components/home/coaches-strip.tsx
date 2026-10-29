import Link from 'next/link';
import type { Coach } from '@/lib/catalog';
import { SectionHead } from '@/components/brand/section-head';
import { CoachCard } from '@/components/coaches/coach-card';

export function CoachesStrip({ coaches, ptFrom }: { coaches: Coach[]; ptFrom: string | null }) {
	return (
		<section className="chalk-texture py-20">
			<div className="container-x">
				<SectionHead index="04" label="Coaches" title="Twelve coaches. No randoms.">
					Every coach teaches classes and takes one-to-ones{ptFrom ? `, from ${ptFrom} for 30 minutes` : ''}. Book the person, then the time.{' '}
					<Link href="/coaches" className="font-semibold underline underline-offset-4">
						Meet them all
					</Link>
				</SectionHead>
				<div className="no-scrollbar -mx-4 mt-10 flex gap-4 overflow-x-auto px-4 md:mx-0 md:grid md:grid-cols-4 md:overflow-visible md:px-0 xl:grid-cols-6">
					{coaches.slice(0, 6).map((c) => (
						<div key={c.id} className="w-44 shrink-0 md:w-auto">
							<CoachCard coach={c} compact />
						</div>
					))}
				</div>
			</div>
		</section>
	);
}
