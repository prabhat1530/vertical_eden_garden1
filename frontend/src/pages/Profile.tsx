import React, { useState } from 'react';
import { useHistory } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import './Profile.css';

const API_URL = process.env.REACT_APP_API_URL || '/api';

const Profile: React.FC = () => {
    const { user, token, isAuthenticated } = useAuth();
    const history = useHistory();

    const [name, setName] = useState(user?.name || '');
    const [email, setEmail] = useState(user?.email || '');
    const [phone, setPhone] = useState(user?.phone || '');
    const [profileMsg, setProfileMsg] = useState('');
    const [profileErr, setProfileErr] = useState('');
    const [saving, setSaving] = useState(false);

    const [currentPassword, setCurrentPassword] = useState('');
    const [newPassword, setNewPassword] = useState('');
    const [passMsg, setPassMsg] = useState('');
    const [passErr, setPassErr] = useState('');
    const [savingPass, setSavingPass] = useState(false);

    if (!isAuthenticated) {
        history.push('/login');
        return null;
    }

    const handleProfileUpdate = async (e: React.FormEvent) => {
        e.preventDefault();
        setProfileMsg(''); setProfileErr('');
        setSaving(true);
        try {
            const res = await fetch(`${API_URL}/auth/profile`, {
                method: 'PUT',
                headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${token}` },
                body: JSON.stringify({ name, email, phone }),
            });
            const data = await res.json();
            if (data.success) {
                setProfileMsg('Profile updated successfully!');
                // Update localStorage
                localStorage.setItem('veg_user', JSON.stringify(data.user));
            } else {
                setProfileErr(data.error || 'Failed to update profile.');
            }
        } catch {
            setProfileErr('Cannot connect to server.');
        } finally {
            setSaving(false);
        }
    };

    const handleChangePassword = async (e: React.FormEvent) => {
        e.preventDefault();
        setPassMsg(''); setPassErr('');
        setSavingPass(true);
        try {
            const res = await fetch(`${API_URL}/auth/change-password`, {
                method: 'PUT',
                headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${token}` },
                body: JSON.stringify({ currentPassword, newPassword }),
            });
            const data = await res.json();
            if (data.success) {
                setPassMsg('Password changed successfully!');
                setCurrentPassword('');
                setNewPassword('');
            } else {
                setPassErr(data.error || 'Failed to change password.');
            }
        } catch {
            setPassErr('Cannot connect to server.');
        } finally {
            setSavingPass(false);
        }
    };

    return (
        <div className="profile-page">
            <div className="profile-container">
                <div className="profile-header">
                    <h1>My Profile</h1>
                </div>

                <div className="profile-card">
                    <h2>Personal Information</h2>
                    {profileMsg && <div className="profile-msg success">{profileMsg}</div>}
                    {profileErr && <div className="profile-msg error">{profileErr}</div>}
                    <form onSubmit={handleProfileUpdate}>
                        <div className="profile-form-group">
                            <label>Full Name</label>
                            <input type="text" value={name} onChange={e => setName(e.target.value)} required />
                        </div>
                        <div className="profile-form-group">
                            <label>Email Address</label>
                            <input type="email" value={email} onChange={e => setEmail(e.target.value)} />
                        </div>
                        <div className="profile-form-group">
                            <label>Phone Number</label>
                            <input type="tel" value={phone} onChange={e => setPhone(e.target.value)} required />
                        </div>
                        <button type="submit" className="profile-btn" disabled={saving}>
                            {saving ? 'Saving...' : 'Update Profile'}
                        </button>
                    </form>
                </div>

                <div className="profile-card">
                    <h2>Change Password</h2>
                    {passMsg && <div className="profile-msg success">{passMsg}</div>}
                    {passErr && <div className="profile-msg error">{passErr}</div>}
                    <form onSubmit={handleChangePassword}>
                        <div className="profile-form-group">
                            <label>Current Password</label>
                            <input type="password" value={currentPassword} onChange={e => setCurrentPassword(e.target.value)} required />
                        </div>
                        <div className="profile-form-group">
                            <label>New Password</label>
                            <input type="password" value={newPassword} onChange={e => setNewPassword(e.target.value)} required minLength={6} />
                        </div>
                        <button type="submit" className="profile-btn" disabled={savingPass}>
                            {savingPass ? 'Changing...' : 'Change Password'}
                        </button>
                    </form>
                </div>
            </div>
        </div>
    );
};

export default Profile;
