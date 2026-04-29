import React, { useState, useEffect } from 'react';
import { Link, useHistory } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import './Admin.css';

const API_URL = process.env.REACT_APP_API_URL || '/api';

interface UserItem {
    id: string;
    name: string;
    email: string;
    phone: string;
    role: string;
    bookingCount: number;
    createdAt: string;
}

const AdminUsers: React.FC = () => {
    const { token, isAdmin } = useAuth();
    const history = useHistory();
    const [users, setUsers] = useState<UserItem[]>([]);
    const [filteredUsers, setFilteredUsers] = useState<UserItem[]>([]);
    const [search, setSearch] = useState('');
    const [isLoading, setIsLoading] = useState(true);
    const [currentPage, setCurrentPage] = useState(1);
    const itemsPerPage = 10;

    useEffect(() => {
        if (!isAdmin) { history.push('/'); return; }
        fetchUsers();
    }, [isAdmin, history]);

    useEffect(() => {
        if (!search.trim()) {
            setFilteredUsers(users);
        } else {
            const q = search.toLowerCase();
            setFilteredUsers(users.filter(u =>
                u.name.toLowerCase().includes(q) ||
                u.email.toLowerCase().includes(q) ||
                u.phone.includes(q)
            ));
        }
        setCurrentPage(1); // Reset to page 1 when search changes
    }, [search, users]);

    const totalPages = Math.ceil(filteredUsers.length / itemsPerPage);
    const currentUsers = filteredUsers.slice((currentPage - 1) * itemsPerPage, currentPage * itemsPerPage);

    const fetchUsers = async () => {
        try {
            const res = await fetch(`${API_URL}/admin/users`, {
                headers: { 'Authorization': `Bearer ${token}` },
            });
            const data = await res.json();
            if (data.success) setUsers(data.users);
        } catch (error) {
            console.error('Failed to fetch users:', error);
        } finally {
            setIsLoading(false);
        }
    };

    if (isLoading) return <div className="admin-loading">Loading users...</div>;

    return (
        <div className="admin-page">
            <div className="admin-header">
                <h1>👥 Manage Users</h1>
                <nav className="admin-nav">
                    <Link to="/admin">Dashboard</Link>
                    <Link to="/admin/bookings">Bookings</Link>
                    <Link to="/admin/users" className="active">Users</Link>
                </nav>
            </div>

            <div className="admin-table-wrapper">
                <div className="admin-table-header">
                    <h2>All Users ({filteredUsers.length})</h2>
                    <input
                        type="text"
                        className="admin-search"
                        placeholder="Search by name, email, phone..."
                        value={search}
                        onChange={e => setSearch(e.target.value)}
                    />
                </div>
                <table className="admin-table">
                    <thead>
                        <tr>
                            <th>Name</th>
                            <th>Email</th>
                            <th>Phone</th>
                            <th>Role</th>
                            <th>Bookings</th>
                            <th>Joined</th>
                        </tr>
                    </thead>
                    <tbody>
                        {currentUsers.map(u => (
                            <tr key={u.id}>
                                <td>{u.name}</td>
                                <td>{u.email || '—'}</td>
                                <td>{u.phone}</td>
                                <td><span className={`role-badge ${u.role}`}>{u.role}</span></td>
                                <td>{u.bookingCount}</td>
                                <td>{new Date(u.createdAt).toLocaleDateString()}</td>
                            </tr>
                        ))}
                        {currentUsers.length === 0 && (
                            <tr><td colSpan={6} style={{ textAlign: 'center', padding: '2rem', color: '#94a3b8' }}>No users found</td></tr>
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

export default AdminUsers;
