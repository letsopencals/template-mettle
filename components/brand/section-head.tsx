import { clsx } from 'clsx';
import type { ReactNode } from 'react';

/**
 * Left-aligned section head: a mono index (`01 / FLOOR`) above a tall display
 * heading, with optional copy in a right-hand column.
 */
export function SectionHead({
	index,
	label,
	title,
	children,
	tone = 'chalk',
	as: Tag = 'h2',
	className,
}: {
	index?: string;
	label: string;
	title: ReactNode;
	children?: ReactNode;
	tone?: 'chalk' | 'rubber';
	as?: 'h1' | 'h2';
	className?: string;
}) {
	return (
		<div className={clsx('grid gap-6 md:grid-cols-12 md:items-end', className)}>
			<div className="md:col-span-7">
				<p className={clsx('index-label', tone === 'chalk' ? 'text-muted' : 'text-chalk/60')}>
					{index ? <span className={tone === 'chalk' ? 'text-ink' : 'text-chalk'}>{index} / </span> : null}
					{label}
				</p>
				<Tag className="display display-lg mt-3">{title}</Tag>
			</div>
			{children ? <div className={clsx('max-w-xl text-[1.02rem] leading-relaxed md:col-span-5', tone === 'chalk' ? 'text-ink-2' : 'text-chalk/75')}>{children}</div> : null}
		</div>
	);
}
