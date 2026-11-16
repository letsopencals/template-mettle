'use client';

import Link from 'next/link';
import { clsx } from 'clsx';
import { Led } from '@/components/brand/led';
import { useNow } from '@/hooks/use-now';

export interface NextUp {
	key: string;
	start: string;
	time: string;
	short: string;
	seatsLeft: number;
	href: string;
}

/**
 * "NEXT 18:15 BAG ROUNDS · 4 LEFT": the gym's interval timer in the header.
 * The server passes the next few classes; the browser picks the first one
 * that hasn't started, so a cached page never shows a past class.
 */
export function NextOnFloor({ upcoming, className }: { upcoming: NextUp[]; className?: string }) {
	const now = useNow(30_000);
	const next = now ? upcoming.find((u) => Date.parse(u.start) > now.getTime()) : upcoming[0];
	if (!next) return null;
	return (
		<Link href={next.href} className={clsx('items-center gap-2.5 whitespace-nowrap rounded-[2px] bg-black px-3 py-1.5 ring-1 ring-rubber-line transition-colors hover:ring-chalk/40', className)} aria-label={`Next on the floor: ${next.short} at ${next.time}, ${next.seatsLeft} ${next.seatsLeft === 1 ? 'place' : 'places'} left`}>
			<span className="index-label text-chalk/50">Next</span>
			<Led time={next.time} color="red" className="text-lg" />
			<span className="max-w-[8.5rem] truncate whitespace-nowrap text-[0.78rem] font-semibold uppercase tracking-[0.06em]">{next.short}</span>
			<Led color={next.seatsLeft <= 3 ? 'amber' : 'green'} className="whitespace-nowrap text-sm">
				{next.seatsLeft} left
			</Led>
		</Link>
	);
}
