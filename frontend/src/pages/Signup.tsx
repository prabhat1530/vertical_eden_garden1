import React, { useState } from 'react';
import { Link, useHistory, useLocation } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { FaLeaf, FaEye, FaEyeSlash, FaEnvelope, FaLock, FaUser, FaPhone } from 'react-icons/fa';
import './Login.css'; // Shared auth styles

const Signup: React.FC = () => {
    const [name, setName] = useState('');
    const [email, setEmail] = useState('');
    const [phone, setPhone] = useState('');
    const [password, setPassword] = useState('');
    const [confirmPassword, setConfirmPassword] = useState('');
    const [showPassword, setShowPassword] = useState(false);
    const [error, setError] = useState('');
    const [isLoading, setIsLoading] = useState(false);

    const { signup, isAuthenticated } = useAuth();
    const history = useHistory();
    const location = useLocation();

    const params = new URLSearchParams(location.search);
    const redirectTo = params.get('redirect') || '/';

    React.useEffect(() => {
        if (isAuthenticated) {
            history.push(redirectTo);
        }
    }, [isAuthenticated, history, redirectTo]);

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setError('');

        if (!name.trim() || !email.trim() || !phone.trim() || !password.trim()) {
            setError('Please fill in all fields.');
            return;
        }

        if (password.length < 6) {
            setError('Password must be at least 6 characters.');
            return;
        }

        if (password !== confirmPassword) {
            setError('Passwords do not match.');
            return;
        }

        const phoneRegex = /^[6-9]\d{9}$/;
        if (!phoneRegex.test(phone.replace(/\s/g, ''))) {
            setError('Please enter a valid 10-digit Indian phone number.');
            return;
        }

        setIsLoading(true);

        const result = await signup(name, email, phone, password);
        if (result.success) {
            history.push(redirectTo);
        } else {
            setError(result.error || 'Signup failed.');
            setIsLoading(false);
        }
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
                        <h2>Join Vertical Eden</h2>
                        <p>Create your account to start booking premium gardening services and transform your spaces.</p>
                        <div className="auth-visual-features">
                            <div className="auth-feature-item">
                                <span className="auth-feature-dot"></span>
                                <span>Free Account Creation</span>
                            </div>
                            <div className="auth-feature-item">
                                <span className="auth-feature-dot"></span>
                                <span>Instant Service Booking</span>
                            </div>
                            <div className="auth-feature-item">
                                <span className="auth-feature-dot"></span>
                                <span>Exclusive Member Offers</span>
                            </div>
                        </div>
                    </div>
                </div>

                <div className="auth-form-side">
                    <div className="auth-form-wrapper">
                        <div className="auth-form-header">
                            <h1>Create Account</h1>
                            <p>Fill in your details to get started</p>
                        </div>

                        {error && (
                            <div className="auth-error">
                                <span className="auth-error-icon">!</span>
                                {error}
                            </div>
                        )}

                        <form onSubmit={handleSubmit} className="auth-form" id="signup-form">
                            <div className="auth-input-group">
                                <div className="auth-input-icon">
                                    {(FaUser as any)({})}
                                </div>
                                <input
                                    type="text"
                                    id="signup-name"
                                    placeholder="Full Name"
                                    value={name}
                                    onChange={(e) => setName(e.target.value)}
                                    required
                                    autoComplete="name"
                                />
                            </div>

                            <div className="auth-input-group">
                                <div className="auth-input-icon">
                                    {(FaEnvelope as any)({})}
                                </div>
                                <input
                                    type="email"
                                    id="signup-email"
                                    placeholder="Email Address"
                                    value={email}
                                    onChange={(e) => setEmail(e.target.value)}
                                    required
                                    autoComplete="email"
                                />
                            </div>

                            <div className="auth-input-group">
                                <div className="auth-input-icon">
                                    {(FaPhone as any)({})}
                                </div>
                                <input
                                    type="tel"
                                    id="signup-phone"
                                    placeholder="Phone Number"
                                    value={phone}
                                    onChange={(e) => setPhone(e.target.value)}
                                    required
                                    autoComplete="tel"
                                />
                            </div>

                            <div className="auth-input-row">
                                <div className="auth-input-group">
                                    <div className="auth-input-icon">
                                        {(FaLock as any)({})}
                                    </div>
                                    <input
                                        type={showPassword ? 'text' : 'password'}
                                        id="signup-password"
                                        placeholder="Password"
                                        value={password}
                                        onChange={(e) => setPassword(e.target.value)}
                                        required
                                        autoComplete="new-password"
                                    />
                                </div>
                                <div className="auth-input-group">
                                    <div className="auth-input-icon">
                                        {(FaLock as any)({})}
                                    </div>
                                    <input
                                        type={showPassword ? 'text' : 'password'}
                                        id="signup-confirm-password"
                                        placeholder="Confirm"
                                        value={confirmPassword}
                                        onChange={(e) => setConfirmPassword(e.target.value)}
                                        required
                                        autoComplete="new-password"
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
                            </div>

                            <button
                                type="submit"
                                className={`auth-submit-btn ${isLoading ? 'loading' : ''}`}
                                disabled={isLoading}
                                id="signup-submit"
                            >
                                {isLoading ? (
                                    <span className="auth-spinner"></span>
                                ) : (
                                    'Create Account'
                                )}
                            </button>
                        </form>

                        <div className="auth-switch">
                            <p>Already have an account? <Link to={`/login${redirectTo !== '/' ? `?redirect=${encodeURIComponent(redirectTo)}` : ''}`}>Sign In</Link></p>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
};

export default Signup;
