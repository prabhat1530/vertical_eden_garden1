import React, { useState } from 'react';
import './Contact.css';
import { FaPhoneAlt, FaEnvelope, FaMapMarkerAlt, FaWhatsapp } from 'react-icons/fa';
import contactHero from '../images/contact-hero-authentic.webp';
import contactFeature from '../images/contact-feature-authentic.webp';

const Contact: React.FC = () => {
    const [formData, setFormData] = useState({
        name: '',
        phone: '',
        email: '',
        service: '',
        message: ''
    });

    const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) => {
        setFormData({ ...formData, [e.target.name]: e.target.value });
    };

    return (
        <div className="contact-page">
            <div className="contact-hero" style={{ backgroundImage: `url(${contactHero})` }}>
                <div className="hero-overlay"></div>
                <div className="contact-hero-content">
                    <h1>Contact Us</h1>
                    <p>Get in touch with us for your vertical garden needs</p>
                </div>
            </div>

            <div className="contact-container">
                <div className="contact-info">
                    <h2>Get In Touch</h2>
                    <p>We are here to answer any questions you may have about our services. Reach out to us and we'll respond as soon as we can.</p>

                    <div className="info-feature-image">
                        <img src={contactFeature} alt="Vertical Garden Detail" loading="lazy" />
                    </div>

                    <div className="contact-details-grid">
                        <div className="info-item">
                            <div className="icon">{(FaPhoneAlt as any)({})}</div>
                            <div className="details">
                                <h3>Phone</h3>
                                <p><a href="tel:+917827949218">+91 7827949218</a></p>
                            </div>
                        </div>

                        <div className="info-item">
                            <div className="icon">{(FaEnvelope as any)({})}</div>
                            <div className="details">
                                <h3>Email</h3>
                                <p><a href="mailto:verticaledengarden@gmail.com">verticaledengarden@gmail.com</a></p>
                            </div>
                        </div>

                        <div className="info-item">
                            <div className="icon">{(FaMapMarkerAlt as any)({})}</div>
                            <div className="details">
                                <h3>Address</h3>
                                <p>Janakpuri District Center, New Delhi, India</p>
                            </div>
                        </div>

                        <div className="info-item">
                            <div className="icon">{(FaWhatsapp as any)({})}</div>
                            <div className="details">
                                <h3>WhatsApp</h3>
                                <p><a href="https://wa.me/917827949218" target="_blank" rel="noopener noreferrer">Chat on WhatsApp</a></p>
                            </div>
                        </div>
                    </div>
                </div>

                <div className="contact-form-wrapper">
                    <h2>Get A Free Quote</h2>
                    <form action="https://formsubmit.co/verticaledengarden@gmail.com" method="POST">
                        <input type="hidden" name="_subject" value="New Quote Request from Website!" />
                        <input type="hidden" name="_captcha" value="false" />
                        <input type="hidden" name="_template" value="table" />

                        <div className="form-group">
                            <label>Name</label>
                            <input type="text" name="name" required placeholder="Your Name" value={formData.name} onChange={handleChange} />
                        </div>

                        <div className="form-group">
                            <label>Phone Number</label>
                            <input type="tel" name="phone" required placeholder="Your Phone Number" value={formData.phone} onChange={handleChange} />
                        </div>

                        <div className="form-group">
                            <label>Email (Optional)</label>
                            <input type="email" name="email" placeholder="Your Email" value={formData.email} onChange={handleChange} />
                        </div>

                        <div className="form-group">
                            <label>Service Interested In</label>
                            <select name="service" value={formData.service} onChange={handleChange}>
                                <option value="">Select a Service</option>
                                <option value="Vertical Garden">Vertical Garden Installation</option>
                                <option value="Artificial Grass">Artificial Grass</option>
                                <option value="Terrace Garden">Terrace Garden</option>
                                <option value="Maintenance">Maintenance</option>
                                <option value="Other">Other</option>
                            </select>
                        </div>

                        <div className="form-group">
                            <label>Message / Requirements</label>
                            <textarea name="message" rows={4} placeholder="Tell us about your requirements..." value={formData.message} onChange={handleChange}></textarea>
                        </div>

                        <button type="submit" className="submit-btn">Send Message</button>
                    </form>
                </div>
            </div>
        </div>
    );
};

export default Contact;