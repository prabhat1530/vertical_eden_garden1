const API_URL = process.env.REACT_APP_API_URL || '/api';

export interface PaymentOptions {
    amount: number;
    customerName: string;
    customerEmail: string;
    customerPhone: string;
    description: string;
    bookingId: string;
}

export interface PaymentResponse {
    success: boolean;
    paymentId: string;
    orderId: string;
    signature: string;
    error?: string;
}

/**
 * Initiates payment flow:
 * 1. Calls backend to create a Razorpay order
 * 2. Opens Razorpay checkout modal
 * 3. On success, calls backend to verify payment signature
 */
export const initiatePayment = async (
    options: PaymentOptions,
    token: string
): Promise<PaymentResponse> => {
    try {
        // Step 1: Create Razorpay order on the server
        const orderRes = await fetch(`${API_URL}/payments/create-order`, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                'Authorization': `Bearer ${token}`,
            },
            body: JSON.stringify({ bookingId: options.bookingId }),
        });

        const orderData = await orderRes.json();

        if (!orderData.success) {
            return {
                success: false,
                paymentId: '',
                orderId: '',
                signature: '',
                error: orderData.error || 'Failed to create payment order.',
            };
        }

        // Step 2: Open Razorpay Checkout
        return new Promise((resolve) => {
            if (!(window as any).Razorpay) {
                resolve({
                    success: false,
                    paymentId: '',
                    orderId: '',
                    signature: '',
                    error: 'Payment gateway not loaded. Please refresh the page.',
                });
                return;
            }

            const razorpayOptions = {
                key: orderData.key,
                amount: orderData.order.amount,
                currency: orderData.order.currency,
                name: 'Vertical Eden Garden',
                description: options.description,
                order_id: orderData.order.id, // Server-created order ID
                prefill: {
                    name: options.customerName,
                    email: options.customerEmail,
                    contact: options.customerPhone,
                },
                theme: {
                    color: '#2e7d32',
                },
                handler: async (response: any) => {
                    // Step 3: Verify payment on the server
                    try {
                        const verifyRes = await fetch(`${API_URL}/payments/verify`, {
                            method: 'POST',
                            headers: {
                                'Content-Type': 'application/json',
                                'Authorization': `Bearer ${token}`,
                            },
                            body: JSON.stringify({
                                razorpay_order_id: response.razorpay_order_id,
                                razorpay_payment_id: response.razorpay_payment_id,
                                razorpay_signature: response.razorpay_signature,
                                bookingId: options.bookingId,
                            }),
                        });

                        const verifyData = await verifyRes.json();

                        if (verifyData.success) {
                            resolve({
                                success: true,
                                paymentId: response.razorpay_payment_id,
                                orderId: response.razorpay_order_id,
                                signature: response.razorpay_signature,
                            });
                        } else {
                            resolve({
                                success: false,
                                paymentId: '',
                                orderId: '',
                                signature: '',
                                error: verifyData.error || 'Payment verification failed.',
                            });
                        }
                    } catch {
                        resolve({
                            success: false,
                            paymentId: '',
                            orderId: '',
                            signature: '',
                            error: 'Payment verification failed. Please contact support.',
                        });
                    }
                },
                modal: {
                    ondismiss: () => {
                        resolve({
                            success: false,
                            paymentId: '',
                            orderId: '',
                            signature: '',
                            error: 'Payment was cancelled.',
                        });
                    },
                },
            };

            try {
                const rzp = new (window as any).Razorpay(razorpayOptions);
                rzp.open();
            } catch {
                resolve({
                    success: false,
                    paymentId: '',
                    orderId: '',
                    signature: '',
                    error: 'Failed to open payment gateway.',
                });
            }
        });
    } catch {
        return {
            success: false,
            paymentId: '',
            orderId: '',
            signature: '',
            error: 'Cannot connect to server. Please try again.',
        };
    }
};

// Service pricing configuration (kept for client-side price preview)
export const SERVICE_PRICING: ServicePricing[] = [
    { slug: 'artificial-grass', basePrice: 2000, perSqFt: 85 },
    { slug: 'artificial-green-wall', basePrice: 3000, perSqFt: 150 },
    { slug: 'terrace-garden', basePrice: 5000, perSqFt: 120 },
    { slug: 'creepers-and-shrubs', basePrice: 1500, perSqFt: 60 },
    { slug: 'natural-vertical-garden', basePrice: 4000, perSqFt: 200 },
    { slug: 'plants-and-planters', basePrice: 1000, perSqFt: 40 },
];

export const calculatePrice = (slug: string, areaSqFt: number): { basePrice: number; areaPrice: number; total: number } => {
    const pricing = SERVICE_PRICING.find(p => p.slug === slug);
    if (!pricing) {
        return { basePrice: 2000, areaPrice: areaSqFt * 100, total: 2000 + areaSqFt * 100 };
    }
    const areaPrice = areaSqFt * pricing.perSqFt;
    return {
        basePrice: pricing.basePrice,
        areaPrice,
        total: pricing.basePrice + areaPrice,
    };
};
