import React, { useEffect, useRef } from 'react';
import './About.css';
import { FaLeaf, FaLightbulb, FaTools, FaQuoteLeft } from 'react-icons/fa';
import heroBg from '../images/images/about-hero-premium.webp';
import missionImg from '../images/images/about-mission-authentic.webp';
import teamImg from '../images/images/about-team-authentic.webp';

const About: React.FC = () => {
    const revealRefs = useRef<(HTMLDivElement | null)[]>([]);

    const addToRefs = (el: HTMLDivElement | null) => {
        if (el && !revealRefs.current.includes(el)) {
            revealRefs.current.push(el);
        }
    };

    useEffect(() => {
        const observer = new IntersectionObserver(
            (entries) => {
                entries.forEach((entry) => {
                    if (entry.isIntersecting) {
                        entry.target.classList.add('visible');
                    }
                });
            },
            { threshold: 0.1 }
        );

        revealRefs.current.forEach((ref) => observer.observe(ref!));

        return () => observer.disconnect();
    }, []);

    return (
        <div className="about-page">
            {/* Split Hero Section */}
            <section className="about-hero-split">
                <div className="hero-split-content" ref={addToRefs}>
                    <span className="hero-subtitle">Est. 2022</span>
                    <h1>Redefining <br />Urban Nature</h1>
                    <p>We transform concrete spaces into living, breathing ecosystems. Experience the fusion of luxury design and nature.</p>
                    <div className="hero-stats-row">
                        <div className="hero-stat">
                            <span className="stat-num">100+</span>
                            <span className="stat-label">Projects</span>
                        </div>
                        <div className="hero-stat">
                            <span className="stat-num">98%</span>
                            <span className="stat-label">Satisfaction</span>
                        </div>
                    </div>
                </div>
                <div className="hero-split-image">
                    <img src={heroBg} alt="Luxury Vertical Garden" className="parallax-img" />
                    <div className="hero-overlay-gradient"></div>
                </div>
            </section>

            {/* Mission Section (Glass Card) */}
            <section className="mission-section">
                <div className="mission-bg-wrapper">
                    <img src={missionImg} alt="Our Mission" className="mission-bg" />
                </div>
                <div className="mission-glass-card" ref={addToRefs}>
                    <FaQuoteLeft className="quote-icon" />
                    <h2>Our Philosophy</h2>
                    <p className="mission-text">
                        "We believe that every wall is a canvas waiting for life. Our mission isn't just to plant gardens, but to curate emotions—creating sanctuaries where nature and architecture dance in perfect harmony."
                    </p>
                    <div className="mission-signature">
                        <span>The Vertical Eden Team</span>
                    </div>
                </div>
            </section>

            {/* Team & Story Section */}
            <section className="story-section">
                <div className="story-container">
                    <div className="story-content" ref={addToRefs}>
                        <span className="section-tag">Our Story</span>
                        <h2>More Than Just Gardeners</h2>
                        <p>
                            Vertical Eden Garden isn't just a company; it's a collective of landscape architects, botanists, and visionaries.
                            Started in New Delhi with a simple seed of an idea, we've grown into a premier design firm.
                        </p>
                        <p>
                            We specialize in complex vertical installations, sustainable terrace makeovers, and biophilic interior design.
                            Every leaf is placed with purpose, every structure built to last.
                        </p>

                        <div className="values-grid">
                            <div className="value-item">
                                <FaLightbulb className="value-icon" />
                                <h4>Innovation</h4>
                            </div>
                            <div className="value-item">
                                <FaLeaf className="value-icon" />
                                <h4>Sustainability</h4>
                            </div>
                            <div className="value-item">
                                <FaTools className="value-icon" />
                                <h4>Craftsmanship</h4>
                            </div>
                        </div>
                    </div>
                    <div className="story-image-wrapper" ref={addToRefs}>
                        <img src={teamImg} alt="Our Team" className="story-img" />
                    </div>
                </div>
            </section>
        </div>
    );
};

export default About;