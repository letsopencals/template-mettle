'use client';

import { useState } from 'react';
import Image, { type ImageProps } from 'next/image';

export type SafeImageProps = Omit<ImageProps, 'src'> & {
	/** Local (/images/...) or remote (*.opencals.com) URL. null/'' → nothing. */
	src: string | null | undefined;
};

/**
 * next/image that renders nothing when the file is missing or fails to load,
 * so the parent's `.image-placeholder` background shows instead of a broken
 * icon. Always place it in a container with a background.
 */
export function SafeImage({ src, alt, onError, ...props }: SafeImageProps) {
	const [failedSrc, setFailedSrc] = useState<string | null>(null);
	if (!src || failedSrc === src) return null;
	return (
		<Image
			src={src}
			alt={alt}
			onError={(e) => {
				setFailedSrc(src);
				onError?.(e);
			}}
			{...props}
		/>
	);
}
