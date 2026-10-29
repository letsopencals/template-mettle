'use client';

import { createContext, useContext, useMemo, useState, type ReactNode } from 'react';

interface BarUi {
	open: boolean;
	setOpen: (open: boolean) => void;
}

const BarUiContext = createContext<BarUi | null>(null);

/** Whether the Bar drawer is open (header button, after "Load the bar"). */
export function BarUiProvider({ children }: { children: ReactNode }) {
	const [open, setOpen] = useState(false);
	const value = useMemo(() => ({ open, setOpen }), [open]);
	return <BarUiContext.Provider value={value}>{children}</BarUiContext.Provider>;
}

export function useBarUi(): BarUi {
	const ctx = useContext(BarUiContext);
	if (!ctx) throw new Error('useBarUi must be used within BarUiProvider');
	return ctx;
}
