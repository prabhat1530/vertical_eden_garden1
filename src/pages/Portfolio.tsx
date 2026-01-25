import React, { useState } from 'react';
import './Portfolio.css';
import imageList from '../data/images.json';
import { FaTimes, FaSearchPlus } from 'react-icons/fa';

const Portfolio: React.FC = () => {
    const [selectedImage, setSelectedImage] = useState<string | null>(null);

    const openLightbox = (image: string) => {
        setSelectedImage(image);
        document.body.style.overflow = 'hidden'; // Prevent scrolling
    };

    const closeLightbox = () => {
        setSelectedImage(null);
        document.body.style.overflow = 'auto';
    };

    return (
        <div className="portfolio-container">
            <div className="portfolio-header">
                <span className="portfolio-subtitle">Our Masterpieces</span>
                <h1>Green Gallery</h1>
                <p>Immerse yourself in our collection of bespoke vertical gardens and sustainable landscapes.</p>
            </div>

            <div className="gallery-masonry">
                {imageList.map((imageName, index) => (
                    <div key={index} className="gallery-item" onClick={() => openLightbox(imageName)}>
                        <div className="gallery-img-wrapper">
                            <img
                                src={`/images/${imageName}`}
                                alt={`Vertical Garden Project ${index + 1}`}
                                className="gallery-img"
                                loading="lazy"
                            />
                            <div className="gallery-overlay">
                                <FaSearchPlus className="overlay-icon" />
                                <span>View Project</span>
                            </div>
                        </div>
                    </div>
                ))}
            </div>

            {/* Lightbox Modal */}
            {selectedImage && (
                <div className="lightbox-overlay" onClick={closeLightbox}>
                    <div className="lightbox-content" onClick={(e) => e.stopPropagation()}>
                        <button className="lightbox-close" onClick={closeLightbox}>
                            <FaTimes />
                        </button>
                        <img src={`/images/${selectedImage}`} alt="Enlarged View" className="lightbox-img" />
                    </div>
                </div>
            )}
        </div>
    );
};

export default Portfolio;