import React from 'react';
import './Footer.css';
import { Link } from 'react-router-dom';
import { FaFacebookF, FaInstagram, FaYoutube, FaArrowUp, FaPhoneAlt, FaEnvelope, FaMapMarkerAlt, FaClock, FaWhatsapp } from 'react-icons/fa';
import logoLeaf from '../images/images/logo-leaf.webp';

import servicesData from '../data/services.json';

const Footer: React.FC = () => {
    const scrollToTop = () => {
        window.scrollTo({
            top: 0,
            behavior: 'smooth'
        });
    };

    return (
        <footer className="footer">
            <div className="footer-content">
                {/* Column 1: Brand */}
                <div className="footer-col brand-col">
                    <div className="footer-logo-container">
                        <div className="logo-container-footer">
                            <img src={logoLeaf} alt="Vertical Eden Garden" className="logo-icon-footer" />
                            <div className="logo-text-wrapper-footer">
                                <span className="logo-text-main-footer">Vertical Eden</span>
                                <span className="logo-text-sub-footer">Garden</span>
                            </div>
                        </div>
                    </div>
                    <p className="brand-text">
                        Make Everyday A Vacation With Your Custom-Designed Dream Outdoor Space
                    </p>
                    <div className="social-icons">
                        <a href="https://www.instagram.com/verticaledengarden?igsh=NTlleWRlcjRzNTNq" target="_blank" rel="noopener noreferrer" className="social-icon">{(FaInstagram as any)({})}</a>
                        <a href="https://www.facebook.com/share/1BxEgEucWc/" target="_blank" rel="noopener noreferrer" className="social-icon">{(FaFacebookF as any)({})}</a>
                        <a href="https://www.youtube.com/@VerticalEdengarden" target="_blank" rel="noopener noreferrer" className="social-icon">{(FaYoutube as any)({})}</a>
                        <a href="https://wa.me/917827949218" target="_blank" rel="noopener noreferrer" className="social-icon">{(FaWhatsapp as any)({})}</a>
                    </div>
                </div>

                {/* Column 2: Contact Us */}
                <div className="footer-col contact-col">
                    <h3>Contact Us</h3>

                    <div className="contact-row">
                        <span className="contact-label">Phone:</span>
                        <a href="tel:+917827949218" className="contact-value">+91 7827949218</a>
                    </div>

                    <div className="contact-row">
                        <span className="contact-label">E-mail:</span>
                        <a href="mailto:verticaledengarden@gmail.com" className="contact-value">verticaledengarden@gmail.com</a>
                    </div>

                    <div className="contact-row">
                        <span className="contact-label">Address:</span>
                        <span className="contact-value">Janakpuri District Center, New Delhi, India</span>
                    </div>

                    <div className="contact-row">
                        <span className="contact-label">Time:</span>
                        <span className="contact-value">Mon – Sun ( 9am – 7pm )</span>
                    </div>
                </div>

                {/* Column 3: Our Services */}
                <div className="footer-col services-col">
                    <h3>Our Services</h3>
                    <ul>
                        {servicesData.map((service, index) => (
                            <li key={index}>
                                <Link to={`/services/${service.slug}`}>→ {service.category}</Link>
                            </li>
                        ))}
                    </ul>
                </div>

                {/* Column 4: Get Free Estimate */}
                <div className="footer-col estimate-col">
                    <h3>Get Free Estimate</h3>
                    <div className="estimate-phone">
                        <a href="tel:+917827949218">{(FaPhoneAlt as any)({ className: 'estimate-icon' })} +91 7827949218</a>
                    </div>
                    <p className="estimate-text">
                        Contact us now for a quote on your garden ( We are Support 24/7 )
                    </p>
                </div>
            </div>

            {/* Footer Bottom */}
            <div className="footer-bottom">
                <div className="footer-bottom-container">
                    <div className="copyright">
                        <p>&copy; 2024 Vertical Eden Garden. All Rights Reserved.</p>
                    </div>
                    <div className="bottom-scroll">
                        <button onClick={scrollToTop} className="scroll-top-btn" aria-label="Scroll to top">
                            {(FaArrowUp as any)({})}
                        </button>
                    </div>
                </div>
            </div>

        </footer>
    );
};

export default Footer;