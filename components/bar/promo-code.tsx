'use client';

import { useId, useState } from 'react';
import type { DiscountCodeErrorResponse } from '@opencals/storefront-sdk';
import { clsx } from 'clsx';
import { useCart } from '@/contexts/cart-context';
import { codeState } from '@/lib/discount-state';

const ERRORS: Partial<Record<DiscountCodeErrorResponse['code'], string>> = {
	CODE_NOT_FOUND: 'We don’t recognise that code.',
	CODE_EXPIRED: 'That code has expired.',
	CODE_LIMIT_REACHED: 'That code has been used up.',
	CODE_NO_MATCHING_ITEMS: 'That code doesn’t cover anything on your bar.',
	minimum_requirement_not_met: 'Add a little more to use that code.',
};

/** "Got a code?" line; an applied code shows as a chalk tag with Remove. */
export function PromoCode({ tone = 'chalk', className }: { tone?: 'chalk' | 'rubber'; className?: string }) {
	const { cart, applyDiscountCode, removeDiscountCode, discountCodeError, clearDiscountCodeError } = useCart();
	const [open, setOpen] = useState(false);
	const [code, setCode] = useState('');
	const [pending, setPending] = useState(false);
	const id = useId();
	const state = codeState(cart);

	if (state.status !== 'none') {
		return (
			<div className={clsx('flex items-center justify-between gap-3 text-sm', className)}>
				<span className="index-label opacity-70">Code</span>
				<span className="flex items-center gap-3">
					<span className={clsx('mono border border-dashed px-2 py-0.5 text-xs uppercase', state.status === 'outranked' && 'line-through opacity-60')}>{state.code}</span>
					<button
						type="button"
						disabled={pending}
						className="text-xs underline underline-offset-4 opacity-80 hover:opacity-100"
						onClick={async () => {
							setPending(true);
							try {
								await removeDiscountCode();
							} finally {
								setPending(false);
							}
						}}
					>
						Remove
					</button>
				</span>
			</div>
		);
	}

	if (!open) {
		return (
			<button type="button" className={clsx('text-sm underline underline-offset-4 opacity-80 hover:opacity-100', className)} onClick={() => setOpen(true)}>
				Got a code?
			</button>
		);
	}

	return (
		<form
			className={className}
			onSubmit={async (e) => {
				e.preventDefault();
				if (!code.trim()) return;
				setPending(true);
				try {
					if (await applyDiscountCode(code.trim())) {
						setCode('');
						setOpen(false);
					}
				} finally {
					setPending(false);
				}
			}}
		>
			<label htmlFor={id} className="index-label opacity-70">
				Discount code
			</label>
			<div className="mt-1.5 flex gap-2">
				<input
					id={id}
					value={code}
					autoFocus
					onChange={(e) => {
						setCode(e.target.value);
						if (discountCodeError) clearDiscountCodeError();
					}}
					aria-invalid={Boolean(discountCodeError)}
					aria-describedby={discountCodeError ? `${id}-err` : undefined}
					className={clsx(
						'mono h-11 min-w-0 flex-1 rounded-[2px] border px-3 uppercase focus:outline-none',
						tone === 'chalk' ? 'border-chalk-line bg-chalk-3 focus:border-ink' : 'border-rubber-line bg-rubber-2 focus:border-chalk',
					)}
				/>
				<button type="submit" disabled={pending} className={clsx('h-11 rounded-[2px] px-4 text-xs font-semibold uppercase tracking-[0.06em]', tone === 'chalk' ? 'bg-ink text-chalk' : 'bg-chalk text-ink')}>
					Apply
				</button>
			</div>
			{discountCodeError ? (
				<p id={`${id}-err`} role="alert" className="mt-1.5 text-xs text-plate-red">
					{ERRORS[discountCodeError.code] ?? discountCodeError.message ?? 'That code didn’t work.'}
				</p>
			) : null}
		</form>
	);
}
