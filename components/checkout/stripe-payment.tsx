'use client';

import { useEffect, useMemo, useState, type FormEvent } from 'react';
import { type Appearance, type StripeElementsOptions, type StripeError, loadStripe } from '@stripe/stripe-js';
import { Elements, PaymentElement, useElements, useStripe } from '@stripe/react-stripe-js';
import { Button } from '@/components/ui/button';


// DESIGN.md tokens as hex (Stripe's iframe can't read CSS variables): ink on chalk, square fields, Albert Sans and Chivo Mono.
const INK = '#121212';
const CHALK = '#FBFAF6';
const MUTED = '#6B6862';
const DIM = '#9A968E';
const LINE = '#D9D4C8';
const RED = '#D7262E';
const FOCUS = '0 0 0 3px rgba(242, 194, 48, 0.45)';

const APPEARANCE: Appearance = {
	theme: 'flat',
	variables: {
		colorPrimary: INK,
		colorBackground: CHALK,
		colorText: INK,
		colorTextSecondary: MUTED,
		colorTextPlaceholder: DIM,
		colorDanger: RED,
		fontFamily: '"Albert Sans", system-ui, sans-serif',
		fontSizeBase: '15px',
		spacingUnit: '4px',
		borderRadius: '2px',
		focusBoxShadow: FOCUS,
		focusOutline: 'none',
	},
	rules: {
		'.Input': { border: `1px solid ${LINE}`, padding: '13px 14px', boxShadow: 'none' },
		'.Input:focus': { border: `1px solid ${INK}`, boxShadow: FOCUS, backgroundColor: '#ffffff' },
		'.Input--invalid': { border: `1px solid ${RED}` },
		'.Label': { color: MUTED, fontFamily: '"Chivo Mono", ui-monospace, monospace', fontSize: '11px', textTransform: 'uppercase', letterSpacing: '0.14em', marginBottom: '8px' },
		'.Tab': { border: `1px solid ${LINE}`, backgroundColor: CHALK, color: MUTED, boxShadow: 'none' },
		'.Tab--selected': { border: `1px solid ${INK}`, color: INK, boxShadow: `inset 0 -2px 0 ${RED}` },
		'.TabIcon--selected': { fill: INK },
		'.Error': { fontSize: '12px', color: RED },
	},
};

const FONTS: StripeElementsOptions['fonts'] = [{ cssSrc: 'https://fonts.googleapis.com/css2?family=Albert+Sans:wght@400;600&family=Chivo+Mono:wght@500&display=swap' }];

interface StripePaymentProps {
	clientSecret: string;
	stripeAccountId?: string | null;
	/** Key returned by checkout start (matches the account's test/live mode). */
	publishableKey?: string | null;
	/** Shown when no key is configured: switch to another provider (pay at the studio). */
	fallback?: React.ReactNode;
	onSuccess: (paymentIntentId: string) => void;
	onError: (message: string) => void;
	disabled?: boolean;
	/** Total shown on the pay button. */
	payLabel?: string;
	/** Lets the page's mobile pay bar mirror the processing state. */
	onProcessingChange?: (processing: boolean) => void;
}

export function StripePayment({
	clientSecret,
	stripeAccountId,
	publishableKey: responseKey,
	fallback,
	onSuccess,
	onError,
	disabled,
	payLabel,
	onProcessingChange,
}: StripePaymentProps) {
	const publishableKey = responseKey;
	const stripePromise = useMemo(() => {
		if (!publishableKey) return null;
		return loadStripe(publishableKey, { stripeAccount: stripeAccountId ?? undefined });
	}, [publishableKey, stripeAccountId]);

	const options = useMemo<StripeElementsOptions>(() => ({ clientSecret, appearance: APPEARANCE, fonts: FONTS }), [clientSecret]);

	if (!publishableKey) {
		return (
			<div className="border border-chalk-line bg-chalk-2 px-5 py-4" role="alert">
				<p className="index-label text-plate-red">Card payments are off</p>
				<p className="mt-1.5 text-sm text-ink">
					This gym hasn&rsquo;t switched on card payments yet
					{process.env.NODE_ENV === 'development' ? ' (connect Stripe in the Opencals dashboard)' : null}.
				</p>
				{fallback ?? null}
			</div>
		);
	}

	if (!stripePromise) return null;

	return (
		<Elements stripe={stripePromise} options={options}>
			<StripePaymentForm
				onSuccess={onSuccess}
				onError={onError}
				disabled={disabled}
				payLabel={payLabel}
				onProcessingChange={onProcessingChange}
			/>
		</Elements>
	);
}

function StripePaymentForm({
	onSuccess,
	onError,
	disabled,
	payLabel,
	onProcessingChange,
}: Omit<StripePaymentProps, 'clientSecret' | 'stripeAccountId' | 'publishableKey' | 'fallback'>) {
	const stripe = useStripe();
	const elements = useElements();
	const [processing, setProcessing] = useState(false);

	useEffect(() => {
		onProcessingChange?.(processing);
	}, [processing, onProcessingChange]);

	const handlePay = async (e: FormEvent) => {
		e.preventDefault();
		if (!stripe || !elements || processing || disabled) return;
		setProcessing(true);
		try {
			const { error, paymentIntent } = await stripe.confirmPayment({ elements, redirect: 'if_required' });
			if (error) {
				onError((error as StripeError).message ?? 'Payment failed');
				return;
			}
			if (paymentIntent?.id) {
				onSuccess(paymentIntent.id);
			} else {
				onError('Payment confirmation did not return a valid result.');
			}
		} catch (err: unknown) {
			onError(err instanceof Error ? err.message : 'Payment failed');
		} finally {
			setProcessing(false);
		}
	};

	return (
		<form onSubmit={handlePay} aria-busy={processing}>
			<PaymentElement options={{ layout: 'tabs' }} />
			<Button
				type="submit"
				variant="primary"
				size="lg"
				fullWidth
				className="mt-6"
				disabled={!stripe || !elements || processing || disabled}
			>
				{processing ? 'Processing payment…' : payLabel ? `Pay ${payLabel} and lock it in` : 'Pay and lock it in'}
			</Button>
			<p className="mt-4 flex items-center gap-2 text-xs text-muted">
				<svg className="h-3.5 w-3.5" viewBox="0 0 16 16" fill="none" stroke="currentColor" strokeWidth={1.3} aria-hidden>
					<rect x="3" y="7" width="10" height="7" />
					<path d="M5 7V5a3 3 0 016 0v2" />
				</svg>
				Card details go straight to Stripe, encrypted. We never see your card number.
			</p>
		</form>
	);
}
