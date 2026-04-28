import React, { useState, useEffect } from 'react';
import { useHistory, Link } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { FaCalendarAlt, FaMapMarkerAlt, FaClock, FaLeaf, FaPlus, FaReceipt } from 'react-icons/fa';
import './MyBookings.css';

const API_URL = process.env.REACT_APP_API_URL || '/api';

interface BookingItem {
    id: string;
    serviceSlug: string;
    serviceName: string;
    areaSize: number;
    address: string;
    city: string;
    preferredDate: string;
    preferredTime: string;
    totalPrice: number;
    status: string;
    paymentId: string | null;
    createdAt: string;
}

const MyBookings: React.FC = () => {
    const { token, isAuthenticated } = useAuth();
    const history = useHistory();
    const [bookings, setBookings] = useState<BookingItem[]>([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState('');

    useEffect(() => {
        if (!isAuthenticated) {
            history.push('/login?redirect=/my-bookings');
            return;
        }

        // Fetch bookings from API
        const fetchBookings = async () => {
            try {
                const res = await fetch(`${API_URL}/bookings`, {
                    headers: {
                        'Authorization': `Bearer ${token}`,
                    },
                });

                const data = await res.json();

                if (data.success) {
                    setBookings(data.bookings);
                } else {
                    setError(data.error || 'Failed to load bookings.');
                }
            } catch {
                setError('Cannot connect to server. Please try again.');
            } finally {
                setLoading(false);
            }
        };

        fetchBookings();
    }, [isAuthenticated, token, history]);

    if (!isAuthenticated) return null;

    const getStatusClass = (status: string) => {
        switch (status) {
            case 'confirmed': return 'status-confirmed';
            case 'completed': return 'status-completed';
            case 'pending': return 'status-pending';
            case 'cancelled': return 'status-cancelled';
            default: return '';
        }
    };

    const getStatusLabel = (status: string) => {
        switch (status) {
            case 'confirmed': return 'Confirmed';
            case 'completed': return 'Completed';
            case 'pending': return 'Pending';
            case 'cancelled': return 'Cancelled';
            default: return status;
        }
    };

    const formatDate = (dateStr: string) => {
        return new Date(dateStr).toLocaleDateString('en-IN', {
            day: 'numeric',
            month: 'short',
            year: 'numeric'
        });
    };

    if (loading) {
        return (
            <div className="mybookings-page">
                <div className="mybookings-loading">
                    <div className="mybookings-spinner"></div>
                    <p>Loading your bookings...</p>
                </div>
            </div>
        );
    }

    return (
        <div className="mybookings-page">
            <div className="mybookings-header">
                <div className="mybookings-header-text">
                    <h1>My Bookings</h1>
                    <p>Manage and track your gardening service bookings</p>
                </div>
                <Link to="/booking" className="mybookings-new-btn" id="new-booking-btn">
                    {(FaPlus as any)({ size: 14 })} New Booking
                </Link>
            </div>

            {error && (
                <div className="mybookings-error">
                    {error}
                </div>
            )}

            {bookings.length === 0 && !error ? (
                <div className="mybookings-empty">
                    <div className="mybookings-empty-icon">
                        {(FaLeaf as any)({ size: 48 })}
                    </div>
                    <h3>No Bookings Yet</h3>
                    <p>You haven't made any bookings yet. Start by exploring our services.</p>
                    <Link to="/booking" className="mybookings-cta">Book a Service</Link>
                </div>
            ) : (
                <div className="mybookings-list">
                    {bookings.map((booking) => (
                        <div key={booking.id} className="mybooking-card" id={`booking-${booking.id}`}>
                            <div className="mybooking-card-top">
                                <div className="mybooking-service-info">
                                    <h3>{booking.serviceName}</h3>
                                    <span className="mybooking-id">
                                        {(FaReceipt as any)({ size: 12 })} {booking.id}
                                    </span>
                                </div>
                                <span className={`mybooking-status ${getStatusClass(booking.status)}`}>
                                    {getStatusLabel(booking.status)}
                                </span>
                            </div>

                            <div className="mybooking-card-details">
                                <div className="mybooking-detail">
                                    {(FaCalendarAlt as any)({ size: 14 })}
                                    <span>{formatDate(booking.preferredDate)}</span>
                                </div>
                                <div className="mybooking-detail">
                                    {(FaClock as any)({ size: 14 })}
                                    <span>{booking.preferredTime}</span>
                                </div>
                                <div className="mybooking-detail">
                                    {(FaMapMarkerAlt as any)({ size: 14 })}
                                    <span>{booking.city}</span>
                                </div>
                            </div>

                            <div className="mybooking-card-bottom">
                                <div className="mybooking-area">
                                    {booking.areaSize} sq ft
                                </div>
                                <div className="mybooking-price">
                                    ₹{booking.totalPrice.toLocaleString()}
                                </div>
                            </div>

                            {booking.paymentId && (
                                <div className="mybooking-payment-info">
                                    Payment ID: {booking.paymentId}
                                </div>
                            )}
                        </div>
                    ))}
                </div>
            )}
        </div>
    );
};

export default MyBookings;
