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