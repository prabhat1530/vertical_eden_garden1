import React, { useState, useEffect } from 'react';
import { Link, useHistory } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import { FaUsers, FaCalendarAlt, FaRupeeSign, FaClock } from 'react-icons/fa';
import { apiFetch } from '../../services/api';
import './Admin.css';

interface Stats {
    totalUsers: number;
    totalBookings: number;
    pendingBookings: number;
    confirmedBookings: number;
    completedBookings: number;
    totalRevenue: number;
}

// Email queue health from GET /api/admin/email-queue
interface EmailQueueStatus {
    enabled: boolean;
    error?: string;
    counts?: { waiting: number; active: number; delayed: number; completed: number; failed: number };
    recentFailed?: { id: string; type: string; reason: string; attempts: number; failedAt: string | null }[];
}

interface RecentBooking {
    id: string;
    serviceName: string;
    totalPrice: number;
    status: string;
    preferredDate: string;
    createdAt: string;
    user: { name: string; email: string; phone: string } | null;
}

const AdminDashboard: React.FC = () => {
    const { isAdmin } = useAuth();
    const history = useHistory();
    const [stats, setStats] = useState<Stats | null>(null);
    const [recentBookings, setRecentBookings] = useState<RecentBooking[]>([]);
    const [isLoading, setIsLoading] = useState(true);
    const [emailQueue, setEmailQueue] = useState<EmailQueueStatus | null>(null);
    const [retryMessage, setRetryMessage] = useState('');

    useEffect(() => {
        if (!isAdmin) {
            history.push('/');
            return;
        }
        fetchStats();
        fetchEmailQueue();
    }, [isAdmin, history]);

    const fetchStats = async () => {
        try {
            const res = await apiFetch('/admin/stats');
            const data = await res.json();
            if (data.success) {
                setStats(data.stats);
                setRecentBookings(data.recentBookings);
            }
        } catch (error) {
            console.error('Failed to fetch admin stats:', error);
        } finally {
            setIsLoading(false);
        }
    };

    const fetchEmailQueue = async () => {
        try {
            const res = await apiFetch('/admin/email-queue');
            const data = await res.json();
            if (data.success) setEmailQueue(data.queue);
        } catch (error) {
            console.error('Failed to fetch email queue:', error);
        }
    };

    // Put every failed email back in the queue for another round of attempts.
    const retryFailed = async () => {
        setRetryMessage('');
        try {
            const res = await apiFetch('/admin/email-queue/retry-failed', { method: 'POST' });
            const data = await res.json();
            setRetryMessage(data.success ? `Retrying ${data.retried} email(s).` : data.error || 'Retry failed.');
        } catch {
            setRetryMessage('Cannot connect to server.');
        }
        fetchEmailQueue();
    };

    if (isLoading) {
        return (
            <div className="admin-page">
                <div className="admin-header">
                    <div className="skeleton skeleton-title" style={{ width: '250px', height: '36px', marginBottom: 0 }}></div>
                </div>
                <div className="stats-grid">
                    {[...Array(4)].map((_, i) => (
                        <div key={i} className="skeleton skeleton-card"></div>
                    ))}
                </div>
                <div className="admin-table-wrapper" style={{ marginTop: '2rem', padding: '2rem' }}>
                    <div className="skeleton skeleton-title" style={{ width: '200px', marginBottom: '2rem' }}></div>
                    {[...Array(5)].map((_, i) => (
                        <div key={i} className="skeleton skeleton-text" style={{ height: '45px', marginBottom: '15px' }}></div>
                    ))}
                </div>
            </div>
        );
    }

    return (
        <div className="admin-page">
            <div className="admin-header">
                <h1>🌿 Admin Dashboard</h1>
                <nav className="admin-nav">
                    <Link to="/admin" className="active">Dashboard</Link>
                    <Link to="/admin/bookings">Bookings</Link>
                    <Link to="/admin/users">Users</Link>
                </nav>
            </div>

            {stats && (
                <div className="stats-grid">
                    <div className="stat-card">
                        <div className="stat-icon users"><FaUsers /></div>
                        <div className="stat-info">
                            <h3>{stats.totalUsers}</h3>
                            <p>Total Users</p>
                        </div>
                    </div>
                    <div className="stat-card">
                        <div className="stat-icon bookings"><FaCalendarAlt /></div>
                        <div className="stat-info">
                            <h3>{stats.totalBookings}</h3>
                            <p>Total Bookings</p>
                        </div>
                    </div>
                    <div className="stat-card">
                        <div className="stat-icon revenue"><FaRupeeSign /></div>
                        <div className="stat-info">
                            <h3>₹{stats.totalRevenue.toLocaleString()}</h3>
                            <p>Total Revenue</p>
                        </div>
                    </div>
                    <div className="stat-card">
                        <div className="stat-icon pending"><FaClock /></div>
                        <div className="stat-info">
                            <h3>{stats.pendingBookings}</h3>
                            <p>Pending Bookings</p>
                        </div>
                    </div>
                </div>
            )}

            {emailQueue && (
                <div className="admin-table-wrapper email-queue-panel">
                    <div className="admin-table-header">
                        <h2>Email delivery</h2>
                        {emailQueue.enabled && !!emailQueue.counts?.failed && (
                            <button className="admin-page-btn" onClick={retryFailed}>Retry failed emails</button>
                        )}
                    </div>

                    {!emailQueue.enabled && (
                        <p className="email-queue-note">
                            The email queue is off (no Redis configured), so emails are sent once and not retried if they fail.
                        </p>
                    )}
                    {emailQueue.error && <p className="email-queue-note email-queue-error">{emailQueue.error}</p>}

                    {emailQueue.counts && (
                        <div className="email-queue-counts">
                            <span className="status-badge completed">{emailQueue.counts.completed} sent (last 24h)</span>
                            <span className="status-badge confirmed">{emailQueue.counts.waiting + emailQueue.counts.active} sending</span>
                            <span className="status-badge pending">{emailQueue.counts.delayed} waiting to retry</span>
                            <span className="status-badge cancelled">{emailQueue.counts.failed} failed</span>
                        </div>
                    )}
                    {retryMessage && <p className="email-queue-note">{retryMessage}</p>}

                    {!!emailQueue.recentFailed?.length && (
                        <table className="admin-table">
                            <thead>
                                <tr><th>Email</th><th>Attempts</th><th>Last error</th><th>Failed at</th></tr>
                            </thead>
                            <tbody>
                                {emailQueue.recentFailed.map(j => (
                                    <tr key={j.id}>
                                        <td>{j.type}</td>
                                        <td>{j.attempts}</td>
                                        <td>{j.reason}</td>
                                        <td>{j.failedAt ? new Date(j.failedAt).toLocaleString('en-IN') : '-'}</td>
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                    )}
                </div>
            )}

            <div className="admin-table-wrapper">
                <div className="admin-table-header">
                    <h2>Recent Bookings</h2>
                </div>
                <table className="admin-table">
                    <thead>
                        <tr>
                            <th>Service</th>
                            <th>Customer</th>
                            <th>Date</th>
                            <th>Amount</th>
                            <th>Status</th>
                        </tr>
                    </thead>
                    <tbody>
                        {recentBookings.map(b => (
                            <tr key={b.id}>
                                <td>{b.serviceName}</td>
                                <td>{b.user?.name || 'N/A'}</td>
                                <td>{b.preferredDate}</td>
                                <td>₹{b.totalPrice.toLocaleString()}</td>
                                <td><span className={`status-badge ${b.status}`}>{b.status}</span></td>
                            </tr>
                        ))}
                        {recentBookings.length === 0 && (
                            <tr><td colSpan={5} style={{ textAlign: 'center', padding: '2rem', color: '#94a3b8' }}>No bookings yet</td></tr>
                        )}
                    </tbody>
                </table>
            </div>
        </div>
    );
};

export default AdminDashboard;
