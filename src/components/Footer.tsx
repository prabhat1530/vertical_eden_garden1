import React from 'react';
import './Footer.css';
import { Link } from 'react-router-dom';
import { FaFacebookF, FaInstagram, FaTwitter, FaYoutube, FaArrowUp, FaPaperPlane, FaCalendarAlt } from 'react-icons/fa';
import logoImg from '../images/images/WhatsApp Image 2026-01-13 at 22.37.42.jpeg';

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
                    <img src={logoImg} alt="Home Garden Decor" className="footer-logo" />
                    <p className="brand-text">
                        Protecting biodiversity and natural habitats is crucial for maintaining a healthy and sustainable ecology.
                    </p>
                    {/* <div className="social-icons">
                        <a href="#" className="social-icon">{(FaFacebookF as any)({})}</a>
                        <a href="#" className="social-icon">{(FaInstagram as any)({})}</a>
                        <a href="#" className="social-icon">{(FaYoutube as any)({})}</a>
                    </div> */}
                </div>

                {/* Column 2: Quick Links */}
                <div className="footer-col links-col">
                    <h3>Quick Link</h3>
                    <ul>
                        <li><Link to="/policy">Privacy Policy</Link></li>
                        <li><Link to="/shipping">Shipping Policy</Link></li>
                        <li><Link to="/refund">Refund and Returns Policy</Link></li>
                        <li><Link to="/terms">Terms And Conditions</Link></li>
                    </ul>
                </div>

                {/* Column 3: Recent News (Mock Data) */}
                <div className="footer-col news-col">
                    <h3>Recent News</h3>
                    <div className="news-item">
                        <div className="news-image rect-1"></div>
                        <div className="news-details">
                            <a href="#">What are the benefits of Natural...</a>
                            <span className="news-date">{(FaCalendarAlt as any)({})} April 17, 2023</span>
                        </div>
                    </div>
                    <div className="news-item">
                        <div className="news-image rect-2"></div>
                        <div className="news-details">
                            <a href="#">What is a natural vertical garden...</a>
                            <span className="news-date">{(FaCalendarAlt as any)({})} April 17, 2023</span>
                        </div>
                    </div>
                </div>

                {/* Column 4: Newsletter */}
                <div className="footer-col newsletter-col">
                    <h3>Newsletter</h3>
                    <p>Your opinion is important to us. So contact us for any service.</p>
                    <div className="newsletter-form">
                        <input type="email" placeholder="Your Email Address" />
                        <button type="button">{(FaPaperPlane as any)({})}</button>
                    </div>
                </div>
            </div>

            {/* Footer Bottom */}
            <div className="footer-bottom">
                <div className="footer-bottom-container">
                    <div className="copyright">
                        <p>&copy; Copyright Home Garden Decor 2023 - All rights reserved. Designed by Buzz Spotlight</p>
                    </div>
                    <div className="bottom-socials">
                        <a href="https://www.instagram.com/verticaledengarden?igsh=NTlleWRlcjRzNTNq">{(FaInstagram as any)({})}</a>
                        <a href="https://www.facebook.com/share/1BxEgEucWc/">{(FaFacebookF as any)({})}</a>
                        <a href="https://www.youtube.com/@VerticalEdengarden">{(FaYoutube as any)({})}</a>
                        <button onClick={scrollToTop} className="scroll-top-btn">{(FaArrowUp as any)({})}</button>
                    </div>
                </div>
            </div>
        </footer>
    );
};

export default Footer;