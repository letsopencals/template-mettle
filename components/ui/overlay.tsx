'use client';

import { useRef, type ReactNode } from 'react';
import { createPortal } from 'react-dom';
import { clsx } from 'clsx';
import { useModalOverlay, useMounted } from '@/components/ui/use-overlay';

export function CloseButton({ onClick, tone = 'chalk' }: { onClick: () => void; tone?: 'chalk' | 'rubber' }) {
	return (
		<button
			type="button"
			onClick={onClick}
			aria-label="Close"
			className={clsx(
				'flex h-10 w-10 items-center justify-center rounded-[2px] transition-colors',
				tone === 'chalk' ? 'text-ink hover:bg-chalk-2' : 'text-chalk hover:bg-rubber-3',
			)}
		>
			<svg aria-hidden viewBox="0 0 14 14" className="h-3.5 w-3.5" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="square">
				<path d="M2 2l10 10M12 2 2 12" />
			</svg>
		</button>
	);
}

/**
 * The one overlay primitive. `drawer` slides from the right (the Bar, the
 * menu); `sheet` rises from the bottom on phones and centres as a dialog from
 * 640px (session details on mobile, cancel/move dialogs).
 */
export function Overlay({
	open,
	onClose,
	kind,
	label,
	tone = 'chalk',
	className,
	children,
}: {
	open: boolean;
	onClose: () => void;
	kind: 'drawer' | 'sheet';
	label: string;
	tone?: 'chalk' | 'rubber';
	className?: string;
	children: ReactNode;
}) {
	const mounted = useMounted();
	const panelRef = useRef<HTMLDivElement>(null);
	useModalOverlay(open, onClose, panelRef);
	if (!mounted || !open) return null;
	return createPortal(
		<div
			className={clsx('fixed inset-0 z-[70] flex bg-black/55', kind === 'drawer' ? 'justify-end' : 'items-end justify-center sm:items-center sm:p-6')}
			onMouseDown={(e) => {
				if (e.target === e.currentTarget) onClose();
			}}
		>
			<div
				ref={panelRef}
				role="dialog"
				aria-modal="true"
				aria-label={label}
				tabIndex={-1}
				className={clsx(
					'relative flex max-h-[100svh] flex-col outline-none',
					tone === 'chalk' ? 'bg-chalk text-ink' : 'rubber-texture text-chalk',
					kind === 'drawer' ? 'drawer-in h-full w-full max-w-[30rem]' : 'sheet-up max-h-[92svh] w-full rounded-t-[2px] sm:max-w-xl sm:rounded-[2px]',
					className,
				)}
			>
				{children}
			</div>
		</div>,
		document.body,
	);
}
