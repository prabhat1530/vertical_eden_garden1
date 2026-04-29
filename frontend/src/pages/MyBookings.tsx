import React, { useState, useEffect } from 'react';
import { useHistory, Link } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { FaCalendarAlt, FaMapMarkerAlt, FaClock, FaLeaf, FaPlus, FaReceipt, FaStar, FaDownload } from 'react-icons/fa';
import ReviewForm from '../components/Reviews/ReviewForm';
import jsPDF from 'jspdf';
import 'jspdf-autotable';
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
    const { user, token, isAuthenticated } = useAuth();
    const history = useHistory();
    const [bookings, setBookings] = useState<BookingItem[]>([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState('');
    const [reviewBooking, setReviewBooking] = useState<BookingItem | null>(null);
    const [reviewedBookings, setReviewedBookings] = useState<string[]>([]);

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

    const generateInvoice = (booking: BookingItem) => {
        const doc = new jsPDF();
        
        // Header
        doc.setFontSize(22);
        doc.setTextColor(46, 125, 50); // Primary green
        doc.text('Vertical Eden Garden', 14, 20);
        
        doc.setFontSize(10);
        doc.setTextColor(100);
        doc.text('Official Booking Invoice', 14, 28);
        
        // Invoice details
        doc.setFontSize(12);
        doc.setTextColor(50);
        doc.text(`Invoice ID: INV-${booking.id.substring(0, 8).toUpperCase()}`, 14, 45);
        doc.text(`Issue Date: ${new Date().toLocaleDateString()}`, 14, 52);
        
        // Customer details
        doc.setFontSize(14);
        doc.setTextColor(0);
        doc.text('Customer Details', 14, 70);
        
        doc.setFontSize(11);
        doc.setTextColor(80);
        const custName = user?.name || 'Customer';
        const custEmail = user?.email || 'N/A';
        const custPhone = user?.phone || 'N/A';
        doc.text(`Name: ${custName}`, 14, 78);
        doc.text(`Email: ${custEmail}`, 14, 84);
        doc.text(`Phone: ${custPhone}`, 14, 90);
        doc.text(`Service Address: ${booking.address}, ${booking.city}`, 14, 96);
        
        // Service details Table
        (doc as any).autoTable({
            startY: 110,
            head: [['Service Name', 'Date', 'Time', 'Area Size', 'Amount']],
            body: [
                [
                    booking.serviceName, 
                    formatDate(booking.preferredDate), 
                    booking.preferredTime, 
                    `${booking.areaSize} sq.ft`, 
                    `Rs. ${booking.totalPrice.toLocaleString()}`
                ]
            ],
            theme: 'striped',
            headStyles: { fillColor: [46, 125, 50] }
        });
        
        const finalY = (doc as any).lastAutoTable.finalY || 150;
        
        // Total
        doc.setFontSize(14);
        doc.setTextColor(0);
        doc.text(`Total Paid: Rs. ${booking.totalPrice.toLocaleString()}`, 14, finalY + 15);
        
        // Footer
        doc.setFontSize(10);
        doc.setTextColor(150);
        doc.text('Thank you for choosing Vertical Eden Garden!', 105, finalY + 40, { align: 'center' });
        
        doc.save(`Invoice_${booking.id.substring(0, 8)}.pdf`);
    };

    if (loading) {
        return (
            <div className="mybookings-page">
                <div className="mybookings-header-bg">
                    <div className="mybookings-header-content">
                        <div className="skeleton skeleton-title" style={{ width: '300px', height: '40px' }}></div>
                    </div>
                </div>
                <div className="mybookings-container">
                    <div className="bookings-grid">
                        {[...Array(4)].map((_, i) => (
                            <div key={i} className="booking-card skeleton skeleton-card" style={{ height: '250px' }}></div>
                        ))}
                    </div>
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
                            {booking.status === 'completed' && !reviewedBookings.includes(booking.id) && (
                                <button 
                                    className="review-btn"
                                    onClick={() => setReviewBooking(booking)}
                                >
                                    <FaStar /> Leave a Review
                                </button>
                            )}
                            {booking.status === 'completed' && (
                                <button 
                                    className="invoice-btn"
                                    onClick={() => generateInvoice(booking)}
                                >
                                    <FaDownload /> Download Invoice
                                </button>
                            )}
                            {reviewedBookings.includes(booking.id) && (
                                <span style={{ fontSize: '0.8rem', color: '#10b981', marginTop: '8px', display: 'block' }}>✓ Reviewed</span>
                            )}
                        </div>
                    ))}
                </div>
            )}

            {reviewBooking && (
                <ReviewForm
                    bookingId={reviewBooking.id}
                    serviceName={reviewBooking.serviceName}
                    onClose={() => setReviewBooking(null)}
                    onSuccess={() => {
                        setReviewedBookings(prev => [...prev, reviewBooking.id]);
                        setReviewBooking(null);
                    }}
                />
            )}
        </div>
    );
};

export default MyBookings;
