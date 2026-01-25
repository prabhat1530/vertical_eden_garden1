import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import './Header.css';
import { FaPhoneAlt, FaEnvelope, FaFacebookF, FaInstagram, FaYoutube } from 'react-icons/fa';
import logoImg from '../images/images/WhatsApp Image 2026-01-13 at 22.37.42.jpeg';

const Header: React.FC = () => {
    const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
    const [isScrolled, setIsScrolled] = useState(false);

    const toggleMobileMenu = () => {
        setIsMobileMenuOpen(!isMobileMenuOpen);
    };

    const closeMobileMenu = () => {
        setIsMobileMenuOpen(false);
    };

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

    return (
        <header className="site-header">
            {/* Top Bar */}
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
                                <li><Link to="/about" onClick={closeMobileMenu}>About Us</Link></li>
                                <li><Link to="/services" onClick={closeMobileMenu}>Services</Link></li>
                                {/* <li><Link to="/projects" onClick={closeMobileMenu}>Projects</Link></li> */}
                                <li><Link to="/portfolio" onClick={closeMobileMenu}>Portfolio</Link></li>
                                {/* Contact link removed as per user request */}
                                {/* <li><Link to="/shop" onClick={closeMobileMenu}>Shop</Link></li> */}
                                <li><Link to="/products" onClick={closeMobileMenu}>Products</Link></li>
                                <li><Link to="/blog" onClick={closeMobileMenu}>Blog</Link></li>
                            </ul>
                        </nav>
                        <div className="header-cta">
                            <Link to="/contact" className="get-quote-btn" onClick={closeMobileMenu}>Get A Quote »</Link>
                        </div>
                    </div>
                </div>
            </div>
        </header>
    );
};

export default Header;