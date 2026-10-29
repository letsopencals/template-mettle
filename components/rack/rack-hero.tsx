import type { ReactNode } from 'react';
import { CalibrationStrip } from '@/components/brand/calibration-strip';
import { PlateTag } from '@/components/brand/plate';
import type { Plate } from '@/lib/site-config';

/** Rubber page head for the rack pages (Coaching, Recovery, Lab). */
export function RackHero({ index, label, title, plate, children }: { index: string; label: string; title: string; plate: Plate; children: ReactNode }) {
	return (
		<section className="rubber-texture text-chalk">
			<div className="container-x grid gap-8 pb-12 pt-12 md:grid-cols-12 md:items-end md:pt-16">
				<div className="md:col-span-7">
					<p className="index-label text-chalk/50">
						<span className="text-chalk">{index} /</span> {label}
					</p>
					<h1 className="display display-lg mt-2">{title}</h1>
				</div>
				<div className="md:col-span-5">
					<PlateTag plate={plate} tone="rubber">
						{label}
					</PlateTag>
					<div className="mt-3 text-[1.05rem] leading-relaxed text-chalk/75">{children}</div>
				</div>
			</div>
			<CalibrationStrip />
		</section>
	);
}
