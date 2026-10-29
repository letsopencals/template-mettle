import type { Metadata } from 'next';
import { AccountNav } from '@/components/account/account-nav';

export const metadata: Metadata = { title: 'Training log', robots: { index: false, follow: false } };

/** Account shell: the tab row on rubber. Data loads on the client through /api/account/*. */
export default function AccountLayout({ children }: { children: React.ReactNode }) {
	return (
		<div className="chalk-texture min-h-[70vh] pb-20">
			<AccountNav />
			{children}
		</div>
	);
}
