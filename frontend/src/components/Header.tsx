import React, { useState, useEffect, useRef } from 'react';
import { Link } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import './Header.css';
import { FaPhoneAlt, FaEnvelope, FaFacebookF, FaInstagram, FaYoutube, FaWhatsapp, FaUser, FaSignOutAlt, FaCalendarCheck, FaCog } from 'react-icons/fa';
import logoLeaf from '../images/images/logo-leaf.webp';

const Header: React.FC = () => {
    const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
    const [isScrolled, setIsScrolled] = useState(false);
    const [activeDropdown, setActiveDropdown] = useState<string | null>(null);
    const [userMenuOpen, setUserMenuOpen] = useState(false);
    const userMenuRef = useRef<HTMLDivElement>(null);

    const { user, isAuthenticated, isAdmin, logout } = useAuth();

    useEffect(() => {
        const handleScroll = () => {
            if (window.scrollY > 50) {
                setIsScrolled(true);
            } else {
                setIsScrolled(false);
            }
        };

        window.addEventListener('scroll', handleScroll);
        return () => {
            window.removeEventListener('scroll', handleScroll);
        };
    }, []);

    // Close user menu on outside click
    useEffect(() => {
        const handleClickOutside = (e: MouseEvent) => {
            if (userMenuRef.current && !userMenuRef.current.contains(e.target as Node)) {
                setUserMenuOpen(false);
            }
        };
        document.addEventListener('mousedown', handleClickOutside);
        return () => document.removeEventListener('mousedown', handleClickOutside);
    }, []);

    const toggleDropdown = (menu: string) => {
        if (activeDropdown === menu) {
            setActiveDropdown(null);
        } else {
            setActiveDropdown(menu);
        }
    };

    const toggleMobileMenu = () => {
        setIsMobileMenuOpen(!isMobileMenuOpen);
    };

    const closeMobileMenu = () => {
        setIsMobileMenuOpen(false);
        setActiveDropdown(null);
        setUserMenuOpen(false);
    };

    const handleLogout = () => {
        logout();
        closeMobileMenu();
    };

    // Get initials for avatar
    const getInitials = (name: string) => {
        return name.split(' ').map(n => n[0]).join('').toUpperCase().slice(0, 2);
    };

    return (
        <header className="site-header">
            {/* Top Bar ... */}
            <div className="top-bar">
                <div className="top-bar-container">
                    <div className="top-bar-left">
                        <a href="tel:+917827949218" className="top-link">{(FaPhoneAlt as any)({})} +91 7827949218</a>
                        <a href="mailto:verticaledengarden@gmail.com" className="top-link">{(FaEnvelope as any)({})} verticaledengarden@gmail.com</a>
                    </div>
                    <div className="top-bar-right">
                        <a href="https://wa.me/917827949218" target="_blank" rel="noopener noreferrer">{(FaWhatsapp as any)({})}</a>
                        <a href="https://www.instagram.com/verticaledengarden?igsh=NTlleWRlcjRzNTNq" target="_blank" rel="noopener noreferrer">{(FaInstagram as any)({})}</a>
                        <a href="https://www.facebook.com/share/1BxEgEucWc/" target="_blank" rel="noopener noreferrer">{(FaFacebookF as any)({})}</a>
                        <a href="https://www.youtube.com/@VerticalEdengarden" target="_blank" rel="noopener noreferrer">{(FaYoutube as any)({})}</a>
                    </div>
                </div>
            </div>

            {/* Main Header */}
            <div className={`main-header ${isScrolled ? 'scrolled' : ''}`}>
                <div className="header-container">
                    <div className="logo">
                        <Link to="/" onClick={closeMobileMenu} className="logo-link">
                            <div className="logo-container">
                                <img src={logoLeaf} alt="Vertical Eden Garden" className="logo-icon" />
                                <div className="logo-text-wrapper">
                                    <span className="logo-text-main">Vertical Eden</span>
                                    <span className="logo-text-sub">Garden</span>
                                </div>
                            </div>
                        </Link>
                    </div>

                    <button className="mobile-menu-toggle" onClick={toggleMobileMenu} aria-label="Toggle navigation">
                        <span className="hamburger-bar"></span>
                        <span className="hamburger-bar"></span>
                        <span className="hamburger-bar"></span>
                    </button>

                    <div className={`nav-wrapper ${isMobileMenuOpen ? 'open' : ''}`}>
                        <nav className="main-nav">
                            <ul>
                                <li><Link to="/" onClick={closeMobileMenu}>Home</Link></li>
                                <li><Link to="/about" onClick={closeMobileMenu}>About Us</Link></li>
                                <li className={`nav-item-dropdown ${activeDropdown === 'services' ? 'active' : ''}`}>
                                    <span
                                        className="nav-link-span"
                                        onClick={() => toggleDropdown('services')}
                                        onMouseEnter={() => setActiveDropdown('services')}
                                        onMouseLeave={() => setActiveDropdown(null)}
                                    >
                                        Services
                                    </span>
                                    <ul className="dropdown-menu">
                                        <li><Link to="/services" onClick={closeMobileMenu}>All Services</Link></li>
                                        <li><Link to="/services/artificial-green-wall" onClick={closeMobileMenu}>Artificial Green Wall</Link></li>
                                        <li><Link to="/services/terrace-garden" onClick={closeMobileMenu}>Terrace Garden</Link></li>
                                        <li><Link to="/services/artificial-grass" onClick={closeMobileMenu}>Artificial Grass</Link></li>
                                        <li><Link to="/services/creepers-and-shrubs" onClick={closeMobileMenu}>Creepers and Shrubs</Link></li>
                                        <li><Link to="/services/plants-and-planters" onClick={closeMobileMenu}>Plants and Planters</Link></li>
                                    </ul>
                                </li>

                                <li><Link to="/portfolio" onClick={closeMobileMenu}>Gallery</Link></li>
                                <li><Link to="/blog" onClick={closeMobileMenu}>Blog</Link></li>
                            </ul>
                        </nav>

                        {/* Header CTA & Auth */}
                        <div className="header-actions">
                            <Link to="/booking" className="header-book-btn" onClick={closeMobileMenu} id="header-book-now">
                                Book Now
                            </Link>

                            {isAuthenticated && user ? (
                                <div className="header-user-menu" ref={userMenuRef}>
                                    <button
                                        className="header-user-avatar"
                                        onClick={() => setUserMenuOpen(!userMenuOpen)}
                                        aria-label="User menu"
                                        id="header-user-avatar"
                                    >
                                        {getInitials(user.name)}
                                    </button>
                                    {userMenuOpen && (
                                        <div className="header-user-dropdown">
                                            <div className="user-dropdown-header">
                                                <span className="user-dropdown-name">{user.name}</span>
                                                <span className="user-dropdown-email">{user.email}</span>
                                            </div>
                                            <div className="user-dropdown-divider"></div>
                                            <Link to="/my-bookings" className="user-dropdown-item" onClick={closeMobileMenu}>
                                                {(FaCalendarCheck as any)({ size: 14 })} My Bookings
                                            </Link>
                                            {isAdmin && (
                                                <Link to="/admin" className="user-dropdown-item" onClick={closeMobileMenu}>
                                                    {(FaCog as any)({ size: 14 })} Admin Panel
                                                </Link>
                                            )}
                                            <button className="user-dropdown-item logout" onClick={handleLogout}>
                                                {(FaSignOutAlt as any)({ size: 14 })} Logout
                                            </button>
                                        </div>
                                    )}
                                </div>
                            ) : (
                                <Link to="/login" className="header-login-btn" onClick={closeMobileMenu} id="header-login">
                                    {(FaUser as any)({ size: 14 })} Login
                                </Link>
                            )}
                        </div>
                    </div>
                </div>
            </div>
        </header>
    );
};

export default Header;