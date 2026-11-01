'use client';

import { useMemo, useState } from 'react';
import dynamic from 'next/dynamic';
import Link from 'next/link';
import { clsx } from 'clsx';
import type { CheckoutQuestionResponse as CheckoutQuestion, CustomerProviderCatalogItem, PaymentProviderName } from '@opencals/storefront-sdk';
import { useCheckout, type CheckoutStep } from '@/contexts/checkout-context';
import { checkoutModeOf } from '@/lib/checkout-outcome';
import { useCart } from '@/contexts/cart-context';
import { useSettings } from '@/contexts/settings-context';
import { barPlates, barProgress } from '@/lib/bar';
import { formatPrice } from '@/lib/format';
import { Barbell } from '@/components/bar/barbell';
import { BarNudge } from '@/components/bar/bar-nudge';
import { BarLine } from '@/components/bar/bar-line';
import { BarTotals } from '@/components/bar/bar-totals';
import { PromoCode } from '@/components/bar/promo-code';
import { HoldTimer } from '@/components/bar/hold-timer';
import { CalibrationStrip } from '@/components/brand/calibration-strip';
import { Button } from '@/components/ui/button';
import { FieldLabel, Input, Select, Textarea } from '@/components/ui/input';

const StripePayment = dynamic(() => import('@/components/checkout/stripe-payment').then((m) => m.StripePayment), {
	ssr: false,
	loading: () => <div className="h-56 animate-pulse bg-chalk-2" aria-busy="true" aria-label="Loading secure payment form" />,
});

const setOf = (s: CheckoutStep) => (s === 'customer' ? 1 : s === 'questions' ? 2 : 3);

/** A numbered "set": active, done (one-line receipt + Edit) or still to come. */
function SetBlock({ n, title, state, receipt, onEdit, children }: { n: number; title: string; state: 'active' | 'done' | 'todo'; receipt?: React.ReactNode; onEdit?: () => void; children: React.ReactNode }) {
	return (
		<section aria-current={state === 'active' ? 'step' : undefined} className={clsx('border-t-2 pt-5', state === 'active' ? 'border-ink' : 'border-ink/15')}>
			<div className="flex items-baseline justify-between gap-4">
				<h2 className={clsx('flex items-baseline gap-4', state === 'todo' && 'opacity-40')}>
					<span className="mono text-sm">SET {String(n).padStart(2, '0')}</span>
					<span className="display text-4xl">{title}</span>
				</h2>
				{state === 'done' && onEdit ? (
					<button type="button" onClick={onEdit} className="text-sm underline underline-offset-4">
						Edit
					</button>
				) : null}
			</div>
			{state === 'done' && receipt ? <div className="mono mt-2 text-sm text-muted">{receipt}</div> : null}
			{state === 'active' ? <div className="mt-6">{children}</div> : null}
		</section>
	);
}

function QuestionField({ q, value, onChange }: { q: CheckoutQuestion; value: string; onChange: (v: string) => void }) {
	const t = q.translations?.[0];
	const title = t?.title ?? q.internalName;
	const id = `q-${q.id}`;
	if (q.type === 'checkbox') {
		return (
			<label htmlFor={id} className={clsx('flex cursor-pointer gap-3 border p-4', value === 'true' ? 'border-ink bg-chalk-3' : 'border-chalk-line bg-chalk-3')}>
				<input id={id} type="checkbox" required={q.required} checked={value === 'true'} onChange={(e) => onChange(e.target.checked ? 'true' : '')} className="mt-0.5 h-5 w-5 shrink-0 accent-[var(--color-ink)]" />
				<span>
					<span className="block font-semibold leading-snug">
						{title}
						{q.required ? <span className="text-plate-red"> *</span> : null}
					</span>
					{t?.description ? <span className="mt-1 block text-sm text-muted">{t.description}</span> : null}
				</span>
			</label>
		);
	}
	if (q.type === 'file-upload' || q.type === 'rating') return null;
	const options = t?.options ?? null;
	return (
		<div>
			<FieldLabel htmlFor={id} required={q.required}>
				{title}
			</FieldLabel>
			{t?.description ? <p className="-mt-0.5 mb-2 text-xs text-muted">{t.description}</p> : null}
			{q.type === 'dropdown' && options ? (
				<Select id={id} required={q.required} value={value} onChange={(e) => onChange(e.target.value)}>
					<option value="">Choose…</option>
					{options.map((o) => (
						<option key={o} value={o}>
							{o}
						</option>
					))}
				</Select>
			) : q.type === 'multi-line-text-field' ? (
				<Textarea id={id} required={q.required} value={value} onChange={(e) => onChange(e.target.value)} />
			) : (
				<Input id={id} required={q.required} value={value} onChange={(e) => onChange(e.target.value)} />
			)}
		</div>
	);
}

function methodCopy(p: CustomerProviderCatalogItem): { title: string; body: string; action: string } {
	switch (p.name) {
		case 'stripe':
			return { title: 'Card, Apple Pay or Google Pay', body: 'Pay now, securely through Stripe.', action: 'Continue to card' };
		case 'cash':
			return { title: 'Pay at the desk', body: 'Your places are held. Pay by card or phone when you arrive.', action: 'Confirm, pay at the desk' };
		case 'bank_transfer':
			return { title: 'Bank transfer', body: 'Our bank details come up on the next screen and in your email. Places are held until it lands.', action: 'Confirm, pay by transfer' };
		case 'stripe_invoice':
			return { title: 'Pay by invoice', body: 'We email an invoice you pay online, by card or bank, before the due date.', action: 'Confirm, send the invoice' };
		case 'no_payment_required':
			return { title: 'Nothing to pay', body: 'This one is on us.', action: 'Confirm booking' };
		default:
			return { title: p.displayName ?? p.name, body: p.description ?? '', action: 'Continue' };
	}
}

/**
 * Checkout: the Bar across the top (not a sticky side card), then three sets
 * stacked: 01 You, 02 Clearance (PAR-Q and questions), 03 Pay. A finished set
 * collapses to a one-line receipt with Edit.
 */
export function CheckoutView() {
	const c = useCheckout();
	const { cart, removeItem } = useCart();
	const { currency } = useSettings();
	const [method, setMethod] = useState<PaymentProviderName | undefined>(undefined);
	const items = useMemo(() => c.items.slice().sort((a, b) => (a.appointment?.from ?? '').localeCompare(b.appointment?.from ?? '')), [c.items]);
	const plates = useMemo(() => barPlates(items), [items]);
	const progress = useMemo(() => barProgress(items), [items]);
	const current = setOf(c.step);
	const state = (n: number) => (n < current ? 'done' : n === current ? 'active' : 'todo');
	const hasQuestions = c.questions.some((q) => q.type !== 'file-upload' && q.type !== 'rating');
	const total = cart ? formatPrice(cart.total, currency) : '';
	const chosen = method ?? (c.providers.length === 1 ? c.providers[0]?.name : undefined);

	if (!cart || items.length === 0) {
		return (
			<div className="container-x py-24">
				<p className="display display-md">The bar is empty</p>
				<p className="mt-3 text-muted">Load a session first.</p>
				<Link href="/schedule" className="mt-6 inline-block underline underline-offset-4">
					Go to the Floor
				</Link>
			</div>
		);
	}

	return (
		<div className="chalk-texture pb-24">
			{/* The Bar, across the top */}
			<section className="rubber-texture text-chalk">
				<div className="container-x grid gap-8 pb-8 pt-10 lg:grid-cols-12 lg:items-center">
					<div className="lg:col-span-4">
						<p className="index-label text-chalk/50">
							<span className="text-chalk">Checkout /</span> The Bar
						</p>
						<h1 className="display display-lg mt-2">Lock it in</h1>
						<p className="mt-3 text-chalk/70">
							{items.length} {items.length === 1 ? 'session' : 'sessions'} · {total}
						</p>
					</div>
					<div className="lg:col-span-8">
						<Barbell plates={plates} progress={progress} currency={currency} tone="rubber" />
						<BarNudge progress={progress} currency={currency} tone="rubber" />
					</div>
				</div>
				<CalibrationStrip />
			</section>
			<HoldTimer seconds={c.timeRemaining} onExtend={c.extendCart} />

			<div className="container-x mt-10 grid gap-12 lg:grid-cols-12">
				<div className="space-y-10 lg:col-span-7">
					<SetBlock n={1} title="You" state={state(1)} receipt={`${[c.firstName, c.lastName].filter(Boolean).join(' ')} · ${c.email}`} onEdit={() => c.setStep('customer')}>
						<form onSubmit={c.handleSaveCustomer} className="grid gap-4 sm:grid-cols-2">
							<div>
								<FieldLabel htmlFor="first" required>
									First name
								</FieldLabel>
								<Input id="first" autoComplete="given-name" required value={c.firstName} onChange={(e) => c.setFirstName(e.target.value)} />
							</div>
							<div>
								<FieldLabel htmlFor="last">Last name</FieldLabel>
								<Input id="last" autoComplete="family-name" value={c.lastName} onChange={(e) => c.setLastName(e.target.value)} />
							</div>
							<div className="sm:col-span-2">
								<FieldLabel htmlFor="email" required hint="Your booking and sign-in code go here">
									Email
								</FieldLabel>
								<Input id="email" type="email" autoComplete="email" required value={c.email} onChange={(e) => c.setEmail(e.target.value)} disabled={Boolean(c.customerId)} />
							</div>
							<div className="sm:col-span-2">
								<Button type="submit" size="lg" loading={c.submitting} disabled={c.isExpired}>
									{hasQuestions ? 'Next: clearance' : 'Next: pay'}
								</Button>
							</div>
						</form>
					</SetBlock>

					{hasQuestions ? (
						<SetBlock n={2} title="Clearance" state={state(2)} receipt="Health check done" onEdit={() => c.setStep('questions')}>
							<form onSubmit={c.handleSaveAnswers} className="space-y-5">
								<p className="text-sm text-muted">Your coach reads this before the session. Nobody else sees it.</p>
								{[...c.questions]
									.sort((a, b) => (a.order ?? 0) - (b.order ?? 0))
									.map((q) => (
										<QuestionField key={q.id} q={q} value={c.answers[q.id] ?? ''} onChange={(v) => c.setAnswers((a) => ({ ...a, [q.id]: v }))} />
									))}
								<Button type="submit" size="lg" loading={c.submitting} disabled={c.isExpired}>
									Next: pay
								</Button>
							</form>
						</SetBlock>
					) : null}

					<SetBlock n={hasQuestions ? 3 : 2} title="Pay" state={state(3)}>
						{c.holdLost ? (
							<div role="alert" className="border-l-4 border-plate-red bg-chalk-3 px-4 py-4">
								<p className="font-semibold">The hold ran out and a place went to someone else.</p>
								<p className="mt-1 text-sm text-muted">Nothing was charged. Load the bar again with a time that&rsquo;s still open.</p>
								<Button variant="primary" className="mt-4" onClick={c.restartFromFloor}>
									Pick a new time
								</Button>
							</div>
						) : c.step === 'payment' && c.paymentData ? (
							c.paymentData.clientSecret && checkoutModeOf(c.selectedProvider, c.providers) === 'internal' ? (
								<StripePayment
									clientSecret={c.paymentData.clientSecret}
									stripeAccountId={c.paymentData.stripeAccountId}
									publishableKey={c.paymentData.publishableKey}
									onSuccess={(id) => c.handleSubmitCheckout(id)}
									onError={(m) => c.setError(m)}
									disabled={c.isExpired || c.submitting}
									payLabel={total}
									fallback={
										c.providers.some((p) => p.name === 'cash') ? (
											<Button variant="outline" className="mt-4" onClick={() => void c.handleStartCheckout('cash')}>
												Confirm, pay at the desk
											</Button>
										) : null
									}
								/>
							) : (
								<Button size="lg" loading={c.submitting} onClick={() => c.handleSubmitCheckout()}>
									Confirm booking
								</Button>
							)
						) : c.providers.length === 0 ? (
							<p className="text-muted">Online payment isn&rsquo;t open right now. Call the desk and we&rsquo;ll book you in.</p>
						) : (
							<form
								onSubmit={(e) => {
									e.preventDefault();
									if (chosen) void c.handleStartCheckout(chosen);
								}}
								className="space-y-3"
							>
								<fieldset className="space-y-2">
									<legend className="sr-only">Payment method</legend>
									{c.providers.map((p) => {
										const copy = methodCopy(p);
										const on = chosen === p.name;
										return (
											<label key={p.name} className={clsx('flex cursor-pointer items-start gap-3 border p-4', on ? 'border-ink bg-chalk-3 shadow-[inset_4px_0_0_var(--color-plate-red)]' : 'border-chalk-line bg-chalk-3 hover:border-ink/40')}>
												<input type="radio" name="method" value={p.name} checked={on} onChange={() => setMethod(p.name)} className="mt-1 h-4 w-4 accent-[var(--color-ink)]" />
												<span>
													<span className="block font-semibold">{copy.title}</span>
													<span className="block text-sm text-muted">{copy.body}</span>
												</span>
											</label>
										);
									})}
								</fieldset>
								<Button type="submit" size="lg" fullWidth loading={c.submitting} disabled={!chosen || c.isExpired}>
									{chosen ? methodCopy(c.providers.find((p) => p.name === chosen)!).action : 'Choose how to pay'} · {total}
								</Button>
							</form>
						)}
					</SetBlock>
					{c.error ? (
						<p role="alert" className="border-l-4 border-plate-red bg-chalk-3 px-4 py-3 text-sm text-plate-red">
							{c.error}
						</p>
					) : null}
				</div>

				<aside className="lg:col-span-5">
					<div className="border border-ink/15 bg-chalk-3 p-5">
						<p className="index-label text-muted">On the bar</p>
						<ul className="divide-y divide-ink/10">
							{items.map((it) => (
								<BarLine key={it.id} item={it} currency={currency} onRemove={c.step === 'payment' ? undefined : () => void removeItem(it.id)} />
							))}
						</ul>
						<div className="border-t border-ink/15 pt-4">
							<PromoCode className="mb-3" />
							<BarTotals cart={cart} currency={currency} />
						</div>
					</div>
					<p className="mt-4 text-xs text-muted">Free to move or cancel up to 12 hours before each session, from your Training log.</p>
				</aside>
			</div>
		</div>
	);
}

