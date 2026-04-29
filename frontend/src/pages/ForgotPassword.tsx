import React, { useState } from 'react';
import { Link } from 'react-router-dom';
import './Profile.css';

const API_URL = process.env.REACT_APP_API_URL || '/api';

const ForgotPassword: React.FC = () => {
    const [email, setEmail] = useState('');
    const [msg, setMsg] = useState('');
    const [err, setErr] = useState('');
    const [loading, setLoading] = useState(false);

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setMsg(''); setErr('');
        setLoading(true);
        try {
            const res = await fetch(`${API_URL}/auth/forgot-password`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ email }),
            });
            const data = await res.json();
            if (data.success) {
                setMsg(data.message);
            } else {
                setErr(data.error || 'Something went wrong.');
            }
        } catch {
            setErr('Cannot connect to server.');
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="auth-simple-page">
            <div className="auth-simple-card">
                <h1>Forgot Password</h1>
                <p>Enter your email and we'll send you a reset link.</p>

                {msg && <div className="profile-msg success">{msg}</div>}
                {err && <div className="profile-msg error">{err}</div>}

                <form onSubmit={handleSubmit}>
                    <div className="profile-form-group">
                        <label>Email Address</label>
                        <input type="email" value={email} onChange={e => setEmail(e.target.value)} required placeholder="you@example.com" />
                    </div>
                    <button type="submit" className="profile-btn" disabled={loading}>
                        {loading ? 'Sending...' : 'Send Reset Link'}
                    </button>
                </form>

                <Link to="/login" className="auth-simple-link">← Back to Login</Link>
            </div>
        </div>
    );
};

export default ForgotPassword;
