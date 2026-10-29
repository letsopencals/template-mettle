import type { Metadata, Viewport } from 'next';
import { Albert_Sans, Big_Shoulders, Chivo_Mono } from 'next/font/google';
import { Header } from '@/components/layout/header';
import { Footer } from '@/components/layout/footer';
import { Providers } from '@/components/providers';
import type { NextUp } from '@/components/layout/next-on-floor';
import { siteConfig } from '@/lib/site-config';
import { storeContact } from '@/lib/contact';
import { physicalSites } from '@/lib/catalog';
import { floorHref } from '@/lib/floor-url';
import { getCatalog, getLocations, getStoreSettings, getTimetable, storeImages } from '@/lib/server-data';
import './globals.css';

const shoulders = Big_Shoulders({ subsets: ['latin'], weight: ['700', '800', '900'], variable: '--font-shoulders', display: 'swap' });
const albert = Albert_Sans({ subsets: ['latin', 'latin-ext'], weight: ['400', '500', '600', '700'], variable: '--font-albert', display: 'swap' });
const chivoMono = Chivo_Mono({ subsets: ['latin'], weight: ['400', '500', '600'], variable: '--font-chivo-mono', display: 'swap' });

const title = `${siteConfig.name} | Strength, fight & recovery club in Melbourne`;

export const metadata: Metadata = {
	title: { default: title, template: `%s | ${siteConfig.name}` },
	description: siteConfig.description,
	metadataBase: new URL(siteConfig.url),
	applicationName: siteConfig.name,
	keywords: ['boutique gym Melbourne', 'boxing gym Collingwood', 'personal training Melbourne', 'strength classes', 'Muay Thai Melbourne', 'contrast therapy sauna ice bath', 'VO2 max test Melbourne'],
	openGraph: { title, description: siteConfig.description, siteName: siteConfig.name, locale: siteConfig.locale, type: 'website' },
	twitter: { card: 'summary_large_image', title, description: siteConfig.description },
	robots: { index: true, follow: true },
};

export const viewport: Viewport = { themeColor: '#121212', colorScheme: 'light' };

export default async function RootLayout({ children }: { children: React.ReactNode }) {
	const [initialSettings, catalog, locations, timetable] = await Promise.all([getStoreSettings(), getCatalog(), getLocations(), getTimetable()]);
	const { logo, banner } = storeImages(initialSettings);
	const { email, phone } = storeContact(initialSettings);
	const sites = physicalSites(catalog);
	const physical = locations.filter((l) => l.type === siteConfig.locationTypes.physical);
	const upcoming: NextUp[] = timetable
		.filter((o) => o.status !== 'full')
		.slice(0, 12)
		.map((o) => ({ key: o.key, start: o.start, time: o.localTime, short: o.short, seatsLeft: o.seatsLeft, href: floorHref({ occ: o }) }));

	const jsonLd = {
		'@context': 'https://schema.org',
		'@type': 'ExerciseGym',
		name: initialSettings?.name || siteConfig.name,
		description: siteConfig.description,
		url: siteConfig.url,
		...(logo ? { logo } : {}),
		...(banner ? { image: banner } : {}),
		telephone: phone,
		email,
		sameAs: [siteConfig.contact.instagram],
		location: physical.map((l) => ({
			'@type': 'ExerciseGym',
			name: l.title,
			url: `${siteConfig.url}/sites/${sites.find((s) => s.id === l.id)?.key ?? l.slug}`,
			address: {
				'@type': 'PostalAddress',
				streetAddress: [l.addressLine1, l.addressLine2].filter(Boolean).join(', '),
				addressLocality: l.city,
				addressRegion: l.state,
				postalCode: l.postalCode,
				addressCountry: l.country,
			},
			...(l.latitude && l.longitude ? { geo: { '@type': 'GeoCoordinates', latitude: l.latitude, longitude: l.longitude } } : {}),
		})),
	};

	return (
		<html lang="en-AU" className={`${shoulders.variable} ${albert.variable} ${chivoMono.variable}`}>
			<body>
				<Providers initialSettings={initialSettings}>
					<a href="#main" className="sr-only focus:not-sr-only focus:fixed focus:left-3 focus:top-3 focus:z-[90] focus:bg-plate-yellow focus:px-3 focus:py-2 focus:text-ink">
						Skip to content
					</a>
					<Header upcoming={upcoming} />
					<main id="main">{children}</main>
					<Footer email={email} phone={phone} sites={sites.map((s) => ({ key: s.key, name: s.name, address: s.address, hours: s.meta?.hours ?? '' }))} />
				</Providers>
				<script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd).replace(/</g, '\\u003c') }} />
			</body>
		</html>
	);
}
