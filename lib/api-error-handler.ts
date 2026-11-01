import { OpencalsApiError } from '@opencals/storefront-sdk';
import { NextResponse } from 'next/server';


export function handleApiError(err: unknown, fallbackMessage = 'Internal server error') {
	if (err instanceof OpencalsApiError) {
		// The API puts `orderId` (409 CART_ALREADY_CHECKED_OUT) and `paymentStatus` (402 PAYMENT_NOT_AUTHORIZED)
		// next to `code` in the error body; pass them on so the checkout can act on them.
		const extra = err.body ?? {};
		const fieldErrors = err.toFieldErrors();
		return NextResponse.json(
			{
				error: err.message,
				...(err.code ? { code: err.code } : {}),
				...(typeof extra.orderId === 'string' ? { orderId: extra.orderId } : {}),
				...(typeof extra.paymentStatus === 'string' ? { paymentStatus: extra.paymentStatus } : {}),
				...(Object.keys(fieldErrors).length > 0 && { errors: fieldErrors }),
			},
			{ status: err.status },
		);
	}

	console.error(fallbackMessage, err);
	return NextResponse.json({ error: fallbackMessage }, { status: 500 });
}
