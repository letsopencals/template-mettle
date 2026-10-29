import type { ReactNode } from 'react';
import { CalibrationStrip } from '@/components/brand/calibration-strip';
import { Led } from '@/components/brand/led';

/** Sign-in pages: a rubber left slab with the LED step readout, the form on chalk. */
export function AuthShell({ step, title, intro, children, footer }: { step?: string; title: string; intro?: ReactNode; children: ReactNode; footer?: ReactNode }) {
	return (
		<div className="grid min-h-[calc(100svh-4.25rem)] md:grid-cols-2">
			<div className="rubber-texture flex flex-col justify-between p-8 text-chalk md:p-12">
				{step ? (
					<Led color="red" className="text-2xl">
						{step}
					</Led>
				) : (
					<span />
				)}
				<div>
					<h1 className="display display-xl whitespace-pre-line">{title}</h1>
					{intro ? <p className="mt-4 max-w-md text-chalk/70">{intro}</p> : null}
				</div>
				<CalibrationStrip className="mt-10" />
			</div>
			<div className="chalk-texture flex items-center p-8 md:p-12">
				<div className="w-full max-w-md">
					{children}
					{footer ? <p className="mt-8 text-sm text-muted">{footer}</p> : null}
				</div>
			</div>
		</div>
	);
}

export function Notice({ tone = 'error', children, className }: { tone?: 'error' | 'success'; children: ReactNode; className?: string }) {
	return (
		<p role={tone === 'error' ? 'alert' : 'status'} className={`border-l-4 bg-chalk-3 px-4 py-3 text-sm ${tone === 'error' ? 'border-plate-red' : 'border-plate-green'} ${className ?? ''}`}>
			{children}
		</p>
	);
}
