'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import { signIn } from 'next-auth/react';
import { useRouter } from 'next/navigation';
import { z } from 'zod';
import { Button } from '@/components/ui/button';
import { FieldLabel, Input } from '@/components/ui/input';
import { AuthShell, Notice } from '@/components/auth/auth-shell';

const emailSchema = z.string().min(1, 'Email is required').email('Please enter a valid email');
type Step = 'email' | 'code';

/**
 * Passwordless sign-in: email → 6-digit code (the `login-code` provider).
 * Booking emails also carry a magic link (/link/[token]). An account is made
 * when a guest books; there's no sign-up.
 */
export function LoginForm({ callbackUrl, initialEmail = '' }: { callbackUrl: string; initialEmail?: string }) {
	const router = useRouter();
	const [step, setStep] = useState<Step>('email');
	const [email, setEmail] = useState(initialEmail);
	const [code, setCode] = useState('');
	const [error, setError] = useState<string | null>(null);
	const [loading, setLoading] = useState(false);
	const [cooldown, setCooldown] = useState(0);

	useEffect(() => {
		if (cooldown <= 0) return;
		const id = setTimeout(() => setCooldown((c) => c - 1), 1000);
		return () => clearTimeout(id);
	}, [cooldown]);

	const sendCode = async () => {
		setError(null);
		const parsed = emailSchema.safeParse(email.trim());
		if (!parsed.success) return setError(parsed.error.issues[0]?.message ?? 'Please enter a valid email');
		setLoading(true);
		try {
			const res = await fetch('/api/auth/request-login-code', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ email: parsed.data }) });
			if (!res.ok && res.status !== 404) throw new Error('request failed');
			setCooldown(60);
			setCode('');
			setStep('code');
		} catch {
			setError('Something went wrong. Please try again.');
		} finally {
			setLoading(false);
		}
	};

	const verifyCode = async () => {
		setError(null);
		if (code.trim().length < 6) return setError('Enter the 6-digit code from your email.');
		setLoading(true);
		try {
			const result = await signIn('login-code', { email: email.trim(), code: code.trim(), redirect: false });
			if (result?.error) setError('That code is wrong or expired. Try again.');
			else {
				router.push(callbackUrl);
				router.refresh();
			}
		} catch {
			setError('Something went wrong. Please try again.');
		} finally {
			setLoading(false);
		}
	};

	return (
		<AuthShell
			step={step === 'email' ? 'SET 1/2' : 'SET 2/2'}
			title={step === 'email' ? 'Back on\nthe floor.' : 'Check your\ninbox.'}
			intro={step === 'email' ? 'Sign in to see your Training log, move or cancel a session and join Remote sessions. No password: we email you a code.' : 'Enter the 6-digit code we just sent.'}
			footer={
				<>
					No account yet? One is made when you book.{' '}
					<Link href="/schedule" className="underline underline-offset-4">
						See the Floor
					</Link>
				</>
			}
		>
			{error ? <Notice className="mb-6">{error}</Notice> : null}
			{step === 'email' ? (
				<form
					onSubmit={(e) => {
						e.preventDefault();
						void sendCode();
					}}
					className="space-y-5"
				>
					<div>
						<FieldLabel htmlFor="login-email">Email</FieldLabel>
						<Input id="login-email" type="email" autoComplete="email" autoFocus value={email} onChange={(e) => setEmail(e.target.value)} placeholder="you@example.com" />
					</div>
					<Button type="submit" size="lg" fullWidth loading={loading}>
						Email me a code
					</Button>
				</form>
			) : (
				<form
					onSubmit={(e) => {
						e.preventDefault();
						void verifyCode();
					}}
					className="space-y-5"
				>
					<p className="text-sm text-muted">
						Sent to <span className="font-semibold text-ink">{email}</span>. The email also has a link you can tap instead.
					</p>
					<Input
						type="text"
						inputMode="numeric"
						autoComplete="one-time-code"
						autoFocus
						maxLength={6}
						value={code}
						onChange={(e) => setCode(e.target.value.replace(/\D/g, ''))}
						placeholder="000000"
						aria-label="6-digit login code"
						className="mono h-16 text-center text-2xl tracking-[0.6em]"
					/>
					<Button type="submit" size="lg" fullWidth loading={loading}>
						Sign in
					</Button>
					<div className="flex justify-between text-sm">
						<button type="button" onClick={() => void sendCode()} disabled={cooldown > 0 || loading} className="text-muted underline underline-offset-4 disabled:opacity-40">
							{cooldown > 0 ? `Resend in ${cooldown}s` : 'Resend code'}
						</button>
						<button type="button" onClick={() => setStep('email')} className="text-muted underline underline-offset-4">
							Different email
						</button>
					</div>
				</form>
			)}
		</AuthShell>
	);
}
