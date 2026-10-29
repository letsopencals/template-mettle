import Link from 'next/link';
import { Logo } from '@/components/brand/logo';
import { CalibrationStrip } from '@/components/brand/calibration-strip';
import { siteConfig } from '@/lib/site-config';

export function Footer({ email, phone, sites }: { email: string; phone: string; sites: Array<{ key: string; name: string; address: string; hours: string }> }) {
	return (
		<footer className="rubber-texture text-chalk">
			<CalibrationStrip />
			<div className="container-x grid gap-12 py-16 md:grid-cols-12">
				<div className="md:col-span-4">
					<Logo className="w-40" />
					<p className="mt-5 max-w-xs text-chalk/70">{siteConfig.description}</p>
					<p className="mono mt-6 text-sm text-chalk/80">
						<a href={`mailto:${email}`} className="hover:text-chalk">
							{email}
						</a>
						<br />
						<a href={`tel:${phone.replace(/\s/g, '')}`} className="hover:text-chalk">
							{phone}
						</a>
					</p>
				</div>
				<div className="grid gap-8 sm:grid-cols-2 md:col-span-5">
					{sites.map((s) => (
						<div key={s.key}>
							<p className="index-label text-chalk/50">Site</p>
							<Link href={`/sites/${s.key}`} className="display mt-1 block text-3xl hover:text-plate-yellow">
								{s.name}
							</Link>
							<p className="mt-2 text-sm text-chalk/70">{s.address}</p>
							<p className="mono mt-1 text-xs text-chalk/50">{s.hours}</p>
						</div>
					))}
				</div>
				<nav aria-label="Footer" className="grid grid-cols-2 gap-2 text-sm md:col-span-3">
					{[...siteConfig.nav, ...siteConfig.footerNav, { label: 'Training log', href: '/account' }].map((n) => (
						<Link key={n.href} href={n.href} className="text-chalk/70 hover:text-chalk">
							{n.label}
						</Link>
					))}
				</nav>
			</div>
			<div className="border-t border-rubber-line">
				<div className="container-x flex flex-wrap items-center justify-between gap-3 py-5 text-xs text-chalk/45">
					<p>© {new Date().getFullYear()} {siteConfig.name}. A template by Opencals.</p>
					<p>
						Bookings run on{' '}
						<a href="https://opencals.com" className="underline underline-offset-4 hover:text-chalk">
							Opencals
						</a>
					</p>
				</div>
			</div>
		</footer>
	);
}
