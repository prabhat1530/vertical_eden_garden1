import React from 'react';
import { RatingSummary } from '../services/ratings';
import './RatingBadge.css';

// "★ 4.5 (12 reviews)" on a service card; nothing if the service has no reviews yet.
const RatingBadge: React.FC<{ rating?: RatingSummary }> = ({ rating }) => {
    if (!rating || rating.count === 0) return null;

    const label = `Rated ${rating.averageRating} out of 5 from ${rating.count} review${rating.count === 1 ? '' : 's'}`;

    return (
        <span className="rating-badge" title={label} aria-label={label}>
            <span className="rating-badge-star" aria-hidden="true">★</span>
            <strong>{rating.averageRating.toFixed(1)}</strong>
            <span className="rating-badge-count" aria-hidden="true">({rating.count})</span>
        </span>
    );
};

export default RatingBadge;
