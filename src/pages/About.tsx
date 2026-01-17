import React from 'react';
import './About.css';

const About: React.FC = () => {
    return (
        <div className="about-container">
            <div className="about-banner" style={{ backgroundImage: "url('/images/img_11_19_16.jpeg')" }}>
                <h1>About Us</h1>
            </div>

            <div className="about-content">
                <section className="about-story">
                    <div className="about-text">
                        <h2>Who We Are</h2>
                        <p>
                            Vertical Eden Garden is a premier landscaping and vertical gardening company dedicated to
                            bringing greenery into urban spaces. Founded with a passion for nature and design,
                            we specialize in creating sustainable, beautiful, and functional green environments.
                        </p>
                        <p>
                            Our team consists of expert horticulturists, landscape designers, and skilled craftsmen
                            who work together to turn your vision into reality. From small balconies to large corporate
                            campuses, we handle projects of all scales with the same level of clearer and detail.
                        </p>
                    </div>
                    <div className="about-image">
                        <img src="/images/img_11_18_50.jpeg" alt="Our Team at Work" />
                    </div>
                </section>

                <section className="mission-section">
                    <div className="mission-grid">
                        <div className="mission-card">
                            <span className="mission-icon">🌿</span>
                            <h3>Our Mission</h3>
                            <p>To integrate nature into everyday living spaces, promoting well-being and environmental sustainability.</p>
                        </div>
                        <div className="mission-card">
                            <span className="mission-icon">✨</span>
                            <h3>Our Vision</h3>
                            <p>To be the leading provider of innovative green solutions, transforming concrete jungles into living ecosystems.</p>
                        </div>
                        <div className="mission-card">
                            <span className="mission-icon">🤝</span>
                            <h3>Our Values</h3>
                            <p>Quality, sustainability, creativity, and customer satisfaction are at the heart of everything we do.</p>
                        </div>
                    </div>
                </section>

                <section className="cta-section">
                    <h2>Ready to Transform Your Space?</h2>
                    <p>Let's create something beautiful together. Contact us today for a consultation.</p>
                    <a href="/contact" className="cta-btn">Get in Touch</a>
                </section>
            </div>
        </div>
    );
};

export default About;