'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { clsx } from 'clsx';
import { signOut, useSession } from 'next-auth/react';

const TABS = [
	{ href: '/account', label: 'Training log', match: (p: string) => p === '/account' || p.startsWith('/account/appointments') },
	{ href: '/account/orders', label: 'Orders', match: (p: string) => p.startsWith('/account/orders') },
	{ href: '/account/settings', label: 'Settings', match: (p: string) => p.startsWith('/account/settings') },
] as const;

/** Account tabs on rubber, with sign out. */
export function AccountNav() {
	const pathname = usePathname();
	const { data: session } = useSession();
	const name = session?.customer?.firstName ?? null;
	return (
		<div className="rubber-texture text-chalk">
			<div className="container-x flex flex-wrap items-end justify-between gap-x-6 gap-y-2 pt-6">
				<nav aria-label="Account" className="no-scrollbar flex gap-1 overflow-x-auto">
					{TABS.map((t) => {
						const active = t.match(pathname);
						return (
							<Link key={t.href} href={t.href} aria-current={active ? 'page' : undefined} className={clsx('index-label whitespace-nowrap px-4 py-3', active ? 'bg-chalk text-ink' : 'text-chalk/60 hover:text-chalk')}>
								{t.label}
							</Link>
						);
					})}
				</nav>
				<div className="flex items-center gap-4 pb-3 text-sm text-chalk/60">
					{name ? <span className="max-sm:hidden">Signed in as {name}</span> : null}
					<button type="button" onClick={() => void signOut({ callbackUrl: '/' })} className="text-chalk underline underline-offset-4">
						Sign out
					</button>
				</div>
			</div>
		</div>
	);
}
