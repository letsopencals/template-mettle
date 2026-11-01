'use client';

import { createContext, useCallback, useContext, useEffect, useMemo, useState, type ReactNode } from 'react';
import { useRouter } from 'next/navigation';
import { signIn as nextAuthSignIn } from 'next-auth/react';
import { useSession } from 'next-auth/react';
import { useCart } from '@/contexts/cart-context';
import { usePaymentProviders } from '@/hooks/use-payment-providers';
import { useCheckoutQuestions } from '@/hooks/use-checkout-questions';
import { checkoutError, checkoutModeOf, CheckoutRequestError, savePaymentInstructions } from '@/lib/checkout-outcome';
import type {
	CustomerProviderCatalogItem,
	CheckoutResponse,
	CheckoutStartResponse,
	SubmitCheckout,
	CartItem,
	CheckoutQuestionResponse as CheckoutQuestion,
} from '@opencals/storefront-sdk';

export type CheckoutStep = 'customer' | 'questions' | 'payment-select' | 'payment';

const IN_PROGRESS_RETRIES = 2;
const IN_PROGRESS_WAIT_MS = 1500;

interface CheckoutContextValue {
	// State
	step: CheckoutStep;
	error: string | null;
	submitting: boolean;
	checkoutComplete: boolean;
	/** The API answered CART_EXPIRED: a held place was taken, so the bar has to be loaded again. */
	holdLost: boolean;

	// Customer
	email: string;
	firstName: string;
	lastName: string;
	customerId: string | null;
	setEmail: (v: string) => void;
	setFirstName: (v: string) => void;
	setLastName: (v: string) => void;

	// Questions
	questions: CheckoutQuestion[];
	answers: Record<string, string>;
	setAnswers: React.Dispatch<React.SetStateAction<Record<string, string>>>;

	// Payment
	providers: CustomerProviderCatalogItem[];
	selectedProvider: string | null;
	paymentData: CheckoutStartResponse | null;

	// Cart info
	items: CartItem[];
	isExpired: boolean;
	timeRemaining: number | null;
	minutes: number | null;
	seconds: number | null;

	// Actions
	setStep: (step: CheckoutStep) => void;
	setError: (error: string | null) => void;
	handleSaveCustomer: (e: React.FormEvent) => Promise<void>;
	handleSaveAnswers: (e: React.FormEvent) => Promise<void>;
	handleStartCheckout: (providerName: string) => Promise<void>;
	handleSubmitCheckout: (stripePaymentIntentId?: string) => Promise<void>;
	extendCart: () => void;
	restartFromFloor: () => void;
}

const CheckoutContext = createContext<CheckoutContextValue | undefined>(undefined);

export function CheckoutProvider({ children }: { children: ReactNode }) {
	const router = useRouter();
	const { data: session } = useSession();
	const { cart, cartId, isLoaded, timeRemaining, extendCart, clearCart } = useCart();

	const [step, setStep] = useState<CheckoutStep>('customer');
	const [error, setError] = useState<string | null>(null);
	const [submitting, setSubmitting] = useState(false);
	const [checkoutComplete, setCheckoutComplete] = useState(false);
	const [holdLost, setHoldLost] = useState(false);

	// Customer info
	const [email, setEmail] = useState('');
	const [firstName, setFirstName] = useState('');
	const [lastName, setLastName] = useState('');
	const [customerId, setCustomerId] = useState<string | null>(null);
	const [prefilled, setPrefilled] = useState(false);

	// Pre-fill from session
	useEffect(() => {
		if (session?.customer && !prefilled) {
			if (session.customer.id) setCustomerId(session.customer.id);
			if (session.customer.email) setEmail(session.customer.email);
			if (session.customer.firstName) setFirstName(session.customer.firstName);
			if (session.customer.lastName) setLastName(session.customer.lastName);
			setPrefilled(true);
		}
	}, [session, prefilled]);

	// Questions (cart-scoped) and payment providers (cart-aware) both load in
	// parallel via SWR — independent of the customer-save step, so there's no
	// sequential fetch waterfall. `answers` stays local to this step machine.
	const questions = useCheckoutQuestions(cartId);
	const providers = usePaymentProviders(cartId);
	const [answers, setAnswers] = useState<Record<string, string>>({});

	// Payment
	const [selectedProvider, setSelectedProvider] = useState<string | null>(null);
	const [paymentData, setPaymentData] = useState<CheckoutStartResponse | null>(null);

	// Redirect if no cart — but only once CartProvider has read the stored cart id
	// from localStorage. Before that cartId is always null, so a hard reload of
	// /checkout would otherwise bounce to /schedule.
	useEffect(() => {
		if (isLoaded && !cartId && !checkoutComplete) {
			router.replace('/schedule');
		}
	}, [isLoaded, cartId, checkoutComplete, router]);

	const cartHeaders = useCallback(
		(): Record<string, string> =>
			cartId
				? { 'X-Cart-Id': cartId, 'Content-Type': 'application/json' }
				: { 'Content-Type': 'application/json' },
		[cartId],
	);

	// Step 1: Save customer info
	const handleSaveCustomer = useCallback(
		async (e: React.FormEvent) => {
			e.preventDefault();
			setError(null);
			setSubmitting(true);

			try {
				const customerPayload = customerId
					? { customer: { kind: 'existing', customerId } }
					: { customer: { kind: 'new', email, firstName: firstName || undefined, lastName: lastName || undefined } };

				const res = await fetch('/api/checkout/save-customer', {
					method: 'POST',
					headers: cartHeaders(),
					body: JSON.stringify(customerPayload),
				});

				if (!res.ok) {
					const data = await res.json();
					throw new Error(data.error || 'Failed to save customer info');
				}

				const saveResult = await res.json();
				if (saveResult.customerId) {
					setCustomerId(saveResult.customerId);
				}

				// Questions are already loaded in parallel via SWR — just branch on them
				// (no sequential fetch here).
				setStep(questions.length > 0 ? 'questions' : 'payment-select');
			} catch (err: unknown) {
				setError(err instanceof Error ? err.message : 'An error occurred');
			} finally {
				setSubmitting(false);
			}
		},
		[email, firstName, lastName, customerId, cartHeaders, questions.length],
	);

	// Step 2: Save question answers
	const handleSaveAnswers = useCallback(
		async (e: React.FormEvent) => {
			e.preventDefault();
			setError(null);
			setSubmitting(true);

			try {
				// The API wants the question text alongside each answer (kept as a historical record).
				const answerArray = questions
					.filter((q) => answers[q.id] !== undefined && answers[q.id] !== '')
					.map((q) => ({
						questionId: q.id,
						question: q.translations?.[0]?.title ?? q.internalName,
						answer: answers[q.id] as string,
					}));

				const res = await fetch('/api/checkout/save-answers', {
					method: 'POST',
					headers: cartHeaders(),
					body: JSON.stringify({ answers: answerArray }),
				});

				if (!res.ok && res.status !== 204) {
					throw new Error('Failed to save answers');
				}

				setStep('payment-select');
			} catch (err: unknown) {
				setError(err instanceof Error ? err.message : 'An error occurred');
			} finally {
				setSubmitting(false);
			}
		},
		[answers, questions, cartHeaders],
	);

	// Shared by start and submit: a 409 CHECKOUT_IN_PROGRESS means another request for this cart (a double
	// click, a second tab) is still running, so wait a moment and ask again before giving up.
	const postCheckout = useCallback(
		async (path: string, body: unknown, fallback: string): Promise<Response> => {
			for (let attempt = 0; ; attempt++) {
				const res = await fetch(path, { method: 'POST', headers: cartHeaders(), body: JSON.stringify(body) });
				if (res.ok) return res;
				const err = await checkoutError(res, fallback);
				if (err.code === 'CHECKOUT_IN_PROGRESS' && attempt < IN_PROGRESS_RETRIES) {
					await new Promise((r) => setTimeout(r, IN_PROGRESS_WAIT_MS));
					continue;
				}
				throw err;
			}
		},
		[cartHeaders],
	);

	// Lands on /thank-you for an order: once the booking exists the cart is spent.
	const finish = useCallback(
		(orderId: string | null) => {
			setCheckoutComplete(true);
			clearCart();
			router.push(orderId ? `/thank-you?orderId=${encodeURIComponent(orderId)}` : '/thank-you');
		},
		[clearCart, router],
	);

	// Turns a failed checkout request into what the customer sees next.
	const handleFailure = useCallback(
		(err: unknown) => {
			if (!(err instanceof CheckoutRequestError)) {
				setError(err instanceof Error ? err.message : 'Something went wrong. Try again.');
				return;
			}
			switch (err.code) {
				case 'CART_ALREADY_CHECKED_OUT':
					// This bar is already an order (a second tab, a retry after a dropped connection).
					finish(err.orderId);
					return;
				case 'CART_EXPIRED':
					setHoldLost(true);
					setError(null);
					return;
				case 'CHECKOUT_IN_PROGRESS':
					setError('Still processing your booking. Give it a few seconds, then press the button again.');
					return;
				case 'PAYMENT_NOT_AUTHORIZED':
					setStep('payment');
					setError('Your card wasn’t authorised. Nothing was charged. Try again, or use another card.');
					return;
				default:
					setError(err.message);
			}
		},
		[finish],
	);

	// Step 4: Submit checkout
	const handleSubmitCheckout = useCallback(
		async (stripePaymentIntentId?: string) => {
			setError(null);
			setSubmitting(true);

			try {
				const submitPayload: SubmitCheckout = {
					appointmentsSettings: { markAsScheduled: true },
				};
				if (stripePaymentIntentId) {
					submitPayload.stripePaymentIntentId = stripePaymentIntentId;
				}

				const res = await postCheckout('/api/checkout/submit', submitPayload, 'Checkout failed');
				const data: CheckoutResponse = await res.json();

				// Auto-authenticate customer if tokens returned
				if (data.auth?.accessToken) {
					await nextAuthSignIn('checkout-token', {
						accessToken: data.auth.accessToken,
						refreshToken: data.auth.refreshToken,
						redirect: false,
					});
				}

				const orderId = data.order?.id ?? null;
				if (orderId) savePaymentInstructions(orderId, data.paymentInstructions);
				finish(orderId);
			} catch (err: unknown) {
				handleFailure(err);
			} finally {
				setSubmitting(false);
			}
		},
		[postCheckout, finish, handleFailure],
	);

	// Step 3: Start checkout with selected provider, then route on how that provider checks out.
	const handleStartCheckout = useCallback(
		async (providerName: string) => {
			setError(null);
			setSubmitting(true);
			setSelectedProvider(providerName);

			try {
				const startPayload: Record<string, unknown> = { provider: providerName };
				if (customerId) {
					startPayload.customer = { kind: 'existing', customerId };
				}

				const res = await postCheckout('/api/checkout/start', startPayload, 'Failed to start checkout');
				const data: CheckoutStartResponse = await res.json();
				setPaymentData(data);

				// Key off the RESPONSE provider: when nothing is collectible the backend swaps the requested one
				// (e.g. Stripe) for "no payment required".
				const provider: string = data.provider ?? providerName;
				setSelectedProvider(provider);
				const mode = checkoutModeOf(provider, providers);
				if (mode === 'manual' || mode === 'none') {
					// Desk, transfer, invoice or nothing to pay: no card form, place the order now.
					await handleSubmitCheckout();
				} else if (mode === 'redirect' && data.redirectUrl) {
					window.location.href = data.redirectUrl;
				} else {
					setStep('payment');
				}
			} catch (err: unknown) {
				handleFailure(err);
			} finally {
				setSubmitting(false);
			}
		},
		[customerId, providers, postCheckout, handleSubmitCheckout, handleFailure],
	);

	// After CART_EXPIRED: the held places are gone, so start a fresh bar on the Floor.
	const restartFromFloor = useCallback(() => {
		setHoldLost(false);
		setCheckoutComplete(true); // keeps the "no cart" effect from racing this navigation
		clearCart();
		router.push('/schedule');
	}, [clearCart, router]);

	const items = useMemo(() => (cart?.items ?? []) as CartItem[], [cart?.items]);
	const isExpired = timeRemaining !== null && timeRemaining <= 0;
	const minutes = timeRemaining !== null ? Math.floor(timeRemaining / 60) : null;
	const seconds = timeRemaining !== null ? timeRemaining % 60 : null;

	// Memoized so consumers don't re-render on every provider render from an
	// inline object identity change.
	const value = useMemo<CheckoutContextValue>(
		() => ({
			step,
			error,
			submitting,
			checkoutComplete,
			holdLost,
			email,
			firstName,
			lastName,
			customerId,
			setEmail,
			setFirstName,
			setLastName,
			questions,
			answers,
			setAnswers,
			providers,
			selectedProvider,
			paymentData,
			items,
			isExpired,
			timeRemaining,
			minutes,
			seconds,
			setStep,
			setError,
			handleSaveCustomer,
			handleSaveAnswers,
			handleStartCheckout,
			handleSubmitCheckout,
			extendCart,
			restartFromFloor,
		}),
		[
			step,
			error,
			submitting,
			checkoutComplete,
			holdLost,
			email,
			firstName,
			lastName,
			customerId,
			questions,
			answers,
			providers,
			selectedProvider,
			paymentData,
			items,
			isExpired,
			timeRemaining,
			minutes,
			seconds,
			handleSaveCustomer,
			handleSaveAnswers,
			handleStartCheckout,
			handleSubmitCheckout,
			extendCart,
			restartFromFloor,
		],
	);

	return <CheckoutContext.Provider value={value}>{children}</CheckoutContext.Provider>;
}

export function useCheckout(): CheckoutContextValue {
	const ctx = useContext(CheckoutContext);
	if (!ctx) {
		throw new Error('useCheckout must be used within CheckoutProvider');
	}
	return ctx;
}
