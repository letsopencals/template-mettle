/* eslint-disable @next/next/no-img-element */
import { clsx } from 'clsx';

/** The METTLE lockup (hand-drawn SVG in public/). `light` for rubber backgrounds. */
export function Logo({ tone = 'light', className }: { tone?: 'light' | 'dark'; className?: string }) {
	return <img src={tone === 'light' ? '/logo-light.svg' : '/logo.svg'} alt="METTLE" width={558} height={160} className={clsx('h-auto', className)} />;
}
