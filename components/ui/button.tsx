import { forwardRef, type ButtonHTMLAttributes } from 'react';
import { clsx } from 'clsx';

export type ButtonVariant = 'primary' | 'chalk' | 'outline' | 'outline-chalk' | 'ghost' | 'plate';
export type ButtonSize = 'sm' | 'md' | 'lg';

const BASE =
	'inline-flex select-none items-center justify-center gap-2 rounded-[2px] font-sans font-semibold uppercase tracking-[0.06em] transition-[background-color,color,border-color,transform] duration-150 active:translate-y-px disabled:pointer-events-none disabled:opacity-45';

/** Flat slabs with a 2px "plate lip" on the bottom edge. */
const VARIANTS: Record<ButtonVariant, string> = {
	primary: 'bg-ink text-chalk shadow-[inset_0_-2px_0_var(--color-plate-red)] hover:bg-ink-2',
	chalk: 'bg-chalk text-ink shadow-[inset_0_-2px_0_var(--color-plate-yellow)] hover:bg-white',
	outline: 'border border-ink text-ink hover:bg-ink hover:text-chalk',
	'outline-chalk': 'border border-chalk/60 text-chalk hover:border-chalk hover:bg-chalk hover:text-ink',
	ghost: 'text-ink underline-offset-4 hover:underline',
	plate: 'bg-plate-yellow text-ink shadow-[inset_0_-2px_0_rgba(0,0,0,0.35)] hover:brightness-105',
};

const SIZES: Record<ButtonSize, string> = {
	sm: 'h-9 px-3.5 text-[0.72rem]',
	md: 'h-11 px-5 text-[0.8rem]',
	lg: 'h-14 px-7 text-[0.9rem]',
};

export function buttonClasses({
	variant = 'primary',
	size = 'md',
	fullWidth = false,
	className,
}: {
	variant?: ButtonVariant;
	size?: ButtonSize;
	fullWidth?: boolean;
	className?: string;
} = {}): string {
	return clsx(BASE, VARIANTS[variant], SIZES[size], fullWidth && 'w-full', className);
}

export interface ButtonProps extends ButtonHTMLAttributes<HTMLButtonElement> {
	variant?: ButtonVariant;
	size?: ButtonSize;
	fullWidth?: boolean;
	loading?: boolean;
}

export const Button = forwardRef<HTMLButtonElement, ButtonProps>(function Button(
	{ variant, size, fullWidth, loading, className, children, disabled, type = 'button', ...props },
	ref,
) {
	return (
		<button ref={ref} type={type} disabled={disabled || loading} aria-busy={loading || undefined} className={buttonClasses({ variant, size, fullWidth, className })} {...props}>
			{loading ? <span aria-hidden className="h-3 w-3 animate-spin rounded-full border-2 border-current border-t-transparent" /> : null}
			{children}
		</button>
	);
});
