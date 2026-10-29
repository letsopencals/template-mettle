/** A safety pin, drawn in SVG, for the bib corners. */
export function SafetyPin({ className, flip = false }: { className?: string; flip?: boolean }) {
	return (
		<svg aria-hidden viewBox="0 0 64 22" className={className} style={flip ? { transform: 'scaleX(-1)' } : undefined}>
			<path d="M8 11 C8 4, 14 3, 18 7 L52 7 C58 7, 60 11, 56 14 L20 14" fill="none" stroke="#8A9399" strokeWidth="2.2" strokeLinecap="round" />
			<path d="M20 14 L52 14" fill="none" stroke="#B9BEC2" strokeWidth="2.2" strokeLinecap="round" />
			<circle cx="9" cy="11" r="4.2" fill="none" stroke="#8A9399" strokeWidth="2.2" />
			<rect x="49" y="5" width="12" height="11" rx="2" fill="#B9BEC2" />
		</svg>
	);
}
