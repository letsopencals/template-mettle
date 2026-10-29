import { OrdersView } from '@/components/account/orders-view';

export const dynamic = 'force-dynamic';

export default function OrdersPage() {
	return (
		<div className="container-x pt-10">
			<h1 className="display display-md mb-6">Orders</h1>
			<OrdersView />
		</div>
	);
}
