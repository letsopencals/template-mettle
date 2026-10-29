import { OrderDetailView } from '@/components/account/order-detail-view';

export const dynamic = 'force-dynamic';

type Params = Promise<{ orderId: string }>;

export default async function OrderPage({ params }: { params: Params }) {
	const { orderId } = await params;
	return (
		<div className="container-x pt-10">
			<OrderDetailView id={orderId} />
		</div>
	);
}
