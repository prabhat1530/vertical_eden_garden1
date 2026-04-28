interface Service {
    id: number;
    title: string;
    description: string;
    icon: string;
}

interface Product {
    id: number;
    name: string;
    description: string;
    price: number;
    imageUrl: string;
}

interface PortfolioItem {
    id: number;
    title: string;
    description: string;
    imageUrl: string;
}

interface BlogPost {
    id: number;
    title: string;
    content: string;
    author: string;
    date: string;
}

interface ContactFormData {
    name: string;
    email: string;
    message: string;
}

// ---- Auth, Booking & Payment Types ----

interface User {
    id: string;
    name: string;
    email: string;
    phone: string;
    passwordHash: string;
    createdAt: string;
}

interface BookingData {
    id: string;
    userId: string;
    serviceSlug: string;
    serviceName: string;
    areaSize: number;
    address: string;
    city: string;
    preferredDate: string;
    preferredTime: string;
    specialInstructions: string;
    basePrice: number;
    areaPrice: number;
    totalPrice: number;
    status: 'pending' | 'confirmed' | 'completed' | 'cancelled';
    paymentId: string | null;
    createdAt: string;
}

interface PaymentResult {
    success: boolean;
    paymentId: string;
    orderId: string;
    signature: string;
}

interface ServicePricing {
    slug: string;
    basePrice: number;
    perSqFt: number;
}

// Razorpay global type
interface RazorpayOptions {
    key: string;
    amount: number;
    currency: string;
    name: string;
    description: string;
    order_id?: string;
    prefill?: {
        name?: string;
        email?: string;
        contact?: string;
    };
    theme?: {
        color?: string;
    };
    handler: (response: any) => void;
    modal?: {
        ondismiss?: () => void;
    };
}

interface Window {
    Razorpay: new (options: RazorpayOptions) => {
        open: () => void;
        close: () => void;
    };
}