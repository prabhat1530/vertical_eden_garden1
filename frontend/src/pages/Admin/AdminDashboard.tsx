import React, { useState, useEffect } from 'react';
import { Link, useHistory } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import { FaUsers, FaCalendarAlt, FaRupeeSign, FaClock } from 'react-icons/fa';
import './Admin.css';

const API_URL = process.env.REACT_APP_API_URL || '/api';

interface Stats {
    totalUsers: number;
    totalBookings: number;
    pendingBookings: number;
    confirmedBookings: number;
    completedBookings: number;
    totalRevenue: number;
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
    const { token, isAdmin } = useAuth();
    const history = useHistory();
    const [stats, setStats] = useState<Stats | null>(null);
    const [recentBookings, setRecentBookings] = useState<RecentBooking[]>([]);
    const [isLoading, setIsLoading] = useState(true);

    useEffect(() => {
        if (!isAdmin) {
            history.push('/');
            return;
        }
        fetchStats();
    }, [isAdmin, history]);

    const fetchStats = async () => {
        try {
            const res = await fetch(`${API_URL}/admin/stats`, {
                headers: { 'Authorization': `Bearer ${token}` },
            });
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
