import React from 'react';
import ProductCard from '../components/ProductCard';

const products = [
    {
        id: 1,
        name: 'Product 1',
        description: 'Description for Product 1',
        price: '$100',
        imageUrl: '/images/product1.jpg',
    },
    {
        id: 2,
        name: 'Product 2',
        description: 'Description for Product 2',
        price: '$150',
        imageUrl: '/images/product2.jpg',
    },
    {
        id: 3,
        name: 'Product 3',
        description: 'Description for Product 3',
        price: '$200',
        imageUrl: '/images/product3.jpg',
    },
];

const Products: React.FC = () => {
    return (
        <div className="products-page">
            <h1>Our Products</h1>
            <div className="products-list">
                {products.map(product => (
                    <ProductCard
                        key={product.id}
                        title={product.name}
                        description={product.description}
                        price={product.price}
                        imageUrl={product.imageUrl}
                    />
                ))}
            </div>
        </div>
    );
};

export default Products;