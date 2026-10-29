import { AppointmentDetail, type DetailAction } from '@/components/account/appointment-detail';

export const dynamic = 'force-dynamic';

type Params = Promise<{ appointmentId: string }>;
type Search = Promise<{ action?: string | string[] }>;

const ACTIONS: readonly DetailAction[] = ['cancel', 'reschedule', 'feedback'];

/** One session. Magic links land here with `?action=cancel|reschedule`. */
export default async function AppointmentPage({ params, searchParams }: { params: Params; searchParams: Search }) {
	const [{ appointmentId }, query] = await Promise.all([params, searchParams]);
	const raw = Array.isArray(query.action) ? query.action[0] : query.action;
	return (
		<div className="container-x pt-10">
			<AppointmentDetail id={appointmentId} initialAction={ACTIONS.find((a) => a === raw) ?? null} />
		</div>
	);
}
