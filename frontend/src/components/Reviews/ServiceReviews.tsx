import React, { useState, useEffect } from 'react';
import { FaStar } from 'react-icons/fa';
import { useAuth } from '../../context/AuthContext';
import './Reviews.css';

const API_URL = process.env.REACT_APP_API_URL || '/api';

interface Review {
    id: string;
    rating: number;
    comment: string;
    userName: string;
    createdAt: string;
}

interface Props {
    serviceSlug: string;
}

const ServiceReviews: React.FC<Props> = ({ serviceSlug }) => {
    const [reviews, setReviews] = useState<Review[]>([]);
    const [averageRating, setAverageRating] = useState(0);
    const [count, setCount] = useState(0);

    useEffect(() => {
        fetchReviews();
    }, [serviceSlug]);

    const fetchReviews = async () => {
        try {
            const res = await fetch(`${API_URL}/reviews/${serviceSlug}`);
            const data = await res.json();
            if (data.success) {
                setReviews(data.reviews);
                setAverageRating(data.averageRating);
                setCount(data.count);
            }
        } catch (error) {
            console.error('Failed to fetch reviews:', error);
        }
    };

    const renderStars = (rating: number) => {
        return Array.from({ length: 5 }, (_, i) => (
            <span key={i} className={`star ${i < Math.round(rating) ? '' : 'empty'}`}>
                <FaStar />
            </span>
        ));
    };

    return (
        <div className="reviews-section">
            <h2>Customer Reviews</h2>
            
            {count > 0 ? (
                <>
                    <div className="reviews-summary">
                        <span className="reviews-avg">{averageRating}</span>
                        <div className="reviews-stars">{renderStars(averageRating)}</div>
                        <span className="reviews-count">({count} review{count !== 1 ? 's' : ''})</span>
                    </div>

                    {reviews.map(review => (
                        <div key={review.id} className="review-card">
                            <div className="review-card-header">
                                <span className="review-user">{review.userName}</span>
                                <span className="review-date">{new Date(review.createdAt).toLocaleDateString()}</span>
                            </div>
                            <div className="review-rating">{renderStars(review.rating)}</div>
                            <p className="review-comment">{review.comment}</p>
                        </div>
                    ))}
                </>
            ) : (
                <p className="no-reviews">No reviews yet. Be the first to review this service!</p>
            )}
        </div>
    );
};

export default ServiceReviews;
