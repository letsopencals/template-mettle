'use client';

import { useEffect, useRef, useState } from 'react';

/** Muted looping hero video (muted set through the ref, or autoplay is blocked). Hidden until it plays. */
export function HeroVideo({ src, poster }: { src: string; poster: string }) {
	const ref = useRef<HTMLVideoElement>(null);
	const [ok, setOk] = useState(true);
	useEffect(() => {
		const v = ref.current;
		if (!v) return;
		v.muted = true;
		if (window.matchMedia('(prefers-reduced-motion: reduce)').matches) return;
		v.play().catch(() => undefined);
	}, []);
	if (!ok) return null;
	return <video ref={ref} className="absolute inset-0 h-full w-full object-cover" src={src} poster={poster} loop playsInline muted preload="metadata" onError={() => setOk(false)} aria-hidden />;
}
