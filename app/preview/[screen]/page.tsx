import type { Metadata } from 'next';
import { notFound } from 'next/navigation';
import { BibPage } from '@/components/bib/bib-page';
import { TrainingLogView } from '@/components/log/training-log';
import { bibFixture, logFixture } from '@/lib/preview-fixtures';
import { formatPrice } from '@/lib/format';

export const metadata: Metadata = { title: 'Preview', robots: { index: false, follow: false } };

type Params = Promise<{ screen: string }>;

/**
 * Post-booking screens with fixture data, for design review and screenshots:
 * /preview/bib and /preview/log. Off in production unless METTLE_PREVIEW=1.
 */
export default async function PreviewPage({ params }: { params: Params }) {
	if (process.env.NODE_ENV === 'production' && process.env.METTLE_PREVIEW !== '1') notFound();
	const { screen } = await params;
	if (screen === 'bib') return <BibPage orderName="#M4127" name="Mia Kovač" email="mia.kovac@example.com" views={bibFixture()} total={formatPrice(276.4)} />;
	if (screen === 'log')
		return (
			<div className="chalk-texture pb-20">
				<TrainingLogView views={logFixture()} loading={false} name="Mia" />
			</div>
		);
	notFound();
}
