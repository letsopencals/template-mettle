import type { Metadata } from 'next';
import Link from 'next/link';
import { notFound } from 'next/navigation';
import { getCatalog, getTimetable } from '@/lib/server-data';
import { findCoach, offeringsForCoach } from '@/lib/catalog';
import { upcomingFor } from '@/lib/timetable';
import { siteConfig, plateFor } from '@/lib/site-config';
import { SafeImage } from '@/components/ui/safe-image';
import { buttonClasses } from '@/components/ui/button';
import { Plate, PlateTag } from '@/components/brand/plate';
import { CalibrationStrip } from '@/components/brand/calibration-strip';
import { OccurrenceList } from '@/components/sessions/occurrence-list';

export const revalidate = 300;

type Params = Promise<{ slug: string }>;

export async function generateStaticParams() {
	const catalog = await getCatalog();
	return catalog.coaches.map((c) => ({ slug: c.slug }));
}

export async function generateMetadata({ params }: { params: Params }): Promise<Metadata> {
	const coach = findCoach(await getCatalog(), (await params).slug);
	return coach ? { title: `${coach.name}, ${coach.meta?.role ?? 'coach'}`, description: coach.meta?.bio } : {};
}

export default async function CoachPage({ params }: { params: Params }) {
	const { slug } = await params;
	const [catalog, timetable] = await Promise.all([getCatalog(), getTimetable()]);
	const coach = findCoach(catalog, slug);
	if (!coach) notFound();
	const sessions = upcomingFor(timetable, { coachId: coach.id, open: true }, 10);
	const services = offeringsForCoach(catalog, coach.id).filter((o) => o.kind === 'service');
	const tier = coach.meta?.tier ? siteConfig.tiers[coach.meta.tier].label : null;
	const sites = Object.fromEntries(catalog.sites.map((s) => [s.key, s.nickname]));
	return (
		<>
			<section className="rubber-texture text-chalk">
				<div className="container-x grid gap-10 pb-14 pt-10 md:grid-cols-12 md:items-end">
					<div className="image-placeholder relative aspect-[4/5] overflow-hidden md:col-span-5">
						<SafeImage src={coach.image} alt={coach.name} fill priority sizes="(min-width: 768px) 40vw, 100vw" className="object-cover grayscale" />
						<span className="absolute left-3 top-3 flex gap-1">
							{coach.disciplines.map((d) => (
								<Plate key={d} plate={plateFor(d)} size="lg" />
							))}
						</span>
					</div>
					<div className="md:col-span-7">
						<Link href="/coaches" className="index-label text-chalk/50 hover:text-chalk">
							← Coaches
						</Link>
						{tier ? <p className="index-label mt-6 text-plate-yellow">{tier}</p> : null}
						<h1 className="display display-xl mt-1">{coach.name}</h1>
						<p className="mt-1 text-chalk/70">{coach.meta?.role}</p>
						{coach.meta?.quote ? <p className="display mt-6 text-3xl text-chalk/90">&ldquo;{coach.meta.quote}&rdquo;</p> : null}
						<p className="mt-4 max-w-xl text-chalk/75">{coach.meta?.bio}</p>
						<div className="mt-6 flex flex-wrap gap-2">
							{services.length ? (
								<Link href={`/coaching?service=${services[0]!.key}&coach=${coach.slug}#rack`} className={buttonClasses({ variant: 'plate', size: 'lg' })}>
									Book {coach.firstName} 1:1
								</Link>
							) : null}
						</div>
					</div>
				</div>
				<CalibrationStrip />
			</section>
			<section className="chalk-texture py-14">
				<div className="container-x grid gap-12 lg:grid-cols-12">
					<div className="lg:col-span-4">
						<h2 className="display text-4xl">Speciality</h2>
						<ul className="mt-3 space-y-1">
							{coach.meta?.specialities.map((s) => (
								<li key={s}>— {s}</li>
							))}
						</ul>
						<h2 className="display mt-8 text-4xl">Credentials</h2>
						<ul className="mt-3 space-y-1 text-ink-2">
							{coach.meta?.credentials.map((s) => (
								<li key={s}>— {s}</li>
							))}
						</ul>
						{services.length ? (
							<>
								<h2 className="display mt-8 text-4xl">One-to-one</h2>
								<ul className="mt-3 space-y-2">
									{services.map((o) => (
										<li key={o.key}>
											<Link href={`${siteConfig.disciplines[o.discipline as keyof typeof siteConfig.disciplines]?.href ?? '/coaching'}?service=${o.key}&coach=${coach.slug}#rack`} className="flex items-center gap-2 font-semibold underline-offset-4 hover:underline">
												<PlateTag plate={o.plate}>{o.serviceMeta?.short ?? o.title}</PlateTag>
											</Link>
										</li>
									))}
								</ul>
							</>
						) : null}
					</div>
					<div className="lg:col-span-8">
						<h2 className="display text-4xl">Next classes with {coach.firstName}</h2>
						<div className="mt-4">
							<OccurrenceList items={sessions} names={{}} sites={sites} />
						</div>
					</div>
				</div>
			</section>
		</>
	);
}
