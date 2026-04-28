import React, { useEffect } from 'react';
import { useLocation, Link } from 'react-router-dom';
import './Services.css';
import servicesData from '../data/services.json';

// Static imports from the user-specified directory
// Real images
import artificialGrassImg from '../images/real_service_images/artificial-grass.jpeg';
import artificialGreenWallImg from '../images/real_service_images/artificial-green-wall.jpeg';
import terraceGardenImg from '../images/real_service_images/terrace-garden.jpeg';
import creepersShrubsImg from '../images/real_service_images/creepers-shrubs.jpeg';
import naturalVerticalGardenImg from '../images/real_service_images/natural-vertical-garden.jpeg';
import plantsPlantersImg from '../images/real_service_images/plants-planters.jpeg';

// Map slugs or categories to imported images
const imageMap: { [key: string]: string } = {
    'artificial-grass': artificialGrassImg,
    'artificial-green-wall': artificialGreenWallImg,
    'terrace-garden': terraceGardenImg,
    'creepers-and-shrubs': creepersShrubsImg,
    'natural-vertical-garden': naturalVerticalGardenImg,
    'plants-and-planters': plantsPlantersImg
};

const Services: React.FC = () => {
    const location = useLocation();

    useEffect(() => {
        if (location.hash) {
            const element = document.getElementById(location.hash.substring(1));
            if (element) {
                // Determine header height to offset scroll
                const headerOffset = 100; // Adjust based on your actual header height
                const elementPosition = element.getBoundingClientRect().top;
                const offsetPosition = elementPosition + window.pageYOffset - headerOffset;

                window.scrollTo({
                    top: offsetPosition,
                    behavior: "smooth"
                });
            }
        }
    }, [location]);

    return (
        <div className="services-container">
            <div className="services-header">
                <span className="services-subtitle">What We Do</span>
                <h1>Our Expertise</h1>
                <p>Comprehensive landscaping and vertical gardening solutions tailored for your space.</p>
            </div>

            <div className="services-grid-main">
                {servicesData.map((service, index) => {
                    const imageSrc = imageMap[service.slug] || 'https://placehold.co/800x600?text=Image+Not+Found';

                    return (
                        <div key={index} className="service-card-main" id={service.slug}>
                            <div className="service-img-wrapper">
                                <img src={imageSrc} alt={service.category} loading="lazy" />
                                <div className="service-overlay-gradient"></div>
                            </div>
                            <div className="service-content-overlay">
                                <div className="service-icon-wrapper">
                                    {/* Placeholder for icon, or just styling */}
                                    <span className="service-index">0{index + 1}</span>
                                </div>
                                <h2>{service.category}</h2>
                                <p className="service-tagline">{service.tagline}</p>
                                <div className="service-hidden-content">
                                    <p className="service-desc">{service.description}</p>
                                    <Link to={`/services/${service.slug}`} className="read-more-btn">
                                        Explore Service
                                    </Link>
                                </div>
                            </div>
                        </div>
                    );
                })}
            </div>
        </div>
    );
};


export default Services;