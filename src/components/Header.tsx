import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import './Header.css';
import { FaPhoneAlt, FaEnvelope, FaFacebookF, FaInstagram, FaYoutube } from 'react-icons/fa';
import logoImg from '../images/images/logo-v2.png';

const Header: React.FC = () => {
    const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
    const [isScrolled, setIsScrolled] = useState(false);
    const [activeDropdown, setActiveDropdown] = useState<string | null>(null);

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
    };

    // ... scroll effect ...

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
                        <Link to="/" onClick={closeMobileMenu}>
                            <img src={logoImg} alt="Vertical Eden Garden" className="logo-img" />
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

                                <li className={`nav-item-dropdown ${activeDropdown === 'pages' ? 'active' : ''}`}>
                                    <span
                                        className="nav-link-span"
                                        onClick={() => toggleDropdown('pages')}
                                    >
                                        Pages
                                    </span>
                                    <ul className="dropdown-menu">
                                        <li><Link to="/portfolio" onClick={closeMobileMenu}>Gallery</Link></li>
                                        <li><Link to="/blog" onClick={closeMobileMenu}>Blog</Link></li>
                                    </ul>
                                </li>
                            </ul>
                        </nav>
                    </div>
                </div>
            </div>
        </header>
    );
};

export default Header;