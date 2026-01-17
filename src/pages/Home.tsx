import React from 'react';
import Hero from '../components/Hero';
import ServicesList from '../components/ServicesList';
import Footer from '../components/Footer';
import Carousel from '../components/Carousel';
import './Home.css';

// Importing a few key images for the homepage
// In a real app we might import these or use public URL
// We will use public URLs assuming the move structure from previous step
const HOME_BG_IMAGE = '/images/img_20250802_wa0024.jpg'; // Main hero
const FEATURE_1 = '/images/artifical_pic_for_balcony_3.png';
const FEATURE_2 = '/images/e38256b0e0114ed0b0dad1178e26c65a.jpg';
const FEATURE_3 = '/images/153ad2cd683f484385d4a9fb38f58182.jpg';

const Home: React.FC = () => {
    return (
        <div className="home-container">
            <Hero
                title="Transform Your Space with Vertical Eden Gardens"
                subtitle="Innovative landscaping solutions for modern living."
                backgroundImage={HOME_BG_IMAGE}
            />

            <section className="intro-section">
                <div className="intro-content">
                    <h2>Bringing Nature Back to the City</h2>
                    <p>
                        At Vertical Eden Garden, we believe that green spaces are essential for a healthy and happy life.
                        Whether you have a sprawling lawn or a compact balcony, our expert team can transform it into a
                        lush, vibrant oasis.
                    </p>
                </div>
            </section>

            <section className="featured-projects">
                <h2 className="section-title">Our Featured Work</h2>
                <div style={{ maxWidth: '100%', padding: '0 20px' }}>
                    <Carousel
                        images={[
                            '/images/artifical_pic_for_balcony_5.png',
                            '/images/img_20250802_wa0024.jpg',
                            '/images/153ad2cd683f484385d4a9fb38f58182.jpg',
                            '/images/47bf50e91a524ffbb8f43741299b1879.jpg',
                            '/images/458d8dddcb20463dabaa302de0cd7700.jpg'
                        ]}
                        captions={[
                            'Elegant Balcony Design',
                            'Lush Outdoor Landscape',
                            'Vertical Garden Wall',
                            'Modern Terrace Garden',
                            'Cozy Green Corner'
                        ]}
                    />
                </div>
            </section>

            <section className="stats-section">
                <div className="stats-grid">
                    <div className="stat-item">
                        <span className="stat-number">1000+</span>
                        <span className="stat-label">Projects Completed</span>
                    </div>
                    <div className="stat-item">
                        <span className="stat-number">5+</span>
                        <span className="stat-label">Years Experience</span>
                    </div>
                    <div className="stat-item">
                        <span className="stat-number">100%</span>
                        <span className="stat-label">Client Satisfaction</span>
                    </div>
                </div>
            </section>

            {/* Reusing existing ServicesList but it might need styling updates or we rely on the Services page */}
            {/* <ServicesList />  -- Optional: hiding this to focus on the new flow, or keeping it if minimal */}
        </div>
    );
};

export default Home;