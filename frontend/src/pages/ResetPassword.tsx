import React, { useState } from 'react';
import { Link, useParams } from 'react-router-dom';
import './Profile.css';

const API_URL = process.env.REACT_APP_API_URL || '/api';

const ResetPassword: React.FC = () => {
    const { token } = useParams<{ token: string }>();
    const [password, setPassword] = useState('');
    const [confirmPassword, setConfirmPassword] = useState('');
    const [msg, setMsg] = useState('');
    const [err, setErr] = useState('');
    const [loading, setLoading] = useState(false);

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setMsg(''); setErr('');

        if (password !== confirmPassword) {
            setErr('Passwords do not match.');
            return;
        }

        setLoading(true);
        try {
            const res = await fetch(`${API_URL}/auth/reset-password/${token}`, {
                method: 'PUT',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ password }),
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
                <h1>Set New Password</h1>
                <p>Enter your new password below.</p>

                {msg && <div className="profile-msg success">{msg}</div>}
                {err && <div className="profile-msg error">{err}</div>}

                {!msg && (
                    <form onSubmit={handleSubmit}>
                        <div className="profile-form-group">
                            <label>New Password</label>
                            <input type="password" value={password} onChange={e => setPassword(e.target.value)} required minLength={6} placeholder="Min. 6 characters" />
                        </div>
                        <div className="profile-form-group">
                            <label>Confirm Password</label>
                            <input type="password" value={confirmPassword} onChange={e => setConfirmPassword(e.target.value)} required minLength={6} />
                        </div>
                        <button type="submit" className="profile-btn" disabled={loading}>
                            {loading ? 'Resetting...' : 'Reset Password'}
                        </button>
                    </form>
                )}

                <Link to="/login" className="auth-simple-link">← Back to Login</Link>
            </div>
        </div>
    );
};

export default ResetPassword;
