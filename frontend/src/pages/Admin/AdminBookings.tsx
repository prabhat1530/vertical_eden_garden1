import React, { useState, useEffect } from 'react';
import { Link, useHistory } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import './Admin.css';

const API_URL = process.env.REACT_APP_API_URL || '/api';

interface BookingItem {
    id: string;
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
    user: { id: string; name: string; email: string; phone: string } | null;
}

const AdminBookings: React.FC = () => {
    const { token, isAdmin } = useAuth();
    const history = useHistory();
    const [bookings, setBookings] = useState<BookingItem[]>([]);
    const [filteredBookings, setFilteredBookings] = useState<BookingItem[]>([]);
    const [search, setSearch] = useState('');
    const [isLoading, setIsLoading] = useState(true);
    const [currentPage, setCurrentPage] = useState(1);
    const itemsPerPage = 10;

    useEffect(() => {
        if (!isAdmin) { history.push('/'); return; }
        fetchBookings();
    }, [isAdmin, history]);

    useEffect(() => {
        if (!search.trim()) {
            setFilteredBookings(bookings);
        } else {
            const q = search.toLowerCase();
            setFilteredBookings(bookings.filter(b =>
                b.serviceName.toLowerCase().includes(q) ||
                b.user?.name.toLowerCase().includes(q) ||
                b.city.toLowerCase().includes(q) ||
                b.status.toLowerCase().includes(q)
            ));
        }
        setCurrentPage(1); // Reset to page 1 when search changes
    }, [search, bookings]);

    const totalPages = Math.ceil(filteredBookings.length / itemsPerPage);
    const currentBookings = filteredBookings.slice((currentPage - 1) * itemsPerPage, currentPage * itemsPerPage);

    const fetchBookings = async () => {
        try {
            const res = await fetch(`${API_URL}/admin/bookings`, {
                headers: { 'Authorization': `Bearer ${token}` },
            });
            const data = await res.json();
            if (data.success) setBookings(data.bookings);
        } catch (error) {
            console.error('Failed to fetch bookings:', error);
        } finally {
            setIsLoading(false);
        }
    };

    const updateStatus = async (bookingId: string, newStatus: string) => {
        try {
            const res = await fetch(`${API_URL}/admin/bookings/${bookingId}/status`, {
                method: 'PUT',
                headers: {
                    'Authorization': `Bearer ${token}`,
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify({ status: newStatus }),
            });
            const data = await res.json();
            if (data.success) {
                setBookings(prev => prev.map(b => b.id === bookingId ? { ...b, status: newStatus } : b));
            }
        } catch (error) {
            console.error('Failed to update status:', error);
        }
    };

    if (isLoading) {
        return (
            <div className="admin-page">
                <div className="admin-header">
                    <div className="skeleton skeleton-title" style={{ width: '250px', height: '36px', marginBottom: 0 }}></div>
                </div>
                <div className="admin-table-wrapper" style={{ padding: '2rem' }}>
                    <div className="skeleton skeleton-title" style={{ width: '200px', marginBottom: '2rem' }}></div>
                    {[...Array(8)].map((_, i) => (
                        <div key={i} className="skeleton skeleton-text" style={{ height: '45px', marginBottom: '15px' }}></div>
                    ))}
                </div>
            </div>
        );
    }

    return (
        <div className="admin-page">
            <div className="admin-header">
                <h1>📋 Manage Bookings</h1>
                <nav className="admin-nav">
                    <Link to="/admin">Dashboard</Link>
                    <Link to="/admin/bookings" className="active">Bookings</Link>
                    <Link to="/admin/users">Users</Link>
                </nav>
            </div>

            <div className="admin-table-wrapper">
                <div className="admin-table-header">
                    <h2>All Bookings ({filteredBookings.length})</h2>
                    <input
                        type="text"
                        className="admin-search"
                        placeholder="Search by name, service, city..."
                        value={search}
                        onChange={e => setSearch(e.target.value)}
                    />
                </div>
                <table className="admin-table">
                    <thead>
                        <tr>
                            <th>Customer</th>
                            <th>Email</th>
                            <th>Phone</th>
                            <th>Service</th>
                            <th>City</th>
                            <th>Date</th>
                            <th>Amount</th>
                            <th>Status</th>
                        </tr>
                    </thead>
                    <tbody>
                        {currentBookings.map(b => (
                            <tr key={b.id}>
                                <td>{b.user?.name || 'N/A'}</td>
                                <td>{b.user?.email || 'N/A'}</td>
                                <td>{b.user?.phone || 'N/A'}</td>
                                <td>{b.serviceName}</td>
                                <td>{b.city}</td>
                                <td>{b.preferredDate}</td>
                                <td>₹{b.totalPrice.toLocaleString()}</td>
                                <td>
                                    <select
                                        className="status-select"
                                        value={b.status}
                                        onChange={e => updateStatus(b.id, e.target.value)}
                                    >
                                        <option value="pending">Pending</option>
                                        <option value="confirmed">Confirmed</option>
                                        <option value="completed">Completed</option>
                                        <option value="cancelled">Cancelled</option>
                                    </select>
                                </td>
                            </tr>
                        ))}
                        {currentBookings.length === 0 && (
                            <tr><td colSpan={8} style={{ textAlign: 'center', padding: '2rem', color: '#94a3b8' }}>No bookings found</td></tr>
                        )}
                    </tbody>
                </table>
                
                {totalPages > 1 && (
                    <div className="admin-pagination">
                        <button 
                            disabled={currentPage === 1} 
                            onClick={() => setCurrentPage(p => p - 1)}
                            className="admin-page-btn"
                        >
                            Previous
                        </button>
                        <span className="admin-page-info">
                            Page {currentPage} of {totalPages}
                        </span>
                        <button 
                            disabled={currentPage === totalPages} 
                            onClick={() => setCurrentPage(p => p + 1)}
                            className="admin-page-btn"
                        >
                            Next
                        </button>
                    </div>
                )}
            </div>
        </div>
    );
};

export default AdminBookings;
