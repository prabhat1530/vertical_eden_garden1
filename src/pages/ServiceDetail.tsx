import React, { useEffect } from 'react';
import { useParams, Link } from 'react-router-dom';
import servicesData from '../data/services.json';
import './ServiceDetail.css';

// Static imports from the user-specified directory
import artificialGrassImg from '../images/images/service_image/Gemini_Generated_Image_m6nvfzm6nvfzm6nv.png';
import artificialGreenWallImg from '../images/images/service_image/Gemini_Generated_Image_m6nvfzm6nvfzm6nv (1).png';
import terraceGardenImg from '../images/images/service_image/Gemini_Generated_Image_m6nvfzm6nvfzm6nv (2).png';
import creepersShrubsImg from '../images/images/service_image/Gemini_Generated_Image_m6nvfzm6nvfzm6nv (3).png';
import naturalVerticalGardenImg from '../images/images/service_image/Gemini_Generated_Image_m6nvfzm6nvfzm6nv (4).png';
import plantsPlantersImg from '../images/images/service_image/Gemini_Generated_Image_m6nvfzm6nvfzm6nv (5).png';

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
            <div className="service-hero" style={{ backgroundImage: `url('${heroImage}')` }}>
                <div className="overlay">
                    <h1>{serviceCategory.category}</h1>
                    <p className="tagline">{serviceCategory.tagline}</p>
                </div>
            </div>

            <div className="service-content-wrapper">
                <div className="main-content">
                    <h2>About This Service</h2>
                    <p className="long-description">{serviceCategory.content}</p>

                    <h3>Why Choose This?</h3>
                    <ul className="features-list">
                        {serviceCategory.features?.map((feature: string, index: number) => (
                            <li key={index}>{feature}</li>
                        ))}
                    </ul>
                </div>

                <div className="sidebar">
                    <div className="use-cases-card">
                        <h3>Best Use Cases</h3>
                        <ul>
                            {serviceCategory.useCases?.map((useCase: string, index: number) => (
                                <li key={index}>{useCase}</li>
                            ))}
                        </ul>
                    </div>
                    <div className="cta-card">
                        <h3>Interested?</h3>
                        <p>Get a quote for your {serviceCategory.category} today.</p>
                        <Link to="/contact" className="cta-btn">Contact Us</Link>
                    </div>
                </div>
            </div>
        </div>
    );
};

export default ServiceDetail;
