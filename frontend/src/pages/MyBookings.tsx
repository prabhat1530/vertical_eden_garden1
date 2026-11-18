import React, { useState, useEffect } from 'react';
import { useHistory, Link } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { FaCalendarAlt, FaMapMarkerAlt, FaClock, FaLeaf, FaPlus, FaReceipt, FaStar, FaDownload, FaTimes, FaExchangeAlt, FaCreditCard } from 'react-icons/fa';
import ReviewForm from '../components/Reviews/ReviewForm';
import SlotSelect from '../components/SlotSelect';
import { apiFetch } from '../services/api';
import { initiatePayment } from '../services/PaymentService';
import jsPDF from 'jspdf';
import 'jspdf-autotable';
import './MyBookings.css';

const MAX_RESCHEDULES = 2;

// Tomorrow as YYYY-MM-DD (earliest bookable date).
const getMinDate = () => {
    const tomorrow = new Date();
    tomorrow.setDate(tomorrow.getDate() + 1);
    return tomorrow.toISOString().split('T')[0];
};

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
    holdExpiresAt: string | null;
    cancelledBy: string | null;
    cancelReason: string;
    refundStatus: 'none' | 'pending' | 'refunded';
    rescheduleCount: number;
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
    // Booking currently being rescheduled, and the new date/time picked for it.
    const [rescheduling, setRescheduling] = useState<BookingItem | null>(null);
    const [newDate, setNewDate] = useState('');
    const [newTime, setNewTime] = useState('');
    const [slotRefreshKey, setSlotRefreshKey] = useState(0);
    const [busyId, setBusyId] = useState('');      // booking with a request in flight
    const [notice, setNotice] = useState('');      // success message banner

    const fetchBookings = async () => {
        try {
            const res = await apiFetch('/bookings');
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

    useEffect(() => {
        if (!isAuthenticated) {
            history.push('/login?redirect=/my-bookings');
            return;
        }
        fetchBookings();
    }, [isAuthenticated, token, history]);

    // Replace one booking in the list with the server's updated copy.
    const replaceBooking = (updated: BookingItem) =>
        setBookings((prev) => prev.map((b) => (b.id === updated.id ? updated : b)));

    const showResult = (message: string, isError: boolean) => {
        setNotice(isError ? '' : message);
        setError(isError ? message : '');
        window.scrollTo({ top: 0, behavior: 'smooth' });
    };

    const handleCancel = async (booking: BookingItem) => {
        const paid = booking.status === 'confirmed';
        const question = paid
            ? 'Cancel this booking? Your payment will be refunded within 5–7 working days.'
            : 'Cancel this booking?';
        if (!window.confirm(question)) return;

        setBusyId(booking.id);
        try {
            const res = await apiFetch(`/bookings/${booking.id}/cancel`, { method: 'PUT' });
            const data = await res.json();
            if (data.success) {
                replaceBooking(data.booking);
                showResult('Booking cancelled.' + (paid ? ' Your refund has been requested.' : ''), false);
            } else {
                showResult(data.error || 'Could not cancel the booking.', true);
            }
        } catch {
            showResult('Cannot connect to server. Please try again.', true);
        }
        setBusyId('');
    };

    const openReschedule = (booking: BookingItem) => {
        setRescheduling(booking);
        setNewDate('');
        setNewTime('');
    };

    const handleReschedule = async () => {
        if (!rescheduling || !newDate || !newTime) return;
        setBusyId(rescheduling.id);
        try {
            const res = await apiFetch(`/bookings/${rescheduling.id}/reschedule`, {
                method: 'PUT',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ preferredDate: newDate, preferredTime: newTime }),
            });
            const data = await res.json();
            if (data.success) {
                replaceBooking(data.booking);
                setRescheduling(null);
                showResult('Booking rescheduled.', false);
            } else {
                // Slot taken in the meantime: refresh the picker, keep the dialog open.
                if (res.status === 409) {
                    setNewTime('');
                    setSlotRefreshKey((k) => k + 1);
                }
                showResult(data.error || 'Could not reschedule.', true);
            }
        } catch {
            showResult('Cannot connect to server. Please try again.', true);
        }
        setBusyId('');
    };

    // Pay for a booking whose slot hold is still active.
    const handleCompletePayment = async (booking: BookingItem) => {
        if (!user || !token) return;
        setBusyId(booking.id);
        const result = await initiatePayment({
            amount: booking.totalPrice,
            customerName: user.name,
            customerEmail: user.email,
            customerPhone: user.phone,
            description: `Booking: ${booking.serviceName}`,
            bookingId: booking.id,
        }, token);
        if (result.success) {
            showResult('Payment successful — your booking is confirmed!', false);
        } else {
            showResult(result.error || 'Payment was not completed.', true);
        }
        await fetchBookings();
        setBusyId('');
    };

    const minutesLeft = (booking: BookingItem) =>
        booking.holdExpiresAt
            ? Math.max(0, Math.ceil((new Date(booking.holdExpiresAt).getTime() - Date.now()) / 60000))
            : 0;

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
            {notice && (
                <div className="mybookings-notice">
                    {notice}
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

                            {/* Why it was cancelled, and refund progress */}
                            {booking.status === 'cancelled' && (booking.cancelReason || booking.refundStatus !== 'none') && (
                                <div className="mybooking-cancel-info">
                                    {booking.cancelReason && <span>{booking.cancelReason}</span>}
                                    {booking.refundStatus === 'pending' && <span className="refund-pending">Refund in progress</span>}
                                    {booking.refundStatus === 'refunded' && <span className="refund-done">Refunded</span>}
                                </div>
                            )}

                            {/* Unpaid booking whose slot is still held */}
                            {booking.status === 'pending' && minutesLeft(booking) > 0 && (
                                <button
                                    className="pay-btn"
                                    disabled={busyId === booking.id}
                                    onClick={() => handleCompletePayment(booking)}
                                >
                                    {(FaCreditCard as any)({ size: 13 })} Complete payment ({minutesLeft(booking)} min left)
                                </button>
                            )}

                            {(booking.status === 'pending' || booking.status === 'confirmed') && (
                                <>
                                    {booking.rescheduleCount < MAX_RESCHEDULES && (
                                        <button
                                            className="reschedule-btn"
                                            disabled={busyId === booking.id}
                                            onClick={() => openReschedule(booking)}
                                        >
                                            {(FaExchangeAlt as any)({ size: 13 })} Reschedule
                                        </button>
                                    )}
                                    <button
                                        className="cancel-btn"
                                        disabled={busyId === booking.id}
                                        onClick={() => handleCancel(booking)}
                                    >
                                        {(FaTimes as any)({ size: 13 })} Cancel
                                    </button>
                                </>
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

            {rescheduling && (
                <div className="reschedule-overlay" onClick={() => setRescheduling(null)}>
                    <div className="reschedule-modal" onClick={(e) => e.stopPropagation()} role="dialog" aria-labelledby="reschedule-title">
                        <h3 id="reschedule-title">Reschedule {rescheduling.serviceName}</h3>
                        <p className="reschedule-current">
                            Currently: {formatDate(rescheduling.preferredDate)}, {rescheduling.preferredTime}
                        </p>

                        <label htmlFor="reschedule-date">New date</label>
                        <input
                            type="date"
                            id="reschedule-date"
                            min={getMinDate()}
                            value={newDate}
                            onChange={(e) => { setNewDate(e.target.value); setNewTime(''); }}
                        />

                        <label htmlFor="reschedule-time">New time</label>
                        <SlotSelect
                            id="reschedule-time"
                            date={newDate}
                            value={newTime}
                            onChange={setNewTime}
                            refreshKey={slotRefreshKey}
                        />

                        <p className="reschedule-note">
                            {MAX_RESCHEDULES - rescheduling.rescheduleCount} reschedule(s) left for this booking.
                        </p>

                        <div className="reschedule-actions">
                            <button className="reschedule-cancel" onClick={() => setRescheduling(null)}>Close</button>
                            <button
                                className="reschedule-confirm"
                                disabled={!newDate || !newTime || busyId === rescheduling.id}
                                onClick={handleReschedule}
                            >
                                Confirm new slot
                            </button>
                        </div>
                    </div>
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
