'use client';

import { useEffect, useRef, useState } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { resolveLink, type ResolveLinkResult } from '@/app/auth/actions/resolve-link';
import { buttonClasses } from '@/components/ui/button';
import { AuthShell } from '@/components/auth/auth-shell';
import { normalizeRedirect } from '@/lib/link-redirect';

type ErrorCode = NonNullable<ResolveLinkResult['errorCode']>;

const ERROR_COPY: Record<ErrorCode, { title: string; message: string }> = {
	TOKEN_EXPIRED: { title: 'Link\nexpired.', message: 'Email links expire to keep your bookings safe. Sign in with a code instead.' },
	TOKEN_USED: { title: 'Link already\nused.', message: 'Each link works once. Sign in with a code to carry on.' },
	TOKEN_INVALID: { title: 'Unknown\nlink.', message: 'It may be cut short. Copy the whole link from the email, or sign in with a code.' },
};

/** Magic-link landing from booking emails: resolves once, then opens the target. */
export function LinkResolver({ token }: { token: string }) {
	const router = useRouter();
	const [status, setStatus] = useState<'resolving' | 'error'>('resolving');
	const [errorCode, setErrorCode] = useState<ErrorCode>('TOKEN_INVALID');
	const ran = useRef(false);

	useEffect(() => {
		if (!token || ran.current) return;
		ran.current = true;
		(async () => {
			try {
				const result = await resolveLink(token);
				if (result.success && result.redirectPath) {
					router.replace(normalizeRedirect(result.redirectPath));
					router.refresh();
					return;
				}
				setErrorCode(result.errorCode ?? 'TOKEN_INVALID');
			} catch {
				setErrorCode('TOKEN_INVALID');
			}
			setStatus('error');
		})();
	}, [token, router]);

	if (status === 'resolving') return <AuthShell step="LOADING" title={'One\nsec.'} intro="Opening your booking…">{null}</AuthShell>;
	const copy = ERROR_COPY[errorCode];
	return (
		<AuthShell step="ERR" title={copy.title} intro={copy.message}>
			<Link href="/login" className={buttonClasses({ size: 'lg', fullWidth: true })}>
				Sign in with a code
			</Link>
		</AuthShell>
	);
}
