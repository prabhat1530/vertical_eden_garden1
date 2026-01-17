import React from 'react';
import servicesData from '../data/services.json';
import { Link } from 'react-router-dom';
import './ServicesList.css';

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

const ServicesList: React.FC = () => {
    return (
        <section className="services-list-section">
            <div className="container">
                <h2 className="section-title">Our Premium Services</h2>
                <div className="services-grid">
                    {servicesData.map((service, index) => {
                        const imageSrc = imageMap[service.slug] || 'https://placehold.co/800x600?text=Image+Not+Found';

                        return (
                            <div key={index} className="service-card">
                                <div className="service-image-wrapper">
                                    <img src={imageSrc} alt={service.category} className="service-image" />
                                </div>
                                <div className="service-content">
                                    <h3>{service.category}</h3>
                                    <p className="service-tagline">{service.tagline}</p>
                                    <p className="service-description">{service.description}</p>
                                    <Link to={`/services/${service.slug}`} className="read-more-btn">
                                        Learn More
                                    </Link>
                                </div>
                            </div>
                        );
                    })}
                </div>
            </div>
        </section>
    );
};

export default ServicesList;