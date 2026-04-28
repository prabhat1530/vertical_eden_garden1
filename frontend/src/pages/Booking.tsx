import React, { useState, useEffect } from 'react';
import { useHistory, useLocation, Link } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { initiatePayment, calculatePrice } from '../services/PaymentService';
import servicesData from '../data/services.json';
import { FaCheck, FaArrowRight, FaArrowLeft, FaMapMarkerAlt, FaCalendarAlt, FaClock, FaRulerCombined, FaCreditCard, FaShieldAlt } from 'react-icons/fa';
import './Booking.css';

// Static imports for service images
import artificialGrassImg from '../images/real_service_images/artificial-grass.jpeg';
import artificialGreenWallImg from '../images/real_service_images/artificial-green-wall.jpeg';
import terraceGardenImg from '../images/real_service_images/terrace-garden.jpeg';
import creepersShrubsImg from '../images/real_service_images/creepers-shrubs.jpeg';
import naturalVerticalGardenImg from '../images/real_service_images/natural-vertical-garden.jpeg';
import plantsPlantersImg from '../images/real_service_images/plants-planters.jpeg';

const API_URL = process.env.REACT_APP_API_URL || '/api';

const imageMap: { [key: string]: string } = {
    'artificial-grass': artificialGrassImg,
    'artificial-green-wall': artificialGreenWallImg,
    'terrace-garden': terraceGardenImg,
    'creepers-and-shrubs': creepersShrubsImg,
    'natural-vertical-garden': naturalVerticalGardenImg,
    'plants-and-planters': plantsPlantersImg,
};

const STEPS = ['Select Service', 'Project Details', 'Review & Pay'];

const Booking: React.FC = () => {
    const { user, token, isAuthenticated } = useAuth();
    const history = useHistory();
    const location = useLocation();

    // Parse pre-selected service from query params
    const params = new URLSearchParams(location.search);
    const preSelectedService = params.get('service') || '';

    const [currentStep, setCurrentStep] = useState(0);
    const [selectedService, setSelectedService] = useState(preSelectedService);
    const [areaSize, setAreaSize] = useState('');
    const [address, setAddress] = useState('');
    const [city, setCity] = useState('');
    const [preferredDate, setPreferredDate] = useState('');
    const [preferredTime, setPreferredTime] = useState('');
    const [specialInstructions, setSpecialInstructions] = useState('');
    const [error, setError] = useState('');
    const [isProcessing, setIsProcessing] = useState(false);
    const [bookingComplete, setBookingComplete] = useState(false);
    const [completedBookingId, setCompletedBookingId] = useState('');

    // If pre-selected service, jump to step 2
    useEffect(() => {
        if (preSelectedService && servicesData.find(s => s.slug === preSelectedService)) {
            setCurrentStep(1);
        }
    }, [preSelectedService]);

    // Redirect to login if not authenticated
    useEffect(() => {
        if (!isAuthenticated) {
            history.push(`/login?redirect=${encodeURIComponent('/booking' + location.search)}`);
        }
    }, [isAuthenticated, history, location.search]);

    const selectedServiceData = servicesData.find(s => s.slug === selectedService);
    const pricing = selectedService ? calculatePrice(selectedService, Number(areaSize) || 0) : null;

    // Get minimum date (tomorrow)
    const getMinDate = () => {
        const tomorrow = new Date();
        tomorrow.setDate(tomorrow.getDate() + 1);
        return tomorrow.toISOString().split('T')[0];
    };

    const validateStep = (step: number): boolean => {
        setError('');
        switch (step) {
            case 0:
                if (!selectedService) {
                    setError('Please select a service to continue.');
                    return false;
                }
                return true;
            case 1:
                if (!areaSize || Number(areaSize) <= 0) {
                    setError('Please enter a valid area size.');
                    return false;
                }
                if (!address.trim()) {
                    setError('Please enter your address.');
                    return false;
                }
                if (!city.trim()) {
                    setError('Please enter your city.');
                    return false;
                }
                if (!preferredDate) {
                    setError('Please select a preferred date.');
                    return false;
                }
                if (!preferredTime) {
                    setError('Please select a preferred time slot.');
                    return false;
                }
                return true;
            default:
                return true;
        }
    };

    const nextStep = () => {
        if (validateStep(currentStep)) {
            setCurrentStep(prev => Math.min(prev + 1, STEPS.length - 1));
            window.scrollTo({ top: 0, behavior: 'smooth' });
        }
    };

    const prevStep = () => {
        setError('');
        setCurrentStep(prev => Math.max(prev - 1, 0));
        window.scrollTo({ top: 0, behavior: 'smooth' });
    };

    const handlePayment = async () => {
        if (!user || !token || !pricing || !selectedServiceData) return;

        setIsProcessing(true);
        setError('');

        try {
            // Step 1: Create booking on the server
            const bookingRes = await fetch(`${API_URL}/bookings`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    'Authorization': `Bearer ${token}`,
                },
                body: JSON.stringify({
                    serviceSlug: selectedService,
                    serviceName: selectedServiceData.category,
                    areaSize: Number(areaSize),
                    address,
                    city,
                    preferredDate,
                    preferredTime,
                    specialInstructions,
                }),
            });

            const bookingData = await bookingRes.json();

            if (!bookingData.success) {
                setError(bookingData.error || 'Failed to create booking.');
                setIsProcessing(false);
                return;
            }

            const bookingId = bookingData.booking.id;

            // Step 2: Initiate payment with server-created order
            const paymentResult = await initiatePayment({
                amount: bookingData.booking.totalPrice,
                customerName: user.name,
                customerEmail: user.email,
                customerPhone: user.phone,
                description: `Booking: ${selectedServiceData.category}`,
                bookingId: bookingId,
            }, token);

            if (paymentResult.success) {
                setCompletedBookingId(bookingId);
                setBookingComplete(true);
            } else {
                setError(paymentResult.error || 'Payment failed. Please try again.');
            }
        } catch (err) {
            setError('Something went wrong. Please try again.');
        }

        setIsProcessing(false);
    };

    if (!isAuthenticated) return null;

    // Success screen
    if (bookingComplete) {
        return (
            <div className="booking-page">
                <div className="booking-success">
                    <div className="success-icon-wrapper">
                        <div className="success-icon">
                            {(FaCheck as any)({ size: 40 })}
                        </div>
                    </div>
                    <h2>Booking Confirmed!</h2>
                    <p className="success-id">Booking ID: <strong>{completedBookingId}</strong></p>
                    <p className="success-desc">
                        Thank you for choosing Vertical Eden Garden! Your {selectedServiceData?.category} service
                        has been booked. Our team will contact you to confirm the details.
                    </p>
                    <div className="success-actions">
                        <Link to="/my-bookings" className="success-btn primary">View My Bookings</Link>
                        <Link to="/" className="success-btn secondary">Back to Home</Link>
                    </div>
                </div>
            </div>
        );
    }

    return (
        <div className="booking-page">
            <div className="booking-header">
                <h1>Book a Service</h1>
                <p>Transform your space with our professional gardening services</p>
            </div>

            {/* Progress Steps */}
            <div className="booking-progress">
                {STEPS.map((step, index) => (
                    <div
                        key={index}
                        className={`progress-step ${index === currentStep ? 'active' : ''} ${index < currentStep ? 'completed' : ''}`}
                    >
                        <div className="step-number">
                            {index < currentStep ? (FaCheck as any)({ size: 14 }) : index + 1}
                        </div>
                        <span className="step-label">{step}</span>
                        {index < STEPS.length - 1 && <div className="step-connector"></div>}
                    </div>
                ))}
            </div>

            {error && (
                <div className="booking-error">
                    <span className="booking-error-icon">!</span>
                    {error}
                </div>
            )}

            {/* Step 1: Select Service */}
            {currentStep === 0 && (
                <div className="booking-step animate-in">
                    <h2 className="step-title">Choose Your Service</h2>
                    <p className="step-subtitle">Select the service you'd like to book</p>
                    <div className="service-selection-grid">
                        {servicesData.map((service) => (
                            <div
                                key={service.slug}
                                className={`service-select-card ${selectedService === service.slug ? 'selected' : ''}`}
                                onClick={() => setSelectedService(service.slug)}
                                id={`service-select-${service.slug}`}
                            >
                                <div className="service-select-img">
                                    <img src={imageMap[service.slug]} alt={service.category} loading="lazy" />
                                    {selectedService === service.slug && (
                                        <div className="service-select-check">
                                            {(FaCheck as any)({ size: 18 })}
                                        </div>
                                    )}
                                </div>
                                <div className="service-select-info">
                                    <h3>{service.category}</h3>
                                    <p>{service.tagline}</p>
                                </div>
                            </div>
                        ))}
                    </div>
                </div>
            )}

            {/* Step 2: Project Details */}
            {currentStep === 1 && (
                <div className="booking-step animate-in">
                    <h2 className="step-title">Project Details</h2>
                    <p className="step-subtitle">
                        Tell us about your {selectedServiceData?.category} project
                    </p>

                    <div className="booking-form-grid">
                        <div className="booking-input-group">
                            <label htmlFor="booking-area">
                                {(FaRulerCombined as any)({ size: 14 })} Area Size (sq ft)
                            </label>
                            <input
                                type="number"
                                id="booking-area"
                                min="1"
                                placeholder="e.g. 200"
                                value={areaSize}
                                onChange={(e) => setAreaSize(e.target.value)}
                            />
                        </div>

                        <div className="booking-input-group">
                            <label htmlFor="booking-city">
                                {(FaMapMarkerAlt as any)({ size: 14 })} City
                            </label>
                            <input
                                type="text"
                                id="booking-city"
                                placeholder="e.g. New Delhi"
                                value={city}
                                onChange={(e) => setCity(e.target.value)}
                            />
                        </div>

                        <div className="booking-input-group full-width">
                            <label htmlFor="booking-address">
                                {(FaMapMarkerAlt as any)({ size: 14 })} Full Address
                            </label>
                            <input
                                type="text"
                                id="booking-address"
                                placeholder="House/Flat No., Street, Locality"
                                value={address}
                                onChange={(e) => setAddress(e.target.value)}
                            />
                        </div>

                        <div className="booking-input-group">
                            <label htmlFor="booking-date">
                                {(FaCalendarAlt as any)({ size: 14 })} Preferred Date
                            </label>
                            <input
                                type="date"
                                id="booking-date"
                                min={getMinDate()}
                                value={preferredDate}
                                onChange={(e) => setPreferredDate(e.target.value)}
                            />
                        </div>

                        <div className="booking-input-group">
                            <label htmlFor="booking-time">
                                {(FaClock as any)({ size: 14 })} Preferred Time
                            </label>
                            <select
                                id="booking-time"
                                value={preferredTime}
                                onChange={(e) => setPreferredTime(e.target.value)}
                            >
                                <option value="">Select a time slot</option>
                                <option value="09:00 - 11:00 AM">09:00 - 11:00 AM</option>
                                <option value="11:00 - 01:00 PM">11:00 - 01:00 PM</option>
                                <option value="01:00 - 03:00 PM">01:00 - 03:00 PM</option>
                                <option value="03:00 - 05:00 PM">03:00 - 05:00 PM</option>
                                <option value="05:00 - 07:00 PM">05:00 - 07:00 PM</option>
                            </select>
                        </div>

                        <div className="booking-input-group full-width">
                            <label htmlFor="booking-instructions">Special Instructions (optional)</label>
                            <textarea
                                id="booking-instructions"
                                placeholder="Any specific requirements or preferences..."
                                value={specialInstructions}
                                onChange={(e) => setSpecialInstructions(e.target.value)}
                                rows={3}
                            />
                        </div>
                    </div>

                    {/* Live Price Preview */}
                    {pricing && Number(areaSize) > 0 && (
                        <div className="price-preview">
                            <h4>Estimated Price</h4>
                            <div className="price-preview-row">
                                <span>Base Price</span>
                                <span>₹{pricing.basePrice.toLocaleString()}</span>
                            </div>
                            <div className="price-preview-row">
                                <span>Area ({areaSize} sq ft)</span>
                                <span>₹{pricing.areaPrice.toLocaleString()}</span>
                            </div>
                            <div className="price-preview-row total">
                                <span>Total</span>
                                <span>₹{pricing.total.toLocaleString()}</span>
                            </div>
                        </div>
                    )}
                </div>
            )}

            {/* Step 3: Review & Pay */}
            {currentStep === 2 && pricing && selectedServiceData && (
                <div className="booking-step animate-in">
                    <h2 className="step-title">Review Your Booking</h2>
                    <p className="step-subtitle">Verify all details before proceeding to payment</p>

                    <div className="review-container">
                        <div className="review-card">
                            <div className="review-card-header">
                                <img src={imageMap[selectedService]} alt={selectedServiceData.category} />
                                <div>
                                    <h3>{selectedServiceData.category}</h3>
                                    <span className="review-tagline">{selectedServiceData.tagline}</span>
                                </div>
                            </div>

                            <div className="review-details">
                                <div className="review-detail-row">
                                    <span className="review-label">Area Size</span>
                                    <span className="review-value">{areaSize} sq ft</span>
                                </div>
                                <div className="review-detail-row">
                                    <span className="review-label">Address</span>
                                    <span className="review-value">{address}, {city}</span>
                                </div>
                                <div className="review-detail-row">
                                    <span className="review-label">Date</span>
                                    <span className="review-value">{new Date(preferredDate).toLocaleDateString('en-IN', { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' })}</span>
                                </div>
                                <div className="review-detail-row">
                                    <span className="review-label">Time Slot</span>
                                    <span className="review-value">{preferredTime}</span>
                                </div>
                                {specialInstructions && (
                                    <div className="review-detail-row">
                                        <span className="review-label">Instructions</span>
                                        <span className="review-value">{specialInstructions}</span>
                                    </div>
                                )}
                            </div>

                            <div className="review-pricing">
                                <div className="review-price-row">
                                    <span>Base Price</span>
                                    <span>₹{pricing.basePrice.toLocaleString()}</span>
                                </div>
                                <div className="review-price-row">
                                    <span>Area Charges ({areaSize} sq ft)</span>
                                    <span>₹{pricing.areaPrice.toLocaleString()}</span>
                                </div>
                                <div className="review-price-row total">
                                    <span>Total Amount</span>
                                    <span>₹{pricing.total.toLocaleString()}</span>
                                </div>
                            </div>
                        </div>

                        <div className="payment-info">
                            <div className="payment-secure">
                                {(FaShieldAlt as any)({ size: 16 })}
                                <span>Secure Payment via Razorpay</span>
                            </div>
                            <div className="payment-methods">
                                {(FaCreditCard as any)({ size: 14 })}
                                <span>UPI • Cards • Net Banking • Wallets</span>
                            </div>
                        </div>
                    </div>
                </div>
            )}

            {/* Navigation Buttons */}
            <div className="booking-nav">
                {currentStep > 0 && (
                    <button className="booking-nav-btn back" onClick={prevStep} id="booking-back-btn">
                        {(FaArrowLeft as any)({ size: 14 })} Back
                    </button>
                )}
                <div className="booking-nav-spacer"></div>
                {currentStep < STEPS.length - 1 ? (
                    <button className="booking-nav-btn next" onClick={nextStep} id="booking-next-btn">
                        Continue {(FaArrowRight as any)({ size: 14 })}
                    </button>
                ) : (
                    <button
                        className={`booking-nav-btn pay ${isProcessing ? 'processing' : ''}`}
                        onClick={handlePayment}
                        disabled={isProcessing}
                        id="booking-pay-btn"
                    >
                        {isProcessing ? (
                            <span className="booking-spinner"></span>
                        ) : (
                            <>Pay ₹{pricing?.total.toLocaleString()}</>
                        )}
                    </button>
                )}
            </div>
        </div>
    );
};

export default Booking;
