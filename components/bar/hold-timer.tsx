'use client';

import { Led } from '@/components/brand/led';

/** "HELD 14:32": the cart hold as an interval-timer readout. */
export function HoldTimer({ seconds, onExtend }: { seconds: number | null; onExtend?: () => void }) {
	if (seconds === null) return null;
	const expired = seconds <= 0;
	const m = Math.max(0, Math.floor(seconds / 60));
	const s = Math.max(0, seconds % 60);
	const color = expired || seconds < 120 ? 'red' : seconds < 300 ? 'amber' : 'green';
	return (
		<div className="flex items-center justify-between gap-3 bg-rubber px-3 py-2 text-chalk">
			<span className="index-label text-chalk/60">{expired ? 'Hold expired' : 'Places held'}</span>
			<span className="flex items-center gap-3">
				<Led color={color} className="text-lg">
					{String(m).padStart(2, '0')}:{String(s).padStart(2, '0')}
				</Led>
				{onExtend && seconds < 300 ? (
					<button type="button" onClick={onExtend} className="text-xs underline underline-offset-4">
						{expired ? 'Hold again' : 'Add time'}
					</button>
				) : null}
			</span>
		</div>
	);
}
