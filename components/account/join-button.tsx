'use client';

import { getJoinState } from '@/lib/booking-meta';
import { siteConfig } from '@/lib/site-config';
import { useNow } from '@/hooks/use-now';
import { buttonClasses } from '@/components/ui/button';

/** Join for Remote sessions: live from `joinWindowMinutes` before the start until the end. */
export function JoinButton({ from, to, url }: { from: string; to: string; url: string | null }) {
	const now = useNow(30_000);
	if (!now) return null;
	const state = getJoinState(from, to, now.getTime());
	if (state === 'ended') return null;
	if (!url) return <p className="text-sm text-muted">Your coach sends the video link before the session.</p>;
	if (state === 'early') return <span className="text-sm text-muted">Join opens {siteConfig.joinWindowMinutes} min before</span>;
	return (
		<a href={url} target="_blank" rel="noopener noreferrer" className={buttonClasses({ variant: 'plate' })}>
			Join now
		</a>
	);
}
