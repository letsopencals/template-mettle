/**
 * Links into the Floor (`/schedule`). Pure, safe in RSC and client code.
 *
 * - `day=YYYY-MM-DD` (Melbourne date), `site=<collingwood|cremorne|remote>`,
 *   `discipline=<collection slug>`, `class=<class key>`, `coach=<staff slug>`,
 *   `max=<1–5>` (intensity cap). All optional; unknown values are ignored.
 * - `s=<seriesSlug>@<startISO>` opens that session's panel (and sets the day).
 */
export interface FloorParams {
	day?: string | null;
	site?: string | null;
	discipline?: string | null;
	class?: string | null;
	coach?: string | null;
	max?: number | null;
	occ?: { seriesSlug: string; start: string; localDate: string } | null;
}

export function sessionKey(o: { seriesSlug: string; start: string }): string {
	return `${o.seriesSlug}@${o.start}`;
}

export function floorHref(p: FloorParams = {}): string {
	const q = new URLSearchParams();
	const day = p.occ?.localDate ?? p.day;
	if (day) q.set('day', day);
	if (p.site) q.set('site', p.site);
	if (p.discipline) q.set('discipline', p.discipline);
	if (p.class) q.set('class', p.class);
	if (p.coach) q.set('coach', p.coach);
	if (p.max) q.set('max', String(p.max));
	if (p.occ) q.set('s', sessionKey(p.occ));
	const qs = q.toString();
	return qs ? `/schedule?${qs}` : '/schedule';
}
