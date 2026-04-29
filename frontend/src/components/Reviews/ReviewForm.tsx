import React, { useState } from 'react';
import { FaStar } from 'react-icons/fa';
import { useAuth } from '../../context/AuthContext';
import './Reviews.css';

const API_URL = process.env.REACT_APP_API_URL || '/api';

interface Props {
    bookingId: string;
    serviceName: string;
    onClose: () => void;
    onSuccess: () => void;
}

const ReviewForm: React.FC<Props> = ({ bookingId, serviceName, onClose, onSuccess }) => {
    const { token } = useAuth();
    const [rating, setRating] = useState(0);
    const [hoverRating, setHoverRating] = useState(0);
    const [comment, setComment] = useState('');
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState('');

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        if (rating === 0) { setError('Please select a rating.'); return; }
        setError('');
        setLoading(true);

        try {
            const res = await fetch(`${API_URL}/reviews`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${token}` },
                body: JSON.stringify({ bookingId, rating, comment }),
            });
            const data = await res.json();
            if (data.success) {
                onSuccess();
            } else {
                setError(data.error || 'Failed to submit review.');
            }
        } catch {
            setError('Cannot connect to server.');
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="review-form-overlay" onClick={onClose}>
            <div className="review-form-card" onClick={e => e.stopPropagation()}>
                <h3>Review: {serviceName}</h3>

                {error && <div className="profile-msg error" style={{ marginBottom: '1rem' }}>{error}</div>}

                <form onSubmit={handleSubmit}>
                    <div className="star-selector">
                        {[1, 2, 3, 4, 5].map(n => (
                            <button
                                key={n}
                                type="button"
                                className={`star-btn ${n <= (hoverRating || rating) ? 'active' : ''}`}
                                onMouseEnter={() => setHoverRating(n)}
                                onMouseLeave={() => setHoverRating(0)}
                                onClick={() => setRating(n)}
                            >
                                <FaStar />
                            </button>
                        ))}
                    </div>

                    <textarea
                        placeholder="Share your experience..."
                        value={comment}
                        onChange={e => setComment(e.target.value)}
                        required
                    />

                    <div className="review-form-actions">
                        <button type="button" className="review-cancel-btn" onClick={onClose}>Cancel</button>
                        <button type="submit" className="review-submit-btn" disabled={loading}>
                            {loading ? 'Submitting...' : 'Submit Review'}
                        </button>
                    </div>
                </form>
            </div>
        </div>
    );
};

export default ReviewForm;
