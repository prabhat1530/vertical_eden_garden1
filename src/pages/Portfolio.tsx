import React from 'react';
import './Portfolio.css';
import imageList from '../data/images.json';

const Portfolio: React.FC = () => {
    return (
        <div className="portfolio-container">
            <div className="portfolio-header">
                <h1>Our Portfolio</h1>
                <p>Explore our collection of vertical garden installations and designs.</p>
            </div>

            <div className="portfolio-grid">
                {imageList.map((imageName, index) => (
                    <div key={index} className="portfolio-item">
                        <img
                            src={`/images/${imageName}`}
                            alt={`Portfolio Project ${index}`}
                            className="portfolio-image"
                            loading="lazy"
                        />
                    </div>
                ))}
            </div>
        </div>
    );
};

export default Portfolio;