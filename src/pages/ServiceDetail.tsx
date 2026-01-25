import React, { useEffect } from 'react';
import { useParams, Link } from 'react-router-dom';
import servicesData from '../data/services.json';
import './ServiceDetail.css';

// Static imports from the user-specified directory
import artificialGrassImg from '../images/images/service_image/Gemini_Generated_Image_m6nvfzm6nvfzm6nv.webp';
import artificialGreenWallImg from '../images/images/service_image/Gemini_Generated_Image_m6nvfzm6nvfzm6nv (1).webp';
import terraceGardenImg from '../images/images/service_image/Gemini_Generated_Image_m6nvfzm6nvfzm6nv (2).webp';
import creepersShrubsImg from '../images/images/service_image/Gemini_Generated_Image_m6nvfzm6nvfzm6nv (3).webp';
import naturalVerticalGardenImg from '../images/images/service_image/Gemini_Generated_Image_m6nvfzm6nvfzm6nv (4).webp';
import plantsPlantersImg from '../images/images/service_image/Gemini_Generated_Image_m6nvfzm6nvfzm6nv (5).webp';

// Map slugs or categories to imported images
const imageMap: { [key: string]: string } = {
    'artificial-grass': artificialGrassImg,
    'artificial-green-wall': artificialGreenWallImg,
    'terrace-garden': terraceGardenImg,
    'creepers-and-shrubs': creepersShrubsImg,
    'natural-vertical-garden': naturalVerticalGardenImg,
    'plants-and-planters': plantsPlantersImg
};

const ServiceDetail: React.FC = () => {
    const { serviceSlug } = useParams<{ serviceSlug: string }>();

    const serviceCategory = servicesData.find(service => service.slug === serviceSlug);

    useEffect(() => {
        window.scrollTo(0, 0);
    }, [serviceSlug]);

    if (!serviceCategory) {
        return (
            <div className="services-container" style={{ textAlign: 'center', padding: '100px 20px' }}>
                <h2>Service Not Found</h2>
                <p>The service you are looking for does not exist.</p>
                <Link to="/services" className="btn">Back to All Services</Link>
            </div>
        );
    }

    const heroImage = imageMap[serviceCategory.slug] || 'https://placehold.co/1920x600?text=Service+Image';

    return (
        <div className="service-detail-container">
            <div className="service-detail-hero" style={{ backgroundImage: `url('${heroImage}')` }}>
                <div className="detail-hero-overlay"></div>
                <div className="detail-hero-content">
                    <h1>{serviceCategory.category}</h1>
                    <p className="detail-tagline">{serviceCategory.tagline}</p>
                </div>
            </div>

            <div className="service-content-wrapper">
                <div className="main-content">
                    <section className="content-section">
                        <h2>Overview</h2>
                        <div className="divider-line"></div>
                        <p className="long-description">{serviceCategory.content}</p>
                    </section>

                    <section className="content-section">
                        <h2>Why Choose This Service?</h2>
                        <div className="features-grid-detail">
                            {serviceCategory.features?.map((feature: string, index: number) => (
                                <div key={index} className="feature-item-detail">
                                    <span className="check-icon">✓</span>
                                    <p>{feature}</p>
                                </div>
                            ))}
                        </div>
                    </section>
                </div>

                <aside className="sidebar">
                    <div className="sidebar-sticky">
                        <div className="use-cases-card">
                            <h3>Best Applications</h3>
                            <ul>
                                {serviceCategory.useCases?.map((useCase: string, index: number) => (
                                    <li key={index}>{useCase}</li>
                                ))}
                            </ul>
                        </div>
                        <div className="cta-card">
                            <h3>Ready to Transform?</h3>
                            <p>Get a personalized quote for your {serviceCategory.category}.</p>
                            <Link to="/contact" className="cta-btn">Request Quote</Link>
                        </div>
                    </div>
                </aside>
            </div>
        </div>
    );
};

export default ServiceDetail;
