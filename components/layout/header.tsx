'use client';

import { useMemo, useState } from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { useSession } from 'next-auth/react';
import { clsx } from 'clsx';
import type { CartItem } from '@opencals/storefront-sdk';
import { useCart } from '@/contexts/cart-context';
import { useBarUi } from '@/contexts/bar-ui-context';
import { Logo } from '@/components/brand/logo';
import { Plate } from '@/components/brand/plate';
import { Overlay, CloseButton } from '@/components/ui/overlay';
import { BarDrawer } from '@/components/bar/bar-drawer';
import { NextOnFloor, type NextUp } from '@/components/layout/next-on-floor';
import { CalibrationStrip } from '@/components/brand/calibration-strip';
import { barPlates } from '@/lib/bar';
import { siteConfig } from '@/lib/site-config';

function BarButton() {
	const { cart } = useCart();
	const { setOpen } = useBarUi();
	const plates = useMemo(() => barPlates((cart?.items ?? []) as CartItem[]), [cart?.items]);
	return (
		<button
			type="button"
			onClick={() => setOpen(true)}
			className="group flex h-10 items-center gap-2 rounded-[2px] border border-chalk/25 px-3 text-chalk transition-colors hover:border-chalk"
			aria-label={plates.length ? `Open the Bar, ${plates.length} ${plates.length === 1 ? 'session' : 'sessions'}` : 'Open the Bar'}
		>
			<span aria-hidden className="relative flex h-6 w-14 items-center">
				<span className="absolute inset-x-0 top-1/2 h-[3px] -translate-y-1/2 rounded-full bg-[#b9bec2]" />
				<span className="relative ml-auto flex h-full items-center gap-[1px] pr-1">
					{plates.slice(0, 4).map((p) => (
						<Plate key={p.key} plate={p.plate} size="xs" className="rack-in !h-5" />
					))}
				</span>
			</span>
			<span className="index-label">Bar</span>
			{plates.length ? <span className="mono flex h-5 min-w-5 items-center justify-center bg-plate-yellow px-1 text-[0.7rem] font-semibold text-ink">{plates.length}</span> : null}
		</button>
	);
}

/** The rubber top bar: wordmark, nav, the live next-class readout, account and the Bar. */
export function Header({ upcoming }: { upcoming: NextUp[] }) {
	const pathname = usePathname();
	const { status } = useSession();
	const [menu, setMenu] = useState(false);
	const signedIn = status === 'authenticated';
	return (
		<>
			<header className="rubber-texture sticky top-0 z-50 text-chalk">
				<div className="container-x flex h-16 items-center gap-4">
					<Link href="/" className="shrink-0" aria-label="METTLE home">
						<Logo className="w-[7.5rem] md:w-[8.5rem]" />
					</Link>
					<nav aria-label="Main" className="ml-4 hidden items-center gap-1 lg:flex">
						{siteConfig.nav.map((n) => {
							const active = pathname === n.href || pathname.startsWith(`${n.href}/`);
							return (
								<Link
									key={n.href}
									href={n.href}
									aria-current={active ? 'page' : undefined}
									className={clsx('relative px-2.5 py-2 text-[0.8rem] font-semibold uppercase tracking-[0.08em] transition-colors', active ? 'text-chalk' : 'text-chalk/65 hover:text-chalk')}
								>
									{n.label}
									{active ? <span className="absolute inset-x-3 -bottom-[13px] h-[3px] bg-plate-red" /> : null}
								</Link>
							);
						})}
					</nav>
					<div className="ml-auto flex items-center gap-2">
						<NextOnFloor upcoming={upcoming} className="hidden xl:flex" />
						<Link href={signedIn ? '/account' : '/login'} className="hidden h-10 items-center whitespace-nowrap px-2 text-[0.8rem] font-semibold uppercase tracking-[0.08em] text-chalk/75 hover:text-chalk sm:flex">
							{signedIn ? 'Log' : 'Sign in'}
						</Link>
						<BarButton />
						<button type="button" onClick={() => setMenu(true)} className="flex h-10 w-10 items-center justify-center lg:hidden" aria-label="Open menu">
							<svg aria-hidden viewBox="0 0 20 14" className="h-3.5 w-5" fill="currentColor">
								<rect width="20" height="2.4" />
								<rect y="5.8" width="14" height="2.4" />
								<rect y="11.6" width="20" height="2.4" />
							</svg>
						</button>
					</div>
				</div>
				<CalibrationStrip className="!h-1" />
			</header>
			<Overlay open={menu} onClose={() => setMenu(false)} kind="drawer" label="Menu" tone="rubber">
				<div className="flex items-center justify-between px-5 pt-3">
					<Logo className="w-28" />
					<CloseButton onClick={() => setMenu(false)} tone="rubber" />
				</div>
				<NextOnFloor upcoming={upcoming} className="mx-5 mt-4 flex" />
				<nav aria-label="Menu" className="mt-4 flex flex-col px-5">
					{[...siteConfig.nav, ...siteConfig.footerNav.slice(0, 2), { label: signedIn ? 'Training log' : 'Sign in', href: signedIn ? '/account' : '/login' }].map((n) => (
						<Link key={n.href} href={n.href} onClick={() => setMenu(false)} className="display border-b border-rubber-line py-3 text-4xl">
							{n.label}
						</Link>
					))}
				</nav>
			</Overlay>
			<BarDrawer />
		</>
	);
}
