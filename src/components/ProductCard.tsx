import React from 'react';

interface ProductCardProps {
    title: string;
    description: string;
    imageUrl: string;
    price: string;
}

const ProductCard: React.FC<ProductCardProps> = ({ title, description, imageUrl, price }) => {
    return (
        <div className="product-card">
            <img src={imageUrl} alt={title} className="product-image" />
            <h2 className="product-title">{title}</h2>
            <p className="product-description">{description}</p>
            <p className="product-price">{price}</p>
            <button className="add-to-cart">Add to Cart</button>
        </div>
    );
};

export default ProductCard;