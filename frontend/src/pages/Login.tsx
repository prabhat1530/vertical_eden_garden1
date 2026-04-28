import React, { useState, useEffect } from 'react';
import { Link, useHistory, useLocation } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { FaLeaf, FaEye, FaEyeSlash, FaEnvelope, FaLock, FaPhone, FaKey } from 'react-icons/fa';
import './Login.css';

const Login: React.FC = () => {
    // Auth Method State
    const [loginMethod, setLoginMethod] = useState<'email' | 'phone'>('email');
    
    // Email/Password State
    const [email, setEmail] = useState('');
    const [password, setPassword] = useState('');
    const [showPassword, setShowPassword] = useState(false);
    
    // Phone/OTP State
    const [phone, setPhone] = useState('');
    const [otp, setOtp] = useState('');
    const [otpSent, setOtpSent] = useState(false);

    // General State
    const [error, setError] = useState('');
    const [successMsg, setSuccessMsg] = useState('');
    const [isLoading, setIsLoading] = useState(false);

    const { login, sendOtp, verifyOtp, isAuthenticated } = useAuth();
    const history = useHistory();
    const location = useLocation();

    // Get redirect URL from query params
    const params = new URLSearchParams(location.search);
    const redirectTo = params.get('redirect') || '/';

    // If already authenticated, redirect
    useEffect(() => {
        if (isAuthenticated) {
            history.push(redirectTo);
        }
    }, [isAuthenticated, history, redirectTo]);



    const handleEmailSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setError('');
        setSuccessMsg('');

        if (!email.trim() || !password.trim()) {
            setError('Please fill in all fields.');
            return;
        }

        setIsLoading(true);

        const result = await login(email, password);
        if (result.success) {
            history.push(redirectTo);
        } else {
            setError(result.error || 'Login failed.');
            setIsLoading(false);
        }
    };

    const handleSendOtp = async (e: React.FormEvent) => {
        e.preventDefault();
        setError('');
        setSuccessMsg('');

        if (!phone.trim()) {
            setError('Please enter your phone number.');
            return;
        }

        setIsLoading(true);

        const result = await sendOtp(phone);
        if (result.success) {
            setOtpSent(true);
            setSuccessMsg('OTP sent successfully to your phone!');
        } else {
            setError(result.error || 'Failed to send OTP.');
        }
        
        setIsLoading(false);
    };

    const handleVerifyOtp = async (e: React.FormEvent) => {
        e.preventDefault();
        setError('');
        setSuccessMsg('');

        if (!otp.trim() || otp.length < 6) {
            setError('Please enter a valid 6-digit OTP.');
            return;
        }

        setIsLoading(true);

        const result = await verifyOtp(phone, otp);
        if (result.success) {
            history.push(redirectTo);
        } else {
            setError(result.error || 'Invalid or expired OTP.');
        }
        setIsLoading(false);
    };

    return (
        <div className="auth-page">
            <div className="auth-bg-pattern"></div>
            <div className="auth-container">
                <div className="auth-visual-side">
                    <div className="auth-visual-content">
                        <div className="auth-visual-icon">
                            {(FaLeaf as any)({ size: 48 })}
                        </div>
                        <h2>Welcome Back</h2>
                        <p>Sign in to book our premium gardening services and manage your green spaces.</p>
                        <div className="auth-visual-features">
                            <div className="auth-feature-item">
                                <span className="auth-feature-dot"></span>
                                <span>Book Services Online</span>
                            </div>
                            <div className="auth-feature-item">
                                <span className="auth-feature-dot"></span>
                                <span>Track Your Bookings</span>
                            </div>
                            <div className="auth-feature-item">
                                <span className="auth-feature-dot"></span>
                                <span>Secure Payments</span>
                            </div>
                        </div>
                    </div>
                </div>

                <div className="auth-form-side">
                    <div className="auth-form-wrapper">
                        <div className="auth-form-header">
                            <h1>Sign In</h1>
                            <p>Select your preferred login method</p>
                        </div>

                        <div className="auth-method-tabs">
                            <button 
                                className={`auth-tab ${loginMethod === 'email' ? 'active' : ''}`}
                                onClick={() => { setLoginMethod('email'); setError(''); setSuccessMsg(''); }}
                                type="button"
                            >
                                Email
                            </button>
                            <button 
                                className={`auth-tab ${loginMethod === 'phone' ? 'active' : ''}`}
                                onClick={() => { setLoginMethod('phone'); setError(''); setSuccessMsg(''); }}
                                type="button"
                            >
                                Phone (OTP)
                            </button>
                        </div>



                        {error && (
                            <div className="auth-error">
                                <span className="auth-error-icon">!</span>
                                {error}
                            </div>
                        )}
                        {successMsg && (
                            <div className="auth-success" style={{ color: 'var(--primary-color)', fontSize: '0.85rem', marginBottom: '1rem', padding: '0.75rem', backgroundColor: '#e8f5e9', borderRadius: '4px' }}>
                                ✓ {successMsg}
                            </div>
                        )}

                        {loginMethod === 'email' ? (
                            <form onSubmit={handleEmailSubmit} className="auth-form" id="login-form">
                                <div className="auth-input-group">
                                    <div className="auth-input-icon">
                                        {(FaEnvelope as any)({})}
                                    </div>
                                    <input
                                        type="email"
                                        id="login-email"
                                        placeholder="Email Address"
                                        value={email}
                                        onChange={(e) => setEmail(e.target.value)}
                                        required
                                        autoComplete="email"
                                    />
                                </div>

                                <div className="auth-input-group">
                                    <div className="auth-input-icon">
                                        {(FaLock as any)({})}
                                    </div>
                                    <input
                                        type={showPassword ? 'text' : 'password'}
                                        id="login-password"
                                        placeholder="Password"
                                        value={password}
                                        onChange={(e) => setPassword(e.target.value)}
                                        required
                                        autoComplete="current-password"
                                    />
                                    <button
                                        type="button"
                                        className="auth-toggle-password"
                                        onClick={() => setShowPassword(!showPassword)}
                                        aria-label="Toggle password visibility"
                                    >
                                        {showPassword ? (FaEyeSlash as any)({}) : (FaEye as any)({})}
                                    </button>
                                </div>

                                <button
                                    type="submit"
                                    className={`auth-submit-btn ${isLoading ? 'loading' : ''}`}
                                    disabled={isLoading}
                                    id="login-submit"
                                >
                                    {isLoading ? <span className="auth-spinner"></span> : 'Sign In'}
                                </button>
                            </form>
                        ) : (
                            <div className="auth-form" id="otp-form">
                                {!otpSent ? (
                                    <form onSubmit={handleSendOtp}>
                                        <div className="auth-input-group">
                                            <div className="auth-input-icon">
                                                {(FaPhone as any)({})}
                                            </div>
                                            <input
                                                type="tel"
                                                id="login-phone"
                                                placeholder="Phone Number (10 digits)"
                                                value={phone}
                                                onChange={(e) => setPhone(e.target.value)}
                                                required
                                            />
                                        </div>
                                        <button
                                            type="submit"
                                            className={`auth-submit-btn ${isLoading ? 'loading' : ''}`}
                                            disabled={isLoading}
                                        >
                                            {isLoading ? <span className="auth-spinner"></span> : 'Get OTP via SMS'}
                                        </button>
                                    </form>
                                ) : (
                                    <form onSubmit={handleVerifyOtp}>
                                        <div className="auth-input-group">
                                            <div className="auth-input-icon">
                                                {(FaKey as any)({})}
                                            </div>
                                            <input
                                                type="text"
                                                id="login-otp"
                                                placeholder="Enter 6-digit OTP"
                                                value={otp}
                                                onChange={(e) => setOtp(e.target.value)}
                                                required
                                                maxLength={6}
                                            />
                                        </div>
                                        <button
                                            type="submit"
                                            className={`auth-submit-btn ${isLoading ? 'loading' : ''}`}
                                            disabled={isLoading}
                                        >
                                            {isLoading ? <span className="auth-spinner"></span> : 'Verify & Login'}
                                        </button>
                                        <button 
                                            type="button" 
                                            className="auth-link-btn" 
                                            onClick={() => setOtpSent(false)}
                                            style={{ marginTop: '1rem', background: 'none', border: 'none', color: 'var(--primary-color)', cursor: 'pointer', fontSize: '0.9rem', width: '100%' }}
                                        >
                                            Use a different number
                                        </button>
                                    </form>
                                )}
                            </div>
                        )}

                        <div className="auth-switch">
                            <p>Don't have an account? <Link to={`/signup${redirectTo !== '/' ? `?redirect=${encodeURIComponent(redirectTo)}` : ''}`}>Create Account</Link></p>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
};

export default Login;
