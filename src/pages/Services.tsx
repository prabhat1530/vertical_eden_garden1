import React, { useEffect } from 'react';
import { useLocation, Link } from 'react-router-dom';
import './Services.css';
import servicesData from '../data/services.json';

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
                <h1>Our Services</h1>
                <p>Comprehensive landscaping and vertical gardening solutions for your space.</p>
            </div>

            <div className="services-grid-main">
                {servicesData.map((service, index) => {
                    const imageSrc = imageMap[service.slug] || 'https://placehold.co/800x600?text=Image+Not+Found';

                    return (
                        <div key={index} className="service-card-main" id={service.slug}>
                            <div className="service-img-container">
                                <img src={imageSrc} alt={service.category} />
                            </div>
                            <div className="service-info">
                                <h2>{service.category}</h2>
                                <p className="service-tagline">{service.tagline}</p>
                                <p className="service-desc">{service.description}</p>
                                <Link to={`/services/${service.slug}`} className="read-more-btn">Read More</Link>
                            </div>
                        </div>
                    );
                })}
            </div>
        </div>
    );
};


export default Services;